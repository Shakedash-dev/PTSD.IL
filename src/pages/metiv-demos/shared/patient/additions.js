// Metiv additions to the patient area (the 8 approved suggestions in
// ../metiv/demoContent.js PATIENT_SUGGESTIONS).
//
// Every fact below is taken from ../metiv/content/*.md (scraped from metiv.org
// on 2026-09-13) or from the patient content snapshot in ./data. Wording is
// descriptive only: no efficacy claims, no ranking, the same fields for every
// provider. Where a source page does not state something, the field is left
// out rather than guessed.

import { ROUTES } from '@/pages/metiv-demos/shared/routes';

const METIV = 'https://metiv.org';

export const METIV_PHONE = '02-6449666';
export const METIV_KIDS_PHONE = '02-6294858';
export const METIV_YOUTUBE = 'https://www.youtube.com/channel/UCBKOBQp0BFFp7uX9qiwUp8w';
export const ERAN_PHONE = '1201';
export const ERAN_WHATSAPP = 'https://api.whatsapp.com/send?phone=9720528451201';

/**
 * @typedef {'phone'|'email'|'link'|'internal'|'text'} ContactKind
 * @typedef {{ kind: ContactKind, label: string, value?: string, href?: string }} Contact
 * @typedef {Object} Entry
 * @property {string} id           anchor id, unique on the page
 * @property {string} title
 * @property {string} provider     who runs it
 * @property {string} [icon]       lucide icon name
 * @property {string} [summary]
 * @property {string} [who]        who it is for
 * @property {string} [ages]
 * @property {string} [what]       what it involves
 * @property {string} [location]   location / Zoom
 * @property {string} [cost]       cost or funding, as stated by the provider
 * @property {string} [process]    how suitability / intake works
 * @property {string} [note]
 * @property {Contact[]} contacts
 * @property {string} [source]     page the facts were taken from
 */

// ── Shared contact blocks ────────────────────────────────────────────────────

/** @type {Contact} */
const METIV_PHONE_CONTACT = { kind: 'phone', label: 'טלפון', value: METIV_PHONE };

/** @type {Contact[]} */
const METIV_KIDS_FAMILY_CONTACTS = [
  { kind: 'link', label: 'טופס פנייה לתכניות למשפחות', href: 'https://tinyurl.com/metivkids' },
];

// ── 1. Where to get help: Metiv services (anchors used by the landing pages) ──

