import React from 'react';
import { ArrowLeft, Globe2, UserRound } from 'lucide-react';
import Disclosure from '@/components/patterns/Disclosure';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import PageHeaderV3 from '../components/PageHeaderV3';
import { COMMUNITIES_IMG } from '../images';
import { V3_ROUTES } from '../meta';
import { SocialChips, StatStrip } from '../components/ReleaseJourneyParts';
import { cn } from '@/lib/utils';
import { Band, ExternalLink, FWD, PILL_OUTLINE, PILL_SOLID, SectionHeading, StatusPill, TEXT_LINK } from '../components/kit';
import { useCopy, useMetiv } from '../content/MetivContent';

// The professional-area page of מסע שחרור: the programme as a programme. Its
// structure, who built it, the bodies and communities it works with, the
// research around it and its staff. The patient area has its own page.

// Contact subjects, by RELEASE_JOURNEY_CONTACTS field.
const CONTACT_FIELDS = [
  ['external', 'contactExternal'],
  ['communities', 'contactCommunities'],
  ['followUp', 'contactFollowUp'],
  ['applications', 'contactApplications'],
];

export default function ReleaseJourneyPro() {
  const {
    JOURNEY_MODELS,
    RELEASE_JOURNEY,
    RELEASE_JOURNEY_CONTACTS,
    RELEASE_JOURNEY_PAPERS,
    RELEASE_JOURNEY_RESEARCHERS,
    RELEASE_JOURNEY_STATS,
    RELEASE_JOURNEY_STUDY,
    RELEASE_JOURNEY_TEAM,
    RELEASE_JOURNEY_WAITING,
  } = useMetiv();
  const c = useCopy('releaseJourneyPro');
  const CONTACTS = CONTACT_FIELDS.map(([field, copy]) => ({ subject: c[copy], person: RELEASE_JOURNEY_CONTACTS[field] })).filter((x) => x.person);
  return (
    <div className="bg-background">
      <PageHeaderV3
        tone="muted"
        size="editorial"
        eyebrow={c.eyebrow}
        title={RELEASE_JOURNEY.title}
        subtitle={c.subtitle}
        illustration={COMMUNITIES_IMG}
        short={[
          c.shortStructure,
          c.shortWho,
          c.shortTeam,
        ]}
        actions={
          <>
            <ExternalLink href={RELEASE_JOURNEY.siteUrl} className={PILL_SOLID}>{c.toSite}</ExternalLink>
            <DemoLink to={V3_ROUTES.releaseJourney} className={PILL_OUTLINE}>{c.participantsPage} <ArrowLeft className={cn('w-4 h-4', FWD)} aria-hidden="true" /></DemoLink>
          </>
        }
      />

      <Band tone="card" padding="py-10" labelledBy="rjp-stats">
        <h2 id="rjp-stats" className="sr-only">{c.statsHeading}</h2>
        <StatStrip stats={[...RELEASE_JOURNEY_STATS, RELEASE_JOURNEY_WAITING]} />
        <p className="mt-4 text-sm text-muted-foreground">
          {c.statsSourceBefore}<ExternalLink href={RELEASE_JOURNEY.siteUrl} className={TEXT_LINK}>{c.statsSourceLink}</ExternalLink>{c.statsSourceAfter}
        </p>
      </Band>

      <Band tone="canvas" width="default" labelledBy="rjp-about">
        <SectionHeading id="rjp-about" eyebrow={c.aboutEyebrow} title={c.aboutTitle} />
        <div className="space-y-4 text-lg text-foreground leading-relaxed">
          <p>{RELEASE_JOURNEY.description}</p>
          <p>{RELEASE_JOURNEY.scope}</p>
          <p>{RELEASE_JOURNEY.facilitators}</p>
        </div>
        <Disclosure label={c.credits} variant="soft" size="compact" className="mt-6">
          <div className="space-y-3 text-foreground leading-relaxed">{RELEASE_JOURNEY.credits.map((/** @type {string} */ x, /** @type {number} */ i) => <p key={i}>{x}</p>)}</div>
        </Disclosure>
      </Band>

      <Band tone="muted" labelledBy="rjp-models">
        <SectionHeading id="rjp-models" eyebrow={c.modelsEyebrow} title={c.modelsTitle} intro={c.modelsIntro} />
        <ul className="grid gap-5 lg:grid-cols-3">
          {JOURNEY_MODELS.map((/** @type {any} */ m) => (
            <li key={m.key} className="flex flex-col rounded-super bg-card border border-border p-6 shadow-card">
              <StatusPill tone="primary" className="self-start">{m.duration}</StatusPill>
              <h3 className="mt-3 font-heading font-semibold text-xl text-foreground">{m.title}</h3>
              <p className="mt-1 text-muted-foreground leading-relaxed">{m.summary}</p>
              <ol className="mt-4 space-y-3 border-t border-border pt-4">
                {m.workshops.map((/** @type {any} */ w, /** @type {number} */ i) => (
                  <li key={w.title} className="flex gap-3">
                    <span className="w-7 h-7 flex-shrink-0 rounded-full bg-primary/10 text-accent font-heading font-semibold text-sm flex items-center justify-center">{i + 1}</span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-foreground">{w.title}</span>
                      <span className="block text-sm text-muted-foreground leading-relaxed">{w.text}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ul>
      </Band>

      <Band tone="canvas" labelledBy="rjp-partners">
        <SectionHeading id="rjp-partners" eyebrow={c.partnersEyebrow} title={c.partnersTitle} />
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-super bg-card border border-border p-6">
            <h3 className="font-heading font-semibold text-xl text-foreground">{c.mod}</h3>
            <p className="mt-2 text-foreground leading-relaxed">{RELEASE_JOURNEY.partnership}</p>
            <DemoLink to={V3_ROUTES.aboutPartners} className={`${TEXT_LINK} mt-4 inline-flex items-center gap-1`}>{c.allPartners} <ArrowLeft className={cn('w-4 h-4', FWD)} aria-hidden="true" /></DemoLink>
          </div>
          <div className="rounded-super bg-card border border-border p-6">
            <h3 className="flex items-center gap-2 font-heading font-semibold text-xl text-foreground"><Globe2 className="w-5 h-5 text-accent" aria-hidden="true" />{c.hostCommunities}</h3>
            <p className="mt-2 text-foreground leading-relaxed">{RELEASE_JOURNEY.hosting}</p>
            <ul className="mt-4 flex flex-wrap gap-2">{RELEASE_JOURNEY.hostCountries.map((/** @type {string} */ x, /** @type {number} */ i) => <li key={i}><StatusPill tone="muted">{x}</StatusPill></li>)}</ul>
          </div>
        </div>
      </Band>

      <Band tone="card" labelledBy="rjp-research">
        <SectionHeading id="rjp-research" eyebrow={c.researchEyebrow} title={c.researchTitle} />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="space-y-4">
            {RELEASE_JOURNEY_STUDY && (
              <div className="rounded-super bg-background border border-border p-6">
                <StatusPill tone="muted">{RELEASE_JOURNEY_STUDY.status}</StatusPill>
                <h3 className="mt-3 font-heading font-semibold text-xl text-foreground">{RELEASE_JOURNEY_STUDY.title}</h3>
                <p className="mt-1 text-foreground leading-relaxed">{RELEASE_JOURNEY_STUDY.summary}</p>
                <DemoLink to={`${ROUTES.research}#${RELEASE_JOURNEY_STUDY.slug}`} className={`${TEXT_LINK} mt-3 inline-flex items-center gap-1`}>{c.toStudies} <ArrowLeft className={cn('w-4 h-4', FWD)} aria-hidden="true" /></DemoLink>
              </div>
            )}
            {RELEASE_JOURNEY_RESEARCHERS.map((/** @type {any} */ r) => (
              <p key={r.name} className="flex items-start gap-3 text-foreground">
                <span className="w-9 h-9 rounded-full bg-primary/10 text-accent flex items-center justify-center flex-shrink-0"><UserRound className="w-4 h-4" aria-hidden="true" /></span>
                <span><span className="font-semibold">{r.name}</span><span className="block text-sm text-muted-foreground">{r.role}</span></span>
              </p>
            ))}
          </div>
          <div>
            <h3 className="font-heading font-semibold text-xl text-foreground mb-3">{c.papersTitle}</h3>
            <ul className="space-y-3">
              {RELEASE_JOURNEY_PAPERS.map((/** @type {any} */ p) => (
                <li key={p.title} className="rounded-super-sm bg-background border border-border p-4" dir="ltr" lang="en">
                  <p className="font-semibold text-foreground text-start">
                    {p.url ? <ExternalLink href={p.url} className={TEXT_LINK}>{p.title}</ExternalLink> : p.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground text-start">{[p.authors.join(', '), p.journal, p.year, p.details].filter(Boolean).join(' · ')}</p>
                </li>
              ))}
            </ul>
            <DemoLink to={ROUTES.publications} className={`${PILL_OUTLINE} mt-5`}>{c.allPublications}</DemoLink>
          </div>
        </div>
      </Band>

      <Band tone="canvas" labelledBy="rjp-team">
        <SectionHeading id="rjp-team" eyebrow={c.teamEyebrow} title={c.teamTitle} />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {RELEASE_JOURNEY_TEAM.map((/** @type {any} */ t) => (
            <li key={t.name} className="flex items-start gap-3 rounded-super-sm bg-card border border-border p-4">
              <span className="w-10 h-10 rounded-full bg-primary/10 text-accent flex items-center justify-center flex-shrink-0"><UserRound className="w-5 h-5" aria-hidden="true" /></span>
              <span className="min-w-0">
                <span className="block font-semibold text-foreground">{t.name}</span>
                <span className="block text-sm text-muted-foreground leading-snug">{t.role}</span>
              </span>
            </li>
          ))}
        </ul>
      </Band>

      <Band tone="muted" labelledBy="rjp-contact">
        <div className="rounded-super bg-sanctuary text-sanctuary-foreground p-8 sm:p-10">
          <h2 id="rjp-contact" className="font-heading font-semibold text-2xl sm:text-3xl">{c.contactTitle}</h2>
          <p className="mt-2 text-sanctuary-foreground/85 text-lg max-w-2xl">{c.contactText}</p>
          <div className="mt-5 rounded-super-sm bg-card text-foreground p-5 space-y-5">
            <dl className="grid gap-3 sm:grid-cols-2">
              {CONTACTS.map((c) => (
                <div key={c.subject} className="rounded-super-sm bg-muted p-4">
                  <dt className="text-xs font-semibold text-accent mb-0.5">{c.subject}</dt>
                  <dd className="text-foreground">{c.person?.name}<span className="block text-sm text-muted-foreground">{c.person?.role}</span></dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap gap-3">
              <ExternalLink href={RELEASE_JOURNEY.registerUrl} className={PILL_SOLID}>{c.registerForm}</ExternalLink>
              <ExternalLink href={RELEASE_JOURNEY.siteUrl} className={PILL_OUTLINE}>{c.toSite}</ExternalLink>
              <DemoLink to={ROUTES.contact} className={PILL_OUTLINE}>{c.contactMetiv}</DemoLink>
            </div>
            <SocialChips />
          </div>
        </div>
      </Band>
    </div>
  );
}
