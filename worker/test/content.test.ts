import { describe, it, expect } from "vitest";
import { extractText, type Item } from "../src/lib/content";

const faq: Item = {
  id: "a1", groupId: "g1", type: "faq", langId: "he",
  title: "מה זה פלאשבק?",
  content: JSON.stringify({ question: "מה זה פלאשבק?", answer: "**חוויה חוזרת** של הטראומה." }),
};

describe("extractText", () => {
  it("concatenates title and string leaves of parsed content", () => {
    const { title, text } = extractText(faq);
    expect(title).toBe("מה זה פלאשבק?");
    expect(text).toContain("חוויה חוזרת");
    expect(text).toContain("מה זה פלאשבק?");
  });

  it("skips url/id-like leaves and non-string values", () => {
    const item: Item = {
      id: "a2", groupId: "g2", type: "source", langId: "he", title: "DSM-5",
      content: JSON.stringify({ note: "מקור מרכזי", url: "https://x/y", year: 2013, ios_url: "z" }),
    };
    const { text } = extractText(item);
    expect(text).toContain("מקור מרכזי");
    expect(text).not.toContain("https://x/y");
    expect(text).not.toContain("2013");
    expect(text).not.toContain("z");
  });

  it("returns title-only text when content is empty/unparseable", () => {
    const item: Item = { id: "a3", groupId: "g3", type: "story", langId: "he", title: "סיפור", content: "" };
    const { text } = extractText(item);
    expect(text.trim()).toBe("סיפור");
  });

  it("returns title-only text when content is malformed non-empty JSON", () => {
    const item: Item = { id: "a4", groupId: "g4", type: "faq", langId: "he", title: "כותרת", content: "{not valid json" };
    const { text } = extractText(item);
    expect(text.trim()).toBe("כותרת");
  });

  it("walks nested objects/arrays and excludes skip-key subtrees", () => {
    const item: Item = {
      id: "a5", groupId: "g5", type: "treatment_step", langId: "he", title: "שלב",
      content: JSON.stringify({
        steps: [{ heading: "שלב ראשון", body: "תיאור מפורט" }],
        meta: { links: [{ url: "https://x/y", label: "לחצו כאן" }] },
      }),
    };
    const { text } = extractText(item);
    expect(text).toContain("שלב ראשון");
    expect(text).toContain("תיאור מפורט");
    expect(text).not.toContain("https://x/y");
    expect(text).not.toContain("לחצו כאן"); // whole `links` subtree skipped
  });
});
