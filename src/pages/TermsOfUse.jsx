import React from 'react';
import LegalPage from '@/components/LegalPage';

// ---------------------------------------------------------------------------
// Single source of truth for the operator name and contact address. Keep these
// in sync with PrivacyPolicy.jsx.
// ---------------------------------------------------------------------------
const OPERATOR_HE = 'קבוצה 12';
const OPERATOR_EN = 'Group 12 (קבוצה 12)';
const CONTACT_EMAIL = 'shakedash912000@gmail.com';

const UPDATED_HE = '13 באוגוסט 2026';
const UPDATED_EN = '13 August 2026';

// Deliberately minimal. The medical disclaimer, the emergency section and the
// AI limits are the load-bearing parts for a mental-health site - everything
// else is trimmed to the shortest form that still does its job.
const he = `
## 1. קבלת התנאים

תנאים אלה חלים על השימוש באתר **ptsd-il.site** ("האתר"), המופעל על ידי ${OPERATOR_HE}. גלישה באתר, שימוש בשאלון או בצ'אט מהווים הסכמה לתנאים אלה ול[מדיניות הפרטיות](/privacy-policy). אם אינך מסכים/ה - אנא אל תשתמש/י באתר.

התנאים נכתבו בלשון פנייה כללית ומיועדים לכל המגדרים.

## 2. מהו השירות

האתר הוא מאגר מידע וכלים לעזרה עצמית בנושא פוסט-טראומה (PTSD). השימוש בו **חינם**, ואין בו הרשמה, חשבונות, מנויים או תשלומים - אין דבר לחדש או לבטל. האתר **אינו מספק טיפול** ואינו מתווך בין משתמשים למטפלים. התכנים המקצועיים נכתבו בשיתוף עם [מטיב - המרכז לפסיכוטראומה](https://metiv.org/); אין בכך כדי להפוך את האתר לשירות קליני.

## 3. הבהרה רפואית

**האתר אינו מספק ייעוץ רפואי, נפשי, משפטי או ביטוחי.** התכנים הם מידע כללי בלבד, שאינו מותאם למצבך, והשימוש באתר **אינו יוצר יחסי מטפל-מטופל**. אין להסתמך על האתר כדי לאבחן מצב רפואי, להתחיל טיפול, להפסיקו או לשנותו - לרבות תרופות.

**שאלון האיתור העצמי אינו אבחון** אלא כלי סינון בלבד: תוצאה גבוהה אינה אבחנה, ותוצאה נמוכה אינה שוללת קיומה של בעיה. המידע על זכויות הוא כללי, עשוי להשתנות ואינו ייעוץ משפטי - יש לאמת אותו מול הגורם הרשמי הרלוונטי.

## 4. מצבי חירום

**האתר אינו שירות חירום ואינו מנוטר על ידי אדם.** אף אחד אינו קורא בזמן אמת את מה שנכתב בו, ואף גורם אינו מוזעק בעקבות שימוש בו.

בסכנה מיידית, בסיכון לפגיעה עצמית או במחשבות אובדניות - יש לפנות עכשיו: **ער"ן 1201 · מד"א 101 · משטרה 100 · או חדר המיון הקרוב.**

## 5. הצ'אט האוטומטי

הצ'אט הוא עוזר מבוסס בינה מלאכותית, לא אדם. התשובות נוצרות אוטומטית, עשויות להיות שגויות או חלקיות, ואין להסתמך עליהן. הצ'אט עונה רק על נושאים המכוסים באתר, ותוכן ההודעות מועבר לספקי צד שלישי (ראו [מדיניות הפרטיות](/privacy-policy)). **אין להזין בו פרטים מזהים.** השימוש מוגבל בקצב, ואין להשתמש בו לייצור תוכן פוגעני או בלתי חוקי או לעקיפת מגבלות המערכת.

## 6. גיל

האתר מיועד לגיל 18 ומעלה. שימוש על ידי קטינים - בליווי ובאישור הורה או אפוטרופוס.

## 7. שימושים אסורים

אין להעתיק, להפיץ או לפרסם מחדש את תוכן האתר אלא לשימוש אישי ולא מסחרי; אין לבצע הנדסה לאחור, גירוד אוטומטי של תוכן (scraping), הפעלת בוטים, עקיפת מגבלות או אמצעי אבטחה, ניסיון גישה לאזור הניהול, העמסה או שיבוש פעולת האתר, שימוש בלתי חוקי או פוגעני, או התחזות לאדם או לגוף כלשהו. אנחנו רשאים לחסום גישה למי שמפר סעיף זה, ללא הודעה מוקדמת.

## 8. קניין רוחני

זכויות היוצרים בתוכן האתר, בעיצובו ובקוד שלו שייכות ל${OPERATOR_HE} ו/או לבעלי הזכויות מטעמה. מותר לצפות בתוכן, לשמור אותו ולהדפיסו **לשימוש אישי ולא מסחרי בלבד**. כל שימוש אחר - לרבות פרסום מחדש, שימוש מסחרי או שימוש לאימון מודלים - מחייב אישור מראש ובכתב.

## 9. אחריות

האתר ניתן **כמות שהוא ("AS IS")**, ללא התחייבות לזמינות, לדיוק או לפעולה ללא תקלות, וללא אחריות מכל סוג. במידה המרבית המותרת על פי דין, לא נישא באחריות לכל נזק - ישיר או עקיף - הנובע מהשימוש באתר, מהסתמכות על תוכנו, מתוצאות השאלון, מתשובות הצ'אט או משימוש באתרים חיצוניים אליהם הוא מפנה. **אין באמור כדי לגרוע מאחריות שלא ניתן להגבילה על פי דין.**

את/ה מתחייב/ת לשפות אותנו בגין כל תביעה או הוצאה שייגרמו לנו עקב הפרת תנאים אלה על ידך.

## 10. שינויים, סיום, דין וסמכות שיפוט

אנחנו רשאים לשנות תנאים אלה, את האתר או את זמינותו, ולהגביל או לחסום גישה - בכל עת וללא הודעה מוקדמת. תאריך העדכון מופיע בראש העמוד, והמשך שימוש לאחר מכן מהווה הסכמה. על התנאים יחולו דיני מדינת ישראל, וסמכות השיפוט הבלעדית נתונה לבתי המשפט המוסמכים במחוז תל אביב-יפו. הוראה שתימצא בלתי אכיפה לא תפגע בתוקף יתר ההוראות.

## 11. יצירת קשר

[${CONTACT_EMAIL}](mailto:${CONTACT_EMAIL}) · ראו גם את [מדיניות הפרטיות](/privacy-policy).
`;

