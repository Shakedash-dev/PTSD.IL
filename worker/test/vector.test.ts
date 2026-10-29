import { describe, it, expect, vi } from "vitest";
import { upsertItemChunks, query, deleteItem, compact, type ChunkMeta } from "../src/lib/vector";

const meta: ChunkMeta = { itemId: "1", groupId: "g", type: "faq", langId: "he", title: "T", text: "hello", chunkIndex: 0 };

describe("vector", () => {
  it("upsert builds id-prefixed vectors in the default namespace with metadata", async () => {
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

  it("query names no namespace", async () => {
    const queryFn = vi.fn(async () => ({ matches: [] }));
    await query({ query: queryFn } as unknown as VectorizeIndex, [0.1], 5);
    expect(queryFn).toHaveBeenCalledWith([0.1], { topK: 5, returnMetadata: "all" });
  });

  it("deleteItem removes the ids past `keep` in one call", async () => {
    const deleteByIds = vi.fn(async (_ids: string[]) => ({ mutationId: "m" }));
    const index = { deleteByIds } as unknown as VectorizeIndex;
    await deleteItem(index, "1", 3);
    expect(deleteByIds).toHaveBeenCalledTimes(1);
    expect(deleteByIds.mock.calls[0][0]).toEqual(Array.from({ length: 61 }, (_, i) => `1:${i + 3}`));
  });

  it("deleteItem defaults to every id up to MAX_CHUNKS", async () => {
    const deleteByIds = vi.fn(async (_ids: string[]) => ({ mutationId: "m" }));
    await deleteItem({ deleteByIds } as unknown as VectorizeIndex, "1");
    expect(deleteByIds.mock.calls[0][0]).toEqual(Array.from({ length: 64 }, (_, i) => `1:${i}`));
  });

  it("compact rounds to 5 decimals", () => {
    expect(compact([0.123456789, -0.000004, 1])).toEqual([0.12346, -0, 1]);
  });
});

describe("deleteIds batching", () => {
  it("never sends more than 100 ids per deleteByIds call (Vectorize limit)", async () => {
    const { deleteIds } = await import("../src/lib/vector");
    const calls: number[] = [];
    const index = { deleteByIds: async (ids: string[]) => { if (ids.length > 100) throw new Error("40007"); calls.push(ids.length); } } as any;
    await deleteIds(index, Array.from({ length: 250 }, (_, i) => `id-${i}`));
    expect(calls).toEqual([100, 100, 50]);
  });
});
