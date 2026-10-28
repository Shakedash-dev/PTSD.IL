import type { Env } from "../index";
import { generateJson } from "./gemini";
import { renderGlossary, TARGET_LANGS, type TargetLang } from "./glossary";
import { checkItems, checkText, normalizeDashes, type CheckIssue } from "./translateChecks";

// POST /translate (docs/metiv-db-spec.md section 4). One request translates one
// flat `path -> Hebrew text` map into one target language:
//   translator -> deterministic checks -> validator (issues + full-string fixes)
//   -> apply fixes -> re-check -> one retranslate of what still fails -> status.

export const DEFAULT_TRANSLATE_MODEL = "gemini-4-argon";
export const MAX_TOTAL_CHARS = 40_000;
export const MAX_ITEMS = 500;
const MAX_CONTEXT = 500;
const MAX_NOTES = 50;

export type TranslateRequest = {
  source: "he";
  target: TargetLang;
  items: Record<string, string>;
  context?: string;
};

export type TranslateResponse = {
  target: TargetLang;
  items: Record<string, string>;
  status: "pass" | "fixed" | "flagged";
  notes: string[];
  model: string;
};

type Invalid = { ok: false; status: 400 | 413; error: string };

export function validateTranslateRequest(body: unknown): { ok: true; req: TranslateRequest } | Invalid {
  const b = (body ?? {}) as Record<string, unknown>;
  if (b.source !== "he") return { ok: false, status: 400, error: "unsupported_source" };
  if (!(TARGET_LANGS as readonly unknown[]).includes(b.target)) return { ok: false, status: 400, error: "unsupported_target" };
  const items = b.items;
  if (!items || typeof items !== "object" || Array.isArray(items)) return { ok: false, status: 400, error: "invalid_items" };
  const entries = Object.entries(items as Record<string, unknown>);
  if (entries.some(([, v]) => typeof v !== "string")) return { ok: false, status: 400, error: "invalid_items" };
  if (b.context !== undefined && typeof b.context !== "string") return { ok: false, status: 400, error: "invalid_context" };
  const total = entries.reduce((n, [k, v]) => n + k.length + (v as string).length, 0);
  if (total > MAX_TOTAL_CHARS || entries.length > MAX_ITEMS) return { ok: false, status: 413, error: "too_large" };
  return {
    ok: true,
    req: {
      source: "he",
      target: b.target as TargetLang,
      items: items as Record<string, string>,
      ...(b.context ? { context: (b.context as string).slice(0, MAX_CONTEXT) } : {}),
    },
  };
}

const LANG: Record<TargetLang, { name: string; note: string }> = {
  ar: { name: "Arabic", note: "Modern Standard Arabic as read by Arabic speakers in Israel. Keep Western digits (0-9)." },
  en: { name: "English", note: "Clear international English, US spelling." },
  ru: { name: "Russian", note: "Standard Russian as read by Russian speakers in Israel." },
  fr: { name: "French", note: "Standard French as read by French speakers in Israel and in France." },
};

function rules(target: TargetLang): string {
  const { name, note } = LANG[target];
  return [
    `Target language: ${name}. ${note}`,
    "1. Translate faithfully and completely. Never add, drop, summarize or soften information. Keep the meaning, tone and level of certainty of the source.",
    "2. Never add claims that a treatment, method, program or service is effective, recommended, proven or evidence-based unless the Hebrew says exactly that.",
    `3. Register: natural, warm, plain ${name} for survivors and their families; when the context shows content for therapists and professionals (therapist area, courses, supervision, research, papers), the standard professional register of the field. Write as a native ${name} writer would, never word for word.`,
    "4. Hebrew gendered forms (slashed forms such as מטפל/ת or פנה/י, or a masculine used generically) become gender-neutral wording where the target language allows it naturally; otherwise use the language's standard generic form. Never output slashed gender forms.",
    "5. Keep exactly as in the source: URLs, email addresses, phone numbers (including short numbers such as 1201 and *1234), every number (as Western digits 0-9, never spelled out), and placeholders in curly braces such as {name}. Never translate, rename or remove anything inside {}.",
    "6. Keep the Markdown structure exactly: the same links (translate the link text, keep the URL), the same number of list items, the same headings, the same **bold** markers. Do not add or remove Markdown.",
    "7. Use the plain hyphen-minus (-) for every dash. Never use the en dash (U+2013) or the em dash (U+2014).",
    "8. Names: follow the GLOSSARY exactly. Israeli institutions and organizations get their official name in the target language when one exists; otherwise transliterate the Hebrew name and keep its meaning with a short explanation in parentheses on first mention. People's names are transliterated.",
    "9. Translate every item, consistently with the other items of the same request.",
    "",
    "GLOSSARY (Hebrew => required rendering, [notes]):",
    renderGlossary(target),
  ].join("\n");
}

