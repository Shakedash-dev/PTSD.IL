import { describe, it, expect, vi, afterEach } from "vitest";
import app from "../src/index";
import { chunkItem, reindexStep, STEP_BUDGET } from "../src/lib/ingest";
import { buildQaIndex, QA_INDEX_KEY } from "../src/lib/qa";
import type { Item } from "../src/lib/content";
import { fakeKV } from "./kv";
import { runFullReindex } from "./reindex";

afterEach(() => vi.restoreAllMocks());

// Cloudflare's cap is 50 per invocation; anything past 45 fails the call here.
const HARD_LIMIT = 45;

// Deterministic fake bge-m3 vector per text, so QA indexes can be compared.
const vecOf = (t: string) => {
  let h = 0;
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) % 9973;
  return [t.length, h, t.charCodeAt(0) || 1, 1];
};

type Upserted = { id: string; values: number[]; metadata: Record<string, unknown> };

// A Worker env whose every subrequest (fetch, AI, Vectorize, KV) is counted per
// invocation and throws past HARD_LIMIT, like the platform does.
function countingEnv(articles: unknown[], communities: unknown[] = []) {
  const count = { n: 0 };
  const hit = () => {
    if (++count.n > HARD_LIMIT) throw new Error("Too many subrequests by single Worker invocation");
  };
  const kv = fakeKV();
  const kvPuts: string[] = [];
  const upserts: Upserted[][] = [];
  const deletes: string[][] = [];
  const embeds: number[] = [];
  const corpus = { articles, communities };
  vi.spyOn(globalThis, "fetch").mockImplementation(async (url: any) => {
    hit();
    const u = String(url);
    if (u === "https://api/x/admin/whoami") return new Response("{}", { status: 200 });
    return new Response(JSON.stringify(u.endsWith("/communities") ? corpus.communities : corpus.articles), { status: 200 });
  });
  const env = {
    API_BASE: "https://api/x", ADMIN_VERIFY_URL: "https://api/x/admin/whoami", SITE_ORIGIN: "https://site",
    AI: { run: async (_m: string, i: { text: string[] }) => { hit(); embeds.push(i.text.length); return { data: i.text.map(vecOf) }; } },
    VECTORIZE: {
      upsert: async (rows: Upserted[]) => { hit(); upserts.push(rows); return { mutationId: "m" }; },
      deleteByIds: async (ids: string[]) => { hit(); deletes.push(ids); return { mutationId: "m" }; },
    },
    RL: {
      get: async (k: string) => { hit(); return kv.get(k); },
      put: async (k: string, v: string) => { hit(); kvPuts.push(k); return kv.put(k, v); },
      delete: async (k: string) => { hit(); return kv.delete(k); },
    },
  } as any;
  return { env, count, kv, kvPuts, upserts, deletes, embeds, corpus };
}

// One POST /reindex through the router (admin check included), counted on its own.
async function post(t: ReturnType<typeof countingEnv>, body: unknown) {
  t.count.n = 0;
  const res = await app.request("/reindex", {
    method: "POST", body: JSON.stringify(body),
    headers: { "content-type": "application/json", Authorization: "Bearer t" },
  }, t.env);
  return { status: res.status, json: (await res.json()) as any, subrequests: t.count.n };
}

async function loop(t: ReturnType<typeof countingEnv>, onStep?: (i: number) => void) {
  const steps: Awaited<ReturnType<typeof post>>[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < 100; i++) {
    onStep?.(i);
    const r = await post(t, { scope: "all", ...(cursor ? { cursor } : {}) });
    expect(r.status, JSON.stringify(r.json)).toBe(200);
    steps.push(r);
    if (r.json.done) return steps;
    cursor = r.json.cursor;
  }
  throw new Error("reindex did not terminate");
}

const asRaw = (i: Item) => ({ ...i, isPublished: true, categories: (i.categorySlugs ?? []).map((slug) => ({ slug })) });
const item = (id: string, slugs: string[], content: Record<string, unknown>, langId = "he"): Item => ({
  id, groupId: `g-${id}`, type: "article", langId, title: `T ${id}`, content: JSON.stringify(content),
  categorySlug: slugs.find((s) => s !== "metiv") ?? slugs[0], categorySlugs: slugs,
});
const qaItem = (i: number, paraphrases: number) => item(`qa${i}`, ["chatbot-qa"], {
  question: `question ${i}`, paraphrases: Array.from({ length: paraphrases }, (_, k) => `question ${i} said another way ${k}`),
  guidance: `guidance ${i}`, crisis: i % 7 === 0,
}, ["he", "en", "ar", "ru", "fr"][i % 5]);

