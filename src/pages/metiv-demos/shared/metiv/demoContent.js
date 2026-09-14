// Content registry for the Metiv merge demo (/metiv-site-demo).
//
// DEMO ONLY. This is a static snapshot of metiv.org, scraped on 2026-09-13, so
// the demo can be reviewed without touching the content API. It deliberately
// breaks the "content comes from the API" rule in AGENTS.md; a real build would
// move these pages into article rows editable from /admin.
//
// The Markdown files under ./content are the Metiv pages as they are, with only
// scrape artifacts removed (images, contact forms, icon glyphs, counters).
// Titles and one-line summaries below are ours, written as neutral descriptions.

/** @type {Record<string, string>} */
const RAW = import.meta.glob('./content/*.md', { query: '?raw', import: 'default', eager: true });

export const DEMO_BASE = '/metiv-site-demo';

/** @param {string} slug */
export function pageMarkdown(slug) {
  return RAW[`./content/${slug}.md`] || null;
}

const METIV = 'https://metiv.org';

/**
 * @typedef {{ title: string, summary: string, source: string, facts?: string[] }} DemoPage
 * @type {Record<string, DemoPage>}
 */
export const PAGES = {
  // ── Therapist area (C) ──
  'cbt-trauma': {
    title: 'הכשרה לטיפול CBT בטראומה',
    summary: 'תכנית דו-שנתית: שנה ראשונה טראומה פשוטה, שנה שנייה טראומה מורכבת.',
    facts: ['212 שעות אקדמיות', 'ימי רביעי', 'ירושלים'],
    source: `${METIV}/קורס-cbt-לטראומה/`,
  },
  roadmap: {
    title: 'מפת הדרכים לטיפול בטראומה',
    summary: 'קורס בסיס למטפלים על עקרונות הטיפול בטראומה. פרונטלי ובזום.',
    source: `${METIV}/מפת-הדרכים-קורס-למטפלים-בטראומה/`,
  },
  'complex-trauma': {
    title: 'אבני היסוד לטיפול בטראומה מורכבת',
    summary: 'קורס של 6 מפגשים על טראומה מורכבת.',
    facts: ['6 מפגשים'],
    source: `${METIV}/טראומה-מורכבת-קורס/`,
  },
  kaleidoscope: {
    title: 'קליידוסקופ - ימי השתלמות',
    summary: 'יחידות לימוד חודשיות שעומדות כל אחת בפני עצמה, לפי נושא.',
    source: `${METIV}/kaleidoscope-course/`,
  },
  'skills-day': {
    title: 'יום תרגול מיומנויות',
    summary: 'יום מעשי לתרגול מיומנויות טיפול בטראומה.',
    source: `${METIV}/תרגול-מיומנויות/`,
  },
  'annual-program': {
    title: 'התכנית השנתית',
    summary: 'מבט כולל על ההכשרות של השנה ומידע כללי להרשמה.',
    source: `${METIV}/מידע-כללי-טראומה/`,
  },
  'summer-course': {
    title: 'קורס קיץ בינלאומי',
    summary: 'קורס באנגלית בשיתוף האוניברסיטה העברית.',
    facts: ['64 שעות אקדמיות', '4 נקודות זכות'],
    source: `${METIV}/קורס-קיץ-בינלאומי/`,
  },
  'kids-trauma-basics': {
    title: 'יסודות הטיפול בטראומה בילדים',
    summary: 'קורס מרוכז על זיהוי וטיפול בטראומה אצל ילדים.',
    facts: ['16 שעות אקדמיות'],
    source: `${METIV}/הכשרה-למטפלים-פנדה-יסודי-2/`,
  },
  'panda-training': {
    title: 'הכשרת פנד"ה למטפלים - גילאי יסודי',
    summary: 'הכשרה להנחיית קבוצות ויסות רגשי לילדים.',
    facts: ['30 שעות אקדמיות'],
    source: `${METIV}/הכשרה-למטפלים-פנדה-יסודי/`,
  },
  'panda-parents-training': {
    title: 'הכשרת פנד"ה הורים',
    summary: 'הכשרה להנחיית קבוצות הורים.',
    source: `${METIV}/הכשרה-למטפלים-פנדה-הורים/`,
  },
  'panda-two-training': {
    title: 'הכשרת פנד"ה בשניים',
    summary: 'הכשרה לעבודה דיאדית הורה-ילד.',
    source: `${METIV}/הכשרה-למטפלים-פנדה-בשניים/`,
  },
  'panda-arts-training': {
    title: 'הכשרת פנד"ה למטפלים באמנויות',
    summary: 'הכשרה ייעודית בשיתוף יה"ת.',
    source: `${METIV}/הכשרת-פנדה-ייעודית-למטפלים-באמנויות-כ/`,
  },
  'namal-training': {
    title: 'הכשרת נמ"ל למטפלים',
    summary: 'הכשרה להנחיית קבוצות הורים ופעוטות.',
    source: `${METIV}/הכשרת-נמל-למטפלים/`,
  },
  'org-trainings': {
    title: 'הכשרות לארגונים',
    summary: 'הכשרות מותאמות לצוותים וארגונים.',
    source: `${METIV}/הכשרות-לארגונים/`,
  },
  'metiv-space-orgs': {
    title: 'מרחב מטיב',
    summary: 'ליווי ארגונים בבניית עבודה מותאמת טראומה.',
    source: `${METIV}/מרחב-מטיב/`,
  },
  'trauma-informed-org': {
    title: 'בניית ארגון מותאם טראומה',
    summary: 'יום עיון לארגונים.',
    source: `${METIV}/בניית-ארגון-מותאם-טראומה/`,
  },
  'custom-workshops': {
    title: 'סדנאות והכשרות בהתאמה אישית',
    summary: 'סדנאות שנבנות לפי צורך הארגון.',
    source: `${METIV}/סדנאות-והכשרות-בהתאמה-אישית/`,
  },
  supervision: {
    title: 'הדרכות למטפלים וארגונים',
    summary: 'הדרכה פרטנית וקבוצתית למטפלים בטראומה.',
    source: `${METIV}/הדרכות/`,
  },
  'active-research': {
    title: 'מחקרים פעילים',
    summary: 'המחקרים שמתנהלים כעת ביחידת המחקר.',
    source: `${METIV}/מחקרים-פעילים-טראומה/`,
  },
  'past-research': {
    title: 'מחקרי עבר ופרסומים',
    summary: 'ספרים ומאמרים שפרסמו אנשי מטיב.',
    source: `${METIV}/מחקרי-עבר-ופרסומים/`,
  },
  papers: {
    title: 'מאמרים ונתונים',
    summary: 'מאמרים אחרונים להורדה.',
    source: `${METIV}/מאמרים-ונתונים/`,
  },
  'dancing-with-protocol': {
    title: 'לרקוד עם פרוטוקול',
    summary: 'מאמר דעה על מקומם של פרוטוקולים בטיפול בטראומה.',
    source: `${METIV}/לרקוד-עם-פרוטוקול/`,
  },
  'conference-news': {
    title: 'כנס למטפלים לרגל שנה למלחמה',
    summary: 'כנס של הקשבה ושיתוף לאנשי טיפול.',
    source: `${METIV}/news/כנס-למטפלים-לרגל-שנה-למלחמה/`,
  },

  // ── Metiv services (shown from the landing page) ──
  'adults-clinic': {
    title: 'מרפאת המבוגרים',
    summary: 'מרפאה בירושלים לפונים מגיל 17. גם בזום.',
    source: `${METIV}/מרפאת-מבוגרים/`,
  },
  migdalor: {
    title: 'מרפאת מגדלור',
    summary: 'מרפאה שפועלת עבור אגף השיקום במשרד הביטחון.',
    source: `${METIV}/מגדלור/`,
  },
  'kids-clinic': {
    title: 'מטיב ילדים',
    summary: 'מרכז לויסות רגשות לילדים עד גיל 18 ולהורים.',
    source: `${METIV}/מטיב-ילדים-טראומה/`,
  },
  'free-treatments': {
    title: 'טיפולים ללא עלות',
    summary: 'מסגרות טיפול ומחקר ללא עלות, בעיקר לחיילים משוחררים ומשפחות מילואים.',
    source: `${METIV}/טיפולים-ללא-עלות-דרך-מטיב/`,
  },
  'release-journey': {
    title: 'מסע שחרור',
    summary: 'תכנית קבוצתית לחיילים משוחררים שנחשפו לאירועי לחימה.',
    source: `${METIV}/מסע-שחרור/`,
  },
  'sea-it-mdma': {
    title: 'מחקר SEA-IT / MDMA',
    summary: 'גיוס משתתפים למחקר קליני. ההתאמה נקבעת בתהליך אבחון.',
    source: `${METIV}/sea-it-mdma/`,
  },
  'namal-program': {
    title: 'תכנית נמ"ל',
    summary: 'קבוצת משחק להורים ופעוטות בגילאי 2-4.',
    source: `${METIV}/תוכנית-נמל/`,
  },
  'kids-space': {
    title: 'מרחב מטיב לילדים',
    summary: 'מפגש משחק חד-פעמי להורים לילדים בגילאי 0-9.',
    source: `${METIV}/מרחב-מטיב-ילדים/`,
  },
  'panda-kids': {
    title: 'תכנית פנד"ה לילדים',
    summary: 'קבוצות ויסות רגשי לילדים, הורים ומשפחות.',
    source: `${METIV}/תכנית-פנדה-לילדים/`,
  },
  'reservist-fathers': {
    title: 'אבות וילדים - מילואים',
    summary: 'קבוצות לאבות במילואים ולילדיהם.',
    source: `${METIV}/אבות-וילדים-מילואים/`,
  },

  // ── Organisation ──
  about: {
    title: 'אודות מטיב',
    summary: 'חזון, היסטוריה ופעילות.',
    source: `${METIV}/אודות/`,
  },
};

