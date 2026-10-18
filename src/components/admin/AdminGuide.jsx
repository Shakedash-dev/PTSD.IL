import React from 'react';
import { AlertTriangle, ArrowLeft, Check, History, Pencil, Plus, Save, Trash2, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';

// The /admin home page: how the panel works, in plain Hebrew, for editors who
// are not technical. Every button name below is the exact label the panel
// shows - if a label changes in Admin.jsx or PendingChanges.jsx, change it
// here too.

/**
 * @param {Object} props
 * @param {React.ComponentType<{className?: string}>} props.icon
 * @param {string} props.title
 * @param {'danger'} [props.tone]
 * @param {React.ReactNode} props.children
 */
function GuideCard({ icon: Icon, title, tone, children }) {
  const toneCls = tone === 'danger'
    ? 'border-destructive/30 bg-destructive/5'
    : 'border-border bg-card';
  const iconCls = tone === 'danger' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary';
  return (
    <section className={`rounded-super border p-5 sm:p-6 shadow-card ${toneCls}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${iconCls}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h2 className="font-heading font-semibold text-lg text-foreground">{title}</h2>
      </div>
      <div className="text-sm text-foreground leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

function Key({ children }) {
  return <span className="inline-block px-1.5 py-0.5 rounded-md bg-muted font-semibold text-foreground">{children}</span>;
}

function Steps({ items }) {
  return (
    <ol className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {i + 1}
          </span>
          <span className="pt-0.5">{item}</span>
        </li>
      ))}
    </ol>
  );
}

/**
 * @param {Object} props
 * @param {() => void} props.onStart  jumps to the editable pages
 * @param {boolean} props.canEdit     the user has a content-editing role
 */
export default function AdminGuide({ onStart, canEdit }) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading font-semibold text-2xl text-foreground mb-1">ממשק ניהול התוכן</h1>
        <p className="text-muted-foreground text-sm">
          כאן עורכים את התוכן שמופיע באתר. כדאי לקרוא את ההסבר הקצר הזה לפני העריכה הראשונה.
        </p>
      </div>

      <GuideCard icon={AlertTriangle} title="הכי חשוב: אין ביטול אחרי שמירה" tone="danger">
        <p>
          ברגע ששומרים, השינוי מופיע באתר מיד. <strong>המערכת לא שומרת גרסאות קודמות</strong>, ולכן אי אפשר
          לבטל שמירה או לחזור לנוסח הקודם בלחיצת כפתור.
        </p>
        <ul className="list-disc ps-5 space-y-1">
          <li>לפני כל שמירה תוצג רשימה של כל השינויים - לפני ואחרי. עברו עליה בעיון.</li>
          <li>לפני שמוחקים פריט או משנים טקסט ארוך, העתיקו את הנוסח הקיים למסמך בצד, למקרה שתרצו לשחזר אותו.</li>
          <li>פריט שנמחק ונשמר לא חוזר. כדי להחזיר אותו צריך להוסיף אותו מחדש.</li>
          <li>שינויים שלא נשמרו נמחקים אם סוגרים את הלשונית או מתנתקים.</li>
        </ul>
      </GuideCard>

      <GuideCard icon={Pencil} title="איך עורכים">
        <Steps
          items={[
            <>עברו ללשונית <Key>עריכת תוכן</Key> ובחרו את העמוד שרוצים לערוך מתוך &quot;עמודי האתר הניתנים לעריכה&quot;.</>,
            <>מצאו את הפריט ולחצו על סמל העיפרון <Pencil className="inline w-3.5 h-3.5" /> שלידו.</>,
            <>ערכו את הטקסט ולחצו <Key><Check className="inline w-3 h-3" /> אישור</Key>. השינוי עדיין <strong>לא</strong> נשמר באתר - הפריט מסומן &quot;ממתין לשמירה&quot;.</>,
            <>אפשר להמשיך לערוך עוד פריטים, גם בעמודים אחרים. כל השינויים נאספים יחד.</>,
            <>בסיום לחצו <Key><Save className="inline w-3 h-3" /> סקירה ושמירה</Key> בפס שבתחתית המסך.</>,
            <>עברו על הרשימה, סמנו שבדקתם, ולחצו <Key>שמירה סופית</Key>. רק עכשיו השינויים עולים לאתר.</>,
          ]}
        />
        <div className="rounded-xl bg-muted/50 p-3 space-y-1.5">
          <p><Plus className="inline w-3.5 h-3.5" /> <strong>הוספה:</strong> כפתור &quot;הוספת...&quot; בתחתית כל רשימה.</p>
          <p><Trash2 className="inline w-3.5 h-3.5" /> <strong>מחיקה:</strong> סמל הפח ליד הפריט. גם מחיקה ממתינה לשמירה, כמו עריכה.</p>
          <p><strong>התחרטתם לפני השמירה?</strong> לחצו <Key>ביטול השינוי</Key> ליד הפריט, או בתוך חלון הסקירה. כל עוד לא לחצתם &quot;שמירה סופית&quot;, דבר לא השתנה באתר.</p>
        </div>
        <p className="text-muted-foreground">
          העריכה היא בעברית בלבד. הצ׳טבוט של האתר מתעדכן אוטומטית בתוכן שנשמר; אם מופיעה הודעה שהעדכון שלו נכשל, התוכן עצמו כן נשמר.
        </p>
        {canEdit && (
          <Button type="button" variant="solid" size="xs" onClick={onStart} className="gap-1.5 rounded-lg font-semibold">
            מעבר לעריכת תוכן <ArrowLeft className="w-3.5 h-3.5" />
          </Button>
        )}
      </GuideCard>

      <GuideCard icon={UserCog} title="הרשאות: מי יכול לעשות מה">
        <ul className="space-y-2">
          <li><strong>מנהל תוכן</strong> - עורך, מוסיף ומוחק תוכן באתר.</li>
          <li><strong>מנהל-על</strong> - נותן ומסיר הרשאות, ורואה את יומן העריכות. מנהל-על שגם עורך תוכן צריך את שני התפקידים.</li>
          <li><strong>מנחה</strong> (תפקיד ותיק, קיים אצל חלק מהמשתמשים) - עורך ומוסיף, אבל לא יכול למחוק.</li>
        </ul>
        <p className="font-semibold pt-1">איך נותנים הרשאה לאדם חדש (מנהל-על בלבד):</p>
        <Steps
          items={[
            <>עברו ללשונית <Key>ניהול משתמשים</Key> ולחצו <Key>הוספת משתמש חדש</Key>.</>,
            <>מלאו שם, ואת <strong>כתובת חשבון Google</strong> שלו - בדיוק כפי שהוא מתחבר איתה (בדרך כלל Gmail).</>,
            <>בחרו תפקיד (<strong>מנהל תוכן</strong> לעורכים) ולחצו <Key>יצירת משתמש</Key>. ההרשאה נכנסת לתוקף מיד.</>,
            <>שלחו לו את הכתובת של עמוד הניהול. הוא נכנס עם הכפתור &quot;Sign in with Google&quot;. אין סיסמה.</>,
          ]}
        />
        <p>
          <strong>שינוי תפקיד:</strong> סמל העיפרון ליד המשתמש. <strong>הסרת גישה:</strong> סמל הפח.
          פעולות על משתמשים נשמרות מיד, בלי חלון סקירה.
        </p>
        <p className="text-muted-foreground">צריכים הרשאה ואין לכם? פנו למנהל-על של האתר.</p>
      </GuideCard>

      <GuideCard icon={History} title="יומן עריכות">
        <p>
          כל שמירה נרשמת ביומן: מי שמר, מתי, ומה השתנה (לפני ואחרי). מנהל-על רואה את היומן בלשונית <Key>יומן עריכות</Key>.
        </p>
        <p className="text-muted-foreground">
          היומן מתעד שינויים - הוא לא גיבוי ולא מאפשר שחזור אוטומטי. אפשר להיעזר בו כדי להעתיק ידנית נוסח קודם.
        </p>
      </GuideCard>
    </div>
  );
}
