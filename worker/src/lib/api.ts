import type { Item } from "./content";

type Row = Partial<Item> & { isPublished?: boolean };

function normalize(r: Row): Item {
  return {
    id: String(r.id),
    groupId: String(r.groupId ?? r.id),
    type: String(r.type ?? "article"),
    langId: String(r.langId ?? "he"),
    title: String(r.title ?? ""),
    content: typeof r.content === "string" ? r.content : JSON.stringify(r.content ?? ""),
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
