import React, { useState } from 'react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { getRightsFaqs } from '@/lib/pageContent';
import PageHeader from '@/components/PageHeader';
import { Shield, Heart, Users, Car, HelpCircle, ChevronDown, ExternalLink, MessageCircle, Scale } from 'lucide-react';

const CATEGORIES = [
  { key: 'security_forces', labelKey: 'rights_security', icon: Shield },
  { key: 'sexual_harassment', labelKey: 'rights_sexual', icon: Heart },
  { key: 'hostilities', labelKey: 'rights_hostilities', icon: Users },
  { key: 'accidents_work', labelKey: 'rights_accidents', icon: Car },
  { key: 'general', labelKey: 'rights_general', icon: HelpCircle },
];


function FAQAccordion({ q, a, steps, links, side = 'left' }) {
  const [open, setOpen] = useState(false);
  const isRight = side === 'right';
  return (
    <div className={`border transition-natural overflow-hidden ${
      isRight
        ? 'rounded-tl-2xl rounded-bl-2xl rounded-br-2xl rounded-tr-sm'
        : 'rounded-tr-2xl rounded-br-2xl rounded-bl-2xl rounded-tl-sm'
    } ${
      isRight
        ? open ? 'bg-primary/20 border-primary/50' : 'bg-primary/12 border-primary/30 hover:bg-primary/18'
        : open ? 'bg-muted border-muted-foreground/25' : 'bg-muted/50 border-muted-foreground/15 hover:bg-muted'
    }`}>
      <button
        className="w-full text-start px-5 py-4 flex items-center justify-between gap-3 transition-natural"
        onClick={() => setOpen(o => !o)}
      >
        <span className="font-heading font-semibold text-foreground leading-snug">{q}</span>
        <ChevronDown className={`w-5 h-5 text-primary flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-3">
          <div className="text-muted-foreground leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: a }} />
          {steps && (
            <div className="p-4 bg-primary/5 rounded-lg">
              <p className="text-xs font-bold text-primary uppercase tracking-wide mb-2">צעד אחר צעד</p>
              <div className="text-sm text-foreground prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: steps }} />
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-natural"
                >
                  {l.label}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Rights() {
  const { lang } = useLang();
  const [activeCategory, setActiveCategory] = useState('security_forces');

  const currentFaqs = getRightsFaqs(lang, activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader icon={Scale} title={t(lang, 'rights_title')} subtitle={t(lang, 'rights_subtitle')} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-natural ${
                  activeCategory === cat.key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border hover:bg-muted'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t(lang, cat.labelKey)}
              </button>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="max-w-xl mx-auto flex flex-col gap-3 mb-10">
          {currentFaqs.map((faq, i) => {
            const side = i % 2 === 0 ? 'left' : 'right';
            return (
              <div key={i} className={`w-[85%] ${side === 'left' ? 'mr-auto' : 'ml-auto'}`}>
                <FAQAccordion {...faq} side={side} />
              </div>
            );
          })}
        </div>

        {/* Chatbot placeholder */}
        <div className="p-6 rounded-super border border-dashed border-primary/30 bg-primary/3 text-center">
          <MessageCircle className="w-8 h-8 text-primary/40 mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">{t(lang, 'chatbot_soon')}</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            בקרוב תוכל/י לשאול שאלות ולקבל ענות מותאמות אישית
          </p>
        </div>
      </div>
    </div>
  );
}