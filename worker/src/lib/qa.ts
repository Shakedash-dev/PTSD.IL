import type { Env } from "../index";
import type { Item } from "./content";
import { embed, EMBED_BATCH } from "./embed";
import {
  unit, encode, decode, decodeShard, encodeShard, shardRows, rowVectors, quantizeQuery, scan, ranked, stamp, fnv,
  type Shard, type ShardRow, type RowVectors, type GroupBest,
} from "./qaShard";
import { loadQaIndex, legacyFind, type QaIndex } from "./qaLegacy";

export { unit, encode, decode };

// Curated Q&A playbooks (docs/metiv-db-spec.md section 5, docs/chatbot-guide.md
// section 15). Each `chatbot-qa` row is one question in one language. Storage,
// all in KV (`RL`), none in Vectorize:
// - `<KV_PREFIX>qa:vec:v2:<langId>`: the match vectors of every row of that
//   language, int8, one binary value (~0.5 MB for 35 rows, lib/qaShard.ts).
//   Chat reads the user's language's and the Hebrew one, and nothing else.
// - `<KV_PREFIX>qa:row:<groupId>:<langId>`: the row's text plus its retrieval
//   vector (base64 Float32, ~5.5 KB). Keyed by group and language, not row id,
//   because chat needs "the user's language row of the matched group, else
//   Hebrew": 1-2 parallel gets of known keys. Its KV metadata ({ rowId, h }) lets
//   the full reindex and an item reindex list every row in one call.
// The retrieval vector stays in the row value, not the shard: chat reads the row
// anyway for its text, and a shard then holds only what every chat scans.

// Question + paraphrases embedded per row (today's maximum is 15).
export const QA_MAX_TEXTS = 30;
export const LANGS = ["he", "ar", "en", "ru", "fr"] as const;
const MEMO_MS = 60_000; // in-isolate cache; KV edge cache adds up to KV_CACHE_TTL on top
const KV_CACHE_TTL = 60;
// Concurrent admin saves of one language: re-read the shard after a write and
// redo when the row is not as written. Bounded.
export const SHARD_RETRIES = 3;
// Exported so tests can set them to 0. VERIFY_MS: how long after its write a save
// reads the shard back, so a save that read before ours and writes just after it
// is seen. RETRY_MS: KV allows one write per second to a key.
export const shardTiming = { verifyMs: 1000, retryMs: 1100 };

export type QaRow = {
  rowId: string;
  groupId: string;
  langId: string;
  question: string;
  guidance: string;
  answer?: string;
  crisis: boolean;
};
export type ParsedQaRow = QaRow & { texts: string[] };
// The KV row. `guide`: the retrieval vector, L2-normalized Float32, base64.
export type QaRecord = QaRow & { v: 3; guide: string };
// `h`: hash of the stored JSON, so the full reindex skips unchanged rows.
export type QaKvMeta = { rowId: string; h: string };

export const kvPrefix = (env: Pick<Env, "KV_PREFIX">) => env.KV_PREFIX ?? "";
export const qaRowPrefix = (env: Pick<Env, "KV_PREFIX">) => `${kvPrefix(env)}qa:row:`;
export const qaRowKey = (env: Pick<Env, "KV_PREFIX">, groupId: string, langId: string) => `${qaRowPrefix(env)}${groupId}:${langId}`;
export const shardKey = (env: Pick<Env, "KV_PREFIX">, langId: string) => `${kvPrefix(env)}qa:vec:v2:${langId}`;

// Parse a row's content JSON; null when it has no usable question or guidance.
export function parseQaRow(item: Item): ParsedQaRow | null {
  let c: Record<string, unknown>;
  try {
    c = JSON.parse(item.content || "{}");
  } catch {
    return null;
  }
  const str = (x: unknown) => (typeof x === "string" ? x.trim() : "");
  const question = str(c.question) || item.title.trim();
  const guidance = str(c.guidance);
  if (!question || !guidance) return null;
  const paraphrases = Array.isArray(c.paraphrases) ? c.paraphrases.map(str).filter(Boolean) : [];
  const answer = str(c.answer);
  return {
    rowId: item.id, groupId: item.groupId, langId: item.langId,
    question, guidance, ...(answer ? { answer } : {}), crisis: c.crisis === true,
    texts: [...new Set([question, ...paraphrases])].slice(0, QA_MAX_TEXTS),
  };
}

