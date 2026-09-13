# Treatment method descriptions - corrected text

Replacement text for the `description` field of all 10 treatment methods, in all five
languages. Method **names are unchanged**. Only the description changes. `how_to_start`
and links are not touched.

Each description only explains the method: what it is and what happens in it. It makes no
claims about evidence, effectiveness or recommendations, and doesn't rank the methods.

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
טיפול מובנה וקצר-מועד, לרוב 8-15 מפגשים. משלב שני סוגי חשיפה: חשיפה בדמיון - חזרה מודרכת ומפורטת על זיכרון האירוע במהלך המפגש - וחשיפה במציאות - חזרה הדרגתית למצבים, מקומות ואנשים שנמנעים מהם מאז האירוע. מטרת השיטה היא עיבוד הזיכרון הטראומטי והפחתת ההימנעות.
```

**CBT - טיפול קוגניטיבי-התנהגותי**

```text
טיפול מובנה וקצר-מועד שעוסק בקשר בין מחשבות, רגשות והתנהגות. בגרסה הממוקדת-טראומה מזהים ובוחנים מחדש מחשבות ואמונות שנוצרו בעקבות האירוע - למשל אשמה, האשמה עצמית או תחושה שהעולם מסוכן - ולומדים כלים להתמודדות עם התסמינים. לרוב כולל גם התמודדות הדרגתית עם זיכרונות ומצבים שנמנעים מהם. טיפול בעיבוד קוגניטיבי (CPT) הוא אחד הפרוטוקולים בתוך משפחה זו.
```

**EMDR**

```text
טיפול מובנה שבו נזכרים לזמן קצר בחלקים מהאירוע הטראומטי, תוך מעקב אחר גירוי דו-צדדי - לרוב תנועות עיניים מצד לצד בעקבות יד המטפל/ת, ולעיתים הקשות או צלילים. התהליך חוזר על עצמו לאורך המפגשים, ומטרתו עיבוד מחדש של הזיכרון כך שייחווה כחלק מהעבר, וחיזוק אמונות חיוביות על עצמך.
```

**טיפול דינמי**

```text
טיפול בשיחה שבוחן כיצד חוויות עבר, מערכות יחסים ודפוסים רגשיים שלא תמיד מודעים להם משפיעים על התגובות והקשיים בהווה, כולל ההשפעה של הטראומה על תחושת העצמי ועל הקשרים עם אחרים. הקשר עם המטפל/ת משמש כלי מרכזי בטיפול, והוא לרוב ארוך-טווח יותר מטיפולים מובנים.
```

### Step 4 - body-mind and complementary

**סדנת נשימות BBM (Breath-Body-Mind)**

```text
תוכנית שפיתחו הפסיכיאטרים ריצ'רד בראון ופטרישיה גרברג. משלבת נשימה איטית וקצובה (כחמש נשימות בדקה), תנועה עדינה בהשראת צ'י גונג ומדיטציה.
```

**עיסוי טיפולי**

```text
טיפול במגע ידני ברקמות הרכות של הגוף - לחיצה, לישה ומתיחה של השרירים - שמטרתו הרפיית הגוף ושחרור מתח. במסגרת מותאמת-טראומה כל מגע מתואם מראש, ואפשר לעצור בכל רגע.
```

**סוג'וק**

```text
שיטה מתחום הרפואה המשלימה שפותחה בדרום קוריאה על ידי פרופ' פאק ג'ה-וו. מבוססת על התפיסה שכפות הידיים והרגליים משקפות את כל אזורי הגוף ('סו' - יד, 'ג'וק' - רגל), ובמהלך הטיפול מגרים בהן נקודות באמצעות לחץ, זרעים, מגנטים או מחטים.
```

**יוגה נידרה**

```text
תרגול מונחה בשכיבה, שבו מדריך/ה או הקלטה מובילים את תשומת הלב בהדרגה בין חלקי הגוף, הנשימה והתחושות, אל מצב של הרפיה עמוקה תוך שמירה על ערנות.
```

**יוגה רגישת-טראומה (TSY)**

```text
שיטת יוגה שפותחה עבור נפגעי טראומה ב-Trauma Center בארה"ב. ההנחיות מנוסחות כהזמנה ולא כהוראה, אין תיקוני תנוחה במגע, ובכל רגע אפשר לבחור לשנות תנוחה או לעצור. הדגש הוא על הקשבה לתחושות הגוף ועל חוויה של בחירה, ולא על ביצוע מדויק של התנוחה.
```

**מיינדפולנס**

```text
תרגול של הפניית תשומת הלב לרגע הנוכחי - לנשימה, לתחושות בגוף ולמחשבות - מתוך התבוננות וללא שיפוט. אפשר לתרגל באופן עצמאי, בקבוצה או כחלק מתוכנית מובנית.
```

## English (`en`)

### Step 3 - trauma-focused therapies

**PE - Prolonged Exposure**

```text
A structured, short-term treatment, usually 8-15 sessions. It combines two kinds of exposure: imaginal exposure - revisiting the memory of the event in detail, guided, during the session - and in-vivo exposure - gradually returning to situations, places and people that have been avoided since the event. The method aims to process the traumatic memory and reduce avoidance.
```

**CBT - Cognitive Behavioral Therapy**

```text
A structured, short-term treatment that works on the link between thoughts, feelings and behavior. In its trauma-focused form, you identify and re-examine thoughts and beliefs formed after the event - such as guilt, self-blame or a sense that the world is dangerous - and learn skills for coping with symptoms. It usually also includes gradually facing memories and situations that have been avoided. Cognitive Processing Therapy (CPT) is one of the protocols within this family.
```

**EMDR**

```text
A structured treatment in which you briefly recall parts of the traumatic event while following bilateral stimulation - usually side-to-side eye movements tracking the therapist's hand, sometimes taps or sounds. The process is repeated across sessions and aims to reprocess the memory so it is experienced as part of the past, and to strengthen positive beliefs about yourself.
```

**Psychodynamic Therapy**

```text
A talking therapy that explores how past experiences, relationships and emotional patterns you may not be fully aware of shape your reactions and difficulties today, including how the trauma has affected your sense of self and your relationships with others. The relationship with the therapist is a central tool, and treatment is usually longer-term than structured therapies.
```

### Step 4 - body-mind and complementary

**BBM Breathing Workshop (Breath-Body-Mind)**

```text
A program developed by psychiatrists Richard Brown and Patricia Gerbarg. It combines slow, paced breathing (about five breaths a minute), gentle Qigong-inspired movement and meditation.
```

**Therapeutic Massage**

```text
Hands-on treatment of the body's soft tissues - pressing, kneading and stretching the muscles - aimed at relaxing the body and releasing tension. In a trauma-informed setting, every touch is agreed in advance and you can stop at any moment.
```

**Su Jok**

```text
A complementary-medicine method developed in South Korea by Prof. Park Jae-woo. It is based on the idea that the hands and feet mirror every area of the body ('Su' means hand, 'Jok' means foot); during treatment, points on them are stimulated with pressure, seeds, magnets or needles.
```

**Yoga Nidra**

```text
A guided practice done lying down, in which an instructor or recording gradually moves your attention through the body, the breath and sensations, into a state of deep relaxation while staying awake.
```

**Trauma-Sensitive Yoga (TSY)**

```text
A yoga method developed for trauma survivors at the Trauma Center in the US. Instructions are phrased as invitations rather than commands, there are no hands-on adjustments, and you can choose to change a pose or stop at any moment. The focus is on noticing body sensations and experiencing choice, not on performing the pose precisely.
```

**Mindfulness**

```text
The practice of directing attention to the present moment - to the breath, bodily sensations and thoughts - observing them without judgment. It can be practiced alone, in a group or as part of a structured program.
```

## العربية (`ar`)

### Step 3 - trauma-focused therapies

**PE - التعرّض المطوّل**

```text
علاج منظَّم وقصير الأمد، عادةً 8-15 جلسة. يجمع بين نوعين من التعرّض: التعرّض التخيّلي - استرجاع موجَّه ومفصَّل لذكرى الحدث خلال الجلسة - والتعرّض الواقعي - العودة التدريجية إلى المواقف والأماكن والأشخاص الذين يتم تجنّبهم منذ الحدث. تهدف الطريقة إلى معالجة الذكرى الصادمة وتقليل التجنّب.
```

**CBT - العلاج المعرفي السلوكي**

```text
علاج منظَّم وقصير الأمد يتناول العلاقة بين الأفكار والمشاعر والسلوك. في نسخته المركّزة على الصدمة، يتم التعرّف على الأفكار والمعتقدات التي تكوّنت بعد الحدث وإعادة فحصها - مثل الذنب أو لوم الذات أو الشعور بأن العالم خطير - وتعلّم مهارات للتعامل مع الأعراض. وعادةً ما يشمل أيضًا مواجهة تدريجية للذكريات والمواقف التي يتم تجنّبها. علاج المعالجة المعرفية (CPT) هو أحد البروتوكولات ضمن هذه العائلة.
```

**EMDR**

```text
علاج منظَّم تستحضر فيه لفترات قصيرة أجزاءً من الحدث الصادم، بينما تتابع تحفيزًا ثنائي الجانب - غالبًا حركات عين من جانب إلى آخر تتبع يد المعالج، وأحيانًا نقرات أو أصوات. تتكرر العملية على مدى الجلسات، وتهدف إلى إعادة معالجة الذكرى بحيث تُعاش كجزء من الماضي، وإلى تعزيز معتقدات إيجابية عن نفسك.
```

**العلاج الديناميكي**

```text
علاج بالحديث يستكشف كيف تؤثر التجارب السابقة والعلاقات والأنماط العاطفية التي قد لا تكون مدركًا لها تمامًا في ردود فعلك وصعوباتك الحالية، بما في ذلك تأثير الصدمة على إحساسك بذاتك وعلى علاقاتك بالآخرين. العلاقة مع المعالج أداة مركزية في العلاج، وهو عادةً أطول أمدًا من العلاجات المنظَّمة.
```

### Step 4 - body-mind and complementary

**ورشة تنفّس BBM (Breath-Body-Mind)**

```text
برنامج طوّره الطبيبان النفسيان ريتشارد براون وباتريشيا غيربارغ، يجمع بين التنفّس البطيء المنتظم (نحو خمسة أنفاس في الدقيقة)، وحركة لطيفة مستوحاة من التشي كونغ، والتأمّل.
```

**التدليك العلاجي**

```text
علاج باللمس اليدوي للأنسجة الرخوة في الجسم - الضغط على العضلات وتدليكها وتمديدها - بهدف إرخاء الجسد وتحرير التوتر. في الإطار المراعي للصدمة، يُتّفق مسبقًا على كل لمسة ويمكن التوقف في أي لحظة.
```

**سو جوك**

```text
طريقة من الطب التكميلي طوّرها في كوريا الجنوبية البروفيسور بارك جاي-وو. تقوم على فكرة أن اليدين والقدمين تعكسان جميع مناطق الجسم («سو» تعني اليد، و«جوك» تعني القدم)، ويتم خلال العلاج تحفيز نقاط فيهما بالضغط أو البذور أو المغناطيس أو الإبر.
```

**يوغا نيدرا**

```text
ممارسة موجَّهة تُؤدّى في وضعية الاستلقاء، ينقل فيها المدرّب أو التسجيل انتباهك تدريجيًا بين أجزاء الجسم والتنفّس والأحاسيس، وصولًا إلى حالة من الاسترخاء العميق مع البقاء في حالة يقظة.
```

**اليوغا المراعية للصدمة (TSY)**

```text
طريقة يوغا طُوّرت للناجين من الصدمات في Trauma Center في الولايات المتحدة. تُصاغ التوجيهات كدعوة وليس كأوامر، ولا توجد تعديلات للوضعيات باللمس، ويمكنك في أي لحظة أن تختار تغيير الوضعية أو التوقف. التركيز على الانتباه لأحاسيس الجسد وعلى تجربة الاختيار، لا على الأداء الدقيق للوضعية.
```

**اليقظة الذهنية (mindfulness)**

```text
ممارسة توجيه الانتباه إلى اللحظة الحاضرة - إلى التنفّس وأحاسيس الجسد والأفكار - ومراقبتها دون حكم. يمكن ممارستها بشكل فردي أو في مجموعة أو ضمن برنامج منظَّم.
```

## Русский (`ru`)

### Step 3 - trauma-focused therapies

**PE - пролонгированная экспозиция**

```text
Структурированная краткосрочная терапия, обычно 8-15 сессий. Она сочетает два вида экспозиции: экспозицию в воображении - подробное управляемое возвращение к воспоминанию о событии во время сессии - и экспозицию в реальности - постепенное возвращение к ситуациям, местам и людям, которых человек избегает после события. Метод направлен на переработку травматического воспоминания и уменьшение избегания.
```

**CBT - когнитивно-поведенческая терапия (КПТ)**

```text
Структурированная краткосрочная терапия, которая работает со связью между мыслями, чувствами и поведением. В форме, сфокусированной на травме, выявляют и заново рассматривают мысли и убеждения, сложившиеся после события, - например, вину, самообвинение или ощущение, что мир опасен, - и осваивают навыки совладания с симптомами. Обычно она также включает постепенную встречу с воспоминаниями и ситуациями, которых человек избегает. Терапия когнитивной переработки (CPT) - один из протоколов этого семейства.
```

**EMDR**

```text
Структурированная терапия, во время которой человек ненадолго вспоминает фрагменты травматического события, одновременно следя за двусторонней стимуляцией - чаще всего это движения глаз из стороны в сторону вслед за рукой терапевта, иногда постукивания или звуки. Процесс повторяется на протяжении сессий и направлен на переработку воспоминания, чтобы оно воспринималось как часть прошлого, а также на укрепление позитивных убеждений о себе.
```

**Динамическая терапия**

```text
Разговорная терапия, которая исследует, как прошлый опыт, отношения и эмоциональные паттерны, не всегда осознаваемые, влияют на реакции и трудности в настоящем, в том числе как травма повлияла на ощущение себя и на отношения с другими. Отношения с терапевтом - центральный инструмент терапии, и обычно она длится дольше, чем структурированные методы.
```

### Step 4 - body-mind and complementary

**Дыхательный семинар BBM (Breath-Body-Mind)**

```text
Программа, разработанная психиатрами Ричардом Брауном и Патрисией Гербарг. Она сочетает медленное ритмичное дыхание (около пяти вдохов в минуту), мягкие движения на основе цигун и медитацию.
```

**Лечебный массаж**

```text
Ручное воздействие на мягкие ткани тела - надавливание, разминание и растяжение мышц - с целью расслабить тело и снять напряжение. В подходе, учитывающем травму, каждое прикосновение согласовывается заранее, и остановиться можно в любой момент.
```

**Су-джок**

```text
Метод дополнительной медицины, разработанный в Южной Корее профессором Пак Чжэ Ву. Основан на представлении о том, что кисти и стопы отражают все области тела («су» - кисть, «джок» - стопа); во время процедуры точки на них стимулируют давлением, семенами, магнитами или иглами.
```

**Йога-нидра**

```text
Управляемая практика в положении лёжа, во время которой инструктор или аудиозапись постепенно переводит внимание между частями тела, дыханием и ощущениями, приводя к состоянию глубокого расслабления при сохранении бодрствования.
```

**Йога, чувствительная к травме (TSY)**

```text
Метод йоги, разработанный для переживших травму в Trauma Center в США. Инструкции формулируются как приглашение, а не как указание, позы не корректируют прикосновением, и в любой момент можно выбрать изменить позу или остановиться. Акцент - на внимании к ощущениям в теле и на опыте выбора, а не на точном выполнении позы.
```

**Майндфулнес (осознанность)**

```text
Практика направления внимания на настоящий момент - на дыхание, телесные ощущения и мысли - с наблюдением без оценки. Её можно выполнять самостоятельно, в группе или в рамках структурированной программы.
```

## Français (`fr`)

### Step 3 - trauma-focused therapies

**PE - exposition prolongée**

```text
Une thérapie structurée et de courte durée, généralement 8 à 15 séances. Elle associe deux formes d'exposition : l'exposition en imagination - un retour guidé et détaillé sur le souvenir de l'événement pendant la séance - et l'exposition in vivo - un retour progressif aux situations, aux lieux et aux personnes que l'on évite depuis l'événement. La méthode vise à traiter le souvenir traumatique et à réduire l'évitement.
```

**CBT - thérapie cognitivo-comportementale (TCC)**

```text
Une thérapie structurée et de courte durée qui travaille sur le lien entre pensées, émotions et comportements. Dans sa forme centrée sur le traumatisme, on repère et réexamine les pensées et croyances apparues après l'événement - par exemple la culpabilité, l'auto-accusation ou le sentiment que le monde est dangereux - et on apprend des outils pour faire face aux symptômes. Elle comprend généralement aussi une confrontation progressive aux souvenirs et situations évités. La thérapie des processus cognitifs (CPT) est l'un des protocoles de cette famille.
```

**EMDR**

```text
Une thérapie structurée au cours de laquelle on se remémore brièvement des parties de l'événement traumatique tout en suivant une stimulation bilatérale - le plus souvent des mouvements des yeux de gauche à droite en suivant la main du thérapeute, parfois des tapotements ou des sons. Le processus se répète au fil des séances et vise à retraiter le souvenir pour qu'il soit vécu comme appartenant au passé, et à renforcer des croyances positives sur soi.
```

**Thérapie psychodynamique**

```text
Une thérapie par la parole qui explore la manière dont les expériences passées, les relations et des schémas émotionnels pas toujours conscients influencent les réactions et les difficultés actuelles, y compris l'effet du traumatisme sur l'image de soi et les relations aux autres. La relation avec le thérapeute est un outil central, et le suivi est généralement plus long que dans les thérapies structurées.
```

### Step 4 - body-mind and complementary

**Atelier de respiration BBM (Breath-Body-Mind)**

```text
Un programme mis au point par les psychiatres Richard Brown et Patricia Gerbarg. Il associe une respiration lente et rythmée (environ cinq respirations par minute), des mouvements doux inspirés du qi gong et la méditation.
```

**Massage thérapeutique**

```text
Un traitement manuel des tissus mous du corps - pression, pétrissage et étirement des muscles - qui vise à détendre le corps et à relâcher les tensions. Dans une approche adaptée au traumatisme, chaque contact est convenu à l'avance et l'on peut arrêter à tout moment.
```

**Su Jok**

```text
Une méthode de médecine complémentaire développée en Corée du Sud par le professeur Park Jae-woo. Elle repose sur l'idée que les mains et les pieds reflètent toutes les zones du corps (« Su » signifie main, « Jok » signifie pied) ; pendant la séance, des points y sont stimulés par pression, graines, aimants ou aiguilles.
```

**Yoga Nidra**

```text
Une pratique guidée, allongé, au cours de laquelle un instructeur ou un enregistrement déplace progressivement l'attention entre les parties du corps, la respiration et les sensations, jusqu'à un état de relaxation profonde tout en restant éveillé.
```

**Yoga sensible au traumatisme (TSY)**

```text
Une méthode de yoga développée pour les personnes ayant vécu un traumatisme au Trauma Center, aux États-Unis. Les consignes sont formulées comme des invitations et non comme des ordres, il n'y a pas d'ajustement des postures par le toucher, et l'on peut à tout moment choisir de modifier une posture ou d'arrêter. L'accent est mis sur l'écoute des sensations du corps et sur l'expérience du choix, pas sur la réalisation précise de la posture.
```

**Pleine conscience (mindfulness)**

```text
La pratique qui consiste à porter son attention sur l'instant présent - la respiration, les sensations du corps et les pensées - en les observant sans jugement. Elle peut se pratiquer seul, en groupe ou dans le cadre d'un programme structuré.
```
