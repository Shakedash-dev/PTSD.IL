import type { Env } from "../index";
import type { Item } from "./content";
import { extractText } from "./content";
import { chunk } from "./chunk";
import { embed } from "./embed";
import { upsertItemChunks, deleteItem, type ChunkMeta } from "./vector";
import { fetchAllItems, fetchItem } from "./api";

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
  }));
  await deleteItem(env.VECTORIZE, item.id); // clear stale chunks first
  await upsertItemChunks(env.VECTORIZE, item.id, vectors, metas);
  return { upserted: chunks.length };
}

export async function reindexAll(env: Env): Promise<{ upserted: number }> {
  const items = await fetchAllItems(env.API_BASE);
  let upserted = 0;
  for (const item of items) upserted += (await reindexItem(env, item)).upserted;
  return { upserted };
}

export async function reindexById(env: Env, itemId: string): Promise<{ upserted: number }> {
  const item = await fetchItem(env.API_BASE, itemId);
  if (!item) {
    await deleteItem(env.VECTORIZE, itemId);
    return { upserted: 0 };
  }
  return reindexItem(env, item);
}
