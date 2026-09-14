import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import ChoiceChip from '@/components/patterns/ChoiceChip';
import FilterChip from '@/components/patterns/FilterChip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { IMAGES } from '@/lib/images';
import { BOOKS, PAPER_TOPICS, PAPERS, RESEARCH_INTRO } from '@/pages/metiv-demos/shared/therapist';
import { PageHeaderV1 } from '../components/Chrome';
import { ARCH, ArrowLink, Chapter, ChapterHead, EmptyState, useV1Title } from '../components/primitives';

const TYPES = [
  { key: 'all', label: 'הכל' },
  { key: 'article', label: 'מאמרים' },
  { key: 'chapter', label: 'פרקים בספרים' },
];

/** @type {Record<string, string>} */
const TOPIC_LABELS = PAPER_TOPICS;

export default function Publications() {
  useV1Title('פרסומים');
  const [topic, setTopic] = useState('all');
  const [type, setType] = useState('all');
  const [year, setYear] = useState('all');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [query, setQuery] = useState('');

  const years = useMemo(
    () => [...new Set(PAPERS.map((p) => p.year).filter(Boolean))].sort((a, b) => b - a),
    []
  );
  const q = query.trim().toLowerCase();

  /** @param {any} p @param {boolean} [ignoreTopic] */
  const matches = (p, ignoreTopic = false) =>
    (ignoreTopic || topic === 'all' || p.topic === topic) &&
    (type === 'all' || p.type === type) &&
    (year === 'all' || (year === 'none' ? !p.year : String(p.year) === year)) &&
    (!featuredOnly || p.featured) &&
    (!q || [p.title, p.journal, ...p.authors].join(' ').toLowerCase().includes(q));

  const filtered = PAPERS.filter((p) => matches(p));
  const groups = [...years.map((y) => ({ key: String(y), label: String(y), items: filtered.filter((p) => p.year === y) })),
    { key: 'none', label: 'ללא שנה', items: filtered.filter((p) => !p.year) }].filter((g) => g.items.length);
  const active = topic !== 'all' || type !== 'all' || year !== 'all' || featuredOnly || q;
  const reset = () => {
    setTopic('all');
    setType('all');
    setYear('all');
    setFeaturedOnly(false);
    setQuery('');
  };

  return (
    <>
      <PageHeaderV1
        size="editorial"
        align="start"
        tone="canvas"
        eyebrow="לאנשי טיפול ומקצוע · מחקר"
        title="פרסומים"
        subtitle="ספרים, מאמרים ופרקים שפרסמו אנשי מטיב. הפרטים הביבליוגרפיים מוצגים כפי שהם מופיעים באתר מטיב."
        image={IMAGES.questionnaire_hero}
      />

      <Chapter rule={false}>
        <ChapterHead number="01" label="ספרים" title="ספרים שכתבו וערכו אנשי מטיב" lead={RESEARCH_INTRO.booksOrderingNote} />
        <ul className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4 lg:gap-x-8">
          {BOOKS.map((b) => (
            <li key={b.title} className="flex flex-col">
              <div className={cn(ARCH, 'flex aspect-[3/4] flex-col items-center justify-end bg-muted px-4 pb-6 text-center')}>
                <span className="font-heading text-4xl font-light tabular-nums text-foreground md:text-6xl">{b.year}</span>
                <span className="mt-1 text-xs tracking-wide text-muted-foreground">{b.publisher}</span>
              </div>
              <div dir="ltr" lang="en" className="mt-5 text-start">
                <p className="text-xs text-muted-foreground">{b.role} {b.authors.join(', ')}</p>
                <p className="mt-2 font-heading text-lg leading-snug text-foreground md:text-xl">{b.title}</p>
              </div>
              {b.url && (
                <div className="mt-3">
                  <ArrowLink to={b.url} className="text-sm">לעמוד הספר</ArrowLink>
                </div>
              )}
            </li>
          ))}
        </ul>
      </Chapter>

      <Chapter id="papers">
        <ChapterHead number="02" label="מאמרים ופרקים" title="ביבליוגרפיה" lead="מאמרים בכתבי עת ופרקים בספרים, לפי שנה. אפשר לסנן לפי נושא, סוג ושנה." />

        <div className="flex flex-col gap-5 border-b border-border pb-8">
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative w-full max-w-md">
              <span className="sr-only">חיפוש בפרסומים</span>
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="חיפוש לפי כותרת, מחבר או כתב עת"
                className="h-11 w-full rounded-full border border-border bg-card pe-4 ps-9 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <FilterChip
              label="שנה"
              value={year}
              onChange={setYear}
              activeLabel={year === 'none' ? 'ללא שנה' : `שנה: ${year}`}
              options={[{ key: 'all', label: 'כל השנים' }, ...years.map((y) => ({ key: String(y), label: String(y) })), { key: 'none', label: 'ללא שנה' }]}
            />
            <ChoiceChip size="default" selected={featuredOnly} onClick={() => setFeaturedOnly((v) => !v)}>
              פרסומים נבחרים
            </ChoiceChip>
          </div>
          <div role="group" aria-label="סינון לפי נושא" className="flex flex-wrap gap-1.5">
            {[['all', 'כל הנושאים'], ...Object.entries(TOPIC_LABELS)].map(([key, label]) => {
              const n = PAPERS.filter((p) => matches(p, true) && (key === 'all' || p.topic === key)).length;
              return (
                <ChoiceChip key={key} size="sm" variant="plain" selected={topic === key} onClick={() => setTopic(key)} disabled={n === 0 && topic !== key} className="disabled:opacity-40">
                  {label}
                  <span className="tabular-nums opacity-75">{n}</span>
                </ChoiceChip>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="group" aria-label="סינון לפי סוג" className="flex flex-wrap gap-1.5">
              {TYPES.map((t) => (
                <ChoiceChip key={t.key} size="sm" selected={type === t.key} onClick={() => setType(t.key)}>{t.label}</ChoiceChip>
              ))}
            </div>
            <div className="flex items-center gap-4 text-sm">
              <p aria-live="polite" className="text-muted-foreground">מציג {filtered.length} מתוך {PAPERS.length}</p>
              {active && (
                <Button variant="quiet" size="none" onClick={reset} className="text-sm underline underline-offset-4">איפוס</Button>
              )}
            </div>
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title="לא נמצאו פרסומים"
              text="אפשר לנסות מילת חיפוש אחרת או לאפס את הסינון."
              action={<Button variant="subtle" radius="full" size="roomy" onClick={reset}>איפוס הסינון</Button>}
            />
          </div>
        ) : (
          groups.map((g) => (
            <section key={g.key} className="grid gap-2 border-b border-border py-8 md:grid-cols-12 md:gap-10 md:py-12">
              <div className="md:col-span-3">
                <h3 className="sr-only">{g.label}</h3>
                <p aria-hidden="true" className="font-heading text-5xl font-light leading-none tabular-nums text-primary/30 md:sticky md:top-40 md:text-8xl">
                  {g.key === 'none' ? <span className="text-3xl text-muted-foreground md:text-4xl">{g.label}</span> : g.label}
                </p>
              </div>
              <ul className="divide-y divide-border md:col-span-9">
                {g.items.map((p) => (
                  <li key={p.title} className="py-5 first:pt-0">
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground">
                      {TOPIC_LABELS[p.topic]} · {p.type === 'chapter' ? 'פרק בספר' : 'מאמר'}
                      {p.featured && <span className="text-category-2"> · נבחר</span>}
                    </p>
                    <div dir="ltr" lang="en" className="mt-2 text-start">
                      <p className="text-lg font-medium leading-snug text-foreground">
                        {p.url ? (
                          <a href={p.url} target="_blank" rel="noreferrer" className="underline-offset-4 hover:text-primary hover:underline">{p.title}</a>
                        ) : (
                          p.title
                        )}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{p.authors.join(', ')}</p>
                      <p className="mt-1 text-sm text-foreground">
                        <span className="font-medium">{p.journal}</span>
                        {p.details ? `, ${p.details}` : ''}
                        {p.year ? ` (${p.year})` : ''}
                        {p.doi && (
                          <>
                            {' · '}
                            <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">DOI</a>
                          </>
                        )}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </Chapter>
    </>
  );
}
