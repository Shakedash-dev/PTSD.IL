import { describe, it, expect } from "vitest";
import { buildContents } from "../src/lib/prompt";
import type { Hit } from "../src/lib/vector";

const hit = (text: string, i: number): Hit => ({
  score: 0.9,
  meta: { itemId: `${i}`, groupId: "g", type: "faq", langId: "he", title: `T${i}`, text, chunkIndex: 0 },
});

describe("buildContents", () => {
  it("numbers sources and includes grounding rule + Markdown/internal-citation-marker rule", () => {
    const out = buildContents([{ role: "user", content: "מה זה?" }], [hit("aaa", 1), hit("bbb", 2)], "he");
    const sys = out.systemInstruction.parts[0].text;
    expect(sys).toMatch(/\[\[1\]\]/); // internal citation marker instruction re-enabled
    expect(sys).toMatch(/markdown/i); // Markdown-answer rule
    expect(sys).toMatch(/do not add your own 'sources'\/'references' section/i); // no self-authored sources heading
    expect(sys).toMatch(/only using the numbered sources/i); // grounding rule
    expect(sys).toMatch(/only help with topics covered on this site/i); // refusal rule (distinct)
    expect(sys).toMatch(/masculine grammatical forms/i); // masculine self-reference persona rule
    expect(sys).toMatch(/self-help/i); // staged-guidance rule: lead with self-help first
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

describe("buildContents audience", () => {
  const sys = (area?: "patient" | "therapist" | "metiv") =>
    buildContents([{ role: "user", content: "q" }], [hit("x", 1)], "he", [], area).systemInstruction.parts[0].text;

  it("describes both audiences and Metiv itself, in every area", () => {
    for (const s of [sys(), sys("patient"), sys("therapist"), sys("metiv")]) {
      expect(s).toMatch(/trauma survivors and their families, and mental-health professionals/);
      expect(s).toMatch(/information about Metiv/);
      expect(s).toMatch(/FOR SURVIVORS AND FAMILIES/);
      expect(s).toMatch(/FOR PROFESSIONALS/);
      expect(s).toMatch(/self-help-first rule above does not apply to professionals/);
      expect(s).toMatch(/Never give clinical advice on a specific patient or case/);
      expect(s).toMatch(/ABOUT METIV/);
      expect(s).not.toMatch(/patient topics/i);
    }
  });

  it("picks the audience default from the area", () => {
    expect(sys("patient")).toMatch(/area for trauma survivors and families\. Treat them as a survivor/);
    expect(sys("therapist")).toMatch(/area for mental-health professionals\. Treat them as a professional/);
    expect(sys("metiv")).toMatch(/general pages about Metiv/);
    expect(sys()).toMatch(/Judge from the question whether the user is a survivor or family member or a professional; when unclear, treat them as a survivor/);
    expect(sys()).not.toMatch(/The user is in the site's area/);
  });
});

describe("parseArea", () => {
  it("keeps the three areas and drops anything else", async () => {
    const { parseArea } = await import("../src/lib/prompt");
    expect(parseArea("patient")).toBe("patient");
    expect(parseArea("therapist")).toBe("therapist");
    expect(parseArea("metiv")).toBe("metiv");
    expect(parseArea(undefined)).toBeUndefined();
    expect(parseArea("admin")).toBeUndefined();
    expect(parseArea(3)).toBeUndefined();
  });
});
