// V4 information architecture helpers: mega menu groups, area detection,
// breadcrumb labels and document titles. Paths are site-relative (resolved by
// DemoLink inside the version).

import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { PATIENT_HUB } from '@/pages/metiv-demos/shared/patient';
import { THERAPIST_HUB, METIV_SERVICES, getCourse, getArticle } from '@/pages/metiv-demos/shared/therapist';

export const VERSION_BASE = '/metiv-site-demo-v4';

/** @typedef {'metiv'|'patient'|'therapist'} Area */
/** @typedef {{ key: string, label: string, route: string, description?: string, icon?: string }} MenuLink */
/** @typedef {{ title: string, links: MenuLink[] }} MenuGroup */

const quick = Object.fromEntries(PATIENT_HUB.quickLinks.map((l) => [l.key, l]));
const pathsByKey = Object.fromEntries(PATIENT_HUB.paths.map((p) => [p.key, p]));
const hub = Object.fromEntries(THERAPIST_HUB.sections.map((s) => [s.key, s]));

/** The kit's circle titles are two-line fragments ("מתמודד/ת עם"); V4 shows them in one line. */
export const PATH_LABELS = {
  firstCircle: 'מתמודד/ת עם טראומה',
  secondCircle: 'קרוב/ה של מתמודד/ת',
};

/** @param {string} key @returns {MenuLink} */
const q = (key) => ({ key, label: quick[key].label, route: quick[key].route, description: quick[key].description, icon: quick[key].icon });
/** @param {string} key @returns {MenuLink} */
const h = (key) => ({ key, label: hub[key].title, route: hub[key].route, description: hub[key].description, icon: hub[key].icon });

/** @type {MenuGroup[]} */
export const PATIENT_MENU = [
  { title: 'להבין מה קורה', links: [q('ptsdInfo'), q('questionnaire'), q('sources')] },
  { title: 'להתמודד ולקבל עזרה', links: [q('selfHelp'), q('calming'), q('treatment'), q('whereToGetHelp'), q('freeTreatment')] },
  { title: 'זכויות וקהילה', links: [q('rights'), q('community')] },
  {
    title: 'לבני משפחה וקרובים',
    links: [
      { key: 'firstCircle', label: PATH_LABELS.firstCircle, route: ROUTES.firstCircle, description: pathsByKey.firstCircle.subtitle, icon: 'Heart' },
      { key: 'secondCircle', label: PATH_LABELS.secondCircle, route: ROUTES.secondCircle, description: pathsByKey.secondCircle.subtitle, icon: 'Users' },
      q('secondCircleTools'),
      q('children'),
    ],
  },
];

/** @type {MenuGroup[]} */
export const THERAPIST_MENU = [
  { title: 'למידה והכשרה', links: [h('courses'), h('childrenFamily'), h('supervision'), h('organizations')] },
  { title: 'מחקר וידע', links: [h('research'), h('publications'), h('articles')] },
  { title: 'עדכונים', links: [h('events')] },
];

/** @type {MenuGroup[]} */
export const METIV_MENU = [
  {
    title: 'הארגון',
    links: [
      { key: 'about', label: 'אודות מטיב', route: ROUTES.about, description: 'היסטוריה, צוות, שותפים ותחומי פעילות.', icon: 'Landmark' },
      { key: 'contact', label: 'יצירת קשר', route: ROUTES.contact, description: 'כתובת, טלפונים ודואר אלקטרוני לפי נושא.', icon: 'Mail' },
      { key: 'donate', label: 'תרומה', route: ROUTES.donate, description: 'דרכים לתמוך בפעילות העמותה.', icon: 'HandHeart' },
    ],
  },
  {
    title: 'שירותי הטיפול של מטיב',
    links: METIV_SERVICES.map((s) => ({ key: s.slug, label: s.title, route: s.href, icon: s.icon })),
  },
  {
    title: 'מידע משפטי',
    links: [
      { key: 'accessibility', label: 'הצהרת נגישות', route: ROUTES.accessibility, icon: 'Accessibility' },
      { key: 'privacy', label: 'מדיניות פרטיות', route: ROUTES.privacy, icon: 'Shield' },
      { key: 'terms', label: 'תנאי שימוש', route: ROUTES.terms, icon: 'FileText' },
    ],
  },
];

/** Therapist section rail. */
export const THERAPIST_RAIL = [
  { key: 'therapist', label: 'ראשי', route: ROUTES.therapist },
  ...THERAPIST_HUB.sections.map((s) => ({ key: s.key, label: s.title, route: s.route })),
];

