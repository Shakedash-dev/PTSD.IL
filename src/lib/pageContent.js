// Page-level content (FAQ items, tool descriptions, etc.) keyed by language.
// UI strings stay in i18n.js. This file holds body content that's too long for translation keys.
//
// Fallback chain: selected lang → 'he'

const PTSD_INFO_FAQS = {
  he: [
    {
      q: 'מה זה טראומה ומה זה פוסט-טראומה?',
      a: `<p><strong>טראומה</strong> היא חוויה של אירוע שהגוף והנפש לא יכלו "לעכל" — אירוע שאיים על חיים, פגע בשלמות הגופנית, או גרם לתחושה של חוסר אונים קיצוני. הגוף מגיב בהפעלת מנגנון הישרדות — ה"לחם, בורח, או קפא".</p>
      <p>כאשר המנגנון הזה ממשיך לפעול גם זמן רב לאחר שהסכנה עברה, ומפריע לתפקוד היומיומי — זה נקרא <strong>הפרעת דחק פוסט-טראומטית (PTSD)</strong>.</p>`,
    },
    {
      q: 'האם ניתן להתאושש מאירוע טראומטי באופן טבעי?',
      a: `<p>כן — רוב האנשים מתאוששים מאירועים טראומטיים באופן טבעי, בזמן. המוח שלנו מצויד ביכולת עיבוד הטראומה ו"תיוקה" כזיכרון עבר.</p>
      <p>עם זאת, אצל חלק מהאנשים, עקב עוצמת האירוע, גורמים ביולוגיים, או היעדר תמיכה — תהליך זה נעצר. הזיכרון נשאר "חי" ומפעיל, כאילו האיום עדיין קיים.</p>
      <p>זה לא אומר שמשהו שבור בך — זה אומר שהמוח שלך עדיין מנסה להגן עליך.</p>`,
    },
    {
      q: 'מהם הסימפטומים של PTSD?',
      a: `<p>הסימפטומים מתחלקים ל-4 קבוצות עיקריות:</p>
      <ul>
        <li><strong>חדירה:</strong> פלאשבקים, סיוטים, מחשבות פולשניות על האירוע</li>
        <li><strong>הימנעות:</strong> הרחקה מאנשים, מקומות, מחשבות המזכירות את האירוע</li>
        <li><strong>שינויים קוגניטיביים ורגשיים:</strong> קשיי זיכרון, תחושת ריחוק, אובדן עניין, רגשות שליליים</li>
        <li><strong>דריכות-יתר:</strong> עצבנות, בהלה קלה, קשיי שינה, קשיי ריכוז</li>
      </ul>`,
    },
    {
      q: 'מה קורה לי בגוף כשאני חווה אירוע טראומטי?',
      a: `<p>בזמן האירוע, המוח מפעיל את מערכת ה"לחם או ברח" — שחרור אדרנלין וקורטיזול שמכינים את הגוף לסכנה מיידית. הלב פועם מהר, השרירים מתכווצים, החושים מתחדדים.</p>
      <p>כאשר הסכנה "תקועה" במוח — הגוף ממשיך לפעול במצב חירום גם כשאין סכנה. זה מתיש ומקשה על כל תפקוד.</p>
      <p>בנוסף, האמיגדלה (מרכז הפחד במוח) עלולה להיות "רגישה-יתר" — ולהגיב לגירויים תמימים כאילו הם סכנה.</p>`,
    },
    {
      q: 'ממה זה נובע ואיך זה נוצר?',
      a: `<p>PTSD יכול להיגרם ממגוון אירועים: מלחמה, פיגועים, תאונות, תקיפה מינית, אלימות, מחלה קשה, ועוד.</p>
      <p>לא כל מי שחווה טראומה יפתח PTSD. גורמי סיכון כוללים: עוצמת האירוע, היסטוריה של טראומה קודמת, חוסר תמיכה חברתית, גנטיקה, ועוד.</p>`,
    },
    {
      q: 'איך אזהה שאני מתמודד עם PTSD?',
      a: `<p>אם מנגנוני ההישרדות ממשיכים לפעול מחוץ להקשרם — כלומר, הגוף מגיב כאילו יש סכנה כשאין — זה יכול להיות סימן ל-PTSD.</p>
      <p>דוגמאות: בהלה קיצונית מרעש, הימנעות ממקומות מסוימים, קשיי שינה, פלאשבקים, תחושת ניתוק מהמציאות.</p>
      <p>השאלון שלנו יכול לתת אינדיקציה ראשונית — אבל אבחנה מדויקת מחייבת איש מקצוע.</p>`,
    },
    {
      q: 'האם כל אדם שחווה טראומה משמעותית יפתח PTSD?',
      a: `<p>לא. רוב האנשים שחווים טראומה לא יפתחו PTSD. זה לא עניין של "חוזק" או "חולשה" — אלא מכלול גורמים ביולוגיים, פסיכולוגיים וחברתיים.</p>
      <p>עם זאת, גם מי שלא מאובחן עם PTSD עלול לחוות תסמינים משמעותיים שמצדיקים סיוע מקצועי.</p>`,
    },
  ],

  ar: [
    {
      q: 'ما هي الصدمة وما هو اضطراب ما بعد الصدمة؟',
      a: `<p><strong>الصدمة</strong> هي تجربة حدث لم يستطع الجسد والنفس "استيعابه" — حدث هدّد الحياة، أو أضرّ بالسلامة الجسدية، أو أحدث شعوراً بالعجز التام. يستجيب الجسد بتفعيل آلية البقاء — "القتال، أو الهروب، أو التجمّد".</p>
      <p>حين تستمر هذه الآلية في العمل بعد مرور الخطر وتُعيق الأداء اليومي — يُسمّى ذلك <strong>اضطراب ما بعد الصدمة (PTSD)</strong>.</p>`,
    },
    {
      q: 'هل يمكن التعافي من حدث صادم بشكل طبيعي؟',
      a: `<p>نعم — يتعافى معظم الناس من الأحداث الصادمة بشكل طبيعي مع مرور الوقت. يمتلك دماغنا القدرة على معالجة الصدمة و"أرشفتها" كذكرى من الماضي.</p>
      <p>غير أن بعض الأشخاص، بسبب حدّة الحدث أو عوامل بيولوجية أو غياب الدعم — قد تتوقف هذه العملية. تظل الذاكرة "حية" ونشطة، كأن التهديد ما زال قائماً.</p>
      <p>هذا لا يعني أن ثمة خللاً فيك — بل يعني أن دماغك ما زال يحاول حمايتك.</p>`,
    },
    {
      q: 'ما هي أعراض اضطراب ما بعد الصدمة؟',
      a: `<p>تنقسم الأعراض إلى 4 مجموعات رئيسية:</p>
      <ul>
        <li><strong>الاقتحام:</strong> ذكريات مفاجئة (فلاشباك)، كوابيس، أفكار متطفلة عن الحدث</li>
        <li><strong>التجنّب:</strong> الابتعاد عن الأشخاص والأماكن والأفكار المرتبطة بالحدث</li>
        <li><strong>تغيّرات معرفية وعاطفية:</strong> صعوبة التذكر، شعور بالغربة، فقدان الاهتمام، مشاعر سلبية</li>
        <li><strong>فرط اليقظة:</strong> تهيّج، فزع مبالغ فيه، اضطراب النوم، صعوبة التركيز</li>
      </ul>`,
    },
    {
      q: 'ما الذي يحدث لجسدي عند مواجهة حدث صادم؟',
      a: `<p>خلال الحدث، يُفعّل الدماغ منظومة "القتال أو الهروب" — إفراز الأدرينالين والكورتيزول اللذين يُعدّان الجسد لمواجهة الخطر الوشيك. يتسارع القلب، وتنقبض العضلات، وتتحدد الحواس.</p>
      <p>حين يظل الخطر "عالقاً" في الدماغ — يستمر الجسد في حالة الطوارئ حتى في غياب الخطر الفعلي. هذا يُنهك ويُصعّب الأداء.</p>
      <p>علاوة على ذلك، قد تصبح اللوزة الدماغية (مركز الخوف) "شديدة الحساسية" — فتستجيب لمثيرات بريئة كما لو كانت تهديداً.</p>`,
    },
    {
      q: 'من أين ينشأ اضطراب ما بعد الصدمة وكيف يتطور؟',
      a: `<p>قد ينجم اضطراب ما بعد الصدمة عن أحداث متنوعة: الحرب، والهجمات، والحوادث، والاعتداء الجنسي، والعنف، والمرض الشديد، وغير ذلك.</p>
      <p>لا يُصاب كل من مرّ بصدمة باضطراب ما بعد الصدمة. تشمل عوامل الخطر: شدة الحدث، وتاريخ الصدمات السابقة، وغياب الدعم الاجتماعي، والعوامل الجينية، وغيرها.</p>`,
    },
    {
      q: 'كيف أعرف أنني أعاني من اضطراب ما بعد الصدمة؟',
      a: `<p>إذا استمرت آليات البقاء في العمل خارج سياقها — أي يتفاعل الجسد كأن ثمة خطراً وهو غير موجود — فقد يكون ذلك مؤشراً على اضطراب ما بعد الصدمة.</p>
      <p>أمثلة: فزع شديد من صوت مفاجئ، وتجنّب أماكن معينة، واضطراب النوم، وذكريات مفاجئة، والشعور بالانفصال عن الواقع.</p>
      <p>يمكن لاستبياننا أن يعطي مؤشراً أولياً — لكن التشخيص الدقيق يستلزم متخصصاً.</p>`,
    },
    {
      q: 'هل يُصاب كل من يمر بصدمة كبيرة باضطراب ما بعد الصدمة؟',
      a: `<p>لا. لا يُصاب معظم من يمرون بصدمة باضطراب ما بعد الصدمة. لا علاقة لهذا بـ"القوة" أو "الضعف" — بل هو تفاعل بين عوامل بيولوجية ونفسية واجتماعية.</p>
      <p>ومع ذلك، حتى من لا يُشخَّص باضطراب ما بعد الصدمة قد يعاني أعراضاً تستدعي المساعدة المتخصصة.</p>`,
    },
  ],

  en: [
    {
      q: 'What is trauma and what is PTSD?',
      a: `<p><strong>Trauma</strong> is the experience of an event the body and mind could not "digest" — an event that threatened life, harmed physical integrity, or caused extreme helplessness. The body responds by activating its survival mechanism — fight, flight, or freeze.</p>
      <p>When that mechanism keeps running long after the danger has passed and interferes with daily functioning, it is called <strong>Post-Traumatic Stress Disorder (PTSD)</strong>.</p>`,
    },
    {
      q: 'Can you recover from a traumatic event naturally?',
      a: `<p>Yes — most people recover from traumatic events naturally over time. Our brain is equipped to process trauma and "file" it as a past memory.</p>
      <p>For some people, due to the intensity of the event, biological factors, or lack of support, this process stalls. The memory stays "live" and active, as if the threat still exists.</p>
      <p>That doesn't mean something is broken in you — it means your brain is still trying to protect you.</p>`,
    },
    {
      q: 'What are the symptoms of PTSD?',
      a: `<p>Symptoms fall into 4 main groups:</p>
      <ul>
        <li><strong>Intrusion:</strong> flashbacks, nightmares, unwanted thoughts about the event</li>
        <li><strong>Avoidance:</strong> staying away from people, places, or thoughts that recall the event</li>
        <li><strong>Cognitive & emotional changes:</strong> memory difficulty, feeling detached, loss of interest, negative emotions</li>
        <li><strong>Hyperarousal:</strong> irritability, exaggerated startle, sleep problems, concentration difficulties</li>
      </ul>`,
    },
    {
      q: 'What happens in my body during a traumatic event?',
      a: `<p>During the event, the brain activates the fight-or-flight system — releasing adrenaline and cortisol to prepare the body for immediate danger. The heart races, muscles tense, senses sharpen.</p>
      <p>When the danger stays "stuck" in the brain, the body continues operating in emergency mode even when there is no actual threat. This is exhausting and impairs all functioning.</p>
      <p>Additionally, the amygdala (the brain's fear center) can become "over-sensitive" — reacting to harmless triggers as if they were a threat.</p>`,
    },
    {
      q: 'What causes PTSD and how does it develop?',
      a: `<p>PTSD can be caused by many events: war, terror attacks, accidents, sexual assault, violence, serious illness, and more.</p>
      <p>Not everyone who experiences trauma develops PTSD. Risk factors include: event intensity, history of prior trauma, lack of social support, genetics, and more.</p>`,
    },
    {
      q: 'How do I recognize that I am dealing with PTSD?',
      a: `<p>If survival mechanisms continue outside their context — meaning the body reacts as if there is danger when there isn't — that can be a sign of PTSD.</p>
      <p>Examples: extreme startle from noise, avoiding certain places, sleep problems, flashbacks, feeling detached from reality.</p>
      <p>Our questionnaire can give an initial indication — but an accurate diagnosis requires a professional.</p>`,
    },
    {
      q: 'Does everyone who experiences a major trauma develop PTSD?',
      a: `<p>No. Most people who experience trauma do not develop PTSD. It is not a matter of "strength" or "weakness" — it is a combination of biological, psychological, and social factors.</p>
      <p>That said, even those not diagnosed with PTSD may experience significant symptoms that warrant professional support.</p>`,
    },
  ],
};

