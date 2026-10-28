# Arabic (ar) translation review

Validator pass over batches 00-13. Skipped: every id whose context starts with `chatbot-qa/` (being rewritten), which covers all of batches 07-11 and the chatbot prompt rows in 06/12/13 (those ids are now absent from context.json after its 14:40 rewrite; they were chatbot-qa rows at the start of the review). Batches 14-19 appeared mid-review (new chatbot-qa source) and are not translated, so the full check reports 6 'batch not translated' errors for them; batches 00-13 have 0 errors.

Final check: `node scripts/metiv-seed/check-translations.mjs ar` -> 00-13: 0 errors, 4 warnings (all expected: Arabic dual/word numbers such as طفلان / دقيقتين replacing a digit 2; three of the four are in skipped chatbot rows).

## Batch 00 - 4 strings changed

- `e73365c7e8`: كلود شيم طوف -> كلود شيمتوب (name is Claude Chemtob (Mount Sinai), not a literal Shem-Tov)
- `0481ba6727`: يتركّز جزء كبير من نشاطنا في الأطراف، -> يتركّز جزء كبير من نشاطنا في المناطق الطرفية، ('الأطراف' alone is unclear for 'periphery')
- `c6c68a492e`: وطُوِّرت بروتوكولات -> وطُوِّر بروتوكول (source is singular)
- `48f820e9c3`: لوضعه كمصاب بما بعد الصدمة -> لوضعه كمصاب باضطراب ما بعد الصدمة ('مصاب بما بعد الصدمة' is ungrammatical)
- `48f820e9c3`: ### **"ما العمل؟ المرونة"** -> ### **"ما العمل؟ أن نكون مرنين"** (source: 'What do we do? Be flexible')
- `48f820e9c3`: مكيّفًا بشكل محدد لطريقة التعامل -> مكيّفًا خصيصًا لطريقة التعامل (literal calque)

## Batch 01 - 13 strings changed

