# Chatbot playbooks (he.json) - changelog

This is the final Hebrew set after `review-safety.md` and `review-accuracy.md`. It went from 30 rows to 35: 1 row merged away, 6 rows added.
Schema unchanged: `{_key, question, paraphrases[], guidance, answer, crisis}`.

Validation (run on the written file): JSON parses, 35 unique keys, no U+2013/U+2014, every row has 8-14
paraphrases, every answer is 60-180 words (min 77, max 136), every `crisis: true` row has 1201 in both guidance and
answer, no paraphrase is shared between rows, every guidance line is a Markdown bullet.

## Global decisions

1. **Crisis flags.** Only the 3 suicide / self-harm rows are `crisis: true`. `panic-attack-now`, `flashback-now`,
   `overwhelmed-now` and `loved-one-episode-now` are now `crisis: false`, and so are all the new rows. Reason: only one
   crisis row is force-injected when `detectCrisis` fires, and that only happens on suicide or self-harm wording.
   Non-suicide crisis rows could take that slot and push out `suicidal-thoughts`. The 4 acute rows still match as
   normal playbooks. Each one now has a first-position branch that says: if suicidal content appears, follow the suicide
   order (1201, "את/ה בטוח/ה עכשיו?", 101 / 100, then everything else).
2. **Page names** use what the user sees in the patient tab bar, the H1 or the hub, not the breadcrumb-only `ROUTE_META`
   labels. Checked against `metiv-patient-nav.json`, `metiv-patient-hub.json`, `src/lib/i18n.js` and `copy/*.json`:

   | before | now |
   |---|---|
   | מה זה פוסט-טראומה | **על פוסט-טראומה** |
   | עזרה עצמית | **כלים לעזרה עצמית** |
   | המסע הטיפולי | **מפת הדרכים לטיפול** (H1). The tab is "טיפול", given once in `have-ptsd-what-to-do` |
   | קהילות תמיכה | **קהילות ומפגשים** |
   | לדבר עם ילדים | **תכנים לילדים** |
   | כלים לבני משפחה | **כלים להתמודדות** |
   | קרובים ובני משפחה | **קרוב/ה של מתמודד/ת** |
   | מי שחווה אירוע קשה | **מתמודד/ת עם פוסט טראומה** |
   | שאלון אנונימי | **שאלון בדיקה עצמית** (matches the H1 "שאלון בדיקה עצמית לתסמיני PTSD"), plus "בתפריט: שאלון אבחון עצמי" so the user can find it |
   | נשימה / קרקוע / הרפיית שרירים | **תרגיל נשימות** / **תרגיל קרקוע** / **כיווץ ושחרור** |
   | אירועים ועדכונים | **אירועים** (therapist tab) |
   | קורסים והכשרות | kept (H1), plus "בתפריט: קורסים" |

   Assumption: I did not use "שאלון אנונימי" as the review suggested, because the user never sees that string. The
   chosen name keeps the "not a diagnosis" framing, and the menu label appears only so the page can be found.
3. **ERAN WhatsApp** is unconditional and points to the **עזרה עכשיו** button (both reviews). The link is in that popover on every page.
4. **"Nobody reads"**: "אף אחד לא קורא בזמן אמת" became "אף אדם לא קורא את השיחה" (accuracy G4, matches the privacy policy).
5. **Consultation** is described as a section, not a page: "שיחת התייעצות עם מטיב (החלק **לא בטוחים אם לפנות?** בעמוד
   **איפה מקבלים טיפול**, וגם בכפתור **עזרה עכשיו**)". This full form goes in guidance; answers just say "שיחת התייעצות עם מטיב".
6. **Bot self-reference** is masculine throughout (checked by grep).
7. **Fixed numbers in rows**: 1201, 101, 100 (as before), 1202/1203 (on the site and stable), and **118** (welfare
   hotline, NOT on the site, see sign-off).

## Rows removed / merged

- **therapist-supervision** was merged into **therapist-courses**. I agree with the accuracy review: the chat widget is only
  mounted in the patient layout, SUPERVISION and COURSES are not indexed (so the "from SOURCES" branches could never
  fire), and the two rows' paraphrases collided (price, Zoom, team training). 5 supervision paraphrases moved over. The
  safety review's "patient is suicidal" paraphrases went to `someone-else-suicidal`, which holds the crisis slot for
  that wording.
- **domestic-violence-danger** (safety) and **violence-at-home** (accuracy) were merged into one row, **violence-at-home**.
- **minor-user** (safety) and **teen-parent-ptsd** (accuracy) were merged into one row, **teen-user**. Same audience and
  same safety lines. The two intents (a minor writing in, a teen with a parent with PTSD) are both covered in guidance and paraphrases.
