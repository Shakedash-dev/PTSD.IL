import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { ExternalLink, Mail, Phone, MessageCircle, ChevronLeft, Quote, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DemoLink, DemoMarkdown, useDemoChrome, useDemoPath } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { getCourse } from '@/pages/metiv-demos/shared/therapist';
import { cn } from '@/lib/utils';
import { FOCUS_DARK, PROSE_DARK, telHref, whatsappHref } from '../lib';
import { AreaDisclosure, Avatar, Container, Fact, Linkify, Panel, SectionTitle, StatusPill, Tag, regKind } from '../components/ui';
import { CourseCard, categoryLabel, courseStatusKind } from '../components/cards';

/** @type {Record<string, { kind: any, label: string }>} */
const UNIT_STATUS = { ended: { kind: 'past', label: 'התקיימה' }, closed: { kind: 'closed', label: 'הרשמה נסגרה' }, soon: { kind: 'soon', label: 'בקרוב' } };

function Breadcrumb({ title }) {
  return (
    <nav aria-label="מיקום בעמוד">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-sanctuary-foreground/80">
        <li>
          <DemoLink to={ROUTES.therapist} className={cn('hover:underline underline-offset-4 rounded', FOCUS_DARK)}>
            אנשי מקצוע
          </DemoLink>
        </li>
        <li aria-hidden="true">
          <ChevronLeft className="w-4 h-4" />
        </li>
        <li>
          <DemoLink to={ROUTES.courses} className={cn('hover:underline underline-offset-4 rounded', FOCUS_DARK)}>
            קורסים
          </DemoLink>
        </li>
        <li aria-hidden="true">
          <ChevronLeft className="w-4 h-4" />
        </li>
        <li aria-current="page" className="text-sanctuary-foreground line-clamp-1">
          {title}
        </li>
      </ol>
    </nav>
  );
}

/**
 * Register action: a real link only when registration is open.
 * @param {{ course: any, size?: 'pill'|'pill-lg', className?: string }} props
 */
function RegisterAction({ course, size = 'pill-lg', className = '' }) {
  const r = course.registration;
  const kind = courseStatusKind(course);
  if (r?.url && kind === 'open') {
    return (
      <Button asChild variant="pill-light" size={size} className={cn(FOCUS_DARK, className)}>
        <a href={r.url} target="_blank" rel="noopener noreferrer">
          {r.label || 'להרשמה'}
          <ExternalLink aria-hidden="true" />
        </a>
      </Button>
    );
  }
  if (r?.url && kind === 'unknown') {
    return (
      <Button asChild variant="pill-light" size={size} className={cn(FOCUS_DARK, className)}>
        <a href={r.url} target="_blank" rel="noopener noreferrer">
          {r.label}
          <ExternalLink aria-hidden="true" />
        </a>
      </Button>
    );
  }
  return (
    <a href="#register" className={cn('inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full border-2 border-sanctuary-foreground/40 font-semibold hover:bg-sanctuary-foreground/10 transition-colors duration-300', FOCUS_DARK, className)}>
      {kind === 'past' ? 'לקבלת עדכון על מחזור הבא' : 'לפרטים ופנייה'}
    </a>
  );
}

function ContactBlock({ contact }) {
  if (!contact) return null;
  const row = cn('flex items-center gap-2 rounded-lg hover:underline underline-offset-4', FOCUS_DARK);
  return (
    <div className="space-y-2 text-sm">
      {(contact.name || contact.role) && (
        <p>
          {contact.name && <span className="font-semibold">{contact.name}</span>}
          {contact.role && <span className="text-sanctuary-foreground/75">{contact.name ? `, ${contact.role}` : contact.role}</span>}
        </p>
      )}
      {contact.email && (
        <a href={`mailto:${contact.email}`} className={row}>
          <Mail className="w-4 h-4" aria-hidden="true" />
          <span dir="ltr">{contact.email}</span>
        </a>
      )}
      {contact.phone && (
        <a href={telHref(contact.phone)} className={row}>
          <Phone className="w-4 h-4" aria-hidden="true" />
          <span dir="ltr">{contact.phone}</span>
        </a>
      )}
      {contact.whatsapp && (
        <a href={whatsappHref(contact.whatsapp)} target="_blank" rel="noopener noreferrer" className={row}>
          <MessageCircle className="w-4 h-4" aria-hidden="true" />
          וואטסאפ <span dir="ltr">{contact.whatsapp}</span>
        </a>
      )}
    </div>
  );
}

