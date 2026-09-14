import React, { useState } from 'react';
import { ArrowLeft, Globe2, Mail, UserRound } from 'lucide-react';
import Disclosure from '@/components/patterns/Disclosure';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { ABOUT, FACTS, FUNDERS_AND_COLLABORATORS, ORG, PARTNERS, TEAM, TEAM_GROUPS } from '@/pages/metiv-demos/shared/therapist';
import { cn } from '@/lib/utils';
import PageHeaderV3 from '../components/PageHeaderV3';
import { SUPPORTER_IMG } from '../images';
import { Band, ChipQuestion, JourneySteps, PILL_OUTLINE, SectionHeading, StatusPill, TEXT_LINK } from '../components/kit';

export default function About() {
  const [group, setGroup] = useState('all');
  const groups = group === 'all' ? TEAM_GROUPS : [group];

  return (
    <div className="bg-background">
      <PageHeaderV3
        tone="muted"
        size="editorial"
        eyebrow="אודות"
        title={ABOUT.title}
        subtitle={ORG.vision}
        illustration={SUPPORTER_IMG}
        short={[
          `הוקם ב-${ABOUT.timeline[0].year} בירושלים, ופועל היום מ${ORG.address}.`,
          'טיפול, הכשרות, מחקר ועבודה עם ארגונים וקהילות.',
          'בעמוד: ההיסטוריה, הצוות והשותפים.',
        ]}
      />

      <Band tone="canvas" width="default" labelledBy="about-mission">
        <SectionHeading id="about-mission" eyebrow="המטרה שלנו" title={ORG.headline} />
        <p className="text-xl text-foreground leading-relaxed">{ORG.mission}</p>
        <div className="mt-6 space-y-4 text-lg text-foreground leading-relaxed">
          {ABOUT.activitiesIntro.map((p) => <p key={p}>{p}</p>)}
        </div>
      </Band>

      <Band tone="card" labelledBy="about-facts">
        <h2 id="about-facts" className="sr-only">מטיב במספרים</h2>
        <dl className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          {FACTS.map((f) => (
            <div key={f.label} className="rounded-super bg-muted p-5 text-center">
              <dt className="sr-only">{f.label}</dt>
              <dd>
                <span className="block font-heading font-semibold text-4xl text-accent" dir="ltr">{f.value}</span>
                <span className="block mt-1 text-foreground text-sm leading-snug">{f.label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </Band>

      <Band tone="canvas" labelledBy="about-history">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div>
            <SectionHeading id="about-history" eyebrow="הדרך של מטיב" title="ציוני דרך" className="mb-6" />
            <JourneySteps label="ציוני דרך" steps={ABOUT.timeline.map((t) => ({ title: t.year, text: t.text }))} />
          </div>
          <div>
            <p className="font-heading font-semibold text-2xl text-foreground mb-4">ההיסטוריה</p>
            <div className="space-y-4 text-lg text-foreground leading-relaxed">
              {ABOUT.history.slice(0, 2).map((p) => <p key={p}>{p}</p>)}
            </div>
            <Disclosure label="להמשך ההיסטוריה" variant="soft" size="compact" className="mt-5">
              <div className="space-y-4 text-foreground leading-relaxed">{ABOUT.history.slice(2).map((p) => <p key={p}>{p}</p>)}</div>
            </Disclosure>
          </div>
        </div>
      </Band>

      <Band tone="muted" labelledBy="about-activities">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <SectionHeading id="about-activities" eyebrow="מה אנחנו עושים" title="תחומי הפעילות" className="mb-4" />
            <ul className="space-y-2 text-foreground">
              {ABOUT.activities.map((a) => <li key={a} className="flex gap-2"><span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" aria-hidden="true" />{a}</li>)}
            </ul>
          </div>
          <div className="rounded-super bg-card p-6">
            <p className="font-heading font-semibold text-xl text-foreground mb-3">קהילות שאנחנו עובדים איתן</p>
            <ul className="flex flex-wrap gap-2">{ABOUT.communities.map((c) => <li key={c}><StatusPill tone="primary">{c}</StatusPill></li>)}</ul>
          </div>
          <div className="rounded-super bg-card p-6">
            <p className="flex items-center gap-2 font-heading font-semibold text-xl text-foreground mb-3"><Globe2 className="w-5 h-5 text-accent" aria-hidden="true" />התערבות באזורי אסון</p>
            <ul className="flex flex-wrap gap-2">{ABOUT.partnersAbroad.map((c) => <li key={c}><StatusPill tone="muted">{c}</StatusPill></li>)}</ul>
          </div>
        </div>
      </Band>

      <Band tone="card" id="team" labelledBy="about-team">
        <SectionHeading id="about-team" eyebrow="הצוות" title="מי עובד במטיב" intro={ABOUT.teamIntro} />
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

      <Band tone="canvas" labelledBy="about-partners">
        <SectionHeading id="about-partners" eyebrow="עובדים יחד" title="שותפים, מממנים ושיתופי פעולה" />
        <ul className="grid gap-3 md:grid-cols-2">
          {FUNDERS_AND_COLLABORATORS.map((f) => (
            <li key={f.name} className="rounded-super-sm bg-card border border-border p-4">
              <p className="font-semibold text-foreground">{f.name}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.role}</p>
            </li>
          ))}
        </ul>
        <p className="mt-8 font-heading font-semibold text-foreground mb-3">ארגונים שקיבלו הכשרה או הדרכה</p>
        <ul className="flex flex-wrap gap-2">{PARTNERS.map((p) => <li key={p} className="rounded-full bg-card border border-border px-4 py-2 text-foreground">{p}</li>)}</ul>
        <div className="mt-10 flex flex-wrap gap-3">
          <DemoLink to={ROUTES.contact} className={PILL_OUTLINE}>יצירת קשר <ArrowLeft className="w-4 h-4" aria-hidden="true" /></DemoLink>
          <DemoLink to={ROUTES.donate} className={PILL_OUTLINE}>תמיכה במטיב <ArrowLeft className="w-4 h-4" aria-hidden="true" /></DemoLink>
        </div>
      </Band>
    </div>
  );
}
