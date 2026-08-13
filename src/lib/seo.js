// Explicit extension and a relative path (not the `@/` alias) so plain Node can
// import this module directly - see the note below.
import { t, translations } from './i18n.js';

// Per-route document metadata for a client-rendered SPA.
//
// Every URL is served the same index.html, so without this the whole site sits
// in the index under one identical title and description, and every share
// preview looks the same. Kept free of React and of the `@/` alias so it can be
// exercised directly by a plain Node script.

// Canonical origin. Used for <link rel="canonical"> and og:url so the
// GitHub-Pages-era `/?/path` URLs and any query-string variants collapse onto
// one indexable URL per page.
export const SITE_URL = 'https://ptsd-il.site';

// og:locale wants a full locale tag, not the bare language code.
const OG_LOCALE = { he: 'he_IL', ar: 'ar_IL', ru: 'ru_RU', en: 'en_US', fr: 'fr_FR' };

// Route -> the i18n key holding that page's name. These are labels that already
// exist in all five languages, so a new route costs nothing to title. The home
// page is deliberately absent: it gets the bare site name.
export const ROUTE_TITLE_KEY = {
  '/first-circle': 'path1_title',
  '/second-circle': 'path2_title',
  '/second-circle-tools': 'nav_second_circle_tools',
  '/questionnaire': 'questionnaire',
  '/ptsd-info': 'ptsd_info',
  '/self-help': 'self_help',
  '/treatment': 'treatment',
  '/rights': 'rights',
  '/community': 'community',
  '/children': 'children_content',
  '/calming': 'calming',
  '/calming/breathing': 'breathing_title',
  '/calming/grounding': 'grounding_title',
  '/calming/muscle': 'muscle_title',
  '/sources': 'sources',
  '/privacy-policy': 'privacy_policy',
  '/terms-of-use': 'terms_of_use',
};

// Route -> the i18n key holding that page's meta description. These exist in
// Hebrew and English only; any other language falls back to the generic site
// description in its own language rather than to Hebrew (see resolveDesc).
export const ROUTE_DESC_KEY = {
  '/': 'seo_desc_home',
  '/first-circle': 'seo_desc_first_circle',
  '/second-circle': 'seo_desc_second_circle',
  '/second-circle-tools': 'seo_desc_second_circle_tools',
  '/questionnaire': 'seo_desc_questionnaire',
  '/ptsd-info': 'seo_desc_ptsd_info',
  '/self-help': 'seo_desc_self_help',
  '/treatment': 'seo_desc_treatment',
  '/rights': 'seo_desc_rights',
  '/community': 'seo_desc_community',
  '/children': 'seo_desc_children',
  '/calming': 'seo_desc_calming',
  '/calming/breathing': 'seo_desc_breathing',
  '/calming/grounding': 'seo_desc_grounding',
  '/calming/muscle': 'seo_desc_muscle',
  '/sources': 'seo_desc_sources',
  '/privacy-policy': 'seo_desc_privacy',
  '/terms-of-use': 'seo_desc_terms',
};

// t() falls back to Hebrew for a missing key, which would put a Hebrew meta
// description on a French page. Look the key up raw instead and fall back to
// the generic site description, which does exist in every language.
function resolveDesc(lang, pathname) {
  const key = ROUTE_DESC_KEY[pathname];
  const exact = key && translations[lang] && translations[lang][key];
  return exact || t(lang, 'hero_subtitle');
}

/** Pure: what the document metadata should be for this route and language. */
export function computeSeo(lang, pathname) {
  const siteName = t(lang, 'site_name');
  const titleKey = ROUTE_TITLE_KEY[pathname];
  return {
    title: titleKey ? `${t(lang, titleKey)} | ${siteName}` : siteName,
    description: resolveDesc(lang, pathname),
    // Trailing slash on the home page only, matching the sitemap.
    url: `${SITE_URL}${pathname === '/' ? '/' : pathname}`,
    locale: OG_LOCALE[lang] || 'he_IL',
  };
}

function setMeta(doc, selector, attr, value, content) {
  let el = doc.head.querySelector(selector);
  if (!el) {
    el = doc.createElement('meta');
    el.setAttribute(attr, value);
    doc.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(doc, href) {
  let el = doc.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = doc.createElement('link');
    el.setAttribute('rel', 'canonical');
    doc.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/** Writes a computeSeo() result into the document head. */
export function applySeo(doc, seo) {
  doc.title = seo.title;
  setMeta(doc, 'meta[name="description"]', 'name', 'description', seo.description);
  setCanonical(doc, seo.url);
  setMeta(doc, 'meta[property="og:title"]', 'property', 'og:title', seo.title);
  setMeta(doc, 'meta[property="og:description"]', 'property', 'og:description', seo.description);
  setMeta(doc, 'meta[property="og:url"]', 'property', 'og:url', seo.url);
  setMeta(doc, 'meta[property="og:locale"]', 'property', 'og:locale', seo.locale);
}
