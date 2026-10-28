# Chatbot playbooks - safety review (clinical-safety and owner-rules lens)

Reviewed: `he.json` (30 rows), `selection.md`, `worker/src/lib/{prompt,qa,crisis,chat}.ts`, spec section 5.
Facts below were checked against the site content in `scripts/metiv-seed/he/*.json`,
`scripts/metiv-seed/copy/chrome.json` and `src/pages/metiv-demos/shared/patient/data/*.json`.

## Summary

The set is good. No efficacy wording in any answer, no dashes other than `-`, bot self-reference is masculine throughout,
crisis numbers are present wherever they should be. The problems are structural more than textual:

1. **Routing hazard (high).** Only ONE crisis row is force-injected when `detectCrisis` fires, and `detectCrisis` only fires on
   suicide / self-harm wording. Four crisis rows (`panic-attack-now`, `flashback-now`, `loved-one-episode-now`,
   `overwhelmed-now`) have no suicide content, yet they compete for that slot. "אני בהתקף חרדה ואני רוצה למות" can pick
   `panic-attack-now` as the crisis playbook, and since the top regular match is the same group it is deduplicated, so
   `suicidal-thoughts` is never injected. The bot then answers with breathing steps and a trailing 1201.
   **Fix:** set `crisis: false` on those four rows. The flag only matters when the detector fires, so they still match as
   normal (strong/weak) playbooks for panic, flashback, and so on, and the crisis slot always goes to
   `suicidal-thoughts` / `self-harm` / `someone-else-suicidal`. Also add a one-line suicide branch to each of the four (text below)
   as a second layer.
2. **Self vs. other mis-route (medium).** bge-m3 will score "אשתי אמרה שהיא לא רוצה לחיות" close to
   "אני לא רוצה לחיות יותר". If `suicidal-thoughts` wins, the bot asks a worried spouse "are you safe?". Each of the two rows needs a
   branch for the other case (text below).
3. **No method/means rule (medium).** Nothing says "never give method, dose or lethality information". Add it to all 3 suicide rows.
   Lethal-means safety (moving pills or a weapon away) is standard crisis-line practice and is especially relevant for
   reservists with a personal weapon, but it is NOT on the site. It is marked as an owner/clinician decision below.
4. **"It's over, you're safe" in `flashback-now` (medium).** During rocket fire ("שמעתי בום ואני בפלאשבק") or ongoing abuse,
   that can be false. Needs a real-danger branch.
5. **`who-are-you` cannot answer "is this saved?".** Legal pages are not indexed, so the guidance "only what the legal pages say"
   gives the model nothing. The privacy facts must be in the playbook (text below, copied from `metiv-legal-docs.json`).
   "זה אנונימי?" must not get a flat "yes": the privacy policy says hosting providers log IP addresses.
6. **Gaps:** domestic violence danger, child in danger / abuse disclosure, minor user, fear of harming someone else. Proposed rows below.
   None of the hotlines these need (118, 105) are on the site, so the rows only hardcode 100/101/1201 and the owner decides
   whether to add the others to the site first.
7. **ERAN WhatsApp** is a fixed site fact (ERAN card in `metiv-nonprofit-options`, `PATIENT_HUB.crisisLines.eranWhatsapp`, and
   the "עזרה עכשיו" popover on every page). The "if it appears in SOURCES" condition in the crisis rows is unnecessary and makes
   the model drop it. Make it unconditional and point to the button for the link.

Outside the playbooks (code, not editable here) - see the last section: the crisis playbook is matched on the latest message only,
so the reply to "את/ה בטוח/ה עכשיו?" ("לא") gets no playbook at all.

---

## Per row

Wording: "replace X with Y" means exact text in `guidance` or `answer`. "Add" lines go at the stated position.

### suicidal-thoughts - change

- Opening example and answer line 1: "אני שמח שכתבת" reads wrong next to "I want to kill myself".
  - guidance: replace `(למשל: "אני שומע אותך, ואני שמח שכתבת")` with `(למשל: "אני שומע אותך, וטוב שכתבת לי")`.
  - answer: replace `אני שומע אותך, ואני שמח שכתבת את זה. זה נשמע כבד מאוד.` with `אני שומע אותך, וטוב שכתבת לי. זה נשמע כבד מאוד.`
- WhatsApp unconditional:
  - guidance: replace `אם ב-SOURCES מופיעה אפשרות וואטסאפ של ער״ן, לציין שאפשר גם לכתוב.` with `אפשר גם לכתוב לער״ן בוואטסאפ, דרך כפתור **עזרה עכשיו**.`
- "Already did something" branch: going to the ER alone is the wrong first instruction after an attempt.
  - guidance: replace `**מד״א 101**, **משטרה 100** או חדר המיון הקרוב.` with `**מד״א 101** או **משטרה 100** עכשיו. חדר המיון רק עם מישהו שמלווה, לא לבד.`
  - answer: replace `להתקשר מיד ל**מד״א 101**, ל**משטרה 100**, או להגיע לחדר המיון הקרוב.` with `להתקשר מיד ל**מד״א 101** או ל**משטרה 100**. אפשר גם לבקש ממישהו שייקח אותך לחדר המיון הקרוב.`
- Add after the "משפטים קצרים..." bullet:
  `- לא לשאול על שיטה ולא לתת שום מידע על אמצעים, כמויות, תרופות או מקומות, גם אם נשאל ישירות. במקרה כזה לומר בעדינות שאני לא יכול לעזור בזה, ולחזור ל-1201 ול"את/ה בטוח/ה עכשיו?".`