/** @type {Entry[]} */
export const METIV_SERVICES = [
  {
    id: 'adults-clinic',
    title: 'מרפאת המבוגרים של מטיב',
    provider: 'מטיב',
    icon: 'HeartHandshake',
    who: 'אנשים המתמודדים עם אירועים קשים: משברים במעגל החיים כגון פיטורין וגירושין, טראומות רפואיות ותאונות, אובדן טראומטי, תקיפה מינית, חוויות קרב ופיגועים. המרפאה מציעה גם ליווי והכוונה לבני משפחה.',
    ages: '17 ומעלה',
    location: 'ירושלים. יש גם טיפולים מקוונים בזום.',
    cost: 'הטיפול כרוך בתשלום, אלא אם קיים גורם מממן. בין הגופים הממנים: משרד הביטחון, ביטוח לאומי, גורמי בריאות ורווחה. הטיפולים אינם ממומנים על ידי קופות החולים.',
    process: 'אחרי הפנייה מוזמנים לפגישת הערכה להיכרות, להבנת הצרכים ולהתאמת מטפל/ת ותכנית טיפול. הצוות משתדל להגיב לפניות תוך 24 שעות.',
    contacts: [
      METIV_PHONE_CONTACT,
      { kind: 'link', label: 'טופס פנייה למרפאת המבוגרים', href: 'https://docs.google.com/forms/d/e/1FAIpQLSfz5ougCVnY1LFHJhyrBFrlICf2gQivumOzstI3YHor8_y0yg/viewform' },
    ],
    source: `${METIV}/מרפאת-מבוגרים/`,
  },
  {
    id: 'kids-clinic',
    title: 'מטיב ילדים - מרכז לוויסות רגשות',
    provider: 'מטיב',
    icon: 'Baby',
    who: 'ילדים שחווים קשיים בוויסות רגשי או חוו טראומה, והוריהם. טיפול פרטני, דיאדי ומשפחתי, וקבוצות פנד"ה ונמ"ל לילדים, להורים ולמשפחות.',
    ages: 'עד גיל 18, והורים',
    location: 'גבעת שאול, בניין המרפאות של המרכז הרפואי הרצוג, ירושלים',
    contacts: [
      { kind: 'phone', label: 'טלפון', value: METIV_PHONE },
      { kind: 'email', label: 'דוא"ל', value: 'Kids@metiv.org' },
      { kind: 'link', label: 'טופס פנייה למטיב ילדים', href: 'https://docs.google.com/forms/d/e/1FAIpQLSfiUHfJ4UDrpSUPQxtPKWmQuZGKg7lfL1c21D_JAsmwxlYLJA/viewform' },
    ],
    source: `${METIV}/מטיב-ילדים-טראומה/`,
  },
  {
    id: 'migdalor',
    title: 'מרפאת מגדלור',
    provider: 'מטיב והמרכז הרפואי הרצוג, עבור אגף השיקום של משרד הביטחון - מחוז ירושלים',
    icon: 'Shield',
    who: 'אנשי שירותי הביטחון המוכרים באגף השיקום ומתמודדים עם מצוקה נפשית, פוסט-טראומה, חרדה או דיכאון. המרפאה קולטת גם מטופלים שנמצאים בטיפול פרטני בקהילה.',
    location: 'בניין המרפאות, המרכז הרפואי הרצוג, גבעת שאול, ירושלים',
    cost: 'במסגרת חבילות טיפול של אגף השיקום (מעקב פסיכיאטרי, בסיסית, אינטנסיבית).',
    process: 'פונים לאגף השיקום של משרד הביטחון, והם מפנים למרפאה. הקליטה כוללת פגישת אינטייק עם עו"ס והערכה פסיכיאטרית. ייתכן שבסיום הקליטה הפונה לא ייקלט, ואז ההערכה משמשת להפניה לטיפול אחר בקהילה.',
    contacts: [
      { kind: 'link', label: 'פנייה לאגף השיקום', href: 'https://shikum.mod.gov.il/recognition/request/apply' },
    ],
    source: `${METIV}/מגדלור/`,
  },
  {
    id: 'release-journey',
    title: 'מסע שחרור',
    provider: 'מטיב',
    icon: 'Compass',
    who: 'חיילים משוחררים שנחשפו לאירועי קרב במהלך השירות הצבאי. מסעות קבוצתיים לצוותים אורגניים וטיפולים פרטניים.',
    what: 'שלושה מודלים: מסע מלא בחו"ל (4 סדנאות לאורך כתשעה חודשים, הסדנה המרכזית שבוע בחו"ל), מסע מלא בארץ (4 סדנאות לאורך כתשעה חודשים) ומסע קצר בארץ (3 סדנאות לאורך כחודשיים). את הסדנאות מנחים עובדים סוציאליים קליניים ופסיכולוגים.',
    location: 'בארץ ובחו"ל, לפי המודל',
    contacts: [
      { kind: 'link', label: 'הרשמה למסע שחרור', href: 'https://wkf.ms/4i9R9bO' },
    ],
    source: `${METIV}/מסע-שחרור/`,
  },
  {
    id: 'free-treatments',
    title: 'טיפולים ללא עלות דרך מטיב',
    provider: 'מטיב',
    icon: 'HandHeart',
    who: 'בעיקר חיילים משוחררים ומילואימניקים המתמודדים עם PTSD, ובני משפחותיהם.',
    what: 'מסגרות טיפול ללא עלות, מחקרים שמגייסים משתתפים וקבוצות למשפחות מילואים. הפירוט המלא בעמוד נפרד.',
    location: 'לפי המסגרת: בכל הארץ או בירושלים',
    cost: 'ללא עלות',
    contacts: [
      { kind: 'internal', label: 'לפירוט המסגרות', href: ROUTES.freeTreatment },
      METIV_PHONE_CONTACT,
    ],
    source: `${METIV}/טיפולים-ללא-עלות-דרך-מטיב/`,
  },
];

// ── 1. Where to get help: options already present in the patient content ────
// Only bodies, numbers and URLs that appear in the snapshot (./data).

