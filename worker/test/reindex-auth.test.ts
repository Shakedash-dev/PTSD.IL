import { describe, it, expect } from "vitest";
import app from "../src/index";

describe("/reindex auth", () => {
  it("401 without Authorization", async () => {
    const env = { ADMIN_VERIFY_URL: "https://api/admin/whoami", SITE_ORIGIN: "https://x" } as any;
    const res = await app.request(
      "/reindex",
      { method: "POST", body: JSON.stringify({ scope: "all" }), headers: { "content-type": "application/json" } },
      env,
    );
    expect(res.status).toBe(401);
  });
});
