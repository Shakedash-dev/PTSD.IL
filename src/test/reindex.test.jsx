import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { reindexItem, ChatbotSyncError } from "@/api/reindex";

vi.mock("@/lib/auth", () => ({ getToken: () => "tok" }));

beforeEach(() => vi.stubEnv("VITE_CHATBOT_URL", "https://worker"));
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

describe("reindexItem", () => {
  it("POSTs {scope:item,itemId} to the worker with the admin bearer token", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    await reindexItem("abc");
    expect(fetchMock).toHaveBeenCalledWith("https://worker/reindex", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ Authorization: "Bearer tok" }),
      body: JSON.stringify({ scope: "item", itemId: "abc" }),
    }));
  });

  it("no-ops (no fetch) for a falsy id", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    expect(await reindexItem(undefined)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws ChatbotSyncError on a non-ok response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("boom", { status: 500 }));
    await expect(reindexItem("abc")).rejects.toBeInstanceOf(ChatbotSyncError);
  });

  it("throws ChatbotSyncError on a network failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    await expect(reindexItem("abc")).rejects.toBeInstanceOf(ChatbotSyncError);
  });

  it("throws ChatbotSyncError when the worker URL is not configured", async () => {
    vi.stubEnv("VITE_CHATBOT_URL", "");
    await expect(reindexItem("abc")).rejects.toBeInstanceOf(ChatbotSyncError);
  });
});
