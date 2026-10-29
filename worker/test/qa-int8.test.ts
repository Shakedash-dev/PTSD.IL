import { describe, it, expect } from "vitest";
import { encodeShard, decodeShard, rowVectors, quantizeQuery, scan, ranked, unit, type GroupBest, type RowVectors } from "../src/lib/qaShard";

// Does the int8 shard pick the same playbooks as the float32 vectors it was
// quantized from? A realistic-sized set (2,500 vectors of 1024 dims, like the
// real 2,350 texts) built to be hard: paraphrase clusters per row, groups whose
// questions are near-duplicates of another group's, and queries at every
// distance from a cluster, so many land near the thresholds and many have two
// groups within a hair of each other.

const DIMS = 1024;
const TH = { strong: 0.8, weak: 0.72 };

// Deterministic PRNG (mulberry32) and Gaussian noise.
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(1234567);
const gauss = () => Math.sqrt(-2 * Math.log(rand() || 1e-12)) * Math.cos(2 * Math.PI * rand());
const randVec = () => unit(Array.from({ length: DIMS }, gauss));
// `v` moved towards a random direction so that cos(v, out) is about `c`.
function near(v: Float32Array, c: number): Float32Array {
  const r = randVec();
  const s = Math.sqrt(Math.max(0, 1 - c * c));
  return unit(Array.from(v, (x, i) => c * x + s * r[i]));
}
const dot = (a: ArrayLike<number>, b: ArrayLike<number>) => {
  let d = 0;
  for (let i = 0; i < a.length; i++) d += a[i] * b[i];
  return d;
};

type Row = { id: string; g: string; crisis: boolean; vecs: Float32Array[] };

// 180 groups; every 4th group's center is a near-duplicate (cos 0.9-0.97) of the
// previous group's. Each group has rows of ~14 texts at cos 0.75-0.95 from its
// center (paraphrases), 1-2 rows per group, ~2,500 vectors in all.
function buildSet(): { rows: Row[]; centers: Float32Array[] } {
  const rows: Row[] = [];
  const centers: Float32Array[] = [];
  let total = 0;
  for (let g = 0; total < 2500; g++) {
    const center = g % 4 === 3 ? near(centers[g - 1], 0.9 + 0.07 * rand()) : randVec();
    centers.push(center);
    for (let r = 0; r < (g % 3 === 0 ? 2 : 1) && total < 2500; r++) {
      const n = Math.min(10 + Math.floor(rand() * 6), 2500 - total);
      const vecs = Array.from({ length: n }, () => near(center, 0.75 + 0.2 * rand()));
      // A near-duplicate paraphrase pair inside the row.
      if (n > 2) vecs[1] = near(vecs[0], 0.995);
      rows.push({ id: `r${g}-${r}`, g: `g${g}`, crisis: g % 25 === 0, vecs });
      total += n;
    }
  }
  return { rows, centers };
}

function floatBest(rows: Row[], q: Float32Array, crisisOnly = false): GroupBest[] {
  const best = new Map<string, GroupBest>();
  for (const r of rows) {
    if (crisisOnly && !r.crisis) continue;
    let top = -Infinity;
    for (const v of r.vecs) top = Math.max(top, dot(q, v));
    const cur = best.get(r.g);
    if (!cur || top > cur.score) best.set(r.g, { groupId: r.g, score: top, langId: "he", crisis: r.crisis });
  }
  return ranked(best);
}

const strength = (s: number) => (s >= TH.strong ? "strong" : s >= TH.weak ? "weak" : "none");

describe("int8 shard vs float32: same playbooks", () => {
  const { rows, centers } = buildSet();
  // The rows go through the real encoding: quantized, encoded, decoded.
  const shard = decodeShard(encodeShard({ v: 2, ver: "t" }, DIMS, rows.map((r): RowVectors =>
    rowVectors({ id: r.id, g: r.g, ...(r.crisis ? { c: 1 as const } : {}), s: "x", n: r.vecs.length }, r.vecs, DIMS))))!;
  const shards = [{ lang: "he", shard }];
  // Queries at every distance from a group's center (0.55-0.98: none, weak,
  // strong, and around both thresholds), in raw (unnormalized) form like the
  // embedding the chat gets, plus pure noise.
  const queries = Array.from({ length: 600 }, (_, i) => {
    const v = i % 10 === 9 ? randVec() : near(centers[Math.floor(rand() * centers.length)], 0.55 + 0.43 * rand());
    return Array.from(v, (x) => x * (0.5 + rand()));
  });

  it("is a realistic size", () => {
    expect(shard.count).toBeGreaterThanOrEqual(2500);
    expect(shard.bytes).toBeLessThan(2.7 * 1024 * 1024);
  });

  it("picks the same best group for every query that can get a playbook, scores within 0.01, and the same strength off the thresholds", () => {
    let maxDiff = 0;
    let closeCalls = 0;
    let nearThreshold = 0;
    let flips = 0;
    let used = 0;
    for (const raw of queries) {
      const f = floatBest(rows, unit(raw));
      const m = new Map<string, GroupBest>();
      scan(shards, quantizeQuery(raw), m);
      const q = ranked(m);
      // Every query that can get a playbook (and a margin below): the same group.
      // Below that (noise, scores ~0.1), two groups can be a float tie (gap
      // ~1e-6) that rounding may order either way; nothing is used there.
      if (f[0].score >= TH.weak - 0.1) expect(q[0].groupId).toBe(f[0].groupId);
      else if (q[0].groupId !== f[0].groupId) {
        flips++;
        expect(f[0].score - f.find((g) => g.groupId === q[0].groupId)!.score).toBeLessThan(0.002);
      }
      if (f[0].score >= TH.weak - 0.1) used++;
      if (f[1] && f[0].score - f[1].score < 0.01) closeCalls++;
      for (const g of f) maxDiff = Math.max(maxDiff, Math.abs(m.get(g.groupId)!.score - g.score));
      const s = f[0].score;
      if (Math.abs(s - TH.strong) > 0.005 && Math.abs(s - TH.weak) > 0.005) expect(strength(q[0].score)).toBe(strength(s));
      else nearThreshold++;
    }
    expect(maxDiff).toBeLessThan(0.01);
    console.log(`int8 vs float32: ${queries.length} queries x ${shard.count} vectors, max score diff ${maxDiff.toFixed(5)}, ${closeCalls} with the top two groups < 0.01 apart, ${nearThreshold} within 0.005 of a threshold, ${used} at >= ${TH.weak - 0.1} (all the same group), ${flips} float ties reordered below that`);
    expect(used).toBeGreaterThan(300);
    expect(closeCalls).toBeGreaterThan(0); // the set really has near-duplicate groups
  });

  it("the crisis scan picks the same best crisis group at any score", () => {
    for (const raw of queries.slice(0, 200)) {
      const f = floatBest(rows, unit(raw), true);
      const m = new Map<string, GroupBest>();
      scan(shards, quantizeQuery(raw), m, true);
      expect(ranked(m)[0].groupId).toBe(f[0].groupId);
    }
  });
});
