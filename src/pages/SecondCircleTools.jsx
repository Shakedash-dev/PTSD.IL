import React, { useState } from 'react';
import { useLang } from '@/lib/LanguageContext';
import { getSecondCircleTools } from '@/lib/pageContent';
import { ChevronDown, Shield } from 'lucide-react';

function FAQItem({ q, a, side = 'left' }) {
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
        className="w-full text-start px-6 py-5 flex items-center justify-between gap-4 hover:bg-muted/30 transition-natural"
        onClick={() => setOpen(o => !o)}
      >
        <span className="font-heading font-semibold text-foreground leading-snug">{q}</span>
        <ChevronDown className={`w-5 h-5 text-primary flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          className="px-6 pb-6 text-muted-foreground leading-relaxed prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: a }}
        />
      )}
    </div>
  );
}

const PAGE_HEADINGS = {
  he: { title: 'כלים להתמודדות', subtitle: 'לאדם שמלווה מישהו עם PTSD - כלים מעשיים לתקשורת, תמיכה, ושמירה על עצמך', intro: 'ללוות מישהו עם PTSD הוא מסע שדורש כוח, סבלנות, ובעיקר - הבנה. הכלים כאן לא יפתרו הכל, אבל יכולים להקל מאוד על הדרך.' },
  ar: { title: 'أدوات التعامل', subtitle: 'للشخص الذي يرافق شخصاً مصاباً باضطراب ما بعد الصدمة - أدوات عملية للتواصل والدعم والاعتناء بنفسك', intro: 'مرافقة شخص مصاب باضطراب ما بعد الصدمة رحلة تتطلب قوة وصبراً وفهماً. الأدوات هنا لن تحل كل شيء، لكنها يمكن أن تُيسّر الطريق كثيراً.' },
  en: { title: 'Coping Tools', subtitle: 'For the person supporting someone with PTSD - practical tools for communication, support, and self-care', intro: 'Supporting someone with PTSD is a journey that takes strength, patience, and understanding. These tools won\'t solve everything, but they can make the path much easier.' },
  ru: { title: 'Инструменты поддержки', subtitle: 'Для тех, кто поддерживает человека с ПТСР - практические инструменты для общения, поддержки и заботы о себе', intro: 'Поддерживать человека с ПТСР - это путь, требующий силы, терпения и понимания. Эти инструменты не решат всё, но могут сильно облегчить дорогу.' },
  fr: { title: 'Outils d\'adaptation', subtitle: 'Pour la personne qui accompagne quelqu\'un souffrant de PTSD - outils pratiques pour communiquer, soutenir et prendre soin de soi', intro: 'Accompagner quelqu\'un souffrant de PTSD est un chemin qui demande force, patience et compréhension. Ces outils ne résoudront pas tout, mais peuvent grandement faciliter le parcours.' },
};

export default function SecondCircleTools() {
  const { lang } = useLang();
  const tools = getSecondCircleTools(lang);
  const h = PAGE_HEADINGS[lang] || PAGE_HEADINGS.he;

  return (
    <div className="min-h-screen bg-background pt-16">
      <div
        className="relative py-20 px-4 text-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #B36D45 0%, #8A5234 100%)' }}
      >
        <div className="relative z-10 max-w-3xl mx-auto pt-8">
          <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-heading font-black text-white mb-4">
            {h.title}
          </h1>
          <p className="text-lg text-white/80 leading-relaxed max-w-2xl mx-auto">
            {h.subtitle}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-primary/5 border border-primary/20 rounded-super p-5 mb-8">
          <p className="text-foreground leading-relaxed">
            {h.intro}
          </p>
        </div>

        <div className="max-w-xl mx-auto flex flex-col gap-3">
          {tools.map((faq, i) => {
            const side = i % 2 === 0 ? 'left' : 'right';
            return (
              <div key={i} className={`w-[85%] ${side === 'left' ? 'mr-auto' : 'ml-auto'}`}>
                <FAQItem {...faq} side={side} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}