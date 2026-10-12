import React from 'react';
import { ArrowLeft, Globe2, UserRound } from 'lucide-react';
import Disclosure from '@/components/patterns/Disclosure';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import PageHeaderV3 from '../components/PageHeaderV3';
import { COMMUNITIES_IMG } from '../images';
import { V3_ROUTES } from '../meta';
import {
  JOURNEY_MODELS,
  RELEASE_JOURNEY,
  RELEASE_JOURNEY_CONTACTS,
  RELEASE_JOURNEY_PAPERS,
  RELEASE_JOURNEY_RESEARCHERS,
  RELEASE_JOURNEY_STATS,
  RELEASE_JOURNEY_STUDY,
  RELEASE_JOURNEY_TEAM,
  RELEASE_JOURNEY_WAITING,
} from '../data/releaseJourney';
import { SocialChips, StatStrip } from '../components/ReleaseJourneyParts';
import { Band, ExternalLink, PILL_OUTLINE, PILL_SOLID, SectionHeading, StatusPill, TEXT_LINK } from '../components/kit';

// The professional-area page of מסע שחרור: the programme as a programme. Its
// structure, who built it, the bodies and communities it works with, the
// research around it and its staff. The patient area has its own page.

const CONTACTS = [
  { subject: 'קשרי חוץ ושותפויות', person: RELEASE_JOURNEY_CONTACTS.external },
  { subject: 'קהילות מארחות בחו"ל', person: RELEASE_JOURNEY_CONTACTS.communities },
  { subject: 'מעני המשך', person: RELEASE_JOURNEY_CONTACTS.followUp },
  { subject: 'פניות והרשמה', person: RELEASE_JOURNEY_CONTACTS.applications },
].filter((c) => c.person);

