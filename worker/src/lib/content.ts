import { isMetivItem, METIV_COLLECTION_KEYS } from "./api";

export type Item = {
  id: string;
  groupId: string;
  type: string;
  langId: string;
  title: string;
  content: string; // JSON string, may be empty
  // Slug of the item's primary category (from the `categories` relation on the
  // bulk /articles response), used to route `type=faq` chat citations to the
  // right page (rights vs ptsd-info vs second-circle). Absent when the item
  // has no category assigned.
  categorySlug?: string;
  // Every category slug the row carries (a Metiv row has both `metiv` and its
  // `metiv-<collection>` child). Drives index exclusions and chip routing.
  categorySlugs?: string[];
  // Names of the row's `ageGroups` / `audiences` relations (e.g. "4-6",
  // "נפגעי פעולות איבה"). Absent when the row has none.
  ageGroups?: string[];
  audiences?: string[];
};

// Leaf keys that carry URLs/ids/non-prose - never index as text.
const SKIP_KEYS = new Set([
  "url", "ios_url", "android_url", "cta_url", "contact_url", "link", "links",
  "id", "groupId", "parentId", "authorId", "image", "icon", "slug", "year",
]);

// Metiv rows keep their URL leaves (the ERAN WhatsApp link, registration forms),
// labelled with their key, and their `year` (papers, books, the history
// timeline), so only the id/media keys are skipped.
const METIV_KEEP_KEYS = ["url", "ios_url", "android_url", "cta_url", "contact_url", "link", "links", "year"];
const METIV_SKIP_KEYS = new Set([...SKIP_KEYS].filter((k) => !METIV_KEEP_KEYS.includes(k)));

// Keys that say nothing about what the value is ("value: 054-...").
const GENERIC_KEYS = new Set(["value", "href", "url", "link", "text"]);

const isUrl = (v: string) => /^(https?:\/\/|mailto:|tel:)/i.test(v) || /^\/\S*$/.test(v);
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const hasLetters = (v: string) => /\p{L}/u.test(v);

// Resolves a `$ref` ("KEY#_key" or "KEY") to the referenced item's content.
export type RefResolver = (ref: string) => unknown;

function walk(node: unknown, key: string, out: string[]): void {
  if (typeof node === "string") {
    const v = node.trim();
    if (!v || /^https?:\/\//i.test(v)) return;
    out.push(v);
  } else if (Array.isArray(node)) {
    for (const child of node) walk(child, key, out);
  } else if (node && typeof node === "object") {
    for (const [k, child] of Object.entries(node)) {
      // `_key`/`_tr`/... are reserved bookkeeping and `$ref` points at an item
      // indexed under its own collection (docs/metiv-db-spec.md section 1).
      if (SKIP_KEYS.has(k) || k.startsWith("_") || k === "$ref") continue;
      walk(child, k, out);
    }
  }
}

// Where a Metiv leaf sits: its own key, the key of the object holding it (when
// that object is a named property, e.g. `phones`), and that object's `label`.
type Ctx = { key: string; parent?: string; label?: string; depth: number; inArray?: boolean };

function labelFor(ctx: Ctx): string {
  if (ctx.label) return ctx.label;
  if (ctx.parent && (GENERIC_KEYS.has(ctx.key) || /^\d*$/.test(ctx.key))) return ctx.parent;
  if (ctx.parent) return `${ctx.parent}.${ctx.key}`;
  return ctx.key;
}

// Metiv variant: values that do not describe themselves (phones, numbers,
// emails, URLs) keep the nearest meaningful key ("phones.fax: 02-644-9777",
// "ERAN_WHATSAPP: https://..."), and `$ref`s are replaced by the item they name.
function walkMetiv(node: unknown, ctx: Ctx, out: string[], resolve?: RefResolver): void {
  if (ctx.depth > 8) return;
  if (typeof node === "string" || typeof node === "number") {
    const v = String(node).trim();
    if (!v) return;
    const label = labelFor(ctx);
    const bare = typeof node === "string" && hasLetters(v) && !isUrl(v) && !isEmail(v);
    out.push(bare || !label ? v : `${label}: ${v}`);
  } else if (Array.isArray(node)) {
    for (const child of node) walkMetiv(child, { ...ctx, depth: ctx.depth + 1, inArray: true }, out, resolve);
  } else if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>;
    if (typeof obj.$ref === "string") {
      const target = resolve?.(obj.$ref);
      // Like the v3 provider: a ref to a ref resolves to nothing.
      if (target && typeof target === "object" && typeof (target as { $ref?: unknown }).$ref !== "string") {
        walkMetiv(target, { key: ctx.key, depth: ctx.depth + 1, inArray: ctx.inArray }, out, resolve);
      }
      return;
    }
    const label = typeof obj.label === "string" && obj.label.trim() ? obj.label.trim() : undefined;
    // A `{ label, value }` pair is written once, as "label: value".
    const labelled = !!label && Object.entries(obj).some(([k, v]) =>
      k !== "label" && !METIV_SKIP_KEYS.has(k) && typeof v === "string" && v.trim() &&
      (!hasLetters(v) || isUrl(v.trim()) || isEmail(v.trim())));
    // Named objects (`phones: {...}`) lend their key; array items and the root do not.
    const parent = ctx.key && !ctx.inArray && ctx.depth > 0 ? ctx.key : undefined;
    for (const [k, child] of Object.entries(obj)) {
      if (METIV_SKIP_KEYS.has(k) || k.startsWith("_")) continue;
      if (k === "label" && labelled) continue;
      walkMetiv(child, { key: k, parent, label, depth: ctx.depth + 1 }, out, resolve);
    }
  }
}

