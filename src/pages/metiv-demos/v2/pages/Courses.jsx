import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, ExternalLink, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChoiceChip from '@/components/patterns/ChoiceChip';
import { useDemoChrome } from '@/pages/metiv-demos/shared/DemoChrome';
import { COURSES, COURSE_CATEGORIES, ORG } from '@/pages/metiv-demos/shared/therapist';
import { cn } from '@/lib/utils';
import { FOCUS_DARK } from '../lib';
import { Container, EmptyState, chipClass } from '../components/ui';
import { CourseCard, courseFormats, courseStatusKind, FORMAT_LABELS } from '../components/cards';

const STATUS = [
  { key: 'open', label: 'הרשמה פתוחה' },
  { key: 'unknown', label: 'מועד יתעדכן' },
  { key: 'past', label: 'התקיימו' },
];

const ORDER = { open: 0, unknown: 1, past: 2 };

function sortCourses(list) {
  return [...list].sort((a, b) => {
    const ka = courseStatusKind(a);
    const kb = courseStatusKind(b);
    if (ka !== kb) return ORDER[ka] - ORDER[kb];
    const da = a.startDateISO || '';
    const db = b.startDateISO || '';
    return ka === 'past' ? db.localeCompare(da) : da.localeCompare(db);
  });
}

/**
 * @param {{ label: string, options: {key: string, label: string, count?: number}[], value: string, onChange: (k: string) => void }} props
 */
function ChipGroup({ label, options, value, onChange }) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <span className="text-sm font-semibold text-sanctuary-foreground/80 flex-shrink-0 w-16">{label}</span>
      {[{ key: 'all', label: 'הכל' }, ...options].map((o) => (
        <ChoiceChip
          key={o.key}
          selected={value === o.key}
          onClick={() => onChange(o.key)}
          className={cn('flex-shrink-0 min-h-[2.5rem]', chipClass(value === o.key, true))}
        >
          {o.label}
          {typeof o.count === 'number' && <span className="opacity-75 text-xs">({o.count})</span>}
        </ChoiceChip>
      ))}
    </div>
  );
}

export default function Courses() {
  const { PageHeader } = useDemoChrome();
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || 'all';
  const format = params.get('format') || 'all';
  const status = params.get('status') || 'all';
  const q = params.get('q') || '';

  const set = (key, value) => {
    const next = new URLSearchParams(params);
    if (!value || value === 'all') next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const filtered = useMemo(() => {
    const t = q.trim();
    return sortCourses(
      COURSES.filter((c) => {
        if (category !== 'all' && c.category !== category) return false;
        if (format !== 'all' && !courseFormats(c).has(format)) return false;
        if (status !== 'all' && courseStatusKind(c) !== status) return false;
        if (t && !`${c.title} ${c.subtitle || ''} ${c.summary} ${c.tags.join(' ')}`.includes(t)) return false;
        return true;
      })
    );
  }, [category, format, status, q]);

  const count = (pred) => COURSES.filter(pred).length;
  const anyFilter = category !== 'all' || format !== 'all' || status !== 'all' || q;
  const openCount = count((c) => courseStatusKind(c) === 'open');

  return (
    <div>
      <PageHeader
        eyebrow="קורסים והכשרות"
        title="קורסים, הכשרות וימי השתלמות"
        subtitle={`${COURSES.length} תכניות של מטיב למטפלים, לצוותים ולארגונים. ${openCount} מהן פתוחות כעת להרשמה.`}
      />

      <section aria-label="סינון קורסים" className="border-b border-sanctuary-foreground/10 bg-sanctuary-foreground/[0.03]">
        <Container className="py-5 space-y-3">
          <div className="relative max-w-md">
            <label htmlFor="course-q" className="sr-only">
              חיפוש קורס
            </label>
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <input
              id="course-q"
              type="search"
              value={q}
              onChange={(e) => set('q', e.target.value)}
              placeholder="חיפוש לפי שם או נושא, למשל CBT"
              className="w-full border placeholder:text-muted-foreground focus-visible:outline-none h-12 rounded-full ps-12 bg-card text-foreground border-transparent focus-visible:ring-2 focus-visible:ring-sanctuary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-sanctuary"
            />
          </div>
          <ChipGroup
            label="תחום"
            value={category}
            onChange={(k) => set('category', k)}
            options={COURSE_CATEGORIES.map((c) => ({ ...c, count: count((x) => x.category === c.key) }))}
          />
          <ChipGroup
            label="מתכונת"
            value={format}
            onChange={(k) => set('format', k)}
            options={Object.entries(FORMAT_LABELS).map(([key, label]) => ({ key, label, count: count((x) => courseFormats(x).has(key)) }))}
          />
          <ChipGroup
            label="סטטוס"
            value={status}
            onChange={(k) => set('status', k)}
            options={STATUS.map((s) => ({ ...s, count: count((x) => courseStatusKind(x) === s.key) }))}
          />
        </Container>
      </section>

      <Container className="py-10 sm:py-12">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <p className="text-sanctuary-foreground/85 inline-flex items-center gap-2" aria-live="polite">
            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
            {filtered.length === COURSES.length ? `מוצגות כל ${COURSES.length} התכניות` : `נמצאו ${filtered.length} מתוך ${COURSES.length}`}
          </p>
          {anyFilter && (
            <Button type="button" variant="ghost" size="sm" radius="full" onClick={() => setParams(new URLSearchParams(), { replace: true })} className={cn('text-sanctuary-foreground hover:bg-sanctuary-foreground/10 hover:text-sanctuary-foreground underline underline-offset-4', FOCUS_DARK)}>
              ניקוי הסינון
            </Button>
          )}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="אין תכניות שמתאימות לסינון"
            text="אפשר להרחיב את הסינון, או לפנות אלינו בטופס ההכשרות."
            action={
              <Button type="button" variant="pill-light" size="pill" onClick={() => setParams(new URLSearchParams(), { replace: true })} className={FOCUS_DARK}>
                הצגת כל התכניות
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <li key={c.slug}>
                <CourseCard course={c} />
              </li>
            ))}
          </ul>
        )}

        <div className="mt-12 rounded-super-sm border border-dashed border-sanctuary-foreground/25 p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-heading font-semibold text-lg">לא מצאתם את מה שחיפשתם?</p>
            <p className="text-sm text-sanctuary-foreground/80">מטיב בונה גם הכשרות לצוותים ולארגונים. אפשר להשאיר פרטים.</p>
          </div>
          <Button asChild variant="pill-light" size="pill" className={FOCUS_DARK}>
            <a href={ORG.trainingsFormUrl} target="_blank" rel="noopener noreferrer">
              טופס פנייה להכשרה
              <ExternalLink aria-hidden="true" />
            </a>
          </Button>
        </div>
      </Container>
    </div>
  );
}
