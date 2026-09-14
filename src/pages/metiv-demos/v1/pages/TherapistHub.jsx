import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IMAGES } from '@/lib/images';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import {
  ACTIVE_STUDIES,
  ARTICLES,
  COURSES,
  ORG,
  PAPERS,
  THERAPIST_HUB,
  UPCOMING_EVENTS,
} from '@/pages/metiv-demos/shared/therapist';
import { PageHeaderV1 } from '../components/Chrome';
import { CourseRow, EventRow } from '../components/Rows';
import {
  ArrowLink,
  Chapter,
  ChapterHead,
  CONTAINER,
  NumberedIndex,
  PillLink,
  Reveal,
  StatusPill,
  useV1Title,
} from '../components/primitives';
import { byStartAsc, courseStatus } from '../lib';

export default function TherapistHub() {
  useV1Title(THERAPIST_HUB.title);
  const openCourses = COURSES.filter((c) => courseStatus(c).key === 'open').sort(byStartAsc);
  const recruiting = ACTIVE_STUDIES.filter((s) => s.recruiting);
  const featured = PAPERS.filter((p) => p.featured).slice(0, 4);
  const article = ARTICLES[0];

  return (
    <>
      <PageHeaderV1
        size="hero"
        align="start"
        tone="canvas"
        eyebrow="מטיב · אזור מקצועי"
        title={THERAPIST_HUB.title}
        subtitle={THERAPIST_HUB.intro}
        image={IMAGES.treatment_step3}
        actions={
          <>
            <PillLink to={ROUTES.courses} size="lg">
              לקורסים ולהכשרות
              <ArrowLeft aria-hidden="true" />
            </PillLink>
            <PillLink to={THERAPIST_HUB.cta.url} tone="light" size="lg">
              {THERAPIST_HUB.cta.label}
            </PillLink>
          </>
        }
      />

      <Chapter rule={false}>
        <ChapterHead
          number="01"
          label="סתיו 2026"
          title="מחזורים שנפתחים בקרוב"
          action={<ArrowLink to={ROUTES.courses}>לכל הקורסים וההכשרות</ArrowLink>}
        />
        <div className="border-t border-border">
          {openCourses.map((c) => (
            <CourseRow key={c.slug} course={c} />
          ))}
        </div>
      </Chapter>

      <Chapter>
        <ChapterHead number="02" label="תוכן העניינים" title="באזור המקצועי" />
        <NumberedIndex items={THERAPIST_HUB.sections.map((s) => ({ key: s.key, title: s.title, description: s.description, to: s.route }))} />
      </Chapter>

      <Chapter>
        <ChapterHead number="03" label="מחקר וכתיבה" title="מהמחקר ומהכתיבה של מטיב" />
        <div className="grid gap-14 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground">מחקרים שמגייסים משתתפים</p>
            <ul className="mt-4 border-t border-border">
              {recruiting.map((s) => (
                <li key={s.slug} className="border-b border-border py-5">
                  <StatusPill status={{ key: 'open', label: 'מגייס משתתפים' }} />
                  <p className="mt-3 font-heading text-xl leading-snug text-foreground">{s.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.population}</p>
                </li>
              ))}
            </ul>
            <ArrowLink to={ROUTES.research} className="mt-6">ליחידת המחקר</ArrowLink>
          </Reveal>
          <Reveal className="lg:col-span-6 lg:col-start-7" delay={120}>
            {article && (
              <div className="border-b border-border pb-8">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground">מאמר · {article.date}</p>
                <p className="mt-3 font-heading text-4xl font-light leading-tight text-foreground md:text-5xl">{article.title}</p>
                <p className="mt-3 leading-relaxed text-muted-foreground">{article.excerpt}</p>
                <ArrowLink to={`/therapist/articles/${article.slug}`} className="mt-4">לקריאה</ArrowLink>
              </div>
            )}
            <p className="mt-8 text-xs font-semibold tracking-wide text-muted-foreground">פרסומים נבחרים</p>
            <ul className="mt-2">
              {featured.map((p) => (
                <li key={p.title} className="border-b border-border py-4">
                  <p dir="ltr" lang="en" className="font-medium leading-snug text-foreground">{p.title}</p>
                  <p dir="ltr" lang="en" className="mt-1 text-sm text-muted-foreground">{p.journal}{p.year ? `, ${p.year}` : ''}</p>
                </li>
              ))}
            </ul>
            <ArrowLink to={ROUTES.publications} className="mt-6">לכל הפרסומים</ArrowLink>
          </Reveal>
        </div>
      </Chapter>

      <Chapter>
        <ChapterHead number="04" label="אירועים" title="ביומן" action={<ArrowLink to={ROUTES.events}>לכל האירועים</ArrowLink>} />
        <div className="border-t border-border">
          {UPCOMING_EVENTS.map((e) => (
            <EventRow key={e.slug} event={e} />
          ))}
        </div>
      </Chapter>

      <section className={cn(CONTAINER, 'pb-20 md:pb-28')}>
        <div className="grid gap-8 rounded-super bg-sanctuary px-6 py-12 text-sanctuary-foreground md:grid-cols-12 md:px-14 md:py-16">
          <div className="md:col-span-7">
            <h2 className="font-heading text-3xl font-light leading-tight md:text-5xl">לא מצאתם את מה שחיפשתם?</h2>
            <p className="mt-4 max-w-xl leading-relaxed text-sanctuary-foreground/80">
              אפשר להשאיר פרטים בטופס הפנייה לגבי הכשרה, הדרכה או תכנית לארגון, או לכתוב אלינו.
            </p>
          </div>
          <div className="flex flex-col items-start justify-end gap-4 md:col-span-5">
            <PillLink to={THERAPIST_HUB.cta.url} tone="onDark" size="lg">{THERAPIST_HUB.cta.label}</PillLink>
            <a href={`mailto:${ORG.emails.courses}`} className="text-sm underline underline-offset-4" dir="ltr">{ORG.emails.courses}</a>
          </div>
        </div>
      </section>
    </>
  );
}
