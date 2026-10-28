import type { Env } from "../index";
import type { Item } from "./content";
import { extractParts, dedupe, refsIn, buildRefIndex, refResolver, type RefIndex, type RefResolver } from "./content";
import { chunk } from "./chunk";
import { embed } from "./embed";
import { upsertItemChunks, deleteItem, deleteIds, upsertVectors, type ChunkMeta, type VectorRow } from "./vector";
import { fetchAllItems, fetchAllCommunities, fetchItem, fetchCommunity, fetchMetivItems, isIndexable, isQaItem, isMetivItem } from "./api";
import { buildQaIndex, rebuildQaIndex, qaIndexHasRow } from "./qa";

// A single Worker invocation is capped at a limited number of subrequests
// (50 on the free plan). Per-item ingestion does ~3 subrequests each, which
// blows that limit past a handful of items - so the full reindex batches
// embeddings and upserts instead. Per-item paths (reindexItem/reindexById) stay
// one-item-at-a-time since they only do 2-3 subrequests total.
const EMBED_BATCH = 50; // texts per Workers AI embedding call (well under the 100-item limit)
const UPSERT_BATCH = 500; // vectors per Vectorize upsert call

// Chunk ids an excluded item may still hold from before it was excluded. The
// bulk path can't afford deleteItem's 64 ids per item across hundreds of Metiv
// rows, so it deletes what the current text would chunk into, plus a margin.
const STALE_CHUNK_MARGIN = 4;

const CHUNK_MAX = 1600;
const MIN_BODY = 400; // body room per chunk, however long the header is

export type ItemChunk = { text: string; index: number; title: string; section?: string };

// An item's chunks. Every chunk starts with the item's header (title, age group,
// audience, and the sub-document title for a sectioned Metiv singleton), so a
// late chunk of a long course or paper still says what it belongs to.
export function chunkItem(item: Item, resolve?: RefResolver): ItemChunk[] {
  const { title, header, sections } = extractParts(item, resolve);
  const out: ItemChunk[] = [];
  for (const s of sections) {
    const label = s.key ? s.title ?? s.key : undefined;
    const head = dedupe(label ? [...header, label] : header);
    const all = dedupe([...head, ...s.parts]);
    const body = all.slice(head.length).join("\n\n");
    const headText = head.join("\n\n");
    const extra = { title: s.title ?? title, ...(s.key ? { section: s.key } : {}) };
    if (!body) {
      // A sub-document without text is skipped; an item without text is its title.
      if (!s.key && headText) out.push({ text: headText, index: out.length, ...extra });
      continue;
    }
    const max = Math.max(MIN_BODY, CHUNK_MAX - headText.length - 2);
    for (const c of chunk(body, { max })) {
      out.push({ text: headText ? `${headText}\n\n${c.text}` : c.text, index: out.length, ...extra });
    }
  }
  return out;
}

// `_key` of a Metiv row: the item key the v3 pages use (a course's slug), for
// chip deep links.
function metivKey(item: Item): string | undefined {
  if (!isMetivItem(item)) return undefined;
  try {
    const k = (JSON.parse(item.content || "null") as { _key?: unknown } | null)?._key;
    return typeof k === "string" && k ? k : undefined;
  } catch {
    return undefined;
  }
}

function metaFor(item: Item, c: ItemChunk, key = metivKey(item)): ChunkMeta {
  return {
    itemId: item.id, groupId: item.groupId, type: item.type,
    langId: item.langId, title: c.title, text: c.text, chunkIndex: c.index,
    categorySlug: item.categorySlug,
    ...(item.categorySlugs ? { categorySlugs: item.categorySlugs } : {}),
    ...(key ? { key } : {}),
    ...(c.section ? { section: c.section } : {}),
  };
}

