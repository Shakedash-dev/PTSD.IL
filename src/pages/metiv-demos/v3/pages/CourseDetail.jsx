import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Award, BookOpen, CalendarDays, Check, Clock, Coins, ExternalLink as ExternalIcon, MapPin, MonitorSmartphone, Repeat, Timer, UserRound } from 'lucide-react';
import Disclosure from '@/components/patterns/Disclosure';
import { DemoLink, DemoMarkdown } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { COURSES, COURSE_CATEGORIES, ORG, getCourse } from '@/pages/metiv-demos/shared/therapist';
import { cn } from '@/lib/utils';
import PageHeaderV3 from '../components/PageHeaderV3';
import { Band, ContactChips, EmptyState, ExternalLink, FactGrid, FOCUS, Linkify, PILL_OUTLINE, PILL_SOLID, QuoteCard, StatusPill, TEXT_LINK } from '../components/kit';
import { courseStatus, nextDate } from '../lib';

/** @typedef {import('@/pages/metiv-demos/shared/therapist/courses.js').Course} Course */

const CATEGORY_LABEL = Object.fromEntries(COURSE_CATEGORIES.map((c) => [c.key, c.label]));
const UNIT_STATUS = {
  ended: { label: 'הסתיים', tone: /** @type {const} */ ('muted') },
  closed: { label: 'ההרשמה נסגרה', tone: /** @type {const} */ ('muted') },
  soon: { label: 'בקרוב', tone: /** @type {const} */ ('info') },
};
const STEPS = [
  { id: 'learn', title: 'מה לומדים' },
  { id: 'fit', title: 'למי זה מתאים' },
  { id: 'when', title: 'מתי ואיפה' },
  { id: 'register', title: 'איך נרשמים' },
];

/** Highlights the step currently in view. Falls back to the first step without IntersectionObserver. */
function useActiveStep() {
  const [active, setActive] = useState(STEPS[0].id);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.IntersectionObserver !== 'function') return undefined;
    const observer = new window.IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );
    STEPS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);
  return active;
}

/** @param {{ n: number, id: string, title: string, lead?: string, last?: boolean, children: React.ReactNode }} props */
function Step({ n, id, title, lead, last = false, children }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="relative scroll-mt-36 ps-14 sm:ps-16 pb-14">
      <span aria-hidden="true" className="absolute start-0 top-0 w-11 h-11 rounded-full bg-primary text-primary-foreground font-heading font-semibold text-lg flex items-center justify-center shadow-atmospheric-md">{n}</span>
      {!last && <span aria-hidden="true" className="absolute start-[1.3rem] top-14 bottom-2 border-s-2 border-dashed border-primary/40" />}
      <p className="text-sm font-semibold text-accent">שלב {n} מתוך {STEPS.length}</p>
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
  const status = courseStatus(course);
  const reg = course.registration;
  if (status.key !== 'closed' && reg?.url) {
    return (
      <ExternalLink href={reg.url} className={cn(PILL_SOLID, compact && 'w-full px-4')}>
        {reg.label || 'להרשמה'}
      </ExternalLink>
    );
  }
  return (
    <ExternalLink href={ORG.trainingsFormUrl} className={cn(PILL_OUTLINE, compact && 'w-full px-4 text-sm')}>
      השארת פרטים לעדכון על מחזורים
    </ExternalLink>
  );
}

