import { describe, it, expect, vi, afterEach } from "vitest";
import { verifyAdmin } from "../src/lib/auth";

afterEach(() => vi.restoreAllMocks());
const env = { ADMIN_VERIFY_URL: "https://api/admin/whoami" } as any;

describe("verifyAdmin", () => {
  it("false when header missing", async () => {
    expect(await verifyAdmin(env, null)).toBe(false);
  });
  it("true when backend accepts the token", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    expect(await verifyAdmin(env, "Bearer good")).toBe(true);
    expect(spy.mock.calls[0][1]).toMatchObject({ headers: { Authorization: "Bearer good" } });
  });
  it("false when backend rejects", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("no", { status: 401 }));
    expect(await verifyAdmin(env, "Bearer bad")).toBe(false);
  });
  it("does not call fetch when the header is missing (no network on the unauthenticated path)", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    expect(await verifyAdmin(env, null)).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });
  it("fails closed (returns false) when fetch throws", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));
    expect(await verifyAdmin(env, "Bearer good")).toBe(false);
  });
});
