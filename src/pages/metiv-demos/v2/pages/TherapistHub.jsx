import React, { useMemo, useState } from 'react';
import { ArrowLeft, Search, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DemoLink, useDemoChrome } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import {
  THERAPIST_HUB,
  COURSES,
  ACTIVE_STUDIES,
  PAPERS,
  EVENTS,
  UPCOMING_EVENTS,
  ARTICLES,
  FACTS,
  SUPERVISION,
  ORGANIZATION_PROGRAMS,
} from '@/pages/metiv-demos/shared/therapist';
import { cn } from '@/lib/utils';
import { FOCUS_DARK } from '../lib';
import { ArrowLink, CardLink, Container, DoorCard, Icon, IconBadge, Panel, SectionTitle, StatusPill } from '../components/ui';
import { CourseCard, EventCard } from '../components/cards';

/** Search across the professional area's static content. */
const INDEX = [
  ...COURSES.map((c) => ({ key: `c-${c.slug}`, kind: 'קורס', title: c.title, text: `${c.summary} ${c.tags.join(' ')}`, to: `${ROUTES.courses}/${c.slug}` })),
  ...ACTIVE_STUDIES.map((s) => ({ key: `s-${s.slug}`, kind: 'מחקר', title: s.title, text: s.summary, to: ROUTES.research })),
  ...ARTICLES.map((a) => ({ key: `a-${a.slug}`, kind: 'מאמר', title: a.title, text: a.excerpt, to: `${ROUTES.articles}/${a.slug}` })),
  ...EVENTS.map((e) => ({ key: `e-${e.slug}`, kind: 'אירוע', title: e.title, text: e.summary, to: ROUTES.events })),
  ...SUPERVISION.options.map((o) => ({ key: `sv-${o.key}`, kind: 'הדרכה', title: o.title, text: o.description, to: ROUTES.supervision })),
  ...ORGANIZATION_PROGRAMS.map((p) => ({ key: `o-${p.slug}`, kind: 'לארגונים', title: p.title, text: p.summary, to: `${ROUTES.organizations}#${p.slug}` })),
  ...PAPERS.map((p, i) => ({ key: `p-${i}`, kind: 'פרסום', title: p.title, text: `${p.authors.join(' ')} ${p.journal}`, to: ROUTES.publications })),
];

