import React, { useState } from 'react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { useSecondCircleTools } from '@/api/hooks';
import PageHeader from '@/components/PageHeader';
import { ChevronDown } from 'lucide-react';
import { useImages } from '@/lib/ImageSetContext';
import ValidatableContent from '@/components/ValidatableContent';

function FAQItem({ q, a, side = 'left', contentId }) {
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
        <div
          className="px-6 pt-5 pb-6 text-foreground leading-relaxed border-t border-primary/30
            [&_p]:my-3 [&_p]:leading-relaxed
            [&_ul]:my-3 [&_ol]:my-3 [&_ul]:ps-5 [&_ol]:ps-5
            [&_ul]:list-disc [&_ol]:list-decimal
            [&_li]:my-2 [&_li]:leading-relaxed
            [&_h4]:font-heading [&_h4]:font-semibold [&_h4]:text-foreground
            [&_h4]:text-base [&_h4]:mt-6 [&_h4]:mb-2 [&_h4]:first:mt-1
            [&_strong]:text-foreground
            [&_.faq-intro]:text-foreground [&_.faq-intro]:italic
            [&_.faq-intro]:bg-primary/5 [&_.faq-intro]:border-s-2
            [&_.faq-intro]:border-primary/30 [&_.faq-intro]:ps-3
            [&_.faq-intro]:py-2 [&_.faq-intro]:rounded
            [&_.faq-close]:text-sm [&_.faq-close]:text-foreground/80
            [&_.faq-close]:italic [&_.faq-close]:mt-5
            [&_.faq-call]:bg-amber-50 [&_.faq-call]:border [&_.faq-call]:border-amber-200
            [&_.faq-call]:rounded-lg [&_.faq-call]:p-3 [&_.faq-call]:mt-4
            [&_.faq-call]:text-foreground"
          dangerouslySetInnerHTML={{ __html: a }}
        />
      )}
    </div>
    </ValidatableContent>
  );
}

export default function SecondCircleTools() {
  const { lang } = useLang();
  const IMAGES = useImages();
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
