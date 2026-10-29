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
    query: async () => ({ matches: [{ score: 0.9, metadata: { itemId: "1", groupId: "g", type: "faq", langId: "he", title: "T", text: "grounded fact", chunkIndex: 0, categorySlug: "rights" } }] }),
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

  it("answers a distress message with no retrieval hits instead of refusing", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(geminiSSE("You are not alone. ERAN 1201."));
    const env = baseEnv();
    env.VECTORIZE.query = async () => ({ matches: [] });
    const res = await handleChat(env, { messages: [{ role: "user", content: "I want to kill myself" }], lang: "en", sessionId: "s" });
    const body = await readSSE(res);
    expect(body).toContain("event: crisis");
    expect(body).toContain("ERAN 1201");
    expect(body).not.toContain("I can only help with topics");
    expect(body).toContain("event: done");
    expect(body).not.toContain("event: sources");
    expect(fetchSpy).toHaveBeenCalled();
  });

  it("drops an English-langId hit for a lang:he request when Hebrew hits exist", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(geminiSSE("hi"));
    const env = baseEnv();
    env.VECTORIZE.query = async () => ({
      matches: [
        { score: 0.9, metadata: { itemId: "en-1", groupId: "g", type: "faq", langId: "en", title: "EnT", text: "english fact", chunkIndex: 0 } },
        { score: 0.8, metadata: { itemId: "he-1", groupId: "g", type: "faq", langId: "he", title: "HeT", text: "עובדה בעברית", chunkIndex: 0 } },
      ],
    });
    const res = await handleChat(env, { messages: [{ role: "user", content: "שאלה" }], lang: "he", sessionId: "s" });
    const body = await readSSE(res);
    const line = body.split("\n").find((l) => l.startsWith("data:") && l.includes("itemId"));
    expect(line).toBeTruthy();
    const sources = JSON.parse(line!.slice(5).trim());
    expect(sources.some((s: any) => s.itemId === "en-1")).toBe(false);
    expect(sources.some((s: any) => s.itemId === "he-1")).toBe(true);
  });

  it("includes source text in the sources frame", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(geminiSSE("hi"));
    const res = await handleChat(baseEnv(), { messages: [{ role: "user", content: "hi" }], lang: "en", sessionId: "s" });
    const body = await readSSE(res);
    const line = body.split("\n").find((l) => l.startsWith("data:") && l.includes("itemId"));
    const sources = JSON.parse(line!.slice(5).trim());
    expect(sources[0].text).toBe("grounded fact");
  });

  it("includes categorySlug in the sources frame so faq chips can route to the right page", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(geminiSSE("hi"));
    const res = await handleChat(baseEnv(), { messages: [{ role: "user", content: "hi" }], lang: "en", sessionId: "s" });
    const body = await readSSE(res);
    const line = body.split("\n").find((l) => l.startsWith("data:") && l.includes("itemId"));
    const sources = JSON.parse(line!.slice(5).trim());
    expect(sources[0].categorySlug).toBe("rights");
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

  it("carries a Metiv row's key and section in the sources frame", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(geminiSSE("hi"));
    const env = baseEnv();
    env.VECTORIZE.query = async () => ({
      matches: [
        { score: 0.9, metadata: { itemId: "c", groupId: "g", type: "article", langId: "en", title: "CBT", text: "course", chunkIndex: 0, categorySlug: "metiv-courses", categorySlugs: ["metiv", "metiv-courses"], key: "cbt-trauma" } },
        { score: 0.8, metadata: { itemId: "l", groupId: "g2", type: "article", langId: "en", title: "LEGAL_DOCS", text: "terms", chunkIndex: 3, categorySlug: "metiv-legal-docs", categorySlugs: ["metiv", "metiv-legal-docs"], key: "LEGAL_DOCS", section: "terms" } },
        { score: 0.7, metadata: { itemId: "p", groupId: "g3", type: "faq", langId: "en", title: "T", text: "x", chunkIndex: 0, categorySlug: "rights" } },
      ],
    });
    const body = await readSSE(await handleChat(env, { messages: [{ role: "user", content: "hi" }], lang: "en", sessionId: "s", area: "therapist" }));
    const line = body.split("\n").find((l) => l.startsWith("data:") && l.includes("itemId"));
    const sources = JSON.parse(line!.slice(5).trim());
    expect(sources[0]).toMatchObject({ key: "cbt-trauma" });
    expect(sources[0].section).toBeUndefined();
    expect(sources[1]).toMatchObject({ key: "LEGAL_DOCS", section: "terms" });
    expect("key" in sources[2]).toBe(false);
  });
});

describe("model stops early", () => {
  const sseWith = (text: string, finishReason: string) => {
    const enc = new TextEncoder();
    const frame = `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text }] }, finishReason }] })}\n\n`;
    return new Response(new ReadableStream({ start(c) { c.enqueue(enc.encode(frame)); c.close(); } }), { status: 200 });
  };
  const hit = { score: 0.9, metadata: { itemId: "1", groupId: "g", type: "faq", langId: "en", title: "T", text: "fact", chunkIndex: 0 } };

  it("continues once after a filter stop: one continuous answer, no fallback line", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch")
      .mockImplementationOnce(async () => sseWith("Breathe in slowly for 4 sec", "PROHIBITED_CONTENT"))
      .mockImplementationOnce(async () => sseWith("onds, then breathe out slowly.", "STOP"));
    vi.spyOn(console, "log").mockImplementation(() => {});
    const env = baseEnv();
    env.VECTORIZE.query = async () => ({ matches: [hit, hit, hit] });
    const body = await readSSE(await handleChat(env, { messages: [{ role: "user", content: "panic attack now what do I do" }], lang: "en", sessionId: "s" }));
    expect(body).toContain("onds, then breathe out slowly.");
    expect(body).not.toContain("This answer was cut short");
    expect(body).toContain('"finishReason":"STOP"');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const second = JSON.parse(String((fetchSpy.mock.calls[1][1] as RequestInit).body));
    const roles = second.contents.map((c: any) => c.role);
    expect(roles.slice(-2)).toEqual(["model", "user"]);
    expect(second.contents.at(-2).parts[0].text).toBe("Breathe in slowly for 4 sec");
  });

  it("closes with a line in the user's language when the continuation stops too", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => sseWith("Breathe in slowly for 4 sec", "RECITATION"));
    vi.spyOn(console, "log").mockImplementation(() => {});
    const env = baseEnv();
    env.VECTORIZE.query = async () => ({ matches: [hit, hit, hit] });
    const body = await readSSE(await handleChat(env, { messages: [{ role: "user", content: "panic attack now what do I do" }], lang: "en", sessionId: "s" }));
    expect(body).toContain("This answer was cut short");
    expect(body).toContain('"finishReason":"RECITATION"');
  });

  it("adds nothing when the model finishes normally", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => sseWith("All good.", "STOP"));
    const env = baseEnv();
    env.VECTORIZE.query = async () => ({ matches: [hit, hit, hit] });
    const body = await readSSE(await handleChat(env, { messages: [{ role: "user", content: "hello there friend" }], lang: "en", sessionId: "s" }));
    expect(body).not.toContain("cut short");
    expect(body).toContain('"finishReason":"STOP"');
  });
});
