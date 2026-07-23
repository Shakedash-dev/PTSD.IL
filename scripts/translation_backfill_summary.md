# Translation Backfill - Phase 1 (review before POST)

Generated proposal file: `scripts/translation_backfill.json` (246 new article rows). NOTHING was POSTed to the API. Nothing committed.

## Totals

- Source corpus: **77 content groups**, 139 published rows (Hebrew present in every group; 31 groups also had ar+en).
- New rows generated: **246**

| Language | Rows generated |
|----------|----------------|
| Arabic (ar) | 46 |
| Russian (ru) | 77 |
| English (en) | 46 |
| French (fr) | 77 |
| **Total** | **246** |

Breakdown: `ru` and `fr` = 77 each (every group, both were absent everywhere). `ar` and `en` = 46 each (the 46 Hebrew-only groups; the 31 FAQ groups already had ar+en).

After this backfill is applied, all 77 groups reach full 5-language coverage (validated: 0 groups left incomplete).

## Group types covered

faq: 31, activity: 11, story: 7, source: 7, article: 6, book: 5, tool: 5, treatment_step: 5

## Blockers (could NOT be done this phase)

- **Step 2 (create `ru`/`fr` languages in the DB): BLOCKED.** The deployed API's entire `/api/auth/*` module is missing - `POST /api/auth/login` returns `404 Not Found` (deterministic routing 404, persisted across retries and cold-start). No admin token can be obtained, so `POST /api/admin/languages` (and any admin write) is unreachable. `GET /api/languages` still confirms only `he, ar, en` exist. This must be resolved before Phase 2.
- **Unpublished content: NOT included.** Fetching unpublished rows requires the admin endpoint (same token). Sourcing used the public `GET /api/articles` (published only): 139 rows / 77 groups. If unpublished items exist, they are not in this file.

## Validation performed

Every generated row was checked programmatically: (1) `content` is a JSON string whose parsed structure is key-for-key identical to the Hebrew source (same keys, array lengths, nesting); (2) every URL (native `url`, markdown `[..](url)` targets, `links[].url`, `cta.url`) is byte-identical to source; (3) no em-dashes or en-dashes anywhere; (4) `isPublished`, `sortOrder`, `type`, taxonomy id arrays copied from source; (5) no duplicate (groupId, langId); (6) full 5-language coverage. Result: **0 errors**.

## Open flags for the Hebrew editor / reviewer

- **Book titles** now carry a transliteration plus the Hebrew original in parentheses (e.g. `Daddy Postamaty (אבא פוסטמטי)`). The `_sourceTitle` field already preserves the original; drop the parenthetical if you prefer clean LTR/RTL titles.
- **French typography**: uses native spacing before `: ? %` (e.g. `20 %`). Numeric values unchanged. Switch to glued `20%` if you want it to match the he/en/ar rows exactly.
- **Source Hebrew quirks preserved verbatim (translate-only, not corrected):** the 'quiet corner' activity says the corner is for when one is 'too calm, or too overwhelmed' (likely a typo for 'too stressed'); one children book body ends with a Hebrew-specific book-search suggestion ('...in Hebrew, ages 2-4'); one source's `url` points to `idf.il` while labeled Ministry of Defense Rehabilitation Division. Flagged, not altered.
- **Org names never dropped:** where an existing en/ar sibling had omitted an org (e.g. NATAL / ERAN in one options list), the new ru/fr rows keep it, per the source-of-truth rule.
- **SSRI/SNRI**: Hebrew gives no gloss, so none was added (translate-only).

---

## Full sample items (Hebrew source + all target languages)

### Sample: איך לזהות סימני מצוקה - ומתי לדאוג ברצינות?
- groupId: `390f547c-56ca-4a22-8265-018af52d7399`  |  type: `faq`  |  CRISIS / SENSITIVE - recognizing distress signs and when to seek urgent help
- taxonomy: categories=['second-circle'] audiences=[] ageGroups=[]

#### Hebrew (source)
**title:** איך לזהות סימני מצוקה - ומתי לדאוג ברצינות?

```json
{
  "intro": "אנשים שחיים עם פוסט-טראומה לא תמיד אומרים שקשה להם. לפעמים הסימנים שקטים. הכרת הסימנים האלה היא לא פרנויה - היא דאגה אמיתית.",
  "sections": [
    {
      "heading": "סימנים יומיומיים לשים אליהם לב",
      "body": "-   נסיגה חברתית - פחות יציאות, פחות תקשורת יזומה.\n-   שינויים קיצוניים בשינה - יותר מדי, או פחות מדי.\n-   פרצי זעם או בכי שלא בפרופורציה לטריגר.\n-   איבוד עניין בדברים שפעם אהבו.\n-   עלייה בשימוש באלכוהול, סמים, או הימורים."
    },
    {
      "heading": "סימנים שדורשים פעולה מיידית",
      "body": "-   דיבור על חוסר תקווה - \"אין לי סיבה\", \"היה עדיף בלעדיי\".\n-   נתינת חפצים יקרים או \"סגירת חשבונות\".\n-   שקט פתאומי ורגוע אחרי תקופה קשה - לפעמים זה דגל אדום."
    }
  ],
  "callout": "**אם זיהיתם סימנים מהקטגוריה השנייה - אל תחכו.** התקשרו לערן **1201** (24/7), או למוקד סה\"ר. אם יש סכנה מיידית - מד\"א 101 או מיון פסיכיאטרי."
}
```