/** Area C, grouped the way a therapist looks for things. */
export const THERAPIST_GROUPS = [
  {
    key: 'adult-courses',
    title: 'קורסים והכשרות',
    description: 'הכשרות בטיפול בטראומה במבוגרים.',
    icon: 'GraduationCap',
    slugs: ['cbt-trauma', 'roadmap', 'complex-trauma', 'kaleidoscope', 'skills-day', 'summer-course', 'annual-program'],
  },
  {
    key: 'child-courses',
    title: 'הכשרות בתחום הילדים והמשפחה',
    description: 'פנד"ה, נמ"ל ויסודות הטיפול בטראומה בילדים.',
    icon: 'Baby',
    slugs: ['kids-trauma-basics', 'panda-training', 'panda-parents-training', 'panda-two-training', 'panda-arts-training', 'namal-training'],
  },
  {
    key: 'supervision',
    title: 'הדרכה',
    description: 'הדרכה פרטנית וקבוצתית.',
    icon: 'Users',
    slugs: ['supervision'],
  },
  {
    key: 'organizations',
    title: 'לארגונים',
    description: 'הכשרה וליווי לצוותים וארגונים.',
    icon: 'Building2',
    slugs: ['org-trainings', 'metiv-space-orgs', 'trauma-informed-org', 'custom-workshops'],
  },
  {
    key: 'research',
    title: 'מחקר ופרסומים',
    description: 'מחקרים פעילים, ספרים ומאמרים.',
    icon: 'Microscope',
    slugs: ['active-research', 'past-research', 'papers', 'dancing-with-protocol'],
  },
];