const GUIDANCE_LINES = 3;

// What a row's content in the vector index looks like: its reference answer,
// else the question and the first lines of its guidance.
export function retrievalText(row: QaRow): string {
  if (row.answer) return row.answer;
  const lines = row.guidance.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, GUIDANCE_LINES);
  return [row.question, ...lines].join("\n");
}

// Texts a row embeds: its match texts plus its retrieval text.
export const textCount = (row: ParsedQaRow) => row.texts.length + 1;

export const shardRow = (row: ParsedQaRow): ShardRow => ({
  id: row.rowId, g: row.groupId, ...(row.crisis ? { c: 1 as const } : {}), s: stamp(row), n: row.texts.length,
});

export type EmbeddedRow = { vectors: RowVectors; record: QaRecord; dims: number };

// Embed rows (ceil(texts / 100) Workers AI calls) into their shard vectors and
// KV rows.
export async function embedRows(env: Env, rows: ParsedQaRow[]): Promise<EmbeddedRow[]> {
  const texts = rows.flatMap((r) => [...r.texts, retrievalText(r)]);
  const embs: number[][] = [];
  for (let i = 0; i < texts.length; i += EMBED_BATCH) embs.push(...(await embed(env.AI, texts.slice(i, i + EMBED_BATCH))));
  let k = 0;
  return rows.map((row) => {
    const match = embs.slice(k, k + row.texts.length);
    k += row.texts.length;
    const dims = embs[k].length;
    const { texts: _texts, ...base } = row;
    const record: QaRecord = { v: 3, ...base, guide: encode(unit(embs[k++])) };
    return { vectors: rowVectors(shardRow(row), match, dims), record, dims };
  });
}

export function recordValue(rec: QaRecord): { json: string; meta: QaKvMeta } {
  const json = JSON.stringify(rec);
  return { json, meta: { rowId: rec.rowId, h: fnv([json]) } };
}

// One KV write.
export async function writeRecord(env: Env, rec: QaRecord): Promise<void> {
  const { json, meta } = recordValue(rec);
  await env.RL.put(qaRowKey(env, rec.groupId, rec.langId), json, { metadata: meta });
  recordMemo.get(env.RL)?.delete(qaRowKey(env, rec.groupId, rec.langId));
}

// Every stored KV row (name + metadata), from KV list: 1 call per 1000.
export async function listRecords(env: Env, onCall: () => void = () => {}): Promise<{ name: string; meta: QaKvMeta }[]> {
  const out: { name: string; meta: QaKvMeta }[] = [];
  let cursor: string | undefined;
  for (;;) {
    onCall();
    const page = await env.RL.list<QaKvMeta>({ prefix: qaRowPrefix(env), ...(cursor ? { cursor } : {}) });
    for (const k of page.keys) if (k.metadata && typeof k.metadata.rowId === "string") out.push({ name: k.name, meta: k.metadata });
    if (page.list_complete) return out;
    cursor = page.cursor;
  }
}

// Delete a group/language KV row only if it is still this row's (two rows of
// one group and language: the last one written owns the key).
async function dropRecordIfOwned(env: Env, key: string, rowId: string): Promise<void> {
  const raw = await env.RL.get(key);
  if (!raw) return;
  try {
    if ((JSON.parse(raw) as { rowId?: string }).rowId !== rowId) return;
  } catch {
    // unreadable: ours to replace
  }
  await env.RL.delete(key);
  recordMemo.get(env.RL)?.delete(key);
}

// ---- shards ----

const shardMemo = new WeakMap<object, Map<string, { at: number; shard: Shard | null }>>();

export async function readShard(env: Env, langId: string): Promise<Shard | null> {
  const key = shardKey(env, langId);
  const byKey = shardMemo.get(env.RL) ?? new Map<string, { at: number; shard: Shard | null }>();
  shardMemo.set(env.RL, byKey);
  const hit = byKey.get(key);
  if (hit && Date.now() - hit.at < MEMO_MS) return hit.shard;
  const shard = decodeShard(await env.RL.get(key, { type: "arrayBuffer", cacheTtl: KV_CACHE_TTL }));
  byKey.set(key, { at: Date.now(), shard });
  return shard;
}

