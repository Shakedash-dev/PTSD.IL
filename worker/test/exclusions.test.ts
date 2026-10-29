import { describe, it, expect, vi, afterEach } from "vitest";
import { isIndexable, isQaItem, METIV_CHATBOT_SLUGS, METIV_COLLECTION_KEYS, EXCLUDED_SLUGS } from "../src/lib/api";
import { reindexItem, reindexById } from "../src/lib/ingest";
import { runFullReindex, corpusResponse } from "./reindex";
import { qaRowKey, shardKey } from "../src/lib/qa";
import { decodeShard } from "../src/lib/qaShard";
import { emptyShards } from "./qaEnv";
import type { Item } from "../src/lib/content";
import { fakeKV } from "./kv";
import { fakeVectorize } from "./vectorize";

afterEach(() => vi.restoreAllMocks());

const it_ = (slugs: string[]) => ({ categorySlug: slugs.find((s) => s !== "metiv") ?? slugs[0], categorySlugs: slugs });

describe("METIV_CHATBOT_SLUGS", () => {
  it("equals the registry's chatbot:true slugs", async () => {
    const url = new URL("../../src/pages/metiv-demos/v3/content/registry.js", (import.meta as unknown as { url: string }).url).href;
    const reg = (await import(url)) as { CHATBOT_SLUGS: string[] };
    expect([...METIV_CHATBOT_SLUGS].sort()).toEqual([...reg.CHATBOT_SLUGS].sort());
  });
});

describe("METIV_COLLECTION_KEYS", () => {
  it("maps every registry slug to its key (and nothing else)", async () => {
    const url = new URL("../../src/pages/metiv-demos/v3/content/registry.js", (import.meta as unknown as { url: string }).url).href;
    const reg = (await import(url)) as { COLLECTIONS: Array<{ key: string; slug: string }> };
    const expected = Object.fromEntries(reg.COLLECTIONS.map((c) => [c.slug, c.key]));
    expect(METIV_COLLECTION_KEYS).toEqual(expected);
  });
});

describe("isIndexable", () => {
  it("keeps PTSD-IL rows (legal included) and rows with no category", () => {
    expect(isIndexable(it_(["rights"]))).toBe(true);
    expect(isIndexable(it_(["legal"]))).toBe(true);
    expect(isIndexable({})).toBe(true);
    expect(isIndexable({ categorySlug: "community" })).toBe(true);
  });

  it("drops every excluded category", () => {
    for (const s of EXCLUDED_SLUGS) expect(isIndexable(it_([s]))).toBe(false);
    expect(isIndexable(it_(["metiv", "metiv-copy"]))).toBe(false);
  });

  it("keeps a Metiv row only when one of its collections is chatbot-flagged", () => {
    expect(isIndexable(it_(["metiv", "metiv-services"]))).toBe(true);
    expect(isIndexable(it_(["metiv-veterans", "metiv"]))).toBe(true);
    for (const s of ["metiv-courses", "metiv-events", "metiv-papers", "metiv-team", "metiv-about", "metiv-legal-docs", "metiv-therapist-hub"]) {
      expect(isIndexable(it_(["metiv", s]))).toBe(true);
    }
    expect(isIndexable(it_(["metiv", "metiv-nav"]))).toBe(false);
    expect(isIndexable(it_(["metiv"]))).toBe(false);
    expect(isIndexable(it_(["metiv-route-meta"]))).toBe(false); // child without the parent is still Metiv
  });

  it("leaves only navigation and taxonomy collections out", async () => {
    const url = new URL("../../src/pages/metiv-demos/v3/content/registry.js", (import.meta as unknown as { url: string }).url).href;
    const reg = (await import(url)) as { COLLECTIONS: Array<{ key: string; slug: string }> };
    const out = reg.COLLECTIONS.filter((c) => !METIV_CHATBOT_SLUGS.includes(c.slug)).map((c) => c.key).sort();
    expect(out).toEqual(["COURSE_CATEGORIES", "NAV", "NEXT_STEPS", "PAPER_TOPICS", "PATIENT_NAV", "ROUTE_META", "TEAM_GROUPS"]);
  });

  it("isQaItem matches chatbot-qa only", () => {
    expect(isQaItem(it_(["chatbot-qa"]))).toBe(true);
    expect(isQaItem(it_(["rights"]))).toBe(false);
  });
});

