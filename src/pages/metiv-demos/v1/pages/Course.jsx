import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { ArrowRight, ExternalLink } from 'lucide-react';
import Disclosure from '@/components/patterns/Disclosure';
import { cn } from '@/lib/utils';
import { DemoLink, DemoMarkdown, useDemoPath } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { getCourse, THERAPIST_HUB } from '@/pages/metiv-demos/shared/therapist';
import { CourseRow } from '../components/Rows';
import {
  ArrowLink,
  ContactLines,
  CONTAINER,
  DatePlate,
  FOCUS,
  Initials,
  Linkify,
  MetaList,
  PillLink,
  StatusPill,
  useV1Title,
} from '../components/primitives';
import { categoryLabel, courseStatus, pad, runStatus, unitStatus } from '../lib';

/** @param {{ id: string, number: number, children: React.ReactNode }} props */
function SectionTitle({ id, number, children }) {
  return (
    <h2 id={id} className="mb-8 flex scroll-mt-40 items-baseline gap-4 border-t border-border pt-8 font-heading text-3xl font-light text-foreground md:text-4xl">
      <span aria-hidden="true" className="text-lg tabular-nums text-secondary">{pad(number)}</span>
      {children}
    </h2>
  );
}

/** @param {{ course: any }} props */
function RegistrationCard({ course }) {
  const status = courseStatus(course);
  const reg = course.registration;
  const canRegister = Boolean(reg?.url) && status.key !== 'closed';

  return (
    <div className="rounded-super border border-border bg-card p-6 shadow-card md:p-8">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground">פרטים והרשמה</p>
        <StatusPill status={status} />
      </div>
      {course.startDate && (
        <p className="mt-5">
          <span className="block text-xs text-muted-foreground">מועד פתיחה</span>
          <span className="font-heading text-3xl font-light text-foreground">{course.startDate}</span>
        </p>
      )}
      <MetaList
        className="mt-5"
        items={[
          { label: 'מתי', value: course.schedule },
          { label: 'משך', value: course.duration },
          { label: 'היקף', value: course.hours },
          { label: 'פורמט', value: course.format },
          { label: 'מיקום', value: course.location },
          { label: 'מחיר', value: course.price },
        ]}
      />
      {course.priceOptions?.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground">אפשרויות תשלום</p>
          <ul className="mt-2 space-y-1.5 text-sm text-foreground">
            {course.priceOptions.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </div>
      )}
      {course.credits?.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground">הכרה</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {course.credits.map((c) => (
              <li key={c} className="rounded-full bg-muted px-3 py-1 text-xs text-foreground">{c}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-7">
        {canRegister ? (
          <PillLink to={reg.url} size="lg" className="w-full">
            {reg.label}
            <ExternalLink aria-hidden="true" />
          </PillLink>
        ) : (
          <div className="rounded-super-sm bg-muted p-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              {status.key === 'closed'
                ? 'ההרשמה למחזור הזה סגורה. מועד המחזור הבא יפורסם.'
                : `${reg?.label || 'ההרשמה'}: מועד המחזור הבא יפורסם.`}
            </p>
            {reg?.url && status.key !== 'closed' ? null : (
              <ArrowLink to={THERAPIST_HUB.cta.url} className="mt-2 text-sm">לקבלת עדכון</ArrowLink>
            )}
          </div>
        )}
      </div>

      {course.contact && (
        <div className="mt-7 border-t border-border pt-5">
          <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground">שאלות ופרטים</p>
          <ContactLines contact={course.contact} />
        </div>
      )}
    </div>
  );
}

