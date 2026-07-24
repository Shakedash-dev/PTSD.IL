import type { Item } from "./content";

// The bulk/single article endpoints don't return a flat `categorySlug` field —
// they return a `categories` relation (array of Category objects, each with a
// `slug`), since an article can carry multiple categoryIds. We take the first
// category's slug as the item's primary category for chip routing. Per
// docs/frontend-api-integration.md the API's category slugs (e.g. "rights")
// already match the frontend's expected route slugs, so no remapping is
// applied here — if that ever diverges, map it in this function.
type Row = Partial<Item> & { isPublished?: boolean; categories?: Array<{ slug?: string }> };

function normalize(r: Row): Item {
  const categorySlug = r.categories?.[0]?.slug;
  return {
    id: String(r.id),
    groupId: String(r.groupId ?? r.id),
    type: String(r.type ?? "article"),
    langId: String(r.langId ?? "he"),
    title: String(r.title ?? ""),
    content: typeof r.content === "string" ? r.content : JSON.stringify(r.content ?? ""),
    ...(categorySlug ? { categorySlug } : {}),
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

// Communities live on their own endpoint (not /articles) and have a flat shape
// rather than a `content` JSON blob. They're language-scoped like articles
// (one row per language, linked by groupId), so `/communities` with no filter
// returns every language — exactly what the corpus wants. We synthesize an
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

export async function fetchItem(apiBase: string, id: string): Promise<Item | null> {
  const res = await fetch(`${apiBase}/articles/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${res.status} for item ${id}`);
  const row = (await res.json()) as Row;
  if (row.isPublished === false) return null;
  return normalize(row);
}