/** @type {Entry[]} */
export const PUBLIC_OPTIONS = [
  {
    id: 'health-funds',
    title: 'קופות החולים',
    provider: 'מכבי, כללית, מאוחדת, לאומית',
    icon: 'Stethoscope',
    what: 'הקופות מספקות שירות פסיכולוגי ופסיכיאטרי.',
    process: 'פונים לרופא/ה הראשוני/ת בקופה ומבקשים הפניה לפסיכולוג/ית או לפסיכיאטר/ית.',
    contacts: [
      { kind: 'text', label: 'מכבי', value: '3555' },
      { kind: 'text', label: 'כללית (מוקד בריאות הנפש)', value: '8703*' },
      { kind: 'text', label: 'מאוחדת', value: '3833' },
      { kind: 'text', label: 'לאומית', value: '507' },
    ],
  },
  {
    id: 'resilience-centers',
    title: 'מרכזי החוסן',
    provider: 'משרד הבריאות',
    icon: 'Building2',
    who: 'נפגעי פעולות איבה.',
    process: 'פונים למרכז החוסן הקרוב לאזור המגורים, מתוך רשימת המרכזים.',
    contacts: [
      { kind: 'link', label: 'רשימת מרכזי החוסן - gov.il', href: 'https://www.gov.il/he/Departments/DynamicCollectors/resilience-centers-list?skip=0' },
      { kind: 'link', label: 'מרכזי חוסן - משרד הבריאות', href: 'https://me.health.gov.il/mental-health/therapy-rehabilitation/public-care/community-treatment/resilience-center/' },
    ],
  },
  {
    id: 'mod-rehabilitation',
    title: 'אגף השיקום',
    provider: 'משרד הביטחון',
    icon: 'Shield',
    who: 'חיילים וכוחות ביטחון שנפגעו נפשית עקב השירות.',
    cost: 'הסיוע נקבע בהתאם להכרה ולאחוזי הנכות. אפשר לקבל אישור לטיפול רפואי ונפשי כבר במהלך בירור הבקשה.',
    process: 'מגישים בקשה להכרה בנכות בטופס דיגיטלי. מרכז "בידיים טובות" מטעם אגף השיקום מסייע במילוי הבקשה.',
    contacts: [
      { kind: 'link', label: 'טופס דיגיטלי - בקשה להכרה בנכות', href: 'https://shikum.mod.gov.il/recognition/request/apply' },
      { kind: 'link', label: 'טיפול רפואי בזמן תהליך ההכרה', href: 'https://shikum.mod.gov.il/recognition/request/medical-care' },
      { kind: 'link', label: 'בידיים טובות - סיוע בהגשת הבקשה', href: 'https://shikum.mod.gov.il/ContactUs/goodhands' },
      { kind: 'internal', label: 'הזכויות בפירוט', href: ROUTES.rights },
    ],
  },
  {
    id: 'national-insurance',
    title: 'ביטוח לאומי',
    provider: 'המוסד לביטוח לאומי',
    icon: 'Landmark',
    who: 'נפגעי פעולות איבה, נפגעי עבודה, ומי שנקבעה לו נכות נפשית.',
    what: 'תגמולים והכרה, שיקום מקצועי, וסל שיקום של משרד הבריאות למי שנקבעה לו נכות נפשית של 40% לפחות.',
    contacts: [
      { kind: 'text', label: 'סיוע במילוי תביעה לנכות כללית', value: '3928*' },
      { kind: 'link', label: 'ביטוח לאומי - נכות נפשית ונכות כללית', href: 'https://www.btl.gov.il/ZcuyotAsdience/MitmoddiNefesh/Pages/NecotNafsitNecotKlalit.aspx' },
      { kind: 'link', label: 'נפגעי פעולות איבה - ביטוח לאומי', href: 'https://www.btl.gov.il/benefits/Victims_of_Hostilities/Pages/default.aspx' },
      { kind: 'internal', label: 'הזכויות בפירוט', href: ROUTES.rights },
    ],
  },
];

