import React from 'react';
import Disclosure from '@/components/patterns/Disclosure';
import { IMAGES } from '@/lib/images';
import { useDemoChrome } from '@/pages/metiv-demos/shared/DemoChrome';
import { tx } from '../copy';
import { getSecondCircleTools } from '../staticData';
import { KitMarkdown, EntrySection } from '../components';
import { RESERVIST_FAMILY_PROGRAMS, ADDITION_ANCHORS } from '../additions';

function FAQItem({ q, intro, sections, closing, callout }) {
  return (
    <Disclosure
      label={q}
      variant="outlined"
      tintTriggerWhenOpen
      triggerClassName="hover:bg-muted/30"
      panelClassName="text-foreground leading-relaxed border-t border-primary/30"
    >
      <>
        {intro && (
          <KitMarkdown className="rich-content text-foreground italic bg-primary/5 border-s-2 border-primary/30 ps-3 py-2 rounded">
            {intro}
          </KitMarkdown>
        )}
        {sections?.map((s, i) => (
          <div key={i} className={i === 0 ? 'mt-4' : 'mt-6'}>
            <h4 className="font-heading font-semibold text-foreground text-base mb-2">{s.heading}</h4>
            <KitMarkdown className="rich-content">{s.body}</KitMarkdown>
          </div>
        ))}
        {closing && (
          <KitMarkdown className="rich-content text-sm text-foreground/80 italic mt-5">
            {closing}
          </KitMarkdown>
        )}
        {callout && (
          <KitMarkdown className="rich-content bg-warning/10 border border-warning/30 rounded-lg p-3 mt-4 text-foreground">
            {callout}
          </KitMarkdown>
        )}
      </>
    </Disclosure>
  );
}

export default function SecondCircleTools() {
  const { PageHeader } = useDemoChrome();
  const tools = getSecondCircleTools();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        size="editorial"
        align="center"
        tone="dark"
        image={IMAGES.secondcircletools_hero}
        title={tx('second_circle_tools_title')}
        subtitle={tx('second_circle_tools_subtitle')}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-primary/5 border border-primary/20 rounded-super p-5 mb-8">
          <p className="text-foreground leading-relaxed">
            {tx('second_circle_tools_intro')}
          </p>
        </div>

        <div className="max-w-xl mx-auto flex flex-col gap-3">
          {tools.map((faq, i) => (
            <FAQItem key={i} {...faq} />
          ))}
        </div>
      </div>

      {/* Metiv addition 5: programmes for reservists' families */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <EntrySection
          id={ADDITION_ANCHORS.reservistFamilies}
          title="לבני משפחה של מילואימניקים"
          intro="מסגרות קבוצתיות ומשפחתיות של מטיב למילואימניקים ולבני משפחותיהם, לחיזוק הקשר בין הורים לילדים ויכולת ההתמודדות."
          entries={RESERVIST_FAMILY_PROGRAMS}
        />
      </div>
    </div>
  );
}
