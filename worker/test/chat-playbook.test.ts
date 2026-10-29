import { describe, it, expect, vi, afterEach } from "vitest";
import { handleChat, selectHits } from "../src/lib/chat";
import { QA_INDEX_KEY } from "../src/lib/qaLegacy";
import { buildContents } from "../src/lib/prompt";
import type { Hit } from "../src/lib/vector";
import { fakeKV } from "./kv";
import { qaItem as qa, seededEnv, legacyBlob } from "./qaEnv";

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
  "REF-EN": [0.1, 0.2, 0.3], // t-en's retrieval text (its answer)
  "CRISIS-ANSWER": [0.3, 0.1, 0.2],
};
const cos = (a: number[], b: number[]) => {
  const n = (v: number[]) => Math.hypot(...v);
  return a.reduce((s, x, i) => s + x * b[i], 0) / (n(a) * n(b));
};

const ROWS = (crisisAnswer = false) => [
  qa("t-he", "g-treat", "he", { question: "איך מקבלים טיפול", paraphrases: [], guidance: "GUIDANCE-HE", crisis: false }),
  qa("t-en", "g-treat", "en", { question: "how do i get treatment", paraphrases: [], guidance: "GUIDANCE-EN: first X, then Y", answer: "REF-EN", crisis: false }),
  qa("c-he", "g-crisis", "he", {
    question: "crisis question", paraphrases: [], guidance: "CRISIS-GUIDANCE: ERAN first", crisis: true,
    ...(crisisAnswer ? { answer: "CRISIS-ANSWER" } : {}),
  }),
];

// Playbooks stored the new way (item reindex into the language shards + KV
// rows). Every Vectorize query is a content query and goes to `env.content`: a
// query with a retrieval-text vector (in `guided`) gets those matches, any other
// `matches`.
async function envWith(matches: unknown[], opts: { guided?: Record<string, unknown[]>; crisisAnswer?: boolean } = {}) {
  const env = await seededEnv(VEC, ROWS(opts.crisisAnswer), { GEMINI_MODEL: "m", GEMINI_API_KEY: "k" });
  return withContent(env, matches, opts.guided);
}

function withContent(env: any, matches: unknown[], guided: Record<string, unknown[]> = {}) {
  env.content = vi.fn(async (v: number[], _o?: unknown) => {
    for (const [text, m] of Object.entries(guided)) if (cos(v, VEC[text]) > 0.999) return { matches: m };
    return { matches };
  });
  env.VECTORIZE = { ...env.VECTORIZE, query: env.content };
  return env;
}

// The state before the shard deploy's full reindex: no shards, the old one-value playbook index.
function legacyEnv(matches: unknown[], opts: { guided?: Record<string, unknown[]>; retrieval?: boolean } = {}) {
  const env = {
    AI: { run: async (_m: string, i: { text: string[] }) => ({ data: i.text.map((t) => VEC[t] ?? [0.3, 0.3, 0.3]) }) },
    RL: fakeKV({ [QA_INDEX_KEY]: legacyBlob(VEC, ROWS(), opts) }),
    VECTORIZE: { query: async () => ({ matches: [] }) },
    GEMINI_MODEL: "m", GEMINI_API_KEY: "k",
  } as any;
  return withContent(env, matches, opts.guided);
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

  it("the done event names the playbook used (crisis, carried, current), null without one", async () => {
    const done = (body: string) => JSON.parse(body.split("\n\n").find((f) => f.startsWith("event: done"))!.split("\ndata: ")[1]);
    const strong = done((await run(await envWith([HIT]), "where do i find a therapist")).body);
    expect(strong.playbook).toMatchObject({ groupId: "g-treat", strength: "strong" });
    expect(strong.playbook.score).toBeGreaterThan(0.9);
    vi.restoreAllMocks();
    expect(done((await run(await envWith([HIT]), "i want to die")).body).playbook).toMatchObject({ groupId: "g-crisis", strength: "crisis" });
    vi.restoreAllMocks();
    expect(done((await run(await envWith([HIT]), "tell me about cats")).body)).toEqual({ playbook: null });
    vi.restoreAllMocks();
    expect(done((await run(await envWith([]), "something about treatment maybe")).body).playbook).toMatchObject({ strength: "weak" }); // refusal path
  });

  it("chat still works when the QA index can't be read", async () => {
    const env = await envWith([HIT]);
    env.RL = { get: async () => { throw new Error("kv down"); } };
    const r = await run(env, "where do i find a therapist");
    expect(r.userText).toMatch(/^SOURCES:/);
    expect(r.body).toContain("event: sources");
  });
});

