// "על מטיב" (V3 only): the organisation's services and departments, and its
// partners and collaborations regrouped by kind.
//
// DEMO ONLY. Every fact comes from the shared metiv.org snapshot
// (shared/therapist/org.js, shared/patient/additions.js). Nothing here is new
// information; it is the same data arranged so a visitor can see who does what
// and whom to contact. Entries marked `placeholder` wait for Metiv's own text.

import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { FUNDERS_AND_COLLABORATORS, ORG, TEAM } from '@/pages/metiv-demos/shared/therapist';
import { RELEASE_JOURNEY } from './releaseJourney';
import { V3_ROUTES } from '../meta';

/**
 * @typedef {{ name?: string, role?: string, email?: string, phone?: string }} DeptContact
 * @typedef {{ label: string, to?: string, href?: string }} DeptLink
 * @typedef {{ key: string, title: string, icon: string, forWhom: string, what: string, contact?: DeptContact, note?: string, links: DeptLink[] }} Department
 * @typedef {{ key: string, title: string, intro: string, departments: Department[] }} DepartmentGroup
 * @typedef {{ name: string, role: string, forYou?: string, links?: DeptLink[], placeholder?: boolean }} Partner
 * @typedef {{ key: string, title: string, intro: string, icon: string, partners: Partner[] }} PartnerGroup
 */

/** @param {string} name */
const member = (name) => TEAM.find((t) => t.name === name);
/** @param {string} name */
const lead = (name) => {
  const m = member(name);
  return m ? { name: m.name, role: m.role, email: m.email } : undefined;
};
/** @param {string} name */
const collaborator = (name) => FUNDERS_AND_COLLABORATORS.find((f) => f.name === name);

