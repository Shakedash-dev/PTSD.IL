import { describe, it, expect, vi, afterEach } from "vitest";
import app from "../src/index";
import { translate, validateTranslateRequest } from "../src/lib/translate";
import { checkText, checkItems, normalizeDashes } from "../src/lib/translateChecks";
import { generateJson, streamGemini } from "../src/lib/gemini";
import { verifyAdminCached, tokenHash } from "../src/lib/auth";
import { renderGlossary, glossaryFor, GLOSSARY, TARGET_LANGS } from "../src/lib/glossary";
import { fakeKV } from "./kv";

afterEach(() => vi.restoreAllMocks());

const EN = "\u2013";
const EM = "\u2014";

describe("translate checks", () => {
  it("replaces en and em dashes with a hyphen", () => {
    expect(normalizeDashes(`a ${EN} b ${EM} c`)).toBe("a - b - c");
  });

  it("passes a faithful translation", () => {
    const src = "פנו ל**ער\"ן** ב-1201 או ב-[אתר](https://eran.org.il), {name}.\n- אחד\n- שניים";
    const out = "Contact **ERAN** at 1201 or the [website](https://eran.org.il), {name}.\n- one\n- two";
    expect(checkText(src, out)).toEqual([]);
  });

  it("flags lost URLs, emails, phones, numbers, placeholders", () => {
    const src = "כתבו ל-info@metiv.org, התקשרו 02-6449666 או *2784, {count} מקומות, 3 מפגשים, https://metiv.org/a";
    const problems = checkText(src, "Write to us, call us, places, three meetings");
    const all = problems.join(" | ");
    expect(all).toMatch(/email.*info@metiv\.org/);
    expect(all).toMatch(/phone number.*02-6449666/);
    expect(all).toMatch(/\*2784/);
    expect(all).toMatch(/placeholder.*\{count\}/);
    expect(all).toMatch(/number.*3/);
    expect(all).toMatch(/URL.*https:\/\/metiv\.org\/a/);
  });

  it("flags Markdown structure changes and dashes", () => {
    const src = "## כותרת\n- א\n- ב\n**חשוב** [קישור](https://x.org)";
    const problems = checkText(src, `Title\n- a\n**important** link ${EM} here`);
    const all = problems.join(" | ");
    expect(all).toMatch(/Markdown links: source has 1, translation has 0/);
    expect(all).toMatch(/list items: source has 2, translation has 1/);
    expect(all).toMatch(/headings: source has 1, translation has 0/);
    expect(all).toMatch(/en or em dash/);
  });

  it("reports missing paths and empty strings", () => {
    expect(checkItems({ a: "א", b: "ב" }, { a: "" })).toEqual([
      { path: "a", problem: "empty translation" },
      { path: "b", problem: "missing translation" },
    ]);
  });
});

describe("validateTranslateRequest", () => {
  const ok = { source: "he", target: "ar", items: { title: "שלום" } };
  it("accepts a valid request", () => {
    expect(validateTranslateRequest({ ...ok, context: "metiv / courses: x" })).toMatchObject({ ok: true });
  });
  it("rejects bad source, target, items, context", () => {
    expect(validateTranslateRequest({ ...ok, source: "en" })).toMatchObject({ status: 400, error: "unsupported_source" });
    expect(validateTranslateRequest({ ...ok, target: "he" })).toMatchObject({ status: 400, error: "unsupported_target" });
    expect(validateTranslateRequest({ ...ok, items: ["x"] })).toMatchObject({ status: 400, error: "invalid_items" });
    expect(validateTranslateRequest({ ...ok, items: { a: 1 } })).toMatchObject({ status: 400, error: "invalid_items" });
    expect(validateTranslateRequest({ ...ok, context: 5 })).toMatchObject({ status: 400, error: "invalid_context" });
    expect(validateTranslateRequest(null)).toMatchObject({ status: 400 });
  });
  it("413 over the size cap", () => {
    expect(validateTranslateRequest({ ...ok, items: { a: "א".repeat(40_001) } })).toMatchObject({ status: 413, error: "too_large" });
  });
});

