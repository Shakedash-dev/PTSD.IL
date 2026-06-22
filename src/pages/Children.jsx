import React, { useState } from 'react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import PageHeader from '@/components/PageHeader';
import { Baby, BookOpen, Video, Download, Star } from 'lucide-react';

const AGE_TABS = [
  { key: '0-4', labelKey: 'age_until4' },
  { key: '4-6', labelKey: 'age_4_6' },
  { key: '7-10', labelKey: 'age_7_10' },
  { key: '10-13', labelKey: 'age_10_13' },
  { key: '14-16', labelKey: 'age_14_16' },
  { key: '16+', labelKey: 'age_16plus' },
];

export const STATIC_CONTENT = {
  '0-4': {
    guidelines: `<p><strong>בגיל הזה, ילדים חשים את הרגשות של ההורה אבל לא מבינים מה קורה.</strong> הם זקוקים לתחושת ביטחון פיזי.</p>
    <ul>
      <li>שמרו על שגרה קבועה ככל האפשר - שינה, אכילה, משחק</li>
      <li>הרבו בחיבוקים, נגיעות ומגע גופני</li>
      <li>השתמשו בשפה פשוטה מאוד: "אבא/אמא לא מרגיש/ה טוב לפעמים, אבל זה לא בגללך"</li>
      <li>אל תציגו פרטים של הטראומה</li>
    </ul>`,
    resources: [
      { type: 'book', title_he: 'כשאבא עצוב', description_he: 'ספר ציורים על רגשות קשים' },
      { type: 'activity', title_he: 'משחק בועות סבון', description_he: 'תרגיל נשימה בגובה עיניים' },
    ],
  },
  '4-6': {
    guidelines: `<p><strong>בגיל זה ילדים מתחילים לשאול שאלות ישירות.</strong> הם מבינים יותר מפני שחשבתם.</p>
    <ul>
      <li>ענו בכנות בצורה מותאמת גיל: "לפעמים זיכרונות קשים מרגישים ממש אמיתיים"</li>
      <li>השתמשו בסיפורים ובדמויות מוכרות</li>
      <li>שמרו על שגרת שינה יציבה</li>
      <li>עודדו ציור וביטוי רגשי</li>
    </ul>`,
    resources: [
      { type: 'story', title_he: 'הדרקון שבתוכנו', description_he: 'אנלוגיה לתגובת הגוף לפחד' },
    ],
  },
  '7-10': {
    guidelines: `<p><strong>ילדים בגיל זה מבינים יחסי סיבה ותוצאה.</strong> הם עלולים לחוש אחראים.</p>
    <ul>
      <li>הדגישו בצורה ברורה: "זה לא בגללך"</li>
      <li>הסבירו בפשטות את מנגנון ה-PTSD: "המוח של ההורה חושב שיש עוד סכנה"</li>
      <li>עודדו שאלות ואל תברחו מהן</li>
      <li>שמרו על חיים "נורמליים" - בית ספר, חברים, פעילויות</li>
    </ul>`,
    resources: [],
  },
  '10-13': {
    guidelines: `<p><strong>גיל ביניים - ילדים עלולים "לקחת על עצמם" תפקיד ההורה.</strong></p>
    <ul>
      <li>הכירו בתפקידם ובמאמצם, אבל שחררו אותם מאחריות הורית</li>
      <li>הסבירו בצורה יותר מפורטת מה זה PTSD ואיך זה מתבטא</li>
      <li>עודדו פעילות גופנית וחברתית מחוץ לבית</li>
      <li>ספרו להם שאתם מקבלים עזרה</li>
    </ul>`,
    resources: [],
  },
  '14-16': {
    guidelines: `<p><strong>מתבגרים צעירים - עלולים לגלות כעס, בושה, או ריחוק.</strong></p>
    <ul>
      <li>שקפו בכנות: "ההורה שלך מתמודד עם PTSD - זה מחלה אמיתית, לא בחירה"</li>
      <li>הכירו בקשיים שלהם ובאיך שהמצב משפיע עליהם</li>
      <li>עודדו קשר עם מבוגרים אמינים מחוץ לבית</li>
      <li>הציעו אפשרות לתמיכה פסיכולוגית עצמאית</li>
    </ul>`,
    resources: [],
  },
  '16+': {
    guidelines: `<p><strong>צעירים בוגרים - יכולים להיות שותפים מלאים יותר בהבנת המצב.</strong></p>
    <ul>
      <li>שתפו ב"שפת מבוגרים" תוך כבוד לגבולות</li>
      <li>עודדו לחפש מידע ותמיכה בעצמם</li>
      <li>הכירו בכך שגם הם עלולים לפתח תגובות טראומטיות משניות</li>
      <li>הציעו לפנות יחד לאיש מקצוע</li>
    </ul>`,
    resources: [
      { type: 'video', title_he: 'PTSD הסבר לנוער', description_he: 'סרטון הסבר מותאם לגיל' },
    ],
  },
};

const RESOURCE_ICONS = {
  book: BookOpen,
  video: Video,
  download: Download,
  story: Star,
  activity: Baby,
};

export default function Children() {
  const { lang } = useLang();
  const [activeAge, setActiveAge] = useState('0-4');
  const staticContent = STATIC_CONTENT[activeAge] || {};
  const guidelines = staticContent.guidelines || '';
  const resources = staticContent.resources || [];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader icon={Baby} title={t(lang, 'children_title')} subtitle={t(lang, 'children_intro')} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Age tabs */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {AGE_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveAge(tab.key)}
              className={`px-4 py-2.5 rounded-full border text-sm font-medium transition-natural ${
                activeAge === tab.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:bg-muted bg-card'
              }`}
            >
              {t(lang, tab.labelKey)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Guidelines */}
          <div className="md:col-span-2 bg-card rounded-super border border-border p-6 shadow-card">
            <h3 className="font-heading font-bold text-foreground mb-4">הנחיות להורה</h3>
            <div
              className="text-muted-foreground leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: guidelines }}
            />
          </div>

          {/* Resources */}
          <div className="bg-card rounded-super border border-border p-6 shadow-card">
            <h3 className="font-heading font-bold text-foreground mb-4">
              {t(lang, 'resources_library')}
            </h3>
            {resources.length > 0 ? (
              <div className="space-y-3">
                {resources.map((r, i) => {
                  const Icon = RESOURCE_ICONS[r.type] || BookOpen;
                  return (
                    <div key={i} className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{r.title_he}</p>
                        {r.description_he && (
                          <p className="text-xs text-muted-foreground mt-0.5">{r.description_he}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground/60 text-center py-4">
                חומרים נוספים בקרוב
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}