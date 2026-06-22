import React, { useState } from 'react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { useCommunities } from '@/api/hooks';
import PageHeader from '@/components/PageHeader';
import FilterChip from '@/components/FilterChip';
import ArchFrame from '@/components/ArchFrame';
import { Button } from '@/components/ui/button';
import SectionBlock from '@/components/SectionBlock';
import { Users, MapPin, ExternalLink, X } from 'lucide-react';
import { useImages } from '@/lib/ImageSetContext';

const AUDIENCE_OPTIONS = [
  { key: 'all', labelKey: 'all_audiences' },
  { key: 'security_forces', labelKey: 'audience_security_forces' },
  { key: 'hostilities', labelKey: 'audience_hostilities' },
  { key: 'sexual_harassment', labelKey: 'audience_sexual_harassment' },
  { key: 'accidents', labelKey: 'audience_accidents' },
  { key: 'spouses', labelKey: 'audience_spouses' },
  { key: 'general', labelKey: 'audience_general' },
];

const LOCATION_OPTIONS = [
  { key: 'all', labelKey: 'all_locations' },
  { key: 'north', labelKey: 'location_north' },
  { key: 'center', labelKey: 'location_center' },
  { key: 'south', labelKey: 'location_south' },
  { key: 'jerusalem', labelKey: 'location_jerusalem' },
  { key: 'online', labelKey: 'location_online' },
];

// Per-card placeholder gradients so cards look distinct before photos arrive.
// Cycled by index so the listing has visual rhythm.
const CARD_PLACEHOLDERS = [
  'bg-gradient-to-br from-primary/30 via-muted to-card',
  'bg-gradient-to-br from-secondary/35 via-muted to-card',
  'bg-gradient-to-br from-accent/30 via-primary/15 to-muted',
  'bg-gradient-to-br from-clay/30 via-oatmeal/30 to-muted',
  'bg-gradient-to-br from-teal/25 via-muted to-primary/20',
  'bg-gradient-to-br from-sage/40 via-muted to-card',
];

export default function Community() {
  const { lang } = useLang();
  const IMAGES = useImages();
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const { data: communities = [], isLoading, error } = useCommunities();

  const filtered = communities.filter(c => {
    const audMatch = audienceFilter === 'all' ||
      (c.target_audience && (Array.isArray(c.target_audience)
        ? c.target_audience.includes(audienceFilter)
        : c.target_audience === audienceFilter));
    const locMatch = locationFilter === 'all' || c.location === locationFilter;
    return audMatch && locMatch;
  });

  const buildAudienceOptions = () => AUDIENCE_OPTIONS.map(o => ({ key: o.key, label: t(lang, o.labelKey) }));
  const buildLocationOptions = () => LOCATION_OPTIONS.map(o => ({ key: o.key, label: t(lang, o.labelKey) }));

  const activeFilters = [];
  if (audienceFilter !== 'all') {
    const opt = AUDIENCE_OPTIONS.find(o => o.key === audienceFilter);
    activeFilters.push({ label: t(lang, opt.labelKey), clear: () => setAudienceFilter('all') });
  }
  if (locationFilter !== 'all') {
    const opt = LOCATION_OPTIONS.find(o => o.key === locationFilter);
    activeFilters.push({ label: t(lang, opt.labelKey), clear: () => setLocationFilter('all') });
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        size="editorial"
        align="start"
        tone="card"
        image={IMAGES.community_hero}
        eyebrow={t(lang, 'community')}
        title={t(lang, 'community_title')}
        subtitle={t(lang, 'community_subtitle')}
      />

      {/* Why community matters - intro paragraph */}
      <SectionBlock variant="canvas" maxWidth="default" padding="pt-12 pb-8">
        <div className="space-y-4">
          <p className="font-body text-lg text-foreground leading-relaxed">
            {t(lang, 'community_why_p1')}
          </p>
          <p className="font-body text-muted-foreground leading-relaxed">
            {t(lang, 'community_why_p2')}
          </p>
        </div>
      </SectionBlock>

      {/* Filter bar */}
      <SectionBlock variant="canvas" maxWidth="wide" padding="py-6">
        <div className="flex flex-wrap items-center gap-3">
          <FilterChip
            label={t(lang, 'filter_audience')}
            options={buildAudienceOptions()}
            value={audienceFilter}
            onChange={setAudienceFilter}
          />
          <FilterChip
            label={t(lang, 'filter_location')}
            options={buildLocationOptions()}
            value={locationFilter}
            onChange={setLocationFilter}
          />

          {activeFilters.length > 0 && (
            <div className="flex items-center gap-2 ms-auto">
              <span className="text-xs text-muted-foreground">
                {filtered.length} / {communities.length}
              </span>
              {activeFilters.map((f, i) => (
                <button
                  key={i}
                  onClick={f.clear}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-foreground text-xs font-medium hover:bg-muted/70 transition-colors duration-200"
                >
                  <span>{f.label}</span>
                  <X className="w-3 h-3" />
                </button>
              ))}
            </div>
          )}
        </div>
      </SectionBlock>

      {/* Results grid */}
      <SectionBlock variant="canvas" maxWidth="wide" padding="py-12">
        {isLoading && <p className="text-center text-muted-foreground mb-4">{t(lang, 'loading')}</p>}
        {error && <p className="text-center text-muted-foreground mb-4">{t(lang, 'content_error')}</p>}

        {!isLoading && filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground bg-card rounded-super border border-border">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-60" />
            <p>{t(lang, 'no_communities')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filtered.map((c, i) => (
              <a
                key={c.id || i}
                href={c.contact_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                {/* Photo: real `c.photo` when available, otherwise tinted ArchFrame */}
                <ArchFrame
                  src={c.photo}
                  alt={c.name}
                  shape="card"
                  aspect="landscape"
                  placeholderClass={CARD_PLACEHOLDERS[i % CARD_PLACEHOLDERS.length]}
                  className="mb-4 shadow-card group-hover:shadow-card-hover transition-all duration-500 group-hover:-translate-y-0.5"
                />

                {/* Card body */}
                <div className="px-1">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-heading font-semibold text-lg text-foreground leading-snug">
                      {c.name}
                    </h3>
                    {c.meeting_type && (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                        c.meeting_type === 'digital' ? 'bg-teal/15 text-teal-dark' :
                        c.meeting_type === 'hybrid' ? 'bg-clay/15 text-clay-dark' :
                        'bg-muted text-foreground'
                      }`}>
                        {t(lang, 'meeting_' + c.meeting_type)}
                      </span>
                    )}
                  </div>

                  <p className="font-body text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-3">
                    {c.description_he}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4 flex-wrap">
                    {c.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {t(lang, 'location_' + c.location) || c.location}
                      </span>
                    )}
                    {c.organization && (
                      <span className="opacity-80">{c.organization}</span>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all duration-300">
                    {t(lang, 'join_community')}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </SectionBlock>
    </div>
  );
}