/** The units Metiv is built from, grouped by what a visitor comes for. @type {DepartmentGroup[]} */
export const DEPARTMENT_GROUPS = [
  {
    key: 'treatment',
    title: 'טיפול',
    intro: 'המרפאות והתוכניות שבהן מטיב נותן טיפול.',
    departments: [
      {
        key: 'adults-clinic',
        title: 'מרפאת המבוגרים',
        icon: 'HeartHandshake',
        forWhom: 'פונים בני 17 ומעלה שחוו טראומה או אובדן.',
        what: 'טיפול פרטני במרפאה בירושלים, וגם טיפול מקוון בזום.',
        contact: { ...lead('אריאל בן אהרון'), phone: ORG.phones.main },
        links: [
          { label: 'טופס פנייה למרפאה', href: ORG.adultsClinicFormUrl },
          { label: 'פרטים באזור המטופלים', to: `${ROUTES.whereToGetHelp}#adults-clinic` },
        ],
      },
      {
        key: 'kids-clinic',
        title: 'מטיב ילדים',
        icon: 'Baby',
        forWhom: 'ילדים עד גיל 18 והוריהם.',
        what: 'מרכז לוויסות רגשות: טיפול פרטני, דיאדי ומשפחתי, וקבוצות פנד"ה ונמ"ל.',
        contact: { ...lead('שרית שרם-יבין'), email: ORG.emails.kids, phone: ORG.phones.kids },
        links: [
          { label: 'טופס פנייה למטיב ילדים', href: ORG.kidsClinicFormUrl },
          { label: 'פרטים באזור המטופלים', to: `${ROUTES.whereToGetHelp}#kids-clinic` },
        ],
      },
      {
        key: 'migdalor',
        title: 'מרפאת מגדלור',
        icon: 'Shield',
        forWhom: 'מטופלים המוכרים באגף השיקום של משרד הביטחון, מחוז ירושלים.',
        what: 'מרפאה במרכז הרפואי הרצוג, של מטיב והמרכז הרפואי הרצוג.',
        note: 'הפנייה נעשית דרך אגף השיקום, והאגף מפנה למרפאה.',
        links: [{ label: 'פרטים באזור המטופלים', to: `${ROUTES.whereToGetHelp}#migdalor` }],
      },
      {
        key: 'release-journey',
        title: 'מסע שחרור',
        icon: 'Compass',
        forWhom: 'חיילים משוחררים שנחשפו לאירועי קרב במהלך השירות.',
        what: 'מסעות קבוצתיים לצוותים אורגניים בארץ ובחו"ל, וטיפולים פרטניים.',
        contact: lead('רחלי ברוקס'),
        links: [
          { label: 'לעמוד מסע שחרור', to: V3_ROUTES.releaseJourneyPro },
          { label: 'הרשמה למסע שחרור', href: RELEASE_JOURNEY.registerUrl },
        ],
      },
    ],
  },
  {
    key: 'training',
    title: 'הכשרה וליווי מקצועי',
    intro: 'לאנשי טיפול, לצוותים ולארגונים.',
    departments: [
      {
        key: 'training-unit',
        title: 'יחידת ההכשרות',
        icon: 'GraduationCap',
        forWhom: 'אנשי מקצוע מתחום בריאות הנפש.',
        what: 'קורסים, ימי השתלמות והכשרות בטיפול בטראומה, והדרכה פרטנית וקבוצתית.',
        contact: lead('גפנית אגסי'),
        links: [
          { label: 'קורסים והכשרות', to: ROUTES.courses },
          { label: 'הדרכה', to: ROUTES.supervision },
          { label: 'טופס פנייה להכשרה או הדרכה', href: ORG.trainingsFormUrl },
        ],
      },
      {
        key: 'organizations',
        title: 'ארגונים וקהילה',
        icon: 'Building2',
        forWhom: 'ארגונים, צוותים, רשויות וקהילות.',
        what: 'הכשרות לארגונים, מרחב מטיב, בניית ארגון מותאם טראומה וסדנאות בהתאמה.',
        contact: lead('יונית אפרתי'),
        links: [{ label: 'לארגונים', to: ROUTES.organizations }],
      },
    ],
  },
  {
    key: 'research',
    title: 'מחקר',
    intro: 'יחידת המחקר של מטיב.',
    departments: [
      {
        key: 'research-unit',
        title: 'יחידת המחקר',
        icon: 'Microscope',
        forWhom: 'חוקרים, גופים שרוצים לשתף פעולה, ומי שמתעניין בהשתתפות במחקר.',
        what: 'מחקרים פעילים, מחקר והערכה של תוכניות הטיפול, ופרסומים של אנשי מטיב.',
        contact: lead('שיר אליאס'),
        links: [
          { label: 'מחקרים פעילים', to: ROUTES.research },
          { label: 'פרסומים', to: ROUTES.publications },
        ],
      },
    ],
  },
  {
    key: 'partnerships',
    title: 'שותפויות ותמיכה',
    intro: 'לקרנות, לתורמים ולגופים שרוצים לעבוד עם מטיב.',
    departments: [
      {
        key: 'development',
        title: 'פיתוח ושיתופי פעולה',
        icon: 'Handshake',
        forWhom: 'קרנות, תורמים, גופים ציבוריים וארגונים.',
        what: 'שותפויות, תמיכה בתוכנית מסוימת ושיתופי פעולה חדשים.',
        contact: lead('חיים לנדאו'),
        links: [
          { label: 'השותפים שלנו', to: V3_ROUTES.aboutPartners },
          { label: 'תרומה למטיב', to: ROUTES.donate },
        ],
      },
    ],
  },
];

/**
 * Bodies connected to Metiv's services: who refers, who funds, who hosts.
 * `forYou` says what the connection means for a person arriving through it.
 * @type {PartnerGroup[]}
 */
