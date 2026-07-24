import { describe, it, expect, vi, afterEach } from "vitest";
import { reindexItem, reindexById } from "../src/lib/ingest";
import type { Item } from "../src/lib/content";

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