#### Arabic (existing in DB)
**title:** كيف تتعرف على علامات الضيق - ومتى تقلق جدياً؟

```json
{
  "intro": "من يعيش مع اضطراب ما بعد الصدمة لا يقول دائماً إنه يعاني. أحياناً العلامات صامتة. معرفتها ليست بارانويا - بل اهتمام حقيقي.",
  "sections": [
    {
      "heading": "علامات يومية تستحق الانتباه",
      "body": "-   انسحاب اجتماعي - خروج أقل، تواصل مبادر أقل.\n-   تغيّرات حادة في النوم - كثير جداً أو قليل جداً.\n-   نوبات غضب أو بكاء غير متناسبة مع المُحفّز.\n-   فقدان الاهتمام بأشياء كان يحبها.\n-   زيادة في تعاطي الكحول أو المخدرات أو القمار."
    },
    {
      "heading": "علامات تستدعي تحرّكاً فورياً",
      "body": "-   كلام عن اليأس - \"لا سبب لي\"، \"الأفضل لو لم أكن هنا\".\n-   إعطاء أغراض ثمينة أو \"إنهاء حسابات\".\n-   هدوء مفاجئ ومطمئن بعد فترة صعبة - أحياناً علامة حمراء."
    }
  ],
  "callout": "**إذا رصدت علامات من الفئة الثانية - لا تنتظر.** اتصل بإيران **1201** (24/7)، أو بمركز سهار. إن كان هناك خطر فوري - نجمة داود الحمراء 101 أو طوارئ نفسية."
}
```

#### Russian (GENERATED)
**title:** Как распознать признаки бедствия - и когда стоит всерьёз забеспокоиться?

```json
{
  "intro": "Люди, живущие с посттравматическим стрессовым расстройством (ПТСР), не всегда говорят, что им тяжело. Иногда признаки тихие. Знать их - это не паранойя, а настоящая забота.",
  "sections": [
    {
      "heading": "Повседневные признаки, на которые стоит обратить внимание",
      "body": "-   Социальная замкнутость - реже выходит из дома, реже сам начинает общение.\n-   Резкие изменения сна - слишком много или слишком мало.\n-   Вспышки гнева или слёз, несоразмерные поводу.\n-   Потеря интереса к тому, что раньше любил.\n-   Рост употребления алкоголя, наркотиков или азартных игр."
    },
    {
      "heading": "Признаки, требующие немедленных действий",
      "body": "-   Разговоры о безнадёжности - \"у меня нет причины\", \"без меня было бы лучше\".\n-   Раздача ценных вещей или \"закрытие всех дел\".\n-   Внезапное спокойствие после тяжёлого периода - иногда это тревожный сигнал."
    }
  ],
  "callout": "**Если вы заметили признаки из второй категории - не ждите.** Позвоните в ЭРАН (ERAN) **1201** (24/7) или в центр САХАР (SAHAR). Если есть непосредственная опасность - МАДА (MDA) 101 или психиатрическое приёмное отделение."
}
```

#### English (existing in DB)
**title:** How to recognize signs of distress - and when to seriously worry?

```json
{
  "intro": "People living with PTSD don't always say when it's hard. Sometimes the signs are quiet. Knowing them isn't paranoia - it's real care.",
  "sections": [
    {
      "heading": "Everyday signs to notice",
      "body": "-   Social withdrawal - going out less, initiating contact less.\n-   Extreme sleep changes - too much, or too little.\n-   Outbursts of anger or tears disproportionate to the trigger.\n-   Loss of interest in things they used to love.\n-   Increased use of alcohol, drugs, or gambling."
    },
    {
      "heading": "Signs that need action now",
      "body": "-   Talk of hopelessness - \"I have no reason,\" \"It would be better without me.\"\n-   Giving away valuable items or \"wrapping things up.\"\n-   A sudden calm after a hard period - sometimes a red flag."
    }
  ],
  "callout": "**If you see signs from the second category - don't wait.** Call ERAN **1201** (24/7), or SAHAR online. If there's immediate danger - MDA 101 or a psychiatric ER."
}
```

#### French (GENERATED)
**title:** Comment reconnaître les signes de détresse - et quand faut-il vraiment s'inquiéter ?

