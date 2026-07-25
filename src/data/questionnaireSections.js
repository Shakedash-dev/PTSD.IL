// Presentation overlay for the Hebrew questionnaire. The DB stores a FLAT
// 20-question list with no notion of sections; this supplies the section
// headers/icons + the intro line, and the counts used to slice the flat DB
// questions into sections IN ORDER. Question TEXT is NOT here - it comes from
// the API. Titles/icons/intro copied verbatim from the former
// src/data/static/questionnaire.js `he` block. Hebrew-only by design.
export const HE_SECTIONS = {
  intro: 'קח נשימה, תחשוב על החודש האחרון ועל האירוע שעברת, ותראה כמה כל דבר כאן מציק לך:',
  sections: [
    { icon: '🧠', title: 'מחשבות שלא עוזבות', count: 5 },
    { icon: '🛑', title: 'הניסיונות לברוח', count: 2 },
    { icon: '😔', title: 'מה שזה עשה למצב הרוח שלך', count: 7 },
    { icon: '⚡', title: 'הגוף שנשאר דרוך', count: 6 },
  ],
};
