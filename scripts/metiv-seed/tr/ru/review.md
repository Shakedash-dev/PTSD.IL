# ru translation review

Scope: all batches 00-13, every id except those whose context starts with `chatbot-qa/` (being rewritten; batches 08, 10, 11 are entirely chatbot-qa, 07/09/13 mostly).
Final check: `node scripts/metiv-seed/check-translations.mjs ru` - 0 errors, 18 warnings (all localized dates/numbers: "7 октября", "XIX век", "1500" vs "1,500", "11 сентября" for 9/11, "Часть 1/2" for א'/ב'). No en/em dashes, no Hebrew left.

Total strings changed: 27.

## Per batch

**00 - 3 changed**
- 839133c7b2: "Программы для сообществ, школ..." -> "Интервенции в сообществах и программы для школ и детей раннего возраста" (dropped "interventions").
- 48f820e9c3 (article "Dancing with protocol"):
  - "помогает усилить присутствие за счёт избегания" -> "...усилить присутствие и ослабить избегание". Meaning error: Hebrew על חשבון ההימנעות = at the expense of avoidance; "за счёт" in Russian reads "by means of avoidance".
  - "Эта сила происходит из системы выживания" -> "порождена системой выживания" (style).
  - "Несмотря на эффективность протоколов, как она была исследована и изучена" -> "...эффективность протоколов, изученную в исследованиях" (calque).
- 3622070429: added "Вы" so it matches the other eligibility bullets of the same study.

**01 - 2 changed**
- 74f8a1f186: "Эта подготовка обучает методам..." -> "В ходе подготовки изучаются методы..." (calque).
- c95ece9211: "проникли и в другие мои терапии" -> "проникли и в мою работу с другими клиентами" (not idiomatic).

**02 - 3 changed**
- 143cbddac2: "Клинический психолог, эксперт" -> "Клинический психолог-специалист" (the Israeli title מומחית).
- 3f30f456a6: "о вашем пути" -> "о вашем подходе" (הדרך שלך = your approach); reworded an awkward "разговор, который дал обучение".
- 59d4b1139a: "вести по доброму пути" -> "вести за собой бережно и во благо".

**03 - 4 changed (name and title fixes applied across all files)**
- 600546845a, and 05/ef8dccb975: "Алон Вальтман" -> "Алон Вельтман" (the papers spell it Weltman).
- 2971b18d6d: "Ашер Меконнен Рахамим" -> "Ашер Мекуанент Рахамим" (Hebrew מקואננט; en has Mekuanent).
- bafb2d860d, 09d0bd723d, and 06/a80e51cb6c: "психолог-эксперт" -> "психолог-специалист" (one consistent rendering of מומחה/ית).

**04 - 2 changed**
- 966387643f / 092f06839c: "Файлы cookie (Cookies)" / "файлы Cookies" -> "Файлы cookie" / "файлы cookie".

**05 - 4 changed**
- 8cacc85583: "Близкий человек живёт с ПТСР" -> "Мой близкий живёт с ПТСР". It is a first-person path card next to "Я живу с ПТСР".
- c2de31e86a, 6691432fdf: "3.5" -> "3,5" (Russian decimal comma, digits unchanged); "готовы взять обязательство" -> "могут взять" (Hebrew שיכולים = able to).
- ef8dccb975: Вельтман (see 03).

**06 - 5 changed**
- b929f4b850: "проходят индивидуальную терапию в частном порядке" -> "...по месту жительства". Meaning error: טיפול פרטני בקהילה = individual therapy in the community, not private.
- ca011ba32f: "Вы готовы..." -> "Вы можете взять на себя обязательство..." and 3,5.
- 0453e1b91b: "эксперт ИТА, сертифицированный психотерапевт" -> "признанный ИТА сертифицированный психотерапевт и супервизор КПТ" (the Hebrew is about ITA certification, not an "expert" title).
- 5a633c37ab: "Д-р Анна Португалова" -> "Д-р Анна Португалов" (see open questions).
- a80e51cb6c: психолог-специалист (see 03).

