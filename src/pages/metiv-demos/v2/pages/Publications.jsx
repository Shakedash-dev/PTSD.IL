import React, { useMemo, useState } from 'react';
import { Search, ExternalLink, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChoiceChip from '@/components/patterns/ChoiceChip';
import FilterChip from '@/components/patterns/FilterChip';
import { useDemoChrome } from '@/pages/metiv-demos/shared/DemoChrome';
import { BOOKS, PAPERS, PAPER_TOPICS, RESEARCH_INTRO } from '@/pages/metiv-demos/shared/therapist';
import { cn } from '@/lib/utils';
import { FOCUS_DARK } from '../lib';
import { Container, EmptyState, Panel, SectionTitle, Tag, chipClass } from '../components/ui';

const PAGE = 12;
const TYPES = [
  { key: 'all', label: 'הכל' },
  { key: 'article', label: 'מאמרים' },
  { key: 'chapter', label: 'פרקים בספרים' },
];

const YEARS = [...new Set(PAPERS.map((p) => p.year).filter(Boolean))].sort((a, b) => b - a);

function PaperCard({ p }) {
  const doiUrl = p.doi ? `https://doi.org/${p.doi}` : null;
  return (
    <Panel as="article" className="h-full flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Tag>{p.type === 'chapter' ? 'פרק בספר' : 'מאמר'}</Tag>
        <Tag className="bg-transparent">{PAPER_TOPICS[p.topic]}</Tag>
        {p.year && <Tag className="bg-transparent">{p.year}</Tag>}
      </div>
      <h3 className="font-heading font-semibold text-lg leading-snug" dir="auto">
        {p.title}
      </h3>
      <p className="text-sm text-sanctuary-foreground/85" dir="auto">
        {p.authors.join(', ')}
      </p>
      <p className="text-sm text-sanctuary-foreground/75" dir="auto">
        {p.journal}
        {p.details ? `, ${p.details}` : ''}
      </p>
      {(doiUrl || p.url) && (
        <div className="mt-auto pt-1 flex flex-wrap gap-2">
          {doiUrl && (
            <a href={doiUrl} target="_blank" rel="noopener noreferrer" className={cn('inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-sanctuary-foreground text-sanctuary text-xs font-semibold hover:bg-card', FOCUS_DARK)}>
              DOI
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          )}
          {p.url && p.url !== doiUrl && (
            <a href={p.url} target="_blank" rel="noopener noreferrer" className={cn('inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-sanctuary-foreground/30 text-xs font-semibold hover:bg-sanctuary-foreground/10', FOCUS_DARK)}>
              לקריאה
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          )}
        </div>
      )}
    </Panel>
  );
}

export default function Publications() {
  const { PageHeader } = useDemoChrome();
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [topic, setTopic] = useState('all');
  const [year, setYear] = useState('all');
  const [shown, setShown] = useState(PAGE);

  const topicCounts = useMemo(() => {
    const m = {};
    PAPERS.forEach((p) => {
      m[p.topic] = (m[p.topic] || 0) + 1;
    });
    return m;
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return PAPERS.filter((p) => {
      if (type !== 'all' && p.type !== type) return false;
      if (topic !== 'all' && p.topic !== topic) return false;
      if (year === 'none' && p.year) return false;
      if (year !== 'all' && year !== 'none' && String(p.year) !== year) return false;
      if (t && !`${p.title} ${p.authors.join(' ')} ${p.journal}`.toLowerCase().includes(t)) return false;
      return true;
    }).sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || (b.year || 0) - (a.year || 0));
  }, [q, type, topic, year]);

  const reset = () => {
    setQ('');
    setType('all');
    setTopic('all');
    setYear('all');
    setShown(PAGE);
  };
  const withReset = (fn) => (v) => {
    fn(v);
    setShown(PAGE);
  };

  return (
    <div>
      <PageHeader
        eyebrow="פרסומים"
        title="ספרים, מאמרים ופרקים"
        subtitle="פרסומים של אנשי מטיב, כפי שהם מופיעים באתר מטיב. חלק מהרשומות חסרות שנה או קישור, כמו במקור."
        meta={
          <>
            <Tag className="text-sm px-3 py-1">{BOOKS.length} ספרים</Tag>
            <Tag className="text-sm px-3 py-1">{PAPERS.filter((p) => p.type === 'article').length} מאמרים</Tag>
            <Tag className="text-sm px-3 py-1">{PAPERS.filter((p) => p.type === 'chapter').length} פרקים</Tag>
          </>
        }
      />

      <Container className="py-12 space-y-16">
        <section aria-labelledby="books">
          <SectionTitle id="books" eyebrow="ספרים" title="ספרים שכתבו או ערכו אנשי מטיב" description={RESEARCH_INTRO.booksOrderingNote} />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BOOKS.map((b) => (
              <li key={b.title}>
                <Panel as="article" className="h-full flex flex-col gap-3 p-0 sm:p-0 overflow-hidden">
                  <div className="h-28 bg-sanctuary-foreground/[0.08] flex items-end justify-between p-4">
                    <BookOpen className="w-9 h-9 text-sanctuary-foreground/80" aria-hidden="true" />
                    {b.year && <span className="font-heading font-semibold text-2xl">{b.year}</span>}
                  </div>
                  <div className="px-5 pb-5 flex flex-col gap-2 flex-1">
                    <h3 className="font-heading font-semibold leading-snug" dir="auto">
                      {b.title}
                    </h3>
                    <p className="text-sm text-sanctuary-foreground/80" dir="auto">
                      {b.role ? `${b.role} ` : ''}
                      {b.authors.join(', ')}
                    </p>
                    {b.publisher && <p className="text-xs text-sanctuary-foreground/75">{b.publisher}</p>}
                    {b.url && (
                      <a href={b.url} target="_blank" rel="noopener noreferrer" className={cn('mt-auto inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-4 rounded w-fit', FOCUS_DARK)}>
                        לעמוד הספר
                        <ExternalLink className="w-4 h-4" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </Panel>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="papers">
          <SectionTitle id="papers" eyebrow="מאמרים ופרקים" title="המאגר המלא" description="סינון לפי סוג, נושא ושנה, או חיפוש לפי שם, מחבר או כתב עת." />

          <div className="rounded-super-sm border border-sanctuary-foreground/15 bg-sanctuary-foreground/[0.03] p-4 sm:p-5 space-y-4 mb-8">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[14rem] max-w-md">
                <label htmlFor="pub-q" className="sr-only">
                  חיפוש פרסום
                </label>
                <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" aria-hidden="true" />
                <input
                  id="pub-q"
                  type="search"
                  value={q}
                  onChange={(e) => withReset(setQ)(e.target.value)}
                  placeholder="חיפוש: Brom, resilience, מילואים"
                  className="w-full border placeholder:text-muted-foreground focus-visible:outline-none h-11 rounded-full ps-12 bg-card text-foreground border-transparent focus-visible:ring-2 focus-visible:ring-sanctuary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-sanctuary"
                />
              </div>
              <div role="group" aria-label="סוג פרסום" className="flex gap-2">
                {TYPES.map((t) => (
                  <ChoiceChip key={t.key} selected={type === t.key} onClick={() => withReset(setType)(t.key)} className={chipClass(type === t.key, true)}>
                    {t.label}
                  </ChoiceChip>
                ))}
              </div>
              <FilterChip
                label="שנה"
                value={year}
                onChange={withReset(setYear)}
                activeLabel={year === 'none' ? 'ללא שנה' : year !== 'all' ? `שנה: ${year}` : undefined}
                options={[{ key: 'all', label: 'כל השנים' }, ...YEARS.map((y) => ({ key: String(y), label: String(y) })), { key: 'none', label: 'ללא שנה' }]}
              />
            </div>
            <div role="group" aria-label="נושא" className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <ChoiceChip selected={topic === 'all'} onClick={() => withReset(setTopic)('all')} className={cn('flex-shrink-0', chipClass(topic === 'all', true))}>
                כל הנושאים
              </ChoiceChip>
              {Object.entries(PAPER_TOPICS)
                .filter(([k]) => topicCounts[k])
                .map(([k, label]) => (
                  <ChoiceChip key={k} selected={topic === k} onClick={() => withReset(setTopic)(k)} className={cn('flex-shrink-0', chipClass(topic === k, true))}>
                    {label} <span className="opacity-75 text-xs">({topicCounts[k]})</span>
                  </ChoiceChip>
                ))}
            </div>
          </div>

          <p className="mb-5 text-sanctuary-foreground/85" aria-live="polite">
            {filtered.length} פרסומים{filtered.length > shown ? `, מוצגים ${shown}` : ''}
          </p>

          {filtered.length === 0 ? (
            <EmptyState
              title="לא נמצאו פרסומים"
              text="אפשר לנקות את הסינון ולנסות שוב."
              action={
                <Button type="button" variant="pill-light" size="pill" onClick={reset} className={FOCUS_DARK}>
                  ניקוי הסינון
                </Button>
              }
            />
          ) : (
            <>
              <ul className="grid gap-4 md:grid-cols-2">
                {filtered.slice(0, shown).map((p) => (
                  <li key={`${p.title}-${p.year || ''}`}>
                    <PaperCard p={p} />
                  </li>
                ))}
              </ul>
              {filtered.length > shown && (
                <div className="mt-8 flex justify-center">
                  <Button type="button" variant="pill-light" size="pill-lg" onClick={() => setShown((n) => n + PAGE)} className={FOCUS_DARK}>
                    הצגת {Math.min(PAGE, filtered.length - shown)} פרסומים נוספים
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </Container>
    </div>
  );
}