function HubSearch() {
  const [q, setQ] = useState('');
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return [];
    return INDEX.filter((i) => `${i.title} ${i.text}`.toLowerCase().includes(t)).slice(0, 8);
  }, [q]);
  return (
    <div className="relative w-full max-w-xl">
      <label htmlFor="pro-search" className="sr-only">
        חיפוש באזור המקצועי
      </label>
      <Search className="absolute start-4 top-7 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" aria-hidden="true" />
      <input
        id="pro-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="חיפוש קורס, מחקר, מאמר או אירוע"
        className="w-full border placeholder:text-muted-foreground focus-visible:outline-none h-14 rounded-full ps-12 pe-5 text-base bg-card text-foreground border-transparent focus-visible:ring-2 focus-visible:ring-sanctuary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-sanctuary"
      />
      {q.trim().length >= 2 && (
        <div className="mt-2 rounded-super-sm bg-card text-foreground shadow-atmospheric-lg p-2" aria-live="polite">
          {results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-card-foreground">לא נמצאו תוצאות. נסו מילה אחרת.</p>
          ) : (
            <ul>
              {results.map((r) => (
                <li key={r.key}>
                  <DemoLink to={r.to} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <span className="text-xs font-semibold rounded-full bg-muted px-2 py-0.5 flex-shrink-0">{r.kind}</span>
                    <span className="text-sm font-medium line-clamp-1" dir="auto">
                      {r.title}
                    </span>
                  </DemoLink>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/** Courses that are not over: dated ones first (soonest), then undated. */
export function upcomingCourses() {
  return COURSES.filter((c) => !c.isPast).sort((a, b) => {
    if (a.startDateISO && b.startDateISO) return a.startDateISO.localeCompare(b.startDateISO);
    if (a.startDateISO) return -1;
    if (b.startDateISO) return 1;
    return 0;
  });
}

export default function TherapistHub() {
  const { PageHeader } = useDemoChrome();
  const upcoming = upcomingCourses();
  const recruiting = ACTIVE_STUDIES.filter((s) => s.recruiting);

  return (
    <div>
      <PageHeader
        size="editorial"
        eyebrow="אזור אנשי המקצוע"
        title={THERAPIST_HUB.title}
        subtitle={THERAPIST_HUB.intro}
        actions={
          <>
            <HubSearch />
          </>
        }
      />

      <Container className="py-12 sm:py-16 space-y-16">
        <section aria-labelledby="pro-sections">
          <h2 id="pro-sections" className="sr-only">
            תחומים
          </h2>
          <ul className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {THERAPIST_HUB.sections.map((s) => (
              <li key={s.key}>
                <CardLink to={s.route} className="flex-col gap-3 h-full">
                  <IconBadge name={s.icon} size="lg" />
                  <span className="font-heading font-semibold text-xl leading-snug">{s.title}</span>
                  <span className="text-sm text-sanctuary-foreground/75 leading-relaxed flex-1">{s.description}</span>
                  <ArrowLeft className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
                </CardLink>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="pro-upcoming">
          <SectionTitle
            id="pro-upcoming"
            eyebrow="קורסים והכשרות"
            title="הקורסים הקרובים"
            description="מחזורים עם מועד פתיחה, ותכניות שהמועד שלהן יתעדכן."
            action={<ArrowLink to={ROUTES.courses}>לכל הקורסים ({COURSES.length})</ArrowLink>}
          />
          <ul className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 [scrollbar-width:thin]">
            {upcoming.map((c) => (
              <li key={c.slug} className="snap-start flex-shrink-0 w-[82%] sm:w-[22rem]">
                <CourseCard course={c} />
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-6 lg:grid-cols-2" aria-label="מחקר ואירועים">
          <Panel className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <h2 className="font-heading font-semibold text-2xl">מחקרים שמגייסים משתתפים</h2>
              <StatusPill kind="recruiting" label={`${recruiting.length} מחקרים`} />
            </div>
            <ul className="space-y-4">
              {recruiting.map((s) => (
                <li key={s.slug} className="border-b border-sanctuary-foreground/10 pb-4 last:border-b-0 last:pb-0">
                  <p className="font-semibold">{s.title}</p>
                  <p className="text-sm text-sanctuary-foreground/75 leading-relaxed mt-1">{s.summary}</p>
                </li>
              ))}
            </ul>
            <div className="mt-5">
              <ArrowLink to={ROUTES.research}>ליחידת המחקר</ArrowLink>
            </div>
          </Panel>
          <div className="space-y-4">
            <h2 className="font-heading font-semibold text-2xl">אירועים קרובים</h2>
            {UPCOMING_EVENTS.map((e) => (
              <EventCard key={e.slug} event={e} compact />
            ))}
            {ARTICLES[0] && (
              <CardLink to={`${ROUTES.articles}/${ARTICLES[0].slug}`} className="flex-col gap-1.5">
                <span className="text-sm text-sanctuary-foreground/80 inline-flex items-center gap-2">
                  <Icon name="FileText" className="w-4 h-4" />
                  מאמר חדש · {ARTICLES[0].readingMinutes} דקות קריאה
                </span>
                <span className="font-heading font-semibold text-lg">{ARTICLES[0].title}</span>
                <span className="text-sm text-sanctuary-foreground/75">{ARTICLES[0].authors.join(' ו')}</span>
              </CardLink>
            )}
            <ArrowLink to={ROUTES.events}>כל האירועים</ArrowLink>
          </div>
        </section>

        <section className="rounded-super border border-sanctuary-foreground/15 p-6 sm:p-10 grid gap-8 lg:grid-cols-[1fr_auto] items-center">
          <div>
            <h2 className="font-heading font-semibold text-2xl sm:text-3xl">מחפשים הכשרה או הדרכה לצוות?</h2>
            <p className="mt-2 text-sanctuary-foreground/80 leading-relaxed max-w-2xl">
              השאירו פרטים בטופס הפנייה של מטיב, ונחזור אליכם לגבי קורסים, הדרכה או תכנית לארגון.
            </p>
            <ul className="mt-6 flex flex-wrap gap-8">
              {FACTS.slice(0, 2).map((f) => (
                <li key={f.label}>
                  <p className="font-heading font-semibold text-3xl" dir="ltr">
                    {f.value}
                  </p>
                  <p className="text-sm text-sanctuary-foreground/75">{f.label}</p>
                </li>
              ))}
            </ul>
          </div>
          <Button asChild variant="pill-light" size="pill-lg" className={FOCUS_DARK}>
            <a href={THERAPIST_HUB.cta.url} target="_blank" rel="noopener noreferrer">
              {THERAPIST_HUB.cta.label}
              <ExternalLink aria-hidden="true" />
            </a>
          </Button>
        </section>

        <DoorCard
          to={ROUTES.patient}
          target="patient"
          title="מחפשים עזרה עבורכם או עבור מישהו קרוב?"
          text="מידע, כלים וטיפול למתמודדים ולמשפחות נמצאים באזור המטופלים."
          className={cn('max-w-2xl')}
        />
      </Container>
    </div>
  );
}
