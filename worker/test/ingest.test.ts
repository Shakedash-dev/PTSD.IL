import { describe, it, expect, vi, afterEach } from "vitest";
import { reindexItem, reindexById } from "../src/lib/ingest";
import type { Item } from "../src/lib/content";
import { fakeKV } from "./kv";

afterEach(() => vi.restoreAllMocks());

const item: Item = {
  id: "1", groupId: "g", type: "faq", langId: "he", title: "כותרת",
  content: JSON.stringify({ answer: "טקסט תשובה מספיק ארוך כדי להוות צ'אנק." }),
  categorySlug: "second-circle",
};

describe("reindexItem", () => {
  it("embeds chunks and upserts them with metadata", async () => {
    const upsert = vi.fn(async () => ({ mutationId: "m" }));
    // reindexItem clears stale chunks (deleteItem → deleteByIds) before upserting,
    // so the mock must provide deleteByIds too.
    const deleteByIds = vi.fn(async () => ({ mutationId: "m" }));
    const env = {
      AI: { run: async (_m: string, i: { text: string[] }) => ({ data: i.text.map(() => [0.1, 0.2]) }) },
      VECTORIZE: { upsert, deleteByIds },
    } as unknown as import("../src/index").Env;

    const out = await reindexItem(env, item);
    expect(out.upserted).toBeGreaterThan(0);
    const call = (upsert.mock.calls[0] as unknown[])[0] as Array<{ id: string; metadata: { itemId: string; categorySlug?: string } }>;
    expect(call[0].id).toBe("1:0");
    expect(call[0].metadata.itemId).toBe("1");
    expect(call[0].metadata.categorySlug).toBe("second-circle");
  });

  it("clears stale chunks and returns upserted:0 when there is no extractable text", async () => {
    const upsert = vi.fn(async () => ({ mutationId: "m" }));
    const deleteByIds = vi.fn(async () => ({ mutationId: "m" }));
    const env = {
      AI: { run: vi.fn() },
      VECTORIZE: { upsert, deleteByIds },
    } as unknown as import("../src/index").Env;

    const empty: Item = { id: "2", groupId: "g", type: "faq", langId: "he", title: "", content: "" };
    const out = await reindexItem(env, empty);

    expect(out.upserted).toBe(0);
    expect(deleteByIds).toHaveBeenCalledTimes(1);
    expect(upsert).not.toHaveBeenCalled();
  });
});

describe("reindexById (type-agnostic single-item sync)", () => {
  const aiEnv = (upsert: any, deleteByIds: any) => ({
    API_BASE: "https://api/x",
    AI: { run: async (_m: string, i: { text: string[] }) => ({ data: i.text.map(() => [0.1, 0.2]) }) },
    VECTORIZE: { upsert, deleteByIds },
    RL: fakeKV(),
  }) as unknown as import("../src/index").Env;

  it("indexes a community when the id is not an article (article 404 → community)", async () => {
    const upsert = vi.fn(async () => ({ mutationId: "m" }));
    const deleteByIds = vi.fn(async () => ({ mutationId: "m" }));
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url: any) => {
      const u = String(url);
      if (u.includes("/articles/")) return new Response("not found", { status: 404 });
      if (u.includes("/communities/")) return new Response(JSON.stringify({
        id: "c1", groupId: "cg", langId: "en", name: "NATAL - Support Groups",
        description: "Support groups for war-related trauma.", organization: "NATAL", isActive: true,
        targetAudiences: [{ name: "Spouses" }],
      }), { status: 200 });
      return new Response("[]", { status: 200 });
    });

    const out = await reindexById(aiEnv(upsert, deleteByIds), "c1");

    expect(out.upserted).toBeGreaterThan(0);
    const rows = (upsert.mock.calls[0] as unknown[])[0] as Array<{ metadata: { type: string; itemId: string } }>;
    expect(rows[0].metadata.type).toBe("community");
    expect(rows[0].metadata.itemId).toBe("c1");
  });

  it("drops vectors when the id is neither an article nor a community (deleted content)", async () => {
    const upsert = vi.fn();
    const deleteByIds = vi.fn(async () => ({ mutationId: "m" }));
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response("not found", { status: 404 }));

    const out = await reindexById(aiEnv(upsert, deleteByIds), "gone");

    expect(out.upserted).toBe(0);
    expect(deleteByIds).toHaveBeenCalledTimes(1);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("drops vectors when a community was deactivated (isActive:false)", async () => {
    const upsert = vi.fn();
    const deleteByIds = vi.fn(async () => ({ mutationId: "m" }));
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url: any) => {
      const u = String(url);
      if (u.includes("/articles/")) return new Response("not found", { status: 404 });
      return new Response(JSON.stringify({ id: "c2", name: "x", isActive: false }), { status: 200 });
    });

    const out = await reindexById(aiEnv(upsert, deleteByIds), "c2");

    expect(out.upserted).toBe(0);
    expect(deleteByIds).toHaveBeenCalledTimes(1);
    expect(upsert).not.toHaveBeenCalled();
  });
});

