import React from 'react';
import { ArrowLeft, Check, X as XIcon, Quote } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui';
import Disclosure from '@/components/patterns/Disclosure';
import { DemoLink, DemoMarkdown, useDemoChrome } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import {
  CHILDREN_FAMILY_INTRO,
  SUPERVISION,
  ORGANIZATION_PROGRAMS,
  PARTNERS,
  coursesByCategory,
  getCourse,
} from '@/pages/metiv-demos/shared/therapist';
import ContentLayout from '../components/ContentLayout';
import { StatusPill, registrationPill, KeyFacts, ContactCard, ExtLink, SectionTitle, Panel, Tag } from '../components/primitives';
import { THERAPIST_RAIL } from '../lib/nav';
import { statusOf, FORMAT_LABELS, formatKeys } from '../lib/courses';

const RICH = 'rich-content text-foreground leading-relaxed [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-semibold [&_strong]:font-semibold';

// ── Children and family ─────────────────────────────────────────────────────

export function ChildrenFamily() {
  const { PageHeader } = useDemoChrome();
  const I = CHILDREN_FAMILY_INTRO;
  const trainings = coursesByCategory('children-family');
  const toc = [
    { id: 'intro', label: 'מטיב ילדים' },
    { id: 'trainings', label: 'הכשרות למטפלים' },
    { id: 'models', label: 'המודלים הקבוצתיים' },
    { id: 'contact', label: 'יצירת קשר' },
  ];

  return (
    <div className="bg-background">
      <PageHeader tone="card" eyebrow="לאנשי מקצוע" title="ילדים ומשפחה" subtitle="הכשרות למטפלים בתחום הילדים וההורים, והמודלים הקבוצתיים שפותחו במטיב ילדים." />
      <ContentLayout rail={THERAPIST_RAIL} railTitle="לאנשי מקצוע" toc={toc} aside={<ContactCard contact={I.contact} title="מטיב ילדים" />}>
        <div className="space-y-14">
          <section aria-labelledby="intro">
            <SectionTitle id="intro" title={I.title} />
            <div className="space-y-4 text-lg leading-relaxed text-foreground">
              {I.paragraphs.map((p) => <p key={p}>{p}</p>)}
            </div>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
              <ExtLink href={I.trainingInterestFormUrl}>רישום התעניינות בהכשרות</ExtLink>
              <ExtLink href={I.programSiteUrl}>אתר תכניות פנד"ה</ExtLink>
            </div>
          </section>

          <section aria-labelledby="trainings">
            <SectionTitle id="trainings" title="הכשרות למטפלים" description="הכשרות שנפתחות מפעם לפעם, לפי ביקוש." />
            <ul className="mb-5 flex flex-wrap gap-2">
              {I.periodicTrainings.map((t) => <li key={t}><Tag className="px-3 py-1 text-sm">{t}</Tag></li>)}
            </ul>
            <ul className="divide-y divide-border overflow-hidden rounded-super-sm border border-border bg-card">
              {trainings.map((c) => {
                const p = registrationPill(statusOf(c));
                return (
                  <li key={c.slug}>
                    <DemoLink to={`${ROUTES.courses}/${c.slug}`} className="group grid gap-2 p-4 hover:bg-muted sm:grid-cols-[minmax(0,1fr)_9rem_auto] sm:items-center">
                      <span className="min-w-0">
                        <span className="block font-semibold text-foreground group-hover:text-primary">{c.title}</span>
                        <span className="block text-sm text-muted-foreground line-clamp-1">{c.summary}</span>
                      </span>
                      <span className="text-sm text-muted-foreground">{formatKeys(c).map((k) => FORMAT_LABELS[k]).join(', ')}</span>
                      <StatusPill tone={p.tone} className="justify-self-start">{p.label}</StatusPill>
                    </DemoLink>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-labelledby="models">
            <SectionTitle id="models" title="המודלים הקבוצתיים" description="תכניות קבוצתיות לילדים, להורים ולצמדי הורה-ילד." />
            <div className="space-y-5">
              {I.models.map((m) => {
                const training = m.trainingSlug ? getCourse(m.trainingSlug) : null;
                return (
                  <article key={m.key} id={`model-${m.key}`} className="rounded-super-sm border border-border bg-card p-5 sm:p-6">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-heading text-xl font-semibold text-foreground">{m.title}</h3>
                      {m.fullName && <p className="text-sm text-muted-foreground">{m.fullName}</p>}
                    </div>
                    <KeyFacts
                      className="mt-4"
                      columns="sm:grid-cols-3"
                      items={[
                        { label: 'גילאים', value: m.ages },
                        { label: 'מבנה', value: m.structure },
                        { label: 'פיתוח', value: m.developedBy },
                      ]}
                    />
                    <p className="mt-4 leading-relaxed text-foreground">{m.description}</p>
                    {m.keyMessages?.length ? (
                      <div className="mt-4">
                        <p className="mb-2 text-sm font-semibold text-foreground">מסרים מרכזיים</p>
                        <ol className="grid gap-1.5 sm:grid-cols-2">
                          {m.keyMessages.map((k, i) => (
                            <li key={k} className="flex gap-2 text-sm text-foreground">
                              <span className="font-semibold text-primary">{i + 1}.</span> {k}
                            </li>
                          ))}
                        </ol>
                      </div>
                    ) : null}
                    <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-4 text-sm">
                      {training && (
                        <DemoLink to={`${ROUTES.courses}/${training.slug}`} className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
                          להכשרת המנחים: {training.title} <ArrowLeft aria-hidden="true" className="w-4 h-4" />
                        </DemoLink>
                      )}
                      <ExtLink href={m.sourceUrl} className="text-muted-foreground">מקור</ExtLink>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="contact">
            <SectionTitle id="contact" title="יצירת קשר" />
            <ContactCard contact={I.contact} title="מטיב ילדים" className="max-w-md" />
          </section>
        </div>
      </ContentLayout>
    </div>
  );
}

// ── Supervision ─────────────────────────────────────────────────────────────

export function Supervision() {
  const { PageHeader } = useDemoChrome();
  const S = SUPERVISION;
  const toc = [
    { id: 'intro', label: 'הדרכה בטיפול בטראומה' },
    { id: 'compare', label: 'השוואת האפשרויות' },
    { id: 'options', label: 'פירוט לפי אפשרות' },
    { id: 'clients', label: 'ארגונים שקיבלו הדרכה' },
  ];
  /** @param {{ email?: string }} [c] */
  const mail = (c) => (c?.email ? <a href={`mailto:${c.email}`} className="text-primary hover:underline" dir="ltr">{c.email}</a> : null);

  return (
    <div className="bg-background">
      <PageHeader tone="card" eyebrow="לאנשי מקצוע" title="הדרכה" subtitle={S.title} />
      <ContentLayout rail={THERAPIST_RAIL} railTitle="לאנשי מקצוע" toc={toc} aside={<ContactCard contact={S.contact} title="לתיאום הדרכה" />}>
        <div className="space-y-14">
          <section aria-labelledby="intro">
            <SectionTitle id="intro" title="הדרכה בטיפול בטראומה" />
            <p className="text-lg leading-relaxed text-foreground">{S.intro}</p>
            <Panel className="mt-6 bg-muted">
              <p className="font-heading font-semibold text-foreground">שאלות שמטפלים מביאים להדרכה</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {S.challenges.map((c) => (
                  <li key={c} className="flex gap-2 text-foreground">
                    <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" /> {c}
                  </li>
                ))}
              </ul>
            </Panel>
          </section>

          <section aria-labelledby="compare">
            <SectionTitle id="compare" title="השוואת האפשרויות" description={`${S.options.length} מסגרות הדרכה, זו לצד זו.`} />
            <div className="hidden overflow-hidden rounded-super-sm border border-border bg-card md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted hover:bg-muted">
                    <TableHead className="text-start font-semibold text-foreground">אפשרות</TableHead>
                    <TableHead className="text-start font-semibold text-foreground">מבנה</TableHead>
                    <TableHead className="text-start font-semibold text-foreground">עלות</TableHead>
                    <TableHead className="text-start font-semibold text-foreground">פנייה</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {S.options.map((o) => (
                    <TableRow key={o.key} className="align-top">
                      <TableCell className="py-3.5">
                        <a href={`#option-${o.key}`} className="font-semibold text-foreground hover:text-primary hover:underline">{o.title}</a>
                        {o.facilitator && <p className="text-sm text-muted-foreground">בהנחיית {o.facilitator}</p>}
                      </TableCell>
                      <TableCell className="py-3.5 text-sm text-foreground">{o.format}</TableCell>
                      <TableCell className="py-3.5 text-sm text-foreground">{o.price || 'בפנייה'}</TableCell>
                      <TableCell className="py-3.5 text-sm">{mail(o.contact) || (o.registrationUrl ? <span className="text-muted-foreground">בטופס הרשמה</span> : <span className="text-muted-foreground">דרך קורס מפת הדרכים</span>)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ul className="space-y-3 md:hidden">
              {S.options.map((o) => (
                <li key={o.key} className="rounded-super-sm border border-border bg-card p-4">
                  <a href={`#option-${o.key}`} className="font-semibold text-foreground">{o.title}</a>
                  <dl className="mt-2 grid grid-cols-[4.5rem_1fr] gap-x-3 gap-y-1 text-sm">
                    <dt className="text-muted-foreground">מבנה</dt><dd className="text-foreground">{o.format}</dd>
                    <dt className="text-muted-foreground">עלות</dt><dd className="text-foreground">{o.price || 'בפנייה'}</dd>
                    {o.contact?.email && <><dt className="text-muted-foreground">פנייה</dt><dd>{mail(o.contact)}</dd></>}
                  </dl>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="options">
            <SectionTitle id="options" title="פירוט לפי אפשרות" />
            <div className="space-y-3">
              {S.options.map((o, i) => (
                <div key={o.key} id={`option-${o.key}`}>
                  <Disclosure
                    variant="outlined"
                    size="compact"
                    defaultOpen={i === 0}
                    label={<>{o.title} <span className="ms-1 text-sm font-normal text-muted-foreground">{o.format}</span></>}
                  >
                    <div className="space-y-4 border-t border-border pt-4">
                      <p className="leading-relaxed text-foreground">{o.description}</p>
                      {o.details?.length ? (
                        <ul className="space-y-1.5">
                          {o.details.map((d) => (
                            <li key={d} className="flex gap-2 text-foreground"><span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" /> {d}</li>
                          ))}
                        </ul>
                      ) : null}
                      {(o.suitableFor?.length || o.notSuitableFor?.length) ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {o.suitableFor?.length ? (
                            <div className="rounded-xl bg-muted p-4">
                              <p className="mb-2 text-sm font-semibold text-foreground">מתאים ל</p>
                              <ul className="space-y-1">{o.suitableFor.map((s) => <li key={s} className="flex gap-2 text-sm text-foreground"><Check aria-hidden="true" className="mt-0.5 w-4 h-4 shrink-0 text-success" />{s}</li>)}</ul>
                            </div>
                          ) : null}
                          {o.notSuitableFor?.length ? (
                            <div className="rounded-xl border border-border p-4">
                              <p className="mb-2 text-sm font-semibold text-foreground">פחות מתאים ל</p>
                              <ul className="space-y-1">{o.notSuitableFor.map((s) => <li key={s} className="flex gap-2 text-sm text-foreground"><XIcon aria-hidden="true" className="mt-0.5 w-4 h-4 shrink-0 text-muted-foreground" />{s}</li>)}</ul>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                      <KeyFacts
                        items={[
                          { label: 'עלות', value: o.price },
                          { label: 'מנחה', value: o.facilitator },
                          { label: 'מועד פתיחה שפורסם', value: o.startDate ? `${o.startDate}${o.isPast ? ' (התקיים)' : ''}` : undefined },
                        ]}
                        columns="sm:grid-cols-3"
                      />
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                        {o.contact?.email && <span>לפנייה: {mail(o.contact)}</span>}
                        {o.registrationUrl && !o.isPast && <ExtLink href={o.registrationUrl}>להרשמה</ExtLink>}
                        {o.isPast && <StatusPill tone="neutral">המחזור שפורסם התקיים</StatusPill>}
                        <ExtLink href={o.sourceUrl} className="text-muted-foreground">מקור</ExtLink>
                      </div>
                    </div>
                  </Disclosure>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="clients">
            <SectionTitle id="clients" title="ארגונים שקיבלו הדרכה ממטיב" />
            <ul className="flex flex-wrap gap-2">
              {S.clientList.map((c) => <li key={c} className="rounded-xl border border-border bg-card px-3.5 py-2 text-sm text-foreground">{c}</li>)}
            </ul>
          </section>
        </div>
      </ContentLayout>
    </div>
  );
}

// ── Organizations ───────────────────────────────────────────────────────────

export function Organizations() {
  const { PageHeader } = useDemoChrome();
  const toc = [
    { id: 'overview', label: 'תוכניות לארגונים' },
    ...ORGANIZATION_PROGRAMS.map((p) => ({ id: p.slug, label: p.title })),
    { id: 'clients', label: 'ארגונים שעבדנו איתם' },
  ];
  const clients = [...new Set([...ORGANIZATION_PROGRAMS.flatMap((p) => p.clientList), ...PARTNERS])];

  return (
    <div className="bg-background">
      <PageHeader tone="card" eyebrow="לאנשי מקצוע" title="לארגונים" subtitle="הכשרות, ליווי וסדנאות לארגונים, למוסדות ולצוותים טיפוליים הפוגשים אנשים שחוו טראומה." />
      <ContentLayout rail={THERAPIST_RAIL} railTitle="לאנשי מקצוע" toc={toc}>
        <div className="space-y-14">
          <section aria-labelledby="overview">
            <SectionTitle id="overview" title="תוכניות לארגונים" description="ארבע מסגרות עבודה. בכל אחת אפשר לפנות לאיש הקשר לבניית תכנית." />
            <ul className="grid gap-3 sm:grid-cols-2">
              {ORGANIZATION_PROGRAMS.map((p) => (
                <li key={p.slug}>
                  <a href={`#${p.slug}`} className="group flex h-full flex-col rounded-super-sm border border-border bg-card p-4 hover:border-primary">
                    <span className="font-heading text-lg font-semibold text-foreground group-hover:text-primary">{p.title}</span>
                    <span className="mt-1 flex-1 text-sm leading-snug text-muted-foreground">{p.summary}</span>
                    <span className="mt-3 flex flex-wrap gap-1.5">{p.formats.map((f) => <Tag key={f}>{f}</Tag>)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>

          {ORGANIZATION_PROGRAMS.map((p) => {
            const course = p.relatedCourseSlug ? getCourse(p.relatedCourseSlug) : null;
            return (
              <section key={p.slug} aria-labelledby={p.slug} className="border-t border-border pt-10">
                <SectionTitle id={p.slug} eyebrow={p.subtitle} title={p.title} description={p.summary} />
                <KeyFacts
                  items={[
                    { label: 'מבנה', value: p.formats.join(' · ') },
                    { label: 'קהל יעד', value: p.audience.join(' · ') },
                  ]}
                />
                {p.topics?.length ? (
                  <div className="mt-6">
                    <p className="mb-2 font-semibold text-foreground">נושאים</p>
                    <ul className="grid gap-1.5 sm:grid-cols-2">
                      {p.topics.map((t) => <li key={t} className="flex gap-2 text-foreground"><span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" /> {t}</li>)}
                    </ul>
                  </div>
                ) : null}
                <Disclosure className="mt-6" variant="soft" size="compact" label="התיאור המלא">
                  <DemoMarkdown className={RICH}>{p.description}</DemoMarkdown>
                </Disclosure>
                {p.voices?.length ? (
                  <div className="mt-6">
                    <p className="mb-3 font-semibold text-foreground">קולות שנאספו מאנשים שחוו טראומה, על המפגש עם שירותים</p>
                    <ul className="grid gap-3 md:grid-cols-2">
                      {p.voices.map((v) => (
                        <li key={v} className="rounded-xl bg-muted p-4">
                          <Quote aria-hidden="true" className="w-4 h-4 text-primary" />
                          <blockquote className="mt-1 text-sm leading-relaxed text-foreground">{v}</blockquote>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_18rem]">
                  <div className="space-y-2">
                    {p.links?.map((l) => <ExtLink key={l.url} href={l.url} className="flex">{l.label}</ExtLink>)}
                    {course && (
                      <DemoLink to={`${ROUTES.courses}/${course.slug}`} className="flex items-center gap-1.5 font-medium text-primary hover:underline">
                        בקטלוג: {course.title} <ArrowLeft aria-hidden="true" className="w-4 h-4" />
                      </DemoLink>
                    )}
                    <ExtLink href={p.sourceUrl} className="flex text-sm text-muted-foreground">מקור</ExtLink>
                  </div>
                  <ContactCard contact={p.contact} />
                </div>
              </section>
            );
          })}

          <section aria-labelledby="clients" className="border-t border-border pt-10">
            <SectionTitle id="clients" title="ארגונים שעבדנו איתם" description="כפי שמופיעים בעמודי ההכשרות והסדנאות באתר מטיב." />
            <ul className="flex flex-wrap gap-2">
              {clients.map((c) => <li key={c} className="rounded-xl border border-border bg-card px-3.5 py-2 text-sm text-foreground">{c}</li>)}
            </ul>
          </section>
        </div>
      </ContentLayout>
    </div>
  );
}