```json
{
  "intro": "Les personnes qui vivent avec un trouble de stress post-traumatique (TSPT) ne disent pas toujours que c'est difficile. Parfois, les signes sont discrets. Les connaître n'est pas de la paranoïa - c'est un véritable soin.",
  "sections": [
    {
      "heading": "Signes du quotidien à remarquer",
      "body": "-   Repli social - sort moins, engage moins le contact.\n-   Changements extrêmes du sommeil - trop, ou trop peu.\n-   Accès de colère ou de larmes disproportionnés par rapport au déclencheur.\n-   Perte d'intérêt pour des choses qu'il aimait autrefois.\n-   Consommation accrue d'alcool, de drogues ou de jeux d'argent."
    },
    {
      "heading": "Signes qui exigent d'agir immédiatement",
      "body": "-   Des propos de désespoir - \"je n'ai aucune raison\", \"ce serait mieux sans moi\".\n-   Le fait de donner des objets de valeur ou de \"tout régler\".\n-   Un calme soudain et apaisé après une période difficile - parfois un signal d'alarme."
    }
  ],
  "callout": "**Si vous repérez des signes de la seconde catégorie - n'attendez pas.** Appelez ERAN **1201** (24/7), ou le centre SAHAR. En cas de danger immédiat - MDA 101 ou les urgences psychiatriques."
}
```


---

### Sample: טיפולים גוף-נפש ומשלימים
- groupId: `1e7c9b50-0135-4cb3-8231-9b4e51b3013e`  |  type: `treatment_step`  |  LONGEST content item (2834 chars) - body-mind & complementary therapies
- taxonomy: categories=['treatment'] audiences=[] ageGroups=[]

#### Hebrew (source)
**title:** טיפולים גוף-נפש ומשלימים

```json
{
  "description": "שיטות מבוססות-גוף שמשלבים לצד פסיכותרפיה - עבודה עדינה עם מערכת העצבים, הנשימה והגוף, כתוספת לטיפול הפסיכולוגי (לא במקומו). לחצו על כל שיטה כדי לראות איך מתחילים.",
  "how_to_start": "",
  "methods": [
    {
      "title": "סדנת נשימות BBM (Breath-Body-Mind)",
      "description": "שילוב של תרגילי נשימה, תנועה ומדיטציה, המסייע להפחתת מתח, שיפור ויסות רגשי וחיזוק תחושת רוגע וביטחון.",
      "how_to_start": "מועברת בסדנאות קבוצתיות על ידי מדריכים מוסמכים. ב-BBM Foundation ישראל פועלים מדריכים מוסמכים ברחבי הארץ, מקוון ופנים אל פנים.",
      "links": [
        {
          "label": "BBM Foundation ישראל",
          "url": "https://www.breathbodymindfoundation.org/israel/he/welcome"
        }
      ]
    },
    {
      "title": "עיסוי טיפולי",
      "description": "מגע טיפולי שיכול לסייע בהרפיית הגוף, שחרור מתח מצטבר והפחתת עוררות-יתר.",
      "how_to_start": "ניתן על ידי מעסה/ית מוסמך/ת. ניתן לברר עם קופת החולים לגבי סבסוד או הפניה, או לפנות למטפל/ת פרטי/ת המתמחה בעבודה עם נפגעי טראומה.",
      "links": []
    },
    {
      "title": "סוג'וק",
      "description": "שיטת דיקור קוריאנית המבוססת על גירוי נקודות בכפות הידיים, לאיזון מערכות הגוף ותמיכה בהרגעה כללית.",
      "how_to_start": "ניתן על ידי מטפל/ת מוסמך/ת. איגוד הסו-ג'וק הבינלאומי - סניף ישראל מפעיל סניפים בחיפה, תל אביב וירושלים.",
      "links": [
        {
          "label": "איגוד הסו-ג'וק הבינלאומי - סניף ישראל",
          "url": "https://www.israelsujok.com/"
        }
      ]
    },
    {
      "title": "יוגה נידרה",
      "description": "תרגול מונחה של הרפיה עמוקה, לשיפור השינה, הפחתת חרדה וחיזוק תחושת היציבות הפנימית.",
      "how_to_start": "ניתן לתרגל עצמאית, בעזרת הקלטה מודרכת או לפי ההנחיות הבאות, או במסגרת קבוצתית עם מדריך/ה מוסמך/ת ליוגה:\n\n1.  שכבו על הגב במקום שקט, כרית מתחת לראש ואולי שמיכה קלה\n2.  עצמו עיניים ותנו לנשימה להיות טבעית\n3.  \"סרקו\" את הגוף בתשומת לב, חלק אחרי חלק - מכפות הרגליים ועד קצות הראש\n4.  שימו לב לנשימה עצמה כמה דקות, בלי לשנות אותה\n5.  לקראת הסיום, החזירו את תשומת הלב לאט לגוף ולחדר, ופקחו עיניים בעדינות\n\nתרגול מלא אורך בדרך כלל 20-30 דקות, אך אפשר גם קצר יותר.",
      "links": []
    },
    {
      "title": "יוגה רגישת-טראומה (TSY)",
      "description": "יוגה שמותאמת לנפגעי טראומה, מדגישה בחירה וגבולות גוף.",
      "how_to_start": "ניתן לשאול את הפסיכולוג/ית או המטפל/ת שלכם אם הוא/היא משלב/ת אלמנטים של TSY בטיפול. לתרגול עם מדריך/ה שהוכשר/ה ספציפית בשיטה - ניתן לחפש במאגר המדריכים המוסמכים הבינלאומי (באנגלית, ניתן לסנן לפי מדינה).",
      "links": [
        {
          "label": "מאגר מדריכי TSY מוסמכים",
          "url": "https://www.traumasensitiveyoga.com/facilitators"
        }
      ]
    },
    {
      "title": "מיינדפולנס",
      "description": "תשומת לב לרגע הנוכחי - לנשימה, לתחושות בגוף, למחשבות - בלי לשפוט אותן. עוזר להפחית תחושת דריכות-יתר, כתוספת לטיפול הממוקד-טראומה (לא כתחליף לו).",
      "how_to_start": "תרגיל קצר לניסיון עצמאי: שבו בנוחות, ושימו לב לנשימה שלכם למשך כמה דקות - איך האוויר נכנס ויוצא, בלי לנסות לשנות אותה. כשמחשבה עולה, שימו לב אליה בלי לשפוט, והחזירו את תשומת הלב לנשימה. אפשר לתרגל גם עם תרגילי הנשימה והקרקוע בדף ההרגעה של האתר, או במסגרת קורס מובנה עם מדריך/ה מוסמך/ת.",
      "links": [
        {
          "label": "לדף ההרגעה",
          "url": "/calming"
        }
      ]
    }
  ]
}
```

