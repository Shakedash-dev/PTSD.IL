import { describe, it, expect, vi, afterEach } from "vitest";
import {
  findPlaybooks, loadPlaybookStore, parseQaRow, retrievalText, reindexQaRow, removeQaRow, decode, qaRowKey, shardKey, thresholds,
  QA_MAX_TEXTS, SHARD_RETRIES, type QaRecord,
} from "../src/lib/qa";
import { decodeShard, shardRows } from "../src/lib/qaShard";
import { legacyFind, loadQaIndex, QA_INDEX_KEY } from "../src/lib/qaLegacy";
import { fakeKV } from "./kv";
import { fakeVectorize, cosine } from "./vectorize";
import { qaItem as row, fakeAI, seededEnv, emptyShards, legacyBlob } from "./qaEnv";

afterEach(() => vi.restoreAllMocks());
// Deterministic fake embeddings: each known text maps to a fixed 3-dim vector.
const VEC: Record<string, number[]> = {
  "how do i get treatment": [1, 0, 0],
  "where can i get therapy": [0.95, 0.05, 0],
  "איך מקבלים טיפול": [1, 0, 0],
  "i want to die": [0, 0, 1],
  "אני רוצה למות": [0, 0, 1],
  "what are my rights": [0, 1, 0],
  "Ref answer": [0.2, 0.4, 0.6],
  "ערן 1201": [0.6, 0.1, 0.2],
};

const ROWS = [
  row("t-he", "g-treat", "he", { question: "איך מקבלים טיפול", paraphrases: [], guidance: "הנחיה בעברית", crisis: false }),
  row("t-en", "g-treat", "en", { question: "how do i get treatment", paraphrases: ["where can i get therapy"], guidance: "English guidance", answer: "Ref answer", crisis: false }),
  row("c-he", "g-crisis", "he", { question: "אני רוצה למות", paraphrases: [], guidance: "קודם כל ער\"ן 1201", crisis: true }),
  row("r-he", "g-rights", "he", { question: "what are my rights", paraphrases: [], guidance: "rights guidance", crisis: false }),
];

const TH = { strong: 0.8, weak: 0.72 };
async function find(env: any, qv: number[], lang: string, crisis = false, more: { prevVec?: number[]; crisisVec?: number[] } = {}, th = TH) {
  const store = await loadPlaybookStore(env, lang);
  return findPlaybooks(env, store!, { qv, lang, crisis, ...more }, th);
}
const shardOf = (env: any, lang: string) => decodeShard(env.RL.store.get(shardKey(env, lang)) ?? null);
const rowIds = (env: any, lang: string) => shardOf(env, lang)!.header.rows.map((r) => r.id);

describe("parseQaRow", () => {
  it("dedupes question and paraphrases and requires guidance", () => {
    const p = parseQaRow(row("x", "g", "en", { question: "q", paraphrases: ["q", "p", " "], guidance: "g" }));
    expect(p?.texts).toEqual(["q", "p"]);
    expect(parseQaRow(row("y", "g", "en", { question: "q", paraphrases: [] }))).toBeNull();
    expect(parseQaRow({ ...ROWS[0], content: "{bad" })).toBeNull();
  });

  it("embeds at most QA_MAX_TEXTS texts per row", () => {
    const p = parseQaRow(row("x", "g", "en", { question: "q", paraphrases: Array.from({ length: 50 }, (_, i) => `p${i}`), guidance: "g" }));
    expect(p?.texts).toHaveLength(QA_MAX_TEXTS);
  });

  it("retrieval text takes at most the first 3 non-empty guidance lines", () => {
    const r = { rowId: "x", groupId: "g", langId: "he", question: "Q", guidance: "1. a\n\n2. b\n3. c\n4. d", crisis: false };
    expect(retrievalText(r)).toBe("Q\n1. a\n2. b\n3. c");
    expect(retrievalText({ ...r, answer: "A" })).toBe("A");
  });
});

