import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import PageHeader from '@/components/PageHeader';
import { Brain, Wrench, FileText, Heart, Users, ArrowLeft, ArrowRight, User } from 'lucide-react';

const sections = [
  { key: 'ptsd_info', path: '/ptsd-info', icon: Brain, description_he: 'הבנת מה זה PTSD, הסימפטומים, ממה זה נובע ואיך לזהות אותו' },
  { key: 'self_help', path: '/self-help', icon: Wrench, description_he: 'תרגילים וכלים שאפשר להתחיל מיד, ללא צורך בעזרה חיצונית' },
  { key: 'rights', path: '/rights', icon: FileText, description_he: 'כל מה שמגיע לך — הסבר פשוט על זכויות ואיך לקבל אותן' },
  { key: 'treatment', path: '/treatment', icon: Heart, description_he: 'מפת הדרכים מהטיפול העצמי ועד הטיפול המקצועי' },
  { key: 'community', path: '/community', icon: Users, description_he: 'קהילות תמיכה, קבוצות ומפגשים — פרונטלי ומקוון' },
];

export default function FirstCircle() {
  const { lang } = useLang();
  const isRTL = document.documentElement.getAttribute('dir') === 'rtl';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader icon={User} title={t(lang, 'path1_title')} subtitle={t(lang, 'first_circle_welcome')} />

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
                    {t(lang, section.key)}
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

        {/* Calming shortcut */}
        <div className="mt-10 p-7 rounded-xl border border-border bg-card text-center">
          <p className="text-card-foreground mb-4">נמצא/ת כרגע בקושי?</p>
          <Link
            to="/calming"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-accent text-primary-foreground rounded-xl font-medium transition-colors duration-300"
          >
            לתרגילי הרגעה מיידיים
            <ArrowIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}