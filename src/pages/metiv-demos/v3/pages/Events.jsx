import React, { useState } from 'react';
import { ArrowLeft, Coins, MapPin } from 'lucide-react';
import Disclosure from '@/components/patterns/Disclosure';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { cn } from '@/lib/utils';
import PageHeaderV3 from '../components/PageHeaderV3';
import { Band, ChipQuestion, EmptyState, ExternalLink, FWD, PILL_OUTLINE, SectionHeading, StatusPill, TEXT_LINK } from '../components/kit';
import { fmt, isExternalLink, useCopy, useMetiv } from '../content/MetivContent';

/** @typedef {import('@/pages/metiv-demos/shared/therapist/articles.js').MetivEvent} MetivEvent */

/** @param {{ event: MetivEvent }} props */
function EventCard({ event }) {
  const c = useCopy('events');
  const [d, m] = (event.dateISO || '').split('-').slice(1).reverse();
  return (
    <li className={cn('flex gap-4 rounded-super bg-card border p-5 sm:p-6', event.isPast ? 'border-border' : 'border-primary/40 shadow-card')}>
      <div className={cn('w-16 flex-shrink-0 self-start rounded-2xl text-center py-2', event.isPast ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground')} aria-hidden="true">
        <span className="block font-heading font-semibold text-2xl leading-none">{d || '·'}</span>
        <span className="block text-xs mt-1">{m ? fmt(c.month, { n: Number(m) }) : ''}</span>
        <span className="block text-xs">{(event.dateISO || '').slice(0, 4)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone="primary">{event.type}</StatusPill>
          {!event.isPast && <StatusPill tone="success">{c.soon}</StatusPill>}
          <span className="text-sm text-muted-foreground">{event.date}</span>
        </div>
        <h3 className="mt-2 font-heading font-semibold text-xl text-foreground leading-snug">{event.title}</h3>
        <p className="mt-1 text-foreground leading-relaxed">{event.summary}</p>
        {(event.location || event.price) && (
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {event.location && <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4" aria-hidden="true" />{event.location}</span>}
            {event.price && <span className="inline-flex items-center gap-1.5"><Coins className="w-4 h-4" aria-hidden="true" />{event.price}</span>}
          </p>
        )}
        {event.body && (
          <Disclosure label={c.moreDetails} variant="plain" size="tight" className="mt-3">
            <p className="text-foreground leading-relaxed whitespace-pre-line">{event.body}</p>
          </Disclosure>
        )}
        {event.link && (
          <div className="mt-3">
            {isExternalLink(event.link) ? (
              <ExternalLink href={event.link} className={TEXT_LINK}>{c.detailsOnMetiv}</ExternalLink>
            ) : (
              <DemoLink to={event.link} className={cn('inline-flex items-center gap-1', TEXT_LINK)}>{c.details} <ArrowLeft className={cn('w-4 h-4', FWD)} aria-hidden="true" /></DemoLink>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export default function Events() {
  const { EVENTS, PAST_EVENTS, UPCOMING_EVENTS, THERAPIST_HUB } = useMetiv();
  const c = useCopy('events');
  // Event types in order of first appearance. They are display strings, the
  // same in every item of a language, so items group by plain equality.
  /** @type {string[]} */
  const TYPES = [...new Set(EVENTS.map((/** @type {MetivEvent} */ e) => e.type).filter(Boolean))];
  const [type, setType] = useState('all');
  const filter = (/** @type {MetivEvent[]} */ list) => list.filter((e) => type === 'all' || e.type === type);
  const upcoming = filter(UPCOMING_EVENTS);
  const past = filter(PAST_EVENTS);
  const years = [...new Set(past.map((e) => (e.dateISO || '').slice(0, 4)))];

  return (
    <div className="bg-background">
      <PageHeaderV3
        tone="muted"
        eyebrow={c.eyebrow}
        title={c.title}
        subtitle={c.subtitle}
        short={[fmt(c.shortCount, { upcoming: UPCOMING_EVENTS.length, past: PAST_EVENTS.length }), c.shortFilter, c.shortCourseLink]}
      />
      <Band tone="canvas" width="default" labelledBy="ev-upcoming">
        <p className="text-sm font-semibold text-muted-foreground mb-2">{c.typePrompt}</p>
        <ChipQuestion
          legend={c.typeLegend}
          value={type}
          onChange={setType}
          className="mb-10"
          options={[{ key: 'all', label: c.all, count: EVENTS.length }, ...TYPES.map((t) => ({ key: t, label: t, count: EVENTS.filter((/** @type {MetivEvent} */ e) => e.type === t).length }))]}
        />

        <SectionHeading id="ev-upcoming" as="h2" title={c.upcomingTitle} className="mb-5" />
        {upcoming.length ? (
          <ul className="space-y-4">{upcoming.map((/** @type {MetivEvent} */ e) => <EventCard key={e.slug} event={e} />)}</ul>
        ) : (
          <EmptyState title={c.upcomingEmptyTitle} text={c.upcomingEmptyText} action={<ExternalLink href={THERAPIST_HUB.cta.url} className={PILL_OUTLINE}>{THERAPIST_HUB.cta.label}</ExternalLink>} />
        )}

        <SectionHeading id="ev-past" as="h2" title={c.pastTitle} className="mt-16 mb-5" />
        {past.length === 0 && <EmptyState title={c.pastEmptyTitle} />}
        {years.map((y) => (
          <section key={y} aria-label={y || c.noYear} className="mb-8">
            <h3 className="font-heading font-semibold text-lg text-muted-foreground mb-3 flex items-center gap-3">
              {y || c.noYear}
              <span aria-hidden="true" className="flex-1 border-t-2 border-dashed border-border" />
            </h3>
            <ul className="space-y-3">{past.filter((/** @type {MetivEvent} */ e) => (e.dateISO || '').slice(0, 4) === y).map((/** @type {MetivEvent} */ e) => <EventCard key={e.slug} event={e} />)}</ul>
          </section>
        ))}
      </Band>
    </div>
  );
}
