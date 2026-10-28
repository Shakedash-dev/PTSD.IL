// Deterministic checks a translation must pass, whatever the model says. Each
// returns problems in English, keyed by the item path.

export type CheckIssue = { path: string; problem: string };

const DASHES = /[\u2013\u2014]/g;
const HAS_DASH = /[\u2013\u2014]/;

/** En and em dashes become a plain hyphen. Applied to every model output. */
export function normalizeDashes(s: string): string {
  return s.replace(DASHES, "-");
}

const URL_RE = /https?:\/\/[^\s<>()[\]"']+/gi;
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
// Israeli phone shapes: *1234 short codes and dash-joined numbers (03-1234567,
// +972-50-123-4567). Plain digit runs (1201) are covered by the digit check.
const PHONE_RE = /\*\d{3,5}\b|\+?\d[\d-]{6,}\d/g;
const PLACEHOLDER_RE = /\{[A-Za-z_][A-Za-z0-9_.]*\}/g;
const DIGITS_RE = /\d+/g;

const MD_LINK = /\[[^\]]*\]\([^)\s]+\)/g;
const MD_LIST = /^[ \t]*(?:[-*+]|\d+[.)])[ \t]+/gm;
const MD_HEADING = /^[ \t]*#{1,6}[ \t]/gm;
const MD_BOLD = /\*\*/g;

function all(re: RegExp, s: string): string[] {
  return (s.match(re) ?? []).map((m) => m.replace(/[.,;:!?]+$/, ""));
}

function counts(xs: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const x of xs) m.set(x, (m.get(x) ?? 0) + 1);
  return m;
}

// Tokens of the source that the translation lacks (multiset difference).
function missing(re: RegExp, src: string, out: string): string[] {
  const have = counts(all(re, out));
  const lost: string[] = [];
  for (const [tok, n] of counts(all(re, src))) {
    if ((have.get(tok) ?? 0) < n) lost.push(tok);
  }
  return lost;
}

/** Problems of one translated string against its source. */
export function checkText(src: string, out: string): string[] {
  const problems: string[] = [];
  if (!out.trim()) return src.trim() ? ["empty translation"] : [];
  const tokenChecks: [string, RegExp][] = [
    ["URL", URL_RE], ["email", EMAIL_RE], ["phone number", PHONE_RE],
    ["placeholder", PLACEHOLDER_RE], ["number", DIGITS_RE],
  ];
  for (const [label, re] of tokenChecks) {
    const lost = missing(re, src, out);
    if (lost.length) problems.push(`${label} not preserved exactly: ${lost.join(", ")}`);
  }
  const mdChecks: [string, RegExp][] = [
    ["Markdown links", MD_LINK], ["list items", MD_LIST], ["headings", MD_HEADING], ["bold markers", MD_BOLD],
  ];
  for (const [label, re] of mdChecks) {
    const a = (src.match(re) ?? []).length;
    const b = (out.match(re) ?? []).length;
    if (a !== b) problems.push(`${label}: source has ${a}, translation has ${b}`);
  }
  if (HAS_DASH.test(out)) problems.push("contains an en or em dash");
  return problems;
}

/** All problems of a translated map: missing paths plus per-string checks. */
export function checkItems(source: Record<string, string>, out: Record<string, string>): CheckIssue[] {
  const issues: CheckIssue[] = [];
  for (const [path, src] of Object.entries(source)) {
    if (typeof out[path] !== "string") {
      issues.push({ path, problem: "missing translation" });
      continue;
    }
    for (const problem of checkText(src, out[path])) issues.push({ path, problem });
  }
  return issues;
}
