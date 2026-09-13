# Treatment method descriptions - corrected text

Replacement text for the `description` field of each treatment method, in all five
languages. Method **names are unchanged**. Only the description changes. `how_to_start`
and links are not touched. Mindfulness was already accurate and is left as is.

## How to apply

1. Deploy the current `master` (the methods editor and the panel's language picker are
   not live until then).
2. /admin → **שלבי טיפול** → pick the language in **שפה**.
3. Hover step 3 → pencil → **שיטות טיפול** → paste each description below into the
   **תיאור** field of the method with the matching name → **שמירה**.
4. Repeat for step 4, then for the next language. That's 10 saves in total (2 steps × 5 languages).

Each save writes the row to the DB and re-embeds it in the chatbot's vector DB (the
panel calls the worker's `/reindex` for that row). If a yellow warning says the chatbot sync
failed, the content is still saved. Save again, or run a full reindex.

Descriptions render as plain text, not Markdown. Paste them as they are.

The Arabic, Russian and French text is a translation of the Hebrew/English wording and
should be reviewed, like the rest of the site's ar/ru/fr content.

## עברית (`he`)

### Step 3 - trauma-focused therapies

**PE - חשיפה ממושכת**

```text
טיפול מובנה וקצר-מועד (לרוב 8-15 מפגשים), מהטיפולים המומלצים ביותר לפוסט-טראומה בהנחיות הקליניות. משלב חשיפה בדמיון - חזרה מודרכת ומפורטת על זיכרון האירוע במהלך המפגש - וחשיפה במציאות - חזרה הדרגתית למצבים, מקומות ואנשים שנמנעים מהם מאז. המטרה היא לעבד את הזיכרון הטראומטי כך שיפסיק לעורר פחד ומצוקה, ולהפחית את ההימנעות.
```

**CBT - טיפול קוגניטיבי-התנהגותי**

```text
טיפול מובנה וקצר-מועד, שגרסתו הממוקדת-טראומה היא מהטיפולים המומלצים לפוסט-טראומה. מזהים ובוחנים מחדש מחשבות ואמונות שהשתרשו בעקבות האירוע - אשמה, האשמה עצמית, תחושה שהעולם מסוכן או שאי אפשר לסמוך על אף אחד - ומחליפים אותן בהבנה מדויקת יותר. לרוב כולל גם הקניית כלים להתמודדות עם התסמינים והתמודדות הדרגתית עם זיכרונות ומצבים שנמנעים מהם. טיפול בעיבוד קוגניטיבי (CPT) הוא פרוטוקול מוכר מתוך משפחה זו.
```

**EMDR**

```text
טיפול מובנה המומלץ לפוסט-טראומה בהנחיות הקליניות. במהלך המפגש נזכרים לזמן קצר בחלקים מהאירוע, תוך מעקב אחר גירוי דו-צדדי - לרוב תנועות עיניים מצד לצד בעקבות יד המטפל/ת, ולעיתים הקשות או צלילים. המטרה היא שהזיכרון יפסיק לעורר מצוקה עזה וייחווה כמשהו ששייך לעבר, לצד חיזוק אמונות חיוביות על עצמך.
```

**טיפול דינמי**

```text
טיפול בשיחה שבוחן כיצד חוויות עבר, מערכות יחסים ודפוסים רגשיים שלא תמיד מודעים להם משפיעים על התגובות והקשיים בהווה - כולל ההשפעה של הטראומה על תחושת העצמי ועל הקשרים עם אחרים. הקשר עם המטפל/ת הוא כלי מרכזי, והטיפול לרוב ארוך-טווח יותר. הראיות המחקריות ליעילותו בהפחתת תסמיני פוסט-טראומה מצומצמות יותר מאלה של PE, CBT ו-EMDR.
```

### Step 4 - body-mind and complementary

**סדנת נשימות BBM (Breath-Body-Mind)**

