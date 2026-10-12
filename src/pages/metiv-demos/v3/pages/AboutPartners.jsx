import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import PageHeaderV3 from '../components/PageHeaderV3';
import { V3_ROUTES } from '../meta';
import { COLLABORATION_CONTACT, PARTNER_GROUPS } from '../data/aboutMetiv';
import { AboutTabs, PartnerGroupSection } from '../components/AboutParts';
import { Band, ContactChips, PILL_OUTLINE, PILL_SOLID } from '../components/kit';

// "השותפים שלנו": the bodies connected to Metiv's services, and what each
// connection means for someone who arrives through it.
const BANDS = /** @type {const} */ (['canvas', 'card']);

export default function AboutPartners() {
  return (
    <div className="bg-background">
      <PageHeaderV3
        tone="muted"
        eyebrow="על מטיב"
        title="השותפים שלנו"
        subtitle="חלק מהשירותים של מטיב ניתנים יחד עם גופים ציבוריים, או במימון של קרנות ותורמים. כאן רואים מי מחובר למה."
        short={[
          'לכל שותף: מה הקשר שלו למטיב, ומה זה אומר למי שמגיע דרכו.',
          'קרן או תורם? בתחתית העמוד יש פרטי קשר לשותפויות.',
        ]}
      />
      <AboutTabs />

      {PARTNER_GROUPS.map((g, i) => (
        <Band key={g.key} tone={BANDS[i % 2]} padding="py-12 sm:py-16">
          <PartnerGroupSection group={g} />
        </Band>
      ))}

      <Band tone="muted" labelledBy="partners-join">
        <div className="rounded-super bg-sanctuary text-sanctuary-foreground p-8 sm:p-10">
          <h2 id="partners-join" className="font-heading font-semibold text-2xl sm:text-3xl">רוצים לתמוך בתוכנית של מטיב?</h2>
          <p className="mt-2 text-sanctuary-foreground/85 text-lg max-w-2xl">לשיחה על שותפות, על תמיכה בתוכנית מסוימת או על תרומה מוסדית.</p>
          <div className="mt-5 rounded-super-sm bg-card text-foreground p-5">
            <ContactChips contact={COLLABORATION_CONTACT} />
            <div className="mt-4 flex flex-wrap gap-3">
              <DemoLink to={ROUTES.donate} className={PILL_SOLID}>תרומה למטיב <ArrowLeft className="w-4 h-4" aria-hidden="true" /></DemoLink>
              <DemoLink to={V3_ROUTES.aboutCollaborations} className={PILL_OUTLINE}>שיתופי פעולה מקצועיים</DemoLink>
            </div>
          </div>
        </div>
      </Band>
    </div>
  );
}
