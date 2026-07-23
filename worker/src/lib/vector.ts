export type ChunkMeta = {
  itemId: string;
  groupId: string;
  type: string;
  langId: string;
  title: string;
  text: string;
  chunkIndex: number;
};

export type Hit = { score: number; meta: ChunkMeta };

export async function upsertItemChunks(
  index: VectorizeIndex,
  itemId: string,
  vectors: number[][],
  metas: ChunkMeta[],
): Promise<void> {
  const rows = vectors.map((values, i) => ({ id: `${itemId}:${i}`, values, metadata: metas[i] }));
  if (rows.length) await index.upsert(rows as unknown as VectorizeVector[]);
}

export async function deleteItem(index: VectorizeIndex, itemId: string, maxChunks = 64): Promise<void> {
  const ids = Array.from({ length: maxChunks }, (_, i) => `${itemId}:${i}`);
  await index.deleteByIds(ids);
}

export async function query(index: VectorizeIndex, vector: number[], topK: number): Promise<Hit[]> {
  const res = await index.query(vector, { topK, returnMetadata: "all" });
  return (res.matches ?? []).map((m) => ({ score: m.score, meta: m.metadata as unknown as ChunkMeta }));
}