export default function CourseDetail() {
  const { slug = '' } = useParams();
  const course = getCourse(slug);
  const active = useActiveStep();

  if (!course) {
    return (
      <div className="bg-background">
        <PageHeaderV3 tone="muted" title="לא מצאנו את הקורס הזה" subtitle="ייתכן שהקישור השתנה." short={[]} />
        <Band tone="canvas" width="default">
          <EmptyState title="הקורס לא נמצא" text="אפשר לחזור לרשימה ולחפש שם." action={<DemoLink to={ROUTES.courses} className={PILL_SOLID}>לכל הקורסים</DemoLink>} />
        </Band>
      </div>
    );
  }

  const status = courseStatus(course);
  const date = nextDate(course);
  const related = (course.relatedSlugs?.length ? course.relatedSlugs.map((s) => getCourse(s)) : COURSES.filter((c) => c.category === course.category && c.slug !== course.slug))
    .filter(Boolean)
    .slice(0, 3);
  const activeIndex = STEPS.findIndex((s) => s.id === active);

  const facts = [
    { label: 'מועד פתיחה', value: course.startDate, icon: <CalendarDays className="w-5 h-5" /> },
    { label: 'מתי', value: course.schedule, icon: <Clock className="w-5 h-5" /> },
    { label: 'משך', value: course.duration, icon: <Timer className="w-5 h-5" /> },
    { label: 'היקף שעות', value: course.hours, icon: <BookOpen className="w-5 h-5" /> },
    { label: 'פורמט', value: course.format, icon: <MonitorSmartphone className="w-5 h-5" /> },
    { label: 'מיקום', value: course.location, icon: <MapPin className="w-5 h-5" /> },
    { label: 'מחיר', value: course.price, icon: <Coins className="w-5 h-5" /> },
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
            {course.tags.map((t) => <StatusPill key={t} tone="muted">{t}</StatusPill>)}
          </div>
        }
        actions={
          <>
            <RegisterAction course={course} />
            <a href="#learn" className={PILL_OUTLINE}>לעבור על הפרטים, שלב אחר שלב</a>
          </>
        }
        short={[
          course.summary,
          [date && `פתיחה: ${date}`, course.format, course.hours || course.duration].filter(Boolean).join(' · ') || 'פרטי מועד ופורמט בפנייה',
          course.price ? `מחיר: ${course.price}` : status.label,
        ]}
      />

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 sm:py-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="min-w-0 max-w-3xl">
          <Step n={1} id="learn" title="מה לומדים">
            <DemoMarkdown className="rich-content text-lg text-foreground leading-relaxed">{course.description}</DemoMarkdown>
            {course.syllabus?.length > 0 && (
              <Sub title="תוכנית הלימודים">
                <div className="space-y-3">
                  {course.syllabus.map((s, i) => (
                    <Disclosure key={s.title} label={s.title} variant="outlined" size="compact" defaultOpen={i === 0} tintTriggerWhenOpen>
                      <ul className="space-y-2">
                        {s.items.map((item) => (
                          <li key={item} className="flex gap-2.5 text-foreground leading-relaxed">
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
              <Sub title={`יחידות הלימוד (${course.units.length})`}>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {course.units.map((u) => (
                    <li key={u.slug} className="rounded-super-sm bg-card border border-border p-4 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-heading font-semibold text-foreground leading-snug">{u.title}</p>
                        <StatusPill tone={UNIT_STATUS[u.status].tone}>{UNIT_STATUS[u.status].label}</StatusPill>
                      </div>
                      {u.tagline && <p className="mt-1 text-sm text-muted-foreground">{u.tagline}</p>}
                      {(u.date || u.format) && (
                        <p className="mt-2 text-sm text-foreground">{[u.date, u.hours, u.format].filter(Boolean).join(' · ')}</p>
                      )}
                      {u.lecturers?.length > 0 && <p className="mt-1 text-sm text-muted-foreground">{u.lecturers.map((l) => l.name).join(', ')}</p>}
                      {u.description && (
                        <Disclosure label="על היחידה" variant="plain" size="tight" className="mt-3">
                          <DemoMarkdown className="rich-content text-sm text-foreground">{u.description}</DemoMarkdown>
                        </Disclosure>
                      )}
                    </li>
                  ))}
                </ul>
              </Sub>
            )}
            {course.lecturers?.length > 0 && (
              <Sub title="מי מלמד/ת">
                <ul className="grid gap-3 sm:grid-cols-2">
                  {course.lecturers.map((l) => (
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

          <Step n={2} id="fit" title="למי זה מתאים">
            {course.audience?.length > 0 ? (
              <Sub title="האם זה בשבילי?">
                <ul className="grid gap-2 sm:grid-cols-2">
                  {course.audience.map((a) => (
                    <li key={a} className="flex items-center gap-2.5 rounded-2xl bg-card border border-border px-4 py-3 text-foreground">
                      <Check className="w-5 h-5 text-success flex-shrink-0" aria-hidden="true" /> {a}
                    </li>
                  ))}
                </ul>
              </Sub>
            ) : (
              <p className="text-muted-foreground">קהל היעד מפורט בפנייה לרכזת ההכשרות.</p>
            )}
            {course.prerequisites && (
              <Sub title="תנאי קבלה">
                <p className="text-foreground leading-relaxed"><Linkify text={course.prerequisites} /></p>
              </Sub>
            )}
            {course.testimonials?.length > 0 && (
              <Sub title="מה מספרים משתתפים">
                <div className="grid gap-4 sm:grid-cols-2">
                  {course.testimonials.map((t, i) => <QuoteCard key={`${t.name}-${i}`} quote={t.quote} name={t.name} role={t.role} />)}
                </div>
              </Sub>
            )}
          </Step>

          <Step n={3} id="when" title="מתי ואיפה">
            <FactGrid items={facts} />
            {(course.credits?.length > 0 || course.priceOptions?.length > 0) && (
              <div className="grid gap-4 sm:grid-cols-2">
                {course.credits?.length > 0 && (
                  <div className="rounded-super-sm bg-card border border-border p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Award className="w-4 h-4 text-accent" aria-hidden="true" /> הכרה וגמול</p>
                    <ul className="mt-2 flex flex-wrap gap-2">{course.credits.map((c) => <li key={c}><StatusPill tone="primary">{c}</StatusPill></li>)}</ul>
                  </div>
                )}
                {course.priceOptions?.length > 0 && (
                  <div className="rounded-super-sm bg-card border border-border p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Coins className="w-4 h-4 text-accent" aria-hidden="true" /> אפשרויות תשלום</p>
                    <ul className="mt-2 space-y-1 text-foreground">{course.priceOptions.map((p) => <li key={p}>{p}</li>)}</ul>
                  </div>
                )}
              </div>
            )}
            {course.formats?.length > 0 && (
              <Sub title="מחזורים ודרכי לימוד">
                <ul className="space-y-3">
                  {course.formats.map((f) => (
                    <li key={f.key} className={cn('rounded-super-sm border p-5', f.isPast ? 'bg-muted/50 border-border' : 'bg-card border-primary/30')}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="flex items-center gap-2 font-heading font-semibold text-foreground"><Repeat className="w-4 h-4 text-accent" aria-hidden="true" />{f.label}</p>
                        {f.isPast ? <StatusPill tone="muted">התקיים</StatusPill> : f.registration?.status === 'open' ? <StatusPill tone="success">הרשמה פתוחה</StatusPill> : <StatusPill tone="info">פרטים בפנייה</StatusPill>}
                      </div>
                      <p className="mt-2 text-foreground">{[f.format, f.startDate && `פתיחה ${f.startDate}`, f.schedule, f.hours, f.price].filter(Boolean).join(' · ')}</p>
                      {f.location && <p className="mt-1 text-sm text-muted-foreground">{f.location}</p>}
                      {f.lecturers?.length > 0 && <p className="mt-1 text-sm text-muted-foreground">מלמדים: {f.lecturers.map((l) => l.name).join(', ')}</p>}
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

          <Step n={4} id="register" title="איך נרשמים" last>
            <div className="rounded-super bg-card border-2 border-primary/25 p-6 sm:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-heading font-semibold text-xl text-foreground">ההרשמה</p>
                <StatusPill tone={status.tone}>{status.label}</StatusPill>
              </div>
              <p className="mt-2 text-muted-foreground">
                {status.key === 'open' && 'ההרשמה והתשלום נעשים באתר חיצוני.'}
                {status.key === 'ongoing' && `${course.registration?.label || 'להרשמה'}: הפרטים נמסרים בפנייה.`}
                {status.key === 'closed' && 'המחזור הזה הסתיים. אפשר להשאיר פרטים ולקבל עדכון כשייפתח מחזור.'}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <RegisterAction course={course} />
              </div>
              {course.contact && (
                <div className="mt-6 pt-5 border-t border-border">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">שאלות? אפשר לפנות ל:</p>
                  <ContactChips contact={course.contact} />
                </div>
              )}
            </div>
            {course.faq?.length > 0 && (
              <Sub title="שאלות נפוצות">
                <div className="space-y-3">
                  {course.faq.map((f) => (
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
            המידע בעמוד מתוך{' '}
            <ExternalLink href={course.sourceUrl} icon={false} className={TEXT_LINK}>עמוד הקורס באתר מטיב</ExternalLink>
          </p>
        </div>

        {/* Step rail: end side on desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-36 space-y-4">
            <nav aria-label="שלבים בעמוד" className="rounded-super bg-card border border-border p-5">
              <p className="text-sm font-semibold text-muted-foreground">
                שלב {activeIndex + 1} מתוך {STEPS.length}
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
              {date && <p className="text-sm text-foreground">פתיחה: {date}</p>}
              <RegisterAction course={course} compact />
            </div>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <Band tone="muted" labelledBy="related-title">
          <h2 id="related-title" className="font-heading font-semibold text-2xl sm:text-3xl text-foreground mb-6">אולי יעניין אותך גם</h2>
          <ul className="grid gap-4 md:grid-cols-3">
            {related.map((c) => (
              <li key={c.slug}>
                <DemoLink to={`${ROUTES.courses}/${c.slug}`} className={cn('group flex h-full flex-col rounded-super bg-card border border-border p-5 hover:border-primary/60 hover:shadow-card transition-natural', FOCUS)}>
                  <StatusPill tone={courseStatus(c).tone} className="self-start">{courseStatus(c).label}</StatusPill>
                  <span className="mt-2 font-heading font-semibold text-lg text-foreground">{c.title}</span>
                  <span className="mt-1 text-muted-foreground text-sm leading-relaxed">{c.summary}</span>
                  <span className="mt-auto pt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent">לפרטים <ArrowLeft className="w-4 h-4" aria-hidden="true" /></span>
                </DemoLink>
              </li>
            ))}
          </ul>
          <DemoLink to={ROUTES.courses} className={cn(PILL_OUTLINE, 'mt-6')}>לכל הקורסים</DemoLink>
        </Band>
      )}
    </div>
  );
}