function translatorSystem(target: TargetLang): string {
  return [
    `You are a professional medical and mental-health translator for an Israeli nonprofit for trauma care, which serves people affected by trauma, their families, and the professionals who treat them. You translate website content from Hebrew into ${LANG[target].name}.`,
    "Return every input path exactly once with its translation.",
    "",
    rules(target),
  ].join("\n");
}

function validatorSystem(target: TargetLang): string {
  return [
    `You are a strict, independent reviewer of Hebrew to ${LANG[target].name} translations for an Israeli trauma-care nonprofit's website. You did not write the translation. Compare every translated item with its Hebrew source and report real problems only:`,
    "- accuracy: wrong meaning, meaning drift, changed certainty, wrong numbers or names",
    "- omissions and additions, including any added claim that something is effective, recommended or proven",
    "- wrong or inconsistent terminology, and any deviation from the GLOSSARY",
    "- unnatural or machine-like phrasing, wrong register for the audience, slashed gender forms",
    "- broken placeholders, URLs, emails, phone numbers, numbers or Markdown, and en or em dashes",
    "Also resolve every AUTOMATED CHECK FINDING you are given.",
    "For each problem return {path, problem, severity, fix}. problem: one short sentence in English. severity: \"serious\" for meaning, omission, addition, terminology, glossary, placeholder, number or Markdown problems, \"minor\" for phrasing and style. fix: the FULL corrected translation of that item (never a fragment), applying every problem of that path and following all the rules below; prefer one issue per path. Leave fix empty only if you cannot produce a correct translation.",
    "Do not mention items that are correct. Do not report preferences when the translation is already correct and natural. If everything is correct return {\"issues\": []}.",
    "",
    "The translation had to follow these rules:",
    rules(target),
  ].join("\n");
}

const TRANSLATION_SCHEMA = {
  type: "OBJECT",
  properties: {
    translations: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { path: { type: "STRING" }, text: { type: "STRING" } },
        required: ["path", "text"],
      },
    },
  },
  required: ["translations"],
};

const ISSUES_SCHEMA = {
  type: "OBJECT",
  properties: {
    issues: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          path: { type: "STRING" },
          problem: { type: "STRING" },
          severity: { type: "STRING", enum: ["minor", "serious"] },
          fix: { type: "STRING" },
        },
        required: ["path", "problem", "severity", "fix"],
      },
    },
  },
  required: ["issues"],
};

type ValidatorIssue = { path: string; problem: string; severity: "minor" | "serious"; fix: string };

function model(env: Env): string {
  return env.TRANSLATE_MODEL || DEFAULT_TRANSLATE_MODEL;
}

// One translator call for a subset of paths. `issues` turns it into a retranslate.
async function translateCall(
  env: Env, req: TranslateRequest, paths: string[], issues?: Map<string, string[]>,
): Promise<Record<string, string>> {
  const payload = {
    ...(req.context ? { context: req.context } : {}),
    ...(issues ? { instructions: "These items failed review. Translate them again from the Hebrew and fix every listed problem." } : {}),
    items: paths.map((path) => ({
      path, text: req.items[path], ...(issues?.get(path) ? { problemsToFix: issues.get(path) } : {}),
    })),
  };
  const out = await generateJson<{ translations?: { path?: string; text?: string }[] }>(env, {
    model: model(env), system: translatorSystem(req.target), user: JSON.stringify(payload),
    schema: TRANSLATION_SCHEMA, temperature: 0.2, thinkingLevel: "low",
  });
  const want = new Set(paths);
  const result: Record<string, string> = {};
  for (const t of out.translations ?? []) {
    if (typeof t.path === "string" && want.has(t.path) && typeof t.text === "string") result[t.path] = normalizeDashes(t.text);
  }
  return result;
}

