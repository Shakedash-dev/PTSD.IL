import React, { useState } from 'react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { usePTSDInfoFaqs } from '@/api/hooks';
import PageHeader from '@/components/PageHeader';
import { useImages } from '@/lib/ImageSetContext';
import ValidatableContent from '@/components/ValidatableContent';

// Design B: docs-style sticky table-of-contents.
// Desktop: question list pinned in a left rail; clicking a title shows the full answer
// in the main column to the right (no accordion - the answer is always fully visible).
// Mobile: stacks - TOC on top, answer below, click a title to jump.
export default function PTSDInfo2() {
  const { lang } = useLang();
  const IMAGES = useImages();
  const { data: faqs = [], isLoading, error } = usePTSDInfoFaqs({ lang });
  const [activeIndex, setActiveIndex] = useState(0);

  const active = faqs[activeIndex];

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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        {isLoading && <p className="text-center text-muted-foreground mb-4">{t(lang, 'loading')}</p>}
        {error && <p className="text-center text-muted-foreground mb-4">{t(lang, 'content_error')}</p>}

        <div className="grid grid-cols-1 md:grid-cols-[18rem_1fr] gap-8 lg:gap-12 items-start">
          {/* Sticky TOC */}
          <nav className="md:sticky md:top-24 self-start">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-4">
              {lang === 'en' ? 'Questions' : lang === 'ar' ? 'الأسئلة' : 'שאלות'}
            </p>
            <ul className="flex flex-col gap-1 max-h-[70vh] overflow-y-auto pr-2">
              {faqs.map((faq, i) => {
                const isActive = i === activeIndex;
                return (
                  <li key={i}>
                    <button
                      onClick={() => setActiveIndex(i)}
                      className={`w-full text-start px-4 py-3 rounded-lg leading-snug text-sm transition-colors duration-200 ${
                        isActive
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <span className="font-mono text-xs opacity-60 me-2">{i + 1}.</span>
                      {faq.q}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Main content - full answer always visible */}
          <article className="bg-card border border-border rounded-super shadow-card p-8 sm:p-10 min-h-[20rem]">
            {active ? (
              <ValidatableContent contentId={`ptsd-info.faq.${activeIndex}`} label={active.q}>
                <h2 className="font-heading font-semibold text-2xl sm:text-3xl text-foreground mb-5 leading-tight">
                  {active.q}
                </h2>
                <div
                  className="text-card-foreground leading-relaxed rich-content"
                  dangerouslySetInnerHTML={{ __html: active.a }}
                />
              </ValidatableContent>
            ) : (
              !isLoading && (
                <p className="text-muted-foreground text-center">
                  {t(lang, 'content_error')}
                </p>
              )
            )}
          </article>
        </div>
      </div>
    </div>
  );
}