- Add as the first bullet (mis-route guard):
  `- אם ההודעה מתארת אדם אחר (בן/בת זוג, ילד, חבר) ולא את הכותב/ת: לענות כמו לבן משפחה שדואג - סכנה מיידית: מד״א 101 / משטרה 100; אחרת ער״ן 1201, שמתאים גם לבני משפחה; להישאר בקשר איתו/ה אם זה בטוח; לא להבטיח סודיות. לא לשאול את הכותב/ת "את/ה בטוח/ה?" כאילו מדובר בו/בה.`
- Add (minor user, see gap rows):
  `- אם נראה שהכותב/ת צעיר/ה (מזכיר/ה בית ספר, הורים, גיל מתחת ל-18): להוסיף בעדינות לספר עכשיו למבוגר/ת שסומכים עליו/ה. ער״ן 1201 פתוח גם לבני נוער.`
  (ERAN serving youth is a fact about ERAN, not on the site. If the owner wants only site facts, drop the last sentence.)
- Owner/clinician decision (lethal means, not on the site). If approved, add after the "לא להישאר לבד" bullet:
  `- אם יש בהישג יד משהו שאפשר לפגוע בו בעצמך (כדורים, נשק): להציע להרחיק אותו עכשיו או לתת למישהו אחר להחזיק אותו.`
  and in the answer after the "לא צריך להישאר עם זה לבד." paragraph: `אם יש לידך משהו שאפשר לפגוע בו בעצמך, כמו כדורים או נשק, אפשר להרחיק אותו עכשיו או לתת למישהו אחר להחזיק אותו.`
- Paraphrases, add: `כמה כדורים צריך כדי לא להתעורר`, `אני רוצה לירות לעצמי בראש`, `תכננתי איך לעשות את זה`, `כתבתי מכתב פרידה`.
- Keep: direct safety question, 101/100/1201 fixed, "no one reads in real time" (on site, legal docs), no "יהיה בסדר", invitation to keep writing.

### self-harm - change

- Police line is attached to "thoughts" instead of "imminent danger".
  - guidance: replace `ואם יש מחשבות לשים סוף לחיים - גם **משטרה 100** או חדר המיון הקרוב.` with `ואם יש מחשבות לשים סוף לחיים, או תחושה שזה עלול לקרות עכשיו - **מד״א 101** או **משטרה 100**.`
  - answer: replace `את/ה בטוח/ה עכשיו? אם יש גם מחשבות לשים סוף לחיים, אפשר לפנות למשטרה **100** או לחדר המיון הקרוב.` with `את/ה בטוח/ה עכשיו? אם יש גם מחשבות לשים סוף לחיים, או תחושה שזה עלול לקרות עכשיו - מד״א **101** או משטרה **100**.`
- Opening: answer `אני שמח שכתבת.` replace with `טוב שכתבת.`
- Cold wording: answer `אם זה דחף שעדיין לא מומש,` replace with `אם זה דחף, ועוד לא פגעת בעצמך,`.
- WhatsApp: guidance replace `(ואם ב-SOURCES מופיע וואטסאפ של ער״ן, שאפשר גם לכתוב)` with `(אפשר גם בוואטסאפ, דרך כפתור **עזרה עכשיו**)`.
- Add the same "no method, dose or lethality information" bullet as `suicidal-thoughts`.
- Add: `- גם אחרי פנייה למד״א, לא להישאר לבד: לבקש ממישהו קרוב לבוא.` (the "don't stay alone" line currently only covers the urge case).
- Paraphrases, add: `בלעתי כדורים`, `לקחתי את כל הכדורים`. (Note `detectCrisis` does not fire on either. See code section.)

### someone-else-suicidal - change

- Add as the first bullet (mis-route guard):
  `- אם מתברר שהכותב/ת מדבר/ת על עצמו/ה: לעבור לסדר של מחשבות אובדניות אצל הכותב/ת - ער״ן 1201, "את/ה בטוח/ה עכשיו?", מד״א 101 / משטרה 100, לא להישאר לבד.`
- Add (professional asking about a patient; `detectCrisis` fires on "אובדני" so this row gets the crisis slot for therapists too):
  `- אם הפונה הוא איש/אשת מקצוע ששואל/ת על מטופל/ת: לא לייעץ קלינית ולא להעריך סיכון; בסכנה מיידית - 101 / 100; להפנות לנהלי המסגרת ולהדרכה (עמוד **הדרכה**). ער״ן 1201 פתוח גם להתייעצות.`
- Add (child at risk; paraphrases include "הבן שלי כתב מכתב פרידה", "הבת שלי פוגעת בעצמה"):
  `- אם מדובר בילד/ה או נער/ה: לא להשאיר לבד עכשיו, ובסכנה מיידית 101 / 100. להמשך - מטיב ילדים (פרטים מ-SOURCES).`
- Add the "no method information" bullet.
- The site callout this row cites also names "מוקד סה"ר" and "מיון פסיכיאטרי" (secondCircleTools.json). The existing "מענים נוספים מ-SOURCES" bullet covers them. OK.
- Owner/clinician decision (not on the site): `- אם אפשר לעשות זאת בבטחה: להרחיק אמצעים זמינים (כדורים, נשק).` Recommended for this audience (reservist families).
- Owner/clinician decision (not on the site, widely taught in gatekeeper training): `- מותר לשאול אותו/ה ישירות ובפשטות אם הוא/היא חושב/ת לשים סוף לחיים.` Do not add the "asking doesn't plant the idea" claim, that is a clinical claim.
- Keep: no secrecy promise, stay in contact if safe, 1201 for relatives, don't assess risk, care for the writer.

### panic-attack-now - change

