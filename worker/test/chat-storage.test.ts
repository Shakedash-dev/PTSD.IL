import { describe, it, expect, vi, afterEach } from "vitest";
import app from "../src/index";
import { reindexItem } from "../src/lib/ingest";
import { reindexQaRow, loadPlaybookStore, findPlaybooks, shardKey } from "../src/lib/qa";
import { QA_INDEX_KEY } from "../src/lib/qaLegacy";
import type { Item } from "../src/lib/content";
import { fakeKV } from "./kv";
import { fakeVectorize } from "./vectorize";
import { qaItem, fakeAI, legacyBlob, emptyShards } from "./qaEnv";

afterEach(() => vi.restoreAllMocks());

// 4-dim fake embeddings. Playbook questions sit close to user questions on
// purpose: were they in the vector index, the content query would rank them first.
const VEC: Record<string, number[]> = {
  "how do i get treatment": [1, 0, 0, 0],
  "where do i find a therapist": [0.97, 0.24, 0, 0],
  "how old?": [0, 0, 0, 1],
  "5": [0.1, 0.1, 0.1, 0.1],
  "i want to die": [0, 0.2, 1, 0],
  "crisis question": [0, 0, 1, 0],
  "REF": [0.5, 0.5, 0, 0],
};
const contentVec = (t: string) => [0.9, 0.3, 0.1 * (t.length % 5), 0.05];

const article = (id: string, text: string, langId = "en"): Item => ({
  id, groupId: `g-${id}`, type: "faq", langId, title: `T ${id}`, content: JSON.stringify({ answer: text }), categorySlug: "rights", categorySlugs: ["rights"],
});
const ROWS = [
  qaItem("t-en", "g-treat", "en", { question: "how do i get treatment", paraphrases: ["where do i find a therapist"], guidance: "GUIDANCE-EN", answer: "REF", crisis: false }),
  qaItem("t-he", "g-treat", "he", { question: "how do i get treatment", guidance: "GUIDANCE-HE", answer: "REF", crisis: false }),
  qaItem("c-he", "g-crisis", "he", { question: "crisis question", guidance: "CRISIS-GUIDANCE", answer: "REF", crisis: true }),
];

function geminiSSE(text: string) {
  const enc = new TextEncoder();
  const frame = `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] })}\n\n`;
  return new Response(new ReadableStream({ start(c) { c.enqueue(enc.encode(frame)); c.close(); } }), { status: 200 });
}

function baseEnv() {
  const ai = fakeAI(VEC);
  ai.run.mockImplementation(async (_m: string, i: { text: string[] }) => ({ data: i.text.map((t) => VEC[t] ?? contentVec(t)) }));
  return { AI: ai, RL: fakeKV(), VECTORIZE: fakeVectorize(), SITE_ORIGIN: "https://site", GEMINI_MODEL: "m", GEMINI_API_KEY: "k" } as any;
}

async function chat(env: any, messages: { role: "user" | "assistant"; content: string }[], lang = "en") {
  const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => geminiSSE("answer"));
  const log = vi.spyOn(console, "log").mockImplementation(() => {});
  const res = await app.request("/chat", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages, lang, sessionId: "s" }),
  }, env);
  const body = await res.text();
  const call = fetchSpy.mock.calls[0];
  const payload = call ? JSON.parse(String((call[1] as RequestInit).body)) : null;
  const sources = (() => {
    const f = body.split("\n\n").find((x) => x.startsWith("event: sources"));
    return f ? (JSON.parse(f.split("\ndata: ")[1]) as { itemId: string }[]).map((s) => s.itemId) : [];
  })();
  const qaLine = log.mock.calls.map((c) => String(c[0])).find((l) => l.startsWith("qa-match "));
  const fetches = fetchSpy.mock.calls.length;
  fetchSpy.mockRestore();
  log.mockRestore();
  return { fetches, body, userText: (payload?.contents.at(-1).parts[0].text ?? "") as string, sources, qa: qaLine ? JSON.parse(qaLine.slice(9)) : null };
}

const u = (content: string) => ({ role: "user" as const, content });
const a = (content: string) => ({ role: "assistant" as const, content });

describe("the vector index holds content only", () => {
  it("content vectors keep their original ids in the default namespace; playbooks never go to Vectorize", async () => {
    const env = baseEnv();
    await emptyShards(env);
    await reindexItem(env, article("a1", "fact"));
    for (const r of ROWS) await reindexQaRow(env, r);
    expect([...env.VECTORIZE.store.values()].map((v: any) => [v.id, v.namespace])).toEqual([["a1:0", undefined]]);
    const r = await chat(env, [u("where do i find a therapist")]);
    expect(r.userText).toContain("GUIDANCE-EN");
    const queries = env.VECTORIZE.calls.filter((c: any) => c.op === "query");
    expect(queries).toHaveLength(2); // user query + playbook-guided query
    for (const c of queries) expect(c.arg.namespace).toBeUndefined();
  });
});