/** @type {Entry[]} */
export const NONPROFIT_OPTIONS = [
  {
    id: 'eran',
    title: 'ער"ן',
    provider: 'קו חירום',
    icon: 'Phone',
    what: 'קו טלפוני ווואטסאפ לשיחה במצוקה.',
    contacts: [
      { kind: 'phone', label: 'טלפון', value: ERAN_PHONE },
      { kind: 'link', label: 'WhatsApp', href: ERAN_WHATSAPP },
    ],
  },
  {
    id: 'amcha-jerusalem',
    title: 'מרכז חוסן - ירושלים (עמך)',
    provider: 'עמותת עמך',
    icon: 'Users',
    who: 'נפגעי פעולות איבה, טראומה וחרדה ומשפחותיהם.',
    what: 'טיפול פרטני, קבוצתי ומשפחתי.',
    location: 'ירושלים. בטלפון, בזום או פנים אל פנים.',
    contacts: [{ kind: 'link', label: 'אתר עמך', href: 'https://www.amcha.org/' }],
  },
  {
    id: 'natal',
    title: 'נט"ל',
    provider: 'עמותת נט"ל',
    icon: 'Users',
    who: 'נפגעי טראומה ופוסט-טראומה על רקע מלחמה וטרור ובני משפחותיהם.',
    what: 'קבוצות תמיכה וקבוצות טיפוליות, כולל קבוצות לבנות ובני זוג.',
    contacts: [{ kind: 'link', label: 'קבוצות התמיכה של נט"ל', href: 'https://www.natal.org.il/תמיכה-וטיפול-נפשי/קבוצות-טיפוליות-וקבוצות-תמיכה/' }],
  },
  {
    id: 'sexual-assault-centers',
    title: 'מרכזי הסיוע לנפגעות ולנפגעי תקיפה מינית',
    provider: 'איגוד מרכזי הסיוע',
    icon: 'Heart',
    who: 'נפגעות ונפגעי תקיפה מינית ומשפחותיהם.',
    what: 'קווי סיוע ארציים (1202 לנשים, 1203 לגברים), צ\'אט ורשת מרכזי סיוע אזוריים.',
    contacts: [
      { kind: 'phone', label: 'לנשים', value: '1202' },
      { kind: 'phone', label: 'לגברים', value: '1203' },
      { kind: 'link', label: 'אתר האיגוד', href: 'https://www.1202.org.il/' },
    ],
  },
];

// ── 8. Consultation ("לא בטוחים אם לפנות?") ──────────────────────────────────

export const CONSULTATION = {
  id: 'consultation',
  title: 'לא בטוחים אם לפנות?',
  text: 'מתלבטים אם ומתי לפנות לטיפול? אפשר להתקשר למטיב ולהתייעץ על האפשרויות.',
  phone: METIV_PHONE,
  route: `${ROUTES.whereToGetHelp}#consultation`,
  linkLabel: 'להתייעצות עם מטיב',
};

// ── 2. Free treatment and research ───────────────────────────────────────────

/** @type {Entry} */
const PANDA_FAMILY = {
  id: 'panda-family',
  title: 'פנד"ה למשפחה',
  provider: 'מטיב ילדים',
  icon: 'Users',
  who: 'מילואימניקים ובני משפחותיהם.',
  ages: 'ילדים בגילאי 0-14',
  what: 'פעילויות משפחתיות לפיתוח דרכי התמודדות ויכולות ויסות: 6 מפגשי הדרכה להורים ו-6 מפגשים משפחתיים.',
  location: 'בבית או במטיב',
  cost: 'ללא עלות',
  contacts: METIV_KIDS_FAMILY_CONTACTS,
  source: `${METIV}/טיפולים-ללא-עלות-דרך-מטיב/`,
};

/** @type {Entry} */
const NAMAL_FAMILY = {
  id: 'namal-family',
  title: 'נמ"ל למשפחה - נעשה מקום למשחק',
  provider: 'מטיב ילדים',
  icon: 'Baby',
  who: 'מילואימניקים ובני משפחותיהם. בין הקבוצות: קבוצה להורים שחזרו מהמילואים יחד עם ילדם, במימון משרד הביטחון.',
  ages: 'הורים לילדים בגילאי 2-4',
  what: 'מפגשים קבוצתיים עם פעילויות משותפות להורים ולילדים.',
  cost: 'ללא עלות',
  contacts: METIV_KIDS_FAMILY_CONTACTS,
  source: `${METIV}/טיפולים-ללא-עלות-דרך-מטיב/`,
};

