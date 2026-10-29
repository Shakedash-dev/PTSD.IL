import { describe, it, expect, vi, afterEach } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import app from "../src/index";
import { chunkItem, reindexStep, STEP_BUDGET, STEP_VECTORS, QA_STEP_TEXTS } from "../src/lib/ingest";
import { qaRowKey, shardKey, reindexQaRow, parseQaRow } from "../src/lib/qa";
import { decodeShard } from "../src/lib/qaShard";
import { QA_INDEX_KEY } from "../src/lib/qaLegacy";
import type { Item } from "../src/lib/content";
import { fakeKV } from "./kv";
import { fakeVectorize } from "./vectorize";
import { corpusResponse, runFullReindex } from "./reindex";

afterEach(() => vi.restoreAllMocks());

// Cloudflare's cap is 50 per invocation; anything past 45 fails the call here.
const HARD_LIMIT = 45;

// Deterministic fake bge-m3 vector per text.
const vecOf = (t: string) => {
  let h = 0;
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) % 9973;
  return [t.length, h, t.charCodeAt(0) || 1, 1];
};

// A Worker env whose every subrequest (fetch, AI, Vectorize, KV) is counted per
// invocation and throws past HARD_LIMIT, like the platform does. Per call it
// also records the vectors embedded and upserted (the step's CPU driver).
function countingEnv(articles: any[], communities: unknown[] = [], opts: { vec?: (t: string) => number[]; kv?: ReturnType<typeof fakeKV>; vz?: ReturnType<typeof fakeVectorize> } = {}) {
  const count = { n: 0, embedded: 0, upserted: 0 };
  const hit = () => {
    if (++count.n > HARD_LIMIT) throw new Error("Too many subrequests by single Worker invocation");
  };
  const kv = opts.kv ?? fakeKV();
  const vz = opts.vz ?? fakeVectorize();
  const kvPuts: string[] = [];
  const kvDeletes: string[] = [];
  const corpus = { articles, communities };
  const urls: string[] = [];
  vi.spyOn(globalThis, "fetch").mockImplementation(async (url: any) => {
    hit();
    const u = String(url);
    urls.push(u);
    if (u === "https://api/x/admin/whoami") return new Response("{}", { status: 200 });
    return corpusResponse(corpus, u) ?? new Response("nf", { status: 404 });
  });
  const vec = opts.vec ?? vecOf;
  const env = {
    API_BASE: "https://api/x", ADMIN_VERIFY_URL: "https://api/x/admin/whoami", SITE_ORIGIN: "https://site",
    AI: { run: async (_m: string, i: { text: string[] }) => { hit(); count.embedded += i.text.length; return { data: i.text.map(vec) }; } },
    VECTORIZE: {
      upsert: async (rows: any[]) => { hit(); count.upserted += rows.length; return vz.upsert(rows); },
      deleteByIds: async (ids: string[]) => { hit(); return vz.deleteByIds(ids); },
      getByIds: async (ids: string[]) => { hit(); return vz.getByIds(ids); },
      query: async (v: number[], o: any) => { hit(); return vz.query(v, o); },
    },
    RL: {
      get: async (k: string, o?: any) => { hit(); return kv.get(k, o); },
      put: async (k: string, v: string, o?: any) => { hit(); kvPuts.push(k); return kv.put(k, v, o); },
      delete: async (k: string) => { hit(); kvDeletes.push(k); return kv.delete(k); },
      list: async (o: any) => { hit(); return kv.list(o); },
    },
  } as any;
  return { env, count, kv, vz, kvPuts, kvDeletes, corpus, urls };
}
type T = ReturnType<typeof countingEnv>;

const shardRowsOf = (t: { kv: ReturnType<typeof fakeKV>; env: any }, lang: string) => {
  const s = decodeShard((t.kv.store.get(shardKey(t.env, lang)) as ArrayBuffer) ?? null);
  return s ? s.header.rows : null;
};

// One POST /reindex through the router (admin check included), counted on its own.
async function post(t: T, body: unknown) {
  Object.assign(t.count, { n: 0, embedded: 0, upserted: 0 });
  const res = await app.request("/reindex", {
    method: "POST", body: JSON.stringify(body),
    headers: { "content-type": "application/json", Authorization: "Bearer t" },
  }, t.env);
  return { status: res.status, json: (await res.json()) as any, ...t.count };
}