// Resolver for a single Metiv row's `$ref`s (item reindex). Fetches the row's
// language once and Hebrew only when a ref is missing there: at most two
// subrequests, none for rows without refs.
async function fetchRefResolver(env: Env, item: Item): Promise<RefResolver | undefined> {
  if (!isMetivItem(item)) return undefined;
  const refs = refsIn(item);
  if (refs.length === 0) return undefined;
  const index: RefIndex = new Map();
  const load = async (lang: string) => {
    if (!index.has(lang)) buildRefIndex(await fetchMetivItems(env.API_BASE, lang), index);
    index.set(lang, index.get(lang) ?? new Map());
  };
  await load(item.langId);
  if (item.langId !== "he" && refs.some((r) => !index.get(item.langId)!.has(r))) await load("he");
  return refResolver(index, item.langId);
}

export async function reindexItem(env: Env, item: Item, resolve?: RefResolver): Promise<{ upserted: number }> {
  // Excluded rows (UI copy, admin log, Q&A, Metiv navigation/taxonomy collections)
  // must not be in the index; reindexing one drops whatever it had.
  if (!isIndexable(item)) {
    await deleteItem(env.VECTORIZE, item.id);
    return { upserted: 0 };
  }
  const chunks = chunkItem(item, resolve ?? (await fetchRefResolver(env, item)));
  if (chunks.length === 0) {
    await deleteItem(env.VECTORIZE, item.id);
    return { upserted: 0 };
  }
  const vectors = await embed(env.AI, chunks.map((c) => c.text));
  const key = metivKey(item);
  const metas: ChunkMeta[] = chunks.map((c) => metaFor(item, c, key));
  await deleteItem(env.VECTORIZE, item.id); // clear stale chunks first
  await upsertItemChunks(env.VECTORIZE, item.id, vectors, metas);
  return { upserted: chunks.length };
}

export async function reindexAll(env: Env): Promise<{ upserted: number; excluded: number; qa: number }> {
  // 2 concurrent subrequests: articles + communities (each its own endpoint).
  const [articles, communities] = await Promise.all([
    fetchAllItems(env.API_BASE),
    fetchAllCommunities(env.API_BASE),
  ]);
  const all = [...articles, ...communities];
  const items = all.filter(isIndexable);
  const excluded = all.filter((i) => !isIndexable(i));
  // `$ref`s resolve against every Metiv row of the fetch (indexed or not).
  const refIndex = buildRefIndex(articles);
  const resolverFor = (item: Item) => refResolver(refIndex, item.langId);

  // Rebuild the playbook index from the same fetch (no extra API call).
  const { qa } = await buildQaIndex(env, articles.filter(isQaItem));

  // Drop vectors excluded rows may hold from before they were excluded.
  const staleIds = excluded.flatMap((item) => {
    const n = chunkItem(item, resolverFor(item)).length + STALE_CHUNK_MARGIN;
    return Array.from({ length: n }, (_, i) => `${item.id}:${i}`);
  });
  await deleteIds(env.VECTORIZE, staleIds);

  // Build all chunk metadata across every item - pure, no subrequests.
  const metas: ChunkMeta[] = [];
  for (const item of items) {
    const key = metivKey(item);
    for (const c of chunkItem(item, resolverFor(item))) metas.push(metaFor(item, c, key));
  }
  if (metas.length === 0) return { upserted: 0, excluded: excluded.length, qa };

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

  return { upserted: rows.length, excluded: excluded.length, qa };
}

// Per-item reindex, type-agnostic so the admin console can sync any content on
// create/update/delete. Resolves the id against articles first, then
// communities (their own endpoint/shape). If it's neither - deleted, or a
// deactivated community - drop its stale vectors. This is what keeps the vector
// DB in step with all three admin operations. A Q&A row (or an id that was one
// and is now gone or unpublished) rebuilds the playbook KV index instead.
export async function reindexById(env: Env, itemId: string): Promise<{ upserted: number; qa?: number }> {
  const item = await fetchItem(env.API_BASE, itemId);
  if (item) {
    if (!isQaItem(item)) return reindexItem(env, item);
    await deleteItem(env.VECTORIZE, itemId);
    return { upserted: 0, ...(await rebuildQaIndex(env)) };
  }

  const community = await fetchCommunity(env.API_BASE, itemId);
  if (community) return reindexItem(env, community);

  await deleteItem(env.VECTORIZE, itemId);
  if (await qaIndexHasRow(env, itemId)) return { upserted: 0, ...(await rebuildQaIndex(env)) };
  return { upserted: 0 };
}
