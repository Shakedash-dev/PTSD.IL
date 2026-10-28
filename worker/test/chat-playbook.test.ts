import { describe, it, expect, vi, afterEach } from "vitest";
import { handleChat } from "../src/lib/chat";
import { buildQaIndex } from "../src/lib/qa";
import { buildContents } from "../src/lib/prompt";
import type { Item } from "../src/lib/content";
import { fakeKV } from "./kv";

afterEach(() => vi.restoreAllMocks());

// Fake bge-m3: fixed 3-dim vectors per text.
const VEC: Record<string, number[]> = {
  "how do i get treatment": [1, 0, 0],
  "איך מקבלים טיפול": [1, 0, 0],
  "where do i find a therapist": [0.97, 0.24, 0], // cos ~0.97 -> strong
  "something about treatment maybe": [1, 0.95, 0], // cos ~0.72 -> weak
  "tell me about cats": [0, 1, 0], // cos 0 -> none
  "i want to die": [0, 0.2, 1],
  "crisis question": [0, 0, 1],
};
const ai = () => ({ run: async (_m: string, i: { text: string[] }) => ({ data: i.text.map((t) => VEC[t] ?? [0.3, 0.3, 0.3]) }) });

const qa = (id: string, groupId: string, langId: string, c: Record<string, unknown>): Item => ({
  id, groupId, langId, type: "article", title: "", content: JSON.stringify(c), categorySlug: "chatbot-qa", categorySlugs: ["chatbot-qa"],
});

async function envWith(matches: unknown[]) {
  const env = {
    AI: ai(),
    RL: fakeKV(),
    VECTORIZE: { query: async () => ({ matches }) },
    GEMINI_MODEL: "m", GEMINI_API_KEY: "k",
  } as any;
  await buildQaIndex(env, [
    qa("t-he", "g-treat", "he", { question: "איך מקבלים טיפול", paraphrases: [], guidance: "GUIDANCE-HE", crisis: false }),
    qa("t-en", "g-treat", "en", { question: "how do i get treatment", paraphrases: [], guidance: "GUIDANCE-EN: first X, then Y", answer: "REF-EN", crisis: false }),
    qa("c-he", "g-crisis", "he", { question: "crisis question", paraphrases: [], guidance: "CRISIS-GUIDANCE: ERAN first", crisis: true }),
  ]);
  return env;
}

const HIT = { score: 0.9, metadata: { itemId: "1", groupId: "g", type: "faq", langId: "en", title: "T", text: "grounded fact", chunkIndex: 0, categorySlug: "rights" } };

function geminiSSE(text: string) {
  const enc = new TextEncoder();
  const frame = `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] })}\n\n`;
  return new Response(new ReadableStream({ start(c) { c.enqueue(enc.encode(frame)); c.close(); } }), { status: 200 });
}

async function run(env: any, content: string) {
  const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => geminiSSE("answer"));
  const log = vi.spyOn(console, "log").mockImplementation(() => {});
  const res = handleChat(env, { messages: [{ role: "user", content }], lang: "en", sessionId: "s" });
  const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
  let body = "";
  for (;;) { const { value, done } = await reader.read(); if (done) break; body += value; }
  const call = fetchSpy.mock.calls[0];
  const payload = call ? JSON.parse(String((call[1] as RequestInit).body)) : null;
  const userText: string = payload?.contents.at(-1).parts[0].text ?? "";
  const sys: string = payload?.systemInstruction.parts[0].text ?? "";
  const logs = log.mock.calls.map((c) => String(c[0]));
  return { body, payload, userText, sys, logs };
}

