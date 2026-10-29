import type { Env } from "../index";
import type { Found, FindInput, PlaybookMatch, QaRow, Thresholds } from "./qa";
import { decode, unit } from "./qaShard";

// The playbook index as it was before the per-language shards: ONE KV value
// (`qa:index:v1`, ~13 MB for 175 rows) with every match vector, every row's text
// and every row's retrieval vector; decoding it is ~27 ms of CPU. Read-only now.
// Chat falls back to it only while the shard of the user's language (or the
// Hebrew one) is missing, i.e. until the first full reindex after the deploy has
// written them (lib/qa.ts loadPlaybookStore); that reindex then deletes it.
// Remove this file once no deployment has the value any more.

export const QA_INDEX_KEY = "qa:index:v1";

// The staging Worker kept its old index under its own key.
export const qaIndexKey = (env: Pick<Env, "QA_INDEX_KEY">) => env.QA_INDEX_KEY || QA_INDEX_KEY;
const MEMO_MS = 60_000;
const KV_CACHE_TTL = 60;

type StoredEntry = { rowId: string; groupId: string; langId: string; crisis: boolean; vector: string };
type StoredIndex = {
  v: 1; builtAt: string; entries: StoredEntry[]; rows: Record<string, QaRow>; retrieval?: Record<string, string>;
};

export type QaIndex = {
  entries: { rowId: string; groupId: string; crisis: boolean; vec: Float32Array }[];
  rows: Record<string, QaRow>;
  byGroup: Record<string, Record<string, string>>; // groupId -> langId -> rowId
  retrieval: Record<string, Float32Array>; // rowId -> retrieval vector
};

const memo = new WeakMap<object, Map<string, { at: number; index: QaIndex | null }>>();

export async function loadQaIndex(env: Env): Promise<QaIndex | null> {
  const key = qaIndexKey(env);
  const byKey = memo.get(env.RL) ?? new Map<string, { at: number; index: QaIndex | null }>();
  memo.set(env.RL, byKey);
  const hit = byKey.get(key);
  if (hit && Date.now() - hit.at < MEMO_MS) return hit.index;
  const raw = await env.RL.get(key, { cacheTtl: KV_CACHE_TTL });
  let index: QaIndex | null = null;
  if (raw) {
    const s = JSON.parse(raw) as StoredIndex;
    const byGroup: QaIndex["byGroup"] = {};
    for (const r of Object.values(s.rows)) (byGroup[r.groupId] ??= {})[r.langId] = r.rowId;
    index = {
      entries: s.entries.map((e) => ({ rowId: e.rowId, groupId: e.groupId, crisis: e.crisis, vec: decode(e.vector) })),
      rows: s.rows,
      byGroup,
      retrieval: Object.fromEntries(Object.entries(s.retrieval ?? {}).map(([id, v]) => [id, decode(v)])),
    };
  }
  byKey.set(key, { at: Date.now(), index });
  return index;
}

// The user's language row of a group, else Hebrew, else any row.
function rowFor(index: QaIndex, groupId: string, lang: string): QaRow {
  const langs = index.byGroup[groupId] ?? {};
  const id = langs[lang] ?? langs.he ?? Object.values(langs)[0];
  return index.rows[id];
}

// The matched row's retrieval vector, else the group's Hebrew row's; a crisis
// playbook only from a row with an answer.
export function retrievalVector(index: QaIndex, m: PlaybookMatch): number[] | undefined {
  const ids = [m.row.rowId, index.byGroup[m.row.groupId]?.he];
  for (const id of ids) {
    const v = id ? index.retrieval[id] : undefined;
    if (v && (m.strength !== "crisis" || index.rows[id!]?.answer)) return Array.from(v);
  }
  return undefined;
}

// Score the query against every vector, best score per group; the best group
// if it clears the weak threshold and, when the crisis detector fired, the best
// crisis group at any score (returned once, as the crisis playbook, when both
// are the same group).
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

// Chat's playbook selection on the old index, exactly as it ran before.
export function legacyFind(index: QaIndex, input: FindInput, th: Thresholds): Found {
  const m = matchPlaybooks(index, input.qv, input.lang, input.crisis, th);
  let carried: PlaybookMatch | undefined;
  if (input.prevVec && m.playbook?.strength !== "strong") {
    const p = matchPlaybooks(index, input.prevVec, input.lang, false, th).playbook;
    if (p?.strength === "strong") carried = p;
    if (carried && m.playbook?.row.groupId === carried.row.groupId) delete m.playbook;
  }
  if (input.crisisVec) m.crisisPlaybook = matchPlaybooks(index, input.crisisVec, input.lang, true, th).crisisPlaybook;
  const crisisGroup = m.crisisPlaybook?.row.groupId;
  if (crisisGroup && m.playbook?.row.groupId === crisisGroup) delete m.playbook;
  if (crisisGroup && carried?.row.groupId === crisisGroup) carried = undefined;
  const guide = [m.crisisPlaybook, carried, m.playbook]
    .filter((p): p is PlaybookMatch => !!p)
    .map((p) => ({ p, vec: retrievalVector(index, p) }))
    .find((g): g is { p: PlaybookMatch; vec: number[] } => !!g.vec);
  return { m, carried, guide };
}
