import React, { useState } from 'react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { usePTSDInfoFaqs } from '@/api/hooks';
import PageHeader from '@/components/PageHeader';
import { ChevronDown } from 'lucide-react';
import { useImages } from '@/lib/ImageSetContext';
import ValidatableContent from '@/components/ValidatableContent';

// Design A: 2-column accordion grid.
// Each card stays compact (just the question) until clicked, expanding the answer inline.
// On desktop the grid keeps two questions visible per row so the user can scan many
// questions at once without long vertical scrolling. On mobile it collapses to one column.
function FAQCard({ question, answer, contentId }) {
  const [open, setOpen] = useState(false);

  return (
    <ValidatableContent contentId={contentId} label={question}>
      <div
        className={`border-2 rounded-2xl overflow-hidden transition-all duration-300 ${
          open
            ? 'bg-card border-primary shadow-card-hover'
            : 'bg-card border-border hover:border-primary/40 hover:shadow-card'
        }`}
      >
        <button
          className={`w-full text-start px-6 py-5 flex items-center justify-between gap-4 ${
            open ? 'bg-primary/15' : ''
          }`}
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
        >
          <span className="font-heading font-semibold text-foreground leading-snug">{question}</span>
          <ChevronDown
            className={`w-5 h-5 text-primary flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          />
        </button>
        {open && (
          <div
            className="px-6 pb-6 pt-5 text-foreground leading-relaxed prose prose-sm max-w-none border-t border-primary/30"
            dangerouslySetInnerHTML={{ __html: answer }}
          />
        )}
      </div>
    </ValidatableContent>
  );
}

export default function PTSDInfo() {
  const { lang } = useLang();
  const IMAGES = useImages();
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {faqs.map((faq, i) => (
            <FAQCard key={i} question={faq.q} answer={faq.a} contentId={`ptsd-info.faq.${i}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