- Set `"crisis": false` (routing, see summary).
- Add as the first bullet:
  `- אם בהודעה יש גם מחשבות למות או לפגוע בעצמך: קודם ער״ן 1201, "את/ה בטוח/ה עכשיו?", ובסכנה מיידית מד״א 101 / משטרה 100. רק אחר כך תרגיל.`
- Add: `- אם יש עכשיו אזעקה או סכנה ממשית: קודם להגיע למרחב מוגן, ורק שם לנשום.` (Home Front Command instruction, not clinical, not on the site. Owner decision; the "פאניקה אחרי אזעקה" paraphrase makes it relevant.)
- The site FAQ says the attack "חולף מעצמו ואינו מסוכן". Add to the last bullet: `לא לומר שזה "לא מסוכן" - הבוט לא יכול לדעת שזו חרדה.`
- Safety line wording: replace `אם יש כאב בחזה, עילפון, או שלא ברור שזו חרדה` (guidance and answer) with `אם יש כאב או לחץ בחזה, קושי ממשי לנשום, עילפון, או שלא ברור שזו חרדה`.
- Keep: 3 numbered steps, no physiology, no "מכבה" (the site FAQ has "זה מכבה את תגובת החירום" and "משחררת אנדורפינים" - the guard against copying them from SOURCES is correct and necessary).

### flashback-now - change

- Set `"crisis": false`.
- Opening asserts the danger is over. Replace guidance `"אני כאן. מה שאת/ה מרגיש/ה עכשיו הוא זיכרון. זה כבר נגמר, ואת/ה כאן, עכשיו."` with `"אני כאן. מה שעולה עכשיו הוא זיכרון של מה שהיה. את/ה כאן, עכשיו."`, and the same in the answer (first line).
- Add right after the opening bullet:
  `- אם יש עכשיו אזעקה, סכנה ממשית, או שמי שפגע נמצא בסביבה: הבטיחות קודמת - מרחב מוגן, או משטרה 100. לא לומר שהסכנה נגמרה.`
- Add the same suicide branch as `panic-attack-now`.
- Add (dissociation vs. a medical problem; "אני לא יודעת איפה אני"): `- אם הבלבול לא עובר, או שיש תחושה גופנית חריגה - מד״א 101.` Owner decision (not on the site).
- Answer step 1 Hebrew: `אמור/אמרי לעצמך בקול איפה את/ה נמצא/ת עכשיו.` is fine. Keep.

### loved-one-episode-now - change

- Set `"crisis": false`.
- Safety line: keep (not on the site, but essential; the site FAQ has no safety branch at all). Extend:
  - guidance: replace `לשמור מרחק ולהתקשר ל**משטרה 100**;` with `לשמור מרחק, לצאת מהחדר עם הילדים אם יש, ולהתקשר ל**משטרה 100**. אם יש נשק בהישג יד ויש חשש לאלימות - משטרה 100 מיד;`
  - answer: replace `**אם מישהו בסכנה להיפגע, כולל את/ה** - לשמור מרחק ולהתקשר ל**משטרה 100**.` with `**אם מישהו בסכנה להיפגע, כולל את/ה** - לשמור מרחק, לצאת מהחדר (עם הילדים, אם יש), ולהתקשר ל**משטרה 100**.`
- The site FAQ also says "אל תחשפו את הסיטואציה לאחרים שלא צריך - שמרו על הכבוד". Add: `- לא להציג "לשמור על הכבוד" כסיבה לא להזעיק עזרה כשיש סכנה.`
- Paraphrase `בן זוגי עם פוסט טראומה מתפרץ עכשיו` is an anger/violence case more than a flashback; keep it here (the safety line is first) but it also belongs in the new `domestic-violence-danger` row.
- "דיבור על פגיעה עצמית - ער״ן 1201": add `, ובסכנה מיידית מד״א 101` .

### overwhelmed-now - change

- Set `"crisis": false` (the detector never fires on its phrases; when it fires, the message has suicide words and `suicidal-thoughts` must win).
- 1201 appears twice in the answer. Replace the answer block from `קודם אני רוצה לשאול:` to `מעמוד **תרגילי הרגעה**.` with:
  ```
  קודם אני רוצה לשאול: **את/ה בטוח/ה עכשיו? יש מחשבות לפגוע בעצמך?** בסכנה מיידית - **מד״א 101** או **משטרה 100**.

  שני דברים שאפשר לעשות ממש עכשיו:
  - **לדבר עם אדם:** ער״ן **1201**, בטלפון או בוואטסאפ. ואם יש מישהו קרוב, לבקש שיהיה איתך.
  - **לעצור לרגע:** תרגיל נשימה או קרקוע קצר מעמוד **תרגילי הרגעה**.
  ```
- Opening: `אני שמח שכתבת.` replace with `טוב שכתבת.`
- Guidance: replace `וואטסאפ אם מופיע ב-SOURCES` with `וגם בוואטסאפ, דרך כפתור **עזרה עכשיו**`. Add `- לומר שאני עוזר אוטומטי ואף אחד לא קורא את השיחה בזמן אמת.`
- Overlap: `family-member-own-support` has `אני לא מחזיקה יותר את הבית לבד`. Acceptable (that row has 1201), no change.

### sexual-assault - change

