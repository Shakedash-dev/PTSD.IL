// Which page-copy keys (scripts/metiv-seed/copy/<namespace>.json) the Metiv
// admin lets an editor change, with the Hebrew name the editor sees.
//
// Rule (owner, 2026-10-29): only the content itself is editable - the
// information the site presents: an intro, a description, a note, a
// disclaimer, the descriptive sentence under a page's h1 (its subtitle) and a
// sentence that states facts about Metiv. Everything else is UI and stays as
// shipped: page h1s and section headings, eyebrows, nav and breadcrumb labels,
// button, link and CTA labels and the captions of link cards, field labels,
// badges and status labels, aria/alt/sr-only text, placeholders, empty and
// error states, count and format templates ("{count} ..."), sentence
// fragments around a link, crisis-line labels (sanctuaryCrisisLine,
// eranCall...), and texts that explain how the page works ("אפשר לסנן לפי
// סוג", "בוחרים גיל, והמודלים נשארים"). When in doubt it is UI.
//
// A namespace that is not listed has no editable key. src/test/admin-metiv-
// sitemap.test.js checks every key here exists in the seed copy files.

/** @type {Record<string, Record<string, string>>} */
export const COPY_CONTENT_KEYS = {
  about: {
    moreAboutHistory: 'תיאור הכרטיס "הסיפור של מטיב"',
    moreAboutTeam: 'תיאור הכרטיס "הצוות"',
    moreAboutPartners: 'תיאור הכרטיס "השותפים שלנו"',
    moreAboutCollaborations: 'תיאור הכרטיס "שיתופי פעולה"',
  },
  aboutCollaborations: {
    subtitle: 'המשפט שמתחת לכותרת העמוד',
    orgsIntro: 'פתיחה: ארגונים שקיבלו הכשרה',
    contactText: 'טקסט "רוצים לעבוד יחד?"',
  },
  aboutHistory: {
    subtitle: 'המשפט שמתחת לכותרת העמוד',
  },
  aboutPartners: {
    subtitle: 'המשפט שמתחת לכותרת העמוד',
    joinText: 'טקסט "רוצים לתמוך?"',
  },
  accessibility: {
    short2: 'תיבת "בקצרה": למי פונים כשמשהו לא עובד',
  },
  articles: {
    subtitle: 'המשפט שמתחת לכותרת העמוד',
    moreSoon: 'הערה: מאמרים נוספים יתווספו',
  },
  childrenFamily: {
    subtitle: 'המשפט שמתחת לכותרת העמוד',
    shortTrainings: 'תיבת "בקצרה": הכשרות',
    shortInterest: 'תיבת "בקצרה": רישום התעניינות',
  },
  contact: {
    topicAdultsText: 'נושא "טיפול למבוגרים": תיאור',
    topicKidsText: 'נושא "טיפול בילדים ובהורים": תיאור',
    topicCoursesText: 'נושא "קורסים והכשרות": תיאור',
    topicResearchText: 'נושא "מחקר": תיאור',
    topicGeneralText: 'נושא "משהו אחר": תיאור',
  },
  courseDetail: {
    audienceInContact: 'הערה כשקהל היעד לא מפורט',
    registerOpenText: 'הרשמה פתוחה: הסבר',
    registerClosedText: 'מחזור שהסתיים: הסבר',
  },
  courses: {
    subtitle: 'המשפט שמתחת לכותרת העמוד',
    pastIntro: 'פתיחה: קורסים שהתקיימו',
    moreSupervisionText: 'כרטיס "הדרכה": תיאור',
    moreKidsText: 'כרטיס "ילדים ומשפחה": תיאור',
    moreOrgText: 'כרטיס "לארגונים": תיאור',
  },
  donate: {
    short1: 'תיבת "בקצרה": שורה 1',
  },
  events: {
    subtitle: 'המשפט שמתחת לכותרת העמוד',
  },
  landing: {
    intro: 'פתיחה בראש העמוד',
    patientText: 'כרטיס אזור המטופלים: תיאור',
    therapistText: 'כרטיס אזור אנשי המקצוע: תיאור',
    servicesIntro: 'פתיחה לשירותים הטיפוליים',
  },
  organizations: {
    subtitle: 'המשפט שמתחת לכותרת העמוד',
    shortPrograms: 'תיבת "בקצרה": התוכניות',
    shortTailored: 'תיבת "בקצרה": התאמה לארגון',
    clientsIntro: 'פתיחה: ארגונים שעבדו עם מטיב',
  },
  patientChildren: {
    groupsIntro: 'פתיחה: קבוצות להורים וילדים',
  },
  patientCommunity: {
    veteransIntro: 'פתיחה: חיילים משוחררים ומילואימניקים',
  },
  patientFreeTreatment: {
    subtitle: 'המשפט שמתחת לכותרת העמוד',
    researchNote: 'הערה על השתתפות במחקר',
  },
  patientReleaseJourney: {
    subtitle: 'המשפט שמתחת לכותרת העמוד',
    forWhom: 'למי מיועד',
    where: 'איפה',
    moreIntro: 'פתיחה: מענים נוספים',
    moreVeteransDescription: 'כרטיס "קבוצות למילואימניקים": תיאור',
    moreFreeDescription: 'כרטיס "טיפולים ללא עלות": תיאור',
    moreMigdalorDescription: 'כרטיס "מרפאת מגדלור": תיאור',
    moreAdultsDescription: 'כרטיס "מרפאת המבוגרים": תיאור',
    joinText: 'איך מצטרפים: הסבר',
  },
  patientSecondCircleTools: {
    reservistIntro: 'פתיחה: לבני משפחה של מילואימניקים',
  },
  patientSources: {
    booksIntro: 'פתיחה: ספרים של אנשי מטיב',
  },
  patientWhereToGetHelp: {
    subtitle: 'המשפט שמתחת לכותרת העמוד',
    disclaimer: 'הסתייגות על הפרטים',
  },
  publications: {
    subtitle: 'המשפט שמתחת לכותרת העמוד',
  },
  releaseJourneyPro: {
    subtitle: 'המשפט שמתחת לכותרת העמוד (לאנשי מקצוע)',
    shortStructure: 'תיבת "בקצרה": מבנה התוכנית',
    modelsIntro: 'פתיחה למודלים',
    mod: 'שם השותף בכרטיס השותפות',
    contactText: 'למי פונים: הסבר',
  },
  research: {
    studiesIntro: 'פתיחה למחקרים הפעילים',
    collabText: 'שיתופי פעולה מחקריים: הסבר',
  },
  supervision: {
    subtitle: 'המשפט שמתחת לכותרת העמוד',
    shortOptions: 'תיבת "בקצרה": האפשרויות',
    notSureText: 'טקסט "לא בטוח/ה מה מתאים?"',
  },
  therapistHub: {
    referWhereText: 'כרטיס "איפה מקבלים טיפול": תיאור',
    referFreeText: 'כרטיס "טיפולים ללא עלות": תיאור',
    referResearchText: 'כרטיס "מחקרים שמגייסים": תיאור',
    contactText: 'טקסט "לא מצאת את מה שחיפשת?"',
  },
};

/** The editable keys of a namespace, in the order above. @param {string} ns */
export function copyContentKeys(ns) {
  return Object.keys(COPY_CONTENT_KEYS[ns] ?? {});
}
