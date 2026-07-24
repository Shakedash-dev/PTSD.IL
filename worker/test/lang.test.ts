import { describe, it, expect } from "vitest";
import { detectLang } from "../src/lib/lang";

describe("detectLang", () => {
  it("detects by script regardless of the site language", () => {
    expect(detectLang("מה הזכויות שלי?", "en")).toBe("he");
    expect(detectLang("ما هي حقوقي؟", "en")).toBe("ar");
    expect(detectLang("Каковы мои права?", "en")).toBe("ru");
  });

  it("answers in the user's language, not the site UI language (the reported bug)", () => {
    // Site set to Hebrew, user writes English -> must be English.
    expect(detectLang("what are my rights?", "he")).toBe("en");
    // Site set to English, user writes Hebrew -> must be Hebrew.
    expect(detectLang("אני מרגיש לבד", "en")).toBe("he");
  });

  it("distinguishes French from English by accents/markers", () => {
    expect(detectLang("Quels sont mes droits ?", "en")).toBe("fr");
    expect(detectLang("J'ai besoin d'aide", "en")).toBe("fr");
    expect(detectLang("Pourquoi est-ce que je me sens ainsi ?", "en")).toBe("fr");
    // plain English is not misread as French
    expect(detectLang("what should I do next?", "fr")).toBe("en");
  });

  it("falls back to the site language only when the text has no decisive signal", () => {
    expect(detectLang("?!!", "ru")).toBe("ru");
    expect(detectLang("123 456", "fr")).toBe("fr");
    expect(detectLang("", "ar")).toBe("ar");
    // unsupported fallback degrades to Hebrew (the richest corpus)
    expect(detectLang("...", "zz")).toBe("he");
  });
});
