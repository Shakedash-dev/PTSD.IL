import React from 'react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { useLegalDocs } from '@/api/hooks';
import PageHeader from '@/components/patterns/PageHeader';
import Markdown from '@/components/Markdown';

// Shared shell for the two legal pages (/privacy-policy, /terms-of-use).
//
// The Markdown each page ships with is the source of truth and always renders
// first: legal text has to appear even when the content API is down, so the DB
// is an override layer, never the only copy. If an admin has saved a
// replacement for this document in this content language, it displaces the
// shipped text (body and last-updated date together, so the date can never
// describe the wrong version).
//
// Who can save one: `admin` only, not `moderator` - see hasLegalEditAccess()
// in src/lib/auth.js, including what that gate does and does not guarantee.
//
// The map only carries Hebrew and English. The Hebrew version is the binding one;
// every other UI language falls back (Arabic -> Hebrew, keeps RTL; Russian and
// French -> English) and gets a short notice saying so. Direction is taken from
// the CONTENT language, not the UI language, so an English fallback shown to a
// French visitor still renders LTR.
const CONTENT_LANG = { he: 'he', ar: 'he', en: 'en', ru: 'en', fr: 'en' };

export default function LegalPage({ slug, titleKey, eyebrowKey, updated, content }) {
  const { lang } = useLang();
  const contentLang = CONTENT_LANG[lang] || 'en';
  const isFallback = contentLang !== lang;

  // Overrides are stored per content language, so a Hebrew edit reaches the
  // Arabic visitor reading the Hebrew fallback - which is right, it is the
  // same document.
  const { data: docs } = useLegalDocs({ lang: contentLang });
  const override = docs?.[slug];
  const body = override?.body || content[contentLang];
  const updatedOn = override?.updated || updated[contentLang];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        size="default"
        align="start"
        tone="canvas"
        eyebrow={t(lang, eyebrowKey)}
        title={t(lang, titleKey)}
        subtitle={`${t(lang, 'legal_last_updated')} ${updatedOn}`}
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
