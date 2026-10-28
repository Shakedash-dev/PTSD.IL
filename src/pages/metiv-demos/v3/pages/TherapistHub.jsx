import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Mail } from 'lucide-react';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { TREATMENT_STEP_IMAGES } from '@/lib/images';
import { NamedIcon } from '@/pages/metiv-demos/shared/patient/components';
import { cn } from '@/lib/utils';
import PageHeaderV3 from '../components/PageHeaderV3';
import { Band, ChipQuestion, ExternalLink, FOCUS, FWD, JourneySteps, LinkCard, NUDGE, PILL_OUTLINE, PILL_SOLID, SectionHeading, StatusPill, TEXT_LINK } from '../components/kit';
import { courseStatus } from '../lib';
import { fmt, useCopy, useMetiv } from '../content/MetivContent';

/**
 * The goal chips and the route each one suggests.
 * @param {import('../content/MetivContent').MetivData} data
 * @param {Record<string, string>} c
 */
function buildNeeds(data, c) {
  /** @type {Record<string, { title: string, description: string, route: string, icon: string }>} */
  const section = Object.fromEntries(data.THERAPIST_HUB.sections.map((/** @type {any} */ s) => [s.key, s]));
  /** @param {string} key */
  const sectionStep = (key) => ({ title: section[key].title, text: section[key].description, to: section[key].route, cta: c.toPage });
  /** @param {string} slug */
  const courseStep = (slug) => {
    const course = data.getCourse(slug);
    return { title: course?.title || slug, text: course?.summary, to: `${ROUTES.courses}/${slug}`, cta: c.toCourse };
  };
  return [
    { key: 'learn', label: c.needLearn, steps: [sectionStep('courses'), sectionStep('events'), sectionStep('articles')] },
    { key: 'supervision', label: c.needSupervision, steps: [sectionStep('supervision'), courseStep('roadmap')] },
    { key: 'team', label: c.needTeam, steps: [sectionStep('organizations'), courseStep('org-therapist-training'), courseStep('trauma-informed-org-day')] },
    { key: 'kids', label: c.needKids, steps: [sectionStep('childrenFamily'), courseStep('kids-trauma-basics')] },
    { key: 'research', label: c.needResearch, steps: [sectionStep('research'), sectionStep('publications'), sectionStep('articles')] },
    {
      key: 'refer',
      label: c.needRefer,
      steps: [
        { title: c.referWhereTitle, text: c.referWhereText, to: ROUTES.whereToGetHelp, cta: c.referWhereCta },
        { title: c.referFreeTitle, text: c.referFreeText, to: ROUTES.freeTreatment, cta: c.toPage },
        { title: c.referResearchTitle, text: c.referResearchText, to: ROUTES.research, cta: c.referResearchCta },
      ],
    },
  ];
}

