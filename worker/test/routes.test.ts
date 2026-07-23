import { describe, it, expect, vi, afterEach } from "vitest";
import app from "../src/index";

afterEach(() => vi.restoreAllMocks());

function fakeKV(initial: Record<string, string> = {}) {
  const m = new Map(Object.entries(initial));
  return { get: async (k: string) => m.get(k) ?? null, put: async (k: string, v: string) => void m.set(k, v) } as any;
}
function geminiSSE(text: string) {
  const enc = new TextEncoder();
  const frame = `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] })}\n\n`;
  return new Response(new ReadableStream({ start(c) { c.enqueue(enc.encode(frame)); c.close(); } }), { status: 200 });
}
function baseEnv(rl = fakeKV()) {
  return {
    AI: { run: async (_m: string, i: { text: string[] }) => ({ data: i.text.map(() => [0.1, 0.2]) }) },
    VECTORIZE: { query: async () => ({ matches: [{ score: 0.9, metadata: { itemId: "1", groupId: "g", type: "faq", langId: "he", title: "T1", text: "grounded", chunkIndex: 0 } }] }) },
    RL: rl,
    SITE_ORIGIN: "https://site",
    GEMINI_MODEL: "m",
    GEMINI_API_KEY: "k",
  } as any;
}
async function readSSE(res: Response) {
  const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
  let out = "";
  for (;;) { const { value, done } = await reader.read(); if (done) break; out += value; }
  return out;
}

describe("/chat route", () => {
  it("streams SSE with populated source fields for an under-limit request", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(geminiSSE("hi [[1]]"));
    const res = await app.request("/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "x" }], lang: "en", sessionId: "s1" }),
    }, baseEnv());
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    const body = await readSSE(res);
    expect(body).toContain("event: token");
    expect(body).toContain("event: done");
    const line = body.split("\n").find((l) => l.startsWith("data:") && l.includes("itemId"));
    expect(line).toBeTruthy();
    const sources = JSON.parse(line!.slice(5).trim());
    expect(sources[0].itemId).toBe("1");
    expect(sources[0].title).toBe("T1");
    expect(sources[0].n).toBe(1);
    expect(sources[0].text).toBe("grounded");
  });

  it("returns 429 when the session is already over the rate limit", async () => {
    const res = await app.request("/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "x" }], lang: "en", sessionId: "s2" }),
    }, baseEnv(fakeKV({ "rl:s2": "20" })));
    expect(res.status).toBe(429);
  });
});