- Keep `crisis: false`.
- Do not send a survivor to another page for the numbers. 1202 (women) / 1203 (men) are on the site (`metiv-nonprofit-options`, indexed) and are stable national lines. Two options:
  - A (recommended): treat them as fixed facts like 1201. answer: replace `- **מרכזי הסיוע לנפגעות ולנפגעי תקיפה מינית** - קווי סיוע נפרדים לנשים ולגברים וצ'אט. המספרים מופיעים בעמוד **איפה מקבלים טיפול**.` with `- **מרכזי הסיוע לנפגעות ולנפגעי תקיפה מינית** - **1202** לנשים, **1203** לגברים, וגם צ'אט. אפשר לפנות גם בלי להחליט על שום צעד.`
  - B: keep "from SOURCES" but say in guidance `- לתת את המספרים עצמם (לא רק שם העמוד) כשהם מופיעים ב-SOURCES.`
- "Recent" line puts police first, which reads as pressure to report. guidance: replace `- אם זה קרה עכשיו או לאחרונה, או שיש סכנה: **משטרה 100**, **מד״א 101** או חדר המיון הקרוב.` with `- אם יש סכנה עכשיו: **משטרה 100**. אם יש פציעה, או שזה קרה בימים האחרונים: אפשר לפנות לטיפול רפואי (**מד״א 101** או חדר המיון הקרוב). ההחלטה אם להתלונן היא של הנפגע/ת בלבד.`
  answer: replace `**אם זה קרה עכשיו או לאחרונה, או שיש סכנה** - אפשר לפנות למשטרה **100**, למד״א **101** או לחדר המיון הקרוב.` with `**אם יש סכנה עכשיו** - משטרה **100**. **אם יש פציעה, או שזה קרה בימים האחרונים** - אפשר לפנות לטיפול רפואי, במד״א **101** או בחדר המיון הקרוב. ההחלטה אם להתלונן היא שלך.`
  Do not add "you can get treated without filing a complaint" or evidence-kit facts: true in Israel but not on the site.
- Add: `- אם הנפגע/ת קטין/ה או שהפגיעה נמשכת עכשיו: לעבור לשורת הבטיחות של ילד בסכנה (משטרה 100) - ראו שורה child-in-danger.`
- `נפגעתי מינית בילדות` is fine here (adult survivor). Keep.

### just-experienced-event - change

- The answer can be read as "wait a few weeks before asking for help". Add to guidance after the "מתי לפנות" bullet: `- לומר שגם עכשיו מותר לבקש תמיכה: שיחת התייעצות עם מטיב (**לא בטוחים אם לפנות?**) זמינה כבר עכשיו.` and in the answer after the "מתי לפנות להערכה" paragraph: `ואם קשה לך כבר עכשיו, לא צריך לחכות: אפשר לבקש שיחת התייעצות עם מטיב.`
- Remove paraphrase `הבן שלי היה עד לפיגוע אתמול` (child case; belongs to `child-after-trauma`, add it there).
- Site inconsistency (outside scope, flag to owner): ptsdInfoFaqs says evaluation "אם אין מגמת שיפור כעבור 3-4 שבועות" in one answer and "התאוששות טבעית אחרי כחודש וחצי" in another. The playbook correctly avoids a number; the site should pick one.
- Add (Israel context): `- אם האירוע עדיין נמשך (אזעקות, לחימה): קודם בטיחות פיזית לפי הנחיות פיקוד העורף.` Owner decision.

### have-ptsd-what-to-do - ok

No safety issues. Optional: "סדר צעדים שעוזר לא ללכת לאיבוד" is not an efficacy claim; keep.

### do-i-have-ptsd - change (Hebrew only)

- answer: replace `ולבדוק את זה זה לא להגזים. זה צעד של אכפתיות כלפי עצמך.` with `ולברר את זה, זה לא להגזים. זה צעד של אכפתיות כלפי עצמך.`
- Otherwise ok: no diagnosis, questionnaire framed as "not a diagnosis" (matches ptsdInfoFaqs), no invented timeframe.

### find-therapist-psychiatrist - ok

Facts match `metiv-public-options` / `treatmentSteps` (GP referral). "איך מוצאים מטפל טוב" is guarded by the no-recommendation line. Keep.

### cant-afford-treatment - ok

### waiting-for-treatment - ok

Safety line present ("לא לחכות לתור"). Keep.

### contact-metiv - ok

### which-treatment-is-best - change (one phrase)

- answer: `שיטות שעובדות עם נשימה, תנועה, מגע והרפיה` - "עובדות" reads as "work" (effective). Replace with `שיטות שמשלבות נשימה, תנועה, מגע והרפיה`.
- Guidance already bans "מחקרים מראים" and percentages. Necessary: `metiv-articles` contains "30-40 אחוזים" and treatmentSteps / selfHelpTools contain "מטרתה ... להפחית" and "מחקרים מראים". Keep the ban.

### medication-question - change

- The site states "ניתן רק על ידי פסיכיאטר/ית". In practice GPs in Israel prescribe SSRIs, so a user already on a GP prescription may read the bot as saying their prescription is wrong. Keep the site attribution but drop "רק" in the answer: replace `לפי האתר, הוא ניתן רק על ידי פסיכיאטר/ית,` with `לפי האתר, טיפול תרופתי ל-PTSD ניתן על ידי פסיכיאטר/ית,`. Add to guidance: `- אם המשתמש/ת כבר מקבל/ת תרופה מרופא/ה אחר/ת, לא לפקפק במרשם; להפנות לאותו רופא/ה.` (Site accuracy itself is outside scope, flag to owner.)
- Hebrew: guidance `או למנן תרופה` replace with `או לקבוע מינון של תרופה`.
- Safety line: replace `אם נלקחה כמות גדולה, או שיש הרגשה גופנית רעה` (guidance and answer) with `אם נלקחה כמות גדולה, שילוב עם אלכוהול, או שיש הרגשה גופנית רעה`.
- Cannabis: `rightsFaqs` lists medical cannabis as a security-forces right ("PTSD הוא כיום האבחנה ... המאושרת לטיפול בקנאביס"). Add: `- קנאביס רפואי מופיע באתר רק כזכות במסלול כוחות הביטחון. אפשר לציין את זה, בלי לומר שהוא עוזר או מתאים.`
- "לא משנים או מפסיקים תרופה בלי להתייעץ" is not on the site but is a referral, not advice. Keep (see safety-advice list).