async function loop(t: T, onStep?: (i: number) => void) {
  const steps: Awaited<ReturnType<typeof post>>[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < 1000; i++) {
    onStep?.(i);
    const r = await post(t, { scope: "all", ...(cursor ? { cursor } : {}) });
    expect(r.status, JSON.stringify(r.json)).toBe(200);
    steps.push(r);
    if (r.json.done) return steps;
    cursor = r.json.cursor;
  }
  throw new Error("reindex did not terminate");
}

const LANGS = ["he", "en", "ar", "ru", "fr"];
const asRaw = (i: Item) => ({ ...i, isPublished: true, categories: (i.categorySlugs ?? []).map((slug) => ({ slug })) });
const item = (id: string, slugs: string[], content: Record<string, unknown>, langId = "he"): Item => ({
  id, groupId: `g-${id}`, type: "article", langId, title: `T ${id}`, content: JSON.stringify(content),
  categorySlug: slugs.find((s) => s !== "metiv") ?? slugs[0], categorySlugs: slugs,
});
const qaItem = (i: number, paraphrases: number, extra: Record<string, unknown> = {}) => ({
  ...item(`qa${i}`, ["chatbot-qa"], {
    question: `question ${i}`, paraphrases: Array.from({ length: paraphrases }, (_, k) => `question ${i} said another way ${k}`),
    guidance: `guidance ${i}`, crisis: i % 7 === 0, ...extra,
  }, LANGS[i % 5]),
  groupId: `g-qa${Math.floor(i / 5)}`,
});

// The chunk metadata the index must hold for an item.
function expectedRows(items: Item[]) {
  return items.flatMap((it) => {
    const key = (JSON.parse(it.content) as { _key?: string })._key;
    const isMetiv = (it.categorySlugs ?? []).some((s) => s === "metiv" || s.startsWith("metiv-"));
    return chunkItem(it).map((c) => ({
      id: `${it.id}:${c.index}`,
      metadata: {
        itemId: it.id, groupId: it.groupId, type: it.type, langId: it.langId, title: c.title, text: c.text,
        chunkIndex: c.index, categorySlug: it.categorySlug, categorySlugs: it.categorySlugs,
        ...(isMetiv && key ? { key } : {}), ...(c.section ? { section: c.section } : {}),
      },
    }));
  });
}

