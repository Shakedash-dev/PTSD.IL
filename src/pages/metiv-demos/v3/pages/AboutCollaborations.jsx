import React from 'react';
import { Globe2 } from 'lucide-react';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import PageHeaderV3 from '../components/PageHeaderV3';
import { useCopy, useMetiv } from '../content/MetivContent';
import { V3_ROUTES } from '../meta';
import { AboutTabs, PartnerGroupSection } from '../components/AboutParts';
import { Band, ContactChips, PILL_OUTLINE, SectionHeading, StatusPill } from '../components/kit';

// "Collaborations": professional, academic and field work done with others.
const BANDS = /** @type {const} */ (['canvas', 'card']);

export default function AboutCollaborations() {
  const c = useCopy('aboutCollaborations');
  const { ABOUT, COLLABORATION_CONTACT, COLLABORATION_GROUPS, PARTNERS, ROUTE_META } = useMetiv();
  /** @type {import('../components/AboutParts').PartnerGroup[]} */
  const groups = COLLABORATION_GROUPS ?? [];
  return (
    <div className="bg-background">
      <PageHeaderV3
        tone="muted"
        eyebrow={ROUTE_META.about?.label}
        title={c.title}
        subtitle={c.subtitle}
        short={[]}
      />
      <AboutTabs />

      {groups.map((g, i) => (
        <Band key={g.key} tone={BANDS[i % 2]} padding="py-12 sm:py-16">
          <PartnerGroupSection group={g} />
        </Band>
      ))}

      <Band tone="card" labelledBy="collab-orgs">
        <SectionHeading id="collab-orgs" title={c.orgsTitle} intro={c.orgsIntro} />
        <ul className="flex flex-wrap gap-2">{PARTNERS.map((/** @type {string} */ p, /** @type {number} */ i) => <li key={i} className="rounded-full bg-background border border-border px-4 py-2 text-foreground">{p}</li>)}</ul>
        <DemoLink to={ROUTES.organizations} className={`${PILL_OUTLINE} mt-6`}>{c.orgsLink}</DemoLink>
      </Band>

      <Band tone="canvas" labelledBy="collab-field">
        <h2 id="collab-field" className="sr-only">{c.fieldTitle}</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-super bg-card border border-border p-6">
            <p className="font-heading font-semibold text-xl text-foreground mb-3">{c.communitiesTitle}</p>
            <ul className="flex flex-wrap gap-2">{ABOUT.communities.map((/** @type {string} */ x, /** @type {number} */ i) => <li key={i}><StatusPill tone="primary">{x}</StatusPill></li>)}</ul>
          </div>
          <div className="rounded-super bg-card border border-border p-6">
            <p className="flex items-center gap-2 font-heading font-semibold text-xl text-foreground mb-3"><Globe2 className="w-5 h-5 text-accent" aria-hidden="true" />{c.disasterTitle}</p>
            <ul className="flex flex-wrap gap-2">{ABOUT.partnersAbroad.map((/** @type {string} */ x, /** @type {number} */ i) => <li key={i}><StatusPill tone="muted">{x}</StatusPill></li>)}</ul>
          </div>
        </div>
      </Band>

      <Band tone="muted" labelledBy="collab-contact">
        <div className="rounded-super bg-card border-2 border-primary/25 p-7">
          <h2 id="collab-contact" className="font-heading font-semibold text-2xl text-foreground">{c.contactTitle}</h2>
          <p className="text-muted-foreground mt-1 mb-4">{c.contactText}</p>
          <ContactChips contact={COLLABORATION_CONTACT} />
          <div className="mt-4 flex flex-wrap gap-3">
            <DemoLink to={ROUTES.research} className={PILL_OUTLINE}>{c.researchLink}</DemoLink>
            <DemoLink to={V3_ROUTES.aboutPartners} className={PILL_OUTLINE}>{ROUTE_META.aboutPartners?.label}</DemoLink>
          </div>
        </div>
      </Band>
    </div>
  );
}
