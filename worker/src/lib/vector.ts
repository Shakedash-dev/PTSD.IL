export type ChunkMeta = {
  itemId: string;
  groupId: string;
  type: string;
  langId: string;
  title: string;
  text: string;
  chunkIndex: number;
  // Primary category slug (rights/ptsd-info/second-circle/...), used by the
  // frontend to route `type=faq` citation chips to the right page.
  categorySlug?: string;
  // Every category slug of the item (Metiv rows: `metiv` + `metiv-<collection>`),
  // so the frontend can route Metiv chips by collection.
  categorySlugs?: string[];
  // Metiv rows: the row's `_key` (a course's or article's slug), for chip deep links.
  key?: string;
  // Sectioned Metiv singletons: the sub-document the chunk comes from
  // ("privacy" / "terms" of LEGAL_DOCS, a page key of SHORT_VERSIONS).
  section?: string;
};

// `id` is the vector id (`<itemId>:<chunkIndex>`).
export type Hit = { id?: string; score: number; meta: ChunkMeta };

export async function upsertItemChunks(
  index: VectorizeIndex,
  itemId: string,
  vectors: number[][],
  metas: ChunkMeta[],
): Promise<void> {
  const rows = vectors.map((values, i) => ({ id: `${itemId}:${i}`, values, metadata: metas[i] }));
  if (rows.length) await index.upsert(rows as unknown as VectorizeVector[]);
}

export type VectorRow = { id: string; values: number[]; metadata: ChunkMeta };

// Batched cross-item upsert. The caller slices rows into batches to stay under
// Vectorize's per-call size and the Worker's per-invocation subrequest limits.
export async function upsertVectors(index: VectorizeIndex, rows: VectorRow[]): Promise<void> {
  if (rows.length) await index.upsert(rows as unknown as VectorizeVector[]);
}

export async function deleteItem(index: VectorizeIndex, itemId: string, maxChunks = 64): Promise<void> {
  const ids = Array.from({ length: maxChunks }, (_, i) => `${itemId}:${i}`);
  await index.deleteByIds(ids);
}

export const DELETE_BATCH = 100; // Vectorize rejects deleteByIds with more than 100 ids (code 40007)

// Batched cross-item delete for the bulk reindex: one subrequest per
// DELETE_BATCH ids instead of one per item.
export async function deleteIds(index: VectorizeIndex, ids: string[]): Promise<void> {
  for (let i = 0; i < ids.length; i += DELETE_BATCH) {
    await index.deleteByIds(ids.slice(i, i + DELETE_BATCH));
  }
}

export async function query(index: VectorizeIndex, vector: number[], topK: number): Promise<Hit[]> {
  const res = await index.query(vector, { topK, returnMetadata: "all" });
  return (res.matches ?? []).map((m) => ({ id: m.id, score: m.score, meta: m.metadata as unknown as ChunkMeta }));
}