describe("stepped full reindex (POST /reindex scope all)", () => {
  it("keeps every step under the subrequest budget, STEP_VECTORS and QA_STEP_TEXTS, and writes every vector once", async () => {
    const content = [
      ...Array.from({ length: 600 }, (_, i) => item(`a${i}`, ["rights"], { answer: `answer text number ${i}` }, LANGS[i % 5])),
      ...Array.from({ length: 20 }, (_, i) => item(`c${i}`, ["metiv", "metiv-courses"], { _key: `course-${i}`, body: `course ${i}` })),
    ];
    // 100 Q&A rows x 5 texts, every 7th a crisis row.
    const qa = Array.from({ length: 100 }, (_, i) => qaItem(i, 4));
    const nav = Array.from({ length: 100 }, (_, i) => item(`n${i}`, ["metiv", "metiv-nav"], { label: `menu ${i}` }, LANGS[i % 5]));
    const t = countingEnv([...content, ...qa, ...nav].map(asRaw));

    const steps = await loop(t);

    for (const s of steps) {
      expect(s.n).toBeLessThanOrEqual(STEP_BUDGET);
      expect(s.upserted).toBeLessThanOrEqual(STEP_VECTORS);
      expect(s.embedded).toBeLessThanOrEqual(QA_STEP_TEXTS);
    }
    for (const s of steps.slice(0, -1)) expect(s.json).toMatchObject({ done: false, cursor: expect.any(String) });
    const last = steps.at(-1)!.json;
    expect(last).toMatchObject({ ok: true, done: true, upserted: 620, excluded: 200, qa: 100 });
    expect(last.cursor).toBeUndefined();
    // One slice fetch per step (plus the admin check): no step reads the whole corpus.
    expect(t.urls.filter((u) => u === "https://api/x/articles")).toEqual([]);

    // Content: every chunk once, default namespace, original ids, same metadata as before.
    expect(t.vz.inNs(undefined)).toHaveLength(620);
    expect(t.vz.store.size).toBe(620);
    for (const e of expectedRows(content)) expect(t.vz.store.get(e.id)?.metadata).toEqual(e.metadata);
    const upserts = t.vz.calls.filter((c) => c.op === "upsert").flatMap((c) => c.arg as any[]);
    expect(upserts).toHaveLength(620);
    expect(upserts.some((r) => r.namespace)).toBe(false);

    // Playbooks: one shard per language with that language's rows, 5 vectors each; one KV row per row.
    for (const l of LANGS) {
      const rows = shardRowsOf(t, l)!;
      const mine = qa.filter((r) => r.langId === l);
      expect(rows.map((r) => r.id)).toEqual(mine.map((r) => r.id));
      expect(rows.every((r) => r.n === 5)).toBe(true);
      expect(rows.filter((r) => r.c).map((r) => r.id)).toEqual(mine.filter((r) => Number(r.id.slice(2)) % 7 === 0).map((r) => r.id));
    }
    for (const r of qa) expect(t.kv.store.has(qaRowKey(t.env, r.groupId, r.langId))).toBe(true);

    // Stale ids of every excluded row (nav + Q&A), in batches of at most 100.
    const deleted = t.vz.calls.filter((c) => c.op === "deleteByIds").map((c) => c.arg as string[]);
    for (const b of deleted) expect(b.length).toBeLessThanOrEqual(100);
    const flat = new Set(deleted.flat());
    for (const it of [...nav, ...qa]) for (let k = 0; k < chunkItem(it).length + 4; k++) expect(flat.has(`${it.id}:${k}`)).toBe(true);
    expect([...flat].some((d) => /^(a|c)\d+:/.test(d))).toBe(false);
  });

  it("from the deployed state: content ids never deleted, chat never sees a half-built shard, old index gone at the end", async () => {
    const content = Array.from({ length: 150 }, (_, i) => item(`a${i}`, ["rights"], { answer: `answer ${i}` }, LANGS[i % 5]));
    const qa = Array.from({ length: 40 }, (_, i) => qaItem(i, 12)); // 8 rows per language, 14 texts each: several steps per language
    const kv = fakeKV({ [QA_INDEX_KEY]: "{\"v\":1,\"entries\":[],\"rows\":{}}" });
    const vz = fakeVectorize();
    await vz.upsert(content.map((c) => ({ id: `${c.id}:0`, values: vecOf(c.id), metadata: { itemId: c.id } })));
    const t = countingEnv([...content, ...qa].map(asRaw), [], { kv, vz });
    const seen: string[] = [];

    const steps = await loop(t, () => {
      for (const l of LANGS) {
        const rows = shardRowsOf(t, l);
        if (!rows) continue;
        // A shard chat can read is always the whole language.
        expect(rows.map((r) => r.id)).toEqual(qa.filter((r) => r.langId === l).map((r) => r.id));
        if (!seen.includes(l)) seen.push(l);
      }
      // The old index stays until every shard is there.
      if (seen.length < LANGS.length) expect(kv.store.has(QA_INDEX_KEY)).toBe(true);
    });

    expect(seen).toEqual(["he", "ar", "en", "ru", "fr"]);
    const deleted = vz.calls.filter((c) => c.op === "deleteByIds").flatMap((c) => c.arg as string[]);
    for (const c of content) expect(deleted).not.toContain(`${c.id}:0`);
    expect(vz.store.size).toBe(150);
    expect(kv.store.has(QA_INDEX_KEY)).toBe(false);
    expect(t.kvDeletes).toEqual([QA_INDEX_KEY]);
    // Build parts expire on their own (TTL), so none is deleted.
    expect(t.kvPuts.filter((k) => k.includes(":build:")).length).toBe(5); // 8 rows x 14 texts: 2 steps per language
    expect(steps.at(-1)!.json).toMatchObject({ done: true, upserted: 150, qa: 40 });
  });

  it("KV writes: a first run writes rows + parts + 5 shards; a run on unchanged rows skips every row", async () => {
    const qa = Array.from({ length: 175 }, (_, i) => qaItem(i, 12)); // the real set: 175 rows, ~14 texts each
    const t = countingEnv(qa.map(asRaw));
    await loop(t);
    const parts = t.kvPuts.filter((k) => k.includes(":build:")).length;
    const rows = t.kvPuts.filter((k) => k.includes("qa:row:")).length;
    const shards = t.kvPuts.filter((k) => /qa:vec:v2:[a-z]+$/.test(k)).length;
    expect({ rows, shards }).toEqual({ rows: 175, shards: 5 });
    expect(t.kvPuts.length).toBe(rows + shards + parts);
    console.log(`KV writes per full reindex (175 rows): first run ${t.kvPuts.length} (${rows} rows, ${parts} parts, ${shards} shards) + ${t.kvDeletes.length} delete`);
    t.kvPuts.length = 0;
    t.kvDeletes.length = 0;

    await loop(t);

    expect(t.kvPuts.filter((k) => k.includes("qa:row:"))).toEqual([]);
    console.log(`KV writes per full reindex, rows unchanged: ${t.kvPuts.length} + ${t.kvDeletes.length} delete`);
    expect(t.kvPuts.length).toBe(parts + 5);
    expect(t.kvDeletes).toEqual([QA_INDEX_KEY]);
  });

  it("cleanup drops what the Q&A set no longer has, and nothing it still has", async () => {
    const rows = [qaItem(0, 6), qaItem(1, 4), qaItem(2, 4), qaItem(3, 4)];
    const t = countingEnv(rows.map(asRaw));
    await loop(t);
    expect(shardRowsOf(t, "he")).toMatchObject([{ id: "qa0", n: 7, c: 1 }]);

    t.corpus.articles = [
      qaItem(0, 2, { crisis: false }), // fewer texts, no longer crisis
      qaItem(1, 4),
      { ...qaItem(2, 4), groupId: "g-moved" }, // moved to another group
      // qa3 deleted
    ].map(asRaw);
    await loop(t);

    expect(shardRowsOf(t, "he")).toEqual([expect.objectContaining({ id: "qa0", n: 3 })]);
    expect(shardRowsOf(t, "he")![0].c).toBeUndefined();
    expect(shardRowsOf(t, "ru")).toEqual([]);
    expect(shardRowsOf(t, "ar")!.map((r) => r.g)).toEqual(["g-moved"]);
    expect([...t.kv.store.keys()].filter((k) => k.startsWith("qa:row:")).sort()).toEqual([
      qaRowKey(t.env, "g-moved", "ar"), qaRowKey(t.env, "g-qa0", "he"), qaRowKey(t.env, "g-qa0", "en"),
    ].sort());
  });

  it("a Q&A text edit mid-language rebuilds that language; a lost build part rebuilds it too", async () => {
    const qa = Array.from({ length: 40 }, (_, i) => qaItem(i, 12));
    const t = countingEnv(qa.map(asRaw));
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    let edited = false;
    let dropped = false;
    await loop(t, (i) => {
      if (i === 1 && !edited) {
        // he row qa5 gets a new paraphrase while he is being built.
        t.corpus.articles = [...qa.slice(0, 5), qaItem(5, 13), ...qa.slice(6)].map(asRaw);
        edited = true;
      }
      const parts = [...t.kv.store.keys()].filter((k) => k.includes(":vec:v2:ar:build:"));
      if (parts.length && !dropped) {
        t.kv.store.delete(parts[0]); // expired
        dropped = true;
      }
    });
    expect(shardRowsOf(t, "he")!.find((r) => r.id === "qa5")!.n).toBe(14);
    expect(shardRowsOf(t, "ar")!.map((r) => r.id)).toEqual(qa.filter((r) => r.langId === "ar").map((r) => r.id));
    expect(log.mock.calls.some((c) => String(c[0]).startsWith("qa-build-restart"))).toBe(true);
  });

  it("an admin save edits the live shard in place, and the next run keeps the edit", async () => {
    const qa = Array.from({ length: 10 }, (_, i) => qaItem(i, 3));
    const t = countingEnv(qa.map(asRaw));
    await loop(t);
    // The save: the DB changes, then the item reindex runs (counted like a request).
    const changed = qaItem(1, 5);
    t.corpus.articles = [qa[0], changed, ...qa.slice(2)].map(asRaw);
    t.count.n = 0;
    await reindexQaRow(t.env, changed);
    expect(t.count.n).toBeLessThanOrEqual(10);
    expect(shardRowsOf(t, "en")!.find((r) => r.id === "qa1")!.n).toBe(6); // qa1 is English
    await loop(t);
    expect(shardRowsOf(t, "en")!.find((r) => r.id === "qa1")!.n).toBe(6);
    expect(parseQaRow(changed)!.texts).toHaveLength(6);
  });

  it("restarts a slice when the corpus changes under it", async () => {
    const content = Array.from({ length: 300 }, (_, i) => item(`a${i}`, ["rights"], { answer: `answer ${i}` }));
    const t = countingEnv(content.map(asRaw));
    let dropped = false;
    // Steps 0-4: the qa slices (no rows: one step each). Then chunks/he, 40 per step.
    const steps = await loop(t, (i) => {
      if (i === 7 && !dropped) {
        // An item before the cursor is deleted: offsets shift, so the slice starts over.
        t.corpus.articles = content.slice(1).map(asRaw);
        dropped = true;
      }
    });
    expect(steps[6].json.progress).toMatchObject({ phase: "chunks", slice: "he", processed: 2 * STEP_VECTORS });
    expect(steps[7].json.progress).toMatchObject({ phase: "chunks", slice: "he", processed: STEP_VECTORS });
    for (let i = 1; i < 300; i++) expect(t.vz.store.has(`a${i}:0`)).toBe(true);
    expect(steps.at(-1)!.json).toMatchObject({ done: true, upserted: 299 });
  });

  it("rejects a malformed cursor, and one from an older layout, with 400", async () => {
    const t = countingEnv([]);
    expect((await post(t, { scope: "all", cursor: "not-a-cursor" })).status).toBe(400);
    expect((await post(t, { scope: "all", cursor: 5 })).status).toBe(400);
    const v1 = btoa(JSON.stringify({ v: 1, phase: "qa", offset: 0, buildId: "b", fp: "", parts: 0 }));
    expect((await post(t, { scope: "all", cursor: v1 })).status).toBe(400);
    const v2 = btoa(JSON.stringify({ v: 2, phase: "chunks", slice: 0, offset: 0, fp: "", n: 0, layout: { content: true, qa: true, legacyGone: true }, mig: false, up: 0, qa: 0, ex: 0 }));
    expect((await post(t, { scope: "all", cursor: v2 })).status).toBe(400);
  });
});

