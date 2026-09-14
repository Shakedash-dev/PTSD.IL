import React, { useState } from 'react';
import ChoiceChip from '@/components/patterns/ChoiceChip';
import { cn } from '@/lib/utils';
import { FIRST_CIRCLE_ILLUSTRATIONS } from '@/lib/images';
import { CHILDREN_FAMILY_INTRO, COURSES } from '@/pages/metiv-demos/shared/therapist';
import { PageHeaderV1 } from '../components/Chrome';
import { CourseRow } from '../components/Rows';
import {
  ArrowLink,
  Chapter,
  ChapterHead,
  ContactLines,
  EmptyState,
  useV1Title,
} from '../components/primitives';
import { pad } from '../lib';

const AGE_FILTERS = [
  { key: 'all', label: 'כל המודלים' },
  { key: 'toddlers', label: 'גיל הרך והורים' },
  { key: 'kids', label: 'ילדים בגיל בית ספר' },
  { key: 'parents', label: 'הורים ומשפחות' },
];

/** @type {Record<string, string>} */
const AGE_GROUP = {
  panda: 'kids',
  'panda-parents': 'parents',
  'panda-family': 'parents',
  'panda-two': 'toddlers',
  namal: 'toddlers',
};

export default function ChildrenFamily() {
  useV1Title('ילדים ומשפחה');
  const intro = CHILDREN_FAMILY_INTRO;
  const [age, setAge] = useState('all');
  const models = intro.models.map((m, i) => ({ ...m, index: i })).filter((m) => age === 'all' || AGE_GROUP[m.key] === age);
  const trainings = COURSES.filter((c) => c.category === 'children-family');

  return (
    <>
      <PageHeaderV1
        size="editorial"
        align="start"
        tone="canvas"
        eyebrow="לאנשי טיפול ומקצוע"
        title="ילדים ומשפחה"
        subtitle={intro.title}
        image={FIRST_CIRCLE_ILLUSTRATIONS.children_content}
      />

      <Chapter rule={false}>
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            {intro.paragraphs.map((p, i) => (
              <p key={i} className={cn('leading-[1.85] text-foreground', i === 0 ? 'font-heading text-2xl font-light leading-[1.5] md:text-3xl' : 'text-lg')}>
                {p}
              </p>
            ))}
          </div>
          <aside className="lg:col-span-4 lg:col-start-9">
            <div className="rounded-super border border-border bg-card p-6 md:p-8">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground">הכשרות שמתקיימות מפעם לפעם</p>
              <ol className="mt-4 divide-y divide-border border-y border-border">
                {intro.periodicTrainings.map((t, i) => (
                  <li key={t} className="flex items-baseline gap-4 py-3">
                    <span className="font-heading text-xl font-light tabular-nums text-secondary">{pad(i + 1)}</span>
                    <span className="text-foreground">{t}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-6 flex flex-col gap-3">
                <ArrowLink to={intro.trainingInterestFormUrl}>רישום התעניינות בהכשרות</ArrowLink>
                <ArrowLink to={intro.programSiteUrl}>אתר תכניות פנד&quot;ה</ArrowLink>
              </div>
              <div className="mt-6 border-t border-border pt-5">
                <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground">מטיב ילדים</p>
                <ContactLines contact={intro.contact} />
              </div>
            </div>
          </aside>
        </div>
      </Chapter>

      <Chapter>
        <ChapterHead
          number="01"
          label="המודלים"
          title="חמישה מודלים קבוצתיים"
          lead="התכניות שמטיב ילדים פיתחה או עיבדה, ושההכשרות מלמדות להנחות."
        />
        <div role="group" aria-label="סינון מודלים לפי קהל" className="mb-8 flex flex-wrap gap-1.5">
          {AGE_FILTERS.map((f) => (
            <ChoiceChip key={f.key} size="sm" selected={age === f.key} onClick={() => setAge(f.key)}>
              {f.label}
            </ChoiceChip>
          ))}
        </div>
        {models.length === 0 ? (
          <EmptyState title="אין מודל שמתאים לבחירה" />
        ) : (
          <div className="border-t border-border">
            {models.map((m) => (
              <article key={m.key} id={m.key} className="grid scroll-mt-40 gap-6 border-b border-border py-10 md:grid-cols-12 md:gap-10 md:py-14">
                <span aria-hidden="true" className="font-heading text-5xl font-light leading-none tabular-nums text-secondary md:col-span-2 md:text-7xl">
                  {pad(m.index + 1)}
                </span>
                <div className="md:col-span-10">
                  <h3 className="font-heading text-3xl font-light leading-tight text-foreground md:text-5xl">{m.title}</h3>
                  {m.fullName && <p className="mt-2 text-lg text-muted-foreground">{m.fullName}</p>}
                  <dl className="mt-8 grid gap-6 sm:grid-cols-3">
                    {[
                      { label: 'גילאים', value: m.ages },
                      { label: 'מבנה', value: m.structure },
                      { label: 'פותח על ידי', value: m.developedBy },
                    ].map((f) => (
                      <div key={f.label} className="border-t border-border pt-3">
                        <dt className="text-xs font-semibold tracking-wide text-muted-foreground">{f.label}</dt>
                        <dd className="mt-1 leading-relaxed text-foreground">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-8 max-w-3xl text-lg leading-[1.8] text-foreground">{m.description}</p>
                  {m.keyMessages?.length > 0 && (
                    <div className="mt-6">
                      <p className="text-xs font-semibold tracking-wide text-muted-foreground">מסרים מרכזיים</p>
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {m.keyMessages.map((k) => (
                          <li key={k} className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground">{k}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
                    {m.trainingSlug && <ArrowLink to={`/therapist/courses/${m.trainingSlug}`}>להכשרת המנחים</ArrowLink>}
                    <ArrowLink to={m.sourceUrl}>לעמוד באתר מטיב</ArrowLink>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Chapter>

      <Chapter>
        <ChapterHead number="02" label="הכשרות" title="הכשרות בתחום הילדים והמשפחה" />
        <div className="border-t border-border">
          {trainings.map((c) => (
            <CourseRow key={c.slug} course={c} />
          ))}
        </div>
      </Chapter>
    </>
  );
}