/** Metiv (general) section rail. */
export const METIV_RAIL = [
  { key: 'about', label: 'אודות מטיב', route: ROUTES.about },
  { key: 'contact', label: 'יצירת קשר', route: ROUTES.contact },
  { key: 'donate', label: 'תרומה', route: ROUTES.donate },
  { key: 'accessibility', label: 'הצהרת נגישות', route: ROUTES.accessibility },
  { key: 'privacy', label: 'מדיניות פרטיות', route: ROUTES.privacy },
  { key: 'terms', label: 'תנאי שימוש', route: ROUTES.terms },
];

/** @param {string} rel site-relative pathname @returns {Area} */
export function areaOf(rel) {
  if (rel === '/patient' || rel.startsWith('/patient/')) return 'patient';
  if (rel === '/therapist' || rel.startsWith('/therapist/')) return 'therapist';
  return 'metiv';
}

/** Strip the version base from a full pathname. @param {string} pathname */
export function relativePath(pathname) {
  let rel = pathname.startsWith(VERSION_BASE) ? pathname.slice(VERSION_BASE.length) : pathname;
  if (!rel) rel = '/';
  if (rel.length > 1 && rel.endsWith('/')) rel = rel.slice(0, -1);
  return rel;
}

/** Static labels for every non-slug route. */
const LABELS = {
  [ROUTES.home]: 'דף הבית',
  [ROUTES.about]: 'אודות מטיב',
  [ROUTES.donate]: 'תרומה',
  [ROUTES.contact]: 'יצירת קשר',
  [ROUTES.privacy]: 'מדיניות פרטיות',
  [ROUTES.terms]: 'תנאי שימוש',
  [ROUTES.accessibility]: 'הצהרת נגישות',
  [ROUTES.patient]: 'למתמודדים ולמשפחות',
  [ROUTES.firstCircle]: PATH_LABELS.firstCircle,
  [ROUTES.secondCircle]: PATH_LABELS.secondCircle,
  [ROUTES.secondCircleTools]: quick.secondCircleTools.label,
  [ROUTES.questionnaire]: quick.questionnaire.label,
  [ROUTES.ptsdInfo]: quick.ptsdInfo.label,
  [ROUTES.selfHelp]: quick.selfHelp.label,
  [ROUTES.treatment]: quick.treatment.label,
  [ROUTES.whereToGetHelp]: quick.whereToGetHelp.label,
  [ROUTES.freeTreatment]: quick.freeTreatment.label,
  [ROUTES.rights]: quick.rights.label,
  [ROUTES.community]: quick.community.label,
  [ROUTES.children]: quick.children.label,
  [ROUTES.sources]: quick.sources.label,
  [ROUTES.calming]: quick.calming.label,
  [ROUTES.calmingBreathing]: 'נשימה',
  [ROUTES.calmingGrounding]: 'קרקוע',
  [ROUTES.calmingMuscle]: 'הרפיית שרירים',
  [ROUTES.therapist]: 'לאנשי מקצוע',
  [ROUTES.courses]: 'קורסים והכשרות',
  [ROUTES.childrenFamily]: 'ילדים ומשפחה',
  [ROUTES.supervision]: 'הדרכה',
  [ROUTES.organizations]: 'לארגונים',
  [ROUTES.research]: 'מחקר',
  [ROUTES.publications]: 'פרסומים',
  [ROUTES.articles]: 'מאמרים',
  [ROUTES.events]: 'אירועים ועדכונים',
};

/** @param {string} rel */
export function labelFor(rel) {
  if (LABELS[rel]) return LABELS[rel];
  const course = rel.match(/^\/therapist\/courses\/([^/]+)$/);
  if (course) return getCourse(decodeURIComponent(course[1]))?.title || 'קורס';
  const article = rel.match(/^\/therapist\/articles\/([^/]+)$/);
  if (article) return getArticle(decodeURIComponent(article[1]))?.title || 'מאמר';
  return null;
}

/**
 * Breadcrumb trail for a site-relative path: every known prefix, home first.
 * @param {string} rel
 * @returns {{ route: string, label: string }[]}
 */
export function crumbsFor(rel) {
  if (rel === '/') return [];
  const parts = rel.split('/').filter(Boolean);
  const trail = [{ route: '/', label: 'מטיב' }];
  let acc = '';
  for (const part of parts) {
    acc += `/${part}`;
    const label = labelFor(acc);
    if (label) trail.push({ route: acc, label });
  }
  return trail;
}
