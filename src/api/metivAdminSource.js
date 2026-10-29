// Admin read/write layer for the Metiv v3 content (docs/metiv-db-spec.md).
//
// Every Metiv row is a plain article: type 'article', categories = the `metiv`
// parent + one child `metiv-<collection>`, one row per item per language
// (siblings share the Hebrew row's groupId), content = the item's JSON plus
// reserved `_` keys (`_key`, `_col`, `_tr`, `_area`, `_label`). Rows are written
// in the same shape scripts/metiv-seed/import.mjs writes them.
//
// Reads go through the UNFILTERED GET /admin/articles?type=article: a
// categoryId-filtered list only returns the matched category in each row's
// `categories`, which would hide which collection the row belongs to. The
// collection is read from content._col.

import { adminApi } from './adminClient';
import { requestReindex } from './reindexQueue';
import { COLLECTION_BY_KEY, COLLECTION_BY_SLUG, COPY_SLUG, METIV_PARENT_SLUG } from '@/pages/metiv-demos/v3/content/registry';

const ARTICLES = '/admin/articles';

/**
 * @typedef {{ id: string, groupId: string, langId: string, title: string, sortOrder: number, col: string, key: string, content: any }} MetivRow
 * @typedef {{ parentId: string, categoryIds: Record<string, string>, rows: MetivRow[] }} MetivStore
 */

function parseContent(item) {
  if (!item.content) return {};
  try {
    return JSON.parse(item.content);
  } catch {
    return {};
  }
}

/** @returns {Promise<MetivStore>} */
export async function loadMetiv() {
  const top = await adminApi('GET', '/categories');
  const parent = (top || []).find(c => c.slug === METIV_PARENT_SLUG);
  if (!parent) throw new Error('קטגוריית "metiv" לא קיימת במסד. יש להריץ קודם את scripts/metiv-seed/import.mjs');
  const children = await adminApi('GET', `/categories?parentId=${parent.id}`);
  const categoryIds = Object.fromEntries((children || []).map(c => [c.slug, c.id]));
  const all = await adminApi('GET', `${ARTICLES}?type=article`);
  /** @type {MetivRow[]} */
  const rows = [];
  for (const item of all || []) {
    const cats = item.categories || [];
    if (!cats.some(c => c.id === parent.id || c.slug === METIV_PARENT_SLUG)) continue;
    const content = parseContent(item);
    const col = content._col || cats.find(c => c.parentId)?.slug;
    if (!col) continue;
    rows.push({
      id: item.id,
      groupId: item.groupId,
      langId: item.langId,
      title: item.title,
      sortOrder: item.sortOrder ?? 0,
      col,
      key: content._key ?? item.title,
      content,
    });
  }
  return { parentId: parent.id, categoryIds, rows };
}

/**
 * A row's display title: the registry's titleField for list items, the
 * collection key for singletons, the namespace for copy rows. It mirrors the
 * content, which stays the source of truth.
 * @param {string} slug @param {any} content
 */
export function metivTitle(slug, content) {
  if (slug === COPY_SLUG) return content?._key || 'copy';
  const col = COLLECTION_BY_SLUG[slug];
  if (!col) return content?._key || slug;
  if (col.kind !== 'list') return col.key;
  if (content?.$ref) return String(content.$ref);
  const t = col.titleField && content?.[col.titleField];
  return typeof t === 'string' && t.trim() ? t : content?._key || col.key;
}

/** `{ $ref: "TEAM#key" }` -> the collection label and the item it points to. */
export function resolveRef(store, ref) {
  const [colKey, key] = String(ref).split('#');
  const col = COLLECTION_BY_KEY[colKey];
  const row = col && store?.rows.find(r => r.col === col.slug && r.langId === 'he' && r.key === key);
  return { label: col?.label || colKey, title: row ? metivTitle(col.slug, row.content) : key };
}

function randomId() {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(36).padStart(2, '0')).join('').slice(0, 6);
}

/**
 * A new list item's stable `_key`: an ascii slug of its title, or
 * `<collection>-<random>` when the title has no latin letters (most Hebrew
 * titles). Never one already taken.
 * @param {string} slug collection slug @param {string} title @param {Set<string>} taken
 */
export function newItemKey(slug, title, taken) {
  const ascii = String(title || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  const base = ascii.length >= 3 ? ascii : `${slug.replace(/^metiv-/, '')}-${randomId()}`;
  let key = base;
  while (taken.has(key)) key = `${base}-${randomId()}`;
  return key;
}

/**
 * PATCH a row's title and content. Categories and sortOrder are left alone.
 * @param {{ id: string }} row @param {{ title: string, content: any }} next
 */
export async function updateMetivRow(row, { title, content }) {
  const saved = await adminApi('PATCH', `${ARTICLES}/${row.id}`, { title, content: JSON.stringify(content) });
  await requestReindex(row.id);
  return saved;
}

/**
 * POST a new row: a Hebrew item, or the translation of one (`groupId`).
 * `onSaved` sees the stored row before the chatbot reindex, which may fail.
 * @param {MetivStore} store
 * @param {{ lang: string, slug: string, title: string, content: any, sortOrder: number, groupId?: string, onSaved?: (row: any) => void }} row
 */
export async function createMetivRow(store, { lang, slug, title, content, sortOrder, groupId, onSaved }) {
  const childId = store.categoryIds[slug];
  if (!childId) throw new Error(`קטגוריה ${slug} לא קיימת במסד`);
  const saved = await adminApi('POST', ARTICLES, {
    type: 'article',
    langId: lang,
    ...(groupId ? { groupId } : {}),
    title,
    content: JSON.stringify(content),
    sortOrder,
    isPublished: true,
    categoryIds: [store.parentId, childId],
  });
  onSaved?.(saved);
  await requestReindex(saved?.id);
  return saved;
}

/**
 * Reorder: PATCH only sortOrder. No reindex - the position in a list is not
 * something the chatbot indexes.
 * @param {string} id @param {number} sortOrder
 */
export function setMetivSortOrder(id, sortOrder) {
  return adminApi('PATCH', `${ARTICLES}/${id}`, { sortOrder });
}

export async function removeMetivRow(id) {
  const res = await adminApi('DELETE', `${ARTICLES}/${id}`);
  await requestReindex(id); // the worker drops the vectors of a deleted id
  return res;
}