describe("leftovers of the never-deployed namespaced layout", () => {
  it("are swept: its namespaces emptied, its flag deleted, default-namespace content untouched", async () => {
    const content = Array.from({ length: 20 }, (_, i) => item(`a${i}`, ["rights"], { answer: `answer ${i}` }));
    const kv = fakeKV({ "vec:layout": "{\"content\":true,\"qa\":true,\"legacyGone\":false}" });
    const vz = fakeVectorize();
    await vz.upsert(content.map((c) => ({ id: `${c.id}:0`, values: vecOf(c.id), metadata: { itemId: c.id } })));
    await vz.upsert(Array.from({ length: 250 }, (_, i) => ({ id: `qa:r${i}:0`, namespace: "qa", values: vecOf(`q${i}`), metadata: { kind: "match" } })));
    await vz.upsert(Array.from({ length: 30 }, (_, i) => ({ id: `qac:r${i}:0`, namespace: "qa-crisis", values: vecOf(`q${i}`), metadata: { kind: "match" } })));
    await vz.upsert(content.map((c) => ({ id: `c:${c.id}:0`, namespace: "content", values: vecOf(c.id), metadata: { itemId: c.id } })));
    const t = countingEnv(content.map(asRaw), [], { kv, vz });

    const steps = await loop(t);

    expect(vz.inNs("qa")).toEqual([]);
    expect(vz.inNs("qa-crisis")).toEqual([]);
    expect(vz.inNs("content")).toEqual([]);
    expect(vz.inNs(undefined).map((v) => v.id).sort()).toEqual(content.map((c) => `${c.id}:0`).sort());
    expect(kv.store.has("vec:layout")).toBe(false);
    const sweep = steps.filter((s) => s.json.progress.slice === "rework");
    expect(sweep.length).toBe(4); // 250 qa vectors at 100 per round, then an empty round
    for (const s of sweep) expect(s.n).toBeLessThanOrEqual(STEP_BUDGET);
  });

  it("on an index that never had them: one round, 1 KV get + 3 queries, nothing deleted", async () => {
    const t = countingEnv([item("a0", ["rights"], { answer: "x" })].map(asRaw));
    const steps = await loop(t);
    const sweep = steps.filter((s) => s.json.progress.slice === "rework");
    expect(sweep).toHaveLength(1);
    expect(sweep[0].n).toBe(1 + 1 + 3); // admin check + flag get + 3 queries
    expect(t.vz.calls.filter((c) => c.op === "deleteByIds").flatMap((c) => c.arg as string[]).some((id) => /^(qa|qac|c):/.test(id))).toBe(false);
  });
});

