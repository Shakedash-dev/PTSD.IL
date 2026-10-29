import { reindexStep, type ReindexStep } from "../src/lib/ingest";
import type { Env } from "../src/index";

// Runs a full stepped reindex to the end, like scripts/reindex-all.mjs does
// over HTTP. Returns the final step and every step's response.
export async function runFullReindex(env: Env, maxSteps = 100): Promise<ReindexStep & { steps: ReindexStep[] }> {
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
