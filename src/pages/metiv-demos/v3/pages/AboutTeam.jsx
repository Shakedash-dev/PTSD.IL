import React, { useState } from 'react';
import { Mail, UserRound } from 'lucide-react';
import Disclosure from '@/components/patterns/Disclosure';
import { ABOUT, TEAM, TEAM_GROUPS } from '@/pages/metiv-demos/shared/therapist';
import { cn } from '@/lib/utils';
import PageHeaderV3 from '../components/PageHeaderV3';
import { AboutTabs } from '../components/AboutParts';
import { Band, ChipQuestion, TEXT_LINK } from '../components/kit';

// "הצוות": the people of Metiv, filtered by department.
export default function AboutTeam() {
  const [group, setGroup] = useState('all');
  const groups = group === 'all' ? TEAM_GROUPS : [group];

  return (
    <div className="bg-background">
      <PageHeaderV3 tone="muted" eyebrow="על מטיב" title="מי עובד במטיב" subtitle={ABOUT.teamIntro} short={[]} />
      <AboutTabs />

      <Band tone="card" labelledBy="team-list">
        <h2 id="team-list" className="sr-only">אנשי הצוות</h2>
        <ChipQuestion
          legend="איזה צוות להציג?"
          value={group}
          onChange={setGroup}
          className="mb-8"
          options={[{ key: 'all', label: 'כל הצוות', count: TEAM.length }, ...TEAM_GROUPS.map((g) => ({ key: g, label: g, count: TEAM.filter((t) => t.group === g).length }))]}
        />
        <div className="space-y-10">
          {groups.map((g) => (
            <section key={g} aria-label={g}>
              <h3 className="font-heading font-semibold text-xl text-foreground mb-4 flex items-center gap-3">
                {g}
                <span aria-hidden="true" className="flex-1 border-t-2 border-dashed border-border" />
              </h3>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {TEAM.filter((t) => t.group === g).map((t) => (
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
                      <Disclosure label="קצת עליי" variant="plain" size="tight" className="mt-3">
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
