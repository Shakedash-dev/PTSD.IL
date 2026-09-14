// V3 "Guided Journey": route labels, areas, the plain-language trail, the
// "בקצרה" (short version) boxes and the suggested next step per page.

import { matchPath } from 'react-router-dom';
import { ROUTES, versionBase } from '@/pages/metiv-demos/shared/routes';
import { getCourse, getArticle } from '@/pages/metiv-demos/shared/therapist';

export const VERSION = 'v3';
export const BASE = versionBase(VERSION);
export const BRAND = 'מטיב';

/** @typedef {'metiv'|'patient'|'therapist'} Area */

/** @type {Record<string, { label: string, area: Area, parent?: string }>} */
export const ROUTE_META = {
  home: { label: 'דף הבית', area: 'metiv' },
  about: { label: 'אודות מטיב', area: 'metiv', parent: 'home' },
  donate: { label: 'תרומה', area: 'metiv', parent: 'home' },
  contact: { label: 'יצירת קשר', area: 'metiv', parent: 'home' },
  privacy: { label: 'מדיניות פרטיות', area: 'metiv', parent: 'home' },
  terms: { label: 'תנאי שימוש', area: 'metiv', parent: 'home' },
  accessibility: { label: 'הצהרת נגישות', area: 'metiv', parent: 'home' },

  patient: { label: 'למטופלים ולמשפחות', area: 'patient', parent: 'home' },
  firstCircle: { label: 'מי שחווה אירוע קשה', area: 'patient', parent: 'patient' },
  secondCircle: { label: 'קרובים ובני משפחה', area: 'patient', parent: 'patient' },
  secondCircleTools: { label: 'כלים לבני משפחה', area: 'patient', parent: 'secondCircle' },
  questionnaire: { label: 'שאלון אנונימי', area: 'patient', parent: 'patient' },
  ptsdInfo: { label: 'מה זה פוסט-טראומה', area: 'patient', parent: 'patient' },
  selfHelp: { label: 'עזרה עצמית', area: 'patient', parent: 'patient' },
  treatment: { label: 'המסע הטיפולי', area: 'patient', parent: 'patient' },
  whereToGetHelp: { label: 'איפה מקבלים טיפול', area: 'patient', parent: 'patient' },
  freeTreatment: { label: 'טיפולים ללא עלות ומחקרים', area: 'patient', parent: 'patient' },
  rights: { label: 'זכויות', area: 'patient', parent: 'patient' },
  community: { label: 'קהילות תמיכה', area: 'patient', parent: 'patient' },
  children: { label: 'לדבר עם ילדים', area: 'patient', parent: 'patient' },
  sources: { label: 'מקורות', area: 'patient', parent: 'patient' },
  calming: { label: 'תרגילי הרגעה', area: 'patient', parent: 'patient' },
  calmingBreathing: { label: 'נשימה', area: 'patient', parent: 'calming' },
  calmingGrounding: { label: 'קרקוע', area: 'patient', parent: 'calming' },
  calmingMuscle: { label: 'הרפיית שרירים', area: 'patient', parent: 'calming' },

  therapist: { label: 'לאנשי טיפול ומקצוע', area: 'therapist', parent: 'home' },
  courses: { label: 'קורסים והכשרות', area: 'therapist', parent: 'therapist' },
  course: { label: 'קורס', area: 'therapist', parent: 'courses' },
  childrenFamily: { label: 'ילדים ומשפחה', area: 'therapist', parent: 'therapist' },
  supervision: { label: 'הדרכה', area: 'therapist', parent: 'therapist' },
  organizations: { label: 'לארגונים', area: 'therapist', parent: 'therapist' },
  research: { label: 'מחקר', area: 'therapist', parent: 'therapist' },
  publications: { label: 'פרסומים', area: 'therapist', parent: 'therapist' },
  articles: { label: 'מאמרים', area: 'therapist', parent: 'therapist' },
  article: { label: 'מאמר', area: 'therapist', parent: 'articles' },
  events: { label: 'אירועים ועדכונים', area: 'therapist', parent: 'therapist' },
};

// More specific patterns first so "/patient/calming/breathing" never matches "/patient".
const ORDERED_KEYS = Object.keys(ROUTES).sort((a, b) => ROUTES[b].length - ROUTES[a].length);

/**
 * Which ROUTES key a pathname (with or without the version base) belongs to.
 * @param {string} pathname
 * @returns {{ key: string|null, params: Record<string, string|undefined> }}
 */
