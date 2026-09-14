import React, { useState } from 'react';
import ChoiceChip from '@/components/patterns/ChoiceChip';
import Disclosure from '@/components/patterns/Disclosure';
import { cn } from '@/lib/utils';
import { IMAGES } from '@/lib/images';
import {
  ABOUT,
  FACTS,
  FUNDERS_AND_COLLABORATORS,
  ORG,
  PARTNERS,
  TEAM,
  TEAM_GROUPS,
} from '@/pages/metiv-demos/shared/therapist';
import { PageHeaderV1 } from '../components/Chrome';
import { DoorsCompact } from '../components/Doors';
import {
  Chapter,
  ChapterBreak,
  ChapterHead,
  CONTAINER,
  Initials,
  PullQuote,
  READING,
  useV1Title,
} from '../components/primitives';
import { pad } from '../lib';

export default function About() {
  useV1Title('אודות');
  const [group, setGroup] = useState('all');
  const team = TEAM.filter((m) => group === 'all' || m.group === group);

  return (
    <>
      <PageHeaderV1
        size="hero"
        align="start"
        tone="canvas"
        eyebrow="אודות"
        title={ABOUT.title}
        subtitle={ORG.mission}
        image={IMAGES.ptsdinfo_hero}
      />

      <Chapter rule={false}>
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-3">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground">החזון</p>
          </div>
          <p className="font-heading text-3xl font-light leading-[1.35] text-foreground md:col-span-9 md:text-5xl">{ORG.vision}</p>
        </div>
        <dl className="mt-16 grid grid-cols-2 border-t border-border md:grid-cols-5">
          {FACTS.map((f) => (
            <div key={f.label} className="flex flex-col-reverse border-b border-border py-6 pe-4 md:border-b-0">
              <dt className="mt-2 text-sm leading-snug text-muted-foreground">{f.label}</dt>
              <dd className="font-heading text-4xl font-light tabular-nums text-foreground md:text-5xl">
                <bdi>{f.value}</bdi>
              </dd>
            </div>
          ))}
        </dl>
      </Chapter>

      <Chapter>
        <ChapterHead number="01" label="היסטוריה" title="מאז 1989" />
        <div className={cn(READING, 'space-y-6 md:me-0 md:ms-[25%]')}>
          {ABOUT.history.slice(0, 2).map((p, i) => (
            <p key={i} className={cn('leading-[1.9] text-foreground', i === 0 ? 'font-heading text-2xl font-light leading-[1.55]' : 'text-lg')}>{p}</p>
          ))}
        </div>
        <ChapterBreak className="py-10 md:py-14" />
        <PullQuote cite="התגובה שקיבל ד&quot;ר דני ברום מעמיתים כשהחל לעבוד בישראל">&quot;אבל אנחנו לא רואים כאן טראומה.&quot;</PullQuote>
        <ChapterBreak className="py-10 md:py-14" />
        <div className={cn(READING, 'space-y-6 md:me-0 md:ms-[25%]')}>
          {ABOUT.history.slice(2).map((p, i) => (
            <p key={i} className="text-lg leading-[1.9] text-foreground">{p}</p>
          ))}
        </div>
      </Chapter>

      <Chapter>
        <ChapterHead number="02" label="ציר זמן" title="נקודות דרך" />
        <ol className="border-t border-border">
          {ABOUT.timeline.map((t) => (
            <li key={t.year + t.text} className="grid gap-2 border-b border-border py-6 md:grid-cols-12 md:gap-10 md:py-8">
              <span className="font-heading text-4xl font-light tabular-nums text-secondary md:col-span-3 md:text-5xl">{t.year}</span>
              <span className="text-lg leading-relaxed text-foreground md:col-span-9 md:pt-2 md:text-xl">{t.text}</span>
            </li>
          ))}
        </ol>
      </Chapter>

      <Chapter>
        <ChapterHead number="03" label="פעילות" title="מה מטיב עושה" lead={ABOUT.activitiesIntro[1]} />
        <div className="grid gap-12 lg:grid-cols-12">
          <ol className="border-t border-border lg:col-span-7">
            {ABOUT.activities.map((a, i) => (
              <li key={a} className="flex items-baseline gap-5 border-b border-border py-5">
                <span className="font-heading text-2xl font-light tabular-nums text-secondary">{pad(i + 1)}</span>
                <span className="text-lg text-foreground md:text-xl">{a}</span>
              </li>
            ))}
          </ol>
          <div className="space-y-10 lg:col-span-4 lg:col-start-9">
            <div>
              <p className="text-xs font-semibold tracking-wide text-muted-foreground">קהילות</p>
              <ul className="mt-3 space-y-2 text-foreground">
                {ABOUT.communities.map((c) => <li key={c}>{c}</li>)}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide text-muted-foreground">התערבות באזורי אסון בעולם</p>
              <p className="mt-3 leading-relaxed text-foreground">{ABOUT.partnersAbroad.join(' · ')}</p>
            </div>
          </div>
        </div>
      </Chapter>

      <Chapter id="team">
        <ChapterHead number="04" label="צוות" title="האנשים של מטיב" lead={ABOUT.teamIntro} />
        <div role="group" aria-label="סינון הצוות לפי תחום" className="mb-8 flex flex-wrap gap-1.5">
          {['all', ...TEAM_GROUPS].map((g) => (
            <ChoiceChip key={g} size="sm" selected={group === g} onClick={() => setGroup(g)}>
              {g === 'all' ? 'כל הצוות' : g}
              <span className="tabular-nums opacity-75">{g === 'all' ? TEAM.length : TEAM.filter((m) => m.group === g).length}</span>
            </ChoiceChip>
          ))}
        </div>
        <ul className="grid border-t border-border sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-3">
          {team.map((m) => (
            <li key={m.name} className="border-b border-border py-6">
              <div className="flex gap-4">
                <Initials name={m.name} />
                <div className="min-w-0">
                  <p className="font-heading text-xl text-foreground">{m.name}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{m.role}</p>
                  {m.email && <a href={`mailto:${m.email}`} dir="ltr" className="mt-1 inline-block text-sm text-primary underline-offset-4 hover:underline">{m.email}</a>}
                </div>
              </div>
              {m.bio && (
                <Disclosure label="קצת עליי" variant="plain" size="tight" className="mt-4" labelClassName="text-sm">
                  <p className="text-sm leading-relaxed text-card-foreground">{m.bio}</p>
                </Disclosure>
              )}
            </li>
          ))}
        </ul>
      </Chapter>

      <Chapter>
        <ChapterHead number="05" label="שותפים" title="שותפים ושיתופי פעולה" />
        <ul className="border-t border-border">
          {FUNDERS_AND_COLLABORATORS.map((f) => (
            <li key={f.name} className="grid gap-1 border-b border-border py-5 md:grid-cols-12 md:gap-10">
              <span className="font-heading text-xl text-foreground md:col-span-4">{f.name}</span>
              <span className="leading-relaxed text-muted-foreground md:col-span-8">{f.role}</span>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-xs font-semibold tracking-wide text-muted-foreground">ארגונים שהוכשרו או קיבלו הדרכה</p>
        <p className="mt-3 font-heading text-2xl font-light leading-relaxed text-foreground">{PARTNERS.join(' · ')}</p>
      </Chapter>

      <div className={cn(CONTAINER)}>
        <p className="border-t border-border pt-6 text-sm text-muted-foreground">{ORG.legalName} · {ORG.legalEntity}</p>
      </div>
      <DoorsCompact />
    </>
  );
}
