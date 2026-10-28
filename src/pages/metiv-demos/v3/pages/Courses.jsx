import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock, MonitorSmartphone, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { cn } from '@/lib/utils';
import PageHeaderV3 from '../components/PageHeaderV3';
import { Band, ChipQuestion, EmptyState, ExternalLink, FOCUS, FWD, NUDGE, PILL_OUTLINE, SectionHeading, StatusPill, TEXT_LINK } from '../components/kit';
import { courseFormatKinds, courseStatus, nextDate, STATUS_ORDER } from '../lib';
import { fmt, useCopy, useMetiv } from '../content/MetivContent';

/** @typedef {import('@/pages/metiv-demos/shared/therapist/courses.js').Course} Course */

/** @param {Record<string, string>} c */
const audienceShort = (c) => ({ adults: c.audienceAdults, 'children-family': c.audienceChildrenFamily, organizations: c.audienceOrganizations });
/** @param {Record<string, string>} c */
const formatShort = (c) => ({ inperson: c.formatInperson, online: c.formatOnline });

/**
 * Delivery kinds of a course, read from its Hebrew row: the format text is
 * matched against Hebrew words, which a translated row does not have.
 * @param {Course} course
 * @param {Map<string, Course>} heByKey
 */
const formatKinds = (course, heByKey) => courseFormatKinds(heByKey.get(/** @type {any} */ (course)._key) || course);

/**
 * @param {Course} c
 * @param {{ audience: string, format: string, when: string }} f
 * @param {Map<string, Course>} heByKey
 */
function matches(c, f, heByKey) {
  if (f.audience !== 'any' && c.category !== f.audience) return false;
  if (f.format !== 'any') {
    const kinds = formatKinds(c, heByKey);
    if (!kinds.has(/** @type {any} */ (f.format)) && !kinds.has('custom')) return false;
  }
  const status = courseStatus(c).key;
  if (f.when === 'open' && status !== 'open') return false;
  if (f.when === 'active' && status === 'closed') return false;
  return true;
}

/** @param {{ n: number, total: number, question: string, children: React.ReactNode, last?: boolean }} props */
function FinderStep({ n, total, question, children, last = false }) {
  const c = useCopy('courses');
  return (
    <li className="relative flex gap-4 lg:flex-col lg:gap-3">
      {!last && (
        <span aria-hidden="true" className="absolute start-5 top-12 -bottom-6 border-s-2 border-dashed border-primary/40 lg:hidden" />
      )}
      <div className="flex items-center gap-3">
        <span className="relative z-10 w-10 h-10 rounded-full bg-primary text-primary-foreground font-heading font-semibold flex items-center justify-center flex-shrink-0">{n}</span>
        {!last && <span aria-hidden="true" className="hidden lg:block flex-1 border-t-2 border-dashed border-primary/40" />}
      </div>
      <div className="flex-1 min-w-0 pb-2">
        <p className="text-xs font-semibold text-muted-foreground">{fmt(c.stepOf, { n, total })}</p>
        <p className="font-heading font-semibold text-lg text-foreground mb-3">{question}</p>
        {children}
      </div>
    </li>
  );
}

/** @param {{ course: Course, reasons: string[], categoryLabel: string, kinds: ('inperson'|'online'|'custom')[] }} props */
function CourseCard({ course, reasons, categoryLabel, kinds }) {
  const c = useCopy('courses');
  const FORMAT_SHORT = formatShort(c);
  const status = courseStatus(course);
  const date = nextDate(course);
  return (
    <DemoLink
      to={`${ROUTES.courses}/${course.slug}`}
      className={cn('group flex h-full flex-col rounded-super bg-card border border-border p-6 shadow-card hover:shadow-card-hover hover:border-primary/50 hover:-translate-y-0.5 transition-natural', FOCUS, status.key === 'closed' && 'bg-card/70')}
    >
      <span className="flex flex-wrap items-center gap-2">
        <StatusPill tone="primary">{categoryLabel}</StatusPill>
        <StatusPill tone={status.tone}>{status.label}</StatusPill>
      </span>
      <span className="mt-3 font-heading font-semibold text-xl text-foreground leading-snug">{course.title}</span>
      <span className="mt-2 text-muted-foreground leading-relaxed">{course.summary}</span>
      <span className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-foreground">
        {date && <span className="inline-flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-accent" aria-hidden="true" />{date}</span>}
        <span className="inline-flex items-center gap-1.5">
          <MonitorSmartphone className="w-4 h-4 text-accent" aria-hidden="true" />
          {kinds.includes('custom') ? course.format || c.formatCustom : kinds.map((k) => FORMAT_SHORT[/** @type {'inperson'|'online'} */ (k)]).join(c.formatOr)}
        </span>
        {(course.hours || course.duration) && (
          <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4 text-accent" aria-hidden="true" />{course.duration || course.hours}</span>
        )}
      </span>
      {reasons.length > 0 && (
        <span className="mt-4 flex items-start gap-2 rounded-2xl bg-muted px-3 py-2 text-sm text-foreground">
          <Sparkles className="w-4 h-4 mt-0.5 text-secondary flex-shrink-0" aria-hidden="true" />
          <span><span className="font-semibold">{c.whyFits}</span>{reasons.join(' · ')}</span>
        </span>
      )}
      <span className="mt-auto pt-5 inline-flex items-center gap-1 text-sm font-semibold text-accent">
        {c.detailsAndRegister} <ArrowLeft className={cn('w-4 h-4', FWD, NUDGE)} aria-hidden="true" />
      </span>
    </DemoLink>
  );
}