describe("stepped full reindex (content shapes)", () => {
  it("indexes communities from /communities alongside articles", async () => {
    const articles = [{
      id: "a1", groupId: "g", type: "faq", langId: "he", title: "Article",
      content: JSON.stringify({ answer: "some article answer text" }), isPublished: true,
    }];
    const communities = [{
      id: "c1", groupId: "cg", langId: "en", name: "NATAL - Support Groups",
      description: "Support groups for survivors of war-related trauma and their families.",
      organization: "NATAL Association", isActive: true,
      targetAudiences: [{ slug: "spouses", name: "Spouses" }],
    }, {
      id: "c2", groupId: "cg2", langId: "en", name: "Inactive place", description: "hidden",
      isActive: false, targetAudiences: [],
    }];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url: any) => corpusResponse({ articles: articles as any, communities }, String(url))!);
    const vz = fakeVectorize();
    const env = { API_BASE: "https://api/x", AI: { run: async (_m: string, i: { text: string[] }) => ({ data: i.text.map(() => [0.1, 0.2]) }) }, VECTORIZE: vz, RL: fakeKV() } as any;

    const out = await runFullReindex(env);

    const rows = vz.inNs(undefined) as Array<{ metadata: any }>;
    const community = rows.find((r) => r.metadata.type === "community");
    expect(community?.metadata).toMatchObject({ itemId: "c1", langId: "en" });
    expect(rows.some((r) => r.metadata.itemId === "c2")).toBe(false); // inactive
    expect(out.upserted).toBe(rows.length);
  });

  it("finishes with upserted:0 and no AI/upsert calls when there are no items, and leaves an empty shard per language", async () => {
    const aiRun = vi.fn();
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response(JSON.stringify([]), { status: 200 }));
    const vz = fakeVectorize();
    const rl = fakeKV();
    const env = { API_BASE: "https://api/x", AI: { run: aiRun }, VECTORIZE: vz, RL: rl } as any;

    const out = await runFullReindex(env);
    expect(out).toMatchObject({ done: true, upserted: 0, excluded: 0, qa: 0 });
    expect(aiRun).not.toHaveBeenCalled();
    expect(vz.calls.filter((c) => c.op === "upsert")).toEqual([]);
    expect(out.steps.length).toBe(5 + 6 + 8); // one per slice
    for (const l of LANGS) expect(decodeShard(rl.store.get(shardKey(env, l)) as ArrayBuffer)!.header.rows).toEqual([]);
  });
});

