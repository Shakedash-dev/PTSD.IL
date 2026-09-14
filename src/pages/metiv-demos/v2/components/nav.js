// Navigation sets per area. The header swaps the whole set when the area
// changes (Spring Health pattern); the bottom bar labels match hub titles
// (NHS App pattern).

import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { PATIENT_NAV } from '@/pages/metiv-demos/shared/patient';
import { NAV } from '@/pages/metiv-demos/shared/therapist';

/** @typedef {{ key: string, label: string, route: string, icon?: string, children?: {key: string, label: string, route: string}[] }} NavEntry */

// The kit's circle labels ("מתמודד/ת עם", "קרוב/ה של") read as unfinished out of the
// original hero context, so the tabs use complete phrases.
const TAB_LABELS = { firstCircle: 'למתמודדים', secondCircle: 'לבני משפחה וקרובים' };
/** @type {NavEntry[]} */
export const PATIENT_TABS = PATIENT_NAV.map((t) => (TAB_LABELS[t.key] ? { ...t, label: TAB_LABELS[t.key] } : t));

/** @type {NavEntry[]} */
export const PRO_TABS = NAV;

/** @type {NavEntry[]} */
export const METIV_LINKS = [
  { key: 'about', label: 'אודות מטיב', route: ROUTES.about },
  { key: 'contact', label: 'צור קשר', route: ROUTES.contact },
  { key: 'donate', label: 'תרומה', route: ROUTES.donate },
];

/** Bottom bar: 4 links + the "עזרה עכשיו" sheet trigger (added by BottomNav). */
export const BOTTOM_NAV = {
  patient: [
    { key: 'patient', label: 'בית', route: ROUTES.patient, icon: 'House' },
    { key: 'ptsdInfo', label: 'מידע', route: ROUTES.ptsdInfo, icon: 'BookOpen' },
    { key: 'calming', label: 'תרגילים', route: ROUTES.calming, icon: 'Wind' },
    { key: 'questionnaire', label: 'שאלון', route: ROUTES.questionnaire, icon: 'ClipboardList' },
  ],
  pro: [
    { key: 'therapist', label: 'ראשי', route: ROUTES.therapist, icon: 'LayoutGrid' },
    { key: 'courses', label: 'קורסים', route: ROUTES.courses, icon: 'GraduationCap' },
    { key: 'research', label: 'מחקר', route: ROUTES.research, icon: 'Microscope' },
    { key: 'events', label: 'אירועים', route: ROUTES.events, icon: 'CalendarDays' },
  ],
  metiv: [
    { key: 'home', label: 'מטיב', route: ROUTES.home, icon: 'House' },
    { key: 'patient', label: 'מטופלים', route: ROUTES.patient, icon: 'HeartHandshake' },
    { key: 'therapist', label: 'אנשי מקצוע', route: ROUTES.therapist, icon: 'GraduationCap' },
    { key: 'donate', label: 'תרומה', route: ROUTES.donate, icon: 'HandHeart' },
  ],
};

/**
 * Which patient tab owns a path, and which circle's topic rail to show.
 * Topic pages belong to both circles; the first circle is the default owner,
 * except the family tools page which only exists in the second.
 * @param {string} path relative to the base
 */
export function patientSection(path) {
  const clean = path.split('#')[0];
  const direct = PATIENT_TABS.find((t) => t.route === clean);
  const first = PATIENT_TABS.find((t) => t.key === 'firstCircle');
  const second = PATIENT_TABS.find((t) => t.key === 'secondCircle');
  if (direct && (direct.key === 'firstCircle' || direct.key === 'secondCircle')) return { tab: direct.key, rail: direct };
  if (direct) return { tab: direct.key, rail: null };
  if (second?.children?.some((c) => c.route === clean) && !first?.children?.some((c) => c.route === clean)) {
    return { tab: 'secondCircle', rail: second };
  }
  if (first?.children?.some((c) => c.route === clean)) return { tab: 'firstCircle', rail: first };
  return { tab: '', rail: null };
}

/**
 * Active professional tab for a path.
 * @param {string} path relative to the base
 */
export function proSection(path) {
  const matches = PRO_TABS.filter((t) => t.route !== ROUTES.therapist && (path === t.route || path.startsWith(`${t.route}/`)));
  if (matches.length) return matches[0].key;
  return path === ROUTES.therapist ? 'therapist' : '';
}
