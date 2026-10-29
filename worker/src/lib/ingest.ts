import type { Env } from "../index";
import type { Item } from "./content";
import { extractParts, dedupe, refsIn, buildRefIndex, refResolver, type RefIndex, type RefResolver } from "./content";
import { chunk } from "./chunk";
import { embed, EMBED_BATCH, EMBED_DIMS } from "./embed";
import { upsertItemChunks, deleteItem, deleteIds, upsertVectors, contentRow, chunkIds, DELETE_BATCH, type ChunkMeta, type VectorRow } from "./vector";
import { fetchItemsByLang, fetchAllCommunities, fetchItem, fetchCommunity, fetchMetivItems, fetchQaItems, isIndexable, isQaItem, isMetivItem } from "./api";
import {
  parseQaRow, embedRows, recordValue, writeRecord, reindexQaRow, removeQaRow, listRecords, textCount, qaRowPrefix, shardKey, kvPrefix,
  writeShard, LANGS, type ParsedQaRow,
} from "./qa";
import { decodeShard, encodeShard, shardRows, stamp, fnv, type RowVectors } from "./qaShard";
import { qaIndexKey } from "./qaLegacy";

// Two Workers Free limits shape the full reindex: 50 subrequests per invocation
// (fetches, Workers AI, Vectorize and KV calls all count) and 10 ms of CPU. The
// CPU one binds first: the binding sends vectors as JSON, and parsing an
// embedding response plus stringifying the upsert costs ~0.1 ms per vector
// (measured in node with 1024-dim vectors), while parsing the whole 4.5 MB
// /articles list is ~10 ms by itself. So the full reindex runs in many small
// steps (reindexStep): each fetches ONE slice (the Q&A rows of a language, a
// language of /articles, or the communities), writes at most STEP_VECTORS
// content vectors or QA_STEP_TEXTS playbook texts, and returns a cursor.
// Per-item paths (reindexItem/reindexById) stay one-shot.

// Chunk ids an excluded item may still hold from before it was excluded. The
// bulk path deletes what the current text would chunk into, plus a margin.
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
  await upsertItemChunks(env.VECTORIZE, item.id, vectors, metas);
  // Then the chunks past the new count (1 delete).
  await deleteItem(env.VECTORIZE, item.id, chunks.length);
  return { upserted: chunks.length };
}

// Subrequests one reindex step may make in total, with headroom under the 50
// cap. STEP_FIXED of them are spent before any work: the admin token check
// (index.ts). A step's real spend is far lower (~4-15): the CPU caps bind first.
export const STEP_BUDGET = 40;
const STEP_FIXED = 1;
// Content vectors a step embeds and upserts at most. Measured in node on the
// real corpus (docs/chatbot-guide.md section 18): ~0.1 ms of CPU per vector
// (embedding response parse + rounding + upsert stringify), plus ~1.5-2 ms to
// parse a language slice, ~1 ms to chunk the step's items and ~1 ms for the
// `$ref` index when one of them has refs. An item is never split, so one with
// more chunks goes alone (the largest today: 42).
export const STEP_VECTORS = 40;
// Q&A texts a step embeds at most (match texts plus one retrieval text per row,
// whole rows): one Workers AI call. No upsert to stringify, so a text costs
// only its share of the embedding response parse (~0.03 ms) and its int8
// quantization.
export const QA_STEP_TEXTS = 100;
// A qa step writes its rows' vectors to a build part that lives this long, so an
// abandoned run leaves nothing behind (and no KV delete is spent on it).
const QA_PART_TTL = 3600;
// Rounds of the `rework` cleanup slice before it gives up (and logs).
const SWEEP_ROUNDS = 30;

const SLICES = {
  qa: [...LANGS],
  chunks: [...LANGS, "communities"],
  cleanup: [...LANGS, "qa", "rework", "legacy"],
} as const;
const PHASES = ["qa", "chunks", "cleanup"] as const;
type Phase = (typeof PHASES)[number];

// Opaque to the client. `slice` indexes SLICES[phase], `offset` the slice's work
// list, and `fp` fingerprints that list: if the corpus changes mid-slice so the
// offsets no longer line up (or, for Q&A, a row's texts change), the slice
// starts over. `n` counts the current slice's results; `up` / `qa` / `ex` the
// finished slices' (chunks upserted, Q&A rows written, excluded rows). `b` and
// `parts`: the current qa slice's build id and the build parts written so far.
type Cursor = {
  v: 3; phase: Phase; slice: number; offset: number; fp: string; n: number;
  up: number; qa: number; ex: number; b: string; parts: number;
};

