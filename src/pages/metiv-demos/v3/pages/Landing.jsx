import React from 'react';
import { ArrowLeft, CalendarDays, GraduationCap, HeartHandshake, MapPin } from 'lucide-react';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { FIRST_CIRCLE_ILLUSTRATIONS, TREATMENT_STEP_IMAGES } from '@/lib/images';
import { cn } from '@/lib/utils';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { fmt, isExternalLink, useCopy, useMetiv } from '../content/MetivContent';
import { V3_ROUTES } from '../meta';
import { Band, CHIP_LINK, ExternalLink, FOCUS, FWD, NamedIcon, NUDGE, PILL_OUTLINE, PILL_SOLID, SectionHeading, StatusPill, TEXT_LINK } from '../components/kit';

// The two doors. Wording is copy (`landing`): `<door>Eyebrow`, `<door>Title`,
// `<door>Text`, `<door>Question`, `<door>Cta` and `<door>Answer<Route>`.
const DOOR_CONFIG = [
  {
    key: 'patient',
    icon: HeartHandshake,
    image: FIRST_CIRCLE_ILLUSTRATIONS.treatment,
    imageFit: 'contain',
    answers: ['firstCircle', 'secondCircle', 'questionnaire', 'whereToGetHelp', 'calming'],
    to: ROUTES.patient,
  },
  {
    key: 'therapist',
    icon: GraduationCap,
    image: TREATMENT_STEP_IMAGES[2],
    imageFit: 'cover',
    answers: ['courses', 'supervision', 'childrenFamily', 'organizations', 'research'],
    to: ROUTES.therapist,
  },
];

/** @typedef {typeof DOOR_CONFIG[number] & { eyebrow: string, title: string, text: string, question: string, cta: string, answerLinks: { label: string, to: string }[] }} Door */

/** @param {Record<string, string>} c @returns {Door[]} */
function doorsFrom(c) {
  return DOOR_CONFIG.map((d) => ({
    ...d,
    eyebrow: c[`${d.key}Eyebrow`],
    title: c[`${d.key}Title`],
    text: c[`${d.key}Text`],
    question: c[`${d.key}Question`],
    cta: c[`${d.key}Cta`],
    answerLinks: d.answers.map((r) => ({ label: c[`${d.key}Answer${r[0].toUpperCase()}${r.slice(1)}`], to: ROUTES[r] })),
  }));
}

