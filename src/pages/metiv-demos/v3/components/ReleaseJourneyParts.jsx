import React from 'react';
import { cn } from '@/lib/utils';
import { useMetiv } from '../content/MetivContent';
import { CHIP_LINK, ExternalLink } from './kit';

// Pieces shared by the two מסע שחרור pages. The programme data
// (RELEASE_JOURNEY, RELEASE_JOURNEY_STATS, JOURNEY_MODELS, ...) comes from useMetiv().

/**
 * @typedef {{ value: string, label: string }} Stat
 * @typedef {{ title: string, text: string }} Workshop
 * @typedef {{ key: string, label: string, title: string, summary: string, duration: string, workshops: Workshop[] }} JourneyModel
 */

/**
 * A row of counts. Counts only: nothing here describes an outcome.
 * @param {{ stats: Stat[], className?: string }} props
 */
export function StatStrip({ stats, className = '' }) {
  return (
    <dl className={cn('grid gap-4 grid-cols-2', stats.length > 4 ? 'lg:grid-cols-5' : 'lg:grid-cols-4', className)}>
      {stats.map((s) => (
        <div key={s.label} className="rounded-super bg-muted p-5 text-center">
          <dt className="sr-only">{s.label}</dt>
          <dd>
            <span className="block font-heading font-semibold text-4xl text-accent" dir="ltr">{s.value}</span>
            <span className="block mt-1 text-foreground text-sm leading-snug">{s.label}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** The programme's social pages, as chips. */
export function SocialChips({ className = '' }) {
  const { RELEASE_JOURNEY } = useMetiv();
  /** @type {{ label: string, url: string }[]} */
  const social = RELEASE_JOURNEY?.social ?? [];
  return (
    <ul className={cn('flex flex-wrap gap-2', className)}>
      {social.map((s) => (
        <li key={s.url}><ExternalLink href={s.url} className={CHIP_LINK}>{s.label}</ExternalLink></li>
      ))}
    </ul>
  );
}
