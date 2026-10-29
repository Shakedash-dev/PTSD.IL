import { reindexStep, type ReindexStep } from "../src/lib/ingest";
import type { Env } from "../src/index";

// Runs a full stepped reindex to the end, like scripts/reindex-all.mjs does
// over HTTP. Returns the final step and every step's response.
export async function runFullReindex(env: Env, maxSteps = 500): Promise<ReindexStep & { steps: ReindexStep[] }> {
  const steps: ReindexStep[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < maxSteps; i++) {
    const step = await reindexStep(env, cursor);
    steps.push(step);
    if (step.done) return { ...step, steps };
    cursor = step.cursor;
  }
  throw new Error(`reindex did not finish in ${maxSteps} steps`);
}

type RawRow = { id: string; langId?: string; categories?: { slug?: string }[]; [k: string]: unknown };

// The content API's list endpoints over raw rows, with the filters the worker
// uses (`langId`, `categorySlug`; a parent slug matches its children like the
// real API's `metiv`). `corpus` can be swapped mid-run.
export function corpusResponse(corpus: { articles: RawRow[]; communities: unknown[] }, url: string): Response | null {
  const u = new URL(url);
  if (u.pathname.endsWith("/communities")) return new Response(JSON.stringify(corpus.communities), { status: 200 });
  if (!u.pathname.endsWith("/articles")) return null;
  const lang = u.searchParams.get("langId");
  const slug = u.searchParams.get("categorySlug");
  const rows = corpus.articles.filter((r) => (!lang || (r.langId ?? "he") === lang)
    && (!slug || (r.categories ?? []).some((c) => c.slug === slug || (slug === "metiv" && c.slug?.startsWith("metiv-")))));
  return new Response(JSON.stringify(rows), { status: 200 });
}