/** Metiv's own treatment services, listed on the landing page. */
export const SERVICE_SLUGS = [
  { slug: 'adults-clinic', icon: 'HeartHandshake' },
  { slug: 'kids-clinic', icon: 'Baby' },
  { slug: 'migdalor', icon: 'Shield' },
  { slug: 'release-journey', icon: 'Compass' },
  { slug: 'free-treatments', icon: 'HandHeart' },
];

/** Secondary service pages, reachable from the kids clinic and free-treatment cards. */
export const MORE_SERVICE_SLUGS = ['panda-kids', 'namal-program', 'kids-space', 'reservist-fathers', 'sea-it-mdma'];

export const NEWS = [
  {
    title: 'כנס מיוחד למטפלים לרגל שנה למלחמה',
    text: 'מטיב מזמין אנשי טיפול לכנס של הקשבה ושיתוף בחלוף שנה למלחמה.',
    to: `${DEMO_BASE}/therapist/conference-news`,
  },
  {
    title: 'מחזור חדש לקורס "יסודות הטיפול בטראומה בילדים"',
    text: 'קורס מרוכז של ארבעה ימים, המעניק תשתית תיאורטית ומעשית כאחד לזיהוי וטיפול בטראומה אצל ילדים.',
    to: `${DEMO_BASE}/therapist/kids-trauma-basics`,
  },
  {
    title: 'טיפול ללא עלות לחיילים משוחררים המתמודדים עם פוסט-טראומה',
    text: 'חיילים משוחררים שמתמודדים עם טראומה מהשירות הצבאי יכולים לפנות לבירור התאמה למסגרת טיפול במחקר.',
    to: `${DEMO_BASE}/services/free-treatments`,
  },
];