describe("item reindex of a Q&A row", () => {
  it("writes the row's match vectors into its language's shard and one KV row with the retrieval vector", async () => {
    const env = await seededEnv(VEC, ROWS);
    expect(rowIds(env, "he")).toEqual(["t-he", "c-he", "r-he"]);
    expect(rowIds(env, "en")).toEqual(["t-en"]);
    const en = shardOf(env, "en")!;
    expect(en.header.rows[0]).toMatchObject({ id: "t-en", g: "g-treat", n: 2 });
    expect(en.header.rows[0].c).toBeUndefined();
    expect(shardOf(env, "he")!.header.rows[1].c).toBe(1);
    expect(en.dims).toBe(3);
    const rec = JSON.parse(env.RL.store.get("qa:row:g-treat:en")) as QaRecord;
    expect(rec).toMatchObject({ v: 3, rowId: "t-en", guidance: "English guidance", answer: "Ref answer", crisis: false });
    expect(cosine(Array.from(decode(rec.guide)), VEC["Ref answer"])).toBeGreaterThan(0.999);
    expect(env.RL.meta.get("qa:row:g-treat:en")).toEqual({ rowId: "t-en", h: expect.any(String) });
    expect(env.VECTORIZE.store.size).toBe(0); // nothing in Vectorize
  });

  it("touches only that row: 1 list, 1 embed, 1 KV row write, its shard read + written + read back", async () => {
    const env = await seededEnv(VEC, ROWS);
    const before = new Map([...env.RL.store].map(([k, v]: [string, any]) => [k, typeof v === "string" ? v : new Uint8Array(v).join()]));
    const ops: string[] = [];
    const rl = env.RL;
    env.RL = {
      get: (k: string, o?: any) => { ops.push(`get ${k}`); return rl.get(k, o); },
      put: (k: string, v: any, o?: any) => { ops.push(`put ${k}`); return rl.put(k, v, o); },
      delete: (k: string) => { ops.push(`delete ${k}`); return rl.delete(k); },
      list: (o: any) => { ops.push(`list ${o.prefix}`); return rl.list(o); },
    };

    const edited = row("t-he", "g-treat", "he", { question: "איך מקבלים טיפול", paraphrases: ["where can i get therapy"], guidance: "חדש", crisis: false });
    expect(await reindexQaRow(env, edited)).toMatchObject({ qa: 1 });

    expect(ops.sort()).toEqual(["get qa:vec:v2:he", "get qa:vec:v2:he", "list qa:row:", "put qa:row:g-treat:he", "put qa:vec:v2:he"]);
    expect(env.AI.run).toHaveBeenCalledTimes(1);
    expect(env.AI.run.mock.calls[0][1].text).toEqual(["איך מקבלים טיפול", "where can i get therapy", "איך מקבלים טיפול\nחדש"]);
    expect(env.VECTORIZE.calls).toEqual([]);
    env.RL = rl;
    // The row is replaced in place of its old entries; the other rows' vectors are byte-identical.
    const he = shardOf(env, "he")!;
    expect(he.header.rows.map((r) => [r.id, r.n])).toEqual([["c-he", 1], ["r-he", 1], ["t-he", 2]]);
    const old = shardRows(decodeShard(new Uint8Array(before.get("qa:vec:v2:he")!.split(",").map(Number)).buffer)!);
    for (const r of shardRows(he).filter((x) => x.row.id !== "t-he")) {
      expect(Array.from(r.q)).toEqual(Array.from(old.find((o) => o.row.id === r.row.id)!.q));
    }
    for (const [k, v] of before) if (k !== "qa:vec:v2:he" && k !== "qa:row:g-treat:he") {
      const now = env.RL.store.get(k);
      expect(typeof now === "string" ? now : new Uint8Array(now).join()).toBe(v);
    }
  });

  it("a row that stops being crisis loses its flag; a group change moves its KV row", async () => {
    const env = await seededEnv(VEC, ROWS);
    await reindexQaRow(env, row("c-he", "g-other", "he", { question: "אני רוצה למות", paraphrases: [], guidance: "g", crisis: false }));
    expect(shardOf(env, "he")!.header.rows.some((r) => r.c)).toBe(false);
    expect(env.RL.store.has("qa:row:g-crisis:he")).toBe(false);
    expect(JSON.parse(env.RL.store.get("qa:row:g-other:he")).rowId).toBe("c-he");
  });

  it("a language change moves the row out of its old shard", async () => {
    const env = await seededEnv(VEC, ROWS);
    await reindexQaRow(env, row("r-he", "g-rights", "fr", { question: "what are my rights", guidance: "droits", crisis: false }));
    expect(rowIds(env, "he")).not.toContain("r-he");
    expect(rowIds(env, "fr")).toEqual(["r-he"]);
    expect(env.RL.store.has("qa:row:g-rights:he")).toBe(false);
    expect(env.RL.store.has("qa:row:g-rights:fr")).toBe(true);
  });

  it("removing a row drops only its entries and its KV row; a non-QA id is a no-op", async () => {
    const env = await seededEnv(VEC, ROWS);
    expect(await removeQaRow(env, "c-he")).toBe(true);
    expect(rowIds(env, "he")).toEqual(["t-he", "r-he"]);
    expect(env.RL.store.has("qa:row:g-crisis:he")).toBe(false);
    expect(env.RL.store.has("qa:row:g-treat:en")).toBe(true);
    const puts = vi.spyOn(env.RL, "put");
    expect(await removeQaRow(env, "nope")).toBe(false);
    expect(puts).not.toHaveBeenCalled();
  });

  it("does not delete a KV row another row of the same group and language now owns", async () => {
    const env = await seededEnv(VEC, ROWS);
    await reindexQaRow(env, row("t-en-2", "g-treat", "en", { question: "where can i get therapy", guidance: "dup", crisis: false }));
    expect(await removeQaRow(env, "t-en")).toBe(true);
    expect(JSON.parse(env.RL.store.get("qa:row:g-treat:en")).rowId).toBe("t-en-2");
    expect(rowIds(env, "en")).toEqual(["t-en-2"]);
  });

  it("an unparseable row is removed", async () => {
    const env = await seededEnv(VEC, ROWS);
    expect(await reindexQaRow(env, row("r-he", "g-rights", "he", { question: "what are my rights" }))).toEqual({ qa: 0 });
    expect(rowIds(env, "he")).not.toContain("r-he");
    expect(env.RL.store.has("qa:row:g-rights:he")).toBe(false);
  });

  it("staging keeps its keys under KV_PREFIX", async () => {
    const env = await seededEnv(VEC, ROWS.slice(0, 1), { KV_PREFIX: "staging:" });
    expect(qaRowKey(env, "g-treat", "he")).toBe("staging:qa:row:g-treat:he");
    expect(env.RL.store.has("staging:qa:row:g-treat:he")).toBe(true);
    expect(decodeShard(env.RL.store.get("staging:qa:vec:v2:he"))!.header.rows[0].id).toBe("t-he");
    expect([...env.RL.store.keys()].some((k: string) => !k.startsWith("staging:"))).toBe(false);
  });

  it("before the first full reindex (no shard): writes the KV row, creates no shard", async () => {
    const env = { AI: fakeAI(VEC), RL: fakeKV(), VECTORIZE: fakeVectorize() } as any;
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const out = await reindexQaRow(env, ROWS[1]);
    expect(out.shards?.[0]).toMatchObject({ lang: "en", written: false, missing: true });
    expect(env.RL.store.has("qa:vec:v2:en")).toBe(false);
    expect(env.RL.store.has("qa:row:g-treat:en")).toBe(true);
    expect(log.mock.calls.some((c) => String(c[0]).startsWith("qa-shard-missing"))).toBe(true);
  });
});

