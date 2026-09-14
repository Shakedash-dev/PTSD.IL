import React from 'react';
import Disclosure from '@/components/patterns/Disclosure';
import { cn } from '@/lib/utils';
import { DemoLink, DemoMarkdown } from '@/pages/metiv-demos/shared/DemoChrome';
import { categoryLabel, courseStatus } from '../lib';
import { ArrowLink, DatePlate, FOCUS, StatusPill } from './primitives';

/**
 * A course as a wide editorial row: arch date plate, title and summary, facts.
 * @param {{ course: any, compact?: boolean }} props
 */
export function CourseRow({ course, compact = false }) {
  const status = courseStatus(course);
  const facts = [
    { label: 'פתיחה', value: course.startDate },
    { label: 'פורמט', value: course.format },
    { label: 'היקף', value: course.hours || course.duration },
    { label: 'מחיר', value: course.price },
  ].filter((f) => f.value);

  return (
    <article className="group relative grid grid-cols-[4.5rem_1fr] gap-x-5 gap-y-4 border-b border-border py-7 sm:grid-cols-[6rem_1fr] md:grid-cols-12 md:gap-x-8 md:py-9">
      <div className="row-span-2 md:col-span-2 md:row-span-1">
        <DatePlate
          iso={course.startDateISO}
          size={compact ? 'sm' : 'md'}
          className="w-full max-w-[8.5rem] transition-transform duration-500 group-hover:-translate-y-1 motion-reduce:transition-none"
        />
      </div>
      <div className="min-w-0 md:col-span-6 lg:col-span-7">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground">{categoryLabel(course.category)}</p>
        <h3
          className={cn(
            'mt-2 font-heading font-light leading-snug text-foreground transition-colors duration-300 group-hover:text-primary',
            compact ? 'text-xl md:text-2xl' : 'text-2xl md:text-[2rem]'
          )}
        >
          <DemoLink to={`/therapist/courses/${course.slug}`} className={cn('rounded-sm after:absolute after:inset-0', FOCUS)}>
            {course.title}
          </DemoLink>
        </h3>
        {!compact && <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{course.summary}</p>}
        {!compact && course.tags?.length > 0 && <p className="mt-3 text-sm text-muted-foreground">{course.tags.join(' · ')}</p>}
      </div>
      <div className="col-start-2 md:col-span-4 md:col-start-auto lg:col-span-3">
        <StatusPill status={status} />
        {facts.length > 0 && (
          <dl className="mt-3 space-y-1.5 text-sm">
            {facts.map((f) => (
              <div key={f.label} className="flex gap-2">
                <dt className="w-12 shrink-0 text-muted-foreground">{f.label}</dt>
                <dd className="text-foreground">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </article>
  );
}

/** @param {any} event */
function linkLabel(event) {
  if (event.external) return 'לעמוד באתר מטיב';
  if (event.link?.startsWith('/therapist/courses')) return 'לעמוד הקורס';
  return 'לפרטים';
}

/**
 * An event or news item as a row with a date plate.
 * @param {{ event: any }} props
 */
export function EventRow({ event }) {
  return (
    <article className="grid grid-cols-[4.5rem_1fr] gap-x-5 gap-y-3 border-b border-border py-7 sm:grid-cols-[6rem_1fr] md:grid-cols-12 md:gap-x-8">
      <div className="row-span-2 md:col-span-2 md:row-span-1">
        <DatePlate iso={event.dateISO} size="sm" fallback={event.date} className="w-full max-w-[7rem]" />
      </div>
      <div className="min-w-0 md:col-span-7">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground">
          {event.type} · {event.date}
        </p>
        <h3 className="mt-2 font-heading text-xl font-light leading-snug text-foreground md:text-2xl">{event.title}</h3>
        <p className="mt-2 leading-relaxed text-muted-foreground">{event.summary}</p>
        {event.body && (
          <Disclosure label="פרטים נוספים" variant="plain" size="tight" className="mt-4" labelClassName="text-sm">
            <DemoMarkdown className="rich-content text-sm text-foreground">{event.body}</DemoMarkdown>
          </Disclosure>
        )}
      </div>
      <div className="col-start-2 space-y-2 text-sm md:col-span-3 md:col-start-auto">
        {event.location && <p className="text-muted-foreground">{event.location}</p>}
        {event.price && <p className="text-foreground">{event.price}</p>}
        {event.link && <ArrowLink to={event.link}>{linkLabel(event)}</ArrowLink>}
      </div>
    </article>
  );
}
