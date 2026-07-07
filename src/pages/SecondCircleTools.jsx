import React, { useState } from 'react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { useSecondCircleTools } from '@/api/hooks';
import PageHeader from '@/components/PageHeader';
import { ChevronDown } from 'lucide-react';
import { IMAGES } from '@/lib/images';
import ValidatableContent from '@/components/ValidatableContent';

function FAQItem({ q, intro, sections, closing, callout, side = 'left', contentId }) {
  const [open, setOpen] = useState(false);
  return (
    <ValidatableContent contentId={contentId} label={q}>
    <div className={`border-2 transition-natural overflow-hidden ${
      side === 'right'
        ? 'rounded-tl-2xl rounded-bl-2xl rounded-br-2xl rounded-tr-sm'
        : 'rounded-tr-2xl rounded-br-2xl rounded-bl-2xl rounded-tl-sm'
    } ${
      open ? 'bg-card border-primary shadow-card-hover' : 'bg-card border-border hover:border-primary/40'
    }`}>
      <button
        className={`w-full text-start px-6 py-5 flex items-center justify-between gap-4 transition-natural ${
          open ? 'bg-primary/15' : 'hover:bg-muted/30'
        }`}
        onClick={() => setOpen(o => !o)}
      >
        <span className="font-heading font-semibold text-foreground leading-snug">{q}</span>
        <ChevronDown className={`w-5 h-5 text-primary flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-6 pt-5 pb-6 text-foreground leading-relaxed border-t border-primary/30">
          {intro && (
            <div
              className="rich-content text-foreground italic bg-primary/5 border-s-2 border-primary/30 ps-3 py-2 rounded"
              dangerouslySetInnerHTML={{ __html: intro }}
            />
          )}
          {sections?.map((s, i) => (
            <div key={i} className={i === 0 ? 'mt-4' : 'mt-6'}>
              <h4 className="font-heading font-semibold text-foreground text-base mb-2">{s.heading}</h4>
              <div className="rich-content" dangerouslySetInnerHTML={{ __html: s.body }} />
            </div>
          ))}
          {closing && (
            <div
              className="rich-content text-sm text-foreground/80 italic mt-5"
              dangerouslySetInnerHTML={{ __html: closing }}
            />
          )}
          {callout && (
            <div
              className="rich-content bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4 text-foreground"
              dangerouslySetInnerHTML={{ __html: callout }}
            />
          )}
        </div>
      )}
    </div>
    </ValidatableContent>
  );
}

export default function SecondCircleTools() {
  const { lang } = useLang();
  const { data: tools = [], isLoading, error } = useSecondCircleTools({ lang });

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        size="editorial"
        align="center"
        tone="dark"
        image={IMAGES.secondcircletools_hero}
        title={t(lang, 'second_circle_tools_title')}
        subtitle={t(lang, 'second_circle_tools_subtitle')}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        {isLoading && <p className="text-center text-muted-foreground mb-4">{t(lang, 'loading')}</p>}
        {error && <p className="text-center text-muted-foreground mb-4">{t(lang, 'content_error')}</p>}
        <ValidatableContent contentId="second-circle-tools.intro" label="מבוא - כלי מעגל שני">
          <div className="bg-primary/5 border border-primary/20 rounded-super p-5 mb-8">
            <p className="text-foreground leading-relaxed">
              {t(lang, 'second_circle_tools_intro')}
            </p>
          </div>
        </ValidatableContent>

        <div className="max-w-xl mx-auto flex flex-col gap-3">
          {tools.map((faq, i) => {
            const side = i % 2 === 0 ? 'left' : 'right';
            return (
              <div key={i} className={`w-[85%] ${side === 'left' ? 'mr-auto' : 'ml-auto'}`}>
                <FAQItem {...faq} side={side} contentId={`second-circle-tools.faq.${i}`} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
