# fr - validation review

Scope: all 14 batches, skipping ids whose context starts with `chatbot-qa/` (batches 08, 10, 11 are entirely chatbot-qa and were not reviewed; 06, 07, 09, 12, 13 partly).
Final check: `node scripts/metiv-seed/check-translations.mjs fr` - 2287 strings, 0 errors, 45 warnings. All 45 warnings are digit-group differences from localized dates/times ("9:00" -> "9 h", "28.2-1.3.23" -> "du 28 février au 1er mars 2023", "9/11" -> "11 septembre", "ב'-ו'" -> "2e à 6e", the ERAN glossary gloss adding "1201"). I checked each one; none is a lost or wrong number.

Strings changed: 38.

## Per batch

### 00 - 2 changed
- aeffc65537: "Metiv - Centre israélien de psychotraumatologie a été fondé" -> "Metiv, Centre israélien de psychotraumatologie, a été fondé" (the dash form made the sentence ungrammatical).
- 48f820e9c3: "30-40 pour cent des patients" -> "30 à 40 % des patients" (French form for a range).

### 01 - 5 changed
- 1696e49cf2: "le Pr Esther Cohen et le Pr Ruth Pat-Horenczyk" -> "la Pr ... la Pr ..." (both women).
- 3a5dcf658b: "Conseillers d'orientation scolaire" -> "Conseillers scolaires" (יועצים חינוכיים are school counselors, not career-guidance staff; now the same as "Conseillère scolaire principale" elsewhere).
- 829917937c: "invalides de Tsahal" -> "soldats invalides de Tsahal".
- fba994c20e: "nous en rencontrons de nombreuses manifestations" -> "nous rencontrons de nombreuses manifestations des effets du traumatisme" (the Hebrew says manifestations of trauma's effects; "en" pointed at "ces approches").
- 74f8a1f186: "plus long et plus complexe" -> "plus long et plus difficile" (it said "traumatisme complexe ... plus complexe").

### 02 - 6 changed
- 0ca9e339a5: "en formation de spécialisation" -> "en cours de spécialisation" (פסיכולוגית מתמחה; used the same way everywhere now).
- a551b70aa3, d33dabbaa7: "centre du traumatisme" -> "centre de psychotraumatologie" (מרכז הטראומה = Metiv; "centre du traumatisme" reads like "the center of the trauma").
- 47704f3722: "L'accouchement ... bénéficient" -> "Les accouchements ... bénéficient" (agreement); "naissances silencieuses" -> "mortinaissances" (לידות שקטות = stillbirths; the old text was a calque).
- e039e667d3, 94100bb1c2: "L'usure de compassion chez le thérapeute et son rôle" -> "La fatigue de compassion : le thérapeute et son rôle" ("fatigue de compassion" is the standard French term; the old wording read as if the therapist's role was worn out). 94100bb1c2 also: "cours d'apprentissage fondamental et complet" -> "cours pour un apprentissage approfondi et complet".

### 03 - 7 changed
- be52f72157, 09d0bd723d, 21097679f1, e8e0ab899b: "le Pr Ruth Pat-Horenczyk" / "le Pr Esther Cohen" -> "la Pr ...".
- 7cbe02053d: "PANDA primaire" -> "PANDA pour l'école primaire" (פנד"ה יסודי).
- 7895ade870: "Conseillers d'orientation scolaire" -> "Conseillers scolaires".
- c959e4a175: "L'association Metiv - Centre israélien ..., intervient" -> "L'association Metiv, Centre israélien ..., intervient" (punctuation).

### 04 - 4 changed
- 0fe47acae9: "Formation PANDA primaire pour thérapeutes" -> "Formation PANDA pour l'école primaire, destinée aux thérapeutes".
- 704e32ed8d: "« Une année d'adaptation »" -> "« Une année à faire face »" (שנה של התמודדות; "adaptation" missed the point).
- d8d9f08bd8: "**Au programme ?**" -> "**Au programme**" (the question mark copied from Hebrew does not work in French).
- f063e1ec93: "animé par le Dr Michal Simchon" -> "la Dr".

### 05 - 5 changed
- 38b3ebdffb: "Vous n'êtes pas seul(e)" -> "Vous n'êtes pas seuls" (a gender-slash leftover; matches the wording in ORG intro).
- 1f16e99281: "s'engage à les rendre plus forts" -> "s'engage à renforcer leur pouvoir d'agir" (העצמה = empowerment).
- fc2ceb9951: "Rahavi Sasson" -> "Sasson Rahabi" (metiv-papers.json has "Rahabi, S." on the Peace of Mind paper with Brom, Pat-Horenczyk and Weltmann. The Hebrew "רחבי ששון" lists the surname first, military style).
- ea45c797bb: "diplômés du programme" -> "anciens participants du programme" (veterans of a soldiers' program, not graduates of a course).
- ef8dccb975: "composée du Pr Ruth Pat-Horenczyk" -> "de la Pr".

### 06 - 3 changed
- 02b749bcb5: "Usure de compassion" -> "Fatigue de compassion" (same term as 02).
- 240ad55504: "Psychologue en spécialisation clinique" -> "en cours de spécialisation clinique".
- 0c23bd81fe: "vit lui-même beaucoup de ces qualités" -> "vit lui-même une grande partie de ces mêmes états" ("qualités" was a literal rendering of איכויות).

### 07 - 0 changed (2 non-chatbot strings, both fine)

### 09 - 1 changed
- 99156bf64e: fixed the stacked colons ("**Respiration** : on suit un cercle : ...", "**Ancrage** : 5-4-3-2-1 : ...").

### 12 - 5 changed
- b215c9e2d5: "installé à l'adresse suivante : {address}" -> "installé à {address}".
- 78bcfb8b94: "Quitte immédiatement pour un autre site" -> "Redirige immédiatement vers un autre site".
- 3f3b166c72, 3750ccc9c3: "Uniquement les cours en cours" / "Cours en cours" -> "... cours actuels" / "Cours actuels" (it repeated "cours").
- af2f085348: heading "Que fait-on dans Peace of Mind" -> "Ce que l'on fait dans Peace of Mind".

### 13 - 0 changed

### 08, 10, 11 - not reviewed (chatbot-qa only)

## Consistency list (checked across all files)
- People: Ruth Pat-Horenczyk, Sarit Schramm-Yavin, Anna Harwood-Gross, Claude Chemtob, Danny Brom, Alon Weltman, Dalia Zivan / Dalia Amit Zivan (the Hebrew source has both forms), Michal Zmora, Michal Simchon, Gafnit Agasi, Nili Lavie, Yoel Vardi, Tamara Weiner, Uri Birnbaum, Sasson Rahabi. Each person now has one spelling everywhere.
- Titles: "Pr" / "Dr" with no period. A woman takes "la Pr" / "la Dr" when an article is needed.
- Terms: TSPT, TCC, supervision, régulation émotionnelle, « La feuille de route », Kaléidoscope, Espace Metiv, Metiv Enfants, PANDA / PANDA à deux / NAMAL, Peace of Mind, Département de réadaptation, clinique Migdalor, caisses de maladie, unités constituées (צוותים אורגניים), fatigue de compassion, prix in ₪.
- Typography: a normal space before : ; ? ! and inside « », with no NBSP anywhere (checked by script). The trailing and leading spaces in the concatenated fragments (authorsJoin, meanwhileBefore/After, statsSourceBefore, formatOr, byAnswers, whyFits, visionLabel) are intentional and were kept.

## Systematic issues in the translator's work
- Grammatical gender of "Pr"/"Dr" for women was wrong in 7 places. All are fixed.
- A few literal calques ("naissances silencieuses", "centre du traumatisme", "qualités", "usure de compassion").
- One leftover gender form "(e)".
- Overall the work is faithful: no added efficacy claims, caveats kept, Markdown, placeholders, URLs and numbers intact, no Hebrew and no dashes left.

## Open questions for a native speaker / the owner
1. Pinchas Dannon (Herzog head of psychiatry): his English publications usually spell it "Pinhas N. Dannon". It is kept as "Pinchas Dannon" because metiv-papers.json has no entry for him. Confirm.
2. The person names with no Latin source (Tzipora Hayat, Asher Mekuanent Rahamim, Keren Alaluf, Ruth Havshush, Yehuda Lapian, Amichai Flor, Anna Portugalov, Bella Poni, Rachel Mann, Stav Nisser, and the other staff) are the translator's transliterations. Metiv should confirm the spellings each person uses.
3. Sasson Rahabi: the order was inferred from the paper author list. Confirm.
4. School grades "de la 2e à la 6e année" (כיתות ב'-ו'): this is neutral but Quebec-flavoured. The France equivalent (CE1 to 6e) is confusing for an Israeli school system. Kept as is.
5. 2c6ff802e7 "Institut Magen Avraham - études Lachem pour l'éducation spécialisée": the Hebrew "לימודי השם" is unclear (a name?). Check with Metiv.
6. "« Peace of Mind »" appears in guillemets in 3 team bios because the Hebrew quotes it there. Drop the guillemets if a uniform program name is wanted.

## Verdict
High quality and publication-ready after these fixes. The French is natural and the register is right for both audiences. Terminology is consistent and nothing in the meaning was distorted.

# Final round

Scope: every `chatbot-qa/` id in the current tr/he.json (539 strings, all 35 rows of chatbot-qa/he.json read whole: question + paraphrases + guidance + answer, old 07-10 strings checked against new 14-19 strings of the same row; a few row strings sit in 00, 04, 06 and were checked too, 0 changed there), plus batches 20 and 21.
Final check: `node scripts/metiv-seed/check-translations.mjs fr` - 2469 strings, 0 errors, 47 warnings. The two new warnings are in 21 and expected: "התשמ"א-1981" -> "5741-1981" (Hebrew year written as a number) and "השבעה באוקטובר" -> "7 octobre".

Strings changed: 113 (07: 9, 08: 22, 09: 21, 10: 19, 14: 7, 15: 10, 16: 10, 17: 5, 18: 6, 19: 1, 20: 0, 21: 3).

## Page names (decision, applied to every chatbot string)
The two translators used different names for the same pages. Rule used: the name the French visitor sees on the v3 site. For the PTSD-IL pages that v3 renders unchanged (their h1 and patient tab bar come from src/lib/i18n.js), the i18n.js fr title; for the Metiv pages, the fr copy/ROUTE_META/NAV strings.
- תרגילי הרגעה -> **Exercices de calme** (calming_title); תרגיל נשימות / תרגיל קרקוע / כיווץ ושחרור -> **Exercice de respiration** / **Exercice d'ancrage** / **Contraction et relâchement**
- כלים לעזרה עצמית -> **Outils d'auto-aide**; כלים להתמודדות -> **Outils d'adaptation**; על פוסט-טראומה -> **À propos du post-traumatisme**; מפת הדרכים לטיפול -> **Feuille de route du traitement** (menu: **Traitement**); זכויות -> **Droits** (categories as rights_*: Forces de sécurité, Harcèlement sexuel, Victimes d'actes hostiles, Accidents et travail, Général / autre); קהילות ומפגשים -> **Communautés et rencontres**; תכנים לילדים -> **Contenu pour les enfants**
- קרוב/ה של מתמודד/ת -> **J'accompagne un proche** (path2_title, the second-circle page title; 6 strings said "Vous êtes proche d'une personne concernée", the PATIENT_NAV label); מתמודד/ת עם פוסט טראומה -> **Je vis avec un traumatisme** (path1_title); אני לא בטוח/ה -> **Je ne suis pas sûr(e)** (path3_title, kept as the site writes it)
- שאלון אבחון עצמי "in the menu" -> **Questionnaire anonyme**: the v3 menu overrides the PATIENT_NAV label with ROUTE_META.questionnaire. The translator had "Auto-évaluation" (the PTSD-IL main-nav key, not shown on v3). The generic name stays "Questionnaire d'auto-évaluation".
- Metiv pages unchanged and already consistent: Où se faire soigner, Traitements gratuits et études, Aide immédiate, Sortie rapide, Vous hésitez à nous contacter ?, Contact (+ topic labels), Cours et formations / Cours, Enfants et famille, Pour les organisations, Événements, Supervision, Recherche, Pour les thérapeutes et les professionnels, Pour les familles de réservistes, Espace Metiv pour enfants, Politique de confidentialité, Conditions d'utilisation, Peace of Mind.

## Notable fixes
- Page names as above (cdafd80532, 8ec26bea96, 9c5f7963d6, 52eda3b686, d6a4cf7048, 1d5ab05fee, 15741f8928, 428cbaf684, 59d48b0c38, 7cc934715f).
- "Shift" -> "Maj" (e8bb561762, 3824110f0c, 2b3d6dbce3), same as the site's quickExitHint.
- Ungrammatical conditional: "**Si cela pourrait arriver maintenant**" -> "**Si cela risque d'arriver maintenant**" (c5e13ad908); same fix in 2040c7322e, e6a00eb308, 35e38b9ec5, df6d0ec672.
- Crisis answers, more natural and direct: "Cela semble très lourd" -> "Ce que vous traversez semble très lourd"; "C'est important pour moi que vous le sachiez" -> "Je tiens à ce que vous le sachiez" (2040c7322e); "il est important pour moi que vous parliez" -> "je tiens à ce que vous parliez" (df6d0ec672); "des pensées de mettre fin à vos jours" -> "vous pensez aussi à mettre fin à vos jours" (df6d0ec672, 35e38b9ec5); "vous avez des pensées que cela n'a plus de sens" -> "vous pensez que cela n'a plus de sens" (81416181e3, e8e7170766).
- "parler de perte d'espoir" -> "parler de désespoir" (e2ab9df414, d6a4cf7048, 1d5ab05fee), the term the rest of the site uses.
- Glossary: first mention of ביטוח לאומי in bot text now "l'Institut national d'assurance (Bituach Leumi)" (9c5f7963d6, 6e0a4ff1be, fb9ab01f65, d600485a37). מוקד סה"ר -> "le service d'écoute SAHAR" (was "la ligne Sahar"). קצין תגמולים -> "l'officier chargé des indemnités (ktsin tagmoulim)" (5c71a70a20). "Usure de compassion" -> "Fatigue de compassion" (bbba5734b4). "Auto-assistance" -> "Auto-aide" (ec074c0475, f9efb9fa21, 5115dc85a8, and "outils d'auto-assistance" in the terms of use).
- Paraphrases (what users type): the translator used "TSPT" in about 35 user messages. French speakers do not type the clinical acronym; where the Hebrew says פוסט טראומה it is now "stress post-traumatique", where the Hebrew says PTSD it is "PTSD" (e.g. a62d5cd241, 548d591c60, 578dc6d282, c7fda26048, ec6d260418, 4e5978349b). "TSPT" stays in bot guidance and answers (glossary). Other unnatural paraphrases: "Mon rendez-vous de traitement est dans longtemps" -> "Mon rendez-vous pour un suivi est dans très longtemps" (8481523992); "Mon unité de l'armée veut élaborer la guerre ensemble" -> "Mon unité veut qu'on travaille ensemble sur ce qu'on a vécu à la guerre" (41f9ced9ae); "Essoufflé à cause de la peur" -> "J'ai le souffle coupé par la peur, je fais quoi" (d01b8ea170); "Choc post-traumatique de combat" -> "Traumatisme de guerre" (ced9477c64, b37630ed7a); "J'ai des pensées de faire du mal à ma femme" -> "Je pense à faire du mal à ma femme" (2779d16eca, c55c84f9f2); "le rendez-vous ... n'est que dans deux mois" (reads as "soon") -> "n'est pas avant deux mois" (06d223ceeb); duplicate "Je suis à bout" in one row -> "Je suis vidé, j'ai plus la force de continuer" (419ca2e592).
- 21: "rédigée sous une forme d'adresse générale ... à toutes et à tous" -> "rédigée dans une formulation générale et s'adresse à toutes les personnes, quel que soit leur genre" (privacy and terms); "approche ... informée par le traumatisme" (calque) -> "sensibilisée au traumatisme"; "cercle répétitif" -> "cycle qui se répète". Headings, lists, bold, links and link targets all unchanged.

## Crisis rows
Rows 0-2 and the suicide/self-harm branches in rows 3-11, 24-26, 29-31: every answer carries ERAN 1201 (and 101/100 where the Hebrew has them, 118 / 1202 / 1203 where present), no method, quantity or means details in any bot text, direct safety question kept, no promise that "everything will be fine". The user paraphrases that name methods (cachets, se tirer une balle) are kept: they are match triggers, not bot output.

## Systematic issues (this round)
- Two translators, two sets of page names; fixed to one set.
- Clinical acronym "TSPT" inside user-typed paraphrases.
- A few calques and conditionals ("si cela pourrait").
- Otherwise faithful: guidance bullets complete and in order, every phone number intact, no efficacy wording added, safe-messaging respected.

## Open questions for the owner
1. The site itself shows two French names for some pages: the calming page is "Exercices de calme" (its h1, i18n.js) but "Exercices d'apaisement" in the v3 menu, footer and NEXT_STEPS; self-help is "Outils d'auto-aide" vs "Outils d'auto-assistance"/"Auto-assistance"; second-circle tools "Outils d'adaptation" vs "Outils pour faire face"/"Outils pour les proches"; children "Contenu pour les enfants" vs "Contenus pour les enfants"; ptsd-info "À propos du post-traumatisme" vs "Sur le TSPT"/"Qu'est-ce que le TSPT ?". The chatbot now follows the page titles. Unify the menu labels (fr batches 00-13 / ROUTE_META / PATIENT_NAV) with i18n.js, or tell me which side wins and the bot strings follow. The paraphrase 7247313331 "Exercices d'apaisement" is shared with a NEXT_STEPS label, so it was left as is.
2. The Hebrew guidance says the questionnaire is called "שאלון אבחון עצמי" in the menu, but the v3 menu shows ROUTE_META "שאלון אנונימי". The fr bot now says "Questionnaire anonyme". The Hebrew source has the same staleness.
3. i18n.js fr uses "PTSD" and has gender-paren leftovers ("Je ne suis pas sûr(e)", "Vous n'êtes pas seul(e)"), while the Metiv copy uses "TSPT". Out of scope here, but visible to visitors.

## Verdict
After these fixes the chatbot rows read as one consistent set and are publication-ready; the legal texts were already good (3 small fixes).

## Batch 22

3 strings reviewed, 1 changed. The new lines (course-specific questions answered from SOURCES; privacy parenthetical dropped; "ni ici ni dans les SOURCES"; answer now mentions Metiv's courses) are accurate and consistent with the existing fr rows.
- ce6adef944 (pre-existing line carried over): "Si un épuisement ou une détresse du thérapeute est décrit" -> "... sont décrits" (agreement). The same slip remains in 18.json and chatbot-qa/fr.json for the older version of this string; it is superseded by batch 22.
Check: 0 errors.
