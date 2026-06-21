import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import PageHeader from '@/components/PageHeader';
import { Wrench, Building2, Brain, Leaf, Pill, ChevronDown, ArrowLeft, ArrowRight, ExternalLink, Map } from 'lucide-react';

const STATIC_STEPS = [
  {
    step_number: 1,
    title_he: 'התחלה עצמאית',
    icon: Wrench,
    color: '#3A7B71',
    description_he: 'הצעד הראשון והנגיש ביותר. כלים שאפשר להתחיל מיד, ללא צורך בתור או תשלום.',
    how_to_start_he: '<p>כנס/י לדף "כלים לעזרה עצמית" ובחר/י את הכלי הנוח לך. תרגילי נשימה, קרקוע, ניהול שינה - הכל זמין עכשיו.</p>',
    links: [{ label: 'לכלים לעזרה עצמית', url: '/self-help' }],
  },
  {
    step_number: 2,
    title_he: 'פנייה לקופ"ח / מרכזי חוסן',
    icon: Building2,
    color: '#B36D45',
    description_he: 'הקופות מספקות שירות פסיכולוגי ופסיכיאטרי. מרכזי החוסן מציעים שירות ייחודי לנפגעי פעולות איבה.',
    how_to_start_he: `<ol>
      <li>פנה/י לרופא/ה הראשוני/ת בקופ"ח שלך וביקש/י הפנייה לפסיכולוג/ית</li>
      <li>לנפגעי פעולות איבה - פנה/י לאחד ממרכזי החוסן של משרד הביטחון</li>
      <li>מכבי: 3555 | כללית: 3747 | מאוחדת: 3833 | לאומית: 507</li>
    </ol>`,
    links: [
      { label: 'מרכזי חוסן - משרד הביטחון', url: 'https://www.idf.il/categories/benefits/rehabilitation/mental-rehabilitation/' },
    ],
  },
  {
    step_number: 3,
    title_he: 'טיפולים ממוקדי טראומה',
    icon: Brain,
    color: '#3A7B71',
    description_he: 'טיפולים שהוכחו מחקרית כיעילים ביותר ל-PTSD. מנהלים שיחה ישירה עם הטראומה בצורה מובנית ובטוחה.',
    how_to_start_he: `<p><strong>CBT / PE (טיפול קוגניטיבי-התנהגותי / חשיפה ממושכת):</strong> שינוי דפוסי חשיבה ועיבוד הפחד בצורה הדרגתית ובטוחה.</p>
    <p><strong>EMDR:</strong> עיבוד מחדש של הזיכרון הטראומטי באמצעות תנועות עיניים - עוזר ל"תייק" את הזיכרון בעבר.</p>
    <p><strong>טיפול דינמי:</strong> שיחה מעמיקה על הרגשות והדינמיקות הנפשיות.</p>
    <p><em>כיצד מוצאים מטפל:</em> דרך ההפנייה מהקופה, מכוני EMDR ישראל, או דרך אתר "מוצאים פסיכולוג".</p>`,
    links: [
      { label: 'מכון EMDR ישראל', url: 'https://www.emdrisrael.org' },
    ],
  },
  {
    step_number: 4,
    title_he: 'טיפולים גוף-נפש ומשלימים',
    icon: Leaf,
    color: '#5D6071',
    description_he: 'טיפולים גופניים ומשלימים שמסייעים לשחרר טראומה הגלומה בגוף, כשיטה עצמאית או משלימה.',
    how_to_start_he: `<ul>
      <li><strong>יוגה רגישה לטראומה (TSY):</strong> יוגה שמותאמת לנפגעי טראומה, מדגישה בחירה וגבולות גוף</li>
      <li><strong>מיינדפולנס:</strong> תרגול קשב קשוב המסייע להפחתת דריכות-יתר</li>
      <li><strong>טיפול באמנות / מוסיקה:</strong> ערוצי ביטוי שאינם מילוליים לעיבוד הטראומה</li>
      <li><strong>הידרותרפיה:</strong> טיפול בסביבת מים</li>
    </ul>`,
    links: [],
  },
  {
    step_number: 5,
    title_he: 'טיפול תרופתי',
    icon: Pill,
    color: '#B36D45',
    description_he: 'תרופות יכולות לאזן את הכימיה של המוח ולהקל על תסמינים, ולאפשר לטיפול הפסיכולוגי להיות יעיל יותר.',
    how_to_start_he: `<p>טיפול תרופתי ל-PTSD ניתן רק על ידי פסיכיאטר/ית. התרופות הנפוצות ביותר הן מקבוצת SSRI/SNRI.</p>
    <p><strong>חשוב:</strong> תרופות אינן פתרון בפני עצמן - הן פועלות בצורה הטובה ביותר בשילוב עם טיפול פסיכולוגי.</p>
    <p>פנה/י לרופא/ה ראשוני/ת לקבלת הפנייה לפסיכיאטר/ית.</p>`,
    links: [],
  },
];

function StepCard({ step, isActive, onToggle, index }) {
  const Icon = step.icon;
  const isRTL = document.documentElement.getAttribute('dir') === 'rtl';

  return (
    <div className="relative flex gap-4 sm:gap-6">
      {/* Timeline line */}
      {index < STATIC_STEPS.length - 1 && (
        <div
          className="absolute top-16 bottom-0 w-0.5 rounded-full opacity-20 bg-border"
          style={{ [isRTL ? 'right' : 'left']: '28px' }}
        />
      )}

      {/* Step number bubble */}
      <div className="flex-shrink-0 relative z-10">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-natural border border-border ${isActive ? 'bg-primary' : 'bg-muted'}`}
        >
          <Icon className={`w-6 h-6 ${isActive ? 'text-primary-foreground' : 'text-primary'}`} />
        </div>
      </div>

      {/* Card */}
      <div className={`flex-1 bg-card rounded-2xl border transition-natural overflow-hidden mb-6 ${isActive ? 'border-primary/40' : 'border-border hover:bg-muted'}`}>
        <button
          className="w-full text-start px-5 py-4 flex items-center justify-between gap-3 transition-natural"
          onClick={onToggle}
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider mb-1 block text-primary">
              {t('he', 'step_label')} {step.step_number}
            </span>
            <h3 className="font-heading font-bold text-foreground text-lg">
              {step.title_he}
            </h3>
          </div>
          <ChevronDown className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${isActive ? 'rotate-180' : ''}`} />
        </button>

        {isActive && (
          <div className="px-5 pb-5">
            <p className="text-muted-foreground mb-4 leading-relaxed">{step.description_he}</p>
            <div className="p-4 bg-muted/40 rounded-lg mb-4">
              <p className="text-xs font-bold text-primary uppercase tracking-wide mb-2">{t('he', 'how_to_start')}</p>
              <div
                className="text-sm text-foreground leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: step.how_to_start_he }}
              />
            </div>
            {step.links?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {step.links.map((link, i) => (
                  link.url.startsWith('/') ? (
                    <Link
                      key={i}
                      to={link.url}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-natural"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-natural"
                    >
                      {link.label}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Treatment() {
  const { lang } = useLang();
  const [activeStep, setActiveStep] = useState(null);
  const steps = STATIC_STEPS;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader icon={Map} title={t(lang, 'treatment_title')} subtitle={t(lang, 'treatment_subtitle')} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <p className="text-muted-foreground text-center mb-10">
          לחץ/י על כל שלב לפרטים ולמדריך "איך מתחילים"
        </p>
        <div>
          {steps.map((step, i) => (
            <StepCard
              key={i}
              step={step}
              index={i}
              isActive={activeStep === i}
              onToggle={() => setActiveStep(activeStep === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}