### rights-overview - ok

### reservist-veteran-help - ok

Optional: reservists are the group where weapon access matters; covered by the suicide rows if approved.

### sleep-nightmares - ok

Correctly strips "אופטימלי", "האור הכחול פוגע בייצור מלטונין", "מסנכרנת את השעון הביולוגי" from the site tool. The three habits in the answer are on the site. Keep.

### substance-use - change

- Owner/clinician decision (not on the site; withdrawal from heavy daily alcohol or sedatives can be medically dangerous): add to guidance `- אם השימוש יומיומי וכבד, לומר שחשוב לדבר עם רופא/ה לפני שמפסיקים בבת אחת.` and to the answer after the "אני לא יכול לייעץ" paragraph: `אם השתייה או השימוש בכדורים יומיומיים, חשוב לדבר עם רופא/ה לפני שמפסיקים בבת אחת.` Recommended: it is safety, not treatment advice.
- Paraphrase `קנאביס עוזר לי עם הטראומה?`: same cannabis note as `medication-question`.
- Otherwise ok: non-judgmental, no invented rehab services.

### calm-down-now - change (Hebrew only)

- answer: replace `ואם זה מרגיש יותר מלחץ, ממש מצוקה, ער״ן **1201** זמין לשיחה.` with `ואם זה יותר מלחץ, ממש מצוקה, ער״ן **1201** זמין לשיחה.`
- Note: the calming-page descriptions (circle, 2 minutes, "אין נכון או לא נכון") are UI strings I could not verify from the seed copy (i18n keys). Owner should confirm against `/calming`.

### support-loved-one - change

- Paraphrases include `החבר שלי מתפרץ מאז האירוע`, `אנחנו רבים כל הזמן מאז שחזר מהמילואים`. No line for violence. Add after the distress-signs bullet:
  `- אם יש אלימות, איומים או פחד ממנו/ה: הבטיחות של הפונה ושל הילדים קודמת. בסכנה - **משטרה 100**. פוסט-טראומה לא מחייבת לסבול אלימות.`
  answer, add after the **לשים לב** paragraph: `**ואם יש אלימות או איומים** - הבטיחות שלך ושל הילדים קודמת. בסכנה, משטרה **100**.`
  (Avoid "PTSD is not an excuse" phrasing; it judges the loved one. "לא מחייבת לסבול" keeps the focus on the writer.)

### family-member-own-support - ok

### talk-to-child-about-parent - change

- Paraphrases `הילדה שלי בת 5 ומפחדת מאבא מאז שחזר`, `הבן שלי שואל למה אבא צועק`, `איך לשמור על הילדים כשבן הזוג עם PTSD` can signal danger at home. Add:
  `- אם יש אלימות בבית, או שהילד/ה או ההורה בסכנה: הבטיחות קודמת - **משטרה 100**. רק אחר כך איך מדברים.`
- `אבא פוסטמטי` is slang; keep it as a paraphrase for matching but add `- לא לחזור על כינויים כמו "פוסטמטי".`

### child-after-trauma - change

- Add paraphrase `הבן שלי היה עד לפיגוע אתמול` (moved from `just-experienced-event`).
- Safety bullet: replace `- בטיחות: אם הילד מדבר על רצון למות או פגיעה בעצמו, או שיש סכנה - ער״ן **1201**, ובסכנה מיידית **מד״א 101**.` with `- בטיחות: אם הילד/ה מדבר/ת על רצון למות או על פגיעה בעצמו/ה - לא להשאיר לבד, ער״ן **1201**, ובסכנה מיידית **מד״א 101** או **משטרה 100**. אם מישהו פוגע בילד/ה - ראו שורת ילד בסכנה.`

### research-participation - ok

Add one line: `- אם המשתמש/ת מספר/ת על שימוש עצמאי ב-MDMA או בחומר פסיכדלי: לא לשפוט, ובהרגשה גופנית רעה - מד״א 101.`

### therapist-courses - ok

### therapist-supervision - change

- Add paraphrases `המטופל שלי אובדני, מה עושים?`, `מטופלת סיפרה לי שהיא חושבת להתאבד`. They trigger `detectCrisis`, so the crisis slot goes to `someone-else-suicidal` (which now has a professional branch); this row should also be injected as the regular playbook.
- Add: `- אם מטפל/ת מתאר/ת מטופל/ת בסיכון מיידי: 101 / 100 ונהלי המסגרת; לא לייעץ קלינית.`

### who-are-you - change

- The guidance relies on legal pages that are not indexed. Replace the privacy bullet with the facts themselves (from `metiv-legal-docs.json`):
  `- פרטיות (מתוך מדיניות הפרטיות ותנאי השימוש, שאינם במאגר): אנחנו לא אוספים ולא שומרים את הודעות הצ'אט; הן נשלחות לספקי צד שלישי (Cloudflare ו-Google) רק כדי לייצר תשובה. ספקי האירוח רושמים נתונים טכניים כמו כתובת IP. מנגנון אוטומטי מזהה ביטויים של פגיעה עצמית ומציג מספרי חירום, והוא עלול לפספס. אף אדם לא קורא את השיחות ואף גורם לא מוזעק. לא להזין פרטים מזהים. לא לומר "אנונימי לגמרי".`
