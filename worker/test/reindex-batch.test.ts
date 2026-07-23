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
    }));
    const aiRun = vi.fn(async (_m: string, inp: { text: string[] }) => ({ data: inp.text.map(() => [0.1, 0.2]) }));
    const upsert = vi.fn(async () => ({ mutationId: "m" }));
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(items), { status: 200 }));
    const env = { API_BASE: "https://api/x", AI: { run: aiRun }, VECTORIZE: { upsert } } as any;

    const out = await reindexAll(env);

    expect(out.upserted).toBe(120);
    // 120 chunks / 50-per-embed-batch = 3 embed subrequests (50, 50, 20)
    expect(aiRun).toHaveBeenCalledTimes(3);
    // 120 vectors / 500-per-upsert-batch = 1 upsert subrequest
    expect(upsert).toHaveBeenCalledTimes(1);
    // total subrequests = 1 fetch + 3 embed + 1 upsert = 5, far under the 50 cap
    const firstBatch = (upsert.mock.calls[0] as unknown[])[0] as Array<{ id: string; metadata: { itemId: string } }>;
    expect(firstBatch).toHaveLength(120);
    expect(firstBatch[0].id).toBe("0:0");
    expect(firstBatch[0].metadata.itemId).toBe("0");
  });

  it("returns upserted:0 and makes no AI/upsert calls when there are no items", async () => {
    const aiRun = vi.fn();
    const upsert = vi.fn();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
    const env = { API_BASE: "https://api/x", AI: { run: aiRun }, VECTORIZE: { upsert } } as any;

    const out = await reindexAll(env);
    expect(out.upserted).toBe(0);
    expect(aiRun).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });
});