#### Arabic (GENERATED)
**title:** علاجات الجسد والنفس والعلاجات التكميلية

```json
{
  "description": "أساليب قائمة على الجسد تُستخدم إلى جانب العلاج النفسي - عمل لطيف مع الجهاز العصبي والتنفّس والجسد، كإضافة إلى العلاج النفسي (وليس بديلاً عنه). اضغط على كل طريقة لترى كيف تبدأ.",
  "how_to_start": "",
  "methods": [
    {
      "title": "ورشة تنفّس BBM (Breath-Body-Mind)",
      "description": "مزيج من تمارين التنفّس والحركة والتأمّل، يساعد على تخفيف التوتر وتحسين التنظيم الانفعالي وتعزيز الشعور بالهدوء والأمان.",
      "how_to_start": "تُقدَّم في ورشات جماعية على يد مدرّبين معتمدين. لدى BBM Foundation إسرائيل مدرّبون معتمدون في أنحاء البلاد، عبر الإنترنت وحضوريًا.",
      "links": [
        {
          "label": "BBM Foundation إسرائيل",
          "url": "https://www.breathbodymindfoundation.org/israel/he/welcome"
        }
      ]
    },
    {
      "title": "التدليك العلاجي",
      "description": "لمسة علاجية يمكن أن تساعد على استرخاء الجسد، وتحرير التوتر المتراكم، وتخفيف فرط الاستثارة.",
      "how_to_start": "يقدّمه معالج تدليك معتمد. يمكنك الاستفسار من صندوق المرضى عن الدعم المادي أو الإحالة، أو التوجّه إلى معالج خاص متخصّص في العمل مع الناجين من الصدمات.",
      "links": []
    },
    {
      "title": "سو جوك",
      "description": "طريقة وخز إبر كورية تعتمد على تحفيز نقاط في راحتي اليدين، لموازنة أجهزة الجسم ودعم الاسترخاء العام.",
      "how_to_start": "يقدّمه معالج معتمد. تدير جمعية سو جوك الدولية - فرع إسرائيل فروعًا في حيفا وتل أبيب والقدس.",
      "links": [
        {
          "label": "جمعية سو جوك الدولية - فرع إسرائيل",
          "url": "https://www.israelsujok.com/"
        }
      ]
    },
    {
      "title": "يوغا نيدرا",
      "description": "ممارسة موجّهة للاسترخاء العميق، لتحسين النوم وتخفيف القلق وتعزيز الشعور بالثبات الداخلي.",
      "how_to_start": "يمكنك التمرّن بمفردك، بمساعدة تسجيل موجَّه أو وفق الإرشادات التالية، أو ضمن مجموعة مع مدرّب يوغا معتمد:\n\n1.  استلقِ على ظهرك في مكان هادئ، مع وسادة تحت الرأس وربما بطانية خفيفة\n2.  أغمض عينيك ودع تنفّسك يكون طبيعيًا\n3.  «امسح» جسدك بانتباه، جزءًا بعد جزء - من باطن القدمين حتى أعلى الرأس\n4.  انتبه إلى التنفّس نفسه لبضع دقائق، دون تغييره\n5.  قرب النهاية، أعِد انتباهك ببطء إلى جسدك وإلى الغرفة، ثم افتح عينيك بلطف\n\nتستغرق الممارسة الكاملة عادةً 20-30 دقيقة، لكن يمكن أن تكون أقصر أيضًا.",
      "links": []
    },
    {
      "title": "اليوغا المراعية للصدمة (TSY)",
      "description": "يوغا مكيّفة للناجين من الصدمات، تركّز على الاختيار وحدود الجسد.",
      "how_to_start": "يمكنك أن تسأل أخصائيك النفسي أو معالجك إن كان يدمج عناصر من TSY في علاجك. وللتمرّن مع مدرّب مدرَّب خصيصًا على هذه الطريقة، يمكنك البحث في قاعدة البيانات الدولية للمدرّبين المعتمدين (بالإنجليزية، مع إمكانية التصفية حسب الدولة).",
      "links": [
        {
          "label": "قاعدة بيانات مدرّبي TSY المعتمدين",
          "url": "https://www.traumasensitiveyoga.com/facilitators"
        }
      ]
    },
    {
      "title": "اليقظة الذهنية (mindfulness)",
      "description": "الانتباه إلى اللحظة الحاضرة - إلى التنفّس، وإلى أحاسيس الجسد، وإلى الأفكار - دون الحكم عليها. يساعد على تخفيف الشعور بفرط التيقّظ، كإضافة إلى العلاج المركّز على الصدمة (وليس بديلاً عنه).",
      "how_to_start": "تمرين قصير لتجربته بنفسك: اجلس مرتاحًا وانتبه إلى تنفّسك لبضع دقائق - كيف يدخل الهواء ويخرج، دون محاولة تغييره. وعندما تخطر فكرة، لاحظها دون حكم، ثم أعِد انتباهك بلطف إلى تنفّسك. يمكنك أيضًا التمرّن مع تمارين التنفّس والتأريض في صفحة التهدئة في الموقع، أو ضمن دورة منظّمة مع مدرّب معتمد.",
      "links": [
        {
          "label": "إلى صفحة التهدئة",
          "url": "/calming"
        }
      ]
    }
  ]
}
```

