import React, { useState } from 'react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { usePTSDInfoFaqs } from '@/api/hooks';
import PageHeader from '@/components/PageHeader';
import { ChevronDown } from 'lucide-react';
import { useImages } from '@/lib/ImageSetContext';

// Design A: 2-column accordion grid.
// Each card stays compact (just the question) until clicked, expanding the answer inline.
// On desktop the grid keeps two questions visible per row so the user can scan many
// questions at once without long vertical scrolling. On mobile it collapses to one column.
function FAQCard({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
        open
          ? 'bg-primary/10 border-primary/40 shadow-card'
          : 'bg-card border-border hover:border-primary/30 hover:shadow-card'
      }`}
    >
      <button
        className="w-full text-start px-6 py-5 flex items-center justify-between gap-4"
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
          className="px-6 pb-6 text-muted-foreground leading-relaxed prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: answer }}
        />
      )}
    </div>
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
        <p className="text-muted-foreground mb-10 text-center leading-relaxed">
          {t(lang, 'ptsd_info_instruction')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {faqs.map((faq, i) => (
            <FAQCard key={i} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </div>
    </div>
  );
}