- **treatment-in-my-language** (accuracy) was **not added**. Low stakes, and the "don't invent providers" rule is already in
  the system prompt and in `find-therapist-psychiatrist` ("שפות טיפול" added to its no-invent list). Its foreign-language
  paraphrases in a Hebrew row would also pull generic Arabic, Russian, French and English therapy questions to a "the site
  doesn't say" answer. Language rows come from translation anyway.

## Rows added

| _key | source | why kept |
|---|---|---|
| violence-at-home | both reviews (merged) | High stakes, stable, and no site content, so retrieval would serve communication tips. Safety order: 100/101, leave with the children, quick exit, 1201 + 118, no confronting or couples advice, no justifying the violence by trauma, no secrecy. |
| child-in-danger | safety | High stakes, stable. Two branches (the child writing / an adult worried). No investigating, no legal advice on reporting duty, 118 for adults. |
| fear-of-harming-others | safety | High stakes, stable, nothing for retrieval to find. Distance, 100, weapon away, 1201. Dropped the paraphrase "בא לי להרוג אותו": everyday slang would trigger a safety script. |
| teen-user | both (merged) | Register and safety for under-18s, plus the site's teen secondary-trauma content (14-16 / 16+). |
| what-is-flashback | accuracy | It is one of the 3 chat starters, and it collided with the acute `flashback-now`. The row exists so the information question wins the match. The bare "פלשבק" moved here. |
| bereaved-traumatic-loss | accuracy | Frequent in Israel since Oct 7, and there is no site page for it. The row only routes (adults clinic lists "אובדן טראומטי", 17+, Jerusalem and Zoom, verified in seed) and states the gap. No grief content invented. |

## Per-row changes

