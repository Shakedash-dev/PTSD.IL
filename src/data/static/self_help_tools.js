import { BASE_PATH } from '@/base-path';

// icon values are string keys - resolved to Lucide components in SelfHelp.jsx via TOOL_ICON_MAP
export const STATIC_TOOLS = [
  {
    category: 'breathing',
    icon: 'Wind',
    title_he: 'תרגילי נשימה',
    color: 'bg-teal/10 text-teal',
    iconBg: 'bg-teal/15',
    content_he: `<p><strong>נשימה סרעפתית</strong> - נשמו עמוק דרך האף, 4 שניות. עצרו 2 שניות. נשפו דרך הפה, 6 שניות.</p>
    <p>חזרו על כך 5 פעמים. הנשימה האיטית "מאותתת" למוח שהסכנה עברה ומפעילה את מערכת ה"מנוחה ועיכול".</p>
    <p><a href="${BASE_PATH}/calming/breathing" class="text-primary font-medium">לתרגיל הנשימות האינטראקטיבי →</a></p>`,
  },
  {
    category: 'grounding',
    icon: 'Compass',
    title_he: 'תרגיל קרקוע 5-4-3-2-1',
    color: 'bg-clay/10 text-clay',
    iconBg: 'bg-clay/15',
    content_he: `<p>כשאתה/את מרגיש/ה ש"יצאת מהגוף" או שהזיכרון חוטף אותך - תרגיל הקרקוע עוזר לחזור להווה.</p>
    <p>מצא/י: 5 דברים שרואים, 4 שנוגעים, 3 שומעים, 2 מריחים, 1 טועמים.</p>
    <p><a href="${BASE_PATH}/calming/grounding" class="text-primary font-medium">לתרגיל הקרקוע האינטראקטיבי →</a></p>`,
  },
  {
    category: 'sleep',
    icon: 'Moon',
    title_he: 'ניהול שינה וסדר יום',
    color: 'bg-secondary/10 text-secondary',
    iconBg: 'bg-secondary/15',
    content_he: `<ul>
    <li><strong>חשיפה לאור שמש בבוקר</strong> - 10 דקות בחוץ אחרי הקימה מסנכרנת את השעון הביולוגי</li>
    <li><strong>ללא מסכים שעה לפני שינה</strong> - האור הכחול פוגע בייצור מלטונין</li>
    <li><strong>שעת שינה קבועה</strong> - גם בסוף שבוע</li>
    <li><strong>טמפרטורה קרירה בחדר</strong> - 18-20 מעלות אופטימלי לשינה</li>
    <li><strong>אם לא נרדמים תוך 20 דקות</strong> - קומו, עשו משהו שקט, וחזרו למיטה כשמרגישים ישנוניים</li>
    </ul>`,
  },
  {
    category: 'journaling',
    icon: 'PenLine',
    title_he: 'כתיבה פורקת',
    color: 'bg-teal/10 text-teal',
    iconBg: 'bg-teal/15',
    content_he: `<p>מחקרים מראים שכתיבה על חוויות מלחיצות מפחיתה את עוצמתן הרגשית ומסייעת לעיבוד הטראומה.</p>
    <p><strong>איך מתחילים:</strong> 15-20 דקות, 3-4 פעמים בשבוע. כתבו על האירוע וכיצד הוא השפיע עליכם - ללא צנזורה.</p>
    <p>אין חובה לשמור את מה שכתבתם.</p>`,
  },
  {
    category: 'apps',
    icon: 'Smartphone',
    title_he: 'אפליקציות מומלצות',
    color: 'bg-clay/10 text-clay',
    iconBg: 'bg-clay/15',
    content_he: `<ul>
    <li><strong>PTSD Coach</strong> - אפליקציה של ה-VA האמריקאי, חינמית, עם כלים לניהול תסמינים</li>
    <li><strong>Breathe2Relax</strong> - אפליקציה לתרגילי נשימה סרעפתית</li>
    <li><strong>Calm / Headspace</strong> - מדיטציה מודרכת ושינה, חלקית חינמיות</li>
    <li><strong>Woebot</strong> - צ׳אטבוט בריאות נפשית מבוסס CBT</li>
    </ul>`,
  },
  {
    category: 'muscle_relaxation',
    icon: 'Zap',
    title_he: 'כיווץ ושחרור שרירים',
    color: 'bg-secondary/10 text-secondary',
    iconBg: 'bg-secondary/15',
    content_he: `<p>הרפיה שרירית פרוגרסיבית מפחיתה מתח גופני שמצטבר בגלל עוררות-יתר.</p>
    <p>עברו על קבוצות שרירים שונות - כפות ידיים, כתפיים, בטן, ירכיים - לחצו 5-10 שניות ואז שחררו.</p>
    <p><a href="${BASE_PATH}/calming/muscle" class="text-primary font-medium">לתרגיל האינטראקטיבי →</a></p>`,
  },
];