/** @type {Entry} */
const KIDS_SPACE = {
  id: 'kids-space',
  title: 'מרחב מטיב לילדים',
  provider: 'מטיב ילדים',
  icon: 'Sparkles',
  who: 'הורים שמתלבטים אם הילד זקוק לטיפול, שממתינים לתור לטיפול, או שיש להם שאלות על הילד.',
  ages: 'הורים לילדים בגילאי 0-9',
  what: 'מפגש משחק חד-פעמי של הורה וילד, עם אנשי מקצוע בתחום הטראומה אצל ילדים שאפשר לשאול אותם שאלות. זה אינו טיפול ואינו אבחון.',
  location: 'מטיב ילדים, גבעת שאול, המרכז הרפואי הרצוג, קומה -1, ירושלים. ימי שלישי אחר הצהריים וימי רביעי בבוקר, בהרשמה מראש.',
  cost: 'ללא עלות',
  process: 'ממלאים שאלון קצר, ואחריו מוצעת שיחה או מפגש היכרות.',
  contacts: [
    { kind: 'link', label: 'הרשמה למועדים הקרובים', href: 'https://www.surveyhero.com/c/merhav1' },
    { kind: 'email', label: 'דוא"ל', value: 'panda@metiv.org' },
    { kind: 'phone', label: 'טלפון', value: METIV_KIDS_PHONE },
  ],
  source: `${METIV}/מרחב-מטיב-ילדים/`,
};

/** @type {Entry[]} */
export const FREE_TREATMENTS = [
  {
    id: 'military-ptsd-treatment',
    title: 'טיפול ללא עלות למתמודדים עם PTSD מהשירות הצבאי',
    provider: 'מטיב',
    icon: 'HandHeart',
    who: 'חיילים משוחררים (לא בשירות סדיר) המתמודדים עם PTSD מהשירות הצבאי.',
    what: 'טיפול באחת משתי שיטות, חוויה סומטית (SE) או חשיפה ממושכת (PE), על ידי מטפלים מוסמכים. המסגרת כוללת מילוי שאלונים, הערכות קליניות וליווי של מטיב, והנתונים משמשים למחקר קליני.',
    location: 'בכל הארץ',
    cost: 'ללא עלות',
    contacts: [
      { kind: 'email', label: 'דוא"ל', value: 'shir@metiv.org' },
      { kind: 'text', label: 'וואטסאפ', value: '02-5952240' },
    ],
    source: `${METIV}/טיפולים-ללא-עלות-דרך-מטיב/`,
  },
  KIDS_SPACE,
];

/** @type {Entry[]} */
export const RESEARCH_STUDIES = [
  {
    id: 'sea-it-mdma',
    title: 'מחקר SEA-IT / MDMA',
    provider: 'מטיב, בפיקוח פרופ\' פנחס דנון, ראש הפסיכיאטריה במרכז הרפואי הרצוג',
    icon: 'FlaskConical',
    who: 'מתמודדים עם PTSD על רקע צבאי שהשתתפו בעבר בטיפול ממוקד טראומה והתסמינים נמשכים, ושיכולים להתחייב לתהליך אינטנסיבי של כ-3.5 חודשים.',
    what: 'מחקר קליני שמשווה בין שני טיפולים: תרפיה בליווי MDMA, שמשלבת נטילה של החומר עם פסיכותרפיה, ו-SEA-IT, תרפיה אינטנסיבית ממוקדת גוף, חוויה וקבלה. 16 מפגשים לאורך 3-3.5 חודשים.',
    location: 'ירושלים',
    process: 'ממלאים שאלון התאמה מקוון. ההתאמה למחקר נקבעת בתהליך אבחון, ואין אפשרות לבחור בין שני הטיפולים.',
    note: 'זהו מחקר: מטרתו לבחון את שני הטיפולים. השתתפות אינה מבטיחה תוצאה.',
    contacts: [
      { kind: 'link', label: 'שאלון התאמה', href: 'https://www.surveyhero.com/c/jzkapqr4' },
      { kind: 'link', label: 'מכתב הסבר על SEA-IT (PDF)', href: 'https://metiv.org/wp-content/uploads/2025/07/מכתב-הסבר-SEA-IT.pdf' },
      { kind: 'email', label: 'דוא"ל', value: 'moriya@metiv.org' },
      { kind: 'text', label: 'וואטסאפ', value: '02-6264889' },
    ],
    source: `${METIV}/sea-it-mdma/`,
  },
  {
    id: 'return-to-combat-study',
    title: 'מחקר ראיונות: חזרה ללחימה',
    provider: 'מטיב',
    icon: 'MessageCircle',
    who: 'לוחמים שהתמודדו עם פוסט-טראומה צבאית עוד לפני מלחמת חרבות ברזל והשתתפו במלחמה.',
    what: 'ראיון פתוח על החוויה של חזרה ללחימה.',
    contacts: [
      { kind: 'email', label: 'דוא"ל', value: 'shir@metiv.org' },
      { kind: 'text', label: 'וואטסאפ', value: '02-5952240' },
    ],
    source: `${METIV}/טיפולים-ללא-עלות-דרך-מטיב/`,
  },
];

