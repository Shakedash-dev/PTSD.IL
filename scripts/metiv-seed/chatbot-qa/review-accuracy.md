# Chatbot playbooks - accuracy, coverage and matching review

Scope: `he.json` (30 rows). Checked against: the live DB backup `backups/articles-20261028T134555.json` (he rows), `backups/communities-pub-20261028T134555.json`, the Metiv seed `scripts/metiv-seed/he/*.json` and `scripts/metiv-seed/copy/*.json`, the page labels (`metiv-route-meta.json`, `src/lib/i18n.js`, `PatientNavbar.jsx`, `Chrome.jsx`), the indexing code (`worker/src/lib/api.ts`, `content.ts`, `chat.ts`, `crisis.ts`, `qa.ts`, `prompt.ts`) and the registry `chatbot: true` flags.

Assumptions:
- Embedding confusability is judged by hand. bge-m3 is not available in this sandbox, so no scores were computed. Pairs marked High are near-duplicate strings or share the head phrase. Log `qa-match` scores to confirm them.
- The live backup has no `metiv` category and no `chatbot-qa` rows, so neither the Metiv data nor the playbooks are live yet. Metiv facts were verified against the seed.

## 1. Summary

Overall: the safety structure is sound and almost no facts are invented. Every number, programme and eligibility claim I checked matches the site data. Four classes of problems need fixing before seeding:

1. **Page names the user cannot find.** The playbooks use the `ROUTE_META` labels, which only appear in the breadcrumb trail and the "next step" buttons. The H1 and the patient tab bar use different names for 9 pages. For example, the playbooks say **לדבר עם ילדים** but the tab bar and H1 say "תכנים לילדים", and **כלים לבני משפחה** appears as "כלים להתמודדות". See section 2.
2. **"Take X from SOURCES" where SOURCES cannot carry X.** These are indexing bugs, not playbook bugs, but several playbooks depend on the missing data:
   - `extractText` drops object keys, so the ORG row's phones reach the model as a bare list (`02-6449666 02-595-2234 02-6294858 02-644-9777 02-5952235 ...`) with no "main", "fax" or "WhatsApp" labels. `contact-metiv` can hand out the fax number.
   - The children rows' `ageGroups` are not in the indexed text, and five rows are all titled "הנחיות". `talk-to-child-about-parent` / `child-after-trauma` cannot pick the age-matched material.
   - `RELEASE_JOURNEY_CONTACTS` is all `$ref` to TEAM (not indexed), so it indexes nothing.
   - LEGAL_DOCS is not indexed, yet `who-are-you` tells the bot to answer "according to the privacy policy". The bot only knows what the playbook says.
   - SUPERVISION and COURSES are not indexed, yet the therapist rows still have "prices/dates only from SOURCES" branches that can never fire.
   - URLs are stripped, so the ERAN WhatsApp link and the registration links never reach the model.
3. **Confusable or generic paraphrases.** There are 9 High-risk pairs (section 4). The worst: "יש לי PTSD?" (do-i-have) vs "יש לי ptsd" (have-ptsd); the bare "פלשבק" in the crisis row `flashback-now` against the chat starter "מה זה פלאשבק?"; and "אני לא מחזיקה יותר את הבית לבד" (family row) shadowing the crisis row `overwhelmed-now` ("אני לא מחזיק יותר").
4. **A few factual mismatches in the playbook text:**
   - The rights category is called "הטרדות מיניות" on the site, not "תקיפה מינית".
   - The free-treatment page is all Metiv and mostly for veterans and reservists, not "חלקן של מטיב" open to anyone.
   - SE (חוויה סומטית) has no description anywhere on the site. selection.md says it does.
   - The children-page guidelines are written for a parent with PTSD, not for a child who went through an event.
   - Migdalor is only for people already recognised by Agaf HaShikum.
   - The privacy policy says nobody reads the chats and Metiv does not store them. "לא קורא בזמן אמת" undersells this.

Verdicts: 13 ok (minor edits allowed), 16 change, 1 drop (`therapist-supervision`, merged into `therapist-courses`). 5 new rows proposed (section 6).

### Global edits (apply to all rows)

- **G1 - page names.** Pick one:
  - (a) **Site fix (preferred).** Make each page have one name by aligning `ROUTE_META` labels with the H1 and tab labels, then keep the playbooks as they are, minus any renamed labels.
  - (b) **Playbook fix.** Replace names per the table in section 2.

  Either way, the bot must name pages as the user sees them in the menu.
- **G2 - ERAN WhatsApp** (suicidal-thoughts, self-harm, overwhelmed-now). The WhatsApp link is stripped from SOURCES, but the **עזרה עכשיו** button always shows it. Replace the conditional "אם ב-SOURCES מופיעה אפשרות וואטסאפ של ער״ן..." with: `ואפשר גם לכתוב לער״ן בוואטסאפ (הקישור בכפתור **עזרה עכשיו**).`
- **G3 - consultation.** **לא בטוחים אם לפנות?** is a section, not a page. Where it appears as a destination, write: `שיחת התייעצות עם מטיב (החלק **לא בטוחים אם לפנות?** בעמוד **איפה מקבלים טיפול**, וגם בכפתור **עזרה עכשיו**)`. One mention per answer is enough.
- **G4 - "nobody reads".** In the crisis rows, replace "אף אחד לא קורא את השיחה בזמן אמת" with "אף אדם לא קורא את השיחה". The privacy policy says "אף אדם אינו קורא את השיחות". "בזמן אמת" (from the terms) implies someone reads later.

## 2. Page-name map (G1)

| route | playbooks say (ROUTE_META, breadcrumb only) | H1 | patient tab bar / hub link | use in playbooks if (b) |
|---|---|---|---|---|
| ptsdInfo | מה זה פוסט-טראומה | על פוסט-טראומה | על PTSD / על פוסט-טראומה | **על פוסט-טראומה** |
| selfHelp | עזרה עצמית | כלים לעזרה עצמית | כלים לעזרה עצמית | **כלים לעזרה עצמית** |
| treatment | המסע הטיפולי | מפת הדרכים לטיפול | טיפול / דרכי טיפול | **מפת הדרכים לטיפול** |
| whereToGetHelp | איפה מקבלים טיפול | איפה אפשר לקבל טיפול | איפה מקבלים טיפול (menu) / איפה אפשר לקבל טיפול (hub) | ok as is |
| freeTreatment | טיפולים ללא עלות ומחקרים | טיפולים ללא עלות והשתתפות במחקרים | טיפולים ללא עלות ומחקרים | ok as is |
| rights | זכויות | זכויות ובירוקרטיה | זכויות | ok as is |
| community | קהילות תמיכה | קהילות ומפגשים | קהילה / קהילות ומפגשים | **קהילות ומפגשים** |
| children | לדבר עם ילדים | תכנים לילדים | תכנים לילדים | **תכנים לילדים** |
| secondCircleTools | כלים לבני משפחה | כלים להתמודדות | כלים להתמודדות | **כלים להתמודדות** (לבני משפחה) |
| secondCircle | קרובים ובני משפחה | - | קרוב/ה של מתמודד/ת | **קרוב/ה של מתמודד/ת** |
| firstCircle | מי שחווה אירוע קשה | - | מתמודד/ת עם פוסט טראומה | **מתמודד/ת עם פוסט טראומה** |
| questionnaire | שאלון אנונימי | - | שאלון אבחון עצמי (contradicts "not a diagnosis", see section 7) | **השאלון האנונימי** (and fix the nav label) |
| calmingMuscle | הרפיית שרירים | כיווץ ושחרור שרירים | card: כיווץ ושחרור | **כיווץ ושחרור** |
| calmingBreathing | נשימה | תרגיל נשימות | - | **תרגיל נשימות** |
| calmingGrounding | קרקוע | תרגיל קרקוע | - | **תרגיל קרקוע** |