// CPU per step on the real corpus (backups/ is gitignored, so this only runs
// where a backup exists). In node every mock answers at once, so a step's wall
// time is its CPU time: JSON parse of the slice and of the embedding response,
// chunking, and the upsert's JSON.stringify, which the real binding does too.
const BACKUP = new URL("../../backups/articles-20261029T162013.json", (import.meta as unknown as { url: string }).url);
describe.runIf(existsSync(BACKUP))("CPU per step on the real corpus", () => {
  it("every step stays far under the old one, and logs the numbers", async () => {
    const articles = JSON.parse(readFileSync(BACKUP, "utf8"));
    const bodies = new Map<string, string>();
    let mockMs = 0; // time spent building mock responses: the platform's, not the Worker's
    // A bare JSON.parse response: node's Response.json() adds 3-5 ms per slice
    // of stream plumbing that workerd does natively.
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url: any) => {
      const u = String(url);
      const t0 = performance.now();
      if (!bodies.has(u)) bodies.set(u, await corpusResponse({ articles, communities: [] }, u)!.text());
      mockMs += performance.now() - t0;
      const body = bodies.get(u)!;
      return { ok: true, status: 200, json: async () => JSON.parse(body) } as unknown as Response;
    });
    // 1024-dim, full-precision values serialized as JSON, like the AI binding's response.
    const embedJson = (n: number) => JSON.stringify({ data: Array.from({ length: n }, () => Array.from({ length: 1024 }, () => Math.random() * 0.1 - 0.05)) });
    const env = {
      API_BASE: "https://api/x", ADMIN_VERIFY_URL: "https://api/x/whoami", SITE_ORIGIN: "https://site",
      AI: { run: async (_m: string, i: { text: string[] }) => JSON.parse(embedJson(i.text.length)) },
      VECTORIZE: {
        upsert: async (rows: unknown[]) => { JSON.stringify({ vectors: rows }); return { mutationId: "m" }; },
        deleteByIds: async (ids: string[]) => { JSON.stringify(ids); return { mutationId: "m" }; },
      },
      RL: fakeKV(),
    } as any;
    const times: { ms: number; phase: string; slice: string }[] = [];
    let cursor: string | undefined;
    for (let i = 0; i < 500; i++) {
      // embedJson's own cost is the platform's too.
      mockMs = 0;
      const run = env.AI.run;
      env.AI.run = async (m: string, inp: { text: string[] }) => {
        const t0 = performance.now();
        const s = embedJson(inp.text.length);
        mockMs += performance.now() - t0;
        return JSON.parse(s);
      };
      const t0 = performance.now();
      const r = await reindexStep(env, cursor);
      times.push({ ms: performance.now() - t0 - mockMs, phase: r.progress.phase, slice: r.progress.slice });
      env.AI.run = run;
      if (r.done) {
        console.log(`real corpus: ${r.upserted} content vectors (${((r.upserted! * 1024) / 5e6 * 100).toFixed(0)}% of the free plan's 5M stored dimensions), ${r.qa} playbook rows`);
        break;
      }
      cursor = r.cursor;
    }
    // The first step also pays V8's first compile of every code path (a cold
    // isolate does too); the warm ones are what the run is made of.
    const warm = times.slice(1);
    const sorted = warm.map((x) => x.ms).sort((a, b) => a - b);
    const worst = warm.reduce((a, b) => (b.ms > a.ms ? b : a));
    console.log(`reindex CPU: ${times.length} steps, first ${times[0].ms.toFixed(1)} ms, then median ${sorted[sorted.length >> 1].toFixed(1)} ms, p90 ${sorted[Math.floor(sorted.length * 0.9)].toFixed(1)} ms, max ${worst.ms.toFixed(1)} ms (${worst.phase}/${worst.slice})`);
    for (const phase of ["qa", "chunks", "cleanup"]) {
      const xs = warm.filter((x) => x.phase === phase).map((x) => x.ms).sort((a, b) => a - b);
      console.log(`  ${phase}: ${xs.length} steps, median ${xs[xs.length >> 1].toFixed(1)} ms, max ${xs.at(-1)!.toFixed(1)} ms`);
    }
    expect(worst.ms).toBeLessThan(25); // loose: shared CI machines are noisy

    // Item reindex of the largest Q&A row against the real-size shard the run left.
    const qaRows = articles.filter((r: any) => (r.categories ?? []).some((c: any) => c.slug === "chatbot-qa"))
      .map((r: any) => ({ id: r.id, groupId: r.groupId, langId: r.langId, type: r.type, title: r.title ?? "", content: r.content, categorySlug: "chatbot-qa", categorySlugs: ["chatbot-qa"] }) as Item);
    const big = qaRows.reduce((a: Item, b: Item) => (b.content.length > a.content.length ? b : a));
    const shardBytes = (env.RL as ReturnType<typeof fakeKV>).bytes(shardKey(env, big.langId));
    // The embedding response is built once outside the timing; parsing it is the Worker's.
    const response = embedJson(parseQaRow(big)!.texts.length + 1);
    env.AI.run = async () => JSON.parse(response);
    const item: number[] = [];
    for (let i = 0; i < 12; i++) {
      // Includes the fake KV's copies of the ~0.5 MB shard (3 per save), which
      // KV does outside the isolate: an upper bound.
      const t0 = performance.now();
      await reindexQaRow(env, big);
      item.push(performance.now() - t0);
    }
    const it2 = item.slice(2).sort((a, b) => a - b);
    console.log(`item reindex CPU (largest Q&A row, ${parseQaRow(big)!.texts.length} texts, shard ${(shardBytes / 1024).toFixed(0)} KB): median ${it2[it2.length >> 1].toFixed(1)} ms, max ${it2.at(-1)!.toFixed(1)} ms`);
    expect(it2[it2.length >> 1]).toBeLessThan(10);
  }, 60_000);
});
