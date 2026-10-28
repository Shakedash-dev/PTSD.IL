import React from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { cn } from '@/lib/utils';
import { useCopy, useMetiv } from '../content/MetivContent';
import { ALL_ROUTES, resolveRoute } from '../meta';
import { CHIP_LINK, ExternalLink, FOCUS, FWD, NamedIcon, SectionHeading, StatusPill } from './kit';

// Pieces shared by the "על מטיב" pages. The data (DEPARTMENT_GROUPS,
// PARTNER_GROUPS, COLLABORATION_GROUPS, COLLABORATION_CONTACT) comes from useMetiv().

/**
 * @typedef {{ name?: string, role?: string, email?: string, phone?: string }} DeptContact
 * @typedef {{ label: string, to?: string, href?: string }} DeptLink
 * @typedef {{ key: string, title: string, icon: string, forWhom: string, what: string, contact?: DeptContact, note?: string, links: DeptLink[] }} Department
 * @typedef {{ key: string, title: string, intro: string, departments: Department[] }} DepartmentGroup
 * @typedef {{ name: string, role: string, forYou?: string, links?: DeptLink[], placeholder?: boolean }} Partner
 * @typedef {{ key: string, title: string, intro: string, icon: string, partners: Partner[] }} PartnerGroup
 */

const TAB_KEYS = ['about', 'aboutHistory', 'aboutTeam', 'aboutPartners', 'aboutCollaborations'];

/** The sub-pages of "על מטיב", as a row of tabs under the page header. */
export function AboutTabs() {
  const { pathname } = useLocation();
  const { key } = resolveRoute(pathname);
  const c = useCopy('aboutParts');
  const { ROUTE_META } = useMetiv();
  const tabs = TAB_KEYS.map((k) => ({ key: k, label: k === 'about' ? c.servicesTab : ROUTE_META?.[k]?.label }));
  return (
    <div className="bg-card border-b border-border">
      <nav aria-label={ROUTE_META?.about?.label} className="max-w-6xl mx-auto px-5 sm:px-8 py-3 overflow-x-auto">
        <ul className="flex items-center gap-2 w-max">
          {tabs.map((tab) => (
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
 * @param {{ links?: DeptLink[], className?: string }} props
 */
export function LinkChips({ links, className = '' }) {
  if (!links?.length) return null;
  return (
    <ul className={cn('flex flex-wrap gap-2', className)}>
      {links.map((l) => (
        <li key={l.label}>
          {l.to ? (
            <DemoLink to={l.to} className={CHIP_LINK}>{l.label} <ArrowLeft className={cn('w-3.5 h-3.5 text-accent', FWD)} aria-hidden="true" /></DemoLink>
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
 * @param {{ group: PartnerGroup }} props
 */
export function PartnerGroupSection({ group }) {
  const c = useCopy('aboutParts');
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
              {p.placeholder && <StatusPill tone="warning">{c.placeholder}</StatusPill>}
            </div>
            <p className="text-muted-foreground leading-relaxed">{p.role}</p>
            {p.forYou && (
              <p className="rounded-super-sm bg-muted p-4 text-foreground leading-relaxed">
                <span className="block text-xs font-semibold text-accent mb-1">{c.forYou}</span>
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
