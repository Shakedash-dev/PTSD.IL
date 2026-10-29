// Field names and plain-text diffs for schema-less content JSON (the Metiv
// collections, and the sibling rows an AI translation stages). The generic
// editor (ContentEditor.jsx), the review dialog and the edit log all label a
// field the same way: a Hebrew name for the common keys, else the key itself.

import { NON_TRANSLATABLE_KEYS } from '@/lib/translatable';

/** Hebrew names for the keys the Metiv seed (scripts/metiv-seed/he) uses. */
export const FIELD_LABELS = {
  a: 'תשובה',
  about: 'אודות',
  accessibility: 'נגישות',
  accessibilityCoordinator: 'רכז/ת נגישות',
  activities: 'פעילויות',
  activitiesIntro: 'פתיחה לפעילויות',
  additions: 'תוספות',
  address: 'כתובת',
  adolescents: 'מתבגרים',
  adultsClinicFormUrl: 'טופס פנייה למרפאת המבוגרים',
  ageGroups: 'מתאים לגילאים (בשאלה "לאיזה גיל?")',
  ages: 'גילאים',
  answer: 'תשובה',
  applications: 'יישומים',
  area: 'אזור',
  article: 'כתבה',
  articles: 'כתבות',
  audience: 'קהל יעד',
  authors: 'מחברים',
  authorsAffiliation: 'שיוך המחברים',
  belief: 'אמונה',
  bio: 'ביוגרפיה',
  body: 'גוף הטקסט',
  booksOrderingNote: 'הערה על הזמנת ספרים',
  brand: 'מותג',
  category: 'קטגוריה',
  challenges: 'אתגרים',
  children: 'ילדים',
  clientList: 'לקוחות',
  collaborationContact: 'איש/אשת קשר לשיתופי פעולה',
  communities: 'קהילות',
  community: 'קהילה',
  consultation: 'ייעוץ',
  contact: 'יצירת קשר',
  contacts: 'אנשי קשר',
  coordinator: 'רכז/ת',
  cost: 'עלות',
  course: 'קורס',
  courses: 'קורסים',
  courseSlug: 'מזהה הקורס',
  coursesWhatsapp: 'וואטסאפ קורסים',
  credits: 'קרדיטים',
  crisis: 'שאלת חירום',
  crisisLines: 'קווי חירום',
  cta: 'כפתור פעולה',
  ctaLabel: 'טקסט הכפתור',
  date: 'תאריך',
  dateISO: 'תאריך',
  dates: 'תאריכים',
  dateText: 'טקסט תאריך מותאם - רק כשיש כמה תאריכים',
  demoNote: 'הערה',
  departments: 'מחלקות',
  description: 'תיאור',
  details: 'פרטים',
  developedBy: 'פותח על ידי',
  director: 'מנהל/ת',
  disclaimer: 'הסתייגות',
  doi: 'DOI',
  donate: 'תרומה',
  donateUrl: 'קישור לתרומה',
  duration: 'משך',
  eligibility: 'תנאי זכאות',
  email: 'אימייל',
  emails: 'כתובות אימייל',
  endDateISO: 'תאריך סיום',
  ERAN_PHONE: 'ער"ן: מספר טלפון',
  ERAN_WHATSAPP: 'ער"ן: קישור לוואטסאפ',
  events: 'אירועים',
  excerpt: 'קטע מקדים',
  external: 'חיצוני',
  eyebrow: 'כותרת עליונה',
  facebook: 'פייסבוק',
  facebookKids: 'פייסבוק מטיב ילדים',
  facilitator: 'מנחה',
  facilitators: 'מנחים',
  faq: 'שאלות נפוצות',
  fax: 'פקס',
  featured: 'מוצג בראש',
  focus: 'מיקוד',
  followUp: 'המשך',
  footer: 'כותרת תחתונה',
  format: 'מתכונת',
  formats: 'מתכונות',
  forWhom: 'למי זה מתאים',
  forYou: 'בשבילך',
  fullName: 'שם מלא',
  general: 'כללי',
  genre: 'סוג המאמר',
  group: 'קבוצה',
  growth: 'צמיחה',
  guidance: 'הנחיה',
  heading: 'כותרת',
  headline: 'כותרת ראשית',
  hero: 'אזור פתיחה',
  history: 'היסטוריה',
  home: 'דף הבית',
  hostCountries: 'מדינות מארחות',
  hosting: 'אירוח',
  hours: 'שעות פעילות',
  href: 'קישור',
  icon: 'אייקון',
  id: 'מזהה',
  image: 'תמונה',
  intro: 'פתיחה',
  isPast: 'אירוע שעבר',
  isPlaceholder: 'טקסט זמני (מציג את ההערה "[טקסט זמני]")',
  items: 'פריטים',
  journal: 'כתב עת',
  journalClub: 'ג׳ורנל קלאב',
  key: 'מפתח',
  keyMessages: 'מסרים מרכזיים',
  kids: 'ילדים',
  kidsClinicFormUrl: 'טופס פנייה למטיב ילדים',
  kind: 'סוג',
  kinds: 'סוג ההדרכה (בשאלה "איזו הדרכה?")',
  label: 'תווית',
  language: 'שפה',
  lecturers: 'מרצים',
  legalEntity: 'ישות משפטית',
  legalName: 'שם משפטי',
  link: 'קישור',
  linkLabel: 'טקסט הקישור',
  links: 'קישורים',
  linktree: 'Linktree',
  location: 'מיקום',
  mail: 'כתובת למכתבים',
  main: 'ראשי',
  mission: 'ייעוד',
  models: 'מודלים',
  name: 'שם',
  needs: 'עונה על הצורך (בשאלה בראש העמוד)',
  note: 'הערה',
  notSuitableFor: 'לא מתאים ל',
  options: 'אפשרויות',
  organizations: 'ארגונים',
  other: 'אחר',
  paragraphs: 'פסקאות',
  paraphrases: 'ניסוחים נוספים',
  partners: 'שותפים',
  partnersAbroad: 'מדינות בעולם',
  partnership: 'שותפות',
  partnerships: 'שותפויות',
  pastResearchAreas: 'תחומים שנחקרו בעבר',
  paths: 'מסלולים',
  paymentNote: 'הערת תשלום',
  periodicTrainings: 'הכשרות שנפתחות מעת לעת',
  phone: 'טלפון',
  phones: 'טלפונים',
  placeholder: 'פרטים להשלמה (מציג את התווית "להשלמה")',
  policy: 'מדיניות',
  population: 'אוכלוסייה',
  prerequisites: 'דרישות קדם',
  price: 'מחיר',
  priceOptions: 'אפשרויות תשלום',
  principles: 'עקרונות',
  privacy: 'פרטיות',
  process: 'תהליך',
  programSiteUrl: 'אתר התוכנית',
  provider: 'גורם מפעיל',
  publications: 'פרסומים',
  publishedDate: 'תאריך פרסום',
  publisher: 'הוצאה',
  q: 'שאלה',
  question: 'שאלה',
  quickLinks: 'קישורים מהירים',
  quote: 'ציטוט',
  readingMinutes: 'זמן קריאה (דקות)',
  recruiting: 'מגייס משתתפים',
  registerUrl: 'קישור להרשמה',
  registration: 'הרשמה',
  registrationUrl: 'קישור להרשמה',
  releaseJourney: 'מופיע בעמוד מסע שחרור',
  releaseJourneyResearcher: 'חוקר/ת במחקר של מסע שחרור',
  releaseJourneyTeam: 'בצוות מסע שחרור',
  research: 'מחקר',
  researchWhatsapp: 'וואטסאפ מחקר',
  role: 'תפקיד',
  route: 'נתיב',
  schedule: 'מועדים',
  scope: 'היקף',
  sections: 'סעיפים',
  shortName: 'שם מקוצר',
  shortTitle: 'כותרת קצרה',
  siteLabel: 'שם האתר',
  siteUrl: 'אתר',
  slug: 'מזהה בכתובת (slug)',
  social: 'רשתות חברתיות',
  source: 'מקור',
  sourceUrl: 'קישור למקור',
  startDate: 'תאריך התחלה',
  startDateISO: 'תאריך פתיחה',
  status: 'סטטוס',
  structure: 'מבנה',
  subtitle: 'כותרת משנה',
  suitableFor: 'מתאים ל',
  summary: 'תקציר',
  supervision: 'הדרכה',
  syllabus: 'סילבוס',
  tagline: 'סלוגן',
  tags: 'תגיות',
  team: 'צוות',
  teamIntro: 'פתיחה לצוות',
  terms: 'תנאי שימוש',
  testimonials: 'המלצות',
  text: 'טקסט',
  therapistNeeds: 'מומלץ במסלול של אנשי מקצוע',
  timeline: 'ציר זמן',
  title: 'כותרת',
  to: 'יעד',
  topic: 'נושא',
  topics: 'נושאים',
  trainingInterestFormUrl: 'טופס רישום התעניינות',
  trainingsFormUrl: 'טופס פנייה להכשרה או הדרכה',
  type: 'סוג',
  units: 'יחידות',
  updated: 'עודכן',
  url: 'כתובת (URL)',
  value: 'ערך',
  vision: 'חזון',
  voices: 'קולות',
  ways: 'דרכים',
  what: 'מה זה',
  whatsapp: 'וואטסאפ',
  who: 'למי',
  workshops: 'סדנאות',
  year: 'שנה',
  youtube: 'יוטיוב',
};

