import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { ArrowLeft, ArrowRight, ChevronDown, Brain, Heart, FileText, Users, Shield, Baby } from 'lucide-react';
import SectionBlock from '@/components/SectionBlock';
import ArchFrame from '@/components/ArchFrame';
import { Button } from '@/components/ui/button';
import { useImages } from '@/lib/ImageSetContext';

const quickNavItems = [
  { key: 'ptsd_info', path: '/ptsd-info', icon: Brain },
  { key: 'treatment', path: '/treatment', icon: Heart },
  { key: 'rights', path: '/rights', icon: FileText },
  { key: 'community', path: '/community', icon: Users },
  { key: 'second_circle', path: '/second-circle', icon: Shield },
  { key: 'children_content', path: '/children', icon: Baby },
];

// Per-path placeholder accents so the three big path cards feel distinct even
// before photography arrives. Each pairs a gradient and an arch shape.
// imageKey is resolved against the active image set at render time.
const PATHS_META = [
  {
    path: '/first-circle',
    titleKey: 'path1_title',
    subtitleKey: 'path1_subtitle',
    imageKey: 'home_path1',
    placeholder: 'bg-gradient-to-br from-primary/35 via-primary/20 to-muted',
    shape: 'arch',
  },
  {
    path: '/second-circle',
    titleKey: 'path2_title',
    subtitleKey: 'path2_subtitle',
    imageKey: 'home_path2',
    placeholder: 'bg-gradient-to-br from-secondary/35 via-muted to-card',
    shape: 'arch',
  },
  {
    path: '/questionnaire',
    titleKey: 'path3_title',
    subtitleKey: 'path3_subtitle',
    imageKey: 'home_path3',
    placeholder: 'bg-gradient-to-br from-accent/30 via-muted to-primary/15',
    shape: 'arch',
  },
];

