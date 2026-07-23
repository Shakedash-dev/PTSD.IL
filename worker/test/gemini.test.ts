import { describe, it, expect, vi, afterEach } from "vitest";
import { streamGemini } from "../src/lib/gemini";

afterEach(() => vi.restoreAllMocks());

function sseBody(lines: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({
    start(ctrl) { for (const l of lines) ctrl.enqueue(enc.encode(l)); ctrl.close(); },
  });
}

describe("streamGemini", () => {
  it("yields text deltas from SSE data frames", async () => {
    const frames = [
      `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: "Hel" }] } }] })}\n\n`,
      `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: "lo" }] } }] })}\n\n`,
    ];
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(sseBody(frames), { status: 200 }));
    const env = { GEMINI_MODEL: "gemini-flash-latest", GEMINI_API_KEY: "k" } as any;
    const out: string[] = [];
    for await (const t of streamGemini(env, { systemInstruction: { parts: [{ text: "s" }] }, contents: [] })) out.push(t);
    expect(out.join("")).toBe("Hello");
  });

  it("throws on non-200", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("bad", { status: 400 }));
    const env = { GEMINI_MODEL: "m", GEMINI_API_KEY: "k" } as any;
    const gen = streamGemini(env, { systemInstruction: { parts: [{ text: "s" }] }, contents: [] });
    await expect(gen.next()).rejects.toThrow(/400/);
  });

  it("handles a data: line split across chunk boundaries", async () => {
    const frame = `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: "Hello" }] } }] })}\n\n`;
    const splitAt = Math.floor(frame.length / 2);
    const part1 = frame.slice(0, splitAt);
    const part2 = frame.slice(splitAt);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(sseBody([part1, part2]), { status: 200 }));
    const env = { GEMINI_MODEL: "m", GEMINI_API_KEY: "k" } as any;
    const out: string[] = [];
    for await (const t of streamGemini(env, { systemInstruction: { parts: [{ text: "s" }] }, contents: [] })) out.push(t);
    expect(out.join("")).toBe("Hello");
  });
});