/**
 * @param {string} key
 * @param {Record<string, string>} [labels]  a section's own names, ahead of FIELD_LABELS
 */
export function fieldLabel(key, labels) {
  return labels?.[key] || FIELD_LABELS[key] || key;
}

/** Links, ids, icons, routes: shown in the collapsed "technical" area. */
export function isTechnicalKey(key) {
  return NON_TRANSLATABLE_KEYS.has(key) && key !== '$ref';
}

/** Keys that hold Markdown wherever they appear. */
const MARKDOWN_KEYS = new Set(['body', 'text', 'answer', 'a', 'guidance', 'intro', 'details', 'process', 'content', 'bio']);

/** @param {string} key @param {string} value */
export function isMarkdownField(key, value) {
  if (MARKDOWN_KEYS.has(key)) return true;
  return key === 'description' && value.includes('\n');
}

/** @param {unknown} v */
export function isRef(v) {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v) && '$ref' in /** @type {any} */ (v);
}

const TITLE_KEYS = ['title', 'name', 'label', 'q', 'question', 'heading', 'fullName', 'text'];

/**
 * A list item's display name, or `fallback` when it has none.
 * @param {any} item @param {string} [fallback]
 */
export function itemTitle(item, fallback = '') {
  if (typeof item === 'string') return item;
  if (!item || typeof item !== 'object') return fallback;
  for (const k of TITLE_KEYS) {
    if (typeof item[k] === 'string' && item[k].trim()) return item[k];
  }
  return fallback;
}

