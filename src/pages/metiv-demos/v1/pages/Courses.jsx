import React, { useState } from 'react';
import ChoiceChip from '@/components/patterns/ChoiceChip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { IMAGES } from '@/lib/images';
import { COURSE_CATEGORIES, COURSES, THERAPIST_HUB } from '@/pages/metiv-demos/shared/therapist';
import { PageHeaderV1 } from '../components/Chrome';
import { CourseRow } from '../components/Rows';
import { Chapter, ChapterHead, CONTAINER, EmptyState, PillLink, useV1Title } from '../components/primitives';
import { byStartAsc, byStartDesc, courseStatus, FORMAT_FILTERS, formatKeys, STATUS_FILTERS } from '../lib';

const GROUPS = [
  { key: 'open', number: '01', label: 'סתיו 2026', title: 'ההרשמה פתוחה', lead: 'מחזורים שנפתחים בחודשים הקרובים.', sort: byStartAsc },
  { key: 'soon', number: '02', label: 'בהכנה', title: 'מועד יפורסם', lead: 'הכשרות שמתקיימות מפעם לפעם. אפשר להשאיר פרטים ולקבל עדכון.', sort: byStartAsc },
  { key: 'closed', number: '03', label: 'ארכיון', title: 'התקיימו', lead: 'מחזורים קודמים, לעיון בתוכן ובמבנה עד לפרסום המועד הבא.', sort: byStartDesc },
];

export default function Courses() {
  useV1Title('קורסים והכשרות');
  const [category, setCategory] = useState('all');
  const [format, setFormat] = useState('all');
  const [status, setStatus] = useState('all');

  /** @param {any} c @param {{ category?: string, format?: string, status?: string }} [skip] */
  const matches = (c, skip = {}) =>
    (skip.category !== undefined || category === 'all' || c.category === category) &&
    (format === 'all' || formatKeys(c).has(format)) &&
    (status === 'all' || courseStatus(c).key === status);

  const filtered = COURSES.filter((c) => matches(c));
  const groups = GROUPS.map((g) => ({ ...g, items: filtered.filter((c) => courseStatus(c).key === g.key).sort(g.sort) })).filter((g) => g.items.length);
  const active = category !== 'all' || format !== 'all' || status !== 'all';
  const reset = () => {
    setCategory('all');
    setFormat('all');
    setStatus('all');
  };
  /** @param {string} key */
  const categoryCount = (key) => COURSES.filter((c) => matches(c, { category: 'skip' }) && (key === 'all' || c.category === key)).length;

  return (
    <>
      <PageHeaderV1
        size="editorial"
        align="start"
        tone="canvas"
        eyebrow="לאנשי טיפול ומקצוע"
        title="קורסים והכשרות"
        subtitle="תכנית הלימודים של מטיב בטיפול בטראומה: מחזורים שנפתחים בקרוב, הכשרות שמועדן יפורסם, ומחזורים שהתקיימו."
        image={IMAGES.selfhelp_hero}
      />

      <div className={cn(CONTAINER, 'pt-10 md:pt-14')}>
        <div className="flex flex-col gap-5 border-b border-border pb-8">
          <div role="group" aria-label="סינון לפי תחום" className="flex flex-wrap gap-1.5">
            {[{ key: 'all', label: 'כל התחומים' }, ...COURSE_CATEGORIES].map((c) => (
              <ChoiceChip key={c.key} variant="plain" selected={category === c.key} onClick={() => setCategory(c.key)} className="text-base">
                {c.label}
                <span className="text-xs tabular-nums opacity-75">{categoryCount(c.key)}</span>
              </ChoiceChip>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div role="group" aria-label="סינון לפי פורמט" className="flex flex-wrap gap-1.5">
              {FORMAT_FILTERS.map((f) => (
                <ChoiceChip key={f.key} size="sm" selected={format === f.key} onClick={() => setFormat(f.key)}>
                  {f.label}
                </ChoiceChip>
              ))}
            </div>
            <span aria-hidden="true" className="hidden h-5 w-px bg-border md:block" />
            <div role="group" aria-label="סינון לפי מועד" className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map((f) => (
                <ChoiceChip key={f.key} size="sm" selected={status === f.key} onClick={() => setStatus(f.key)}>
                  {f.label}
                </ChoiceChip>
              ))}
            </div>
          </div>
          <div className="flex min-h-8 items-center justify-between gap-4 text-sm">
            <p aria-live="polite" className="text-muted-foreground">
              {filtered.length} מתוך {COURSES.length} קורסים והכשרות
            </p>
            {active && (
              <Button variant="quiet" size="none" onClick={reset} className="text-sm underline underline-offset-4">
                איפוס הסינון
              </Button>
            )}
          </div>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className={cn(CONTAINER, 'py-16')}>
          <EmptyState
            title="אין קורסים שמתאימים לבחירה הזו"
            text="אפשר לשנות את הסינון, או להשאיר פרטים ולקבל עדכון על מחזורים הבאים."
            action={
              <Button variant="subtle" radius="full" size="roomy" onClick={reset}>
                איפוס הסינון
              </Button>
            }
          />
        </div>
      ) : (
        groups.map((g) => (
          <Chapter key={g.key} rule={false} className="py-12 md:py-16">
            <ChapterHead number={g.number} label={g.label} title={g.title} lead={g.lead} className="md:mb-8" />
            <div className="border-t border-border">
              {g.items.map((c) => (
                <CourseRow key={c.slug} course={c} />
              ))}
            </div>
          </Chapter>
        ))
      )}

      <Chapter>
        <ChapterHead
          label="עדכונים"
          title="לא מצאתם הכשרה מתאימה?"
          lead="אפשר להשאיר פרטים בטופס הפנייה ולקבל עדכון על מחזורים הבאים, הדרכות והכשרות לארגונים."
          action={<PillLink to={THERAPIST_HUB.cta.url} size="lg">{THERAPIST_HUB.cta.label}</PillLink>}
        />
      </Chapter>
    </>
  );
}
