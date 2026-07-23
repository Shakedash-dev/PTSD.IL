export type Item = {
  id: string;
  groupId: string;
  type: string;
  langId: string;
  title: string;
  content: string; // JSON string, may be empty
};

// Leaf keys that carry URLs/ids/non-prose - never index as text.
const SKIP_KEYS = new Set([
  "url", "ios_url", "android_url", "cta_url", "contact_url", "link", "links",
  "id", "groupId", "parentId", "authorId", "image", "icon", "slug", "year",
]);

function walk(node: unknown, key: string, out: string[]): void {
  if (typeof node === "string") {
    const v = node.trim();
    if (!v || SKIP_KEYS.has(key) || /^https?:\/\//i.test(v)) return;
    out.push(v);
  } else if (Array.isArray(node)) {
    for (const child of node) walk(child, key, out);
  } else if (node && typeof node === "object") {
    for (const [k, child] of Object.entries(node)) {
      if (SKIP_KEYS.has(k)) continue;
      walk(child, k, out);
    }
  }
}

export function extractText(item: Item): { title: string; text: string } {
  const parts: string[] = [item.title.trim()].filter(Boolean);
  if (item.content) {
    try {
      walk(JSON.parse(item.content), "", parts);
    } catch {
      // unparseable content → title only
    }
  }
  // Dedupe consecutive duplicates (title often repeats inside content).
  const deduped = parts.filter((p, i) => p !== parts[i - 1]);
  return { title: item.title.trim(), text: deduped.join("\n\n") };
}