### suicidal-thoughts (crisis: true)
- First bullet added: a mis-route guard for "my wife said she doesn't want to live" (answer as a worried relative, don't ask "are you safe?") (safety).
- Opening changed from "אני שמח שכתבת" to "וטוב שכתבת לי" (safety).
- Immediate danger now says "101 or 100 now; the ER only with someone accompanying you". Before, it sent the user to the ER alone (safety + accuracy's "ER" kept).
- Added: a means-restriction line (pills / weapon) in guidance and answer, a no-method-information rule, a line for young users, and a follow-up line: if "לא" or "already did something" comes later, go straight back to 101/100.
- Paraphrases: the bare "להתאבד" became "בא לי להתאבד" (accuracy). Added נמאס לי לחיות, תכננתי איך לעשות את זה, כתבתי מכתב פרידה, כמה כדורים צריך כדי לא להתעורר, אני רוצה לירות לעצמי בראש. Merged the two "since the war/trauma" variants and dropped "אין לי סיבה לחיות" and "רוצה לגמור עם הכל" (detectCrisis already catches the latter) to stay at 14. "אני לא רואה טעם להמשיך" became "...להמשיך לחיות" so it stays apart from `overwhelmed-now`.
- Not taken: the line "ERAN is open to teens too". It is a claim about ERAN that is not on the site, and the instruction to tell a trusted adult covers the need.

### self-harm (crisis: true)
- Opening changed to "טוב שכתבת". "דחף שעדיין לא מומש" became "דחף, ועוד לא פגעת בעצמך" (safety).
- Police is now tied to "imminent danger or thoughts of ending life", not to thoughts alone. Added "even after calling MDA, don't stay alone".
- Added: a mis-route guard (someone else self-harming), the no-method rule, and a line on moving away what can be used to self-harm.
- Paraphrases: added בלעתי כדורים and לקחתי את כל הכדורים. Dropped "self harm" (English, already in detectCrisis) and "פגיעה עצמית אחרי טראומה" (informational, it would pull "what is the link between..." questions).

### someone-else-suicidal (crisis: true)
- Added: a mis-route guard (writer is talking about themself), a branch for a child or teen, a branch for a professional asking about a patient (no clinical advice, 101/100, institution protocols, supervision), the no-method rule, "you may ask directly", and means removal if safe.
- Immediate danger now includes "ER / psychiatric ER" (on site, accuracy). מוקד סה"ר is named as a SOURCES-only option.
- Paraphrase added: "מטופלת סיפרה לי שהיא חושבת להתאבד" (moved from the supervision row, safety).
- Not taken: the safety review's "ERAN is also open to professionals for consultation". It is not on the site.
- Answer: "כלים לבני משפחה" became "כלים להתמודדות"; the ask-directly and means lines were added.

### panic-attack-now (crisis: true -> false)
- Added: a first-position suicide branch, an alarm / protected-space line, a branch for informational questions (no emergency script), "don't say it's not dangerous", and "chest pain or pressure, real breathing difficulty" in the 101 line.
- Exercise names: **תרגיל נשימות**, **תרגיל קרקוע**, **כיווץ ושחרור**.
- Paraphrases: dropped the bare "התקף חרדה" (informational collisions).

### flashback-now (crisis: true -> false)
- Opening changed to "מה שעולה עכשיו הוא זיכרון של מה שהיה" (no "it's over"). Added a real-danger branch (alarm, real danger, or the abuser is near: protected space / 100, never say the danger is over) and a suicide branch.
- Added: "confusion doesn't pass or unusual physical sensation: 101", and an informational-question branch.
- Paraphrases: dropped "פלשבק" (it moved to `what-is-flashback`).

### overwhelmed-now (crisis: true -> false)
- Added: a suicide branch first, "nobody reads" in guidance and answer, and WhatsApp through the button.
- Answer: the double 1201 was fixed (safety's replacement block). Removed the "עזרה עכשיו" paragraph to make room for the bot line. The button is still named in the 1201 line.
- Paraphrases: נשבר לי, אני צריך עזרה עכשיו and אני גמור got distress qualifiers (accuracy). "אני במצוקה" became "אני במצוקה קשה עכשיו".

### loved-one-episode-now (crisis: true -> false)
- Safety line extended: leave the room with the children, and a weapon + fear of violence means 100 immediately (both reviews). Added "don't let 'keep their dignity' stop you calling for help", a branch for repeated violence pointing to `violence-at-home`, and a branch for when the loved one talks about dying.
- Paraphrases: "בן זוגי עם פוסט טראומה מתפרץ עכשיו" moved to `violence-at-home` (as "הוא מתפרץ עכשיו ואני מפחדת"), where the safety order is complete.

### sexual-assault
- Option A from the safety review: **1202 / 1203** are in the answer body. They are on the site and are stable national lines.
- The "recent" line was reordered: danger means 100; injury or the last few days means medical care (101 / ER); "the decision to report is yours".
- Rights: the category name **הטרדות מיניות** is correct. The NII-claim-without-police-complaint fact is in guidance only, conditional on being asked, and only as SOURCES phrase it. I left it out of the answer so the first reply doesn't load the user with procedure.
- Added: a branch for a minor or ongoing abuse (the child-in-danger order), and "adults clinic from age 17".

### just-experienced-event
- Added: "you can ask for consultation now, no need to wait" (safety), a line on ongoing events / Home Front Command, a road-accident gap line, and the evaluation timing as "if no improvement after a few weeks", never a number (accuracy; the site has two conflicting numbers).
- Paraphrases: dropped "הבן שלי היה עד לפיגוע אתמול" (moved to `child-after-trauma`).

### have-ptsd-what-to-do
- Page names. Paraphrases: "יש לי ptsd" became "יש לי ptsd, מה עושים עכשיו", added the Oct 7 phrasing, dropped the generic "מה אפשר לעשות כשיש טראומה".

### do-i-have-ptsd
- Questionnaire facts (about 3 minutes, anonymous, answers stay in the browser; from the hub card and the privacy policy, neither of which is indexed) plus the menu label. Timing fix. Hebrew fix "ולברר את זה, זה לא להגזים". Paraphrase "יש לי PTSD?" became "האם יש לי PTSD?". Added a 1201 line.

### find-therapist-psychiatrist
- Added: "the site keeps no private therapist list and does not recommend". The medication line dropped "רק" (safety). Added "שפות טיפול" to the no-invent list.
- Paraphrase: "טיפול בטראומה בזום" became "טיפול פסיכולוגי בזום לפוסט טראומה".

### cant-afford-treatment
- Honesty about who the free services are for. The answer now says "mostly for veterans, reservists and their families" (accuracy). Dropped the reservist paraphrase (duplicate of `reservist-veteran-help`).

### waiting-for-treatment
- Added: treatment approval while waiting for an Agaf HaShikum decision (indexed FAQ). Kids space age 0-9. Added paraphrase "מחכה להחלטה של אגף השיקום ואין לי טיפול".

### contact-metiv
- Phones only when SOURCES label what a number is for (the ORG list is indexed without labels and includes fax / WhatsApp). Added "ERAN WhatsApp via the button" for distress. Paraphrase "יש לכם וואטסאפ?" became "יש למטיב וואטסאפ?".
- Not taken: hardcoding 02-6449666 / info@metiv.org. That is changeable data; owner rule.

### which-treatment-is-best
- "שיטות שעובדות עם" became "שיטות שמשלבות" (efficacy reading). Added the SE gap bullet. The MDMA paraphrase moved to `research-participation`.

### medication-question
- Dropped "רק" (GPs prescribe too). Added: don't question an existing prescription, "שילוב עם אלכוהול" in the 101 line, and a cannabis rights-only bullet. Hebrew "למנן" became "לקבוע מינון". Dropped the "כדור שינה לסיוטים" paraphrase (it duplicated `sleep-nightmares`).

### rights-overview
- Track list uses the site's category names and order. Work accidents only. Added bereaved families as a stated gap.

### reservist-veteran-help
- Migdalor is "for those already recognised". Added: an active-duty bullet (the site has nothing inside the army), the parents / spouses groups, and a weapon + self/other-harm switch to the safety rows.
- Paraphrase: "פוסט טראומה מהצבא" became "איזו עזרה יש למי שיש לו פוסט טראומה מהצבא".

### sleep-nightmares
- Page and exercise names only. No safety change (the review said OK).

### substance-use
- Added: "heavy daily use: talk to a doctor before stopping abruptly" (sign-off), and cannabis in the "can't advise" line.

### calm-down-now
- Exercise names (**כיווץ ושחרור**, 6 muscle groups, about 2 minutes, verified in i18n). Hebrew fix "אם זה יותר מלחץ". Added a suicide switch line.

### support-loved-one
- Violence / threats / weapon bullet plus answer line ("PTSD doesn't oblige you to endure violence", not "PTSD is no excuse"). Page names. The answer was compacted to stay under 180 words.

### family-member-own-support
- Paraphrases: the three confusables from the accuracy review were reworded. Added a fear / violence switch and a suicide switch.
- Kept, not dropped: the review called it optional. It routes to groups and adds 1201 for a burned-out caregiver, and two FAQs alone don't give that order.

### talk-to-child-about-parent
- Added: a violence-first bullet, the "it's not because of you" principle (it recurs across age tabs on the site), the age-tab list, "don't guess the age of an untitled 'הנחיות' item", and "don't repeat 'פוסטמטי'". Fixed the claim that every age has books and activities. Two paraphrases were reworded.

### child-after-trauma
- The guidelines are no longer presented as being for a child who went through an event (they were written for a parent with PTSD). Kids space is now "0-9, Jerusalem". The safety bullet now says don't leave alone + 101/100, and points to `child-in-danger`.
- Paraphrases: "מטיב ילדים" became a full question. Added "הבן שלי היה עד לפיגוע אתמול".

### research-participation
- Received the two MDMA "does it work" paraphrases. Added a "don't answer whether it works" line and a "self-use MDMA: no judgement, 101 if unwell" line.

### therapist-courses (merged)
- New question including supervision. Generic paraphrases were qualified. Dead SOURCES branches were replaced with "details are on the course or supervision page". Added: the supervision options (individual, group, team, kids), "no case consulting", and "patient at imminent risk: 101/100 + protocols".
- Not carried over: the supervision row's "פתוח גם לאנשי מקצוע" (not on site) and the past supervision group.

### who-are-you
- Privacy facts are written into the playbook, because the legal pages are not indexed: nobody reads, Metiv doesn't store, Cloudflare + Gemini, outside Israel, not used for training, IP logged by hosts, the detector can miss. "זה אנונימי?" never gets a flat yes.
- Added: "will you report me" (honest no, then 1201), quick exit, age 18+.
- Paraphrases: dropped "אתה יכול לאבחן אותי?" (`do-i-have-ptsd` owns diagnosis). Three generic ones were made bot-specific.

## Review suggestions not taken (and why)

- Safety's "ERAN is open to teens" and "ERAN is open to professionals": these are facts about ERAN that are not on the site. Dropped.
- Accuracy's NII-without-complaint line in the sexual-assault **answer**: kept in guidance only. See above.
- Accuracy's G1 option (a), the site fix: that is outside the playbooks, so I applied option (b). If the site later aligns its labels, re-run a name pass.
- Accuracy's hardcoding of Metiv contact numbers: these change. Left to SOURCES.

## Needs clinical sign-off

Safety advice in the rows that is **not on the site**. Each item lists the rows it appears in.

1. **Means restriction, self**: move pills or a weapon away, or give them to someone to hold. (suicidal-thoughts; self-harm, phrased as "move away what you could hurt yourself with")
2. **Means restriction, other person**: if it can be done safely, remove pills or a weapon. (someone-else-suicidal)
3. **Weapon when afraid of harming others**: deposit it with someone else or in a locked place, away from you. (fear-of-harming-others)
4. **Weapon + fear of violence by a loved one means police 100 immediately.** (loved-one-episode-now, violence-at-home, support-loved-one)
5. **Ask directly about suicidal thoughts**, without claims about what asking does. (someone-else-suicidal; also "את/ה בטוח/ה עכשיו?" in the self rows)
6. **No method, quantity, medication or lethality information, even if asked.** (suicidal-thoughts, self-harm, someone-else-suicidal)
7. **Don't stay alone; call someone to come.** Also "even after calling MDA". (suicidal-thoughts, self-harm, overwhelmed-now)
8. **The ER only with someone accompanying you, not alone.** (suicidal-thoughts)
9. **No secrecy promises.** (someone-else-suicidal, violence-at-home, teen-user, loved-one-episode-now branch)
10. **Stay with them or in contact if it is safe for you; listen without arguing.** (someone-else-suicidal)
11. **Child/teen at risk: don't leave alone.** (someone-else-suicidal, child-after-trauma)
12. **Protected space first during an alarm / ongoing event (Home Front Command).** (panic-attack-now, flashback-now, just-experienced-event)
13. **Flashback: don't say the danger is over; if the abuser is near, 100.** (flashback-now)
14. **Persistent confusion or unusual physical sensation means 101.** (flashback-now)
15. **Chest pain or pressure, real breathing difficulty, fainting, or unsure it's anxiety means 101; don't call it "not dangerous".** (panic-attack-now)
16. **Large amount / mixing with medication or alcohol / feeling unwell means 101.** (self-harm, medication-question, substance-use, research-participation for self-use MDMA)
17. **Don't change or stop medication without the prescriber; don't question an existing prescription.** (medication-question)
18. **Heavy daily alcohol or sedative use: talk to a doctor before stopping abruptly.** (substance-use)
19. **Loved one in an episode: keep distance, leave the room with the children, 100 if at risk.** (loved-one-episode-now)
20. **Domestic violence: leave to a safe place with the children, no confronting, no couples advice, no "how to calm him" as a substitute for safety, don't justify by trauma.** (violence-at-home, support-loved-one)
21. **Welfare hotline 118** for domestic violence and for adults worried about a child. This is a national number but it is **not on the site**. Recommendation: add it to `metiv-nonprofit-options` so retrieval carries it too. (violence-at-home, child-in-danger, sexual-assault minor branch)
22. **Child abuse disclosure: believe, "not your fault", tell a trusted adult who isn't the abuser, don't investigate, don't confront the abuser, no legal advice on reporting duty.** (child-in-danger, teen-user)
23. **Minor users: encourage telling a trusted adult; don't ask for identifying details.** (suicidal-thoughts, teen-user, child-in-danger)
24. **Sexual assault: medical care after injury or within the last few days; "the decision to report is yours".** (sexual-assault)
25. **Professional asking about an at-risk patient: no clinical advice or risk assessment, 101/100 + institution protocols + supervision.** (someone-else-suicidal, therapist-courses)
26. **"Will you report me?": honest no, then 1201.** This comes from the privacy policy; the sign-off is about the framing. (who-are-you)

On-site facts, recorded so they are not mistaken for additions: 1201 (24/7), 101, 100, psychiatric ER and מוקד סה"ר
(distress-signs callout), 1202/1203, the 18+ age rule and the privacy facts (legal docs), quick exit and Shift x3 (chrome copy).

## Outside the playbooks (flag)

- `en.json` and `ru.json` appeared in this folder while this pass was running. They are now stale: they still have
  `therapist-supervision`, the old crisis flags and the old page names, and they lack the 6 new rows. Regenerate them from this he.json.
  `scripts/metiv-seed/tr/context.json` also still lists the `therapist-supervision` strings.
- `chat.ts` now matches the crisis playbook against the most recent crisis message of the last 3 user turns
  (`recentCrisisMessage`), so the "reply 'לא' loses the playbook" issue from the safety review is already handled in code.
  The follow-up bullet in `suicidal-thoughts` is a second layer.
- `detectCrisis` still misses "נמאס לי לחיות", "חתכתי את עצמי", "לקחתי יותר מדי כדורים" and "פוגעת בעצמה". These rows reach them by embedding only.
- Site fixes from both reviews still apply: the questionnaire nav label "שאלון אבחון עצמי" contradicts "not a diagnosis";
  the recovery timeframes conflict; the "רק פסיכיאטר" wording; efficacy wording in the panic FAQ, the sleep tool and the
  children activities; 118 is missing from the help options.
