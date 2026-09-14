import React from 'react';
import { ExternalLink, Mail, TriangleAlert, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDemoChrome } from '@/pages/metiv-demos/shared/DemoChrome';
import { DONATE, ABOUT } from '@/pages/metiv-demos/shared/therapist';
import { FOCUS_LIGHT } from '../lib';
import { Container, IconBadge, Panel } from '../components/ui';
import { RepeatDoors } from './Landing';

export default function Donate() {
  const { PageHeader } = useDemoChrome();
  return (
    <div className="bg-background">
      <PageHeader eyebrow="תרומה" title={DONATE.title} subtitle={DONATE.intro} tone="card" />
      <Container size="default" className="py-12 space-y-8">
        {DONATE.isPlaceholder && (
          <div role="note" className="flex gap-3 rounded-super-sm border-2 border-dashed border-warning bg-card p-5">
            <TriangleAlert className="w-6 h-6 text-warning flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold text-foreground">[טקסט זמני]</p>
              <p className="text-sm text-card-foreground">הנוסח בעמוד זה ממתין לטקסט של מטיב. המבנה והקישורים אמיתיים.</p>
            </div>
          </div>
        )}

        <ul className="grid gap-5 md:grid-cols-2">
          {DONATE.ways.map((w, i) => (
            <li key={w.key}>
              <Panel className="h-full flex flex-col gap-4 p-6 sm:p-8">
                <IconBadge name={w.url ? 'CreditCard' : 'Handshake'} size="lg" className={i === 0 ? 'bg-secondary/20' : ''} />
                <h2 className="font-heading font-semibold text-2xl text-foreground">{w.title}</h2>
                <p className="text-card-foreground leading-relaxed flex-1">{w.description}</p>
                {w.url ? (
                  <Button asChild variant="elevated" size="cta" radius="full" className={FOCUS_LIGHT}>
                    <a href={w.url} target="_blank" rel="noopener noreferrer">
                      {w.cta}
                      <ExternalLink aria-hidden="true" />
                    </a>
                  </Button>
                ) : (
                  <Button asChild variant="subtle" size="cta" radius="full" className={FOCUS_LIGHT}>
                    <a href={`mailto:${w.email}`}>
                      <Mail aria-hidden="true" />
                      {w.cta}
                    </a>
                  </Button>
                )}
              </Panel>
            </li>
          ))}
        </ul>

        <Panel className="p-6 sm:p-8">
          <h2 className="font-heading font-semibold text-xl text-foreground mb-4">תחומי הפעילות של מטיב</h2>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {ABOUT.activities.map((a) => (
              <li key={a} className="flex gap-2.5 text-foreground">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
                {a}
              </li>
            ))}
          </ul>
        </Panel>

        <div className="flex gap-3 rounded-2xl bg-muted p-5 text-sm text-muted-foreground">
          <ShieldCheck className="w-5 h-5 text-accent flex-shrink-0" aria-hidden="true" />
          <p>
            {DONATE.paymentNote} {DONATE.legalEntity}.
          </p>
        </div>
      </Container>
      <RepeatDoors />
    </div>
  );
}
