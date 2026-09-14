import React, { useState } from 'react';
import FilterChip from '@/components/patterns/FilterChip';
import ArchFrame from '@/components/patterns/ArchFrame';
import { Button } from '@/components/ui/button';
import SectionBlock from '@/components/patterns/SectionBlock';
import { Users, MapPin, ExternalLink, X } from 'lucide-react';
import { IMAGES } from '@/lib/images';
import { useDemoChrome } from '@/pages/metiv-demos/shared/DemoChrome';
import { tx, txOptional } from '../copy';
import { getCommunities } from '../staticData';
import { EntrySection } from '../components';
import { VETERANS_PROGRAMS, ADDITION_ANCHORS } from '../additions';

const AUDIENCE_OPTIONS = [
  { key: 'all', labelKey: 'all_audiences' },
  { key: 'security_forces', labelKey: 'audience_security_forces' },
  { key: 'hostilities', labelKey: 'audience_hostilities' },
  { key: 'sexual_harassment', labelKey: 'audience_sexual_harassment' },
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

// Per-card placeholder gradients, cycled by index so the listing has rhythm.
const CARD_PLACEHOLDERS = [
  'bg-gradient-to-br from-primary/30 via-muted to-card',
  'bg-gradient-to-br from-secondary/35 via-muted to-card',
  'bg-gradient-to-br from-accent/30 via-primary/15 to-muted',
  'bg-gradient-to-br from-secondary/25 via-muted/30 to-muted',
  'bg-gradient-to-br from-primary/20 via-muted to-primary/20',
  'bg-gradient-to-br from-primary/25 via-muted to-card',
];

export default function Community() {
  const { PageHeader } = useDemoChrome();
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const communities = getCommunities();

  const filtered = communities.filter(c => {
    const audMatch = audienceFilter === 'all' ||
      (c.target_audience && (Array.isArray(c.target_audience)
        ? c.target_audience.includes(audienceFilter)
        : c.target_audience === audienceFilter));
    const locMatch = locationFilter === 'all' || c.location === locationFilter;
    return audMatch && locMatch;
  });

  const audienceOptions = AUDIENCE_OPTIONS.map(o => ({ key: o.key, label: tx(o.labelKey) }));
  const locationOptions = LOCATION_OPTIONS.map(o => ({ key: o.key, label: tx(o.labelKey) }));

  const activeFilters = [];
  if (audienceFilter !== 'all') {
    const opt = AUDIENCE_OPTIONS.find(o => o.key === audienceFilter);
    activeFilters.push({ label: tx(opt.labelKey), clear: () => setAudienceFilter('all') });
  }
  if (locationFilter !== 'all') {
    const opt = LOCATION_OPTIONS.find(o => o.key === locationFilter);
    activeFilters.push({ label: tx(opt.labelKey), clear: () => setLocationFilter('all') });
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        size="editorial"
        align="start"
        tone="card"
        image={IMAGES.community_hero}
        eyebrow={tx('community')}
        title={tx('community_title')}
        subtitle={tx('community_subtitle')}
      />

      {/* Why community matters - intro paragraph */}
      <SectionBlock variant="canvas" maxWidth="default" padding="pt-12 pb-8">
        <div className="space-y-4">
          <p className="font-body text-lg text-foreground leading-relaxed">
            {tx('community_why_p1')}
          </p>
          <p className="font-body text-muted-foreground leading-relaxed">
            {tx('community_why_p2')}
          </p>
        </div>
      </SectionBlock>

      {/* Filter bar */}
      <SectionBlock variant="canvas" maxWidth="wide" padding="py-6">
        <div className="flex flex-wrap items-center gap-3">
          <FilterChip
            label={tx('filter_audience')}
            options={audienceOptions}
            value={audienceFilter}
            onChange={setAudienceFilter}
          />
          <FilterChip
            label={tx('filter_location')}
            options={locationOptions}
            value={locationFilter}
            onChange={setLocationFilter}
          />

          {activeFilters.length > 0 && (
            <div className="flex items-center gap-2 ms-auto">
              {activeFilters.map((f, i) => (
                <Button
                  key={i}
                  variant="subtle"
                  radius="full"
                  size="none"
                  onClick={f.clear}
                  className="gap-1.5 px-3 py-1.5 text-xs"
                >
                  <span>{f.label}</span>
                  <X className="w-3 h-3" />
                </Button>
              ))}
            </div>
          )}
        </div>
      </SectionBlock>

      {/* Results grid */}
      <SectionBlock variant="canvas" maxWidth="wide" padding="py-12">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground bg-card rounded-super border border-border">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-60" />
            <p>{tx('no_communities')}</p>
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
                <ArchFrame
                  src={c.photo}
                  alt={c.name}
                  shape="card"
                  aspect="landscape"
                  placeholderClass={CARD_PLACEHOLDERS[i % CARD_PLACEHOLDERS.length]}
                  className="mb-4 shadow-card group-hover:shadow-card-hover transition-all duration-500 group-hover:-translate-y-0.5"
                />

                <div className="px-1">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-heading font-semibold text-lg text-foreground leading-snug">
                      {c.name}
                    </h3>
                    {c.meeting_type && (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                        c.meeting_type === 'digital' ? 'bg-category-1/15 text-category-1' :
                        c.meeting_type === 'hybrid' ? 'bg-category-2/15 text-category-2' :
                        'bg-muted text-foreground'
                      }`}>
                        {tx('meeting_' + c.meeting_type)}
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
                        {txOptional('location_' + c.location) || c.location}
                      </span>
                    )}
                    {c.organization && (
                      <span className="opacity-80">{c.organization}</span>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all duration-300">
                    {tx('join_community')}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </SectionBlock>

      {/* Metiv addition 3: veterans and reservists */}
      <SectionBlock variant="muted" maxWidth="wide" padding="py-16">
        <EntrySection
          id={ADDITION_ANCHORS.veterans}
          title="חיילים משוחררים ומילואימניקים"
          intro="תכניות קבוצתיות של מטיב לחיילים משוחררים, למילואימניקים ולבני משפחותיהם."
          entries={VETERANS_PROGRAMS}
        />
      </SectionBlock>
    </div>
  );
}