Sections cited by the playbooks exist with these exact titles:
- "חיילים משוחררים ומילואימניקים": end of community.
- "לבני משפחה של מילואימניקים": end of second-circle-tools.
- "קבוצות למילואימניקים ולבני משפחותיהם": free-treatment.
- "קבוצות להורים וילדים": children.
- "לא בטוחים אם לפנות?": end of where-to-get-help, anchor `#consultation`.
- "עזרה עכשיו": header button.
- "יציאה מהירה": patient area.

The rows refer to the reservist sections loosely ("חלק למשפחות מילואימניקים"), which is acceptable.

## 3. Per-row verdicts

Exact Hebrew is given for each edit. "Paraphrase X → Y" means replace that string in `paraphrases`. Page names below are as currently written. Apply G1 on top.

### suicidal-thoughts - change (small)
- G2, G4.
- Paraphrase `להתאבד` → `בא לי להתאבד`. The bare infinitive also pulls informational questions like "מה הקשר בין PTSD להתאבדות".
- Add the paraphrase `נמאס לי לחיות`. `detectCrisis` misses it (section 8), so this row can only fire through the embedding.
- Answer: `**אפשר לדבר עם מישהו עכשיו:** ער״ן **1201**, בטלפון, וגם אפשרות לכתוב בוואטסאפ.` → `**אפשר לדבר עם מישהו עכשיו:** ער״ן **1201** בטלפון, ואפשר גם לכתוב לער״ן בוואטסאפ דרך כפתור **עזרה עכשיו** בראש העמוד.`
- Facts verified: 1201/101/100 and "חדר המיון הקרוב" match the terms; the Help-now button exists on every v3 page.

### self-harm - ok (G2, G4)
- Note: neither the question "אני פוגע בעצמי" nor "חתכתי", "לקחתי יותר מדי כדורים" trips `detectCrisis` (it only has "לפגוע בעצמי"). This row is reached only as the top match, and the crisis banner does not show. Fix in `crisis.ts` (section 8), not here.

### someone-else-suicidal - ok (minor)
- Immediate-danger line: `**מד״א 101** או **משטרה 100** עכשיו.` → `**מד״א 101** או **משטרה 100** עכשיו, או להגיע למיון (האתר מזכיר גם מיון פסיכיאטרי).`
- Verified: the site's distress-signs callout tells relatives to call ERAN 1201 (24/7) or מוקד סה"ר, and 101 or a psychiatric ER in danger. "ERAN for worried relatives" is therefore supported.

### panic-attack-now - change (small)
- `3. אופציונלי: לכווץ אגרופים חזק ולשחרר לאט (עמוד **הרפיית שרירים**).` → `3. אופציונלי: לכווץ אגרופים חזק ולשחרר לאט (התרגיל **כיווץ ושחרור** בעמוד **תרגילי הרגעה**).`
- Add a guidance bullet: `- אם השאלה מידעית (מה זה התקף חרדה) ולא קורה עכשיו: לענות בקצרה מתוך SOURCES ולהציע את **תרגילי הרגעה**, בלי תסריט החירום.` The bare paraphrase "התקף חרדה" also matches informational questions.
- Facts verified: the breathing page does 4s inhale, 4s hold, 8s exhale with a hand on the belly; the playbook's "שאיפה כ-4 שניות... נשיפה ארוכה מהשאיפה" fits. Grounding and fist-squeeze match the pages.

### flashback-now - change
- Drop the paraphrase `פלשבק`. It is the highest-risk collision in the set, against the chat starter "מה זה פלאשבק?". See the new row `what-is-flashback`.
- Opening bullet → `- לפתוח בקצרה ובשקט: "אני כאן. מה שעולה עכשיו הוא זיכרון של מה שקרה. את/ה כאן, עכשיו." אם יש ברגע זה אזעקה או סכנה ממשית - קודם להגיע למרחב מוגן, ורק אחר כך לתרגיל.` "זה כבר נגמר" can be false in Israel during a real alert, and the row itself has "שמעתי בום ואני בפלאשבק".
- Answer first line → `אני כאן. מה שעולה עכשיו הוא זיכרון של מה שקרה. את/ה כאן, עכשיו. (אם יש עכשיו אזעקה או סכנה ממשית - קודם למרחב המוגן.)`
- Grounding tips match the קרקוע page ("הכיסא, הדלת", "המשטח... הבגד").

### loved-one-episode-now - ok (minor)
- Safety bullet: after `לשמור מרחק ולהתקשר ל**משטרה 100**`, add `; אם יש נשק זמין או איום - להתרחק מיד ולהתקשר ל**משטרה 100**`. Weapons at home are common among reservists.
- The steps match the FAQ "מה לעשות בזמן התקף או פלאשבק?".

### overwhelmed-now - change
- Generic paraphrases would hijack unrelated questions at the 0.72 weak threshold:
  - `אני צריך עזרה עכשיו` → `אני צריך עזרה עכשיו, אני לא מחזיק מעמד`
  - `נשבר לי` → `נשבר לי, אני לא יכול יותר`. Bare "נשבר לי" is everyday slang for "I'm fed up", e.g. with bureaucracy.
  - `אני גמור` → `אני גמור, אין לי כוח להמשיך`
- G2, G4.

### sexual-assault - change
- Bullet 3 → `- קווי הסיוע של מרכזי הסיוע לנפגעות ולנפגעי תקיפה מינית, בגוף התשובה ולא רק כהפניה: **1202** לנשים, **1203** לגברים, וצ'אט (שם וקישור מ-SOURCES). הקווים מיועדים גם לבני משפחה. מופיעים גם בעמודים **איפה מקבלים טיפול** ו**קהילות תמיכה**.`
  - Option: if you keep the "only 1201/101/100 hardcoded" rule, write `המספרים מתוך SOURCES, בגוף התשובה`. 1202/1203 appear in 3 indexed rows and are national short codes, so hardcoding them is as safe as 1201. A survivor should not be sent to another page to find a number.
- Rights bullet → `- זכויות: בעמוד **זכויות** הקטגוריה נקראת **הטרדות מיניות**, ושם מפורטות הזכויות לנפגעות ולנפגעי תקיפה מינית. לסכם רק אם נשאל. אם עולה שאלה על תלונה: לפי SOURCES אפשר להגיש תביעה לנכות כללית בביטוח לאומי גם בלי תלונה במשטרה ובלי הגבלת זמן.`
- Answer bullets:
  - `- **מרכזי הסיוע לנפגעות ולנפגעי תקיפה מינית** - קווי סיוע נפרדים לנשים ולגברים וצ'אט. המספרים מופיעים בעמוד **איפה מקבלים טיפול**.` → `- **מרכזי הסיוע לנפגעות ולנפגעי תקיפה מינית** - **1202** לנשים, **1203** לגברים, וגם צ'אט. אפשר לפנות גם כבן או בת משפחה.`
  - `- **זכויות** - בעמוד **זכויות** יש קטגוריה שמוקדשת לזה. אפשר לשאול אותי ואפרט.` → `- **זכויות** - בעמוד **זכויות**, בקטגוריה **הטרדות מיניות**. למשל, אפשר להגיש תביעה בביטוח לאומי גם בלי להתלונן במשטרה. אפשר לשאול אותי ואפרט.`
- Verified: the adults clinic lists "תקיפה מינית"; the community row lists the "קולמילה" chat.

