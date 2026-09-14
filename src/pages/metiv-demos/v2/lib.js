// Version-local constants and helpers for V2 "Two Doors".
//
// The core idea: colour is place. Light surfaces always mean the patient and
// family area, the dark sanctuary surface always means the professional area.
// Metiv's general pages (landing, about, donate...) sit on light ground with
// both doors visible.

import { matchPath } from 'react-router-dom';
import { ROUTES, versionBase } from '@/pages/metiv-demos/shared/routes';
import { getCourse, getArticle } from '@/pages/metiv-demos/shared/therapist';

export const VERSION = 'v2';
export const BASE = versionBase(VERSION);
export const LOGO = `${import.meta.env.BASE_URL || '/'}images/metiv-demo/metiv-logo.png`;
export const QUICK_EXIT_URL = 'https://www.google.com/search?q=weather';
export const ERAN_PHONE = '1201';
export const ERAN_WHATSAPP = 'https://api.whatsapp.com/send?phone=9720528451201';

/** @typedef {'patient'|'pro'|'metiv'} Area */

/**
 * Area of a pathname that is already relative to the version base.
 * @param {string} path
 * @returns {Area}
 */
export function areaOf(path) {
  if (path === ROUTES.patient || path.startsWith(`${ROUTES.patient}/`)) return 'patient';
  if (path === ROUTES.therapist || path.startsWith(`${ROUTES.therapist}/`)) return 'pro';
  return 'metiv';
}

/** @param {string} pathname full pathname, e.g. /metiv-site-demo-v2/patient */
export function stripBase(pathname) {
  if (pathname === BASE) return '/';
  if (pathname.startsWith(`${BASE}/`)) return pathname.slice(BASE.length) || '/';
  return pathname;
}

export const AREA_LABELS = {
  patient: { full: 'למטופלים ומשפחות', short: 'מטופלים ומשפחות' },
  pro: { full: 'למטפלים ואנשי מקצוע', short: 'אנשי מקצוע' },
};

/** Document titles per route key. */
const TITLES = {
  home: 'דף הבית',
  about: 'אודות',
  donate: 'תרומה',
  contact: 'צור קשר',
  privacy: 'מדיניות פרטיות',
  terms: 'תנאי שימוש',
  accessibility: 'הצהרת נגישות',
  patient: 'למטופלים ומשפחות',
  firstCircle: 'המעגל הראשון',
  secondCircle: 'המעגל השני',
  secondCircleTools: 'כלים לבני משפחה',
  questionnaire: 'שאלון אנונימי',
  ptsdInfo: 'מידע על פוסט-טראומה',
  selfHelp: 'עזרה עצמית',
  treatment: 'המסע הטיפולי',
  whereToGetHelp: 'איפה מקבלים טיפול',
  freeTreatment: 'טיפולים ללא עלות ומחקרים',
  rights: 'זכויות',
  community: 'קהילות תמיכה',
  children: 'ילדים',
  sources: 'מקורות',
  calming: 'תרגילי הרגעה',
  calmingBreathing: 'תרגיל נשימה',
  calmingGrounding: 'תרגיל קרקוע',
  calmingMuscle: 'הרפיית שרירים',
  therapist: 'למטפלים ואנשי מקצוע',
  courses: 'קורסים והכשרות',
  course: 'קורס',
  childrenFamily: 'ילדים ומשפחה',
  supervision: 'הדרכה',
  organizations: 'לארגונים',
  research: 'מחקר',
  publications: 'פרסומים',
  articles: 'מאמרים',
  article: 'מאמר',
  events: 'אירועים ועדכונים',
};

/** @param {string} path relative to the base */
export function titleFor(path) {
  for (const [key, pattern] of Object.entries(ROUTES)) {
    const m = matchPath(pattern, path);
    if (!m) continue;
    if (key === 'course') return getCourse(m.params.slug || '')?.title || TITLES.course;
    if (key === 'article') return getArticle(m.params.slug || '')?.title || TITLES.article;
    return TITLES[key] || '';
  }
  return '';
}

/** Markdown styling on light surfaces (no dependency on the global .rich-content). */
export const PROSE_LIGHT =
  'text-foreground leading-relaxed [&_p]:my-3 [&_p:first-child]:mt-0 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:ps-6 [&_ol]:list-decimal [&_ol]:ps-6 [&_li]:my-1.5 [&_h2]:font-heading [&_h2]:font-semibold [&_h2]:text-xl [&_h2]:mt-8 [&_h2]:mb-2 [&_h3]:font-heading [&_h3]:font-semibold [&_h3]:text-lg [&_h3]:mt-6 [&_h3]:mb-2 [&_strong]:font-semibold [&_a]:text-accent [&_a]:font-semibold [&_a]:underline [&_a]:underline-offset-2';

/** Markdown styling on the dark professional surface. Links stay light: purple fails contrast on sanctuary. */
export const PROSE_DARK =
  'text-sanctuary-foreground/90 leading-relaxed [&_p]:my-3 [&_p:first-child]:mt-0 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:ps-6 [&_ol]:list-decimal [&_ol]:ps-6 [&_li]:my-1.5 [&_h2]:font-heading [&_h2]:font-semibold [&_h2]:text-xl [&_h2]:text-sanctuary-foreground [&_h2]:mt-8 [&_h2]:mb-2 [&_h3]:font-heading [&_h3]:font-semibold [&_h3]:text-lg [&_h3]:text-sanctuary-foreground [&_h3]:mt-6 [&_h3]:mb-2 [&_strong]:font-semibold [&_strong]:text-sanctuary-foreground [&_a]:text-sanctuary-foreground [&_a]:font-semibold [&_a]:underline [&_a]:underline-offset-2';

/** Focus ring that stays visible on both grounds. */
export const FOCUS_LIGHT = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';
export const FOCUS_DARK = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sanctuary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-sanctuary';

/** @param {string} value phone as written */
export const telHref = (value) => `tel:${String(value).replace(/[^\d*+]/g, '')}`;

/** @param {string} value e.g. 02-5952235 -> WhatsApp link with the Israeli prefix */
export function whatsappHref(value) {
  const digits = String(value).replace(/\D/g, '').replace(/^0/, '');
  return `https://wa.me/972${digits}`;
}