export default function TherapistHub() {
  const data = useMetiv();
  const { COURSES, ORG, THERAPIST_HUB, UPCOMING_EVENTS } = data;
  const c = useCopy('therapistHub');
  const [params, setParams] = useSearchParams();
  const needKey = params.get('need') || '';
  const NEEDS = useMemo(() => buildNeeds(data, c), [data, c]);
  const need = NEEDS.find((n) => n.key === needKey);
  const openCourses = COURSES.filter((/** @type {any} */ x) => courseStatus(x).key === 'open');
  const upcomingRuns = UPCOMING_EVENTS;

  /** @param {string} key */
  const choose = (key) => {
    const next = new URLSearchParams(params);
    if (key === needKey) next.delete('need');
    else next.set('need', key);
    setParams(next, { replace: true });
  };

  return (
    <div className="bg-background">
      <PageHeaderV3
        tone="muted"
        size="editorial"
        eyebrow={c.eyebrow}
        title={c.title}
        subtitle={THERAPIST_HUB.intro}
        image={TREATMENT_STEP_IMAGES[2]}
        actions={
          <>
            <DemoLink to={ROUTES.courses} className={PILL_SOLID}>{c.toCourses} <ArrowLeft className={cn('w-4 h-4', FWD)} aria-hidden="true" /></DemoLink>
            <ExternalLink href={THERAPIST_HUB.cta.url} className={PILL_OUTLINE}>{THERAPIST_HUB.cta.label}</ExternalLink>
          </>
        }
      />

      <Band tone="card" labelledBy="pro-question">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div>
            <SectionHeading id="pro-question" eyebrow={c.questionEyebrow} title={c.questionTitle} className="mb-4" />
            <p className="text-muted-foreground leading-relaxed mb-5">{c.questionIntro}</p>
            <ChipQuestion legend={c.questionTitle} options={NEEDS} value={needKey} onChange={choose} />
            <p className="mt-5 text-sm text-muted-foreground">
              {c.skipPrompt} <a href="#pro-all" className={TEXT_LINK}>{c.skipLink}</a>
            </p>
          </div>
          <div aria-live="polite">
            {need ? (
              <>
                <p className="font-heading font-semibold text-xl text-foreground mb-4">{fmt(c.pathTitle, { need: need.label })}</p>
                <JourneySteps steps={need.steps} label={need.label} />
              </>
            ) : (
              <>
                <p className="font-heading font-semibold text-xl text-foreground mb-4">{c.openTitle}</p>
                <ul className="space-y-3">
                  {openCourses.map((/** @type {any} */ x) => (
                    <li key={x.slug}>
                      <DemoLink to={`${ROUTES.courses}/${x.slug}`} className={cn('group flex items-start gap-4 rounded-super-sm bg-background border border-border p-4 hover:border-primary/60 transition-natural', FOCUS)}>
                        <span className="w-14 flex-shrink-0 rounded-2xl bg-primary/10 text-accent text-center py-2 font-heading font-semibold leading-tight">
                          <CalendarDays className="w-5 h-5 mx-auto mb-0.5" aria-hidden="true" />
                          <span className="text-xs" dir="ltr">{(x.startDate || '').split('.').slice(0, 2).join('.')}</span>
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-heading font-semibold text-foreground">{x.title}</span>
                            <StatusPill tone="success">{c.registrationOpen}</StatusPill>
                          </span>
                          <span className="block text-sm text-muted-foreground mt-1">{[x.startDate && fmt(c.opens, { date: x.startDate }), x.format, x.hours].filter(Boolean).join(' · ')}</span>
                        </span>
                        <ArrowLeft className={cn('w-5 h-5 text-accent mt-1', FWD, NUDGE)} aria-hidden="true" />
                      </DemoLink>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </Band>

      <Band tone="canvas" id="pro-all" labelledBy="pro-all-title">
        <SectionHeading id="pro-all-title" title={c.allTitle} />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {THERAPIST_HUB.sections.map((/** @type {any} */ s) => (
            <li key={s.key}>
              <LinkCard to={s.route} title={s.title} description={s.description} icon={<NamedIcon name={s.icon} className="w-6 h-6" />} />
            </li>
          ))}
        </ul>
      </Band>

      {upcomingRuns.length > 0 && (
        <Band tone="muted" labelledBy="pro-upcoming">
          <SectionHeading id="pro-upcoming" eyebrow={c.upcomingEyebrow} title={c.upcomingTitle} />
          <ul className="grid gap-4 md:grid-cols-2">
            {upcomingRuns.map((/** @type {any} */ e) => (
              <li key={e.slug} className="rounded-super bg-card border border-border p-6 shadow-card">
                <p className="text-sm font-semibold text-accent flex items-center gap-2"><CalendarDays className="w-4 h-4" aria-hidden="true" /> {e.date} · {e.type}</p>
                <p className="mt-2 font-heading font-semibold text-xl text-foreground">{e.title}</p>
                <p className="mt-1 text-muted-foreground leading-relaxed">{e.summary}</p>
                {e.link && !e.external && (
                  <DemoLink to={e.link} className={cn('mt-3 inline-flex items-center gap-1', TEXT_LINK)}>{c.details} <ArrowLeft className={cn('w-4 h-4', FWD)} aria-hidden="true" /></DemoLink>
                )}
              </li>
            ))}
          </ul>
        </Band>
      )}

      <Band tone="card" labelledBy="pro-contact">
        <div className="rounded-super bg-sanctuary text-sanctuary-foreground p-8 sm:p-10 grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] items-center">
          <div>
            <h2 id="pro-contact" className="font-heading font-semibold text-2xl sm:text-3xl">{c.contactTitle}</h2>
            <p className="mt-2 text-sanctuary-foreground/85 text-lg">{c.contactText}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ExternalLink href={THERAPIST_HUB.cta.url} className={cn('rounded-full bg-card text-foreground font-semibold px-6 py-3 hover:bg-muted transition-natural', FOCUS)}>{THERAPIST_HUB.cta.label}</ExternalLink>
            <a href={`mailto:${ORG.emails.courses}`} className={cn('inline-flex items-center gap-2 rounded-full border border-sanctuary-foreground/40 px-6 py-3 font-semibold hover:bg-sanctuary-foreground/10 transition-natural', FOCUS)}>
              <Mail className="w-4 h-4" aria-hidden="true" /> <span dir="ltr">{ORG.emails.courses}</span>
            </a>
          </div>
        </div>
      </Band>
    </div>
  );
}
