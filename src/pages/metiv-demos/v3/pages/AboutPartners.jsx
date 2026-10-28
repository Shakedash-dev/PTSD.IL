import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import PageHeaderV3 from '../components/PageHeaderV3';
import { useCopy, useMetiv } from '../content/MetivContent';
import { V3_ROUTES } from '../meta';
import { AboutTabs, PartnerGroupSection } from '../components/AboutParts';
import { Band, ContactChips, FWD, PILL_OUTLINE, PILL_SOLID } from '../components/kit';

// "Our partners": the bodies connected to Metiv's services, and what each
// connection means for someone who arrives through it.
const BANDS = /** @type {const} */ (['canvas', 'card']);

export default function AboutPartners() {
  const c = useCopy('aboutPartners');
  const { COLLABORATION_CONTACT, PARTNER_GROUPS, ROUTE_META } = useMetiv();
  /** @type {import('../components/AboutParts').PartnerGroup[]} */
  const groups = PARTNER_GROUPS ?? [];
  return (
    <div className="bg-background">
      <PageHeaderV3
        tone="muted"
        eyebrow={ROUTE_META.about?.label}
        title={c.title}
        subtitle={c.subtitle}
        short={[c.short1, c.short2]}
      />
      <AboutTabs />

      {groups.map((g, i) => (
        <Band key={g.key} tone={BANDS[i % 2]} padding="py-12 sm:py-16">
          <PartnerGroupSection group={g} />
        </Band>
      ))}

      <Band tone="muted" labelledBy="partners-join">
        <div className="rounded-super bg-sanctuary text-sanctuary-foreground p-8 sm:p-10">
          <h2 id="partners-join" className="font-heading font-semibold text-2xl sm:text-3xl">{c.joinTitle}</h2>
          <p className="mt-2 text-sanctuary-foreground/85 text-lg max-w-2xl">{c.joinText}</p>
          <div className="mt-5 rounded-super-sm bg-card text-foreground p-5">
            <ContactChips contact={COLLABORATION_CONTACT} />
            <div className="mt-4 flex flex-wrap gap-3">
              <DemoLink to={ROUTES.donate} className={PILL_SOLID}>{c.donate} <ArrowLeft className={`w-4 h-4 ${FWD}`} aria-hidden="true" /></DemoLink>
              <DemoLink to={V3_ROUTES.aboutCollaborations} className={PILL_OUTLINE}>{c.collaborations}</DemoLink>
            </div>
          </div>
        </div>
      </Band>
    </div>
  );
}
