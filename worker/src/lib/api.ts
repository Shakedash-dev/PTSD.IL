import type { Item } from "./content";

// The bulk/single article endpoints don't return a flat `categorySlug` field -
// they return a `categories` relation (array of Category objects, each with a
// `slug`), since an article can carry multiple categoryIds. We keep the full
// slug list (exclusions + chip routing) and pick a primary slug: the first one
// that is not the `metiv` parent, so a Metiv row routes by its collection.
// Per docs/frontend-api-integration.md the API's category slugs (e.g. "rights")
// already match the frontend's expected route slugs, so no remapping is
// applied here - if that ever diverges, map it in this function.
type Named = Array<{ slug?: string; name?: string | null }>;
type Row = Omit<Partial<Item>, "ageGroups" | "audiences"> & {
  isPublished?: boolean;
  categories?: Array<{ slug?: string }>;
  ageGroups?: Named;
  audiences?: Named;
};

export const METIV_PARENT_SLUG = "metiv";
export const QA_SLUG = "chatbot-qa";

// Metiv collections the chatbot indexes. Must equal the `chatbot: true` slugs in
// src/pages/metiv-demos/v3/content/registry.js (src/test/metiv-db-registry.test.js).
export const METIV_CHATBOT_SLUGS = [
  "metiv-org", "metiv-contacts", "metiv-services",
  "metiv-public-options", "metiv-nonprofit-options", "metiv-consultation",
  "metiv-free-treatments", "metiv-research-studies", "metiv-reservist-family",
  "metiv-veterans", "metiv-parent-child", "metiv-patient-books",
  "metiv-video-lectures", "metiv-release-journey", "metiv-rj-models",
  "metiv-rj-contacts",
];

// Categories that never go into the general Vectorize index. `chatbot-qa` rows
// feed the playbook KV index instead (lib/qa.ts).
export const EXCLUDED_SLUGS = ["admin-log", "site-copy", "legal", QA_SLUG, "metiv-copy"];

// Collection slug -> registry key, for resolving `{ "$ref": "KEY#_key" }` cross
// references (docs/metiv-db-spec.md section 1). Must equal registry.js
// COLLECTIONS (worker/test/exclusions.test.ts).
export const METIV_COLLECTION_KEYS: Record<string, string> = {
  "metiv-org": "ORG", "metiv-contacts": "CONTACTS", "metiv-about": "ABOUT", "metiv-facts": "FACTS",
  "metiv-team": "TEAM", "metiv-team-groups": "TEAM_GROUPS", "metiv-department-groups": "DEPARTMENT_GROUPS",
  "metiv-partners": "PARTNERS", "metiv-funders": "FUNDERS_AND_COLLABORATORS", "metiv-partner-groups": "PARTNER_GROUPS",
  "metiv-collaboration-groups": "COLLABORATION_GROUPS", "metiv-collaboration-contact": "COLLABORATION_CONTACT",
  "metiv-services": "METIV_SERVICES", "metiv-donate": "DONATE", "metiv-nav": "NAV", "metiv-route-meta": "ROUTE_META",
  "metiv-legal": "LEGAL", "metiv-legal-docs": "LEGAL_DOCS",
  "metiv-patient-nav": "PATIENT_NAV", "metiv-patient-hub": "PATIENT_HUB", "metiv-short-versions": "SHORT_VERSIONS",
  "metiv-next-steps": "NEXT_STEPS", "metiv-public-options": "PUBLIC_OPTIONS", "metiv-nonprofit-options": "NONPROFIT_OPTIONS",
  "metiv-consultation": "CONSULTATION", "metiv-free-treatments": "FREE_TREATMENTS",
  "metiv-research-studies": "RESEARCH_STUDIES", "metiv-reservist-family": "RESERVIST_FAMILY_PROGRAMS",
  "metiv-veterans": "VETERANS_PROGRAMS", "metiv-parent-child": "PARENT_CHILD_GROUPS", "metiv-patient-books": "METIV_BOOKS",
  "metiv-books-note": "METIV_BOOKS_ORDER_NOTE", "metiv-video-lectures": "VIDEO_LECTURES",
  "metiv-treatment-where": "TREATMENT_WHERE_BLOCK", "metiv-release-journey": "RELEASE_JOURNEY",
  "metiv-rj-stats": "RELEASE_JOURNEY_STATS", "metiv-rj-waiting": "RELEASE_JOURNEY_WAITING",
  "metiv-rj-models": "JOURNEY_MODELS", "metiv-rj-contacts": "RELEASE_JOURNEY_CONTACTS",
  "metiv-therapist-hub": "THERAPIST_HUB", "metiv-course-categories": "COURSE_CATEGORIES", "metiv-courses": "COURSES",
  "metiv-supervision": "SUPERVISION", "metiv-org-programs": "ORGANIZATION_PROGRAMS",
  "metiv-children-family": "CHILDREN_FAMILY_INTRO", "metiv-research-intro": "RESEARCH_INTRO",
  "metiv-studies": "ACTIVE_STUDIES", "metiv-books": "BOOKS", "metiv-paper-topics": "PAPER_TOPICS",
  "metiv-papers": "PAPERS", "metiv-articles": "ARTICLES", "metiv-events": "EVENTS",
};

const EXCLUDED = new Set(EXCLUDED_SLUGS);
const METIV_CHATBOT = new Set(METIV_CHATBOT_SLUGS);

function slugsOf(item: Pick<Item, "categorySlug" | "categorySlugs">): string[] {
  return item.categorySlugs ?? (item.categorySlug ? [item.categorySlug] : []);
}