const hit = (id: string, score: number, langId = "en", text = `text ${id}`) => ({
  id, score, metadata: { itemId: id.split(":")[0], groupId: `g-${id}`, type: "article", langId, title: `T ${id}`, text, chunkIndex: Number(id.split(":")[1] ?? 0), categorySlug: "metiv" },
});
const sourcesOf = (body: string) => {
  const frame = body.split("\n\n").find((f) => f.startsWith("event: sources"));
  return frame ? (JSON.parse(frame.split("\ndata: ")[1]) as { itemId: string; text: string }[]) : [];
};

describe("playbook-guided retrieval", () => {
  const METIV = [hit("metiv-contacts:0", 0.62, "en", "METIV PHONE 02-6449666"), hit("metiv-org:0", 0.55, "en", "metiv org")];
  const OTHER = [hit("sc:0", 0.7), hit("sc:1", 0.68), hit("sc:2", 0.66)];

  it("a strong match runs exactly one extra query, with the row's answer vector, and its hits reach SOURCES", async () => {
    const env = await envWith(OTHER, { guided: { "REF-EN": METIV } });
    const r = await run(env, "where do i find a therapist");
    expect(env.content).toHaveBeenCalledTimes(2);
    const guidedVec = env.content.mock.calls[1][0] as number[];
    expect(cos(guidedVec, VEC["REF-EN"])).toBeGreaterThan(0.999);
    expect(env.content.mock.calls[1][1]).toEqual({ topK: 20, returnMetadata: "all" });
    expect(r.userText).toContain("METIV PHONE 02-6449666");
    expect(sourcesOf(r.body).map((s) => s.itemId)).toEqual(["sc", "sc", "sc", "metiv-contacts", "metiv-org"]);
    const line = r.logs.find((l) => l.startsWith("qa-match "))!;
    expect(JSON.parse(line.slice("qa-match ".length)).guide).toEqual({ groupId: "g-treat", hits: 2 });
  });

  it("a weak match and a carried strong match guide retrieval too", async () => {
    const weak = await envWith(OTHER, { guided: { "REF-EN": METIV } });
    expect(sourcesOf((await run(weak, "something about treatment maybe")).body).map((s) => s.itemId)).toContain("metiv-contacts");
    expect(weak.content).toHaveBeenCalledTimes(2);
    vi.restoreAllMocks();
    const carried = await envWith(OTHER, { guided: { "REF-EN": METIV } });
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => geminiSSE("answer"));
    vi.spyOn(console, "log").mockImplementation(() => {});
    const body = await new Response(handleChat(carried, {
      messages: [{ role: "user", content: "how do i get treatment" }, { role: "assistant", content: "how old?" }, { role: "user", content: "5" }],
      lang: "en", sessionId: "s",
    }).body).text();
    expect(carried.content).toHaveBeenCalledTimes(2);
    expect(sourcesOf(body).map((s) => s.itemId)).toContain("metiv-contacts");
  });

  it("no playbook match: no extra query", async () => {
    const env = await envWith(OTHER, { guided: { "REF-EN": METIV } });
    const r = await run(env, "tell me about cats");
    expect(env.content).toHaveBeenCalledTimes(1);
    expect(r.userText).not.toContain("METIV PHONE");
  });

  it("an old index built before retrieval vectors: no extra query, chat as before", async () => {
    const env = legacyEnv(OTHER, { guided: { "REF-EN": METIV }, retrieval: false });
    const r = await run(env, "where do i find a therapist");
    expect(env.content).toHaveBeenCalledTimes(1);
    expect(r.userText).toMatch(/^PLAYBOOK:/);
    expect(sourcesOf(r.body).map((s) => s.itemId)).toEqual(["sc", "sc", "sc"]);
  });

  it("crisis guides retrieval only when its row has an answer", async () => {
    const plain = await envWith(OTHER, { guided: { "CRISIS-ANSWER": METIV } });
    await run(plain, "i want to die");
    expect(plain.content).toHaveBeenCalledTimes(1);
    vi.restoreAllMocks();
    const withAnswer = await envWith(OTHER, { guided: { "CRISIS-ANSWER": METIV }, crisisAnswer: true });
    const r = await run(withAnswer, "i want to die");
    expect(withAnswer.content).toHaveBeenCalledTimes(2);
    expect(r.userText).toContain("METIV PHONE");
  });

  it("a failing guided query leaves the user-query SOURCES", async () => {
    const env = await envWith(OTHER);
    const q = env.content.getMockImplementation();
    let n = 0;
    env.content.mockImplementation(async (...a: any[]) => {
      if (n++ === 1) throw new Error("vectorize down");
      return q(...a);
    });
    const r = await run(env, "where do i find a therapist");
    expect(sourcesOf(r.body).map((s) => s.itemId)).toEqual(["sc", "sc", "sc"]);
    expect(r.logs.some((l) => l.startsWith("qa-guide-error vectorize down"))).toBe(true);
  });
});

