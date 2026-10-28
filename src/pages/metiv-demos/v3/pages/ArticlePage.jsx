import React from 'react';
import { useParams } from 'react-router-dom';
import { ArrowRight, Clock, PenLine } from 'lucide-react';
import { DemoLink, DemoMarkdown } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { cn } from '@/lib/utils';
import PageHeaderV3 from '../components/PageHeaderV3';
import { Band, EmptyState, ExternalLink, FWD, PILL_OUTLINE, PILL_SOLID, StatusPill, TEXT_LINK } from '../components/kit';
import { fmt, useCopy, useMetiv } from '../content/MetivContent';

export default function ArticlePage() {
  const { getArticle } = useMetiv();
  const c = useCopy('articlePage');
  const { slug = '' } = useParams();
  const article = getArticle(slug);

  if (!article) {
    return (
      <div className="bg-background">
        <PageHeaderV3 tone="muted" title={c.notFoundTitle} short={[]} />
        <Band tone="canvas" width="default">
          <EmptyState title={c.notFoundEmpty} action={<DemoLink to={ROUTES.articles} className={PILL_SOLID}>{c.allArticles}</DemoLink>} />
        </Band>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <PageHeaderV3
        tone="muted"
        eyebrow={c.eyebrow}
        title={article.title}
        subtitle={article.excerpt}
        meta={
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-foreground">
            <span className="inline-flex items-center gap-1.5"><PenLine className="w-4 h-4 text-accent" aria-hidden="true" />{article.authors.join(c.authorsJoin)}{article.authorsAffiliation && <span className="text-muted-foreground">, {article.authorsAffiliation}</span>}</span>
            <span>{article.date}</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4 text-accent" aria-hidden="true" />{fmt(c.readingMinutes, { n: article.readingMinutes })}</span>
          </div>
        }
        short={[]}
      />
      <article className="max-w-[40rem] mx-auto px-5 sm:px-6 py-12 sm:py-16">
        {article.tags?.length > 0 && (
          <ul className="mb-8 flex flex-wrap gap-2">{article.tags.map((/** @type {string} */ t, /** @type {number} */ i) => <li key={i}><StatusPill tone="primary">{t}</StatusPill></li>)}</ul>
        )}
        <DemoMarkdown className="rich-content text-lg text-foreground leading-8">{article.body}</DemoMarkdown>
        <div className="mt-12 pt-6 border-t border-border flex flex-wrap items-center justify-between gap-4">
          <DemoLink to={ROUTES.articles} className={PILL_OUTLINE}>
            <ArrowRight className={cn('w-4 h-4', FWD)} aria-hidden="true" /> {c.allArticles}
          </DemoLink>
          <ExternalLink href={article.sourceUrl} className={cn('text-sm', TEXT_LINK)}>{c.onMetivSite}</ExternalLink>
        </div>
      </article>
    </div>
  );
}
