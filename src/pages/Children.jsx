import React, { useState } from 'react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { useChildrenContent } from '@/api/hooks';
import PageHeader from '@/components/PageHeader';
import { Baby, BookOpen, Video, Download, Star, ChevronDown, ExternalLink } from 'lucide-react';
import { IMAGES } from '@/lib/images';
import ValidatableContent from '@/components/ValidatableContent';

const AGE_TABS = [
  { key: '0-4', labelKey: 'age_until4' },
  { key: '4-6', labelKey: 'age_4_6' },
  { key: '7-10', labelKey: 'age_7_10' },
  { key: '10-13', labelKey: 'age_10_13' },
  { key: '14-16', labelKey: 'age_14_16' },
  { key: '16+', labelKey: 'age_16plus' },
];

const RESOURCE_ICONS = {
  book: BookOpen,
  video: Video,
  download: Download,
  story: Star,
  activity: Baby,
};

export default function Children() {
  const { lang } = useLang();
  const [activeAge, setActiveAge] = useState('0-4');
  const [openResource, setOpenResource] = useState(null);
  const { data: allContent = {}, isLoading, error } = useChildrenContent();
  const activeContent = allContent[activeAge] || {};
  const guidelines = activeContent.guidelines || '';
  const resources = activeContent.resources || [];

  const handleAgeChange = (age) => {
    setActiveAge(age);
    setOpenResource(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        size="editorial"
        align="center"
        tone="card"
        image={IMAGES.children_hero}
        eyebrow={t(lang, 'children_content')}
        title={t(lang, 'children_title')}
        subtitle={t(lang, 'children_intro')}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {isLoading && <p className="text-center text-muted-foreground mb-4">{t(lang, 'loading')}</p>}
        {error && <p className="text-center text-muted-foreground mb-4">{t(lang, 'content_error')}</p>}
        {/* Age tabs */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {AGE_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleAgeChange(tab.key)}
              className={`px-4 py-2.5 rounded-full border text-sm font-medium transition-natural ${
                activeAge === tab.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:bg-muted bg-card'
              }`}
            >
              {t(lang, tab.labelKey)}
            </button>
          ))}
        </div>

        {/* Content - stacked: guidelines on top, library below at full width */}
        <div className="space-y-6">
          {/* Guidelines */}
          <ValidatableContent contentId={`children.guidelines.${activeAge}`} label={`הנחיות גיל ${activeAge}`}>
          <div className="bg-card rounded-super border border-border p-6 shadow-card">
            <h3 className="font-heading font-bold text-foreground mb-4">{t(lang, 'children_guidelines')}</h3>
            <div
              className="rich-content text-foreground/80"
              dangerouslySetInnerHTML={{ __html: guidelines }}
            />
          </div>
          </ValidatableContent>

          {/* Resources */}
          <div className="bg-card rounded-super border border-border p-6 shadow-card">
            <h3 className="font-heading font-bold text-foreground mb-4">
              {t(lang, 'resources_library')}
            </h3>
            {resources.length > 0 ? (
              <div className="space-y-3">
                {resources.map((r, i) => {
                  const Icon = RESOURCE_ICONS[r.type] || BookOpen;
                  const hasContent = Boolean(r.content_he);
                  const hasUrl = Boolean(r.url);
                  const isOpen = openResource === i;

                  // External-link resources render as an anchor that opens in a
                  // new tab. Inline-content resources render as an expandable
                  // button. Plain (no url, no content) resources are read-only.
                  const cardClass = `w-full text-start flex items-start gap-3 p-3 ${
                    hasUrl || hasContent ? 'hover:bg-primary/10 cursor-pointer' : 'cursor-default'
                  }`;

                  const inner = (
                    <>
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{r.title_he}</p>
                        {r.description_he && (
                          <p className="text-xs text-muted-foreground mt-0.5">{r.description_he}</p>
                        )}
                      </div>
                      {hasUrl ? (
                        <ExternalLink className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                      ) : hasContent ? (
                        <ChevronDown
                          className={`w-4 h-4 text-primary flex-shrink-0 mt-1 transition-transform duration-300 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      ) : null}
                    </>
                  );

                  return (
                    <ValidatableContent key={i} contentId={`children.resource.${activeAge}.${i}`} label={r.title_he}>
                      <div
                        className={`rounded-lg overflow-hidden transition-natural ${
                          isOpen ? 'bg-primary/10 border border-primary/30' : 'bg-muted/40 border border-transparent'
                        }`}
                      >
                        {hasUrl ? (
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cardClass}
                          >
                            {inner}
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => hasContent && setOpenResource(isOpen ? null : i)}
                            disabled={!hasContent}
                            className={cardClass}
                            aria-expanded={isOpen}
                          >
                            {inner}
                          </button>
                        )}
                        {hasContent && isOpen && (
                          <div className="px-4 pb-4 pt-1 text-sm text-foreground/90">
                            <div className="rich-content" dangerouslySetInnerHTML={{ __html: r.content_he }} />
                            {r.cta_label && r.cta_url && (
                              <a
                                href={r.cta_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 mt-4 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:bg-accent transition-colors no-underline"
                              >
                                {r.cta_label}
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </ValidatableContent>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t(lang, 'resources_coming_soon')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
