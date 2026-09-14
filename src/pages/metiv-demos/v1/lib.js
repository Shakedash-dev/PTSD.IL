// Version-local helpers for the v1 "Calm Editorial" demo. Data shaping only.

import { COURSE_CATEGORIES } from '@/pages/metiv-demos/shared/therapist';

export const BASE = '/metiv-site-demo-v1';
export const EXIT_URL = 'https://www.google.com/search?q=weather';

export const HE_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

/** @param {number} n */
export const pad = (n) => String(n).padStart(2, '0');

/** @param {string} [value] */
export const telHref = (value = '') => `tel:${value.replace(/[^\d+*]/g, '')}`;

/** Israeli local number to a wa.me link. @param {string} [value] */
export const whatsappHref = (value = '') => `https://wa.me/972${value.replace(/\D/g, '').replace(/^0/, '')}`;

/** @param {string} key */
export const categoryLabel = (key) => COURSE_CATEGORIES.find((c) => c.key === key)?.label || '';

/**
 * Registration state of a course, always with a text label.
 * @param {any} course
 * @returns {{ key: 'open'|'soon'|'closed', label: string }}
 */
export function courseStatus(course) {
  const status = course?.registration?.status;
  if (!course.isPast && status === 'open') return { key: 'open', label: 'ההרשמה פתוחה' };
  if (course.isPast || status === 'closed') return { key: 'closed', label: 'ההרשמה סגורה' };
  return { key: 'soon', label: 'מועד יפורסם' };
}

/** @param {any} run */
export function runStatus(run) {
  const status = run?.registration?.status;
  if (!run.isPast && status === 'open') return { key: 'open', label: 'ההרשמה פתוחה' };
  if (run.isPast || status === 'closed') return { key: 'closed', label: 'המחזור הסתיים' };
  return { key: 'soon', label: 'מועד יפורסם' };
}

/** @param {'ended'|'closed'|'soon'} status */
export function unitStatus(status) {
  if (status === 'soon') return { key: 'soon', label: 'בקרוב' };
  if (status === 'closed') return { key: 'closed', label: 'ההרשמה נסגרה' };
  return { key: 'closed', label: 'היחידה הסתיימה' };
}

export const FORMAT_FILTERS = [
  { key: 'all', label: 'כל הפורמטים' },
  { key: 'frontal', label: 'פרונטלי' },
  { key: 'zoom', label: 'זום' },
  { key: 'custom', label: 'בהתאמה לארגון' },
];

export const STATUS_FILTERS = [
  { key: 'all', label: 'כל המועדים' },
  { key: 'open', label: 'ההרשמה פתוחה' },
  { key: 'soon', label: 'מועד יפורסם' },
  { key: 'closed', label: 'התקיימו' },
];

/**
 * Which delivery formats a course is offered in, across all its runs and units.
 * @param {any} course
 * @returns {Set<string>}
 */
export function formatKeys(course) {
  const text = [
    course.format,
    ...(course.formats || []).map((f) => f.format),
    ...(course.units || []).map((u) => u.format),
  ].filter(Boolean).join(' ');
  const keys = new Set();
  if (/פרונטלי|משולב/.test(text)) keys.add('frontal');
  if (/זום|מקוון|משולב/.test(text)) keys.add('zoom');
  if (/התאמה/.test(text)) keys.add('custom');
  return keys;
}

/** @param {any} a @param {any} b */
export const byStartAsc = (a, b) => (a.startDateISO || '9999').localeCompare(b.startDateISO || '9999');
/** @param {any} a @param {any} b */
export const byStartDesc = (a, b) => (b.startDateISO || '').localeCompare(a.startDateISO || '');

/** Initials for an avatar: skip titles like ד"ר. @param {string} name */
export function initials(name) {
  return name
    .replace(/(ד"ר|פרופ'|פרופ׳)\s*/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
}

// The kit's circle titles are fragments meant to precede a styled word on the
// old home page; v1 shows complete labels.
/** @type {Record<string, string>} */
const PATIENT_LABELS = {};

/** @param {{ key: string, label?: string, title?: string }} item */
export const patientLabel = (item) => PATIENT_LABELS[item.key] || item.label || item.title || '';

/** Short labels for the one-line area sub-navigation. @type {Record<string, string>} */
const PATIENT_NAV_SHORT = {
  firstCircle: 'מתמודדים',
  secondCircle: 'בני משפחה וקרובים',
  freeTreatment: 'טיפול ללא עלות',
};

/** @param {{ key: string, label: string }} item */
export const patientNavLabel = (item) => PATIENT_NAV_SHORT[item.key] || item.label;

/** @param {string} [src] */
export const isIllustration = (src = '') => src.includes('/illustrations/');
