import React from 'react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { usePTSDInfoFaqs } from '@/api/hooks';
import PageHeader from '@/components/patterns/PageHeader';
import Disclosure from '@/components/patterns/Disclosure';
import { IMAGES } from '@/lib/images';
import ValidatableContent from '@/components/ValidatableContent';
import Markdown from '@/components/Markdown';

function FAQCard({ question, answer, contentId }) {
  return (
    <ValidatableContent contentId={contentId} label={question}>
      <Disclosure
        label={question}
        variant="outlined"
        tintTriggerWhenOpen
        className="hover:shadow-card"
        panelClassName="text-foreground leading-relaxed border-t border-primary/30"
      >
        <Markdown className="rich-content">{answer}</Markdown>
      </Disclosure>
    </ValidatableContent>
  );
}

export default function PTSDInfo() {
  const { lang } = useLang();
  const { data: faqs = [], isLoading, error } = usePTSDInfoFaqs({ lang });

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        size="hero"
        align="center"
        tone="card"
        image={IMAGES.ptsdinfo_hero}
        eyebrow={t(lang, 'ptsd_info')}
        title={t(lang, 'ptsd_info_title')}
        subtitle={t(lang, 'ptsd_info_subtitle')}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        {isLoading && <p className="text-center text-muted-foreground mb-4">{t(lang, 'loading')}</p>}
        {error && <p className="text-center text-muted-foreground mb-4">{t(lang, 'content_error')}</p>}
        <ValidatableContent contentId="ptsd-info.instruction" label="הוראות שימוש בדף">
          <p className="text-muted-foreground mb-10 text-center leading-relaxed">
            {t(lang, 'ptsd_info_instruction')}
          </p>
        </ValidatableContent>

        <div className="max-w-xl mx-auto flex flex-col gap-3">
          {faqs.map((faq, i) => (
            <FAQCard key={i} question={faq.q} answer={faq.a} contentId={`ptsd-info.faq.${i}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