export function resolveRoute(pathname) {
  let rel = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname;
  if (!rel) rel = '/';
  if (rel.length > 1) rel = rel.replace(/\/+$/, '');
  for (const key of ORDERED_KEYS) {
    const m = matchPath({ path: ROUTES[key], end: true }, rel);
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
  if (!key) return BRAND;
  if (key === 'course') return getCourse(params.slug || '')?.title || ROUTE_META.course.label;
  if (key === 'article') return getArticle(params.slug || '')?.title || ROUTE_META.article.label;
  return ROUTE_META[key]?.label || BRAND;
}

/**
 * The "את/ה כאן" trail, root first.
 * @param {string|null} key
 * @param {Record<string, string|undefined>} params
 * @returns {{ label: string, to: string|null }[]}
 */
export function trailFor(key, params = {}) {
  if (!key || key === 'home') return [];
  /** @type {{ label: string, to: string|null }[]} */
  const trail = [{ label: routeLabel(key, params), to: null }];
  let parent = ROUTE_META[key]?.parent;
  while (parent) {
    trail.unshift({ label: parent === 'home' ? BRAND : ROUTE_META[parent].label, to: ROUTES[parent] });
    parent = ROUTE_META[parent]?.parent;
  }
  return trail;
}

/** "בקצרה" boxes for the patient-kit pages: what is on the page, not clinical claims. @type {Record<string, string[]>} */
export const SHORT_VERSIONS = {
  firstCircle: [
    'מסלול למי שחווה בעצמו אירוע קשה.',
    'מידע על פוסט-טראומה, כלים שאפשר לנסות לבד וזכויות.',
    'איך מתחילים טיפול, קהילות תמיכה ואיך מדברים עם ילדים.',
  ],
  secondCircle: [
    'מסלול לבני זוג, הורים, ילדים וחברים של מי שמתמודד.',
    'מה עובר על האדם הקרוב, ואיך אפשר לתמוך בו.',
    'איך שומרים גם על עצמך בדרך.',
  ],
  secondCircleTools: [
    'כלים מעשיים לבני משפחה וקרובים.',
    'אפשר לפתוח רק את מה שרלוונטי כרגע.',
    'בסוף העמוד: מענים למשפחות של מילואימניקים.',
  ],
  questionnaire: [
    'שאלון אנונימי, בערך 3 דקות.',
    'השאלון אינו אבחון.',
    'בסוף מופיעות אפשרויות להמשך, כולל שיחת התייעצות.',
  ],
  ptsdInfo: [
    'שאלות ותשובות על פוסט-טראומה, בשפה פשוטה.',
    'אפשר לפתוח רק את השאלות שמעניינות אותך.',
  ],
  selfHelp: [
    'כלים שאפשר לנסות לבד, בקצב שלך.',
    'אפליקציות ורעיונות לשגרה.',
    'הרצאות וידאו מערוץ היוטיוב של מטיב.',
  ],
  treatment: [
    'מפת הדרכים לטיפול, שלב אחר שלב.',
    'מה קורה בכל שלב ומה אפשר לשאול.',
    'בסוף: איפה אפשר לקבל טיפול.',
  ],
  whereToGetHelp: [
    'מסגרות טיפול ציבוריות, עמותות ומרפאות של מטיב.',
    'כל מסגרת מוצגת באותו מבנה: למי, מה כולל, עלות ואיך פונים.',
    'לא בטוח/ה אם לפנות? יש אפשרות לשיחת התייעצות.',
  ],
  freeTreatment: [
    'מסגרות טיפול ללא עלות.',
    'מחקרים שמגייסים משתתפים.',
    'לכל מסגרת: למי מתאים ואיך פונים.',
  ],
  rights: [
    'זכויות לפי סוג הפגיעה.',
    'בוחרים קטגוריה, ופותחים רק את השאלה שמעניינת.',
    'בחלק מהתשובות יש הסבר שלב אחר שלב וקישורים.',
  ],
  community: [
    'קבוצות תמיכה ומפגשים ברחבי הארץ.',
    'מענים לחיילים משוחררים ולמילואימניקים.',
  ],
  children: [
    'איך מדברים עם ילדים, לפי גיל.',
    'קבוצות להורים ולילדים.',
  ],
  sources: [
    'המקורות שעליהם מבוסס המידע באזור.',
    'ספרים שכתבו או ערכו אנשי מטיב.',
  ],
};

/** A gentle next step at the end of each patient-kit page. @type {Record<string, { label: string, to: string }[]>} */
export const NEXT_STEPS = {
  firstCircle: [
    { label: 'לשאלון האנונימי', to: ROUTES.questionnaire },
    { label: 'איפה מקבלים טיפול', to: ROUTES.whereToGetHelp },
  ],
  secondCircle: [
    { label: 'כלים לבני משפחה', to: ROUTES.secondCircleTools },
    { label: 'לדבר עם ילדים', to: ROUTES.children },
  ],
  secondCircleTools: [
    { label: 'קהילות תמיכה', to: ROUTES.community },
    { label: 'איפה מקבלים טיפול', to: ROUTES.whereToGetHelp },
  ],
  questionnaire: [
    { label: 'מה זה פוסט-טראומה', to: ROUTES.ptsdInfo },
    { label: 'איפה מקבלים טיפול', to: ROUTES.whereToGetHelp },
  ],
  ptsdInfo: [
    { label: 'עזרה עצמית', to: ROUTES.selfHelp },
    { label: 'המסע הטיפולי', to: ROUTES.treatment },
  ],
  selfHelp: [
    { label: 'תרגילי הרגעה', to: ROUTES.calming },
    { label: 'קהילות תמיכה', to: ROUTES.community },
  ],
  treatment: [
    { label: 'איפה מקבלים טיפול', to: ROUTES.whereToGetHelp },
    { label: 'זכויות', to: ROUTES.rights },
  ],
  whereToGetHelp: [
    { label: 'טיפולים ללא עלות ומחקרים', to: ROUTES.freeTreatment },
    { label: 'זכויות', to: ROUTES.rights },
  ],
  freeTreatment: [
    { label: 'איפה מקבלים טיפול', to: ROUTES.whereToGetHelp },
    { label: 'זכויות', to: ROUTES.rights },
  ],
  rights: [
    { label: 'טיפולים ללא עלות ומחקרים', to: ROUTES.freeTreatment },
    { label: 'המסע הטיפולי', to: ROUTES.treatment },
  ],
  community: [
    { label: 'לדבר עם ילדים', to: ROUTES.children },
    { label: 'עזרה עצמית', to: ROUTES.selfHelp },
  ],
  children: [
    { label: 'כלים לבני משפחה', to: ROUTES.secondCircleTools },
    { label: 'קהילות תמיכה', to: ROUTES.community },
  ],
  sources: [
    { label: 'מה זה פוסט-טראומה', to: ROUTES.ptsdInfo },
    { label: 'חזרה לכל הנושאים', to: ROUTES.patient },
  ],
};
