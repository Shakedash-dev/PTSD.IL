import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IMAGES } from '@/lib/images';
import { DemoLink, DemoMarkdown, useDemoPath } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { ARTICLES, getArticle, PAPERS, UPCOMING_EVENTS } from '@/pages/metiv-demos/shared/therapist';
import { PageHeaderV1 } from '../components/Chrome';
import {
  Arch,
  ArchGlyph,
  ArrowLink,
  Chapter,
  CONTAINER,
  FOCUS,
  READING,
  useV1Title,
} from '../components/primitives';

export default function ArticlesPage() {
  useV1Title('מאמרים');
  const [lead, ...rest] = ARTICLES;
  const papers = PAPERS.filter((p) => p.featured).slice(0, 5);

  return (
    <>
      <PageHeaderV1
        size="editorial"
        align="start"
        tone="canvas"
        eyebrow="לאנשי טיפול ומקצוע"
        title="מאמרים"
        subtitle="כתיבה מקצועית של צוות מטיב על טיפול בטראומה."
      />

      <Chapter rule={false}>
        <div className="grid gap-14 lg:grid-cols-12">
          {lead && (
            <article className="group grid gap-8 md:grid-cols-12 lg:col-span-8">
              <DemoLink to={`/therapist/articles/${lead.slug}`} tabIndex={-1} aria-hidden="true" className="md:col-span-5">
                <Arch src={IMAGES.calming_main} className="w-full" imgClassName="group-hover:scale-[1.03]" />
              </DemoLink>
              <div className="md:col-span-7 md:pt-8">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground">
                  {(lead.tags || []).join(' · ')}
                </p>
                <h2 className="mt-4 font-heading text-4xl font-light leading-[1.08] tracking-tight text-foreground md:text-6xl">
                  <DemoLink to={`/therapist/articles/${lead.slug}`} className={cn('rounded-sm transition-colors hover:text-primary', FOCUS)}>
                    {lead.title}
                  </DemoLink>
                </h2>
                <p className="mt-5 text-lg leading-relaxed text-muted-foreground md:text-xl">{lead.excerpt}</p>
                <p className="mt-6 text-sm text-muted-foreground">
                  {lead.authors.join(' ו')} · {lead.date} · {lead.readingMinutes} דקות קריאה
                </p>
                <ArrowLink to={`/therapist/articles/${lead.slug}`} className="mt-6">לקריאת המאמר</ArrowLink>
              </div>
            </article>
          )}

          <aside className="lg:col-span-4 lg:border-s lg:border-border lg:ps-10">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground">עוד לקריאה</p>
            <ul className="mt-3">
              {rest.map((a) => (
                <li key={a.slug} className="border-b border-border py-4">
                  <DemoLink to={`/therapist/articles/${a.slug}`} className="font-heading text-xl text-foreground hover:text-primary">{a.title}</DemoLink>
                </li>
              ))}
              {papers.map((p) => (
                <li key={p.title} className="border-b border-border py-4">
                  <p dir="ltr" lang="en" className="text-startfont-medium leading-snug text-foreground">{p.title}</p>
                  <p dir="ltr" lang="en" className="mt-1 text-start text-sm text-muted-foreground">{p.journal}{p.year ? `, ${p.year}` : ''}</p>
                </li>
              ))}
            </ul>
            <ArrowLink to={ROUTES.publications} className="mt-5 text-sm">לכל הפרסומים</ArrowLink>
            {UPCOMING_EVENTS.length > 0 && (
              <>
                <p className="mt-12 text-xs font-semibold tracking-wide text-muted-foreground">ביומן</p>
                <ul className="mt-3">
                  {UPCOMING_EVENTS.map((e) => (
                    <li key={e.slug} className="border-b border-border py-4">
                      <p className="text-sm text-muted-foreground">{e.date}</p>
                      <p className="mt-1 text-foreground">{e.title}</p>
                    </li>
                  ))}
                </ul>
                <ArrowLink to={ROUTES.events} className="mt-5 text-sm">לכל האירועים</ArrowLink>
              </>
            )}
          </aside>
        </div>
        {rest.length === 0 && (
          <p className="mt-16 border-t border-border pt-6 text-sm text-muted-foreground">מאמרים נוספים של צוות מטיב יתווספו כאן.</p>
        )}
      </Chapter>
    </>
  );
}

export function ArticlePage() {
  const { slug } = useParams();
  const resolve = useDemoPath();
  const article = getArticle(slug || '');
  useV1Title(article?.title || 'מאמר');
  if (!article) return <Navigate to={resolve(ROUTES.articles)} replace />;

  return (
    <article className="bg-background">
      <header className={cn(CONTAINER, 'pb-10 pt-10 md:pb-16 md:pt-16')}>
        <DemoLink to={ROUTES.articles} className={cn('inline-flex items-center gap-2 rounded-sm text-sm text-muted-foreground hover:text-primary', FOCUS)}>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
          מאמרים
        </DemoLink>
        <div className="mx-auto mt-10 max-w-4xl text-center md:mt-16">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground">{(article.tags || []).join(' · ')}</p>
          <h1 className="mt-5 font-heading text-[2.8rem] font-light leading-[1.04] tracking-tight text-foreground sm:text-7xl lg:text-8xl">
            {article.title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">{article.excerpt}</p>
          <div className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-4 gap-y-1 border-y border-border py-4 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{article.authors.join(' ו')}</span>
            {article.authorsAffiliation && <span>{article.authorsAffiliation}</span>}
            <span>{article.date}</span>
            <span>{article.readingMinutes} דקות קריאה</span>
          </div>
        </div>
      </header>

      <div className={cn(CONTAINER, 'pb-16 md:pb-24')}>
        <DemoMarkdown className={cn(READING, 'rich-content text-lg leading-[1.9] text-foreground md:text-xl md:leading-[1.9]')}>
          {article.body}
        </DemoMarkdown>
        <div className={cn(READING, 'mt-14 border-t border-border pt-8')}>
          <ArchGlyph className="mb-6 text-secondary" />
          <p className="text-sm text-muted-foreground">
            מאמר דעה של אנשי מטיב, כפי שפורסם באתר מטיב.{' '}
            <ArrowLink to={article.sourceUrl} className="text-sm">למקור</ArrowLink>
          </p>
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
            <ArrowLink to={ROUTES.articles}>לכל המאמרים</ArrowLink>
            <ArrowLink to={ROUTES.publications}>לפרסומים של אנשי מטיב</ArrowLink>
          </div>
        </div>
      </div>
    </article>
  );
}
