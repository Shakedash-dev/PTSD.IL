import React, { useState } from 'react';
import { Check } from 'lucide-react';
import ChoiceChip from '@/components/patterns/ChoiceChip';
import Disclosure from '@/components/patterns/Disclosure';
import { IMAGES } from '@/lib/images';
import { DemoMarkdown } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { ACTIVE_STUDIES, RESEARCH_INTRO } from '@/pages/metiv-demos/shared/therapist';
import { PageHeaderV1 } from '../components/Chrome';
import {
  ArrowLink,
  Chapter,
  ChapterHead,
  ContactLines,
  PillLink,
  StatusPill,
  useV1Title,
} from '../components/primitives';
import { pad } from '../lib';

const FILTERS = [
  { key: 'all', label: 'כל המחקרים' },
  { key: 'recruiting', label: 'מגייסים משתתפים' },
  { key: 'active', label: 'פעילים, ללא גיוס' },
];

/** @param {any} study */
const studyStatus = (study) =>
  study.recruiting ? { key: 'open', label: 'מגייס משתתפים' } : { key: 'soon', label: study.status };

/** @param {{ study: any }} props */
function StudyRow({ study }) {
  const hasMore = study.description || study.eligibility?.length || study.team?.length || study.links?.length || study.contact;
  return (
    <article id={study.slug} className="grid scroll-mt-40 gap-5 border-b border-border py-9 md:grid-cols-12 md:gap-10">
      <div className="md:col-span-3">
        <StatusPill status={studyStatus(study)} />
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{study.population}</p>
      </div>
      <div className="min-w-0 md:col-span-9">
        <h3 className="font-heading text-2xl font-light leading-snug text-foreground md:text-3xl">{study.title}</h3>
        <p className="mt-3 max-w-3xl text-lg leading-relaxed text-muted-foreground">{study.summary}</p>
        {hasMore && (
          <Disclosure label="פרטי המחקר" variant="soft" size="compact" className="mt-6 max-w-3xl">
            <div className="space-y-6">
              {study.description && <DemoMarkdown className="rich-content leading-relaxed text-foreground">{study.description}</DemoMarkdown>}
              {study.eligibility?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground">מי יכול להשתתף</p>
                  <ul className="mt-2 space-y-2">
                    {study.eligibility.map((e) => (
                      <li key={e} className="flex gap-2 text-foreground"><Check className="mt-1 h-4 w-4 shrink-0 text-success" aria-hidden="true" />{e}</li>
                    ))}
                  </ul>
                </div>
              )}
              {study.team?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground">צוות המחקר</p>
                  <p className="mt-2 text-foreground">{study.team.join(' · ')}</p>
                </div>
              )}
              {study.links?.length > 0 && (
                <ul className="flex flex-wrap gap-x-6 gap-y-2">
                  {study.links.map((l) => (
                    <li key={l.url}><ArrowLink to={l.url} className="text-sm">{l.label}</ArrowLink></li>
                  ))}
                </ul>
              )}
              {study.contact && (
                <div className="border-t border-border pt-4">
                  <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground">פנייה</p>
                  <ContactLines contact={study.contact} />
                </div>
              )}
            </div>
          </Disclosure>
        )}
      </div>
    </article>
  );
}

