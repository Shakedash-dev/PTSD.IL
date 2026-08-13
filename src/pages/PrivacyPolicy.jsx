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

const he = `
## 1. כללי

מדיניות פרטיות זו מסבירה איזה מידע נאסף כאשר את/ה גולש/ת באתר **ptsd-il.site** ("האתר"), למה הוא נאסף, למי הוא מועבר וכמה זמן הוא נשמר. האתר מופעל על ידי ${OPERATOR_HE} ("אנחנו"), וכתובת יצירת הקשר לכל עניין של פרטיות היא [${CONTACT_EMAIL}](mailto:${CONTACT_EMAIL}).

השימוש באתר מהווה הסכמה למדיניות זו ולתנאי השימוש. אם אינך מסכים/ה - אנא אל תשתמש/י באתר.

מדיניות זו נכתבה בלשון פנייה כללית ומיועדת לכל המגדרים.

## 2. תמצית - מה חשוב לדעת

* **אין באתר הרשמה, אין חשבונות משתמש, אין תשלום ואין טפסים.** אנחנו לא מבקשים ולא אוספים שם, טלפון, כתובת או דוא"ל.
* **שאלון האיתור העצמי לא יוצא מהמכשיר שלך.** התשובות והציון מחושבים בדפדפן בלבד, לא נשלחים לשום שרת, לא נשמרים אצלנו ונמחקים ברגע שסוגרים או מרעננים את הדף.
* **הצ'אט מבוסס בינה מלאכותית.** ההודעות שנכתבות בו נשלחות לשרתי Cloudflare ולשירות Gemini של Google לצורך יצירת התשובה. **אין להזין בצ'אט פרטים מזהים או מידע רגיש.**
* **אין באתר קובצי Cookie משלנו, אין Google Analytics, אין פיקסלים פרסומיים ואין מעקב אחר גולשים בין אתרים.**
* **אנחנו לא מוכרים ולא משכירים מידע לאף אחד, ולא עושים בו שימוש פרסומי.**

## 3. גיל המשתמשים

האתר מיועד לשימוש מגיל 18 ומעלה. קטינים מתחת לגיל 18 מוזמנים להשתמש בתכנים באתר בליווי הורה או אפוטרופוס, ובפרט בכל הנוגע לשאלון האיתור העצמי ולצ'אט.

אנחנו לא אוספים ביודעין מידע אישי מקטינים. מכיוון שהאתר אינו אוסף פרטים מזהים מאף גולש, בפועל אין ברשותנו מידע אישי על קטינים. אם למרות זאת ייוודע לנו שהגיע אלינו מידע אישי של קטין, נמחק אותו.

## 4. איזה מידע נאסף

### 4.1 מידע שנשמר בדפדפן שלך בלבד

האתר שומר בדפדפן שלך העדפות תצוגה בסיסיות - שפת הממשק והמסלול שבחרת בדף הבית - כדי שלא תצטרך/י לבחור אותן מחדש בכל ביקור. **הן נשמרות במכשיר שלך בלבד ואינן נשלחות אלינו או לצד שלישי.** אפשר למחוק אותן בכל רגע דרך ניקוי נתוני האתר בדפדפן.

### 4.2 שאלון האיתור העצמי

תשובות השאלון והציון מחושבים **בתוך הדפדפן בלבד**. הם אינם נשלחים לשום שרת, אינם נשמרים אצלנו ונמחקים ברגע שמרעננים או סוגרים את הדף. זו החלטה מכוונת: מדובר במידע רפואי רגיש, ולכן בחרנו לא לאסוף אותו כלל. **אנחנו לא יודעים מי מילא את השאלון ואיזו תוצאה התקבלה.**

### 4.3 הצ'אט (עוזר מבוסס בינה מלאכותית)

כשאת/ה שולח/ת הודעה בצ'אט, תוכן ההודעות בשיחה ושפת הממשק נשלחים לשרת הצ'אט שלנו, יחד עם מזהה טכני אקראי המשמש להגבלת קצב שימוש בלבד ואינו מקושר אליך. **אנחנו לא שומרים את תוכן השיחות ולא בונים מהן היסטוריה או פרופיל משתמש.** עם סגירת הדף השיחה נעלמת. על העיבוד בבינה מלאכותית - ראו סעיף 6.

### 4.4 נתונים טכניים בשרתי האירוח

כמו בכל אתר אינטרנט, ספקי האירוח שלנו (סעיף 7) רושמים ביומני שרת סטנדרטיים נתונים טכניים על כל בקשה - בהם כתובת IP, סוג הדפדפן והעמוד שנטען - לצורכי תפעול, אבטחה ואיתור תקלות, בהתאם למדיניות שלהם. איננו משתמשים ביומנים אלה כדי לזהות גולשים.

### 4.5 פאנל הניהול

לאתר יש פאנל ניהול תוכן סגור (\`/admin\`), המיועד לצוות מורשה בלבד ואינו נגיש לגולשים. הכניסה אליו מתבצעת באמצעות חשבון Google. לגבי משתמשי ניהול בלבד נשמרים כתובת דוא"ל, שם התצוגה בחשבון Google והרשאות התפקיד. סעיף זה אינו רלוונטי לגולשים רגילים באתר.

## 5. עוגיות (Cookies) ומעקב

**האתר אינו מציב קובצי Cookie משלו.** אין באתר Google Analytics, אין פיקסל של Meta/Facebook, אין כלי ניתוח התנהגות גולשים, אין הקלטות מסך ואין רשתות פרסום או מעקב חוצה-אתרים.

ייתכן שספקי התשתית שלנו (למשל Cloudflare) יציבו קובץ טכני או קובץ אבטחה הנדרש להגנה מפני התקפות ולניתוב תעבורה. קבצים אלה אינם משמשים לפרסום או לפרופיילינג.

## 6. שימוש בבינה מלאכותית (AI)

**חשוב לקרוא את הסעיף הזה לפני שימוש בצ'אט.**

### 6.1 איך זה עובד

הצ'אט הוא עוזר אוטומטי מבוסס מודל שפה (AI), שעונה על סמך תוכן האתר בלבד. כדי לייצר את התשובה, **תוכן ההודעות שלך מועבר לספקי ענן ובינה מלאכותית חיצוניים - Cloudflare ו-Google (Gemini).** העיבוד אצלם כפוף לתנאי השירות ולמדיניות הפרטיות שלהם (ראו סעיף 7). אנחנו לא משתמשים בשיחות שלך כדי לאמן מודלים.

### 6.2 מה לא לכתוב בצ'אט

הצ'אט נועד לשאלות כלליות על תכני האתר. **אין להזין בו שם, מספר טלפון, תעודת זהות, כתובת, פרטי קופת חולים, מספר אישי צבאי, פרטים מזהים של אדם אחר או תיאור אישי מזוהה של מצבך הרפואי.** אם בכל זאת הוזנו פרטים כאלה, הם עוברים לצדדים השלישיים המפורטים לעיל, ואיננו יכולים לשלוף או למחוק אותם מהם עבורך.

### 6.3 מגבלות התשובות

התשובות נוצרות אוטומטית ועשויות להיות שגויות, חלקיות או לא מעודכנות. הן **אינן ייעוץ רפואי, נפשי, משפטי או ביטוחי**, אינן מהוות אבחון ואינן תחליף לאיש מקצוע. ראו את ההבהרה המלאה בתנאי השימוש.

### 6.4 זיהוי מצוקה ואובדנות

באתר פועל מנגנון אוטומטי המזהה בהודעות הצ'אט ביטויים המרמזים על סכנה עצמית או מחשבות אובדניות, ומציג באופן מיידי מספרי חירום ועזרה. חשוב להבין את מגבלות המנגנון:

* הוא מבוסס על זיהוי ביטויים ועלול לפספס מצוקה או לזהות בטעות;
* **אף אדם אינו קורא את השיחות בזמן אמת**, ואין ניטור אנושי של הצ'אט;
* המערכת אינה מזעיקה גורם חירום, אינה מיידעת אף אחד ואינה מאתרת את מיקומך;
* האתר **אינו שירות חירום ואינו קו סיוע**.

**במצב מצוקה מיידית: ער"ן 1201 · מד"א 101 · משטרה 100 · או פנייה לחדר מיון הקרוב.**

## 7. צדדים שלישיים ומעבדי משנה

לצורך הפעלת האתר אנחנו נעזרים בספקים הבאים. לכל אחד מהם מדיניות פרטיות משלו:

* **Render** - אירוח האתר ושרת התוכן. מגיעים אליו נתוני שרת טכניים.
* **Cloudflare** - הפעלת שרת הצ'אט והגנת רשת. מגיעים אליו נתוני שרת טכניים ותוכן הודעות הצ'אט.
* **Google (Gemini)** - יצירת תשובות הצ'אט. מגיע אליו תוכן הודעות הצ'אט.
* **Google Identity Services** - כניסת מנהלי תוכן בלבד. מגיעים אליו דוא"ל ושם של משתמשי ניהול (לא של גולשים).

מדיניות הפרטיות שלהם: [Render](https://render.com/privacy) · [Cloudflare](https://www.cloudflare.com/privacypolicy/) · [Google](https://policies.google.com/privacy).

מעבר לכך, איננו מעבירים מידע לאף גורם, למעט אם נידרש לכך על פי דין, צו שיפוטי או דרישת רשות מוסמכת, או כדי להגן על זכויותינו.

## 8. העברת מידע אל מחוץ לישראל

שרתי הספקים המפורטים בסעיף 7 ממוקמים, כולם או חלקם, מחוץ לישראל - בין היתר בארצות הברית ובאיחוד האירופי. שימוש באתר, ובפרט בצ'אט, כרוך בהעברת המידע המתואר לעיל אל מחוץ לישראל, בהתאם למנגנוני ההגנה של אותם ספקים.

## 9. משך שמירת המידע ומחיקתו

* **תשובות השאלון** - לא נשמרות כלל.
* **תוכן שיחות הצ'אט** - לא נשמר על ידינו. הוא קיים בדפדפן עד לסגירת הדף.
* **ההעדפות שנשמרות בדפדפן** - נשארות במכשיר שלך עד שתמחק/י אותן.
* **יומני שרת אצל הספקים** - נשמרים לפי מדיניות הספק, בדרך כלל לתקופה קצרה ולצורכי אבטחה ותפעול.
* **חשבונות ניהול** - נשמרים כל עוד ההרשאה בתוקף.

**האתר אינו מקבל העלאות קבצים מגולשים** (תמונות, מסמכים או כל קובץ אחר), ולכן אין קבצים של גולשים לשמור או למחוק.

## 10. אבטחת מידע

התעבורה לאתר ואל שרת הצ'אט מוצפנת ב-HTTPS, והגישה לפאנל הניהול מוגבלת בכניסת Google ובהרשאות לפי תפקיד. מכיוון שאיננו מנהלים מאגר של פרטי גולשים, אין באתר מאגר כזה שניתן לדלוף ממנו.

עם זאת, שום מערכת אינה חסינה לחלוטין, ואיננו יכולים להתחייב לאבטחה מוחלטת.

## 11. הזכויות שלך

בהתאם לחוק הגנת הפרטיות, התשמ"א-1981 ולתקנותיו - ובמידה שחל עליך גם ה-GDPR האירופי - עומדות לך זכויות עיון במידע שנשמר עליך, תיקונו, מחיקתו, הגבלת עיבודו והתנגדות לעיבוד.

**חשוב לשים לב:** האתר אינו אוסף פרטים מזהים, אינו מנהל חשבונות משתמש ואינו שומר את תוכן השיחות או את תשובות השאלון. לכן, ברוב המכריע של המקרים **אין ברשותנו מידע שניתן לשייך אליך**, ולא נוכל לאתר מידע כזה גם אם נתבקש. פנייה למימוש זכויות: [${CONTACT_EMAIL}](mailto:${CONTACT_EMAIL}). נשיב בתוך זמן סביר.

לגבי מידע המצוי אצל הספקים שבסעיף 7 (למשל יומני שרת), יש לפנות ישירות אליהם בהתאם למדיניות שלהם.

## 12. קישורים לאתרים חיצוניים

האתר מפנה לאתרים ולשירותים חיצוניים - בהם ארגוני סיוע, גופים ממשלתיים, קהילות ומקורות מקצועיים. למדיניות הפרטיות שלהם אין קשר למדיניות זו, ואיננו אחראים לתכנים, לשירותים או לאופן שבו הם מטפלים במידע שלך. מומלץ לקרוא את המדיניות שלהם לפני מסירת פרטים.

## 13. שינויים במדיניות

נוכל לעדכן מדיניות זו מעת לעת. תאריך העדכון האחרון מופיע בראש העמוד. שימוש באתר לאחר פרסום גרסה מעודכנת מהווה הסכמה לה. מומלץ לעיין בעמוד זה מדי פעם.

## 14. הדין החל וסמכות שיפוט

על מדיניות זו יחולו דיני מדינת ישראל בלבד. סמכות השיפוט הבלעדית בכל מחלוקת הנוגעת אליה נתונה לבתי המשפט המוסמכים במחוז תל אביב-יפו.

## 15. יצירת קשר

לשאלות, בקשות או תלונות בנושא פרטיות: [${CONTACT_EMAIL}](mailto:${CONTACT_EMAIL}).

ראו גם את [תנאי השימוש](/terms-of-use) של האתר.
`;