/** @param {{ door: Door }} props */
function DoorCard({ door }) {
  const c = useCopy('landing');
  const Icon = door.icon;
  const headingId = `door-${door.key}`;
  return (
    <article aria-labelledby={headingId} className="group relative flex flex-col rounded-super bg-card border-2 border-border hover:border-primary/60 shadow-card hover:shadow-card-hover transition-natural overflow-hidden text-start">
      {/* Hidden on phones: the label would cover the illustration, and the CTA should sit higher. */}
      <div className={cn('relative hidden sm:flex [@media(max-height:820px)]:hidden sm:h-40 lg:h-44 bg-muted items-end justify-center overflow-hidden', door.key === 'therapist' && 'bg-secondary/15')}>
        <img
          src={door.image}
          alt=""
          aria-hidden="true"
          className={door.imageFit === 'contain' ? 'h-[92%] w-auto object-contain' : 'h-full w-full object-cover object-[50%_40%]'}
        />
        <span className="absolute top-4 start-4 inline-flex items-center gap-1.5 rounded-full bg-card/95 px-3 py-1.5 text-sm font-semibold text-accent shadow-atmospheric">
          <Icon className="w-4 h-4" aria-hidden="true" />
          {door.eyebrow}
        </span>
      </div>
      <div className="flex flex-col flex-1 p-6 sm:p-7">
        <h2 id={headingId} className="font-heading font-semibold text-2xl lg:text-[1.75rem] text-foreground leading-snug">{door.title}</h2>
        <p className="mt-1.5 text-muted-foreground leading-relaxed">{door.text}</p>

        <DemoLink to={door.to} className={cn(PILL_SOLID, 'mt-5 w-full text-lg py-4', door.key === 'therapist' && 'bg-accent hover:bg-primary')}>
          {door.cta}
          <ArrowLeft className={cn('w-5 h-5', FWD, NUDGE)} aria-hidden="true" />
        </DemoLink>

        <p className="mt-6 text-sm font-semibold text-foreground">{fmt(c.doorQuestion, { question: door.question })}</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {door.answerLinks.map((a) => (
            <li key={a.to}>
              <DemoLink to={a.to} className={cn(CHIP_LINK, 'py-2.5')}>{a.label}</DemoLink>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export default function Landing() {
  const c = useCopy('landing');
  const { lang } = useLang();
  const { ACTIVE_STUDIES, ARTICLES, DONATE, FACTS, FUNDERS_AND_COLLABORATORS, METIV_SERVICE_CARDS, ORG, PARTNERS, RESEARCH_INTRO, UPCOMING_EVENTS } = useMetiv();
  const DOORS = doorsFrom(c);
  const recruiting = ACTIVE_STUDIES.filter((s) => s.recruiting);
  const article = ARTICLES[0];

  return (
    <div>
      {/* ── 1. Who Metiv is, then the two doors. They fill the first screen;
             everything else starts below the fold. ── */}
      <section aria-labelledby="landing-title" className="relative overflow-hidden bg-background min-h-[calc(100svh-4rem)] flex flex-col">
        <span aria-hidden="true" className="pointer-events-none absolute -top-40 -start-40 w-[34rem] h-[34rem] rounded-full bg-primary/10" />
        <span aria-hidden="true" className="pointer-events-none absolute top-40 -end-48 w-[28rem] h-[28rem] rounded-full bg-secondary/10" />
        {/* Short screens (laptops) tighten spacing so both door CTAs stay above the fold. */}
        <div className="relative flex-1 flex flex-col justify-center w-full max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-10 [@media(max-height:820px)]:py-5">
          <div className="text-center max-w-3xl mx-auto">
            {/* The name carries the page: a large short name over the full name. The
                hidden separator keeps the accessible name "<name> - <full name>". */}
            <h1 id="landing-title" className="font-heading text-foreground">
              <span className="block font-semibold text-5xl sm:text-6xl lg:text-7xl [@media(max-height:820px)]:text-5xl leading-none tracking-tight text-accent">{c.titleName}</span>
              <span className="sr-only"> - </span>
              <span className="mt-2 sm:mt-3 block font-medium text-xl sm:text-2xl lg:text-3xl leading-snug">{c.titleFull}</span>
            </h1>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">{c.intro}</p>
          </div>

          <div className="mt-6 sm:mt-8 grid gap-6 lg:gap-8 md:grid-cols-2">
            {DOORS.map((door) => <DoorCard key={door.key} door={door} />)}
          </div>
        </div>
      </section>

      {/* ── 2. About PTSD, just below the doors. Uses the site's existing copy. ── */}
      <Band tone="card" labelledBy="landing-ptsd">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="max-w-3xl">
            <SectionHeading id="landing-ptsd" eyebrow={c.ptsdEyebrow} title={c.ptsdTitle} className="mb-4" />
            <p className="text-lg sm:text-xl text-foreground leading-relaxed">{t(lang, 'about_ptsd_short')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <DemoLink to={ROUTES.ptsdInfo} className={PILL_SOLID}>
              {t(lang, 'read_more')} <ArrowLeft className={cn('w-4 h-4', FWD)} aria-hidden="true" />
            </DemoLink>
            <DemoLink to={ROUTES.questionnaire} className={PILL_OUTLINE}>{c.questionnaire}</DemoLink>
          </div>
        </div>
      </Band>

      {/* ── 3. Metiv services ── */}
      <Band tone="canvas" labelledBy="landing-services">
        <SectionHeading id="landing-services" eyebrow={c.servicesEyebrow} title={c.servicesTitle} intro={c.servicesIntro} />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {METIV_SERVICE_CARDS.map((/** @type {any} */ s) => (
            <li key={s.slug}>
              <DemoLink to={s.slug === 'release-journey' ? V3_ROUTES.releaseJourney : s.href} className={cn('group flex h-full gap-4 rounded-super bg-card border border-border p-5 shadow-card hover:shadow-card-hover hover:border-primary/50 transition-natural', FOCUS)}>
                <span className="w-12 h-12 rounded-2xl bg-primary/10 text-accent flex items-center justify-center flex-shrink-0">
                  <NamedIcon name={s.icon} className="w-6 h-6" />
                </span>
                <span className="min-w-0">
                  <span className="block font-heading font-semibold text-lg text-foreground">{s.title}</span>
                  <span className="block mt-1 text-muted-foreground leading-relaxed">{s.summary}</span>
                  <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-accent">
                    {c.serviceCta} <ArrowLeft className={cn('w-4 h-4', FWD, NUDGE)} aria-hidden="true" />
                  </span>
                </span>
              </DemoLink>
            </li>
          ))}
          <li>
            <DemoLink to={ROUTES.whereToGetHelp} className={cn('flex h-full flex-col justify-center rounded-super border-2 border-dashed border-primary/40 p-5 text-center hover:bg-card transition-natural', FOCUS)}>
              <MapPin className="w-6 h-6 text-accent mx-auto" aria-hidden="true" />
              <span className="mt-2 font-heading font-semibold text-foreground">{c.moreServicesTitle}</span>
              <span className="mt-1 text-sm text-muted-foreground">{c.moreServicesText}</span>
            </DemoLink>
          </li>
        </ul>
      </Band>

      {/* ── 4. About ── */}
      <Band tone="card" labelledBy="landing-about">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start">
          <div>
            <SectionHeading id="landing-about" eyebrow={c.aboutEyebrow} title={ORG.headline} className="mb-5" />
            <p className="text-lg text-foreground leading-relaxed">{ORG.intro}</p>
            <p className="mt-4 text-muted-foreground leading-relaxed"><span className="font-semibold text-foreground">{c.visionLabel}</span>{ORG.vision}</p>
            <DemoLink to={ROUTES.about} className={cn(PILL_OUTLINE, 'mt-6')}>
              {c.aboutMore} <ArrowLeft className={cn('w-4 h-4', FWD)} aria-hidden="true" />
            </DemoLink>
          </div>
          <dl className="grid grid-cols-2 gap-3">
            {FACTS.map((/** @type {any} */ f, /** @type {number} */ i) => (
              <div key={f.label} className={cn('rounded-super bg-muted p-5', i === 0 && 'col-span-2')}>
                <dt className="sr-only">{f.label}</dt>
                <dd>
                  <span className="block font-heading font-semibold text-4xl text-accent" dir="ltr">{f.value}</span>
                  <span className="block mt-1 text-foreground">{f.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Band>

      {/* ── 5. Research ── */}
      <Band tone="muted" labelledBy="landing-research">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div>
            <SectionHeading id="landing-research" eyebrow={c.researchEyebrow} title={RESEARCH_INTRO.title} intro={RESEARCH_INTRO.paragraphs[0]} className="mb-5" />
            <div className="flex flex-wrap gap-3">
              <DemoLink to={ROUTES.research} className={PILL_OUTLINE}>{c.researchActive}</DemoLink>
              <DemoLink to={ROUTES.publications} className={PILL_OUTLINE}>{c.publications}</DemoLink>
            </div>
          </div>
          <div>
            <p className="font-heading font-semibold text-lg text-foreground mb-3">{c.recruitingTitle}</p>
            <ul className="space-y-3">
              {recruiting.map((/** @type {any} */ s) => (
                <li key={s.slug} className="rounded-super-sm bg-card border border-border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-heading font-semibold text-foreground">{s.title}</p>
                    <StatusPill tone="success">{c.recruitingPill}</StatusPill>
                  </div>
                  <p className="mt-1 text-muted-foreground leading-relaxed">{s.summary}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Band>

      {/* ── 6. News and events ── */}
      <Band tone="canvas" labelledBy="landing-news">
        <SectionHeading id="landing-news" eyebrow={c.newsEyebrow} title={c.newsTitle} />
        <div className="grid gap-4 md:grid-cols-3">
          {UPCOMING_EVENTS.slice(0, 2).map((/** @type {any} */ e) => (
            <DemoLink key={e.slug} to={e.link && !isExternalLink(e.link) ? e.link : ROUTES.events} className={cn('group flex flex-col rounded-super bg-card border border-border p-6 shadow-card hover:shadow-card-hover transition-natural', FOCUS)}>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-accent">
                <CalendarDays className="w-4 h-4" aria-hidden="true" /> {e.date} · {e.type}
              </span>
              <span className="mt-2 font-heading font-semibold text-xl text-foreground leading-snug">{e.title}</span>
              <span className="mt-2 text-muted-foreground leading-relaxed">{e.summary}</span>
              <span className="mt-auto pt-4 text-sm font-semibold text-accent inline-flex items-center gap-1">{c.eventDetails} <ArrowLeft className={cn('w-4 h-4', FWD)} aria-hidden="true" /></span>
            </DemoLink>
          ))}
          {article && (
            <DemoLink to={`${ROUTES.articles}/${article.slug}`} className={cn('group flex flex-col rounded-super bg-sanctuary text-sanctuary-foreground p-6 shadow-card hover:shadow-card-hover transition-natural', FOCUS)}>
              <span className="text-sm font-semibold text-sanctuary-foreground/80">{fmt(c.articleMeta, { date: article.date })}</span>
              <span className="mt-2 font-heading font-semibold text-xl leading-snug">{article.title}</span>
              <span className="mt-2 text-sanctuary-foreground/85 leading-relaxed">{article.excerpt}</span>
              <span className="mt-auto pt-4 text-sm font-semibold inline-flex items-center gap-1">{c.articleRead} <ArrowLeft className={cn('w-4 h-4', FWD)} aria-hidden="true" /></span>
            </DemoLink>
          )}
        </div>
        <DemoLink to={ROUTES.events} className={cn('mt-6 inline-flex items-center gap-1', TEXT_LINK)}>{c.allEvents} <ArrowLeft className={cn('w-4 h-4', FWD)} aria-hidden="true" /></DemoLink>
      </Band>

      {/* ── 7. The two doors, again ── */}
      <Band tone="dark" labelledBy="landing-again">
        <SectionHeading id="landing-again" onDark align="center" title={c.againTitle} />
        <div className="grid gap-4 md:grid-cols-2 max-w-4xl mx-auto">
          {DOORS.map((door) => {
            const Icon = door.icon;
            return (
              <DemoLink key={door.key} to={door.to} className={cn('group flex items-center gap-4 rounded-super bg-card text-foreground p-6 shadow-atmospheric-lg hover:-translate-y-0.5 transition-natural', FOCUS)}>
                <span className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                  <Icon className="w-7 h-7" aria-hidden="true" />
                </span>
                <span className="flex-1">
                  <span className="block font-heading font-semibold text-xl">{door.cta}</span>
                  <span className="block text-muted-foreground">{door.text}</span>
                </span>
                <ArrowLeft className={cn('w-6 h-6 text-accent', FWD, NUDGE)} aria-hidden="true" />
              </DemoLink>
            );
          })}
        </div>
      </Band>

      {/* ── 8. Donate ── */}
      <Band tone="card" labelledBy="landing-donate">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] items-center">
          <div>
            <SectionHeading id="landing-donate" eyebrow={c.donateEyebrow} title={c.donateTitle} className="mb-3" />
            <p className="text-lg text-foreground leading-relaxed max-w-2xl">{DONATE.intro}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ExternalLink href={ORG.donateUrl} className={PILL_SOLID}>{c.donateJgive}</ExternalLink>
            <DemoLink to={ROUTES.donate} className={PILL_OUTLINE}>{c.donateMore}</DemoLink>
          </div>
        </div>
      </Band>

      {/* ── 9. Partners ── */}
      <Band tone="canvas" labelledBy="landing-partners">
        <SectionHeading id="landing-partners" eyebrow={c.partnersEyebrow} title={c.partnersTitle} />
        <ul className="flex flex-wrap gap-2">
          {PARTNERS.map((/** @type {string} */ p) => (
            <li key={p} className="rounded-full bg-card border border-border px-4 py-2 text-foreground">{p}</li>
          ))}
        </ul>
        <p className="mt-8 font-heading font-semibold text-foreground">{c.fundersTitle}</p>
        <ul className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
          {FUNDERS_AND_COLLABORATORS.map((/** @type {any} */ f) => (
            <li key={f.name} className="text-muted-foreground"><span className="text-foreground font-medium">{f.name}</span></li>
          ))}
        </ul>
      </Band>

      {/* ── 10. Contact ── */}
      <Band tone="muted" labelledBy="landing-contact">
        <div className="grid gap-8 md:grid-cols-3 items-start">
          <div className="md:col-span-1">
            <SectionHeading id="landing-contact" eyebrow={c.contactEyebrow} title={c.contactTitle} className="mb-3" />
            <DemoLink to={ROUTES.contact} className={cn('inline-flex items-center gap-1', TEXT_LINK)}>{c.contactLink} <ArrowLeft className={cn('w-4 h-4', FWD)} aria-hidden="true" /></DemoLink>
          </div>
          <dl className="md:col-span-2 grid gap-3 sm:grid-cols-3">
            <div className="rounded-super-sm bg-card p-4"><dt className="text-sm text-muted-foreground">{c.address}</dt><dd className="mt-1 text-foreground">{ORG.address}</dd></div>
            <div className="rounded-super-sm bg-card p-4"><dt className="text-sm text-muted-foreground">{c.phone}</dt><dd className="mt-1"><a className={TEXT_LINK} href={`tel:${ORG.phones.main.replace(/\D/g, '')}`} dir="ltr">{ORG.phones.main}</a></dd></div>
            <div className="rounded-super-sm bg-card p-4"><dt className="text-sm text-muted-foreground">{c.email}</dt><dd className="mt-1"><a className={TEXT_LINK} href={`mailto:${ORG.emails.general}`} dir="ltr">{ORG.emails.general}</a></dd></div>
          </dl>
        </div>
      </Band>
    </div>
  );
}