#### Russian (GENERATED)
**title:** Телесно-психические и дополнительные методы

```json
{
  "description": "Телесно-ориентированные методы, которые применяют наряду с психотерапией - бережная работа с нервной системой, дыханием и телом как дополнение к психологическому лечению (а не вместо него). Нажмите на любой метод, чтобы узнать, как начать.",
  "how_to_start": "",
  "methods": [
    {
      "title": "Дыхательный семинар BBM (Breath-Body-Mind)",
      "description": "Сочетание дыхательных упражнений, движения и медитации, которое помогает снизить напряжение, улучшить эмоциональную саморегуляцию и укрепить ощущение спокойствия и безопасности.",
      "how_to_start": "Проводится на групповых занятиях сертифицированными инструкторами. В BBM Foundation Израиль работают сертифицированные инструкторы по всей стране, онлайн и очно.",
      "links": [
        {
          "label": "BBM Foundation Израиль",
          "url": "https://www.breathbodymindfoundation.org/israel/he/welcome"
        }
      ]
    },
    {
      "title": "Лечебный массаж",
      "description": "Терапевтическое прикосновение, которое помогает телу расслабиться, снять накопившееся напряжение и уменьшить повышенную возбудимость.",
      "how_to_start": "Проводится сертифицированным массажистом. Можно уточнить в больничной кассе о субсидии или направлении либо обратиться к частному специалисту, работающему с людьми, пережившими травму.",
      "links": []
    },
    {
      "title": "Су-джок",
      "description": "Корейский метод акупунктуры, основанный на стимуляции точек на ладонях, для баланса систем организма и поддержки общего успокоения.",
      "how_to_start": "Проводится сертифицированным специалистом. Международная ассоциация су-джок - израильское отделение имеет филиалы в Хайфе, Тель-Авиве и Иерусалиме.",
      "links": [
        {
          "label": "Международная ассоциация су-джок - израильское отделение",
          "url": "https://www.israelsujok.com/"
        }
      ]
    },
    {
      "title": "Йога-нидра",
      "description": "Управляемая практика глубокого расслабления для улучшения сна, снижения тревоги и укрепления ощущения внутренней устойчивости.",
      "how_to_start": "Можно практиковать самостоятельно, с помощью аудиозаписи-гида или по приведённым ниже указаниям, либо в группе с сертифицированным преподавателем йоги:\n\n1.  Лягте на спину в тихом месте, подложив подушку под голову и, при желании, лёгкое одеяло\n2.  Закройте глаза и позвольте дыханию быть естественным\n3.  Мягко «просканируйте» тело, часть за частью - от стоп до макушки\n4.  Несколько минут наблюдайте за самим дыханием, не меняя его\n5.  Ближе к завершению медленно верните внимание к телу и к комнате и мягко откройте глаза\n\nПолная практика обычно занимает 20-30 минут, но может быть и короче.",
      "links": []
    },
    {
      "title": "Йога, чувствительная к травме (TSY)",
      "description": "Йога, адаптированная для переживших травму, с акцентом на выбор и телесные границы.",
      "how_to_start": "Вы можете спросить у своего психолога или терапевта, включает ли он элементы TSY в вашу терапию. Чтобы заниматься с инструктором, прошедшим специальную подготовку по этому методу, можно поискать в международном реестре сертифицированных инструкторов (на английском, с фильтром по стране).",
      "links": [
        {
          "label": "Реестр сертифицированных инструкторов TSY",
          "url": "https://www.traumasensitiveyoga.com/facilitators"
        }
      ]
    },
    {
      "title": "Майндфулнес (осознанность)",
      "description": "Внимание к настоящему моменту - к дыханию, к ощущениям в теле, к мыслям - без их оценки. Помогает снизить ощущение сверхнастороженности как дополнение к терапии, сфокусированной на травме (а не замена ей).",
      "how_to_start": "Короткое упражнение, чтобы попробовать самому: сядьте удобно и несколько минут понаблюдайте за дыханием - как воздух входит и выходит, не пытаясь его изменить. Когда возникает мысль, отметьте её без осуждения и мягко верните внимание к дыханию. Можно также практиковать с дыхательными упражнениями и упражнениями на заземление на странице успокоения сайта или в рамках структурированного курса с сертифицированным инструктором.",
      "links": [
        {
          "label": "К странице успокоения",
          "url": "/calming"
        }
      ]
    }
  ]
}
```

