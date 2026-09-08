import React from 'react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { useSecondCircleTools } from '@/api/hooks';
import PageHeader from '@/components/patterns/PageHeader';
import Disclosure from '@/components/patterns/Disclosure';
import { IMAGES } from '@/lib/images';
import ValidatableContent from '@/components/ValidatableContent';
import Markdown from '@/components/Markdown';

function FAQItem({ q, intro, sections, closing, callout, contentId }) {
  return (
    <ValidatableContent contentId={contentId} label={q}>
    <Disclosure
      label={q}
      variant="outlined"
      tintTriggerWhenOpen
      triggerClassName="hover:bg-muted/30"
      panelClassName="text-foreground leading-relaxed border-t border-primary/30"
    >
      <>
          {intro && (
            <Markdown className="rich-content text-foreground italic bg-primary/5 border-s-2 border-primary/30 ps-3 py-2 rounded">
              {intro}
            </Markdown>
          )}
          {sections?.map((s, i) => (
            <div key={i} className={i === 0 ? 'mt-4' : 'mt-6'}>
              <h4 className="font-heading font-semibold text-foreground text-base mb-2">{s.heading}</h4>
              <Markdown className="rich-content">{s.body}</Markdown>
            </div>
          ))}
          {closing && (
            <Markdown className="rich-content text-sm text-foreground/80 italic mt-5">
              {closing}
            </Markdown>
          )}
          {callout && (
            <Markdown className="rich-content bg-warning/10 border border-warning/30 rounded-lg p-3 mt-4 text-foreground">
              {callout}
            </Markdown>
          )}
      </>
    </Disclosure>
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
          {tools.map((faq, i) => (
            <FAQItem key={i} {...faq} contentId={`second-circle-tools.faq.${i}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
