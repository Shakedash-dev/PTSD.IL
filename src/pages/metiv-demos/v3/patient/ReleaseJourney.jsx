import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Globe2, MapPin, UserRound, Users } from 'lucide-react';
import PageHeader from '@/components/patterns/PageHeader';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { IMAGES } from '@/lib/images';
import useDirection from '@/lib/useDirection';
import { fmt, useCopy, useMetiv } from '../content/MetivContent';
import { SocialChips, StatStrip } from '../components/ReleaseJourneyParts';
import { Band, ChipQuestion, ExternalLink, FactGrid, JourneySteps, LinkCard, PILL_OUTLINE, PILL_SOLID, SectionHeading, StatusPill } from '../components/kit';
import { VersionLinks } from './PtsdIlRouting';
import { PATIENT_ANCHORS } from './PatientKit';

// Metiv demo (V3): the patient-area page of מסע שחרור (owner feedback: a full
// page of its own). Written for a discharged soldier: what the journey is, how
// it runs, what else Metiv offers around it and how to join. The professional
// area has its own page, with different content.

// Each card's title and description are `patientReleaseJourney` copy keys
// (`more<Name>Title`, `more<Name>Description`).
const MORE_AT_METIV = [
  { to: `${ROUTES.community}#${PATIENT_ANCHORS.veterans}`, copy: 'moreVeterans' },
  { to: ROUTES.freeTreatment, copy: 'moreFree' },
  { to: `${ROUTES.whereToGetHelp}#migdalor`, copy: 'moreMigdalor' },
  { to: `${ROUTES.whereToGetHelp}#adults-clinic`, copy: 'moreAdults' },
];

export default function ReleaseJourney() {
  const { JOURNEY_MODELS, RELEASE_JOURNEY, RELEASE_JOURNEY_CONTACTS, RELEASE_JOURNEY_STATS } = useMetiv();
  const c = useCopy('patientReleaseJourney');
  const { isRTL } = useDirection();
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const [modelKey, setModelKey] = useState(JOURNEY_MODELS[0].key);
  const model = JOURNEY_MODELS.find((m) => m.key === modelKey) || JOURNEY_MODELS[0];
  const applications = RELEASE_JOURNEY_CONTACTS.applications;

  return (
    <VersionLinks>
      <div className="min-h-screen bg-background">
        <PageHeader
          size="editorial"
          align="start"
          tone="card"
          image={IMAGES.community_hero}
          eyebrow={c.eyebrow}
          title={RELEASE_JOURNEY.title}
          subtitle={c.subtitle}
          actions={
            <div className="flex flex-wrap gap-3">
              <ExternalLink href={RELEASE_JOURNEY.registerUrl} className={PILL_SOLID}>{c.register}</ExternalLink>
              <ExternalLink href={RELEASE_JOURNEY.siteUrl} className={PILL_OUTLINE}>{c.siteLink}</ExternalLink>
            </div>
          }
        />

        <Band tone="canvas" padding="py-10" labelledBy="rj-stats">
          <h2 id="rj-stats" className="sr-only">{c.statsHeading}</h2>
          <StatStrip stats={RELEASE_JOURNEY_STATS} />
        </Band>

        <Band tone="card" labelledBy="rj-what">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
            <div>
              <SectionHeading id="rj-what" eyebrow={c.whatEyebrow} title={c.whatTitle} />
              <div className="space-y-4 text-lg text-foreground leading-relaxed">
                <p>{RELEASE_JOURNEY.belief}</p>
                <p>{RELEASE_JOURNEY.description}</p>
              </div>
            </div>
            <FactGrid
              columns={1}
              items={[
                { label: c.forWhomLabel, value: c.forWhom, icon: <Users className="w-5 h-5" /> },
                { label: c.facilitatorsLabel, value: RELEASE_JOURNEY.facilitators, icon: <UserRound className="w-5 h-5" /> },
                { label: c.whereLabel, value: c.where, icon: <MapPin className="w-5 h-5" /> },
              ]}
            />
          </div>
        </Band>

        <Band tone="canvas" labelledBy="rj-models">
          <SectionHeading id="rj-models" eyebrow={c.modelsEyebrow} title={c.modelsTitle} intro={c.modelsIntro} />
          <ChipQuestion legend={c.modelsLegend} value={model.key} onChange={setModelKey} options={JOURNEY_MODELS.map((m) => ({ key: m.key, label: m.label }))} className="mb-6" />
          <div className="grid gap-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)]" aria-live="polite">
            <div className="rounded-super bg-card border border-border p-6 self-start">
              <StatusPill tone="primary">{model.duration}</StatusPill>
              <h3 className="mt-3 font-heading font-semibold text-2xl text-foreground">{model.title}</h3>
              <p className="mt-2 text-foreground leading-relaxed">{model.summary}</p>
            </div>
            <JourneySteps label={fmt(c.modelWorkshops, { model: model.title })} steps={model.workshops} />
          </div>
        </Band>

        <Band tone="muted" labelledBy="rj-hosting">
          <div className="grid gap-8 lg:grid-cols-2 items-start">
            <div>
              <SectionHeading id="rj-hosting" eyebrow={c.hostingEyebrow} title={c.hostingTitle} className="mb-4" />
              <p className="text-lg text-foreground leading-relaxed">{RELEASE_JOURNEY.hosting}</p>
            </div>
            <div className="rounded-super bg-card p-6">
              <p className="flex items-center gap-2 font-heading font-semibold text-xl text-foreground mb-3"><Globe2 className="w-5 h-5 text-accent" aria-hidden="true" />{c.hostCountries}</p>
              <ul className="flex flex-wrap gap-2">{RELEASE_JOURNEY.hostCountries.map((c, /** @type {number} */ i) => <li key={i}><StatusPill tone="muted">{c}</StatusPill></li>)}</ul>
            </div>
          </div>
        </Band>

        <Band tone="canvas" labelledBy="rj-more">
          <SectionHeading id="rj-more" eyebrow={c.moreEyebrow} title={c.moreTitle} intro={c.moreIntro} />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MORE_AT_METIV.map((m) => (
              <li key={m.to}><LinkCard to={m.to} title={c[`${m.copy}Title`]} description={c[`${m.copy}Description`]} /></li>
            ))}
          </ul>
        </Band>

        <Band tone="card" labelledBy="rj-join">
          <div className="rounded-super bg-sanctuary text-sanctuary-foreground p-8 sm:p-10">
            <h2 id="rj-join" className="font-heading font-semibold text-2xl sm:text-3xl">{c.joinTitle}</h2>
            <p className="mt-2 text-sanctuary-foreground/85 text-lg max-w-2xl">
              {c.joinText}
              {applications && ` ${fmt(c.joinApplications, { name: applications.name, role: applications.role })}`}
            </p>
            <div className="mt-5 rounded-super-sm bg-card text-foreground p-5 space-y-4">
              <div className="flex flex-wrap gap-3">
                <ExternalLink href={RELEASE_JOURNEY.registerUrl} className={PILL_SOLID}>{c.register}</ExternalLink>
                <ExternalLink href={RELEASE_JOURNEY.siteUrl} className={PILL_OUTLINE}>{c.siteLink}</ExternalLink>
                <DemoLink to={ROUTES.contact} className={PILL_OUTLINE}>{c.contactMetiv} <ArrowIcon className="w-4 h-4" aria-hidden="true" /></DemoLink>
              </div>
              <SocialChips />
            </div>
          </div>
        </Band>
      </div>
    </VersionLinks>
  );
}
