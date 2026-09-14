import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock, MonitorSmartphone, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { COURSES, COURSE_CATEGORIES, THERAPIST_HUB } from '@/pages/metiv-demos/shared/therapist';
import { cn } from '@/lib/utils';
import PageHeaderV3 from '../components/PageHeaderV3';
import { Band, ChipQuestion, EmptyState, ExternalLink, FOCUS, PILL_OUTLINE, SectionHeading, StatusPill, TEXT_LINK } from '../components/kit';
import { courseFormatKinds, courseStatus, nextDate, STATUS_ORDER } from '../lib';

/** @typedef {import('@/pages/metiv-demos/shared/therapist/courses.js').Course} Course */

const CATEGORY_LABEL = Object.fromEntries(COURSE_CATEGORIES.map((c) => [c.key, c.label]));
const AUDIENCE_SHORT = { adults: 'מבוגרים', 'children-family': 'ילדים ומשפחות', organizations: 'צוותים וארגונים' };
const FORMAT_SHORT = { inperson: 'פנים אל פנים', online: 'בזום' };
const WHEN_SHORT = { active: 'עדיין פעיל', open: 'הרשמה פתוחה' };

/**
 * @param {Course} c
 * @param {{ audience: string, format: string, when: string }} f
 */
function matches(c, f) {
  if (f.audience !== 'any' && c.category !== f.audience) return false;
  if (f.format !== 'any') {
    const kinds = courseFormatKinds(c);
    if (!kinds.has(/** @type {any} */ (f.format)) && !kinds.has('custom')) return false;
  }
  const status = courseStatus(c).key;
  if (f.when === 'open' && status !== 'open') return false;
  if (f.when === 'active' && status === 'closed') return false;
  return true;
}

/** @param {{ n: number, total: number, question: string, children: React.ReactNode, last?: boolean }} props */
function FinderStep({ n, total, question, children, last = false }) {
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
        <p className="text-xs font-semibold text-muted-foreground">שאלה {n} מתוך {total}</p>
        <p className="font-heading font-semibold text-lg text-foreground mb-3">{question}</p>
        {children}
      </div>
    </li>
  );
}

/** @param {{ course: Course, reasons: string[] }} props */
function CourseCard({ course, reasons }) {
  const status = courseStatus(course);
  const kinds = [...courseFormatKinds(course)];
  const date = nextDate(course);
  return (
    <DemoLink
      to={`${ROUTES.courses}/${course.slug}`}
      className={cn('group flex h-full flex-col rounded-super bg-card border border-border p-6 shadow-card hover:shadow-card-hover hover:border-primary/50 hover:-translate-y-0.5 transition-natural', FOCUS, status.key === 'closed' && 'bg-card/70')}
    >
      <span className="flex flex-wrap items-center gap-2">
        <StatusPill tone="primary">{CATEGORY_LABEL[course.category]}</StatusPill>
        <StatusPill tone={status.tone}>{status.label}</StatusPill>
      </span>
      <span className="mt-3 font-heading font-semibold text-xl text-foreground leading-snug">{course.title}</span>
      <span className="mt-2 text-muted-foreground leading-relaxed">{course.summary}</span>
      <span className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-foreground">
        {date && <span className="inline-flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-accent" aria-hidden="true" />{date}</span>}
        <span className="inline-flex items-center gap-1.5">
          <MonitorSmartphone className="w-4 h-4 text-accent" aria-hidden="true" />
          {kinds.includes('custom') ? course.format || 'בהתאמה, בפנייה' : kinds.map((k) => FORMAT_SHORT[k]).join(' או ')}
        </span>
        {(course.hours || course.duration) && (
          <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4 text-accent" aria-hidden="true" />{course.duration || course.hours}</span>
        )}
      </span>
      {reasons.length > 0 && (
        <span className="mt-4 flex items-start gap-2 rounded-2xl bg-muted px-3 py-2 text-sm text-foreground">
          <Sparkles className="w-4 h-4 mt-0.5 text-secondary flex-shrink-0" aria-hidden="true" />
          <span><span className="font-semibold">למה זה מתאים לך: </span>{reasons.join(' · ')}</span>
        </span>
      )}
      <span className="mt-auto pt-5 inline-flex items-center gap-1 text-sm font-semibold text-accent">
        לפרטים ולהרשמה <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
      </span>
    </DemoLink>
  );
}