```text
תוכנית שפיתחו הפסיכיאטרים ריצ'רד בראון ופטרישיה גרברג, המשלבת נשימה איטית וקצובה (כחמש נשימות בדקה), תנועה עדינה בהשראת צ'י גונג ומדיטציה. מחקרים ראשוניים מצביעים על הפחתת מתח ותסמיני פוסט-טראומה ועל שיפור בוויסות הרגשי ובתחושת הרוגע.
```

**עיסוי טיפולי**

```text
טיפול במגע ידני ברקמות הרכות של הגוף, המסייע להרפיית השרירים, להפחתת מתח ולתחושת רוגע. עבור נפגעי טראומה חשוב שהטיפול ייעשה בהסכמה מלאה - תיאום של כל מגע ואפשרות לעצור בכל רגע. זהו טיפול משלים, שאינו מטפל בטראומה עצמה.
```

**סוג'וק**

```text
שיטה מתחום הרפואה המשלימה שפותחה בדרום קוריאה על ידי פרופ' פאק ג'ה-וו. מבוססת על התפיסה שכפות הידיים והרגליים משקפות את כל אזורי הגוף ('סו' - יד, 'ג'וק' - רגל), ומגרה בהן נקודות באמצעות לחץ, זרעים, מגנטים או מחטים. משמשת להרגעה כללית; אין לה ביסוס מחקרי כטיפול בפוסט-טראומה.
```

**יוגה נידרה**

```text
תרגול מונחה בשכיבה, שמוביל את תשומת הלב בהדרגה בין חלקי הגוף, הנשימה והתחושות אל מצב של הרפיה עמוקה, תוך שמירה על ערנות. מחקרים ראשוניים, גם בקרב יוצאי צבא, מצביעים על שיפור בשינה ועל הפחתת חרדה ומתח.
```

**יוגה רגישת-טראומה (TSY)**

```text
שיטת יוגה שפותחה עבור נפגעי טראומה ב-Trauma Center בארה"ב. ההנחיות מזמינות ולא מכתיבות, אין תיקוני תנוחה במגע, ובכל רגע אפשר לבחור לשנות או לעצור. הדגש הוא על הקשבה לתחושות הגוף ועל חוויה של בחירה ושליטה, ולא על ביצוע התנוחה. מחקרים ראשוניים מצביעים על הפחתת תסמינים כתוספת לטיפול.
```

## English (`en`)

### Step 3 - trauma-focused therapies

**PE - Prolonged Exposure**

```text
A structured, short-term treatment (usually 8-15 sessions) and one of the treatments most strongly recommended for PTSD in clinical guidelines. It combines imaginal exposure - revisiting the memory of the event in detail, guided, during the session - with in-vivo exposure - a gradual return to situations, places and people that have been avoided since. The aim is to process the traumatic memory so it stops triggering fear and distress, and to reduce avoidance.
```

**CBT - Cognitive Behavioral Therapy**

```text
A structured, short-term treatment whose trauma-focused form is among the recommended treatments for PTSD. You identify and re-examine thoughts and beliefs that took hold after the event - guilt, self-blame, a sense that the world is dangerous or that no one can be trusted - and replace them with a more accurate understanding. It usually also teaches skills for managing symptoms and includes gradually facing memories and situations that have been avoided. Cognitive Processing Therapy (CPT) is a well-known protocol within this family.
```

**EMDR**

```text
A structured treatment recommended for PTSD in clinical guidelines. During the session you briefly recall parts of the event while following bilateral stimulation - usually side-to-side eye movements tracking the therapist's hand, sometimes taps or sounds. The aim is for the memory to stop triggering intense distress and to feel like something that belongs to the past, while strengthening positive beliefs about yourself.
```

**Psychodynamic Therapy**

```text
A talking therapy that explores how past experiences, relationships and emotional patterns you may not be fully aware of shape your reactions and difficulties today - including how the trauma has affected your sense of self and your relationships. The relationship with the therapist is a central tool, and treatment is usually longer-term. Research evidence for reducing PTSD symptoms is more limited than for PE, CBT and EMDR.
```

### Step 4 - body-mind and complementary