/**
 * The first readable text of an item that is not its title - a card's summary.
 * @param {any} item
 */
export function itemSummary(item) {
  const title = itemTitle(item);
  /** @type {string} */
  let found = '';
  const walk = (v, key) => {
    if (found) return;
    if (typeof v === 'string') {
      if (v.trim() && v !== title && !(key && (key.startsWith('_') || isTechnicalKey(key)))) found = v;
    } else if (Array.isArray(v)) {
      v.forEach(x => walk(x, key));
    } else if (v && typeof v === 'object' && !isRef(v)) {
      for (const [k, x] of Object.entries(v)) if (!k.startsWith('_') && !isTechnicalKey(k)) walk(x, k);
    }
  };
  walk(item, undefined);
  const flat = found.replace(/[#*_>`]/g, '').replace(/\s+/g, ' ').trim();
  return flat.length > 160 ? `${flat.slice(0, 160)}...` : flat;
}

/**
 * A new list item shaped like `sample`: empty strings, false, 0, empty lists.
 * @param {any} sample
 */
export function blankLike(sample) {
  if (typeof sample === 'string') return '';
  if (typeof sample === 'number') return 0;
  if (typeof sample === 'boolean') return false;
  if (Array.isArray(sample)) return [];
  if (sample && typeof sample === 'object') {
    if (isRef(sample)) return {};
    return Object.fromEntries(
      Object.entries(sample).filter(([k]) => !k.startsWith('_')).map(([k, v]) => [k, blankLike(v)])
    );
  }
  return '';
}

// ─── Diff ────────────────────────────────────────────────────────────────────

/** @param {(string|number)[]} path @param {Record<string, string>} [labels] */
export function pathLabel(path, labels) {
  if (!path.length) return 'תוכן';
  return path.map(p => (typeof p === 'number' ? `#${p + 1}` : fieldLabel(p, labels))).join(' › ');
}

function leafText(v) {
  if (v === undefined || v === null) return '';
  if (typeof v === 'boolean') return v ? 'כן' : 'לא';
  if (isRef(v)) return `מקושר אל ${v.$ref}`;
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function listText(list) {
  return list.map((x, i) => (typeof x === 'object' && x !== null ? itemTitle(x, `פריט ${i + 1}`) : leafText(x))).join('\n');
}

const isObject = v => Boolean(v) && typeof v === 'object' && !Array.isArray(v);

/**
 * Every changed field of two content objects as plain text, one entry per
 * changed leaf with a readable path ("סילבוס › #2 › כותרת"). A list whose
 * length changed is one entry listing its items before and after. Keys that
 * start with `_` are never compared. `labels` are the section's own field
 * names (see fieldLabel).
 *
 * @param {any} before @param {any} after @param {Record<string, string>} [labels]
 * @returns {import('./PendingChanges').FieldDiff[]}
 */
export function contentDiff(before, after, labels) {
  /** @type {Array<{ label: string, before: string, after: string, path: string }>} */
  const out = [];
  const push = (path, b, a, label = pathLabel(path, labels)) => out.push({ label, before: b, after: a, path: path.join('.') });

  const walk = (a, b, path) => {
    if (isRef(a) || isRef(b)) {
      if (JSON.stringify(a) !== JSON.stringify(b)) push(path, leafText(a), leafText(b));
      return;
    }
    if (Array.isArray(a) || Array.isArray(b)) {
      const A = Array.isArray(a) ? a : [];
      const B = Array.isArray(b) ? b : [];
      if (A.length !== B.length) {
        if (JSON.stringify(A) !== JSON.stringify(B)) push(path, listText(A), listText(B), `${pathLabel(path, labels)} (רשימה)`);
        return;
      }
      A.forEach((x, i) => walk(x, B[i], [...path, i]));
      return;
    }
    if (isObject(a) || isObject(b)) {
      const A = isObject(a) ? a : {};
      const B = isObject(b) ? b : {};
      const keys = [...new Set([...Object.keys(A), ...Object.keys(B)])].filter(k => !k.startsWith('_'));
      for (const k of keys) walk(A[k], B[k], [...path, k]);
      return;
    }
    const ta = leafText(a);
    const tb = leafText(b);
    if (ta !== tb) push(path, ta, tb);
  };
  walk(before, after, []);

  // The dialog keys entries by label; two keys sharing a Hebrew name ("q" and
  // "question") get their path appended.
  const seen = new Map();
  for (const d of out) seen.set(d.label, (seen.get(d.label) || 0) + 1);
  return out.map(({ path, ...d }) => (seen.get(d.label) > 1 ? { ...d, label: `${d.label} [${path}]` } : d));
}
