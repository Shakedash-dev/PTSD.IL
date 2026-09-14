import React, { useState } from 'react';
import { Mail, CheckCircle2, ExternalLink, Globe2, MapPinned } from 'lucide-react';
import ChoiceChip from '@/components/patterns/ChoiceChip';
import { useDemoChrome } from '@/pages/metiv-demos/shared/DemoChrome';
import { IMAGES } from '@/lib/images';
import { ORG, ABOUT, TEAM, TEAM_GROUPS, FUNDERS_AND_COLLABORATORS, METIV_SERVICES } from '@/pages/metiv-demos/shared/therapist';
import { cn } from '@/lib/utils';
import { FOCUS_LIGHT } from '../lib';
import { AreaDisclosure, Avatar, CardLink, Container, IconBadge, Panel, SectionTitle, Tag, chipClass } from '../components/ui';
import { FactsBand, RepeatDoors } from './Landing';

export default function About() {
  const { PageHeader } = useDemoChrome();
  const [group, setGroup] = useState('all');
  const team = TEAM.filter((t) => group === 'all' || t.group === group);

  return (
    <div className="bg-background">
      <PageHeader size="editorial" tone="card" eyebrow="אודות" title={ORG.name} subtitle={ORG.intro} image={IMAGES.community_hero} />

      <Container className="py-12 sm:py-16">
        <div className="grid gap-4 md:grid-cols-2">
          <Panel className="p-6 sm:p-8 border-s-8 border-s-primary">
            <h2 className="font-heading font-semibold text-2xl text-foreground mb-2">החזון</h2>
            <p className="text-lg text-card-foreground leading-relaxed">{ORG.vision}</p>
          </Panel>
          <Panel className="p-6 sm:p-8 border-s-8 border-s-secondary">
            <h2 className="font-heading font-semibold text-2xl text-foreground mb-2">המטרה</h2>
            <p className="text-card-foreground leading-relaxed">{ORG.mission}</p>
          </Panel>
        </div>
      </Container>

      <FactsBand />

      <Container className="py-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] items-start">
        <section aria-labelledby="history">
          <SectionTitle id="history" eyebrow="היסטוריה" title="מאז 1989" />
          <div className="space-y-4 text-foreground leading-relaxed">
            {ABOUT.history.slice(0, 3).map((p) => (
              <p key={p.slice(0, 30)}>{p}</p>
            ))}
          </div>
          <AreaDisclosure label="להמשך הקריאה: עבודה בארץ ובעולם" className="mt-6">
            <div className="space-y-4 text-foreground leading-relaxed">
              {ABOUT.history.slice(3).map((p) => (
                <p key={p.slice(0, 30)}>{p}</p>
              ))}
            </div>
          </AreaDisclosure>
          <div className="mt-10 space-y-3">
            <h3 className="font-heading font-semibold text-xl text-foreground">{ABOUT.activitiesIntro ? 'על הפעילות' : ''}</h3>
            {ABOUT.activitiesIntro?.map((p) => (
              <p key={p.slice(0, 30)} className="text-card-foreground leading-relaxed">
                {p}
              </p>
            ))}
          </div>
        </section>
        <aside aria-labelledby="timeline" className="lg:sticky lg:top-28">
          <Panel className="p-6">
            <h2 id="timeline" className="font-heading font-semibold text-xl text-foreground mb-4">
              ציר זמן
            </h2>
            <ol className="relative border-s-2 border-primary/30 ms-2 space-y-5">
              {ABOUT.timeline.map((t, i) => (
                <li key={`${t.year}-${i}`} className="ps-5 relative">
                  <span className="absolute -start-[0.45rem] top-1.5 w-3 h-3 rounded-full bg-primary" aria-hidden="true" />
                  <p className="font-heading font-semibold text-foreground">{t.year}</p>
                  <p className="text-sm text-card-foreground leading-relaxed">{t.text}</p>
                </li>
              ))}
            </ol>
          </Panel>
        </aside>
      </Container>

      <section className="bg-muted py-16">
        <Container className="grid gap-6 lg:grid-cols-3">
          <Panel className="lg:col-span-1">
            <h2 className="font-heading font-semibold text-xl text-foreground mb-4">תחומי הפעילות</h2>
            <ul className="space-y-2.5">
              {ABOUT.activities.map((a) => (
                <li key={a} className="flex gap-2.5 text-foreground">
                  <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
                  {a}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel>
            <h2 className="font-heading font-semibold text-xl text-foreground mb-4 inline-flex items-center gap-2">
              <MapPinned className="w-5 h-5 text-accent" aria-hidden="true" />
              קהילות בישראל
            </h2>
            <ul className="flex flex-wrap gap-2">
              {ABOUT.communities.map((c) => (
                <li key={c}>
                  <Tag className="text-sm px-3 py-1">{c}</Tag>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel>
            <h2 className="font-heading font-semibold text-xl text-foreground mb-4 inline-flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-accent" aria-hidden="true" />
              התערבות באזורי אסון בעולם
            </h2>
            <ul className="flex flex-wrap gap-2">
              {ABOUT.partnersAbroad.map((c) => (
                <li key={c}>
                  <Tag className="text-sm px-3 py-1">{c}</Tag>
                </li>
              ))}
            </ul>
          </Panel>
        </Container>
      </section>

      <Container className="py-16">
        <SectionTitle eyebrow="שירותים" title="המרפאות והתכניות של מטיב" />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {METIV_SERVICES.map((s) => (
            <li key={s.slug}>
              <CardLink to={s.href} className="flex-col gap-2 h-full">
                <IconBadge name={s.icon} />
                <span className="font-heading font-semibold text-foreground">{s.title}</span>
                <span className="text-sm text-card-foreground leading-relaxed">{s.summary}</span>
              </CardLink>
            </li>
          ))}
        </ul>
      </Container>

      <section className="py-16 border-t border-border" aria-labelledby="team">
        <Container>
          <SectionTitle
            id="team"
            eyebrow="הצוות"
            title="האנשים של מטיב"
            description={ABOUT.teamIntro}
            action={
              <div role="group" aria-label="סינון לפי תחום" className="flex flex-wrap gap-2">
                {['all', ...TEAM_GROUPS].map((g) => (
                  <ChoiceChip key={g} selected={group === g} onClick={() => setGroup(g)} className={chipClass(group === g, false)}>
                    {g === 'all' ? `כולם (${TEAM.length})` : g}
                  </ChoiceChip>
                ))}
              </div>
            }
          />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
            {team.map((m) => (
              <li key={m.name}>
                <Panel className="h-full flex flex-col gap-3">
                  <div className="flex gap-3 items-start">
                    <Avatar name={m.name} />
                    <div className="min-w-0">
                      <p className="font-heading font-semibold text-foreground">{m.name}</p>
                      <p className="text-sm text-card-foreground leading-snug">{m.role}</p>
                      <Tag className="mt-2">{m.group}</Tag>
                    </div>
                  </div>
                  {m.bio && (
                    <AreaDisclosure label="קצת רקע" size="tight">
                      <p className="text-sm text-card-foreground leading-relaxed">{m.bio}</p>
                    </AreaDisclosure>
                  )}
                  {m.email && (
                    <a href={`mailto:${m.email}`} className={cn('mt-auto inline-flex items-center gap-1.5 text-sm text-accent font-semibold hover:underline underline-offset-4 rounded w-fit', FOCUS_LIGHT)}>
                      <Mail className="w-4 h-4" aria-hidden="true" />
                      <span dir="ltr">{m.email}</span>
                    </a>
                  )}
                </Panel>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="bg-muted py-16" aria-labelledby="collab">
        <Container>
          <SectionTitle id="collab" eyebrow="שותפים" title="מממנים ושיתופי פעולה" description="כפי שהם מוזכרים בטקסטים של מטיב." />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FUNDERS_AND_COLLABORATORS.map((f) => (
              <li key={f.name} className="rounded-2xl bg-card border border-border p-4">
                <p className="font-semibold text-foreground">{f.name}</p>
                <p className="text-sm text-card-foreground mt-1 leading-relaxed">{f.role}</p>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted-foreground">
            המידע בעמוד מבוסס על{' '}
            <a href={ABOUT.sourceUrl} target="_blank" rel="noopener noreferrer" className={cn('underline underline-offset-4 font-semibold text-foreground inline-flex items-center gap-1 rounded', FOCUS_LIGHT)}>
              עמוד האודות באתר מטיב
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </p>
        </Container>
      </section>

      <RepeatDoors />
    </div>
  );
}