// Gemini generateContent mock: routes by the system prompt (translator vs validator).
type Reply = (user: any) => unknown;
function mockGemini(translator: Reply[], validator: Reply[]) {
  const calls: { kind: string; url: string; headers: any; body: any }[] = [];
  vi.spyOn(globalThis, "fetch").mockImplementation(async (url: any, init?: any) => {
    const body = JSON.parse(init.body);
    const sys: string = body.systemInstruction.parts[0].text;
    const kind = sys.includes("strict, independent reviewer") ? "validator" : "translator";
    calls.push({ kind, url: String(url), headers: init.headers, body });
    const queue = kind === "validator" ? validator : translator;
    const reply = queue.shift();
    if (!reply) return new Response("no more", { status: 500 });
    const out = reply(JSON.parse(body.contents[0].parts[0].text));
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "thinking...", thought: true }, { text: JSON.stringify(out) }] } }] }), { status: 200 });
  });
  return calls;
}
const tr = (map: Record<string, string>) => () => ({ translations: Object.entries(map).map(([path, text]) => ({ path, text })) });
const noIssues = () => ({ issues: [] });

const env = () => ({ GEMINI_API_KEY: "secret-key", TRANSLATE_MODEL: "gemini-3.5-flash-lite" }) as any;
const req = (items: Record<string, string>) => ({ source: "he" as const, target: "en" as const, items, context: "metiv / services: x" });

