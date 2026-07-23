import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchAllItems, fetchItem } from "../src/lib/api";

afterEach(() => vi.restoreAllMocks());

describe("fetchAllItems", () => {
  it("normalizes and drops unpublished rows", async () => {
    const rows = [
      { id: "1", groupId: "g", type: "faq", langId: "he", title: "A", content: "{}", isPublished: true },
      { id: "2", groupId: "g", type: "faq", langId: "he", title: "B", content: "{}", isPublished: false },
    ];
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(rows), { status: 200 }));
    const items = await fetchAllItems("https://api/x");
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: "1", type: "faq", title: "A" });
    // Confirm the dropped row really was row "2" (unpublished), not just a count coincidence.
    expect(items.some((i) => i.id === "2")).toBe(false);
    // Confirm it actually hit the /articles endpoint on the given apiBase.
    expect(fetchSpy).toHaveBeenCalledWith("https://api/x/articles");
  });

  it("throws on non-200", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("nope", { status: 502 }));
    await expect(fetchAllItems("https://api/x")).rejects.toThrow(/502/);
  });

  it("accepts an {items:[...]} envelope in addition to a bare array", async () => {
    const rows = [
      { id: "1", groupId: "g", type: "faq", langId: "he", title: "A", content: "{}", isPublished: true },
    ];
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ items: rows }), { status: 200 })
    );
    const items = await fetchAllItems("https://api/x");
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: "1", title: "A" });
  });
});

describe("fetchItem", () => {
  it("returns a normalized item when published", async () => {
    const row = { id: "1", groupId: "g", type: "faq", langId: "he", title: "A", content: "{}", isPublished: true };
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(row), { status: 200 }));
    const item = await fetchItem("https://api/x", "1");
    expect(item).toMatchObject({ id: "1", type: "faq", title: "A" });
    expect(fetchSpy).toHaveBeenCalledWith("https://api/x/articles/1");
  });

  it("returns null for a 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("not found", { status: 404 }));
    const item = await fetchItem("https://api/x", "missing");
    expect(item).toBeNull();
  });

  it("returns null when the row exists but is unpublished", async () => {
    const row = { id: "2", groupId: "g", type: "faq", langId: "he", title: "B", content: "{}", isPublished: false };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(row), { status: 200 }));
    const item = await fetchItem("https://api/x", "2");
    expect(item).toBeNull();
  });

  it("throws on non-200/non-404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("nope", { status: 502 }));
    await expect(fetchItem("https://api/x", "1")).rejects.toThrow(/502/);
  });
});