describe("concurrent saves of one language", () => {
  // Save B read the shard before save A wrote it, and writes its version (with
  // B's row, without A's) right after A's write: A's read-back sees B's version.
  it("the save whose row was overwritten redoes from the newer version, and both rows survive", async () => {
    const env = await seededEnv(VEC, ROWS.slice(0, 1));
    const rl = env.RL;
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const stale = rl.store.get("qa:vec:v2:he");
    let raced = false;
    env.RL = {
      ...rl,
      get: rl.get, list: rl.list, delete: rl.delete,
      put: async (k: string, v: any, o?: any) => {
        await rl.put(k, v, o);
        if (k === "qa:vec:v2:he" && !raced) {
          raced = true;
          // B's write: the stale shard plus B's row.
          const b = { RL: fakeKV({ "qa:vec:v2:he": stale }), AI: fakeAI(VEC), VECTORIZE: fakeVectorize() } as any;
          await reindexQaRow(b, ROWS[2]);
          await rl.put(k, b.RL.store.get(k), { metadata: b.RL.meta.get(k) });
        }
      },
    };
    const out = await reindexQaRow(env, ROWS[3]);
    expect(out.shards?.[0]).toMatchObject({ written: true, attempts: 2 });
    expect(rowIds({ ...env, RL: rl }, "he").sort()).toEqual(["c-he", "r-he", "t-he"]);
    expect(log.mock.calls.filter((c) => String(c[0]).startsWith("qa-shard-retry"))).toHaveLength(1);
  });

  it("a KV 429 (one write per second per key) is retried", async () => {
    const env = await seededEnv(VEC, ROWS.slice(0, 1));
    vi.spyOn(console, "log").mockImplementation(() => {});
    const put = env.RL.put;
    let failed = false;
    env.RL.put = async (k: string, v: any, o?: any) => {
      if (k === "qa:vec:v2:he" && !failed) { failed = true; throw new Error("KV PUT failed: 429 Too Many Requests"); }
      return put(k, v, o);
    };
    const out = await reindexQaRow(env, ROWS[2]);
    expect(out.shards?.[0]).toMatchObject({ written: true, attempts: 2 });
    expect(rowIds(env, "he")).toEqual(["t-he", "c-he"]);
  });

  it("gives up after SHARD_RETRIES redos and says so", async () => {
    const env = await seededEnv(VEC, ROWS.slice(0, 1));
    vi.spyOn(console, "log").mockImplementation(() => {});
    const original = env.RL.store.get("qa:vec:v2:he");
    const put = env.RL.put;
    let puts = 0;
    env.RL.put = async (k: string, v: any, o?: any) => {
      await put(k, v, o);
      if (k === "qa:vec:v2:he") { puts++; await put(k, original, o); } // always overwritten at once
    };
    await expect(reindexQaRow(env, ROWS[2])).rejects.toThrow(/lost to concurrent saves/);
    expect(puts).toBe(SHARD_RETRIES + 1);
  });
});

