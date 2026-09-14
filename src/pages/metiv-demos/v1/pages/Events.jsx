import React, { useState } from 'react';
import ChoiceChip from '@/components/patterns/ChoiceChip';
import { IMAGES } from '@/lib/images';
import { EVENTS, PAST_EVENTS, UPCOMING_EVENTS } from '@/pages/metiv-demos/shared/therapist';
import { PageHeaderV1 } from '../components/Chrome';
import { EventRow } from '../components/Rows';
import { Chapter, ChapterHead, EmptyState, useV1Title } from '../components/primitives';

const TYPES = ['מחזור קורס', 'סדנה', 'כנס', 'חדשות'];

export default function Events() {
  useV1Title('חדשות ואירועים');
  const [type, setType] = useState('all');
  const past = PAST_EVENTS.filter((e) => type === 'all' || e.type === type)
    .sort((a, b) => (b.dateISO || '').localeCompare(a.dateISO || ''));
  const years = [...new Set(past.map((e) => (e.dateISO || '').slice(0, 4)))];

  return (
    <>
      <PageHeaderV1
        size="editorial"
        align="start"
        tone="canvas"
        eyebrow="מטיב · חדשות ואירועים"
        title="אירועים ועדכונים"
        subtitle="מחזורי קורסים, סדנאות, כנסים ועדכונים של מטיב, קרובים ושהתקיימו."
        image={IMAGES.calming_grounding}
      />

      <Chapter rule={false}>
        <ChapterHead number="01" label="בקרוב" title="אירועים קרובים" />
        {UPCOMING_EVENTS.length === 0 ? (
          <EmptyState title="אין כרגע אירועים קרובים" text="מועדים חדשים יפורסמו כאן." />
        ) : (
          <div className="border-t border-border">
            {UPCOMING_EVENTS.map((e) => (
              <EventRow key={e.slug} event={e} />
            ))}
          </div>
        )}
      </Chapter>

      <Chapter>
        <ChapterHead number="02" label="ארכיון" title="התקיימו" lead="מחזורים, סדנאות וכנסים קודמים, מהחדש לישן." />
        <div role="group" aria-label="סינון לפי סוג" className="mb-8 flex flex-wrap gap-1.5">
          {['all', ...TYPES].map((t) => {
            const n = t === 'all' ? PAST_EVENTS.length : PAST_EVENTS.filter((e) => e.type === t).length;
            return (
              <ChoiceChip key={t} size="sm" selected={type === t} onClick={() => setType(t)}>
                {t === 'all' ? 'הכל' : t}
                <span className="tabular-nums opacity-75">{n}</span>
              </ChoiceChip>
            );
          })}
        </div>
        {past.length === 0 ? (
          <EmptyState title="אין פריטים מהסוג הזה" />
        ) : (
          years.map((y) => (
            <section key={y} className="mt-10 first:mt-0">
              <h3 className="flex items-baseline gap-4 font-heading text-4xl font-light tabular-nums text-foreground">
                {y}
                <span className="text-sm text-muted-foreground">{past.filter((e) => (e.dateISO || '').startsWith(y)).length} פריטים</span>
              </h3>
              <div className="mt-4 border-t border-border">
                {past.filter((e) => (e.dateISO || '').startsWith(y)).map((e) => (
                  <EventRow key={e.slug} event={e} />
                ))}
              </div>
            </section>
          ))
        )}
        <p className="mt-8 text-xs text-muted-foreground">סך הכל {EVENTS.length} פריטים.</p>
      </Chapter>
    </>
  );
}
