import type { Env } from "../index";
import type { Item } from "./content";
import { extractParts, dedupe, refsIn, buildRefIndex, refResolver, type RefIndex, type RefResolver } from "./content";
import { chunk } from "./chunk";
import { embed, EMBED_BATCH } from "./embed";
import { upsertItemChunks, deleteItem, deleteIds, upsertVectors, DELETE_BATCH, type ChunkMeta, type VectorRow } from "./vector";
import { fetchAllItems, fetchAllCommunities, fetchItem, fetchCommunity, fetchMetivItems, isIndexable, isQaItem, isMetivItem } from "./api";
import { rebuildQaIndex, qaIndexHasRow, qaJobs, embedQaJobs, writeQaIndex, qaIndexKey, type QaEntry } from "./qa";

// A single Worker invocation is capped at 50 subrequests on the free plan, and
// fetches, Workers AI calls, Vectorize calls and KV operations all count. The
// full reindex outgrew one invocation, so it runs in steps (reindexStep): each
// call does a bounded slice and returns a cursor to continue from. Per-item
// paths (reindexItem/reindexById) stay one-shot: they make a handful of calls.
const UPSERT_BATCH = 500; // vectors per Vectorize upsert call (binding limit 1000)

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

// Subrequests one reindex step may make in total, with headroom under the 50
// cap. STEP_FIXED of them are spent before any work: the admin token check
// (index.ts) and the two corpus fetches (articles + communities).
export const STEP_BUDGET = 40;
const STEP_FIXED = 3;
// Playbook build parts live this long, so an abandoned run cleans itself up.
const QA_PART_TTL = 3600;

const PHASES = ["qa", "cleanup", "chunks"] as const;
type Phase = (typeof PHASES)[number];

// Opaque to the client. `fp` fingerprints the phase's work list: if the corpus
// changes mid-run so that offsets no longer line up, the phase starts over.
// `parts` counts the playbook build parts written so far (qa phase only).
type Cursor = { v: 1; phase: Phase; offset: number; buildId: string; fp: string; parts: number };

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
  if (!c || c.v !== 1 || !PHASES.includes(c.phase as Phase) || !int(c.offset) || !int(c.parts)
    || typeof c.buildId !== "string" || !c.buildId || typeof c.fp !== "string") {
    throw new CursorError("invalid cursor");
  }
  return c as Cursor;
}

// FNV-1a over the work list's ids. Not cryptographic, only a change detector.
function fingerprint(keys: string[]): string {
  let h = 0x811c9dc5;
  for (const k of keys) {
    for (let i = 0; i < k.length; i++) h = Math.imul(h ^ k.charCodeAt(i), 0x01000193);
    h = Math.imul(h ^ 0x1f, 0x01000193);
  }
  return `${keys.length}:${(h >>> 0).toString(16)}`;
}

// Hands out the step's subrequests. Running out is a bug in the slicing math,
// not a runtime condition, so it throws instead of letting Cloudflare do it.
class Budget {
  constructor(public left: number) {}
  take(n = 1) {
    if (n > this.left) throw new Error(`reindex step over its subrequest budget (${n} > ${this.left})`);
    this.left -= n;
  }
}

const lazy = <T>(f: () => T) => {
  let v: { x: T } | undefined;
  return () => (v ??= { x: f() }).x;
};

// Every work list of a full reindex, from one corpus fetch. Pure and
// deterministic, so each step recomputes it and resumes by offset; each list is
// built only when its phase runs.
function planReindex(articles: Item[], communities: Item[]) {
  const all = [...articles, ...communities];
  const excluded = all.filter((i) => !isIndexable(i));
  // `$ref`s resolve against every Metiv row of the fetch (indexed or not).
  const refIndex = buildRefIndex(articles);
  const resolverFor = (item: Item) => refResolver(refIndex, item.langId);
  return {
    excluded: excluded.length,
    qa: lazy(() => qaJobs(articles.filter(isQaItem))),
    // Chunk ids excluded rows may still hold from before they were excluded.
    staleIds: lazy(() => excluded.flatMap((item) => {
      const n = chunkItem(item, resolverFor(item)).length + STALE_CHUNK_MARGIN;
      return Array.from({ length: n }, (_, i) => `${item.id}:${i}`);
    })),
    metas: lazy(() => {
      const metas: ChunkMeta[] = [];
      for (const item of all.filter(isIndexable)) {
        const key = metivKey(item);
        for (const c of chunkItem(item, resolverFor(item))) metas.push(metaFor(item, c, key));
      }
      return metas;
    }),
  };
}
type Plan = ReturnType<typeof planReindex>;

