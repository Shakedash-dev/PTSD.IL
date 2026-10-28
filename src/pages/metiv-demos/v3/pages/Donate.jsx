import React from 'react';
import { HandHeart, Info, Mail, ShieldCheck } from 'lucide-react';
import PageHeaderV3 from '../components/PageHeaderV3';
import { fmt, useCopy, useMetiv } from '../content/MetivContent';
import { Band, ExternalLink, fmtNodes, PILL_OUTLINE, PILL_SOLID } from '../components/kit';

export default function Donate() {
  const c = useCopy('donate');
  const { DONATE } = useMetiv();
  return (
    <div className="bg-background">
      <PageHeaderV3
        tone="muted"
        eyebrow={c.eyebrow}
        title={DONATE.title}
        subtitle={DONATE.intro}
        short={[c.short1, fmt(c.short2, { legalEntity: DONATE.legalEntity })]}
      />
      <Band tone="canvas" width="default">
        {DONATE.isPlaceholder && (
          <p role="note" className="mb-8 flex items-start gap-3 rounded-super-sm border border-warning/40 bg-warning/10 p-4 text-foreground">
            <Info className="w-5 h-5 mt-0.5 text-warning flex-shrink-0" aria-hidden="true" />
            <span><span className="font-semibold">{c.placeholderTag}</span> {c.placeholderNote}</span>
          </p>
        )}
        <ol className="grid gap-5 md:grid-cols-2">
          {DONATE.ways.map((/** @type {any} */ w, /** @type {number} */ i) => (
            <li key={w.key} className="flex flex-col rounded-super bg-card border border-border p-7 shadow-card">
              <span className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-primary/10 text-accent flex items-center justify-center">
                  {w.key === 'jgive' ? <HandHeart className="w-6 h-6" aria-hidden="true" /> : <Mail className="w-6 h-6" aria-hidden="true" />}
                </span>
                <span className="text-sm font-semibold text-muted-foreground">{fmt(c.way, { n: i + 1 })}</span>
              </span>
              <h2 className="mt-4 font-heading font-semibold text-2xl text-foreground">{w.title}</h2>
              <p className="mt-2 text-foreground leading-relaxed">{w.description}</p>
              <div className="mt-auto pt-6">
                {w.url && <ExternalLink href={w.url} className={PILL_SOLID}>{w.cta}</ExternalLink>}
                {w.email && <a href={`mailto:${w.email}`} className={PILL_OUTLINE}>{fmtNodes(c.emailCta, { cta: w.cta, email: <span dir="ltr">{w.email}</span> })}</a>}
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
