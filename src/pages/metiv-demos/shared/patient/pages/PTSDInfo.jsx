import React from 'react';
import Disclosure from '@/components/patterns/Disclosure';
import { IMAGES } from '@/lib/images';
import { useDemoChrome } from '@/pages/metiv-demos/shared/DemoChrome';
import { tx } from '../copy';
import { getPTSDInfoFaqs } from '../staticData';
import { KitMarkdown } from '../components';

function FAQCard({ question, answer }) {
  return (
    <Disclosure
      label={question}
      variant="outlined"
      tintTriggerWhenOpen
      className="hover:shadow-card"
      panelClassName="text-foreground leading-relaxed border-t border-primary/30"
    >
      <KitMarkdown className="rich-content">{answer}</KitMarkdown>
    </Disclosure>
  );
}

export default function PTSDInfo() {
  const { PageHeader } = useDemoChrome();
  const faqs = getPTSDInfoFaqs();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        size="hero"
        align="center"
        tone="card"
        image={IMAGES.ptsdinfo_hero}
        eyebrow={tx('ptsd_info')}
        title={tx('ptsd_info_title')}
        subtitle={tx('ptsd_info_subtitle')}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <p className="text-muted-foreground mb-10 text-center leading-relaxed">
          {tx('ptsd_info_instruction')}
        </p>

        <div className="max-w-xl mx-auto flex flex-col gap-3">
          {faqs.map((faq, i) => (
            <FAQCard key={i} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </div>
    </div>
  );
}
