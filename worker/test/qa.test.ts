import { describe, it, expect, vi } from "vitest";
import { buildQaIndex, loadQaIndex, matchPlaybooks, parseQaRow, thresholds, QA_INDEX_KEY } from "../src/lib/qa";
import type { Item } from "../src/lib/content";
import { fakeKV } from "./kv";

// Deterministic fake embeddings: each known text maps to a fixed 3-dim vector.
const VEC: Record<string, number[]> = {
  "how do i get treatment": [1, 0, 0],
  "where can i get therapy": [0.95, 0.05, 0],
  "איך מקבלים טיפול": [1, 0, 0],
  "i want to die": [0, 0, 1],
  "אני רוצה למות": [0, 0, 1],
  "what are my rights": [0, 1, 0],
};
const ai = () => ({ run: vi.fn(async (_m: string, i: { text: string[] }) => ({ data: i.text.map((t) => VEC[t] ?? [0.3, 0.3, 0.3]) })) });

const row = (id: string, groupId: string, langId: string, c: Record<string, unknown>): Item => ({
  id, groupId, langId, type: "article", title: String(c.question ?? ""),
  content: JSON.stringify(c), categorySlug: "chatbot-qa", categorySlugs: ["chatbot-qa"],
});

const ROWS: Item[] = [
  row("t-he", "g-treat", "he", { question: "איך מקבלים טיפול", paraphrases: [], guidance: "הנחיה בעברית", crisis: false }),
  row("t-en", "g-treat", "en", { question: "how do i get treatment", paraphrases: ["where can i get therapy"], guidance: "English guidance", answer: "Ref answer", crisis: false }),
  row("c-he", "g-crisis", "he", { question: "אני רוצה למות", paraphrases: [], guidance: "קודם כל ער\"ן 1201", crisis: true }),
  row("r-he", "g-rights", "he", { question: "what are my rights", paraphrases: [], guidance: "rights guidance", crisis: false }),
];

async function built() {
  const env = { AI: ai(), RL: fakeKV() } as any;
  await buildQaIndex(env, ROWS);
  return { env, index: (await loadQaIndex(env))! };
}

const TH = { strong: 0.8, weak: 0.72 };

describe("parseQaRow", () => {
  it("dedupes question and paraphrases and requires guidance", () => {
    const p = parseQaRow(row("x", "g", "en", { question: "q", paraphrases: ["q", "p"], guidance: "g", crisis: false }));
    expect(p?.texts).toEqual(["q", "p"]);
    expect(parseQaRow(row("y", "g", "en", { question: "q", paraphrases: [] }))).toBeNull();
    expect(parseQaRow({ ...ROWS[0], content: "{bad" })).toBeNull();
  });
});

describe("buildQaIndex", () => {
  it("embeds question + paraphrases into one KV value with the row text", async () => {
    const { env } = await built();
    const raw = JSON.parse(env.RL.store.get(QA_INDEX_KEY));
    expect(raw.entries).toHaveLength(5); // t-he 1, t-en 2, c-he 1, r-he 1
    expect(raw.entries.every((e: any) => typeof e.vector === "string")).toBe(true);
    expect(raw.rows["t-en"]).toMatchObject({ groupId: "g-treat", langId: "en", guidance: "English guidance", answer: "Ref answer", crisis: false });
    expect(raw.rows["c-he"].crisis).toBe(true);
  });

  it("writes an empty index when there are no rows (clears a deleted last row)", async () => {
    const env = { AI: ai(), RL: fakeKV() } as any;
    expect(await buildQaIndex(env, [])).toEqual({ qa: 0 });
    expect(JSON.parse(env.RL.store.get(QA_INDEX_KEY)).entries).toEqual([]);
    expect(env.AI.run).not.toHaveBeenCalled();
  });
});

describe("matchPlaybooks", () => {
  it("strong match picks the user's language row of the best group", async () => {
    const { index } = await built();
    const m = matchPlaybooks(index, [1, 0, 0], "en", false, TH);
    expect(m.playbook?.strength).toBe("strong");
    expect(m.playbook?.row.rowId).toBe("t-en");
  });

  it("falls back to the Hebrew row when the group has no row in the user's language", async () => {
    const { index } = await built();
    expect(matchPlaybooks(index, [1, 0, 0], "fr", false, TH).playbook?.row.rowId).toBe("t-he");
  });

  it("uses the best of question and paraphrases per group", async () => {
    const { index } = await built();
    // Closest to the paraphrase "where can i get therapy".
    const m = matchPlaybooks(index, [0.95, 0.05, 0], "en", false, TH);
    expect(m.best?.groupId).toBe("g-treat");
    expect(m.best!.score).toBeGreaterThan(0.999);
  });

  it("weak band gives a weak playbook, below weak gives none", async () => {
    const { index } = await built();
    // cos([1, 0.75, 0], [1,0,0]) = 0.8 -> strong; [1, 0.9, 0] = 0.743 -> weak; [1, 1.2, 0] = 0.64 -> none
    expect(matchPlaybooks(index, [1, 0.75, 0], "en", false, TH).playbook?.strength).toBe("strong");
    expect(matchPlaybooks(index, [1, 0.9, 0], "en", false, TH).playbook?.strength).toBe("weak");
    const none = matchPlaybooks(index, [1, 1.2, 0.1], "en", false, { strong: 0.9, weak: 0.85 });
    expect(none.playbook).toBeUndefined();
    expect(none.best).toBeDefined();
  });

  it("crisis always yields the best crisis playbook, at any score", async () => {
    const { index } = await built();
    const m = matchPlaybooks(index, [1, 0, 0], "en", true, TH);
    expect(m.playbook?.row.rowId).toBe("t-en"); // the topical one still applies
    expect(m.crisisPlaybook?.row.rowId).toBe("c-he"); // no en crisis row -> Hebrew
    expect(m.crisisPlaybook?.strength).toBe("crisis");
    expect(m.crisisPlaybook!.score).toBeLessThan(0.1);
  });

  it("returns a group once when the best match is itself the crisis group", async () => {
    const { index } = await built();
    const m = matchPlaybooks(index, [0, 0, 1], "he", true, TH);
    expect(m.crisisPlaybook?.row.rowId).toBe("c-he");
    expect(m.playbook).toBeUndefined();
  });

  it("no crisis playbook when the detector did not fire", async () => {
    const { index } = await built();
    expect(matchPlaybooks(index, [0, 0, 1], "he", false, TH).crisisPlaybook).toBeUndefined();
  });
});

describe("thresholds", () => {
  it("reads env and falls back to defaults", () => {
    expect(thresholds({})).toEqual({ strong: 0.8, weak: 0.72 });
    expect(thresholds({ QA_STRONG: "0.9", QA_WEAK: "0.7" })).toEqual({ strong: 0.9, weak: 0.7 });
    expect(thresholds({ QA_STRONG: "x", QA_WEAK: "" })).toEqual({ strong: 0.8, weak: 0.72 });
  });
});

describe("loadQaIndex", () => {
  it("returns null when no index was built", async () => {
    expect(await loadQaIndex({ RL: fakeKV() } as any)).toBeNull();
  });
});
