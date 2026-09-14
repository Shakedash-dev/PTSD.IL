import React, { useMemo, useState } from 'react';
import ChoiceChip from '@/components/patterns/ChoiceChip';
import { useDemoChrome } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { UPCOMING_EVENTS, PAST_EVENTS } from '@/pages/metiv-demos/shared/therapist';
import { cn } from '@/lib/utils';
import { ArrowLink, Container, EmptyState, SectionTitle, Tag, chipClass } from '../components/ui';
import { EventCard } from '../components/cards';

const TYPES = [...new Set(PAST_EVENTS.map((e) => e.type))];

export default function Events() {
  const { PageHeader } = useDemoChrome();
  const [type, setType] = useState('all');

  const groups = useMemo(() => {
    const list = PAST_EVENTS.filter((e) => type === 'all' || e.type === type).sort((a, b) => (b.dateISO || '').localeCompare(a.dateISO || ''));
    const byYear = new Map();
    list.forEach((e) => {
      const y = (e.dateISO || '').slice(0, 4) || 'ללא תאריך';
      if (!byYear.has(y)) byYear.set(y, []);
      byYear.get(y).push(e);
    });
    return [...byYear.entries()];
  }, [type]);

  return (
    <div>
      <PageHeader
        eyebrow="אירועים ועדכונים"
        title="אירועים, מחזורים ועדכונים"
        subtitle="מחזורי קורסים, סדנאות וכנסים של מטיב: מה קורה בקרוב, ומה התקיים."
        meta={
          <>
            <Tag className="text-sm px-3 py-1">{UPCOMING_EVENTS.length} בקרוב</Tag>
            <Tag className="text-sm px-3 py-1">{PAST_EVENTS.length} התקיימו</Tag>
          </>
        }
      />
      <Container className="py-12 space-y-16">
        <section aria-labelledby="upcoming">
          <SectionTitle id="upcoming" eyebrow="בקרוב" title="האירועים הקרובים" action={<ArrowLink to={ROUTES.courses}>לקטלוג הקורסים</ArrowLink>} />
          {UPCOMING_EVENTS.length === 0 ? (
            <EmptyState title="אין כרגע אירועים קרובים" text="מחזורים חדשים יתפרסמו כאן." />
          ) : (
            <ul className="grid gap-4 lg:grid-cols-2">
              {UPCOMING_EVENTS.map((e) => (
                <li key={e.slug}>
                  <EventCard event={e} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="past">
          <SectionTitle
            id="past"
            eyebrow="ארכיון"
            title="אירועים שהתקיימו"
            action={
              <div role="group" aria-label="סוג אירוע" className="flex flex-wrap gap-2">
                {[{ key: 'all', label: 'הכל' }, ...TYPES.map((t) => ({ key: t, label: t }))].map((t) => (
                  <ChoiceChip key={t.key} selected={type === t.key} onClick={() => setType(t.key)} className={chipClass(type === t.key, true)}>
                    {t.label}
                  </ChoiceChip>
                ))}
              </div>
            }
          />
          <div className="space-y-10" aria-live="polite">
            {groups.map(([year, list]) => (
              <div key={year} className="grid gap-4 lg:grid-cols-[8rem_minmax(0,1fr)]">
                <h3 className={cn('font-heading font-semibold text-4xl text-sanctuary-foreground/80 lg:sticky lg:top-[170px] h-fit')}>{year}</h3>
                <ul className="grid gap-3 md:grid-cols-2">
                  {list.map((e) => (
                    <li key={e.slug}>
                      <EventCard event={e} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </Container>
    </div>
  );
}