describe("selectHits", () => {
  const h = (id: string, score: number, langId = "en"): Hit => {
    const r = hit(id, score, langId);
    return { id: r.id, score: r.score, meta: r.metadata };
  };
  const ids = (hs: Hit[]) => hs.map((x) => x.id);

  it("without guided hits it is the plain retrieval (min score, then top 15)", () => {
    const user = Array.from({ length: 20 }, (_, i) => h(`u${i}:0`, 0.9 - i * 0.01));
    expect(ids(selectHits(user, [], "en"))).toEqual(ids(user.slice(0, 15)));
    expect(selectHits([h("a:0", 0.39), h("b:0", 0.4)], [], "en").map((x) => x.id)).toEqual(["b:0"]);
  });

  it("dedupes by vector id at the higher score", () => {
    const out = selectHits([h("a:0", 0.5), h("b:0", 0.6), h("c:0", 0.7)], [h("a:0", 0.8), h("c:0", 0.45)], "en");
    expect(out.map((x) => [x.id, x.score])).toEqual([["a:0", 0.8], ["c:0", 0.7], ["b:0", 0.6]]);
  });

  it("applies the min score to guided hits too", () => {
    expect(ids(selectHits([h("a:0", 0.5)], [h("g:0", 0.39)], "en"))).toEqual(["a:0"]);
  });

  it("language rule runs on the union: 3+ in the user's language, else Hebrew, else all", () => {
    // 2 English user hits + 1 English guided hit = 3 -> English only.
    expect(ids(selectHits([h("a:0", 0.9), h("b:0", 0.8), h("he1:0", 0.85, "he")], [h("g:0", 0.5)], "en")))
      .toEqual(["a:0", "b:0", "g:0"]);
    // 2 English in all -> Hebrew rows, guided Hebrew rows included.
    expect(ids(selectHits([h("a:0", 0.9), h("he1:0", 0.85, "he")], [h("g:0", 0.5), h("he2:0", 0.6, "he")], "en")))
      .toEqual(["he1:0", "he2:0"]);
    // Neither -> everything.
    expect(ids(selectHits([h("a:0", 0.9)], [h("r:0", 0.5, "ru")], "en"))).toEqual(["a:0", "r:0"]);
  });

  it("keeps the top 5 guided hits even when 15 user hits outscore them", () => {
    const user = Array.from({ length: 20 }, (_, i) => h(`u${i}:0`, 0.9 - i * 0.01));
    const guided = Array.from({ length: 8 }, (_, i) => h(`g${i}:0`, 0.6 - i * 0.01));
    const out = selectHits(user, guided, "en");
    expect(out).toHaveLength(15);
    expect(ids(out)).toEqual([...ids(user.slice(0, 10)), ...ids(guided.slice(0, 5))]);
  });

  it("a guided hit that is also a top user hit counts toward the 5 and appears once", () => {
    const user = Array.from({ length: 20 }, (_, i) => h(`u${i}:0`, 0.9 - i * 0.01));
    const guided = [h("u0:0", 0.7), ...Array.from({ length: 6 }, (_, i) => h(`g${i}:0`, 0.6 - i * 0.01))];
    const out = selectHits(user, guided, "en");
    expect(out).toHaveLength(15);
    expect(new Set(ids(out)).size).toBe(15);
    expect(ids(out).filter((x) => x!.startsWith("g"))).toEqual(["g0:0", "g1:0", "g2:0", "g3:0"]);
  });

  it("falls back to itemId:chunkIndex when a match has no id", () => {
    const a = { score: 0.5, meta: h("x:0", 0).meta };
    expect(selectHits([a], [h("x:0", 0.7)], "en")).toHaveLength(1);
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
