import type { Env } from "../index";
import type { Item } from "./content";
import { embed } from "./embed";
import { fetchQaItems } from "./api";

// Curated Q&A playbooks (docs/metiv-db-spec.md section 5). Each `chatbot-qa`
// row is one question in one language. We embed its question + paraphrases with
// the retrieval model (bge-m3) and keep the vectors plus the row text in ONE KV
// value, so a chat request costs a single KV read and no extra AI call (it
// reuses the query embedding). No Vectorize index is involved.

export const QA_INDEX_KEY = "qa:index:v1";
const EMBED_BATCH = 50;
const MEMO_MS = 60_000; // in-isolate cache; KV edge cache adds up to cacheTtl on top
const KV_CACHE_TTL = 60;

export type QaRow = {
  rowId: string;
  groupId: string;
  langId: string;
  question: string;
  guidance: string;
  answer?: string;
  crisis: boolean;
};

// Vectors are L2-normalized Float32, base64-encoded: ~5.5KB per 1024-dim vector
// against ~20KB as a JSON number array, which keeps the value far under KV's
// 25MB cap.
type StoredEntry = { rowId: string; groupId: string; langId: string; crisis: boolean; vector: string };
type StoredIndex = { v: 1; builtAt: string; entries: StoredEntry[]; rows: Record<string, QaRow> };

export type QaIndex = {
  entries: { rowId: string; groupId: string; crisis: boolean; vec: Float32Array }[];
  rows: Record<string, QaRow>;
  byGroup: Record<string, Record<string, string>>; // groupId -> langId -> rowId
};

function unit(v: ArrayLike<number>): Float32Array {
  let n = 0;
  for (let i = 0; i < v.length; i++) n += v[i] * v[i];
  const out = new Float32Array(v.length);
  const d = Math.sqrt(n) || 1;
  for (let i = 0; i < v.length; i++) out[i] = v[i] / d;
  return out;
}

function encode(v: Float32Array): string {
  const bytes = new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

function decode(s: string): Float32Array {
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Float32Array(bytes.buffer);
}

// Parse a row's content JSON; null when it has no usable question or guidance.
export function parseQaRow(item: Item): (QaRow & { texts: string[] }) | null {
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
    texts: [...new Set([question, ...paraphrases])],
  };
}

// Embed every row's texts and overwrite the KV index. An empty row list still
// writes an empty index, so deleting the last row clears it.
export async function buildQaIndex(env: Env, items: Item[]): Promise<{ qa: number }> {
  const parsed = items.map(parseQaRow).filter((r): r is NonNullable<typeof r> => !!r);
  const jobs = parsed.flatMap((r) => r.texts.map((text) => ({ row: r, text })));
  const entries: StoredEntry[] = [];
  for (let i = 0; i < jobs.length; i += EMBED_BATCH) {
    const batch = jobs.slice(i, i + EMBED_BATCH);
    const vectors = await embed(env.AI, batch.map((j) => j.text));
    batch.forEach((j, k) => entries.push({
      rowId: j.row.rowId, groupId: j.row.groupId, langId: j.row.langId,
      crisis: j.row.crisis, vector: encode(unit(vectors[k])),
    }));
  }
  const rows: Record<string, QaRow> = {};
  for (const { texts: _texts, ...row } of parsed) rows[row.rowId] = row;
  const stored: StoredIndex = { v: 1, builtAt: new Date().toISOString(), entries, rows };
  await env.RL.put(QA_INDEX_KEY, JSON.stringify(stored));
  memo.delete(env.RL);
  return { qa: parsed.length };
}

export async function rebuildQaIndex(env: Env): Promise<{ qa: number }> {
  return buildQaIndex(env, await fetchQaItems(env.API_BASE));
}

// Keyed by the KV binding so separate envs (and tests) never share a cache.
const memo = new WeakMap<object, { at: number; index: QaIndex | null }>();

export async function loadQaIndex(env: Env): Promise<QaIndex | null> {
  const hit = memo.get(env.RL);
  if (hit && Date.now() - hit.at < MEMO_MS) return hit.index;
  const raw = await env.RL.get(QA_INDEX_KEY, { cacheTtl: KV_CACHE_TTL });
  let index: QaIndex | null = null;
  if (raw) {
    const s = JSON.parse(raw) as StoredIndex;
    const byGroup: QaIndex["byGroup"] = {};
    for (const r of Object.values(s.rows)) (byGroup[r.groupId] ??= {})[r.langId] = r.rowId;
    index = {
      entries: s.entries.map((e) => ({ rowId: e.rowId, groupId: e.groupId, crisis: e.crisis, vec: decode(e.vector) })),
      rows: s.rows,
      byGroup,
    };
  }
  memo.set(env.RL, { at: Date.now(), index });
  return index;
}

// Whether a row id is in the current index (decides if a delete needs a rebuild).
export async function qaIndexHasRow(env: Env, rowId: string): Promise<boolean> {
  const index = await loadQaIndex(env);
  return !!index && rowId in index.rows;
}

export type PlaybookMatch = { row: QaRow; score: number; strength: "strong" | "weak" | "crisis" };

export type Thresholds = { strong: number; weak: number };

export function thresholds(env: Pick<Env, "QA_STRONG" | "QA_WEAK">): Thresholds {
  const num = (s: string | undefined, d: number) => {
    const n = Number(s);
    return s !== undefined && s !== "" && Number.isFinite(n) ? n : d;
  };
  return { strong: num(env.QA_STRONG, 0.8), weak: num(env.QA_WEAK, 0.72) };
}

// The user's language row of a group, else Hebrew, else any row.
function rowFor(index: QaIndex, groupId: string, lang: string): QaRow {
  const langs = index.byGroup[groupId] ?? {};
  const id = langs[lang] ?? langs.he ?? Object.values(langs)[0];
  return index.rows[id];
}

// Score the query against every QA vector, keep the best score per group, and
// pick (a) the best group if it clears the weak threshold and (b) when the
// crisis detector fired, the best crisis group at any score. When both are the
// same group it is returned once, as the crisis playbook.
export function matchPlaybooks(
  index: QaIndex,
  queryVector: number[],
  lang: string,
  crisis: boolean,
  th: Thresholds,
): { playbook?: PlaybookMatch; crisisPlaybook?: PlaybookMatch; best?: { groupId: string; score: number } } {
  const q = unit(queryVector);
  const best = new Map<string, { score: number; crisis: boolean }>();
  for (const e of index.entries) {
    if (e.vec.length !== q.length) continue;
    let dot = 0;
    for (let i = 0; i < q.length; i++) dot += q[i] * e.vec[i];
    const cur = best.get(e.groupId);
    if (!cur || dot > cur.score) best.set(e.groupId, { score: dot, crisis: (cur?.crisis ?? false) || e.crisis });
    else if (e.crisis) cur.crisis = true;
  }
  const ranked = [...best.entries()].sort((a, b) => b[1].score - a[1].score);
  if (ranked.length === 0) return {};

  const out: ReturnType<typeof matchPlaybooks> = { best: { groupId: ranked[0][0], score: ranked[0][1].score } };
  const [topId, top] = ranked[0];
  if (top.score >= th.weak) {
    out.playbook = { row: rowFor(index, topId, lang), score: top.score, strength: top.score >= th.strong ? "strong" : "weak" };
  }
  if (crisis) {
    const c = ranked.find(([, g]) => g.crisis);
    if (c) {
      out.crisisPlaybook = { row: rowFor(index, c[0], lang), score: c[1].score, strength: "crisis" };
      if (out.playbook?.row.groupId === c[0]) delete out.playbook;
    }
  }
  return out;
}
