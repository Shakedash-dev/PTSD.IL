// AI translation of Hebrew admin edits (docs/metiv-db-spec.md sections 3-4).
//
// When an editor stages a Hebrew change, the admin sends the changed text
// leaves of the item's content JSON to the chatbot worker's /translate, once
// per target language, and stages the translated sibling rows (same groupId)
// next to the Hebrew one. Nothing here writes to the content API - it only
// computes what to send and what the sibling becomes.
//
// Which strings are text, and how a translation is written back, comes from
// src/lib/translatable.js, shared with the one-time bulk translation scripts.

import { getToken, inReadOnlyPreview } from '@/lib/auth';
import { ADMIN_PREVIEW } from '@/lib/adminPreview';
import { applyLeaves, changedLeaves, extractLeaves, TITLE_PATH } from '@/lib/translatable';

/** The five content languages, in the order the admin's language tabs show them. */
export const ADMIN_LANGS = [
  { id: 'he', label: 'עברית', dir: 'rtl' },
  { id: 'ar', label: 'ערבית', dir: 'rtl' },
  { id: 'en', label: 'אנגלית', dir: 'ltr' },
  { id: 'ru', label: 'רוסית', dir: 'ltr' },
  { id: 'fr', label: 'צרפתית', dir: 'ltr' },
];

/** @type {Record<string, { id: string, label: string, dir: 'rtl'|'ltr' }>} */
export const LANG_BY_ID = Object.fromEntries(ADMIN_LANGS.map(l => [l.id, /** @type {any} */ (l)]));

/** Every language a Hebrew edit is translated into. */
export const TARGET_LANGS = ADMIN_LANGS.filter(l => l.id !== 'he').map(l => l.id);

// Thrown for any /translate failure (network, non-2xx, malformed body). The
// review dialog shows it per language with a retry button.
export class TranslateError extends Error {
  constructor(message = 'התרגום נכשל') {
    super(message);
    this.name = 'TranslateError';
  }
}

/**
 * @typedef {{ items: Record<string, string>, status: 'pass'|'fixed'|'flagged', notes: string[], model: string }} TranslateResult
 */

/**
 * POST /translate on the chatbot worker, authorised with the admin JWT.
 * @param {{ target: string, items: Record<string, string>, context: string }} req
 * @returns {Promise<TranslateResult>}
 */
export async function requestTranslation({ target, items, context }) {
  const body = { source: 'he', target, items, context };
  if (ADMIN_PREVIEW && inReadOnlyPreview()) {
    // Dynamic so the fake translator is not part of a production build.
    const { previewTranslate } = await import('./adminLiveRead');
    return previewTranslate(body);
  }
  const chatbotUrl = import.meta.env.VITE_CHATBOT_URL;
  if (!chatbotUrl) throw new TranslateError('כתובת שירות התרגום (VITE_CHATBOT_URL) לא הוגדרה');
  const token = getToken();
  let res;
  try {
    res = await fetch(`${chatbotUrl}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new TranslateError(`התרגום נכשל: ${err?.message || 'שגיאת רשת'}`);
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new TranslateError(`התרגום נכשל (${res.status}) ${detail.slice(0, 200)}`.trim());
  }
  const data = await res.json().catch(() => null);
  if (!data || typeof data.items !== 'object' || data.items === null) {
    throw new TranslateError('התרגום נכשל: תשובה לא תקינה משירות התרגום');
  }
  return {
    items: data.items,
    status: ['pass', 'fixed', 'flagged'].includes(data.status) ? data.status : 'flagged',
    notes: Array.isArray(data.notes) ? data.notes.map(String) : [],
    model: typeof data.model === 'string' ? data.model : '',
  };
}

/** `_tr` stamp for a row someone edited by hand in its own language. */
export function humanStamp() {
  return { by: 'human', at: new Date().toISOString() };
}

/** The row title as a leaf, or undefined when it is not text (e.g. "ORG"). */
function titleLeaf(title) {
  return title === undefined ? undefined : extractLeaves({ title }).title;
}

/** @param {any} content @param {string} path */
function valueAt(content, path) {
  let node = content;
  for (const part of path.split('.')) {
    if (node == null) return undefined;
    node = node[part];
  }
  return node;
}

/** @param {Record<string, string>} a @param {Record<string, string>} b */
function samePaths(a, b) {
  const ka = Object.keys(a);
  return ka.length === Object.keys(b).length && ka.every(k => k in b);
}

/**
 * @typedef {{ id: string, title: string, content: any }} Sibling
 */

/**
 * What one target language needs sent, and which of its current texts stay.
 * Only changed Hebrew leaves are sent - unless the sibling does not exist yet
 * or the set of leaf paths moved (items added, removed or reordered), in which
 * case every leaf is. A leaf the sibling has no text for is sent too, so a
 * Hebrew string can never leak into another language.
 *
 * @param {{ oldContent: any, newContent: any, oldTitle?: string, newTitle?: string, sibling: Sibling|null }} args
 * @returns {{ items: Record<string, string>, keep: Record<string, string> }}
 */
export function planTranslation({ oldContent, newContent, oldTitle, newTitle, sibling }) {
  const prev = extractLeaves(oldContent ?? {});
  const next = extractLeaves(newContent);
  const prevTitle = titleLeaf(oldTitle);
  const nextTitle = titleLeaf(newTitle);
  if (prevTitle !== undefined) prev[TITLE_PATH] = prevTitle;
  if (nextTitle !== undefined) next[TITLE_PATH] = nextTitle;

  const items = !sibling || !samePaths(prev, next) ? { ...next } : changedLeaves(prev, next);
  /** @type {Record<string, string>} */
  const keep = {};
  if (sibling) {
    for (const path of Object.keys(next)) {
      if (path in items) continue;
      const v = path === TITLE_PATH ? sibling.title : valueAt(sibling.content, path);
      if (typeof v === 'string' && v.trim()) keep[path] = v;
      else items[path] = next[path];
    }
  }
  return { items, keep };
}

/**
 * A sibling row's new title and content: the Hebrew content's structure and
 * technical fields, the sibling's own texts where Hebrew did not change, the
 * translation where it did, and the sibling's own `_` keys.
 *
 * @param {{ newContent: any, newTitle?: string, sibling: Sibling|null, keep: Record<string, string>, translated: Record<string, string>, tr?: any }} args
 * @returns {{ title: string|undefined, content: any }}
 */
export function buildSibling({ newContent, newTitle, sibling, keep, translated, tr }) {
  const leaves = { ...keep, ...translated };
  const body = applyLeaves(newContent, leaves);
  const own = Object.fromEntries(Object.entries(sibling?.content ?? {}).filter(([k]) => k.startsWith('_')));
  const content = { ...body, ...own };
  if (tr) content._tr = tr;
  else if (!sibling) delete content._tr;
  return { title: leaves[TITLE_PATH] ?? sibling?.title ?? newTitle, content };
}