#### English (GENERATED)
**title:** Body-Mind and Complementary Therapies

```json
{
  "description": "Body-based approaches used alongside psychotherapy - gentle work with the nervous system, the breath and the body, as a complement to psychological treatment (not a replacement for it). Tap on any method to see how to get started.",
  "how_to_start": "",
  "methods": [
    {
      "title": "BBM Breathing Workshop (Breath-Body-Mind)",
      "description": "A blend of breathing exercises, movement and meditation that helps reduce stress, improve emotional regulation and strengthen a sense of calm and safety.",
      "how_to_start": "Offered in group workshops led by certified instructors. BBM Foundation Israel has certified instructors across the country, both online and in person.",
      "links": [
        {
          "label": "BBM Foundation Israel",
          "url": "https://www.breathbodymindfoundation.org/israel/he/welcome"
        }
      ]
    },
    {
      "title": "Therapeutic Massage",
      "description": "Therapeutic touch that can help the body relax, release built-up tension and ease hyperarousal.",
      "how_to_start": "Provided by a certified massage therapist. You can check with your health fund about a subsidy or a referral, or turn to a private practitioner who specializes in working with trauma survivors.",
      "links": []
    },
    {
      "title": "Su Jok",
      "description": "A Korean acupuncture method based on stimulating points on the palms of the hands, to balance the body's systems and support overall calming.",
      "how_to_start": "Provided by a certified practitioner. The International Su Jok Association - Israel branch runs offices in Haifa, Tel Aviv and Jerusalem.",
      "links": [
        {
          "label": "International Su Jok Association - Israel branch",
          "url": "https://www.israelsujok.com/"
        }
      ]
    },
    {
      "title": "Yoga Nidra",
      "description": "A guided practice of deep relaxation, to improve sleep, ease anxiety and strengthen a sense of inner stability.",
      "how_to_start": "You can practice on your own, with a guided recording or by following the steps below, or in a group setting with a certified yoga instructor:\n\n1.  Lie on your back in a quiet spot, a pillow under your head and perhaps a light blanket\n2.  Close your eyes and let your breathing be natural\n3.  Gently \"scan\" your body, part by part - from the soles of your feet to the top of your head\n4.  Notice your breath itself for a few minutes, without changing it\n5.  As you finish, slowly bring your attention back to your body and the room, and gently open your eyes\n\nA full practice usually lasts 20-30 minutes, but it can be shorter too.",
      "links": []
    },
    {
      "title": "Trauma-Sensitive Yoga (TSY)",
      "description": "Yoga adapted for trauma survivors, emphasizing choice and bodily boundaries.",
      "how_to_start": "You can ask your psychologist or therapist whether they incorporate elements of TSY into your treatment. To practice with an instructor specifically trained in the method, you can search the international directory of certified instructors (in English, filterable by country).",
      "links": [
        {
          "label": "Directory of certified TSY instructors",
          "url": "https://www.traumasensitiveyoga.com/facilitators"
        }
      ]
    },
    {
      "title": "Mindfulness",
      "description": "Paying attention to the present moment - to the breath, to bodily sensations, to thoughts - without judging them. It helps ease a sense of hypervigilance, as a complement to trauma-focused treatment (not a substitute for it).",
      "how_to_start": "A short exercise to try on your own: sit comfortably and notice your breathing for a few minutes - how the air comes in and goes out, without trying to change it. When a thought arises, notice it without judgment, and gently return your attention to your breath. You can also practice with the breathing and grounding exercises on the site's calming page, or through a structured course with a certified instructor.",
      "links": [
        {
          "label": "Go to the calming page",
          "url": "/calming"
        }
      ]
    }
  ]
}
```

#### French (GENERATED)
**title:** Thérapies corps-esprit et complémentaires

