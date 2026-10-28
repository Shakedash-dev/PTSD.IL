import React from 'react';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import PageHeaderV3 from '../components/PageHeaderV3';
import { useCopy, useMetiv } from '../content/MetivContent';
import { SUPPORTER_IMG } from '../images';
import { ALL_ROUTES } from '../meta';
import { AboutTabs, LinkChips } from '../components/AboutParts';
import { Band, CHIP_LINK, ContactChips, LinkCard, NamedIcon, PILL_OUTLINE, SectionHeading } from '../components/kit';

// "על מטיב": opens with the services and departments the organisation is built
// from (owner feedback: that is what a visitor needs first), and leads to the
// sub-pages: the story, the team, partners and collaborations.

// Descriptions are copy: `about.more<Key>` (moreAboutHistory, ...).
const MORE = [
  { key: 'aboutHistory', icon: 'BookOpen' },
  { key: 'aboutTeam', icon: 'Users' },
  { key: 'aboutPartners', icon: 'Landmark' },
  { key: 'aboutCollaborations', icon: 'Network' },
];

const BANDS = /** @type {const} */ (['canvas', 'card']);

export default function About() {
  const c = useCopy('about');
  const { DEPARTMENT_GROUPS, ORG, ROUTE_META } = useMetiv();
  /** @type {import('../components/AboutParts').DepartmentGroup[]} */
  const groups = DEPARTMENT_GROUPS ?? [];
  return (
    <div className="bg-background">
      <PageHeaderV3
        tone="muted"
        size="editorial"
        eyebrow={ROUTE_META.about?.label}
        title={c.title}
        subtitle={ORG.vision}
        illustration={SUPPORTER_IMG}
        short={[c.short1, c.short2]}
      />
      <AboutTabs />

      <Band tone="card" padding="py-6" labelledBy="about-jump">
        <h2 id="about-jump" className="sr-only">{c.jump}</h2>
        <ul className="flex flex-wrap gap-2">
          {groups.flatMap((g) => g.departments).map((d) => (
            <li key={d.key}><a href={`#dept-${d.key}`} className={CHIP_LINK}>{d.title}</a></li>
          ))}
        </ul>
      </Band>

      {groups.map((g, i) => (
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
                    <dt className="text-xs font-semibold text-accent mb-0.5">{c.forWhom}</dt>
                    <dd className="text-foreground leading-relaxed">{d.forWhom}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-accent mb-0.5">{c.what}</dt>
                    <dd className="text-foreground leading-relaxed">{d.what}</dd>
                  </div>
                </dl>
                {d.note && <p className="rounded-super-sm bg-muted p-3 text-sm text-foreground leading-relaxed">{d.note}</p>}
                <div className="mt-auto space-y-3 border-t border-border pt-4">
                  <p className="text-xs font-semibold text-muted-foreground">{c.howToContact}</p>
                  <ContactChips contact={d.contact} />
                  <LinkChips links={d.links} />
                </div>
              </li>
            ))}
          </ul>
        </Band>
      ))}

      <Band tone="muted" labelledBy="about-more">
        <SectionHeading id="about-more" eyebrow={c.moreEyebrow} title={c.moreTitle} />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MORE.map((m) => (
            <li key={m.key}>
              <LinkCard to={ALL_ROUTES[m.key]} title={ROUTE_META[m.key]?.label} description={c[`more${m.key[0].toUpperCase()}${m.key.slice(1)}`]} icon={<NamedIcon name={m.icon} className="w-6 h-6" />} />
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <p className="text-foreground">{c.notSure}</p>
          <DemoLink to={ROUTES.contact} className={PILL_OUTLINE}>{c.contact}</DemoLink>
        </div>
      </Band>
    </div>
  );
}