export default function Research() {
  useV1Title('מחקר');
  const [filter, setFilter] = useState('all');
  const recruiting = ACTIVE_STUDIES.filter((s) => s.recruiting);
  const studies = ACTIVE_STUDIES.filter((s) => filter === 'all' || (filter === 'recruiting' ? s.recruiting : !s.recruiting))
    .sort((a, b) => Number(b.recruiting) - Number(a.recruiting));
  /** @param {string} key */
  const count = (key) => (key === 'all' ? ACTIVE_STUDIES.length : key === 'recruiting' ? recruiting.length : ACTIVE_STUDIES.length - recruiting.length);
  const intro = RESEARCH_INTRO;

  return (
    <>
      <PageHeaderV1
        size="editorial"
        align="start"
        tone="canvas"
        eyebrow="לאנשי טיפול ומקצוע · מחקר"
        title={intro.title}
        subtitle={intro.paragraphs[0]}
        image={IMAGES.rights_hero}
      />

      <Chapter rule={false}>
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            {intro.paragraphs.slice(1).map((p) => (
              <p key={p} className="font-heading text-2xl font-light leading-[1.5] text-foreground md:text-3xl">{p}</p>
            ))}
            <dl className="mt-10 grid gap-8 sm:grid-cols-2">
              <div className="border-t border-border pt-4">
                <dt className="text-xs font-semibold tracking-wide text-muted-foreground">מוקד</dt>
                <dd className="mt-2 text-lg leading-relaxed text-foreground">{intro.focus}</dd>
              </div>
              <div className="border-t border-border pt-4">
                <dt className="text-xs font-semibold tracking-wide text-muted-foreground">תפקיד</dt>
                <dd className="mt-2 text-lg leading-relaxed text-foreground">{intro.role}</dd>
              </div>
            </dl>
          </div>
          <aside className="lg:col-span-4 lg:col-start-9">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground">עקרונות העבודה</p>
            <ol className="mt-3 divide-y divide-border border-y border-border">
              {intro.principles.map((p, i) => (
                <li key={p} className="flex items-baseline gap-4 py-3">
                  <span className="font-heading text-xl font-light tabular-nums text-secondary">{pad(i + 1)}</span>
                  <span className="text-foreground">{p}</span>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </Chapter>

      <Chapter id="studies">
        <ChapterHead
          number="01"
          label="מחקרים פעילים"
          title="המחקרים שמתנהלים עכשיו"
          lead={`${recruiting.length} מתוך ${ACTIVE_STUDIES.length} המחקרים מגייסים כעת משתתפים. הפרטים והתנאים לכל מחקר מופיעים בעמוד שלו.`}
        />
        <div role="group" aria-label="סינון מחקרים" className="mb-6 flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <ChoiceChip key={f.key} size="sm" selected={filter === f.key} onClick={() => setFilter(f.key)}>
              {f.label}
              <span className="tabular-nums opacity-75">{count(f.key)}</span>
            </ChoiceChip>
          ))}
        </div>
        <div className="border-t border-border">
          {studies.map((s) => (
            <StudyRow key={s.slug} study={s} />
          ))}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          מחפשים טיפול במסגרת מחקר?{' '}
          <ArrowLink to={ROUTES.freeTreatment} className="text-sm">טיפולים ללא עלות ומחקרים באזור למתמודדים</ArrowLink>
        </p>
      </Chapter>

      <Chapter>
        <ChapterHead number="02" label="מחקרי עבר" title="תחומים שנחקרו" />
        <ul className="grid border-t border-border md:grid-cols-2 md:gap-x-12">
          {intro.pastResearchAreas.map((a) => (
            <li key={a} className="border-b border-border py-5 font-heading text-xl font-light leading-snug text-foreground md:text-2xl">{a}</li>
          ))}
        </ul>
        <ArrowLink to={ROUTES.publications} className="mt-8">לרשימת הפרסומים</ArrowLink>
      </Chapter>

      <Chapter>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col rounded-super bg-muted p-8 md:p-12">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground">קהילה לומדת</p>
            <h2 className="mt-3 font-heading text-4xl font-light text-foreground md:text-5xl">{intro.journalClub.title}</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{intro.journalClub.description}</p>
            <div className="mt-8 md:mt-auto md:pt-8">
              <PillLink to={intro.journalClub.url} size="md">לפלייליסט ביוטיוב</PillLink>
            </div>
          </div>
          <div className="flex flex-col rounded-super border border-border bg-card p-8 md:p-12">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground">שיתופי פעולה</p>
            <h2 className="mt-3 font-heading text-4xl font-light text-foreground md:text-5xl">לחוקרים ולשותפים</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">לשיתופי פעולה מחקריים ולשאלות על השתתפות במחקר.</p>
            <ContactLines contact={intro.collaborationContact} className="mt-6 text-base" />
            <p className="mt-6 text-sm text-muted-foreground">{intro.booksOrderingNote}</p>
          </div>
        </div>
      </Chapter>
    </>
  );
}
