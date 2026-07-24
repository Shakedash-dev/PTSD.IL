import { describe, it, expect, vi, afterEach } from "vitest";
import { reindexAll } from "../src/lib/ingest";

afterEach(() => vi.restoreAllMocks());

describe("reindexAll (batched bulk path)", () => {
  it("batches embeds and upserts so a large corpus stays under the subrequest limit", async () => {
    // 120 published items, each short enough to yield exactly one chunk → 120 chunks.
    const items = Array.from({ length: 120 }, (_, i) => ({
      id: String(i), groupId: "g", type: "faq", langId: "he", title: `T${i}`,
      content: JSON.stringify({ answer: `answer text number ${i}` }),
      isPublished: true,
      categories: [{ id: "cat-1", slug: "rights", name: "Rights" }],
    }));
    // reindexAll now hits two endpoints (/articles + /communities); mock per-URL
    // so only the article corpus contributes here (communities covered below).
    const aiRun = vi.fn(async (_m: string, inp: { text: string[] }) => ({ data: inp.text.map(() => [0.1, 0.2]) }));
    const upsert = vi.fn(async () => ({ mutationId: "m" }));
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url: any) =>
      new Response(JSON.stringify(String(url).endsWith("/communities") ? [] : items), { status: 200 })
    );
    const env = { API_BASE: "https://api/x", AI: { run: aiRun }, VECTORIZE: { upsert } } as any;

    const out = await reindexAll(env);

    expect(out.upserted).toBe(120);
    // 120 chunks / 50-per-embed-batch = 3 embed subrequests (50, 50, 20)
    expect(aiRun).toHaveBeenCalledTimes(3);
    // 120 vectors / 500-per-upsert-batch = 1 upsert subrequest
    expect(upsert).toHaveBeenCalledTimes(1);
    // total subrequests = 1 fetch + 3 embed + 1 upsert = 5, far under the 50 cap
    const firstBatch = (upsert.mock.calls[0] as unknown[])[0] as Array<{ id: string; metadata: { itemId: string; categorySlug?: string } }>;
    expect(firstBatch).toHaveLength(120);
    expect(firstBatch[0].id).toBe("0:0");
    expect(firstBatch[0].metadata.itemId).toBe("0");
    expect(firstBatch[0].metadata.categorySlug).toBe("rights");
  });

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
    const env = { API_BASE: "https://api/x", AI: { run: aiRun }, VECTORIZE: { upsert } } as any;

    const out = await reindexAll(env);

    const rows = (upsert.mock.calls[0] as unknown[])[0] as Array<{ id: string; metadata: { type: string; itemId: string; langId: string } }>;
    const community = rows.find((r) => r.metadata.type === "community");
    expect(community).toBeDefined();
    expect(community!.metadata.itemId).toBe("c1");
    expect(community!.metadata.langId).toBe("en");
    // the inactive community (c2) must not be indexed
    expect(rows.some((r) => r.metadata.itemId === "c2")).toBe(false);
    expect(out.upserted).toBe(rows.length);
  });

  it("returns upserted:0 and makes no AI/upsert calls when there are no items", async () => {
    const aiRun = vi.fn();
    const upsert = vi.fn();
    // fresh Response per call — reindexAll now fetches two endpoints and a single
    // Response body can only be read once.
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response(JSON.stringify([]), { status: 200 }));
    const env = { API_BASE: "https://api/x", AI: { run: aiRun }, VECTORIZE: { upsert } } as any;

    const out = await reindexAll(env);
    expect(out.upserted).toBe(0);
    expect(aiRun).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });
});
