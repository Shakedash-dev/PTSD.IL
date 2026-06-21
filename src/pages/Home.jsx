import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { ArrowLeft, ArrowRight, Brain, Heart, FileText, Users, Shield, Baby } from 'lucide-react';

const quickNavItems = [
  { key: 'ptsd_info', path: '/ptsd-info', icon: Brain },
  { key: 'treatment', path: '/treatment', icon: Heart },
  { key: 'rights', path: '/rights', icon: FileText },
  { key: 'community', path: '/community', icon: Users },
  { key: 'second_circle', path: '/second-circle', icon: Shield },
  { key: 'children_content', path: '/children', icon: Baby },
];

export default function Home() {
  const { lang } = useLang();
  const isRTL = document.documentElement.getAttribute('dir') === 'rtl';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const paths = [
    { path: '/first-circle', titleKey: 'path1_title', subtitleKey: 'path1_subtitle' },
    { path: '/second-circle', titleKey: 'path2_title', subtitleKey: 'path2_subtitle' },
    { path: '/questionnaire', titleKey: 'path3_title', subtitleKey: 'path3_subtitle' },
  ];

  return (
    <div className="bg-background">
      {/* ── Intro ── */}
      <section className="max-w-3xl mx-auto px-5 sm:px-6 pt-28 sm:pt-32 pb-10 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          פוסט טראומה - אתה לא לבד
        </p>
        <h1 className="text-3xl sm:text-4xl font-heading font-semibold text-foreground mb-5 leading-snug">
          {t(lang, 'hero_tagline')}
        </h1>
        <p className="text-lg text-card-foreground max-w-xl mx-auto leading-relaxed">
          {t(lang, 'hero_subtitle')}
        </p>
      </section>

      {/* ── Three path panels ── */}
      <section className="max-w-3xl mx-auto px-5 sm:px-6 pb-16">
        <div className="flex flex-col gap-6">
          {paths.map((panel) => (
            <Link
              key={panel.path}
              to={panel.path}
              className="group block bg-card rounded-xl border border-border p-7 sm:p-8 transition-colors duration-300 hover:border-primary"
            >
              <div className="flex items-center justify-between gap-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-heading font-semibold text-foreground mb-2 leading-snug">
                    {t(lang, panel.titleKey)}
                  </h2>
                  <p className="text-card-foreground leading-relaxed">
                    {t(lang, panel.subtitleKey)}
                  </p>
                </div>
                <ArrowIcon className="w-6 h-6 text-primary flex-shrink-0 transition-colors duration-300 group-hover:text-accent" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── About PTSD strip ── */}
      <section className="border-y border-border bg-card">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-12 text-center">
          <p className="text-lg leading-relaxed text-card-foreground">
            {t(lang, 'about_ptsd_short')}
          </p>
          <Link
            to="/ptsd-info"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-primary hover:bg-accent text-primary-foreground rounded-xl font-medium transition-colors duration-300"
          >
            {t(lang, 'read_more')}
            <ArrowIcon className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Quick nav section ── */}
      <section className="max-w-3xl mx-auto px-5 sm:px-6 py-16">
        <h2 className="text-2xl font-heading font-semibold text-foreground mb-8 text-center">
          {t(lang, 'quick_nav_title')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {quickNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                to={item.path}
                className="group flex items-center gap-4 p-6 bg-card rounded-xl border border-border transition-colors duration-300 hover:border-primary"
              >
                <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <span className="font-heading font-medium text-foreground leading-snug">
                  {t(lang, item.key)}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Calming CTA ── */}
      <section className="max-w-3xl mx-auto px-5 sm:px-6 pb-20">
        <div className="bg-card rounded-xl border border-border p-8 sm:p-10 text-center">
          <p className="text-sm text-muted-foreground mb-2">נמצא/ת במצוקה עכשיו?</p>
          <h3 className="text-2xl font-heading font-semibold text-foreground mb-4">
            תרגילי הרגעה מיידיים
          </h3>
          <p className="text-card-foreground mb-7 max-w-md mx-auto leading-relaxed">
            תרגילי נשימה וקרקוע. ללא עומס, בקצב שלך.
          </p>
          <Link
            to="/calming"
            className="inline-flex items-center gap-2 px-7 py-3 bg-primary hover:bg-accent text-primary-foreground rounded-xl font-medium transition-colors duration-300"
          >
            {t(lang, 'calming')}
            <ArrowIcon className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}