export default function ReleaseJourneyPro() {
  return (
    <div className="bg-background">
      <PageHeaderV3
        tone="muted"
        size="editorial"
        eyebrow="תוכנית של מטיב"
        title={RELEASE_JOURNEY.title}
        subtitle="תוכנית קבוצתית לעיבוד חוויות לחימה, לצוותים אורגניים של חיילים משוחררים. השנה מציינים 20 שנה להקמתה."
        illustration={COMMUNITIES_IMG}
        short={[
          'מבנה התוכנית: שלושה מודלים של מסע, בארץ ובחו"ל.',
          'מי פיתח אותה, עם מי היא פועלת, ואיזה מחקר מלווה אותה.',
          'צוות התוכנית, ולמי פונים בכל נושא.',
        ]}
        actions={
          <>
            <ExternalLink href={RELEASE_JOURNEY.siteUrl} className={PILL_SOLID}>לאתר מסע שחרור</ExternalLink>
            <DemoLink to={V3_ROUTES.releaseJourney} className={PILL_OUTLINE}>העמוד למשתתפים <ArrowLeft className="w-4 h-4" aria-hidden="true" /></DemoLink>
          </>
        }
      />

      <Band tone="card" padding="py-10" labelledBy="rjp-stats">
        <h2 id="rjp-stats" className="sr-only">מסע שחרור במספרים</h2>
        <StatStrip stats={[...RELEASE_JOURNEY_STATS, RELEASE_JOURNEY_WAITING]} />
        <p className="mt-4 text-sm text-muted-foreground">
          המספרים כפי שפורסמו ב<ExternalLink href={RELEASE_JOURNEY.siteUrl} className={TEXT_LINK}>אתר מסע שחרור</ExternalLink>.
        </p>
      </Band>

      <Band tone="canvas" width="default" labelledBy="rjp-about">
        <SectionHeading id="rjp-about" eyebrow="התוכנית" title="מה עושים במסע שחרור" />
        <div className="space-y-4 text-lg text-foreground leading-relaxed">
          <p>{RELEASE_JOURNEY.description}</p>
          <p>{RELEASE_JOURNEY.scope}</p>
          <p>{RELEASE_JOURNEY.facilitators}</p>
        </div>
        <Disclosure label="מי פיתח את התוכנית" variant="soft" size="compact" className="mt-6">
          <div className="space-y-3 text-foreground leading-relaxed">{RELEASE_JOURNEY.credits.map((c) => <p key={c}>{c}</p>)}</div>
        </Disclosure>
      </Band>

      <Band tone="muted" labelledBy="rjp-models">
        <SectionHeading id="rjp-models" eyebrow="המבנה" title="שלושה מודלים של מסע" intro="כל מודל בנוי מסדרת סדנאות. ההבדלים הם במשך, במקום ובאורך הסדנה המרכזית." />
        <ul className="grid gap-5 lg:grid-cols-3">
          {JOURNEY_MODELS.map((m) => (
            <li key={m.key} className="flex flex-col rounded-super bg-card border border-border p-6 shadow-card">
              <StatusPill tone="primary" className="self-start">{m.duration}</StatusPill>
              <h3 className="mt-3 font-heading font-semibold text-xl text-foreground">{m.title}</h3>
              <p className="mt-1 text-muted-foreground leading-relaxed">{m.summary}</p>
              <ol className="mt-4 space-y-3 border-t border-border pt-4">
                {m.workshops.map((w, i) => (
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
        <SectionHeading id="rjp-partners" eyebrow="עם מי" title="שותפים וקהילות" />
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-super bg-card border border-border p-6">
            <h3 className="font-heading font-semibold text-xl text-foreground">משרד הביטחון</h3>
            <p className="mt-2 text-foreground leading-relaxed">{RELEASE_JOURNEY.partnership}</p>
            <DemoLink to={V3_ROUTES.aboutPartners} className={`${TEXT_LINK} mt-4 inline-flex items-center gap-1`}>כל השותפים של מטיב <ArrowLeft className="w-4 h-4" aria-hidden="true" /></DemoLink>
          </div>
          <div className="rounded-super bg-card border border-border p-6">
            <h3 className="flex items-center gap-2 font-heading font-semibold text-xl text-foreground"><Globe2 className="w-5 h-5 text-accent" aria-hidden="true" />קהילות מארחות בעולם</h3>
            <p className="mt-2 text-foreground leading-relaxed">{RELEASE_JOURNEY.hosting}</p>
            <ul className="mt-4 flex flex-wrap gap-2">{RELEASE_JOURNEY.hostCountries.map((c) => <li key={c}><StatusPill tone="muted">{c}</StatusPill></li>)}</ul>
          </div>
        </div>
      </Band>

      <Band tone="card" labelledBy="rjp-research">
        <SectionHeading id="rjp-research" eyebrow="מחקר" title="המחקר שמלווה את התוכנית" />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="space-y-4">
            {RELEASE_JOURNEY_STUDY && (
              <div className="rounded-super bg-background border border-border p-6">
                <StatusPill tone="muted">{RELEASE_JOURNEY_STUDY.status}</StatusPill>
                <h3 className="mt-3 font-heading font-semibold text-xl text-foreground">{RELEASE_JOURNEY_STUDY.title}</h3>
                <p className="mt-1 text-foreground leading-relaxed">{RELEASE_JOURNEY_STUDY.summary}</p>
                <DemoLink to={`${ROUTES.research}#${RELEASE_JOURNEY_STUDY.slug}`} className={`${TEXT_LINK} mt-3 inline-flex items-center gap-1`}>למחקרים הפעילים <ArrowLeft className="w-4 h-4" aria-hidden="true" /></DemoLink>
              </div>
            )}
            {RELEASE_JOURNEY_RESEARCHERS.map((r) => (
              <p key={r.name} className="flex items-start gap-3 text-foreground">
                <span className="w-9 h-9 rounded-full bg-primary/10 text-accent flex items-center justify-center flex-shrink-0"><UserRound className="w-4 h-4" aria-hidden="true" /></span>
                <span><span className="font-semibold">{r.name}</span><span className="block text-sm text-muted-foreground">{r.role}</span></span>
              </p>
            ))}
          </div>
          <div>
            <h3 className="font-heading font-semibold text-xl text-foreground mb-3">פרסומים על התוכנית</h3>
            <ul className="space-y-3">
              {RELEASE_JOURNEY_PAPERS.map((p) => (
                <li key={p.title} className="rounded-super-sm bg-background border border-border p-4" dir="ltr" lang="en">
                  <p className="font-semibold text-foreground text-start">
                    {p.url ? <ExternalLink href={p.url} className={TEXT_LINK}>{p.title}</ExternalLink> : p.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground text-start">{[p.authors.join(', '), p.journal, p.year, p.details].filter(Boolean).join(' · ')}</p>
                </li>
              ))}
            </ul>
            <DemoLink to={ROUTES.publications} className={`${PILL_OUTLINE} mt-5`}>לכל הפרסומים</DemoLink>
          </div>
        </div>
      </Band>

      <Band tone="canvas" labelledBy="rjp-team">
        <SectionHeading id="rjp-team" eyebrow="האנשים" title="צוות מסע שחרור" />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {RELEASE_JOURNEY_TEAM.map((t) => (
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
          <h2 id="rjp-contact" className="font-heading font-semibold text-2xl sm:text-3xl">למי פונים</h2>
          <p className="mt-2 text-sanctuary-foreground/85 text-lg max-w-2xl">קהילה שרוצה לארח, גוף שרוצה לתמוך, או איש מקצוע שמכיר צוות מתאים.</p>
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
              <ExternalLink href={RELEASE_JOURNEY.registerUrl} className={PILL_SOLID}>טופס הרשמה לצוות</ExternalLink>
              <ExternalLink href={RELEASE_JOURNEY.siteUrl} className={PILL_OUTLINE}>לאתר מסע שחרור</ExternalLink>
              <DemoLink to={ROUTES.contact} className={PILL_OUTLINE}>יצירת קשר עם מטיב</DemoLink>
            </div>
            <SocialChips />
          </div>
        </div>
      </Band>
    </div>
  );
}
