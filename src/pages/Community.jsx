import React, { useState } from 'react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import PageHeader from '@/components/PageHeader';
import { Users, MapPin, Monitor, User, ExternalLink, Filter } from 'lucide-react';

const AUDIENCE_OPTIONS = [
  { key: 'all', labelKey: 'all_audiences' },
  { key: 'security_forces', label_he: 'כוחות ביטחון' },
  { key: 'hostilities', label_he: 'נפגעי איבה' },
  { key: 'sexual_harassment', label_he: 'נפגעי הטרדה מינית' },
  { key: 'accidents', label_he: 'נפגעי תאונות' },
  { key: 'spouses', label_he: 'בני/בנות זוג' },
  { key: 'general', label_he: 'כללי' },
];

const LOCATION_OPTIONS = [
  { key: 'all', labelKey: 'all_locations' },
  { key: 'north', labelKey: 'location_north' },
  { key: 'center', labelKey: 'location_center' },
  { key: 'south', labelKey: 'location_south' },
  { key: 'jerusalem', labelKey: 'location_jerusalem' },
  { key: 'online', labelKey: 'location_online' },
];

const STATIC_COMMUNITIES = [
  {
    name: 'נט"ל - קבוצות תמיכה',
    description_he: 'קבוצות תמיכה לנפגעי טראומה ופוסט-טראומה, בניחוח של חברות ושיתוף.',
    target_audience: ['security_forces', 'general'],
    location: 'center',
    meeting_type: 'frontal',
    organization: 'עמותת נט"ל',
    contact_url: 'https://www.natal.org.il',
  },
  {
    name: 'ניצן - מרכז תמיכה לנפגעי תקיפה מינית',
    description_he: 'קבוצות תמיכה וטיפול ייחודיות לנפגעי תקיפה מינית ומשפחותיהם.',
    target_audience: ['sexual_harassment'],
    location: 'center',
    meeting_type: 'hybrid',
    organization: 'מרכז ניצן',
    contact_url: 'https://www.1202.org.il/',
  },
  {
    name: 'קבוצת תמיכה מקוונת - PTSD Israel',
    description_he: 'קבוצה פתוחה בזום לנפגעי פוסט-טראומה מכל רחבי הארץ.',
    target_audience: ['general', 'security_forces'],
    location: 'online',
    meeting_type: 'digital',
    organization: 'מתנדבים',
    contact_url: 'https://www.natal.org.il',
  },
  {
    name: 'שותפים לדרך - בני/בנות זוג',
    description_he: 'קבוצת תמיכה ייחודית לבני ובנות זוג של נפגעי PTSD.',
    target_audience: ['spouses'],
    location: 'center',
    meeting_type: 'frontal',
    organization: 'עמותת נט"ל',
    contact_url: 'https://www.natal.org.il',
  },
  {
    name: 'מרכז חוסן - ירושלים',
    description_he: 'מרכז טיפול ותמיכה לנפגעי פעולות איבה ומשפחותיהם.',
    target_audience: ['hostilities', 'general'],
    location: 'jerusalem',
    meeting_type: 'frontal',
    organization: 'משרד הביטחון',
    contact_url: 'https://www.idf.il',
  },
  {
    name: 'קבוצת ריפוי - אזור הדרום',
    description_he: 'קבוצה לתמיכה ועיבוד טראומה לתושבי הדרום.',
    target_audience: ['general', 'security_forces'],
    location: 'south',
    meeting_type: 'frontal',
    organization: 'מכבי שרותי בריאות',
    contact_url: 'https://www.macabi.co.il',
  },
];

const LOCATION_LABELS = {
  north: 'צפון', center: 'מרכז', south: 'דרום', jerusalem: 'ירושלים', online: 'מקוון'
};
const MEETING_LABELS = {
  frontal: 'פרונטלי', digital: 'דיגיטלי', hybrid: 'היברידי'
};

export default function Community() {
  const { lang } = useLang();
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const communities = STATIC_COMMUNITIES;

  const filtered = communities.filter(c => {
    const audMatch = audienceFilter === 'all' ||
      (c.target_audience && (Array.isArray(c.target_audience)
        ? c.target_audience.includes(audienceFilter)
        : c.target_audience === audienceFilter));
    const locMatch = locationFilter === 'all' || c.location === locationFilter;
    return audMatch && locMatch;
  });

  return (
    <div className="min-h-screen bg-background">
      <PageHeader icon={Users} title={t(lang, 'community_title')} subtitle={t(lang, 'community_subtitle')} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">

        {/* Why community matters */}
        <div className="bg-card rounded-super border border-border p-6 mb-8 max-w-3xl mx-auto">
          <p className="text-foreground leading-relaxed mb-3">
            מחקרים מראים שחיבור עם אנשים שעוברים חוויה דומה הוא אחד הגורמים המשמעותיים ביותר בהחלמה מפוסט-טראומה. כשאת/ה מדבר/ת עם מישהו שמבין/ה מבפנים - אין צורך להסביר. יש פחות בדידות, ולעיתים - תשובות פשוטות שרק מי שחי את זה יכול לתת.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            זה נכון גם למי שמלווה: קבוצת תמיכה של משפחות ובני זוג היא מקום שבו אפשר לדבר בכנות על הקושי - בלי לפגוע בקרוב שאת/ה אוהב/ת.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-super border border-border p-5 mb-8 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">סינון</span>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">{t(lang, 'filter_audience')}</p>
              <div className="flex flex-wrap gap-2">
                {AUDIENCE_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setAudienceFilter(opt.key)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-natural ${
                      audienceFilter === opt.key
                        ? 'bg-primary text-white border-primary'
                        : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}
                  >
                    {opt.labelKey ? t(lang, opt.labelKey) : opt.label_he}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">{t(lang, 'filter_location')}</p>
              <div className="flex flex-wrap gap-2">
                {LOCATION_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setLocationFilter(opt.key)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-natural ${
                      locationFilter === opt.key
                        ? 'bg-primary text-white border-primary'
                        : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}
                  >
                    {t(lang, opt.labelKey)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-super border border-border">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{t(lang, 'no_communities')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((c, i) => (
              <div key={i} className="bg-card rounded-super border border-border p-6 shadow-card hover:shadow-card-hover transition-natural hover:border-primary/30 flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-heading font-bold text-foreground leading-snug">{c.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                    c.meeting_type === 'digital' ? 'bg-teal/10 text-teal' :
                    c.meeting_type === 'hybrid' ? 'bg-clay/10 text-clay' :
                    'bg-secondary/10 text-secondary'
                  }`}>
                    {MEETING_LABELS[c.meeting_type] || c.meeting_type}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4">
                  {c.description_he}
                </p>

                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                  {c.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {LOCATION_LABELS[c.location] || c.location}
                    </div>
                  )}
                  {c.organization && (
                    <div className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {c.organization}
                    </div>
                  )}
                </div>

                <a
                  href={c.contact_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-accent transition-natural"
                >
                  {t(lang, 'join_community')}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}