import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Award, BookOpen, CalendarDays, Check, Clock, Coins, ExternalLink as ExternalIcon, MapPin, MonitorSmartphone, Repeat, Timer, UserRound } from 'lucide-react';
import Disclosure from '@/components/patterns/Disclosure';
import { DemoLink, DemoMarkdown } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { cn } from '@/lib/utils';
import PageHeaderV3 from '../components/PageHeaderV3';
import { Band, ContactChips, EmptyState, ExternalLink, FactGrid, FOCUS, FWD, Linkify, PILL_OUTLINE, PILL_SOLID, QuoteCard, StatusPill, TEXT_LINK } from '../components/kit';
import { courseStatus, nextDate } from '../lib';
import { fmt, useCopy, useMetiv } from '../content/MetivContent';

/** @typedef {import('@/pages/metiv-demos/shared/therapist/courses.js').Course} Course */

const UNIT_TONE = { ended: /** @type {const} */ ('muted'), closed: /** @type {const} */ ('muted'), soon: /** @type {const} */ ('info') };
const STEP_IDS = ['learn', 'fit', 'when', 'register'];

/** @param {Record<string, string>} c */
const unitLabel = (c) => ({ ended: c.unitEnded, closed: c.unitClosed, soon: c.unitSoon });
/** @param {Record<string, string>} c */
const steps = (c) => [
  { id: 'learn', title: c.stepLearn },
  { id: 'fit', title: c.stepFit },
  { id: 'when', title: c.stepWhen },
  { id: 'register', title: c.stepRegister },
];

/** Highlights the step currently in view. Falls back to the first step without IntersectionObserver. */
function useActiveStep() {
  const [active, setActive] = useState(STEP_IDS[0]);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.IntersectionObserver !== 'function') return undefined;
    const observer = new window.IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );
    STEP_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);
  return active;
}

/** @param {{ n: number, id: string, title: string, lead?: string, last?: boolean, children: React.ReactNode }} props */
function Step({ n, id, title, lead, last = false, children }) {
  const c = useCopy('courseDetail');
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="relative scroll-mt-36 ps-14 sm:ps-16 pb-14">
      <span aria-hidden="true" className="absolute start-0 top-0 w-11 h-11 rounded-full bg-primary text-primary-foreground font-heading font-semibold text-lg flex items-center justify-center shadow-atmospheric-md">{n}</span>
      {!last && <span aria-hidden="true" className="absolute start-[1.3rem] top-14 bottom-2 border-s-2 border-dashed border-primary/40" />}
      <p className="text-sm font-semibold text-accent">{fmt(c.stepOf, { n, total: STEP_IDS.length })}</p>
      <h2 id={`${id}-title`} className="font-heading font-semibold text-3xl text-foreground">{title}</h2>
      {lead && <p className="mt-2 text-lg text-muted-foreground">{lead}</p>}
      <div className="mt-6 space-y-8">{children}</div>
    </section>
  );
}

/** @param {{ title: string, children: React.ReactNode }} props */
function Sub({ title, children }) {
  return (
    <div>
      <h3 className="font-heading font-semibold text-xl text-foreground mb-3">{title}</h3>
      {children}
    </div>
  );
}

/** @param {{ course: Course, compact?: boolean }} props */
function RegisterAction({ course, compact = false }) {
  const { ORG } = useMetiv();
  const c = useCopy('courseDetail');
  const status = courseStatus(course);
  const reg = course.registration;
  if (status.key !== 'closed' && reg?.url) {
    return (
      <ExternalLink href={reg.url} className={cn(PILL_SOLID, compact && 'w-full px-4')}>
        {reg.label || c.register}
      </ExternalLink>
    );
  }
  return (
    <ExternalLink href={ORG.trainingsFormUrl} className={cn(PILL_OUTLINE, compact && 'w-full px-4 text-sm')}>
      {c.leaveDetails}
    </ExternalLink>
  );
}

