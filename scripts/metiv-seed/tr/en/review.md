# en validation review

Scope: every id in batches 00-13 except ids whose context starts with `chatbot-qa/` (those are being rewritten and were not reviewed or edited). Batches 08, 10 and 11 contain only chatbot-qa ids. 46 strings changed in total. Final check: `node scripts/metiv-seed/check-translations.mjs en`: 2287 strings, 0 errors, 20 warnings. All 20 warnings are digit groups that differ because dates were localized (e.g. `14.5.25` -> `May 14, 2025`, `9/11`, `October 7`), plus the `1201` from the glossary form of ERAN. They are the same 20 the translator left, and I checked each one.

## People names: decisions (applied everywhere outside chatbot-qa)

English spellings from the author lists in `scripts/metiv-seed/he/metiv-papers.json` win:

- וולטמן / ולטמן -> **Alon Weltman** (was "Waltman"). The papers use "Alon Weltman" / "Weltman, A.".
- שרית שרם-יבין -> **Sarit Schramm-Yavin** (was "Schram-Yavin", 8 strings). The papers use "Sarit Schramm-Yavin".
- רחבי ששון -> **Sasson Rahabi** (was "Rachbi Sasson"). The Peace of Mind paper lists "Rahabi, S.", so Rahabi is the surname and the Hebrew puts it first.
- יואל ורדי -> **Yoel Wardi** (was "Vardi", 3 strings). The Peace of Mind paper ("Transitioning from the battlefield to home") lists "Wardi, J." next to Rahabi and Weltman. I assumed the Kaleidoscope lecturer is the same person.
- דליה (עמית) זיוון -> **Dalia Zivan** / **Dalia Amit Zivan**, following the Hebrew string. This matches the paper ("Dalia Amit Zivan"). I left it as is.
- No English source exists for these, so I kept the translator's forms: Asher Mekuanint Rachamim (the paper's "Rachamin, L." is a different person), Dr. Amichai Flor, Elia Ziman, Shlomit Hava, Tzipora Hayat, Bella Poni, Rachel Man.

## Per batch

**00** - 0 changes. The opinion piece and the About history are accurate and natural.

**01** - 4 changes
- 024e5b2ffd "Bodies Metiv has worked with" -> "Organizations Metiv has worked with" ("bodies" is a calque of גופים).
- 149d27519a "communities along the conflict line" -> "confrontation line" (the standard English term for קו העימות).
- 12ccf2ce51, 1a647add1b: Schramm-Yavin.

**02** - 11 changes
- c58e425096, d5086f272f "welcome to check whether they can join with Michal Zmora" -> "check with Michal Zmora ... whether they can join" (the old wording read as "join together with Michal").
- e56591b128, 351d0b82f6 "reservists' partners" -> "reservists' wives" (נשות מילואים is specific, and the translation had broadened it).
- 417567452a, c0438d3d50 "senior therapist" -> "longtime therapist" (ותיקה means long-serving, not senior in rank).
- 0ca9e339a5 "Psychologist in clinical psychology residency" -> "Clinical psychology intern".
- 5ca184511d "material that cannot be digested" -> "indigestible material".
- 2d79066e61 "deepen their practical approaches" -> "go deeper into practical approaches" (meaning).
- 1a2532a957 "stain" -> "blot" (art context).
- 9c5cb31c6a: Yoel Wardi.

**03** - 8 changes
- cb95f1b47a "GESHER MEACHED (a Hebrew acronym for coping resources)" -> "the BASIC Ph model (GESHER MEACHED in Hebrew)". גש"ר מאח"ד is the Hebrew name of Lahad's BASIC Ph coping-resources model. Please confirm.
- 70ce45ba32 "conflict line" -> "confrontation line".
- 14551f7157, 021939bcb4, ec92f46370, be52f72157, c8e2351643: Schramm-Yavin. 600546845a: Weltman.

**04** - 5 changes
- a4ca281537, de79623738 "bodies that want..." -> "organizations that want...".
- 7f0c468469 "To the anonymous questionnaire" -> "Take the anonymous questionnaire" (link label).
- 6121055e9d: Wardi. 8ab1c646b9: Schramm-Yavin.

**05** - 7 changes
- 15ff51698d, d93b50b69d "Share your experiences with services..." -> "Tell us about your experiences with services..." (the old wording could be read as sharing them with the services).
- 2e7f952ac9 "Bodies that have supported" -> "Organizations that have supported".
- ae4f7788ca, 9836473df7 "commissioning body" -> "commissioning organization".
- fc2ceb9951 "Rachbi Sasson" -> "Sasson Rahabi", and "contributed ... his personality" -> "personal qualities" (unidiomatic).
- ef8dccb975: Weltman, Wardi.

