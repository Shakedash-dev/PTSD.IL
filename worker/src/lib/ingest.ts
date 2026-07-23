import type { Env } from "../index";
import type { Item } from "./content";
import { extractText } from "./content";
import { chunk } from "./chunk";
import { embed } from "./embed";
import { upsertItemChunks, deleteItem, upsertVectors, type ChunkMeta, type VectorRow } from "./vector";
import { fetchAllItems, fetchItem } from "./api";

// A single Worker invocation is capped at a limited number of subrequests
// (50 on the free plan). Per-item ingestion does ~3 subrequests each, which
// blows that limit past a handful of items — so the full reindex batches
// embeddings and upserts instead. Per-item paths (reindexItem/reindexById) stay
// one-item-at-a-time since they only do 2-3 subrequests total.
const EMBED_BATCH = 50; // texts per Workers AI embedding call (well under the 100-item limit)
const UPSERT_BATCH = 500; // vectors per Vectorize upsert call

export async function reindexItem(env: Env, item: Item): Promise<{ upserted: number }> {
  const { title, text } = extractText(item);
  const chunks = chunk(text);
  if (chunks.length === 0) {
    await deleteItem(env.VECTORIZE, item.id);
    return { upserted: 0 };
  }
  const vectors = await embed(env.AI, chunks.map((c) => c.text));
  const metas: ChunkMeta[] = chunks.map((c) => ({
    itemId: item.id, groupId: item.groupId, type: item.type,
    langId: item.langId, title, text: c.text, chunkIndex: c.index,
    categorySlug: item.categorySlug,
  }));
  await deleteItem(env.VECTORIZE, item.id); // clear stale chunks first
  await upsertItemChunks(env.VECTORIZE, item.id, vectors, metas);
  return { upserted: chunks.length };
}

export async function reindexAll(env: Env): Promise<{ upserted: number }> {
  const items = await fetchAllItems(env.API_BASE); // 1 subrequest

  // Build all chunk metadata across every item — pure, no subrequests.
  const metas: ChunkMeta[] = [];
  for (const item of items) {
    const { title, text } = extractText(item);
    for (const c of chunk(text)) {
      metas.push({
        itemId: item.id, groupId: item.groupId, type: item.type,
        langId: item.langId, title, text: c.text, chunkIndex: c.index,
        categorySlug: item.categorySlug,
      });
    }
  }
  if (metas.length === 0) return { upserted: 0 };

  // Embed in batches: ceil(N / EMBED_BATCH) Workers AI subrequests.
  const rows: VectorRow[] = [];
  for (let i = 0; i < metas.length; i += EMBED_BATCH) {
    const batch = metas.slice(i, i + EMBED_BATCH);
    const vectors = await embed(env.AI, batch.map((m) => m.text));
    batch.forEach((m, j) => rows.push({ id: `${m.itemId}:${m.chunkIndex}`, values: vectors[j], metadata: m }));
  }

  // Upsert in batches: ceil(N / UPSERT_BATCH) Vectorize subrequests.
  // Note: the bulk path upserts (overwrite-by-id) but does not per-item pre-clear,
  // so chunks orphaned by a deleted/shrunk item are cleaned up by reindexById, not here.
  for (let i = 0; i < rows.length; i += UPSERT_BATCH) {
    await upsertVectors(env.VECTORIZE, rows.slice(i, i + UPSERT_BATCH));
  }

  return { upserted: rows.length };
}

export async function reindexById(env: Env, itemId: string): Promise<{ upserted: number }> {
  const item = await fetchItem(env.API_BASE, itemId);
  if (!item) {
    await deleteItem(env.VECTORIZE, itemId);
    return { upserted: 0 };
  }
  return reindexItem(env, item);
}
