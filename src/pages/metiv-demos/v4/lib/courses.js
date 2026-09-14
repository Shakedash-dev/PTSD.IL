// Derived, display-only views over the shared course data.

import { COURSE_CATEGORIES } from '@/pages/metiv-demos/shared/therapist';

/** @typedef {import('@/pages/metiv-demos/shared/therapist/courses.js').Course} Course */

export const FORMAT_LABELS = {
  'in-person': 'פרונטלי',
  zoom: 'מקוון (זום)',
  blended: 'משולב',
  custom: 'בהתאמה לארגון',
  unspecified: 'לא צוין',
};

export const STATUS_LABELS = {
  open: 'ההרשמה פתוחה',
  unknown: 'פרטים בפנייה',
  closed: 'ההרשמה סגורה',
};

/** @param {Course} course @returns {string[]} */
export function formatKeys(course) {
  const text = [course.format, ...(course.formats || []).map((f) => f.format)].filter(Boolean).join(' ');
  const keys = [];
  if (/פרונטלי/.test(text)) keys.push('in-person');
  if (/זום|zoom/i.test(text)) keys.push('zoom');
  if (/משולב/.test(text)) keys.push('blended');
  if (/בהתאמה/.test(text)) keys.push('custom');
  if (!keys.length) keys.push('unspecified');
  return keys;
}

/** @param {Course} course */
export const statusOf = (course) => course.registration?.status || 'unknown';

/** @param {Course} course */
export const hasCredits = (course) => Boolean(course.credits?.length);

/** @param {string} key */
export const categoryLabel = (key) => COURSE_CATEGORIES.find((c) => c.key === key)?.label || key;

/** Soonest known date for sorting (ISO), or '' when none. @param {Course} course */
export function dateOf(course) {
  if (course.startDateISO) return course.startDateISO;
  const iso = (course.formats || []).map((f) => f.startDateISO).filter(Boolean).sort();
  return iso[0] || '';
}

const STATUS_ORDER = { open: 0, unknown: 1, closed: 2 };

/** @param {Course} a @param {Course} b */
export function byStatusThenDate(a, b) {
  const s = STATUS_ORDER[statusOf(a)] - STATUS_ORDER[statusOf(b)];
  if (s) return s;
  return dateOf(b).localeCompare(dateOf(a));
}

/** Courses that are not in the past, open first. @param {Course[]} courses */
export function currentCourses(courses) {
  return courses.filter((c) => !c.isPast).sort(byStatusThenDate);
}