export default function Course() {
  const { slug } = useParams();
  const resolve = useDemoPath();
  const course = getCourse(slug || '');
  useV1Title(course?.title || 'קורס');
  if (!course) return <Navigate to={resolve(ROUTES.courses)} replace />;

  const status = courseStatus(course);
  const related = (course.relatedSlugs || []).map((s) => getCourse(s)).filter(Boolean);
  const canRegister = Boolean(course.registration?.url) && status.key !== 'closed';

  /** @type {{ id: string, label: string, show: boolean }[]} */
  const sections = [
    { id: 'about', label: 'על התכנית', show: Boolean(course.description) },
    { id: 'audience', label: 'למי מיועד', show: Boolean(course.audience?.length || course.prerequisites) },
    { id: 'runs', label: 'מחזורים', show: Boolean(course.formats?.length) },
    { id: 'units', label: 'יחידות לימוד', show: Boolean(course.units?.length) },
    { id: 'syllabus', label: 'סילבוס', show: Boolean(course.syllabus?.length) },
    { id: 'lecturers', label: 'סגל ההוראה', show: Boolean(course.lecturers?.length) },
    { id: 'faq', label: 'שאלות נפוצות', show: Boolean(course.faq?.length) },
    { id: 'voices', label: 'משתתפים מספרים', show: Boolean(course.testimonials?.length) },
  ].filter((s) => s.show);
  /** @param {string} id */
  const num = (id) => sections.findIndex((s) => s.id === id) + 1;

  return (
    <div className={cn(canRegister && 'pb-24 lg:pb-0')}>
      {/* Hero */}
      <section className="border-b border-border bg-background">
        <div className={cn(CONTAINER, 'py-10 md:py-20')}>
          <nav aria-label="פירורי לחם" className="mb-8 text-sm text-muted-foreground">
            <DemoLink to={ROUTES.courses} className={cn('inline-flex items-center gap-2 rounded-sm hover:text-primary', FOCUS)}>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
              קורסים והכשרות
            </DemoLink>
          </nav>
          <div className="grid items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-9">
              <p className="mb-5 flex flex-wrap items-center gap-3 text-xs font-semibold tracking-wide text-muted-foreground">
                <span aria-hidden="true" className="h-px w-8 bg-secondary" />
                {categoryLabel(course.category)}
                <StatusPill status={status} className="tracking-normal" />
              </p>
              <h1 className="font-heading text-[2.4rem] font-light leading-[1.06] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                {course.title}
              </h1>
              {course.subtitle && <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-2xl md:font-light">{course.subtitle}</p>}
              {course.tags?.length > 0 && (
                <ul className="mt-6 flex flex-wrap gap-2">
                  {course.tags.map((t) => (
                    <li key={t} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{t}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="hidden lg:col-span-3 lg:block">
              <DatePlate iso={course.startDateISO} fallback={course.startDate || 'מועד יפורסם'} className="ms-auto w-full max-w-[12rem]" />
            </div>
          </div>
          {sections.length > 2 && (
            <nav aria-label="בעמוד זה" className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-5 text-sm">
              {sections.map((s) => (
                <a key={s.id} href={`#${s.id}`} className={cn('rounded-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline', FOCUS)}>
                  {s.label}
                </a>
              ))}
            </nav>
          )}
        </div>
      </section>

      <div className={cn(CONTAINER, 'grid gap-12 py-12 md:py-20 lg:grid-cols-12 lg:gap-10')}>
        {/* Registration card: first on mobile, sticky on the end side on desktop */}
        <aside className="lg:order-2 lg:col-span-4 lg:col-start-9">
          <div className="lg:sticky lg:top-40">
            <RegistrationCard course={course} />
          </div>
        </aside>

        <div className="min-w-0 space-y-16 lg:order-1 lg:col-span-7 md:space-y-20">
          <p className="font-heading text-2xl font-light leading-[1.45] text-foreground md:text-3xl">{course.summary}</p>

          {course.description && (
            <section>
              <SectionTitle id="about" number={num('about')}>על התכנית</SectionTitle>
              <DemoMarkdown className="rich-content text-lg leading-[1.85] text-foreground">{course.description}</DemoMarkdown>
            </section>
          )}

          {(course.audience?.length > 0 || course.prerequisites) && (
            <section>
              <SectionTitle id="audience" number={num('audience')}>למי מיועד</SectionTitle>
              {course.audience?.length > 0 && (
                <ul className="flex flex-wrap gap-x-3 gap-y-2 font-heading text-xl font-light text-foreground md:text-2xl">
                  {course.audience.map((a, i) => (
                    <li key={a} className="flex items-center gap-3">
                      {a}
                      {i < course.audience.length - 1 && <span aria-hidden="true" className="text-secondary">·</span>}
                    </li>
                  ))}
                </ul>
              )}
              {course.prerequisites && (
                <div className="mt-8 rounded-super-sm bg-muted p-5">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground">דרישות קדם</p>
                  <p className="mt-2 leading-relaxed text-foreground"><Linkify text={course.prerequisites} /></p>
                </div>
              )}
            </section>
          )}

          {course.formats?.length > 0 && (
            <section>
              <SectionTitle id="runs" number={num('runs')}>מחזורים</SectionTitle>
              <ul className="space-y-4">
                {course.formats.map((run) => {
                  const st = runStatus(run);
                  return (
                    <li key={run.key} className={cn('rounded-super border p-6', st.key === 'open' ? 'border-primary/40 bg-card' : 'border-border')}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="font-heading text-xl text-foreground md:text-2xl md:font-light">{run.label}</h3>
                        <StatusPill status={st} />
                      </div>
                      <MetaList
                        className="mt-4"
                        items={[
                          { label: 'פורמט', value: run.format },
                          { label: 'מיקום', value: run.location },
                          { label: 'מועדים', value: run.schedule || run.startDate },
                          { label: 'היקף', value: run.hours },
                          { label: 'מחיר', value: run.price },
                          { label: 'מנחים', value: run.lecturers?.map((l) => l.name).join(', ') },
                        ]}
                      />
                      {run.note && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{run.note}</p>}
                      {run.registration?.url && st.key === 'open' && (
                        <PillLink to={run.registration.url} size="sm" className="mt-5">
                          {run.registration.label}
                          <ExternalLink aria-hidden="true" />
                        </PillLink>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {course.units?.length > 0 && (
            <section>
              <SectionTitle id="units" number={num('units')}>יחידות לימוד</SectionTitle>
              <ul className="grid gap-4 sm:grid-cols-2">
                {course.units.map((u) => (
                  <li key={u.slug} className="flex flex-col rounded-super border border-border bg-card p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <StatusPill status={unitStatus(u.status)} />
                      <span className="text-xs text-muted-foreground">{[u.format, u.hours].filter(Boolean).join(' · ')}</span>
                    </div>
                    {u.date && <p className="mt-4 text-sm text-muted-foreground">{u.date}</p>}
                    <h3 className="mt-1 font-heading text-2xl font-light leading-snug text-foreground">{u.title}</h3>
                    {u.tagline && <p className="mt-1 text-category-2">{u.tagline}</p>}
                    {u.lecturers?.length > 0 && (
                      <p className="mt-3 text-sm text-foreground">{u.lecturers.map((l) => l.name).join(', ')}</p>
                    )}
                    {u.description && (
                      <Disclosure label="על היחידה" variant="plain" size="tight" className="mt-4" labelClassName="text-sm">
                        <p className="text-sm leading-relaxed text-card-foreground">{u.description}</p>
                      </Disclosure>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {course.syllabus?.length > 0 && (
            <section>
              <SectionTitle id="syllabus" number={num('syllabus')}>סילבוס</SectionTitle>
              <ol className="space-y-12">
                {course.syllabus.map((sec, i) => (
                  <li key={sec.title} className="grid gap-4 sm:grid-cols-[5rem_1fr]">
                    <span aria-hidden="true" className="font-heading text-5xl font-light leading-none tabular-nums text-secondary md:text-6xl">
                      {pad(i + 1)}
                    </span>
                    <div>
                      <h3 className="font-heading text-2xl font-light leading-snug text-foreground">{sec.title}</h3>
                      <ol className="mt-4 divide-y divide-border border-y border-border">
                        {sec.items.map((item, j) => (
                          <li key={j} className="flex gap-4 py-3 leading-relaxed text-foreground">
                            <span className="w-6 shrink-0 pt-0.5 text-sm tabular-nums text-muted-foreground">{j + 1}</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {course.lecturers?.length > 0 && (
            <section>
              <SectionTitle id="lecturers" number={num('lecturers')}>סגל ההוראה</SectionTitle>
              <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                {course.lecturers.map((l) => (
                  <li key={l.name} className="flex gap-4">
                    <Initials name={l.name} />
                    <div>
                      <p className="font-medium text-foreground">{l.name}</p>
                      {l.role && <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{l.role}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {course.faq?.length > 0 && (
            <section>
              <SectionTitle id="faq" number={num('faq')}>שאלות נפוצות</SectionTitle>
              <div className="space-y-3">
                {course.faq.map((f) => (
                  <Disclosure key={f.q} label={f.q} variant="soft" size="compact">
                    <DemoMarkdown className="rich-content leading-relaxed text-foreground">{f.a}</DemoMarkdown>
                  </Disclosure>
                ))}
              </div>
            </section>
          )}

          {course.testimonials?.length > 0 && (
            <section>
              <SectionTitle id="voices" number={num('voices')}>משתתפים מספרים</SectionTitle>
              <div className="space-y-12">
                {course.testimonials.map((t) => (
                  <figure key={t.name + t.quote.slice(0, 12)} className="border-s-2 border-secondary ps-6">
                    <blockquote className="font-heading text-xl font-light leading-[1.55] text-category-2 md:text-2xl">{t.quote}</blockquote>
                    <figcaption className="mt-4 text-sm text-muted-foreground">
                      {t.name}
                      {t.role ? `, ${t.role}` : ''}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}

          <p className="border-t border-border pt-6 text-sm text-muted-foreground">
            המידע נאסף מאתר מטיב ועשוי להשתנות.{' '}
            <ArrowLink to={course.sourceUrl} className="text-sm">לעמוד המקורי</ArrowLink>
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <section className={cn(CONTAINER, 'pb-16 md:pb-24')}>
          <h2 className="mb-2 border-t border-border pt-10 font-heading text-3xl font-light text-foreground md:text-4xl">אולי יתאים גם</h2>
          <div>
            {related.map((c) => (
              <CourseRow key={c.slug} course={c} compact />
            ))}
          </div>
        </section>
      )}

      {canRegister && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{course.title}</p>
              <p className="text-xs text-muted-foreground">{course.startDate}</p>
            </div>
            <PillLink to={course.registration.url} size="sm">להרשמה</PillLink>
          </div>
        </div>
      )}
    </div>
  );
}
