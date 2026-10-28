import React, { useEffect, useId, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ArrowRight, GraduationCap, HeartHandshake, LifeBuoy, LogOut, Menu, MessageCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ChatbotFAB from '@/components/ChatbotFAB';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { useLang } from '@/lib/LanguageContext';
import { getDir } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { fmt, useCopy, useMetiv } from '../content/MetivContent';
import { resolveRoute, routeLabel, ALL_ROUTES, V3_ROUTES } from '../meta';
import { Band, FOCUS, fmtNodes, NewTabHint, TEXT_LINK, WasThisHelpful } from './kit';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from './Sheet';

const LOGO = `${import.meta.env.BASE_URL || '/'}images/metiv-demo/metiv-logo.png`;
const EXIT_URL = 'https://www.google.com/search?q=weather';

/** @typedef {'metiv'|'patient'|'therapist'} Area */
/** @typedef {{ key: string, label: string, route: string, children?: { key: string, label: string, route: string }[] }} NavItem */

const AREAS = [
  { key: 'patient', to: ROUTES.patient, icon: HeartHandshake },
  { key: 'therapist', to: ROUTES.therapist, icon: GraduationCap },
];

const ABOUT_CHILDREN = ['aboutHistory', 'aboutTeam', 'aboutPartners', 'aboutCollaborations'];

/**
 * Text direction and language of the current language: rtl for he/ar, ltr
 * otherwise. The shells set both on their root; portaled panels (menu, help-now)
 * set the direction themselves.
 * @returns {{ lang: string, dir: 'rtl'|'ltr' }}
 */
export function useLangDir() {
  const { lang } = useLang();
  return { lang, dir: getDir(lang) };
}

/** The crisis lines from the patient hub, by key. */
function useCrisisLines() {
  const { PATIENT_HUB } = useMetiv();
  const lines = /** @type {{ key: string, href: string }[]} */ (PATIENT_HUB?.crisisLines ?? []);
  return { eran: lines.find((l) => l.key === 'eranPhone'), eranWa: lines.find((l) => l.key === 'eranWhatsapp') };
}

/**
 * The navigation lists, built from the content.
 * - navLabels: the kit's path titles are split headline fragments, so the
 *   navigation uses the full route labels for these three.
 * - menuPatientNav: the kit nav with מסע שחרור right above "איפה מקבלים טיפול".
 * - proNav: the professional area's tabs: the shared nav, with "על מטיב" right
 *   after the area home and מסע שחרור at the end (owner feedback).
 */
function useNav() {
  const { PATIENT_NAV, NAV, ROUTE_META } = useMetiv();
  const meta = ROUTE_META ?? {};
  /** @type {NavItem[]} */
  const patientNav = PATIENT_NAV ?? [];
  /** @type {NavItem[]} */
  const therapistNav = NAV ?? [];
  /** @type {Record<string, string>} */
  const navLabels = { firstCircle: meta.firstCircle?.label, secondCircle: meta.secondCircle?.label, questionnaire: meta.questionnaire?.label };
  /** @type {NavItem} */
  const releaseJourneyItem = { key: 'releaseJourney', label: meta.releaseJourney?.label, route: V3_ROUTES.releaseJourney };
  const menuPatientNav = patientNav.flatMap((item) => (item.key === 'whereToGetHelp' ? [releaseJourneyItem, item] : [item]));
  /** @type {NavItem[]} */
  const proNav = [
    ...therapistNav.slice(0, 1),
    { key: 'about', label: meta.about?.label, route: ROUTES.about },
    ...therapistNav.slice(1),
    { key: 'releaseJourneyPro', label: meta.releaseJourneyPro?.label, route: V3_ROUTES.releaseJourneyPro },
  ];
  return { meta, patientNav, navLabels, menuPatientNav, proNav };
}

// ── Help now: the crisis line lives in the header button, on every page ─────

function HelpNowContent() {
  const c = useCopy('chrome');
  const { dir } = useLangDir();
  const { PATIENT_HUB } = useMetiv();
  const { eran: ERAN, eranWa: ERAN_WA } = useCrisisLines();
  return (
    <div dir={dir} className="space-y-3 text-start">
      <p className="font-heading font-semibold text-foreground">{c.helpNow}</p>
      <p className="text-sm text-muted-foreground">{c.helpNowIntro}</p>
      <a href={ERAN?.href || 'tel:1201'} className={cn('flex items-center gap-3 rounded-2xl bg-muted p-3 hover:bg-primary/10 transition-natural', FOCUS)}>
        <Phone className="w-5 h-5 text-accent" aria-hidden="true" />
        <span>
          <span className="block font-semibold text-foreground">{c.eranCall}</span>
          <span className="block text-xs text-muted-foreground">{c.eranCallNote}</span>
        </span>
      </a>
      <a href={ERAN_WA?.href} target="_blank" rel="noopener noreferrer" className={cn('flex items-center gap-3 rounded-2xl bg-muted p-3 hover:bg-primary/10 transition-natural', FOCUS)}>
        <MessageCircle className="w-5 h-5 text-accent" aria-hidden="true" />
        <span>
          <span className="block font-semibold text-foreground">{c.eranWhatsapp}</span>
          <span className="block text-xs text-muted-foreground">{c.eranWhatsappNote}</span>
        </span>
      </a>
      <DemoLink to={PATIENT_HUB?.consultation?.route} className={cn('flex items-center gap-3 rounded-2xl bg-muted p-3 hover:bg-primary/10 transition-natural', FOCUS)}>
        <LifeBuoy className="w-5 h-5 text-accent" aria-hidden="true" />
        <span>
          <span className="block font-semibold text-foreground">{PATIENT_HUB?.consultation?.title}</span>
          <span className="block text-xs text-muted-foreground">{c.consultationNote}</span>
        </span>
      </DemoLink>
      <p className="text-xs text-muted-foreground">{c.emergency}</p>
    </div>
  );
}

/**
 * The help-now button and popover.
 * @param {{ compact?: boolean }} props  compact: icon only below the sm breakpoint (tight headers)
 */
export function HelpNow({ compact = false }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const c = useCopy('chrome');
  useEffect(() => setOpen(false), [pathname]);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="pill-outline" size="pill" className={cn('h-10 gap-1.5 border-secondary/60', compact ? 'px-3 sm:px-4' : 'px-4')}>
          <LifeBuoy className="w-4 h-4 text-secondary" aria-hidden="true" />
          <span className={compact ? 'sr-only sm:not-sr-only' : undefined}>{c.helpNow}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-super-sm p-5">
        <HelpNowContent />
      </PopoverContent>
    </Popover>
  );
}