// Labels for the age-group / audience header line, in the row's language.
const AGE_LABEL: Record<string, string> = {
  he: "קבוצת גיל", ar: "الفئة العمرية", en: "Age group", ru: "Возрастная группа", fr: "Tranche d'âge",
};
const AUDIENCE_LABEL: Record<string, string> = {
  he: "קהל יעד", ar: "الجمهور المستهدف", en: "Audience", ru: "Аудитория", fr: "Public",
};

// One part of an item's indexed text. Most items are one section; a Metiv
// singleton that bundles named sub-documents (LEGAL_DOCS: privacy + terms,
// SHORT_VERSIONS: one entry per page) is one section per sub-document, so a
// chunk never mixes two of them and its chip can link to the right page.
export type Section = { key?: string; title?: string; parts: string[] };

// `header`: the title and relation lines every chunk of the item starts with.
export type Extracted = { title: string; header: string[]; sections: Section[] };

const REGISTRY_KEYS = new Set(Object.values(METIV_COLLECTION_KEYS));
const isPlainObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const strOf = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

// A Metiv singleton row is titled with its collection key ("ORG", "SUPERVISION");
// its content title, when it has one, says more to the model and on the chip.
function displayTitle(item: Item, parsed: unknown): string {
  const title = item.title.trim();
  if (!isMetivItem(item) || !REGISTRY_KEYS.has(title) || !isPlainObject(parsed)) return title;
  return strOf(parsed.title) ?? strOf(parsed.name) ?? strOf(parsed.label) ?? title;
}

// The named sub-documents of a Metiv singleton: at least two top-level keys,
// every one an object or a list. Null for anything else.
function subDocuments(item: Item, parsed: unknown): [string, unknown][] | null {
  if (!isMetivItem(item) || !isPlainObject(parsed) || !REGISTRY_KEYS.has(String(parsed._key ?? ""))) return null;
  const entries = Object.entries(parsed).filter(([k]) => !k.startsWith("_") && !METIV_SKIP_KEYS.has(k));
  if (entries.length < 2 || !entries.every(([, v]) => v && typeof v === "object" && !("$ref" in (v as object)))) return null;
  return entries;
}

