import React, { useMemo, useState } from 'react';
import { BookOpen, Search, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChoiceChip from '@/components/patterns/ChoiceChip';
import { cn } from '@/lib/utils';
import PageHeaderV3 from '../components/PageHeaderV3';
import { Band, EmptyState, ExternalLink, SectionHeading, StatusPill, TEXT_LINK } from '../components/kit';
import { isLatin } from '../lib';
import { Input } from '../components/Input';
import { fmt, useCopy, useMetiv } from '../content/MetivContent';

/** @typedef {import('@/pages/metiv-demos/shared/therapist/research.js').Paper} Paper */

/** @param {Record<string, string>} c */
const typeLabel = (c) => ({ article: c.typeArticle, chapter: c.typeChapter });

/** @param {Record<string, string>} c */
const types = (c) => [
  { key: 'all', label: c.typesAll },
  { key: 'article', label: c.typesArticles },
  { key: 'chapter', label: c.typesChapters },
];

/** @param {Record<string, string>} c */
const periods = (c) => [
  { key: 'all', label: c.periodAll, test: () => true },
  { key: '2020', label: c.period2020, test: (/** @type {number|undefined} */ y) => !!y && y >= 2020 },
  { key: '2010', label: c.period2010, test: (/** @type {number|undefined} */ y) => !!y && y >= 2010 && y < 2020 },
  { key: '2000', label: c.period2000, test: (/** @type {number|undefined} */ y) => !!y && y < 2010 },
];

/** @param {{ paper: Paper }} props */
function PaperCard({ paper }) {
  const { PAPER_TOPICS } = useMetiv();
  const c = useCopy('publications');
  const latin = isLatin(paper.title);
  const link = paper.doi ? `https://doi.org/${paper.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, '')}` : paper.url;
  return (
    <li className="rounded-super-sm bg-card border border-border p-5 hover:border-primary/40 transition-natural">
      <div className="flex flex-wrap items-center gap-2">
        {paper.featured && <StatusPill tone="primary"><Star className="w-3 h-3" aria-hidden="true" />{c.featured}</StatusPill>}
        <StatusPill tone="muted">{PAPER_TOPICS[paper.topic]}</StatusPill>
        <StatusPill tone="muted">{typeLabel(c)[paper.type]}</StatusPill>
        {paper.year && <span className="text-sm text-muted-foreground">{paper.year}</span>}
      </div>
      <p dir={latin ? 'ltr' : undefined} className={cn('mt-3 font-heading font-semibold text-lg text-foreground leading-snug', latin && 'text-start')}>{paper.title}</p>
      <p dir={latin ? 'ltr' : undefined} className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
        {paper.authors.join(', ')}
        {paper.journal && <> · <span className="italic">{paper.journal}</span></>}
        {paper.details && <> · {paper.details}</>}
      </p>
      {link && (
        <ExternalLink href={link} className={cn('mt-3 text-sm', TEXT_LINK)}>{paper.doi ? 'DOI' : c.link}</ExternalLink>
      )}
    </li>
  );
}

/**
 * A compact segmented control: one pill track, the chosen option filled.
 * @param {{ label: string, options: { key: string, label: string }[], value: string, onChange: (key: string) => void }} props
 */
function Segmented({ label, options, value, onChange }) {
  return (
    // Rounded box rather than a full pill on phones, where the options can wrap to two rows.
    <div role="group" aria-label={label} className="inline-flex flex-wrap items-center gap-1 rounded-3xl sm:rounded-full bg-muted p-1">
      {options.map((o) => {
        const on = value === o.key;
        return (
          <Button
            key={o.key}
            type="button"
            size="none"
            radius="full"
            variant={on ? 'solid' : 'quiet'}
            aria-pressed={on}
            onClick={() => onChange(o.key)}
            className={cn('px-4 py-1.5 text-sm whitespace-nowrap', on ? 'shadow-atmospheric' : 'hover:bg-card')}
          >
            {o.label}
          </Button>
        );
      })}
    </div>
  );
}

export default function Publications() {
  const { BOOKS, PAPERS, PAPER_TOPICS, RESEARCH_INTRO } = useMetiv();
  const c = useCopy('publications');
  const TYPES = types(c);
  const PERIODS = useMemo(() => periods(c), [c]);
  const TOPICS = Object.entries(PAPER_TOPICS)
    .filter(([key]) => PAPERS.some((/** @type {Paper} */ p) => p.topic === key))
    .map(([key, label]) => ({ key, label: /** @type {string} */ (label) }));
  const [topic, setTopic] = useState('all');
  const [type, setType] = useState('all');
  const [period, setPeriod] = useState('all');
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const p = PERIODS.find((x) => x.key === period) || PERIODS[0];
    return PAPERS.filter(
      (/** @type {Paper} */ x) =>
        (topic === 'all' || x.topic === topic) &&
        (type === 'all' || x.type === type) &&
        p.test(x.year) &&
        (!q || `${x.title} ${x.authors.join(' ')} ${x.journal}`.toLowerCase().includes(q))
    ).sort((/** @type {Paper} */ a, /** @type {Paper} */ b) => Number(!!b.featured) - Number(!!a.featured) || (b.year || 0) - (a.year || 0));
  }, [PAPERS, PERIODS, topic, type, period, query]);

  const reset = () => { setTopic('all'); setType('all'); setPeriod('all'); setQuery(''); };

  // What is currently narrowing the list, each removable on its own.
  const active = [
    query.trim() && { key: 'query', label: `"${query.trim()}"`, clear: () => setQuery('') },
    topic !== 'all' && { key: 'topic', label: PAPER_TOPICS[topic], clear: () => setTopic('all') },
    type !== 'all' && { key: 'type', label: TYPES.find((x) => x.key === type)?.label, clear: () => setType('all') },
    period !== 'all' && { key: 'period', label: PERIODS.find((x) => x.key === period)?.label, clear: () => setPeriod('all') },
  ].filter(Boolean);

  return (
    <div className="bg-background">
      <PageHeaderV3
        tone="muted"
        eyebrow={c.eyebrow}
        title={c.title}
        subtitle={c.subtitle}
        short={[fmt(c.shortCount, { books: BOOKS.length, papers: PAPERS.length }), c.shortFilter, RESEARCH_INTRO.booksOrderingNote]}
      />

      <Band tone="canvas" labelledBy="pub-books">
        <SectionHeading id="pub-books" eyebrow={c.booksEyebrow} title={c.booksTitle} />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BOOKS.map((/** @type {any} */ b) => (
            <li key={b.title} className="flex flex-col rounded-super bg-card border border-border p-5 shadow-card">
              <span className="w-12 h-14 rounded-lg bg-primary/10 text-accent flex items-center justify-center mb-4" aria-hidden="true"><BookOpen className="w-6 h-6" /></span>
              <p dir="ltr" className="font-heading font-semibold text-foreground leading-snug text-start">{b.title}</p>
              <p dir="ltr" className="mt-2 text-sm text-muted-foreground text-start">{b.role} {b.authors.join(', ')}</p>
              <p dir="ltr" className="text-sm text-muted-foreground text-start">{[b.publisher, b.year].filter(Boolean).join(', ')}</p>
              {b.url && <ExternalLink href={b.url} className={cn('mt-auto pt-4 text-sm', TEXT_LINK)}>{c.bookPage}</ExternalLink>}
            </li>
          ))}
        </ul>
      </Band>

      <Band tone="card" labelledBy="pub-papers">
        <SectionHeading id="pub-papers" eyebrow={c.papersEyebrow} title={c.papersTitle} />

        {/* ── Filter panel: search first, then two short choices, then topics ── */}
        <div className="rounded-super bg-background border border-border shadow-card p-4 sm:p-6">
          <div className="relative">
            <label htmlFor="pub-search" className="sr-only">{c.searchLabel}</label>
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              id="pub-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={c.searchPlaceholder}
              className="h-12 ps-12 rounded-full bg-card text-base"
            />
          </div>

          <div className="mt-5 flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-muted-foreground">{c.type}</span>
              <Segmented label={c.type} options={TYPES} value={type} onChange={setType} />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-muted-foreground">{c.years}</span>
              <Segmented label={c.years} options={PERIODS} value={period} onChange={setPeriod} />
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-border">
            <p className="text-sm font-semibold text-muted-foreground mb-3">{c.topic}</p>
            <div role="group" aria-label={c.topic} className="flex flex-wrap gap-2">
              <ChoiceChip size="sm" selected={topic === 'all'} onClick={() => setTopic('all')}>{c.allTopics}</ChoiceChip>
              {TOPICS.map((o) => (
                <ChoiceChip key={o.key} size="sm" selected={topic === o.key} onClick={() => setTopic((cur) => (cur === o.key ? 'all' : o.key))}>
                  {o.label}
                </ChoiceChip>
              ))}
            </div>
          </div>
        </div>

        {/* ── Result count and the active filters ── */}
        <div className="mt-8 flex flex-wrap items-center gap-3" aria-live="polite">
          <p className="font-heading font-semibold text-xl text-foreground">
            {results.length === 1 ? c.resultsOne : fmt(c.resultsMany, { count: results.length })}
          </p>
          {active.map((f) => (
            <Button
              key={f.key}
              type="button"
              variant="subtle"
              size="none"
              radius="full"
              onClick={f.clear}
              aria-label={fmt(c.removeFilter, { label: f.label ?? '' })}
              className="px-3 py-1 text-sm gap-1.5"
            >
              {f.label}
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </Button>
          ))}
          {active.length > 1 && (
            <Button type="button" variant="link" className="text-accent px-0 text-sm" onClick={reset}>{c.clearAll}</Button>
          )}
        </div>

        {results.length === 0 ? (
          <div className="mt-4"><EmptyState title={c.emptyTitle} text={c.emptyText} action={<Button variant="solid" radius="full" onClick={reset}>{c.clearFilters}</Button>} /></div>
        ) : (
          <ul className="mt-4 grid gap-3 lg:grid-cols-2">{results.map((/** @type {Paper} */ p) => <PaperCard key={`${p.title}-${p.year}`} paper={p} />)}</ul>
        )}
      </Band>
    </div>
  );
}
