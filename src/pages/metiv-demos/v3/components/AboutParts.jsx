import React from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { NamedIcon } from '@/pages/metiv-demos/shared/patient/components';
import { cn } from '@/lib/utils';
import { ALL_ROUTES, ROUTE_META, resolveRoute } from '../meta';
import { CHIP_LINK, ExternalLink, FOCUS, SectionHeading, StatusPill } from './kit';

// Pieces shared by the "על מטיב" pages.

const ABOUT_TABS = [
  { key: 'about', label: 'שירותים ומחלקות' },
  { key: 'aboutHistory', label: ROUTE_META.aboutHistory.label },
  { key: 'aboutTeam', label: ROUTE_META.aboutTeam.label },
  { key: 'aboutPartners', label: ROUTE_META.aboutPartners.label },
  { key: 'aboutCollaborations', label: ROUTE_META.aboutCollaborations.label },
];

/** The sub-pages of "על מטיב", as a row of tabs under the page header. */
export function AboutTabs() {
  const { pathname } = useLocation();
  const { key } = resolveRoute(pathname);
  return (
    <div className="bg-card border-b border-border">
      <nav aria-label="על מטיב" className="max-w-6xl mx-auto px-5 sm:px-8 py-3 overflow-x-auto">
        <ul className="flex items-center gap-2 w-max">
          {ABOUT_TABS.map((tab) => (
            <li key={tab.key}>
              <DemoLink
                to={ALL_ROUTES[tab.key]}
                aria-current={tab.key === key ? 'page' : undefined}
                className={cn(
                  'block rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-natural',
                  FOCUS,
                  tab.key === key ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-border hover:border-primary hover:bg-muted'
                )}
              >
                {tab.label}
              </DemoLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

/**
 * Links of a department or partner: internal ones stay in the version, external ones open a new tab.
 * @param {{ links?: import('../data/aboutMetiv').DeptLink[], className?: string }} props
 */
export function LinkChips({ links, className = '' }) {
  if (!links?.length) return null;
  return (
    <ul className={cn('flex flex-wrap gap-2', className)}>
      {links.map((l) => (
        <li key={l.label}>
          {l.to ? (
            <DemoLink to={l.to} className={CHIP_LINK}>{l.label} <ArrowLeft className="w-3.5 h-3.5 text-accent" aria-hidden="true" /></DemoLink>
          ) : (
            <ExternalLink href={l.href || ''} className={CHIP_LINK}>{l.label}</ExternalLink>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * A titled group of partners or collaborators, one card each.
 * @param {{ group: import('../data/aboutMetiv').PartnerGroup }} props
 */
export function PartnerGroupSection({ group }) {
  const headingId = `group-${group.key}`;
  return (
    <section aria-labelledby={headingId}>
      <div className="flex items-start gap-3 mb-6">
        <span className="w-12 h-12 rounded-2xl bg-primary/10 text-accent flex items-center justify-center flex-shrink-0">
          <NamedIcon name={group.icon} className="w-6 h-6" />
        </span>
        <SectionHeading id={headingId} as="h2" title={group.title} intro={group.intro} className="mb-0" />
      </div>
      <ul className="grid gap-4 md:grid-cols-2">
        {group.partners.map((p) => (
          <li key={p.name} className={cn('flex flex-col gap-3 rounded-super bg-card border p-5 sm:p-6', p.placeholder ? 'border-dashed border-border' : 'border-border shadow-card')}>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-heading font-semibold text-lg text-foreground">{p.name}</h3>
              {p.placeholder && <StatusPill tone="warning">להשלמה</StatusPill>}
            </div>
            <p className="text-muted-foreground leading-relaxed">{p.role}</p>
            {p.forYou && (
              <p className="rounded-super-sm bg-muted p-4 text-foreground leading-relaxed">
                <span className="block text-xs font-semibold text-accent mb-1">מה זה אומר בפועל</span>
                {p.forYou}
              </p>
            )}
            <LinkChips links={p.links} className="mt-auto" />
          </li>
        ))}
      </ul>
    </section>
  );
}
