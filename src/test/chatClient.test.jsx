import { describe, it, expect, vi, afterEach } from "vitest";
import { streamChat } from "@/lib/chatClient";

afterEach(() => vi.restoreAllMocks());

function sse(frames) {
  const enc = new TextEncoder();
  return new Response(new ReadableStream({
    start(c) { for (const f of frames) c.enqueue(enc.encode(f)); c.close(); },
  }), { status: 200 });
}

function sseChunks(chunks) {
  const enc = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(c) { for (const ch of chunks) c.enqueue(enc.encode(ch)); c.close(); },
    }),
    { status: 200 },
  );
}

describe("streamChat", () => {
  it("calls onError('no_backend') and does not fetch when base is missing", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    let errorMsg = null;
    await streamChat(
      { base: undefined, messages: [], lang: "en", sessionId: "s" },
      { onError: (msg) => (errorMsg = msg) },
    );
    expect(errorMsg).toBe("no_backend");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("dispatches token, sources, done", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(sse([
      `event: token\ndata: ${JSON.stringify({ text: "Hi" })}\n\n`,
      `event: sources\ndata: ${JSON.stringify([{ n: 1, itemId: "1", type: "faq", title: "T" }])}\n\n`,
      `event: done\ndata: {}\n\n`,
    ]));
    const got = { tokens: [], sources: null, done: false };
    await streamChat(
      { base: "https://w", messages: [{ role: "user", content: "x" }], lang: "he", sessionId: "s" },
      { onToken: (t) => got.tokens.push(t), onSources: (s) => (got.sources = s), onDone: () => (got.done = true) },
    );
    expect(got.tokens.join("")).toBe("Hi");
    expect(got.sources[0].title).toBe("T");
    expect(got.done).toBe(true);
  });

  it("dispatches crisis and error frames", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(sse([
      `event: crisis\ndata: ${JSON.stringify({ lang: "en" })}\n\n`,
      `event: error\ndata: ${JSON.stringify({ message: "boom" })}\n\n`,
    ]));
    const seen = [];
    await streamChat(
      { base: "https://w", messages: [], lang: "en", sessionId: "s" },
      { onCrisis: () => seen.push("crisis"), onError: () => seen.push("error") },
    );
    expect(seen).toEqual(["crisis", "error"]);
  });

  it("passes the crisis lang and error message payloads to handlers", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(sse([
      `event: crisis\ndata: ${JSON.stringify({ lang: "he" })}\n\n`,
      `event: error\ndata: ${JSON.stringify({ message: "boom" })}\n\n`,
    ]));
    let crisisLang = null;
    let errorMsg = null;
    await streamChat(
      { base: "https://w", messages: [], lang: "he", sessionId: "s" },
      { onCrisis: (lang) => (crisisLang = lang), onError: (msg) => (errorMsg = msg) },
    );
    expect(crisisLang).toBe("he");
    expect(errorMsg).toBe("boom");
  });

  it("posts to `${base}/chat` with messages, lang, sessionId in the body", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(sse([`event: done\ndata: {}\n\n`]));
    await streamChat(
      { base: "https://w", messages: [{ role: "user", content: "hi" }], lang: "he", sessionId: "s1" },
      {},
    );
    expect(fetchMock).toHaveBeenCalledWith("https://w/chat", expect.objectContaining({
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "hi" }], lang: "he", sessionId: "s1" }),
    }));
  });

  it("dispatches onError('rate_limited') on a 429 response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 429 }));
    let errorMsg = null;
    await streamChat(
      { base: "https://w", messages: [], lang: "en", sessionId: "s" },
      { onError: (msg) => (errorMsg = msg) },
    );
    expect(errorMsg).toBe("rate_limited");
  });

  it("dispatches onError('http_500') on a non-ok status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 500 }));
    let errorMsg = null;
    await streamChat(
      { base: "https://w", messages: [], lang: "en", sessionId: "s" },
      { onError: (msg) => (errorMsg = msg) },
    );
    expect(errorMsg).toBe("http_500");
  });

  it("does not throw when no handlers are provided", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(sse([
      `event: token\ndata: ${JSON.stringify({ text: "Hi" })}\n\n`,
      `event: crisis\ndata: ${JSON.stringify({ lang: "he" })}\n\n`,
      `event: sources\ndata: []\n\n`,
      `event: error\ndata: ${JSON.stringify({ message: "boom" })}\n\n`,
      `event: done\ndata: {}\n\n`,
    ]));
    await expect(streamChat({ base: "https://w", messages: [], lang: "en", sessionId: "s" })).resolves.toBeUndefined();
  });

  it("dispatches two frames arriving in a single chunk", async () => {
    const two =
      `event: token\ndata: ${JSON.stringify({ text: "A" })}\n\n` +
      `event: token\ndata: ${JSON.stringify({ text: "B" })}\n\n`;
    vi.spyOn(globalThis, "fetch").mockResolvedValue(sseChunks([two]));
    const tokens = [];
    await streamChat({ base: "https://w", messages: [], lang: "en", sessionId: "s" }, { onToken: (t) => tokens.push(t) });
    expect(tokens).toEqual(["A", "B"]);
  });

  it("reassembles a frame split across two chunks", async () => {
    const frame = `event: token\ndata: ${JSON.stringify({ text: "Hello" })}\n\n`;
    const mid = Math.floor(frame.length / 2);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(sseChunks([frame.slice(0, mid), frame.slice(mid)]));
    const tokens = [];
    await streamChat({ base: "https://w", messages: [], lang: "en", sessionId: "s" }, { onToken: (t) => tokens.push(t) });
    expect(tokens.join("")).toBe("Hello");
  });

  it("survives a malformed data frame and keeps processing later frames", async () => {
    const chunks = [
      `event: token\ndata: {not json\n\n`,
      `event: token\ndata: ${JSON.stringify({ text: "ok" })}\n\n`,
    ];
    vi.spyOn(globalThis, "fetch").mockResolvedValue(sseChunks(chunks));
    const tokens = [];
    await streamChat({ base: "https://w", messages: [], lang: "en", sessionId: "s" }, { onToken: (t) => tokens.push(t) });
    expect(tokens).toContain("ok"); // loop survived the bad frame and delivered the next
  });
});
