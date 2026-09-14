import React, { useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, ChevronDown, Search, SlidersHorizontal, SearchX, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '../components/ui';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '../components/ui';
import Disclosure from '@/components/patterns/Disclosure';
import ChoiceChip from '@/components/patterns/ChoiceChip';
import { DemoLink, DemoMarkdown, useDemoChrome } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { RESEARCH_INTRO, ACTIVE_STUDIES, BOOKS, PAPERS, PAPER_TOPICS } from '@/pages/metiv-demos/shared/therapist';
import { cn } from '@/lib/utils';
import ContentLayout from '../components/ContentLayout';
import { StatusPill, KeyFacts, ContactCard, ExtLink, SectionTitle, Tag } from '../components/primitives';
import { FacetGroup, ActiveChips, toggleIn } from '../components/Facets';
import { THERAPIST_RAIL } from '../lib/nav';

// ── Research ────────────────────────────────────────────────────────────────

export function Research() {
  const { PageHeader } = useDemoChrome();
  const R = RESEARCH_INTRO;
  const [onlyRecruiting, setOnlyRecruiting] = useState(false);
  const studies = ACTIVE_STUDIES.filter((s) => !onlyRecruiting || s.recruiting);
  const recruitingCount = ACTIVE_STUDIES.filter((s) => s.recruiting).length;
  const toc = [
    { id: 'about', label: 'על יחידת המחקר' },
    { id: 'studies', label: 'מחקרים פעילים' },
    { id: 'past', label: 'תחומי מחקר קודמים' },
    { id: 'journal-club', label: R.journalClub.title },
    { id: 'collaboration', label: 'שיתופי פעולה' },
  ];

  return (
    <div className="bg-background">
      <PageHeader
        tone="card"
        eyebrow="לאנשי מקצוע"
        title="מחקר"
        subtitle={R.title}
        meta={<><span>{ACTIVE_STUDIES.length} מחקרים פעילים</span><span aria-hidden="true">·</span><span>{recruitingCount} מגייסים משתתפים</span></>}
      />
      <ContentLayout rail={THERAPIST_RAIL} railTitle="לאנשי מקצוע" toc={toc} aside={<ContactCard contact={R.collaborationContact} title="שיתופי פעולה מחקריים" />}>
        <div className="space-y-14">
          <section aria-labelledby="about">
            <SectionTitle id="about" title="על יחידת המחקר" />
            <div className="space-y-3 text-lg leading-relaxed text-foreground">{R.paragraphs.map((p) => <p key={p}>{p}</p>)}</div>
            <KeyFacts className="mt-6" items={[{ label: 'מיקוד', value: R.focus }, { label: 'תפקיד', value: R.role }]} />
            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold text-foreground">עקרונות עבודה</p>
              <ul className="flex flex-wrap gap-2">{R.principles.map((p) => <li key={p}><Tag className="px-3 py-1 text-sm">{p}</Tag></li>)}</ul>
            </div>
          </section>

          <section aria-labelledby="studies">
            <SectionTitle
              id="studies"
              title="מחקרים פעילים"
              action={
                <div className="flex gap-2" role="group" aria-label="סינון מחקרים">
                  <ChoiceChip size="sm" selected={!onlyRecruiting} onClick={() => setOnlyRecruiting(false)}>הכל ({ACTIVE_STUDIES.length})</ChoiceChip>
                  <ChoiceChip size="sm" selected={onlyRecruiting} onClick={() => setOnlyRecruiting(true)}>מגייסים משתתפים ({recruitingCount})</ChoiceChip>
                </div>
              }
            />
            <p className="-mt-3 mb-5 text-sm text-muted-foreground">
              מתמודדים שמעוניינים להשתתף במחקר יכולים לקרוא על כך גם ב
              <DemoLink to={ROUTES.freeTreatment} className="font-medium text-primary hover:underline">עמוד טיפולים ללא עלות ומחקרים</DemoLink>.
            </p>
            <ul className="space-y-4">
              {studies.map((s) => (
                <li key={s.slug} id={s.slug} className={cn('rounded-super-sm border bg-card p-5 sm:p-6', s.recruiting ? 'border-success/40' : 'border-border')}>
                  <div className="flex flex-wrap items-center gap-2">
                    {s.recruiting ? <StatusPill tone="positive">מגייס משתתפים</StatusPill> : <StatusPill tone="neutral">לא מגייס כעת</StatusPill>}
                    <Tag>{s.status}</Tag>
                  </div>
                  <h3 className="mt-2 font-heading text-xl font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-1 leading-relaxed text-foreground">{s.summary}</p>
                  <p className="mt-2 text-sm text-muted-foreground"><span className="font-semibold text-foreground">אוכלוסיית המחקר: </span>{s.population}</p>
                  {(s.description !== s.summary || s.eligibility || s.team || s.links || s.contact) && (
                    <Disclosure className="mt-4" variant="plain" size="tight" label="פרטי המחקר">
                      <div className="space-y-4 pt-2">
                        <DemoMarkdown className="rich-content text-foreground [&_strong]:font-semibold">{s.description}</DemoMarkdown>
                        {s.eligibility?.length ? (
                          <div>
                            <p className="mb-1 text-sm font-semibold text-foreground">תנאי השתתפות</p>
                            <ul className="space-y-1">{s.eligibility.map((e) => <li key={e} className="flex gap-2 text-sm text-foreground"><span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />{e}</li>)}</ul>
                          </div>
                        ) : null}
                        {s.team?.length ? <p className="text-sm text-foreground"><span className="font-semibold">צוות: </span>{s.team.join(', ')}</p> : null}
                        {s.links?.length ? <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">{s.links.map((l) => <ExtLink key={l.url} href={l.url}>{l.label}</ExtLink>)}</div> : null}
                        <ContactCard contact={s.contact} className="max-w-sm" />
                      </div>
                    </Disclosure>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="past">
            <SectionTitle id="past" title="תחומי מחקר קודמים" action={<DemoLink to={ROUTES.publications} className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">לפרסומים <ArrowLeft aria-hidden="true" className="w-4 h-4" /></DemoLink>} />
            <ul className="grid gap-2 sm:grid-cols-2">
              {R.pastResearchAreas.map((a) => <li key={a} className="rounded-xl border border-border bg-card px-4 py-3 text-foreground">{a}</li>)}
            </ul>
          </section>

          <section aria-labelledby="journal-club" className="rounded-super-sm bg-sanctuary p-6 text-sanctuary-foreground sm:p-8">
            <Youtube aria-hidden="true" className="w-6 h-6" />
            <h2 id="journal-club" className="mt-2 font-heading text-2xl font-semibold">{R.journalClub.title}</h2>
            <p className="mt-1 text-sanctuary-foreground/85">{R.journalClub.description}</p>
            <a href={R.journalClub.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-full bg-card px-5 py-2.5 font-semibold text-foreground hover:bg-muted">
              להרצאות ביוטיוב <ArrowLeft aria-hidden="true" className="w-4 h-4" />
            </a>
          </section>

          <section aria-labelledby="collaboration">
            <SectionTitle id="collaboration" title="שיתופי פעולה" description="לחוקרים ולארגונים שמעוניינים בשיתוף פעולה מחקרי." />
            <ContactCard contact={R.collaborationContact} title="איש קשר" className="max-w-md" />
          </section>
        </div>
      </ContentLayout>
    </div>
  );
}

// ── Publications ────────────────────────────────────────────────────────────

const PERIODS = [
  { key: '2020', label: '2020 ואילך', test: (/** @type {number|undefined} */ y) => Boolean(y && y >= 2020) },
  { key: '2010', label: '2010-2019', test: (/** @type {number|undefined} */ y) => Boolean(y && y >= 2010 && y < 2020) },
  { key: '2000', label: '2000-2009', test: (/** @type {number|undefined} */ y) => Boolean(y && y >= 2000 && y < 2010) },
  { key: 'older', label: 'לפני 2000', test: (/** @type {number|undefined} */ y) => Boolean(y && y < 2000) },
  { key: 'none', label: 'ללא שנה', test: (/** @type {number|undefined} */ y) => !y },
];
const TYPE_LABELS = { article: 'מאמר בכתב עת', chapter: 'פרק בספר' };

/** @param {{ paper: import('@/pages/metiv-demos/shared/therapist/research.js').Paper }} props */
function Citation({ paper: p }) {
  const [open, setOpen] = useState(false);
  const id = `cite-${p.title.slice(0, 24).replace(/\W+/g, '-')}`;
  return (
    <li className="py-4">
      <div className="flex flex-wrap items-center gap-2">
        <Tag>{TYPE_LABELS[p.type]}</Tag>
        <Tag className="bg-card border border-border">{PAPER_TOPICS[p.topic]}</Tag>
        {p.featured && <StatusPill tone="info">נבחר</StatusPill>}
      </div>
      <p className="mt-2 leading-relaxed text-foreground" dir="auto">
        <span className="text-muted-foreground">{p.authors.join(', ')}</span>{' '}
        <span className="text-muted-foreground">({p.year || 'n.d.'}).</span>{' '}
        <span className="font-semibold">{p.title}.</span>{' '}
        <span className="font-medium">{p.journal}</span>
        {p.details ? <span className="text-muted-foreground">, {p.details}</span> : null}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
        <Button variant="quiet" size="none" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} className="gap-1 text-sm font-medium text-primary hover:text-accent">
          {open ? 'הסתרת פרטים' : 'פרטים'}
          <ChevronDown aria-hidden="true" className={cn('transition-transform', open && 'rotate-180')} />
        </Button>
        {p.url && <ExtLink href={p.url} className="text-sm">לפרסום</ExtLink>}
      </div>
      {open && (
        <dl id={id} className="mt-2 grid grid-cols-[6rem_1fr] gap-x-3 gap-y-1 rounded-xl bg-muted p-3 text-sm">
          <dt className="text-muted-foreground">סוג</dt><dd className="text-foreground">{TYPE_LABELS[p.type]}</dd>
          <dt className="text-muted-foreground">נושא</dt><dd className="text-foreground">{PAPER_TOPICS[p.topic]}</dd>
          <dt className="text-muted-foreground">{p.type === 'chapter' ? 'ספר' : 'כתב עת'}</dt><dd className="text-foreground" dir="auto">{p.journal}</dd>
          <dt className="text-muted-foreground">שפה</dt><dd className="text-foreground">{p.language === 'he' ? 'עברית' : 'אנגלית'}</dd>
          {p.doi && <><dt className="text-muted-foreground">DOI</dt><dd><a href={`https://doi.org/${p.doi}`} target="_blank" rel="noreferrer" className="text-primary hover:underline" dir="ltr">{p.doi}</a></dd></>}
          <dt className="text-muted-foreground">מקור הרשומה</dt><dd><ExtLink href={p.sourceUrl}>אתר מטיב</ExtLink></dd>
        </dl>
      )}
    </li>
  );
}

export function Publications() {
  const { PageHeader } = useDemoChrome();
  const [query, setQuery] = useState('');
  const [types, setTypes] = useState(/** @type {string[]} */ ([]));
  const [topics, setTopics] = useState(/** @type {string[]} */ ([]));
  const [periods, setPeriods] = useState(/** @type {string[]} */ ([]));
  const [featured, setFeatured] = useState(/** @type {string[]} */ ([]));
  const [order, setOrder] = useState(/** @type {'desc'|'asc'} */ ('desc'));
  const [sheetOpen, setSheetOpen] = useState(false);

  const q = query.trim().toLowerCase();
  /** @param {import('@/pages/metiv-demos/shared/therapist/research.js').Paper} p @param {string} [skip] */
  const matches = (p, skip) =>
    (!q || [p.title, p.journal, ...p.authors].join(' ').toLowerCase().includes(q)) &&
    (skip === 'type' || !types.length || types.includes(p.type)) &&
    (skip === 'topic' || !topics.length || topics.includes(p.topic)) &&
    (skip === 'period' || !periods.length || PERIODS.some((x) => periods.includes(x.key) && x.test(p.year))) &&
    (skip === 'featured' || !featured.length || Boolean(p.featured));

  const results = useMemo(
    () => PAPERS.filter((p) => matches(p)).sort((a, b) => (order === 'desc' ? (b.year || 0) - (a.year || 0) : (a.year || 9999) - (b.year || 9999))),
    [q, types, topics, periods, featured, order]
  );
  /** @param {string} skip @param {(p: any) => boolean} pred */
  const count = (skip, pred) => PAPERS.filter((p) => matches(p, skip) && pred(p)).length;

  const clearAll = () => { setTypes([]); setTopics([]); setPeriods([]); setFeatured([]); setQuery(''); };
  const chips = [
    ...types.map((k) => ({ key: `t-${k}`, label: TYPE_LABELS[k], onRemove: () => setTypes(toggleIn(types, k)) })),
    ...topics.map((k) => ({ key: `p-${k}`, label: PAPER_TOPICS[k], onRemove: () => setTopics(toggleIn(topics, k)) })),
    ...periods.map((k) => ({ key: `y-${k}`, label: PERIODS.find((x) => x.key === k)?.label || k, onRemove: () => setPeriods(toggleIn(periods, k)) })),
    ...featured.map(() => ({ key: 'f', label: 'נבחרים', onRemove: () => setFeatured([]) })),
    ...(q ? [{ key: 'q', label: `חיפוש: ${query.trim()}`, onRemove: () => setQuery('') }] : []),
  ];

  const facets = (
    <div className="space-y-4">
      <div className="relative">
        <Search aria-hidden="true" className="pointer-events-none absolute start-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
        <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="כותרת, מחבר או כתב עת" aria-label="חיפוש פרסומים" className="h-11 rounded-xl bg-card ps-9 text-base" />
      </div>
      <FacetGroup title="סוג פרסום" options={Object.entries(TYPE_LABELS).map(([key, label]) => ({ key, label, count: count('type', (p) => p.type === key) }))} selected={types} onToggle={(k) => setTypes(toggleIn(types, k))} />
      <FacetGroup title="נושא" options={Object.entries(PAPER_TOPICS).map(([key, label]) => ({ key, label, count: count('topic', (p) => p.topic === key) }))} selected={topics} onToggle={(k) => setTopics(toggleIn(topics, k))} />
      <FacetGroup title="שנה" options={PERIODS.map((x) => ({ key: x.key, label: x.label, count: count('period', (p) => x.test(p.year)) }))} selected={periods} onToggle={(k) => setPeriods(toggleIn(periods, k))} />
      <FacetGroup title="בחירת העורכים" options={[{ key: 'featured', label: 'פרסומים נבחרים', count: count('featured', (p) => Boolean(p.featured)) }]} selected={featured} onToggle={(k) => setFeatured(toggleIn(featured, k))} />
    </div>
  );

  return (
    <div className="bg-background">
      <PageHeader
        tone="card"
        eyebrow="לאנשי מקצוע"
        title="פרסומים"
        subtitle="ספרים, מאמרים ופרקים שכתבו או ערכו אנשי מטיב, כפי שמופיעים באתר מטיב."
        meta={<><span>{BOOKS.length} ספרים</span><span aria-hidden="true">·</span><span>{PAPERS.length} מאמרים ופרקים</span></>}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        <section aria-labelledby="books">
          <SectionTitle id="books" title="ספרים" description={RESEARCH_INTRO.booksOrderingNote} />
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {BOOKS.map((b) => (
              <li key={b.title} className="flex flex-col rounded-super-sm border border-border bg-card p-5">
                <BookOpen aria-hidden="true" className="w-5 h-5 text-primary" />
                <p className="mt-3 font-heading font-semibold leading-snug text-foreground" dir="auto">{b.title}</p>
                <p className="mt-1 text-sm text-muted-foreground" dir="auto">{b.role ? `${b.role} ` : ''}{b.authors.join(', ')}</p>
                <p className="mt-1 flex-1 text-sm text-muted-foreground" dir="auto">{[b.publisher, b.year].filter(Boolean).join(', ')}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Tag>{b.audience === 'public' ? 'לקהל הרחב' : 'לאנשי מקצוע'}</Tag>
                  <Tag>{b.language === 'he' ? 'עברית' : 'אנגלית'}</Tag>
                </div>
                {b.url && <ExtLink href={b.url} className="mt-3 text-sm">לספר</ExtLink>}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="papers" className="mt-14">
          <SectionTitle id="papers" title="מאמרים ופרקים" />
          <div className="grid gap-8 lg:grid-cols-[16.5rem_minmax(0,1fr)]">
            <aside className="hidden lg:block" aria-label="סינון פרסומים">
              <div className="sticky top-[8.5rem] max-h-[calc(100vh-10rem)] overflow-y-auto rounded-super-sm border border-border bg-card p-5">{facets}</div>
            </aside>
            <div className="min-w-0">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="font-medium text-foreground" aria-live="polite">{results.length} פרסומים</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline-subtle" size="none" className="h-10 gap-2 rounded-full bg-card px-4 text-foreground lg:hidden" onClick={() => setSheetOpen(true)}>
                    <SlidersHorizontal aria-hidden="true" /> סינון{chips.length ? ` (${chips.length})` : ''}
                  </Button>
                  <div className="flex rounded-full border border-border bg-card p-1" role="group" aria-label="סדר לפי שנה">
                    <ChoiceChip size="sm" variant="plain" selected={order === 'desc'} onClick={() => setOrder('desc')}>מהחדש</ChoiceChip>
                    <ChoiceChip size="sm" variant="plain" selected={order === 'asc'} onClick={() => setOrder('asc')}>מהישן</ChoiceChip>
                  </div>
                </div>
              </div>
              <ActiveChips chips={chips} onClear={clearAll} />
              {results.length ? (
                <ol className="divide-y divide-border rounded-super-sm border border-border bg-card px-5">
                  {results.map((p) => <Citation key={p.title + p.journal} paper={p} />)}
                </ol>
              ) : (
                <div className="flex flex-col items-center rounded-super-sm border border-dashed border-border bg-card px-6 py-14 text-center">
                  <SearchX aria-hidden="true" className="w-8 h-8 text-muted-foreground" />
                  <p className="mt-3 font-heading text-lg font-semibold text-foreground">לא נמצאו פרסומים</p>
                  <Button variant="solid" radius="full" size="roomy" className="mt-5" onClick={clearAll}>ניקוי הסינון</Button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-super border-border bg-card p-5">
          <SheetTitle className="mb-1 text-start font-heading text-xl">סינון פרסומים</SheetTitle>
          <SheetDescription className="mb-4 text-start">{results.length} פרסומים</SheetDescription>
          {facets}
          <div className="sticky bottom-0 mt-6 flex gap-2 bg-card pt-3">
            <Button variant="solid" radius="full" size="roomy" className="flex-1" onClick={() => setSheetOpen(false)}>הצגת {results.length} פרסומים</Button>
            <Button variant="subtle" radius="full" size="roomy" onClick={clearAll}>ניקוי</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
