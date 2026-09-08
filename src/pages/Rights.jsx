import React, { useState } from 'react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { useRightsFaqs } from '@/api/hooks';
import PageHeader from '@/components/patterns/PageHeader';
import Disclosure from '@/components/patterns/Disclosure';
import ChoiceChip from '@/components/patterns/ChoiceChip';
import { Shield, Heart, Users, Car, HelpCircle, ExternalLink, MessageCircle, Scale } from 'lucide-react';
import { IMAGES } from '@/lib/images';
import ValidatableContent from '@/components/ValidatableContent';
import Markdown from '@/components/Markdown';

const CATEGORIES = [
  { key: 'security_forces', labelKey: 'rights_security', icon: Shield },
  { key: 'sexual_harassment', labelKey: 'rights_sexual', icon: Heart },
  { key: 'hostilities', labelKey: 'rights_hostilities', icon: Users },
  { key: 'accidents_work', labelKey: 'rights_accidents', icon: Car },
  { key: 'general', labelKey: 'rights_general', icon: HelpCircle },
];


function FAQAccordion({ q, a, steps, links, lang }) {
  return (
    <Disclosure
      label={q}
      variant="outlined"
      size="compact"
      tintTriggerWhenOpen
      panelClassName="space-y-3 border-t border-primary/30"
    >
      <>
          <Markdown className="text-foreground leading-relaxed rich-content">{a}</Markdown>
          {steps && (
            <div className="p-4 bg-primary/5 rounded-lg">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">{t(lang, 'step_by_step')}</p>
              <Markdown className="text-sm text-foreground rich-content">{steps}</Markdown>
            </div>
          )}
          {links?.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {links.map((l, i) => (
                <a
                  key={i}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-foreground rounded-full text-sm hover:bg-primary/20 transition-natural"
                >
                  {l.label}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          )}
      </>
    </Disclosure>
  );
}

export default function Rights() {
  const { lang } = useLang();
  const [activeCategory, setActiveCategory] = useState('security_forces');

  const { data: currentFaqs = [], isLoading, error } = useRightsFaqs({ lang, category: activeCategory });

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        size="default"
        align="start"
        tone="muted"
        image={IMAGES.rights_hero}
        imageOpacity={0.7}
        eyebrow={t(lang, 'rights')}
        title={t(lang, 'rights_title')}
        subtitle={t(lang, 'rights_subtitle')}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {isLoading && <p className="text-center text-muted-foreground mb-4">{t(lang, 'loading')}</p>}
        {error && <p className="text-center text-muted-foreground mb-4">{t(lang, 'content_error')}</p>}
        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <ChoiceChip
                key={cat.key}
                selected={activeCategory === cat.key}
                onClick={() => setActiveCategory(cat.key)}
              >
                <Icon className="w-4 h-4" />
                {t(lang, cat.labelKey)}
              </ChoiceChip>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="max-w-xl mx-auto flex flex-col gap-3 mb-10">
          {currentFaqs.map((faq, i) => (
            <ValidatableContent key={i} contentId={`rights.faq.${activeCategory}.${i}`} label={faq.q}>
              <FAQAccordion {...faq} lang={lang} />
            </ValidatableContent>
          ))}
        </div>

        {/* Chatbot placeholder */}
        <div className="p-6 rounded-super border border-dashed border-primary/30 bg-primary/3 text-center">
          <MessageCircle className="w-8 h-8 text-primary mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">{t(lang, 'chatbot_soon')}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t(lang, 'chatbot_description')}
          </p>
        </div>
      </div>
    </div>
  );
}