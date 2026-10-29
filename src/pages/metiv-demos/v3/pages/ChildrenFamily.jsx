import React, { useState } from 'react';
import { ArrowLeft, Baby, Users } from 'lucide-react';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { SECOND_CIRCLE_ILLUSTRATIONS } from '@/lib/images';
import { cn } from '@/lib/utils';
import PageHeaderV3 from '../components/PageHeaderV3';
import { Band, ChipQuestion, ContactChips, ExternalLink, FactGrid, FOCUS, FWD, PILL_OUTLINE, PILL_SOLID, SectionHeading, StatusPill } from '../components/kit';
import { courseStatus } from '../lib';
import { fmt, useCopy, useMetiv } from '../content/MetivContent';

export default function ChildrenFamily() {
  const { CHILDREN_FAMILY_INTRO, coursesByCategory } = useMetiv();
  const c = useCopy('childrenFamily');
  const AGE_OPTIONS = [
    { key: 'all', label: c.ageAll },
    { key: 'early', label: c.ageEarly },
    { key: 'school', label: c.ageSchool },
    { key: 'parents', label: c.ageParents },
  ];
  const [age, setAge] = useState('all');
  const intro = CHILDREN_FAMILY_INTRO;
  const trainings = coursesByCategory('children-family');
  // Each model lists the age groups it serves (`ageGroups`), for the "which age?" question.
  const models = intro.models.filter((/** @type {any} */ m) => age === 'all' || (m.ageGroups || []).includes(age));

  return (
    <div className="bg-background">
      <PageHeaderV3
        tone="muted"
        eyebrow={c.eyebrow}
        title={intro.title}
        subtitle={c.subtitle}
        illustration={SECOND_CIRCLE_ILLUSTRATIONS.children_content}
        short={[
          fmt(c.shortModels, { count: intro.models.length }),
          c.shortTrainings,
          c.shortInterest,
        ]}
        actions={<ExternalLink href={intro.trainingInterestFormUrl} className={PILL_SOLID}>{c.interestTrainings}</ExternalLink>}
      />

      <Band tone="canvas" width="default" labelledBy="cf-about">
        <SectionHeading id="cf-about" eyebrow={c.aboutEyebrow} title={c.aboutTitle} />
        <div className="space-y-4 text-lg text-foreground leading-relaxed">
          {intro.paragraphs.map((/** @type {string} */ p, /** @type {number} */ i) => <p key={i}>{p}</p>)}
        </div>
      </Band>

      <Band tone="card" labelledBy="cf-models">
        <SectionHeading id="cf-models" eyebrow={c.modelsEyebrow} title={c.modelsTitle} intro={c.modelsIntro} />
        <ChipQuestion legend={c.modelsTitle} options={AGE_OPTIONS} value={age} onChange={setAge} className="mb-8" />
        <p className="sr-only" aria-live="polite">{fmt(c.modelsShown, { count: models.length })}</p>
        <ul className="grid gap-5 md:grid-cols-2">
          {models.map((/** @type {any} */ m) => {
            const training = trainings.find((/** @type {any} */ x) => x.slug === m.trainingSlug);
            return (
              <li key={m.key} id={m.key} className="scroll-mt-36 flex flex-col rounded-super bg-background border border-border p-6">
                <div className="flex items-start gap-3">
                  <span className="w-12 h-12 rounded-2xl bg-primary/10 text-accent flex items-center justify-center flex-shrink-0">
                    {m.key.includes('parents') ? <Users className="w-6 h-6" aria-hidden="true" /> : <Baby className="w-6 h-6" aria-hidden="true" />}
                  </span>
                  <div>
                    <h3 className="font-heading font-semibold text-2xl text-foreground">{m.title}</h3>
                    {m.fullName && <p className="text-muted-foreground">{m.fullName}</p>}
                  </div>
                </div>
                <p className="mt-4 text-foreground leading-relaxed">{m.description}</p>
                <FactGrid
                  className="mt-4"
                  columns={1}
                  items={[
                    { label: c.factAges, value: m.ages },
                    { label: c.factStructure, value: m.structure },
                    { label: c.factDevelopedBy, value: m.developedBy },
                  ]}
                />
                {m.keyMessages?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-muted-foreground mb-2">{c.keyMessages}</p>
                    <ul className="flex flex-wrap gap-2">{m.keyMessages.map((/** @type {string} */ k, /** @type {number} */ i) => <li key={i}><StatusPill tone="primary">{k}</StatusPill></li>)}</ul>
                  </div>
                )}
                <div className="mt-auto pt-5 flex flex-wrap gap-3">
                  {training && (
                    <DemoLink to={`${ROUTES.courses}/${training.slug}`} className={cn(PILL_OUTLINE, 'text-sm')}>
                      {c.toTraining} <ArrowLeft className={cn('w-4 h-4', FWD)} aria-hidden="true" />
                    </DemoLink>
                  )}
                  <ExternalLink href={m.sourceUrl} className="text-sm text-muted-foreground hover:text-foreground">{c.onMetivSite}</ExternalLink>
                </div>
              </li>
            );
          })}
        </ul>
      </Band>

      <Band tone="muted" labelledBy="cf-trainings">
        <SectionHeading id="cf-trainings" eyebrow={c.trainingsEyebrow} title={c.trainingsTitle} intro={fmt(c.trainingsIntro, { list: intro.periodicTrainings.join(', ') })} />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trainings.map((/** @type {any} */ x) => {
            const st = courseStatus(x);
            return (
              <li key={x.slug}>
                <DemoLink to={`${ROUTES.courses}/${x.slug}`} className={cn('group flex h-full flex-col rounded-super bg-card border border-border p-5 hover:border-primary/60 hover:shadow-card transition-natural', FOCUS)}>
                  <StatusPill tone={st.tone} className="self-start">{st.label}</StatusPill>
                  <span className="mt-2 font-heading font-semibold text-lg text-foreground leading-snug">{x.title}</span>
                  <span className="mt-1 text-sm text-muted-foreground leading-relaxed">{x.summary}</span>
                  <span className="mt-auto pt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent">{c.details} <ArrowLeft className={cn('w-4 h-4', FWD)} aria-hidden="true" /></span>
                </DemoLink>
              </li>
            );
          })}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <ExternalLink href={intro.trainingInterestFormUrl} className={PILL_SOLID}>{c.interest}</ExternalLink>
          <ExternalLink href={intro.programSiteUrl} className={PILL_OUTLINE}>{c.pandaSite}</ExternalLink>
        </div>
      </Band>

      <Band tone="canvas" width="default" labelledBy="cf-contact">
        <SectionHeading id="cf-contact" title={c.contactTitle} className="mb-4" />
        <ContactChips contact={intro.contact} />
        <p className="mt-6 text-muted-foreground">
          {c.parentsPrompt}{' '}
          <DemoLink to={ROUTES.children} className="font-medium text-accent underline underline-offset-4">{c.parentsLink}</DemoLink>
        </p>
      </Band>
    </div>
  );
}