/** @type {Entry[]} */
export const RESERVIST_FAMILY_PROGRAMS = [PANDA_FAMILY, NAMAL_FAMILY];

// ── 3. Community: veterans and reservists ───────────────────────────────────

/** @type {Entry[]} */
export const VETERANS_PROGRAMS = [
  METIV_SERVICES[3],
  PANDA_FAMILY,
  NAMAL_FAMILY,
  {
    id: 'reservist-fathers',
    title: 'קבוצה דיאדית לאנשי מילואים וילדיהם',
    provider: 'מטיב',
    icon: 'Users',
    who: 'אנשי מילואים יחד עם ילדיהם.',
    process: 'ההרשמה בטופס באתר מטיב, מוגבלת ל-8 משתתפים וכוללת שלב תשלום.',
    contacts: [{ kind: 'link', label: 'לטופס ההרשמה', href: `${METIV}/אבות-וילדים-מילואים/` }],
    source: `${METIV}/אבות-וילדים-מילואים/`,
  },
];

// ── 4. Children: parent and child groups ─────────────────────────────────────

/** @type {Entry[]} */
export const PARENT_CHILD_GROUPS = [
  {
    id: 'panda-groups',
    title: 'פנד"ה - פה נלמד דרכי התמודדות',
    provider: 'מטיב ילדים',
    icon: 'Users',
    who: 'פנד"ה לילדים: ילדים בכיתות ב\'-ו\' שמתקשים בוויסות רגשות על רקע עומס רגשי, קשיי קשב, חרדה או קושי חברתי. פנד"ה להורים (מיומנויות DBT): הורים לילדים בכל הגילאים. פנד"ה במשפחה: משפחות עם לפחות 2 ילדים.',
    ages: 'ילדים בגילאי 7-12, והורים',
    what: 'תכנית קבוצתית לחיזוק ויסות רגשות ולפיתוח דרכי התמודדות, שמשלבת טכניקות קשיבות וטכניקות קוגניטיביות-התנהגותיות עם משחק. פנד"ה לילדים: 8 מפגשים לילדים ו-3 מפגשים להורים. פנד"ה להורים: 8 מפגשים (או 6). פנד"ה במשפחה: בדרך כלל 6 פגישות משפחה ו-6 פגישות הדרכה להורים.',
    location: 'מטיב ילדים, ירושלים',
    process: 'ממלאים שאלון ובקשה להשתתפות, מקיימים שיחת היכרות עם מנחה, ומשובצים לקבוצה לפי הגיל.',
    contacts: [
      { kind: 'link', label: 'טופס פנייה למטיב ילדים', href: 'https://docs.google.com/forms/d/e/1FAIpQLSfiUHfJ4UDrpSUPQxtPKWmQuZGKg7lfL1c21D_JAsmwxlYLJA/viewform' },
      { kind: 'email', label: 'דוא"ל', value: 'Kids@metiv.org' },
    ],
    source: `${METIV}/תכנית-פנדה-לילדים/`,
  },
  {
    id: 'namal-groups',
    title: 'נמ"ל - נעשה מקום למשחק',
    provider: 'מטיב ילדים',
    icon: 'Baby',
    who: 'צמדי הורה-פעוט החשופים למצבי לחץ, משבר או טראומה, וגם צמדים המתמודדים עם קשיים שמאפיינים את הגיל.',
    ages: 'פעוטות בגילאי 2-5 והוריהם',
    what: 'קבוצת משחק להורים ולפעוטות עם פעילויות משחק, מוזיקה, אמנות, דרמה ותנועה, ומפגשים להורים בלבד. 8 מפגשים, אחת לשבוע בין 16:30 ל-18:00.',
    location: 'מטיב ילדים, גבעת שאול, בניין המרפאות של המרכז הרפואי הרצוג, ירושלים',
    contacts: [
      { kind: 'link', label: 'טופס הרשמה', href: 'https://www.surveyhero.com/c/kybdaa97' },
      { kind: 'phone', label: 'אפרת, רכזת התכנית', value: '054-2189188' },
      { kind: 'email', label: 'דוא"ל', value: 'efrath@metiv.org' },
    ],
    source: `${METIV}/תוכנית-נמל/`,
  },
  KIDS_SPACE,
];

