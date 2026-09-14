import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Search, SlidersHorizontal, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '../components/ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '../components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui';
import { DemoLink, useDemoChrome } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { COURSES, COURSE_CATEGORIES, THERAPIST_HUB } from '@/pages/metiv-demos/shared/therapist';
import { StatusPill, registrationPill, ExtLink } from '../components/primitives';
import { FacetGroup, ActiveChips, toggleIn } from '../components/Facets';
import { FORMAT_LABELS, STATUS_LABELS, formatKeys, statusOf, hasCredits, categoryLabel, dateOf, byStatusThenDate } from '../lib/courses';

/** @typedef {'status'|'date'|'title'} SortKey */

const SORT_LABELS = { status: 'מצב הרשמה', date: 'מועד פתיחה', title: 'שם (א-ת)' };

export default function Courses() {
  const { PageHeader } = useDemoChrome();
  const [query, setQuery] = useState('');
  const [cats, setCats] = useState(/** @type {string[]} */ ([]));
  const [formats, setFormats] = useState(/** @type {string[]} */ ([]));
  const [statuses, setStatuses] = useState(/** @type {string[]} */ ([]));
  const [creditsOnly, setCreditsOnly] = useState(/** @type {string[]} */ ([]));
  const [sort, setSort] = useState(/** @type {{ key: SortKey, dir: 'asc'|'desc' }} */ ({ key: 'status', dir: 'asc' }));
  const [sheetOpen, setSheetOpen] = useState(false);

  const q = query.trim();
  /** @param {import('../lib/courses').Course} c @param {string} [skip] */
  const matches = (c, skip) =>
    (!q || [c.title, c.subtitle, c.summary, ...(c.tags || [])].join(' ').includes(q)) &&
    (skip === 'cat' || !cats.length || cats.includes(c.category)) &&
    (skip === 'format' || !formats.length || formatKeys(c).some((k) => formats.includes(k))) &&
    (skip === 'status' || !statuses.length || statuses.includes(statusOf(c))) &&
    (skip === 'credits' || !creditsOnly.length || hasCredits(c));

  const results = useMemo(() => {
    const list = COURSES.filter((c) => matches(c));
    const dir = sort.dir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      if (sort.key === 'title') return dir * a.title.localeCompare(b.title, 'he');
      if (sort.key === 'date') return dir * dateOf(a).localeCompare(dateOf(b));
      return dir * byStatusThenDate(a, b);
    });
    return list;
  }, [q, cats, formats, statuses, creditsOnly, sort]);

  /** @param {string} skip @param {(c: any) => boolean} pred */
  const count = (skip, pred) => COURSES.filter((c) => matches(c, skip) && pred(c)).length;

  const facets = (
    <div className="space-y-4">
      <FacetGroup
        title="תחום"
        options={COURSE_CATEGORIES.map((c) => ({ key: c.key, label: c.label, count: count('cat', (x) => x.category === c.key) }))}
        selected={cats}
        onToggle={(k) => setCats(toggleIn(cats, k))}
      />
      <FacetGroup
        title="פורמט"
        options={Object.entries(FORMAT_LABELS).map(([key, label]) => ({ key, label, count: count('format', (x) => formatKeys(x).includes(key)) }))}
        selected={formats}
        onToggle={(k) => setFormats(toggleIn(formats, k))}
      />
      <FacetGroup
        title="מצב הרשמה"
        options={Object.entries(STATUS_LABELS).map(([key, label]) => ({ key, label, count: count('status', (x) => statusOf(x) === key) }))}
        selected={statuses}
        onToggle={(k) => setStatuses(toggleIn(statuses, k))}
      />
      <FacetGroup
        title="הכרה וגמול"
        options={[{ key: 'credits', label: 'עם הכרה או גמול השתלמות', count: count('credits', hasCredits) }]}
        selected={creditsOnly}
        onToggle={(k) => setCreditsOnly(toggleIn(creditsOnly, k))}
      />
    </div>
  );

  const clearAll = () => { setCats([]); setFormats([]); setStatuses([]); setCreditsOnly([]); setQuery(''); };
  const chips = [
    ...cats.map((k) => ({ key: `c-${k}`, label: categoryLabel(k), onRemove: () => setCats(toggleIn(cats, k)) })),
    ...formats.map((k) => ({ key: `f-${k}`, label: FORMAT_LABELS[k], onRemove: () => setFormats(toggleIn(formats, k)) })),
    ...statuses.map((k) => ({ key: `s-${k}`, label: STATUS_LABELS[k], onRemove: () => setStatuses(toggleIn(statuses, k)) })),
    ...creditsOnly.map((k) => ({ key: `r-${k}`, label: 'עם הכרה או גמול', onRemove: () => setCreditsOnly([]) })),
    ...(q ? [{ key: 'q', label: `חיפוש: ${q}`, onRemove: () => setQuery('') }] : []),
  ];
  const activeCount = chips.length;

  /** @param {SortKey} key */
  const toggleSort = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  /** @param {SortKey} key */
  const ariaSort = (key) => (sort.key === key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none');
  /** @param {SortKey} key */
  const SortIcon = (key) => (sort.key !== key ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown);

  /** @param {{ k: SortKey, children: React.ReactNode }} props */
  const SortHead = ({ k, children }) => {
    const I = SortIcon(k);
    return (
      <TableHead aria-sort={ariaSort(k)} className="text-start">
        <Button variant="quiet" size="none" onClick={() => toggleSort(k)} className="-ms-1 gap-1 rounded px-1 py-1 font-semibold text-foreground">
          {children}
          <I aria-hidden="true" className="!size-3.5" />
        </Button>
      </TableHead>
    );
  };

  const searchBox = (
    <div className="relative">
      <Search aria-hidden="true" className="pointer-events-none absolute start-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="חיפוש לפי שם או נושא"
        aria-label="חיפוש קורסים"
        className="h-11 rounded-xl bg-card ps-9 text-base"
      />
    </div>
  );

  return (
    <div className="bg-background">
      <PageHeader
        tone="card"
        eyebrow="לאנשי מקצוע"
        title="קורסים והכשרות"
        subtitle="כל התכניות של מטיב במקום אחד: קורסים לטיפול בטראומה במבוגרים, הכשרות בתחום הילדים והמשפחה ותכניות לארגונים."
        meta={
          <>
            <span>{COURSES.length} תכניות</span>
            <span aria-hidden="true">·</span>
            <span>{COURSES.filter((c) => statusOf(c) === 'open').length} פתוחות להרשמה</span>
          </>
        }
      />

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[16.5rem_minmax(0,1fr)] lg:py-10">
        <aside className="hidden lg:block" aria-label="סינון קורסים">
          <div className="sticky top-[8.5rem] space-y-5 rounded-super-sm border border-border bg-card p-5">
            {searchBox}
            {facets}
            {activeCount > 0 && <Button variant="subtle" size="xs" className="w-full" onClick={clearAll}>ניקוי כל הסינונים</Button>}
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="font-medium text-foreground" aria-live="polite">
              {results.length} תוצאות
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline-subtle" size="none" className="h-10 gap-2 rounded-full bg-card px-4 text-foreground lg:hidden" onClick={() => setSheetOpen(true)}>
                <SlidersHorizontal aria-hidden="true" /> סינון{activeCount ? ` (${activeCount})` : ''}
              </Button>
              <Select value={`${sort.key}:${sort.dir}`} onValueChange={(v) => { const [key, dir] = v.split(':'); setSort({ key: /** @type {SortKey} */ (key), dir: dir === 'desc' ? 'desc' : 'asc' }); }}>
                <SelectTrigger aria-label="מיון" className="h-10 w-48 rounded-full bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status:asc">מיון: {SORT_LABELS.status}</SelectItem>
                  <SelectItem value="date:desc">מיון: מועד, מהחדש</SelectItem>
                  <SelectItem value="date:asc">מיון: מועד, מהישן</SelectItem>
                  <SelectItem value="title:asc">מיון: {SORT_LABELS.title}</SelectItem>
                  <SelectItem value="title:desc">מיון: שם (ת-א)</SelectItem>
                  <SelectItem value="status:desc">מיון: מצב הרשמה, הפוך</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <ActiveChips chips={chips} onClear={clearAll} />

          {results.length === 0 ? (
            <div className="flex flex-col items-center rounded-super-sm border border-dashed border-border bg-card px-6 py-14 text-center">
              <SearchX aria-hidden="true" className="w-8 h-8 text-muted-foreground" />
              <p className="mt-3 font-heading text-lg font-semibold text-foreground">לא נמצאו תכניות שמתאימות לסינון</p>
              <p className="mt-1 text-muted-foreground">אפשר להסיר חלק מהסינונים או לפנות אלינו בטופס.</p>
              <Button variant="solid" radius="full" size="roomy" className="mt-5" onClick={clearAll}>ניקוי הסינון</Button>
            </div>
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-super-sm border border-border bg-card md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted hover:bg-muted">
                      <SortHead k="title">תכנית</SortHead>
                      <TableHead className="text-start font-semibold text-foreground">פורמט</TableHead>
                      <SortHead k="date">פתיחה</SortHead>
                      <TableHead className="text-start font-semibold text-foreground">היקף</TableHead>
                      <TableHead className="text-start font-semibold text-foreground">מחיר</TableHead>
                      <SortHead k="status">סטטוס</SortHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((c) => {
                      const pill = registrationPill(statusOf(c));
                      return (
                        <TableRow key={c.slug} className="align-top">
                          <TableCell className="max-w-[22rem] py-3.5">
                            <p className="text-xs font-medium text-muted-foreground">{categoryLabel(c.category)}</p>
                            <DemoLink to={`${ROUTES.courses}/${c.slug}`} className="mt-0.5 block font-heading text-base font-semibold leading-snug text-foreground hover:text-primary hover:underline">
                              {c.title}
                            </DemoLink>
                            <p className="mt-0.5 text-sm leading-snug text-muted-foreground line-clamp-2">{c.summary}</p>
                          </TableCell>
                          <TableCell className="py-3.5 text-sm text-foreground">{formatKeys(c).map((k) => FORMAT_LABELS[k]).join(', ')}</TableCell>
                          <TableCell className="whitespace-nowrap py-3.5 text-sm text-foreground">
                            {c.startDate || 'יפורסם'}
                            {c.isPast && <span className="block text-xs text-muted-foreground">התקיים</span>}
                          </TableCell>
                          <TableCell className="py-3.5 text-sm text-foreground">{c.duration || c.hours || '-'}</TableCell>
                          <TableCell className="py-3.5 text-sm text-foreground">{c.price || '-'}</TableCell>
                          <TableCell className="py-3.5"><StatusPill tone={pill.tone}>{pill.label}</StatusPill></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <ul className="space-y-3 md:hidden">
                {results.map((c) => {
                  const pill = registrationPill(statusOf(c));
                  return (
                    <li key={c.slug} className="rounded-super-sm border border-border bg-card p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-medium text-muted-foreground">{categoryLabel(c.category)}</span>
                        <StatusPill tone={pill.tone}>{pill.label}</StatusPill>
                      </div>
                      <DemoLink to={`${ROUTES.courses}/${c.slug}`} className="mt-1.5 block font-heading text-lg font-semibold leading-snug text-foreground">
                        {c.title}
                      </DemoLink>
                      <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
                        <div><dt className="text-xs text-muted-foreground">פתיחה</dt><dd className="text-foreground">{c.startDate || 'יפורסם'}</dd></div>
                        <div><dt className="text-xs text-muted-foreground">פורמט</dt><dd className="text-foreground">{FORMAT_LABELS[formatKeys(c)[0]]}</dd></div>
                        <div><dt className="text-xs text-muted-foreground">מחיר</dt><dd className="text-foreground">{c.price || '-'}</dd></div>
                      </dl>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          <div className="mt-8 flex flex-col gap-3 rounded-super-sm bg-muted p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-foreground">לא מצאתם את מה שחיפשתם? אפשר לבקש הכשרה או הדרכה בהתאמה.</p>
            <ExtLink href={THERAPIST_HUB.cta.url}>{THERAPIST_HUB.cta.label}</ExtLink>
          </div>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-super border-border bg-card p-5">
          <SheetTitle className="mb-1 text-start font-heading text-xl">סינון קורסים</SheetTitle>
          <SheetDescription className="mb-4 text-start">{results.length} תוצאות</SheetDescription>
          <div className="space-y-5">
            {searchBox}
            {facets}
          </div>
          <div className="sticky bottom-0 mt-6 flex gap-2 bg-card pt-3">
            <Button variant="solid" radius="full" size="roomy" className="flex-1" onClick={() => setSheetOpen(false)}>
              הצגת {results.length} תוצאות
            </Button>
            <Button variant="subtle" radius="full" size="roomy" onClick={clearAll}>ניקוי</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