export async function writeShard(env: Env, langId: string, buf: ArrayBuffer, ver: string): Promise<void> {
  await env.RL.put(shardKey(env, langId), buf, { metadata: { ver } });
  shardMemo.get(env.RL)?.delete(shardKey(env, langId));
}

const newVer = () => crypto.randomUUID().slice(0, 8);
const sleep = (ms: number) => (ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve());

export type ShardEdit = { lang: string; written: boolean; attempts: number; missing?: true };

// Replace one row's vectors in its language's shard (`add` absent: remove them).
// Read, splice, write with a new `ver`, then read back after shardTiming.verifyMs:
// if another save's write replaced ours (the row is not as we wrote it), redo
// from that version, at most SHARD_RETRIES times. KV has no compare-and-swap, so
// this catches two saves racing at one Cloudflare location (a write is visible
// there at once); across locations a read can lag up to 60 s, and the next full
// reindex is the backstop. No shard yet (before the first full reindex of the
// deploy): nothing is written, chat still reads the old index.
export async function editShard(env: Env, lang: string, rowId: string, add?: RowVectors & { dims: number }): Promise<ShardEdit> {
  const key = shardKey(env, lang);
  for (let attempt = 1; attempt <= SHARD_RETRIES + 1; attempt++) {
    const cur = decodeShard(await env.RL.get(key, "arrayBuffer"));
    if (!cur) return { lang, written: false, attempts: attempt, missing: true };
    const rows = shardRows(cur);
    const keep = rows.filter((r) => r.row.id !== rowId);
    if (!add && keep.length === rows.length) return { lang, written: false, attempts: attempt };
    const dims = cur.count ? cur.dims : add?.dims ?? cur.dims;
    if (add && add.dims !== dims) throw new Error(`row has ${add.dims} dims, shard ${lang} has ${dims}`);
    const ver = newVer();
    try {
      await writeShard(env, lang, encodeShard({ v: 2, ver }, dims, add ? [...keep, add] : keep), ver);
    } catch (e) {
      // KV's one write per second per key: the other save just wrote. Retry.
      console.log(`qa-shard-retry ${JSON.stringify({ lang, rowId, attempt, error: (e as Error).message })}`);
      await sleep(shardTiming.retryMs);
      continue;
    }
    await sleep(shardTiming.verifyMs);
    const back = decodeShard(await env.RL.get(key, "arrayBuffer"));
    const mine = back?.header.rows.find((r) => r.id === rowId);
    if (back && (add ? mine?.s === add.row.s && mine.n === add.row.n && mine.g === add.row.g && !!mine.c === !!add.row.c : !mine)) {
      return { lang, written: true, attempts: attempt };
    }
    console.log(`qa-shard-retry ${JSON.stringify({ lang, rowId, attempt, ver, found: back?.header.ver ?? null })}`);
    await sleep(shardTiming.retryMs);
  }
  throw new Error(`playbook shard ${lang}: row ${rowId} lost to concurrent saves ${SHARD_RETRIES + 1} times`);
}

// Item reindex of one Q&A row, touching nothing else: 1 KV list (where the row
// was), 1 embed, 1 KV row write, then its language's shard: 1 get + 1 put + 1 get
// back (a few ms of CPU: no vector is decoded, the row's ~15 are spliced in).
// A row whose language or group changed also leaves its old shard and KV row.
export async function reindexQaRow(env: Env, item: Item): Promise<{ qa: number; shards?: ShardEdit[] }> {
  const row = parseQaRow(item);
  if (!row) {
    await removeQaRow(env, item.id);
    return { qa: 0 };
  }
  const [listed, [built]] = await Promise.all([listRecords(env), embedRows(env, [row])]);
  await writeRecord(env, built.record);
  const key = qaRowKey(env, row.groupId, row.langId);
  const before = listed.filter((r) => r.meta.rowId === row.rowId && r.name !== key);
  const oldLangs = [...new Set(before.map((r) => r.name.slice(r.name.lastIndexOf(":") + 1)))].filter((l) => l !== row.langId);
  const shards = [await editShard(env, row.langId, row.rowId, { ...built.vectors, dims: built.dims })];
  for (const l of oldLangs) shards.push(await editShard(env, l, row.rowId));
  for (const r of before) await dropRecordIfOwned(env, r.name, row.rowId);
  if (shards[0].missing) console.log(`qa-shard-missing ${JSON.stringify({ lang: row.langId, rowId: row.rowId })}`);
  return { qa: 1, shards };
}

