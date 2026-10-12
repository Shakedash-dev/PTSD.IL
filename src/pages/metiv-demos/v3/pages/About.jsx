import React from 'react';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { NamedIcon } from '@/pages/metiv-demos/shared/patient/components';
import { ORG } from '@/pages/metiv-demos/shared/therapist';
import PageHeaderV3 from '../components/PageHeaderV3';
import { SUPPORTER_IMG } from '../images';
import { ALL_ROUTES, ROUTE_META } from '../meta';
import { DEPARTMENT_GROUPS } from '../data/aboutMetiv';
import { AboutTabs, LinkChips } from '../components/AboutParts';
import { Band, CHIP_LINK, ContactChips, LinkCard, PILL_OUTLINE, SectionHeading } from '../components/kit';

// "על מטיב": opens with the services and departments the organisation is built
// from (owner feedback: that is what a visitor needs first), and leads to the
// sub-pages: the story, the team, partners and collaborations.

const MORE = [
  { key: 'aboutHistory', icon: 'BookOpen', description: 'איך מטיב התחיל, ציוני דרך, ומה הוא עושה היום.' },
  { key: 'aboutTeam', icon: 'Users', description: 'האנשים שעובדים במטיב, לפי מחלקה.' },
  { key: 'aboutPartners', icon: 'Landmark', description: 'גופים ציבוריים, קרנות ותורמים שמחוברים לשירותים של מטיב.' },
  { key: 'aboutCollaborations', icon: 'Network', description: 'עבודה משותפת עם אקדמיה, ארגונים מקצועיים וקהילות.' },
];

const BANDS = /** @type {const} */ (['canvas', 'card']);

export default function About() {
  return (
    <div className="bg-background">
      <PageHeaderV3
        tone="muted"
        size="editorial"
        eyebrow="על מטיב"
        title="ממה מטיב בנוי, ולמי פונים"
        subtitle={ORG.vision}
        illustration={SUPPORTER_IMG}
        short={[
          'כל מחלקה: למי היא מיועדת, מה היא עושה ואיך פונים.',
          'בלשוניות: הסיפור של מטיב, הצוות, השותפים ושיתופי הפעולה.',
        ]}
      />
      <AboutTabs />

      <Band tone="card" padding="py-6" labelledBy="about-jump">
        <h2 id="about-jump" className="sr-only">קפיצה למחלקה</h2>
        <ul className="flex flex-wrap gap-2">
          {DEPARTMENT_GROUPS.flatMap((g) => g.departments).map((d) => (
            <li key={d.key}><a href={`#dept-${d.key}`} className={CHIP_LINK}>{d.title}</a></li>
          ))}
        </ul>
      </Band>

      {DEPARTMENT_GROUPS.map((g, i) => (
        <Band key={g.key} tone={BANDS[i % 2]} padding="py-12 sm:py-16" labelledBy={`about-${g.key}`}>
          <SectionHeading id={`about-${g.key}`} title={g.title} intro={g.intro} />
          <ul className="grid gap-5 md:grid-cols-2">
            {g.departments.map((d) => (
              <li key={d.key} id={`dept-${d.key}`} className="scroll-mt-36 flex flex-col gap-4 rounded-super bg-background border border-border p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 rounded-2xl bg-primary/10 text-accent flex items-center justify-center flex-shrink-0">
                    <NamedIcon name={d.icon} className="w-6 h-6" />
                  </span>
                  <h3 className="font-heading font-semibold text-xl text-foreground">{d.title}</h3>
                </div>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-xs font-semibold text-accent mb-0.5">למי</dt>
                    <dd className="text-foreground leading-relaxed">{d.forWhom}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-accent mb-0.5">מה</dt>
                    <dd className="text-foreground leading-relaxed">{d.what}</dd>
                  </div>
                </dl>
                {d.note && <p className="rounded-super-sm bg-muted p-3 text-sm text-foreground leading-relaxed">{d.note}</p>}
                <div className="mt-auto space-y-3 border-t border-border pt-4">
                  <p className="text-xs font-semibold text-muted-foreground">איך פונים</p>
                  <ContactChips contact={d.contact} />
                  <LinkChips links={d.links} />
                </div>
              </li>
            ))}
          </ul>
        </Band>
      ))}

      <Band tone="muted" labelledBy="about-more">
        <SectionHeading id="about-more" eyebrow="עוד על מטיב" title="להכיר את הארגון" />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MORE.map((m) => (
            <li key={m.key}>
              <LinkCard to={ALL_ROUTES[m.key]} title={ROUTE_META[m.key].label} description={m.description} icon={<NamedIcon name={m.icon} className="w-6 h-6" />} />
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <p className="text-foreground">לא בטוחים למי לפנות?</p>
          <DemoLink to={ROUTES.contact} className={PILL_OUTLINE}>יצירת קשר עם מטיב</DemoLink>
        </div>
      </Band>
    </div>
  );
}
