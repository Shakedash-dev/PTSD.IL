import { describe, it, expect, vi, afterEach } from "vitest";
import { handleChat } from "../src/lib/chat";

afterEach(() => vi.restoreAllMocks());

async function readSSE(res: Response): Promise<string> {
  const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
  let out = "";
  for (;;) { const { value, done } = await reader.read(); if (done) break; out += value; }
  return out;
}

const baseEnv = () => ({
  AI: { run: async (_m: string, i: { text: string[] }) => ({ data: i.text.map(() => [0.1, 0.2]) }) },
  VECTORIZE: {
    query: async () => ({ matches: [{ score: 0.9, metadata: { itemId: "1", groupId: "g", type: "faq", langId: "he", title: "T", text: "grounded fact", chunkIndex: 0 } }] }),
  },
  GEMINI_MODEL: "m", GEMINI_API_KEY: "k",
}) as any;

function geminiSSE(text: string) {
  const enc = new TextEncoder();
  const frame = `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] })}\n\n`;
  return new Response(new ReadableStream({ start(c) { c.enqueue(enc.encode(frame)); c.close(); } }), { status: 200 });
}

describe("handleChat", () => {
  it("emits crisis frame for distress messages", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(geminiSSE("hang in there [[1]]"));
    const res = await handleChat(baseEnv(), { messages: [{ role: "user", content: "I want to kill myself" }], lang: "en", sessionId: "s" });
    const body = await readSSE(res);
    expect(body).toContain("event: crisis");
    expect(body).toContain("event: token");
    expect(body).toContain("event: sources");
    expect(body).toContain("event: done");
  });

  it("refuses when retrieval is empty", async () => {
    const env = baseEnv();
    env.VECTORIZE.query = async () => ({ matches: [] });
    const res = await handleChat(env, { messages: [{ role: "user", content: "unrelated" }], lang: "en", sessionId: "s" });
    const body = await readSSE(res);
    expect(body).toContain("event: token");
    expect(body).not.toContain("event: sources");
    expect(body).toContain("event: done");
  });

  it("emits an error frame and closes the stream when retrieval throws", async () => {
    const env = baseEnv();
    env.VECTORIZE.query = async () => { throw new Error("vectorize down"); };
    const res = await handleChat(env, { messages: [{ role: "user", content: "hi" }], lang: "en", sessionId: "s" });
    const body = await readSSE(res); // completes only if the stream is closed (no hang)
    expect(body).toContain("event: error");
    expect(body).toContain("vectorize down");
  });

  it("emits a crisis frame AND grounded refusal when a distress message has no retrieval hits", async () => {
    const env = baseEnv();
    env.VECTORIZE.query = async () => ({ matches: [] });
    const res = await handleChat(env, { messages: [{ role: "user", content: "I want to kill myself" }], lang: "en", sessionId: "s" });
    const body = await readSSE(res);
    expect(body).toContain("event: crisis");
    expect(body).toContain("event: token"); // refusal text
    expect(body).toContain("event: done");
    expect(body).not.toContain("event: sources");
  });

  it("emits frames in order: crisis < token < sources < done", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(geminiSSE("hang in there [[1]]"));
    const res = await handleChat(baseEnv(), { messages: [{ role: "user", content: "I want to kill myself" }], lang: "en", sessionId: "s" });
    const body = await readSSE(res);
    const iCrisis = body.indexOf("event: crisis");
    const iToken = body.indexOf("event: token");
    const iSources = body.indexOf("event: sources");
    const iDone = body.indexOf("event: done");
    expect(iCrisis).toBeGreaterThanOrEqual(0);
    expect(iCrisis).toBeLessThan(iToken);
    expect(iToken).toBeLessThan(iSources);
    expect(iSources).toBeLessThan(iDone);
  });
});