describe("translate pipeline", () => {
  it("pass: clean translation, validator finds nothing", async () => {
    const calls = mockGemini([tr({ title: "Hello" })], [noIssues]);
    const out = await translate(env(), req({ title: "שלום" }));
    expect(out).toEqual({ target: "en", items: { title: "Hello" }, status: "pass", notes: [], model: "gemini-3.5-flash-lite" });
    expect(calls.map((c) => c.kind)).toEqual(["translator", "validator"]);
  });

  it("uses generateContent with the key in a header, JSON schema, low temperature and a thinking level", async () => {
    const calls = mockGemini([tr({ title: "Hello" })], [noIssues]);
    await translate(env(), req({ title: "שלום" }));
    const c = calls[0];
    expect(c.url).toBe("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent");
    expect(c.url).not.toContain("secret-key");
    expect(c.headers["x-goog-api-key"]).toBe("secret-key");
    expect(c.body.generationConfig).toMatchObject({ responseMimeType: "application/json", thinkingConfig: { thinkingLevel: "low" } });
    expect(c.body.generationConfig.temperature).toBeLessThanOrEqual(0.3);
    expect(c.body.generationConfig.responseSchema.properties.translations).toBeDefined();
    expect(calls[1].body.generationConfig.responseSchema.properties.issues).toBeDefined();
    expect(c.body.systemInstruction.parts[0].text).toContain("Metiv - The Israel Psychotrauma Center");
  });

  it("normalizes dashes silently (still pass)", async () => {
    mockGemini([tr({ t: `Metiv ${EM} center` })], [noIssues]);
    const out = await translate(env(), req({ t: "מטיב - מרכז" }));
    expect(out.items.t).toBe("Metiv - center");
    expect(out.status).toBe("pass");
  });

  it("fixed: validator fixes are applied and pass the re-check", async () => {
    let seen: any;
    mockGemini([tr({ a: "Call 1201", b: "Wrong meaning" })], [(u) => {
      seen = u;
      return { issues: [{ path: "b", problem: "meaning drift", severity: "serious", fix: "Right meaning" }] };
    }]);
    const out = await translate(env(), req({ a: "התקשרו 1201", b: "משמעות" }));
    expect(seen.items).toEqual([
      { path: "a", source: "התקשרו 1201", translation: "Call 1201" },
      { path: "b", source: "משמעות", translation: "Wrong meaning" },
    ]);
    expect(out.status).toBe("fixed");
    expect(out.items).toEqual({ a: "Call 1201", b: "Right meaning" });
    expect(out.notes).toEqual(["b: meaning drift (fixed)"]);
  });

  it("passes check findings to the validator, then retranslates once what still fails", async () => {
    let validatorInput: any;
    let retryInput: any;
    mockGemini(
      [tr({ a: "Call ERAN", b: "ok" }), (u) => { retryInput = u; return { translations: [{ path: "a", text: "Call ERAN at 1201" }] }; }],
      [(u) => { validatorInput = u; return { issues: [] }; }],
    );
    const out = await translate(env(), req({ a: "התקשרו לער\"ן 1201", b: "בסדר" }));
    expect(validatorInput.automatedCheckFindings).toEqual([{ path: "a", problem: "number not preserved exactly: 1201" }]);
    expect(retryInput.items).toEqual([{ path: "a", text: "התקשרו לער\"ן 1201", problemsToFix: ["number not preserved exactly: 1201"] }]);
    expect(out.status).toBe("fixed");
    expect(out.items.a).toBe("Call ERAN at 1201");
  });

  it("flagged: still failing after the one retranslate (no third translator call)", async () => {
    const calls = mockGemini([tr({ a: "Call ERAN" }), tr({ a: "Call ERAN again" })], [noIssues]);
    const out = await translate(env(), req({ a: "התקשרו 1201" }));
    expect(calls.filter((c) => c.kind === "translator")).toHaveLength(2);
    expect(out.status).toBe("flagged");
    expect(out.items.a).toBe("Call ERAN"); // failing retranslation is not taken
    expect(out.notes.join(" ")).toMatch(/1201/);
  });

  it("flagged: serious validator issue without a fix", async () => {
    mockGemini([tr({ a: "x" }), tr({ a: "y" })], [() => ({ issues: [{ path: "a", problem: "omits a sentence", severity: "serious", fix: "" }] })]);
    const out = await translate(env(), req({ a: "משפט. ועוד משפט." }));
    expect(out.status).toBe("flagged");
    expect(out.items.a).toBe("y");
    expect(out.notes.join(" ")).toMatch(/omits a sentence/);
  });

  it("flagged and key left out when a path never comes back", async () => {
    mockGemini([tr({ a: "A" }), tr({})], [noIssues]);
    const out = await translate(env(), req({ a: "א", b: "ב" }));
    expect(out.status).toBe("flagged");
    expect(out.items).toEqual({ a: "A" });
    expect(out.notes).toContain("b: missing translation");
  });

  it("flagged when the validator is unavailable", async () => {
    mockGemini([tr({ a: "A" })], []);
    const out = await translate(env(), req({ a: "א" }));
    expect(out.status).toBe("flagged");
    expect(out.notes[0]).toMatch(/validator unavailable/);
  });

  it("empty items: pass without any model call", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    expect((await translate(env(), req({}))).status).toBe("pass");
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("generateJson", () => {
  it("throws on non-200 and on non-JSON text", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("bad", { status: 429 }));
    const call = { model: "m", system: "s", user: "u", schema: {}, temperature: 0, thinkingLevel: "low" as const };
    await expect(generateJson(env(), call)).rejects.toThrow(/429/);
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "nope" }] }, finishReason: "MAX_TOKENS" }] }), { status: 200 }));
    await expect(generateJson(env(), call)).rejects.toThrow(/MAX_TOKENS/);
  });
});

describe("chat Gemini key placement", () => {
  it("streamGemini sends the key in x-goog-api-key, not the URL", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status: 200 }));
    const gen = streamGemini({ GEMINI_MODEL: "m", GEMINI_API_KEY: "secret-key" } as any, { systemInstruction: { parts: [{ text: "s" }] }, contents: [] });
    for await (const _ of gen) { /* drain */ }
    const [url, init] = spy.mock.calls[0] as [string, any];
    expect(url).not.toContain("secret-key");
    expect(url).not.toContain("key=");
    expect(init.headers["x-goog-api-key"]).toBe("secret-key");
  });
});

