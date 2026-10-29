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

// Content vectors are the only vectors in the index (the playbooks live in KV,
// lib/qa.ts), in the default namespace, id `<itemId>:<chunkIndex>`: the ids the
// index has had from the start, so no deploy ever needs to migrate them.
export const chunkId = (itemId: string, n: number) => `${itemId}:${n}`;

const range = (from: number, to: number) => Array.from({ length: Math.max(0, to - from) }, (_, i) => from + i);
export const chunkIds = (itemId: string, from: number, to: number) => range(from, to).map((n) => chunkId(itemId, n));

// Values rounded to 5 decimals before an upsert. The binding sends vectors as
// JSON, and stringifying bge-m3's full-precision floats is the biggest CPU cost
// of a reindex (100 vectors: ~11 ms raw, ~6 ms rounded, measured in node).
// Cosine changes by < 1e-8; Vectorize stores float32 anyway.
export function compact(values: ArrayLike<number>): number[] {
  const out = new Array<number>(values.length);
  for (let i = 0; i < values.length; i++) out[i] = Math.round(values[i] * 1e5) / 1e5;
  return out;
}

export type VectorRow = { id: string; values: number[]; metadata: ChunkMeta };

export function contentRow(itemId: string, values: ArrayLike<number>, meta: ChunkMeta): VectorRow {
  return { id: chunkId(itemId, meta.chunkIndex), values: compact(values), metadata: meta };
}

export async function upsertItemChunks(
  index: VectorizeIndex,
  itemId: string,
  vectors: number[][],
  metas: ChunkMeta[],
): Promise<void> {
  const rows = vectors.map((values, i) => contentRow(itemId, values, metas[i]));
  if (rows.length) await index.upsert(rows as unknown as VectorizeVector[]);
}

// Batched upsert. The caller keeps a batch under Vectorize's 1000 per call and
// the step's CPU cap.
export async function upsertVectors(index: VectorizeIndex, rows: VectorRow[]): Promise<void> {
  if (rows.length) await index.upsert(rows as unknown as VectorizeVector[]);
}

export const DELETE_BATCH = 100; // Vectorize rejects deleteByIds with more than 100 ids (code 40007)
export const MAX_CHUNKS = 64; // ids an item reindex clears (no item comes close: 42 is the most today)

// Every chunk id an item could hold beyond its first `keep`: one deleteByIds.
// Run after the upsert of the new chunks, so the item is never missing from the
// index in between.
export async function deleteItem(index: VectorizeIndex, itemId: string, keep = 0): Promise<void> {
  await deleteIds(index, chunkIds(itemId, keep, MAX_CHUNKS));
}

// One subrequest per DELETE_BATCH ids.
export async function deleteIds(index: VectorizeIndex, ids: string[]): Promise<void> {
  for (let i = 0; i < ids.length; i += DELETE_BATCH) {
    await index.deleteByIds(ids.slice(i, i + DELETE_BATCH));
  }
}

export async function query(index: VectorizeIndex, vector: number[], topK: number): Promise<Hit[]> {
  const res = await index.query(vector, { topK, returnMetadata: "all" });
  return (res.matches ?? []).map((m) => ({ id: m.id, score: m.score, meta: m.metadata as unknown as ChunkMeta }));
}