describe("findPlaybooks", () => {
  it("strong match picks the user's language row of the best group", async () => {
    const env = await seededEnv(VEC, ROWS);
    const f = await find(env, [1, 0, 0], "en");
    expect(f.m.playbook?.strength).toBe("strong");
    expect(f.m.playbook?.row.rowId).toBe("t-en");
    expect(f.m.playbook?.row).not.toHaveProperty("guide");
  });

  it("falls back to the Hebrew row when the group has no row in the user's language", async () => {
    const env = await seededEnv(VEC, ROWS);
    expect((await find(env, [1, 0, 0], "fr")).m.playbook?.row.rowId).toBe("t-he");
  });

  it("scans only the user's language and Hebrew: a row in a third language is not matched", async () => {
    const env = await seededEnv(VEC, [row("x-ru", "g-x", "ru", { question: "how do i get treatment", guidance: "ru guidance" })]);
    const get = vi.spyOn(env.RL, "get");
    expect((await find(env, [1, 0, 0], "fr")).m).toEqual({});
    expect(get.mock.calls.map((c) => c[0]).sort()).toEqual(["qa:vec:v2:fr", "qa:vec:v2:he"]);
    expect((await find(env, [1, 0, 0], "ru")).m.playbook?.row.rowId).toBe("x-ru");
  });

  it("a Hebrew user reads one shard", async () => {
    const env = await seededEnv(VEC, ROWS);
    const get = vi.spyOn(env.RL, "get");
    await loadPlaybookStore(env, "he");
    expect(get.mock.calls.map((c) => c[0])).toEqual(["qa:vec:v2:he"]);
  });

  it("uses the best of question and paraphrases per group", async () => {
    const env = await seededEnv(VEC, ROWS);
    const f = await find(env, [0.95, 0.05, 0], "en");
    expect(f.m.best?.groupId).toBe("g-treat");
    expect(f.m.best!.score).toBeGreaterThan(0.99);
  });

  it("weak band gives a weak playbook, below weak gives none", async () => {
    const env = await seededEnv(VEC, ROWS);
    expect((await find(env, [1, 0.75, 0], "en")).m.playbook?.strength).toBe("strong");
    expect((await find(env, [1, 0.9, 0], "en")).m.playbook?.strength).toBe("weak");
    const none = await find(env, [1, 1.2, 0.1], "en", false, {}, { strong: 0.9, weak: 0.85 });
    expect(none.m.playbook).toBeUndefined();
    expect(none.m.best).toBeDefined();
  });

  it("crisis always yields the best crisis playbook, at any score", async () => {
    const env = await seededEnv(VEC, ROWS);
    const f = await find(env, [1, 0, 0], "en", true);
    expect(f.m.playbook?.row.rowId).toBe("t-en"); // the topical one still applies
    expect(f.m.crisisPlaybook?.row.rowId).toBe("c-he"); // no en crisis row -> Hebrew
    expect(f.m.crisisPlaybook?.strength).toBe("crisis");
    expect(f.m.crisisPlaybook!.score).toBeLessThan(0.1);
  });

  it("finds the crisis playbook even when 20+ other vectors outrank it", async () => {
    const many = Array.from({ length: 30 }, (_, i) => row(`n${i}`, `g-n${i}`, "he", { question: `topic ${i}`, guidance: "g" }));
    const table = { ...VEC, ...Object.fromEntries(many.map((_, i) => [`topic ${i}`, [1, 0.01 * i, 0]])) };
    const env = await seededEnv(table, [...many, ROWS[2]]);
    const f = await find(env, [1, 0, 0], "he", true);
    expect(f.m.crisisPlaybook?.row.rowId).toBe("c-he");
  });

  it("returns a group once when the best match is itself the crisis group", async () => {
    const env = await seededEnv(VEC, ROWS);
    const f = await find(env, [0, 0, 1], "he", true);
    expect(f.m.crisisPlaybook?.row.rowId).toBe("c-he");
    expect(f.m.playbook).toBeUndefined();
  });

  it("no crisis playbook when the detector did not fire, and no Vectorize call either way", async () => {
    const env = await seededEnv(VEC, ROWS);
    expect((await find(env, [0, 0, 1], "he")).m.crisisPlaybook).toBeUndefined();
    await find(env, [0, 0, 1], "he", true, { prevVec: [1, 0, 0] });
    expect(env.VECTORIZE.calls).toEqual([]);
  });

  it("carries the previous message's strong match only without a strong match of its own", async () => {
    const env = await seededEnv(VEC, ROWS);
    const f = await find(env, [0.3, 0.3, 0.3], "en", false, { prevVec: [1, 0, 0] });
    expect(f.carried?.row.rowId).toBe("t-en");
    expect(f.carried?.strength).toBe("strong");
    const own = await find(env, [0, 1, 0], "en", false, { prevVec: [1, 0, 0] });
    expect(own.carried).toBeUndefined();
  });

  it("guide: the used row's retrieval vector, else the group's Hebrew row's; crisis only from a row with an answer", async () => {
    const env = await seededEnv(VEC, ROWS);
    const f = await find(env, [1, 0, 0], "en");
    expect(f.guide?.p.row.rowId).toBe("t-en");
    expect(cosine(f.guide!.vec, VEC["Ref answer"])).toBeGreaterThan(0.999);
    expect((await find(env, [0, 0, 1], "he", true)).guide).toBeUndefined(); // c-he has no answer

    const env2 = await seededEnv(VEC, [
      row("c-he", "g-crisis", "he", { question: "אני רוצה למות", guidance: "g", answer: "ערן 1201", crisis: true }),
      row("c-en", "g-crisis", "en", { question: "i want to die", guidance: "g", crisis: true }),
    ]);
    const g = await find(env2, [0, 0, 1], "en", true);
    expect(g.m.crisisPlaybook?.row.rowId).toBe("c-en");
    expect(cosine(g.guide!.vec, VEC["ערן 1201"])).toBeGreaterThan(0.999);
  });

  it("empty shards: nothing matched, no KV row reads", async () => {
    const env = { AI: fakeAI(VEC), RL: fakeKV(), VECTORIZE: fakeVectorize() } as any;
    await emptyShards(env);
    const f = await find(env, [1, 0, 0], "en", true);
    expect(f.m).toEqual({});
    expect(f.guide).toBeUndefined();
  });
});