describe("transition: deployed, full reindex not run yet", () => {
  // The index as the deployed code left it: content without a namespace, bare
  // ids, and the old one-value playbook index in KV.
  async function oldIndex() {
    const env = baseEnv();
    env.RL = fakeKV({ [QA_INDEX_KEY]: legacyBlob(VEC, ROWS) });
    await env.VECTORIZE.upsert(["a1", "a2"].map((id) => ({
      id: `${id}:0`, values: contentVec(id),
      metadata: { itemId: id, groupId: `g-${id}`, type: "faq", langId: "en", title: `T ${id}`, text: `fact ${id}`, chunkIndex: 0, categorySlug: "rights" },
    })));
    env.VECTORIZE.calls.length = 0;
    return env;
  }

  it("answers from the old storage: the same content query, playbooks from the old KV value", async () => {
    const env = await oldIndex();
    const r = await chat(env, [u("where do i find a therapist")]);
    expect(r.userText).toMatch(/^PLAYBOOK:/);
    expect(r.userText).toContain("GUIDANCE-EN");
    expect(r.sources.sort()).toEqual(["a1", "a2"]);
    expect(r.qa).toMatchObject({ store: "legacy", guide: { groupId: "g-treat" } });
  });

  it("an admin edit of one Q&A row creates no shard, so chat stays on the old index", async () => {
    const env = await oldIndex();
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await reindexQaRow(env, qaItem("t-en", "g-treat", "en", { question: "how do i get treatment", guidance: "EDITED", crisis: false }));
    log.mockRestore();
    expect(env.RL.store.has(shardKey(env, "en"))).toBe(false);
    const r = await chat(env, [u("i want to die")]);
    expect(r.userText).toContain("CRISIS-GUIDANCE");
    expect(r.qa.store).toBe("legacy");
  });

  it("mid-run: a language whose shard is written uses it, one still missing uses the old index", async () => {
    const env = await oldIndex();
    await emptyShards(env, ["he"]);
    for (const r of ROWS.filter((x) => x.langId === "he")) await reindexQaRow(env, r);
    expect((await chat(env, [u("איך מקבלים טיפול")], "he")).qa.store).toBe("shards"); // he: one shard, there
    expect((await chat(env, [u("where do i find a therapist")])).qa.store).toBe("legacy"); // en: missing
  });

  it("no old value and no shards: chat answers without playbooks", async () => {
    const env = await oldIndex();
    env.RL.store.delete(QA_INDEX_KEY);
    const r = await chat(env, [u("where do i find a therapist")]);
    expect(r.userText).toMatch(/^SOURCES:/);
    expect(r.sources.length).toBe(2);
  });

  it("once both shards exist, the old value is never read even while it still exists", async () => {
    const env = await oldIndex();
    await emptyShards(env);
    for (const r of ROWS) await reindexQaRow(env, r);
    const get = vi.spyOn(env.RL, "get");
    const r = await chat(env, [u("where do i find a therapist")]);
    expect(r.qa.store).toBe("shards");
    expect(get.mock.calls.map((c) => c[0])).not.toContain(QA_INDEX_KEY);
  });
});

