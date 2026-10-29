import { vi } from "vitest";
import type { Item } from "../src/lib/content";
import { reindexQaRow, parseQaRow, retrievalText, encode, unit, writeShard, LANGS } from "../src/lib/qa";
import { encodeShard } from "../src/lib/qaShard";
import { EMBED_DIMS } from "../src/lib/embed";
import { fakeKV } from "./kv";
import { fakeVectorize } from "./vectorize";

export const qaItem = (id: string, groupId: string, langId: string, c: Record<string, unknown>): Item => ({
  id, groupId, langId, type: "article", title: String(c.question ?? ""),
  content: JSON.stringify(c), categorySlug: "chatbot-qa", categorySlugs: ["chatbot-qa"],
});

// Fake bge-m3 from a text -> vector table (unknown texts get a fixed vector).
export const fakeAI = (table: Record<string, number[]>, fallback = [0.3, 0.3, 0.3]) => ({
  run: vi.fn(async (_m: string, i: { text: string[] }) => ({ data: i.text.map((t) => table[t] ?? fallback) })),
});

// An empty shard for every language, as the full reindex leaves a language
// without rows (an item reindex only edits shards that exist).
export async function emptyShards(env: any, langs: readonly string[] = LANGS) {
  for (const l of langs) await writeShard(env, l, encodeShard({ v: 2, ver: "0" }, EMBED_DIMS, []), "0");
}

// An env whose playbook rows went in through the item reindex path.
export async function seededEnv(table: Record<string, number[]>, rows: Item[], extra: Record<string, unknown> = {}) {
  const env = { AI: fakeAI(table), RL: fakeKV(), VECTORIZE: fakeVectorize(), ...extra } as any;
  await emptyShards(env);
  for (const r of rows) await reindexQaRow(env, r);
  env.AI.run.mockClear();
  env.VECTORIZE.calls.length = 0;
  return env;
}

// The old one-value playbook index (qa:index:v1) for rows, as the old code wrote it.
export function legacyBlob(table: Record<string, number[]>, rows: Item[], opts: { retrieval?: boolean } = {}): string {
  const vec = (t: string) => encode(unit(table[t] ?? [0.3, 0.3, 0.3]));
  const parsed = rows.map(parseQaRow).filter((r): r is NonNullable<typeof r> => !!r);
  const entries = parsed.flatMap((r) => r.texts.map((t) => ({ rowId: r.rowId, groupId: r.groupId, langId: r.langId, crisis: r.crisis, vector: vec(t) })));
  const rowsOut = Object.fromEntries(parsed.map(({ texts: _t, ...r }) => [r.rowId, r]));
  const retrieval = Object.fromEntries(parsed.map((r) => [r.rowId, vec(retrievalText(r))]));
  return JSON.stringify({ v: 1, builtAt: "x", entries, rows: rowsOut, ...(opts.retrieval === false ? {} : { retrieval }) });
}
