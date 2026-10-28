// Small data helpers for V3 pages. Labels come from copy (`courseStatus`), and
// rules that read free text read the Hebrew record, so they hold in every language.

import { fmt, getCopy, getMetiv } from './content/MetivContent';

/** @typedef {import('@/pages/metiv-demos/shared/therapist/courses.js').Course} Course */

/**
 * Registration state of a course, as a label and a status tone.
 * @param {Course} c
 * @returns {{ key: 'open'|'ongoing'|'closed', label: string, tone: 'success'|'info'|'muted' }}
 */
export function courseStatus(c) {
  const runOpen = (c.formats || []).some((f) => !f.isPast && f.registration?.status === 'open');
  const copy = getCopy('courseStatus');
  if (!c.isPast && (c.registration?.status === 'open' || runOpen)) return { key: 'open', label: copy.open, tone: 'success' };
  if (c.isPast || c.registration?.status === 'closed') return { key: 'closed', label: copy.closed, tone: 'muted' };
  return { key: 'ongoing', label: copy.ongoing, tone: 'info' };
}

export const STATUS_ORDER = { open: 0, ongoing: 1, closed: 2 };

// Format words in the Hebrew course text, as escapes so this file holds no
// Hebrew: in-person (פרונטלי, במרכז), online (זום, מקוון), blended (משולב).
const IN_PERSON = /\u05E4\u05E8\u05D5\u05E0\u05D8\u05DC\u05D9|\u05D1\u05DE\u05E8\u05DB\u05D6/;
const ONLINE = /\u05D6\u05D5\u05DD|\u05DE\u05E7\u05D5\u05D5\u05DF/;
const BLENDED = /\u05DE\u05E9\u05D5\u05DC\u05D1/;

/**
 * Delivery kinds mentioned anywhere on a course (main format, runs, units).
 * Reads the Hebrew record of the course (same `_key`), whatever the language.
 * @param {Course} course
 * @returns {Set<'inperson'|'online'|'custom'>}
 */
export function courseFormatKinds(course) {
  const he = /** @type {any[]} */ (getMetiv().he?.COURSES ?? []);
  const c = /** @type {Course} */ (he.find((x) => x._key === /** @type {any} */ (course)._key) || course);
  const text = [c.format, ...(c.formats || []).map((f) => f.format), ...(c.units || []).map((u) => u.format)]
    .filter(Boolean)
    .join(' ');
  /** @type {Set<'inperson'|'online'|'custom'>} */
  const kinds = new Set();
  if (IN_PERSON.test(text)) kinds.add('inperson');
  if (ONLINE.test(text)) kinds.add('online');
  if (BLENDED.test(text)) { kinds.add('inperson'); kinds.add('online'); }
  if (!kinds.size) kinds.add('custom');
  return kinds;
}

/**
 * The nearest upcoming date of a course or of one of its runs, else its stated start.
 * @param {Course} c
 */
export function nextDate(c) {
  const upcoming = (c.formats || []).filter((f) => !f.isPast && f.startDate);
  return upcoming[0]?.startDate || c.startDate || '';
}

/** @param {string} [text] */
export function isLatin(text) {
  return !!text && /^[\s\W\d]*[A-Za-z]/.test(text);
}

/**
 * Count phrase: `one` for 1, else `many`. Pass `many` with a {n} placeholder
 * ("{n} courses") so a translation can put the number anywhere; without one the
 * number is put in front, as before.
 * @param {number} n
 * @param {string} one
 * @param {string} many
 */
export function countLabel(n, one, many) {
  if (n === 1) return one;
  return many.includes('{n}') ? fmt(many, { n }) : `${n} ${many}`;
}
