import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

const exercises = [
  { key: 'breathing', path: '/calming/breathing' },
  { key: 'grounding', path: '/calming/grounding' },
  { key: 'muscle', path: '/calming/muscle' },
];

export default function Calming() {
  const { lang } = useLang();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 py-24">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-heading font-semibold text-foreground mb-3">
            {t(lang, 'calming_title')}
          </h1>
          <p className="text-card-foreground leading-relaxed">
            {t(lang, 'calming_subtitle')}
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {exercises.map((ex) => (
            <Link
              key={ex.key}
              to={ex.path}
              className="block bg-card rounded-xl border border-border p-7 transition-colors duration-300 hover:border-primary"
            >
              <h2 className="text-xl font-heading font-semibold text-foreground mb-1.5">
                {t(lang, `${ex.key}_title`)}
              </h2>
              <p className="text-card-foreground leading-relaxed">
                {t(lang, `${ex.key}_subtitle`)}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a href="tel:1201" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">
            {t(lang, 'eran_link')} — 1201
          </a>
        </div>
      </div>
    </div>
  );
}