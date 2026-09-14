// Small data helpers for V3 pages. Pure functions over shared static data.

/** @typedef {import('@/pages/metiv-demos/shared/therapist/courses.js').Course} Course */

/**
 * Registration state of a course, as a label and a status tone.
 * @param {Course} c
 * @returns {{ key: 'open'|'ongoing'|'closed', label: string, tone: 'success'|'info'|'muted' }}
 */
export function courseStatus(c) {
  const runOpen = (c.formats || []).some((f) => !f.isPast && f.registration?.status === 'open');
  if (!c.isPast && (c.registration?.status === 'open' || runOpen)) return { key: 'open', label: 'הרשמה פתוחה', tone: 'success' };
  if (c.isPast || c.registration?.status === 'closed') return { key: 'closed', label: 'התקיים בעבר', tone: 'muted' };
  return { key: 'ongoing', label: 'מתקיים מעת לעת, פרטים בפנייה', tone: 'info' };
}

export const STATUS_ORDER = { open: 0, ongoing: 1, closed: 2 };

/**
 * Delivery kinds mentioned anywhere on a course (main format, runs, units).
 * @param {Course} c
 * @returns {Set<'inperson'|'online'|'custom'>}
 */
export function courseFormatKinds(c) {
  const text = [c.format, ...(c.formats || []).map((f) => f.format), ...(c.units || []).map((u) => u.format)]
    .filter(Boolean)
    .join(' ');
  /** @type {Set<'inperson'|'online'|'custom'>} */
  const kinds = new Set();
  if (/פרונטלי|במרכז/.test(text)) kinds.add('inperson');
  if (/זום|מקוון/.test(text)) kinds.add('online');
  if (/משולב/.test(text)) { kinds.add('inperson'); kinds.add('online'); }
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
 * Hebrew count phrase: 1 -> "קורס אחד", n -> "n קורסים".
 * @param {number} n
 * @param {string} one
 * @param {string} many
 */
export function countLabel(n, one, many) {
  return n === 1 ? one : `${n} ${many}`;
}