export default function Home() {
  const { lang } = useLang();
  const IMAGES = useImages();
  const paths = PATHS_META.map(p => ({ ...p, image: IMAGES[p.imageKey] }));
  const isRTL = document.documentElement.getAttribute('dir') === 'rtl';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="bg-background">
      {/* ── Hero: magazine cover, fills the first screen on mobile + desktop ── */}
      <section className="relative bg-sanctuary text-sanctuary-foreground overflow-hidden min-h-screen flex flex-col">
        <img
          src={IMAGES.home_hero}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          loading="eager"
        />
        {/* Dark gradient overlay keeps headline readable over any photo - softer
            so the photo behind it stays visible. */}
        <div className="absolute inset-0 bg-gradient-to-b from-sanctuary/30 via-sanctuary/45 to-sanctuary/85" aria-hidden="true" />

        <div className="relative flex-1 max-w-5xl w-full mx-auto px-5 sm:px-6 pt-24 pb-32 flex flex-col items-center justify-center text-center">
          <span className="font-heading font-bold text-sm tracking-[0.2em] opacity-70 mb-6">
            PTSD<span className="opacity-100 text-primary">.IL</span>
          </span>
          <h1 className="font-heading font-light text-5xl sm:text-7xl lg:text-8xl leading-[0.95] tracking-tight mb-8 max-w-4xl">
            {t(lang, 'hero_tagline')}
          </h1>
          <p className="font-body text-lg sm:text-xl opacity-85 max-w-xl leading-relaxed mb-10">
            {t(lang, 'hero_subtitle')}
          </p>
          <Button asChild variant="pill" size="pill-lg">
            <a href="#paths" className="gap-3">
              {t(lang, 'quick_nav_title')}
              <ArrowIcon className="w-4 h-4" />
            </a>
          </Button>
        </div>

        {/* Bottom chevron — also links to the path picker */}
        <a
          href="#paths"
          aria-label={t(lang, 'quick_nav_title')}
          className="relative z-10 mb-6 mx-auto opacity-70 hover:opacity-100 transition-opacity p-3"
        >
          <ChevronDown className="w-7 h-7 animate-bounce" />
        </a>
      </section>

      {/* ── Three big path cards: the main moment ──
          scroll-mt-24 on the target lands the cards ~6rem below the page top so the
          fixed navbar (h-16) doesn't cover the first card after anchor scroll. */}
      <SectionBlock variant="canvas" maxWidth="full" padding="pt-12 pb-24 sm:pt-16 sm:pb-32">
        <div id="paths" className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 scroll-mt-24">
          {paths.map((panel, idx) => (
            <Link
              key={panel.path}
              to={panel.path}
              className="group block"
            >
              <div className="flex flex-col h-full">
                {/* Photo slot — ArchFrame placeholder until real images arrive */}
                <ArchFrame
                  src={panel.image}
                  alt={t(lang, panel.titleKey)}
                  shape={panel.shape}
                  aspect="portrait"
                  placeholderClass={panel.placeholder}
                  className="mb-6 transition-transform duration-500 group-hover:-translate-y-1 shadow-card group-hover:shadow-card-hover"
                />
                <div className="px-2">
                  <h2 className="font-heading font-semibold text-2xl sm:text-3xl text-foreground mb-3 leading-tight">
                    {t(lang, panel.titleKey)}
                  </h2>
                  <p className="font-body text-card-foreground leading-relaxed mb-4">
                    {t(lang, panel.subtitleKey)}
                  </p>
                  <span className="inline-flex items-center gap-2 font-heading font-semibold text-primary group-hover:gap-3 transition-all duration-300">
                    {t(lang, 'enter_path')}
                    <ArrowIcon className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </SectionBlock>

      {/* ── About PTSD strip ── */}
      <SectionBlock variant="muted" maxWidth="default" padding="py-20 sm:py-24">
        <div className="text-center">
          <p className="font-body text-xl sm:text-2xl leading-relaxed text-foreground font-light">
            {t(lang, 'about_ptsd_short')}
          </p>
          <div className="mt-8">
            <Button asChild variant="pill-outline" size="pill">
              <Link to="/ptsd-info" className="gap-2">
                {t(lang, 'read_more')}
                <ArrowIcon className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </SectionBlock>

      {/* ── Calming CTA ── */}
      <SectionBlock variant="canvas" maxWidth="default" padding="pt-20 pb-16">
        <div className="bg-card rounded-super border border-border p-8 sm:p-12 text-center shadow-card">
          <p className="font-body text-sm uppercase tracking-[0.18em] text-muted-foreground mb-3 font-semibold">
            {lang === 'he' ? 'במצוקה עכשיו?' : lang === 'ar' ? 'في ضائقة الآن؟' : 'In distress now?'}
          </p>
          <h3 className="font-heading font-light text-3xl sm:text-4xl text-foreground mb-4 leading-tight">
            {t(lang, 'calming_title')}
          </h3>
          <p className="font-body text-card-foreground mb-8 max-w-md mx-auto leading-relaxed">
            {t(lang, 'calming_subtitle')}
          </p>
          <Button asChild variant="pill" size="pill-lg">
            <Link to="/calming" className="gap-2">
              {t(lang, 'go_to_calming')}
              <ArrowIcon className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </SectionBlock>

      {/* ── Demoted quick nav: small chip row at bottom ── */}
      <SectionBlock variant="canvas" maxWidth="wide" padding="pb-24" innerClassName="border-t border-border pt-12">
        <div className="flex flex-wrap gap-3 justify-center">
          {quickNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                to={item.path}
                className="group inline-flex items-center gap-2.5 px-5 py-2.5 bg-card border border-border rounded-full text-sm font-medium text-foreground hover:border-primary hover:bg-muted transition-colors duration-300"
              >
                <Icon className="w-4 h-4 text-primary" />
                <span>{t(lang, item.key)}</span>
              </Link>
            );
          })}
        </div>
      </SectionBlock>
    </div>
  );
}
