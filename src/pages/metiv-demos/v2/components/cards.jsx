import React from 'react';
import { CalendarDays, MapPin, Clock, Wallet, Monitor, ArrowLeft, ExternalLink } from 'lucide-react';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { COURSE_CATEGORIES } from '@/pages/metiv-demos/shared/therapist';
import { cn } from '@/lib/utils';
import { FOCUS_DARK } from '../lib';
import { Icon, StatusPill, Tag, AreaDisclosure } from './ui';

// Cards shared across the professional area (and the dark band on the landing).

export const CATEGORY_ICON = { adults: 'Brain', 'children-family': 'Baby', organizations: 'Building2' };
export const categoryLabel = (key) => COURSE_CATEGORIES.find((c) => c.key === key)?.label || '';

/** @param {any} c course */
export function courseStatusKind(c) {
  if (c.registration?.status === 'open' && !c.isPast) return 'open';
  if (c.isPast) return 'past';
  return 'unknown';
}

/** Format facets derived from the free-text format fields. @param {any} c course */
export function courseFormats(c) {
  const text = [c.format, ...(c.formats || []).map((f) => f.format), ...(c.units || []).map((u) => u.format)].filter(Boolean).join(' ');
  const out = new Set();
  if (/פרונטלי|משולב/.test(text)) out.add('inperson');
  if (/זום|Zoom|אונליין|משולב/.test(text)) out.add('online');
  if (/בהתאמה/.test(text)) out.add('custom');
  return out;
}

export const FORMAT_LABELS = { inperson: 'פרונטלי', online: 'זום', custom: 'בהתאמה לארגון' };

/**
 * Course card for the dark area. The whole card is the link.
 * @param {{ course: any, className?: string }} props
 */
export function CourseCard({ course: c, className }) {
  const kind = courseStatusKind(c);
  const formats = [...courseFormats(c)].map((f) => FORMAT_LABELS[f]).join(' / ');
  return (
    <DemoLink
      to={`${ROUTES.courses}/${c.slug}`}
      className={cn(
        'group flex flex-col h-full rounded-super-sm overflow-hidden border bg-sanctuary-foreground/[0.06] border-sanctuary-foreground/15 text-sanctuary-foreground',
        'transition-all duration-300 hover:bg-sanctuary-foreground/[0.11] hover:border-sanctuary-foreground/35 motion-reduce:transition-none',
        FOCUS_DARK,
        className
      )}
    >
      <div className="relative h-24 bg-sanctuary-foreground/[0.07] flex items-start justify-between p-4 overflow-hidden">
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-sanctuary-foreground/85">
          <Icon name={CATEGORY_ICON[c.category]} className="w-4 h-4" />
          {categoryLabel(c.category)}
        </span>
        <StatusPill kind={kind} label={kind === 'unknown' ? (c.startDate ? 'מועד יעודכן' : 'פרטים בפנייה') : undefined} />
        <Icon
          name={CATEGORY_ICON[c.category]}
          className="absolute -bottom-6 end-4 w-24 h-24 text-sanctuary-foreground/[0.08] transition-transform duration-500 group-hover:scale-110 motion-reduce:transition-none"
        />
      </div>
      <div className="flex flex-col flex-1 p-5">
        <h3 className="font-heading font-semibold text-lg leading-snug">{c.title}</h3>
        <p className="mt-2 text-sm text-sanctuary-foreground/75 leading-relaxed line-clamp-3">{c.summary}</p>
        <ul className="mt-4 space-y-1.5 text-sm text-sanctuary-foreground/90">
          {c.startDate && (
            <li className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 flex-shrink-0 text-sanctuary-foreground/70" aria-hidden="true" />
              <span>{c.startDate}</span>
            </li>
          )}
          {formats && (
            <li className="flex items-center gap-2">
              <Monitor className="w-4 h-4 flex-shrink-0 text-sanctuary-foreground/70" aria-hidden="true" />
              <span>{formats}</span>
            </li>
          )}
          {(c.hours || c.duration) && (
            <li className="flex items-center gap-2">
              <Clock className="w-4 h-4 flex-shrink-0 text-sanctuary-foreground/70" aria-hidden="true" />
              <span className="line-clamp-1">{c.hours || c.duration}</span>
            </li>
          )}
          {c.price && (
            <li className="flex items-center gap-2">
              <Wallet className="w-4 h-4 flex-shrink-0 text-sanctuary-foreground/70" aria-hidden="true" />
              <span className="line-clamp-1">{c.price}</span>
            </li>
          )}
        </ul>
        <span className="mt-auto pt-5 inline-flex items-center gap-1.5 font-semibold text-sm">
          לפרטי הקורס
          <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
        </span>
      </div>
    </DemoLink>
  );
}

const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

/** @param {{ iso?: string, className?: string }} props */
export function DateBlock({ iso, className }) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-sanctuary-foreground text-sanctuary flex-shrink-0 leading-none',
        className
      )}
      aria-hidden="true"
    >
      <span className="font-heading font-semibold text-3xl">{d}</span>
      <span className="text-xs font-semibold mt-1">{MONTHS[m - 1]}</span>
      <span className="text-[0.65rem] mt-0.5">{y}</span>
    </div>
  );
}

/**
 * Event card (dark area).
 * @param {{ event: any, compact?: boolean }} props
 */
export function EventCard({ event: e, compact = false }) {
  const cta = e.link
    ? e.external
      ? (
        <a href={e.link} target="_blank" rel="noopener noreferrer" className={cn('inline-flex items-center gap-1.5 font-semibold text-sm underline-offset-4 hover:underline rounded', FOCUS_DARK)}>
          לעמוד באתר מטיב
          <ExternalLink className="w-4 h-4" aria-hidden="true" />
        </a>
      )
      : (
        <DemoLink to={e.link} className={cn('inline-flex items-center gap-1.5 font-semibold text-sm underline-offset-4 hover:underline rounded', FOCUS_DARK)}>
          {e.courseSlug ? 'לפרטי הקורס' : 'לפרטים'}
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        </DemoLink>
      )
    : null;

  return (
    <article className="flex gap-4 sm:gap-5 rounded-super-sm border border-sanctuary-foreground/15 bg-sanctuary-foreground/[0.06] p-4 sm:p-5 text-sanctuary-foreground">
      <DateBlock iso={e.dateISO} className={compact ? 'w-16 h-16 [&>span:first-child]:text-2xl' : ''} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <Tag>{e.type}</Tag>
          {e.isPast && <StatusPill kind="past" />}
        </div>
        <h3 className={cn('font-heading font-semibold leading-snug', compact ? 'text-base' : 'text-lg')}>{e.title}</h3>
        <p className="text-sm text-sanctuary-foreground/80 mt-1">{e.date}</p>
        {!compact && <p className="text-sm text-sanctuary-foreground/80 leading-relaxed mt-2">{e.summary}</p>}
        {!compact && (e.location || e.price) && (
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-sanctuary-foreground/85">
            {e.location && (
              <li className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4" aria-hidden="true" />
                {e.location}
              </li>
            )}
            {e.price && (
              <li className="inline-flex items-center gap-1.5">
                <Wallet className="w-4 h-4" aria-hidden="true" />
                {e.price}
              </li>
            )}
          </ul>
        )}
        {!compact && e.body && (
          <AreaDisclosure label="פרטים מלאים" size="tight" className="mt-3">
            <p className="text-sm leading-relaxed whitespace-pre-line">{e.body.replace(/\*\*/g, '')}</p>
          </AreaDisclosure>
        )}
        {cta && <div className="mt-3">{cta}</div>}
      </div>
    </article>
  );
}