const en = `
> The Hebrew version of this policy is the binding one. This English translation is provided for convenience; in any conflict, the Hebrew text prevails.

## 1. General

This Privacy Policy explains what information is collected when you use **ptsd-il.site** ("the Site"), why it is collected, who it is shared with, and how long it is kept. The Site is operated by ${OPERATOR_EN} ("we", "us"), and the contact address for any privacy matter is [${CONTACT_EMAIL}](mailto:${CONTACT_EMAIL}).

Using the Site constitutes acceptance of this policy and of the Terms of Use. If you do not agree, please do not use the Site.

## 2. Summary - the short version

* **There is no registration, no user accounts, no payment and no forms on the Site.** We do not ask for and do not collect your name, phone number, address or email.
* **The self-screening questionnaire never leaves your device.** Answers and the resulting score are computed in your browser only, are never sent to any server, are not stored by us, and are erased the moment you refresh or close the page.
* **The chat is AI-powered.** Messages you type are transmitted to Cloudflare's servers and to Google's Gemini service in order to generate the answer. **Do not enter identifying or sensitive personal details in the chat.**
* **The Site sets no cookies of its own. There is no Google Analytics, no advertising pixels and no cross-site tracking.**
* **We do not sell, rent or advertise on the basis of any information.**

## 3. Age

The Site is intended for users aged 18 and over. Minors under 18 are welcome to use the content with the involvement of a parent or guardian, particularly with regard to the self-screening questionnaire and the chat.

We do not knowingly collect personal information from minors. Because the Site collects no identifying details from any visitor, in practice we hold no personal information about minors. If we nevertheless learn that personal information of a minor has reached us, we will delete it.

## 4. What information is collected

### 4.1 Information stored only in your browser

The Site stores basic display preferences in your browser - the interface language and the path you selected on the home page - so you do not have to choose them again on every visit. **They stay on your device and are never transmitted to us or to any third party.** You can delete them at any time by clearing site data in your browser.

### 4.2 The self-screening questionnaire

Your questionnaire answers and the resulting score are computed **inside your browser only**. They are never sent to any server, are not stored by us, and are erased the moment you refresh or close the page. This is deliberate: it is sensitive health information, so we chose not to collect it at all. **We do not know who completed the questionnaire or what result they received.**

### 4.3 The chat (AI assistant)

When you send a message in the chat, the content of the conversation and the interface language are transmitted to our chat server, together with a random technical identifier used solely for rate limiting and linked to you in no way. **We do not store the content of conversations and do not build any history or user profile from them.** When you close the page, the conversation disappears. On AI processing, see section 6.

### 4.4 Technical data at our hosting providers

As with any website, our hosting providers (section 7) record standard server-log data for every request - including IP address, browser type and the page requested - for operations, security and troubleshooting, under their own policies. We do not use these logs to identify visitors.

### 4.5 The admin panel

The Site has a closed content-management panel (\`/admin\`) intended for authorised staff only; it is not accessible to visitors. Access is via a Google account. For administrative users only, we retain an email address, the Google account display name, and role permissions. This section is not relevant to ordinary visitors.

## 5. Cookies and tracking

**The Site sets no cookies of its own.** There is no Google Analytics, no Meta/Facebook pixel, no behavioural analytics, no session recording, and no advertising or cross-site tracking networks.

Our infrastructure providers (for example Cloudflare) may set a technical or security cookie required for attack protection and traffic routing. Such cookies are not used for advertising or profiling.

## 6. Use of artificial intelligence (AI)

**Please read this section before using the chat.**

### 6.1 How it works

The Site's chat is an automated assistant built on a language model. It works as follows:

1. your message is converted into a mathematical representation (an embedding) using Cloudflare's Workers AI;
2. that representation is used to locate the most relevant passages **from the Site's own content**, held in a Cloudflare Vectorize index;
3. your message, the earlier messages in the conversation and the retrieved passages are sent to the **Google Gemini** API, which generates the answer;
4. the answer is streamed back to your browser together with the sources from the Site.

In other words: **the content of your messages is transferred to Cloudflare's and Google's servers.** Their processing is governed by their own terms and privacy policies (linked in section 7).

### 6.2 What not to type in the chat

The chat is meant for general questions about the Site's content. **Do not enter your name, phone number, ID number, address, health-fund details, military service number, identifying details of another person, or an identifiable personal account of your medical condition.** If such details are entered anyway, they are passed to the third parties listed above, and we cannot retrieve or delete them from those parties on your behalf.

### 6.3 Limits of the answers

Answers are generated automatically and may be wrong, incomplete or out of date. They are **not medical, psychological, legal or insurance advice**, do not constitute a diagnosis, and are no substitute for a professional. See the full disclaimer in the Terms of Use.

### 6.4 Distress and suicide detection

The Site runs an automated mechanism that detects phrases in chat messages suggesting self-harm or suicidal thoughts and immediately displays emergency and support numbers. It is important to understand its limits:

* it is phrase-based and may miss real distress or trigger on a false positive;
* **no human reads conversations in real time**; there is no human monitoring of the chat;
* the system does not alert any emergency service, does not notify anyone, and does not locate you;
* the Site **is not an emergency service and is not a helpline**.

**In immediate distress: ERAN 1201 · Magen David Adom 101 · Police 100 · or go to your nearest emergency room.**

## 7. Third parties and subprocessors

We rely on the following providers to run the Site. Each has its own privacy policy:

* **Render** - hosts the Site and the content API. It receives technical server data.
* **Cloudflare** - runs the chat server and network protection. It receives technical server data and chat message content.
* **Google (Gemini)** - generates the chat answers. It receives chat message content.
* **Google Identity Services** - content-administrator sign-in only. It receives the email and name of administrative users (not of visitors).

Their privacy policies: [Render](https://render.com/privacy) · [Cloudflare](https://www.cloudflare.com/privacypolicy/) · [Google](https://policies.google.com/privacy).

Beyond this, we do not transfer information to anyone, except where required by law, court order or a competent authority's demand, or to protect our rights.

## 8. Transfers outside Israel

The servers of the providers listed in section 7 are located, in whole or in part, outside Israel - including in the United States and the European Union. Using the Site, and the chat in particular, involves transferring the information described above outside Israel, subject to those providers' safeguards.

## 9. Retention and deletion

* **Questionnaire answers** - not retained at all.
* **Chat conversation content** - not stored by us. It exists in your browser until you close the page.
* **Preferences stored in your browser** - remain on your device until you clear them.
* **Server logs at providers** - retained under each provider's policy, generally for a short period, for security and operations.
* **Administrator accounts** - retained while the permission is in force.

**The Site accepts no file uploads from visitors** (images, documents or any other file), so there are no visitor files to retain or delete.

## 10. Security

Traffic to the Site and to the chat server is encrypted over HTTPS, and access to the admin panel is restricted by Google sign-in and role-based permissions. Because we operate no database of visitor details, there is no such database on the Site to leak.

That said, no system is entirely immune, and we cannot guarantee absolute security.

## 11. Your rights

Under Israel's Protection of Privacy Law, 5741-1981 and its regulations - and, where the EU GDPR applies to you, under it as well - you have rights to access information held about you, to correct it, to delete it, to restrict its processing and to object to processing.

**Please note:** the Site collects no identifying details, operates no user accounts, and does not retain conversation content or questionnaire answers. Therefore, in the overwhelming majority of cases **we hold no information that can be linked to you**, and we will be unable to locate such information even if asked. To exercise your rights, write to [${CONTACT_EMAIL}](mailto:${CONTACT_EMAIL}). We will respond within a reasonable time.

For information held by the providers in section 7 (server logs, for example), please approach them directly under their own policies.

## 12. Links to external sites

The Site links to external sites and services, including support organisations, government bodies, communities and professional sources. Their privacy practices are unrelated to this policy, and we are not responsible for their content, their services or how they handle your information. We recommend reading their policies before providing any details.

## 13. Changes to this policy

We may update this policy from time to time. The date of the most recent update appears at the top of the page. Continued use of the Site after an updated version is published constitutes acceptance of it. We recommend reviewing this page periodically.

## 14. Governing law and jurisdiction

This policy is governed exclusively by the laws of the State of Israel. The competent courts of the Tel Aviv-Jaffa District have exclusive jurisdiction over any dispute relating to it.

## 15. Contact us

For questions, requests or complaints regarding privacy: [${CONTACT_EMAIL}](mailto:${CONTACT_EMAIL}).

See also the Site's [Terms of Use](/terms-of-use).
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
