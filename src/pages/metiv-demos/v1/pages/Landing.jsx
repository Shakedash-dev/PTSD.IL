import React from 'react';
import { cn } from '@/lib/utils';
import { IMAGES } from '@/lib/images';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import {
  ACTIVE_STUDIES,
  COURSES,
  DONATE,
  FACTS,
  FUNDERS_AND_COLLABORATORS,
  METIV_SERVICES,
  ORG,
  PAPERS,
  PARTNERS,
  PAST_EVENTS,
  UPCOMING_EVENTS,
} from '@/pages/metiv-demos/shared/therapist';
import { DoorsCompact, DoorsHero } from '../components/Doors';
import { EventRow } from '../components/Rows';
import {
  Arch,
  ArrowLink,
  Chapter,
  ChapterBreak,
  ChapterHead,
  CONTAINER,
  NumberedIndex,
  PillLink,
  PullQuote,
  Reveal,
  StatusPill,
  useV1Title,
} from '../components/primitives';
import { byStartAsc, courseStatus, telHref } from '../lib';

export default function Landing() {
  useV1Title('');
  const openCourses = COURSES.filter((c) => courseStatus(c).key === 'open').sort(byStartAsc);
  const recruiting = ACTIVE_STUDIES.filter((s) => s.recruiting);
  const featuredPapers = PAPERS.filter((p) => p.featured).slice(0, 3);
  const news = [...UPCOMING_EVENTS, ...PAST_EVENTS].slice(0, 4);
  const partnerNames = [...new Set([...PARTNERS, ...FUNDERS_AND_COLLABORATORS.map((f) => f.name)])];

  return (
    <>
      <div className="border-b border-border bg-background">
        <div className={cn(CONTAINER, 'flex flex-wrap items-center justify-center gap-x-3 py-2.5 text-center md:py-3')}>
          <h1 className="text-sm font-medium text-foreground md:text-base">{ORG.name}</h1>
          <span className="hidden text-sm text-muted-foreground sm:inline">· טיפול, הכשרה ומחקר מאז 1989</span>
        </div>
      </div>

      <DoorsHero />

      {/* 01 · Metiv */}
      <Chapter rule={false} className="pt-20 md:pt-32">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <p className="mb-6 flex items-center gap-3 text-xs font-semibold tracking-wide text-muted-foreground">
              <span className="font-heading text-2xl font-light text-secondary">01</span>
              מטיב
            </p>
            <h2 className="font-heading text-[2.6rem] font-light leading-[1.05] tracking-tight text-foreground md:text-7xl">
              {ORG.headline}
            </h2>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">{ORG.intro}</p>
            <div className="mt-8">
              <ArrowLink to={ROUTES.about}>אודות מטיב</ArrowLink>
            </div>
          </Reveal>
          <Reveal className="lg:col-span-4 lg:col-start-9" delay={120}>
            <Arch src={IMAGES.secondcircletools_hero} className="mx-auto w-full max-w-[22rem]" aspect="aspect-[4/5]" />
          </Reveal>
        </div>

        <dl className="mt-16 grid grid-cols-2 border-t border-border md:mt-24 md:grid-cols-5">
          {FACTS.map((fact) => (
            <div key={fact.label} className="flex flex-col-reverse border-b border-border py-6 pe-4 md:border-b-0 md:py-8">
              <dt className="mt-2 text-sm leading-snug text-muted-foreground">{fact.label}</dt>
              <dd className="font-heading text-4xl font-light tabular-nums text-foreground md:text-5xl">
                <bdi>{fact.value}</bdi>
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">המספרים כפי שהם מופיעים באתר מטיב.</p>
      </Chapter>

      {/* 02 · Services */}
      <Chapter>
        <ChapterHead
          number="02"
          label="שירותי טיפול"
          title="המרפאות והתכניות של מטיב"
          lead="פרטי הפנייה של כל שירות מופיעים באזור למתמודדים ולמשפחות."
        />
        <NumberedIndex
          items={METIV_SERVICES.map((s) => ({ key: s.slug, title: s.title, description: s.summary, to: s.href }))}
        />
      </Chapter>

      <ChapterBreak />
      <div className={CONTAINER}>
        <PullQuote cite="החזון של מטיב">{ORG.vision}</PullQuote>
      </div>
      <ChapterBreak />

      {/* 03 · Learning and research */}
      <Chapter>
        <ChapterHead
          number="03"
          label="הכשרה ומחקר"
          title="ללמוד, להדריך ולחקור"
          lead="קורסים והכשרות לאנשי טיפול, ומחקרים שמתנהלים ביחידת המחקר של מטיב."
        />
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground">מחזורים קרובים</p>
            <ul className="border-t border-border">
              {openCourses.map((c) => (
                <li key={c.slug} className="border-b border-border py-6">
                  <StatusPill status={courseStatus(c)} />
                  <p className="mt-3 font-heading text-2xl font-light leading-snug text-foreground">{c.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[c.startDate, c.format, c.hours || c.duration].filter(Boolean).join(' · ')}
                  </p>
                  <ArrowLink to={`/therapist/courses/${c.slug}`} className="mt-3 text-sm">לפרטי הקורס</ArrowLink>
                </li>
              ))}
            </ul>
            <ArrowLink to={ROUTES.courses} className="mt-6">לכל הקורסים וההכשרות</ArrowLink>
          </Reveal>
          <Reveal delay={120}>
            <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground">מהמחקר</p>
            <div className="border-y border-border py-6">
              <p className="font-heading text-5xl font-light text-foreground">{recruiting.length}</p>
              <p className="mt-1 text-muted-foreground">מחקרים שמגייסים כעת משתתפים</p>
              <ArrowLink to={ROUTES.research} className="mt-3 text-sm">למחקרים הפעילים</ArrowLink>
            </div>
            <ul>
              {featuredPapers.map((p) => (
                <li key={p.title} className="border-b border-border py-5">
                  <p dir="ltr" lang="en" className="font-medium leading-snug text-foreground">{p.title}</p>
                  <p dir="ltr" lang="en" className="mt-1 text-sm text-muted-foreground">
                    {p.journal}{p.year ? `, ${p.year}` : ''}
                  </p>
                </li>
              ))}
            </ul>
            <ArrowLink to={ROUTES.publications} className="mt-6">לכל הפרסומים</ArrowLink>
          </Reveal>
        </div>
      </Chapter>

      {/* 04 · News and events */}
      <Chapter>
        <ChapterHead
          number="04"
          label="חדשות ואירועים"
          title="מה קורה במטיב"
          action={<ArrowLink to={ROUTES.events}>לכל האירועים והעדכונים</ArrowLink>}
        />
        <div className="border-t border-border">
          {news.map((e) => (
            <EventRow key={e.slug} event={e} />
          ))}
        </div>
      </Chapter>

      {/* 05 · Donate */}
      <section className={cn(CONTAINER, 'py-14 md:py-24')}>
        <Reveal className="grid gap-10 rounded-super bg-muted px-6 py-12 md:grid-cols-12 md:px-14 md:py-20">
          <div className="md:col-span-7">
            <p className="mb-5 flex items-center gap-3 text-xs font-semibold tracking-wide text-muted-foreground">
              <span className="font-heading text-2xl font-light text-secondary">05</span>
              תרומה
            </p>
            <h2 className="font-heading text-4xl font-light leading-tight tracking-tight text-foreground md:text-6xl">{DONATE.title}</h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">{DONATE.intro}</p>
          </div>
          <div className="flex flex-col justify-end gap-4 md:col-span-5 md:items-start">
            <PillLink to={ORG.donateUrl} size="lg">לתרומה ב-JGive</PillLink>
            <ArrowLink to={ROUTES.donate}>דרכים נוספות לתמוך</ArrowLink>
          </div>
        </Reveal>
      </section>

      {/* 06 · Partners */}
      <Chapter>
        <ChapterHead number="06" label="שותפים" title="עובדים יחד" lead="גופים שמטיב עבד איתם, הכשיר או שיתף איתם פעולה, כפי שהם מופיעים באתר מטיב." />
        <ul className="flex flex-wrap gap-x-2 gap-y-3 font-heading text-xl font-light leading-relaxed text-foreground md:text-2xl">
          {partnerNames.map((name, i) => (
            <li key={name} className="flex items-center gap-2">
              {name}
              {i < partnerNames.length - 1 && <span aria-hidden="true" className="text-secondary">·</span>}
            </li>
          ))}
        </ul>
      </Chapter>

      <DoorsCompact />

      {/* 07 · Contact */}
      <Chapter className="pt-0 md:pt-0">
        <ChapterHead number="07" label="צור קשר" title="איך מגיעים אלינו" action={<ArrowLink to={ROUTES.contact}>לכל פרטי הקשר</ArrowLink>} />
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted-foreground">כתובת</p>
            <p className="mt-3 text-lg text-foreground">{ORG.address}</p>
            <p className="mt-1 text-muted-foreground">{ORG.mail}</p>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted-foreground">טלפון</p>
            <p className="mt-3 text-lg">
              <a href={telHref(ORG.phones.main)} className="text-foreground hover:text-primary" dir="ltr">{ORG.phones.main}</a>
            </p>
            <p className="mt-1 text-muted-foreground">
              מטיב ילדים: <a href={telHref(ORG.phones.kids)} className="hover:text-primary" dir="ltr">{ORG.phones.kids}</a>
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted-foreground">דואר אלקטרוני</p>
            <p className="mt-3 text-lg">
              <a href={`mailto:${ORG.emails.general}`} className="text-foreground hover:text-primary" dir="ltr">{ORG.emails.general}</a>
            </p>
            <p className="mt-1 text-muted-foreground">
              מטיב ילדים: <a href={`mailto:${ORG.emails.kids}`} className="hover:text-primary" dir="ltr">{ORG.emails.kids}</a>
            </p>
          </div>
        </div>
      </Chapter>
    </>
  );
}
