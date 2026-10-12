import React, { useState } from 'react';
import { ArrowLeft, Globe2, MapPin, UserRound, Users } from 'lucide-react';
import PageHeader from '@/components/patterns/PageHeader';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { ADDITION_ANCHORS } from '@/pages/metiv-demos/shared/patient/additions';
import { IMAGES } from '@/lib/images';
import { JOURNEY_MODELS, RELEASE_JOURNEY, RELEASE_JOURNEY_CONTACTS, RELEASE_JOURNEY_STATS } from '../data/releaseJourney';
import { SocialChips, StatStrip } from '../components/ReleaseJourneyParts';
import { Band, ChipQuestion, ExternalLink, FactGrid, JourneySteps, LinkCard, PILL_OUTLINE, PILL_SOLID, SectionHeading, StatusPill } from '../components/kit';
import { VersionLinks } from './PtsdIlRouting';

// Metiv demo (V3): the patient-area page of מסע שחרור (owner feedback: a full
// page of its own). Written for a discharged soldier: what the journey is, how
// it runs, what else Metiv offers around it and how to join. The professional
// area has its own page, with different content.

const MORE_AT_METIV = [
  { to: `${ROUTES.community}#${ADDITION_ANCHORS.veterans}`, title: 'קבוצות למילואימניקים ולמשפחות', description: 'תוכניות קבוצתיות של מטיב לחיילים משוחררים, למילואימניקים ולבני משפחותיהם.' },
  { to: ROUTES.freeTreatment, title: 'טיפולים ללא עלות ומחקרים', description: 'מסגרות טיפול ללא עלות ומחקרים שמגייסים משתתפים.' },
  { to: `${ROUTES.whereToGetHelp}#migdalor`, title: 'מרפאת מגדלור', description: 'למי שמוכר באגף השיקום של משרד הביטחון, בהפניה מהאגף.' },
  { to: `${ROUTES.whereToGetHelp}#adults-clinic`, title: 'מרפאת המבוגרים', description: 'טיפול פרטני לבני 17 ומעלה, בירושלים ובזום.' },
];

