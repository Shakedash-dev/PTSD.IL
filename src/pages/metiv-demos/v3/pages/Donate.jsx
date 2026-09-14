import React from 'react';
import { HandHeart, Info, Mail, ShieldCheck } from 'lucide-react';
import { DONATE } from '@/pages/metiv-demos/shared/therapist';
import PageHeaderV3 from '../components/PageHeaderV3';
import { Band, ExternalLink, PILL_OUTLINE, PILL_SOLID } from '../components/kit';

export default function Donate() {
  return (
    <div className="bg-background">
      <PageHeaderV3
        tone="muted"
        eyebrow="תמיכה"
        title={DONATE.title}
        subtitle={DONATE.intro}
        short={['שתי דרכים: תרומה מקוונת, או שיחה על שותפות.', `העמותה רשומה: ${DONATE.legalEntity}.`]}
      />
      <Band tone="canvas" width="default">
        {DONATE.isPlaceholder && (
          <p role="note" className="mb-8 flex items-start gap-3 rounded-super-sm border border-warning/40 bg-warning/10 p-4 text-foreground">
            <Info className="w-5 h-5 mt-0.5 text-warning flex-shrink-0" aria-hidden="true" />
            <span><span className="font-semibold">[טקסט זמני]</span> הטקסטים בעמוד הזה ממתינים לנוסח של מטיב.</span>
          </p>
        )}
        <ol className="grid gap-5 md:grid-cols-2">
          {DONATE.ways.map((w, i) => (
            <li key={w.key} className="flex flex-col rounded-super bg-card border border-border p-7 shadow-card">
              <span className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-primary/10 text-accent flex items-center justify-center">
                  {w.key === 'jgive' ? <HandHeart className="w-6 h-6" aria-hidden="true" /> : <Mail className="w-6 h-6" aria-hidden="true" />}
                </span>
                <span className="text-sm font-semibold text-muted-foreground">דרך {i + 1}</span>
              </span>
              <h2 className="mt-4 font-heading font-semibold text-2xl text-foreground">{w.title}</h2>
              <p className="mt-2 text-foreground leading-relaxed">{w.description}</p>
              <div className="mt-auto pt-6">
                {w.url && <ExternalLink href={w.url} className={PILL_SOLID}>{w.cta}</ExternalLink>}
                {w.email && <a href={`mailto:${w.email}`} className={PILL_OUTLINE}>{w.cta}: <span dir="ltr">{w.email}</span></a>}
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-8 flex items-start gap-2 text-muted-foreground">
          <ShieldCheck className="w-5 h-5 mt-0.5 text-success flex-shrink-0" aria-hidden="true" />
          {DONATE.paymentNote}
        </p>
      </Band>
    </div>
  );
}
