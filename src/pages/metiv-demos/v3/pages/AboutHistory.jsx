import React from 'react';
import { Globe2 } from 'lucide-react';
import Disclosure from '@/components/patterns/Disclosure';
import { ABOUT, FACTS, ORG } from '@/pages/metiv-demos/shared/therapist';
import PageHeaderV3 from '../components/PageHeaderV3';
import { AboutTabs } from '../components/AboutParts';
import { Band, JourneySteps, SectionHeading, StatusPill } from '../components/kit';

// "הסיפור של מטיב": what Metiv is for, how it started and what it does today.
export default function AboutHistory() {
  return (
    <div className="bg-background">
      <PageHeaderV3
        tone="muted"
        eyebrow="על מטיב"
        title="הסיפור של מטיב"
        subtitle={`הוקם ב-${ABOUT.timeline[0].year} בירושלים, ופועל היום מ${ORG.address}.`}
        short={[]}
      />
      <AboutTabs />

      <Band tone="canvas" width="default" labelledBy="history-mission">
        <SectionHeading id="history-mission" eyebrow="המטרה שלנו" title={ORG.headline} />
        <p className="text-xl text-foreground leading-relaxed">{ORG.mission}</p>
        <div className="mt-6 space-y-4 text-lg text-foreground leading-relaxed">
          {ABOUT.activitiesIntro.map((p) => <p key={p}>{p}</p>)}
        </div>
      </Band>

      <Band tone="card" labelledBy="history-facts">
        <h2 id="history-facts" className="sr-only">מטיב במספרים</h2>
        <dl className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          {FACTS.map((f) => (
            <div key={f.label} className="rounded-super bg-muted p-5 text-center">
              <dt className="sr-only">{f.label}</dt>
              <dd>
                <span className="block font-heading font-semibold text-4xl text-accent" dir="ltr">{f.value}</span>
                <span className="block mt-1 text-foreground text-sm leading-snug">{f.label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </Band>

      <Band tone="canvas" labelledBy="history-timeline">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div>
            <SectionHeading id="history-timeline" eyebrow="הדרך של מטיב" title="ציוני דרך" className="mb-6" />
            <JourneySteps label="ציוני דרך" steps={ABOUT.timeline.map((t) => ({ title: t.year, text: t.text }))} />
          </div>
          <div>
            <p className="font-heading font-semibold text-2xl text-foreground mb-4">ההיסטוריה</p>
            <div className="space-y-4 text-lg text-foreground leading-relaxed">
              {ABOUT.history.slice(0, 2).map((p) => <p key={p}>{p}</p>)}
            </div>
            <Disclosure label="להמשך ההיסטוריה" variant="soft" size="compact" className="mt-5">
              <div className="space-y-4 text-foreground leading-relaxed">{ABOUT.history.slice(2).map((p) => <p key={p}>{p}</p>)}</div>
            </Disclosure>
          </div>
        </div>
      </Band>

      <Band tone="muted" labelledBy="history-activities">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <SectionHeading id="history-activities" eyebrow="מה אנחנו עושים" title="תחומי הפעילות" className="mb-4" />
            <ul className="space-y-2 text-foreground">
              {ABOUT.activities.map((a) => <li key={a} className="flex gap-2"><span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" aria-hidden="true" />{a}</li>)}
            </ul>
          </div>
          <div className="rounded-super bg-card p-6">
            <p className="font-heading font-semibold text-xl text-foreground mb-3">קהילות שאנחנו עובדים איתן</p>
            <ul className="flex flex-wrap gap-2">{ABOUT.communities.map((c) => <li key={c}><StatusPill tone="primary">{c}</StatusPill></li>)}</ul>
          </div>
          <div className="rounded-super bg-card p-6">
            <p className="flex items-center gap-2 font-heading font-semibold text-xl text-foreground mb-3"><Globe2 className="w-5 h-5 text-accent" aria-hidden="true" />התערבות באזורי אסון</p>
            <ul className="flex flex-wrap gap-2">{ABOUT.partnersAbroad.map((c) => <li key={c}><StatusPill tone="muted">{c}</StatusPill></li>)}</ul>
          </div>
        </div>
      </Band>
    </div>
  );
}
