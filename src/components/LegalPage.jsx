import React from 'react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import PageHeader from '@/components/patterns/PageHeader';
import Markdown from '@/components/Markdown';

// Shared shell for the two legal pages (/privacy-policy, /terms-of-use).
//
// Legal text is deliberately NOT API/admin-backed: it is not editorial content,
// it must not be changeable by a moderator, and it has to keep rendering even if
// the content API is down. Each page ships its own `content` map instead.
//
// The map only carries Hebrew and English. The Hebrew version is the binding one;
// every other UI language falls back (Arabic -> Hebrew, keeps RTL; Russian and
// French -> English) and gets a short notice saying so. Direction is taken from
// the CONTENT language, not the UI language, so an English fallback shown to a
// French visitor still renders LTR.
const CONTENT_LANG = { he: 'he', ar: 'he', en: 'en', ru: 'en', fr: 'en' };

export default function LegalPage({ titleKey, eyebrowKey, updated, content }) {
  const { lang } = useLang();
  const contentLang = CONTENT_LANG[lang] || 'en';
  const body = content[contentLang];
  const isFallback = contentLang !== lang;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        size="default"
        align="start"
        tone="canvas"
        eyebrow={t(lang, eyebrowKey)}
        title={t(lang, titleKey)}
        subtitle={`${t(lang, 'legal_last_updated')} ${updated[contentLang]}`}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-24">
        {isFallback && (
          <p className="text-xs text-muted-foreground bg-muted/60 border border-border rounded-super px-4 py-3 mb-8 leading-relaxed">
            {t(lang, 'legal_lang_notice')}
          </p>
        )}
        <div dir={contentLang === 'he' ? 'rtl' : 'ltr'} className="text-start">
          <Markdown className="rich-content legal-prose text-foreground">{body}</Markdown>
        </div>
      </div>
    </div>
  );
}
