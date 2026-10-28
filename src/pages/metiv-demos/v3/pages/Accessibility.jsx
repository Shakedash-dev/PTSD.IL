import React from 'react';
import { Info } from 'lucide-react';
import PageHeaderV3 from '../components/PageHeaderV3';
import { fmt, useCopy, useMetiv } from '../content/MetivContent';
import { Band, ContactChips, ExternalLink, TEXT_LINK } from '../components/kit';

export default function Accessibility() {
  const c = useCopy('accessibility');
  const { LEGAL } = useMetiv();
  const doc = LEGAL.accessibility;
  return (
    <div className="bg-background">
      <PageHeaderV3
        tone="muted"
        eyebrow={c.eyebrow}
        title={doc.title}
        subtitle={fmt(c.updated, { date: doc.updated })}
        short={[c.short1, c.short2]}
      />
      <Band tone="canvas" width="narrow">
        <p role="note" className="mb-10 flex items-start gap-3 rounded-super-sm border border-info/40 bg-info/10 p-4 text-foreground">
          <Info className="w-5 h-5 mt-0.5 text-info flex-shrink-0" aria-hidden="true" />
          {doc.demoNote}
        </p>
        <div className="space-y-10">
          {doc.sections.map((/** @type {{ title: string, body: string }} */ s, /** @type {number} */ i) => (
            <section key={s.title} aria-labelledby={`acc-${i}`}>
              <h2 id={`acc-${i}`} className="font-heading font-semibold text-2xl text-foreground mb-2">{s.title}</h2>
              <p className="text-lg text-foreground leading-relaxed">{s.body}</p>
            </section>
          ))}
        </div>
        <div className="mt-12 rounded-super bg-card border-2 border-primary/25 p-6">
          <p className="font-heading font-semibold text-xl text-foreground">{c.coordinator}</p>
          <p className="text-muted-foreground mt-1 mb-4">{doc.coordinator.address}</p>
          <ContactChips contact={{ phone: doc.coordinator.phone, email: doc.coordinator.email }} />
        </div>
        <ExternalLink href={doc.sourceUrl} className={`mt-8 text-sm ${TEXT_LINK}`}>{c.source}</ExternalLink>
      </Band>
    </div>
  );
}
