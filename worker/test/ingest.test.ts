import { describe, it, expect, vi } from "vitest";
import { reindexItem } from "../src/lib/ingest";
import type { Item } from "../src/lib/content";

const item: Item = {
  id: "1", groupId: "g", type: "faq", langId: "he", title: "כותרת",
  content: JSON.stringify({ answer: "טקסט תשובה מספיק ארוך כדי להוות צ'אנק." }),
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
    const call = upsert.mock.calls[0][0] as unknown as Array<{ id: string; metadata: { itemId: string } }>;
    expect(call[0].id).toBe("1:0");
    expect(call[0].metadata.itemId).toBe("1");
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