**BBM Breathing Workshop (Breath-Body-Mind)**

```text
A program developed by psychiatrists Richard Brown and Patricia Gerbarg that combines slow, paced breathing (about five breaths a minute), gentle Qigong-inspired movement and meditation. Early studies point to reduced stress and PTSD symptoms and to improved emotional regulation and sense of calm.
```

**Therapeutic Massage**

```text
Hands-on treatment of the body's soft tissues that helps relax the muscles, reduce stress and bring a sense of calm. For trauma survivors it matters that the treatment is done with full consent - agreeing on every touch, with the option to stop at any moment. It is a complementary treatment and does not treat the trauma itself.
```

**Su Jok**

```text
A complementary-medicine method developed in South Korea by Prof. Park Jae-woo. It is based on the idea that the hands and feet mirror every area of the body ('Su' means hand, 'Jok' means foot), and stimulates points on them with pressure, seeds, magnets or needles. It is used for general relaxation; it has no research basis as a treatment for PTSD.
```

**Yoga Nidra**

```text
A guided practice done lying down that gradually moves attention through the body, the breath and sensations, into a state of deep relaxation while staying awake. Early studies, including among military veterans, point to better sleep and reduced anxiety and stress.
```

**Trauma-Sensitive Yoga (TSY)**

```text
A yoga method developed for trauma survivors at the Trauma Center in the US. Instructions are invitations rather than commands, there are no hands-on adjustments, and you can choose to change or stop at any moment. The focus is on noticing body sensations and experiencing choice and control, not on performing the pose. Early studies point to reduced symptoms as an add-on to treatment.
```

## العربية (`ar`)

### Step 3 - trauma-focused therapies

**PE - التعرّض المطوّل**

```text
علاج منظَّم وقصير الأمد (عادةً 8-15 جلسة)، ومن أكثر العلاجات الموصى بها لاضطراب ما بعد الصدمة في الإرشادات السريرية. يجمع بين التعرّض التخيّلي - استرجاع موجَّه ومفصَّل لذكرى الحدث خلال الجلسة - والتعرّض الواقعي - العودة التدريجية إلى المواقف والأماكن والأشخاص الذين يتم تجنّبهم منذ ذلك الحين. الهدف هو معالجة الذكرى الصادمة بحيث تتوقف عن إثارة الخوف والضيق، وتخفيف التجنّب.
```

**CBT - العلاج المعرفي السلوكي**

```text
علاج منظَّم وقصير الأمد، ونسخته المركّزة على الصدمة من العلاجات الموصى بها لاضطراب ما بعد الصدمة. يتم فيه التعرّف على الأفكار والمعتقدات التي ترسّخت بعد الحدث وإعادة فحصها - الذنب، ولوم الذات، والشعور بأن العالم خطير أو بأنه لا يمكن الوثوق بأحد - واستبدالها بفهم أدق. وعادةً ما يشمل أيضًا تعلّم مهارات للتعامل مع الأعراض، ومواجهة تدريجية للذكريات والمواقف التي يتم تجنّبها. علاج المعالجة المعرفية (CPT) هو بروتوكول معروف ضمن هذه العائلة.
```

**EMDR**

```text
علاج منظَّم موصى به لاضطراب ما بعد الصدمة في الإرشادات السريرية. خلال الجلسة تستحضر لفترات قصيرة أجزاءً من الحدث، بينما تتابع تحفيزًا ثنائي الجانب - غالبًا حركات عين من جانب إلى آخر تتبع يد المعالج، وأحيانًا نقرات أو أصوات. الهدف أن تتوقف الذكرى عن إثارة ضيق شديد وأن تُعاش كشيء ينتمي إلى الماضي، مع تعزيز معتقدات إيجابية عن نفسك.
```

**العلاج الديناميكي**

