import React from 'react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { useSources } from '@/api/hooks';
import PageHeader from '@/components/PageHeader';
import { BookOpen, ExternalLink, Globe } from 'lucide-react';

const CATEGORY_COLORS = {
  research: 'bg-teal/10 text-teal',
  clinical: 'bg-clay/10 text-clay',
  official: 'bg-secondary/10 text-secondary',
  ngo: 'bg-teal/10 text-teal',
  international: 'bg-clay/10 text-clay',
};

export default function Sources() {
  const { lang } = useLang();
  const { data: sources = [], isLoading, error } = useSources();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader icon={BookOpen} title={t(lang, 'sources_title')} subtitle={t(lang, 'sources_subtitle')} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        {isLoading && <p className="text-center text-muted-foreground">{t(lang, 'loading')}</p>}
        {error && <p className="text-center text-muted-foreground">{t(lang, 'content_error')}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sources.map((source, i) => (
            <div key={i} className="bg-card rounded-super border border-border p-5 shadow-card hover:shadow-card-hover transition-natural hover:border-primary/30 flex flex-col">
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[source.category] || 'bg-muted text-muted-foreground'}`}>
                  {t(lang, 'source_cat_' + source.category) || source.category}
                </span>
                {source.year && <span className="text-xs text-muted-foreground">{source.year}</span>}
              </div>

              <h3 className="font-heading font-bold text-foreground text-sm leading-snug mb-2 flex-1">
                {source.title}
              </h3>

              {source.authors && (
                <p className="text-xs text-muted-foreground mb-2">{source.authors}</p>
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
                  {t(lang, 'source_link')}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}