- answer: replace the **לגבי פרטיות** paragraph with:
  `**לגבי פרטיות:** האתר לא אוסף ולא שומר את הודעות הצ'אט. הן נשלחות לספקים חיצוניים רק כדי לייצר תשובה. אף אחד לא קורא את השיחה בזמן אמת, ואף גורם לא מוזעק בעקבותיה. כדאי לא לכתוב כאן פרטים מזהים, שלך או של אחרים. הפירוט המלא בעמודים **מדיניות פרטיות** ו**תנאי שימוש**.`
- `תעבירו את זה למשטרה?` is often asked by someone at risk. Add: `- אם השאלה היא אם ידווחו עליי: לענות בכנות שלא, ומיד אחר כך שבמצוקה חשוב לפנות לאדם - ער״ן 1201.`
- Add from terms: `- האתר מיועד לגיל 18 ומעלה; אם נשאל - לציין, בלי לסרב לעזור.`

---

## The "safety advice not on the site" items

`selection.md` does not actually enumerate them. These are the 7 I found in the rows that are not backed by site content
(checked by grep against the seed and the patient data):

| # | item | rows | verdict |
|---|---|---|---|
| 1 | Don't stay alone, call someone to come now | suicidal-thoughts, self-harm, overwhelmed-now | **keep**. Core crisis-line practice. Add it to overwhelmed-now (text above). |
| 2 | Don't promise to keep it secret | someone-else-suicidal | **keep**. Standard gatekeeper rule. |
| 3 | Stay with them or in contact if it is safe for you, listen without arguing | someone-else-suicidal | **keep**. The "if it is safe for you" clause matters, keep it. |
| 4 | Chest pain, fainting or "not sure it's anxiety" goes to 101 | panic-attack-now | **change**: add "לחץ בחזה, קושי ממשי לנשום" (text above). The bot cannot tell panic from a cardiac event. |
| 5 | Risk of being hurt: keep distance, call police 100 | loved-one-episode-now | **keep and extend**: leave the room with the children, weapon present goes to 100 (text above). The site FAQ has no safety branch; this is the most important addition in the set. |
| 6 | Large amount, mixing with medication, feeling physically unwell goes to 101 | self-harm, medication-question, substance-use | **keep**; add "שילוב עם אלכוהול" in medication-question. |
| 7 | Don't change or stop medication without consulting the doctor | medication-question | **keep**. It is a referral, not advice. |

Two more items that are also not on the site and need a decision:

- **Recent sexual assault: police / MDA / ER** (sexual-assault): **change** the order and add "ההחלטה אם להתלונן היא שלך" (text above).
- **"It's over, you are here now"** (flashback-now): the site's grounding content does not say it; **change** to the softer wording plus the real-danger branch.

New items proposed in this review that are not on the site (owner/clinician sign-off needed before adding):
lethal-means line (suicide rows), protected-space line (panic, flashback, just-experienced-event), heavy-use withdrawal line (substance-use),
"ask directly" line for relatives (someone-else-suicidal), persistent-confusion line (flashback-now).

---

## Proposed new rows

All `crisis: false` on purpose: `detectCrisis` does not fire on their wording, and a `true` flag would only let them steal the
crisis slot from the suicide rows when it does. They still inject as normal playbooks. Hotlines not on the site (118 welfare
ministry for domestic violence and children at risk, 105 for online harm to children) are NOT hardcoded; the guidance takes them from
SOURCES. Recommendation: add 118 to the site's help options (e.g. `metiv-nonprofit-options`) so the bot can give it.