export class CursorError extends Error {}

function encodeCursor(c: Cursor): string {
  return btoa(JSON.stringify(c)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeCursor(s: unknown): Cursor {
  let c: Partial<Cursor>;
  try {
    if (typeof s !== "string") throw new Error();
    c = JSON.parse(atob(s.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    throw new CursorError("invalid cursor");
  }
  const int = (n: unknown) => typeof n === "number" && Number.isInteger(n) && n >= 0;
  if (!c || c.v !== 3 || !PHASES.includes(c.phase as Phase) || !int(c.slice) || c.slice! >= SLICES[c.phase as Phase].length
    || !int(c.offset) || !int(c.n) || !int(c.up) || !int(c.qa) || !int(c.ex) || !int(c.parts)
    || typeof c.fp !== "string" || typeof c.b !== "string") {
    throw new CursorError("invalid cursor");
  }
  return c as Cursor;
}

const fingerprint = (keys: string[]) => `${keys.length}:${fnv(keys)}`;

// Hands out the step's subrequests. Running out is a bug in the slicing math,
// not a runtime condition, so it throws instead of letting Cloudflare do it.
class Budget {
  constructor(public left: number) {}
  take(n = 1) {
    if (n > this.left) throw new Error(`reindex step over its subrequest budget (${n} > ${this.left})`);
    this.left -= n;
  }
}

// Enter the slice's work list: a new or changed list starts from 0.
const enter = (cur: Cursor, fp: string): Cursor => (fp === cur.fp ? cur : { ...cur, fp, offset: 0, n: 0, parts: 0, b: "" });

type Out = { cur: Cursor; finished: boolean; total: number };

// `$ref` resolver for the items a step chunks: the slice's own Metiv rows, plus
// the Hebrew ones (1 more fetch) only when one of those items has a ref missing
// in its language. None when no item in range has refs.
async function sliceResolver(env: Env, lang: string, all: Item[], range: Item[], budget: Budget): Promise<RefResolver | undefined> {
  const refs = range.filter(isMetivItem).flatMap(refsIn);
  if (refs.length === 0) return undefined;
  const index = buildRefIndex(all);
  if (lang !== "he" && refs.some((r) => !index.get(lang)?.has(r))) {
    budget.take(1);
    buildRefIndex(await fetchMetivItems(env.API_BASE, "he"), index);
  }
  return refResolver(index, lang);
}

// Content chunks of one slice, whole items, at most STEP_VECTORS vectors.
// Cost: 1 fetch, 1 embed, 1 upsert. Upserts overwrite by id, so a run stopped
// halfway leaves a usable index. Chunks orphaned by a shrunk item are cleaned up
// by reindexById, not here.
async function runChunks(env: Env, cur: Cursor, budget: Budget): Promise<Out> {
  const name = SLICES.chunks[cur.slice];
  budget.take(1);
  const items = name === "communities" ? await fetchAllCommunities(env.API_BASE) : await fetchItemsByLang(env.API_BASE, name);
  const work = items.filter(isIndexable);
  cur = enter(cur, fingerprint(work.map((i) => i.id)));
  const end = Math.min(work.length, cur.offset + STEP_VECTORS);
  const resolve = name === "communities" ? undefined : await sliceResolver(env, name, items, work.slice(cur.offset, end), budget);

  const metas: ChunkMeta[] = [];
  let i = cur.offset;
  for (; i < end; i++) {
    const item = work[i];
    const chunks = chunkItem(item, resolve);
    if (metas.length && metas.length + chunks.length > STEP_VECTORS) break;
    const key = metivKey(item);
    for (const c of chunks) metas.push(metaFor(item, c, key));
  }
  if (metas.length) {
    budget.take(Math.ceil(metas.length / EMBED_BATCH) + 1);
    const rows: VectorRow[] = [];
    for (let k = 0; k < metas.length; k += EMBED_BATCH) {
      const batch = metas.slice(k, k + EMBED_BATCH);
      const vectors = await embed(env.AI, batch.map((m) => m.text));
      batch.forEach((m, j) => rows.push(contentRow(m.itemId, vectors[j], m)));
    }
    await upsertVectors(env.VECTORIZE, rows);
  }
  const next = { ...cur, offset: i, n: cur.n + metas.length };
  const finished = i >= work.length;
  return { cur: finished ? { ...next, up: next.up + next.n } : next, finished, total: work.length };
}

const partKey = (env: Env, lang: string, b: string, k: number) => `${shardKey(env, lang)}:build:${b}:${k}`;

// Q&A rows of one language into that language's shard. Each step embeds whole
// rows, at most QA_STEP_TEXTS texts (one Workers AI call), writes their KV rows
// (only the ones that changed: the KV list's hashes say which) and their
// vectors to a build part (TTL QA_PART_TTL). The step that reaches the end
// reads the earlier parts, adds its own rows and writes the shard in ONE put,
// so chat never sees a half-built shard. One key per part, written once and
// read once, so KV's edge cache can never hand back an older version of it.
// Cost: 1 fetch, 1 KV list, 1 embed, 1 put per changed row, 1 part put; the
// last step instead `parts` gets + 1 shard put. A language without rows still
// gets an (empty) shard: a missing shard is what sends chat to the old index.
async function runQa(env: Env, cur: Cursor, budget: Budget): Promise<Out> {
  const lang = SLICES.qa[cur.slice];
  budget.take(1);
  const rows = (await fetchQaItems(env.API_BASE, lang)).map(parseQaRow).filter((r): r is ParsedQaRow => !!r);
  cur = enter(cur, fingerprint(rows.map((r) => `${r.rowId}:${stamp(r)}`)));
  if (!cur.b) cur = { ...cur, b: crypto.randomUUID().slice(0, 8) };
  const take: ParsedQaRow[] = [];
  let texts = 0;
  let i = cur.offset;
  for (; i < rows.length; i++) {
    const t = textCount(rows[i]);
    if (take.length && texts + t > QA_STEP_TEXTS) break;
    take.push(rows[i]);
    texts += t;
  }
  let fresh: RowVectors[] = [];
  let dims = 0;
  if (take.length) {
    budget.take(Math.ceil(texts / EMBED_BATCH));
    const [listed, built] = await Promise.all([listRecords(env, () => budget.take(1)), embedRows(env, take)]);
    const stored = new Map(listed.map((r) => [r.name, r.meta.h]));
    const changed = built.filter((b) => stored.get(`${qaRowPrefix(env)}${b.record.groupId}:${b.record.langId}`) !== recordValue(b.record).meta.h);
    budget.take(changed.length);
    await Promise.all(changed.map((b) => writeRecord(env, b.record)));
    fresh = built.map((b) => b.vectors);
    dims = built[0].dims;
  }
  const n = cur.n + take.length;
  if (i < rows.length) {
    budget.take(1);
    const part = encodeShard({ v: 2, ver: cur.fp, b: `${cur.b}:${cur.parts}` }, dims, fresh);
    await env.RL.put(partKey(env, lang, cur.b, cur.parts), part, { expirationTtl: QA_PART_TTL });
    return { cur: { ...cur, offset: i, n, parts: cur.parts + 1 }, finished: false, total: rows.length };
  }

  budget.take(cur.parts);
  const parts = await Promise.all(Array.from({ length: cur.parts }, (_, k) => env.RL.get(partKey(env, lang, cur.b, k), "arrayBuffer")));
  const all: RowVectors[] = [];
  for (let k = 0; k < parts.length; k++) {
    const s = decodeShard(parts[k]);
    if (!s || s.header.ver !== cur.fp || s.header.b !== `${cur.b}:${k}`) {
      // Expired or not visible yet: build this language again under a fresh id.
      console.log(`qa-build-restart ${JSON.stringify({ lang, part: k })}`);
      return { cur: { ...cur, offset: 0, n: 0, parts: 0, b: "" }, finished: false, total: rows.length };
    }
    dims ||= s.dims;
    all.push(...shardRows(s));
  }
  all.push(...fresh);
  budget.take(1);
  await writeShard(env, lang, encodeShard({ v: 2, ver: cur.b }, dims || EMBED_DIMS, all), cur.b);
  return { cur: { ...cur, offset: rows.length, n, qa: cur.qa + n }, finished: true, total: rows.length };
}

// Stale chunk ids of one language's excluded rows (what their text would chunk
// into, plus a margin): 1 fetch + ceil(ids / 100) deletes.
async function cleanupExcluded(env: Env, cur: Cursor, budget: Budget, lang: string): Promise<Out> {
  budget.take(1);
  const items = await fetchItemsByLang(env.API_BASE, lang);
  const excluded = items.filter((i) => !isIndexable(i));
  const resolve = excluded.some((i) => isMetivItem(i) && refsIn(i).length) ? refResolver(buildRefIndex(items), lang) : undefined;
  const ids = excluded.flatMap((item) => chunkIds(item.id, 0, chunkItem(item, resolve).length + STALE_CHUNK_MARGIN));
  cur = enter(cur, fingerprint(ids));
  const n = Math.min(ids.length - cur.offset, budget.left * DELETE_BATCH);
  budget.take(Math.ceil(n / DELETE_BATCH));
  await deleteIds(env.VECTORIZE, ids.slice(cur.offset, cur.offset + n));
  const offset = cur.offset + n;
  const finished = offset >= ids.length;
  return { cur: { ...cur, offset, ...(finished ? { ex: cur.ex + excluded.length } : {}) }, finished, total: ids.length };
}

// KV rows the Q&A set no longer has: rows that are gone (deleted, unpublished,
// unparseable) or moved to another group or language. Found from one KV list
// (its metadata has each row's id), so no per-row reads. A KV row is only
// deleted when no current row maps to its key: a key a current row maps to was
// written by this run's qa phase, even if the (eventually consistent) list still
// shows an older value. The shards need no cleanup: the qa phase built each one
// from the current rows only. 1 fetch + 1 list + 1 delete per stale row.
async function cleanupQa(env: Env, cur: Cursor, budget: Budget): Promise<Out> {
  budget.take(1);
  const rows = (await fetchQaItems(env.API_BASE)).map(parseQaRow).filter((r): r is ParsedQaRow => !!r);
  const owned = new Set(rows.map((r) => `${qaRowPrefix(env)}${r.groupId}:${r.langId}`));
  const keys = (await listRecords(env, () => budget.take(1))).map((r) => r.name).filter((k) => !owned.has(k));
  cur = enter(cur, fingerprint(keys));
  const n = Math.min(keys.length - cur.offset, budget.left);
  budget.take(n);
  await Promise.all(keys.slice(cur.offset, cur.offset + n).map((k) => env.RL.delete(k)));
  const offset = cur.offset + n;
  return { cur: { ...cur, offset }, finished: offset >= keys.length, total: keys.length };
}

// What a run of the never-deployed namespaced layout (playbook vectors in
// Vectorize) would have left: vectors in its `qa`, `qa-crisis` and `content`
// namespaces and its KV layout flag. Production never had them; this only makes
// sure. Each round queries each namespace (topK 100, ids only) and deletes what
// it returns, but only ids of that layout's formats, never a content id of the
// default namespace. Done when every namespace comes back empty, which on an
// index that never had them is the first round: 1 KV get + 3 queries.
const REWORK_NS = ["qa", "qa-crisis", "content"];
const REWORK_ID = /^(qa|qac|c):/;
async function cleanupRework(env: Env, cur: Cursor, budget: Budget): Promise<Out> {
  if (cur.offset === 0) {
    const flag = `${kvPrefix(env)}vec:layout`;
    budget.take(1);
    if ((await env.RL.get(flag)) !== null) {
      budget.take(1);
      await env.RL.delete(flag);
    }
  }
  const probe = Array.from({ length: EMBED_DIMS }, (_, i) => (i === 0 ? 1 : 0));
  let found = 0;
  for (const namespace of REWORK_NS) {
    budget.take(1);
    let ids: string[] = [];
    try {
      const res = await env.VECTORIZE.query(probe, { topK: 100, namespace, returnValues: false, returnMetadata: "none" });
      ids = (res.matches ?? []).map((m) => m.id).filter((id) => REWORK_ID.test(id));
    } catch (e) {
      console.log(`reindex-sweep-error ${JSON.stringify({ namespace, error: (e as Error).message })}`);
    }
    if (!ids.length) continue;
    found += ids.length;
    budget.take(1);
    await env.VECTORIZE.deleteByIds(ids);
  }
  const offset = cur.offset + 1;
  if (found && offset >= SWEEP_ROUNDS) console.log(`reindex-sweep-incomplete ${JSON.stringify({ rounds: offset, left: found })}`);
  return { cur: { ...cur, offset, n: cur.n + found }, finished: !found || offset >= SWEEP_ROUNDS, total: cur.n + found };
}

// The old one-value playbook index, which chat stopped reading once every
// language had its shard (the qa phase, first in the run). 1 KV delete.
async function cleanupLegacy(env: Env, cur: Cursor, budget: Budget): Promise<Out> {
  budget.take(1);
  await env.RL.delete(qaIndexKey(env));
  return { cur, finished: true, total: 1 };
}

async function runCleanup(env: Env, cur: Cursor, budget: Budget): Promise<Out> {
  const name = SLICES.cleanup[cur.slice];
  if (name === "qa") return cleanupQa(env, cur, budget);
  if (name === "rework") return cleanupRework(env, cur, budget);
  if (name === "legacy") return cleanupLegacy(env, cur, budget);
  return cleanupExcluded(env, cur, budget, name);
}

const RUNNERS: Record<Phase, (env: Env, cur: Cursor, budget: Budget) => Promise<Out>> = {
  qa: runQa, chunks: runChunks, cleanup: runCleanup,
};

export type ReindexStep = {
  done: boolean;
  cursor?: string;
  progress: { phase: Phase; slice: string; processed: number; total: number };
  excluded: number; // excluded rows, over the cleanup slices finished so far
  qa: number; // Q&A rows written, over the qa slices finished so far
  upserted?: number; // on the final step: chunk vectors written by the run
};

// One step of the full reindex: one slice of one phase. Phases in order: `qa`
// (one playbook shard per language, first so chat leaves the old 13 MB index as
// early as possible), `chunks` (content vectors, per language then
// communities), `cleanup` (stale vectors of excluded rows per language, KV rows
// the Q&A set no longer has, leftovers of the namespaced layout, the old
// playbook index). Without a cursor it starts a new run.
export async function reindexStep(env: Env, cursor?: unknown): Promise<ReindexStep> {
  const budget = new Budget(STEP_BUDGET - STEP_FIXED);
  let cur: Cursor = cursor !== undefined
    ? decodeCursor(cursor)
    : { v: 3, phase: PHASES[0], slice: 0, offset: 0, fp: "", n: 0, up: 0, qa: 0, ex: 0, b: "", parts: 0 };
  const out = await RUNNERS[cur.phase](env, cur, budget);
  cur = out.cur;
  const progress = { phase: cur.phase, slice: SLICES[cur.phase][cur.slice], processed: cur.offset, total: out.total };
  const counts = () => ({ excluded: cur.ex, qa: cur.qa });
  const reset = { offset: 0, fp: "", n: 0, b: "", parts: 0 };
  if (!out.finished) return { done: false, cursor: encodeCursor(cur), progress, ...counts() };

  if (cur.slice + 1 < SLICES[cur.phase].length) {
    cur = { ...cur, slice: cur.slice + 1, ...reset };
    return { done: false, cursor: encodeCursor(cur), progress, ...counts() };
  }
  const next = PHASES[PHASES.indexOf(cur.phase) + 1];
  if (!next) return { done: true, progress, ...counts(), upserted: cur.up };
  cur = { ...cur, phase: next, slice: 0, ...reset };
  return { done: false, cursor: encodeCursor(cur), progress, ...counts() };
}

// Per-item reindex, type-agnostic so the admin console can sync any content on
// create/update/delete. Resolves the id against articles first, then
// communities (their own endpoint/shape). If it's neither - deleted, or a
// deactivated community - drop its stale vectors. This is what keeps the vector
// DB in step with all three admin operations. A Q&A row reindexes only itself
// (lib/qa.ts reindexQaRow); an id that was a Q&A row and is now gone or
// unpublished drops only its own entries and KV rows.
export async function reindexById(env: Env, itemId: string): Promise<{ upserted: number; qa?: number }> {
  const item = await fetchItem(env.API_BASE, itemId);
  if (item) {
    if (!isQaItem(item)) return reindexItem(env, item);
    await deleteItem(env.VECTORIZE, itemId); // content vectors from before it was a Q&A row
    return { upserted: 0, qa: (await reindexQaRow(env, item)).qa };
  }

  const community = await fetchCommunity(env.API_BASE, itemId);
  if (community) return reindexItem(env, community);

  await deleteItem(env.VECTORIZE, itemId);
  if (await removeQaRow(env, itemId)) return { upserted: 0, qa: 0 };
  return { upserted: 0 };
}