describe("/chat cost on the shards", () => {
  // 175 Q&A rows (35 groups x 5 languages, 13 texts each, some crisis), like
  // the real set (175 rows, 2,350 texts), 1024 dims like bge-m3, so a shard is
  // real size (~470 KB) and KV rows carry a real-size retrieval vector.
  const pad = (v: number[]) => [...v, ...Array.from({ length: 1024 - v.length }, (_, i) => (i % 3) * 1e-4)];
  const table: Record<string, number[]> = { ...VEC, "i want to die": [Math.cos(7), Math.sin(7), 0.6, 0] };
  async function bigEnv(count: { n: number }, reads: { key: string; bytes: number }[]) {
    const env = baseEnv();
    env.AI.run.mockImplementation(async (_m: string, i: { text: string[] }) => ({ data: i.text.map((t) => pad(table[t] ?? contentVec(t))) }));
    await emptyShards(env);
    const langs = ["he", "en", "ar", "ru", "fr"];
    for (let g = 0; g < 35; g++) {
      for (const l of langs) {
        const texts = Array.from({ length: 13 }, (_, k) => `g${g} ${l} text ${k}`);
        texts.forEach((t, k) => { table[t] = [Math.cos(g + k / 50), Math.sin(g + k / 50), g % 7 === 0 ? 0.5 : 0, 0.01 * k]; });
        // The longest real row is ~5.9 KB of text; this one is ~6.4 KB of Hebrew.
        await reindexQaRow(env, qaItem(`r-${g}-${l}`, `g-${g}`, l, {
          question: texts[0], paraphrases: texts.slice(1), guidance: "שורת הנחיה. ".repeat(180), answer: "תשובה. ".repeat(160), crisis: g % 7 === 0,
        }));
      }
    }
    for (let i = 0; i < 300; i++) {
      await env.VECTORIZE.upsert([{ id: `a${i}:0`, values: pad(contentVec(`a${i}`)), metadata: { itemId: `a${i}`, groupId: "g", type: "faq", langId: "en", title: "T", text: "x".repeat(1500), chunkIndex: 0, categorySlug: "rights" } }]);
    }
    const run = env.AI.run.getMockImplementation();
    env.AI.run.mockImplementation(async (...x: any[]) => { count.n++; return run(...x); });
    const store = env.VECTORIZE;
    const counted = (f: (...a: any[]) => any) => async (...a: any[]) => { count.n++; return f(...a); };
    env.VECTORIZE = { query: counted(store.query), getByIds: counted(store.getByIds), upsert: counted(store.upsert), deleteByIds: counted(store.deleteByIds) };
    const kv = env.RL;
    env.RL = {
      get: async (k: string, o?: unknown) => { count.n++; const v = await kv.get(k, o as any); reads.push({ key: k, bytes: v ? kv.bytes(k) : 0 }); return v; },
      put: counted(kv.put), delete: counted(kv.delete), list: counted(kv.list),
    };
    return { env, kv };
  }

  it("reads at most 2 shards plus small KV rows, no value over 3 MB, at most 14 subrequests, in the worst case", async () => {
    const count = { n: 0 };
    const reads: { key: string; bytes: number }[] = [];
    const { env, kv } = await bigEnv(count, reads);
    expect(kv.bytes(shardKey(env, "en"))).toBeGreaterThan(400 * 1024);
    count.n = 0;
    // Crisis, a follow-up turn, three playbooks (crisis, carried, current), a guided query.
    const r = await chat(env, [u("g1 en text 0"), a("how old?"), u("i want to die")]);
    const subrequests = count.n + r.fetches;
    expect(r.userText).toContain("CRISIS PLAYBOOK");
    expect(r.qa).toMatchObject({ store: "shards", carried: { groupId: "g-1" }, crisis: { groupId: "g-7" }, guide: { groupId: "g-7" } });
    expect(r.body).toContain("event: sources");
    const shardReads = reads.filter((x) => x.key.includes(":vec:"));
    expect(shardReads.map((x) => x.key).sort()).toEqual([shardKey(env, "en"), shardKey(env, "he")]);
    expect(Math.max(...reads.map((x) => x.bytes))).toBeLessThan(3 * 1024 * 1024);
    expect(Math.max(...reads.filter((x) => !x.key.includes(":vec:")).map((x) => x.bytes))).toBeLessThan(16 * 1024);
    expect(reads.map((x) => x.key)).not.toContain(QA_INDEX_KEY);
    expect(subrequests).toBeLessThanOrEqual(14);
  });

  it("a plain question: rate limit (2 KV) + embed + 2 shards + content query + its KV rows + guided query + Gemini", async () => {
    const count = { n: 0 };
    const { env } = await bigEnv(count, []);
    count.n = 0;
    const r = await chat(env, [u("g3 en text 2")]);
    expect(r.qa).toMatchObject({ used: { groupId: "g-3", strength: "strong" } });
    // 2 rate limit + 1 embed + 2 shards (en, he) + 1 content + 2 KV rows (en, he) + 1 guided + 1 Gemini
    expect(count.n + r.fetches).toBe(10);
    // The next chat in the same isolate reads no shard (60 s cache).
    count.n = 0;
    const again = await chat(env, [u("g4 en text 1")]);
    expect(count.n + again.fetches).toBe(8);
  });

  it("CPU: decoding a shard is a header parse, matching is one int8 pass per query vector", async () => {
    const { env, kv } = await bigEnv({ n: 0 }, []);
    const lang = "en";
    const q = (s: string) => pad(table[s]);
    const input = { qv: q("i want to die"), prevVec: q("g1 en text 0"), crisisVec: q("g2 en text 3"), lang, crisis: true };
    const th = { strong: 0.8, weak: 0.72 };
    const times: { load: number; find: number }[] = [];
    for (let i = 0; i < 30; i++) {
      // A fresh RL object per round: no isolate cache, like a cold isolate.
      const e = { ...env, RL: { get: kv.get, put: kv.put, delete: kv.delete, list: kv.list } };
      const t0 = performance.now();
      const store = await loadPlaybookStore(e, lang);
      const t1 = performance.now();
      await findPlaybooks(e, store!, input, th);
      times.push({ load: t1 - t0, find: performance.now() - t1 });
    }
    const warm = times.slice(5);
    const med = (xs: number[]) => xs.sort((x, y) => x - y)[xs.length >> 1];
    const load = med(warm.map((x) => x.load));
    const find = med(warm.map((x) => x.find));
    console.log(`chat playbook CPU (2 shards, ${2 * 35 * 13} vectors, worst case: 3 query vectors): load ${load.toFixed(2)} ms, match ${find.toFixed(2)} ms (median, node)`);
    expect(load + find).toBeLessThan(10); // loose: shared CI machines are noisy
  });
});