function vectorizeMock() {
  return { upsert: vi.fn(async () => ({ mutationId: "m" })), deleteByIds: vi.fn(async () => ({ mutationId: "m" })) };
}
const aiMock = () => ({ run: vi.fn(async (_m: string, i: { text: string[] }) => ({ data: i.text.map(() => [0.1, 0.2]) })) });

describe("reindexItem on an excluded row", () => {
  it("deletes its vectors and upserts nothing", async () => {
    const v = vectorizeMock();
    const env = { AI: aiMock(), VECTORIZE: v } as any;
    const item: Item = { id: "c1", groupId: "g", type: "article", langId: "he", title: "תפריט", content: JSON.stringify({ label: "טקסט" }), ...it_(["metiv", "metiv-nav"]) };
    expect(await reindexItem(env, item)).toEqual({ upserted: 0 });
    expect(v.deleteByIds).toHaveBeenCalledTimes(1);
    expect(v.upsert).not.toHaveBeenCalled();
    expect(env.AI.run).not.toHaveBeenCalled();
  });
});

const row = (id: string, slugs: string[], content: Record<string, unknown>, langId = "he") => ({
  id, groupId: `g-${id}`, type: "article", langId, title: `T ${id}`, isPublished: true,
  content: JSON.stringify(content), categories: slugs.map((slug) => ({ slug })),
});

describe("full reindex exclusions + QA rows", () => {
  it("indexes PTSD-IL and chatbot Metiv rows, deletes excluded ones' vectors, writes the Q&A row", async () => {
    const articles = [
      row("ptsd", ["rights"], { answer: "זכויות" }),
      row("svc", ["metiv", "metiv-services"], { _key: "svc-key", title: "טיפול", $ref: "X#y", body: "שירות" }),
      row("course", ["metiv", "metiv-courses"], { _key: "cbt-trauma", slug: "cbt-trauma", body: "קורס" }),
      row("nav", ["metiv", "metiv-nav"], { label: "תפריט" }),
      row("copy", ["metiv", "metiv-copy"], { hello: "שלום" }),
      row("log", ["admin-log"], { entry: "edit" }),
      row("status", ["admin-status"], { saving: true }),
      row("qa", ["chatbot-qa"], { question: "איך מקבלים טיפול?", paraphrases: ["איפה יש טיפול?"], guidance: "קודם X ואז Y", crisis: false }),
    ];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url: any) => corpusResponse({ articles, communities: [] }, String(url))!);
    const v = fakeVectorize();
    const rl = fakeKV();
    const env = { API_BASE: "https://api/x", AI: aiMock(), VECTORIZE: v, RL: rl } as any;

    const out = await runFullReindex(env);

    const content = v.inNs(undefined) as Array<{ id: string; metadata: any }>;
    expect(v.store.size).toBe(content.length); // nothing in any namespace
    expect([...new Set(content.map((r) => r.metadata.itemId))].sort()).toEqual(["course", "ptsd", "svc"]);
    const course = content.find((r) => r.metadata.itemId === "course")!;
    expect(course.metadata.key).toBe("cbt-trauma"); // `_key` in metadata, for chip deep links
    expect(content.find((r) => r.metadata.itemId === "ptsd")!.metadata.key).toBeUndefined();
    const svc = content.find((r) => r.metadata.itemId === "svc")!;
    expect(svc.metadata.categorySlug).toBe("metiv-services");
    expect(svc.metadata.categorySlugs).toEqual(["metiv", "metiv-services"]);
    expect(svc.metadata.text).not.toContain("svc-key"); // `_` keys skipped
    expect(svc.metadata.text).not.toContain("X#y"); // $ref skipped

    const deleted = v.calls.filter((c) => c.op === "deleteByIds").flatMap((c) => c.arg as string[]);
    for (const id of ["nav", "copy", "log", "status", "qa"]) expect(deleted).toContain(`${id}:0`);
    expect(deleted.some((d) => /^(ptsd|svc|course):/.test(d))).toBe(false);

    expect(out).toMatchObject({ excluded: 5, qa: 1 });
    expect(decodeShard(rl.store.get(shardKey(env, "he")) as ArrayBuffer)!.header.rows).toMatchObject([{ id: "qa", g: "g-qa", n: 2 }]);
    expect(JSON.parse(rl.text(qaRowKey(env, "g-qa", "he"))!).guidance).toBe("קודם X ואז Y");
  });
});