**07 - 0 changed.** The two chatbot guidance strings in scope are correct, and their page names match the UI labels.

**09 - 1 changed**
- 99156bf64e: "острая паническая атака" -> "острый приступ тревоги" (Hebrew התקף חרדה, kept non-diagnostic).

**12 - 2 changed**
- 5045ea6d53: "Только демонстрационный сайт, не для публикации" -> "Демонстрационный сайт, не для публикации".
- 1ddfd88525: "До 2009 года" -> "2009 год и ранее". עד 2009 includes 2009; the Russian "до 2009 года" means before 2009.

**13 - 1 changed**
- 1cbf67cf5a: "Меньше подходит" -> "Менее подходит".

## Name list (checked across all batches)
Дани Бром; Рут Пат-Хоренчик; Сарит Шрам-Явин; Михаль Змора; Шир Элиас; Гафнит Агаси; Михаль Симхон; Нили Лави; Тамара Винер; Йоэль Варди; Гиль Шемеш; Кармит Рубин; Наоми Баум; Алон Вельтман; Ашер Мекуанент Рахамим; Анна Харвуд-Гросс; Далия Амит-Зиван / Далия Зиван; Анна Португалов; Ципора Хаят; Эстер Коэн; Пинхас Даннон; Амихай Флор; Клод Шемтоб (Chemtob); Джордж Бонанно; Став Ниссер; Ури Бирнбаум; Хаим Ландау; Рахели Брукс; Ариэль Бен-Аарон; Идит Дикштейн.
Terms used consistently: Peace of Mind, «Метив - дети», ПАНДА / ПАНДА вдвоём / НАМАЛЬ, «Пространство Метив», клиника «Мигдалор», Отдел реабилитации, Битуах Леуми, больничная касса, ЭРАН, ЦАХАЛ, супервизия (הדרכה), клиент (מטופל), ассоциация (עמותה), «Дорожная карта», «Калейдоскоп».

## Systematic issues
- Few. Most errors were calques in long prose (the article and course descriptions) and a handful of small meaning slips ("за счёт", "в частном порядке", "до 2009"). Terminology, placeholders, Markdown, URLs and numbers were clean.
- Inconsistent "психолог-эксперт" vs "-специалист" for the same Israeli title. Fixed.
- Decimal point instead of the Russian comma (3.5). Fixed.