export default function CourseDetail() {
  const { slug } = useParams();
  const { PageHeader } = useDemoChrome();
  const resolve = useDemoPath();
  const c = getCourse(slug || '');
  if (!c) return <Navigate to={resolve(ROUTES.courses)} replace />;

  const kind = courseStatusKind(c);
  const related = (c.relatedSlugs || []).map((s) => getCourse(s)).filter(Boolean);
  /** @type {{ id: string, label: string, show: boolean }[]} */
  const allSections = [
    { id: 'overview', label: 'סקירה', show: true },
    { id: 'syllabus', label: 'סילבוס', show: Boolean(c.syllabus?.length) },
    { id: 'runs', label: 'מחזורים', show: Boolean(c.formats?.length) },
    { id: 'units', label: 'יחידות הלימוד', show: Boolean(c.units?.length) },
    { id: 'lecturers', label: 'מרצים', show: Boolean(c.lecturers?.length) },
    { id: 'voices', label: 'משתתפים מספרים', show: Boolean(c.testimonials?.length) },
    { id: 'faq', label: 'שאלות', show: Boolean(c.faq?.length) },
    { id: 'register', label: 'הרשמה ופנייה', show: true },
  ];
  const sections = allSections.filter((x) => x.show);

  return (
    <div className="pb-20 lg:pb-0">
      <PageHeader
        breadcrumb={<Breadcrumb title={c.title} />}
        eyebrow={categoryLabel(c.category)}
        title={c.title}
        subtitle={c.subtitle || c.summary}
        meta={
          <>
            <StatusPill kind={kind} label={kind === 'unknown' ? 'מועד יתעדכן' : undefined} />
            {c.tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </>
        }
        actions={
          <>
            <RegisterAction course={c} />
            {c.contact && (
              <a href="#register" className={cn('inline-flex items-center h-14 px-6 rounded-full font-semibold underline underline-offset-4 hover:bg-sanctuary-foreground/10', FOCUS_DARK)}>
                שאלות? פנייה לצוות
              </a>
            )}
          </>
        }
      />

      <nav aria-label="בעמוד זה" className="lg:sticky lg:top-[145px] z-20 bg-sanctuary/95 backdrop-blur border-y border-sanctuary-foreground/10">
        <Container>
          <ul className="flex gap-1 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {sections.map(({ id, label }) => (
              <li key={id} className="flex-shrink-0">
                <a href={`#${id}`} className={cn('inline-flex items-center h-9 px-3.5 rounded-full text-sm font-medium text-sanctuary-foreground/85 hover:bg-sanctuary-foreground/10 hover:text-sanctuary-foreground', FOCUS_DARK)}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </Container>
      </nav>

      <Container className="py-10 sm:py-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem] items-start">
        <div className="space-y-8 min-w-0">
          <Panel as="section" id="overview" className="scroll-mt-[220px] p-6 sm:p-8">
            <SectionTitle as="h2" title="על הקורס" className="mb-4" />
            <DemoMarkdown className={PROSE_DARK}>{c.description}</DemoMarkdown>
            {c.audience?.length > 0 && (
              <div className="mt-8">
                <h3 className="font-heading font-semibold text-lg mb-3 inline-flex items-center gap-2">
                  <Users className="w-5 h-5" aria-hidden="true" />
                  למי מיועד
                </h3>
                <ul className="flex flex-wrap gap-2">
                  {c.audience.map((a) => (
                    <li key={a}>
                      <Tag className="text-sm px-3 py-1">{a}</Tag>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {c.prerequisites && (
              <div className="mt-6 rounded-2xl bg-sanctuary-foreground/[0.06] p-4">
                <p className="text-sm font-semibold mb-1">תנאי קבלה</p>
                <p className="text-sm text-sanctuary-foreground/90 leading-relaxed">
                  <Linkify text={c.prerequisites} />
                </p>
              </div>
            )}
          </Panel>

          {c.syllabus?.length > 0 && (
            <section id="syllabus" className="scroll-mt-[220px]">
              <SectionTitle title="סילבוס" description={c.syllabus.length > 1 ? `${c.syllabus.length} חלקים` : undefined} />
              <ol className="space-y-3">
                {c.syllabus.map((s, i) => (
                  <li key={s.title}>
                    <AreaDisclosure
                      defaultOpen={i === 0}
                      leading={
                        <span className="inline-flex w-9 h-9 rounded-full bg-sanctuary-foreground text-sanctuary font-heading font-semibold items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                      }
                      label={
                        <span>
                          {s.title}
                          <span className="block text-sm font-normal text-sanctuary-foreground/75">{s.items.length} נושאים</span>
                        </span>
                      }
                    >
                      <ul className="space-y-2 ps-12">
                        {s.items.map((it) => (
                          <li key={it} className="relative leading-relaxed before:content-[''] before:absolute before:-start-4 before:top-2.5 before:w-1.5 before:h-1.5 before:rounded-full before:bg-sanctuary-foreground/60">
                            {it}
                          </li>
                        ))}
                      </ul>
                    </AreaDisclosure>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {c.formats?.length > 0 && (
            <section id="runs" className="scroll-mt-[220px]">
              <SectionTitle title="מחזורים ומתכונות" description="כל מחזור עם הפרטים שפורסמו לו." />
              <ol className="relative space-y-4 border-s-2 border-sanctuary-foreground/15 ps-6 ms-2">
                {c.formats.map((f) => {
                  const k = regKind(f.registration?.status, f.isPast);
                  return (
                    <li key={f.key} className="relative">
                      <span
                        className={cn('absolute -start-[1.95rem] top-6 w-4 h-4 rounded-full border-2 border-sanctuary', f.isPast ? 'bg-sanctuary-foreground/40' : 'bg-sanctuary-foreground')}
                        aria-hidden="true"
                      />
                      <Panel className={cn(f.isPast && 'opacity-90')}>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <h3 className="font-heading font-semibold text-lg">{f.label}</h3>
                          <StatusPill kind={f.isPast ? 'past' : k} />
                        </div>
                        <dl className="grid sm:grid-cols-2 gap-x-6">
                          <Fact label="מתכונת" icon="Monitor">{f.format}</Fact>
                          <Fact label="מיקום" icon="MapPin">{f.location}</Fact>
                          <Fact label="מועדים" icon="CalendarDays">{f.schedule || f.startDate}</Fact>
                          <Fact label="היקף" icon="Clock">{f.hours}</Fact>
                          <Fact label="מחיר" icon="Wallet">{f.price}</Fact>
                          <Fact label="מרצים" icon="Users">{f.lecturers?.map((l) => l.name).join(', ')}</Fact>
                        </dl>
                        {f.note && <p className="mt-3 text-sm rounded-xl bg-sanctuary-foreground/[0.06] p-3">{f.note}</p>}
                        {!f.isPast && f.registration?.url && f.registration.status === 'open' && (
                          <Button asChild variant="pill-light" size="pill" className={cn('mt-4', FOCUS_DARK)}>
                            <a href={f.registration.url} target="_blank" rel="noopener noreferrer">
                              {f.registration.label}
                              <ExternalLink aria-hidden="true" />
                            </a>
                          </Button>
                        )}
                      </Panel>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          {c.units?.length > 0 && (
            <section id="units" className="scroll-mt-[220px]">
              <SectionTitle title="יחידות הלימוד" description="כל יחידה עומדת בפני עצמה." />
              <ul className="grid gap-4 md:grid-cols-2">
                {c.units.map((u) => {
                  const st = UNIT_STATUS[u.status];
                  return (
                    <li key={u.slug}>
                      <Panel className="h-full flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-heading font-semibold text-lg leading-snug">{u.title}</h3>
                          <StatusPill kind={st.kind} label={st.label} />
                        </div>
                        {u.tagline && <p className="text-sm text-sanctuary-foreground/80">{u.tagline}</p>}
                        {(u.date || u.hours || u.format) && (
                          <p className="text-sm text-sanctuary-foreground/85">{[u.date, u.hours, u.format].filter(Boolean).join(' · ')}</p>
                        )}
                        {u.lecturers?.length > 0 && <p className="text-sm">בהנחיית {u.lecturers.map((l) => l.name).join(', ')}</p>}
                        {u.description && (
                          <AreaDisclosure label="על היחידה" size="tight" className="mt-auto">
                            <DemoMarkdown className={cn(PROSE_DARK, 'text-sm')}>{u.description}</DemoMarkdown>
                          </AreaDisclosure>
                        )}
                      </Panel>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {c.lecturers?.length > 0 && (
            <section id="lecturers" className="scroll-mt-[220px]">
              <SectionTitle title={c.lecturers.length > 1 ? 'המרצים' : 'המרצה'} />
              <ul className="grid gap-3 sm:grid-cols-2">
                {c.lecturers.map((l) => (
                  <li key={l.name}>
                    <Panel className="flex gap-4 items-start h-full">
                      <Avatar name={l.name} />
                      <div className="min-w-0">
                        <p className="font-semibold">{l.name}</p>
                        {l.role && <p className="text-sm text-sanctuary-foreground/80 leading-relaxed mt-0.5">{l.role}</p>}
                      </div>
                    </Panel>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {c.testimonials?.length > 0 && (
            <section id="voices" className="scroll-mt-[220px]">
              <SectionTitle title="משתתפים מספרים" description="ציטוטים כפי שפורסמו באתר מטיב." />
              <ul className="grid gap-4 md:grid-cols-2">
                {c.testimonials.map((t, i) => (
                  <li key={i}>
                    <figure className="h-full rounded-super-sm bg-sanctuary-foreground/[0.06] border border-sanctuary-foreground/15 p-6 flex flex-col">
                      <Quote className="w-7 h-7 text-sanctuary-foreground/60 mb-3" aria-hidden="true" />
                      <blockquote className="leading-relaxed text-sanctuary-foreground/90 flex-1 line-clamp-[10]">{t.quote}</blockquote>
                      <figcaption className="mt-4 text-sm">
                        <span className="font-semibold">{t.name}</span>
                        {t.role && <span className="text-sanctuary-foreground/75">, {t.role}</span>}
                      </figcaption>
                    </figure>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {c.faq?.length > 0 && (
            <section id="faq" className="scroll-mt-[220px]">
              <SectionTitle title="שאלות נפוצות" />
              <div className="space-y-3">
                {c.faq.map((f) => (
                  <AreaDisclosure key={f.q} label={f.q}>
                    <p className="leading-relaxed">
                      <Linkify text={f.a} />
                    </p>
                  </AreaDisclosure>
                ))}
              </div>
            </section>
          )}

          <Panel as="section" id="register" className="scroll-mt-[220px] p-6 sm:p-8">
            <SectionTitle title="הרשמה ופנייה" className="mb-4" />
            <p className="leading-relaxed text-sanctuary-foreground/90 mb-5">
              {kind === 'open' && 'ההרשמה פתוחה. ההרשמה והתשלום נעשים באתר חיצוני.'}
              {kind === 'past' && 'המחזור שפורסם התקיים וההרשמה אליו סגורה. אפשר לפנות לצוות ולבקש עדכון על המחזור הבא.'}
              {kind === 'unknown' && 'מועד המחזור הבא יתפרסם. בינתיים אפשר לפנות לצוות לפרטים.'}
            </p>
            <div className="grid gap-6 sm:grid-cols-2 items-start">
              <div className="space-y-3">
                <RegisterAction course={c} size="pill" />
                {c.registration?.label && kind !== 'open' && <p className="text-sm text-sanctuary-foreground/75">{c.registration.label}</p>}
              </div>
              <ContactBlock contact={c.contact} />
            </div>
          </Panel>

          <p className="text-sm text-sanctuary-foreground/75">
            המידע נלקח מ
            <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" className={cn('underline underline-offset-4 font-semibold text-sanctuary-foreground mx-1 rounded', FOCUS_DARK)}>
              עמוד הקורס באתר מטיב
            </a>
            ויש לוודא שם את הפרטים העדכניים.
          </p>
        </div>

        <aside className="lg:sticky lg:top-[220px] space-y-4" aria-label="פרטי הקורס">
          <Panel className="p-6">
            <h2 className="font-heading font-semibold text-xl mb-2">במבט אחד</h2>
            <dl>
              <Fact label="מועד פתיחה" icon="CalendarDays">{c.startDate}</Fact>
              <Fact label="ימים ושעות" icon="Clock">{c.schedule}</Fact>
              <Fact label="משך" icon="Hourglass">{c.duration}</Fact>
              <Fact label="היקף שעות" icon="Timer">{c.hours}</Fact>
              <Fact label="מתכונת" icon="Monitor">{c.format}</Fact>
              <Fact label="מיקום" icon="MapPin">{c.location}</Fact>
              <Fact label="מחיר" icon="Wallet">
                {c.priceOptions?.length ? (
                  <ul className="space-y-1">
                    {c.priceOptions.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                ) : (
                  c.price
                )}
              </Fact>
              <Fact label="הכרה וגמול" icon="BadgeCheck">{c.credits?.join(' · ')}</Fact>
            </dl>
            <div className="mt-5 hidden lg:block">
              <RegisterAction course={c} size="pill" className="w-full" />
            </div>
          </Panel>
        </aside>
      </Container>

      {related.length > 0 && (
        <section className="border-t border-sanctuary-foreground/10 py-12" aria-labelledby="related">
          <Container>
            <SectionTitle id="related" title="קורסים קשורים" />
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <CourseCard course={r} />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {/* Mobile action bar, above the bottom navigation. */}
      <div className="lg:hidden fixed bottom-16 inset-x-0 z-30 bg-sanctuary border-t border-sanctuary-foreground/15 px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-sanctuary-foreground/75 line-clamp-1">{c.title}</p>
          <p className="font-semibold text-sm line-clamp-1">{c.price || (kind === 'past' ? 'המחזור התקיים' : 'פרטים בפנייה')}</p>
        </div>
        {kind === 'open' && c.registration?.url ? (
          <Button asChild variant="pill-light" size="pill" className={cn('flex-shrink-0', FOCUS_DARK)}>
            <a href={c.registration.url} target="_blank" rel="noopener noreferrer">
              הרשמה
            </a>
          </Button>
        ) : (
          <a href="#register" className={cn('flex-shrink-0 inline-flex items-center h-11 px-5 rounded-full border-2 border-sanctuary-foreground/40 text-sm font-semibold', FOCUS_DARK)}>
            פנייה
          </a>
        )}
      </div>
    </div>
  );
}