// What the old one-shot reindexAll upserted for an item: its chunks, with this metadata.
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

const withoutBuiltAt = (raw: string) => {
  const { builtAt: _b, ...rest } = JSON.parse(raw);
  return rest;
};

async function referenceQa(qaItems: Item[]) {
  const ref = { AI: { run: async (_m: string, i: { text: string[] }) => ({ data: i.text.map(vecOf) }) }, RL: fakeKV() } as any;
  await buildQaIndex(ref, qaItems);
  return withoutBuiltAt(ref.RL.store.get(QA_INDEX_KEY));
}

describe("stepped full reindex (POST /reindex scope all)", () => {
  it("keeps every call under budget on a corpus far past one invocation, with the old one-shot result", async () => {
    // 3,480 one-chunk PTSD-IL rows + 20 Metiv courses = 3,500 chunks.
    const content = [
      ...Array.from({ length: 3480 }, (_, i) => item(`a${i}`, ["rights"], { answer: `answer text number ${i}` })),
      ...Array.from({ length: 20 }, (_, i) => item(`c${i}`, ["metiv", "metiv-courses"], { _key: `course-${i}`, body: `course ${i}` })),
    ];
    // 500 Q&A rows x 5 texts = 2,500 playbook texts.
    const qa = Array.from({ length: 500 }, (_, i) => qaItem(i, 4));
    // 500 navigation rows: 5 stale ids each (1 chunk + margin 4) = 2,500, plus the Q&A rows' own.
    const nav = Array.from({ length: 500 }, (_, i) => item(`n${i}`, ["metiv", "metiv-nav"], { label: `menu ${i}` }));
    const t = countingEnv([...content, ...qa, ...nav].map(asRaw));

    const steps = await loop(t);

    expect(steps.length).toBeGreaterThan(2);
    for (const s of steps) expect(s.subrequests).toBeLessThanOrEqual(STEP_BUDGET);
    for (const s of steps.slice(0, -1)) {
      expect(s.json.done).toBe(false);
      expect(typeof s.json.cursor).toBe("string");
    }
    const last = steps.at(-1)!.json;
    expect(last).toMatchObject({ ok: true, done: true, upserted: 3500, excluded: 1000, qa: 500, progress: { phase: "chunks", processed: 3500, total: 3500 } });
    expect(last.cursor).toBeUndefined();

    // Chunks: every one upserted exactly once, same ids and metadata as before.
    const rows = t.upserts.flat();
    expect(rows).toHaveLength(3500);
    for (const batch of t.upserts) expect(batch.length).toBeLessThanOrEqual(1000);
    const got = new Map(rows.map((r) => [r.id, r.metadata]));
    expect(got.size).toBe(3500);
    for (const e of expectedRows(content)) expect(got.get(e.id)).toEqual(e.metadata);
    expect(t.embeds.every((n) => n <= 100)).toBe(true);

    // Stale ids of every excluded row, in batches of at most 100.
    const deleted = t.deletes.flat();
    for (const b of t.deletes) expect(b.length).toBeLessThanOrEqual(100);
    const stale = [...nav, ...qa].flatMap((it) => Array.from({ length: chunkItem(it).length + 4 }, (_, k) => `${it.id}:${k}`));
    expect(stale.length).toBeGreaterThanOrEqual(5000);
    expect(new Set(deleted)).toEqual(new Set(stale));
    expect(deleted).toHaveLength(stale.length);

    // Playbook index: written to the real key once, equal to the one-shot build.
    expect(t.kvPuts.filter((k) => k === QA_INDEX_KEY)).toHaveLength(1);
    expect(withoutBuiltAt(t.kv.store.get(QA_INDEX_KEY)!)).toEqual(await referenceQa(qa));
    expect([...t.kv.store.keys()]).toEqual([QA_INDEX_KEY]);
  });

  it("builds a playbook index too big for one call in temporary parts, publishing it only at the end", async () => {
    // 1,600 rows x 5 texts = 8,000 texts: 80 embedding calls, more than one step.
    const qa = Array.from({ length: 1600 }, (_, i) => qaItem(i, 4));
    const t = countingEnv([item("a", ["rights"], { answer: "x" }), ...qa].map(asRaw));
    const seen: string[][] = [];

    const steps = await loop(t, () => seen.push([...t.kv.store.keys()]));

    for (const s of steps) expect(s.subrequests).toBeLessThanOrEqual(STEP_BUDGET);
    const qaSteps = steps.filter((s) => !s.json.done && s.json.progress.phase === "qa");
    expect(qaSteps.length).toBeGreaterThanOrEqual(2);
    // Before the finishing step, chat's key does not exist; only build parts do.
    for (const keys of seen.slice(0, qaSteps.length + 1)) {
      expect(keys).not.toContain(QA_INDEX_KEY);
      for (const k of keys) expect(k.startsWith(`${QA_INDEX_KEY}:build:`)).toBe(true);
    }
    expect(seen[qaSteps.length]!.length).toBe(qaSteps.length);
    expect(t.kvPuts.filter((k) => k === QA_INDEX_KEY)).toHaveLength(1);
    expect(withoutBuiltAt(t.kv.store.get(QA_INDEX_KEY)!)).toEqual(await referenceQa(qa));
    expect([...t.kv.store.keys()]).toEqual([QA_INDEX_KEY]); // parts deleted
  });

  it("restarts a phase when the corpus changes under it", async () => {
    const content = Array.from({ length: 4000 }, (_, i) => item(`a${i}`, ["rights"], { answer: `answer ${i}` }));
    const t = countingEnv(content.map(asRaw));
    let dropped = false;
    const steps = await loop(t, (i) => {
      if (i === 1 && !dropped) {
        // An item before the cursor is deleted: offsets shift, so chunks start over.
        t.corpus.articles = content.slice(1).map(asRaw);
        dropped = true;
      }
    });
    expect(steps[0].json.progress).toMatchObject({ phase: "chunks", processed: expect.any(Number) });
    expect(steps[0].json.progress.processed).toBeGreaterThan(0);
    expect(steps[1].json.progress.processed).toBeLessThanOrEqual(steps[0].json.progress.processed);
    const ids = new Set(t.upserts.flat().map((r) => r.id));
    for (let i = 1; i < 4000; i++) expect(ids.has(`a${i}:0`)).toBe(true);
    expect(steps.at(-1)!.json).toMatchObject({ done: true, upserted: 3999 });
  });

  it("rejects a malformed cursor with 400 and leaves item reindex as it was", async () => {
    const t = countingEnv([]);
    expect((await post(t, { scope: "all", cursor: "not-a-cursor" })).status).toBe(400);
    expect((await post(t, { scope: "all", cursor: 5 })).status).toBe(400);
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
    const aiRun = vi.fn(async (_m: string, inp: { text: string[] }) => ({ data: inp.text.map(() => [0.1, 0.2]) }));
    const upsert = vi.fn(async () => ({ mutationId: "m" }));
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url: any) =>
      new Response(JSON.stringify(String(url).endsWith("/communities") ? communities : articles), { status: 200 })
    );
    const env = { API_BASE: "https://api/x", AI: { run: aiRun }, VECTORIZE: { upsert, deleteByIds: vi.fn() }, RL: fakeKV() } as any;

    const out = await runFullReindex(env);

    expect(out.steps).toHaveLength(1);
    const rows = (upsert.mock.calls[0] as unknown[])[0] as Array<{ id: string; metadata: { type: string; itemId: string; langId: string } }>;
    const community = rows.find((r) => r.metadata.type === "community");
    expect(community).toBeDefined();
    expect(community!.metadata.itemId).toBe("c1");
    expect(community!.metadata.langId).toBe("en");
    // the inactive community (c2) must not be indexed
    expect(rows.some((r) => r.metadata.itemId === "c2")).toBe(false);
    expect(out.upserted).toBe(rows.length);
  });

  it("finishes in one step with upserted:0 and no AI/upsert calls when there are no items", async () => {
    const aiRun = vi.fn();
    const upsert = vi.fn();
    // fresh Response per call - a single Response body can only be read once.
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response(JSON.stringify([]), { status: 200 }));
    const env = { API_BASE: "https://api/x", AI: { run: aiRun }, VECTORIZE: { upsert, deleteByIds: vi.fn() }, RL: fakeKV() } as any;

    const out = await reindexStep(env);
    expect(out).toMatchObject({ done: true, upserted: 0, excluded: 0, qa: 0 });
    expect(aiRun).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
    expect(JSON.parse(env.RL.store.get(QA_INDEX_KEY)).entries).toEqual([]); // empty index still written
  });
});
