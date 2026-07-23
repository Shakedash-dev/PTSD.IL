import { describe, it, expect, vi } from "vitest";
import { upsertItemChunks, query, deleteItem, type ChunkMeta } from "../src/lib/vector";

const meta: ChunkMeta = { itemId: "1", groupId: "g", type: "faq", langId: "he", title: "T", text: "hello", chunkIndex: 0 };

describe("vector", () => {
  it("upsert builds id-prefixed vectors with metadata", async () => {
    const upsert = vi.fn(async () => ({ mutationId: "m" }));
    const index = { upsert } as unknown as VectorizeIndex;
    await upsertItemChunks(index, "1", [[0.1, 0.2]], [meta]);
    expect(upsert).toHaveBeenCalledWith([{ id: "1:0", values: [0.1, 0.2], metadata: meta }]);
  });

  it("upsert builds multiple id-prefixed rows in order", async () => {
    const upsert = vi.fn(async () => ({ mutationId: "m" }));
    const index = { upsert } as unknown as VectorizeIndex;
    const meta2: ChunkMeta = { ...meta, chunkIndex: 1, text: "world" };
    await upsertItemChunks(index, "1", [[0.1, 0.2], [0.3, 0.4]], [meta, meta2]);
    expect(upsert).toHaveBeenCalledWith([
      { id: "1:0", values: [0.1, 0.2], metadata: meta },
      { id: "1:1", values: [0.3, 0.4], metadata: meta2 },
    ]);
  });

  it("upsert with empty vectors does not call index.upsert", async () => {
    const upsert = vi.fn(async () => ({ mutationId: "m" }));
    const index = { upsert } as unknown as VectorizeIndex;
    await upsertItemChunks(index, "1", [], []);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("query maps matches to {score, meta}", async () => {
    const index = {
      query: vi.fn(async () => ({ matches: [{ score: 0.9, metadata: meta }] })),
    } as unknown as VectorizeIndex;
    const hits = await query(index, [0.1, 0.2], 5);
    expect(hits).toEqual([{ score: 0.9, meta }]);
  });

  it("query calls index.query with vector, topK, and returnMetadata", async () => {
    const queryFn = vi.fn(async () => ({ matches: [] }));
    const index = { query: queryFn } as unknown as VectorizeIndex;
    await query(index, [0.1, 0.2], 5);
    expect(queryFn).toHaveBeenCalledWith([0.1, 0.2], { topK: 5, returnMetadata: "all" });
  });

  it("query returns empty array when no matches", async () => {
    const index = {
      query: vi.fn(async () => ({ matches: [] })),
    } as unknown as VectorizeIndex;
    const hits = await query(index, [0.1, 0.2], 5);
    expect(hits).toEqual([]);
  });

  it("deleteItem removes id-prefixed chunk ids", async () => {
    const deleteByIds = vi.fn(async () => ({ mutationId: "m" }));
    const index = { deleteByIds } as unknown as VectorizeIndex;
    await deleteItem(index, "1", 3);
    expect(deleteByIds).toHaveBeenCalledWith(["1:0", "1:1", "1:2"]);
  });

  it("deleteItem defaults to maxChunks=64 when not provided", async () => {
    const deleteByIds = vi.fn(async () => ({ mutationId: "m" }));
    const index = { deleteByIds } as unknown as VectorizeIndex;
    await deleteItem(index, "1");
    const expected = Array.from({ length: 64 }, (_, i) => `1:${i}`);
    expect(deleteByIds).toHaveBeenCalledWith(expected);
  });
});
