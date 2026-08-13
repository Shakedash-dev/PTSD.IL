import React from 'react';
import LegalPage from '@/components/LegalPage';

// ---------------------------------------------------------------------------
// Single source of truth for the operator name and contact address. Change
// them here and both language versions of the page follow.
// ---------------------------------------------------------------------------
const OPERATOR_HE = 'קבוצה 12';
const OPERATOR_EN = 'Group 12 (קבוצה 12)';
const CONTACT_EMAIL = 'shakedash912000@gmail.com';

const UPDATED_HE = '13 באוגוסט 2026';
const UPDATED_EN = '13 August 2026';

// Deliberately minimal: this covers what the site actually does and what has
// to be disclosed, and nothing else. Implementation detail (storage key names,
// rate-limit internals, the retrieval pipeline) was removed on purpose - it
// carries no legal weight. What stays is disclosure that does: AI use, named
// third parties, what is stored, and the crisis/medical limits.
const he = `
## 1. מי אנחנו

האתר **ptsd-il.site** ("האתר") מופעל על ידי ${OPERATOR_HE}. לכל פנייה בנושא פרטיות: [${CONTACT_EMAIL}](mailto:${CONTACT_EMAIL}).

השימוש באתר מהווה הסכמה למדיניות זו ול[תנאי השימוש](/terms-of-use). המדיניות נכתבה בלשון פנייה כללית ומיועדת לכל המגדרים.

## 2. מה איננו אוספים

אין באתר הרשמה, חשבונות משתמש, טפסים או תשלום. איננו מבקשים שם, טלפון, כתובת או דוא"ל, איננו מקבלים העלאות קבצים, ואיננו מוכרים או משכירים מידע לאף גורם.

**תשובות שאלון האיתור העצמי והציון מחושבים בדפדפן שלך בלבד.** הם אינם נשלחים לשום שרת ואינם נשמרים אצלנו - איננו יודעים מי מילא את השאלון ואיזו תוצאה התקבלה.

**איננו אוספים ואיננו שומרים את הודעות הצ'אט** - הן נשלחות לספקי צד שלישי לצורך יצירת התשובה בלבד (סעיף 4).

## 3. מה כן נאסף

* **העדפות בדפדפן** - שפת הממשק והמסלול שבחרת. נשמרות במכשיר שלך בלבד, אינן נשלחות אלינו, וניתן למחוק אותן בניקוי נתוני האתר.
* **נתוני שרת טכניים** - ספקי האירוח רושמים ביומנים כתובת IP, סוג דפדפן והעמוד שנטען, לצורכי תפעול ואבטחה.

**האתר אינו מציב קובצי Cookie משלו**, ואין בו Google Analytics, פיקסלים פרסומיים או מעקב בין אתרים.

## 4. הצ'אט והבינה המלאכותית

הצ'אט הוא עוזר אוטומטי מבוסס מודל שפה (AI), לא אדם.

**אנחנו לא אוספים ולא שומרים את הודעות הצ'אט.** אין ברשותנו היסטוריית שיחות ואיננו יכולים לשחזר מה נכתב. ההודעות נשלחות לספקי צד שלישי - **Cloudflare ו-Google (Gemini)** - אך ורק כדי לייצר את התשובה, ולשם כך מועברות גם אל מחוץ לישראל. אופן הטיפול שלהם בנתונים כפוף למדיניות שלהם (סעיף 5). איננו משתמשים בשיחות לאימון מודלים.

**אין להזין בצ'אט פרטים מזהים** - שלך או של אדם אחר. התשובות נוצרות אוטומטית, עלולות להיות שגויות, ואינן ייעוץ רפואי או אבחון.

**זיהוי מצוקה:** באתר פועל מנגנון אוטומטי המזהה ביטויים המרמזים על פגיעה עצמית ומציג מספרי חירום. הוא עלול לפספס, **אף אדם אינו קורא את השיחות**, ואף גורם אינו מוזעק. האתר אינו שירות חירום ואינו קו סיוע.

**במצוקה מיידית: ער"ן 1201 · מד"א 101 · משטרה 100.**

## 5. ספקים

Render (אירוח), Cloudflare (שרת הצ'אט והגנת רשת), Google (Gemini - יצירת תשובות הצ'אט). לכל אחד מדיניות פרטיות משלו: [Render](https://render.com/privacy) · [Cloudflare](https://www.cloudflare.com/privacypolicy/) · [Google](https://policies.google.com/privacy).

מעבר לכך איננו מעבירים מידע לאף גורם, אלא אם נידרש לכך על פי דין או צו שיפוטי.

## 6. שמירה ומחיקה

תשובות השאלון והודעות הצ'אט אינן נשמרות אצלנו כלל. ההעדפות בדפדפן נשארות במכשיר שלך עד שתמחק/י אותן. יומני שרת נשמרים אצל הספקים לפי המדיניות שלהם, בדרך כלל לתקופה קצרה.

## 7. הזכויות שלך

בהתאם לחוק הגנת הפרטיות, התשמ"א-1981, עומדות לך זכויות עיון במידע שנשמר עליך, תיקונו ומחיקתו. מכיוון שאיננו אוספים פרטים מזהים, ברוב המקרים אין ברשותנו מידע שניתן לשייך אליך. פנייה: [${CONTACT_EMAIL}](mailto:${CONTACT_EMAIL}).

## 8. גיל

האתר מיועד לגיל 18 ומעלה. קטינים - בליווי הורה או אפוטרופוס. איננו אוספים ביודעין מידע אישי מקטינים.

## 9. קישורים חיצוניים

האתר מפנה לאתרים ולשירותים חיצוניים שאיננו אחראים לתוכנם או למדיניות הפרטיות שלהם.

## 10. שינויים, דין וסמכות שיפוט

נוכל לעדכן מדיניות זו; תאריך העדכון מופיע בראש העמוד, והמשך שימוש מהווה הסכמה. על המדיניות יחולו דיני מדינת ישראל, וסמכות השיפוט הבלעדית נתונה לבתי המשפט המוסמכים במחוז תל אביב-יפו.
`;

