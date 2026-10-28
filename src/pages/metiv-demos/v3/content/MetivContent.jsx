// The v3 demo's content, read from the live API. One request per language
// (`categorySlug=metiv` returns every Metiv row), plus Hebrew when the language
// is not Hebrew: items missing in the language fall back to Hebrew, and copy
// and singleton rows fall back key by key. There is no static fallback - the
// pages render only once the data is in. Model: docs/metiv-db-spec.md.
//
// useMetiv() returns the collections under the names the static modules used
// to export (COURSES, ORG, ...) plus the same derived helpers, so a page swaps
// `import { COURSES } from shared` for `const { COURSES } = useMetiv()`.
// getMetiv() is the same object for non-component code (meta.js); it is only
// valid inside the provider's subtree, which renders after the data loads.

import React, { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLang } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { COLLECTIONS, COLLECTION_BY_SLUG, COPY_SLUG, METIV_PARENT_SLUG } from './registry';

const API = import.meta.env.VITE_API_URL;

/** @typedef {Record<string, any>} MetivData */

/**
 * @typedef {Object} ApiRow
 * @property {string} id
 * @property {string|null} groupId
 * @property {string} langId
 * @property {string} title
 * @property {string|null} content
 * @property {number} sortOrder
 * @property {{ slug: string, parentId: string|null }[]} [categories]
 */

