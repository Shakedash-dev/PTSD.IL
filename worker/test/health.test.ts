import { describe, it, expect } from "vitest";
import app from "../src/index";

describe("health", () => {
  it("GET /health returns ok", async () => {
    // Pass a mock env: the global CORS middleware (Task 13) reads env.SITE_ORIGIN.
    const res = await app.request("/health", undefined, { SITE_ORIGIN: "https://x" } as any);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
