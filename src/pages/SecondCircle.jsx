import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import PageHeader from '@/components/PageHeader';
import { Brain, Heart, FileText, Users, Baby, ArrowLeft, ArrowRight, Shield } from 'lucide-react';

const sections = [
  { key: 'ptsd_info', path: '/ptsd-info', icon: Brain, description_he: 'הבנת מה זה PTSD — כדי להבין טוב יותר את מי שאתה/את מלווה' },
  { key: 'second_circle', path: '/second-circle-tools', icon: Shield, description_he: 'כלים מעשיים לתקשורת, זיהוי מצוקה ומניעת שחיקה עצמית', label_override: 'כלים להתמודדות עם נפגע/ת PTSD' },
  { key: 'rights', path: '/rights', icon: FileText, description_he: 'גם בני/בנות משפחה יכולים לקבל סיוע — הכירו את הזכויות' },
  { key: 'treatment', path: '/treatment', icon: Heart, description_he: 'מסלולי הטיפול האפשריים — כדי לעזור לאהוב/ה עליך למצוא את הדרך' },
  { key: 'children_content', path: '/children', icon: Baby, description_he: 'איך לדבר עם ילדים על מה שקורה בבית — חומרים לפי גיל' },
  { key: 'community', path: '/community', icon: Users, description_he: 'קהילות ייעודיות גם לבני/בנות משפחה ומלווים' },
];

export default function SecondCircle() {
  const { lang } = useLang();
  const isRTL = document.documentElement.getAttribute('dir') === 'rtl';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader icon={Shield} title={t(lang, 'path2_title')} subtitle={t(lang, 'second_circle_welcome')} />

      <div className="max-w-3xl mx-auto px-5 sm:px-6 py-16">
        <div className="flex flex-col gap-6">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.key}
                to={section.path}
                className="group flex items-center gap-5 p-6 rounded-2xl border border-border bg-card transition-all duration-500 ease-in-out hover:bg-muted"
              >
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-semibold text-lg text-foreground mb-1">
                    {section.label_override || t(lang, section.key)}
                  </h3>
                  <p className="text-card-foreground leading-relaxed">
                    {section.description_he}
                  </p>
                </div>
                <ArrowIcon className="w-5 h-5 text-primary transition-colors duration-300 group-hover:text-accent flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}