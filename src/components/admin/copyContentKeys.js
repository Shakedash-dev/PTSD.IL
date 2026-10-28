// Which page-copy keys (scripts/metiv-seed/copy/<namespace>.json) the Metiv
// admin lets an editor change, with the Hebrew name the editor sees.
//
// Rule: a key is CONTENT - editable - when it is running text that informs the
// visitor (an intro, an explanation, a card description, a note, a disclaimer,
// a help line), typically a full sentence. Everything else is UI and stays as
// shipped: page and section headings, titles and subtitles, eyebrows, nav and
// breadcrumb labels, button, link and CTA labels, field labels (fieldCost,
// fieldLocation...), badges and status labels, aria/alt/sr-only text,
// placeholders, empty and error states, count and format templates
// ("{count} ..."), sentence fragments around a link, and crisis-line labels
// (sanctuaryCrisisLine, eranCall...). When in doubt it is UI.
//
// A namespace that is not listed has no editable key. src/test/admin-metiv-
// sitemap.test.js checks every key here exists in the seed copy files.

/** @type {Record<string, Record<string, string>>} */
export const COPY_CONTENT_KEYS = {
  about: {
    short1: 'תיבת "בקצרה": שורה 1',
    short2: 'תיבת "בקצרה": שורה 2',
    moreAboutHistory: 'תיאור הכרטיס "הסיפור של מטיב"',
    moreAboutTeam: 'תיאור הכרטיס "הצוות"',
    moreAboutPartners: 'תיאור הכרטיס "השותפים שלנו"',
    moreAboutCollaborations: 'תיאור הכרטיס "שיתופי פעולה"',
  },
  aboutCollaborations: {
    orgsIntro: 'פתיחה: ארגונים שקיבלו הכשרה',
    contactText: 'טקסט "רוצים לעבוד יחד?"',
  },
  aboutPartners: {
    short1: 'תיבת "בקצרה": שורה 1',
    short2: 'תיבת "בקצרה": שורה 2',
    joinText: 'טקסט "רוצים לתמוך?"',
  },
  accessibility: {
    short1: 'תיבת "בקצרה": שורה 1',
    short2: 'תיבת "בקצרה": שורה 2',
  },
  articles: {
    moreSoon: 'הערה: מאמרים נוספים יתווספו',
  },
  chrome: {
    helpNowIntro: 'חלון "עזרה עכשיו": פתיחה',
  },
  childrenFamily: {
    shortTrainings: 'תיבת "בקצרה": הכשרות',
    shortInterest: 'תיבת "בקצרה": רישום התעניינות',
    modelsIntro: 'פתיחה למודלים',
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
    shortQuestions: 'תיבת "בקצרה": השאלות',
    shortAll: 'תיבת "בקצרה": כל הקורסים',
    finderIntro: 'פתיחה לשאלון הקורסים',
    pastIntro: 'פתיחה: קורסים שהתקיימו',
    moreSupervisionText: 'כרטיס "הדרכה": תיאור',
    moreKidsText: 'כרטיס "ילדים ומשפחה": תיאור',
    moreOrgText: 'כרטיס "לארגונים": תיאור',
  },
  donate: {
    short1: 'תיבת "בקצרה": שורה 1',
    placeholderNote: 'הערה על טקסט זמני',
  },
  events: {
    shortFilter: 'תיבת "בקצרה": סינון',
    shortCourseLink: 'תיבת "בקצרה": קישור לקורס',
  },
  landing: {
    intro: 'פתיחה בראש העמוד',
    patientText: 'כרטיס אזור המטופלים: תיאור',
    therapistText: 'כרטיס אזור אנשי המקצוע: תיאור',
    servicesIntro: 'פתיחה לשירותים הטיפוליים',
    moreServicesText: 'כרטיס "מסגרות נוספות": תיאור',
  },
  organizations: {
    shortTailored: 'תיבת "בקצרה": התאמה לארגון',
    shortContact: 'תיבת "בקצרה": איש קשר',
    clientsIntro: 'פתיחה: ארגונים שעבדו עם מטיב',
  },
  patientChildren: {
    groupsIntro: 'פתיחה: קבוצות להורים וילדים',
  },
  patientCommunity: {
    veteransIntro: 'פתיחה: חיילים משוחררים ומילואימניקים',
  },
  patientFreeTreatment: {
    researchNote: 'הערה על השתתפות במחקר',
  },
  patientReleaseJourney: {
    forWhom: 'למי מיועד',
    where: 'איפה',
    modelsIntro: 'פתיחה למסלולים',
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
    disclaimer: 'הסתייגות על הפרטים',
  },
  publications: {
    shortFilter: 'תיבת "בקצרה": סינון',
  },
  releaseJourneyPro: {
    shortStructure: 'תיבת "בקצרה": מבנה התוכנית',
    shortWho: 'תיבת "בקצרה": מי פיתח',
    shortTeam: 'תיבת "בקצרה": הצוות',
    modelsIntro: 'פתיחה למודלים',
    contactText: 'למי פונים: הסבר',
  },
  research: {
    shortCards: 'תיבת "בקצרה": הכרטיסים',
    studiesIntro: 'פתיחה למחקרים הפעילים',
    collabText: 'שיתופי פעולה מחקריים: הסבר',
  },
  supervision: {
    shortCompare: 'תיבת "בקצרה": טבלת ההשוואה',
    shortContact: 'תיבת "בקצרה": פנייה',
    optionsIntro: 'פתיחה לאפשרויות',
    notSureText: 'טקסט "לא בטוח/ה מה מתאים?"',
  },
  therapistHub: {
    questionIntro: 'פתיחה לשאלה "במה נוכל לעזור?"',
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
