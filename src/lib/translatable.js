// Which parts of a content object are human-language text, and how to swap
// them for a translation. Shared by the admin's AI translation and the one-time
// bulk translation scripts (scripts/metiv-seed/), so both send exactly the same
// leaves. See docs/metiv-db-spec.md section 3.
//
// A leaf is translatable when it is a string that contains a Hebrew letter and
// its key is not a link, route or identifier. Paths are dot-joined keys and
// array indexes ("contacts.0.label"); the row title travels as TITLE_PATH.

export const TITLE_PATH = '@title';

/** Keys whose values are links, routes or ids even when they contain Hebrew. */
export const NON_TRANSLATABLE_KEYS = new Set([
  '_key', '$ref', 'id', 'slug', 'key', 'icon', 'anchor', 'kind',
  'href', 'url', 'link', 'route', 'to', 'source', 'sourceUrl', 'relatedSourceUrls',
  'siteUrl', 'registerUrl', 'registrationUrl', 'donateUrl', 'image',
  'email', 'phone', 'value', 'whatsapp', 'doi', 'dateISO', 'startDateISO',
  'courseSlug', 'relatedCourseSlug', 'relatedSlugs', 'trainingSlug', 'category', 'topic',
  'area', 'parent', 'ios_url', 'android_url',
]);

const HEBREW = /[֐-׿]/;
// Links, routes and bare in-page anchors ("#adults-clinic"). A Markdown heading
// ("## 1. ...") also starts with "#" and is text, so "#" counts only on its own.
const LINK_LIKE = /^(https?:\/\/|mailto:|tel:|\/|#[\w-]*$)/;

/** @param {string|undefined} key @param {unknown} value */
function isTranslatable(key, value) {
  if (typeof value !== 'string' || !HEBREW.test(value)) return false;
  if (key !== undefined && (key.startsWith('_') || NON_TRANSLATABLE_KEYS.has(key))) return false;
  return !LINK_LIKE.test(value.trim());
}

/**
 * Page copy rows (metiv-copy) are flat { key: text } maps whose key names are
 * free ("phone", "link", "source" are labels there), so none is excluded.
 * @param {unknown} content
 */
function isCopyRow(content) {
  return !!content && typeof content === 'object' && ('_area' in content || /** @type {any} */ (content)._col === 'metiv-copy');
}

/**
 * Flat map of every translatable leaf: path -> text.
 * @param {unknown} content
 * @returns {Record<string, string>}
 */
export function extractLeaves(content) {
  /** @type {Record<string, string>} */
  const out = {};
  if (isCopyRow(content)) {
    for (const [k, v] of Object.entries(/** @type {Record<string, unknown>} */ (content))) {
      if (!k.startsWith('_') && typeof v === 'string' && HEBREW.test(v)) out[k] = v;
    }
    return out;
  }
  /** @param {unknown} v @param {string} at @param {string|undefined} key */
  const walk = (v, at, key) => {
    if (Array.isArray(v)) {
      v.forEach((x, i) => walk(x, at ? `${at}.${i}` : String(i), key));
    } else if (v && typeof v === 'object') {
      if ('$ref' in v) return;
      for (const [k, x] of Object.entries(v)) {
        if (k.startsWith('_') || NON_TRANSLATABLE_KEYS.has(k)) continue;
        walk(x, at ? `${at}.${k}` : k, k);
      }
    } else if (isTranslatable(key, v)) {
      out[at] = /** @type {string} */ (v);
    }
  };
  walk(content, '', undefined);
  return out;
}

/**
 * A copy of `content` with the given leaves replaced. Paths that do not exist
 * in `content` are ignored, so a stale translation can never add fields.
 * @template T
 * @param {T} content
 * @param {Record<string, string>} leaves
 * @returns {T}
 */
export function applyLeaves(content, leaves) {
  const copy = structuredClone(content);
  for (const [path, text] of Object.entries(leaves)) {
    if (path === TITLE_PATH) continue;
    const parts = path.split('.');
    /** @type {any} */
    let node = copy;
    for (let i = 0; i < parts.length - 1 && node != null; i++) node = node[parts[i]];
    const last = parts[parts.length - 1];
    if (node != null && typeof node[last] === 'string') node[last] = text;
  }
  return copy;
}

/**
 * Leaves of `next` that are new or changed compared to `prev` (both Hebrew).
 * @param {Record<string, string>} prev
 * @param {Record<string, string>} next
 */
export function changedLeaves(prev, next) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const [k, v] of Object.entries(next)) if (prev[k] !== v) out[k] = v;
  return out;
}