### just-experienced-event - change (small)
- Drop the paraphrase `הבן שלי היה עד לפיגוע אתמול`. It belongs to `child-after-trauma` and collides with "הבן שלי היה בפיגוע ולא מדבר על זה".
- Timing bullet → `- מתי לפנות להערכה: לפי SOURCES בלבד. אם מופיעים ב-SOURCES פרקי זמן שונים, לומר "אם אין שיפור אחרי כמה שבועות" ולא מספר.` The site has both "3-4 שבועות" and "כחודש וחצי" (section 7).
- Add: `- אם האירוע הוא תאונת דרכים: לומר שהאתר לא מפרט זכויות לתאונות דרכים.`

### have-ptsd-what-to-do - change (paraphrases only)
- `יש לי ptsd` → `יש לי ptsd, מה עושים עכשיו`
- Add `שרדתי את 7 באוקטובר ואני לא יודע מאיפה להתחיל`.
- Facts verified: 5 treatment steps in order (התחלה עצמאית, קופ"ח/מרכזי חוסן, ממוקדי טראומה, גוף-נפש ומשלימים, תרופתי); self-help has sleep, apps and video lectures.

### do-i-have-ptsd - change
- `יש לי PTSD?` → `האם יש לי PTSD?`
- First bullet: add after `ואינו אבחון` the text `(כ-3 דקות, התשובות נשארות במכשיר ולא נשמרות)`. Source: the patient hub card, the questionnaire SEO text and the privacy policy. None of these are indexed, so the playbook is the only carrier.
- Timing: same fix as `just-experienced-event`.
- Verified: the FAQ "איך אזהה שאני מתמודד עם PTSD?" says the questionnaire gives "אינדיקציה ראשונית - אבל אבחנה מדויקת מחייבת איש מקצוע". The reaction domains match "מהן התגובות האופייניות".

### find-therapist-psychiatrist - ok (minor)
- Add a bullet: `- אם שאלו על רשימת מטפלים: האתר לא מחזיק רשימת מטפלים פרטיים ולא ממליץ על מטפלים; לחיפוש עצמאי יש את אינדקס הפסיכולוגים ואת מאגר עמותת EMDR ישראל (לפי SOURCES).`
- Paraphrase `טיפול בטראומה בזום` → `טיפול פסיכולוגי בזום לפוסט טראומה`. It collides with the courses/supervision "בזום" rows.
- Verified: the routes, the referral via the primary doctor, "only a psychiatrist prescribes", the psychologists index and the EMDR Israel registry all appear in indexed text.

### cant-afford-treatment - change
- Drop the paraphrase `יש טיפול ללא עלות למילואימניקים?`. It is a near-duplicate of `reservist-veteran-help` "טיפול למילואימניקים בחינם".
- Add a guidance bullet: `- לומר בכנות למי מיועדות המסגרות ללא עלות (מ-SOURCES). לא להציג אותן כפתוחות לכולם.`
- Answer bullet `- **ללא עלות:** בעמוד **טיפולים ללא עלות ומחקרים** יש מסגרות טיפול ללא עלות, חלקן של מטיב, וגם מחקרים שמגייסים משתתפים.` → `- **ללא עלות:** בעמוד **טיפולים ללא עלות ומחקרים** יש מסגרות של מטיב ללא עלות, רובן לחיילים משוחררים, למילואימניקים ולבני משפחותיהם, וגם מחקרים שמגייסים משתתפים.`
- Factual basis: everything on that page is Metiv's: the military-PTSD treatment, Metiv kids space (parents of 0-9), SEA-IT, return-to-combat, PANDA/NAMAL for reservist families.

### waiting-for-treatment - change (add)
- Add a bullet: `- מי שממתין להחלטה של אגף השיקום: לפי SOURCES אפשר לבקש אישור לטיפול רפואי ונפשי כבר במהלך בירור הבקשה, דרך קצין/ת התגמולים.` The FAQ "אפשר לקבל טיפול רפואי עוד לפני שהתקבלה ההכרה?" is indexed and this is the most common "waiting" case for soldiers.
- Answer, after the kids-space line, add: `מי שממתין להחלטה של אגף השיקום יכול לבקש אישור לטיפול כבר בזמן בירור הבקשה.`
- Kids space: add `(הורים לילדים בגילאי 0-9)`. The age is in SOURCES, but "ילד צעיר" is vague.

### contact-metiv - change
- Bullet 2 → `- לתת רק את פרטי הקשר שרלוונטיים לנושא שנשאל, מתוך SOURCES בלבד, ורק כשברור מ-SOURCES למה המספר שייך (למשל המספר שמופיע לצד שיחת ההתייעצות או לצד מרפאת המבוגרים). לא לתת מספר מתוך רשימת מספרים בלי תווית: חלקם פקס או וואטסאפ. אם הנושא לא ברור - לשאול במה מדובר ולהפנות לעמוד **יצירת קשר**.`
- Root cause: the ORG row is indexed as a bare list of 7 phone numbers and 6 emails. Better fix: index ORG with labels (section 8). Or, option: hardcode `02-6449666` / `info@metiv.org`, which change rarely.
- The kids number is inconsistent on the site (section 7). Until fixed, do not pin one.
- The topic list matches `Contact.jsx` exactly.

### which-treatment-is-best - change
- Drop the paraphrase `שמעתי על טיפול ב-MDMA, זה עובד?`. Move it to `research-participation`.
- Add a bullet: `- חוויה סומטית (SE): באתר היא מופיעה רק כשם של אחת משתי השיטות בתכנית הטיפול ללא עלות של מטיב לחיילים משוחררים, בלי תיאור. לומר זאת ולא להמציא תיאור.`
- Answer verified: the trauma-focused methods are PE, CBT (incl. CPT), EMDR and dynamic; body-mind is "נשימה, תנועה, מגע, הרפיה"; medication is via a psychiatrist.

### medication-question - change
- Drop the paraphrase `כדור שינה לסיוטים`. `sleep-nightmares` has "כדור שינה יעזור לי?".
- Add a bullet: `- קנאביס רפואי: לא לייעץ אם להשתמש. אם שאלו על זכאות, אפשר למסור מה שכתוב ב-SOURCES בעמוד **זכויות** (מסלול כוחות הביטחון: מימון רישיון, אחרי מיצוי טיפולים מקובלים ובהמלצת הפסיכיאטר/ית).` The rights FAQ "מה מגיע לחייל שנפגע נפשית בשירות?" has this, and without the branch the bot refuses a factual rights question.
- Verified: SSRI/SNRI are named in SOURCES (the medication step), so mentioning the group when asked is allowed.

### rights-overview - change
- Bullet 2: replace the track list with the site's labels and order: `כוחות הביטחון, הטרדות מיניות (תקיפה ופגיעה מינית), נפגעי פעולות איבה, תאונות ועבודה (כרגע רק תאונת עבודה), כללי / אחר (למשל נכות כללית, סל שיקום, שיקום מקצועי, תעודת נכות)`.
- Answer bullets:
  - `- **תאונות ועבודה** - פגיעה נפשית בעקבות תאונת עבודה.` → `- **תאונות ועבודה** - כרגע מפורטת שם פגיעה נפשית בעקבות תאונת עבודה.`
  - `- **תקיפה מינית** - זכויות לנפגעות ולנפגעי תקיפה מינית.` → `- **הטרדות מיניות** - זכויות לנפגעות ולנפגעי תקיפה ופגיעה מינית.`
- Add: `- משפחות שכולות: הזכויות שלהן לא מפורטות באתר; לומר זאת ולא להמציא.`
- Verified: hostilities compensation is paid by BTL after MOD's approving authority. The answer has it right.

### reservist-veteran-help - change
- Answer `בעמוד **איפה מקבלים טיפול** יש גם את אגף השיקום ומרפאת מגדלור.` → `בעמוד **איפה מקבלים טיפול** יש גם את אגף השיקום, ואת מרפאת מגדלור למי שכבר מוכר באגף השיקום.`
- Add the bullet: `- אם השואל בשירות סדיר כרגע: לפי SOURCES המסגרת ללא עלות של מטיב מיועדת לחיילים משוחררים שאינם בשירות סדיר, ומסע שחרור מיועד לחיילים משוחררים. האתר לא מפרט מענים בתוך הצבא - לומר זאת ולא להמציא.`
- Add the bullet: `- הורים ובני משפחה: לפי SOURCES יש ב**קהילות תמיכה** גם קבוצות להורים לפצועים ולבני זוג (שמות מ-SOURCES).` Verified communities: "הורים לפצועי 'חרבות ברזל'", "המעגל - לא לבד", נט"ל.
- Paraphrase `פוסט טראומה מהצבא` → `איזו עזרה יש למי שיש לו פוסט טראומה מהצבא`. This avoids the collision with rights "זכויות לפוסט טראומה מהצבא".

### sleep-nightmares - ok
- The habits match the "ניהול שינה וסדר יום" tool. The "no אופטימלי / no biology" instruction is needed because the tool text says "אופטימלי" and "מסנכרנת את השעון הביולוגי".

### substance-use - ok
- Verified: the distress-signs FAQ lists "עלייה בשימוש באלכוהול, סמים, או הימורים". The site has no addiction services, and the row says so.

### calm-down-now - ok (minor)
- Answer `- **הרפיית שרירים** - כיווץ ושחרור של קבוצות שרירים, בערך 2 דקות.` → `- **כיווץ ושחרור** (הרפיית שרירים) - כיווץ ושחרור של 6 קבוצות שרירים, בערך 2 דקות.`
- Verified: "בחר/י תרגיל - אין פה נכון או לא נכון", "עקוב/י אחרי העיגול", 6 groups, about 2 minutes, 5-4-3-2-1 with smell and taste.

### support-loved-one - change (small)
- Add a bullet after the distress-signs bullet: `- אם תוארו אלימות, איום או נשק זמין: בטיחות קודם - **משטרה 100**, בלי טיפים לתקשורת כתחליף.` The paraphrase "החבר שלי מתפרץ מאז האירוע" can be a violence case.
- Verified: the communication, refusal and argument tips; "המרפאה מציעה גם ליווי והכוונה לבני משפחה"; family and spouse groups in communities.

### family-member-own-support - change (paraphrases)
- `אני לא מחזיקה יותר את הבית לבד` → `קשה לי להחזיק את הבית לבד מאז שהוא חזר`. It shadows the crisis row's question "אני לא מחזיק יותר".
- `אני בן זוג של מתמודד ואני גמור` → `אני בן זוג של מתמודד ואני שחוק לגמרי`
- `טראומה משנית` → `טראומה משנית אצל בת זוג של מתמודד`. The bare term also pulls therapists and teens; the site's teen stories are about secondary traumatization.
- Optional drop: two FAQs ("איך לדעת אם אני בעצמי מתחיל/ה להישחק", "מדריך למניעת שחיקה") answer this directly through retrieval. Keep only if logs show the group routing is missing.

### talk-to-child-about-parent - change
- Add a bullet: `- אם ב-SOURCES לא ברור לאיזה גיל מתאים חומר (כמה פריטים נקראים "הנחיות" בלי ציון גיל) - לא לנחש; להפנות ללשונית הגיל המתאימה בעמוד (עד גיל 4, 4-6, 7-10, 10-13, 14-16, 16+).`
- Add a bullet: `- לפתוח בעיקרון שחוזר בכמה גילאים בעמוד: לומר לילד במפורש שזה לא בגללו.` A follow-up such as "בן 5" is matched alone and loses this playbook (section 8), so the first answer must already be useful.
- Answer `לכל גיל יש הנחיות איך לדבר, סיפורים, ספרים ופעילויות משותפות.` → `לכל גיל יש הנחיות איך לדבר, ולצידן סיפורים, ספרים או פעילויות משותפות.` 14-16 and 16+ have only guidelines and a story.
- Paraphrases:
  - `ילדים של הורה עם טראומה` → `ילדים שגדלים לצד הורה עם פוסט טראומה`
  - `בעלי חזר מהמלחמה והילדים לא מבינים מה קורה` → `הילדים לא מבינים למה אבא השתנה מאז המלחמה`

### child-after-trauma - change
- Bullet 2 → `- להורה: בעמוד **תכנים לילדים** יש פעילויות ויסות פשוטות לפי גיל שאפשר לעשות יחד (מתוך SOURCES). ההנחיות שבעמוד נכתבו להורה שמתמודד בעצמו עם פוסט-טראומה, ולכן לא להציג אותן כהנחיות לילד שעבר אירוע.`
- Answer `- **לדבר עם ילדים** - הנחיות לפי גיל, וגם פעילויות פשוטות לוויסות שאפשר לעשות יחד בבית.` → `- **תכנים לילדים** - פעילויות פשוטות לוויסות לפי גיל, שאפשר לעשות יחד בבית.`
- Answer kids-space line: add `(הורים לילדים בגילאי 0-9, בירושלים)`.
- Paraphrase `מטיב ילדים` → `מה מטיב ילדים מציעים לילד אחרי טראומה?`. The bare name collides with `contact-metiv` "מספר טלפון של מטיב ילדים".

### research-participation - ok (minor)
- Add the paraphrases `שמעתי על טיפול ב-MDMA, זה עובד?` and `MDMA עובד על פוסט טראומה?` (moved from which-treatment).
- Verified: the SEA-IT inclusion criteria, "אין אפשרות לבחור בין שני הטיפולים", and "השתתפות אינה מבטיחה תוצאה" are all in indexed text.
- Low churn risk: the playbook only frames; study details come from SOURCES.

### therapist-courses - change (merge supervision into it)
Low value as a separate pair: the chat widget is mounted only in `PatientLayout`, so therapists only reach the bot from the patient area. Merge both rows into one:
- question → `אני מטפל, אילו קורסים, הכשרות והדרכה יש במטיב?`
- Generic paraphrases:
  - `מתי נפתח המחזור הבא` → `מתי נפתח המחזור הבא של קורס CBT בטראומה`
  - `כמה עולה הקורס` → `כמה עולה קורס למטפלים במטיב`
  - `יש קורסים בזום?` → `יש קורסים למטפלים בזום?`
- Add from supervision: `סופרוויז'ן בטראומה`, `אני מחפש מדריך בטראומה`, `אני מטפלת ונתקעתי עם מטופל טראומטי`, `הדרכה לצוות המטפלים שלנו`, `תשישות חמלה אצל מטפלים`.
- Replace bullets 4-5 (the dead "only from SOURCES" branches; COURSES, EVENTS, SUPERVISION and THERAPIST_HUB are not indexed) with: `- מועדים, מחירים, תנאי קבלה, מתכונת ונקודות זכות לא מופיעים כאן: להפנות לעמוד הקורס או לעמוד **הדרכה**. לא להמציא שמות קורסים או פרטים.`
- Add: `- הדרכה: העמוד **הדרכה** מציג הדרכה פרטנית, קבוצות הדרכה, הדרכה לצוותים בארגונים, והדרכה בתחום הילדים של מטיב ילדים.`
- Add: `- מטפל/ת שנתקע/ה עם מטופל/ת: לא לתת ייעוץ קליני על מקרה; זה התפקיד של הדרכה. אם מתוארת שחיקה או מצוקה - ער״ן **1201**.`

### therapist-supervision - drop (merged above)
- If kept instead:
  - Remove `כמה עולה הדרכה במטיב` and `יש הדרכה בזום?`.
  - Remove the "פרטי קשר, מחירים ומתכונת - רק מתוך SOURCES" branch (SUPERVISION is not indexed).
  - Add the missing option "הדרכה בתחום הילדים (מטיב ילדים)".
  - Drop "פתוח גם לאנשי מקצוע" (not on the site).
  - Note that the "קבוצת הדרכה" listed (14.5.2025) is marked `isPast`.

### who-are-you - change
- Privacy bullet → `- פרטיות, לפי מדיניות הפרטיות ותנאי השימוש (העמודים האלה לא נמצאים ב-SOURCES, אז רק מה שכתוב כאן): אף אדם לא קורא את השיחות ואף גורם לא מוזעק. מטיב לא אוספת ולא שומרת את הודעות הצ'אט. ההודעות נשלחות לספקים חיצוניים (Cloudflare ו-Google Gemini) רק כדי ליצור את התשובה, ולכן עוברות גם אל מחוץ לישראל, ולא משמשות לאימון מודלים. לא להזין פרטים מזהים, שלך או של אחרים. זיהוי המצוקה באתר אוטומטי ועלול לפספס. לפירוט: **מדיניות פרטיות** ו**תנאי שימוש**.`
- Add: `- אם יש חשש שמישהו יראה את המסך: כפתור **יציאה מהירה** באזור המטופלים, או ללחוץ Shift שלוש פעמים.`
- Answer privacy paragraph → `**לגבי פרטיות:** אף אדם לא קורא את השיחה הזאת, ואף גורם לא מוזעק בעקבותיה. מטיב לא שומרת את הודעות הצ'אט; הן נשלחות לספקים חיצוניים רק כדי ליצור את התשובה. כדאי לא לכתוב כאן פרטים מזהים, שלך או של אחרים. הפירוט המלא בעמודים **מדיניות פרטיות** ו**תנאי שימוש**.`
- Paraphrases:
  - Drop `אתה יכול לאבחן אותי?`. `do-i-have-ptsd` owns diagnosis and has the better route.
  - `אני מדבר עם מטיב?` → `אני מדבר עכשיו עם נציג אנושי של מטיב?`. This avoids the collision with contact "רוצה לדבר עם מישהו במטיב".
- Maintenance note: these facts come from LEGAL_DOCS. Re-check this row whenever the privacy policy or the providers change.

## 4. Confusable pairs

| # | row A: text | row B: text | risk | fix |
|---|---|---|---|---|
| 1 | do-i-have-ptsd: יש לי PTSD? | have-ptsd-what-to-do: יש לי ptsd | High (same string) | A → האם יש לי PTSD?; B → יש לי ptsd, מה עושים עכשיו |
| 2 | flashback-now (crisis): פלשבק, יש לי פלאשבק עכשיו | chat starter "מה זה פלאשבק?" (no row) | High (one of 3 starters gets the crisis script) | drop פלשבק; add `what-is-flashback` |
| 3 | cant-afford: יש טיפול ללא עלות למילואימניקים? | reservist-veteran-help: טיפול למילואימניקים בחינם | High | drop from cant-afford |
| 4 | medication-question: כדור שינה לסיוטים | sleep-nightmares: כדור שינה יעזור לי? | High | drop from medication |
| 5 | which-treatment: שמעתי על טיפול ב-MDMA, זה עובד? | research-participation: שמעתי על מחקר MDMA במטיב / טיפול ב-MDMA לפוסט טראומה | High | move to research |
| 6 | family-member-own-support: אני לא מחזיקה יותר את הבית לבד | overwhelmed-now (crisis) Q: אני לא מחזיק יותר | High (crisis row loses) | rephrase A |
| 7 | talk-to-child: ילדים של הורה עם טראומה | child-after-trauma: ילדים אחרי טראומה, מה עושים | High | rephrase A |
| 8 | just-experienced: הבן שלי היה עד לפיגוע אתמול | child-after-trauma: הבן שלי היה בפיגוע ולא מדבר על זה | High | drop from A |
| 9 | overwhelmed-now: נשבר לי / אני צריך עזרה עכשיו | any frustrated or help-seeking question ("נשבר לי מהבירוקרטיה", "אני צריך עזרה עם הזכויות") | High (generic) | rephrase (section 3) |
| 10 | family-member-own-support: אני בן זוג של מתמודד ואני גמור | overwhelmed-now: אני גמור | Medium | rephrase both |
| 11 | family-member-own-support: טראומה משנית | therapist-supervision: טראומטיזציה משנית של מטפל; children-page teen stories | Medium | rephrase A; merge supervision |
| 12 | talk-to-child: בעלי חזר מהמלחמה והילדים לא מבינים מה קורה | support-loved-one: בעלי חזר מהמלחמה והוא לא אותו אדם | Medium | rephrase A |
| 13 | who-are-you: אתה יכול לאבחן אותי? | do-i-have-ptsd: תאבחן אותי | Medium | drop from who-are-you |
| 14 | who-are-you: אני מדבר עם מטיב? | contact-metiv: רוצה לדבר עם מישהו במטיב | Medium | rephrase A |
| 15 | therapist-courses: כמה עולה הקורס | therapist-supervision: כמה עולה הדרכה במטיב; cant-afford: כמה עולה טיפול במטיב | Medium | qualify + merge |
| 16 | therapist-courses: יש קורסים בזום? | therapist-supervision: יש הדרכה בזום?; find-therapist: טיפול בטראומה בזום | Medium | qualify + merge |
| 17 | therapist-courses: הכשרה לארגון שלנו בנושא טראומה | therapist-supervision: הדרכה לצוות שלנו / הדרכה לארגון טיפולי | Medium | merge |
| 18 | therapist-courses: מתי נפתח המחזור הבא | any "מתי המסע/הקבוצה הבאה" (release journey, NAMAL) | Medium (generic) | qualify |
| 19 | reservist-veteran-help: פוסט טראומה מהצבא | rights-overview: זכויות לפוסט טראומה מהצבא / חייל שנפגע נפשית, מה מגיע לו | Medium | rephrase A |
| 20 | support-loved-one: החבר שלי מתפרץ מאז האירוע | loved-one-episode-now: בן זוגי עם פוסט טראומה מתפרץ עכשיו | Medium | add safety bullet to support; new `violence-at-home` |
| 21 | child-after-trauma: מטיב ילדים | contact-metiv: מספר טלפון של מטיב ילדים | Medium | rephrase A |
| 22 | just-experienced: חזרתי מהלחימה לפני שבוע ואני לא עצמי | reservist: חזרתי מהמילואים ואני לא מתפקד; overwhelmed: מאז האירוע אני לא מתפקד ואין לי כוח | Medium (all safe) | accept, monitor |
| 23 | cant-afford: ביטוח לאומי משלם על פסיכולוג? / משרד הביטחון מממן טיפול? | rights-overview: מגיע לי כסף מביטוח לאומי? | Low-Medium | accept |
| 24 | medication: קנאביס רפואי לפוסט טראומה | substance-use: קנאביס עוזר לי עם הטראומה? | Low (different intents) | accept; medication gets the rights branch |
| 25 | suicidal-thoughts: עדיף שלא אהיה פה | someone-else-suicidal: אבא שלי אומר שעדיף שלא יהיה פה | Low (both crisis-safe) | accept |
| 26 | self-harm: אני פוגע בעצמי | someone-else-suicidal: הבת שלי פוגעת בעצמה | Low | accept |
| 27 | calm-down-now: אני לחוץ, יש תרגיל הרגעה? / תרגיל נשימה | panic-attack-now: אני בחרדה נוראית... | Low | accept |
| 28 | do-i-have-ptsd: אני צריך טיפול או שזה יעבור? | just-experienced: כמה זמן זה נמשך אחרי אירוע קשה? | Low | accept |

Other paraphrases too generic to keep as they are: `מה אתה יודע לעשות`, `אפשר לסמוך עליך?` (who-are-you); `מה אפשר לעשות כשיש טראומה` (have-ptsd); `הלם קרב` (reservist; informational "מה זה הלם קרב" gets the service map, which is acceptable); `אבא פוסטמטי` (a book title; it will also catch "איפה קונים את הספר", which is fine); `התקף חרדה` (panic; covered by the new informational bullet).

## 5. Question-set coverage

### Missing - add (JSON in section 6)
| _key | audience | why |
|---|---|---|
| what-is-flashback | everyone | One of the 3 chat starters, and it currently collides with the crisis row `flashback-now`. Plain retrieval is fine for the content, but the row is needed to win the match. |
| bereaved-traumatic-loss | bereaved families, comrades | Very frequent in Israel since Oct 7. The site has no bereavement page; without a row the bot either refuses or answers with generic PTSD content. The row only routes (the adults clinic lists "אובדן טראומטי") and states the gap. |
| violence-at-home | partners, children, parents of reservists | High stakes. Today these questions land on `support-loved-one` (communication tips) or on the acute-only `loved-one-episode-now`. The site has no family-violence resources, so the row fixes safety order and forbids inventing hotlines. |
| teen-parent-ptsd | teens | The site has teen-facing content (the 14-16 / 16+ stories on secondary traumatization). `talk-to-child-about-parent` is written for the parent and gives a teen the wrong register. |
| treatment-in-my-language | Arabic, Russian, French, English speakers | Stable. The site says nothing about treatment language, so the row stops the bot inventing Arabic- or Russian-speaking services and tells users the bot answers in their language. Medium priority. |

### Missing - do not add a row (content gap; tell the owner)
- Families of hostages, evacuees, Oct 7 survivors as a group: no site content. Adding the Oct 7 paraphrase to `have-ptsd-what-to-do` is enough for now.
- Road accidents: the rights category is called "תאונות ועבודה" with a car icon but only covers work accidents. This is a content gap (section 7).
- Active-duty soldiers: handled by the new bullet in `reservist-veteran-help`.
- Donations: the DONATE page is still `[טקסט זמני]`. Revisit when it is real.

### Low-value rows (the owner prefers fewer)
- `therapist-supervision`: drop and merge (chat is not on therapist pages).
- `therapist-courses`: keep only as the merged row. It exists solely because COURSES and SUPERVISION are not indexed.
- `family-member-own-support`: optional drop. Two FAQs cover it directly.
- `research-participation`: the studies change, but the row only frames them, so keep it.
- Nothing else is low value. All other rows either carry safety order, a medical or diagnostic refusal, or point to unindexed pages.

## 6. Proposed new rows

```json
[
  {
    "_key": "what-is-flashback",
    "question": "מה זה פלאשבק?",
    "paraphrases": [
      "מה זה פלשבק",
      "מה זה פלאשבקים בפוסט טראומה",
      "למה יש לי פלאשבקים",
      "פלאשבק זה סימן ל-PTSD?",
      "מה ההבדל בין פלאשבק לזיכרון רגיל",
      "מה זה טריגר",
      "למה ריח או רעש מחזירים אותי לאירוע",
      "מה זה דיסוציאציה",
      "פלאשבקים מהמלחמה, זה נורמלי?"
    ],
    "guidance": "- לענות קודם בהגדרה קצרה מתוך SOURCES (שאלת \"מהן התגובות האופייניות לפוסט-טראומה?\"): פלאשבק הוא אחת מתגובות החודרנות - זיכרון של האירוע שפורץ ומשתלט על החוויה ברגע נתון, לפעמים בעקבות תמונה, צליל, ריח או מילה.\n- שורה אחת על טריגרים, מתוך SOURCES (שאלת \"מה קורה לי בגוף כשאני חווה אירוע טראומטי?\").\n- לא לאבחן: פלאשבקים לבדם לא קובעים שיש PTSD. להפנות ל**שאלון האנונימי** ולשיחת התייעצות עם מטיב (**לא בטוחים אם לפנות?**).\n- להציע כלי לרגע כזה: **תרגיל קרקוע** בעמוד **תרגילי הרגעה**, ולתאר מה עושים בו בלי לטעון שהוא עוזר או מפחית.\n- אם מהשאלה עולה שזה קורה עכשיו: לעבור לקרקוע קצר (5 דברים שרואים, 4 שנוגעים, 3 קולות) ולהזכיר את ער״ן **1201**.\n- בלי ניסוחי יעילות, גם אם הם מופיעים ב-SOURCES.",
    "answer": "פלאשבק הוא זיכרון של אירוע קשה שפורץ פתאום ומשתלט על החוויה, כאילו זה קורה שוב עכשיו. לפי האתר, זו אחת התגובות האופייניות אחרי טראומה, והיא יכולה להתעורר בעקבות תמונה, צליל, ריח או מילה שמזכירים את האירוע.\n\nפלאשבקים לבדם לא קובעים שיש פוסט-טראומה. אם זה חוזר ומפריע, אפשר למלא את **השאלון האנונימי** באתר, או לבקש שיחת התייעצות עם מטיב.\n\nלרגעים כאלה יש בעמוד **תרגילי הרגעה** תרגיל קרקוע מודרך: מוצאים 5 דברים שרואים, 4 שאפשר לגעת בהם, 3 קולות ששומעים, ועוד.\n\nאם זה קורה לך עכשיו - אני כאן. ואם צריך לדבר עם מישהו, ער״ן **1201**.",
    "crisis": false
  },
  {
    "_key": "bereaved-traumatic-loss",
    "question": "איבדתי אדם קרוב באירוע טראומטי, יש עזרה?",
    "paraphrases": [
      "הבן שלי נהרג במלחמה",
      "אני במשפחה שכולה ולא מתפקדת",
      "בעלי נרצח בפיגוע",
      "איך מתמודדים עם אובדן אחרי 7 באוקטובר",
      "אבל אחרי מוות פתאומי",
      "אחי נפל בעזה ואני לא מצליח לחזור לעצמי",
      "חבר מהצוות נהרג ואני לא מתאושש",
      "טיפול לשכולים",
      "אובדן טראומטי",
      "איך עוזרים לילדים אחרי שאבא נהרג",
      "זכויות של משפחות שכולות"
    ],
    "guidance": "- לפתוח בהשתתפות בצער, במשפט אחד, בלי קלישאות ובלי \"הזמן מרפא\".\n- לומר בכנות: באתר אין עמוד ייעודי לשכול או לזכויות של משפחות שכולות, ואני לא אמציא מידע על זה.\n- מה כן יש, מתוך SOURCES בלבד: מרפאת המבוגרים של מטיב מקבלת גם פונים אחרי אובדן טראומטי (פרטי פנייה מ-SOURCES); שיחת התייעצות עם מטיב (**לא בטוחים אם לפנות?**); מסגרות נוספות בעמוד **איפה מקבלים טיפול**.\n- ילדים במשפחה: מטיב ילדים מטפלת בילדים ובהורים (פרטים מ-SOURCES). לא להציג את ההנחיות בעמוד **תכנים לילדים** כאילו נכתבו לשכול; הן נכתבו להורה שמתמודד עם פוסט-טראומה.\n- זכויות שכול: לומר שהן לא מפורטות באתר. לא להמציא גופים, סכומים או תהליכים.\n- אם עולות מחשבות שאין טעם לחיות - ער״ן **1201**; בסכנה מיידית **מד״א 101** / **משטרה 100**.\n- לא לאבחן אבל, אבל מורכב או PTSD. טון שקט, משפטים קצרים.",
    "answer": "אני מצטער מאוד על האובדן שלך.\n\nאני רוצה להיות כן איתך: באתר אין עמוד ייעודי לשכול או לזכויות של משפחות שכולות. אבל יש כמה מקומות שאפשר לפנות אליהם:\n\n- **מרפאת המבוגרים של מטיב** - מקבלת גם פונים אחרי אובדן טראומטי, בירושלים ובזום.\n- **שיחת התייעצות עם מטיב** - אם לא ברור מה מתאים עכשיו.\n- **איפה מקבלים טיפול** - מסגרות נוספות ופרטי פנייה.\n- אם יש ילדים במשפחה, **מטיב ילדים** מטפלת בילדים ובהורים.\n\nאם הכאב כבד מדי ועולות מחשבות שאין טעם להמשיך - ער״ן **1201**, בכל שעה.\n\nאני כאן אם תרצה/י לכתוב עוד.",
    "crisis": false
  },
  {
    "_key": "violence-at-home",
    "question": "בן הזוג שלי עם פוסט טראומה ואני מפחדת שהוא יפגע בי",
    "paraphrases": [
      "בעלי הרביץ לי מאז שחזר מהמלחמה",
      "הוא שובר דברים בבית ואני מפחדת",
      "בן הזוג שלי מאיים עליי",
      "אני מפחד מאבא שלי כשהוא מתפרץ",
      "יש לו נשק בבית והוא לא יציב",
      "הוא צועק ומאיים על הילדים",
      "אלימות במשפחה בגלל פוסט טראומה",
      "אני לא מרגישה בטוחה בבית איתו",
      "בעלי עם PTSD נהיה אלים"
    ],
    "guidance": "- לפתוח: מה שתיארת חשוב, והבטיחות שלך ושל הילדים קודמת לכול. פוסט-טראומה לא מחייבת לסבול אלימות או איומים.\n- סכנה עכשיו (אלימות, איום, נשק זמין): **משטרה 100**; פציעה - **מד״א 101**. אם אפשר - לצאת למקום בטוח או לאדם קרוב.\n- לא לתת טיפים של \"איך לדבר איתו\" או \"איך להרגיע אותו\" כתחליף לבטיחות. לא להציע לשמור את זה בסוד.\n- לומר בכנות שבאתר אין מידע ייעודי על אלימות במשפחה. לא להמציא קווי סיוע, מספרים או מסגרות.\n- לשיחה עם אדם עכשיו: ער״ן **1201**. אם הוא מדבר על פגיעה בעצמו - גם ער״ן **1201**.\n- תמיכה בהמשך, מתוך SOURCES: מרפאת המבוגרים של מטיב (ליווי לבני משפחה), קבוצות לבני זוג בעמוד **קהילות תמיכה**.\n- אם יש חשש שמישהו יראה את המסך: כפתור **יציאה מהירה** באזור המטופלים, או Shift שלוש פעמים.\n- לא לאבחן אותו ולא להצדיק את ההתנהגות. משפטים קצרים.",
    "answer": "טוב שכתבת. הבטיחות שלך, ושל הילדים אם יש, קודמת לכול. גם כשמישהו מתמודד עם פוסט-טראומה, לא צריך לסבול אלימות או איומים.\n\n**אם יש סכנה עכשיו** - אלימות, איום או נשק זמין - להתקשר ל**משטרה 100**. אם יש פציעה - **מד״א 101**. אם אפשר, לצאת למקום בטוח או לאדם קרוב.\n\n**לדבר עם מישהו עכשיו:** ער״ן **1201**.\n\nאני רוצה להיות כן: באתר אין מידע ייעודי על אלימות במשפחה. מה שיש הוא תמיכה בשבילך בהמשך - מרפאת המבוגרים של מטיב מציעה ליווי לבני משפחה, ובעמוד **קהילות תמיכה** יש קבוצות לבני זוג.\n\nאם את/ה חושש/ת שמישהו יראה את המסך, יש באזור המטופלים כפתור **יציאה מהירה** (או Shift שלוש פעמים).\n\nאת/ה בטוח/ה עכשיו?",
    "crisis": false
  },
  {
    "_key": "teen-parent-ptsd",
    "question": "אני נער ולאבא שלי יש פוסט טראומה, קשה לי",
    "paraphrases": [
      "אני בת 15 ואמא שלי עם PTSD",
      "אבא שלי חזר מהמילואים ואני לא יכול יותר בבית",
      "אני מתבגרת ואבא שלי צועק כל הזמן",
      "גם לי יש סיוטים מאז שאבא חזר",
      "אני דואגת לאחים הקטנים כי אמא לא מתפקדת",
      "אני לא רוצה להיות בבית",
      "למי אני יכול לספר על מה שקורה בבית",
      "אני בן 17 ואבא שלי פוסט טראומטי"
    ],
    "guidance": "- לפתוח בתוקף, בשפה פשוטה: זה לא באשמתך, ומותר לך לבקש עזרה משלך, בנפרד מההורה.\n- מתוך SOURCES (הסיפורים לגילאי 14-16 ו-16+ בעמוד **תכנים לילדים**): מה שקורה לך מוכר וקוראים לו טראומה משנית; מה עוזר - לדבר עם מבוגר/ת אמין/ה מחוץ למשפחה, כמו יועץ/ת בית הספר, קרוב משפחה או איש/אשת מקצוע.\n- להפנות לעמוד **תכנים לילדים**, ללשוניות 14-16 ו-16+.\n- טיפול: מטיב ילדים מטפלת עד גיל 18 (פרטים מ-SOURCES); אפשר לפנות יחד עם מבוגר/ת שסומכים עליו/ה.\n- בטיחות: מחשבות לפגוע בעצמך - ער״ן **1201**; אלימות או סכנה בבית - **משטרה 100**.\n- טון חם ולא מתנשא, משפטים קצרים. לא לאבחן את המתבגר/ת או את ההורה.",
    "answer": "טוב שכתבת. זה לא באשמתך, ומותר לך לבקש עזרה משלך, בנפרד מהעזרה שההורה שלך מקבל.\n\nלפי האתר, מתבגרים שגדלים לצד הורה עם פוסט-טראומה מרגישים לפעמים בעצמם דאגה כל הזמן, עצבנות, קשיי שינה או ניתוק. לזה קוראים טראומה משנית, וזה מוכר.\n\n**מה יכול לעזור:**\n- לדבר עם מבוגר/ת שסומכים עליו/ה מחוץ למשפחה - יועץ/ת בית הספר, קרוב משפחה או איש/אשת מקצוע.\n- בעמוד **תכנים לילדים**, בלשוניות 14-16 ו-16+, יש חומרים שנכתבו בדיוק בשבילך.\n- **מטיב ילדים** מטפלת גם בבני נוער עד גיל 18. אפשר לפנות יחד עם מבוגר/ת.\n\nאם עולות מחשבות לפגוע בעצמך - ער״ן **1201**. אם יש אלימות או סכנה בבית - משטרה **100**.\n\nרוצה לספר לי עוד?",
    "crisis": false
  },
  {
    "_key": "treatment-in-my-language",
    "question": "יש טיפול בערבית או ברוסית?",
    "paraphrases": [
      "هل يوجد علاج نفسي باللغة العربية؟",
      "Есть ли психолог, который говорит по-русски?",
      "Y a-t-il un psychologue qui parle français ?",
      "Is there trauma therapy in English?",
      "מטפל דובר ערבית לפוסט טראומה",
      "אני לא מדבר עברית טוב, איפה מקבלים עזרה",
      "אפשר לדבר איתך ברוסית?"
    ],
    "guidance": "- לענות בשפה שבה נכתבה השאלה, ולומר שאני יכול להמשיך בשפה הזאת.\n- לומר בכנות: האתר לא מפרט באיזו שפה ניתן הטיפול בכל מסגרת. לא להמציא מטפלים, מסגרות או קווים לפי שפה.\n- להציע: לשאול את המסגרת ישירות בזמן הפנייה (פרטי פנייה בעמוד **איפה מקבלים טיפול**, מתוך SOURCES), או לבקש שיחת התייעצות עם מטיב.\n- במצוקה: ער״ן **1201**. לא לטעון באילו שפות ער״ן עונה אם זה לא מופיע ב-SOURCES.\n- לא להבטיח שירות בשפה מסוימת.",
    "answer": "אני יכול להמשיך לענות לך בשפה הזאת.\n\nלגבי טיפול: האתר לא מפרט באיזו שפה ניתן הטיפול בכל מסגרת. כדאי לשאול את זה ישירות כשפונים. פרטי הפנייה של כל מסגרת נמצאים בעמוד **איפה מקבלים טיפול**, ואפשר גם לבקש שיחת התייעצות עם מטיב.\n\nאם קשה מאוד עכשיו - ער״ן **1201**.\n\nבמה עוד אוכל לעזור?",
    "crisis": false
  }
]
```

Notes on the new rows:
- `violence-at-home` is `crisis: false` on purpose. `detectCrisis` would not fire on these phrases anyway, and as a crisis row it would compete with `suicidal-thoughts` when the user also writes "רוצה למות". If logs show it should win in that case, set `crisis: true`.
- Apply G1 names to the new rows as well. They use the names from option (b) where they differ.

## 7. Site-content problems (separate from the playbooks)

**Contradictions and wrong data**
1. **Recovery timing.** "איך נראית התאוששות טבעית" says "ברוב המקרים נצפה להתאוששות טבעית אחרי כחודש וחצי". "מתי מומלץ לפנות לטיפול" says "אם אין מגמת שיפור כעבור 3-4 שבועות". Pick one.
2. **Metiv kids phone.** The contact page, the CONTACTS row (`METIV_KIDS_PHONE`) and Metiv kids space say 02-6294858. The `kids-clinic` service row on where-to-get-help says 02-6449666 (the main number).
3. **Research WhatsApp.** ORG `researchWhatsapp` and two study rows give 02-5952240; SEA-IT gives 02-6264889. Possibly intended (a different team), but confirm.
4. **ORG phones.** There is a separate `footer` phone 02-595-2234 next to `main` 02-6449666. Confirm which one the public should call.
5. **Questionnaire.** The nav and hub link call it "שאלון אבחון עצמי". The page, the SEO text and the FAQ say it is not a diagnosis ("אינו מהווה אבחון"). Rename to "שאלון אנונימי" or "שאלון איתור עצמי".
6. **Rights category names.**
   - The sexual-assault tab is labelled "הטרדות מיניות", but its content is about assault ("אילו זכויות עומדות לי כנפגע/ת תקיפה מינית?"). Rename to "פגיעה ותקיפה מינית".
   - "תאונות ועבודה" has a car icon but only a work-accident FAQ. Road accidents are not covered.
7. **Breathing.** The anxiety FAQ says 4-4-6; the linked breathing page runs 4-4-8.
8. **Children age tabs overlap.** "עד גיל 4" vs "4-6" (age 4 in both); "7-10" vs "10-13" (age 10 in both). Ages 3, 9 and 13 also sit in two tabs depending on the row data (0-4, 4-6 / 7-10, 10-13).
9. **Possible duplicate programme.** `namal-family` mentions "קבוצה להורים שחזרו מהמילואים יחד עם ילדם, במימון משרד הביטחון". `reservist-fathers` ("קבוצה דיאדית לאנשי מילואים וילדיהם") says registration "כוללת שלב תשלום". If these are the same programme, one of them is wrong about cost.
10. **Free-treatments summary.** The service summary says "בעיקר חיילים משוחררים עם PTSD, מילואימניקים ובני משפחותיהם", but the page also holds Metiv kids space for any parent of a 0-9 child.
11. **Naming collision.** "מרחב מטיב" (organisations programme, therapist area) vs "מרחב מטיב לילדים" (parents).
12. **One page, several names** (section 2). The H1, the tab bar, the hub links and the breadcrumbs disagree for 9 pages.
13. **DONATE** is still placeholder text ("[טקסט זמני]") on a live route.

**Efficacy wording still on the site** (the memory rule "no efficacy claims in method content"):
- כתיבה פורקת: "מחקרים מראים שכתיבה... מפחיתה את עוצמתן הרגשית ומסייעת לעיבוד הטראומה". The admin log shows an edit to this tool, but the current he text still has the sentence.
- Anxiety FAQ:
  - "זה מכבה את תגובת החירום של הגוף".
  - "חיוך מאולץ... משחררת אנדורפינים במוח ומפחיתה את רמת המתח". This is also a questionable claim.
  - "ההרפיה הפיזית מאותתת למוח להירגע".
- Sleep tool: "מסנכרנת את השעון הביולוגי", "האור הכחול פוגע בייצור מלטונין", "18-20 מעלות אופטימלי".
- Yoga Nidra tool: "מטרתו לסייע בשיפור השינה, הפחתת חרדה". BBM tool: "להפחית מתח, חרדה ותסמיני פוסט-טראומה".
- Muscle page intro: "תרגיל PMR מפחית מתח גופני". SEO descriptions: "עוזר להורדת חרדה, מתח והצפה רגשית".
- Children activities:
  - "שולחת אות למוח דרך העצב הוואגוס", "מפעילה את מערכת ההרגעה".
  - "למה זה עובד".
  - "הכלים הכי פשוטים והכי עוצמתיים".
- The apps tool is titled "אפליקציות מומלצות".

**Indexing defects that make the bot wrong** (worker, not content):
- `extractText` drops object keys, so labelled maps (ORG `phones` / `emails`, CONTACTS) are indexed as unlabelled values.
- `ageGroups` are not in the indexed text, and the children "הנחיות" rows have identical titles. The rights FAQs' sub-category (security / hostilities / ...) is not in the text either.
- `RELEASE_JOURNEY_CONTACTS` (`chatbot: true`) is all `$ref` to TEAM (not indexed), so it indexes an empty row.
- `RELEASE_JOURNEY_WAITING` ("+200 צוותים ברשימת ההמתנה") is not indexed. Veterans asking about waiting will not get it.

**selection.md errors**
- It says "Neutral descriptions exist in the treatment journey" for SE. They do not; SE appears only as a name in `military-ptsd-treatment`.
- The "page names" it relies on are breadcrumb-only (section 2).

## 8. Outside the requested scope (brief)

- **Follow-ups lose the playbook.** `handleChat` embeds and retrieves only the last user message, and playbook matching uses that same vector. Every row that ends with a scoping question breaks on the next turn: rights-overview, find-therapist, cant-afford, reservist, talk-to-child, child-after-trauma. The user's reply ("שירות צבאי", "בן 5") is matched alone: no playbook, and weak retrieval at `RETRIEVAL_MIN_SCORE = 0.4`. Consider embedding the last 2 user turns, or carrying the previous turn's playbook forward one turn.
- **`detectCrisis` misses common Hebrew phrasings that the crisis rows contain.** For example: "בא לי למות", "נמאס לי לחיות", "אני פוגע בעצמי", "חתכתי את עצמי", "לקחתי יותר מדי כדורים", "פוגעת בעצמה". For these, the crisis banner does not show, and the crisis row only applies if it is the top match at 0.72 or more. `crisis.ts` already says to review the list with a clinician. These phrases are a concrete starting list.
- The live backup has no `metiv` or `chatbot-qa` categories. None of this is live yet, so the fixes can go in before the first seed.