describe("handleChat playbooks", () => {
  it("strong match injects the user's-language PLAYBOOK before SOURCES with the follow rule", async () => {
    const r = await run(await envWith([HIT]), "where do i find a therapist");
    expect(r.userText).toMatch(/^PLAYBOOK:/);
    expect(r.userText).toContain("GUIDANCE-EN: first X, then Y");
    expect(r.userText).toContain("REF-EN");
    expect(r.userText).not.toContain("GUIDANCE-HE");
    expect(r.userText.indexOf("PLAYBOOK:")).toBeLessThan(r.userText.indexOf("SOURCES:"));
    expect(r.sys).toContain("A PLAYBOOK below was prepared by the site's team for this kind of question.");
    expect(r.sys).toContain("never contradict the playbook");
  });

  it("weak match injects a POSSIBLY RELEVANT PLAYBOOK with the use-only-if-it-fits rule", async () => {
    const r = await run(await envWith([HIT]), "something about treatment maybe");
    expect(r.userText).toMatch(/^POSSIBLY RELEVANT PLAYBOOK:/);
    expect(r.sys).toMatch(/use it only if it really fits/i);
    expect(r.sys).not.toContain("for this kind of question");
  });

  it("no match injects nothing and keeps the prompt unchanged", async () => {
    const r = await run(await envWith([HIT]), "tell me about cats");
    expect(r.userText).toMatch(/^SOURCES:/);
    expect(r.sys).not.toMatch(/PLAYBOOK/);
  });

  it("crisis always injects the crisis playbook, alongside the crisis event", async () => {
    const r = await run(await envWith([HIT]), "i want to die");
    expect(r.body).toContain("event: crisis");
    expect(r.userText).toMatch(/^CRISIS PLAYBOOK:/);
    expect(r.userText).toContain("CRISIS-GUIDANCE: ERAN first");
    expect(r.sys).toContain("CRISIS PLAYBOOK below");
  });

  it("strong match answers even with zero retrieval hits, and sends no sources", async () => {
    const r = await run(await envWith([]), "where do i find a therapist");
    expect(r.payload).not.toBeNull();
    expect(r.userText).toContain("SOURCES:\n(none)");
    expect(r.body).toContain("event: token");
    expect(r.body).not.toContain("event: sources");
    expect(r.body).toContain("event: done");
  });

  it("weak match with zero hits still refuses (no model call)", async () => {
    const r = await run(await envWith([]), "something about treatment maybe");
    expect(r.payload).toBeNull();
    expect(r.body).toContain("I can only help with topics covered on this site");
  });

  it("logs the best group and score for tuning, outside the SSE stream", async () => {
    const r = await run(await envWith([HIT]), "where do i find a therapist");
    const line = r.logs.find((l) => l.startsWith("qa-match "));
    expect(line).toBeTruthy();
    const data = JSON.parse(line!.slice("qa-match ".length));
    expect(data.best.groupId).toBe("g-treat");
    expect(data.best.score).toBeGreaterThan(0.9);
    expect(r.body).not.toContain("qa-match");
  });

  it("chat still works when the QA index can't be read", async () => {
    const env = await envWith([HIT]);
    env.RL = { get: async () => { throw new Error("kv down"); } };
    const r = await run(env, "where do i find a therapist");
    expect(r.userText).toMatch(/^SOURCES:/);
    expect(r.body).toContain("event: sources");
  });
});

describe("buildContents with playbooks", () => {
  it("orders crisis before strong and renders question, guidance and answer", () => {
    const out = buildContents([{ role: "user", content: "q" }], [], "en", [
      { kind: "strong", question: "Q1", guidance: "G1", answer: "A1" },
      { kind: "crisis", question: "Q2", guidance: "G2" },
    ]);
    const text = out.contents[0].parts[0].text;
    expect(text.indexOf("CRISIS PLAYBOOK:")).toBeLessThan(text.indexOf("\nPLAYBOOK:"));
    expect(text).toContain("Written for the question: Q1\nGuidance:\nG1\nReference answer");
    expect(text).toContain("A1");
    expect(out.systemInstruction.parts[0].text).toMatch(/counts as site content/);
  });
});

describe("crisis across turns", () => {
  it("keeps the crisis playbook when the user answers a follow-up with 'no'", async () => {
    const env = await envWith([HIT]);
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => geminiSSE("answer"));
    vi.spyOn(console, "log").mockImplementation(() => {});
    const res = handleChat(env, {
      messages: [
        { role: "user", content: "i want to die" },
        { role: "assistant", content: "are you safe right now?" },
        { role: "user", content: "no" },
      ],
      lang: "en",
      sessionId: "s",
    });
    const body = await new Response(res.body).text();
    expect(body).toContain("event: crisis");
    const call = vi.mocked(globalThis.fetch).mock.calls[0];
    const payload = JSON.parse(String((call[1] as RequestInit).body));
    expect(payload.contents.at(-1).parts[0].text).toContain("CRISIS-GUIDANCE");
  });

  it("drops the crisis after it leaves the last three user turns", async () => {
    const env = await envWith([HIT]);
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => geminiSSE("answer"));
    vi.spyOn(console, "log").mockImplementation(() => {});
    const msgs = ["i want to die", "ok", "thanks", "tell me about cats"].flatMap((c) => [
      { role: "user" as const, content: c }, { role: "assistant" as const, content: "..." },
    ]).slice(0, -1);
    const res = handleChat(env, { messages: msgs, lang: "en", sessionId: "s" });
    const body = await new Response(res.body).text();
    expect(body).not.toContain("event: crisis");
  });
});

