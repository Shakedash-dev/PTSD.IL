import React from 'react';
import { Info, Phone, Mail, MapPin, ExternalLink } from 'lucide-react';
import { useDemoChrome } from '@/pages/metiv-demos/shared/DemoChrome';
import { LEGAL } from '@/pages/metiv-demos/shared/therapist';
import { cn } from '@/lib/utils';
import { FOCUS_LIGHT, telHref } from '../lib';
import { Container, Panel } from '../components/ui';

export default function Accessibility() {
  const { PageHeader } = useDemoChrome();
  const a = LEGAL.accessibility;
  return (
    <div className="bg-background">
      <PageHeader eyebrow="נגישות" title={a.title} subtitle={`עודכן לאחרונה: ${a.updated}`} tone="card" />
      <Container className="py-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] items-start">
        <div className="space-y-4 min-w-0">
          <div role="note" className="flex gap-3 rounded-super-sm border-2 border-dashed border-info bg-card p-5">
            <Info className="w-6 h-6 text-info flex-shrink-0" aria-hidden="true" />
            <p className="text-sm text-foreground leading-relaxed">{a.demoNote}</p>
          </div>
          {a.sections.map((s, i) => (
            <Panel as="section" key={s.title} aria-labelledby={`acc-${i}`} className="p-6">
              <h2 id={`acc-${i}`} className="font-heading font-semibold text-xl text-foreground mb-2">
                {s.title}
              </h2>
              <p className="text-foreground leading-relaxed">{s.body}</p>
            </Panel>
          ))}
          <p className="text-sm text-muted-foreground">
            <a href={a.sourceUrl} target="_blank" rel="noopener noreferrer" className={cn('inline-flex items-center gap-1 underline underline-offset-4 font-semibold text-foreground rounded', FOCUS_LIGHT)}>
              הצהרת הנגישות באתר מטיב
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </p>
        </div>
        <aside className="lg:sticky lg:top-28">
          <Panel className="p-6">
            <h2 className="font-heading font-semibold text-lg text-foreground mb-3">רכז הנגישות</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <a href={telHref(a.coordinator.phone)} className={cn('inline-flex items-center gap-2 text-foreground hover:underline underline-offset-4 rounded', FOCUS_LIGHT)}>
                  <Phone className="w-4 h-4 text-accent" aria-hidden="true" />
                  <span dir="ltr">{a.coordinator.phone}</span>
                </a>
              </li>
              <li>
                <a href={`mailto:${a.coordinator.email}`} className={cn('inline-flex items-center gap-2 text-foreground hover:underline underline-offset-4 rounded', FOCUS_LIGHT)}>
                  <Mail className="w-4 h-4 text-accent" aria-hidden="true" />
                  <span dir="ltr">{a.coordinator.email}</span>
                </a>
              </li>
              <li className="flex gap-2 text-foreground">
                <MapPin className="w-4 h-4 text-accent flex-shrink-0 mt-1" aria-hidden="true" />
                {a.coordinator.address}
              </li>
            </ul>
          </Panel>
        </aside>
      </Container>
    </div>
  );
}
