// V3 "Guided Journey": route paths and the helpers that turn a pathname into a
// route key, a label and the plain-language trail. The labels, areas and
// parents (ROUTE_META), the "short version" boxes (SHORT_VERSIONS) and the next
// step per page (NEXT_STEPS) are content: they come from useMetiv() / getMetiv().

import { matchPath } from 'react-router-dom';
import { ROUTES, versionBase } from '@/pages/metiv-demos/shared/routes';
import { getCopy, getMetiv } from './content/MetivContent';

export const VERSION = 'v3';
export const BASE = versionBase(VERSION);

/** The site's short name (copy `chrome.brand`). Valid inside MetivContentProvider. */
export function getBrand() {
  return getCopy('chrome').brand;
}

// Pages only V3 has (owner feedback): the "על מטיב" sub-pages and the two
// מסע שחרור pages. Kept out of shared/routes.js, which lists the page set every
// version implements.
export const V3_ROUTES = {
  aboutHistory: '/about/history',
  aboutTeam: '/about/team',
  aboutPartners: '/about/partners',
  aboutCollaborations: '/about/collaborations',
  releaseJourney: '/patient/release-journey',
  releaseJourneyPro: '/therapist/release-journey',
};

/** Every route V3 serves: the shared page set plus the V3-only pages. @type {Record<string, string>} */
export const ALL_ROUTES = { ...ROUTES, ...V3_ROUTES };

/** @typedef {'metiv'|'patient'|'therapist'} Area */
/** @typedef {Record<string, { label: string, area: Area, parent?: string }>} RouteMeta */

/** The route labels, areas and parents. @returns {RouteMeta} */
export function getRouteMeta() {
  return getMetiv().ROUTE_META ?? {};
}

// More specific patterns first so "/patient/calming/breathing" never matches "/patient".
const ORDERED_KEYS = Object.keys(ALL_ROUTES).sort((a, b) => ALL_ROUTES[b].length - ALL_ROUTES[a].length);

/**
 * Which route key a pathname (with or without the version base) belongs to.
 * @param {string} pathname
 * @returns {{ key: string|null, params: Record<string, string|undefined> }}
 */
export function resolveRoute(pathname) {
  let rel = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname;
  if (!rel) rel = '/';
  if (rel.length > 1) rel = rel.replace(/\/+$/, '');
  for (const key of ORDERED_KEYS) {
    const m = matchPath({ path: ALL_ROUTES[key], end: true }, rel);
    if (m) return { key, params: m.params };
  }
  return { key: null, params: {} };
}

/**
 * Human title for a resolved route (course and article titles come from data).
 * @param {string|null} key
 * @param {Record<string, string|undefined>} params
 */
export function routeLabel(key, params = {}) {
  const brand = getBrand();
  if (!key) return brand;
  const { getCourse, getArticle } = getMetiv();
  const meta = getRouteMeta();
  if (key === 'course') return getCourse(params.slug || '')?.title || meta.course?.label || brand;
  if (key === 'article') return getArticle(params.slug || '')?.title || meta.article?.label || brand;
  return meta[key]?.label || brand;
}

/**
 * The "you are here" trail, root first.
 * @param {string|null} key
 * @param {Record<string, string|undefined>} params
 * @returns {{ label: string, to: string|null }[]}
 */
export function trailFor(key, params = {}) {
  if (!key || key === 'home') return [];
  const meta = getRouteMeta();
  const brand = getBrand();
  /** @type {{ label: string, to: string|null }[]} */
  const trail = [{ label: routeLabel(key, params), to: null }];
  let parent = meta[key]?.parent;
  // The depth guard keeps an edited parent loop in the DB from hanging the page.
  for (let depth = 0; parent && depth < 10; depth++) {
    trail.unshift({ label: parent === 'home' ? brand : meta[parent]?.label || brand, to: ALL_ROUTES[parent] ?? null });
    parent = meta[parent]?.parent;
  }
  return trail;
}