```json
[
  {
    "_key": "domestic-violence-danger",
    "question": "בן הזוג שלי אלים כלפיי, מה לעשות?",
    "paraphrases": [
      "בעלי מרביץ לי",
      "אני מפחדת מבן הזוג שלי",
      "הוא מאיים עליי מאז שחזר מהמילואים",
      "בעלי עם פוסט טראומה ואלים בבית",
      "היא משתוללת ושוברת דברים בבית",
      "הוא איים עליי עם הנשק",
      "אני לא בטוחה בבית",
      "בן הזוג שלי צועק ומאיים ואני מפחד",
      "הוא פוגע בי ואחר כך אומר שזה בגלל הטראומה",
      "אלימות במשפחה ופוסט טראומה",
      "הילדים רואים אותו מתפרץ ואני מפחדת שיפגע בהם"
    ],
    "guidance": "- לפתוח בהכרה קצרה: מה שתיארת נשמע מפחיד, וטוב שכתבת. הבטיחות שלך ושל הילדים קודמת לכל דבר אחר.\n- סכנה עכשיו (אלימות, איום, נשק, או פחד שזה יקרה עכשיו): **משטרה 100**. פציעה - **מד״א 101**. אם אפשר, להתרחק או לצאת למקום בטוח, עם הילדים.\n- להזכיר את כפתור **יציאה מהירה** באתר (וגם לחיצה על Shift שלוש פעמים), אם יש חשש שמישהו רואה את המסך.\n- לשיחה עם אדם עכשיו: ער״ן **1201**. קווי סיוע ייעודיים לאלימות במשפחה - רק אם מופיעים ב-SOURCES; לא להמציא מספרים.\n- לא להציע לעמת אותו/ה, לא לייעץ זוגית, לא להסביר או להצדיק את האלימות בטראומה, ולא לאבחן את בן/בת הזוג.\n- רק אם הפונה כבר לא בסכנה מיידית, ובשורה אחת: לבני משפחה של מתמודדים יש תמיכה בעמוד **קרובים ובני משפחה** ובעמוד **קהילות תמיכה**.\n- לומר שאני עוזר אוטומטי ואף אחד לא מוזעק בעקבות השיחה. משפטים קצרים.",
    "answer": "מה שתיארת נשמע מפחיד, וטוב שכתבת. הבטיחות שלך, ושל הילדים אם יש, קודמת לכל דבר אחר.\n\n**אם יש סכנה עכשיו** - אלימות, איום, נשק, או פחד שזה יקרה עכשיו - להתקשר ל**משטרה 100**. אם יש פציעה - **מד״א 101**. אם אפשר, להתרחק או לצאת למקום בטוח.\n\nאם את/ה חושש/ת שמישהו רואה את המסך, יש באתר כפתור **יציאה מהירה** (או לחיצה על Shift שלוש פעמים).\n\n**לשיחה עם אדם עכשיו:** ער״ן **1201**.\n\nאני עוזר אוטומטי, ואף אחד לא מוזעק בעקבות השיחה הזאת. לכן בסכנה חשוב להתקשר בעצמך.\n\nאת/ה במקום בטוח עכשיו?",
    "crisis": false
  },
  {
    "_key": "child-in-danger",
    "question": "אני חושש/ת שפוגעים בילד, מה עושים?",
    "paraphrases": [
      "הילד סיפר לי שמרביצים לו בבית",
      "אני חושבת שמתעללים בילדה של השכנים",
      "הבת שלי סיפרה שמישהו נגע בה",
      "אבא שלי מרביץ לי",
      "אני בן 14 ומרביצים לי בבית",
      "מישהו פוגע בי ואני עוד בתיכון",
      "הבן שלי בסכנה בבית של האבא",
      "תלמיד שלי סיפר על פגיעה",
      "ילד מוזנח ואני לא יודע למי לפנות",
      "אני מפחדת לחזור הביתה"
    ],
    "guidance": "- לפתוח בהכרה: טוב שסיפרת. אם הכותב/ת הוא/היא הילד/ה: להאמין, לומר שזה לא באשמתו/ה ושמגיע לו/ה להיות בטוח/ה.\n- סכנה עכשיו: **משטרה 100**; פציעה: **מד״א 101**.\n- אם הכותב/ת ילד/ה או נער/ה: לעודד לספר עכשיו למבוגר/ת שסומכים עליו/ה ושאינו/ה מי שפוגע/ת. לשיחה עכשיו: ער״ן **1201**. לא לבקש פרטים מזהים ולא לחקור.\n- אם הכותב/ת מבוגר/ת: לא לחקור את הילד/ה ולא לעמת את מי שפוגע; לפנות לגורמי הרווחה או למשטרה. מספרים של קווים ייעודיים (רווחה, הגנה על ילדים) רק אם הם מופיעים ב-SOURCES; לא להמציא.\n- להמשך, כשהבטיחות מסודרת: מטיב ילדים (פרטים מ-SOURCES).\n- לא לאבחן, לא להעריך אם זו \"באמת\" פגיעה, ולא לתת ייעוץ משפטי על חובת דיווח.\n- משפטים קצרים. לומר שאני עוזר אוטומטי ואף אחד לא מוזעק בעקבות השיחה.",
    "answer": "טוב שסיפרת. זה חשוב, ומגיע לכל ילד להיות בטוח.\n\n**אם יש סכנה עכשיו** - **משטרה 100**. אם יש פציעה - **מד״א 101**.\n\n**אם זה קורה לך:** זה לא באשמתך. כדאי לספר עכשיו למבוגר/ת שסומכים עליו/ה, ושלא פוגע/ת בך. אפשר גם לדבר עם ער״ן **1201**.\n\n**אם את/ה מבוגר/ת שדואג/ת לילד:** לא צריך לחקור אותו או לעמת את מי שפוגע. בסכנה - משטרה **100**.\n\nאני עוזר אוטומטי, ואף אחד לא מוזעק בעקבות השיחה הזאת, לכן חשוב לפנות לאדם.\n\nאת/ה במקום בטוח עכשיו?",
    "crisis": false
  },
  {
    "_key": "minor-user",
    "question": "אני בן 16, אפשר לדבר איתך?",
    "paraphrases": [
      "אני בת 15 ויש לי טראומה",
      "אני עוד בתיכון וקשה לי מאז המלחמה",
      "אני נער ואין לי למי לספר",
      "ההורים שלי לא יודעים שקשה לי",
      "אני בכיתה ט ויש לי התקפי חרדה",
      "אני קטין, מותר לי לפנות לטיפול?",
      "אני ילד ואבא שלי חזר מהמילואים",
      "לא רוצה שההורים שלי ידעו"
    ],
    "guidance": "- לענות בחום ולעזור; לא לסרב. אם נשאל: האתר מיועד לגיל 18 ומעלה, ושימוש של קטינים בליווי הורה או אפוטרופוס (מתנאי השימוש).\n- אם יש מצוקה, מחשבות לפגוע בעצמך או סכנה: ער״ן **1201** (גם בוואטסאפ, דרך כפתור **עזרה עכשיו**), ובסכנה מיידית **מד״א 101** / **משטרה 100**.\n- לעודד לספר למבוגר/ת שסומכים עליו/ה (הורה, קרוב/ה, מבוגר/ת מבית הספר), בלי לחייב ובלי להבטיח סודיות.\n- מה יש באתר לגיל הזה, רק מתוך SOURCES: עמוד **לדבר עם ילדים** (חומרים לגיל 16 ומעלה), **תרגילי הרגעה**, ומטיב ילדים לפנייה לטיפול (פרטים מ-SOURCES).\n- לא לבקש גיל מדויק, בית ספר או פרטים מזהים. לא לתת ייעוץ משפטי על הסכמת הורים לטיפול.\n- טון פשוט וחם, משפטים קצרים.",
    "answer": "בטח, אפשר לדבר. טוב שכתבת.\n\nאני עוזר אוטומטי, לא אדם, ואני עונה מתוך התוכן של האתר. האתר מיועד בעיקר למבוגרים, אבל יש בו דברים שיכולים להתאים גם לך, למשל **תרגילי הרגעה**.\n\nאם קשה לך מאוד עכשיו, או שיש מחשבות לפגוע בעצמך - ער״ן **1201**, בטלפון או בוואטסאפ (דרך כפתור **עזרה עכשיו**). בסכנה מיידית - מד״א **101** או משטרה **100**.\n\nכדאי גם לספר למבוגר/ת שסומכים עליו/ה, הורה, קרוב/ה או מישהו מבית הספר. לא חייבים לספר הכול בבת אחת.\n\nעל מה תרצה/י לדבר?",
    "crisis": false
  },
  {
    "_key": "fear-of-harming-others",
    "question": "אני מפחד שאפגע במישהו",
    "paraphrases": [
      "יש לי מחשבות לפגוע באשתי",
      "אני מתפרץ ומפחד שיום אחד ארביץ למישהו",
      "בא לי להרוג אותו",
      "אני לא שולט בעצמי כשאני כועס מאז המלחמה",
      "כמעט הרבצתי לבן שלי",
      "אני מפחד מעצמי ליד הילדים",
      "יש לי נשק בבית ואני מפחד ממה שאעשה",
      "הזעם שלי יוצא משליטה"
    ],
    "guidance": "- לפתוח בלי שיפוט: טוב שאת/ה שם/ה לב לזה ומדבר/ת על זה.\n- סכנה עכשיו: להתרחק מהאדם ומהמצב (לצאת מהחדר, מהבית), ואם יש חשש ממשי שזה יקרה עכשיו - **משטרה 100**.\n- לשיחה עם אדם עכשיו: ער״ן **1201**.\n- אם מוזכר נשק: [החלטת בעלים - לא באתר] להציע להפקיד אותו אצל מישהו אחר או במקום נעול.\n- להמשך, כשרגוע יותר: שיחת התייעצות עם מטיב (**לא בטוחים אם לפנות?**) או **איפה מקבלים טיפול**. לבני משפחה: **כלים לבני משפחה**.\n- לא לאבחן, לא להסביר את הכעס בטראומה, לא לתת טכניקות לניהול כעס שלא מופיעות ב-SOURCES.\n- אם יש גם מחשבות לפגוע בעצמך: הסדר של מחשבות אובדניות (1201, \"את/ה בטוח/ה עכשיו?\", 101 / 100).\n- משפטים קצרים.",
    "answer": "טוב שאת/ה שם/ה לב לזה ומדבר/ת על זה. זה לא פשוט.\n\n**אם זה עלול לקרות עכשיו** - להתרחק מהאדם ומהמצב, לצאת מהחדר או מהבית. ואם יש חשש ממשי - **משטרה 100**.\n\n**לדבר עם מישהו עכשיו:** ער״ן **1201**.\n\nוכשיהיה קצת יותר רגוע, אפשר לבקש שיחת התייעצות עם מטיב (**לא בטוחים אם לפנות?**) או לבדוק את המסגרות בעמוד **איפה מקבלים טיפול**.\n\nאת/ה ומי שלידך בטוחים עכשיו?",
    "crisis": false
  }
]
```