describe("store selection (transition)", () => {
  it("both shards there: shards, and the old index is never read", async () => {
    const env = await seededEnv(VEC, ROWS);
    env.RL.store.set(QA_INDEX_KEY, legacyBlob(VEC, ROWS));
    const get = vi.spyOn(env.RL, "get");
    expect((await loadPlaybookStore(env, "en"))?.kind).toBe("shards");
    expect(get.mock.calls.map((c) => c[0])).not.toContain(QA_INDEX_KEY);
  });

  it("a shard missing and the old index there: the old index, as before", async () => {
    const env = await seededEnv(VEC, ROWS);
    env.RL.store.delete(shardKey(env, "en"));
    env.RL.store.set(QA_INDEX_KEY, legacyBlob(VEC, ROWS));
    const store = await loadPlaybookStore(env, "en");
    expect(store?.kind).toBe("legacy");
    const f = await findPlaybooks(env, store!, { qv: [1, 0, 0], lang: "en", crisis: true }, TH);
    expect(f.m.playbook?.row.rowId).toBe("t-en");
    expect(f.m.crisisPlaybook?.row.rowId).toBe("c-he");
  });

  it("a shard missing and no old index: the shards there are", async () => {
    const env = await seededEnv(VEC, ROWS);
    env.RL.store.delete(shardKey(env, "en"));
    const store = await loadPlaybookStore(env, "en");
    expect(store?.kind === "shards" && store.shards.map((s) => s.lang)).toEqual(["he"]);
  });

  it("nothing at all: no store", async () => {
    expect(await loadPlaybookStore({ RL: fakeKV() } as any, "en")).toBeNull();
  });
});

