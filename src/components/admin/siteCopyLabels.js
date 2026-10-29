// Hebrew names for the editable i18n texts (src/lib/editableI18nKeys.js): what
// the text is, and where on the site it shows. The admin shows these instead
// of the raw key. src/test/admin-metiv-sitemap.test.jsx checks every editable
// key has one.

/** @type {Record<string, { label: string, where: string }>} */
export const SITE_COPY_LABELS = {
  about_ptsd_short: { label: 'מה זה פוסט-טראומה (פסקה קצרה)', where: 'בעמוד הבית של אזור המטופלים, ובסעיף "מה זה פוסט-טראומה?" בדף הבית' },
  footer_disclaimer: { label: 'הסתייגות רפואית בתחתית', where: 'בתחתית העמודים של אתר PTSD-IL' },
  path1_subtitle: { label: 'כרטיס "מי שחווה אירוע קשה": תיאור', where: 'בעמוד הבית של אזור המטופלים' },
  path2_subtitle: { label: 'כרטיס "קרובים ובני משפחה": תיאור', where: 'בעמוד הבית של אזור המטופלים' },
  path3_subtitle: { label: 'כרטיס "שאלון אנונימי": תיאור', where: 'בעמוד הבית של אזור המטופלים' },
  first_circle_welcome: { label: 'המשפט שמתחת לכותרת העמוד', where: 'בעמוד "מי שחווה אירוע קשה"' },
  second_circle_welcome: { label: 'המשפט שמתחת לכותרת העמוד', where: 'בעמוד "קרובים ובני משפחה"' },
  ptsd_info_subtitle: { label: 'המשפט שמתחת לכותרת העמוד', where: 'בעמוד "מה זה פוסט-טראומה"' },
  self_help_intro: { label: 'המשפט שמתחת לכותרת העמוד', where: 'בעמוד "עזרה עצמית"' },
  rights_subtitle: { label: 'המשפט שמתחת לכותרת העמוד', where: 'בעמוד "זכויות"' },
  treatment_subtitle: { label: 'המשפט שמתחת לכותרת העמוד', where: 'בעמוד "המסע הטיפולי"' },
  community_subtitle: { label: 'המשפט שמתחת לכותרת העמוד', where: 'בעמוד "קהילות תמיכה"' },
  community_why_p1: { label: 'פתיחה: פסקה ראשונה', where: 'בעמוד "קהילות תמיכה", מעל רשימת הקבוצות' },
  community_why_p2: { label: 'פתיחה: פסקה שנייה', where: 'בעמוד "קהילות תמיכה", מעל רשימת הקבוצות' },
  children_intro: { label: 'המשפט שמתחת לכותרת העמוד', where: 'בעמוד "לדבר עם ילדים"' },
  second_circle_tools_subtitle: { label: 'המשפט שמתחת לכותרת העמוד', where: 'בעמוד "כלים לבני משפחה"' },
  second_circle_tools_intro: { label: 'תיבת הפתיחה', where: 'בעמוד "כלים לבני משפחה", מעל השאלות' },
  pcl_instruction: { label: 'הנחיה למילוי השאלון', where: 'בשאלון, מעל השאלות' },
  questionnaire_sections_intro: { label: 'פתיחה לשאלות', where: 'בשאלון, מעל הקבוצה הראשונה של השאלות' },
  result_high_title: { label: 'תוצאה מעל הסף: כותרת', where: 'בשאלון, אחרי החישוב, כשהציון מעל הסף' },
  result_high_text: { label: 'תוצאה מעל הסף: הסבר', where: 'בשאלון, אחרי החישוב, כשהציון מעל הסף' },
  result_low_title: { label: 'תוצאה מתחת לסף: כותרת', where: 'בשאלון, אחרי החישוב, כשהציון מתחת לסף' },
  result_low_text: { label: 'תוצאה מתחת לסף: הסבר', where: 'בשאלון, אחרי החישוב, כשהציון מתחת לסף' },
  sources_subtitle: { label: 'המשפט שמתחת לכותרת העמוד', where: 'בעמוד "מקורות"' },
  sources_approved_prefix: { label: 'משפט האישור ("כל התוכן ... אושר ע״י")', where: 'בעמוד "מקורות", לפני שם הארגון המאשר' },
  footer_partner_org: { label: 'שם הארגון המאשר', where: 'בעמוד "מקורות", אחרי משפט האישור' },
};

/** @param {string} key */
export function siteCopyLabel(key) {
  return SITE_COPY_LABELS[key] ?? { label: key, where: '' };
}