function phaseWork(plan: Plan, phase: Phase): { total: number; fp: string } {
  if (phase === "qa") {
    const { jobs } = plan.qa();
    return { total: jobs.length, fp: fingerprint(jobs.map((j) => `${j.row.rowId}\u0000${j.text}`)) };
  }
  if (phase === "cleanup") return { total: plan.staleIds().length, fp: fingerprint(plan.staleIds()) };
  const metas = plan.metas();
  return { total: metas.length, fp: fingerprint(metas.map((m) => `${m.itemId}:${m.chunkIndex}`)) };
}

type PhaseOut = { cur: Cursor; finished: boolean };

const qaPartKey = (env: Env, buildId: string, part: number) => `${qaIndexKey(env)}:build:${buildId}:${part}`;
type QaPart = { fp: string; from: number; entries: QaEntry[] };

// Playbook index. Chat must never read a half-built index, so a build that
// spans several steps writes each step's vectors to its own temporary part key
// (TTL QA_PART_TTL) and only the finishing step writes the real key, once, then
// deletes the parts. One key per part instead of one growing key: every part is
// written once and read once, so KV's edge cache can never hand back an older
// version of it.
// Cost: a middle step is n embeds + 1 part write; the finishing step is
// `parts` reads + the remaining embeds + 1 index write + `parts` deletes.
async function runQa(env: Env, plan: Plan, cur: Cursor, budget: Budget): Promise<PhaseOut> {
  const { parsed, jobs } = plan.qa();
  const rest = Math.ceil((jobs.length - cur.offset) / EMBED_BATCH);
  const finishCost = 2 * cur.parts + rest + 1;
  if (finishCost <= budget.left) {
    budget.take(cur.parts);
    const parts = await Promise.all(Array.from({ length: cur.parts }, async (_, i) => {
      const raw = await env.RL.get(qaPartKey(env, cur.buildId, i));
      return raw ? (JSON.parse(raw) as QaPart) : null;
    }));
    const entries: QaEntry[] = [];
    for (const p of parts) {
      if (!p || p.fp !== cur.fp || p.from !== entries.length) {
        // Expired or not visible: start the playbook build over under a fresh
        // id (a fresh key never has a cached "missing" read).
        return { cur: { ...cur, offset: 0, parts: 0, buildId: crypto.randomUUID() }, finished: false };
      }
      entries.push(...p.entries);
    }
    budget.take(rest);
    entries.push(...(await embedQaJobs(env, jobs.slice(cur.offset))));
    budget.take(1 + cur.parts);
    await writeQaIndex(env, parsed, entries);
    await Promise.all(Array.from({ length: cur.parts }, (_, i) => env.RL.delete(qaPartKey(env, cur.buildId, i))));
    return { cur: { ...cur, offset: jobs.length }, finished: true };
  }
  // One more part must still leave a full step able to read, write and delete
  // them all (far past KV's 25MB value limit in practice).
  if (2 * (cur.parts + 1) + 1 > STEP_BUDGET - STEP_FIXED) {
    throw new Error(`playbook index needs more than ${cur.parts} build parts`);
  }
  if (budget.left < 2) return { cur, finished: false };
  const n = Math.min(jobs.length - cur.offset, (budget.left - 1) * EMBED_BATCH);
  budget.take(Math.ceil(n / EMBED_BATCH));
  const entries = await embedQaJobs(env, jobs.slice(cur.offset, cur.offset + n));
  budget.take(1);
  const part: QaPart = { fp: cur.fp, from: cur.offset, entries };
  await env.RL.put(qaPartKey(env, cur.buildId, cur.parts), JSON.stringify(part), { expirationTtl: QA_PART_TTL });
  return { cur: { ...cur, offset: cur.offset + n, parts: cur.parts + 1 }, finished: false };
}

// Drop vectors excluded rows may hold: ceil(n / DELETE_BATCH) Vectorize calls.
async function runCleanup(env: Env, plan: Plan, cur: Cursor, budget: Budget): Promise<PhaseOut> {
  const ids = plan.staleIds();
  const n = Math.min(ids.length - cur.offset, budget.left * DELETE_BATCH);
  budget.take(Math.ceil(n / DELETE_BATCH));
  await deleteIds(env.VECTORIZE, ids.slice(cur.offset, cur.offset + n));
  const offset = cur.offset + n;
  return { cur: { ...cur, offset }, finished: offset >= ids.length };
}