describe("follow-up turns keep the previous message's strong playbook", () => {
  async function chat(env: any, messages: { role: "user" | "assistant"; content: string }[]) {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => geminiSSE("answer"));
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const aiRun = vi.spyOn(env.AI, "run");
    const body = await new Response(handleChat(env, { messages, lang: "en", sessionId: "s" }).body).text();
    const call = fetchSpy.mock.calls[0];
    const payload = call ? JSON.parse(String((call[1] as RequestInit).body)) : null;
    return {
      body,
      userText: (payload?.contents.at(-1).parts[0].text ?? "") as string,
      sys: (payload?.systemInstruction.parts[0].text ?? "") as string,
      aiTexts: aiRun.mock.calls.map((c) => (c[1] as { text: string[] }).text),
      logs: log.mock.calls.map((c) => String(c[0])),
    };
  }
  const u = (content: string) => ({ role: "user" as const, content });
  const a = (content: string) => ({ role: "assistant" as const, content });

  it("injects the previous message's strong match as PLAYBOOK, from one embedding call", async () => {
    const r = await chat(await envWith([HIT]), [u("how do i get treatment"), a("how old is the child?"), u("5")]);
    expect(r.userText).toMatch(/^PLAYBOOK:/);
    expect(r.userText).toContain("GUIDANCE-EN: first X, then Y");
    expect(r.sys).toContain("A PLAYBOOK below was prepared by the site's team for this kind of question.");
    expect(r.aiTexts).toEqual([["5", "how do i get treatment"]]);
    const line = r.logs.find((l) => l.startsWith("qa-match "))!;
    expect(JSON.parse(line.slice("qa-match ".length)).carried.groupId).toBe("g-treat");
  });

  it("answers with the carried playbook even with zero retrieval hits", async () => {
    const r = await chat(await envWith([]), [u("how do i get treatment"), a("how old is the child?"), u("5")]);
    expect(r.userText).toContain("GUIDANCE-EN");
    expect(r.body).not.toContain("I can only help with topics covered on this site");
  });

  it("does not carry a weak match from the previous message", async () => {
    const r = await chat(await envWith([HIT]), [u("something about treatment maybe"), a("which kind?"), u("5")]);
    expect(r.userText).toMatch(/^SOURCES:/);
  });

  it("uses only the user message directly before, and only when the bot replied after it", async () => {
    const older = await chat(await envWith([HIT]), [u("how do i get treatment"), a("..."), u("tell me about cats"), a("..."), u("5")]);
    expect(older.userText).toMatch(/^SOURCES:/);
    expect(older.aiTexts).toEqual([["5", "tell me about cats"]]);
    vi.restoreAllMocks();
    const noReply = await chat(await envWith([HIT]), [u("how do i get treatment"), u("5")]);
    expect(noReply.userText).toMatch(/^SOURCES:/);
    expect(noReply.aiTexts).toEqual([["5"]]);
  });

  it("keeps the current message's own strong match and adds no second block", async () => {
    const r = await chat(await envWith([HIT]), [u("tell me about cats"), a("..."), u("where do i find a therapist")]);
    expect(r.userText.match(/PLAYBOOK:/g)).toHaveLength(1);
    expect(r.logs.find((l) => l.startsWith("qa-match "))).not.toContain("carried");
  });

  it("puts the crisis playbook first and does not repeat it as the carried one", async () => {
    const r = await chat(await envWith([HIT]), [u("i want to die"), a("are you safe right now?"), u("no")]);
    expect(r.body).toContain("event: crisis");
    expect(r.userText).toMatch(/^CRISIS PLAYBOOK:/);
    expect(r.userText.match(/PLAYBOOK:/g)).toHaveLength(1);
    expect(r.aiTexts).toEqual([["no", "i want to die"]]);
  });
});