export default function Courses() {
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
      COURSES.filter((c) => matches(c, filters)).sort(
        (a, b) => STATUS_ORDER[courseStatus(a).key] - STATUS_ORDER[courseStatus(b).key]
      ),
    [filters.audience, filters.format, filters.when]
  );
  const active = results.filter((c) => courseStatus(c).key !== 'closed');
  const past = results.filter((c) => courseStatus(c).key === 'closed');

  const reasons = [
    filters.audience !== 'any' ? `עבודה עם ${AUDIENCE_SHORT[filters.audience]}` : '',
    filters.format !== 'any' ? `יש אפשרות ${FORMAT_SHORT[filters.format]}` : '',
    filters.when !== 'any' ? WHEN_SHORT[filters.when] : '',
  ].filter(Boolean);

  const count = (/** @type {Partial<typeof filters>} */ over) => COURSES.filter((c) => matches(c, { ...filters, ...over })).length;

  return (
    <div className="bg-background">
      <PageHeaderV3
        tone="muted"
        eyebrow="לאנשי מקצוע"
        title="קורסים והכשרות"
        subtitle="הכשרות בטיפול בטראומה במבוגרים, בילדים ובמשפחות, ולצוותים בארגונים."
        short={[`${COURSES.length} קורסים והכשרות, חלקם פעילים וחלקם התקיימו בעבר.`, 'שלוש שאלות קצרות מצמצמות את הרשימה. אין חובה לענות.', 'כל הקורסים מופיעים למטה גם בלי לענות.']}
      />

      <Band tone="canvas" padding="py-10 sm:py-14" labelledBy="finder-title">
        <div className="rounded-super bg-card border border-border shadow-card p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
            <div>
              <h2 id="finder-title" className="font-heading font-semibold text-2xl sm:text-3xl text-foreground">מוצאים את הקורס המתאים</h2>
              <p className="text-muted-foreground mt-1">הרשימה מתעדכנת עם כל תשובה.</p>
            </div>
            <Button variant="link" onClick={reset} className="text-accent px-0 text-base">הצג את כל הקורסים</Button>
          </div>
          <ol className="grid gap-6 lg:grid-cols-3 lg:gap-8">
            <FinderStep n={1} total={3} question="עם מי את/ה עובד/ת?">
              <ChipQuestion
                legend="עם מי את/ה עובד/ת?"
                size="sm"
                value={filters.audience}
                onChange={(v) => setFilter('audience', v)}
                options={[
                  { key: 'any', label: 'לא משנה', count: count({ audience: 'any' }) },
                  ...COURSE_CATEGORIES.map((c) => ({ key: c.key, label: AUDIENCE_SHORT[c.key], count: count({ audience: c.key }) })),
                ]}
              />
            </FinderStep>
            <FinderStep n={2} total={3} question="איך נוח לך ללמוד?">
              <ChipQuestion
                legend="איך נוח לך ללמוד?"
                size="sm"
                value={filters.format}
                onChange={(v) => setFilter('format', v)}
                options={[
                  { key: 'any', label: 'לא משנה', count: count({ format: 'any' }) },
                  { key: 'inperson', label: 'פנים אל פנים', count: count({ format: 'inperson' }) },
                  { key: 'online', label: 'בזום', count: count({ format: 'online' }) },
                ]}
              />
            </FinderStep>
            <FinderStep n={3} total={3} question="מתי?" last>
              <ChipQuestion
                legend="מתי?"
                size="sm"
                value={filters.when}
                onChange={(v) => setFilter('when', v)}
                options={[
                  { key: 'any', label: 'גם מה שהתקיים', count: count({ when: 'any' }) },
                  { key: 'active', label: 'רק מה שפעיל', count: count({ when: 'active' }) },
                  { key: 'open', label: 'הרשמה פתוחה', count: count({ when: 'open' }) },
                ]}
              />
            </FinderStep>
          </ol>
        </div>

        <div className="mt-10" aria-live="polite">
          <p className="font-heading font-semibold text-xl text-foreground">
            {results.length === 0 ? 'לא נמצאו קורסים' : results.length === 1 ? 'נמצא קורס אחד' : `נמצאו ${results.length} קורסים`}
            {anyFilter && <span className="text-muted-foreground font-normal text-base"> לפי התשובות שלך</span>}
          </p>
        </div>

        {results.length === 0 && (
          <div className="mt-6">
            <EmptyState
              title="אין כרגע קורס שעונה על כל התשובות"
              text="אפשר לשנות תשובה, או להשאיר פרטים ולקבל עדכון על מחזורים הבאים."
              action={<Button variant="solid" radius="full" onClick={reset}>הצג את כל הקורסים</Button>}
            />
          </div>
        )}

        {active.length > 0 && (
          <section aria-labelledby="courses-active" className="mt-6">
            <h3 id="courses-active" className="sr-only">קורסים פעילים</h3>
            <ul className="grid gap-5 md:grid-cols-2">
              {active.map((c) => <li key={c.slug}><CourseCard course={c} reasons={reasons} /></li>)}
            </ul>
          </section>
        )}

        {past.length > 0 && (
          <section aria-labelledby="courses-past" className="mt-12">
            <SectionHeading as="h3" id="courses-past" title="התקיימו בעבר" intro="מחזורים שהסתיימו. אפשר לקרוא עליהם ולהשאיר פרטים לעדכון." className="mb-5" />
            <ul className="grid gap-5 md:grid-cols-2">
              {past.map((c) => <li key={c.slug}><CourseCard course={c} reasons={[]} /></li>)}
            </ul>
          </section>
        )}
      </Band>

      <Band tone="muted" labelledBy="courses-more">
        <SectionHeading id="courses-more" eyebrow="לא רק קורסים" title="אולי מתאים לך גם" />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { to: ROUTES.supervision, title: 'הדרכה פרטנית או קבוצתית', text: 'למטפלים שפוגשים נפגעי טראומה.' },
            { to: ROUTES.childrenFamily, title: 'הכשרות בתחום הילדים והמשפחה', text: 'פנד"ה, נמ"ל ויסודות הטיפול בילדים.' },
            { to: ROUTES.organizations, title: 'הכשרה לצוות או לארגון', text: 'תוכניות שנבנות לפי הארגון.' },
          ].map((x) => (
            <DemoLink key={x.to} to={x.to} className={cn('group rounded-super bg-card border border-border p-6 hover:border-primary/60 transition-natural', FOCUS)}>
              <span className="block font-heading font-semibold text-lg text-foreground">{x.title}</span>
              <span className="block mt-1 text-muted-foreground">{x.text}</span>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent">לעמוד <ArrowLeft className="w-4 h-4" aria-hidden="true" /></span>
            </DemoLink>
          ))}
        </div>
        <p className="mt-8 text-muted-foreground">
          רוצה לשמוע על מחזורים הבאים?{' '}
          <ExternalLink href={THERAPIST_HUB.cta.url} className={TEXT_LINK}>{THERAPIST_HUB.cta.label}</ExternalLink>
        </p>
        <DemoLink to={ROUTES.events} className={cn(PILL_OUTLINE, 'mt-4')}>לוח האירועים והמחזורים</DemoLink>
      </Band>
    </div>
  );
}