export default function ReleaseJourney() {
  const [modelKey, setModelKey] = useState(JOURNEY_MODELS[0].key);
  const model = JOURNEY_MODELS.find((m) => m.key === modelKey) || JOURNEY_MODELS[0];
  const applications = RELEASE_JOURNEY_CONTACTS.applications;

  return (
    <VersionLinks>
      <div dir="rtl" lang="he" className="min-h-screen bg-background">
        <PageHeader
          size="editorial"
          align="start"
          tone="card"
          image={IMAGES.community_hero}
          eyebrow="לחיילים משוחררים"
          title={RELEASE_JOURNEY.title}
          subtitle="מסע קבוצתי לצוותים של חיילים משוחררים שנחשפו לאירועי קרב. מי ששירתו יחד, מעבדים את החוויות יחד."
          actions={
            <div className="flex flex-wrap gap-3">
              <ExternalLink href={RELEASE_JOURNEY.registerUrl} className={PILL_SOLID}>הרשמה למסע שחרור</ExternalLink>
              <ExternalLink href={RELEASE_JOURNEY.siteUrl} className={PILL_OUTLINE}>לאתר מסע שחרור</ExternalLink>
            </div>
          }
        />

        <Band tone="canvas" padding="py-10" labelledBy="rj-stats">
          <h2 id="rj-stats" className="sr-only">מסע שחרור במספרים</h2>
          <StatStrip stats={RELEASE_JOURNEY_STATS} />
        </Band>

        <Band tone="card" labelledBy="rj-what">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
            <div>
              <SectionHeading id="rj-what" eyebrow="מה זה" title="לעבד את חוויות הלחימה, עם הצוות" />
              <div className="space-y-4 text-lg text-foreground leading-relaxed">
                <p>{RELEASE_JOURNEY.belief}</p>
                <p>{RELEASE_JOURNEY.description}</p>
              </div>
            </div>
            <FactGrid
              columns={1}
              items={[
                { label: 'למי מיועד', value: 'חיילים משוחררים שנחשפו לאירועי קרב במהלך השירות. מגיעים כצוות אורגני.', icon: <Users className="w-5 h-5" /> },
                { label: 'מי מנחה', value: RELEASE_JOURNEY.facilitators, icon: <UserRound className="w-5 h-5" /> },
                { label: 'איפה', value: 'בארץ ובחו"ל, לפי המסלול.', icon: <MapPin className="w-5 h-5" /> },
              ]}
            />
          </div>
        </Band>

        <Band tone="canvas" labelledBy="rj-models">
          <SectionHeading id="rj-models" eyebrow="איך זה נראה" title="שלושה מסלולים" intro="בוחרים מסלול כדי לראות את הסדנאות שלו, לפי הסדר." />
          <ChipQuestion legend="איזה מסלול להציג?" value={model.key} onChange={setModelKey} options={JOURNEY_MODELS.map((m) => ({ key: m.key, label: m.label }))} className="mb-6" />
          <div className="grid gap-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)]" aria-live="polite">
            <div className="rounded-super bg-card border border-border p-6 self-start">
              <StatusPill tone="primary">{model.duration}</StatusPill>
              <h3 className="mt-3 font-heading font-semibold text-2xl text-foreground">{model.title}</h3>
              <p className="mt-2 text-foreground leading-relaxed">{model.summary}</p>
            </div>
            <JourneySteps label={`הסדנאות ב${model.title}`} steps={model.workshops} />
          </div>
        </Band>

        <Band tone="muted" labelledBy="rj-hosting">
          <div className="grid gap-8 lg:grid-cols-2 items-start">
            <div>
              <SectionHeading id="rj-hosting" eyebrow='במסע בחו"ל' title="אירוח בקהילות בעולם" className="mb-4" />
              <p className="text-lg text-foreground leading-relaxed">{RELEASE_JOURNEY.hosting}</p>
            </div>
            <div className="rounded-super bg-card p-6">
              <p className="flex items-center gap-2 font-heading font-semibold text-xl text-foreground mb-3"><Globe2 className="w-5 h-5 text-accent" aria-hidden="true" />מדינות שבהן קהילות אירחו מסע</p>
              <ul className="flex flex-wrap gap-2">{RELEASE_JOURNEY.hostCountries.map((c) => <li key={c}><StatusPill tone="muted">{c}</StatusPill></li>)}</ul>
            </div>
          </div>
        </Band>

        <Band tone="canvas" labelledBy="rj-more">
          <SectionHeading id="rj-more" eyebrow="לא רק מסע" title="מענים נוספים במסגרת מטיב" intro="מסע שחרור כולל גם טיפולים פרטניים, ולצידו פועלות במטיב מסגרות נוספות." />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MORE_AT_METIV.map((m) => (
              <li key={m.to}><LinkCard to={m.to} title={m.title} description={m.description} /></li>
            ))}
          </ul>
        </Band>

        <Band tone="card" labelledBy="rj-join">
          <div className="rounded-super bg-sanctuary text-sanctuary-foreground p-8 sm:p-10">
            <h2 id="rj-join" className="font-heading font-semibold text-2xl sm:text-3xl">איך מצטרפים</h2>
            <p className="mt-2 text-sanctuary-foreground/85 text-lg max-w-2xl">
              ההרשמה נעשית בטופס מקוון.
              {applications && ` לפניות: ${applications.name}, ${applications.role}.`}
            </p>
            <div className="mt-5 rounded-super-sm bg-card text-foreground p-5 space-y-4">
              <div className="flex flex-wrap gap-3">
                <ExternalLink href={RELEASE_JOURNEY.registerUrl} className={PILL_SOLID}>הרשמה למסע שחרור</ExternalLink>
                <ExternalLink href={RELEASE_JOURNEY.siteUrl} className={PILL_OUTLINE}>לאתר מסע שחרור</ExternalLink>
                <DemoLink to={ROUTES.contact} className={PILL_OUTLINE}>יצירת קשר עם מטיב <ArrowLeft className="w-4 h-4" aria-hidden="true" /></DemoLink>
              </div>
              <SocialChips />
            </div>
          </div>
        </Band>
      </div>
    </VersionLinks>
  );
}
