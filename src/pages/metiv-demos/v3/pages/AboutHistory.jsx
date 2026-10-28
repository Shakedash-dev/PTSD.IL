import React from 'react';
import { Globe2 } from 'lucide-react';
import Disclosure from '@/components/patterns/Disclosure';
import PageHeaderV3 from '../components/PageHeaderV3';
import { fmt, useCopy, useMetiv } from '../content/MetivContent';
import { AboutTabs } from '../components/AboutParts';
import { Band, JourneySteps, SectionHeading, StatusPill } from '../components/kit';

// "The story of Metiv": what Metiv is for, how it started and what it does today.
export default function AboutHistory() {
  const c = useCopy('aboutHistory');
  const { ABOUT, FACTS, ORG, ROUTE_META } = useMetiv();
  return (
    <div className="bg-background">
      <PageHeaderV3
        tone="muted"
        eyebrow={ROUTE_META.about?.label}
        title={c.title}
        subtitle={fmt(c.subtitle, { year: ABOUT.timeline?.[0]?.year ?? '', address: ORG.address })}
        short={[]}
      />
      <AboutTabs />

      <Band tone="canvas" width="default" labelledBy="history-mission">
        <SectionHeading id="history-mission" eyebrow={c.missionEyebrow} title={ORG.headline} />
        <p className="text-xl text-foreground leading-relaxed">{ORG.mission}</p>
        <div className="mt-6 space-y-4 text-lg text-foreground leading-relaxed">
          {ABOUT.activitiesIntro.map((/** @type {string} */ p, /** @type {number} */ i) => <p key={i}>{p}</p>)}
        </div>
      </Band>

      <Band tone="card" labelledBy="history-facts">
        <h2 id="history-facts" className="sr-only">{c.factsTitle}</h2>
        <dl className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          {FACTS.map((/** @type {any} */ f) => (
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
            <SectionHeading id="history-timeline" eyebrow={c.timelineEyebrow} title={c.timelineTitle} className="mb-6" />
            <JourneySteps label={c.timelineTitle} steps={ABOUT.timeline.map((/** @type {any} */ t) => ({ title: t.year, text: t.text }))} />
          </div>
          <div>
            <p className="font-heading font-semibold text-2xl text-foreground mb-4">{c.historyTitle}</p>
            <div className="space-y-4 text-lg text-foreground leading-relaxed">
              {ABOUT.history.slice(0, 2).map((/** @type {string} */ p, /** @type {number} */ i) => <p key={i}>{p}</p>)}
            </div>
            <Disclosure label={c.historyMore} variant="soft" size="compact" className="mt-5">
              <div className="space-y-4 text-foreground leading-relaxed">{ABOUT.history.slice(2).map((/** @type {string} */ p, /** @type {number} */ i) => <p key={i}>{p}</p>)}</div>
            </Disclosure>
          </div>
        </div>
      </Band>

      <Band tone="muted" labelledBy="history-activities">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <SectionHeading id="history-activities" eyebrow={c.activitiesEyebrow} title={c.activitiesTitle} className="mb-4" />
            <ul className="space-y-2 text-foreground">
              {ABOUT.activities.map((/** @type {string} */ a, /** @type {number} */ i) => <li key={i} className="flex gap-2"><span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" aria-hidden="true" />{a}</li>)}
            </ul>
          </div>
          <div className="rounded-super bg-card p-6">
            <p className="font-heading font-semibold text-xl text-foreground mb-3">{c.communitiesTitle}</p>
            <ul className="flex flex-wrap gap-2">{ABOUT.communities.map((/** @type {string} */ x, /** @type {number} */ i) => <li key={i}><StatusPill tone="primary">{x}</StatusPill></li>)}</ul>
          </div>
          <div className="rounded-super bg-card p-6">
            <p className="flex items-center gap-2 font-heading font-semibold text-xl text-foreground mb-3"><Globe2 className="w-5 h-5 text-accent" aria-hidden="true" />{c.disasterTitle}</p>
            <ul className="flex flex-wrap gap-2">{ABOUT.partnersAbroad.map((/** @type {string} */ x, /** @type {number} */ i) => <li key={i}><StatusPill tone="muted">{x}</StatusPill></li>)}</ul>
          </div>
        </div>
      </Band>
    </div>
  );
}
