// מסע שחרור (V3 only): the data behind the two מסע שחרור pages, one in the
// patient area and one in the professional area.
//
// DEMO ONLY. The programme text is Metiv's (metiv.org/מסע-שחרור, in the shared
// snapshot). The counts are the ones published on the programme's own site,
// peaceofmind.org.il, read on 2026-10-12; "20 שנה" is the owner's figure (the
// site's own counter said 18 on that date). Counts only, no outcome claims.
// Metiv should confirm every number before anything here is published.

import { ACTIVE_STUDIES, PAPERS, TEAM } from '@/pages/metiv-demos/shared/therapist';

const SITE = 'https://peaceofmind.org.il/';

/**
 * @typedef {{ value: string, label: string }} Stat
 * @typedef {{ title: string, text: string }} Workshop
 * @typedef {{ key: string, label: string, title: string, summary: string, duration: string, workshops: Workshop[] }} JourneyModel
 */

export const RELEASE_JOURNEY = {
  title: 'מסע שחרור',
  siteUrl: SITE,
  siteLabel: 'peaceofmind.org.il',
  registerUrl: 'https://wkf.ms/4i9R9bO',
  social: [
    { label: 'פייסבוק', url: 'https://www.facebook.com/pomisrael/' },
    { label: 'אינסטגרם', url: 'https://www.instagram.com/pom_israel/' },
    { label: 'יוטיוב', url: 'https://www.youtube.com/channel/UCDhYpTPUXP1wWUeDjFyXrUQ' },
  ],
  belief: 'חיילים משוחררים רבים חוו במהלך שירותם אירועים קשים ומשמעותיים. אנו מאמינים כי כפי שהתאמנו יחד ונלחמו יחד, לוחמים זקוקים לעבד את חוויותיהם ביחד.',
  description:
    'פרויקט מסע שחרור מסייע לחיילים משוחררים, לאחר שירות צבאי שבו נחשפו לאירועי קרב, לעבד את חוויות הלחימה, לרכוש דרכי התמודדות ולהשלים את המעבר לחיים אזרחיים, במגוון התערבויות קבוצתיות ואישיות.',
  scope:
    'הפרויקט מקיים מסעות לעיבוד חוויות הלחימה עבור צוותים אורגניים וטיפולים פרטניים, ועוסק בפיתוח ובמחקר של שירותים חדשים עבור חיילים משוחררים המתמודדים עם אירועי השירות.',
  facilitators: 'את הסדנאות מובילים ומנחים עובדים סוציאליים קליניים ופסיכולוגים מצוות מטיב.',
  hosting:
    'במסע בחו"ל הקבוצה מתארחת שבוע אצל קהילה יהודית בעולם, והלינה אצל משפחות מארחות מהקהילה. רוב היום מוקדש לסדנאות משותפות, ושאר הזמן לפעילויות פנאי עם הקהילה.',
  hostCountries: ['ארצות הברית', 'בריטניה', 'קנדה', 'צרפת', 'גרמניה', 'איטליה', 'מונקו'],
  credits: [
    'פרויקט מסע שחרור פותח על ידי צוות מטיב, שכלל את פרופ\' רות פת-הורנצ\'יק, אלון ולטמן, יואל ורדי וד"ר דני ברום.',
    'סא"ל (במיל.) רחבי ששון, עו"ס קליני, תרם ממקצועיותו ומאישיותו לפיתוח הפרויקט.',
  ],
  partnership: 'התוכנית פועלת בשיתוף משרד הביטחון.',
};

/** Counts for both pages. @type {Stat[]} */
export const RELEASE_JOURNEY_STATS = [
  { value: '20', label: 'שנה להקמת מסע שחרור, מצוינות השנה' },
  { value: '250', label: 'צוותים עברו את התהליך' },
  { value: '3,500', label: 'בוגרי התוכנית' },
  { value: '80', label: 'קהילות בעולם אירחו מסע' },
];

/** Shown on the professional page only. @type {Stat} */
export const RELEASE_JOURNEY_WAITING = { value: '+200', label: 'צוותים ברשימת ההמתנה' };

