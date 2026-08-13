import React from 'react';
import LegalPage from '@/components/LegalPage';

// ---------------------------------------------------------------------------
// PLACEHOLDERS - keep these in sync with PrivacyPolicy.jsx.
// OPERATOR is the legal entity responsible for the site. There is no registered
// entity yet, so it ships as a visible placeholder rather than a guessed name.
// ---------------------------------------------------------------------------
const OPERATOR_HE = '[שם המפעיל]';
const OPERATOR_EN = '[ENTITY]';
const CONTACT_EMAIL = 'shakedash912000@gmail.com';

const UPDATED_HE = '13 באוגוסט 2026';
const UPDATED_EN = '13 August 2026';

const he = `
## 1. קבלת התנאים

תנאי שימוש אלה מסדירים את השימוש באתר **ptsd-il.site** ("האתר"), המופעל על ידי ${OPERATOR_HE} ("אנחנו"). עצם הגלישה באתר, השימוש בשאלון או בצ'אט מהווים הסכמה מלאה לתנאים אלה ול[מדיניות הפרטיות](/privacy-policy). אם אינך מסכים/ה לתנאי כלשהו - אנא הפסק/י להשתמש באתר.

התנאים נכתבו בלשון פנייה כללית ומיועדים לכל המגדרים.

## 2. מהו השירות

האתר הוא **מאגר מידע וכלים לעזרה עצמית** בנושא פוסט-טראומה (PTSD) עבור נפגעי טראומה בישראל ובני משפחותיהם: מידע מקצועי, כלים להתמודדות, שאלון איתור עצמי, מידע על דרכי טיפול, זכויות וקהילות תמיכה, וכן צ'אט אוטומטי המבוסס על תוכן האתר.

* השימוש באתר **חינם לחלוטין**.
* **אין באתר הרשמה, חשבונות משתמש, מנויים או תשלומים.** אין דבר לחדש, לבטל או להפסיק, ואיננו גובים תשלום כלשהו בשום שלב.
* האתר **אינו מספק טיפול**, אינו מפעיל מטפלים ואינו מתווך בין משתמשים למטפלים.
* התכנים המקצועיים באתר נכתבו בשיתוף עם [מטיב - המרכז לפסיכוטראומה](https://metiv.org/). שיתוף זה אינו הופך את האתר לשירות קליני ואינו יוצר יחסי מטפל-מטופל.

## 3. הבהרה רפואית - חשוב מאוד

**האתר אינו מספק ייעוץ רפואי, נפשי, משפטי, ביטוחי או מקצועי מכל סוג.**

* התכנים באתר הם מידע כללי בלבד, שאינו מותאם למצבך האישי.
* **השימוש באתר אינו יוצר יחסי מטפל-מטופל** בינך לבינינו או בין מי מהגורמים המשתתפים בו.
* אין להסתמך על תוכן האתר כדי לאבחן מצב רפואי, להתחיל טיפול, להפסיק טיפול או לשנות טיפול קיים - לרבות תרופות. **החלטות כאלה יש לקבל אך ורק בייעוץ עם איש מקצוע מוסמך.**
* **שאלון האיתור העצמי אינו אבחון.** הוא כלי סינון (screening) בלבד, המבוסס על שאלון PCL-5, ותוצאותיו אינן קובעות אם יש או אין לך PTSD. תוצאה גבוהה אינה אבחנה, ותוצאה נמוכה אינה שוללת קיומה של בעיה. בכל מקרה - יש לפנות לאיש מקצוע.
* המידע על זכויות, ועדות ומסלולי טיפול הוא כללי, עשוי להשתנות ואינו מהווה ייעוץ משפטי. את המידע המחייב יש לאמת מול הגורם הרשמי הרלוונטי.

## 4. מצבי חירום

**האתר אינו שירות חירום, אינו קו סיוע ואינו מנוטר על ידי אדם.** אף אחד אינו קורא את מה שנכתב בו בזמן אמת, ואף גורם אינו מוזעק בעקבות שימוש באתר.

אם את/ה או אדם אחר בסכנה מיידית, בסיכון לפגיעה עצמית או במחשבות אובדניות - יש לפנות עכשיו לאחד מאלה:

* **ער"ן - עזרה ראשונה נפשית: 1201** (גם בוואטסאפ)
* **מד"א: 101**
* **משטרה: 100**
* **חדר המיון הקרוב לביתך**

## 5. גיל

האתר מיועד לשימוש מגיל 18 ומעלה. משתמשים מתחת לגיל 18 נדרשים להשתמש באתר בליווי ובאישור הורה או אפוטרופוס. תכני "תכנים לילדים" באתר מיועדים לשימוש בליווי מבוגר.

## 6. הצ'אט האוטומטי ובינה מלאכותית

הצ'אט באתר הוא **עוזר אוטומטי המבוסס על מודל שפה (AI)**, ולא אדם. השימוש בו כפוף לתנאים אלה:

* התשובות נוצרות אוטומטית ועשויות להיות **שגויות, חלקיות, לא מדויקות או לא מעודכנות**. אין להסתמך עליהן כעל מקור סמכותי.
* הצ'אט עונה רק על נושאים המכוסים בתוכן האתר. שאלות שאינן קשורות לתוכן האתר לא ייענו.
* **תוכן ההודעות שלך נשלח לספקי צד שלישי** (Cloudflare ו-Google) לצורך יצירת התשובה. פירוט מלא במדיניות הפרטיות.
* **אין להזין בצ'אט פרטים מזהים** - שלך או של אדם אחר: שם, טלפון, ת"ז, כתובת, מספר אישי, פרטי קופת חולים או תיאור מזוהה של מצב רפואי.
* השימוש בצ'אט מוגבל בקצב (עד 20 הודעות בשעה למזהה שיחה) כדי למנוע ניצול לרעה.
* אין להשתמש בצ'אט כדי לייצר תוכן פוגעני, מטעה, בלתי חוקי או כזה המעודד פגיעה עצמית או פגיעה באחרים, ואין לנסות לעקוף את מגבלות המערכת (לרבות ניסיונות "prompt injection" או חילוץ הוראות המערכת).
* מנגנון זיהוי המצוקה שבצ'אט הוא כלי עזר בלבד. הוא עלול לפספס, אינו מהווה ניטור ואינו מזעיק סיוע. ראו סעיף 4.

## 7. שימושים אסורים

בעת השימוש באתר, אין:

* להעתיק, לשכפל, להפיץ, לשדר, לפרסם או ליצור יצירות נגזרות מתוכן האתר, אלא לשימוש אישי ולא מסחרי;
* לבצע הנדסה לאחור, פירוק או ניסיון לחשוף קוד מקור, מפתחות או הוראות מערכת;
* לגרד (scraping) תוכן באופן אוטומטי, להפעיל בוטים או סורקים למעט מנועי חיפוש מקובלים;
* לעקוף או לנסות לעקוף מגבלות קצב, אמצעי אבטחה או בקרות גישה, לרבות ניסיון גישה לאזור הניהול;
* להעמיס על האתר או לשבש את פעולתו (לרבות מתקפות מניעת שירות);
* להשתמש באתר לכל מטרה בלתי חוקית, פוגענית, מטרידה או מפרה זכויות של אחר;
* להתחזות לאדם או לגוף כלשהו, לרבות לצוות האתר או לגורם רפואי.

אנחנו רשאים לחסום גישה, להגביל שימוש או לנקוט בכל אמצעי סביר אחר כלפי מי שמפר סעיף זה, ללא הודעה מוקדמת.

## 8. קניין רוחני

מלוא זכויות היוצרים והקניין הרוחני בתוכן האתר, בעיצובו, בקוד שלו ובאופן ארגון המידע שייכים ל${OPERATOR_HE} ו/או לבעלי הזכויות מטעמו, לרבות שותפי תוכן.

מותר לך לצפות בתוכן, לשמור עותק ולהדפיס אותו **לשימוש אישי, לא מסחרי בלבד**. כל שימוש אחר - לרבות פרסום מחדש, שילוב באתר או ביישום אחר, שימוש מסחרי או שימוש לאימון מודלים - מחייב אישור מראש ובכתב.

סימני מסחר, שמות וסמלים של צדדים שלישיים המופיעים באתר שייכים לבעליהם.

## 9. תוכן ושירותים של צדדים שלישיים

האתר כולל קישורים והפניות לאתרים, לארגונים, לקהילות ולשירותים חיצוניים. הפניות אלה ניתנות לנוחותך בלבד ואינן מהוות המלצה, הסכמה או אחריות שלנו לגביהם. איננו שולטים בתכנים, בזמינות, באיכות או במדיניות של גורמים אלה, ואיננו אחראים להם או לכל נזק שייגרם משימוש בהם. כל התקשרות עם גורם חיצוני היא באחריותך בלבד.

## 10. זמינות השירות ושינויים בו

האתר ניתן **כמות שהוא ("AS IS") וכפי שהוא זמין ("AS AVAILABLE")**. איננו מתחייבים לזמינות רציפה, לפעולה ללא תקלות או שגיאות, לזמינות הצ'אט או לשמירה על תכנים כלשהם. אנחנו רשאים בכל עת, לפי שיקול דעתנו וללא הודעה מוקדמת, לשנות את האתר, להוסיף או להסיר תכנים ותכונות, להשעות את פעילותו או להפסיקה כליל.

## 11. הגבלת אחריות

במידה המרבית המותרת על פי דין:

* התוכן והשירותים באתר ניתנים **ללא כל אחריות מכל סוג**, מפורשת או משתמעת, לרבות אחריות להתאמה למטרה מסוימת, לדיוק, לשלמות או לעדכניות המידע;
* לא נישא באחריות לכל נזק - ישיר, עקיף, תוצאתי, מיוחד או אחר - הנובע מהשימוש באתר, מהסתמכות על תוכן שבו, מתוצאות השאלון, מתשובות הצ'אט, מאי-זמינות האתר או משימוש באתרים חיצוניים אליהם הוא מפנה;
* אחריותנו הכוללת, ככל שתקום למרות האמור, לא תעלה על 1 ש"ח.

**אין באמור כדי לגרוע מאחריות שלא ניתן להגבילה או לשלול על פי דין**, ובכלל זה במקרים של מעשה שנעשה בזדון.

## 12. שיפוי

בשימוש באתר את/ה מתחייב/ת לשפות אותנו בגין כל תביעה, דרישה, נזק, הפסד או הוצאה (לרבות שכר טרחת עורך דין סביר) שייגרמו לנו עקב הפרת תנאים אלה על ידך, שימוש בלתי חוקי או בלתי מורשה שלך באתר, או פגיעה שלך בזכויות צד שלישי.

## 13. שינויים בתנאים

אנחנו רשאים לעדכן תנאים אלה מעת לעת. תאריך העדכון האחרון מופיע בראש העמוד. שינוי מהותי ייכנס לתוקף עם פרסומו באתר, והמשך שימוש באתר לאחר מכן מהווה הסכמה לגרסה המעודכנת. מומלץ לעיין בעמוד זה מדי פעם.

## 14. הפסקת שימוש

אנחנו רשאים להגביל, להשעות או לחסום את גישתך לאתר או לחלק ממנו, בכל עת ולפי שיקול דעתנו, בין היתר במקרה של הפרת תנאים אלה - ללא הודעה מוקדמת וללא חובת נימוק. את/ה רשאי/ת להפסיק להשתמש באתר בכל רגע.

## 15. הדין החל וסמכות שיפוט

על תנאים אלה ועל כל הנובע מהם או הקשור אליהם יחולו דיני מדינת ישראל בלבד, ללא כללי ברירת הדין שבהם. סמכות השיפוט הבלעדית נתונה לבתי המשפט המוסמכים במחוז תל אביב-יפו.

אם ייקבע כי הוראה כלשהי בתנאים אלה אינה תקפה או אינה ניתנת לאכיפה, יתר ההוראות יעמדו בתוקפן.

## 16. יצירת קשר

לשאלות בנוגע לתנאים אלה: [${CONTACT_EMAIL}](mailto:${CONTACT_EMAIL}).

ראו גם את [מדיניות הפרטיות](/privacy-policy) של האתר.
`;

