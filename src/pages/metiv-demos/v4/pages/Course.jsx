import React from 'react';
import { useParams } from 'react-router-dom';
import { CalendarDays, Clock, Wallet, MapPin, Award, Timer, MonitorSmartphone, Repeat, Quote, ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui';
import Disclosure from '@/components/patterns/Disclosure';
import { DemoLink, DemoMarkdown, useDemoChrome } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { getCourse } from '@/pages/metiv-demos/shared/therapist';
import { StatusPill, registrationPill, unitPill, KeyFacts, ContactCard, Tag, Avatar, ExtLink, SectionTitle } from '../components/primitives';
import { categoryLabel, statusOf } from '../lib/courses';

const RICH = 'rich-content text-foreground leading-relaxed [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:font-semibold [&_strong]:font-semibold';

/** @param {{ id: string, title: string, children: React.ReactNode }} props */
function Block({ id, title, children }) {
  return (
    <section aria-labelledby={id} className="border-t border-border pt-8 first:border-t-0 first:pt-0">
      <SectionTitle id={id} title={title} className="mb-4" />
      {children}
    </section>
  );
}

export default function Course() {
  const { PageHeader } = useDemoChrome();
  const { slug = '' } = useParams();
  const course = getCourse(slug);

  if (!course) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h1 className="font-heading text-3xl font-semibold text-foreground">התכנית לא נמצאה</h1>
        <p className="mt-2 text-muted-foreground">ייתכן שהקישור השתנה. אפשר לחפש אותה בקטלוג.</p>
        <Button asChild variant="solid" radius="full" size="roomy" className="mt-6">
          <DemoLink to={ROUTES.courses}>לקטלוג הקורסים</DemoLink>
        </Button>
      </div>
    );
  }

  const status = statusOf(course);
  const pill = registrationPill(status);
  const reg = course.registration;
  const related = (course.relatedSlugs || []).map((s) => getCourse(s)).filter(Boolean);

  const sections = [
    { id: 'overview', label: 'על התכנית', show: true },
    { id: 'audience', label: 'למי מיועד', show: Boolean(course.audience?.length || course.prerequisites) },
    { id: 'syllabus', label: 'תכנית הלימודים', show: Boolean(course.syllabus?.length) },
    { id: 'runs', label: 'מחזורים ומועדים', show: Boolean(course.formats?.length) },
    { id: 'units', label: 'יחידות הלימוד', show: Boolean(course.units?.length) },
    { id: 'lecturers', label: 'צוות ההוראה', show: Boolean(course.lecturers?.length) },
    { id: 'faq', label: 'שאלות נפוצות', show: Boolean(course.faq?.length) },
    { id: 'testimonials', label: 'מדברי משתתפים', show: Boolean(course.testimonials?.length) },
    { id: 'related', label: 'תכניות קשורות', show: related.length > 0 },
  ].filter((s) => s.show);

  const facts = [
    { label: 'מועד פתיחה', value: course.startDate, icon: CalendarDays },
    { label: 'מועדים', value: course.schedule, icon: Repeat },
    { label: 'משך', value: course.duration, icon: Timer },
    { label: 'היקף שעות', value: course.hours, icon: Clock },
    {
      label: 'מחיר',
      icon: Wallet,
      value: course.price || course.priceOptions?.length ? (
        <>
          {course.price}
          {course.priceOptions?.length ? (
            <ul className="mt-1 space-y-0.5 text-sm font-normal text-muted-foreground">
              {course.priceOptions.map((p) => <li key={p}>{p}</li>)}
            </ul>
          ) : null}
        </>
      ) : undefined,
    },
    { label: 'פורמט', value: course.format, icon: MonitorSmartphone },
    { label: 'מיקום', value: course.location, icon: MapPin },
    { label: 'הכרה וגמול', value: course.credits?.length ? course.credits.join(' · ') : undefined, icon: Award },
  ];

  const canRegister = Boolean(reg?.url) && status !== 'closed';

  return (
    <div className="bg-background">
      <PageHeader
        tone="card"
        eyebrow={categoryLabel(course.category)}
        title={course.title}
        subtitle={course.subtitle}
        meta={
          <>
            <StatusPill tone={pill.tone}>{pill.label}</StatusPill>
            {course.isPast && <StatusPill tone="neutral">המחזור שפורסם התקיים</StatusPill>}
            {course.tags.map((t) => <Tag key={t}>{t}</Tag>)}
          </>
        }
      />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:py-12">
        {/* Sticky key facts: first on mobile, end column on desktop */}
        <aside aria-label="פרטים עיקריים" className="order-first lg:order-last">
          <div className="space-y-4 lg:sticky lg:top-[8.5rem]">
            <div className="rounded-super-sm border border-border bg-card p-5 shadow-card">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="font-heading text-lg font-semibold text-foreground">פרטים עיקריים</p>
                <StatusPill tone={pill.tone}>{pill.label}</StatusPill>
              </div>
              <KeyFacts items={facts} columns="grid-cols-1" />
              <div className="mt-4">
                {canRegister ? (
                  <Button asChild variant="elevated" radius="full" size="roomy-lg" className="w-full">
                    <a href={reg?.url} target="_blank" rel="noreferrer">
                      {reg?.label} <ExternalLink aria-hidden="true" />
                    </a>
                  </Button>
                ) : (
                  <p className="rounded-xl bg-muted px-4 py-3 text-sm leading-relaxed text-foreground">
                    {status === 'closed'
                      ? 'ההרשמה למחזור שפורסם נסגרה. מועדים חדשים יפורסמו בעמוד זה ובעמוד האירועים.'
                      : `${reg?.label || 'לפרטים והרשמה'}: אפשר לפנות לאיש הקשר.`}
                  </p>
                )}
              </div>
            </div>
            <ContactCard contact={course.contact} />
          </div>
        </aside>

        <div className="min-w-0">
          {sections.length > 2 && (
            <nav aria-label="בעמוד זה" className="mb-8 flex flex-wrap gap-2">
              {sections.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-foreground hover:border-primary hover:text-primary">
                  {s.label}
                </a>
              ))}
            </nav>
          )}

          <div className="space-y-10">
            <Block id="overview" title="על התכנית">
              <p className="mb-5 text-lg leading-relaxed text-foreground">{course.summary}</p>
              <DemoMarkdown className={RICH}>{course.description}</DemoMarkdown>
            </Block>

            {sections.some((s) => s.id === 'audience') && (
              <Block id="audience" title="למי מיועד">
                {course.audience?.length ? (
                  <ul className="flex flex-wrap gap-2">
                    {course.audience.map((a) => (
                      <li key={a} className="rounded-xl border border-border bg-card px-3 py-1.5 text-sm text-foreground">{a}</li>
                    ))}
                  </ul>
                ) : null}
                {course.prerequisites && (
                  <div className="mt-4 rounded-xl bg-muted p-4">
                    <p className="text-sm font-semibold text-foreground">דרישות קדם</p>
                    <DemoMarkdown className="rich-content mt-1 text-foreground [&_a]:text-primary [&_a]:underline">{course.prerequisites}</DemoMarkdown>
                  </div>
                )}
              </Block>
            )}

            {course.syllabus?.length ? (
              <Block id="syllabus" title="תכנית הלימודים">
                <ol className="space-y-3">
                  {course.syllabus.map((sec, i) => (
                    <li key={sec.title}>
                      <Disclosure
                        variant="soft"
                        size="compact"
                        defaultOpen={i === 0}
                        leading={<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted font-heading font-semibold text-primary">{i + 1}</span>}
                        label={<>{sec.title} <span className="ms-1 text-sm font-normal text-muted-foreground">({sec.items.length} נושאים)</span></>}
                      >
                        <ul className="space-y-2 border-t border-border pt-3">
                          {sec.items.map((item) => (
                            <li key={item} className="flex gap-2.5 leading-relaxed text-foreground">
                              <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </Disclosure>
                    </li>
                  ))}
                </ol>
              </Block>
            ) : null}

            {course.formats?.length ? (
              <Block id="runs" title="מחזורים ומועדים">
                <div className="hidden overflow-hidden rounded-super-sm border border-border bg-card md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted hover:bg-muted">
                        <TableHead className="text-start font-semibold text-foreground">מחזור</TableHead>
                        <TableHead className="text-start font-semibold text-foreground">מועדים</TableHead>
                        <TableHead className="text-start font-semibold text-foreground">היקף ומחיר</TableHead>
                        <TableHead className="text-start font-semibold text-foreground">סטטוס</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {course.formats.map((f) => {
                        const p = f.isPast ? { tone: /** @type {const} */ ('neutral'), label: 'התקיים' } : registrationPill(f.registration?.status);
                        return (
                          <TableRow key={f.key} className="align-top">
                            <TableCell className="py-3.5">
                              <p className="font-semibold text-foreground">{f.label}</p>
                              <p className="text-sm text-muted-foreground">{f.format}{f.location ? ` · ${f.location}` : ''}</p>
                              {f.lecturers?.length ? <p className="mt-1 text-sm text-muted-foreground">{f.lecturers.map((l) => l.name).join(', ')}</p> : null}
                            </TableCell>
                            <TableCell className="py-3.5 text-sm text-foreground">
                              {f.startDate}
                              {f.schedule && <span className="block text-muted-foreground">{f.schedule}</span>}
                              {f.note && <span className="mt-1 block text-xs text-muted-foreground">{f.note}</span>}
                            </TableCell>
                            <TableCell className="py-3.5 text-sm text-foreground">
                              {f.hours}
                              {f.price && <span className="block">{f.price}</span>}
                            </TableCell>
                            <TableCell className="space-y-2 py-3.5">
                              <StatusPill tone={p.tone}>{p.label}</StatusPill>
                              {!f.isPast && f.registration?.url && f.registration.status === 'open' && (
                                <ExtLink href={f.registration.url} className="block text-sm">{f.registration.label}</ExtLink>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <ul className="space-y-3 md:hidden">
                  {course.formats.map((f) => {
                    const p = f.isPast ? { tone: /** @type {const} */ ('neutral'), label: 'התקיים' } : registrationPill(f.registration?.status);
                    return (
                      <li key={f.key} className="rounded-super-sm border border-border bg-card p-4">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-foreground">{f.label}</p>
                          <StatusPill tone={p.tone}>{p.label}</StatusPill>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{f.format} · {f.startDate}</p>
                        {f.schedule && <p className="text-sm text-foreground">{f.schedule}</p>}
                        {(f.hours || f.price) && <p className="text-sm text-foreground">{[f.hours, f.price].filter(Boolean).join(' · ')}</p>}
                        {!f.isPast && f.registration?.url && f.registration.status === 'open' && (
                          <ExtLink href={f.registration.url} className="mt-2 text-sm">{f.registration.label}</ExtLink>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Block>
            ) : null}

            {course.units?.length ? (
              <Block id="units" title="יחידות הלימוד">
                <ul className="grid gap-3 sm:grid-cols-2">
                  {course.units.map((u) => {
                    const p = unitPill(u.status);
                    return (
                      <li key={u.slug} className="flex flex-col rounded-super-sm border border-border bg-card p-4">
                        <StatusPill tone={p.tone} className="self-start">{p.label}</StatusPill>
                        <p className="mt-2 font-heading font-semibold leading-snug text-foreground">{u.title}</p>
                        {u.tagline && <p className="text-sm text-muted-foreground">{u.tagline}</p>}
                        {(u.date || u.hours || u.format) && (
                          <p className="mt-2 text-sm text-foreground">{[u.date, u.hours, u.format, u.location].filter(Boolean).join(' · ')}</p>
                        )}
                        {u.lecturers?.length ? <p className="text-sm text-muted-foreground">{u.lecturers.map((l) => l.name).join(', ')}</p> : null}
                        {u.description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-4">{u.description}</p>}
                      </li>
                    );
                  })}
                </ul>
              </Block>
            ) : null}

            {course.lecturers?.length ? (
              <Block id="lecturers" title="צוות ההוראה">
                <ul className="grid gap-3 sm:grid-cols-2">
                  {course.lecturers.map((l) => (
                    <li key={l.name} className="flex gap-3 rounded-super-sm border border-border bg-card p-4">
                      <Avatar name={l.name} />
                      <div>
                        <p className="font-semibold text-foreground">{l.name}</p>
                        {l.role && <p className="text-sm leading-snug text-muted-foreground">{l.role}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </Block>
            ) : null}

            {course.faq?.length ? (
              <Block id="faq" title="שאלות נפוצות">
                <div className="space-y-2">
                  {course.faq.map((f) => (
                    <Disclosure key={f.q} label={f.q} variant="soft" size="compact">
                      <DemoMarkdown className="rich-content text-foreground">{f.a}</DemoMarkdown>
                    </Disclosure>
                  ))}
                </div>
              </Block>
            ) : null}

            {course.testimonials?.length ? (
              <Block id="testimonials" title="מדברי משתתפים">
                <ul className="grid gap-4 md:grid-cols-2">
                  {course.testimonials.map((t) => (
                    <li key={t.quote} className="flex flex-col rounded-super-sm bg-muted p-5">
                      <Quote aria-hidden="true" className="w-5 h-5 text-primary" />
                      <blockquote className="mt-2 flex-1 leading-relaxed text-foreground line-clamp-[8]">{t.quote}</blockquote>
                      <p className="mt-3 text-sm font-semibold text-foreground">{t.name}</p>
                      {t.role && <p className="text-sm text-muted-foreground">{t.role}</p>}
                    </li>
                  ))}
                </ul>
              </Block>
            ) : null}

            {related.length > 0 && (
              <Block id="related" title="תכניות קשורות">
                <ul className="divide-y divide-border rounded-super-sm border border-border bg-card">
                  {related.map((r) => {
                    const rp = registrationPill(statusOf(r));
                    return (
                      <li key={r.slug}>
                        <DemoLink to={`${ROUTES.courses}/${r.slug}`} className="group flex flex-wrap items-center gap-3 p-4 hover:bg-muted">
                          <span className="min-w-0 flex-1">
                            <span className="block font-semibold text-foreground group-hover:text-primary">{r.title}</span>
                            <span className="block text-sm text-muted-foreground line-clamp-1">{r.summary}</span>
                          </span>
                          <StatusPill tone={rp.tone}>{rp.label}</StatusPill>
                          <ArrowLeft aria-hidden="true" className="w-4 h-4 text-muted-foreground" />
                        </DemoLink>
                      </li>
                    );
                  })}
                </ul>
              </Block>
            )}

            <p className="border-t border-border pt-6 text-sm text-muted-foreground">
              מקור המידע: <ExtLink href={course.sourceUrl}>העמוד באתר מטיב</ExtLink>
              {course.relatedSourceUrls?.map((u, i) => (
                <span key={u}> · <ExtLink href={u}>עמוד נוסף {i + 1}</ExtLink></span>
              ))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
