import React from 'react';
import { ExternalLink, Globe, BookOpen } from 'lucide-react';
import { useDemoChrome } from '@/pages/metiv-demos/shared/DemoChrome';
import { tx, txOptional, SITE_NAME } from '../copy';
import { getSources } from '../staticData';
import { METIV_BOOKS, METIV_BOOKS_ORDER_NOTE, ADDITION_ANCHORS } from '../additions';

const CATEGORY_COLORS = {
  research: 'bg-category-1/10 text-category-1',
  clinical: 'bg-category-2/10 text-category-2',
  official: 'bg-category-3/10 text-category-3',
  ngo: 'bg-category-4/10 text-category-4',
  international: 'bg-category-5/10 text-category-5',
};

export default function Sources() {
  const { PageHeader } = useDemoChrome();
  const sources = getSources();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        size="default"
        align="start"
        tone="canvas"
        eyebrow={tx('sources')}
        title={tx('sources_title')}
        subtitle={tx('sources_subtitle')}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-primary/5 border border-primary/20 rounded-super p-5 mb-8">
          <p className="text-foreground leading-relaxed">
            {tx('sources_approved_prefix')} {SITE_NAME}.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sources.map((source, i) => (
            <div key={i} className="bg-card rounded-super border border-border p-5 shadow-card hover:shadow-card-hover transition-natural hover:border-primary/30 flex flex-col">
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[source.category] || 'bg-muted text-muted-foreground'}`}>
                  {txOptional('source_cat_' + source.category) || source.category}
                </span>
                {source.year && <span className="text-xs text-muted-foreground">{source.year}</span>}
              </div>

              <h3 className="font-heading font-semibold text-foreground text-sm leading-snug mb-2 flex-1" dir="auto">
                {source.title}
              </h3>

              {source.authors && (
                <p className="text-xs text-muted-foreground mb-2" dir="auto">{source.authors}</p>
              )}

              {source.description_he && (
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  {source.description_he}
                </p>
              )}

              {source.url && (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-natural mt-auto"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {tx('source_link')}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Metiv addition 6: books by Metiv staff */}
        <section id={ADDITION_ANCHORS.metivBooks} className="scroll-mt-24 mt-16">
          <h2 className="font-heading font-semibold text-2xl text-foreground mb-2">ספרים של אנשי מטיב</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            ספרים שכתבו או ערכו אנשי מטיב. {METIV_BOOKS_ORDER_NOTE}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {METIV_BOOKS.map((book) => (
              <div key={book.title} className="bg-card rounded-super border border-border p-5 shadow-card flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                    <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                    ספר · {book.language}
                  </span>
                  <span className="text-xs text-muted-foreground">{book.year}</span>
                </div>
                <h3 className="font-heading font-semibold text-foreground text-sm leading-snug mb-2 flex-1" dir="ltr" lang="en">
                  {book.title}
                </h3>
                <p className="text-xs text-muted-foreground mb-3" dir="auto">
                  {book.authors} · {book.publisher}
                </p>
                <a
                  href={book.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-natural mt-auto"
                >
                  <Globe className="w-3.5 h-3.5" />
                  לעמוד הספר
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