// A row deleted, unpublished, or no longer usable: drop its vectors from every
// shard that has it and its KV rows. False when the id was in neither (never a
// Q&A row). 1 KV list + 5 shard gets, then 1 put + 1 get back per shard that
// had it, and 1 get + 1 delete per KV row.
export async function removeQaRow(env: Env, rowId: string): Promise<boolean> {
  const [listed, shards] = await Promise.all([
    listRecords(env),
    Promise.all(LANGS.map(async (l) => ({ l, shard: decodeShard(await env.RL.get(shardKey(env, l), "arrayBuffer")) }))),
  ]);
  const mine = listed.filter((r) => r.meta.rowId === rowId);
  const inShards = shards.filter((s) => s.shard?.header.rows.some((r) => r.id === rowId)).map((s) => s.l);
  for (const l of inShards) await editShard(env, l, rowId);
  for (const r of mine) await dropRecordIfOwned(env, r.name, rowId);
  return mine.length > 0 || inShards.length > 0;
}

// ---- chat ----

export type PlaybookMatch = { row: QaRow; score: number; strength: "strong" | "weak" | "crisis" };

export type Thresholds = { strong: number; weak: number };

export function thresholds(env: Pick<Env, "QA_STRONG" | "QA_WEAK">): Thresholds {
  const num = (s: string | undefined, d: number) => {
    const n = Number(s);
    return s !== undefined && s !== "" && Number.isFinite(n) ? n : d;
  };
  return { strong: num(env.QA_STRONG, 0.8), weak: num(env.QA_WEAK, 0.72) };
}

// `crisisVec`: the embedding of the message that fired the crisis detector, when
// that is not the latest one.
export type FindInput = { qv: number[]; prevVec?: number[]; crisisVec?: number[]; lang: string; crisis: boolean };
export type Found = {
  m: { playbook?: PlaybookMatch; crisisPlaybook?: PlaybookMatch; best?: { groupId: string; score: number } };
  carried?: PlaybookMatch; // the previous message's strong match, used for this turn
  guide?: { p: PlaybookMatch; vec: number[] }; // the playbook whose retrieval vector guides retrieval
};

// Where chat's playbooks come from this request: the shards of the user's
// language and Hebrew, or, until the full reindex after this deploy has written
// them, the old one-value index (lib/qaLegacy.ts).
export type PlaybookStore =
  | { kind: "shards"; shards: { lang: string; shard: Shard }[] }
  | { kind: "legacy"; index: QaIndex };

// Every language's shard (5 KV gets of ~0.5 MB, cached 60 s in the isolate),
// started alongside the query embedding. All five are scanned, as the old
// one-value index was: a question is sometimes closest to another language's
// paraphrase of the right playbook (live comparison 2026-10-30: scanning only
// the user's language + Hebrew picked the wrong playbook for one of 31
// questions). The full scan is ~2,350 int8 vectors, about 3 ms CPU. A missing
// shard for the user's language or Hebrew means the full reindex has not
// reached it: the old index answers, if it is still there.
export async function loadPlaybookStore(env: Env, lang: string): Promise<PlaybookStore | null> {
  const langs = [...new Set([lang, "he", ...LANGS])];
  const got = await Promise.all(langs.map((l) => readShard(env, l)));
  const shards = langs.map((l, i) => ({ lang: l, shard: got[i] })).filter((s): s is { lang: string; shard: Shard } => !!s.shard);
  if (!got[0] || !got[langs.indexOf("he")]) {
    const index = await loadQaIndex(env);
    if (index) return { kind: "legacy", index };
  }
  return shards.length ? { kind: "shards", shards } : null;
}

const recordMemo = new WeakMap<object, Map<string, { at: number; rec: QaRecord | null }>>();

