// icon values are string keys - resolved to Lucide components in SelfHelp.jsx via TOOL_ICON_MAP
export const STATIC_TOOLS = [
  {
    category: 'sleep',
    icon: 'Moon',
    title_he: 'ניהול שינה וסדר יום',
    color: 'bg-secondary/10 text-secondary',
    iconBg: 'bg-secondary/15',
    content_he: `<ul><li><strong>חשיפה לאור שמש בבוקר</strong> - 10 דקות בחוץ אחרי הקימה מסנכרנת את השעון הביולוגי</li><li><strong>ללא מסכים שעה לפני שינה</strong> - האור הכחול פוגע בייצור מלטונין</li><li><strong>שעת שינה קבועה</strong> - גם בסוף שבוע</li><li><strong>טמפרטורה קרירה בחדר</strong> - 18-20 מעלות אופטימלי לשינה</li><li><strong>אם לא נרדמים תוך 20 דקות</strong> - קומו, עשו משהו שקט, וחזרו למיטה כשמרגישים ישנוניים</li></ul>`,
  },
  {
    category: 'journaling',
    icon: 'PenLine',
    title_he: 'כתיבה פורקת',
    color: 'bg-teal/10 text-teal',
    iconBg: 'bg-teal/15',
    content_he: `<p>מחקרים מראים שכתיבה על חוויות מלחיצות מפחיתה את עוצמתן הרגשית ומסייעת לעיבוד הטראומה.</p><p><strong>איך מתחילים:</strong> 15-20 דקות, 3-4 פעמים בשבוע. כתבו על האירוע וכיצד הוא השפיע עליכם - ללא צנזורה.</p><p>אין חובה לשמור את מה שכתבתם.</p><p><strong>טיימינג חשוב:</strong> מומלץ להמתין לפחות חודש-חודשיים מהאירוע הטראומטי לפני תחילת התרגול - כתיבה מיד בסמוך לאירוע עלולה להגביר את המצוקה במקום להפחית אותה.</p>`,
  },
  {
    category: 'apps',
    icon: 'Smartphone',
    title_he: 'אפליקציות מומלצות',
    color: 'bg-clay/10 text-clay',
    iconBg: 'bg-clay/15',
    content_he: '',
    apps: [
      {
        title_he: 'Breathe2Relax',
        description_he: 'אפליקציה לתרגילי נשימה סרעפתית, פותחה על ידי גורמי בריאות של משרד ההגנה האמריקאי. חינמית.',
        ios_url: 'https://apps.apple.com/us/app/breathe2relax/id425720246',
        android_url: 'https://play.google.com/store/apps/details?id=mil.dha.breathe2relax',
      },
      {
        title_he: 'Calm',
        description_he: 'מדיטציה מודרכת ושינה. חלקית חינמית - תקופת ניסיון ותכנים בסיסיים חינם, שאר התוכן בתשלום מנוי.',
        ios_url: 'https://apps.apple.com/us/app/calm/id571800810',
        android_url: 'https://play.google.com/store/apps/details?id=com.calm.android',
      },
      {
        title_he: 'Headspace',
        description_he: 'מדיטציה מודרכת ושינה. חלקית חינמית - תקופת ניסיון ותכנים בסיסיים חינם, שאר התוכן בתשלום מנוי.',
        ios_url: 'https://apps.apple.com/us/app/headspace-meditation-sleep/id493145008',
        android_url: 'https://play.google.com/store/apps/details?id=com.getsomeheadspace.android',
      },
      {
        title_he: 'Wysa',
        description_he: 'צ׳אטבוט בינה מלאכותית לתמיכה נפשית מבוסס CBT ו-DBT. השיחה הבסיסית עם הצ׳אטבוט חינמית, תכנים מורחבים וליווי אנושי בתשלום.',
        ios_url: 'https://apps.apple.com/us/app/wysa-mental-wellbeing-ai/id1166585565',
        android_url: 'https://play.google.com/store/apps/details?id=bot.touchkin',
      },
    ],
  },
  {
    category: 'complementary',
    icon: 'Wind',
    title_he: 'נשימה-גוף-נפש (BBM)',
    color: 'bg-sage/10 text-sage',
    iconBg: 'bg-sage/15',
    content_he: `<p><strong>Breath-Body-Mind (BBM)</strong> היא שיטה המשלבת תרגילי נשימה, תנועה עדינה ומדיטציה, שמטרתה לאזן את מערכת העצבים ולהפחית מתח, חרדה ותסמיני פוסט-טראומה.</p><p><strong>תרגיל בסיסי לניסיון עצמאי - נשימה קוהרנטית:</strong> זהו מרכיב הנשימה המרכזי בבסיס השיטה. שבו בנוחות, גב זקוף:</p><ol><li>שאפו לאט דרך האף במשך כ-6 שניות</li><li>נשפו לאט (דרך האף או הפה) במשך כ-6 שניות נוספות - בלי לעצור בין השאיפה לנשיפה</li><li>המשיכו כך כ-5-10 דקות, בקצב אחיד של כ-5 נשימות בדקה</li></ol><p>זהו רק מרכיב אחד מהשיטה המלאה, שכוללת גם תרגילי תנועה ומדיטציה הנלמדים בסדנאות עם מדריך/ה מוסמך/ת.</p><p><a href="https://www.breathbodymindfoundation.org/israel/he/welcome" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-foreground rounded-full text-sm font-medium hover:bg-primary/20 transition-colors duration-300">BBM Foundation ישראל - מדריכים מוסמכים</a></p>`,
  },
  {
    category: 'complementary',
    icon: 'Moon',
    title_he: 'יוגה נידרה',
    color: 'bg-sage/10 text-sage',
    iconBg: 'bg-sage/15',
    content_he: `<p><strong>יוגה נידרה</strong> היא תרגול מונחה של הרפיה עמוקה, המדמה מצב שבין ערות לשינה. מטרתו לסייע בשיפור השינה, הפחתת חרדה וחיזוק תחושת היציבות הפנימית. ניתן לתרגל אותה עצמאית, בעזרת הקלטה מוקלטת או לפי ההנחיות הבאות.</p><p><strong>איך מתרגלים:</strong></p><ol><li>שכבו על הגב במקום שקט, כרית מתחת לראש ואולי שמיכה קלה - הגוף נוטה להתקרר במהלך התרגול</li><li>עצמו עיניים ותנו לנשימה להיות טבעית. אפשר לקבוע לעצמכם משפט קצר וחיובי לחזור אליו בסוף התרגול (למשל: "אני בטוח/ה ורגוע/ה")</li><li>"סרקו" את הגוף בתשומת לב, חלק אחרי חלק - מכפות הרגליים ועד קצות הראש - בלי לזוז, רק בתשומת לב</li><li>שימו לב לנשימה עצמה כמה דקות, בלי לשנות אותה</li><li>לקראת הסיום, חזרו למשפט שקבעתם בהתחלה, ואז החזירו את תשומת הלב לאט לגוף ולחדר, ופקחו עיניים בעדינות</li></ol><p>תרגול מלא אורך בדרך כלל 20-30 דקות, אך אפשר גם קצר יותר.</p>`,
  },
];