const en = `
> The Hebrew version of this policy is the binding one. This English translation is provided for convenience; in any conflict, the Hebrew text prevails.

## 1. Who we are

**ptsd-il.site** ("the Site") is operated by ${OPERATOR_EN}. For any privacy matter: [${CONTACT_EMAIL}](mailto:${CONTACT_EMAIL}).

Using the Site constitutes acceptance of this policy and of the [Terms of Use](/terms-of-use).

## 2. What we do not collect

There is no registration, no user accounts, no forms and no payment on the Site. We do not ask for your name, phone number, address or email, we accept no file uploads, and we do not sell or rent information to anyone.

**Your self-screening questionnaire answers and score are computed in your browser only.** They are never sent to any server and are not stored by us - we do not know who completed the questionnaire or what result they received.

**We do not collect or store your chat messages** - they are sent to third-party providers solely to generate the answer (section 4).

## 3. What is collected

* **Browser preferences** - your interface language and the path you selected. Stored on your device only, never sent to us, and removable by clearing site data.
* **Technical server data** - our hosting providers log IP address, browser type and the page requested, for operations and security.

**The Site sets no cookies of its own**, and there is no Google Analytics, no advertising pixels and no cross-site tracking.

## 4. The chat and AI

The chat is an automated assistant built on a language model (AI), not a person.

**We do not collect or store your chat messages.** We hold no conversation history and cannot retrieve what was written. Messages are sent to third-party providers - **Cloudflare and Google (Gemini)** - solely in order to generate the answer, and are transferred outside Israel for that purpose. How those providers handle the data is governed by their own policies (section 5). We do not use conversations to train models.

**Do not enter identifying details in the chat** - yours or anyone else's. Answers are generated automatically, may be wrong, and are not medical advice or a diagnosis.

**Distress detection:** the Site runs an automated mechanism that detects phrases suggesting self-harm and displays emergency numbers. It may miss cases, **no human reads the conversations**, and no service is alerted. The Site is not an emergency service or a helpline.

**In immediate distress: ERAN 1201 · Magen David Adom 101 · Police 100.**

## 5. Providers

Render (hosting), Cloudflare (chat server and network protection), Google (Gemini - generating chat answers). Each has its own privacy policy: [Render](https://render.com/privacy) · [Cloudflare](https://www.cloudflare.com/privacypolicy/) · [Google](https://policies.google.com/privacy).

Beyond this we transfer information to no one, unless required by law or court order.

## 6. Retention and deletion

Questionnaire answers and chat messages are not stored by us at all. Browser preferences remain on your device until you clear them. Server logs are retained by the providers under their own policies, generally for a short period.

## 7. Your rights

Under Israel's Protection of Privacy Law, 5741-1981, you have rights to access, correct and delete information held about you. Because we collect no identifying details, in most cases we hold no information that can be linked to you. Contact: [${CONTACT_EMAIL}](mailto:${CONTACT_EMAIL}).

## 8. Age

The Site is intended for users aged 18 and over. Minors should use it with a parent or guardian. We do not knowingly collect personal information from minors.

## 9. External links

The Site links to external sites and services whose content and privacy practices we are not responsible for.

## 10. Changes, governing law and jurisdiction

We may update this policy; the date of the latest update appears at the top of the page, and continued use constitutes acceptance. This policy is governed by the laws of the State of Israel, and the competent courts of the Tel Aviv-Jaffa District have exclusive jurisdiction.
`;

export default function PrivacyPolicy() {
  return (
    <LegalPage
      titleKey="privacy_policy"
      eyebrowKey="legal_eyebrow"
      updated={{ he: UPDATED_HE, en: UPDATED_EN }}
      content={{ he, en }}
    />
  );
}