```text
علاج بالحديث يستكشف كيف تؤثر التجارب السابقة والعلاقات والأنماط العاطفية التي قد لا تكون مدركًا لها تمامًا في ردود فعلك وصعوباتك الحالية - بما في ذلك تأثير الصدمة على إحساسك بذاتك وعلى علاقاتك بالآخرين. العلاقة مع المعالج أداة مركزية، والعلاج عادةً أطول أمدًا. الأدلة البحثية على فعاليته في تخفيف أعراض اضطراب ما بعد الصدمة أكثر محدودية من أدلة PE وCBT وEMDR.
```

### Step 4 - body-mind and complementary

**ورشة تنفّس BBM (Breath-Body-Mind)**

```text
برنامج طوّره الطبيبان النفسيان ريتشارد براون وباتريشيا غيربارغ، يجمع بين التنفّس البطيء المنتظم (نحو خمسة أنفاس في الدقيقة)، وحركة لطيفة مستوحاة من التشي كونغ، والتأمّل. تشير دراسات أولية إلى انخفاض التوتر وأعراض اضطراب ما بعد الصدمة، وإلى تحسّن التنظيم الانفعالي والشعور بالهدوء.
```

**التدليك العلاجي**

```text
علاج باللمس اليدوي للأنسجة الرخوة في الجسم، يساعد على إرخاء العضلات وتخفيف التوتر والشعور بالهدوء. بالنسبة للناجين من الصدمات، من المهم أن يتم العلاج بموافقة كاملة - الاتفاق على كل لمسة وإمكانية التوقف في أي لحظة. وهو علاج تكميلي لا يعالج الصدمة نفسها.
```

**سو جوك**

```text
طريقة من الطب التكميلي طوّرها في كوريا الجنوبية البروفيسور بارك جاي-وو. تقوم على فكرة أن اليدين والقدمين تعكسان جميع مناطق الجسم («سو» تعني اليد، و«جوك» تعني القدم)، وتحفّز نقاطًا فيهما بالضغط أو البذور أو المغناطيس أو الإبر. تُستخدم للاسترخاء العام؛ ولا يوجد لها أساس بحثي كعلاج لاضطراب ما بعد الصدمة.
```

**يوغا نيدرا**

```text
ممارسة موجَّهة تُؤدّى في وضعية الاستلقاء، تنقل الانتباه تدريجيًا بين أجزاء الجسم والتنفّس والأحاسيس، وصولًا إلى حالة من الاسترخاء العميق مع البقاء في حالة يقظة. تشير دراسات أولية، منها دراسات على قدامى المحاربين، إلى تحسّن النوم وانخفاض القلق والتوتر.
```

**اليوغا المراعية للصدمة (TSY)**

```text
طريقة يوغا طُوّرت للناجين من الصدمات في Trauma Center في الولايات المتحدة. التوجيهات دعوة وليست أوامر، ولا توجد تعديلات للوضعيات باللمس، ويمكنك في أي لحظة أن تختار التغيير أو التوقف. التركيز على الانتباه لأحاسيس الجسد وعلى تجربة الاختيار والسيطرة، لا على أداء الوضعية. تشير دراسات أولية إلى انخفاض الأعراض كإضافة إلى العلاج.
```

## Русский (`ru`)

### Step 3 - trauma-focused therapies

**PE - пролонгированная экспозиция**

```text
Структурированная краткосрочная терапия (обычно 8-15 сессий) и один из методов, наиболее настоятельно рекомендуемых при посттравматическом расстройстве в клинических руководствах. Она сочетает экспозицию в воображении - подробное управляемое возвращение к воспоминанию о событии во время сессии - и экспозицию в реальности - постепенное возвращение к ситуациям, местам и людям, которых человек с тех пор избегает. Цель - переработать травматическое воспоминание так, чтобы оно перестало вызывать страх и дистресс, и уменьшить избегание.
```

**CBT - когнитивно-поведенческая терапия (КПТ)**

