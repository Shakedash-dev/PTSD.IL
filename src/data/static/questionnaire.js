// PCL-5 self-assessment questionnaire content, extracted from Questionnaire.jsx as part of
// the backend-prep migration (see docs/preparing_for_db.md). EN answer-scale labels are not
// duplicated here - they already live in src/lib/i18n.js under the
// not_at_all/a_little/moderately/quite_a_bit/extremely keys and are resolved via t(lang, key).
export const QUESTIONNAIRE = {
  total_questions: 20,
  max_score: 80,
  // 33 is the PCL-5 clinical cutoff for probable PTSD (National Center for PTSD).
  cutoff_score: 33,
  he: {
    intro: 'קח נשימה, תחשוב על החודש האחרון ועל האירוע שעברת, ותראה כמה כל דבר כאן מציק לך:',
    scale: ['בכלל לא', 'קצת', 'ככה ככה', 'הרבה', 'שובר אותי לגמרי'],
    sections: [
      {
        icon: '🧠',
        title: 'מחשבות שלא עוזבות',
        questions: [
          'הזיכרון של מה שקרה פשוט קופץ לך לראש פתאום, בלי שתרצה?',
          'יש לך חלומות רעים או סיוטים בלילה על מה שהיה?',
          'קורה לך שאתה מרגיש לרגע כאילו אתה ממש נמצא שם שוב?',
          'כשמשהו מזכיר לך את זה, הלב שלך נופל או מרגיש מועקה קשה?',
          'כשהזיכרון עולה, הגוף מגיב? (למשל דופק גבוה, זיעה קרה, רעד, קוצר נשימה)',
        ],
      },
      {
        icon: '🛑',
        title: 'הניסיונות לברוח',
        questions: [
          'אתה מנסה בכוח להשתיק מחשבות, רגשות או זיכרונות שקשורים לזה?',
          'אתה מתרחק ממקומות, אנשים או מצבים שמזכירים לך את מה שקרה, כדי לא להרגיש רע?',
        ],
      },
      {
        icon: '😔',
        title: 'מה שזה עשה למצב הרוח שלך',
        questions: [
          'יש חלקים או פרטים חשובים מהאירוע שאתה פשוט לא מצליח לזכור?',
          'התחלת לחשוב דברים קשים על עצמך או על העולם - כמו "אני אשם", "העולם מסוכן", "אי אפשר לסמוך על אף אחד"?',
          'אתה מוצא את עצמך מאשים את עצמך במה שקרה, שוב ושוב - גם כשאתה יודע שזה לא הגיוני?',
          'אתה מרגיש שרגשות כבדים כמו פחד, עצב, עצבנות או בושה פשוט לא משחררים אותך?',
          'איבדת חשק לדברים ולתחביבים שפעם ממש אהבת ועשו לך טוב?',
          'אתה מרגיש מנותק, לבד, או שאף אחד לא באמת מבין אותך?',
          'קשה לך להרגיש אהבה, שמחה, או סתם שקט נפשי?',
        ],
      },
      {
        icon: '⚡',
        title: 'הגוף שנשאר דרוך',
        questions: [
          'אתה מוצא את עצמך עצבני, קצר רוח, או מתפרץ על אנשים בלי שרצית?',
          'אתה עושה שטויות או דברים מסוכנים בלי לחשוב על התוצאות?',
          'אתה מרגיש כל הזמן "על הקצה" - מחפש סכנות, בודק מי סביבך, במתח תמידי?',
          'אתה קופץ ונבהל בקלות מכל רעש קטן או תנועה פתאומית?',
          'חווה ירידה ביכולת הריכוז? מתמודד עם קושי להתמקד במשימות, בעבודה או בלימודים?',
          'השינה שלך נפגעה? (קשה להירדם, מתעורר המון, או ישן גרוע)',
        ],
      },
    ],
  },
  en: {
    questions: [
      'Repeated, disturbing, and unwanted memories of the stressful experience?',
      'Repeated, disturbing dreams of the stressful experience?',
      'Suddenly feeling or acting as if the stressful experience were actually happening again?',
      'Feeling very upset when something reminded you of the stressful experience?',
      'Having strong physical reactions when something reminded you?',
      'Avoiding memories, thoughts, or feelings related to the stressful experience?',
      'Avoiding external reminders of the stressful experience?',
      'Trouble remembering important parts of the stressful experience?',
      'Having strong negative beliefs about yourself, others, or the world?',
      'Blaming yourself or someone else for the stressful experience or what happened?',
      'Having strong negative feelings such as fear, horror, anger, guilt, or shame?',
      'Loss of interest in activities that you used to enjoy?',
      'Feeling distant or cut off from other people?',
      'Trouble experiencing positive feelings?',
      'Irritable behavior, angry outbursts, or acting aggressively?',
      'Taking too many risks or doing things that could cause you harm?',
      'Being "superalert" or watchful or on guard?',
      'Feeling jumpy or easily startled?',
      'Having difficulty concentrating?',
      'Trouble falling or staying asleep?',
    ],
  },
};