const SECOND_CIRCLE_TOOLS = {
  he: [
    {
      q: 'מה לעשות בזמן התקף / פלאשבק?',
      a: `<p><strong>שיטת "היהלום":</strong></p>
      <ol>
        <li><strong>נוכחות:</strong> הזכירו בשקט — "אתה כאן, אתה בטוח, זה עובר"</li>
        <li><strong>מרחב:</strong> אל תחסמו את היציאה — תנו מרחב פיזי</li>
        <li><strong>שקט:</strong> הורידו גירויים — אורות, רעשים</li>
        <li><strong>נגיעה:</strong> שאלו לפני — "אוכל לגעת בידך?"</li>
      </ol>
      <p><strong>מה לא לעשות:</strong></p>
      <ul>
        <li>אל תתוכחו על "המציאות"</li>
        <li>אל תנסו להפריד בכוח ממה שהוא/היא חוזר/ת אליו</li>
        <li>אל תחשפו בפומבי</li>
      </ul>`,
    },
    {
      q: 'איך לתקשר ביומיום?',
      a: `<p><strong>עשה:</strong></p>
      <ul>
        <li>דבר/י מ"אני" — "אני מרגיש/ה מודאג/ת" ולא "אתה תמיד..."</li>
        <li>שאל/י לפני שאתה/את מציע/ה עזרה</li>
        <li>הכר/י ואשר/י את הרגשות — "נשמע שזה ממש קשה"</li>
        <li>שמור/י על הבטחות קטנות</li>
      </ul>
      <p><strong>אל תעשה:</strong></p>
      <ul>
        <li>אל תגיד/י "עזוב, כבר עבר" — עבורו/ה זה לא עבר</li>
        <li>אל תאיים/אי בנטישה בזמן משבר</li>
        <li>אל תנסה/י "לתקן" — לפעמים רק להיות שם זה מספיק</li>
      </ul>`,
    },
    {
      q: 'איך לזהות סימני מצוקה?',
      a: `<ul>
        <li>נסיגה חברתית מוגברת, פחות מגע יזום</li>
        <li>שינויים קיצוניים בשינה (יותר מדי / פחות מדי)</li>
        <li>פרצי זעם לא פרופורציונליים</li>
        <li>דיבור על חוסר תקווה או אמירות כמו "היה עדיף אם לא הייתי"</li>
        <li>שימוש מוגבר באלכוהול / סמים</li>
      </ul>
      <p><strong>אם אתם מזהים סימני מצוקה קשה — פנו מיד לאיש מקצוע או לערן 1201.</strong></p>`,
    },
    {
      q: 'מדריך למניעת שחיקה — שמרו גם על עצמכם',
      a: `<p>לא ניתן לשפוך ממיכל ריק. שמירה על עצמך היא לא אנוכיות — היא תנאי יסוד לתמיכה ממושכת.</p>
      <ul>
        <li><strong>קבעו גבולות ברורים</strong> — גם אהבה גדולה צריכה גבולות</li>
        <li><strong>שמרו על זמן לעצמכם</strong> — פעילות, חברים, תחביבים</li>
        <li><strong>פנו לתמיכה</strong> — מטפל/ת, קבוצת תמיכה לבני/בנות זוג</li>
        <li><strong>הכירו בסימני שחיקה</strong> — עצבנות יתר, ריחוק רגשי, תשישות</li>
        <li><strong>זה לא כישלון</strong> לבקש עזרה</li>
      </ul>`,
    },
  ],

  ar: [
    {
      q: 'ماذا تفعل خلال النوبة / الذكريات المفاجئة؟',
      a: `<p><strong>طريقة "الماس":</strong></p>
      <ol>
        <li><strong>الحضور:</strong> ذكّره بهدوء — "أنت هنا، أنت بأمان، سيمر هذا"</li>
        <li><strong>المساحة:</strong> لا تسدّ مخرج الغرفة — أعطه مساحة جسدية</li>
        <li><strong>الهدوء:</strong> قلّل المثيرات — الأضواء والأصوات</li>
        <li><strong>اللمس:</strong> اسأل قبل أن تلمس — "هل يمكنني الإمساك بيدك؟"</li>
      </ol>
      <p><strong>ما لا يجب فعله:</strong></p>
      <ul>
        <li>لا تجادله في "الواقع"</li>
        <li>لا تحاول بالقوة إبعاده عما يعود إليه</li>
        <li>لا تعرضه للعامة</li>
      </ul>`,
    },
    {
      q: 'كيف تتواصل في الحياة اليومية؟',
      a: `<p><strong>افعل:</strong></p>
      <ul>
        <li>تحدث من منظور "أنا" — "أنا أشعر بالقلق" وليس "أنت دائماً..."</li>
        <li>اسأل قبل أن تعرض المساعدة</li>
        <li>اعترف بمشاعره وأكّدها — "يبدو أن هذا صعب جداً"</li>
        <li>حافظ على الوعود الصغيرة</li>
      </ul>
      <p><strong>لا تفعل:</strong></p>
      <ul>
        <li>لا تقل "تجاهل الأمر، لقد مضى" — بالنسبة له لم يمضِ</li>
        <li>لا تهدد بالترك في أوقات الأزمات</li>
        <li>لا تحاول "إصلاحه" — أحياناً مجرد الوجود هناك يكفي</li>
      </ul>`,
    },
    {
      q: 'كيف تتعرف على علامات الضيق؟',
      a: `<ul>
        <li>انسحاب اجتماعي متزايد، تواصل أقل من تلقاء نفسه</li>
        <li>تغيّرات حادة في النوم (كثير جداً / قليل جداً)</li>
        <li>نوبات غضب غير متناسبة مع الموقف</li>
        <li>الحديث عن اليأس أو عبارات مثل "كان الأفضل لو لم أكن موجوداً"</li>
        <li>تزايد استهلاك الكحول أو المخدرات</li>
      </ul>
      <p><strong>إذا لاحظت علامات ضيق شديد — تواصل فوراً مع متخصص أو مع خط مساعدة إيران 1201.</strong></p>`,
    },
    {
      q: 'دليل لمنع الإرهاق — اعتنِ بنفسك أيضاً',
      a: `<p>لا يمكنك الصبّ من وعاء فارغ. الاعتناء بنفسك ليس أنانية — إنه شرط أساسي للدعم المستدام.</p>
      <ul>
        <li><strong>ضع حدوداً واضحة</strong> — حتى الحب الكبير يحتاج حدوداً</li>
        <li><strong>احتفظ بوقت لنفسك</strong> — نشاط بدني، أصدقاء، هوايات</li>
        <li><strong>اطلب الدعم</strong> — معالج، مجموعة دعم للشركاء</li>
        <li><strong>تعرّف على علامات الإرهاق</strong> — تهيّج مفرط، تباعد عاطفي، إنهاك</li>
        <li><strong>طلب المساعدة ليس فشلاً</strong></li>
      </ul>`,
    },
  ],

  en: [
    {
      q: 'What to do during a flashback / panic episode?',
      a: `<p><strong>The "Diamond" method:</strong></p>
      <ol>
        <li><strong>Presence:</strong> Remind them quietly — "You're here, you're safe, this will pass"</li>
        <li><strong>Space:</strong> Don't block the exit — give physical space</li>
        <li><strong>Quiet:</strong> Reduce stimulation — lights, noise</li>
        <li><strong>Touch:</strong> Ask first — "Can I hold your hand?"</li>
      </ol>
      <p><strong>What not to do:</strong></p>
      <ul>
        <li>Don't argue about "reality"</li>
        <li>Don't forcibly pull them away from what they're reliving</li>
        <li>Don't expose them publicly</li>
      </ul>`,
    },
    {
      q: 'How to communicate day to day?',
      a: `<p><strong>Do:</strong></p>
      <ul>
        <li>Speak from "I" — "I feel worried" not "you always..."</li>
        <li>Ask before offering help</li>
        <li>Acknowledge and validate feelings — "That sounds really hard"</li>
        <li>Keep small promises</li>
      </ul>
      <p><strong>Don't:</strong></p>
      <ul>
        <li>Don't say "let it go, it's over" — for them it's not over</li>
        <li>Don't threaten to leave during a crisis</li>
        <li>Don't try to "fix" them — sometimes just being there is enough</li>
      </ul>`,
    },
    {
      q: 'How to recognize signs of distress?',
      a: `<ul>
        <li>Increased social withdrawal, less self-initiated contact</li>
        <li>Extreme sleep changes (too much / too little)</li>
        <li>Disproportionate outbursts of rage</li>
        <li>Talk of hopelessness or phrases like "It would be better if I weren't here"</li>
        <li>Increased alcohol / drug use</li>
      </ul>
      <p><strong>If you see signs of severe distress — contact a professional immediately or call ERAN: 1201.</strong></p>`,
    },
    {
      q: 'Burnout prevention guide — take care of yourself too',
      a: `<p>You cannot pour from an empty vessel. Taking care of yourself is not selfish — it is a basic requirement for sustained support.</p>
      <ul>
        <li><strong>Set clear boundaries</strong> — even great love needs limits</li>
        <li><strong>Keep time for yourself</strong> — activity, friends, hobbies</li>
        <li><strong>Seek support</strong> — a therapist, a support group for partners</li>
        <li><strong>Recognize burnout signs</strong> — excessive irritability, emotional distancing, exhaustion</li>
        <li><strong>Asking for help is not failure</strong></li>
      </ul>`,
    },
  ],
};

