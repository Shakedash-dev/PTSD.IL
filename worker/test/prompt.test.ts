import { describe, it, expect } from "vitest";
import { buildContents } from "../src/lib/prompt";
import type { Hit } from "../src/lib/vector";

const hit = (text: string, i: number): Hit => ({
  score: 0.9,
  meta: { itemId: `${i}`, groupId: "g", type: "faq", langId: "he", title: `T${i}`, text, chunkIndex: 0 },
});

describe("buildContents", () => {
  it("numbers sources and includes grounding rule + Markdown/no-inline-citation rule", () => {
    const out = buildContents([{ role: "user", content: "מה זה?" }], [hit("aaa", 1), hit("bbb", 2)], "he");
    const sys = out.systemInstruction.parts[0].text;
    expect(sys).not.toMatch(/\[\[n\]\]/);
    expect(sys).toMatch(/markdown/i); // new Markdown-answer rule
    expect(sys).toMatch(/do not cite sources inline/i); // new no-inline-citation rule
    expect(sys).toMatch(/only using the numbered sources/i); // grounding rule
    expect(sys).toMatch(/only help with topics covered on this site/i); // refusal rule (distinct)
    expect(sys).toMatch(/masculine grammatical forms/i); // masculine self-reference persona rule
    const ctx = out.contents[0].parts[0].text;
    expect(ctx).toContain("[1]");
    expect(ctx).toContain("T1"); // source title present
    expect(ctx).toContain("aaa");
    expect(ctx).toContain("[2]");
  });

  it("maps assistant role to model", () => {
    const out = buildContents(
      [{ role: "user", content: "a" }, { role: "assistant", content: "b" }, { role: "user", content: "c" }],
      [hit("x", 1)], "en",
    );
    const roles = out.contents.map((c) => c.role);
    expect(roles).toContain("model");
    expect(roles[roles.length - 1]).toBe("user");
  });

  it("includes the output language name for a non-Hebrew language", () => {
    const outEn = buildContents([{ role: "user", content: "hi" }], [hit("x", 1)], "en");
    expect(outEn.systemInstruction.parts[0].text).toMatch(/English/);

    const outFr = buildContents([{ role: "user", content: "salut" }], [hit("x", 1)], "fr");
    expect(outFr.systemInstruction.parts[0].text).toMatch(/French/);
  });
});
