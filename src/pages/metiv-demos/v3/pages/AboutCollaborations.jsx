import React from 'react';
import { Globe2 } from 'lucide-react';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { ABOUT, PARTNERS } from '@/pages/metiv-demos/shared/therapist';
import PageHeaderV3 from '../components/PageHeaderV3';
import { V3_ROUTES } from '../meta';
import { COLLABORATION_CONTACT, COLLABORATION_GROUPS } from '../data/aboutMetiv';
import { AboutTabs, PartnerGroupSection } from '../components/AboutParts';
import { Band, ContactChips, PILL_OUTLINE, SectionHeading, StatusPill } from '../components/kit';

// "שיתופי פעולה": professional, academic and field work done with others.
const BANDS = /** @type {const} */ (['canvas', 'card']);

export default function AboutCollaborations() {
  return (
    <div className="bg-background">
      <PageHeaderV3
        tone="muted"
        eyebrow="על מטיב"
        title="שיתופי פעולה"
        subtitle="עבודה משותפת של מטיב עם מוסדות אקדמיים, ארגונים מקצועיים, ארגונים שהוכשרו וקהילות, בארץ ובעולם."
        short={[]}
      />
      <AboutTabs />

      {COLLABORATION_GROUPS.map((g, i) => (
        <Band key={g.key} tone={BANDS[i % 2]} padding="py-12 sm:py-16">
          <PartnerGroupSection group={g} />
        </Band>
      ))}

      <Band tone="card" labelledBy="collab-orgs">
        <SectionHeading id="collab-orgs" title="ארגונים שקיבלו הכשרה או הדרכה" intro="גופים שמטיב הכשיר או הדריך את הצוותים שלהם." />
        <ul className="flex flex-wrap gap-2">{PARTNERS.map((p) => <li key={p} className="rounded-full bg-background border border-border px-4 py-2 text-foreground">{p}</li>)}</ul>
        <DemoLink to={ROUTES.organizations} className={`${PILL_OUTLINE} mt-6`}>הכשרות וליווי לארגונים</DemoLink>
      </Band>

      <Band tone="canvas" labelledBy="collab-field">
        <h2 id="collab-field" className="sr-only">קהילות ואזורי אסון</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-super bg-card border border-border p-6">
            <p className="font-heading font-semibold text-xl text-foreground mb-3">קהילות שאנחנו עובדים איתן</p>
            <ul className="flex flex-wrap gap-2">{ABOUT.communities.map((c) => <li key={c}><StatusPill tone="primary">{c}</StatusPill></li>)}</ul>
          </div>
          <div className="rounded-super bg-card border border-border p-6">
            <p className="flex items-center gap-2 font-heading font-semibold text-xl text-foreground mb-3"><Globe2 className="w-5 h-5 text-accent" aria-hidden="true" />התערבות באזורי אסון בעולם</p>
            <ul className="flex flex-wrap gap-2">{ABOUT.partnersAbroad.map((c) => <li key={c}><StatusPill tone="muted">{c}</StatusPill></li>)}</ul>
          </div>
        </div>
      </Band>

      <Band tone="muted" labelledBy="collab-contact">
        <div className="rounded-super bg-card border-2 border-primary/25 p-7">
          <h2 id="collab-contact" className="font-heading font-semibold text-2xl text-foreground">רוצים לעבוד יחד?</h2>
          <p className="text-muted-foreground mt-1 mb-4">לגופים ולארגונים שמעוניינים בשיתוף פעולה עם מטיב.</p>
          <ContactChips contact={COLLABORATION_CONTACT} />
          <div className="mt-4 flex flex-wrap gap-3">
            <DemoLink to={ROUTES.research} className={PILL_OUTLINE}>שיתופי פעולה מחקריים</DemoLink>
            <DemoLink to={V3_ROUTES.aboutPartners} className={PILL_OUTLINE}>השותפים שלנו</DemoLink>
          </div>
        </div>
      </Band>
    </div>
  );
}