```json
{
  "description": "Des approches fondées sur le corps, utilisées en parallèle d'une psychothérapie - un travail en douceur avec le système nerveux, la respiration et le corps, en complément du traitement psychologique (et non à sa place). Cliquez sur chaque méthode pour voir comment commencer.",
  "how_to_start": "",
  "methods": [
    {
      "title": "Atelier de respiration BBM (Breath-Body-Mind)",
      "description": "Une combinaison d'exercices de respiration, de mouvement et de méditation, qui aide à réduire le stress, à améliorer la régulation émotionnelle et à renforcer un sentiment de calme et de sécurité.",
      "how_to_start": "Proposé en ateliers de groupe animés par des instructeurs certifiés. BBM Foundation Israël compte des instructeurs certifiés dans tout le pays, en ligne et en présentiel.",
      "links": [
        {
          "label": "BBM Foundation Israël",
          "url": "https://www.breathbodymindfoundation.org/israel/he/welcome"
        }
      ]
    },
    {
      "title": "Massage thérapeutique",
      "description": "Un toucher thérapeutique qui peut aider le corps à se détendre, libérer les tensions accumulées et atténuer l'hypervigilance.",
      "how_to_start": "Dispensé par un masseur certifié. Vous pouvez vous renseigner auprès de votre caisse de santé sur une prise en charge ou une orientation, ou vous adresser à un praticien privé spécialisé dans le travail avec les personnes traumatisées.",
      "links": []
    },
    {
      "title": "Su Jok",
      "description": "Une méthode d'acupuncture coréenne fondée sur la stimulation de points situés dans la paume des mains, pour équilibrer les systèmes du corps et favoriser un apaisement global.",
      "how_to_start": "Dispensé par un praticien certifié. L'Association internationale de Su Jok - antenne d'Israël dispose de branches à Haïfa, Tel Aviv et Jérusalem.",
      "links": [
        {
          "label": "Association internationale de Su Jok - antenne d'Israël",
          "url": "https://www.israelsujok.com/"
        }
      ]
    },
    {
      "title": "Yoga Nidra",
      "description": "Une pratique guidée de relaxation profonde, pour améliorer le sommeil, apaiser l'anxiété et renforcer un sentiment de stabilité intérieure.",
      "how_to_start": "Vous pouvez pratiquer seul, à l'aide d'un enregistrement guidé ou en suivant les indications ci-dessous, ou en groupe avec un instructeur de yoga certifié :\n\n1.  Allongez-vous sur le dos dans un endroit calme, un oreiller sous la tête et éventuellement une couverture légère\n2.  Fermez les yeux et laissez votre respiration devenir naturelle\n3.  « Parcourez » votre corps avec attention, partie après partie - de la plante des pieds jusqu'au sommet de la tête\n4.  Portez attention à la respiration elle-même pendant quelques minutes, sans la modifier\n5.  Vers la fin, ramenez doucement votre attention à votre corps et à la pièce, puis ouvrez les yeux avec douceur\n\nUne pratique complète dure en général 20-30 minutes, mais elle peut aussi être plus courte.",
      "links": []
    },
    {
      "title": "Yoga sensible au traumatisme (TSY)",
      "description": "Un yoga adapté aux personnes traumatisées, qui met l'accent sur le choix et les limites corporelles.",
      "how_to_start": "Vous pouvez demander à votre psychologue ou à votre thérapeute s'il intègre des éléments de TSY dans votre suivi. Pour pratiquer avec un instructeur spécifiquement formé à cette méthode, vous pouvez consulter le répertoire international des instructeurs certifiés (en anglais, filtrable par pays).",
      "links": [
        {
          "label": "Répertoire des instructeurs TSY certifiés",
          "url": "https://www.traumasensitiveyoga.com/facilitators"
        }
      ]
    },
    {
      "title": "Pleine conscience (mindfulness)",
      "description": "Porter attention à l'instant présent - à la respiration, aux sensations du corps, aux pensées - sans les juger. Cela aide à atténuer un sentiment d'hypervigilance, en complément du traitement centré sur le traumatisme (et non en remplacement).",
      "how_to_start": "Un court exercice à essayer par vous-même : asseyez-vous confortablement et observez votre respiration pendant quelques minutes - comment l'air entre et sort, sans chercher à la modifier. Lorsqu'une pensée surgit, observez-la sans la juger, puis ramenez doucement votre attention à votre respiration. Vous pouvez aussi pratiquer avec les exercices de respiration et d'ancrage de la page d'apaisement du site, ou dans le cadre d'un cours structuré avec un instructeur certifié.",
      "links": [
        {
          "label": "Vers la page d'apaisement",
          "url": "/calming"
        }
      ]
    }
  ]
}
```


---

### Sample: נשימת הבלון
- groupId: `ca2ffc6e-d768-4ee8-8be0-ea4d7736ae04`  |  type: `activity`  |  Warm children activity - balloon breathing
- taxonomy: categories=['children'] audiences=[] ageGroups=['7-10']

#### Hebrew (source)
**title:** נשימת הבלון

