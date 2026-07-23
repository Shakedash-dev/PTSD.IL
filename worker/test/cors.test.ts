import { describe, it, expect } from "vitest";
import app from "../src/index";

describe("CORS preflight", () => {
  it("permits the Authorization header on the /reindex preflight", async () => {
    const env = { SITE_ORIGIN: "https://site", ADMIN_VERIFY_URL: "https://api/admin/whoami" } as any;
    const res = await app.request(
      "/reindex",
      {
        method: "OPTIONS",
        headers: {
          Origin: "https://site",
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "authorization,content-type",
        },
      },
      env,
    );
    const allow = (res.headers.get("access-control-allow-headers") ?? "").toLowerCase();
    expect(allow).toContain("authorization");
  });
});
