import React, { useEffect, useId, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ArrowRight, GraduationCap, HeartHandshake, LifeBuoy, LogOut, Menu, MessageCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { PATIENT_HUB, PATIENT_NAV } from '@/pages/metiv-demos/shared/patient';
import { NAV as THERAPIST_NAV, ORG } from '@/pages/metiv-demos/shared/therapist';
import { cn } from '@/lib/utils';
import { resolveRoute, routeLabel, ROUTE_META, NEXT_STEPS, BRAND } from '../meta';
import { Band, FOCUS, TEXT_LINK, WasThisHelpful } from './kit';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from './Sheet';

const LOGO = `${import.meta.env.BASE_URL || '/'}images/metiv-demo/metiv-logo.png`;
const EXIT_URL = 'https://www.google.com/search?q=weather';
const ERAN = PATIENT_HUB.crisisLines.find((l) => l.key === 'eranPhone');
const ERAN_WA = PATIENT_HUB.crisisLines.find((l) => l.key === 'eranWhatsapp');

const AREAS = [
  { key: 'patient', label: 'למטופלים ולמשפחות', short: 'מטופלים ומשפחות', to: ROUTES.patient, icon: HeartHandshake },
  { key: 'therapist', label: 'לאנשי טיפול ומקצוע', short: 'אנשי מקצוע', to: ROUTES.therapist, icon: GraduationCap },
];

/** @typedef {'metiv'|'patient'|'therapist'} Area */

// The kit's path titles are split headline fragments ("מתמודד/ת עם"); use full labels in navigation.
/** @type {Record<string, string>} */
const NAV_LABELS = { firstCircle: ROUTE_META.firstCircle.label, secondCircle: ROUTE_META.secondCircle.label, questionnaire: ROUTE_META.questionnaire.label };

/** @type {typeof PATIENT_NAV[number]} */
const RELEASE_JOURNEY_ITEM = { key: 'releaseJourney', label: 'מסע שחרור', route: `${ROUTES.whereToGetHelp}#release-journey` };

// The full menu's patient list: the kit nav with מסע שחרור right above "איפה מקבלים טיפול".
const MENU_PATIENT_NAV = PATIENT_NAV.flatMap((item) => (item.key === 'whereToGetHelp' ? [RELEASE_JOURNEY_ITEM, item] : [item]));

// ── Help now: the crisis line lives in the header button, on every page ─────

function HelpNowContent() {
  return (
    <div dir="rtl" className="space-y-3 text-start">
      <p className="font-heading font-semibold text-foreground">עזרה עכשיו</p>
      <p className="text-sm text-muted-foreground">אפשר לבחור את הדרך שהכי נוחה לך.</p>
      <a href={ERAN?.href || 'tel:1201'} className={cn('flex items-center gap-3 rounded-2xl bg-muted p-3 hover:bg-primary/10 transition-natural', FOCUS)}>
        <Phone className="w-5 h-5 text-accent" aria-hidden="true" />
        <span>
          <span className="block font-semibold text-foreground">שיחה עם ער"ן: 1201</span>
          <span className="block text-xs text-muted-foreground">עזרה ראשונה נפשית בטלפון</span>
        </span>
      </a>
      <a href={ERAN_WA?.href} target="_blank" rel="noopener noreferrer" className={cn('flex items-center gap-3 rounded-2xl bg-muted p-3 hover:bg-primary/10 transition-natural', FOCUS)}>
        <MessageCircle className="w-5 h-5 text-accent" aria-hidden="true" />
        <span>
          <span className="block font-semibold text-foreground">ער"ן בוואטסאפ</span>
          <span className="block text-xs text-muted-foreground">כתיבה במקום שיחה (נפתח בלשונית חדשה)</span>
        </span>
      </a>
      <DemoLink to={PATIENT_HUB.consultation.route} className={cn('flex items-center gap-3 rounded-2xl bg-muted p-3 hover:bg-primary/10 transition-natural', FOCUS)}>
        <LifeBuoy className="w-5 h-5 text-accent" aria-hidden="true" />
        <span>
          <span className="block font-semibold text-foreground">{PATIENT_HUB.consultation.title}</span>
          <span className="block text-xs text-muted-foreground">שיחת התייעצות עם מטיב</span>
        </span>
      </DemoLink>
      <p className="text-xs text-muted-foreground">במצב חירום רפואי: מד"א 101.</p>
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
  useEffect(() => setOpen(false), [pathname]);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="pill-outline" size="pill" className={cn('h-10 gap-1.5 border-secondary/60', compact ? 'px-3 sm:px-4' : 'px-4')}>
          <LifeBuoy className="w-4 h-4 text-secondary" aria-hidden="true" />
          <span className={compact ? 'sr-only sm:not-sr-only' : undefined}>עזרה עכשיו</span>
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
      <span id={hintId} className="sr-only">יוצא מיד לאתר אחר. אפשר גם ללחוץ Shift שלוש פעמים.</span>
      <Button variant="subtle" size="sm" radius="full" onClick={exitNow} aria-describedby={hintId} className="h-9 px-3.5 gap-1.5 border border-border">
        <LogOut className="w-4 h-4" aria-hidden="true" />
        יציאה מהירה
      </Button>
    </div>
  );
}

// ── Header, area nav, full menu ─────────────────────────────────────────────

/** @param {{ area: Area }} props */
function MenuSheet({ area }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  const link = cn('block rounded-xl px-3 py-2 text-foreground hover:bg-muted transition-natural', FOCUS);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="pill" className="h-10 px-3 gap-1.5 text-foreground hover:bg-muted hover:text-foreground" aria-label="תפריט מלא">
          <Menu className="w-5 h-5" aria-hidden="true" />
          <span className="hidden sm:inline">תפריט</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto bg-background p-0">
        <div dir="rtl" className="p-6 pt-12 text-start">
          <SheetTitle className="font-heading text-2xl">לאן תרצה/י להגיע?</SheetTitle>
          <SheetDescription className="mt-1">כל העמודים באתר, במקום אחד.</SheetDescription>

          <nav aria-label="תפריט מלא" className="mt-6 space-y-6">
            <section>
              <h2 className="flex items-center gap-2 font-heading font-semibold text-accent mb-2">
                <HeartHandshake className="w-4 h-4" aria-hidden="true" /> למטופלים ולמשפחות
              </h2>
              <ul className="space-y-0.5">
                {MENU_PATIENT_NAV.map((item) => (
                  <li key={item.key}>
                    <DemoLink to={item.route} className={cn(link, 'font-medium')}>{item.key === 'patient' ? 'כל הנושאים' : NAV_LABELS[item.key] || item.label}</DemoLink>
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
                <GraduationCap className="w-4 h-4" aria-hidden="true" /> לאנשי טיפול ומקצוע
              </h2>
              <ul className="space-y-0.5">
                {THERAPIST_NAV.map((item) => (
                  <li key={item.key}><DemoLink to={item.route} className={cn(link, 'font-medium')}>{item.key === 'therapist' ? 'ראשי' : item.label}</DemoLink></li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="font-heading font-semibold text-accent mb-2">מטיב</h2>
              <ul className="space-y-0.5">
                {['home', 'about', 'donate', 'contact', 'accessibility', 'privacy', 'terms'].map((k) => (
                  <li key={k}><DemoLink to={ROUTES[k]} className={cn(link, 'font-medium')}>{ROUTE_META[k].label}</DemoLink></li>
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
  return (
    <div className="bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center gap-3">
        <DemoLink to={ROUTES.home} className={cn('flex-shrink-0 rounded-lg', FOCUS)} aria-label="מטיב, לדף הבית">
          <img src={LOGO} alt="מטיב - המרכז הישראלי לטיפול בפסיכוטראומה" className="h-10 sm:h-11 w-auto" />
        </DemoLink>

        <div className="ms-auto flex items-center gap-1.5 sm:gap-2">
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
  const isPatient = area === 'patient';
  const meta = AREAS.find((a) => a.key === area);
  const Icon = meta?.icon || HeartHandshake;
  const items = isPatient
    ? PATIENT_NAV.map((i) => ({ key: i.key, label: i.key === 'patient' ? 'כל הנושאים' : NAV_LABELS[i.key] || i.label, route: i.route, childKeys: (i.children || []).map((c) => c.key) }))
    : THERAPIST_NAV.map((i) => ({ key: i.key, label: i.key === 'therapist' ? 'ראשי' : i.label, route: i.route, childKeys: [] }));
  const parentKey = key ? ROUTE_META[key]?.parent : undefined;
  const isActive = (/** @type {{ key: string, childKeys: string[] }} */ i) => i.key === key || (i.key !== area && i.key === parentKey);

  return (
    <div className="bg-card border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-2 flex items-center gap-3">
        <DemoLink to={meta?.to || '/'} className={cn('inline-flex items-center gap-2 font-heading font-semibold text-foreground whitespace-nowrap rounded-lg', FOCUS)}>
          <span className="w-7 h-7 rounded-full bg-primary/10 text-accent flex items-center justify-center">
            <Icon className="w-4 h-4" aria-hidden="true" />
          </span>
          <span className="lg:sr-only">{meta?.label}</span>
        </DemoLink>
        <nav aria-label={`ניווט ב${meta?.label || 'אזור'}`} className="hidden lg:block min-w-0 flex-1">
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
            לאזור המטופלים
          </DemoLink>
        )}
      </div>
    </div>
  );
}

// ── Footer ──────────────────────────────────────────────────────────────────

/** The site footer, used by every part of V3 (Metiv pages, patient area, therapist area). */
export function Footer() {
  return (
    <footer className="bg-muted text-foreground border-t border-border">
      <div>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-8 pb-10 grid gap-8 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="space-y-3">
            <img src={LOGO} alt="מטיב" className="h-12 w-auto" />
            <p className="text-sm text-muted-foreground">{ORG.name}, {ORG.legalEntity}. {ORG.address}.</p>
            <p className="text-sm text-muted-foreground">
              טלפון: <a href={`tel:${ORG.phones.main.replace(/\D/g, '')}`} className={TEXT_LINK} dir="ltr">{ORG.phones.main}</a>
              {' · '}מייל: <a href={`mailto:${ORG.emails.general}`} className={TEXT_LINK} dir="ltr">{ORG.emails.general}</a>
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {['about', 'donate', 'contact', 'sources', 'accessibility', 'privacy', 'terms'].map((k) => (
                <li key={k}><DemoLink to={ROUTES[k]} className={cn('text-foreground hover:text-accent underline-offset-4 hover:underline rounded-sm', FOCUS)}>{ROUTE_META[k].label}</DemoLink></li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">{PATIENT_HUB.disclaimer} · אתר הדגמה בלבד, לא לפרסום.</p>
          </div>
          <div className="rounded-super bg-card border border-border p-5 self-start md:w-72">
            <p className="font-heading font-semibold">ער"ן, עזרה ראשונה נפשית</p>
            <a href={ERAN?.href || 'tel:1201'} className={cn('mt-2 flex items-center gap-2 text-2xl font-heading font-semibold text-accent rounded-sm', FOCUS)}>
              <Phone className="w-5 h-5" aria-hidden="true" /> ער"ן 1201
            </a>
            <a href={ERAN_WA?.href} target="_blank" rel="noopener noreferrer" className={cn('mt-1 inline-block text-sm', TEXT_LINK)}>
              או בוואטסאפ<span className="sr-only"> (נפתח בלשונית חדשה)</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SkipLink() {
  return (
    <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-50 focus:rounded-full focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2">
      דילוג לתוכן
    </a>
  );
}

// ── Shells ──────────────────────────────────────────────────────────────────

/** Page shell for the Metiv general pages and the two areas. @param {{ area: Area }} props */
export function SiteShell({ area }) {
  const { pathname } = useLocation();
  const { key } = resolveRoute(pathname);
  const next = area === 'patient' && key ? NEXT_STEPS[key] : undefined;
  return (
    <div dir="rtl" lang="he" className="min-h-screen flex flex-col bg-background">
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
    </div>
  );
}

/** Distraction-free shell for the calming exercises. */
export function SanctuaryShell() {
  const { pathname } = useLocation();
  const { key } = resolveRoute(pathname);
  const backTo = key === 'calming' ? ROUTES.patient : ROUTES.calming;
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SkipLink />
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <DemoLink to={backTo} className={cn('inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground rounded-full px-2 py-1', FOCUS)}>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
            <span className="whitespace-nowrap">{key === 'calming' ? 'לכל הנושאים' : 'לתרגילים'}</span>
          </DemoLink>
          <div className="ms-auto flex items-center gap-3">
            <a href={ERAN?.href || 'tel:1201'} className={cn('text-sm whitespace-nowrap text-muted-foreground hover:text-foreground rounded-sm', FOCUS)}>ער"ן 1201</a>
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
    document.title = key && key !== 'home' ? `${label} | ${BRAND} (הדגמה v3)` : `${BRAND} - המרכז הישראלי לטיפול בפסיכוטראומה (הדגמה v3)`;
  }, [pathname]);
  return null;
}