const SUMMARY_WORKSHOP = (/** @type {string} */ gap) => ({
  title: 'סדנת סיכום',
  text: `${gap} לאחר הסדנה המרכזית. יום שישי, 8:00 עד 14:00, לרוב ביער באזור ירושלים.`,
});
const FOLLOW_UP_WORKSHOP = { title: 'סדנת מעקב', text: 'כ-6 חודשים לאחר סדנת הסיכום. כשש שעות, בערב.' };

/** The three journey models, as described on metiv.org. @type {JourneyModel[]} */
export const JOURNEY_MODELS = [
  {
    key: 'abroad',
    label: 'מסע מלא בחו"ל',
    title: 'מסע מלא בחו"ל',
    summary: '4 סדנאות לאורך כתשעה חודשים. הסדנה המרכזית מתקיימת שבוע בחו"ל, והשאר בארץ.',
    duration: 'כתשעה חודשים',
    workshops: [
      { title: 'סדנת פתיחה', text: 'יום וחצי, כולל לינה: מיום חמישי בסביבות 17:30 ועד יום שישי ב-14:00.' },
      { title: 'הסדנה המרכזית', text: 'שבוע בחו"ל, באירוח של קהילה יהודית. לינה אצל משפחות מארחות.' },
      SUMMARY_WORKSHOP('כחודש וחצי'),
      FOLLOW_UP_WORKSHOP,
    ],
  },
  {
    key: 'israel',
    label: 'מסע מלא בארץ',
    title: 'מסע מלא בארץ',
    summary: '4 סדנאות לאורך כתשעה חודשים. הסדנה המרכזית מתקיימת חמישה ימים במקום מבודד בארץ.',
    duration: 'כתשעה חודשים',
    workshops: [
      { title: 'סדנת פתיחה', text: 'יום אחד: יום שישי, מהבוקר ועד אחר הצהריים.' },
      { title: 'הסדנה המרכזית', text: 'חמישה ימים במקום מבודד בארץ, עם עבודה בתוך החדר ומחוצה לו.' },
      SUMMARY_WORKSHOP('כחודש'),
      FOLLOW_UP_WORKSHOP,
    ],
  },
  {
    key: 'short',
    label: 'מסע קצר בארץ',
    title: 'מסע קצר בארץ',
    summary: '3 סדנאות לאורך כחודשיים. הסדנה המרכזית מתקיימת שלושה ימים במקום מבודד בארץ.',
    duration: 'כחודשיים',
    workshops: [
      { title: 'סדנת פתיחה', text: 'יום אחד: יום שישי, מהבוקר ועד אחר הצהריים.' },
      { title: 'הסדנה המרכזית', text: 'שלושה ימים (ימים ג\'-ה\') במקום מבודד בארץ, עם עבודה בתוך החדר ומחוצה לו.' },
      SUMMARY_WORKSHOP('כחודש'),
    ],
  },
];

/** The programme's own staff, plus the Metiv staff whose role names the programme. */
export const RELEASE_JOURNEY_TEAM = TEAM.filter((t) => t.group === 'מסע שחרור');
export const RELEASE_JOURNEY_RESEARCHERS = TEAM.filter((t) => t.group !== 'מסע שחרור' && /מסע שחרור/.test(`${t.role} ${t.bio || ''}`));

/** @param {string} role */
const byRole = (role) => RELEASE_JOURNEY_TEAM.find((t) => t.role.includes(role));

/** Who to turn to, by subject. */
export const RELEASE_JOURNEY_CONTACTS = {
  applications: byRole('פניות'),
  followUp: byRole('מעני המשך'),
  communities: byRole('קהילות'),
  external: byRole('קשרי חוץ'),
  director: byRole('מנהלת מסע שחרור'),
};

export const RELEASE_JOURNEY_STUDY = ACTIVE_STUDIES.find((s) => s.slug === 'release-journey-study');

/** Papers about the programme, from the publications list. */
export const RELEASE_JOURNEY_PAPERS = PAPERS.filter((p) => /peace of mind|battlefield to home/i.test(p.title));