describe("thresholds", () => {
  it("reads env and falls back to defaults", () => {
    expect(thresholds({})).toEqual({ strong: 0.8, weak: 0.72 });
    expect(thresholds({ QA_STRONG: "0.9", QA_WEAK: "0.7" })).toEqual({ strong: 0.9, weak: 0.7 });
    expect(thresholds({ QA_STRONG: "x", QA_WEAK: "" })).toEqual({ strong: 0.8, weak: 0.72 });
  });
});

describe("old one-value index (transition only)", () => {
  it("loads and matches as before", async () => {
    const env = { RL: fakeKV({ [QA_INDEX_KEY]: legacyBlob(VEC, ROWS) }) } as any;
    const index = (await loadQaIndex(env))!;
    const f = legacyFind(index, { qv: [1, 0, 0], lang: "en", crisis: true }, TH);
    expect(f.m.playbook?.row.rowId).toBe("t-en");
    expect(f.m.crisisPlaybook?.row.rowId).toBe("c-he");
    expect(cosine(f.guide!.vec, VEC["Ref answer"])).toBeGreaterThan(0.999);
  });

  it("an index without retrieval vectors gives no guide", async () => {
    const env = { RL: fakeKV({ [QA_INDEX_KEY]: legacyBlob(VEC, ROWS, { retrieval: false }) }) } as any;
    const f = legacyFind((await loadQaIndex(env))!, { qv: [1, 0, 0], lang: "en", crisis: false }, TH);
    expect(f.m.playbook?.row.rowId).toBe("t-en");
    expect(f.guide).toBeUndefined();
  });

  it("returns null when there is none", async () => {
    expect(await loadQaIndex({ RL: fakeKV() } as any)).toBeNull();
  });
});