**06** - 4 changes
- cb56b1662f, c0adb5b3a7, 240ad55504 "... psychologist in residency" -> "Rehabilitation / Educational / Clinical psychology intern" (Israeli התמחות; now consistent with 0ca9e339a5).
- b929f4b850 "Security service personnel" -> "Security forces personnel" (consistent with 01f7175199).

**07, 09** - 0 changes (4 chatbot guidance strings with no context; they are accurate).

**12** - 5 changes
- 7fd3e661dc, 3103fdf853, 63472e857a, b4ebf168c9: "body/bodies" -> organizations / institutions / providers.
- 6b9a905101 "The target audience is detailed on request from the training coordinator." -> "Details of the target audience are available from the training coordinator."

**13** - 2 changes
- 242ba3d910, 13ffa5d163 "bodies" -> "organizations".

## Systematic issues in the translator's work

- The translator's work is strong overall: faithful, natural, no added efficacy claims, glossary followed (Peace of Mind, short-form Metiv, ERAN, NATAL, PANDA/NAMAL glosses only where introduced), no gender slashes left, Markdown and placeholders intact.
- The main recurring calque was **"bodies" for גופים**. I fixed it where it reads badly and kept it in "public bodies" and "funding bodies", which are idiomatic.
- Person names were not checked against the English sources available in the repo (see the name decisions above).
- **מתמחה** came out three different ways ("in residency", "in clinical residency", "in clinical psychology residency"). I standardized on "... psychology intern".
- A small number of literal phrasings changed the meaning (the "join with Michal" and "share with services" cases).

## Open questions for the owner / a native speaker

1. **צוות / צוותים אורגניים in Peace of Mind**: the translator uses "unit" ("soldiers who served together in the same unit", "units have completed the process", "Unit registration form"). An IDF צוות is smaller than a unit, more like a team or squad. I kept "unit" because it is used consistently and reads naturally. If peaceofmind.org.il's English uses "team", switch every occurrence. Supervision strings use "intact teams" for the same Hebrew, which is right in that context.
2. Yoel Wardi: confirm that the Kaleidoscope lecturer and the Peace of Mind co-developer are the same person.
3. BASIC Ph for גש"ר מאח"ד (cb95f1b47a): confirm.
4. Source errors (not changed, the translation follows the Hebrew):
   - e06e7bd3a2 says the CBT program starts on 14.10.2026 "on Mondays", but October 14, 2026 is a Wednesday.
   - f2d993818d gives the kids-trauma-basics start date as January 9, 2024, but the schedule says Thursdays 9.1-30.1. January 9 is a Thursday in 2025, not 2024.
5. d6c489a2f5 "Art therapists" (מטפלים באומנות) vs. "Creative arts therapists" elsewhere (מטפלים באומנויות): the Hebrew differs, so I left both. Unify if the owner prefers.

## Verdict

Publication-grade English after these fixes. The changes were mostly about name accuracy, a few meaning slips and calques. Nothing structural.

## Final round

Scope: all 539 ids whose context starts with `chatbot-qa/` and that are in the current `he.json` (in batches 00, 04, 06-10, 14-19), read row by row against `chatbot-qa/he.json` so old and new strings of each row read together, plus batches 20 and 21 in full. 47 strings changed. Final check: `node scripts/metiv-seed/check-translations.mjs en`: 2469 strings, 0 errors, 23 warnings. The 3 new warnings are expected: `כיתה ט` -> "9th grade", `התשמ"א` -> "5741" in the Privacy Protection Law citation, and "October 7".

Page names: every bold page name in guidance/answers matches the English label the v3 site shows for it (PATIENT_HUB / NEXT_STEPS / CONSULTATION / copy/chrome / ROUTE_META, and i18n.js for the exercise titles). Examples: Self-help tools, Calming exercises, Coping tools, Communities and meetups, Content for children, Where to get treatment, Free treatments and studies, Not sure whether to reach out?, Help now, Quick exit, Treatment Roadmap, Breathing Exercise, Grounding Exercise, Squeeze & Release. Bold counts match the Hebrew in every guidance and answer. Every phone number is intact (1201, 101, 100, 118, 1202, 1203).