export default function Courses() {
  const { COURSES, COURSE_CATEGORIES, THERAPIST_HUB, he } = useMetiv();
  const c = useCopy('courses');
  const AUDIENCE_SHORT = audienceShort(c);
  const FORMAT_SHORT = formatShort(c);
  /** @type {Record<string, string>} */
  const CATEGORY_LABEL = Object.fromEntries(COURSE_CATEGORIES.map((/** @type {any} */ x) => [x.key, x.label]));
  /** @type {Map<string, Course>} */
  const heByKey = useMemo(() => new Map((he.COURSES ?? []).map((/** @type {any} */ x) => [x._key, x])), [he]);
  const [params, setParams] = useSearchParams();
  const filters = {
    audience: params.get('audience') || 'any',
    format: params.get('format') || 'any',
    when: params.get('when') || 'any',
  };
  const anyFilter = filters.audience !== 'any' || filters.format !== 'any' || filters.when !== 'any';

  /** @param {'audience'|'format'|'when'} key @param {string} value */
  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === 'any') next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };
  const reset = () => setParams(new URLSearchParams(), { replace: true });

  const results = useMemo(
    () =>
      COURSES.filter((/** @type {Course} */ x) => matches(x, filters, heByKey)).sort(
        (/** @type {Course} */ a, /** @type {Course} */ b) => STATUS_ORDER[courseStatus(a).key] - STATUS_ORDER[courseStatus(b).key]
      ),
    [COURSES, heByKey, filters.audience, filters.format, filters.when]
  );
  const active = results.filter((/** @type {Course} */ x) => courseStatus(x).key !== 'closed');
  const past = results.filter((/** @type {Course} */ x) => courseStatus(x).key === 'closed');

  const reasons = [
    filters.audience !== 'any' ? fmt(c.reasonAudience, { audience: AUDIENCE_SHORT[/** @type {keyof typeof AUDIENCE_SHORT} */ (filters.audience)] ?? '' }) : '',
    filters.format !== 'any' ? fmt(c.reasonFormat, { format: FORMAT_SHORT[/** @type {keyof typeof FORMAT_SHORT} */ (filters.format)] ?? '' }) : '',
    filters.when === 'active' ? c.whenActive : filters.when === 'open' ? c.whenOpen : '',
  ].filter(Boolean);

  const count = (/** @type {Partial<typeof filters>} */ over) => COURSES.filter((/** @type {Course} */ x) => matches(x, { ...filters, ...over }, heByKey)).length;
  /** @param {Course} x */
  const card = (x, /** @type {string[]} */ why) => <CourseCard course={x} reasons={why} categoryLabel={CATEGORY_LABEL[x.category]} kinds={[...formatKinds(x, heByKey)]} />;

  return (
    <div className="bg-background">
      <PageHeaderV3
        tone="muted"
        eyebrow={c.eyebrow}
        title={c.title}
        subtitle={c.subtitle}
        short={[fmt(c.shortCount, { count: COURSES.length }), c.shortQuestions, c.shortAll]}
      />

      <Band tone="canvas" padding="py-10 sm:py-14" labelledBy="finder-title">
        <div className="rounded-super bg-card border border-border shadow-card p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
            <div>
              <h2 id="finder-title" className="font-heading font-semibold text-2xl sm:text-3xl text-foreground">{c.finderTitle}</h2>
              <p className="text-muted-foreground mt-1">{c.finderIntro}</p>
            </div>
            <Button variant="link" onClick={reset} className="text-accent px-0 text-base">{c.showAll}</Button>
          </div>
          <ol className="grid gap-6 lg:grid-cols-3 lg:gap-8">
            <FinderStep n={1} total={3} question={c.questionAudience}>
              <ChipQuestion
                legend={c.questionAudience}
                size="sm"
                value={filters.audience}
                onChange={(v) => setFilter('audience', v)}
                options={[
                  { key: 'any', label: c.any, count: count({ audience: 'any' }) },
                  ...COURSE_CATEGORIES.map((/** @type {any} */ x) => ({ key: x.key, label: AUDIENCE_SHORT[/** @type {keyof typeof AUDIENCE_SHORT} */ (x.key)], count: count({ audience: x.key }) })),
                ]}
              />
            </FinderStep>
            <FinderStep n={2} total={3} question={c.questionFormat}>
              <ChipQuestion
                legend={c.questionFormat}
                size="sm"
                value={filters.format}
                onChange={(v) => setFilter('format', v)}
                options={[
                  { key: 'any', label: c.any, count: count({ format: 'any' }) },
                  { key: 'inperson', label: c.formatInperson, count: count({ format: 'inperson' }) },
                  { key: 'online', label: c.formatOnline, count: count({ format: 'online' }) },
                ]}
              />
            </FinderStep>
            <FinderStep n={3} total={3} question={c.questionWhen} last>
              <ChipQuestion
                legend={c.questionWhen}
                size="sm"
                value={filters.when}
                onChange={(v) => setFilter('when', v)}
                options={[
                  { key: 'any', label: c.whenAny, count: count({ when: 'any' }) },
                  { key: 'active', label: c.whenActiveOnly, count: count({ when: 'active' }) },
                  { key: 'open', label: c.whenOpen, count: count({ when: 'open' }) },
                ]}
              />
            </FinderStep>
          </ol>
        </div>

        <div className="mt-10" aria-live="polite">
          <p className="font-heading font-semibold text-xl text-foreground">
            {results.length === 0 ? c.resultsNone : results.length === 1 ? c.resultsOne : fmt(c.resultsMany, { count: results.length })}
            {anyFilter && <span className="text-muted-foreground font-normal text-base">{c.byAnswers}</span>}
          </p>
        </div>

        {results.length === 0 && (
          <div className="mt-6">
            <EmptyState
              title={c.emptyTitle}
              text={c.emptyText}
              action={<Button variant="solid" radius="full" onClick={reset}>{c.showAll}</Button>}
            />
          </div>
        )}

        {active.length > 0 && (
          <section aria-labelledby="courses-active" className="mt-6">
            <h3 id="courses-active" className="sr-only">{c.activeHeading}</h3>
            <ul className="grid gap-5 md:grid-cols-2">
              {active.map((/** @type {Course} */ x) => <li key={x.slug}>{card(x, reasons)}</li>)}
            </ul>
          </section>
        )}

        {past.length > 0 && (
          <section aria-labelledby="courses-past" className="mt-12">
            <SectionHeading as="h3" id="courses-past" title={c.pastTitle} intro={c.pastIntro} className="mb-5" />
            <ul className="grid gap-5 md:grid-cols-2">
              {past.map((/** @type {Course} */ x) => <li key={x.slug}>{card(x, [])}</li>)}
            </ul>
          </section>
        )}
      </Band>

      <Band tone="muted" labelledBy="courses-more">
        <SectionHeading id="courses-more" eyebrow={c.moreEyebrow} title={c.moreTitle} />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { to: ROUTES.supervision, title: c.moreSupervisionTitle, text: c.moreSupervisionText },
            { to: ROUTES.childrenFamily, title: c.moreKidsTitle, text: c.moreKidsText },
            { to: ROUTES.organizations, title: c.moreOrgTitle, text: c.moreOrgText },
          ].map((x) => (
            <DemoLink key={x.to} to={x.to} className={cn('group rounded-super bg-card border border-border p-6 hover:border-primary/60 transition-natural', FOCUS)}>
              <span className="block font-heading font-semibold text-lg text-foreground">{x.title}</span>
              <span className="block mt-1 text-muted-foreground">{x.text}</span>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent">{c.toPage} <ArrowLeft className={cn('w-4 h-4', FWD)} aria-hidden="true" /></span>
            </DemoLink>
          ))}
        </div>
        <p className="mt-8 text-muted-foreground">
          {c.nextRunsPrompt}{' '}
          <ExternalLink href={THERAPIST_HUB.cta.url} className={TEXT_LINK}>{THERAPIST_HUB.cta.label}</ExternalLink>
        </p>
        <DemoLink to={ROUTES.events} className={cn(PILL_OUTLINE, 'mt-4')}>{c.toEvents}</DemoLink>
      </Band>
    </div>
  );
}