Note on `fear-of-harming-others`: the weapon bullet is marked for owner decision; drop it if not approved. Do not ship the
bracket text.

---

## Outside the playbooks (flag only, not editable here)

1. **Crisis playbook is per message, not per conversation** (`chat.ts`: `detectCrisis(last)` and the embedding use only the latest user
   message). The suicide row asks "את/ה בטוח/ה עכשיו?"; the reply "לא" or "כבר לקחתי" gets no playbook and no crisis flag. Fix options:
   (a) run `detectCrisis` over the last 3 user turns and keep injecting the same crisis row while it is within N turns; (b) make crisis sticky per
   `sessionId`. (a) is simpler and has no state.
2. **`detectCrisis` misses common Hebrew forms**: `בא לי למות`, `הלוואי שאלך לישון ולא אתעורר`, `יותר טובים בלעדיי`, `אין טעם להמשיך`,
   `בלעתי כדורים`, `לקחתי את כל הכדורים`, `חתכתי את עצמי`, `מכתב פרידה`, `לירות לעצמי`. These rely on embedding similarity alone (weak/strong,
   not the crisis slot, no `crisis` SSE event / banner).
3. **System prompt staged-approach rule** ("LEAD with self-help ... before clinical options, even if sources emphasize treatment") can pull
   against the sexual-assault and domestic-violence playbooks. The playbook order should win; consider exempting safety topics from that rule
   explicitly.
4. **Site content**: inconsistent evaluation timeframe (3-4 weeks vs ~6 weeks) in ptsdInfoFaqs; "טיפול תרופתי ל-PTSD ניתן רק על ידי פסיכיאטר/ית"
   is inaccurate for Israel; panic FAQ has efficacy wording ("מכבה", "משחררת אנדורפינים") and says the attack "אינו מסוכן". The playbooks guard
   against repeating these, but retrieval still surfaces them.
5. Editing `he.json` changes translatable strings (`strings.mjs` reads it), so the other language rows need regenerating after these edits.