async function readRecord(env: Env, key: string): Promise<QaRecord | null> {
  const byKey = recordMemo.get(env.RL) ?? new Map<string, { at: number; rec: QaRecord | null }>();
  recordMemo.set(env.RL, byKey);
  const hit = byKey.get(key);
  if (hit && Date.now() - hit.at < MEMO_MS) return hit.rec;
  const raw = await env.RL.get(key, { cacheTtl: KV_CACHE_TTL });
  let rec: QaRecord | null = null;
  if (raw) {
    const r = JSON.parse(raw) as QaRecord;
    if (r.v === 3 && typeof r.guidance === "string") rec = r;
  }
  if (byKey.size > 500) byKey.clear(); // bounded: there are ~175 rows
  byKey.set(key, { at: Date.now(), rec });
  return rec;
}

const rowOf = ({ v: _v, guide: _g, ...row }: QaRecord): QaRow => row;

// The user's language row of a group, else its Hebrew row, else the row that
// matched: 1-2 KV gets in parallel (deduped, cached). The matched row is in the
// user's language or Hebrew, since only those shards are scanned.
async function resolve(env: Env, g: GroupBest, lang: string): Promise<{ row: QaRecord; he: QaRecord | null } | null> {
  const langs = [...new Set([lang, "he", g.langId])];
  const recs = await Promise.all(langs.map((l) => readRecord(env, qaRowKey(env, g.groupId, l))));
  const by = new Map(langs.map((l, i) => [l, recs[i]]));
  const row = by.get(lang) ?? by.get("he") ?? by.get(g.langId);
  return row ? { row, he: by.get("he") ?? null } : null;
}

const bestOf = (shards: { lang: string; shard: Shard }[], vec: number[], crisisOnly = false): GroupBest | undefined => {
  const best = new Map<string, GroupBest>();
  scan(shards, quantizeQuery(vec), best, crisisOnly);
  return ranked(best)[0];
};

// Chat's playbook selection. Same rules as the old index:
// - the best group of the query if it clears QA_WEAK (strong at QA_STRONG);
// - when the crisis detector fired, the best crisis group at any score (a scan
//   of the crisis rows only, with the message that fired it), shown once;
// - without a strong match, the previous message's strong match is carried.
// Cost: the scans are CPU only (~0.8 ms per 1,000 vectors); then 1-2 KV gets
// per playbook used.
export async function findPlaybooks(env: Env, store: PlaybookStore, input: FindInput, th: Thresholds): Promise<Found> {
  if (store.kind === "legacy") return legacyFind(store.index, input, th);
  const { shards } = store;
  const best = bestOf(shards, input.qv);
  const crisisTop = input.crisis ? bestOf(shards, input.crisisVec ?? input.qv, true) : undefined;
  let top = best && best.score >= th.weak && best.groupId !== crisisTop?.groupId ? best : undefined;
  let carried: GroupBest | undefined;
  if (input.prevVec && !(top && top.score >= th.strong)) {
    const p = bestOf(shards, input.prevVec);
    if (p && p.score >= th.strong && p.groupId !== crisisTop?.groupId) carried = p;
    if (carried && top?.groupId === carried.groupId) top = undefined;
  }

  const picks: [GroupBest | undefined, PlaybookMatch["strength"]][] = [
    [crisisTop, "crisis"], [carried, "strong"], [top, top && top.score >= th.strong ? "strong" : "weak"],
  ];
  const resolved = await Promise.all(picks.map(([g]) => (g ? resolve(env, g, input.lang) : null)));
  const matches = picks.map(([g, strength], i) => {
    const r = resolved[i];
    return g && r ? { m: { row: rowOf(r.row), score: g.score, strength } as PlaybookMatch, r } : undefined;
  });
  const [crisisM, carriedM, topM] = matches;

  // Retrieval vector: the used row's own, else the group's Hebrew row's; a crisis
  // playbook only from a row with an answer. First that has one wins, in the
  // order crisis, carried, current.
  let guide: Found["guide"];
  for (const x of matches) {
    if (!x || guide) continue;
    const rec = [x.r.row, x.r.he].find((c) => c && c.guide && (x.m.strength !== "crisis" || c.answer));
    if (rec) guide = { p: x.m, vec: Array.from(decode(rec.guide)) };
  }
  return {
    m: {
      ...(topM ? { playbook: topM.m } : {}),
      ...(crisisM ? { crisisPlaybook: crisisM.m } : {}),
      ...(best ? { best: { groupId: best.groupId, score: best.score } } : {}),
    },
    ...(carriedM ? { carried: carriedM.m } : {}),
    ...(guide ? { guide } : {}),
  };
}