export function isQaItem(item: Pick<Item, "categorySlug" | "categorySlugs">): boolean {
  return slugsOf(item).includes(QA_SLUG);
}

// A Metiv row: the parent slug or any metiv-* child.
export function isMetivItem(item: Pick<Item, "categorySlug" | "categorySlugs">): boolean {
  return slugsOf(item).some((s) => s === METIV_PARENT_SLUG || s.startsWith("metiv-"));
}

// Whether an item belongs in the general Vectorize index. A Metiv row (parent
// slug or any metiv-* child) is indexed only when one of its collections is
// flagged for the chatbot.
export function isIndexable(item: Pick<Item, "categorySlug" | "categorySlugs">): boolean {
  const slugs = slugsOf(item);
  if (slugs.some((s) => EXCLUDED.has(s))) return false;
  return isMetivItem(item) ? slugs.some((s) => METIV_CHATBOT.has(s)) : true;
}

function normalize(r: Row): Item {
  const slugs = (r.categories ?? []).map((c) => c.slug).filter((s): s is string => !!s);
  const categorySlug = slugs.find((s) => s !== METIV_PARENT_SLUG) ?? slugs[0];
  const names = (xs?: Named) => (xs ?? []).map((x) => x?.name?.trim()).filter((n): n is string => !!n);
  const ageGroups = names(r.ageGroups);
  const audiences = names(r.audiences);
  return {
    id: String(r.id),
    groupId: String(r.groupId ?? r.id),
    type: String(r.type ?? "article"),
    langId: String(r.langId ?? "he"),
    title: String(r.title ?? ""),
    content: typeof r.content === "string" ? r.content : JSON.stringify(r.content ?? ""),
    ...(categorySlug ? { categorySlug, categorySlugs: slugs } : {}),
    ...(ageGroups.length ? { ageGroups } : {}),
    ...(audiences.length ? { audiences } : {}),
  };
}

async function getJson(url: string): Promise<Row[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${res.status} for ${url}`);
  const data = await res.json();
  return Array.isArray(data) ? (data as Row[]) : ((data as { items?: Row[] }).items ?? []);
}

export async function fetchAllItems(apiBase: string): Promise<Item[]> {
  const rows = await getJson(`${apiBase}/articles`);
  return rows.filter((r) => r.isPublished !== false).map(normalize);
}

// Published curated Q&A rows (all languages). The slug check guards against an
// API that ignores the categorySlug filter.
export async function fetchQaItems(apiBase: string): Promise<Item[]> {
  const rows = await getJson(`${apiBase}/articles?categorySlug=${QA_SLUG}`);
  return rows.filter((r) => r.isPublished !== false).map(normalize).filter(isQaItem);
}

// Every published Metiv row of one language (all collections, indexed or not),
// for resolving `$ref`s during an item reindex. The slug check guards against an
// API that ignores the categorySlug filter.
export async function fetchMetivItems(apiBase: string, langId: string): Promise<Item[]> {
  const rows = await getJson(`${apiBase}/articles?categorySlug=${METIV_PARENT_SLUG}&langId=${encodeURIComponent(langId)}`);
  return rows.filter((r) => r.isPublished !== false).map(normalize)
    .filter((i) => isMetivItem(i) && i.langId === langId);
}

// Communities live on their own endpoint (not /articles) and have a flat shape
// rather than a `content` JSON blob. They're language-scoped like articles
// (one row per language, linked by groupId), so `/communities` with no filter
// returns every language - exactly what the corpus wants. We synthesize an
// Item whose `content` carries the community's prose (description, organization,
// target-audience names) so extractText/chunk index it like any other item.
type CommunityRow = {
  id?: string | number;
  groupId?: string | null;
  langId?: string;
  name?: string;
  description?: string | null;
  organization?: string | null;
  isActive?: boolean;
  targetAudiences?: Array<{ name?: string | null }>;
};

function normalizeCommunity(r: CommunityRow): Item {
  const audiences = (r.targetAudiences ?? []).map((a) => a.name).filter((n): n is string => !!n);
  const content = JSON.stringify({
    description: r.description ?? "",
    organization: r.organization ?? "",
    audiences,
  });
  return {
    id: String(r.id),
    groupId: String(r.groupId ?? r.id),
    type: "community",
    langId: String(r.langId ?? "he"),
    title: String(r.name ?? ""),
    content,
    categorySlug: "community",
  };
}

export async function fetchAllCommunities(apiBase: string): Promise<Item[]> {
  const rows = (await getJson(`${apiBase}/communities`)) as unknown as CommunityRow[];
  return rows.filter((r) => r.isActive !== false).map(normalizeCommunity);
}

// Single community by id, for per-item reindex. Returns null when the community
// is gone (404) OR has been deactivated (isActive:false) - both mean "should not
// be in the corpus", so the caller drops its vectors.
export async function fetchCommunity(apiBase: string, id: string): Promise<Item | null> {
  const res = await fetch(`${apiBase}/communities/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${res.status} for community ${id}`);
  const row = (await res.json()) as CommunityRow;
  if (row.isActive === false) return null;
  return normalizeCommunity(row);
}

export async function fetchItem(apiBase: string, id: string): Promise<Item | null> {
  const res = await fetch(`${apiBase}/articles/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${res.status} for item ${id}`);
  const row = (await res.json()) as Row;
  if (row.isPublished === false) return null;
  return normalize(row);
}