// ── Quick exit (patient area only) ──────────────────────────────────────────

function exitNow() {
  window.location.replace(EXIT_URL);
}

/** GOV.UK "exit this page": a visible button plus Shift pressed 3 times. */
export function QuickExit({ className = '' }) {
  const hintId = useId();
  const c = useCopy('chrome');
  useEffect(() => {
    /** @type {number[]} */
    let presses = [];
    /** @param {KeyboardEvent} e */
    const onKey = (e) => {
      if (e.key !== 'Shift' || e.repeat) return;
      const now = Date.now();
      presses = [...presses.filter((t) => now - t < 1500), now];
      if (presses.length >= 3) exitNow();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span id={hintId} className="sr-only">{c.quickExitHint}</span>
      <Button variant="subtle" size="sm" radius="full" onClick={exitNow} aria-describedby={hintId} className="h-9 px-3.5 gap-1.5 border border-border">
        <LogOut className="w-4 h-4" aria-hidden="true" />
        {c.quickExit}
      </Button>
    </div>
  );
}

// ── Header, area nav, full menu ─────────────────────────────────────────────

/** @param {{ area: Area }} props */
function MenuSheet({ area }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const c = useCopy('chrome');
  const { dir } = useLangDir();
  const { meta, navLabels, menuPatientNav, proNav } = useNav();
  useEffect(() => setOpen(false), [pathname]);
  const link = cn('block rounded-xl px-3 py-2 text-foreground hover:bg-muted transition-natural', FOCUS);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="pill" className="h-10 px-3 gap-1.5 text-foreground hover:bg-muted hover:text-foreground" aria-label={c.menuLabel}>
          <Menu className="w-5 h-5" aria-hidden="true" />
          <span className="hidden sm:inline">{c.menu}</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        dir={dir}
        className="w-full sm:max-w-md overflow-y-auto bg-background p-0"
      >
        <div dir={dir} className="p-6 pt-12 text-start">
          <SheetTitle className="font-heading text-2xl">{c.menuTitle}</SheetTitle>
          <SheetDescription className="mt-1">{c.menuDescription}</SheetDescription>

          <nav aria-label={c.menuLabel} className="mt-6 space-y-6">
            <section>
              <h2 className="flex items-center gap-2 font-heading font-semibold text-accent mb-2">
                <HeartHandshake className="w-4 h-4" aria-hidden="true" /> {meta.patient?.label}
              </h2>
              <ul className="space-y-0.5">
                {menuPatientNav.map((item) => (
                  <li key={item.key}>
                    <DemoLink to={item.route} className={cn(link, 'font-medium')}>{item.key === 'patient' ? c.allTopics : navLabels[item.key] || item.label}</DemoLink>
                    {item.children && (
                      <ul className="ms-4 border-s-2 border-dashed border-primary/30 ps-2">
                        {item.children.map((c) => (
                          <li key={c.key}><DemoLink to={c.route} className={cn(link, 'text-sm py-1.5')}>{c.label}</DemoLink></li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="flex items-center gap-2 font-heading font-semibold text-accent mb-2">
                <GraduationCap className="w-4 h-4" aria-hidden="true" /> {meta.therapist?.label}
              </h2>
              <ul className="space-y-0.5">
                {proNav.map((item) => (
                  <li key={item.key}>
                    <DemoLink to={item.route} className={cn(link, 'font-medium')}>{item.key === 'therapist' ? c.proHome : item.label}</DemoLink>
                    {item.key === 'about' && (
                      <ul className="ms-4 border-s-2 border-dashed border-primary/30 ps-2">
                        {ABOUT_CHILDREN.map((k) => (
                          <li key={k}><DemoLink to={ALL_ROUTES[k]} className={cn(link, 'text-sm py-1.5')}>{meta[k]?.label}</DemoLink></li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="font-heading font-semibold text-accent mb-2">{c.brand}</h2>
              <ul className="space-y-0.5">
                {['home', 'donate', 'contact', 'accessibility', 'privacy', 'terms'].map((k) => (
                  <li key={k}><DemoLink to={ROUTES[k]} className={cn(link, 'font-medium')}>{meta[k]?.label}</DemoLink></li>
                ))}
              </ul>
            </section>
          </nav>
          {area === 'patient' && <QuickExit className="mt-8" />}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** @param {{ area: Area }} props */
function Header({ area }) {
  const c = useCopy('chrome');
  return (
    <div className="bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center gap-3">
        <DemoLink to={ROUTES.home} className={cn('flex-shrink-0 rounded-lg', FOCUS)} aria-label={c.logoLink}>
          <img src={LOGO} alt={c.logoAlt} className="h-10 sm:h-11 w-auto" />
        </DemoLink>

        <div className="ms-auto flex items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher />
          <HelpNow />
          <MenuSheet area={area} />
        </div>
      </div>
    </div>
  );
}

/** @param {{ area: 'patient'|'therapist' }} props */
function AreaNav({ area }) {
  const { pathname } = useLocation();
  const { key } = resolveRoute(pathname);
  const c = useCopy('chrome');
  const { meta: routeMeta, patientNav, navLabels, proNav } = useNav();
  const isPatient = area === 'patient';
  const areaInfo = AREAS.find((a) => a.key === area);
  const areaLabel = routeMeta[area]?.label;
  const Icon = areaInfo?.icon || HeartHandshake;
  const items = isPatient
    ? patientNav.map((i) => ({ key: i.key, label: i.key === 'patient' ? c.allTopics : navLabels[i.key] || i.label, route: i.route, childKeys: (i.children || []).map((ch) => ch.key) }))
    : proNav.map((i) => ({ key: i.key, label: i.key === 'therapist' ? c.proHome : i.label, route: i.route, childKeys: /** @type {string[]} */ ([]) }));
  const parentKey = key ? routeMeta[key]?.parent : undefined;
  const isActive = (/** @type {{ key: string, childKeys: string[] }} */ i) => i.key === key || (i.key !== area && i.key === parentKey);

  return (
    <div className="bg-card border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-2 flex items-center gap-3">
        <DemoLink to={areaInfo?.to || '/'} className={cn('inline-flex items-center gap-2 font-heading font-semibold text-foreground whitespace-nowrap rounded-lg', FOCUS)}>
          <span className="w-7 h-7 rounded-full bg-primary/10 text-accent flex items-center justify-center">
            <Icon className="w-4 h-4" aria-hidden="true" />
          </span>
          <span className="lg:sr-only">{areaLabel}</span>
        </DemoLink>
        <nav aria-label={fmt(c.areaNavLabel, { area: areaLabel || c.areaFallback })} className="hidden lg:block min-w-0 flex-1">
          <ul className="flex flex-wrap items-center gap-0.5">
            {items.map((i) => (
              <li key={i.key}>
                <DemoLink
                  to={i.route}
                  aria-current={isActive(i) ? 'page' : undefined}
                  className={cn(
                    'block rounded-full px-2.5 py-1.5 text-sm whitespace-nowrap transition-natural',
                    FOCUS,
                    isActive(i) ? 'bg-primary/10 text-accent font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {i.label}
                </DemoLink>
              </li>
            ))}
          </ul>
        </nav>
        {isPatient && <QuickExit className="ms-auto" />}
        {!isPatient && (
          <DemoLink to={ROUTES.patient} className={cn('ms-auto hidden sm:inline-flex lg:hidden xl:inline-flex text-sm whitespace-nowrap', TEXT_LINK)}>
            {c.toPatientArea}
          </DemoLink>
        )}
      </div>
    </div>
  );
}

// ── Footer ──────────────────────────────────────────────────────────────────

/**
 * The site footer, used by every part of V3 (Metiv pages, patient area, therapist area).
 * The extra bottom padding keeps its last line clear of the chat button
 * (ChatbotFAB, fixed at the bottom-left corner) when scrolled to the end.
 */
export function Footer() {
  const c = useCopy('chrome');
  const { ORG, PATIENT_HUB, ROUTE_META } = useMetiv();
  const { eran: ERAN, eranWa: ERAN_WA } = useCrisisLines();
  return (
    <footer className="bg-muted text-foreground border-t border-border">
      <div>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-8 pb-24 grid gap-8 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="space-y-3">
            <img src={LOGO} alt={c.brand} className="h-12 w-auto" />
            <p className="text-sm text-muted-foreground">{fmt(c.footerOrg, { name: ORG.name, legalEntity: ORG.legalEntity, address: ORG.address })}</p>
            <p className="text-sm text-muted-foreground">
              {fmtNodes(c.footerContact, {
                phone: <a href={`tel:${ORG.phones.main.replace(/\D/g, '')}`} className={TEXT_LINK} dir="ltr">{ORG.phones.main}</a>,
                email: <a href={`mailto:${ORG.emails.general}`} className={TEXT_LINK} dir="ltr">{ORG.emails.general}</a>,
              })}
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {['about', 'donate', 'contact', 'sources', 'accessibility', 'privacy', 'terms'].map((k) => (
                <li key={k}><DemoLink to={ROUTES[k]} className={cn('text-foreground hover:text-accent underline-offset-4 hover:underline rounded-sm', FOCUS)}>{ROUTE_META?.[k]?.label}</DemoLink></li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">{fmt(c.footerDisclaimer, { disclaimer: PATIENT_HUB?.disclaimer ?? '' })}</p>
          </div>
          <div className="rounded-super bg-card border border-border p-5 self-start md:w-72">
            <p className="font-heading font-semibold">{c.eranCardTitle}</p>
            <a href={ERAN?.href || 'tel:1201'} className={cn('mt-2 flex items-center gap-2 text-2xl font-heading font-semibold text-accent rounded-sm', FOCUS)}>
              <Phone className="w-5 h-5" aria-hidden="true" /> {c.eran1201}
            </a>
            <a href={ERAN_WA?.href} target="_blank" rel="noopener noreferrer" className={cn('mt-1 inline-block text-sm', TEXT_LINK)}>
              {c.eranCardWhatsapp} <NewTabHint />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SkipLink() {
  const c = useCopy('chrome');
  return (
    <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-50 focus:rounded-full focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2">
      {c.skipLink}
    </a>
  );
}

// ── Shells ──────────────────────────────────────────────────────────────────

/**
 * Page shell for the Metiv general pages and the therapist area (the patient
 * area has its own layout). Both carry the chat button, in the same corner as
 * the patient area's.
 * @param {{ area: Area }} props
 */
export function SiteShell({ area }) {
  const { pathname } = useLocation();
  const { key } = resolveRoute(pathname);
  const { NEXT_STEPS } = useMetiv();
  const { lang, dir } = useLangDir();
  const next = area === 'patient' && key ? NEXT_STEPS?.[key] : undefined;
  return (
    <div dir={dir} lang={lang} className="min-h-screen flex flex-col bg-background">
      <SkipLink />
      <div className="sticky top-0 z-40">
        <Header area={area} />
        {area !== 'metiv' && <AreaNav area={area} />}
      </div>
      <main id="main" className="flex-1">
        <Outlet />
        {next && (
          <Band tone="canvas" padding="pt-4 pb-16">
            <WasThisHelpful steps={next} />
          </Band>
        )}
      </main>
      <Footer />
      <ChatbotFAB />
    </div>
  );
}

/** Distraction-free shell for the calming exercises. */
export function SanctuaryShell() {
  const { pathname } = useLocation();
  const { key } = resolveRoute(pathname);
  const c = useCopy('chrome');
  const { eran: ERAN } = useCrisisLines();
  const backTo = key === 'calming' ? ROUTES.patient : ROUTES.calming;
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SkipLink />
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <DemoLink to={backTo} className={cn('inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground rounded-full px-2 py-1', FOCUS)}>
            <ArrowRight className="w-4 h-4 ltr:-scale-x-100" aria-hidden="true" />
            <span className="whitespace-nowrap">{key === 'calming' ? c.backToTopics : c.backToExercises}</span>
          </DemoLink>
          <div className="ms-auto flex items-center gap-3">
            <a href={ERAN?.href || 'tel:1201'} className={cn('text-sm whitespace-nowrap text-muted-foreground hover:text-foreground rounded-sm', FOCUS)}>{c.eran1201}</a>
            <QuickExit />
          </div>
        </div>
      </header>
      <main id="main" className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

// ── Behaviour: scroll + document meta ───────────────────────────────────────

const HEADER_OFFSET = 128;

/** Scrolls to the top on navigation, or to location.hash once it renders. */
export function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (typeof window.scrollTo !== 'function') return undefined;
    if (!hash) {
      window.scrollTo(0, 0);
      return undefined;
    }
    const id = decodeURIComponent(hash.slice(1));
    let tries = 0;
    /** @type {ReturnType<typeof setTimeout>|undefined} */
    let timer;
    const attempt = () => {
      const el = document.getElementById(id);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
        window.scrollTo({ top: Math.max(0, top) });
        return;
      }
      if (tries++ < 30) timer = setTimeout(attempt, 50);
    };
    attempt();
    return () => clearTimeout(timer);
  }, [pathname, hash]);
  return null;
}

/** Document title per route and a noindex robots meta while the demo is mounted. */
export function DocumentMeta() {
  const { pathname } = useLocation();
  const c = useCopy('chrome');
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
  useEffect(() => {
    const { key, params } = resolveRoute(pathname);
    const label = routeLabel(key, params);
    document.title = key && key !== 'home' ? fmt(c.docTitle, { label, brand: c.brand }) : fmt(c.docTitleHome, { brand: c.brand });
  }, [pathname, c]);
  return null;
}