- `9641fb9399`: كلود شيم طوف -> كلود شيمتوب (Claude Chemtob)
- `8d8b1103a6`: يهات (الجمعية الإسرائيلية للعلاجات التعبيرية والإبداعية) -> يهات (الجمعية الإسرائيلية للمعالجين بالفنون الإبداعية والتعبيرية) (accurate gloss: association of creative and expressive therapists)
- `96147baee7`: تأهيل مرشدي مجموعات باندا -> تأهيل ميسّري مجموعات باندا (מנחה קבוצה = facilitator; 'مرشد' collides with supervision)
- `f75ec95186`: تأهيل مرشدي نامال -> تأهيل ميسّري نامال (same)
- `95fc1fb588`: اتحاد علماء النفس -> نقابة الأخصائيين النفسيين (Israel Psychological Association; psychologists = أخصائيون نفسيون elsewhere)
- `f792f9bb25`: وتعلّم تجريبي قائم على العملية -> وتعلّم تجربي قائم على العملية (تجريبي = experimental, not experiential)
- `7a3cbc6a67`: التمرين التجريبي -> التمرين التجربي (experiential, not experimental)
- `74f8a1f186`: واللاإفصاحية العاطفية (alexithymia، -> والألكسيثيميا (alexithymia، (standard Arabic clinical term)
- `74f8a1f186`: عمل أطباء سريريون معاصرون -> عمل اختصاصيون سريريون معاصرون (קלינאים are clinicians, not only physicians)
- `829917937c`: المركز الطبي تل أبيب على اسم سوراسكي -> مركز تل أبيب الطبي (سوراسكي) (calque of ע"ש)
- `f95e0bcb10`: كريات جات -> كريات غات (Arabic usage in Israel: غ for ג)
- `4070cd6cf4`: تُعقد في دورات وجاهية وعبر زوم -> تُعقد في أفواج وجاهية وأخرى عبر زوم (מחזורים = cohorts; 'دورات' clashes with 'course')
- `ab17c4ea0a`: بين الساعة A-B -> من الساعة A حتى B ('بين الساعة' with a dash range is ungrammatical)
- `e06e7bd3a2`: بين الساعة A-B -> من الساعة A حتى B ('بين الساعة' with a dash range is ungrammatical)

## Batch 02 - 23 strings changed

- `fa0ae2efa9`: في دورات منفصلة -> في أفواج منفصلة (מחזורים = cohorts)
- `8525bc635a`: دورة وجاهية -> فوج وجاهي (cohort, consistent)
- `a96c8f7bf2`: دورة وجاهية -> فوج وجاهي (cohort)
- `6b86ba764d`: دورة عبر زوم -> فوج عبر زوم (cohort)
- `e56591b128`: في دورة يونيو 2025 -> في فوج يونيو 2025 (cohort)
- `4ec0b00db6`: مرشدة مجموعات -> ميسّرة مجموعات (group facilitator)
- `417567452a`: معالجة قديمة في ميتيف -> من المعالجات القدامى في ميتيف ('قديمة' reads as 'old'; ותיקה = long-standing)
- `c0438d3d50`: معالجة قديمة في ميتيف -> من المعالجات القدامى في ميتيف (same)
- `0ca9e339a5`: أخصائية نفسية متدرّبة في علم النفس السريري -> أخصائية نفسية في مرحلة التخصّص في علم النفس السريري (מתמחה = clinical psychology resident)
- `74b8656313`: حجارة الأساس لعلاج الصدمة المركّبة -> اللبنات الأساسية لعلاج الصدمة المركّبة (literal; unnatural title)
- `d29e048b00`: ومساسًا بالصورة الجنسية وبالأداء الجنسي -> ومساسًا بصورة الذات الجنسية وبالأداء الجنسي (meaning: sexual self-image)
- `d33dabbaa7`: وفق نهج التركيز، معلّمة فوكوسينغ -> وفق نهج الفوكوسينغ (Focusing)، معلّمة فوكوسينغ ('Focusing' is a named method, 'نهج التركيز' misleads)
- `400e57c637`: ورشة تجريبية -> ورشة تجربية (experiential, not experimental)
- `47704f3722`: تحظى الولادات، "قصص الولادة"، عادةً بصورة عامة لحدث سامٍ ومُفرح في جوهره. -> تُقدَّم الولادات، "قصص الولادة"، عادةً على أنها حدث سامٍ ومُفرح في جوهره. (garbled calque of 'get PR as')
- `7e243b2a6c`: المخدّرات المهلوسة (السايكيديليا) وعلاج الصدمة -> السايكيديليا وعلاج الصدمة ('المخدّرات' adds a drug-abuse connotation absent in Hebrew; aligns with batch 06)
- `94100bb1c2`: المخدّرات المهلوسة وعلاج الصدمة -> السايكيديليا وعلاج الصدمة (same)
- `af9236276b`: التي تُعلِّمت في -> التي جرى تعلّمها في (wrong verb form)
- `30fd23b1d1`: المهارات التي سيُتمرَّن عليها -> المهارات التي سيجري التمرّن عليها (awkward impersonal passive)
- `3a275fc8bc`: بين الساعة A-B -> من الساعة A حتى B ('بين الساعة' with a dash range is ungrammatical)
- `d9874e9bc3`: بين الساعة A-B -> من الساعة A حتى B ('بين الساعة' with a dash range is ungrammatical)
- `5abb0c4464`: بين الساعة A-B -> من الساعة A حتى B ('بين الساعة' with a dash range is ungrammatical)
- `ad1a25ac1e`: بين الساعة A-B -> من الساعة A حتى B ('بين الساعة' with a dash range is ungrammatical)
- `9c5cb31c6a`: يوئيل فاردي -> يوئيل وردي (name aligned to Yoel Wardi)

## Batch 03 - 21 strings changed

- `45267c85e7`: وتعلّمًا تجريبيًا -> وتعلّمًا تجربيًا (experiential)
- `45267c85e7`: ## أسبوع استكمال اختياري: -> ## أسبوع إضافي اختياري: ('שבוע המשך' is a follow-on week; 'استكمال' is used for השתלמות elsewhere)
- `600546845a`: ألون فولتمان -> ألون ويلتمان (align with settled Alon Weltman)
- `2971b18d6d`: ماكوانينت -> مكوانينت (Mekuanint (Amharic name), per en)
- `7cbe02053d`: باندا الابتدائي -> باندا للمرحلة الابتدائية ('الابتدائي' modifies PANDA oddly; יסודי = elementary-school track)
- `a7d40f1e72`: لمرشدي مجموعات باندا -> لميسّري مجموعات باندا (facilitators)
- `1cf84f82f6`: لإرشاد مجموعات -> لتيسير مجموعات (facilitation)
- `be52f72157`: من إرشاد مجموعات باندا -> من تيسير مجموعات باندا (facilitation)
- `0dd5fc7929`: لإرشاد مجموعات باندا -> لتيسير مجموعات باندا (facilitation)
- `0f83207588`: لمرشدي مجموعات -> لميسّري مجموعات (facilitators)
- `801103ef77`: لإرشاد مجموعات ثنائية -> لتيسير مجموعات ثنائية (facilitation)
- `21097679f1`: من إرشاد مجموعات باندا -> من تيسير مجموعات باندا (facilitation)
- `afa7082630`: في إرشاد مجموعات نامال -> في تيسير مجموعات نامال (facilitation)
- `afa7082630`: لم تُنشر تفاصيل الدورة -> لم تُنشر تفاصيل الفوج (מחזור = cohort)
- `e3bed24ba1`: دورة عبر زوم -> فوج عبر زوم (cohort)
- `06e933571f`: دورة وجاهية -> فوج وجاهي (cohort)
- `0116755a96`: على مرشد مهني وجادّ -> على مدرّب مهني وجادّ (מדריך here = course instructor)
- `c959e4a175`: ## ماذا تحصل المنظمة؟ -> ## على ماذا تحصل المنظمة؟ (grammar)
- `697062c8a4`: عن مبنى الدورة -> عن بنية الدورة ('مبنى' is a Hebrew calque (מבנה); MSA بنية)
- `70ce45ba32`: للمعالجين المقيمين في خط المواجهة -> للمعالجين المقيمين في بلدات خط المواجهة (people live in localities on the line, not on it)
- `dada8020be`: بين الساعة A-B -> من الساعة A حتى B ('بين الساعة' with a dash range is ungrammatical)
- `190e17e5e6`: بين الساعة A-B -> من الساعة A حتى B ('بين الساعة' with a dash range is ungrammatical)
- `15005bc7ce`: بين الساعة A-B -> من الساعة A حتى B ('بين الساعة' with a dash range is ungrammatical)

## Batch 04 - 18 strings changed

- `85dae4bcc0`: دورة دراسية -> فوج جديد (מחזור קורס = new cohort)
- `07a6be148b`: افتتاح دورة جديدة لتأهيل CBT في علاج الصدمة -> افتتاح فوج جديد لتأهيل CBT في علاج الصدمة (cohort)
- `bf07433235`: - دورة وجاهية -> - فوج وجاهي (cohort)
- `9254838040`: - دورة عبر زوم -> - فوج عبر زوم (cohort)
- `a9d8267432`: - دورة يونيو -> - فوج يونيو (cohort)
- `1d6a0c4786`: دورة جديدة من "أسس علاج الصدمة لدى الأطفال" -> فوج جديد من دورة "أسس علاج الصدمة لدى الأطفال" (cohort)
- `0fe47acae9`: تأهيل باندا الابتدائي للمعالجين -> تأهيل باندا للمرحلة الابتدائية للمعالجين (consistent with course title)
- `6121055e9d`: ورشة تجريبية بإرشاد يوئيل فاردي -> ورشة تجربية بإرشاد يوئيل وردي (experiential; name aligned to Yoel Wardi)
- `6435531cd4`: ميتيف، المركز الإسرائيلي لعلاج الصدمات، -> ميتيف - المركز الإسرائيلي للصدمات النفسية، (glossary full form)
- `3fb8003456`: مديرة دفع السياسات -> مديرة تعزيز السياسات ('دفع السياسات' is a calque of קידום)
- `5d38f15075`: مديرة دفع السياسات -> مديرة تعزيز السياسات (same)
- `46088f401f`: التفاصيل في منطقة المتعالجين -> التفاصيل في قسم المتعالجين (site section, not a physical area)
- `739ba77d92`: ويعمل داخل الحرم -> ويعمل في حرم المستشفى (clarity)
- `7f0c468469`: إلى الاستبيان المجهول -> إلى الاستبيان مجهول الهوية ('المجهول' = 'the unknown'; anonymous = مجهول الهوية)
- `9712ba031f`: بين الساعة A-B -> من الساعة A حتى B ('بين الساعة' with a dash range is ungrammatical)
- `d8d9f08bd8`: بين الساعة A-B -> من الساعة A حتى B ('بين الساعة' with a dash range is ungrammatical)
- `97e85791a8`: بين الساعة A-B -> من الساعة A حتى B ('بين الساعة' with a dash range is ungrammatical)
- `d1bf0492c4`: بين الساعة A-B -> من الساعة A حتى B ('بين الساعة' with a dash range is ungrammatical)

## Batch 05 - 19 strings changed

- `590b684cc1`: عُقدت آخر دورة معلنة في -> عُقد آخر فوج معلَن عنه في (cohort)
- `ac0ca5e72f`: ياد فاشيم، سلطة إحياء ذكرى الكارثة والبطولة -> ياد فاشيم، السلطة لتخليد ذكرى المحرقة والبطولة ('الكارثة' is a Hebrew calque of השואה; standard Arabic المحرقة)
- `00f2b198fb`: مجلس علماء النفس -> مجلس الأخصائيين النفسيين (consistent term for psychologists)
- `1f652d65e1`: خدمات الحضانة البديلة -> خدمات العائلات الحاضنة (consistent with 'العائلات الحاضنة' (foster families) elsewhere)
- `8ef48f9ec7`: خدمة عالية الجودة وإنسانية ومهتمّة -> خدمة عالية الجودة، إنسانية ومُراعية ('مهتمّة' reads as 'interested')
- `6e6ebdb3e8`: طريق التأقلم والتعافي -> طريق التأقلم واستعادة القوة (התחזקות = growing stronger, not recovery (no added claim))
- `014679bb62`: مع المرشد، ثم يتم الإلحاق بمجموعة وفق العمر -> مع ميسّر المجموعة، ثم تُلحَقون بمجموعة وفق العمر (facilitator; awkward impersonal)
- `6255ee563d`: أو يُوصَل من خلالها إلى جزء من الخدمات -> أو يمكن الوصول من خلالها إلى بعض الخدمات (ungrammatical)
- `8cacc85583`: قريب لشخص يعاني -> مقرّب من شخص يعاني (natural phrasing)
- `33a5ad5634`: لشريك الحياة، للوالد، للصديق لمن يعاني -> لشريك الحياة أو الوالد أو الصديق لمن يعاني (choppy list)
- `9a9aee3ae2`: استبيان مجهول قصير -> استبيان قصير مجهول الهوية (anonymous = مجهول الهوية)
- `805ed510a2`: استبيان مجهول للفحص الذاتي -> استبيان مجهول الهوية للفحص الذاتي (same)
- `9e06f5920f`: استبيان مجهول -> استبيان مجهول الهوية (same)
- `c0fe60b580`: بالمبنى نفسه للجميع -> بالبنية نفسها للجميع (مبنى = building; calque of מבנה)
- `346bcb9464`: (مركز الصحة النفسية) -> (مركز الاتصال للصحة النفسية) (מוקד = call center)
- `d2eda62b3f`: خلال فحص الطلب -> حتى خلال فحص الطلب (keep 'כבר' (already during))
- `3d81be6ecf`: يقود الورشات ويرشدها -> يقود الورشات وييسّرها (facilitation)
- `ef8dccb975`: وألون فولتمان، ويوئيل فاردي -> وألون ويلتمان، ويوئيل وردي (names aligned: Alon Weltman, Yoel Wardi)
- `fc2ceb9951`: رحبي ساسون -> ساسون رحابي (Hebrew is surname-first; given name Sasson, surname Rahabi)

## Batch 06 - 15 strings changed

- `ac20b7a239`: يرشد الورشات -> يُيسّر الورشات (facilitation)
- `49e82256db`: استبيان مجهول، -> استبيان مجهول الهوية، (anonymous)
- `a26d024927`: بالمبنى نفسه -> بالبنية نفسها (calque of מבנה)
- `b862284a6d`: تناول المادة المهلوسة (السايكيديلية) -> تناول المادة السايكيديلية (Hebrew says 'the psychedelic substance'; 'مهلوسة' adds a loaded term)
- `0c23bd81fe`: للمرشد وللزملاء -> لميسّر المجموعة وللزملاء (מנחה = facilitator)
- `a2e17cd6fc`: للطواقم الأصلية في المنظمات -> للطواقم القائمة في المنظمات (צוותים אורגניים in an org = existing staff teams, not military units)
- `b22a1414e3`: للطواقم الأصلية في المنظمات -> للطواقم القائمة في المنظمات (same)
- `0453e1b91b`: ترشد مجموعات -> تُيسّر مجموعات (facilitation)
- `c0adb5b3a7`: متدرّب في علم النفس التربوي -> في مرحلة التخصّص في علم النفس التربوي (מתמחה = resident; consistent)
- `cb56b1662f`: أخصائية نفسية تأهيلية متدرّبة -> أخصائية نفسية تأهيلية في مرحلة التخصّص (same)
- `240ad55504`: أخصائي نفسي متدرّب في المسار السريري -> أخصائي نفسي في مرحلة التخصّص السريري (same)
- `b8e63f49f3`: يشمل الاستقبال لقاء استيعاب مع عامل اجتماعي -> يشمل الاستقبال لقاءً أوليًا (intake) مع عامل اجتماعي ('استيعاب' is a calque of קליטה)
- `bd104b3ffd`: الدورات الدراسية القريبة -> الأفواج الدراسية القادمة (cohorts)
- `5521a8d136`: لمرشدي باندا ونامال -> لميسّري باندا ونامال (facilitators)
- `ceffc8ac4c`: دورات وورشات ومؤتمرات، قادمة وسابقة. -> أفواج الدورات والورشات والمؤتمرات، القادمة والسابقة. (cohorts)

## Batch 12 - 29 strings changed

- `1e40144828`: في منطقة المتعالجين -> في قسم المتعالجين (site section: 'قسم' not 'منطقة' (geographic area))
- `7c0e2040ff`: منطقة -> قسم (same)
- `69630c2e39`: إلى منطقة المتعالجين -> إلى قسم المتعالجين (same)
- `29762ab1cf`: في منطقة المتعالجين -> في قسم المتعالجين (same)
- `36c090d6a1`: في منطقة المتعالجين -> في قسم المتعالجين (same)
- `a887a95e70`: منطقة للمتعالجين والعائلات -> قسم المتعالجين والعائلات (same)
- `c3cb70b6bc`: إلى منطقة المتعالجين والعائلات -> إلى قسم المتعالجين والعائلات (same)
- `e1dd5242e5`: منطقة للعاملين في العلاج والمهنيين -> قسم العاملين في العلاج والمهنيين (same)
- `1764ec5315`: إلى منطقة المهنيين -> إلى قسم المهنيين (same)
- `7c6e8e78c3`: في منطقة المتعالجين -> في قسم المتعالجين (same)
- `7849ad6879`: للمرشدين والمعالجين -> للميسّرين والمعالجين (מנחים = group facilitators)
- `71ba668e84`: تأهيلات للمرشدين -> تأهيلات للميسّرين (same)
- `519947d239`: إلى تأهيل المرشدين -> إلى تأهيل الميسّرين (same)
- `bfcbfc68bf`: من يرشد -> من ييسّر (same)
- `ed790f2941`: المبنى -> البنية (مبنى = building; calque of מבנה)
- `85bcd5e778`: المبنى -> البنية (same)
- `9e1097b903`: مبنى البرنامج: -> بنية البرنامج: (same)
- `9397440610`: بالمبنى نفسه -> بالبنية نفسها (same)
- `390801d6b6`: قليلًا عني -> نبذة عني (literal 'a little about me')
- `689f25c758`: اختيار موضوع سيعرض هنا تفاصيل الاتصال المناسبة. -> عند اختيار موضوع ستظهر هنا تفاصيل الاتصال المناسبة. (clumsy subject)
- `34028e54b0`: لتلقّي إشعار عن الدورات -> لتلقّي إشعار عن الأفواج القادمة (מחזורים = cohorts)
- `5e04675fd6`: الدورات وطرق الدراسة -> الأفواج وطرق الدراسة (cohorts)
- `6b5c1aa33f`: عُقدت -> عُقد (agrees with فوج (run))
- `68c93fdce9`: انتهت هذه الدورة. يمكنك ترك تفاصيلك وتلقّي إشعار عند افتتاح دورة جديدة. -> انتهى هذا الفوج. يمكنك ترك تفاصيلك وتلقّي إشعار عند افتتاح فوج جديد. (cohorts)
- `49e379a2f8`: عن الدورات القادمة -> عن الأفواج القادمة (cohorts)
- `6fcf507d73`: دورات انتهت. -> أفواج انتهت. (cohorts)
- `b64ddde14a`: عن الدورات القادمة -> عن الأفواج القادمة (cohorts)
- `150c41439f`: جدول الفعاليات والدورات -> جدول الفعاليات والأفواج (cohorts)
- `548b917d49`: دورات وورشات ومؤتمرات وأخبار ميتيف. -> أفواج الدورات والورشات والمؤتمرات وأخبار ميتيف. (cohorts)

## Batch 13 - 4 strings changed

- `086b91963e`: في منطقة المتعالجين -> في قسم المتعالجين (site section)
- `4c2dc56003`: عُقدت الدورة المعلنة -> عُقد الفوج المعلَن عنه (cohort)
- `6e762e671b`: المرشد -> الميسّر (מנחה = facilitator)
- `ecb5016155`: دورات وفعاليات قريبة -> أفواج وفعاليات قريبة (cohorts)

## Batch 07 - not reviewed (chatbot-qa rows only)

## Batch 08 - not reviewed (chatbot-qa rows only)

## Batch 09 - not reviewed (chatbot-qa rows only)

## Batch 10 - not reviewed (chatbot-qa rows only)

## Batch 11 - not reviewed (chatbot-qa rows only)
## Systematic issues in the translator's work

1. **מחזור (course cohort) rendered as دورة.** "دورة" already means "course", so labels like "دورة وجاهية - أكتوبر 2026" under a course read as a second course. Changed to فوج / أفواج everywhere in reviewed rows (cohort labels, event titles, course-detail UI).
2. **מנחה / מנחי קבוצות (group facilitator) rendered as مرشد / إرشاد.** That collides with the glossary term for supervision (الإشراف المهني) and with "guidance". Changed to ميسّر / تيسير for group facilitation. "بإرشاد X" for a lecturer leading a teaching unit was left as is (acceptable).
3. **Hebrew calques:** مبنى for מבנה (structure, changed to بنية), لقاء استيعاب for קליטה (changed to لقاء أولي (intake)), دفع السياسات for קידום מדיניות (changed to تعزيز السياسات), الكارثة for השואה (changed to المحرقة), "استبيان مجهول" for an anonymous questionnaire (means "unknown questionnaire", changed to مجهول الهوية).
4. **تجريبي (experimental) used for חווייתי (experiential).** Changed to تجربي.
5. **Website areas called منطقة** (geographic area). Changed to قسم (قسم المتعالجين, قسم المهنيين).
6. **מתמחה (psychology resident) rendered متدرّب** (trainee/intern). Changed to "في مرحلة التخصّص" throughout.
7. **Time ranges** "بين الساعة 9:00-15:00" are ungrammatical in Arabic. Changed to "من الساعة 9:00 حتى 15:00" (13 strings).
8. **Names:** Alon Weltman was ألون فولتمان (changed to ألون ويلتمان, 2 occurrences; no Hebrew letters were left anywhere). Yoel Wardi was يوئيل فاردي (changed to يوئيل وردي, 3). The Hebrew "רחבי ששון" is surname-first and was transliterated in that order (رحبي ساسون); changed to ساسون رحابي. Prof. Claude Chemtob was transliterated literally from the Hebrew spelling as كلود شيم طوف (changed to كلود شيمتوب, 2). Sarit Schramm-Yavin = ساريت شرام-يافين was already consistent (9).
9. **יה"ת gloss** was "الجمعية الإسرائيلية للعلاجات التعبيرية والإبداعية". It is an association of *therapists*, so it is now "الجمعية الإسرائيلية للمعالجين بالفنون الإبداعية والتعبيرية" (the first mention, in 01). Later mentions use the short form جمعية يهات.
10. Small additions with loaded wording: "المخدّرات المهلوسة" for פסיכדליה and "المادة المهلوسة" for החומר הפסיכדלי (drug-abuse connotation the Hebrew does not have). Changed to السايكيديليا / المادة السايكيديلية. Also "التعافي" for התחזקות (implies recovery), now "استعادة القوة".

Checked and found clean: glossary terms (وزارة الأمن, قسم التأهيل في وزارة الأمن, مؤسسة التأمين الوطني, صناديق المرضى, اضطراب ما بعد الصدمة (PTSD), المناعة النفسية, متضرّرو الأعمال العدائية, جنود الاحتياط, الجنود المسرّحون), the Peace of Mind (راحة البال) rule, the full name versus the short form ميتيف, Markdown, placeholders, URLs, emails, phone numbers, dates, prices (شيكل / ₪ following the source), and no en/em dashes. The masculine-generic for the reader (لست وحدك, اقرأ المزيد, أعاني) is used consistently. No efficacy wording was added. The one efficacy line in the protocol article ("على الرغم من فعالية البروتوكولات") is in the Hebrew.

## Open questions for a native speaker / the owner

- **فوج vs دورة**: I chose فوج for cohorts. Some Arab-Israeli institutions also say "دورة" for both. Please confirm.
- **ميسّر** for group facilitators: an alternative is "مُوجِّه مجموعات". Please confirm the preferred term.
- **علاوة الاستكمال** for גמול השתלמות and **أيام استكمال** for ימי השתלמות follow Ministry of Education Arabic usage. Please confirm that therapists recognize them.
- **نقاط استحقاق** for נ"ז: this is used at Israeli universities. "2 نقطة استحقاق" keeps the digit (rule 4) but would naturally be "نقطتا استحقاق".
- **نقابة الأخصائيين النفسيين** for הסתדרות הפסיכולוגים: an official Arabic name may exist.
- **عيادة ميغدالور**: this transliterates the clinic name. An alternative is to translate it ("المنارة"). It is left transliterated because it is a proper name.
- **لواء القدس** for מחוז ירושלים of the MoD Rehabilitation Department: this is the standard Israeli-Arabic term. The alternative is "منطقة القدس".
- **ياد فاشيم**: I used "السلطة لتخليد ذكرى المحرقة والبطولة". Yad Vashem's own Arabic materials may use a different formula.
- The UI count strings ("{n} دقائق قراءة", "{count} نماذج") use one plural form whatever {n} is. Proper Arabic agreement needs plural-aware UI code. This is not fixable in the strings.
- **Chatbot rows (to be retranslated):** they still use منطقة for site areas, مرشد for facilitators and استبيان مجهول. The retranslation should follow the conventions above.

## Verdict

Good base quality. The MSA is fluent and accurate on facts, numbers and glossary terms, and I found no meaning reversals or dropped caveats. The problems were systematic terminology choices (cohort, facilitator, experiential, area, resident), a few Hebrew calques, and the name transliterations listed above. After the fixes (146 strings in 9 batches) I consider batches 00-06, 12 and 13 publishable. A native Arabic-speaking clinician should still settle the terminology questions above before go-live.

## Final round

Scope: every `chatbot-qa/` string that is in the current `he.json` (539 strings in 35 rows: batches 07-10 from the first pass, 14-19 new, plus 8 rows' strings that dedupe into 00/04/06), read row by row against `chatbot-qa/he.json`; batches 20 and 21 in full. Obsolete ids in 07-10 were not touched.

Final check: `node scripts/metiv-seed/check-translations.mjs ar` -> 2469 strings, 0 errors, 7 warnings (all digit-group warnings from deliberate Arabic number words: دقيقتين, رائحتان, مبدأً أو مبدأين, plus the 4 known ones). Every phone number (1201, 101, 100, 118, 1202, 1203) is intact.

### Strings changed: 68

- 07: 2, 08: 1, 09: 2, 10: 1, 14: 9, 15: 10, 16: 12, 17: 16, 18: 13, 19: 1 (67 chatbot strings), 20: 0, 21: 1.

### Page names: aligned with what the Arabic v3 visitor sees

The translator had taken most bold page names from PATIENT_HUB / PATIENT_NAV seed labels. PatientHub.jsx is gone, and the v3 patient pages render their headings from `src/lib/i18n.js`. The v3 menu takes the first-circle, second-circle and questionnaire labels from ROUTE_META. Changed everywhere in the chatbot rows:

- כלים להתמודדות: أدوات للتأقلم -> **أدوات التعامل** (i18n `second_circle_tools_title`; 18 strings)
- כלים לעזרה עצמית: أدوات للمساعدة الذاتية -> **أدوات المساعدة الذاتية** (i18n `self_help_title`; 14)
- תכנים לילדים: مضامين للأطفال -> **محتوى للأطفال** (i18n `children_title`; 9)
- כיווץ ושחרור: الشد والإفراج -> **شدّ العضلات وإرخاؤها** (i18n `muscle_page_title`, the exercise page heading. The card label `muscle_title` = "الشد والإفراج" is poor Arabic, see below; 4)
- the path קרוב/ה של מתמודד/ת: مقرّب من شخص يعاني -> **المقرّبون وأفراد العائلة** (ROUTE_META secondCircle, the menu label; 6)
- the path מתמודד/ת עם פוסט טראומה: أعاني من اضطراب ما بعد الصدمة -> **من مرّ بحدث صعب** (ROUTE_META firstCircle; 1)
- the home card אני לא בטוח/ה: لست متأكدًا -> **لست متأكداً** (exact i18n `path3_title`)

Already correct and kept: تمارين التهدئة, تمرين التنفس, تمرين التأريض, عن اضطراب ما بعد الصدمة, خارطة طريق العلاج, المجتمعات واللقاءات, الحقوق and its tabs (قوات الأمن, التحرش الجنسي, ضحايا الأعمال العدائية, الحوادث والعمل, عام / أخرى), أين نحصل على العلاج, لستم متأكدين إن كان عليكم التوجّه؟, علاجات دون تكلفة وأبحاث, مساعدة الآن, خروج سريع, اتصل بنا and its topics, الدورات والتأهيلات / الدورات, الإشراف المهني, الأطفال والعائلة, للمنظمات, الفعاليات, البحث, للعاملين في العلاج والمهنيين, مساحة ميتيف للأطفال, ميتيف للأطفال, Peace of Mind (راحة البال).

### Conventions from the first review applied to the chatbot rows

- Site areas: منطقة المتعالجين / في منطقة **للعاملين...** -> قسم (7 strings: 15/e8bb561762, 15/3824110f0c, 18/fc242a77f8, 18/9766f57d28, 18/9127daa236, 19/2b3d6dbce3). The one remaining منطقة (16/5e7d6b2b42, "العمر أو المنطقة") is a geographic area and is correct.
- مرشد and the bare استبيان مجهول do not occur in any current chatbot string. The old 07-10 strings that had them are obsolete ids.
- مادة مخدّرة سايكيديلية -> مادة سايكيديلية (18/fc242a77f8; same rule as review item 10).
- לקוח intake: لقاء الاستيعاب -> اللقاء الأولي (08/3b65fa0100).
- Consistency with the site copy: أبحاث تجنّد مشاركين -> تستقطب مشاركين, فريق البحث -> طاقم البحث (copy/patientFreeTreatment uses these; 4 strings).

### Notable fixes

- `e6a00eb308` (suicidal-thoughts, guidance): أجب كما تجيب فرد عائلة قلقًا -> أجب كما تجيب فردًا قلقًا من العائلة. The old text said "answer the way a worried family member answers". The Hebrew means "answer as you would answer a worried family member".
- `d6a4cf7048` (support-loved-one): التطبيع for לנרמל -> تقديم الأمر كأمر طبيعي. In Arabic التطبيع reads first as political "normalization".
- `3824110f0c`, `2a1a90c4ed`: لا يجب عليك أن تتحمّل / ولا يجب عليك اتخاذ ("you must not...") -> ليس عليك ("you don't have to"). The old wording reversed the meaning in the violence and sexual-assault answers.
- `1659269993` (contact guidance): الموضوع المسؤول عنه ("the topic it is responsible for") -> الموضوع الذي سُئل عنه (the topic asked about).
- Questionnaire menu label (16/52eda3b686, 7cc934715f, 428cbaf684, 59d48b0c38): the v3 menu shows ROUTE_META `questionnaire.label` = **استبيان مجهول الهوية**, so "في القائمة" now names that label. The page itself keeps **استبيان التقييم الذاتي** (i18n `questionnaire_title` prefix).
- התקף חרדה is now consistently نوبة قلق and פאניקה stays نوبة هلع (14/a05aacdd9f, 14/91aa8deac2, 17/2f3686425b, 15/1c63df7d80). Before, one row mixed the two for the same Hebrew term.
- מוקד הרווחה 118: مركز الرفاه (ambiguous: a welfare office/center) -> خط الرفاه **118** (5 strings in 15).
- יועץ/ת בית הספר: مستشار المدرسة -> المستشار التربوي في المدرسة (Israeli-Arab school term; 15/034db834a7, 15/1c6f64a8cf).
- `e50bb3f019`: the translator had added a gloss ("لقب عبري ساخر...") that is not in the Hebrew. Now it reads «بوستماطي» أو «بوست تروما», which matches how the paraphrase row renders the nickname.
- `3912668665` (medication answer): rewrote the garbled passive "يقدّم العلاج الدوائي ... طبيبٌ نفسي، ويُوصَل إليه" and the "إن كنت ستتناول دواءً، أو أيّ دواء" construction.
- `d600485a37`, `ef265ed073`: grammar (وهي مقسّمة في صفحة **الحقوق**..., اسأل عن المسار ذي الصلة).
- Calques and naturalness: تعال نجرّب / تعال نعود -> لنجرّب / لنعد; ويد واحدة على بطنك -> وضع يدًا على بطنك; لا أنام في الليالي -> في الليل; إذا لم تنم بعد نحو 20 دقيقة -> إذا لم تغفُ خلال...; منذ الآن -> الآن (16/15741f8928, d3fde65c1f); لمدة 2 دقيقة -> لمدة دقيقتين; 2 من الروائح -> رائحتان; أنا آسف جدًا لفقدانك -> على خسارتك; يحمل البيت -> يحمل عبء البيت.
- Paraphrases (what users type): لديّ استرجاع للذكرى (فلاشباك) الآن -> عندي فلاشباك الآن; تفارق الآن -> عندي انفصال عن الواقع الآن; هل أنت روبوت محادثة؟ -> هل أنت بوت؟; كيف نهدّئ الرأس -> كيف أهدّئ أفكاري; بدي انتحر -> بدي أنتحر; رفيق من الفرقة (فرقة = an army division; צוות is a unit/team) -> رفيق من الوحدة.
- 21/7626ef041f (privacy): آلية آلية ترصد -> آلية تلقائية ترصد.

### Crisis rows

suicidal-thoughts, self-harm, someone-else-suicidal, and the suicide/self-harm branches in the other rows were read line by line. They give no method, quantity or means details. The wording is direct and caring, ERAN **1201** appears in every one, 101/100 are intact, "لست وحدك/لا تبقَ وحدك" is present, and the "I am an automated assistant, nobody reads this" line is there. The paraphrases that name a method ("كم حبة لازم آخذ...", "بدي أطخ حالي براسي") are user inputs for matching and are correct as such. Only one meaning fix was needed (e6a00eb308 above).

### Legal texts and batch 20

Privacy policy, terms of use and the מרחב מטיב program description are in a correct legal/formal register. Every heading, list item, bold span, link text and link target (/terms-of-use, /privacy-policy, mailto, provider URLs) is preserved. The glossary name for Metiv is used, and مساحة ميتيف matches batches 04-06. One fix (above). Batch 20 (4 labels) is correct.

### Open questions / out of scope (not editable here)

- `src/lib/i18n.js` ar has visible bugs: `eran_link` says "تحدث مع **إيران**" (Iran) instead of عيران. `muscle_title` "الشد والإفراج" uses الإفراج (release from custody); it should be "الشد والإرخاء". `community` (nav) "المجتمعات" vs title "المجتمعات واللقاءات"; `rights` "الحقوق والإجراءات" vs nav "الحقوق". These sit outside the allowed files.
- The Hebrew guidance itself names the questionnaire menu item "שאלון אבחון עצמי" and the paths "מתמודד/ת עם פוסט טראומה" / "קרוב/ה של מתמודד/ת", but the Hebrew v3 menu shows the ROUTE_META labels (שאלון אנונימי, מי שחווה אירוע קשה, קרובים ובני משפחה). The source rows should be updated, or the owner should confirm which labels the bot is meant to cite.
- The v3 site shows three labels for one exercise: the card says الشد والإفراج, the page heading says شدّ العضلات وإرخاؤها and the breadcrumb says إرخاء العضلات. I used the page heading. If i18n is fixed, align the chatbot rows to it.

### Verdict (chatbot + legal)

The second-pass chatbot translation (14-19) is good: faithful, safe-messaging compliant, with natural colloquial Levantine paraphrases. Its systematic weakness was page names taken from stale seed labels instead of what v3 renders, plus a handful of meaning slips (listed above). The first-pass strings (07-10) still current are clean question/paraphrase strings and now read consistently with the new guidance/answers of the same rows. After this round I consider the Arabic chatbot rows and batches 20-21 publishable, pending the i18n fixes above, which a native speaker should also confirm.
