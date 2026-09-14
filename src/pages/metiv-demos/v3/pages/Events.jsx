import React, { useState } from 'react';
import { ArrowLeft, Coins, MapPin } from 'lucide-react';
import Disclosure from '@/components/patterns/Disclosure';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { EVENTS, PAST_EVENTS, UPCOMING_EVENTS, THERAPIST_HUB } from '@/pages/metiv-demos/shared/therapist';
import { cn } from '@/lib/utils';
import PageHeaderV3 from '../components/PageHeaderV3';
import { Band, ChipQuestion, EmptyState, ExternalLink, PILL_OUTLINE, SectionHeading, StatusPill, TEXT_LINK } from '../components/kit';

/** @typedef {import('@/pages/metiv-demos/shared/therapist/articles.js').MetivEvent} MetivEvent */

const TYPES = ['מחזור קורס', 'סדנה', 'כנס', 'חדשות'];

/** @param {{ event: MetivEvent }} props */
function EventCard({ event }) {
  const [d, m] = (event.dateISO || '').split('-').slice(1).reverse();
  return (
    <li className={cn('flex gap-4 rounded-super bg-card border p-5 sm:p-6', event.isPast ? 'border-border' : 'border-primary/40 shadow-card')}>
      <div className={cn('w-16 flex-shrink-0 self-start rounded-2xl text-center py-2', event.isPast ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground')} aria-hidden="true">
        <span className="block font-heading font-semibold text-2xl leading-none">{d || '·'}</span>
        <span className="block text-xs mt-1">{m ? `חודש ${Number(m)}` : ''}</span>
        <span className="block text-xs">{(event.dateISO || '').slice(0, 4)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone="primary">{event.type}</StatusPill>
          {!event.isPast && <StatusPill tone="success">בקרוב</StatusPill>}
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
          <Disclosure label="פרטים נוספים" variant="plain" size="tight" className="mt-3">
            <p className="text-foreground leading-relaxed whitespace-pre-line">{event.body}</p>
          </Disclosure>
        )}
        {event.link && (
          <div className="mt-3">
            {event.external ? (
              <ExternalLink href={event.link} className={TEXT_LINK}>לפרטים באתר מטיב</ExternalLink>
            ) : (
              <DemoLink to={event.link} className={cn('inline-flex items-center gap-1', TEXT_LINK)}>לפרטים <ArrowLeft className="w-4 h-4" aria-hidden="true" /></DemoLink>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export default function Events() {
  const [type, setType] = useState('all');
  const filter = (/** @type {MetivEvent[]} */ list) => list.filter((e) => type === 'all' || e.type === type);
  const upcoming = filter(UPCOMING_EVENTS);
  const past = filter(PAST_EVENTS);
  const years = [...new Set(past.map((e) => (e.dateISO || '').slice(0, 4)))];

  return (
    <div className="bg-background">
      <PageHeaderV3
        tone="muted"
        eyebrow="אירועים ועדכונים"
        title="מה קרוב, ומה כבר היה"
        subtitle="מחזורי קורסים, סדנאות, כנסים וחדשות מטיב."
        short={[`${UPCOMING_EVENTS.length} אירועים קרובים ו-${PAST_EVENTS.length} שהתקיימו.`, 'אפשר לסנן לפי סוג.', 'לאירועים שקשורים לקורס יש קישור לעמוד הקורס.']}
      />
      <Band tone="canvas" width="default" labelledBy="ev-upcoming">
        <p className="text-sm font-semibold text-muted-foreground mb-2">איזה סוג מעניין אותך?</p>
        <ChipQuestion
          legend="סוג אירוע"
          value={type}
          onChange={setType}
          className="mb-10"
          options={[{ key: 'all', label: 'הכל', count: EVENTS.length }, ...TYPES.map((t) => ({ key: t, label: t, count: EVENTS.filter((e) => e.type === t).length }))]}
        />

        <SectionHeading id="ev-upcoming" as="h2" title="בקרוב" className="mb-5" />
        {upcoming.length ? (
          <ul className="space-y-4">{upcoming.map((e) => <EventCard key={e.slug} event={e} />)}</ul>
        ) : (
          <EmptyState title="אין כרגע אירועים קרובים מהסוג הזה" text="אפשר להשאיר פרטים ולקבל עדכון." action={<ExternalLink href={THERAPIST_HUB.cta.url} className={PILL_OUTLINE}>{THERAPIST_HUB.cta.label}</ExternalLink>} />
        )}

        <SectionHeading id="ev-past" as="h2" title="התקיימו" className="mt-16 mb-5" />
        {past.length === 0 && <EmptyState title="אין אירועים קודמים מהסוג הזה" />}
        {years.map((y) => (
          <section key={y} aria-label={y || 'ללא שנה'} className="mb-8">
            <h3 className="font-heading font-semibold text-lg text-muted-foreground mb-3 flex items-center gap-3">
              {y || 'ללא שנה'}
              <span aria-hidden="true" className="flex-1 border-t-2 border-dashed border-border" />
            </h3>
            <ul className="space-y-3">{past.filter((e) => (e.dateISO || '').slice(0, 4) === y).map((e) => <EventCard key={e.slug} event={e} />)}</ul>
          </section>
        ))}
      </Band>
    </div>
  );
}
