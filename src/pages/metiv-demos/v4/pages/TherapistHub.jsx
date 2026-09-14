import React from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui';
import { DemoLink, useDemoChrome } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import {
  THERAPIST_HUB,
  COURSES,
  UPCOMING_EVENTS,
  ACTIVE_STUDIES,
  PAPERS,
  BOOKS,
  ARTICLES,
  RESEARCH_INTRO,
} from '@/pages/metiv-demos/shared/therapist';
import Icon from '../components/Icon';
import { StatusPill, SectionTitle, ExtLink, registrationPill } from '../components/primitives';
import { THERAPIST_MENU } from '../lib/nav';
import { currentCourses, statusOf, categoryLabel, FORMAT_LABELS, formatKeys } from '../lib/courses';

export default function TherapistHub() {
  const { PageHeader } = useDemoChrome();
  const current = currentCourses(COURSES).slice(0, 6);
  const openCount = COURSES.filter((c) => statusOf(c) === 'open').length;
  const recruiting = ACTIVE_STUDIES.filter((s) => s.recruiting);
  const featured = PAPERS.filter((p) => p.featured).sort((a, b) => (b.year || 0) - (a.year || 0)).slice(0, 4);

  const tiles = [
    { value: openCount, label: 'תכניות פתוחות להרשמה', route: ROUTES.courses },
    { value: UPCOMING_EVENTS.length, label: 'מחזורים ואירועים קרובים', route: ROUTES.events },
    { value: recruiting.length, label: 'מחקרים שמגייסים משתתפים', route: ROUTES.research },
    { value: PAPERS.length + BOOKS.length, label: 'ספרים, מאמרים ופרקים', route: ROUTES.publications },
  ];

  return (
    <div className="bg-background">
      <PageHeader
        tone="card"
        size="editorial"
        eyebrow="אזור אנשי מקצוע"
        title={THERAPIST_HUB.title}
        subtitle={THERAPIST_HUB.intro}
        actions={
          <>
            <Button asChild variant="elevated" radius="full" size="roomy-lg">
              <DemoLink to={ROUTES.courses}>לקטלוג הקורסים <ArrowLeft aria-hidden="true" /></DemoLink>
            </Button>
            <Button asChild variant="outline" radius="full" size="roomy-lg" className="text-foreground">
              <a href={THERAPIST_HUB.cta.url} target="_blank" rel="noreferrer">
                {THERAPIST_HUB.cta.label} <ExternalLink aria-hidden="true" />
              </a>
            </Button>
          </>
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        {/* Catalog snapshot */}
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tiles.map((t) => (
            <li key={t.label}>
              <DemoLink to={t.route} className="group flex h-full flex-col rounded-super-sm border border-border bg-card p-4 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5">
                <span className="font-heading text-3xl font-semibold text-foreground">{t.value}</span>
                <span className="mt-1 flex-1 text-sm leading-snug text-muted-foreground">{t.label}</span>
                <ArrowLeft aria-hidden="true" className="mt-3 w-4 h-4 text-primary transition-transform group-hover:-translate-x-1" />
              </DemoLink>
            </li>
          ))}
        </ul>

        {/* Section directory */}
        <section aria-labelledby="directory" className="mt-14">
          <SectionTitle id="directory" title="מה יש באזור" />
          <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            {THERAPIST_MENU.slice(0, 2).map((g) => (
              <div key={g.title} className={g.links.length > 3 ? '' : 'lg:row-span-1'}>
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{g.title}</h3>
                <ul className={g.links.length > 3 ? 'grid gap-3 sm:grid-cols-2' : 'grid gap-3'}>
                  {g.links.map((l) => (
                    <li key={l.key}>
                      <DemoLink to={l.route} className="group flex h-full gap-4 rounded-super-sm border border-border bg-card p-4 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-primary">
                          <Icon name={l.icon} />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-heading text-lg font-semibold text-foreground group-hover:text-primary">{l.label}</span>
                          <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">{l.description}</span>
                        </span>
                      </DemoLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Current programmes */}
        <section aria-labelledby="current" className="mt-14">
          <SectionTitle
            id="current"
            title="תכניות קרובות ופתוחות"
            description="תכניות שלא הסתיימו, לפי מצב ההרשמה."
            action={<DemoLink to={ROUTES.courses} className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">לכל הקורסים <ArrowLeft aria-hidden="true" className="w-4 h-4" /></DemoLink>}
          />
          <div className="hidden overflow-hidden rounded-super-sm border border-border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted hover:bg-muted">
                  <TableHead className="text-start text-foreground">תכנית</TableHead>
                  <TableHead className="text-start text-foreground">תחום</TableHead>
                  <TableHead className="text-start text-foreground">פורמט</TableHead>
                  <TableHead className="text-start text-foreground">פתיחה</TableHead>
                  <TableHead className="text-start text-foreground">סטטוס</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {current.map((c) => {
                  const pill = registrationPill(statusOf(c));
                  return (
                    <TableRow key={c.slug}>
                      <TableCell className="py-3">
                        <DemoLink to={`${ROUTES.courses}/${c.slug}`} className="font-medium text-foreground hover:text-primary hover:underline">{c.title}</DemoLink>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{categoryLabel(c.category)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatKeys(c).map((k) => FORMAT_LABELS[k]).join(', ')}</TableCell>
                      <TableCell className="whitespace-nowrap text-foreground">{c.startDate || 'יפורסם'}</TableCell>
                      <TableCell><StatusPill tone={pill.tone}>{pill.label}</StatusPill></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <ul className="space-y-3 md:hidden">
            {current.map((c) => {
              const pill = registrationPill(statusOf(c));
              return (
                <li key={c.slug} className="rounded-super-sm border border-border bg-card p-4">
                  <StatusPill tone={pill.tone}>{pill.label}</StatusPill>
                  <DemoLink to={`${ROUTES.courses}/${c.slug}`} className="mt-2 block font-medium text-foreground">{c.title}</DemoLink>
                  <p className="mt-1 text-sm text-muted-foreground">{categoryLabel(c.category)} · {c.startDate || 'מועד יפורסם'}</p>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Research + publications */}
        <section aria-labelledby="research-snapshot" className="mt-14 grid gap-6 lg:grid-cols-2">
          <div className="rounded-super-sm bg-sanctuary p-6 text-sanctuary-foreground sm:p-8">
            <h2 id="research-snapshot" className="font-heading text-2xl font-semibold">מחקרים שמגייסים משתתפים</h2>
            <p className="mt-2 text-sanctuary-foreground/85">{RESEARCH_INTRO.focus}</p>
            <ul className="mt-5 divide-y divide-sanctuary-foreground/15">
              {recruiting.map((s) => (
                <li key={s.slug} className="py-3">
                  <DemoLink to={`${ROUTES.research}#${s.slug}`} className="font-medium hover:underline">{s.title}</DemoLink>
                  <p className="mt-0.5 text-sm text-sanctuary-foreground/80">{s.population}</p>
                </li>
              ))}
            </ul>
            <Button asChild variant="pill-light" size="pill" className="mt-5">
              <DemoLink to={ROUTES.research}>למחקרים ולשיתופי פעולה</DemoLink>
            </Button>
          </div>
          <div className="rounded-super-sm border border-border bg-card p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-semibold text-foreground">פרסומים נבחרים</h2>
            <ol className="mt-4 divide-y divide-border">
              {featured.map((p) => (
                <li key={p.title} className="py-3" dir="auto">
                  <p className="font-medium leading-snug text-foreground" dir="auto">{p.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground" dir="auto">
                    {p.authors.join(', ')} ({p.year || 'n.d.'}). {p.journal}
                  </p>
                </li>
              ))}
            </ol>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <DemoLink to={ROUTES.publications} className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">לכל הפרסומים <ArrowLeft aria-hidden="true" className="w-4 h-4" /></DemoLink>
              {ARTICLES[0] && (
                <DemoLink to={`${ROUTES.articles}/${ARTICLES[0].slug}`} className="text-sm text-muted-foreground hover:text-foreground hover:underline">
                  מאמר אחרון: {ARTICLES[0].title}
                </DemoLink>
              )}
            </div>
          </div>
        </section>

        <section className="mt-14 flex flex-col items-start justify-between gap-4 rounded-super-sm border border-border bg-muted p-6 sm:flex-row sm:items-center sm:p-8">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground">מחפשים הכשרה או הדרכה לצוות?</h2>
            <p className="mt-1 text-muted-foreground">השאירו פרטים בטופס ונחזור אליכם עם האפשרויות המתאימות.</p>
          </div>
          <ExtLink href={THERAPIST_HUB.cta.url} className="rounded-full bg-primary px-6 py-3 text-primary-foreground hover:no-underline hover:bg-accent hover:text-accent-foreground">
            {THERAPIST_HUB.cta.label}
          </ExtLink>
        </section>
      </div>
    </div>
  );
}
