import React, { useState } from 'react';
import { ArrowLeft, Check, PlayCircle, Users } from 'lucide-react';
import Disclosure from '@/components/patterns/Disclosure';
import { DemoLink, DemoMarkdown } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { V3_ROUTES } from '../meta';
import { cn } from '@/lib/utils';
import PageHeaderV3 from '../components/PageHeaderV3';
import { PTSD_INFO_IMG } from '../images';
import { Band, ChipQuestion, ContactChips, ExternalLink, FactGrid, FWD, PILL_OUTLINE, PILL_SOLID, SectionHeading, StatusPill } from '../components/kit';
import { fmt, useCopy, useMetiv } from '../content/MetivContent';

export default function Research() {
  const { ACTIVE_STUDIES, RESEARCH_INTRO } = useMetiv();
  const c = useCopy('research');
  const [show, setShow] = useState('all');
  const recruiting = ACTIVE_STUDIES.filter((/** @type {any} */ s) => s.recruiting);
  const studies = show === 'recruiting' ? recruiting : ACTIVE_STUDIES;

  return (
    <div className="bg-background">
      <PageHeaderV3
        tone="muted"
        eyebrow={c.eyebrow}
        title={RESEARCH_INTRO.title}
        subtitle={fmt(c.subtitle, { focus: RESEARCH_INTRO.focus })}
        illustration={PTSD_INFO_IMG}
        short={[
          fmt(c.shortCount, { count: ACTIVE_STUDIES.length, recruiting: recruiting.length }),
          c.shortCards,
          fmt(c.shortJournalClub, { description: RESEARCH_INTRO.journalClub.description }),
        ]}
        actions={<DemoLink to={ROUTES.publications} className={PILL_OUTLINE}>{c.toPublications} <ArrowLeft className={cn('w-4 h-4', FWD)} aria-hidden="true" /></DemoLink>}
      />

      <Band tone="canvas" labelledBy="res-unit">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading id="res-unit" eyebrow={c.unitEyebrow} title={c.unitTitle} className="mb-4" />
            <div className="space-y-4 text-lg text-foreground leading-relaxed">
              {RESEARCH_INTRO.paragraphs.map((/** @type {string} */ p, /** @type {number} */ i) => <p key={i}>{p}</p>)}
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-super bg-card border border-border p-6">
              <p className="font-heading font-semibold text-lg text-foreground">{c.unitRole}</p>
              <p className="mt-1 text-foreground leading-relaxed">{RESEARCH_INTRO.role}</p>
            </div>
            <div className="rounded-super bg-card border border-border p-6">
              <p className="font-heading font-semibold text-lg text-foreground mb-3">{c.principles}</p>
              <ul className="flex flex-wrap gap-2">{RESEARCH_INTRO.principles.map((/** @type {string} */ p, /** @type {number} */ i) => <li key={i}><StatusPill tone="primary">{p}</StatusPill></li>)}</ul>
            </div>
          </div>
        </div>
      </Band>

      <Band tone="card" labelledBy="res-studies">
        <SectionHeading id="res-studies" eyebrow={c.studiesEyebrow} title={c.studiesTitle} intro={c.studiesIntro} />
        <ChipQuestion
          legend={c.showLegend}
          value={show}
          onChange={setShow}
          className="mb-8"
          options={[
            { key: 'all', label: c.showAll, count: ACTIVE_STUDIES.length },
            { key: 'recruiting', label: c.showRecruiting, count: recruiting.length },
          ]}
        />
        <ul className="grid gap-5 md:grid-cols-2" aria-live="polite">
          {studies.map((/** @type {any} */ s) => (
            <li key={s.slug} id={s.slug} className={cn('scroll-mt-36 flex flex-col rounded-super border p-6', s.recruiting ? 'bg-background border-success/40' : 'bg-background border-border')}>
              <div className="flex flex-wrap items-center gap-2">
                {s.recruiting ? <StatusPill tone="success">{c.recruiting}</StatusPill> : <StatusPill tone="muted">{c.notRecruiting}</StatusPill>}
                <StatusPill tone="muted">{s.status}</StatusPill>
              </div>
              <h3 className="mt-3 font-heading font-semibold text-xl text-foreground">{s.title}</h3>
              <p className="mt-1 text-foreground leading-relaxed">{s.summary}</p>
              {s.slug === 'release-journey-study' && (
                <DemoLink to={V3_ROUTES.releaseJourneyPro} className="mt-2 font-medium text-accent underline underline-offset-4">{c.toReleaseJourney}</DemoLink>
              )}
              <FactGrid className="mt-4" columns={1} items={[{ label: c.population, value: s.population, icon: <Users className="w-5 h-5" /> }]} />
              {s.eligibility?.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">{c.eligibility}</p>
                  <ul className="space-y-1.5">
                    {s.eligibility.map((/** @type {string} */ e, /** @type {number} */ i) => <li key={i} className="flex gap-2 text-foreground"><Check className="w-4 h-4 mt-1 text-success flex-shrink-0" aria-hidden="true" />{e}</li>)}
                  </ul>
                </div>
              )}
              {s.description && s.description !== s.summary && (
                <Disclosure label={c.aboutStudy} variant="soft" size="compact" className="mt-4">
                  <DemoMarkdown className="rich-content text-foreground">{s.description}</DemoMarkdown>
                  {s.team?.length > 0 && <p className="mt-3 text-sm text-muted-foreground">{fmt(c.studyTeam, { names: s.team.join(', ') })}</p>}
                </Disclosure>
              )}
              <div className="mt-auto pt-5 space-y-3">
                {s.links?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {s.links.map((/** @type {any} */ l, /** @type {number} */ i) => <ExternalLink key={l.url} href={l.url} className={cn(i === 0 && s.recruiting ? PILL_SOLID : PILL_OUTLINE, 'text-sm px-4 py-2')}>{l.label}</ExternalLink>)}
                  </div>
                )}
                <ContactChips contact={s.contact} />
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-muted-foreground">
          {c.freePrompt}{' '}
          <DemoLink to={ROUTES.freeTreatment} className="font-medium text-accent underline underline-offset-4">{c.freeLink}</DemoLink>
        </p>
      </Band>

      <Band tone="muted" labelledBy="res-more">
        <div className="grid gap-5 lg:grid-cols-3">
          {/* The whole card opens the journal club playlist. */}
          <a
            href={RESEARCH_INTRO.journalClub.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-super bg-sanctuary text-sanctuary-foreground p-7 flex flex-col shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-natural focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <PlayCircle className="w-8 h-8" aria-hidden="true" />
            <h2 id="res-more" className="mt-3 font-heading font-semibold text-2xl">{RESEARCH_INTRO.journalClub.title}</h2>
            <p className="mt-1 text-sanctuary-foreground/85">{RESEARCH_INTRO.journalClub.description}</p>
            <span className="mt-auto pt-5 font-semibold underline underline-offset-4 group-hover:no-underline">{c.toPlaylist}</span>
            <span className="sr-only">{c.opensNewTab}</span>
          </a>
          <div className="rounded-super bg-card border border-border p-7">
            <h3 className="font-heading font-semibold text-xl text-foreground mb-3">{c.pastAreas}</h3>
            <ul className="space-y-2 text-foreground">
              {RESEARCH_INTRO.pastResearchAreas.map((/** @type {string} */ a, /** @type {number} */ i) => <li key={i} className="flex gap-2"><span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" aria-hidden="true" />{a}</li>)}
            </ul>
          </div>
          <div className="rounded-super bg-card border-2 border-primary/25 p-7">
            <h3 className="font-heading font-semibold text-xl text-foreground">{c.collabTitle}</h3>
            <p className="text-muted-foreground mt-1 mb-4">{c.collabText}</p>
            <ContactChips contact={RESEARCH_INTRO.collaborationContact} />
          </div>
        </div>
      </Band>
    </div>
  );
}