// Embed + upsert content chunks: ceil(n / EMBED_BATCH) + ceil(n / UPSERT_BATCH)
// calls for n chunks. Upserts overwrite by id, so a run stopped halfway leaves a
// usable index (some chunks new, the rest as before). The bulk path does not
// per-item pre-clear, so chunks orphaned by a deleted/shrunk item are cleaned up
// by reindexById, not here.
async function runChunks(env: Env, plan: Plan, cur: Cursor, budget: Budget): Promise<PhaseOut> {
  const metas = plan.metas();
  const remaining = metas.length - cur.offset;
  const cost = (k: number) => Math.ceil(k / EMBED_BATCH) + Math.ceil(k / UPSERT_BATCH);
  let n = 0;
  while (n < remaining && cost(Math.min(remaining, n + EMBED_BATCH)) <= budget.left) n = Math.min(remaining, n + EMBED_BATCH);
  budget.take(cost(n));
  const slice = metas.slice(cur.offset, cur.offset + n);
  let pending: VectorRow[] = [];
  for (let i = 0; i < slice.length; i += EMBED_BATCH) {
    const batch = slice.slice(i, i + EMBED_BATCH);
    const vectors = await embed(env.AI, batch.map((m) => m.text));
    batch.forEach((m, j) => pending.push({ id: `${m.itemId}:${m.chunkIndex}`, values: vectors[j], metadata: m }));
    while (pending.length >= UPSERT_BATCH) {
      await upsertVectors(env.VECTORIZE, pending.slice(0, UPSERT_BATCH));
      pending = pending.slice(UPSERT_BATCH);
    }
  }
  await upsertVectors(env.VECTORIZE, pending);
  const offset = cur.offset + n;
  return { cur: { ...cur, offset }, finished: offset >= metas.length };
}

const RUNNERS: Record<Phase, (env: Env, plan: Plan, cur: Cursor, budget: Budget) => Promise<PhaseOut>> = {
  qa: runQa, cleanup: runCleanup, chunks: runChunks,
};

export type ReindexStep = {
  done: boolean;
  cursor?: string;
  progress: { phase: Phase; processed: number; total: number };
  excluded: number;
  qa: number;
  upserted?: number; // on the final step: chunk vectors written by the run
};

// One step of the full reindex. Phases in order: `qa` (playbook index),
// `cleanup` (stale vectors of excluded rows), `chunks` (content vectors). A step
// works through as many phases as its budget allows and returns a cursor for the
// next one until `done`. Without a cursor it starts a new run.
export async function reindexStep(env: Env, cursor?: unknown): Promise<ReindexStep> {
  let cur: Cursor = cursor !== undefined
    ? decodeCursor(cursor)
    : { v: 1, phase: "qa", offset: 0, buildId: crypto.randomUUID(), fp: "", parts: 0 };
  // 2 concurrent subrequests: articles + communities (each its own endpoint).
  const [articles, communities] = await Promise.all([
    fetchAllItems(env.API_BASE),
    fetchAllCommunities(env.API_BASE),
  ]);
  const plan = planReindex(articles, communities);
  const budget = new Budget(STEP_BUDGET - STEP_FIXED);
  const counts = () => ({ excluded: plan.excluded, qa: plan.qa().parsed.length });

  for (;;) {
    const work = phaseWork(plan, cur.phase);
    if (work.fp !== cur.fp) {
      // Entering the phase, or the corpus changed under it: start it over.
      cur = { ...cur, fp: work.fp, offset: 0, parts: 0, ...(cur.parts ? { buildId: crypto.randomUUID() } : {}) };
    }
    const out = await RUNNERS[cur.phase](env, plan, cur, budget);
    cur = out.cur;
    if (!out.finished) {
      return { done: false, cursor: encodeCursor(cur), progress: { phase: cur.phase, processed: cur.offset, total: work.total }, ...counts() };
    }
    const next = PHASES[PHASES.indexOf(cur.phase) + 1];
    if (!next) {
      return { done: true, progress: { phase: cur.phase, processed: cur.offset, total: work.total }, ...counts(), upserted: work.total };
    }
    cur = { ...cur, phase: next, offset: 0, fp: "", parts: 0 };
  }
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