export default function CourseDetail() {
  const { COURSES, COURSE_CATEGORIES, getCourse } = useMetiv();
  const c = useCopy('courseDetail');
  const { slug = '' } = useParams();
  const course = getCourse(slug);
  const active = useActiveStep();
  const STEPS = steps(c);
  const UNIT_LABEL = unitLabel(c);
  /** @type {Record<string, string>} */
  const CATEGORY_LABEL = Object.fromEntries(COURSE_CATEGORIES.map((/** @type {any} */ x) => [x.key, x.label]));

  if (!course) {
    return (
      <div className="bg-background">
        <PageHeaderV3 tone="muted" title={c.notFoundTitle} subtitle={c.notFoundSubtitle} short={[]} />
        <Band tone="canvas" width="default">
          <EmptyState title={c.notFoundEmptyTitle} text={c.notFoundEmptyText} action={<DemoLink to={ROUTES.courses} className={PILL_SOLID}>{c.allCourses}</DemoLink>} />
        </Band>
      </div>
    );
  }

  const status = courseStatus(course);
  const date = nextDate(course);
  const related = (course.relatedSlugs?.length ? course.relatedSlugs.map((/** @type {string} */ s) => getCourse(s)) : COURSES.filter((/** @type {Course} */ x) => x.category === course.category && x.slug !== course.slug))
    .filter(Boolean)
    .slice(0, 3);
  const activeIndex = STEPS.findIndex((s) => s.id === active);

  const facts = [
    { label: c.factStart, value: course.startDate, icon: <CalendarDays className="w-5 h-5" /> },
    { label: c.factWhen, value: course.schedule, icon: <Clock className="w-5 h-5" /> },
    { label: c.factDuration, value: course.duration, icon: <Timer className="w-5 h-5" /> },
    { label: c.factHours, value: course.hours, icon: <BookOpen className="w-5 h-5" /> },
    { label: c.factFormat, value: course.format, icon: <MonitorSmartphone className="w-5 h-5" /> },
    { label: c.factLocation, value: course.location, icon: <MapPin className="w-5 h-5" /> },
    { label: c.factPrice, value: course.price, icon: <Coins className="w-5 h-5" /> },
  ];

  return (
    <div className="bg-background">
      <PageHeaderV3
        tone="muted"
        eyebrow={CATEGORY_LABEL[course.category]}
        title={course.title}
        subtitle={course.subtitle}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone={status.tone}>{status.label}</StatusPill>
            {course.tags.map((/** @type {string} */ t, /** @type {number} */ i) => <StatusPill key={i} tone="muted">{t}</StatusPill>)}
          </div>
        }
        actions={
          <>
            <RegisterAction course={course} />
            <a href="#learn" className={PILL_OUTLINE}>{c.walkThrough}</a>
          </>
        }
        short={[
          course.summary,
          [date && fmt(c.shortOpens, { date }), course.format, course.hours || course.duration].filter(Boolean).join(' · ') || c.shortNoDate,
          course.price ? fmt(c.shortPrice, { price: course.price }) : status.label,
        ]}
      />

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 sm:py-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="min-w-0 max-w-3xl">
          <Step n={1} id="learn" title={STEPS[0].title}>
            <DemoMarkdown className="rich-content text-lg text-foreground leading-relaxed">{course.description}</DemoMarkdown>
            {course.syllabus?.length > 0 && (
              <Sub title={c.syllabus}>
                <div className="space-y-3">
                  {course.syllabus.map((/** @type {any} */ s, /** @type {number} */ i) => (
                    <Disclosure key={i} label={s.title} variant="outlined" size="compact" defaultOpen={i === 0} tintTriggerWhenOpen>
                      <ul className="space-y-2">
                        {s.items.map((/** @type {string} */ item, /** @type {number} */ j) => (
                          <li key={j} className="flex gap-2.5 text-foreground leading-relaxed">
                            <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" aria-hidden="true" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </Disclosure>
                  ))}
                </div>
              </Sub>
            )}
            {course.units?.length > 0 && (
              <Sub title={fmt(c.units, { count: course.units.length })}>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {course.units.map((/** @type {any} */ u) => (
                    <li key={u.slug} className="rounded-super-sm bg-card border border-border p-4 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-heading font-semibold text-foreground leading-snug">{u.title}</p>
                        <StatusPill tone={UNIT_TONE[/** @type {keyof typeof UNIT_TONE} */ (u.status)]}>{UNIT_LABEL[/** @type {keyof typeof UNIT_TONE} */ (u.status)]}</StatusPill>
                      </div>
                      {u.tagline && <p className="mt-1 text-sm text-muted-foreground">{u.tagline}</p>}
                      {(u.date || u.format) && (
                        <p className="mt-2 text-sm text-foreground">{[u.date, u.hours, u.format].filter(Boolean).join(' · ')}</p>
                      )}
                      {u.lecturers?.length > 0 && <p className="mt-1 text-sm text-muted-foreground">{u.lecturers.map((/** @type {any} */ l) => l.name).join(', ')}</p>}
                      {u.description && (
                        <Disclosure label={c.aboutUnit} variant="plain" size="tight" className="mt-3">
                          <DemoMarkdown className="rich-content text-sm text-foreground">{u.description}</DemoMarkdown>
                        </Disclosure>
                      )}
                    </li>
                  ))}
                </ul>
              </Sub>
            )}
            {course.lecturers?.length > 0 && (
              <Sub title={c.lecturers}>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {course.lecturers.map((/** @type {any} */ l) => (
                    <li key={l.name} className="flex items-start gap-3 rounded-super-sm bg-card border border-border p-4">
                      <span className="w-10 h-10 rounded-full bg-primary/10 text-accent flex items-center justify-center flex-shrink-0">
                        <UserRound className="w-5 h-5" aria-hidden="true" />
                      </span>
                      <span>
                        <span className="block font-semibold text-foreground">{l.name}</span>
                        {l.role && <span className="block text-sm text-muted-foreground leading-relaxed">{l.role}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </Sub>
            )}
          </Step>

          <Step n={2} id="fit" title={STEPS[1].title}>
            {course.audience?.length > 0 ? (
              <Sub title={c.isItForMe}>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {course.audience.map((/** @type {string} */ a, /** @type {number} */ i) => (
                    <li key={i} className="flex items-center gap-2.5 rounded-2xl bg-card border border-border px-4 py-3 text-foreground">
                      <Check className="w-5 h-5 text-success flex-shrink-0" aria-hidden="true" /> {a}
                    </li>
                  ))}
                </ul>
              </Sub>
            ) : (
              <p className="text-muted-foreground">{c.audienceInContact}</p>
            )}
            {course.prerequisites && (
              <Sub title={c.prerequisites}>
                <p className="text-foreground leading-relaxed"><Linkify text={course.prerequisites} /></p>
              </Sub>
            )}
            {course.testimonials?.length > 0 && (
              <Sub title={c.testimonials}>
                <div className="grid gap-4 sm:grid-cols-2">
                  {course.testimonials.map((/** @type {any} */ t, /** @type {number} */ i) => <QuoteCard key={`${t.name}-${i}`} quote={t.quote} name={t.name} role={t.role} />)}
                </div>
              </Sub>
            )}
          </Step>

          <Step n={3} id="when" title={STEPS[2].title}>
            <FactGrid items={facts} />
            {(course.credits?.length > 0 || course.priceOptions?.length > 0) && (
              <div className="grid gap-4 sm:grid-cols-2">
                {course.credits?.length > 0 && (
                  <div className="rounded-super-sm bg-card border border-border p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Award className="w-4 h-4 text-accent" aria-hidden="true" /> {c.credits}</p>
                    <ul className="mt-2 flex flex-wrap gap-2">{course.credits.map((/** @type {string} */ x, /** @type {number} */ i) => <li key={i}><StatusPill tone="primary">{x}</StatusPill></li>)}</ul>
                  </div>
                )}
                {course.priceOptions?.length > 0 && (
                  <div className="rounded-super-sm bg-card border border-border p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Coins className="w-4 h-4 text-accent" aria-hidden="true" /> {c.priceOptions}</p>
                    <ul className="mt-2 space-y-1 text-foreground">{course.priceOptions.map((/** @type {string} */ p, /** @type {number} */ i) => <li key={i}>{p}</li>)}</ul>
                  </div>
                )}
              </div>
            )}
            {course.formats?.length > 0 && (
              <Sub title={c.runs}>
                <ul className="space-y-3">
                  {course.formats.map((/** @type {any} */ f) => (
                    <li key={f.key} className={cn('rounded-super-sm border p-5', f.isPast ? 'bg-muted/50 border-border' : 'bg-card border-primary/30')}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="flex items-center gap-2 font-heading font-semibold text-foreground"><Repeat className="w-4 h-4 text-accent" aria-hidden="true" />{f.label}</p>
                        {f.isPast ? <StatusPill tone="muted">{c.runPast}</StatusPill> : f.registration?.status === 'open' ? <StatusPill tone="success">{c.runOpen}</StatusPill> : <StatusPill tone="info">{c.runInContact}</StatusPill>}
                      </div>
                      <p className="mt-2 text-foreground">{[f.format, f.startDate && fmt(c.runOpens, { date: f.startDate }), f.schedule, f.hours, f.price].filter(Boolean).join(' · ')}</p>
                      {f.location && <p className="mt-1 text-sm text-muted-foreground">{f.location}</p>}
                      {f.lecturers?.length > 0 && <p className="mt-1 text-sm text-muted-foreground">{fmt(c.runLecturers, { names: f.lecturers.map((/** @type {any} */ l) => l.name).join(', ') })}</p>}
                      {f.note && <p className="mt-2 text-sm text-foreground">{f.note}</p>}
                      {!f.isPast && f.registration?.url && (
                        <ExternalLink href={f.registration.url} className={cn('mt-3', TEXT_LINK)}>{f.registration.label}</ExternalLink>
                      )}
                    </li>
                  ))}
                </ul>
              </Sub>
            )}
          </Step>

          <Step n={4} id="register" title={STEPS[3].title} last>
            <div className="rounded-super bg-card border-2 border-primary/25 p-6 sm:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-heading font-semibold text-xl text-foreground">{c.registration}</p>
                <StatusPill tone={status.tone}>{status.label}</StatusPill>
              </div>
              <p className="mt-2 text-muted-foreground">
                {status.key === 'open' && c.registerOpenText}
                {status.key === 'ongoing' && fmt(c.registerOngoingText, { label: course.registration?.label || c.register })}
                {status.key === 'closed' && c.registerClosedText}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <RegisterAction course={course} />
              </div>
              {course.contact && (
                <div className="mt-6 pt-5 border-t border-border">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">{c.questionsContact}</p>
                  <ContactChips contact={course.contact} />
                </div>
              )}
            </div>
            {course.faq?.length > 0 && (
              <Sub title={c.faq}>
                <div className="space-y-3">
                  {course.faq.map((/** @type {any} */ f) => (
                    <Disclosure key={f.q} label={f.q} variant="soft" size="compact">
                      <p className="text-foreground leading-relaxed"><Linkify text={f.a} /></p>
                    </Disclosure>
                  ))}
                </div>
              </Sub>
            )}
          </Step>

          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <ExternalIcon className="w-4 h-4" aria-hidden="true" />
            {c.sourcePrefix}{' '}
            <ExternalLink href={course.sourceUrl} icon={false} className={TEXT_LINK}>{c.sourceLink}</ExternalLink>
          </p>
        </div>

        {/* Step rail: end side on desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-36 space-y-4">
            <nav aria-label={c.stepsNav} className="rounded-super bg-card border border-border p-5">
              <p className="text-sm font-semibold text-muted-foreground">
                {fmt(c.stepOf, { n: activeIndex + 1, total: STEPS.length })}
              </p>
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden" aria-hidden="true">
                <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${((activeIndex + 1) / STEPS.length) * 100}%` }} />
              </div>
              <ol className="mt-4 space-y-1">
                {STEPS.map((s, i) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      aria-current={active === s.id ? 'step' : undefined}
                      className={cn('flex items-center gap-2.5 rounded-xl px-2 py-2 transition-natural', FOCUS, active === s.id ? 'bg-primary/10 text-accent font-semibold' : 'text-foreground hover:bg-muted')}
                    >
                      <span className={cn('w-6 h-6 rounded-full text-xs flex items-center justify-center', i <= activeIndex ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>{i + 1}</span>
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            <div className="rounded-super bg-muted p-5 space-y-3">
              <StatusPill tone={status.tone}>{status.label}</StatusPill>
              {date && <p className="text-sm text-foreground">{fmt(c.railOpens, { date })}</p>}
              <RegisterAction course={course} compact />
            </div>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <Band tone="muted" labelledBy="related-title">
          <h2 id="related-title" className="font-heading font-semibold text-2xl sm:text-3xl text-foreground mb-6">{c.relatedTitle}</h2>
          <ul className="grid gap-4 md:grid-cols-3">
            {related.map((/** @type {Course} */ x) => (
              <li key={x.slug}>
                <DemoLink to={`${ROUTES.courses}/${x.slug}`} className={cn('group flex h-full flex-col rounded-super bg-card border border-border p-5 hover:border-primary/60 hover:shadow-card transition-natural', FOCUS)}>
                  <StatusPill tone={courseStatus(x).tone} className="self-start">{courseStatus(x).label}</StatusPill>
                  <span className="mt-2 font-heading font-semibold text-lg text-foreground">{x.title}</span>
                  <span className="mt-1 text-muted-foreground text-sm leading-relaxed">{x.summary}</span>
                  <span className="mt-auto pt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent">{c.details} <ArrowLeft className={cn('w-4 h-4', FWD)} aria-hidden="true" /></span>
                </DemoLink>
              </li>
            ))}
          </ul>
          <DemoLink to={ROUTES.courses} className={cn(PILL_OUTLINE, 'mt-6')}>{c.allCourses}</DemoLink>
        </Band>
      )}
    </div>
  );
}
