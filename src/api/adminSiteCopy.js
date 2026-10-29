// Admin read/write layer for the site-copy override rows: the i18n texts the
// Metiv admin lets an editor change (src/lib/editableI18nKeys.js). The public
// read side is src/api/source.js fetchSiteCopy -> LanguageProvider -> t(),
// which resolves lang override -> lang default -> Hebrew override -> Hebrew
// default. The same rows serve the live PTSD-IL site.
//
// Every row is a plain article: type 'article', ONE category - the top-level
// `site-copy` (created on the first save when the DB has never seen it) - one
// row per key per language, title = the i18n key, content = { text } plus
// `_tr` on a translation. Rows of one key are siblings: the first row written
// for a key sets the groupId and the others are created with it. A row is
// found by its key and language, so a row from before the groupId link still
// counts.
//
// No chatbot reindex: site-copy is not part of the chatbot's index
// (docs/metiv-db-spec.md section 4).
//
// Reads go through GET /admin/articles?type=article&categoryId=..., which the
// dev server's read-only mode answers from the public /articles endpoint
// (src/api/adminLiveRead.js).

import { adminApi } from './adminClient';

const ARTICLES = '/admin/articles';
export const SITE_COPY_SLUG = 'site-copy';
export const SITE_COPY_CATEGORY_NAME = 'טקסטים באתר';

/**
 * @typedef {{ id: string, groupId: string, langId: string, key: string, text: string, content: any }} SiteCopyRow
 * @typedef {{ categoryId: string|null, rows: SiteCopyRow[] }} SiteCopyStore
 */

function parseContent(item) {
  if (!item.content) return {};
  try {
    return JSON.parse(item.content);
  } catch {
    return {};
  }
}

/** @returns {Promise<SiteCopyStore>} */
export async function loadSiteCopyRows() {
  const top = await adminApi('GET', '/categories');
  const category = (top || []).find(c => c.slug === SITE_COPY_SLUG);
  if (!category) return { categoryId: null, rows: [] };
  const items = await adminApi('GET', `${ARTICLES}?type=article&categoryId=${category.id}`);
  /** @type {SiteCopyRow[]} */
  const rows = [];
  for (const item of items || []) {
    if (!item.title) continue;
    const content = parseContent(item);
    rows.push({
      id: item.id,
      groupId: item.groupId,
      langId: item.langId,
      key: item.title,
      text: typeof content.text === 'string' ? content.text : '',
      content,
    });
  }
  return { categoryId: category.id, rows };
}

/** The override row of a key in a language, or null. @param {SiteCopyStore} store @param {string} key @param {string} lang */
export function siteCopyRow(store, key, lang) {
  return store.rows.find(r => r.key === key && r.langId === lang) ?? null;
}

/** The category id, creating `site-copy` when the DB has never seen it. @param {SiteCopyStore} store */
// The batch writes several rows at once, so a missing category is created by
// one request that every concurrent create waits for.
const creatingCategory = new WeakMap();
async function siteCopyCategoryId(store) {
  if (store.categoryId) return store.categoryId;
  if (!creatingCategory.has(store)) {
    creatingCategory.set(store, adminApi('POST', '/admin/categories', { slug: SITE_COPY_SLUG, name: SITE_COPY_CATEGORY_NAME })
      .then(created => {
        store.categoryId = created?.id ?? null;
        if (!store.categoryId) throw new Error('יצירת הקטגוריה site-copy נכשלה');
        return store.categoryId;
      })
      .finally(() => creatingCategory.delete(store)));
  }
  return creatingCategory.get(store);
}

/**
 * POST a key's row in one language. `groupId` links it to the key's other
 * rows; `onSaved` sees the stored row (its groupId links the next ones).
 * @param {SiteCopyStore} store
 * @param {{ key: string, lang: string, content: any, groupId?: string, onSaved?: (row: any) => void }} row
 */
export async function createSiteCopyRow(store, { key, lang, content, groupId, onSaved }) {
  const categoryId = await siteCopyCategoryId(store);
  const saved = await adminApi('POST', ARTICLES, {
    type: 'article',
    langId: lang,
    ...(groupId ? { groupId } : {}),
    title: key,
    content: JSON.stringify(content),
    sortOrder: 0,
    isPublished: true,
    categoryIds: [categoryId],
  });
  onSaved?.(saved);
  return saved;
}

/** PATCH a row's content. @param {{ id: string }} row @param {any} content */
export function updateSiteCopyRow(row, content) {
  return adminApi('PATCH', `${ARTICLES}/${row.id}`, { content: JSON.stringify(content) });
}

/** DELETE a row: the key goes back to the shipped text in that language. @param {string} id */
export function removeSiteCopyRow(id) {
  return adminApi('DELETE', `${ARTICLES}/${id}`);
}