describe("chunkItem", async () => {
  const { chunkItem } = await import("../src/lib/ingest");
  const metivRow = (slug: string, title: string, content: Record<string, unknown>): Item => ({
    id: `m-${slug}`, groupId: "g", type: "article", langId: "he", title,
    content: JSON.stringify(content), categorySlug: slug, categorySlugs: ["metiv", slug],
  });

  it("starts every chunk of a long course with its title", () => {
    const para = (i: number) => `פסקה ${i} ${"תיאור הקורס ".repeat(30)}`;
    const course = metivRow("metiv-courses", "הכשרה לטיפול CBT בטראומה", {
      _key: "cbt-trauma", _col: "metiv-courses", slug: "cbt-trauma", title: "הכשרה לטיפול CBT בטראומה",
      description: Array.from({ length: 12 }, (_, i) => para(i)).join("\n\n"),
      lecturers: [{ name: "מרצה", role: "מנהלת ההכשרות" }],
      syllabus: [{ title: "שנה ראשונה", items: ["נושא א", "נושא ב"] }],
      faq: [{ q: "כמה עולה?", a: "10,350 ש\"ח לשנה" }],
    });
    const chunks = chunkItem(course);
    expect(chunks.length).toBeGreaterThan(2);
    for (const c of chunks) {
      expect(c.text.startsWith("הכשרה לטיפול CBT בטראומה\n\n")).toBe(true);
      expect(c.title).toBe("הכשרה לטיפול CBT בטראומה");
      expect(c.text.length).toBeLessThanOrEqual(1600 + 200);
    }
    expect(chunks.map((c) => c.index)).toEqual(chunks.map((_, i) => i));
    // The title inside the content is not repeated right after the header.
    expect(chunks[0].text.startsWith("הכשרה לטיפול CBT בטראומה\n\nהכשרה")).toBe(false);
    expect(chunks.at(-1)!.text).toContain("10,350");
  });

  it("keeps the age-group header on every chunk of a PTSD-IL row", () => {
    const long = Array.from({ length: 10 }, (_, i) => `קטע ${i} ${"מילים ".repeat(60)}`).join("\n\n");
    const kids: Item = { id: "k", groupId: "g", type: "article", langId: "he", title: "הנחיות", content: JSON.stringify({ body: long }), ageGroups: ["4-6"] };
    const chunks = chunkItem(kids);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.text.startsWith("הנחיות\n\nקבוצת גיל: 4-6\n\n")).toBe(true);
  });

  it("splits a singleton of named sub-documents into sections (LEGAL_DOCS)", () => {
    const docs = metivRow("metiv-legal-docs", "LEGAL_DOCS", {
      _key: "LEGAL_DOCS", _col: "metiv-legal-docs",
      privacy: { body: "## 1. מי אנחנו\n\nמדיניות הפרטיות", updated: "2026-10-01" },
      terms: { body: "## 1. קבלת התנאים\n\nתנאי השימוש", updated: "2026-10-01" },
    });
    const chunks = chunkItem(docs);
    expect(chunks.map((c) => c.section)).toEqual(["privacy", "terms"]);
    expect(chunks[0].text).toContain("מדיניות הפרטיות");
    expect(chunks[0].text).not.toContain("תנאי השימוש");
    expect(chunks[1].text.startsWith("LEGAL_DOCS\n\nterms\n\n")).toBe(true);
  });

  it("uses a sub-document's own title, and a singleton's content title", () => {
    const legal = metivRow("metiv-legal", "LEGAL", {
      _key: "LEGAL", _col: "metiv-legal",
      accessibility: { title: "הצהרת נגישות", sections: [{ title: "כללי", body: "האתר נבנה" }] },
      privacy: { title: "פרטיות", intro: "תקציר" },
    });
    const [acc, priv] = chunkItem(legal);
    expect(acc).toMatchObject({ section: "accessibility", title: "הצהרת נגישות" });
    expect(acc.text.startsWith("LEGAL\n\nהצהרת נגישות\n\nכללי")).toBe(true);
    expect(priv).toMatchObject({ section: "privacy", title: "פרטיות" });
    const sup = chunkItem(metivRow("metiv-supervision", "SUPERVISION", { _key: "SUPERVISION", _col: "metiv-supervision", title: "הדרכות למטפלים", intro: "טקסט" }));
    expect(sup).toEqual([{ text: "הדרכות למטפלים\n\nטקסט", index: 0, title: "הדרכות למטפלים" }]);
  });

  it("does not section list rows or singletons with prose fields, and keeps a paper's year", () => {
    const paper = metivRow("metiv-papers", "A paper", {
      _key: "A paper", _col: "metiv-papers", title: "A paper", authors: ["X, A."], journal: { name: "J" }, year: 2025,
    });
    const chunks = chunkItem(paper);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].section).toBeUndefined();
    expect(chunks[0].text).toContain("year: 2025");
  });
});

describe("reindexItem metadata", () => {
  it("writes the Metiv `_key` and the section into every chunk's metadata", async () => {
    const upsert = vi.fn(async () => ({ mutationId: "m" }));
    const env = {
      AI: { run: async (_m: string, i: { text: string[] }) => ({ data: i.text.map(() => [0.1, 0.2]) }) },
      VECTORIZE: { upsert, deleteByIds: vi.fn(async () => ({ mutationId: "m" })) },
    } as unknown as import("../src/index").Env;
    const docs: Item = {
      id: "ld", groupId: "g", type: "article", langId: "he", title: "LEGAL_DOCS", categorySlug: "metiv-legal-docs", categorySlugs: ["metiv", "metiv-legal-docs"],
      content: JSON.stringify({ _key: "LEGAL_DOCS", _col: "metiv-legal-docs", privacy: { body: "פרטיות" }, terms: { body: "תנאים" } }),
    };
    expect(await reindexItem(env, docs)).toEqual({ upserted: 2 });
    const rows = (upsert.mock.calls[0] as unknown[])[0] as Array<{ id: string; metadata: { key?: string; section?: string } }>;
    expect(rows.map((r) => [r.id, r.metadata.key, r.metadata.section])).toEqual([
      ["ld:0", "LEGAL_DOCS", "privacy"], ["ld:1", "LEGAL_DOCS", "terms"],
    ]);
  });
});