export const PARTNER_GROUPS = [
  {
    key: 'public',
    title: 'גופים ציבוריים',
    intro: 'משרדי ממשלה ומוסדות ציבוריים שמטיב פועל יחד איתם, או שדרכם מגיעים לחלק מהשירותים.',
    icon: 'Landmark',
    partners: [
      {
        name: 'משרד הביטחון',
        role: collaborator('משרד הביטחון')?.role || '',
        forYou: 'מי שמוכר באגף השיקום (מחוז ירושלים) מגיע למרפאת מגדלור בהפניה מהאגף. חיילים משוחררים שנחשפו לאירועי קרב פונים למסע שחרור.',
        links: [
          { label: 'מרפאת מגדלור', to: `${ROUTES.whereToGetHelp}#migdalor` },
          { label: 'מסע שחרור', to: V3_ROUTES.releaseJourneyPro },
        ],
      },
      {
        name: 'המרכז הרפואי הרצוג',
        role: collaborator('המרכז הרפואי הרצוג')?.role || '',
        forYou: 'מרפאות מטיב פועלות בקמפוס המרכז הרפואי, בגבעת שאול בירושלים.',
      },
      {
        name: 'ביטוח לאומי, גורמי בריאות ורווחה',
        role: collaborator('ביטוח לאומי, גורמי בריאות ורווחה')?.role || '',
        forYou: 'חלק מהטיפולים במרפאת המבוגרים ממומנים על ידי גוף ציבורי. כדאי לברר בפנייה למרפאה.',
        links: [{ label: 'מרפאת המבוגרים', to: `${ROUTES.whereToGetHelp}#adults-clinic` }],
      },
      {
        name: 'משרד החינוך',
        role: collaborator('משרד החינוך')?.role || '',
      },
    ],
  },
  {
    key: 'funders',
    title: 'קרנות, פדרציות ותורמים',
    intro: 'גופים שתמכו בתוכניות של מטיב.',
    icon: 'HandHeart',
    partners: [
      {
        name: 'הפדרציה היהודית של ניו-יורק',
        role: collaborator('הפדרציה היהודית של ניו-יורק')?.role || '',
      },
      {
        name: 'הסוכנות היהודית',
        role: '[טקסט זמני] כאן יופיע תיאור של העבודה המשותפת עם הסוכנות, כולל המענים לדוברי רוסית. הפירוט ימולא על ידי מטיב.',
        placeholder: true,
      },
      {
        name: 'קרנות ותורמים נוספים',
        role: '[טקסט זמני] רשימת הקרנות והתורמים תימסר על ידי מטיב.',
        placeholder: true,
      },
    ],
  },
];

const COLLABORATION_NAMES = {
  academic: ['האוניברסיטה העברית בירושלים', 'אוניברסיטת אל-קודס', 'בית החולים הר סיני, ניו יורק', 'אוניברסיטת קולומביה', 'המרכז לבקרת מחלות ומניעתן (CDC), אטלנטה'],
  professional: ['יה"ת'],
};

/** @param {string[]} names */
const pick = (names) => names.map((n) => collaborator(n)).filter(Boolean).map((c) => ({ name: c.name, role: c.role }));

/** Professional, academic and field work done together with others. @type {PartnerGroup[]} */
export const COLLABORATION_GROUPS = [
  {
    key: 'academic',
    title: 'אקדמיה ומחקר',
    intro: 'מוסדות וחוקרים שמטיב עבד איתם במחקר, בהערכת תוכניות ובהוראה.',
    icon: 'Microscope',
    partners: pick(COLLABORATION_NAMES.academic),
  },
  {
    key: 'professional',
    title: 'ארגונים מקצועיים וקואליציות',
    intro: 'עבודה משותפת עם ארגונים בתחום הטראומה והטיפול.',
    icon: 'Network',
    partners: [
      { name: 'הקואליציה הישראלית לטראומה', role: 'מטיב יזם את הקמתה ב-2001, בתמיכת הפדרציה היהודית של ניו-יורק. הצטרפו אליה שבעה ארגונים נוספים לטיפול בטראומה, והיא כיום ארגון עצמאי.' },
      ...pick(COLLABORATION_NAMES.professional),
    ],
  },
  {
    key: 'responders',
    title: 'מגיבים ראשוניים',
    intro: 'גופים שמטיב עבד איתם לאורך השנים.',
    icon: 'Siren',
    partners: [
      { name: 'מגן דוד אדום', role: 'עבודה עם צוותי הארגון.' },
      { name: 'משטרת ישראל', role: 'עבודה עם צוותי הארגון.' },
      { name: 'הרשות הארצית לכבאות והצלה', role: 'עבודה עם צוותי הארגון.' },
    ],
  },
];

/** Where a visitor goes next from the collaborations page. */
export const COLLABORATION_CONTACT = lead('חיים לנדאו');
