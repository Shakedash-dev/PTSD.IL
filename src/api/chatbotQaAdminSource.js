// Admin read/write layer for the chatbot's curated Q&A playbooks
// (docs/metiv-db-spec.md section 5). Shared by /admin and
// /metiv-site-demo-v3/admin: the chatbot serves both sites.
//
// Every row is a plain article: type 'article', ONE category - the top-level
// `chatbot-qa` (no parent, no `_col`) - one row per question per language
// (siblings share the Hebrew row's groupId), title = the question, sortOrder =
// position, content = { _key, question, paraphrases, guidance, answer, crisis }
// plus `_tr` on translations. Rows are written in the shape
// scripts/metiv-seed/import.mjs --qa writes them.
//
// Every content write is followed by reindexItem(id): the worker sees a
// chatbot-qa row and rebuilds its Q&A index (worker/src/lib/qa.ts).
//
// Reads go through the UNFILTERED GET /admin/articles?type=article, like
// metivAdminSource: a categoryId-filtered list only returns the matched
// category in each row's `categories`.

import { adminApi } from './adminClient';
import { reindexItem } from './reindex';
import { newItemKey } from './metivAdminSource';

const ARTICLES = '/admin/articles';
export const QA_SLUG = 'chatbot-qa';
export const QA_CATEGORY_NAME = 'צ׳אטבוט: שאלות ותשובות מוכנות';

/**
 * @typedef {{ id: string, groupId: string, langId: string, title: string, sortOrder: number, key: string, content: any }} QaRow
 * @typedef {{ categoryId: string|null, rows: QaRow[] }} QaStore
 */

function parseContent(item) {
  if (!item.content) return {};
  try {
    return JSON.parse(item.content);
  } catch {
    return {};
  }
}

/** @returns {Promise<QaStore>} */
export async function loadChatbotQa() {
  const top = await adminApi('GET', '/categories');
  const category = (top || []).find(c => c.slug === QA_SLUG);
  const all = await adminApi('GET', `${ARTICLES}?type=article`);
  /** @type {QaRow[]} */
  const rows = [];
  for (const item of all || []) {
    const cats = item.categories || [];
    if (!cats.some(c => c.slug === QA_SLUG || (category && c.id === category.id))) continue;
    const content = parseContent(item);
    rows.push({
      id: item.id,
      groupId: item.groupId,
      langId: item.langId,
      title: item.title,
      sortOrder: item.sortOrder ?? 0,
      key: content._key ?? item.title,
      content,
    });
  }
  return { categoryId: category?.id ?? null, rows };
}

/** A row's title: its question. */
export function qaTitle(content) {
  const q = typeof content?.question === 'string' ? content.question.trim() : '';
  return q || content?._key || 'שאלה';
}

/** A new row's `_key`: an ascii slug of the question, else `chatbot-qa-<random>`. */
export function newQaKey(question, taken) {
  return newItemKey(QA_SLUG, question, taken);
}

/**
 * PATCH a row's title and content. Category and sortOrder are left alone.
 * @param {{ id: string }} row @param {{ title: string, content: any }} next
 */
export async function updateQaRow(row, { title, content }) {
  const saved = await adminApi('PATCH', `${ARTICLES}/${row.id}`, { title, content: JSON.stringify(content) });
  await reindexItem(row.id);
  return saved;
}

/** The category id, creating `chatbot-qa` when the DB has never seen it. */
async function qaCategoryId(store) {
  if (store.categoryId) return store.categoryId;
  const created = await adminApi('POST', '/admin/categories', { slug: QA_SLUG, name: QA_CATEGORY_NAME });
  store.categoryId = created?.id ?? null;
  if (!store.categoryId) throw new Error('יצירת הקטגוריה chatbot-qa נכשלה');
  return store.categoryId;
}

/**
 * POST a new row: a Hebrew question, or the translation of one (`groupId`).
 * `onSaved` sees the stored row before the chatbot reindex, which may fail.
 * @param {QaStore} store
 * @param {{ lang: string, title: string, content: any, sortOrder: number, groupId?: string, onSaved?: (row: any) => void }} row
 */
export async function createQaRow(store, { lang, title, content, sortOrder, groupId, onSaved }) {
  const categoryId = await qaCategoryId(store);
  const saved = await adminApi('POST', ARTICLES, {
    type: 'article',
    langId: lang,
    ...(groupId ? { groupId } : {}),
    title,
    content: JSON.stringify(content),
    sortOrder,
    isPublished: true,
    categoryIds: [categoryId],
  });
  onSaved?.(saved);
  await reindexItem(saved?.id);
  return saved;
}

/**
 * Reorder: PATCH only sortOrder. No reindex - the worker's Q&A index does not
 * depend on the order.
 * @param {string} id @param {number} sortOrder
 */
export function setQaSortOrder(id, sortOrder) {
  return adminApi('PATCH', `${ARTICLES}/${id}`, { sortOrder });
}

export async function removeQaRow(id) {
  const res = await adminApi('DELETE', `${ARTICLES}/${id}`);
  await reindexItem(id); // the worker rebuilds the Q&A index without it
  return res;
}