// Organisations named on metiv.org under "גופים שכבר בחרו להתמקצע אצלנו".
export const PARTNERS = [
  'כללית', 'לאומית', 'אנוש', 'משרד האוצר', 'משרד הביטחון', 'משרד ראש הממשלה',
  'שערי צדק', 'מכון פוירשטיין', 'משרד החינוך - מחוז צפון', 'עמותת משעולים', 'קידום נוער',
];

export const ORG = {
  name: 'מטיב - המרכז הישראלי לטיפול בפסיכוטראומה',
  tagline: 'אחרי טראומה',
  headline: 'אנשים זקוקים לאנשים',
  vision: 'חברה שנותנת מקום לטראומה נפשית, דואגת לסובלים ממנה ומחויבת להעצמתם.',
  mission:
    'המטרה שלנו היא לספק שירות איכותי, אנושי ואכפתי לקהילות וליחידים לפני, במהלך ואחרי טראומה. להפיץ את הידע המקיף שלנו בנושא טראומה נפשית באמצעות מחקר אקדמי והכשרות על מנת שאחרים יוכלו להטמיע את הידע הזה בקהילותיהם.',
  entity: 'ע"ר 580313926',
  address: 'גבעת שאול, המרכז הרפואי הרצוג, ירושלים',
  mail: 'ת.ד. 3900, ירושלים 91035',
  phone: '02-6449666',
  kidsPhone: '02-6294858',
  email: 'info@metiv.org',
  facebook: 'https://www.facebook.com/metivtraumacenter',
  youtube: 'https://www.youtube.com/channel/UCBKOBQp0BFFp7uX9qiwUp8w',
  // The only donation link on metiv.org, found on the English pages.
  donate: 'https://www.jgive.com/new/en/ils/charity-organizations/1179',
  trainingsForm: 'https://docs.google.com/forms/d/e/1FAIpQLScc90IWpEglRpTtKqwmeBToTCGXeZpZXwvcjE6UHaLR4YKxuw/viewform',
};

// Facts stated on metiv.org, shown as plain numbers. Counts, not outcomes.
export const FACTS = [
  { value: '1989', label: 'שנת ההקמה' },
  { value: '+2,000', label: 'מטפלים שהוכשרו' },
  { value: '+5,000', label: 'מורים בתכנית החוסן לבתי ספר' },
  { value: '~300', label: 'פונים בשנה למרפאת המבוגרים' },
];

/**
 * Suggestions for area B (the PTSD-IL site). Each one names where it would sit
 * in the existing site and which Metiv pages it draws from. Nothing here exists
 * on the live site yet.
 */
