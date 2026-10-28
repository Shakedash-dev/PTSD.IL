import React, { useState } from 'react';
import { Mail, UserRound } from 'lucide-react';
import Disclosure from '@/components/patterns/Disclosure';
import { cn } from '@/lib/utils';
import PageHeaderV3 from '../components/PageHeaderV3';
import { useCopy, useMetiv } from '../content/MetivContent';
import { AboutTabs } from '../components/AboutParts';
import { Band, ChipQuestion, TEXT_LINK } from '../components/kit';

// "The team": the people of Metiv, filtered by department. Groups are matched on
// the Hebrew data (TEAM_GROUPS by position, TEAM by `_key`), so the filter holds
// in every language even if a translation words a group differently.
export default function AboutTeam() {
  const c = useCopy('aboutTeam');
  const { ABOUT, TEAM, TEAM_GROUPS, ROUTE_META, he } = useMetiv();
  /** @type {Map<string, string>} */
  const heGroupOf = new Map((he?.TEAM ?? []).map((/** @type {any} */ t) => [t._key, t.group]));
  /** @type {{ key: string, label: string }[]} */
  const allGroups = (TEAM_GROUPS ?? []).map((/** @type {string} */ label, /** @type {number} */ i) => ({ key: he?.TEAM_GROUPS?.[i] ?? label, label }));
  /** @param {string} key */
  const membersOf = (key) => (TEAM ?? []).filter((/** @type {any} */ t) => (heGroupOf.get(t._key) ?? t.group) === key);
  const [group, setGroup] = useState('all');
  const groups = group === 'all' ? allGroups : allGroups.filter((g) => g.key === group);

  return (
    <div className="bg-background">
      <PageHeaderV3 tone="muted" eyebrow={ROUTE_META.about?.label} title={c.title} subtitle={ABOUT.teamIntro} short={[]} />
      <AboutTabs />

      <Band tone="card" labelledBy="team-list">
        <h2 id="team-list" className="sr-only">{c.listTitle}</h2>
        <ChipQuestion
          legend={c.filterLegend}
          value={group}
          onChange={setGroup}
          className="mb-8"
          options={[{ key: 'all', label: c.filterAll, count: TEAM.length }, ...allGroups.map((g) => ({ key: g.key, label: g.label, count: membersOf(g.key).length }))]}
        />
        <div className="space-y-10">
          {groups.map((g) => (
            <section key={g.key} aria-label={g.label}>
              <h3 className="font-heading font-semibold text-xl text-foreground mb-4 flex items-center gap-3">
                {g.label}
                <span aria-hidden="true" className="flex-1 border-t-2 border-dashed border-border" />
              </h3>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {membersOf(g.key).map((/** @type {any} */ t) => (
                  <li key={t.name} className="rounded-super-sm bg-background border border-border p-4">
                    <div className="flex items-start gap-3">
                      <span className="w-10 h-10 rounded-full bg-primary/10 text-accent flex items-center justify-center flex-shrink-0"><UserRound className="w-5 h-5" aria-hidden="true" /></span>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{t.name}</p>
                        <p className="text-sm text-muted-foreground leading-snug">{t.role}</p>
                        {t.email && (
                          <a href={`mailto:${t.email}`} className={cn('mt-1 inline-flex items-center gap-1 text-sm', TEXT_LINK)}>
                            <Mail className="w-3.5 h-3.5" aria-hidden="true" /><span dir="ltr">{t.email}</span>
                          </a>
                        )}
                      </div>
                    </div>
                    {t.bio && (
                      <Disclosure label={c.bio} variant="plain" size="tight" className="mt-3">
                        <p className="text-sm text-foreground leading-relaxed">{t.bio}</p>
                      </Disclosure>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Band>
    </div>
  );
}
