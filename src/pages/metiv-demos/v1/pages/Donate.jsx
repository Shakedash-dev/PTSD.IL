import React from 'react';
import { ExternalLink, Mail } from 'lucide-react';
import { IMAGES } from '@/lib/images';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { DONATE } from '@/pages/metiv-demos/shared/therapist';
import { PageHeaderV1 } from '../components/Chrome';
import { DoorsCompact } from '../components/Doors';
import { ArrowLink, Chapter, PillLink, useV1Title } from '../components/primitives';
import { pad } from '../lib';

export default function Donate() {
  useV1Title('תרומה');

  return (
    <>
      <PageHeaderV1
        size="hero"
        align="start"
        tone="canvas"
        eyebrow="תרומה"
        title={DONATE.title}
        subtitle={DONATE.intro}
        image={IMAGES.secondcircle_hero}
      />

      {DONATE.isPlaceholder && (
        <div className="border-b border-border bg-muted">
          <p className="mx-auto max-w-[80rem] px-5 py-3 text-sm text-foreground sm:px-8 lg:px-12">
            טקסט זמני: הנוסח בעמוד הזה ממתין לטקסט של מטיב.
          </p>
        </div>
      )}

      <Chapter rule={false}>
        <ol className="border-t border-border">
          {DONATE.ways.map((w, i) => (
            <li key={w.key} className="grid gap-6 border-b border-border py-10 md:grid-cols-12 md:gap-10 md:py-14">
              <span aria-hidden="true" className="font-heading text-5xl font-light tabular-nums text-secondary md:col-span-2 md:text-7xl">{pad(i + 1)}</span>
              <div className="md:col-span-6">
                <h2 className="font-heading text-3xl font-light leading-tight text-foreground md:text-5xl">{w.title}</h2>
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{w.description}</p>
              </div>
              <div className="flex items-end md:col-span-4 md:justify-end">
                {w.url ? (
                  <PillLink to={w.url} size="lg">{w.cta}<ExternalLink aria-hidden="true" /></PillLink>
                ) : w.email ? (
                  <PillLink to={`mailto:${w.email}`} tone="light" size="lg"><Mail aria-hidden="true" />{w.cta}</PillLink>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-10 grid gap-6 md:grid-cols-12">
          <p className="text-sm leading-relaxed text-muted-foreground md:col-span-7">{DONATE.paymentNote}</p>
          <p className="text-sm text-muted-foreground md:col-span-4 md:col-start-9">עמותה רשומה · {DONATE.legalEntity}</p>
        </div>
        <div className="mt-10">
          <ArrowLink to={ROUTES.about}>על מטיב ועל הפעילות</ArrowLink>
        </div>
      </Chapter>

      <DoorsCompact />
    </>
  );
}
