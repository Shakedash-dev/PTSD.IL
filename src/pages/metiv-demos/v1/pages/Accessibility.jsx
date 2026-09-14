import React from 'react';
import { cn } from '@/lib/utils';
import { LEGAL } from '@/pages/metiv-demos/shared/therapist';
import { PageHeaderV1 } from '../components/Chrome';
import { ArrowLink, CONTAINER, READING, useV1Title } from '../components/primitives';
import { pad, telHref } from '../lib';

export default function Accessibility() {
  const doc = LEGAL.accessibility;
  useV1Title(doc.title);

  return (
    <>
      <PageHeaderV1 size="default" align="start" tone="canvas" eyebrow="מידע" title={doc.title} subtitle={`עודכן לאחרונה: ${doc.updated}`} />
      <div className={cn(CONTAINER, 'py-12 md:py-20')}>
        <div className={READING}>
          <aside className="rounded-super-sm border border-border bg-muted p-5 text-sm leading-relaxed text-foreground">
            <p className="mb-1 font-semibold">הערה לגרסת ההדגמה</p>
            {doc.demoNote}
          </aside>
          <div className="mt-12 space-y-12">
            {doc.sections.map((s, i) => (
              <section key={s.title}>
                <h2 className="flex items-baseline gap-4 font-heading text-2xl font-light text-foreground md:text-3xl">
                  <span aria-hidden="true" className="text-base tabular-nums text-secondary">{pad(i + 1)}</span>
                  {s.title}
                </h2>
                <p className="mt-4 text-lg leading-[1.85] text-foreground">{s.body}</p>
              </section>
            ))}
          </div>
          <div className="mt-14 rounded-super border border-border bg-card p-6 md:p-8">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground">רכז הנגישות של העמותה</p>
            <p className="mt-3 text-foreground">
              טלפון: <a href={telHref(doc.coordinator.phone)} dir="ltr" className="text-primary underline underline-offset-4">{doc.coordinator.phone}</a>
            </p>
            <p className="mt-1 text-foreground">
              מייל: <a href={`mailto:${doc.coordinator.email}`} dir="ltr" className="text-primary underline underline-offset-4">{doc.coordinator.email}</a>
            </p>
            <p className="mt-1 text-foreground">כתובת: {doc.coordinator.address}</p>
          </div>
          <ArrowLink to={doc.sourceUrl} className="mt-8">להצהרה באתר מטיב</ArrowLink>
        </div>
      </div>
    </>
  );
}
