import React from 'react';
import { ArrowLeft, Baby, Brain, ChevronDown, FileText, HandHeart, Heart, MapPin, Shield, Users } from 'lucide-react';
import SectionBlock from '@/components/patterns/SectionBlock';
import { Button } from '@/components/ui/button';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { PATIENT_HUB } from '@/pages/metiv-demos/shared/patient';
import { tx } from '@/pages/metiv-demos/shared/patient/copy';

// /patient is the PTSD-IL home page (src/pages/Home.jsx) as it is, with two
// changes only: the Metiv logo replaces the PTSD.IL wordmark, and the approved
// Metiv additions are reachable from it. The additions that are sections inside
// existing pages (veterans, parent-child groups, reservist families, books,
// videos, consultation) live in those pages; the two new pages join the topic
// chips below. The hero chat input is left out: the demo has no chatbot backend.

const LOGO = `${import.meta.env.BASE_URL || '/'}images/metiv-demo/metiv-logo.png`;

/** @type {Record<string, { label: string }>} */
const HUB_LINKS = Object.fromEntries([...PATIENT_HUB.quickLinks, ...PATIENT_HUB.additions].map((l) => [l.key, l]));

const QUICK_NAV = [
  { key: 'ptsd_info', label: tx('ptsd_info'), to: ROUTES.ptsdInfo, icon: Brain },
  { key: 'treatment', label: tx('treatment'), to: ROUTES.treatment, icon: Heart },
  { key: 'rights', label: tx('rights'), to: ROUTES.rights, icon: FileText },
  { key: 'community', label: tx('community'), to: ROUTES.community, icon: Users },
  { key: 'second_circle', label: tx('second_circle'), to: ROUTES.secondCircle, icon: Shield },
  { key: 'children_content', label: tx('children_content'), to: ROUTES.children, icon: Baby },
  // Metiv additions (approved): the two new pages.
  { key: 'whereToGetHelp', label: HUB_LINKS.whereToGetHelp?.label || 'איפה מקבלים טיפול', to: ROUTES.whereToGetHelp, icon: MapPin },
  { key: 'freeTreatment', label: HUB_LINKS.freeTreatment?.label || 'טיפולים ללא עלות ומחקרים', to: ROUTES.freeTreatment, icon: HandHeart },
];

// Same per-path placeholder accents as the PTSD-IL home page.
const PLACEHOLDERS = [
  'bg-gradient-to-br from-primary/35 via-primary/20 to-muted',
  'bg-gradient-to-br from-secondary/35 via-muted to-card',
  'bg-gradient-to-br from-accent/30 via-muted to-primary/15',
];

export default function PatientHub() {
  const { hero, paths } = PATIENT_HUB;

  return (
    <div className="bg-background">
      {/* ── Hero: magazine cover, fills the first screen ── */}
      <section className="relative bg-sanctuary text-sanctuary-foreground overflow-hidden min-h-[calc(100svh-7.5rem)] flex flex-col">
        <img
          src={hero.image}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-sanctuary/30 via-sanctuary/45 to-sanctuary/85" aria-hidden="true" />

        <div className="relative flex-1 max-w-5xl w-full mx-auto px-5 sm:px-6 pt-12 pb-24 flex flex-col items-center justify-center text-center">
          <span className="inline-flex items-center rounded-full bg-card/95 px-4 py-2 mb-6 shadow-atmospheric">
            <img src={LOGO} alt="מטיב" className="h-8 w-auto" />
          </span>
          <h1 className="mb-8 max-w-4xl">
            <span className="block font-heading font-light text-2xl sm:text-3xl lg:text-4xl tracking-tight opacity-80 mb-3">
              {hero.eyebrow}
            </span>
            <span className="block font-heading font-semibold text-6xl sm:text-8xl lg:text-9xl leading-[0.95] tracking-tight">
              {hero.headline}
            </span>
          </h1>
          <Button asChild variant="pill-green" size="pill-lg">
            <a href="#paths" className="gap-3">
              {tx('quick_nav_title')}
              <ArrowLeft className="w-4 h-4" />
            </a>
          </Button>
        </div>

        <a
          href="#paths"
          aria-label={tx('quick_nav_title')}
          className="relative z-10 mb-6 mx-auto opacity-70 hover:opacity-100 transition-opacity p-3"
        >
          <ChevronDown className="w-7 h-7 animate-bounce" />
        </a>
      </section>

      {/* ── Three big path cards: the main moment ── */}
      <SectionBlock variant="canvas" maxWidth="full" padding="pt-12 pb-24 sm:pt-16 sm:pb-32">
        <div id="paths" className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 scroll-mt-32">
          {paths.map((panel, idx) => {
            const isIllustration = panel.image?.includes('illustrations');
            return (
              <DemoLink key={panel.key} to={panel.route} className="group block h-full">
                <div className="flex flex-col h-full rounded-t-[50%] rounded-b-3xl border-2 border-border bg-card overflow-hidden shadow-card group-hover:shadow-card-hover group-hover:-translate-y-1 transition-all duration-500">
                  <div className={`aspect-[3/4] w-full ${!panel.image ? PLACEHOLDERS[idx] : isIllustration ? 'bg-muted' : ''}`}>
                    {panel.image && (
                      <img
                        src={panel.image}
                        alt={panel.title}
                        className={`w-full h-full ${isIllustration ? 'object-contain' : 'object-cover'}`}
                        loading="lazy"
                      />
                    )}
                  </div>
                  <div className="flex-1 px-6 pt-5 pb-7">
                    <h2 className="font-heading font-semibold text-2xl sm:text-3xl text-foreground mb-3 leading-tight">
                      {panel.title}
                    </h2>
                    <p className="font-body text-card-foreground leading-relaxed mb-4">{panel.subtitle}</p>
                    <span className="inline-flex items-center gap-2 font-heading font-semibold text-primary group-hover:gap-3 transition-all duration-300">
                      {tx('enter_path')}
                      <ArrowLeft className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </DemoLink>
            );
          })}
        </div>
      </SectionBlock>

      {/* ── About PTSD strip ── */}
      <SectionBlock variant="muted" maxWidth="default" padding="py-20 sm:py-24">
        <div className="text-center">
          <p className="font-body text-xl sm:text-2xl leading-relaxed text-foreground font-light">{hero.about}</p>
          <div className="mt-8">
            <Button asChild variant="pill-outline" size="pill">
              <DemoLink to={hero.aboutRoute} className="gap-2">
                {hero.aboutLinkLabel}
                <ArrowLeft className="w-4 h-4" />
              </DemoLink>
            </Button>
          </div>
        </div>
      </SectionBlock>

      {/* ── Quick nav: small chip row at bottom ── */}
      <SectionBlock variant="canvas" maxWidth="wide" padding="pb-24" innerClassName="border-t border-border pt-12">
        <div className="flex flex-wrap gap-3 justify-center">
          {QUICK_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <DemoLink
                key={item.key}
                to={item.to}
                className="group inline-flex items-center gap-2.5 px-5 py-2.5 bg-card border border-border rounded-full text-sm font-medium text-foreground hover:border-primary hover:bg-muted transition-colors duration-300"
              >
                <Icon className="w-4 h-4 text-primary" />
                <span>{item.label}</span>
              </DemoLink>
            );
          })}
        </div>
      </SectionBlock>
    </div>
  );
}
