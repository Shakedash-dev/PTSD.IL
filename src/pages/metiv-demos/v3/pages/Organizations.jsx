import React, { useState } from 'react';
import { ArrowLeft, Building2 } from 'lucide-react';
import Disclosure from '@/components/patterns/Disclosure';
import { DemoLink, DemoMarkdown } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { COMMUNITIES_IMG } from '../images';
import { cn } from '@/lib/utils';
import PageHeaderV3 from '../components/PageHeaderV3';
import { Band, ChipQuestion, ContactChips, ExternalLink, FWD, PILL_OUTLINE, QuoteCard, SectionHeading, StatusPill } from '../components/kit';
import { fmt, useCopy, useMetiv } from '../content/MetivContent';

const NEED_SLUGS = [
  { key: 'informed', copy: 'needInformed', slugs: ['metiv-space', 'trauma-informed-org'] },
  { key: 'workshop', copy: 'needWorkshop', slugs: ['custom-workshops'] },
  { key: 'clinical', copy: 'needClinical', slugs: ['org-trainings'] },
];

export default function Organizations() {
  // No choice shows every programme; choosing the same answer again clears it.
  const { ORGANIZATION_PROGRAMS, getCourse } = useMetiv();
  const c = useCopy('organizations');
  const NEEDS = NEED_SLUGS.map((n) => ({ key: n.key, label: c[n.copy], slugs: n.slugs }));
  const [need, setNeed] = useState('');
  const chosen = NEEDS.find((n) => n.key === need);
  const programs = chosen ? ORGANIZATION_PROGRAMS.filter((/** @type {any} */ p) => chosen.slugs.includes(p.slug)) : ORGANIZATION_PROGRAMS;
  const clients = [...new Set(ORGANIZATION_PROGRAMS.flatMap((/** @type {any} */ p) => p.clientList))];

  return (
    <div className="bg-background">
      <PageHeaderV3
        tone="muted"
        eyebrow={c.eyebrow}
        title={c.title}
        subtitle={c.subtitle}
        illustration={COMMUNITIES_IMG}
        short={[
          fmt(c.shortPrograms, { count: ORGANIZATION_PROGRAMS.length }),
          c.shortTailored,
          c.shortContact,
        ]}
      />

      <Band tone="card" labelledBy="org-question">
        <SectionHeading id="org-question" eyebrow={c.questionEyebrow} title={c.questionTitle} />
        <ChipQuestion legend={c.questionTitle} options={NEEDS} value={need} onChange={(k) => setNeed((cur) => (cur === k ? '' : k))} className="mb-10" />

        <div className="space-y-8" aria-live="polite">
          {programs.map((/** @type {any} */ p) => {
            const course = p.relatedCourseSlug ? getCourse(p.relatedCourseSlug) : null;
            return (
              <article key={p.slug} id={p.slug} aria-labelledby={`${p.slug}-title`} className="scroll-mt-36 rounded-super bg-background border border-border p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <span className="hidden sm:flex w-14 h-14 rounded-2xl bg-primary/10 text-accent items-center justify-center flex-shrink-0">
                    <Building2 className="w-7 h-7" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 id={`${p.slug}-title`} className="font-heading font-semibold text-2xl sm:text-3xl text-foreground">{p.title}</h3>
                    {p.subtitle && <p className="text-lg text-muted-foreground">{p.subtitle}</p>}
                    <p className="mt-3 text-lg text-foreground leading-relaxed">{p.summary}</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-super-sm bg-card border border-border p-4">
                    <p className="text-sm font-semibold text-muted-foreground mb-2">{c.looksLike}</p>
                    <ul className="flex flex-wrap gap-2">{p.formats.map((/** @type {string} */ f, /** @type {number} */ i) => <li key={i}><StatusPill tone="primary">{f}</StatusPill></li>)}</ul>
                  </div>
                  <div className="rounded-super-sm bg-card border border-border p-4">
                    <p className="text-sm font-semibold text-muted-foreground mb-2">{c.audience}</p>
                    <ul className="flex flex-wrap gap-2">{p.audience.map((/** @type {string} */ a, /** @type {number} */ i) => <li key={i}><StatusPill tone="muted">{a}</StatusPill></li>)}</ul>
                  </div>
                </div>

                {p.topics?.length > 0 && (
                  <div className="mt-5">
                    <p className="font-heading font-semibold text-foreground mb-2">{c.topics}</p>
                    <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2 text-foreground">
                      {p.topics.map((/** @type {string} */ t, /** @type {number} */ i) => <li key={i} className="flex gap-2"><span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" aria-hidden="true" />{t}</li>)}
                    </ul>
                  </div>
                )}

                <Disclosure label={c.readFull} variant="soft" size="compact" className="mt-6">
                  <DemoMarkdown className="rich-content text-foreground">{p.description}</DemoMarkdown>
                </Disclosure>

                {p.voices?.length > 0 && (
                  <div className="mt-6">
                    <p className="font-heading font-semibold text-foreground mb-3">{c.voices}</p>
                    <div className="grid gap-4 md:grid-cols-2">{p.voices.map((/** @type {string} */ v, /** @type {number} */ i) => <QuoteCard key={i} quote={v} />)}</div>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {p.links?.map((/** @type {any} */ l) => <ExternalLink key={l.url} href={l.url} className={cn(PILL_OUTLINE, 'text-sm')}>{l.label}</ExternalLink>)}
                  {course && (
                    <DemoLink to={`${ROUTES.courses}/${course.slug}`} className={cn(PILL_OUTLINE, 'text-sm')}>
                      {fmt(c.toCourse, { title: course.title })} <ArrowLeft className={cn('w-4 h-4', FWD)} aria-hidden="true" />
                    </DemoLink>
                  )}
                </div>
                <div className="mt-6 pt-5 border-t border-border">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">{c.contact}</p>
                  <ContactChips contact={p.contact} />
                </div>
              </article>
            );
          })}
        </div>
      </Band>

      <Band tone="muted" labelledBy="org-clients">
        <SectionHeading id="org-clients" eyebrow={c.clientsEyebrow} title={c.clientsTitle} intro={c.clientsIntro} />
        <ul className="flex flex-wrap gap-2">
          {clients.map((x, /** @type {number} */ i) => <li key={i} className="rounded-full bg-card border border-border px-4 py-2 text-foreground">{x}</li>)}
        </ul>
      </Band>
    </div>
  );
}