// ── 6. Sources: books by Metiv staff ─────────────────────────────────────────

/**
 * @typedef {{ title: string, authors: string, year: string, publisher: string, language: string, url: string }} MetivBook
 * @type {MetivBook[]}
 */
export const METIV_BOOKS = [
  {
    title: 'Helping Children Cope With Trauma: Individual, Family, and Community Perspectives',
    authors: 'Ruth Pat-Horenczyk, Danny Brom, Juliet M. Vogel (עורכים)',
    year: '2013',
    publisher: 'Routledge',
    language: 'אנגלית',
    url: 'http://www.amazon.com/gp/product/0415504562/',
  },
  {
    title: 'Treating Traumatized Children: Risk, Resilience and Recovery',
    authors: 'Danny Brom, Ruth Pat-Horenczyk, Julian Ford (עורכים)',
    year: '2008',
    publisher: 'Routledge',
    language: 'אנגלית',
    url: 'http://www.amazon.com/gp/product/B001OLRO08/',
  },
  {
    title: 'The Trauma of Terrorism: Sharing Knowledge and Shared Care, An International Handbook',
    authors: 'Yael Danieli, Danny Brom, Joe Sills (עורכים)',
    year: '2005',
    publisher: 'Routledge',
    language: 'אנגלית',
    url: 'http://www.amazon.com/gp/product/0789027739/',
  },
  {
    title: 'Coping with Trauma: Theory, Prevention and Treatment',
    authors: 'Rolf J. Kleber, Danny Brom, Peter B. Defares',
    year: '2003',
    publisher: 'Routledge',
    language: 'אנגלית',
    url: 'http://www.amazon.com/gp/product/B00ZLVJDII/',
  },
];

export const METIV_BOOKS_ORDER_NOTE = 'להזמנה בישראל אפשר לכתוב למטיב: info@metiv.org';

// ── 7. Self help: video lectures ─────────────────────────────────────────────

export const VIDEO_LECTURES = {
  id: 'video-lectures',
  title: 'הרצאות וידאו',
  text: 'הרצאות מצולמות של אנשי מטיב מתפרסמות בערוץ היוטיוב של מטיב.',
  linkLabel: 'לערוץ היוטיוב של מטיב',
  url: METIV_YOUTUBE,
};

// ── 8b. Treatment page: link to the directory ────────────────────────────────

export const TREATMENT_WHERE_BLOCK = {
  title: 'איפה אפשר לקבל טיפול',
  text: 'רשימה של מסגרות שבהן ניתן טיפול: קופות החולים, מרכזי החוסן, אגף השיקום, עמותות ומרפאות מטיב, עם פרטי פנייה לכל אחת.',
  linkLabel: 'לרשימת המסגרות',
  route: ROUTES.whereToGetHelp,
};

/** Section anchors the additions add to existing pages. */
export const ADDITION_ANCHORS = {
  veterans: 'veterans',
  parentChildGroups: 'parent-child-groups',
  reservistFamilies: 'reservist-families',
  metivBooks: 'metiv-books',
  videoLectures: VIDEO_LECTURES.id,
  consultation: CONSULTATION.id,
};