export const PATIENT_SUGGESTIONS = [
  {
    title: 'איפה אפשר לקבל טיפול',
    icon: 'MapPin',
    where: '/treatment',
    whereLabel: 'מסע הטיפול',
    what: 'רשימה ניטרלית של מסגרות טיפול בטראומה, עם מרפאות מטיב (מבוגרים, ילדים, מגדלור) כאפשרות אחת מתוך כמה. כולל פרטי קשר, גילאים, עלות וזום.',
    sources: ['adults-clinic', 'kids-clinic', 'migdalor'],
    note: 'כדי לשמור על ניטרליות: אותו פורמט לכל הגופים, בלי דירוג ובלי ניסוחי "מוביל".',
  },
  {
    title: 'טיפולים ללא עלות והשתתפות במחקרים',
    icon: 'HandHeart',
    where: '/rights',
    whereLabel: 'זכויות',
    what: 'עמוד שמרכז מסגרות טיפול ללא עלות ומחקרים קליניים שמגייסים משתתפים: למי מתאים, מה כולל, איך פונים.',
    sources: ['free-treatments', 'sea-it-mdma'],
    note: 'הטקסט המקורי כולל ציפייה ליעילות (MDMA). צריך ניסוח תיאורי בלבד ובדיקה של איש מקצוע.',
  },
  {
    title: 'חיילים משוחררים ומילואימניקים',
    icon: 'Compass',
    where: '/community',
    whereLabel: 'קהילות תמיכה',
    what: 'מסע שחרור, קבוצות למשפחות מילואים וקבוצות אבות וילדים, כחלק מרשימת הקבוצות והתכניות.',
    sources: ['release-journey', 'reservist-fathers', 'free-treatments'],
  },
  {
    title: 'הורים וילדים: קבוצות ויסות רגשי',
    icon: 'Baby',
    where: '/children',
    whereLabel: 'ילדים',
    what: 'תיאור של פנד"ה ונמ"ל ושל מפגש המשחק ללא עלות, כמסגרות שהורים יכולים לפנות אליהן.',
    sources: ['panda-kids', 'namal-program', 'kids-space'],
  },
  {
    title: 'בני משפחה של מילואימניקים',
    icon: 'Users',
    where: '/second-circle-tools',
    whereLabel: 'כלים למעגל השני',
    what: 'פנד"ה למשפחה ונמ"ל למשפחה כמענה לבני זוג והורים במעגל השני.',
    sources: ['free-treatments', 'panda-kids'],
  },
  {
    title: 'ספרים של אנשי מטיב לקהל הרחב',
    icon: 'Library',
    where: '/sources',
    whereLabel: 'מקורות',
    what: 'הוספת הספרים שכתבו אנשי מטיב (למשל Coping with Trauma) לרשימת הספרים הקיימת.',
    sources: ['past-research'],
    note: 'רק ספרים שמיועדים לקהל הרחב. מאמרים מקצועיים שייכים לאזור המטפלים.',
  },
  {
    title: 'הרצאות וידאו פתוחות',
    icon: 'Youtube',
    where: '/self-help',
    whereLabel: 'עזרה עצמית',
    what: 'מבחר מסונן מערוץ היוטיוב של מטיב, רק הרצאות שמיועדות לציבור ולא למטפלים.',
    sources: [],
    note: 'דורש מעבר ידני על הערוץ ובחירה של איש מקצוע.',
  },
  {
    title: '"לא בטוחים אם לפנות?" - שיחת התייעצות',
    icon: 'MessageCircle',
    where: '/questionnaire',
    whereLabel: 'השאלון',
    what: 'מטיב מציעה ייעוץ למי שמתלבט אם ומתי לפנות. אפשר להציג את זה כאפשרות בסוף השאלון, לצד קווי החירום הקיימים.',
    sources: ['free-treatments', 'adults-clinic'],
    note: 'רשימת "סימנים שכדאי לפנות" של מרפאת המבוגרים קרובה לאבחון. לא להעתיק בלי בדיקה מקצועית.',
  },
];