const en = `
> The Hebrew version of these terms is the binding one. This English translation is provided for convenience; in any conflict, the Hebrew text prevails.

## 1. Acceptance of terms

These terms govern use of **ptsd-il.site** ("the Site"), operated by ${OPERATOR_EN}. Browsing the Site or using the questionnaire or the chat constitutes acceptance of these terms and of the [Privacy Policy](/privacy-policy). If you do not agree, please do not use the Site.

## 2. What the service is

The Site is an information and self-help resource on post-traumatic stress disorder (PTSD). Use is **free**, and there is no registration, no accounts, no subscriptions and no payments - there is nothing to renew or cancel. The Site **does not provide treatment** and does not broker contact between users and therapists. The professional content was written in partnership with [Metiv - The Israel Psychotrauma Center](https://metiv.org/); that does not make the Site a clinical service.

## 3. Medical disclaimer

**The Site does not provide medical, psychological, legal or insurance advice.** The content is general information only, not tailored to your situation, and using the Site **does not create a therapist-patient relationship**. Do not rely on the Site to diagnose a condition, or to start, stop or change treatment - including medication.

**The self-screening questionnaire is not a diagnosis**, only a screening tool: a high score is not a diagnosis, and a low score does not rule out a problem. Information about rights is general, may change, and is not legal advice - verify it with the relevant official body.

## 4. Emergencies

**The Site is not an emergency service and is not monitored by a human.** Nobody reads what is written on it in real time, and no service is dispatched as a result of using it.

In immediate danger, at risk of self-harm, or having suicidal thoughts, contact now: **ERAN 1201 · Magen David Adom 101 · Police 100 · or your nearest emergency room.**

## 5. The automated chat

The chat is an AI-powered assistant, not a person. Answers are generated automatically, may be wrong or incomplete, and should not be relied upon. It answers only on topics covered by the Site, and message content is transferred to third-party providers (see the [Privacy Policy](/privacy-policy)). **Do not enter identifying details in it.** Use is rate-limited, and it must not be used to generate harmful or unlawful content or to circumvent the system's limits.

## 6. Age

The Site is intended for users aged 18 and over. Use by minors requires the involvement and consent of a parent or guardian.

## 7. Prohibited uses

Do not copy, distribute or republish the Site's content other than for personal, non-commercial use; do not reverse engineer, scrape content automatically, run bots, circumvent limits or security measures, attempt to reach the admin area, overload or disrupt the Site, use it unlawfully or abusively, or impersonate any person or body. We may block access for anyone breaching this section, without prior notice.

## 8. Intellectual property

Copyright in the Site's content, design and code belongs to ${OPERATOR_EN} and/or its rights holders. You may view, save and print the content **for personal, non-commercial use only**. Any other use - including republication, commercial use, or use for training models - requires prior written permission.

## 9. Liability

The Site is provided **"AS IS"**, with no undertaking as to availability, accuracy or fault-free operation, and without warranty of any kind. To the maximum extent permitted by law, we shall not be liable for any damage - direct or indirect - arising from use of the Site, reliance on its content, questionnaire results, chat answers, or use of external sites it links to. **None of the above limits liability that cannot be limited by law.**

You undertake to indemnify us against any claim or expense incurred by us as a result of your breach of these terms.

## 10. Changes, termination, governing law and jurisdiction

We may change these terms, the Site or its availability, and may restrict or block access, at any time and without prior notice. The date of the latest update appears at the top of the page, and continued use thereafter constitutes acceptance. These terms are governed by the laws of the State of Israel, and the competent courts of the Tel Aviv-Jaffa District have exclusive jurisdiction. Any provision found unenforceable does not affect the validity of the rest.

## 11. Contact

[${CONTACT_EMAIL}](mailto:${CONTACT_EMAIL}) · See also the [Privacy Policy](/privacy-policy).
`;

export default function TermsOfUse() {
  return (
    <LegalPage
      titleKey="terms_of_use"
      eyebrowKey="legal_eyebrow"
      updated={{ he: UPDATED_HE, en: UPDATED_EN }}
      content={{ he, en }}
    />
  );
}