describe("verifyAdminCached", () => {
  it("caches a success under the token's sha256 (never the raw token) and skips the backend next time", async () => {
    const rl = fakeKV();
    const e = { ADMIN_VERIFY_URL: "https://api/admin", RL: rl } as any;
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    expect(await verifyAdminCached(e, "Bearer tok-123")).toBe(true);
    expect(await verifyAdminCached(e, "Bearer tok-123")).toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);
    const keys = [...rl.store.keys()];
    expect(keys).toEqual([`auth:${await tokenHash("Bearer tok-123")}`]);
    expect(keys[0]).toMatch(/^auth:[0-9a-f]{64}$/);
    expect(JSON.stringify([...rl.store])).not.toContain("tok-123");
  });

  it("does not cache failures", async () => {
    const rl = fakeKV();
    const e = { ADMIN_VERIFY_URL: "https://api/admin", RL: rl } as any;
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("no", { status: 401 }));
    expect(await verifyAdminCached(e, "Bearer bad")).toBe(false);
    expect(await verifyAdminCached(e, "Bearer bad")).toBe(false);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(rl.store.size).toBe(0);
  });
});

describe("POST /translate route", () => {
  const routeEnv = (rl = fakeKV()) => ({ SITE_ORIGIN: "https://site", ADMIN_VERIFY_URL: "https://api/admin", GEMINI_API_KEY: "k", RL: rl }) as any;
  const post = (body: unknown, e: any, auth = "Bearer good") =>
    app.request("/translate", { method: "POST", headers: { "content-type": "application/json", ...(auth ? { Authorization: auth } : {}) }, body: JSON.stringify(body) }, e);

  it("401 without a token", async () => {
    expect((await post({}, routeEnv(), "")).status).toBe(401);
  });

  it("400 / 413 on invalid requests", async () => {
    const e = routeEnv();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    expect((await post({ source: "he", target: "de", items: {} }, e)).status).toBe(400);
    expect((await post({ source: "he", target: "ru", items: { a: "x".repeat(40_001) } }, e)).status).toBe(413);
  });

  it("429 once the token is over its hourly limit", async () => {
    const hash = await tokenHash("Bearer good");
    const e = routeEnv(fakeKV({ [`auth:${hash}`]: "ok", [`rl:tr:${hash}`]: "240" }));
    expect((await post({ source: "he", target: "fr", items: { a: "א" } }, e)).status).toBe(429);
  });

  it("200 with the response contract, default model when TRANSLATE_MODEL is unset", async () => {
    const hash = await tokenHash("Bearer good");
    const e = routeEnv(fakeKV({ [`auth:${hash}`]: "ok" }));
    mockGemini([tr({ a: "Bonjour" })], [noIssues]);
    const res = await post({ source: "he", target: "fr", items: { a: "שלום" } }, e);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ target: "fr", items: { a: "Bonjour" }, status: "pass", notes: [], model: "gemini-3.5-flash-lite" });
  });

  it("502 when the translator call fails", async () => {
    const hash = await tokenHash("Bearer good");
    const e = routeEnv(fakeKV({ [`auth:${hash}`]: "ok" }));
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("down", { status: 503 }));
    const res = await post({ source: "he", target: "ar", items: { a: "שלום" } }, e);
    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ error: "translate_failed" });
  });
});

describe("glossary", () => {
  it("has every target language for every entry, and no en/em dashes anywhere", () => {
    for (const e of GLOSSARY) for (const l of TARGET_LANGS) expect(e[l].trim()).not.toBe("");
    expect(JSON.stringify(GLOSSARY)).not.toMatch(/[\u2013\u2014]/);
    for (const l of TARGET_LANGS) expect(glossaryFor(l)).toHaveLength(GLOSSARY.length);
  });

  it("renders one line per entry with the Metiv name", () => {
    const text = renderGlossary("en");
    expect(text.split("\n")).toHaveLength(GLOSSARY.length);
    expect(text).toContain("- מטיב => Metiv - The Israel Psychotrauma Center");
  });
});