export function extractParts(item: Item, resolve?: RefResolver): Extracted {
  let parsed: unknown;
  try {
    parsed = item.content ? JSON.parse(item.content) : undefined;
  } catch {
    parsed = undefined; // unparseable content → title only
  }
  const title = displayTitle(item, parsed);
  const header: string[] = [title].filter(Boolean);
  // Header right after the title: rows with the same title (the children
  // "הנחיות" rows) differ only by their age group.
  if (item.ageGroups?.length) header.push(`${AGE_LABEL[item.langId] ?? AGE_LABEL.en}: ${item.ageGroups.join(", ")}`);
  if (item.audiences?.length) header.push(`${AUDIENCE_LABEL[item.langId] ?? AUDIENCE_LABEL.en}: ${item.audiences.join(", ")}`);
  if (parsed === undefined) return { title, header, sections: [{ parts: [] }] };
  if (!isMetivItem(item)) {
    const parts: string[] = [];
    walk(parsed, "", parts);
    return { title, header, sections: [{ parts }] };
  }
  const subs = subDocuments(item, parsed);
  if (!subs) {
    const parts: string[] = [];
    walkMetiv(parsed, { key: "", depth: 0 }, parts, resolve);
    return { title, header, sections: [{ parts }] };
  }
  // Same context the root walk gives a top-level key, so the text is unchanged.
  return {
    title, header,
    sections: subs.map(([key, v]) => {
      const parts: string[] = [];
      walkMetiv(v, { key, depth: 1 }, parts, resolve);
      return { key, title: isPlainObject(v) ? strOf(v.title) : undefined, parts };
    }),
  };
}

// Dedupe consecutive duplicates (title often repeats inside content).
export const dedupe = (parts: string[]) => parts.filter((p, i) => p !== parts[i - 1]);

export function extractText(item: Item, resolve?: RefResolver): { title: string; text: string } {
  const { title, header, sections } = extractParts(item, resolve);
  return { title, text: dedupe([...header, ...sections.flatMap((s) => s.parts)]).join("\n\n") };
}

// Every `$ref` string anywhere in an item's content.
export function refsIn(item: Item): string[] {
  const out: string[] = [];
  const visit = (n: unknown): void => {
    if (Array.isArray(n)) n.forEach(visit);
    else if (n && typeof n === "object") {
      const o = n as Record<string, unknown>;
      if (typeof o.$ref === "string") out.push(o.$ref);
      else Object.values(o).forEach(visit);
    }
  };
  if (item.content.includes("$ref")) {
    try {
      visit(JSON.parse(item.content));
    } catch {
      // unparseable content has no refs
    }
  }
  return out;
}

// langId -> ref ("KEY#_key", and "KEY" for singletons) -> content.
export type RefIndex = Map<string, Map<string, unknown>>;

// Index Metiv rows by the names `$ref`s use. The collection is `content._col`
// (else the row's own metiv-* category), mapped to its registry key.
export function buildRefIndex(items: Item[], index: RefIndex = new Map()): RefIndex {
  for (const item of items) {
    if (!isMetivItem(item)) continue;
    let c: Record<string, unknown>;
    try {
      c = JSON.parse(item.content || "null");
    } catch {
      continue;
    }
    if (!c || typeof c !== "object" || typeof c._key !== "string") continue;
    const slug = typeof c._col === "string" ? c._col : item.categorySlug ?? "";
    const key = METIV_COLLECTION_KEYS[slug];
    if (!key) continue;
    const byRef = index.get(item.langId) ?? new Map<string, unknown>();
    index.set(item.langId, byRef);
    byRef.set(`${key}#${c._key}`, c);
    if (c._key === key) byRef.set(key, c); // singleton rows: `_key` is the collection key
  }
  return index;
}

// Same language first, then Hebrew (every Metiv item exists in Hebrew).
export function refResolver(index: RefIndex, langId: string): RefResolver {
  return (ref) => index.get(langId)?.get(ref) ?? index.get("he")?.get(ref);
}