/** @param {string} lang @returns {Promise<ApiRow[]>} */
async function fetchRows(lang) {
  const res = await fetch(`${API}/articles?categorySlug=${METIV_PARENT_SLUG}&langId=${lang}`);
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

// The collection is stored in the row itself (`_col`): a categorySlug-filtered
// list only returns the matched category, so `categories` cannot tell it.
/** @param {ApiRow} row @param {Record<string, any>} content */
function childSlug(row, content) {
  if (typeof content._col === 'string') return content._col;
  return (row.categories ?? []).find((c) => c.parentId && c.slug !== METIV_PARENT_SLUG)?.slug ?? null;
}

/** @param {ApiRow} row @returns {Record<string, any>} */
function parse(row) {
  if (!row.content) return {};
  try {
    return JSON.parse(row.content);
  } catch {
    return {};
  }
}

/**
 * Builds the collections from Hebrew rows and (optionally) the language's rows.
 * Exported for tests and for the admin preview.
 * @param {ApiRow[]} heRows
 * @param {ApiRow[]} [langRows]
 * @returns {MetivData}
 */
export function buildMetivData(heRows, langRows = []) {
  /** @type {Map<string, ApiRow>} */
  const localByGroup = new Map();
  for (const r of langRows) if (r.groupId) localByGroup.set(r.groupId, r);

  /** @type {Record<string, { sortOrder: number, he: Record<string, any>, loc: Record<string, any> }[]>} */
  const bySlug = {};
  const seenGroups = new Set();
  const add = (/** @type {ApiRow} */ he, /** @type {ApiRow|undefined} */ loc) => {
    const heContent = parse(he);
    const slug = childSlug(he, heContent);
    if (!slug) return;
    (bySlug[slug] ??= []).push({ sortOrder: he.sortOrder ?? 0, he: heContent, loc: loc ? parse(loc) : heContent });
  };
  for (const he of heRows) {
    if (he.groupId) seenGroups.add(he.groupId);
    add(he, he.groupId ? localByGroup.get(he.groupId) : undefined);
  }
  // A row that exists only in the language (no Hebrew sibling) still shows.
  for (const r of langRows) if (!r.groupId || !seenGroups.has(r.groupId)) add(r, r);

  /** @type {MetivData} */
  const data = {};
  /** @type {MetivData} */
  const heData = {};
  /** @type {Record<string, Record<string, string>>} */
  const copy = {};

  for (const col of COLLECTIONS) {
    const entries = (bySlug[col.slug] ?? []).sort((a, b) => a.sortOrder - b.sortOrder);
    if (col.kind === 'list') {
      data[col.key] = entries.map((e) => e.loc);
      heData[col.key] = entries.map((e) => e.he);
    } else if (col.kind === 'strings') {
      const e = entries[0];
      data[col.key] = e ? (Array.isArray(e.loc.items) ? e.loc.items : e.he.items ?? []) : [];
      heData[col.key] = e?.he.items ?? [];
    } else {
      const e = entries[0];
      data[col.key] = e ? deepFallback(e.loc, e.he) : {};
      heData[col.key] = e?.he ?? {};
    }
  }
  for (const e of bySlug[COPY_SLUG] ?? []) {
    const ns = e.he._key;
    if (typeof ns === 'string') copy[ns] = { ...e.he, ...e.loc };
  }

  resolveRefs(data);
  resolveRefs(heData);
  const out = withDerived(stripPrivate(data), stripPrivate(heData));
  out.copy = copy;
  return out;
}

/**
 * Object fields missing (or empty) in the translation come from Hebrew.
 * Arrays are taken whole from the translation when it has them.
 * @param {any} loc @param {any} he
 * @returns {any}
 */
function deepFallback(loc, he) {
  if (loc === undefined || loc === null || loc === '') return he;
  if (Array.isArray(loc) || Array.isArray(he)) return loc;
  if (typeof loc === 'object' && he && typeof he === 'object') {
    /** @type {Record<string, any>} */
    const out = { ...he };
    for (const [k, v] of Object.entries(loc)) out[k] = deepFallback(v, he[k]);
    return out;
  }
  return loc;
}

/** Replaces every { $ref: "KEY#_key" } / { $ref: "KEY" } with the item it names. @param {MetivData} data */
function resolveRefs(data) {
  /** @type {Map<string, any>} */
  const index = new Map();
  for (const col of COLLECTIONS) {
    const v = data[col.key];
    if (col.kind === 'list') for (const item of v ?? []) index.set(`${col.key}#${item?._key}`, item);
    else if (col.kind === 'single') index.set(col.key, v);
  }
  /** @param {any} v @param {number} depth @returns {any} */
  const walk = (v, depth) => {
    if (depth > 8) return v;
    if (Array.isArray(v)) return v.map((x) => walk(x, depth + 1));
    if (v && typeof v === 'object') {
      if (typeof v.$ref === 'string') {
        const target = index.get(v.$ref);
        return target && !target.$ref ? { ...target, ...(v._key ? { _key: v._key } : {}) } : null;
      }
      for (const k of Object.keys(v)) v[k] = walk(v[k], depth + 1);
    }
    return v;
  };
  for (const col of COLLECTIONS) {
    if (col.kind === 'list') data[col.key] = (data[col.key] ?? []).map((x) => walk(x, 0)).filter(Boolean);
    else data[col.key] = walk(data[col.key], 0);
  }
}

/** Drops reserved `_` keys except `_key` (pages use it to match items across languages). @param {any} v @returns {any} */
function stripPrivate(v) {
  if (Array.isArray(v)) return v.map(stripPrivate);
  if (v && typeof v === 'object') {
    /** @type {Record<string, any>} */
    const out = {};
    for (const [k, x] of Object.entries(v)) if (k === '_key' || !k.startsWith('_')) out[k] = stripPrivate(x);
    return out;
  }
  return v;
}

/**
 * The derived values the static modules exported. Selections that test Hebrew
 * text (team group, role) run on the Hebrew data and map back by `_key`, so they
 * keep working in every language.
 * @param {MetivData} d @param {MetivData} he
 * @returns {MetivData}
 */
function withDerived(d, he) {
  /** @param {string} key @param {(item: any) => boolean} pick */
  const selectByHebrew = (key, pick) => {
    const keys = new Set((he[key] ?? []).filter(pick).map((/** @type {any} */ x) => x._key));
    return (d[key] ?? []).filter((/** @type {any} */ x) => keys.has(x._key));
  };
  const RJ = 'מסע שחרור';
  const RELEASE_JOURNEY_TEAM = selectByHebrew('TEAM', (t) => t.group === RJ);
  const RELEASE_JOURNEY_RESEARCHERS = selectByHebrew('TEAM', (t) => t.group !== RJ && new RegExp(RJ).test(`${t.role} ${t.bio || ''}`));
  const COURSES = d.COURSES ?? [];
  const ARTICLES = d.ARTICLES ?? [];
  const EVENTS = d.EVENTS ?? [];
  const services = d.METIV_SERVICES ?? [];
  return {
    ...d,
    ...(d.CONTACTS ?? {}),
    METIV_BOOKS_ORDER_NOTE: d.METIV_BOOKS_ORDER_NOTE?.text ?? '',
    getCourse: (/** @type {string} */ slug) => COURSES.find((/** @type {any} */ c) => c.slug === slug) || null,
    coursesByCategory: (/** @type {string} */ category) => COURSES.filter((/** @type {any} */ c) => c.category === category),
    getArticle: (/** @type {string} */ slug) => ARTICLES.find((/** @type {any} */ a) => a.slug === slug) || null,
    UPCOMING_EVENTS: EVENTS.filter((/** @type {any} */ e) => !e.isPast),
    PAST_EVENTS: EVENTS.filter((/** @type {any} */ e) => e.isPast),
    RELEASE_JOURNEY_TEAM,
    RELEASE_JOURNEY_RESEARCHERS,
    RELEASE_JOURNEY_STUDY: (d.ACTIVE_STUDIES ?? []).find((/** @type {any} */ s) => s.slug === 'release-journey-study'),
    RELEASE_JOURNEY_PAPERS: (d.PAPERS ?? []).filter((/** @type {any} */ p) => /peace of mind|battlefield to home/i.test(p.title)),
    // The landing page's service cards (the old shared/therapist METIV_SERVICES shape).
    METIV_SERVICE_CARDS: services.map((/** @type {any} */ s) => ({
      slug: s.id,
      title: s.shortTitle || s.title,
      summary: s.summary,
      icon: s.icon,
      anchor: s.id,
      href: `/patient/where-to-get-help#${s.id}`,
      sourceUrl: s.source,
    })),
    he,
  };
}

// ── React side ───────────────────────────────────────────────────────────────

const MetivContext = createContext(/** @type {MetivData|null} */ (null));

/** @type {MetivData|null} */
let current = null;

/** The loaded content for code outside components. Throws before the first load. */
export function getMetiv() {
  if (!current) throw new Error('Metiv content not loaded yet (getMetiv called outside MetivContentProvider)');
  return current;
}

/** Test hook: install data without the provider. @param {MetivData|null} data */
export function setMetivForTests(data) {
  current = data;
}

/** @param {string} lang */
export function metivQueryOptions(lang) {
  return {
    queryKey: ['metiv-content', lang],
    queryFn: async () => {
      const [heRows, langRows] = await Promise.all([fetchRows('he'), lang === 'he' ? Promise.resolve([]) : fetchRows(lang)]);
      return buildMetivData(heRows, langRows);
    },
    staleTime: 5 * 60 * 1000,
  };
}

// Shown before any content has loaded, so it cannot come from the DB.
const STATUS_TEXT = {
  he: { loading: 'טוען', failed: 'לא הצלחנו לטעון את התוכן. אפשר לנסות שוב.', retry: 'לנסות שוב' },
  ar: { loading: 'جارٍ التحميل', failed: 'تعذّر تحميل المحتوى. يمكنك المحاولة مرة أخرى.', retry: 'المحاولة مرة أخرى' },
  en: { loading: 'Loading', failed: 'We could not load the content. Please try again.', retry: 'Try again' },
  ru: { loading: 'Загрузка', failed: 'Не удалось загрузить содержимое. Попробуйте ещё раз.', retry: 'Попробовать снова' },
  fr: { loading: 'Chargement', failed: 'Impossible de charger le contenu. Veuillez réessayer.', retry: 'Réessayer' },
};

/** @param {{ children: React.ReactNode }} props */
export function MetivContentProvider({ children }) {
  const { lang } = useLang();
  const query = useQuery(metivQueryOptions(lang));
  const text = STATUS_TEXT[/** @type {keyof typeof STATUS_TEXT} */ (lang)] ?? STATUS_TEXT.he;
  const dir = lang === 'he' || lang === 'ar' ? 'rtl' : 'ltr';

  if (query.data) current = query.data;

  if (query.isError && !query.data) {
    return (
      <div dir={dir} lang={lang} className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-foreground p-6 text-center">
        <p className="font-medium">{text.failed}</p>
        <Button onClick={() => query.refetch()}>{text.retry}</Button>
      </div>
    );
  }
  if (!query.data) {
    return (
      <div role="status" aria-live="polite" dir={dir} lang={lang} className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        <span className="sr-only">{text.loading}</span>
        <span aria-hidden="true" className="h-8 w-8 rounded-full border-2 border-muted border-t-primary animate-spin" />
      </div>
    );
  }
  return <MetivContext.Provider value={query.data}>{children}</MetivContext.Provider>;
}

/** @returns {MetivData} */
export function useMetiv() {
  const data = useContext(MetivContext) ?? current;
  if (!data) throw new Error('useMetiv must be used inside MetivContentProvider');
  return data;
}

/**
 * The copy rows of one namespace: { key: text }. Missing keys read as ''.
 * @param {string} namespace
 * @returns {Record<string, string>}
 */
export function useCopy(namespace) {
  const data = useMetiv();
  return useMemo(() => new Proxy(data.copy?.[namespace] ?? {}, {
    get: (target, key) => (typeof key === 'string' && typeof target[key] === 'string' ? target[key] : ''),
  }), [data, namespace]);
}

/** Same as useCopy, for non-component code. @param {string} namespace @returns {Record<string, string>} */
export function getCopy(namespace) {
  return new Proxy(getMetiv().copy?.[namespace] ?? {}, {
    get: (target, key) => (typeof key === 'string' && typeof target[key] === 'string' ? target[key] : ''),
  });
}

/**
 * Fills {name} placeholders.
 * @param {string} text
 * @param {Record<string, string|number>} vars
 */
export function fmt(text, vars) {
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

export { COLLECTION_BY_SLUG };
