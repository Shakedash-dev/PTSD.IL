import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import PageHeader from '@/components/PageHeader';
import ArchFrame from '@/components/ArchFrame';
import { IMAGES, SECOND_CIRCLE_ILLUSTRATIONS } from '@/lib/images';

const sections = [
  { key: 'ptsd_info', path: '/ptsd-info' },
  { key: 'second_circle', path: '/second-circle-tools', label_override: 'כלים להתמודדות עם נפגע/ת PTSD' },
  { key: 'rights', path: '/rights' },
  { key: 'treatment', path: '/treatment' },
  { key: 'children_content', path: '/children' },
  { key: 'community', path: '/community' },
];

export default function SecondCircle() {
  const { lang } = useLang();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        size="editorial"
        align="center"
        tone="muted"
        image={IMAGES.secondcircle_hero}
        title={t(lang, 'path2_title')}
        subtitle={t(lang, 'second_circle_welcome')}
      />

      {/* Illustration-first grid, no subtext - one glance per section is the goal. */}
      <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-20">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 md:gap-10">
          {sections.map((section) => (
            <Link key={section.key} to={section.path} className="group block text-center">
              <ArchFrame
                src={SECOND_CIRCLE_ILLUSTRATIONS[section.key]}
                alt={section.label_override || t(lang, section.key)}
                aspect="portrait"
                objectFit="contain"
                className="mb-4 bg-muted shadow-card group-hover:shadow-card-hover transition-all duration-500 group-hover:-translate-y-1"
              />
              <h3 className="font-heading font-semibold text-base sm:text-lg text-foreground">
                {section.label_override || t(lang, section.key)}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