```json
{
  "body": "נשימה בטנית (סרעפתית) שולחת אות למוח דרך העצב הוואגוס שהגוף בטוח, ומפעילה את מערכת ההרגעה שלו. הדימוי של בלון בבטן עוזר לילד/ה בגיל הזה להבין ולתרגל את זה בקלות.\n\n**איך עושים:**\n\n1.  שבו או שכבו בנוחות, יד אחת על הבטן.\n2.  \"תדמיין/י שיש בלון בבטן. כשאתה שואף אוויר לאט דרך האף - הבלון מתנפח והיד עולה.\"\n3.  \"עכשיו נשוף לאט דרך הפה, כאילו הבלון מתרוקן לאט לאט.\"\n4.  חזרו על כך 5-6 פעמים, בלי למהר.\n\nתרגלו את זה ברגעים רגועים, כדי שיהיה קל לשלוף את זה ברגעי מתח.",
  "description": "תרגיל נשימה בטנית עם דימוי פשוט - מרגיע את מערכת העצבים"
}
```

#### Arabic (GENERATED)
**title:** نفَس البالون

```json
{
  "body": "التنفس البطني (الحجابي) يرسل إلى الدماغ عبر العصب الحائر (المبهم) إشارة بأن الجسم آمن، ويُشغّل نظام التهدئة فيه. تخيُّل بالون في البطن يساعد الطفل في هذا العمر على فهم ذلك وممارسته بسهولة.\n\n**كيف نفعل ذلك:**\n\n1.  اجلس أو استلقِ براحة، ويدٌ واحدة على البطن.\n2.  «تخيّل أن هناك بالونًا في بطنك. عندما تستنشق الهواء ببطء من الأنف - ينتفخ البالون وترتفع يدك».\n3.  «الآن ازفر ببطء من الفم، وكأن البالون يفرغ شيئًا فشيئًا».\n4.  كرّر ذلك 5-6 مرات، دون استعجال.\n\nتدرّبوا على ذلك في اللحظات الهادئة، ليكون من السهل استحضاره في لحظات التوتر.",
  "description": "تمرين تنفّس بطني مع صورة بسيطة - يهدّئ الجهاز العصبي"
}
```

#### Russian (GENERATED)
**title:** Дыхание-шарик

```json
{
  "body": "Брюшное (диафрагмальное) дыхание через блуждающий нерв посылает мозгу сигнал, что телу безопасно, и включает его систему успокоения. Образ шарика в животе помогает ребёнку в этом возрасте легко это понять и освоить.\n\n**Как это делать:**\n\n1.  Сядь или ляг поудобнее, одну руку положи на живот.\n2.  «Представь, что у тебя в животе шарик. Когда ты медленно вдыхаешь воздух через нос - шарик надувается, и рука поднимается».\n3.  «А теперь медленно выдыхай через рот, как будто шарик потихоньку сдувается».\n4.  Повтори 5-6 раз, не торопясь.\n\nТренируйтесь в спокойные моменты, чтобы этим было легко воспользоваться в минуты напряжения.",
  "description": "Упражнение на брюшное дыхание с простым образом - успокаивает нервную систему"
}
```

#### English (GENERATED)
**title:** The Balloon Breath

```json
{
  "body": "Belly (diaphragmatic) breathing sends a signal to the brain through the vagus nerve that the body is safe, and switches on its calming system. Picturing a balloon in the belly helps a child this age understand and practice it easily.\n\n**How to do it:**\n\n1.  Sit or lie down comfortably, one hand on your belly.\n2.  \"Imagine there's a balloon in your belly. As you slowly breathe air in through your nose - the balloon fills up and your hand rises.\"\n3.  \"Now breathe out slowly through your mouth, as if the balloon is emptying little by little.\"\n4.  Repeat 5-6 times, without rushing.\n\nPractice this in calm moments, so it's easy to reach for in moments of stress.",
  "description": "A belly-breathing exercise with a simple image - calms the nervous system"
}
```

#### French (GENERATED)
**title:** La respiration du ballon

```json
{
  "body": "La respiration abdominale (diaphragmatique) envoie au cerveau, par le nerf vague, le signal que le corps est en sécurité, et active son système d'apaisement. L'image d'un ballon dans le ventre aide l'enfant de cet âge à comprendre et à s'exercer facilement.\n\n**Comment faire :**\n\n1.  Assieds-toi ou allonge-toi confortablement, une main sur le ventre.\n2.  « Imagine qu'il y a un ballon dans ton ventre. Quand tu inspires lentement l'air par le nez - le ballon se gonfle et ta main monte. »\n3.  « Maintenant, souffle lentement par la bouche, comme si le ballon se vidait tout doucement. »\n4.  Recommence 5-6 fois, sans te presser.\n\nExerce-toi dans des moments calmes, pour qu'il soit facile d'y recourir dans les moments de stress.",
  "description": "Un exercice de respiration abdominale avec une image toute simple - apaise le système nerveux"
}
```


---
