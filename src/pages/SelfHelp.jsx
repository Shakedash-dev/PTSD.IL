import React, { useState } from 'react';
import { BASE_PATH } from '@/base-path';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import PageHeader from '@/components/PageHeader';
import { Wind, Moon, PenLine, Smartphone, Zap, ChevronDown, ArrowLeft, ArrowRight, Compass, Wrench } from 'lucide-react';

export const STATIC_TOOLS = [
  {
    category: 'breathing',
    icon: Wind,
    title_he: 'תרגילי נשימה',
    color: 'bg-teal/10 text-teal',
    iconBg: 'bg-teal/15',
    content_he: `<p><strong>נשימה סרעפתית</strong> - נשמו עמוק דרך האף, 4 שניות. עצרו 2 שניות. נשפו דרך הפה, 6 שניות.</p>
    <p>חזרו על כך 5 פעמים. הנשימה האיטית "מאותתת" למוח שהסכנה עברה ומפעילה את מערכת ה"מנוחה ועיכול".</p>
    <p><a href="${BASE_PATH}/calming/breathing" class="text-primary font-medium">לתרגיל הנשימות האינטראקטיבי →</a></p>`,
  },
  {
    category: 'grounding',
    icon: Compass,
    title_he: 'תרגיל קרקוע 5-4-3-2-1',
    color: 'bg-clay/10 text-clay',
    iconBg: 'bg-clay/15',
    content_he: `<p>כשאתה/את מרגיש/ה ש"יצאת מהגוף" או שהזיכרון חוטף אותך - תרגיל הקרקוע עוזר לחזור להווה.</p>
    <p>מצא/י: 5 דברים שרואים, 4 שנוגעים, 3 שומעים, 2 מריחים, 1 טועמים.</p>
    <p><a href="${BASE_PATH}/calming/grounding" class="text-primary font-medium">לתרגיל הקרקוע האינטראקטיבי →</a></p>`,
  },
  {
    category: 'sleep',
    icon: Moon,
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
    icon: PenLine,
    title_he: 'כתיבה פורקת',
    color: 'bg-teal/10 text-teal',
    iconBg: 'bg-teal/15',
    content_he: `<p>מחקרים מראים שכתיבה על חוויות מלחיצות מפחיתה את עוצמתן הרגשית ומסייעת לעיבוד הטראומה.</p>
    <p><strong>איך מתחילים:</strong> 15-20 דקות, 3-4 פעמים בשבוע. כתבו על האירוע וכיצד הוא השפיע עליכם - ללא צנזורה.</p>
    <p>אין חובה לשמור את מה שכתבתם.</p>`,
  },
  {
    category: 'apps',
    icon: Smartphone,
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
    icon: Zap,
    title_he: 'כיווץ ושחרור שרירים',
    color: 'bg-secondary/10 text-secondary',
    iconBg: 'bg-secondary/15',
    content_he: `<p>הרפיה שרירית פרוגרסיבית מפחיתה מתח גופני שמצטבר בגלל עוררות-יתר.</p>
    <p>עברו על קבוצות שרירים שונות - כפות ידיים, כתפיים, בטן, ירכיים - לחצו 5-10 שניות ואז שחררו.</p>
    <p><a href="${BASE_PATH}/calming/muscle" class="text-primary font-medium">לתרגיל האינטראקטיבי →</a></p>`,
  },
];

function ToolCard({ tool }) {
  const [open, setOpen] = useState(false);
  const Icon = tool.icon;

  return (
    <div className={`bg-card rounded-2xl border transition-natural overflow-hidden ${open ? 'border-primary/40' : 'border-border hover:bg-muted'}`}>
      <button
        className="w-full text-start px-6 py-5 flex items-center gap-4 transition-natural"
        onClick={() => setOpen(o => !o)}
      >
        <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <span className="flex-1 font-heading font-semibold text-foreground">{tool.title_he}</span>
        <ChevronDown className={`w-5 h-5 text-primary flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          className="px-6 pb-6 text-muted-foreground leading-relaxed prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: tool.content_he }}
        />
      )}
    </div>
  );
}

export default function SelfHelp() {
  const { lang } = useLang();
  const isRTL = document.documentElement.getAttribute('dir') === 'rtl';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader icon={Wrench} title={t(lang, 'self_help_title')} subtitle={t(lang, 'self_help_intro')} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        {/* Quick calming shortcut */}
        <div className="mb-8 p-5 rounded-2xl bg-card border border-border flex items-center justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-sm">נמצא/ת עכשיו בהצפה?</p>
            <p className="text-foreground font-medium">תרגילי הרגעה מיידיים ←</p>
          </div>
          <Link
            to="/calming"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-accent transition-natural flex-shrink-0 flex items-center gap-1"
          >
            {t(lang, 'calming')}
            <ArrowIcon className="w-4 h-4" />
          </Link>
        </div>

        <div className="space-y-3">
          {STATIC_TOOLS.map((tool, i) => (
            <ToolCard key={i} tool={tool} />
          ))}
        </div>
      </div>
    </div>
  );
}