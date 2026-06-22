export const RIGHTS_FAQS = {
  he: {
    security_forces: [
      {
        q: 'מה מגיע לחייל שנפגע נפשית בשירות?',
        a: `<p>חיילים שנפגעו נפשית במהלך שירות צבאי זכאים לסיוע ממשרד הביטחון:</p>
        <ul>
          <li><strong>קצבת נכות</strong> - בהתאם לאחוזי הנכות שנקבעו</li>
          <li><strong>טיפול רפואי ופסיכולוגי</strong> - ללא תשלום</li>
          <li><strong>שיקום מקצועי</strong> - לימודים ועיסוק מותאם</li>
          <li><strong>סיוע בדיור</strong> - עבור נכים בדרגות גבוהות</li>
        </ul>`,
        steps: `<ol>
          <li>פנה/י לקצין/ת הבריאות ביחידה או לאחר השחרור - לאגף השיקום של משרד הביטחון</li>
          <li>הגש/י תביעה להכרה כנפגע/ת</li>
          <li>עבור/י ועדת רפואית לקביעת אחוזי נכות</li>
          <li>אם אינך מרוצה מהתוצאה - יש זכות ערעור</li>
        </ol>`,
        links: [{ label: 'אגף השיקום - משרד הביטחון', url: 'https://www.idf.il/categories/benefits/rehabilitation/' }],
      },
      {
        q: 'כמה זמן לוקח תהליך ההכרה?',
        a: '<p>התהליך יכול לקחת בין מספר חודשים לשנה ויותר. חשוב להגיש את התביעה מוקדם ככל האפשר ולוודא שכל המסמכים הרפואיים מצורפים.</p>',
        steps: '',
        links: [],
      },
      {
        q: 'מותר לי לעבוד בזמן תהליך ההכרה?',
        a: '<p>כן - בדרך כלל מותר לעבוד. ההכנסה מהעבודה עלולה להשפיע על גובה הקצבה אבל לא על זכות ההכרה עצמה. מומלץ להתייעץ עם עו"ד הכרה בנכות לפני.</p>',
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
          <li>הגש/י תביעה ל"גל - רשות לנפגעי פעולות איבה" במשרד הביטחון</li>
          <li>צרף/י תיעוד רפואי ואסמכתאות על קשר האירוע לנפגע</li>
          <li>לאחר הכרה - פנה/י לקביעת אחוזי נכות</li>
        </ol>`,
        links: [{ label: 'גל - רשות לנפגעי פעולות איבה', url: 'https://www.gov.il/he/departments/idf_rehabilitation' }],
      },
    ],
    sexual_harassment: [
      {
        q: 'אילו זכויות עומדות לי כנפגע/ת תקיפה מינית?',
        a: `<p>זכויות לנפגעי תקיפה מינית כוללות:</p>
        <ul>
          <li><strong>ביטוח לאומי</strong> - ניתן להגיש תביעה לנכות כללית אם הפגיעה גרמה לאי-כושר עבודה</li>
          <li><strong>ייצוג משפטי חינם</strong> - דרך הסיוע המשפטי של המדינה</li>
          <li><strong>ייעוץ חינמי</strong> - מרכזי סיוע לנפגעי תקיפה מינית בכל הארץ</li>
          <li><strong>פטור ממס</strong> - על פיצויים שהתקבלו</li>
        </ul>`,
        steps: `<ol>
          <li>פנה/י למרכז הסיוע הקרוב לקבלת ליווי ותמיכה</li>
          <li>אם הגשת תלונה למשטרה - בקש/י פרטיות ומלווה/ת</li>
          <li>לתביעת ביטוח לאומי - פנה/י לסניף הקרוב עם מסמכים רפואיים</li>
        </ol>`,
        links: [
          { label: 'מרכז הסיוע לנשים ולגברים נפגעי תקיפה מינית', url: 'https://www.1202.org.il/' },
          { label: 'ביטוח לאומי - נכות כללית', url: 'https://www.btl.gov.il/benefits/Disability/Pages/default.aspx' },
        ],
      },
    ],
    accidents_work: [
      {
        q: 'נפגעתי בתאונת עבודה - מה מגיע לי?',
        a: `<p>נפגעי תאונות עבודה זכאים ל:</p>
        <ul>
          <li><strong>דמי פגיעה</strong> - תשלום ממוסד לביטוח לאומי בזמן אי-כושר</li>
          <li><strong>טיפול רפואי</strong> - מימון דרך ביטוח לאומי</li>
          <li><strong>קצבת נכות</strong> - אם נשארה נכות קבועה</li>
        </ul>`,
        steps: `<ol>
          <li>קבל/י טיפול רפואי ובקש/י תיעוד של הפגיעה</li>
          <li>הגש/י תביעה לביטוח לאומי תוך 12 חודשים מהאירוע</li>
          <li>מלא/י טופס BL/250 (תביעה לפגיעה בעבודה)</li>
        </ol>`,
        links: [{ label: 'ביטוח לאומי - פגיעה בעבודה', url: 'https://www.btl.gov.il/benefits/Injured%20at%20work/Pages/default.aspx' }],
      },
    ],
    general: [
      {
        q: 'איך מגישים תביעה לביטוח לאומי לנכות?',
        a: `<p>תהליך הגשת תביעה לנכות כללית בביטוח לאומי:</p>
        <ol>
          <li>בדוק/י זכאות - אם הנכות הפסיכיאטרית מגיעה ל-40% לפחות</li>
          <li>אסוף/י מסמכים רפואיים: אבחנות, ממצאי טיפול, מכתבי רופאים</li>
          <li>הגש/י טופס תביעה בסניף ביטוח לאומי הקרוב</li>
          <li>הופע/י בפני ועדה רפואית</li>
        </ol>`,
        steps: '',
        links: [
          { label: 'ביטוח לאומי - נכות כללית', url: 'https://www.btl.gov.il/benefits/Disability/Pages/default.aspx' },
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
          <li><strong>راتب عجز</strong> - وفقاً لنسبة العجز المحددة</li>
          <li><strong>علاج طبي ونفسي</strong> - مجاناً</li>
          <li><strong>تأهيل مهني</strong> - دراسة وعمل ملائم</li>
          <li><strong>مساعدة في السكن</strong> - لذوي العجز الشديد</li>
        </ul>`,
        steps: `<ol>
          <li>تواصل مع ضابط الصحة في وحدتك أو بعد التسريح - مع قسم التأهيل في وزارة الأمن</li>
          <li>قدّم مطالبة للاعتراف بك كمصاب</li>
          <li>اخضع للجنة طبية لتحديد نسبة العجز</li>
          <li>إذا لم تكن راضياً عن النتيجة - لديك حق الاستئناف</li>
        </ol>`,
        links: [{ label: 'قسم التأهيل - وزارة الأمن', url: 'https://www.idf.il/categories/benefits/rehabilitation/' }],
      },
      {
        q: 'كم يستغرق إجراء الاعتراف؟',
        a: '<p>قد تستغرق العملية من عدة أشهر إلى سنة أو أكثر. من المهم تقديم المطالبة في أقرب وقت ممكن والتأكد من إرفاق جميع الوثائق الطبية.</p>',
        steps: '',
        links: [],
      },
      {
        q: 'هل يمكنني العمل خلال فترة إجراء الاعتراف؟',
        a: '<p>نعم - عادةً يُسمح بالعمل. قد يؤثر الدخل من العمل على مقدار الراتب لكن لا يؤثر على حق الاعتراف نفسه. يُنصح باستشارة محامٍ متخصص في حقوق الإعاقة مسبقاً.</p>',
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
          <li>قدّم مطالبة لـ"غال - سلطة ضحايا الأعمال العدائية" في وزارة الأمن</li>
          <li>أرفق وثائق طبية وأدلة على صلة الحادثة بالضحية</li>
          <li>بعد الاعتراف - تقدّم لتحديد نسبة العجز</li>
        </ol>`,
        links: [{ label: 'غال - سلطة ضحايا الأعمال العدائية', url: 'https://www.gov.il/he/departments/idf_rehabilitation' }],
      },
    ],
    sexual_harassment: [
      {
        q: 'ما الحقوق المتاحة لضحايا الاعتداء الجنسي؟',
        a: `<p>تشمل حقوق ضحايا الاعتداء الجنسي:</p>
        <ul>
          <li><strong>التأمين الوطني</strong> - يمكن تقديم مطالبة لعجز عام إذا أدى الضرر إلى عدم القدرة على العمل</li>
          <li><strong>تمثيل قانوني مجاني</strong> - عبر المساعدة القانونية للدولة</li>
          <li><strong>استشارة مجانية</strong> - مراكز مساعدة ضحايا الاعتداء الجنسي في جميع أنحاء البلاد</li>
          <li><strong>إعفاء ضريبي</strong> - على التعويضات المستلمة</li>
        </ul>`,
        steps: `<ol>
          <li>تواصل مع أقرب مركز مساعدة للحصول على المرافقة والدعم</li>
          <li>إذا قدّمت شكوى للشرطة - اطلب الخصوصية ومرافقاً</li>
          <li>لمطالبة التأمين الوطني - تواصل مع أقرب فرع مع وثائق طبية</li>
        </ol>`,
        links: [
          { label: 'مركز مساعدة ضحايا الاعتداء الجنسي', url: 'https://www.1202.org.il/' },
        ],
      },
    ],
    accidents_work: [
      {
        q: 'أُصبت في حادث عمل - ما الذي يحق لي؟',
        a: `<p>يحق لضحايا حوادث العمل:</p>
        <ul>
          <li><strong>بدل إصابة</strong> - دفع من التأمين الوطني خلال فترة عدم القدرة على العمل</li>
          <li><strong>علاج طبي</strong> - تمويل عبر التأمين الوطني</li>
          <li><strong>راتب عجز</strong> - إذا نتج عجز دائم</li>
        </ul>`,
        steps: `<ol>
          <li>احصل على علاج طبي واطلب توثيق الإصابة</li>
          <li>قدّم مطالبة للتأمين الوطني خلال 12 شهراً من الحادثة</li>
          <li>املأ نموذج BL/250 (مطالبة بإصابة في العمل)</li>
        </ol>`,
        links: [{ label: 'التأمين الوطني - إصابات العمل', url: 'https://www.btl.gov.il/benefits/Injured%20at%20work/Pages/default.aspx' }],
      },
    ],
    general: [
      {
        q: 'كيف أتقدم بمطالبة لعجز التأمين الوطني؟',
        a: `<p>إجراءات تقديم مطالبة عجز عام في التأمين الوطني:</p>
        <ol>
          <li>تحقق من الأهلية - إذا كان العجز النفسي يصل إلى 40% على الأقل</li>
          <li>اجمع وثائق طبية: تشخيصات، ونتائج علاجية، وخطابات أطباء</li>
          <li>قدّم نموذج المطالبة في أقرب فرع للتأمين الوطني</li>
          <li>احضر أمام لجنة طبية</li>
        </ol>`,
        steps: '',
        links: [
          { label: 'التأمين الوطني - عجز عام', url: 'https://www.btl.gov.il/benefits/Disability/Pages/default.aspx' },
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
          <li><strong>Disability allowance</strong> - based on the disability percentage determined</li>
          <li><strong>Medical and psychological treatment</strong> - free of charge</li>
          <li><strong>Vocational rehabilitation</strong> - adapted studies and employment</li>
          <li><strong>Housing assistance</strong> - for those with high disability grades</li>
        </ul>`,
        steps: `<ol>
          <li>Contact the unit health officer or, after discharge, the Rehabilitation Division of the Ministry of Defense</li>
          <li>Submit a recognition claim as an injured person</li>
          <li>Attend a medical committee to determine disability percentage</li>
          <li>If dissatisfied with the result - there is a right to appeal</li>
        </ol>`,
        links: [{ label: 'Rehabilitation Division - Ministry of Defense', url: 'https://www.idf.il/categories/benefits/rehabilitation/' }],
      },
      {
        q: 'How long does the recognition process take?',
        a: '<p>The process can take from several months to a year or more. It is important to submit the claim as early as possible and ensure all medical documents are attached.</p>',
        steps: '',
        links: [],
      },
      {
        q: 'Can I work during the recognition process?',
        a: '<p>Yes - working is generally permitted. Work income may affect the allowance amount but not the right to recognition itself. It is recommended to consult a disability rights attorney beforehand.</p>',
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
          <li>Submit a claim to "Gal - Authority for Victims of Hostile Acts" at the Ministry of Defense</li>
          <li>Attach medical documentation and evidence linking the event to the victim</li>
          <li>After recognition - apply for disability percentage determination</li>
        </ol>`,
        links: [],
      },
    ],
    sexual_harassment: [
      {
        q: 'What rights do I have as a victim of sexual assault?',
        a: `<p>Rights for victims of sexual assault include:</p>
        <ul>
          <li><strong>National Insurance</strong> - a general disability claim can be filed if the injury caused incapacity to work</li>
          <li><strong>Free legal representation</strong> - through the state's legal aid system</li>
          <li><strong>Free counseling</strong> - sexual assault support centers nationwide</li>
          <li><strong>Tax exemption</strong> - on compensation received</li>
        </ul>`,
        steps: `<ol>
          <li>Contact the nearest support center for accompaniment and support</li>
          <li>If filing a police complaint - request privacy and an escort</li>
          <li>For National Insurance - visit the nearest branch with medical documents</li>
        </ol>`,
        links: [
          { label: 'Sexual Assault Support Center', url: 'https://www.1202.org.il/' },
        ],
      },
    ],
    accidents_work: [
      {
        q: 'I was injured at work - what am I entitled to?',
        a: `<p>Work accident victims are entitled to:</p>
        <ul>
          <li><strong>Injury benefit</strong> - payment from the National Insurance Institute during incapacity</li>
          <li><strong>Medical treatment</strong> - funded through National Insurance</li>
          <li><strong>Disability allowance</strong> - if permanent disability remains</li>
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
          <li>Check eligibility - psychiatric disability must reach at least 40%</li>
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