Crisis rows (suicidal-thoughts, self-harm, someone-else-suicidal, plus the suicide branches in the other rows): no method details, direct and caring, ERAN 1201 in every one. The paraphrases that name a method ("how many pills...", "shoot myself") mirror the Hebrew on purpose, because they are matching triggers and the guidance tells the bot never to give method information.

### Notable fixes

Chatbot strings (44):
- e9d0250654 "I hurt myself. What should I do?" -> "I self-harm. What should I do?" (habitual present, and the old wording reads like a single accident).
- 811881e31b "I'm broken, I can't take it anymore" -> "I've had it, ..." (נשבר לי means "I've had it", not "I'm broken").
- 846d570fdc "I'm in really bad shape" -> "I'm in serious distress" (the old wording reads as physical).
- df6d0ec672 "it can help to put away..." -> "it's a good idea to put away..." (כדאי. "It can help" is an efficacy claim the Hebrew doesn't make).
- 3824110f0c "it's important to call yourself" -> "it's important that you call for help yourself" (ambiguous).
- 8ec26bea96, f9a507e863 "seeing this is shaking" / "It's shaking to see this" -> "really upsetting" (calque of מטלטל). Same calque in 15741f8928 and d3fde65c1f: "shaking event" -> "distressing event".
- 2b3d6dbce3 "whether I will be reported: answer honestly that no" -> "whether they will be reported: answer honestly that they will not" (the bot speaks in the first person in this guidance, so "I" pointed to the wrong party).
- e1636f19ca, 20f874b3f0 "organic teams (people who served together) ... individual treatment" -> "soldiers who served together in the same unit ... individual therapy", matching the Peace of Mind wording in batches 00-13.
- 034db834a7 "minors with a parent or guardian" -> "minors only accompanied by a parent or guardian".
- 5115dc85a8 broken sentence ("For parents of children ages 0-9, you can come...") rewritten.
- Natural-paraphrase fixes (tense, idiom): a240ec0bca, 866622019b, 5595bd4e8c, 2d5b13b4e3, b50c18d31f, 86b3c46f13 ("I'm post-traumatic" -> "I'm traumatized"), abe803b8e7, 06d223ceeb, 9fce315a33, fec01e0604, a80e03b14a, 91ab1ebcc7 ("my brother fell in Gaza" -> "was killed in Gaza"), 139285f00f, 73c40481c6, 6fe6b0a58c, 394ba36c49, c255a544dd.
- Small wording fixes: a05aacdd9f, 91aa8deac2, d3fde65c1f, 7cc934715f, b043d42377, 3912668665, 0e48b52965, fc242a77f8, d7d96f459f, 9766f57d28 ("credit points" -> "continuing education credits"), and "bodies" -> "organizations" in 6e0a4ff1be, fb9ab01f65 ("authority"), ef265ed073, e8e7170766.

Batch 20 (0 changes): the 4 labels are correct.

Batch 21 (3 changes):
- 7626ef041f "the track you chose" -> "the path you chose" (the site's term for the patient paths, and what the PTSD-IL English privacy policy uses).
- d8ccb7177e "automatically scrape its content (scraping)" -> "scrape its content automatically" (redundant).
- 305e396849 "create a beneficial space" -> "a space that does good" (מרחב מטיב plays on Metiv's name); "a recurring cycle in the service provider" -> "on the service provider's side"; "adapted service" x2 -> "service adapted to it" / "trauma-informed service".
- The legal texts are otherwise accurate and in a proper legal register. All headings, lists, bold, links and link targets are preserved, and "5741-1981" is the correct English citation of the law.

### Systematic issues
- The 07-10 paraphrases were mostly fine. The recurring issue there was tense ("since X" with the simple present).
- The 14-19 guidance and answers were faithful and safe-messaging compliant. The main problems were a few calques (מטלטל, גופים, צוותים אורגניים) and one efficacy-tinted "it can help".
- The translator dropped the "the bot speaks about itself in the masculine" bullet in who-are-you. That is correct for English.

### Open questions
1. Two Hebrew names for the questionnaire (שאלון בדיקה עצמית vs. שאלון אבחון עצמי) come out as "PTSD Self-Assessment Questionnaire" (page title) and "Self-assessment questionnaire" (menu label). This follows the source, which says "(in the menu: ...)". Keep it unless the owner wants one name.
2. "hostile acts" (פעולות איבה) is kept to match the glossary and batches 00-13, even though "terror attacks or hostilities" reads more naturally.

### Verdict
Publication-grade after these fixes. Old and new strings of each row now read consistently, and the crisis rows are safe.