## Open questions for a native speaker / the owner
1. **פורטוגלוב**: I set it to "Анна Португалов", the neutral form the brief asked for. If she uses the Russian feminine form, it should be "Португалова". The owner should confirm.
2. **דליה זיוון / דליה עמית זיוון**: this is one person (the papers list "Dalia Amit Zivan"). I kept each string faithful to its source: "Далия Зиван" where the Hebrew drops "Amit" (02/f82f942886, 04/a36bab259b) and "Далия Амит-Зиван" elsewhere. If the owner wants one form everywhere, switch both to "Далия Амит-Зиван".
3. **גש"ר מאח"ד** -> "Ресурсы совладания - модель BASIC Ph" (03/cb95f1b47a). This is correct (Lahad's BASIC Ph) and reads naturally. Kept as is.
4. **Prices**: "10 350 ₪", "1500 ₪" use Russian digit grouping. The digits are unchanged.
5. **"клиент" for מטופל** is used throughout, including the patient area ("раздел для клиентов"). It is standard in Russian psychotherapy, but some lay readers may expect "пациент". This is the owner's call; switching it would touch many strings.
6. Name transliterations with no Latin source to check against: Ципора Хаят (חייט), Алума Гиволи, Рахави Сасон, Тене (טנא). These are plausible but unverified.

## Verdict
High quality and publishable after these fixes. The Russian is natural, the register is right for both audiences, and the glossary and owner overrides are followed. The remaining items are the name questions above, not language problems.

## Final round (chatbot-qa strings in he.json + batches 20-21)

Scope: 531 chatbot-qa strings (all 35 rows, read row by row against chatbot-qa/he.json, old 07-10 and new 14-19 together) and all 7 strings of 20-21. **63 strings changed**: 07-10: 0, 14: 9, 15: 14, 16: 13, 17: 11, 18: 12, 19: 0, 20: 2, 21: 2.

### Page names (systematic, 50+ strings)
The translator took several page names from the Metiv PATIENT_NAV copy or paraphrased them. The patient area renders PTSD-IL page titles from src/lib/i18n.js and its own navbar (PatientNavbar, i18n nav_* keys). I aligned every chatbot string to the title the visitor actually sees:
- Где можно получить терапию -> **Где получить терапию** (copy title / NEXT_STEPS label).
- Дорожная карта терапии -> **Дорожная карта лечения** (treatment_title); "(в меню: Терапия)" -> "(в меню: **Лечение**)" (nav_treatment).
- Инструменты совладания -> **Инструменты поддержки** (second_circle_tools_title / nav).
- Материалы для детей -> **Контент для детей** (children_title).
- О ПТСР -> **О посттравме** (ptsd_info_title; Hebrew uses the title "על פוסט-טראומה", not the nav label).
- Path cards: Мой близкий живёт с ПТСР -> **Я поддерживаю близкого человека**, Я живу с ПТСР -> **Я переживаю посттравматический стресс**, Я сомневаюсь -> **Я не уверен и хочу проверить** (path1-3_title, shown on the patient home and as the /second-circle page title).
- Questionnaire "in the menu": Опросник для самопроверки -> **Анонимный опросник**. The full menu (Chrome.jsx navLabels) overrides the PATIENT_NAV label with ROUTE_META questionnaire.label. Page name in prose stays **Опросник самопроверки** (short form of questionnaire_title).
Already correct and kept: Помощь сейчас, Упражнения для успокоения, Дыхательное упражнение, Упражнение заземления, Напряжение и расслабление, Инструменты самопомощи, Права + rights categories, Сообщества и встречи, Бесплатная терапия и исследования, Сомневаетесь, стоит ли обращаться?, Контакты + contact topics, Пространство Метив для детей, Для семей резервистов, Курсы и обучение, Супервизия, Для специалистов, Быстрый выход, Политика конфиденциальности, Условия пользования.

### Notable meaning/wording fixes
- 3824110f0c, e8bb561762, 22797a4445, 03f5d6229f (violence, child in danger): פציעה "Если есть травма" -> "Если кто-то ранен" / "Ранения". On a trauma site "травма" reads as psychological trauma; the instruction to call MDA is about physical injury. 2a1a90c4ed, 9c5f7963d6 (sexual assault): same, -> "телесные повреждения".
- ecd1cefa4c, a05aacdd9f, f132737da2, 428cbaf684: אזעקה "идёт тревога" -> "воздушная тревога". Next to anxiety content, "тревога" alone reads as "anxiety".
- f9a507e863, 8ec26bea96: רגוע/ה ובטוח/ה "быть рядом, спокойно и в безопасности" (made no sense) -> "спокойно и уверенно". The quoted phrase to the loved one is now "Я здесь, ты в безопасности" in both the answer and the guidance (the guidance had "вы").
- 91aa8deac2: "Паническая атака ощущается очень пугающе" (calque) -> "Паническая атака - это очень страшно, но она проходит".
- 2779d16eca: "мысли о том, чтобы сделать что-то жене" (euphemism, weaker than the Hebrew) -> "мысли причинить вред жене".
- 1c6f64a8cf, 034db834a7: יועץ/ת בית הספר "школьный психолог" -> "школьный консультант" (a different role).
- 034db834a7, 9c5f7963d6: "взрослый, которому доверяешь" (stray "ты" inside "вы" guidance) -> "которому можно доверять".
- 20f874b3f0, e1636f19ca: the bot's own question "вы на милуим?" -> "на резервистской службе (милуим)". Users may type "милуим" (paraphrases kept), but the bot itself now uses the term the rest of the row uses.
- d6f85a49e7, b3fcdebe06: "ребёнок в (тяжёлом) кризисе" -> "как ребёнку плохо" / "ребёнку, судя по всему, очень плохо".
- cdafd80532, 9127daa236, 9766f57d28: מטופל in bot text "пациент" -> "клиент", matching the site-wide decision. User paraphrases with "пациентка" are kept, since that is how users type.
- a6d4983e32: "курсы для терапевтов" -> "для психотерапевтов" (in Russian a "терапевт" is a GP).
- 5595bd4e8c: "С войны я не контролирую себя" -> "После войны...".

### Crisis rows
suicidal-thoughts, self-harm, someone-else-suicidal: checked line by line. No method details, the method question in paraphrases stays a paraphrase only, and the guidance forbids giving means/amounts. Tone is direct and caring. ERAN 1201, 101 and 100 are present everywhere the Hebrew has them, and 1202/1203/118 are intact. No changes were needed beyond page names.

### Batches 20-21
- 20/5f8a2456de `link`: "Перейти по ссылке" -> "Ссылка". In Publications.jsx it is the link text on a paper card, the alternative to the label "DOI" (`paper.doi ? 'DOI' : c.link`). A short noun fits that slot. A verb phrase is too long and does not parallel "DOI".
- 20/ff2f0f39a4: "Заявление о доступности сайта Метив" -> "Заявление о доступности на сайте Метива" (it links to the statement on Metiv's site; the name is declined like everywhere else).
- 21/7626ef041f, d8ccb7177e (privacy, terms): "работает под управлением" / "которым управляет" -> "Оператором ... является" (legal register). "не имеющим исковой силы" (wrong term) -> "недействительным или не подлежащим исполнению". Indemnity clause rephrased to match לשפות בגין כל תביעה או הוצאה. "приёмное отделение" -> "приёмный покой" (consistent with the chatbot). All headings, lists, bold text, link targets and emails are unchanged.
- 21/305e396849 (Пространство Метив): correct, unchanged.

### Open questions for the owner
1. **The Hebrew source itself is stale about the menu**: it says the questionnaire appears in the menu as "שאלון אבחון עצמי". The v3 full menu shows ROUTE_META "שאלון אנונימי", and the patient navbar shows "לא בטוח/ה". ru now says "Анонимный опросник". The he/en/fr/ar rows probably need the same fix.
2. Two navigation systems disagree in ru: the PATIENT_NAV copy (Терапия, Инструменты совладания, Материалы для детей, Я живу с ПТСР / Мой близкий живёт с ПТСР, Опросник для самопроверки) vs i18n.js (Лечение, Инструменты поддержки, Контент для детей / Для детей, path titles). The chatbot now follows i18n, which is what the patient area renders. Consider aligning the PATIENT_NAV ru copy (batches 00-13) to i18n so that only one set of names exists.
3. Self-help tool names (selfHelpTools.json only has title_he): the bot says «Сон и режим дня» and «Экспрессивное письмо». If those tools get Russian titles on the site, the chatbot strings should match them.

### Verdict
The chatbot set is good: natural user paraphrases (including deliberate typos and slang), precise guidance, and warm, safe answers. Its main weakness was page-name inconsistency between the two translators, now fixed. The legal texts are publication grade after the small register fixes. Final check: `node scripts/metiv-seed/check-translations.mjs ru` -> 2469 strings, 0 errors, 21 warnings (localized digit groups only, plus 5741 for the Hebrew year of the Privacy Protection Law, 21/7626ef041f).

## Batch 22

3 strings reviewed (therapist-courses guidance, who-are-you guidance + answer), 0 changed. Only the lines changed in the Hebrew were retranslated; terminology (баллы повышения квалификации, Супервизия, Метив/Метиве), page names and phone numbers match the existing ru rows. Check: 0 errors.
