import React, { useState } from 'react';
import Disclosure from '@/components/patterns/Disclosure';
import ChoiceChip from '@/components/patterns/ChoiceChip';
import { Shield, Heart, Users, Car, HelpCircle, ExternalLink, HandHeart, ArrowLeft } from 'lucide-react';
import { IMAGES } from '@/lib/images';
import { DemoLink, useDemoChrome } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { tx } from '../copy';
import { getRightsFaqs } from '../staticData';
import { KitMarkdown, SmartLink } from '../components';

const CATEGORIES = [
  { key: 'security_forces', labelKey: 'rights_security', icon: Shield },
  { key: 'sexual_harassment', labelKey: 'rights_sexual', icon: Heart },
  { key: 'hostilities', labelKey: 'rights_hostilities', icon: Users },
  { key: 'accidents_work', labelKey: 'rights_accidents', icon: Car },
  { key: 'general', labelKey: 'rights_general', icon: HelpCircle },
];

function FAQAccordion({ q, a, steps, links }) {
  return (
    <Disclosure
      label={q}
      variant="outlined"
      size="compact"
      tintTriggerWhenOpen
      panelClassName="space-y-3 border-t border-primary/30"
    >
      <>
        <KitMarkdown className="text-foreground leading-relaxed rich-content">{a}</KitMarkdown>
        {steps && (
          <div className="p-4 bg-primary/5 rounded-lg">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">{tx('step_by_step')}</p>
            <KitMarkdown className="text-sm text-foreground rich-content">{steps}</KitMarkdown>
          </div>
        )}
        {links?.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {links.map((l, i) => (
              <SmartLink
                key={i}
                href={l.url}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-foreground rounded-full text-sm hover:bg-primary/20 transition-natural"
              >
                {l.label}
                <ExternalLink className="w-3 h-3" />
              </SmartLink>
            ))}
          </div>
        )}
      </>
    </Disclosure>
  );
}

export default function Rights() {
  const { PageHeader } = useDemoChrome();
  const [activeCategory, setActiveCategory] = useState('security_forces');
  const currentFaqs = getRightsFaqs(activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        size="default"
        align="start"
        tone="muted"
        image={IMAGES.rights_hero}
        imageOpacity={0.7}
        eyebrow={tx('rights')}
        title={tx('rights_title')}
        subtitle={tx('rights_subtitle')}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
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
                {tx(cat.labelKey)}
              </ChoiceChip>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="max-w-xl mx-auto flex flex-col gap-3 mb-10">
          {currentFaqs.map((faq, i) => (
            <FAQAccordion key={`${activeCategory}-${i}`} {...faq} />
          ))}
        </div>

        {/* The original chatbot placeholder is replaced (no chatbot in the demo)
            by a pointer to Metiv addition 2. */}
        <div className="p-6 rounded-super border border-primary/20 bg-primary/5 flex flex-col sm:flex-row sm:items-center gap-4">
          <HandHeart className="w-8 h-8 text-primary flex-shrink-0" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-heading font-semibold text-foreground">טיפולים ללא עלות והשתתפות במחקרים</p>
            <p className="text-sm text-muted-foreground mt-1">
              מסגרות טיפול ללא עלות ומחקרים שמגייסים משתתפים, בעיקר לחיילים משוחררים, מילואימניקים ומשפחותיהם.
            </p>
          </div>
          <DemoLink
            to={ROUTES.freeTreatment}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-accent transition-natural flex-shrink-0 inline-flex items-center gap-1"
          >
            לפרטים
            <ArrowLeft className="w-4 h-4" />
          </DemoLink>
        </div>
      </div>
    </div>
  );
}
