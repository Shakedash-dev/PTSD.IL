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

export async function fetchItem(apiBase: string, id: string): Promise<Item | null> {
  const res = await fetch(`${apiBase}/articles/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${res.status} for item ${id}`);
  const row = (await res.json()) as Row;
  if (row.isPublished === false) return null;
  return normalize(row);
}