```text
Структурированная краткосрочная терапия, форма которой, сфокусированная на травме, входит в число рекомендуемых методов при посттравматическом расстройстве. В ней выявляют и заново рассматривают мысли и убеждения, закрепившиеся после события, - вину, самообвинение, ощущение, что мир опасен или что никому нельзя доверять, - и заменяют их более точным пониманием. Обычно она также учит навыкам справляться с симптомами и включает постепенную встречу с воспоминаниями и ситуациями, которых человек избегает. Терапия когнитивной переработки (CPT) - известный протокол из этого семейства.
```

**EMDR**

```text
Структурированная терапия, рекомендуемая при посттравматическом расстройстве в клинических руководствах. Во время сессии человек ненадолго вспоминает фрагменты события, одновременно следя за двусторонней стимуляцией - чаще всего это движения глаз из стороны в сторону вслед за рукой терапевта, иногда постукивания или звуки. Цель - чтобы воспоминание перестало вызывать сильный дистресс и воспринималось как часть прошлого, а позитивные убеждения о себе укрепились.
```

**Динамическая терапия**

```text
Разговорная терапия, которая исследует, как прошлый опыт, отношения и эмоциональные паттерны, не всегда осознаваемые, влияют на реакции и трудности в настоящем, - в том числе как травма повлияла на ощущение себя и на отношения с другими. Отношения с терапевтом - центральный инструмент, и терапия обычно более длительная. Научных данных о её эффективности в уменьшении симптомов посттравматического расстройства меньше, чем для PE, CBT и EMDR.
```

### Step 4 - body-mind and complementary

**Дыхательный семинар BBM (Breath-Body-Mind)**

```text
Программа, разработанная психиатрами Ричардом Брауном и Патрисией Гербарг, которая сочетает медленное ритмичное дыхание (около пяти вдохов в минуту), мягкие движения на основе цигун и медитацию. Предварительные исследования указывают на снижение напряжения и симптомов посттравматического расстройства, а также на улучшение эмоциональной саморегуляции и ощущения спокойствия.
```

**Лечебный массаж**

```text
Ручное воздействие на мягкие ткани тела, которое помогает расслабить мышцы, снизить напряжение и почувствовать спокойствие. Для переживших травму важно, чтобы работа велась с полного согласия - каждое прикосновение согласовывается, и остановиться можно в любой момент. Это дополнительный метод, который не лечит саму травму.
```

**Су-джок**

```text
Метод дополнительной медицины, разработанный в Южной Корее профессором Пак Чжэ Ву. Основан на представлении о том, что кисти и стопы отражают все области тела («су» - кисть, «джок» - стопа), и стимулирует на них точки с помощью давления, семян, магнитов или игл. Используется для общего расслабления; научных оснований как метод лечения посттравматического расстройства не имеет.
```

**Йога-нидра**

```text
Управляемая практика в положении лёжа, которая постепенно переводит внимание между частями тела, дыханием и ощущениями и приводит к состоянию глубокого расслабления при сохранении бодрствования. Предварительные исследования, в том числе среди ветеранов армии, указывают на улучшение сна и снижение тревоги и напряжения.
```

**Йога, чувствительная к травме (TSY)**

```text
Метод йоги, разработанный для переживших травму в Trauma Center в США. Инструкции звучат как приглашение, а не как указание, позы не корректируют прикосновением, и в любой момент можно выбрать изменить движение или остановиться. Акцент - на внимании к ощущениям в теле и на опыте выбора и контроля, а не на выполнении позы. Предварительные исследования указывают на уменьшение симптомов в дополнение к терапии.
```

## Français (`fr`)

### Step 3 - trauma-focused therapies

**PE - exposition prolongée**

```text
Une thérapie structurée et de courte durée (généralement 8 à 15 séances), parmi les traitements les plus fortement recommandés pour le trouble de stress post-traumatique dans les recommandations cliniques. Elle associe l'exposition en imagination - un retour guidé et détaillé sur le souvenir de l'événement pendant la séance - et l'exposition in vivo - un retour progressif aux situations, aux lieux et aux personnes que l'on évite depuis. Le but est de traiter le souvenir traumatique pour qu'il cesse de provoquer peur et détresse, et de réduire l'évitement.
```

**CBT - thérapie cognitivo-comportementale (TCC)**

