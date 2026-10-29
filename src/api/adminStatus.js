// Save-in-progress status rows: how one admin session tells the others that a
// "save all" batch is running (src/components/admin/SaveStatus.jsx).
//
// The backend has no jobs or presence, so the batch's own browser keeps a small
// row up to date while it writes: type 'article', ONE category - the top-level
// `admin-status` (created on first use) - isPublished false, so the public
// /articles endpoint never returns it, and the chatbot worker skips the category
// (worker/src/lib/api.ts EXCLUDED_SLUGS). content:
//   { user: { id, email, name }, startedAt, updatedAt, total, done, failed,
//     sections: [section names], finishedAt? }
// One row per batch: created at its start, PATCHed every few writes and once
// more with finishedAt at the end. A row with no update for STALE_MS is a batch
// whose tab closed mid-way and counts as over. Old rows are pruned by the next
// batch to start.
//
// Reads use the categoryId-filtered GET /admin/articles: every row of interest
// is in this one category, so the filter's quirk (only the matched category is
// returned in each row's `categories`, see metivAdminSource.js) costs nothing,
// and the poll does not pull every article in the DB every 15 seconds.
//
// Not tamper-proof and not a lock: it is advisory, like the edit log.

import { adminApi } from './adminClient';

const ARTICLES = '/admin/articles';
export const STATUS_SLUG = 'admin-status';
export const STATUS_CATEGORY_NAME = 'ממשק ניהול: שמירות פעילות';
/** A batch with no update for this long is ignored. */
export const STALE_MS = 10 * 60 * 1000;

/**
 * @typedef {{ id: string|null, email: string|null, name: string|null }} StatusUser
 * @typedef {{ user: StatusUser, startedAt: string, updatedAt: string, total: number, done: number, failed: number, sections: string[], finishedAt?: string }} SaveStatusContent
 * @typedef {SaveStatusContent & { id: string }} SaveStatusRow
 */

/** @type {string|null} */
let categoryId = null;
/** @type {Promise<string>|null} */
let creatingCategory = null;
// Rows this tab created: its own batches, which only its progress strip shows.
const own = new Set();

/** Test-only: forget the cached category and this tab's rows. */
export function _resetSaveStatusCache() {
  categoryId = null;
  creatingCategory = null;
  own.clear();
}

/** @param {string} id */
export function isOwnSaveStatus(id) {
  return own.has(id);
}

// Looked up fresh until found: another session may create the category after
// this tab loaded, and the poll has to see it.
async function findCategoryId() {
  if (categoryId) return categoryId;
  const top = await adminApi('GET', '/categories');
  categoryId = (top || []).find(c => c.slug === STATUS_SLUG)?.id ?? null;
  return categoryId;
}

async function ensureCategoryId() {
  const found = await findCategoryId();
  if (found) return found;
  // One create in flight at a time, however many callers ask.
  if (!creatingCategory) {
    creatingCategory = adminApi('POST', '/admin/categories', { slug: STATUS_SLUG, name: STATUS_CATEGORY_NAME })
      .then(created => {
        categoryId = created?.id ?? null;
        if (!categoryId) throw new Error(`יצירת הקטגוריה ${STATUS_SLUG} נכשלה`);
        return categoryId;
      })
      .finally(() => { creatingCategory = null; });
  }
  return creatingCategory;
}

function parseContent(item) {
  if (!item.content) return {};
  try {
    return JSON.parse(item.content);
  } catch {
    return {};
  }
}

/**
 * Create a batch's row. Returns its id.
 * @param {SaveStatusContent} content
 * @returns {Promise<string|null>}
 */
export async function createSaveStatus(content) {
  const cat = await ensureCategoryId();
  const saved = await adminApi('POST', ARTICLES, {
    type: 'article',
    langId: 'he',
    title: content.startedAt,
    content: JSON.stringify(content),
    sortOrder: 0,
    isPublished: false,
    categoryIds: [cat],
  });
  const id = saved?.id ?? null;
  if (id) own.add(id);
  return id;
}

/** @param {string} id @param {SaveStatusContent} content */
export function patchSaveStatus(id, content) {
  return adminApi('PATCH', `${ARTICLES}/${id}`, { content: JSON.stringify(content) });
}

/** Every status row, own included. @returns {Promise<SaveStatusRow[]>} */
export async function loadSaveStatuses() {
  const cat = await findCategoryId();
  if (!cat) return [];
  const items = await adminApi('GET', `${ARTICLES}?type=article&categoryId=${cat}`);
  return (items || []).map(item => {
    const c = parseContent(item);
    return {
      id: item.id,
      user: c.user || { id: null, email: null, name: null },
      startedAt: c.startedAt || '',
      updatedAt: c.updatedAt || c.startedAt || '',
      total: Number(c.total) || 0,
      done: Number(c.done) || 0,
      failed: Number(c.failed) || 0,
      sections: Array.isArray(c.sections) ? c.sections : [],
      ...(c.finishedAt ? { finishedAt: c.finishedAt } : {}),
    };
  });
}

/** @param {string|undefined} iso */
const ms = iso => {
  const t = Date.parse(iso || '');
  return Number.isNaN(t) ? 0 : t;
};

/** Whether a row stopped being updated without finishing. @param {SaveStatusRow} row @param {number} now */
export function isStaleStatus(row, now) {
  return !row.finishedAt && now - ms(row.updatedAt) > STALE_MS;
}

/** @param {SaveStatusRow} row @param {number} now */
export function isRunningStatus(row, now) {
  return !row.finishedAt && !isStaleStatus(row, now);
}

/** When the row's batch finished, in ms, or 0. @param {SaveStatusRow} row */
export function finishedAtMs(row) {
  return row.finishedAt ? ms(row.finishedAt) : 0;
}

/**
 * Delete rows that no banner shows any more: finished, or stale, for longer
 * than STALE_MS. Best effort; a row another tab still PATCHes is never old.
 * @param {string|null} keepId
 */
export async function pruneSaveStatuses(keepId, now = Date.now()) {
  const rows = await loadSaveStatuses();
  const old = rows.filter(r => r.id !== keepId && now - ms(r.finishedAt || r.updatedAt) > STALE_MS);
  for (const r of old) {
    await adminApi('DELETE', `${ARTICLES}/${r.id}`).catch(() => {});
  }
}