describe("reindexById for Q&A rows", () => {
  it("writes only that row's shard entries and KV row, never the whole Q&A set", async () => {
    const qaRow = row("qa1", ["chatbot-qa"], { question: "q", paraphrases: ["p"], guidance: "g", crisis: true }, "en");
    const urls: string[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url: any) => {
      urls.push(String(url));
      if (String(url).endsWith("/articles/qa1")) return new Response(JSON.stringify(qaRow), { status: 200 });
      return new Response("nf", { status: 404 });
    });
    const v = fakeVectorize();
    const rl = fakeKV();
    const env = { API_BASE: "https://api/x", AI: aiMock(), VECTORIZE: v, RL: rl } as any;
    await emptyShards(env);
    const puts = vi.spyOn(rl, "put");

    expect(await reindexById(env, "qa1")).toEqual({ upserted: 0, qa: 1 });

    expect(urls).toEqual(["https://api/x/articles/qa1"]); // no fetch of the Q&A list
    expect(env.AI.run).toHaveBeenCalledTimes(1);
    expect(v.store.size).toBe(0);
    expect(puts.mock.calls.map((c) => c[0]).sort()).toEqual([qaRowKey(env, "g-qa1", "en"), shardKey(env, "en")]);
    expect(decodeShard(rl.store.get(shardKey(env, "en")) as ArrayBuffer)!.header.rows).toMatchObject([{ id: "qa1", c: 1, n: 2 }]);
    expect(JSON.parse(rl.text(qaRowKey(env, "g-qa1", "en"))!).crisis).toBe(true);
  });

  it("a deleted or unpublished Q&A row drops its shard entries and KV row", async () => {
    const qaRow = row("gone", ["chatbot-qa"], { question: "q", guidance: "g" });
    let published = true;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url: any) =>
      published && String(url).endsWith("/articles/gone") ? new Response(JSON.stringify(qaRow), { status: 200 }) : new Response("nf", { status: 404 }));
    const v = fakeVectorize();
    const rl = fakeKV();
    const env = { API_BASE: "https://api/x", AI: aiMock(), VECTORIZE: v, RL: rl } as any;
    await emptyShards(env);
    await reindexById(env, "gone");
    const he = () => decodeShard(rl.store.get(shardKey(env, "he")) as ArrayBuffer)!.header.rows.map((r) => r.id);
    expect(he()).toEqual(["gone"]);
    published = false;

    expect(await reindexById(env, "gone")).toEqual({ upserted: 0, qa: 0 });
    expect(he()).toEqual([]);
    expect(rl.store.has(qaRowKey(env, "g-gone", "he"))).toBe(false);
  });

  it("writes no KV when a deleted id was not a Q&A row (it only looks: 1 list + 5 shard gets)", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response("nf", { status: 404 }));
    const rl = fakeKV();
    const env = { API_BASE: "https://api/x", AI: aiMock(), VECTORIZE: fakeVectorize(), RL: rl } as any;
    await emptyShards(env);
    const put = vi.spyOn(rl, "put");
    const del = vi.spyOn(rl, "delete");
    const get = vi.spyOn(rl, "get");
    expect(await reindexById(env, "x")).toEqual({ upserted: 0 });
    expect(put).not.toHaveBeenCalled();
    expect(del).not.toHaveBeenCalled();
    expect(get).toHaveBeenCalledTimes(5);
  });
});