const en = `
> The Hebrew version of these terms is the binding one. This English translation is provided for convenience; in any conflict, the Hebrew text prevails.

## 1. Acceptance of terms

These Terms of Use govern your use of **ptsd-il.site** ("the Site"), operated by ${OPERATOR_EN} ("we", "us"). Browsing the Site and using the questionnaire or the chat constitute full acceptance of these terms and of the [Privacy Policy](/privacy-policy). If you do not agree with any term, please stop using the Site.

## 2. What the service is

The Site is an **information and self-help resource** on post-traumatic stress disorder (PTSD) for trauma survivors in Israel and their families: professional information, coping tools, a self-screening questionnaire, information on treatment pathways, rights and support communities, and an automated chat based on the Site's own content.

* Use of the Site is **entirely free**.
* **There is no registration, no user accounts, no subscriptions and no payments.** There is nothing to renew, cancel or terminate, and we never charge you at any stage.
* The Site **does not provide treatment**, does not employ therapists and does not broker contact between users and therapists.
* The professional content on the Site was written in partnership with [Metiv - The Israel Psychotrauma Center](https://metiv.org/). That partnership does not make the Site a clinical service and does not create a therapist-patient relationship.

## 3. Medical disclaimer - important

**The Site does not provide medical, psychological, legal, insurance or any other professional advice.**

* The content on the Site is general information only and is not tailored to your personal situation.
* **Using the Site does not create a therapist-patient relationship** between you and us or any party involved in the Site.
* Do not rely on the Site's content to diagnose a medical condition, to start treatment, to stop treatment or to change existing treatment - including medication. **Such decisions must be made only in consultation with a qualified professional.**
* **The self-screening questionnaire is not a diagnosis.** It is a screening tool only, based on the PCL-5, and its result does not determine whether you have PTSD. A high score is not a diagnosis, and a low score does not rule out a problem. In either case, consult a professional.
* Information about rights, committees and treatment pathways is general, may change, and does not constitute legal advice. Binding information must be verified with the relevant official body.

## 4. Emergencies

**The Site is not an emergency service, not a helpline, and is not monitored by a human being.** Nobody reads what is written on it in real time, and no service is dispatched as a result of using it.

If you or someone else is in immediate danger, at risk of self-harm, or having suicidal thoughts, contact one of the following now:

* **ERAN - Emotional First Aid: 1201** (also on WhatsApp)
* **Magen David Adom: 101**
* **Police: 100**
* **Your nearest emergency room**

## 5. Age

The Site is intended for users aged 18 and over. Users under 18 must use the Site with the involvement and consent of a parent or guardian. The Site's "For Children" content is intended for use alongside an adult.

## 6. The automated chat and AI

The chat on the Site is an **automated assistant powered by a language model (AI)**, not a person. Its use is subject to the following:

* Answers are generated automatically and may be **wrong, incomplete, inaccurate or out of date**. Do not treat them as an authoritative source.
* The chat only answers on topics covered by the Site's content. Questions unrelated to that content will not be answered.
* **The content of your messages is sent to third-party providers** (Cloudflare and Google) in order to generate the answer. Full detail is in the Privacy Policy.
* **Do not enter identifying details in the chat** - yours or anyone else's: name, phone number, ID number, address, service number, health-fund details or an identifiable description of a medical condition.
* Chat use is rate-limited (up to 20 messages per hour per conversation ID) to prevent abuse.
* Do not use the chat to generate harmful, misleading or unlawful content, or content encouraging self-harm or harm to others, and do not attempt to circumvent the system's limits (including prompt-injection attempts or extracting system instructions).
* The chat's distress-detection mechanism is an aid only. It may miss cases, does not constitute monitoring, and does not summon help. See section 4.

## 7. Prohibited uses

When using the Site, you must not:

* copy, reproduce, distribute, transmit, publish or create derivative works from the Site's content, other than for personal, non-commercial use;
* reverse engineer, decompile or attempt to expose source code, keys or system instructions;
* scrape content automatically, or run bots or crawlers other than conventional search engines;
* circumvent or attempt to circumvent rate limits, security measures or access controls, including attempting to reach the admin area;
* overload the Site or disrupt its operation (including denial-of-service attacks);
* use the Site for any unlawful, abusive or harassing purpose, or one that infringes another's rights;
* impersonate any person or body, including the Site's staff or a medical professional.

We may block access, restrict use or take any other reasonable measure against anyone breaching this section, without prior notice.

## 8. Intellectual property

All copyright and intellectual property rights in the Site's content, design, code and information architecture belong to ${OPERATOR_EN} and/or its rights holders, including content partners.

You may view the content, save a copy and print it **for personal, non-commercial use only**. Any other use - including republication, incorporation into another site or application, commercial use, or use for training models - requires prior written permission.

Third-party trademarks, names and logos appearing on the Site belong to their respective owners.

## 9. Third-party content and services

The Site includes links and references to external sites, organisations, communities and services. These are provided for your convenience only and do not constitute a recommendation, endorsement or warranty by us. We do not control their content, availability, quality or policies, and we are not responsible for them or for any damage arising from their use. Any dealing with an external party is at your own responsibility.

## 10. Availability and changes to the service

The Site is provided **"AS IS" and "AS AVAILABLE"**. We do not undertake that it will be continuously available, free of faults or errors, that the chat will be available, or that any content will be preserved. We may at any time, at our discretion and without prior notice, modify the Site, add or remove content and features, suspend its operation or discontinue it entirely.

## 11. Limitation of liability

To the maximum extent permitted by law:

* the content and services on the Site are provided **without warranty of any kind**, express or implied, including any warranty of fitness for a particular purpose, accuracy, completeness or currency of information;
* we shall not be liable for any damage - direct, indirect, consequential, special or otherwise - arising from use of the Site, reliance on its content, questionnaire results, chat answers, unavailability of the Site, or use of external sites it links to;
* our aggregate liability, should any arise despite the above, shall not exceed ILS 1.

**None of the above limits liability that cannot be limited or excluded by law**, including in cases of wilful misconduct.

## 12. Indemnity

By using the Site you undertake to indemnify us against any claim, demand, damage, loss or expense (including reasonable legal fees) incurred by us as a result of your breach of these terms, your unlawful or unauthorised use of the Site, or your infringement of a third party's rights.

## 13. Changes to these terms

We may update these terms from time to time. The date of the most recent update appears at the top of the page. A material change takes effect upon publication on the Site, and continued use thereafter constitutes acceptance of the updated version. We recommend reviewing this page periodically.

## 14. Termination

We may restrict, suspend or block your access to the Site or any part of it, at any time and at our discretion, including in the event of a breach of these terms - without prior notice and without obligation to give reasons. You may stop using the Site at any time.

## 15. Governing law and jurisdiction

These terms, and anything arising from or connected to them, are governed exclusively by the laws of the State of Israel, without regard to its conflict-of-law rules. The competent courts of the Tel Aviv-Jaffa District have exclusive jurisdiction.

If any provision of these terms is held invalid or unenforceable, the remaining provisions shall remain in force.

## 16. Contact us

For questions regarding these terms: [${CONTACT_EMAIL}](mailto:${CONTACT_EMAIL}).

See also the Site's [Privacy Policy](/privacy-policy).
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