```text
Une thérapie structurée et de courte durée, dont la forme centrée sur le traumatisme fait partie des traitements recommandés pour le trouble de stress post-traumatique. On y repère et réexamine les pensées et croyances installées après l'événement - culpabilité, auto-accusation, sentiment que le monde est dangereux ou qu'on ne peut faire confiance à personne - pour les remplacer par une compréhension plus juste. Elle apprend généralement aussi des outils pour gérer les symptômes et comprend une confrontation progressive aux souvenirs et situations évités. La thérapie des processus cognitifs (CPT) est un protocole reconnu de cette famille.
```

**EMDR**

```text
Une thérapie structurée recommandée pour le trouble de stress post-traumatique dans les recommandations cliniques. Pendant la séance, on se remémore brièvement des parties de l'événement tout en suivant une stimulation bilatérale - le plus souvent des mouvements des yeux de gauche à droite en suivant la main du thérapeute, parfois des tapotements ou des sons. Le but est que le souvenir cesse de provoquer une détresse intense et soit vécu comme appartenant au passé, tout en renforçant des croyances positives sur soi.
```

**Thérapie psychodynamique**

```text
Une thérapie par la parole qui explore la manière dont les expériences passées, les relations et des schémas émotionnels pas toujours conscients influencent les réactions et les difficultés actuelles - y compris l'effet du traumatisme sur l'image de soi et les relations aux autres. La relation avec le thérapeute est un outil central, et le suivi est généralement plus long. Les preuves scientifiques de son efficacité sur les symptômes du trouble de stress post-traumatique sont plus limitées que pour la PE, la TCC et l'EMDR.
```

### Step 4 - body-mind and complementary

**Atelier de respiration BBM (Breath-Body-Mind)**

```text
Un programme mis au point par les psychiatres Richard Brown et Patricia Gerbarg, qui associe une respiration lente et rythmée (environ cinq respirations par minute), des mouvements doux inspirés du qi gong et la méditation. Des études préliminaires indiquent une baisse du stress et des symptômes de stress post-traumatique, ainsi qu'une meilleure régulation émotionnelle et un plus grand sentiment de calme.
```

**Massage thérapeutique**

```text
Un traitement manuel des tissus mous du corps, qui aide à détendre les muscles, à réduire le stress et à retrouver un sentiment de calme. Pour les personnes ayant vécu un traumatisme, il est important que le soin se fasse avec un consentement total - chaque contact convenu à l'avance, et la possibilité d'arrêter à tout moment. C'est un traitement complémentaire, qui ne traite pas le traumatisme lui-même.
```

**Su Jok**

```text
Une méthode de médecine complémentaire développée en Corée du Sud par le professeur Park Jae-woo. Elle repose sur l'idée que les mains et les pieds reflètent toutes les zones du corps (« Su » signifie main, « Jok » signifie pied), et stimule des points sur ceux-ci par pression, graines, aimants ou aiguilles. Elle est utilisée pour la détente générale ; elle n'a pas de fondement scientifique en tant que traitement du trouble de stress post-traumatique.
```

**Yoga Nidra**

```text
Une pratique guidée, allongé, qui déplace progressivement l'attention entre les parties du corps, la respiration et les sensations, jusqu'à un état de relaxation profonde tout en restant éveillé. Des études préliminaires, notamment auprès d'anciens militaires, indiquent un meilleur sommeil et une baisse de l'anxiété et du stress.
```

**Yoga sensible au traumatisme (TSY)**

```text
Une méthode de yoga développée pour les personnes ayant vécu un traumatisme au Trauma Center, aux États-Unis. Les consignes sont des invitations et non des ordres, il n'y a pas d'ajustement des postures par le toucher, et l'on peut à tout moment choisir de modifier ou d'arrêter. L'accent est mis sur l'écoute des sensations du corps et sur l'expérience du choix et du contrôle, pas sur la réalisation de la posture. Des études préliminaires indiquent une réduction des symptômes en complément du traitement.
```
