import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarDays, Clock, MapPin, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Disclosure from '@/components/patterns/Disclosure';
import ChoiceChip from '@/components/patterns/ChoiceChip';
import { DemoLink, DemoMarkdown, useDemoChrome } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { ARTICLES, getArticle, UPCOMING_EVENTS, PAST_EVENTS, EVENTS } from '@/pages/metiv-demos/shared/therapist';
import ContentLayout from '../components/ContentLayout';
import { StatusPill, ExtLink, SectionTitle, Tag } from '../components/primitives';
import { THERAPIST_RAIL } from '../lib/nav';

const ARTICLE_BODY =
  'rich-content text-lg leading-[1.85] text-foreground [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-8 [&_h3]:mb-2 [&_h3]:font-heading [&_h3]:text-xl [&_h3]:font-semibold [&_strong]:font-semibold [&_li]:my-2';

// ── Articles ────────────────────────────────────────────────────────────────

export function Articles() {
  const { PageHeader } = useDemoChrome();
  return (
    <div className="bg-background">
      <PageHeader tone="card" eyebrow="לאנשי מקצוע" title="מאמרים" subtitle="כתיבה מקצועית ומאמרי דעה של צוות מטיב." meta={<span>{ARTICLES.length} מאמרים</span>} />
      <ContentLayout rail={THERAPIST_RAIL} railTitle="לאנשי מקצוע">
        {ARTICLES.length ? (
          <ul className="space-y-4">
            {ARTICLES.map((a) => (
              <li key={a.slug}>
                <article className="rounded-super-sm border border-border bg-card p-5 sm:p-7">
                  <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5"><CalendarDays aria-hidden="true" className="w-4 h-4" /> {a.date}</span>
                    <span className="inline-flex items-center gap-1.5"><Clock aria-hidden="true" className="w-4 h-4" /> {a.readingMinutes} דקות קריאה</span>
                  </p>
                  <h2 className="mt-2 font-heading text-2xl font-semibold text-foreground">
                    <DemoLink to={`${ROUTES.articles}/${a.slug}`} className="hover:text-primary hover:underline underline-offset-4">{a.title}</DemoLink>
                  </h2>
                  <p className="mt-1 text-foreground">{a.authors.join(' ו')}{a.authorsAffiliation ? `, ${a.authorsAffiliation}` : ''}</p>
                  <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">{a.excerpt}</p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-1.5">{(a.tags || []).map((t) => <Tag key={t}>{t}</Tag>)}</div>
                    <DemoLink to={`${ROUTES.articles}/${a.slug}`} className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
                      לקריאת המאמר <ArrowLeft aria-hidden="true" className="w-4 h-4" />
                    </DemoLink>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-super-sm border border-dashed border-border bg-card p-10 text-center text-muted-foreground">עדיין אין מאמרים.</p>
        )}
        <p className="mt-6 text-sm text-muted-foreground">
          מחפשים מחקרים שפורסמו בכתבי עת? <DemoLink to={ROUTES.publications} className="font-medium text-primary hover:underline">לרשימת הפרסומים</DemoLink>
        </p>
      </ContentLayout>
    </div>
  );
}

export function Article() {
  const { PageHeader } = useDemoChrome();
  const { slug = '' } = useParams();
  const article = getArticle(slug);
  const bodyRef = useRef(/** @type {HTMLDivElement|null} */ (null));
  const [toc, setToc] = useState(/** @type {{ id: string, label: string }[]} */ ([]));

  // Markdown headings have no ids: assign them after render and build the table of contents.
  useEffect(() => {
    const root = bodyRef.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll('h2, h3')).map((el, i) => {
      if (!el.id) el.id = `section-${i + 1}`;
      return { id: el.id, label: (el.textContent || '').replace(/["״]/g, '').trim() };
    });
    setToc(items);
  }, [slug]);

  if (!article) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h1 className="font-heading text-3xl font-semibold text-foreground">המאמר לא נמצא</h1>
        <Button asChild variant="solid" radius="full" size="roomy" className="mt-6">
          <DemoLink to={ROUTES.articles}>לכל המאמרים</DemoLink>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <PageHeader
        tone="card"
        eyebrow="מאמר דעה"
        title={article.title}
        subtitle={article.excerpt}
        meta={
          <>
            <span className="font-medium text-foreground">{article.authors.join(' ו')}</span>
            {article.authorsAffiliation && <span>{article.authorsAffiliation}</span>}
            <span aria-hidden="true">·</span>
            <span>{article.date}</span>
            <span aria-hidden="true">·</span>
            <span>{article.readingMinutes} דקות קריאה</span>
          </>
        }
      />
      <ContentLayout rail={THERAPIST_RAIL} railTitle="לאנשי מקצוע" toc={toc}>
        <article className="max-w-[44rem]">
          <div ref={bodyRef}>
            <DemoMarkdown className={ARTICLE_BODY}>{article.body}</DemoMarkdown>
          </div>
          <footer className="mt-10 space-y-4 border-t border-border pt-6">
            <div className="flex flex-wrap gap-1.5">{(article.tags || []).map((t) => <Tag key={t}>{t}</Tag>)}</div>
            <p className="text-sm text-muted-foreground">המאמר מובא כפי שפורסם. <ExtLink href={article.sourceUrl}>המקור באתר מטיב</ExtLink></p>
            <DemoLink to={ROUTES.articles} className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
              <ArrowRight aria-hidden="true" className="w-4 h-4" /> לכל המאמרים
            </DemoLink>
          </footer>
        </article>
      </ContentLayout>
    </div>
  );
}

// ── Events ──────────────────────────────────────────────────────────────────

/** @param {{ event: import('@/pages/metiv-demos/shared/therapist/articles.js').MetivEvent }} props */
function EventRow({ event: e }) {
  const [y, m, d] = (e.dateISO || '').split('-');
  return (
    <li className="grid grid-cols-[4.25rem_minmax(0,1fr)] gap-4 p-4 sm:grid-cols-[5rem_minmax(0,1fr)] sm:p-5">
      <div className="flex h-fit flex-col items-center rounded-xl bg-muted py-2.5 text-center" aria-hidden="true">
        <span className="font-heading text-xl font-semibold leading-none text-foreground">{d ? Number(d) : ''}.{m ? Number(m) : ''}</span>
        <span className="mt-1 text-xs text-muted-foreground">{y}</span>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Tag>{e.type}</Tag>
          {e.isPast ? <StatusPill tone="neutral">התקיים</StatusPill> : <StatusPill tone="info">קרוב</StatusPill>}
        </div>
        <h3 className="mt-1.5 font-heading text-lg font-semibold leading-snug text-foreground">{e.title}</h3>
        <p className="mt-1 leading-relaxed text-foreground">{e.summary}</p>
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1"><CalendarDays aria-hidden="true" className="w-3.5 h-3.5" /> {e.date}</span>
          {e.location && <span className="inline-flex items-center gap-1"><MapPin aria-hidden="true" className="w-3.5 h-3.5" /> {e.location}</span>}
          {e.price && <span className="inline-flex items-center gap-1"><Wallet aria-hidden="true" className="w-3.5 h-3.5" /> {e.price}</span>}
        </p>
        {e.body && (
          <Disclosure className="mt-3" variant="plain" size="tight" label="פרטים נוספים">
            <DemoMarkdown className="rich-content text-sm text-foreground [&_strong]:font-semibold">{e.body}</DemoMarkdown>
          </Disclosure>
        )}
        {e.link && (
          <div className="mt-3 text-sm">
            {e.external ? (
              <ExtLink href={e.link}>לפרטים באתר מטיב</ExtLink>
            ) : (
              <DemoLink to={e.link} className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
                {e.courseSlug ? 'לעמוד התכנית' : 'לפרטים'} <ArrowLeft aria-hidden="true" className="w-4 h-4" />
              </DemoLink>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export function Events() {
  const { PageHeader } = useDemoChrome();
  const types = [...new Set(EVENTS.map((e) => e.type))];
  const [type, setType] = useState('all');
  /** @param {typeof EVENTS} list */
  const filter = (list) => list.filter((e) => type === 'all' || e.type === type);
  const upcoming = filter(UPCOMING_EVENTS);
  const past = filter(PAST_EVENTS);
  const years = [...new Set(past.map((e) => (e.dateISO || '').slice(0, 4)))];

  return (
    <div className="bg-background">
      <PageHeader
        tone="card"
        eyebrow="לאנשי מקצוע"
        title="אירועים ועדכונים"
        subtitle="מחזורי קורסים, סדנאות, כנסים וחדשות, קרובים ושהתקיימו."
        meta={<><span>{UPCOMING_EVENTS.length} קרובים</span><span aria-hidden="true">·</span><span>{PAST_EVENTS.length} שהתקיימו</span></>}
      />
      <ContentLayout rail={THERAPIST_RAIL} railTitle="לאנשי מקצוע" toc={[{ id: 'upcoming', label: 'אירועים קרובים' }, { id: 'past', label: 'ארכיון' }]}>
        <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="סינון לפי סוג">
          <ChoiceChip size="sm" selected={type === 'all'} onClick={() => setType('all')}>הכל</ChoiceChip>
          {types.map((t) => (
            <ChoiceChip key={t} size="sm" selected={type === t} onClick={() => setType(t)}>{t}</ChoiceChip>
          ))}
        </div>

        <section aria-labelledby="upcoming">
          <SectionTitle id="upcoming" title="אירועים קרובים" />
          {upcoming.length ? (
            <ul className="divide-y divide-border rounded-super-sm border border-border bg-card">{upcoming.map((e) => <EventRow key={e.slug} event={e} />)}</ul>
          ) : (
            <p className="rounded-super-sm border border-dashed border-border bg-card p-8 text-center text-muted-foreground">אין אירועים קרובים מסוג זה. מועדים חדשים יפורסמו כאן.</p>
          )}
        </section>

        <section aria-labelledby="past" className="mt-14">
          <SectionTitle id="past" title="ארכיון" description="אירועים ומחזורים שהתקיימו." />
          {past.length ? (
            <div className="space-y-8">
              {years.map((yr) => (
                <div key={yr}>
                  <h3 className="mb-3 flex items-center gap-3 font-heading text-lg font-semibold text-foreground">
                    {yr}
                    <span aria-hidden="true" className="h-px flex-1 bg-border" />
                  </h3>
                  <ul className="divide-y divide-border rounded-super-sm border border-border bg-card">
                    {past.filter((e) => (e.dateISO || '').startsWith(yr)).map((e) => <EventRow key={e.slug} event={e} />)}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-super-sm border border-dashed border-border bg-card p-8 text-center text-muted-foreground">אין אירועים בארכיון מסוג זה.</p>
          )}
        </section>
      </ContentLayout>
    </div>
  );
}