const RIGHTS_FAQS = {
  he: {
    security_forces: [
      {
        q: 'מה מגיע לחייל שנפגע נפשית בשירות?',
        a: `<p>חיילים שנפגעו נפשית במהלך שירות צבאי זכאים לסיוע ממשרד הביטחון:</p>
        <ul>
          <li><strong>קצבת נכות</strong> — בהתאם לאחוזי הנכות שנקבעו</li>
          <li><strong>טיפול רפואי ופסיכולוגי</strong> — ללא תשלום</li>
          <li><strong>שיקום מקצועי</strong> — לימודים ועיסוק מותאם</li>
          <li><strong>סיוע בדיור</strong> — עבור נכים בדרגות גבוהות</li>
        </ul>`,
        steps: `<ol>
          <li>פנה/י לקצין/ת הבריאות ביחידה או לאחר השחרור — לאגף השיקום של משרד הביטחון</li>
          <li>הגש/י תביעה להכרה כנפגע/ת</li>
          <li>עבור/י ועדת רפואית לקביעת אחוזי נכות</li>
          <li>אם אינך מרוצה מהתוצאה — יש זכות ערעור</li>
        </ol>`,
        links: [{ label: 'אגף השיקום — משרד הביטחון', url: 'https://www.idf.il/categories/benefits/rehabilitation/' }],
      },
      {
        q: 'כמה זמן לוקח תהליך ההכרה?',
        a: '<p>התהליך יכול לקחת בין מספר חודשים לשנה ויותר. חשוב להגיש את התביעה מוקדם ככל האפשר ולוודא שכל המסמכים הרפואיים מצורפים.</p>',
        steps: '',
        links: [],
      },
      {
        q: 'מותר לי לעבוד בזמן תהליך ההכרה?',
        a: '<p>כן — בדרך כלל מותר לעבוד. ההכנסה מהעבודה עלולה להשפיע על גובה הקצבה אבל לא על זכות ההכרה עצמה. מומלץ להתייעץ עם עו"ד הכרה בנכות לפני.</p>',
        steps: '',
        links: [],
      },
    ],
    hostilities: [
      {
        q: 'מה מגיע לנפגע פעולת איבה?',
        a: `<p>נפגעי פעולות איבה זכאים לתגמולים ממשרד הביטחון (לא ביטוח לאומי):</p>
        <ul>
          <li>תגמול חודשי לפי מדרגת הנכות</li>
          <li>מימון טיפולים רפואיים ופסיכולוגיים</li>
          <li>שיקום מקצועי ולימודים</li>
          <li>ייעוץ ומענה ממרכזי החוסן</li>
        </ul>`,
        steps: `<ol>
          <li>הגש/י תביעה ל"גל — רשות לנפגעי פעולות איבה" במשרד הביטחון</li>
          <li>צרף/י תיעוד רפואי ואסמכתאות על קשר האירוע לנפגע</li>
          <li>לאחר הכרה — פנה/י לקביעת אחוזי נכות</li>
        </ol>`,
        links: [{ label: 'גל — רשות לנפגעי פעולות איבה', url: 'https://www.gov.il/he/departments/idf_rehabilitation' }],
      },
    ],
    sexual_harassment: [
      {
        q: 'אילו זכויות עומדות לי כנפגע/ת תקיפה מינית?',
        a: `<p>זכויות לנפגעי תקיפה מינית כוללות:</p>
        <ul>
          <li><strong>ביטוח לאומי</strong> — ניתן להגיש תביעה לנכות כללית אם הפגיעה גרמה לאי-כושר עבודה</li>
          <li><strong>ייצוג משפטי חינם</strong> — דרך הסיוע המשפטי של המדינה</li>
          <li><strong>ייעוץ חינמי</strong> — מרכזי סיוע לנפגעי תקיפה מינית בכל הארץ</li>
          <li><strong>פטור ממס</strong> — על פיצויים שהתקבלו</li>
        </ul>`,
        steps: `<ol>
          <li>פנה/י למרכז הסיוע הקרוב לקבלת ליווי ותמיכה</li>
          <li>אם הגשת תלונה למשטרה — בקש/י פרטיות ומלווה/ת</li>
          <li>לתביעת ביטוח לאומי — פנה/י לסניף הקרוב עם מסמכים רפואיים</li>
        </ol>`,
        links: [
          { label: 'מרכז הסיוע לנשים ולגברים נפגעי תקיפה מינית', url: 'https://www.1202.org.il/' },
          { label: 'ביטוח לאומי — נכות כללית', url: 'https://www.btl.gov.il/benefits/Disability/Pages/default.aspx' },
        ],
      },
    ],
    accidents_work: [
      {
        q: 'נפגעתי בתאונת עבודה — מה מגיע לי?',
        a: `<p>נפגעי תאונות עבודה זכאים ל:</p>
        <ul>
          <li><strong>דמי פגיעה</strong> — תשלום ממוסד לביטוח לאומי בזמן אי-כושר</li>
          <li><strong>טיפול רפואי</strong> — מימון דרך ביטוח לאומי</li>
          <li><strong>קצבת נכות</strong> — אם נשארה נכות קבועה</li>
        </ul>`,
        steps: `<ol>
          <li>קבל/י טיפול רפואי ובקש/י תיעוד של הפגיעה</li>
          <li>הגש/י תביעה לביטוח לאומי תוך 12 חודשים מהאירוע</li>
          <li>מלא/י טופס BL/250 (תביעה לפגיעה בעבודה)</li>
        </ol>`,
        links: [{ label: 'ביטוח לאומי — פגיעה בעבודה', url: 'https://www.btl.gov.il/benefits/Injured%20at%20work/Pages/default.aspx' }],
      },
    ],
    general: [
      {
        q: 'איך מגישים תביעה לביטוח לאומי לנכות?',
        a: `<p>תהליך הגשת תביעה לנכות כללית בביטוח לאומי:</p>
        <ol>
          <li>בדוק/י זכאות — אם הנכות הפסיכיאטרית מגיעה ל-40% לפחות</li>
          <li>אסוף/י מסמכים רפואיים: אבחנות, ממצאי טיפול, מכתבי רופאים</li>
          <li>הגש/י טופס תביעה בסניף ביטוח לאומי הקרוב</li>
          <li>הופע/י בפני ועדה רפואית</li>
        </ol>`,
        steps: '',
        links: [
          { label: 'ביטוח לאומי — נכות כללית', url: 'https://www.btl.gov.il/benefits/Disability/Pages/default.aspx' },
        ],
      },
    ],
  },

  ar: {
    security_forces: [
      {
        q: 'ما الحقوق التي يستحقها الجندي المُصاب نفسياً في الخدمة؟',
        a: `<p>يحق للجنود الذين أُصيبوا نفسياً خلال الخدمة العسكرية الحصول على مساعدة من وزارة الأمن:</p>
        <ul>
          <li><strong>راتب عجز</strong> — وفقاً لنسبة العجز المحددة</li>
          <li><strong>علاج طبي ونفسي</strong> — مجاناً</li>
          <li><strong>تأهيل مهني</strong> — دراسة وعمل ملائم</li>
          <li><strong>مساعدة في السكن</strong> — لذوي العجز الشديد</li>
        </ul>`,
        steps: `<ol>
          <li>تواصل مع ضابط الصحة في وحدتك أو بعد التسريح — مع قسم التأهيل في وزارة الأمن</li>
          <li>قدّم مطالبة للاعتراف بك كمصاب</li>
          <li>اخضع للجنة طبية لتحديد نسبة العجز</li>
          <li>إذا لم تكن راضياً عن النتيجة — لديك حق الاستئناف</li>
        </ol>`,
        links: [{ label: 'قسم التأهيل — وزارة الأمن', url: 'https://www.idf.il/categories/benefits/rehabilitation/' }],
      },
      {
        q: 'كم يستغرق إجراء الاعتراف؟',
        a: '<p>قد تستغرق العملية من عدة أشهر إلى سنة أو أكثر. من المهم تقديم المطالبة في أقرب وقت ممكن والتأكد من إرفاق جميع الوثائق الطبية.</p>',
        steps: '',
        links: [],
      },
      {
        q: 'هل يمكنني العمل خلال فترة إجراء الاعتراف؟',
        a: '<p>نعم — عادةً يُسمح بالعمل. قد يؤثر الدخل من العمل على مقدار الراتب لكن لا يؤثر على حق الاعتراف نفسه. يُنصح باستشارة محامٍ متخصص في حقوق الإعاقة مسبقاً.</p>',
        steps: '',
        links: [],
      },
    ],
    hostilities: [
      {
        q: 'ما الذي يستحقه ضحايا الأعمال العدائية؟',
        a: `<p>يحق لضحايا الأعمال العدائية الحصول على تعويضات من وزارة الأمن (وليس التأمين الوطني):</p>
        <ul>
          <li>مخصص شهري حسب درجة العجز</li>
          <li>تمويل العلاجات الطبية والنفسية</li>
          <li>تأهيل مهني ودراسة</li>
          <li>إرشاد ودعم من مراكز الصمود</li>
        </ul>`,
        steps: `<ol>
          <li>قدّم مطالبة لـ"غال — سلطة ضحايا الأعمال العدائية" في وزارة الأمن</li>
          <li>أرفق وثائق طبية وأدلة على صلة الحادثة بالضحية</li>
          <li>بعد الاعتراف — تقدّم لتحديد نسبة العجز</li>
        </ol>`,
        links: [{ label: 'غال — سلطة ضحايا الأعمال العدائية', url: 'https://www.gov.il/he/departments/idf_rehabilitation' }],
      },
    ],
    sexual_harassment: [
      {
        q: 'ما الحقوق المتاحة لضحايا الاعتداء الجنسي؟',
        a: `<p>تشمل حقوق ضحايا الاعتداء الجنسي:</p>
        <ul>
          <li><strong>التأمين الوطني</strong> — يمكن تقديم مطالبة لعجز عام إذا أدى الضرر إلى عدم القدرة على العمل</li>
          <li><strong>تمثيل قانوني مجاني</strong> — عبر المساعدة القانونية للدولة</li>
          <li><strong>استشارة مجانية</strong> — مراكز مساعدة ضحايا الاعتداء الجنسي في جميع أنحاء البلاد</li>
          <li><strong>إعفاء ضريبي</strong> — على التعويضات المستلمة</li>
        </ul>`,
        steps: `<ol>
          <li>تواصل مع أقرب مركز مساعدة للحصول على المرافقة والدعم</li>
          <li>إذا قدّمت شكوى للشرطة — اطلب الخصوصية ومرافقاً</li>
          <li>لمطالبة التأمين الوطني — تواصل مع أقرب فرع مع وثائق طبية</li>
        </ol>`,
        links: [
          { label: 'مركز مساعدة ضحايا الاعتداء الجنسي', url: 'https://www.1202.org.il/' },
        ],
      },
    ],
    accidents_work: [
      {
        q: 'أُصبت في حادث عمل — ما الذي يحق لي؟',
        a: `<p>يحق لضحايا حوادث العمل:</p>
        <ul>
          <li><strong>بدل إصابة</strong> — دفع من التأمين الوطني خلال فترة عدم القدرة على العمل</li>
          <li><strong>علاج طبي</strong> — تمويل عبر التأمين الوطني</li>
          <li><strong>راتب عجز</strong> — إذا نتج عجز دائم</li>
        </ul>`,
        steps: `<ol>
          <li>احصل على علاج طبي واطلب توثيق الإصابة</li>
          <li>قدّم مطالبة للتأمين الوطني خلال 12 شهراً من الحادثة</li>
          <li>املأ نموذج BL/250 (مطالبة بإصابة في العمل)</li>
        </ol>`,
        links: [{ label: 'التأمين الوطني — إصابات العمل', url: 'https://www.btl.gov.il/benefits/Injured%20at%20work/Pages/default.aspx' }],
      },
    ],
    general: [
      {
        q: 'كيف أتقدم بمطالبة لعجز التأمين الوطني؟',
        a: `<p>إجراءات تقديم مطالبة عجز عام في التأمين الوطني:</p>
        <ol>
          <li>تحقق من الأهلية — إذا كان العجز النفسي يصل إلى 40% على الأقل</li>
          <li>اجمع وثائق طبية: تشخيصات، ونتائج علاجية، وخطابات أطباء</li>
          <li>قدّم نموذج المطالبة في أقرب فرع للتأمين الوطني</li>
          <li>احضر أمام لجنة طبية</li>
        </ol>`,
        steps: '',
        links: [
          { label: 'التأمين الوطني — عجز عام', url: 'https://www.btl.gov.il/benefits/Disability/Pages/default.aspx' },
        ],
      },
    ],
  },

  en: {
    security_forces: [
      {
        q: 'What benefits does a soldier injured psychologically in service receive?',
        a: `<p>Soldiers psychologically injured during military service are entitled to support from the Ministry of Defense:</p>
        <ul>
          <li><strong>Disability allowance</strong> — based on the disability percentage determined</li>
          <li><strong>Medical and psychological treatment</strong> — free of charge</li>
          <li><strong>Vocational rehabilitation</strong> — adapted studies and employment</li>
          <li><strong>Housing assistance</strong> — for those with high disability grades</li>
        </ul>`,
        steps: `<ol>
          <li>Contact the unit health officer or, after discharge, the Rehabilitation Division of the Ministry of Defense</li>
          <li>Submit a recognition claim as an injured person</li>
          <li>Attend a medical committee to determine disability percentage</li>
          <li>If dissatisfied with the result — there is a right to appeal</li>
        </ol>`,
        links: [{ label: 'Rehabilitation Division — Ministry of Defense', url: 'https://www.idf.il/categories/benefits/rehabilitation/' }],
      },
      {
        q: 'How long does the recognition process take?',
        a: '<p>The process can take from several months to a year or more. It is important to submit the claim as early as possible and ensure all medical documents are attached.</p>',
        steps: '',
        links: [],
      },
      {
        q: 'Can I work during the recognition process?',
        a: '<p>Yes — working is generally permitted. Work income may affect the allowance amount but not the right to recognition itself. It is recommended to consult a disability rights attorney beforehand.</p>',
        steps: '',
        links: [],
      },
    ],
    hostilities: [
      {
        q: 'What does a victim of hostile acts receive?',
        a: `<p>Victims of hostile acts are entitled to benefits from the Ministry of Defense (not the National Insurance Institute):</p>
        <ul>
          <li>Monthly benefit according to disability grade</li>
          <li>Funding for medical and psychological treatments</li>
          <li>Vocational rehabilitation and studies</li>
          <li>Guidance from resilience centers</li>
        </ul>`,
        steps: `<ol>
          <li>Submit a claim to "Gal — Authority for Victims of Hostile Acts" at the Ministry of Defense</li>
          <li>Attach medical documentation and evidence linking the event to the victim</li>
          <li>After recognition — apply for disability percentage determination</li>
        </ol>`,
        links: [],
      },
    ],
    sexual_harassment: [
      {
        q: 'What rights do I have as a victim of sexual assault?',
        a: `<p>Rights for victims of sexual assault include:</p>
        <ul>
          <li><strong>National Insurance</strong> — a general disability claim can be filed if the injury caused incapacity to work</li>
          <li><strong>Free legal representation</strong> — through the state's legal aid system</li>
          <li><strong>Free counseling</strong> — sexual assault support centers nationwide</li>
          <li><strong>Tax exemption</strong> — on compensation received</li>
        </ul>`,
        steps: `<ol>
          <li>Contact the nearest support center for accompaniment and support</li>
          <li>If filing a police complaint — request privacy and an escort</li>
          <li>For National Insurance — visit the nearest branch with medical documents</li>
        </ol>`,
        links: [
          { label: 'Sexual Assault Support Center', url: 'https://www.1202.org.il/' },
        ],
      },
    ],
    accidents_work: [
      {
        q: 'I was injured at work — what am I entitled to?',
        a: `<p>Work accident victims are entitled to:</p>
        <ul>
          <li><strong>Injury benefit</strong> — payment from the National Insurance Institute during incapacity</li>
          <li><strong>Medical treatment</strong> — funded through National Insurance</li>
          <li><strong>Disability allowance</strong> — if permanent disability remains</li>
        </ul>`,
        steps: `<ol>
          <li>Get medical treatment and request documentation of the injury</li>
          <li>File a claim with National Insurance within 12 months of the event</li>
          <li>Fill out form BL/250 (work injury claim)</li>
        </ol>`,
        links: [],
      },
    ],
    general: [
      {
        q: 'How do I file a disability claim with National Insurance?',
        a: `<p>Process for filing a general disability claim with the National Insurance Institute:</p>
        <ol>
          <li>Check eligibility — psychiatric disability must reach at least 40%</li>
          <li>Gather medical documents: diagnoses, treatment findings, doctor letters</li>
          <li>Submit a claim form at the nearest National Insurance branch</li>
          <li>Appear before a medical committee</li>
        </ol>`,
        steps: '',
        links: [],
      },
    ],
  },
};

export function getPTSDInfoFaqs(lang) {
  return PTSD_INFO_FAQS[lang] || PTSD_INFO_FAQS.he;
}

export function getSecondCircleTools(lang) {
  return SECOND_CIRCLE_TOOLS[lang] || SECOND_CIRCLE_TOOLS.he;
}

export function getRightsFaqs(lang, category) {
  const langData = RIGHTS_FAQS[lang] || RIGHTS_FAQS.he;
  return langData[category] || RIGHTS_FAQS.he[category] || [];
}
