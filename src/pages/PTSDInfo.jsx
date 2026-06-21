import React, { useState } from 'react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { getPTSDInfoFaqs } from '@/lib/pageContent';
import PageHeader from '@/components/PageHeader';
import { ChevronDown, Brain } from 'lucide-react';

function FAQAccordion({ question, answer, side = 'left' }) {
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
        className="w-full text-start px-6 py-5 flex items-center justify-between gap-4 transition-natural"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className="font-heading font-semibold text-foreground leading-snug">{question}</span>
        <ChevronDown className={`w-5 h-5 text-primary flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
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
  const faqs = getPTSDInfoFaqs(lang);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader icon={Brain} title={t(lang, 'ptsd_info_title')} subtitle={t(lang, 'ptsd_info_subtitle')} />

      {/* FAQ */}
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-16">
        <p className="text-muted-foreground mb-8 text-center leading-relaxed">
          לחץ/י על כל שאלה כדי לקרוא את התשובה
        </p>
        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => {
            const side = i % 2 === 0 ? 'left' : 'right';
            return (
              <div key={i} className={`w-[78%] ${side === 'left' ? 'mr-auto' : 'ml-auto'}`}>
                <FAQAccordion question={faq.q} answer={faq.a} side={side} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}