async function validateCall(
  env: Env, req: TranslateRequest, translated: Record<string, string>, checks: CheckIssue[],
): Promise<ValidatorIssue[]> {
  const payload = {
    ...(req.context ? { context: req.context } : {}),
    items: Object.keys(req.items).map((path) => ({ path, source: req.items[path], translation: translated[path] ?? "" })),
    ...(checks.length ? { automatedCheckFindings: checks } : {}),
  };
  const out = await generateJson<{ issues?: Partial<ValidatorIssue>[] }>(env, {
    model: model(env), system: validatorSystem(req.target), user: JSON.stringify(payload),
    schema: ISSUES_SCHEMA, temperature: 0.1, thinkingLevel: "medium",
  });
  return (out.issues ?? [])
    .filter((i): i is ValidatorIssue => typeof i.path === "string" && i.path in req.items && typeof i.problem === "string")
    .map((i) => ({ ...i, severity: i.severity === "minor" ? "minor" : "serious", fix: typeof i.fix === "string" ? i.fix : "" }));
}

export async function translate(env: Env, req: TranslateRequest): Promise<TranslateResponse> {
  const paths = Object.keys(req.items);
  const done = (items: Record<string, string>, status: TranslateResponse["status"], notes: string[]): TranslateResponse =>
    ({ target: req.target, items, status, notes: notes.slice(0, MAX_NOTES), model: model(env) });
  if (paths.length === 0) return done({}, "pass", []);

  const items = await translateCall(env, req, paths);
  const firstChecks = checkItems(req.items, items);
  const notes: string[] = [];

  let issues: ValidatorIssue[] = [];
  let validatorFailed = false;
  try {
    issues = await validateCall(env, req, items, firstChecks);
  } catch (e) {
    validatorFailed = true;
    notes.push(`validator unavailable: ${(e as Error).message}`);
  }

  const fixed = new Set<string>();
  for (const i of issues) {
    notes.push(`${i.path}: ${i.problem}${i.fix ? " (fixed)" : ""}`);
    if (i.fix.trim()) {
      items[i.path] = normalizeDashes(i.fix);
      fixed.add(i.path);
    }
  }
  const unresolved = new Set(issues.filter((i) => i.severity === "serious" && !fixed.has(i.path)).map((i) => i.path));

  let checks = checkItems(req.items, items);
  const failing = new Set([...checks.map((c) => c.path), ...unresolved]);
  if (failing.size === 0) {
    if (validatorFailed) return done(items, "flagged", notes);
    return done(items, fixed.size ? "fixed" : "pass", notes);
  }

  // One retranslate of what still fails, with every known problem in the prompt.
  const problems = new Map<string, string[]>();
  for (const c of checks) problems.set(c.path, [...(problems.get(c.path) ?? []), c.problem]);
  for (const i of issues) if (unresolved.has(i.path)) problems.set(i.path, [...(problems.get(i.path) ?? []), i.problem]);
  let retry: Record<string, string> = {};
  try {
    retry = await translateCall(env, req, [...failing], problems);
  } catch (e) {
    notes.push(`retranslate failed: ${(e as Error).message}`);
  }
  for (const [path, text] of Object.entries(retry)) {
    // Keep the retranslation only where it passes the checks.
    if (checkText(req.items[path], text).length === 0) {
      items[path] = text;
      fixed.add(path);
      notes.push(`${path}: retranslated`);
    }
  }

  checks = checkItems(req.items, items);
  for (const c of checks) notes.push(`${c.path}: ${c.problem}`);
  // Serious validator problems without a fix were retranslated but not re-reviewed.
  for (const p of unresolved) notes.push(`${p}: serious issue retranslated without a second review`);
  // Missing paths are left out: the caller keeps the sibling's current text.
  const missing = new Set(checks.filter((c) => c.problem === "missing translation").map((c) => c.path));
  const out = Object.fromEntries(Object.entries(items).filter(([p]) => !missing.has(p)));
  const flagged = checks.length > 0 || unresolved.size > 0 || validatorFailed;
  return done(out, flagged ? "flagged" : "fixed", notes);
}