describe("Metiv $ref resolution during ingest", () => {
  const team = (name: string, role: string, langId = "he") =>
    row(`team-${name}-${langId}`, ["metiv", "metiv-team"], { _key: name, _col: "metiv-team", name, role }, langId);
  const rj = (langId = "he") => row(`rj-${langId}`, ["metiv", "metiv-rj-contacts"], {
    _key: "RELEASE_JOURNEY_CONTACTS", _col: "metiv-rj-contacts",
    applications: { $ref: "TEAM#יאיר ברין" }, director: { $ref: "TEAM#רחלי ברוקס" },
  }, langId);

  it("scope all: resolves refs from the same fetch, same language first then Hebrew", async () => {
    const articles = [
      team("יאיר ברין", "רכז פניות"), team("רחלי ברוקס", "מנהלת מסע שחרור"),
      team("יאיר ברין", "Intake coordinator", "en"), rj("he"), rj("en"),
    ];
    const urls: string[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url: any) => {
      urls.push(String(url));
      return corpusResponse({ articles, communities: [] }, String(url))!;
    });
    const v = fakeVectorize();
    await runFullReindex({ API_BASE: "https://api/x", AI: aiMock(), VECTORIZE: v, RL: fakeKV() } as any);

    // The Hebrew list is fetched for refs only by the English chunks step: its
    // director ref has no English row.
    expect(urls.filter((u) => u.includes("categorySlug=metiv&"))).toEqual(["https://api/x/articles?categorySlug=metiv&langId=he"]);
    const rows = v.inNs(undefined) as Array<{ metadata: any }>;
    expect(rows.some((r) => r.metadata.itemId.startsWith("team-"))).toBe(true); // TEAM is indexed on its own too
    const he = rows.find((r) => r.metadata.itemId === "rj-he")!.metadata.text;
    expect(he).toContain("רכז פניות");
    expect(he).toContain("מנהלת מסע שחרור");
    const en = rows.find((r) => r.metadata.itemId === "rj-en")!.metadata.text;
    expect(en).toContain("Intake coordinator");
    expect(en).toContain("מנהלת מסע שחרור"); // no English row: Hebrew fallback
  });

  it("scope item: fetches the row's language once, and Hebrew only for missing refs", async () => {
    const urls: string[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url: any) => {
      const u = String(url);
      urls.push(u);
      if (u.endsWith("/articles/rj-en")) return new Response(JSON.stringify(rj("en")), { status: 200 });
      if (u.endsWith("categorySlug=metiv&langId=en")) return new Response(JSON.stringify([team("יאיר ברין", "Intake coordinator", "en"), rj("en")]), { status: 200 });
      if (u.endsWith("categorySlug=metiv&langId=he")) return new Response(JSON.stringify([team("יאיר ברין", "רכז פניות"), team("רחלי ברוקס", "מנהלת מסע שחרור")]), { status: 200 });
      return new Response("nf", { status: 404 });
    });
    const v = vectorizeMock();
    const out = await reindexById({ API_BASE: "https://api/x", AI: aiMock(), VECTORIZE: v, RL: fakeKV() } as any, "rj-en");

    expect(out.upserted).toBeGreaterThan(0);
    expect(urls.filter((u) => u.includes("categorySlug=metiv&"))).toEqual([
      "https://api/x/articles?categorySlug=metiv&langId=en",
      "https://api/x/articles?categorySlug=metiv&langId=he",
    ]);
    const text = ((v.upsert.mock.calls[0] as unknown[])[0] as Array<{ metadata: any }>)[0].metadata.text;
    expect(text).toContain("Intake coordinator");
    expect(text).toContain("מנהלת מסע שחרור");
    expect(text).not.toContain("רכז פניות");
  });

  it("scope item: no extra fetch for a row without refs, or a Hebrew row whose refs all resolve", async () => {
    const urls: string[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url: any) => {
      const u = String(url);
      urls.push(u);
      if (u.endsWith("/articles/rj-he")) return new Response(JSON.stringify(rj("he")), { status: 200 });
      if (u.endsWith("/articles/plain")) return new Response(JSON.stringify(row("plain", ["metiv", "metiv-services"], { _key: "p", body: "שירות" })), { status: 200 });
      if (u.endsWith("categorySlug=metiv&langId=he")) return new Response(JSON.stringify([team("יאיר ברין", "רכז פניות")]), { status: 200 });
      return new Response("nf", { status: 404 });
    });
    const env = { API_BASE: "https://api/x", AI: aiMock(), VECTORIZE: vectorizeMock(), RL: fakeKV() } as any;
    await reindexById(env, "plain");
    expect(urls).toEqual(["https://api/x/articles/plain"]);
    urls.length = 0;
    await reindexById(env, "rj-he");
    expect(urls).toEqual(["https://api/x/articles/rj-he", "https://api/x/articles?categorySlug=metiv&langId=he"]);
  });
});
