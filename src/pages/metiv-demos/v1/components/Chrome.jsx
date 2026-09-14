import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowRight, Menu, MessageCircle, Phone, Wind, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DemoLink, useDemoPath } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { PATIENT_HUB, PATIENT_NAV } from '@/pages/metiv-demos/shared/patient';
import { NAV, ORG } from '@/pages/metiv-demos/shared/therapist';
import { EXIT_URL, isIllustration, patientLabel, patientNavLabel } from '../lib';
import { Arch, CONTAINER, Eyebrow, FOCUS, LOGO, PillLink } from './primitives';

const [ERAN, ERAN_WHATSAPP] = PATIENT_HUB.crisisLines;
const PATIENT_ITEMS = PATIENT_NAV.map((item) => ({ ...item, label: patientLabel(item) }));
const PATIENT_NAV_ITEMS = PATIENT_NAV.map((item) => ({ ...item, label: patientNavLabel(item) }));

const AREA_LABEL = {
  patient: 'למתמודדים ולמשפחות',
  therapist: 'לאנשי טיפול ומקצוע',
};

// ── Quick exit (GOV.UK "Exit this page" pattern) ──

export function quickExit() {
  window.location.replace(EXIT_URL);
}

/** Shift pressed three times within a second leaves the site. @param {boolean} enabled */
export function useQuickExitShortcut(enabled) {
  useEffect(() => {
    if (!enabled) return undefined;
    /** @type {number[]} */
    let presses = [];
    /** @param {KeyboardEvent} e */
    const onKey = (e) => {
      if (e.key !== 'Shift' || e.repeat) return;
      const now = Date.now();
      presses = [...presses.filter((t) => now - t < 1000), now];
      if (presses.length >= 3) quickExit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);
}

/** @param {any} props */
export function QuickExitButton({ className }) {
  return (
    <Button
      type="button"
      variant="pill-light"
      size="xs"
      radius="full"
      onClick={quickExit}
      className={cn('h-7 gap-1.5 px-3 text-xs', className)}
    >
      <X className="h-3.5 w-3.5" aria-hidden="true" />
      יציאה מהירה
      <span className="sr-only">: מעבר מיידי לאתר אחר. אפשר גם ללחוץ שלוש פעמים על Shift.</span>
    </Button>
  );
}

// ── Crisis strip, always at the top ──

/** @param {any} props */
function CrisisStrip({ area }) {
  const link = cn('inline-flex items-center gap-1.5 rounded-sm underline-offset-4 hover:underline', FOCUS);
  return (
    <div className="bg-sanctuary text-sanctuary-foreground">
      <div className={cn(CONTAINER, 'flex h-9 items-center justify-between gap-3 text-xs sm:text-sm')}>
        <p className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="hidden text-sanctuary-foreground/80 sm:inline">צריך/ה לדבר עם מישהו עכשיו?</span>
          <a href={ERAN.href} className={cn(link, 'font-semibold')}>
            <Phone className="h-3.5 w-3.5" aria-hidden="true" />
            ער&quot;ן <span className="tabular-nums">{ERAN.value}</span>
          </a>
          <span aria-hidden="true" className="text-sanctuary-foreground/40">·</span>
          <a href={ERAN_WHATSAPP.href} target="_blank" rel="noreferrer" className={link}>
            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
            וואטסאפ
          </a>
        </p>
        {area === 'patient' ? (
          <QuickExitButton />
        ) : (
          <span className="hidden text-sanctuary-foreground/70 md:inline">אתר הדגמה</span>
        )}
      </div>
    </div>
  );
}

// ── Header ──

const TOP_LINKS = [
  { to: ROUTES.about, label: 'אודות' },
  { to: ROUTES.events, label: 'חדשות ואירועים' },
  { to: ROUTES.donate, label: 'תרומה' },
  { to: ROUTES.contact, label: 'צור קשר' },
];

/** @param {any} props */
export function SiteHeader({ area }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const resolve = useDemoPath();
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40">
        <CrisisStrip area={area} />
        <div
          className={cn(
            'border-b bg-background/95 backdrop-blur transition-[border-color,box-shadow] duration-300',
            scrolled ? 'border-border shadow-atmospheric' : 'border-transparent'
          )}
        >
          <div
            className={cn(
              CONTAINER,
              'flex items-center gap-4 transition-[height] duration-300 motion-reduce:transition-none',
              scrolled ? 'h-14 md:h-16' : 'h-14 md:h-20'
            )}
          >
            <DemoLink to="/" className={cn('shrink-0 rounded-md', FOCUS)}>
              <img
                src={LOGO}
                alt="מטיב - המרכז הישראלי לטיפול בפסיכוטראומה, לדף הבית"
                className={cn('w-auto transition-[height] duration-300', scrolled ? 'h-8 md:h-9' : 'h-8 md:h-11')}
              />
            </DemoLink>

            <nav aria-label="ניווט ראשי" className="ms-4 hidden xl:block">
              <ul className="flex items-center gap-6 text-sm">
                {TOP_LINKS.map((l) => {
                  const active = pathname === resolve(l.to);
                  return (
                    <li key={l.to}>
                      <DemoLink
                        to={l.to}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'rounded-sm underline-offset-[6px] transition-colors hover:text-primary hover:underline',
                          FOCUS,
                          active ? 'text-foreground underline decoration-secondary' : 'text-muted-foreground'
                        )}
                      >
                        {l.label}
                      </DemoLink>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="ms-auto flex items-center gap-2">
              <PillLink
                to={ROUTES.patient}
                tone="primary"
                size="sm"
                aria-current={area === 'patient' ? 'true' : undefined}
                className={cn('hidden md:inline-flex', area === 'patient' && 'ring-2 ring-primary/30 ring-offset-2 ring-offset-background')}
              >
                למתמודדים ולמשפחות
              </PillLink>
              <PillLink
                to={ROUTES.therapist}
                tone="dark"
                size="sm"
                aria-current={area === 'therapist' ? 'true' : undefined}
                className={cn('hidden md:inline-flex', area === 'therapist' && 'ring-2 ring-sanctuary/30 ring-offset-2 ring-offset-background')}
              >
                לאנשי מקצוע
              </PillLink>
              <Button
                type="button"
                variant="subtle"
                radius="full"
                size="sm"
                className="ms-1 h-9 gap-2 px-3"
                aria-expanded={open}
                aria-controls="v1-menu"
                onClick={() => setOpen(true)}
              >
                <Menu className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">תפריט</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      {open && <MenuOverlay onClose={close} />}
    </>
  );
}

/** Two area CTAs for small screens, directly under the header. */
export function AreaSwitchRow() {
  return (
    <div className="border-b border-border bg-background md:hidden">
      <div className={cn(CONTAINER, 'grid grid-cols-2 gap-2 py-2.5')}>
        <PillLink to={ROUTES.patient} tone="primary" size="sm" className="w-full px-2 text-[0.8rem]">
          למתמודדים ולמשפחות
        </PillLink>
        <PillLink to={ROUTES.therapist} tone="dark" size="sm" className="w-full px-2 text-[0.8rem]">
          לאנשי מקצוע
        </PillLink>
      </div>
    </div>
  );
}

// ── Full-screen menu ──

/** @param {any} props */
function MenuColumn({ title, items, className }) {
  return (
    <nav aria-label={title} className={className}>
      <Eyebrow className="mb-5">{title}</Eyebrow>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.key}>
            <DemoLink
              to={item.route}
              className={cn('block rounded-sm py-1 font-heading text-2xl font-light leading-snug text-foreground transition-colors hover:text-primary md:text-3xl', FOCUS)}
            >
              {item.label}
            </DemoLink>
            {item.children?.length > 0 && (
              <ul className="mb-3 mt-1 flex flex-wrap gap-x-4 gap-y-1 ps-1 text-sm">
                {item.children.map((child) => (
                  <li key={`${item.key}-${child.key}`}>
                    <DemoLink to={child.route} className={cn('rounded-sm text-muted-foreground hover:text-primary hover:underline', FOCUS)}>
                      {child.label}
                    </DemoLink>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

const METIV_LINKS = [
  { key: 'home', label: 'דף הבית', route: ROUTES.home },
  { key: 'about', label: 'אודות מטיב', route: ROUTES.about },
  { key: 'events', label: 'חדשות ואירועים', route: ROUTES.events },
  { key: 'donate', label: 'תרומה', route: ROUTES.donate },
  { key: 'contact', label: 'צור קשר', route: ROUTES.contact },
];

/** @param {{ onClose: () => void }} props */
function MenuOverlay({ onClose }) {
  const closeRef = useRef(/** @type {HTMLButtonElement|null} */ (null));

  useEffect(() => {
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    /** @param {KeyboardEvent} e */
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div id="v1-menu" role="dialog" aria-modal="true" aria-label="תפריט האתר" dir="rtl" className="fixed inset-0 z-[60] overflow-y-auto bg-background">
      <div className="border-b border-border">
        <div className={cn(CONTAINER, 'flex h-16 items-center justify-between md:h-20')}>
          <img src={LOGO} alt="מטיב" className="h-8 w-auto md:h-10" />
          <Button ref={closeRef} type="button" variant="subtle" radius="full" size="sm" className="h-10 gap-2 px-4" onClick={onClose}>
            <X className="h-4 w-4" aria-hidden="true" />
            סגירה
          </Button>
        </div>
      </div>
      <div className={cn(CONTAINER, 'grid gap-12 py-10 md:grid-cols-12 md:gap-10 md:py-16')}>
        <MenuColumn className="md:col-span-4" title={AREA_LABEL.patient} items={PATIENT_ITEMS} />
        <MenuColumn className="md:col-span-4" title={AREA_LABEL.therapist} items={NAV} />
        <div className="space-y-10 md:col-span-4">
          <MenuColumn title="מטיב" items={METIV_LINKS} />
          <div className="rounded-super bg-sanctuary p-6 text-sanctuary-foreground">
            <p className="text-xs font-semibold tracking-wide text-sanctuary-foreground/80">קו חירום ותמיכה נפשית</p>
            <a href={ERAN.href} className={cn('mt-2 flex items-baseline gap-3 rounded-sm font-heading font-light', FOCUS)}>
              <span className="text-5xl tabular-nums">{ERAN.value}</span>
              <span className="text-lg">ער&quot;ן</span>
            </a>
            <a href={ERAN_WHATSAPP.href} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm underline underline-offset-4">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {ERAN_WHATSAPP.label}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Area sub-navigation ──

/** @param {{ area: 'patient'|'therapist' }} props */
export function AreaNav({ area }) {
  const { pathname } = useLocation();
  const resolve = useDemoPath();
  const items = area === 'patient' ? PATIENT_NAV_ITEMS : NAV;
  const hub = area === 'patient' ? ROUTES.patient : ROUTES.therapist;
  /** @param {string} route */
  const isActive = (route) => {
    const full = resolve(route);
    return route === hub ? pathname === full : pathname === full || pathname.startsWith(`${full}/`);
  };

  return (
    <div className="border-b border-border bg-card">
      <div className={cn(CONTAINER, 'flex items-center gap-5')}>
        <DemoLink
          to={hub}
          className={cn('hidden shrink-0 rounded-sm py-3 text-xs font-semibold tracking-wide text-muted-foreground hover:text-primary 2xl:block', FOCUS)}
        >
          {AREA_LABEL[area]}
        </DemoLink>
        <span aria-hidden="true" className="hidden h-5 w-px bg-border 2xl:block" />
        <nav aria-label={`ניווט ${AREA_LABEL[area]}`} className="-mx-3 min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex items-center whitespace-nowrap">
            {items.map((item) => {
              const active = isActive(item.route);
              return (
                <li key={item.key}>
                  <DemoLink
                    to={item.route}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative block rounded-sm px-3 py-3.5 text-sm transition-colors',
                      FOCUS,
                      active
                        ? 'font-medium text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {item.label}
                  </DemoLink>
                </li>
              );
            })}
          </ul>
        </nav>
        {area === 'patient' && (
          <DemoLink
            to={ROUTES.calming}
            className={cn('hidden shrink-0 items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-primary/20 md:inline-flex', FOCUS)}
          >
            <Wind className="h-4 w-4 text-primary" aria-hidden="true" />
            מה אפשר לעשות עכשיו
          </DemoLink>
        )}
      </div>
    </div>
  );
}

// ── Footer: a colophon with the cropped wordmark ──

const FOOTER_COLUMNS = [
  {
    title: 'מטיב',
    links: [
      { to: ROUTES.home, label: 'דף הבית' },
      { to: ROUTES.about, label: 'אודות' },
      { to: ROUTES.events, label: 'חדשות ואירועים' },
      { to: ROUTES.donate, label: 'תרומה' },
      { to: ROUTES.contact, label: 'צור קשר' },
    ],
  },
  {
    title: AREA_LABEL.patient,
    links: [
      { to: ROUTES.patient, label: 'ראשי' },
      { to: ROUTES.questionnaire, label: 'שאלון אנונימי' },
      { to: ROUTES.calming, label: 'תרגילי הרגעה' },
      { to: ROUTES.whereToGetHelp, label: 'איפה מקבלים טיפול' },
      { to: ROUTES.rights, label: 'זכויות' },
      { to: ROUTES.freeTreatment, label: 'טיפולים ללא עלות' },
    ],
  },
  {
    title: 'לאנשי מקצוע',
    links: [
      { to: ROUTES.therapist, label: 'ראשי' },
      { to: ROUTES.courses, label: 'קורסים והכשרות' },
      { to: ROUTES.supervision, label: 'הדרכה' },
      { to: ROUTES.organizations, label: 'לארגונים' },
      { to: ROUTES.research, label: 'מחקר' },
      { to: ROUTES.publications, label: 'פרסומים' },
    ],
  },
  {
    title: 'מידע',
    links: [
      { to: ROUTES.accessibility, label: 'הצהרת נגישות' },
      { to: ROUTES.privacy, label: 'מדיניות פרטיות' },
      { to: ROUTES.terms, label: 'תנאי שימוש' },
      { to: ROUTES.sources, label: 'מקורות המידע' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-sanctuary text-sanctuary-foreground">
      <div className={cn(CONTAINER, 'pt-16 md:pt-24')}>
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <span className="inline-block rounded-super-sm bg-card px-4 py-3">
              <img src={LOGO} alt="מטיב" className="h-10 w-auto" />
            </span>
            <p className="mt-6 max-w-sm leading-relaxed text-sanctuary-foreground/85">{ORG.name}</p>
            <p className="mt-1 text-sm text-sanctuary-foreground/70">{ORG.address}</p>
            <div className="mt-8 border-t border-sanctuary-foreground/15 pt-6">
              <p className="text-xs font-semibold tracking-wide text-sanctuary-foreground/70">קו חירום ותמיכה נפשית</p>
              <a href={ERAN.href} className={cn('mt-1 flex items-baseline gap-3 rounded-sm font-heading font-light', FOCUS)}>
                <span className="text-5xl tabular-nums">{ERAN.value}</span>
                <span className="text-lg">ער&quot;ן</span>
              </a>
              <a href={ERAN_WHATSAPP.href} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 text-sm text-sanctuary-foreground/85 underline underline-offset-4">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                {ERAN_WHATSAPP.label}
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-10 md:col-span-8 md:grid-cols-4 md:gap-8">
            {FOOTER_COLUMNS.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <p className="mb-4 text-xs font-semibold tracking-wide text-sanctuary-foreground/70">{col.title}</p>
                <ul className="space-y-2.5 text-sm">
                  {col.links.map((l) => (
                    <li key={l.to + l.label}>
                      <DemoLink to={l.to} className={cn('rounded-sm text-sanctuary-foreground/85 underline-offset-4 hover:text-sanctuary-foreground hover:underline', FOCUS)}>
                        {l.label}
                      </DemoLink>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
            <p className="col-span-2 text-sm text-sanctuary-foreground/80 md:col-span-4">
              גם וגם? אפשר לעבור בין האזור למתמודדים ולמשפחות לבין האזור לאנשי מקצוע בכל רגע.
            </p>
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-sanctuary-foreground/15 py-6 text-xs leading-relaxed text-sanctuary-foreground/70 md:flex-row md:items-center md:justify-between">
          <p>{PATIENT_HUB.disclaimer}</p>
          <p>{ORG.legalName} · {ORG.legalEntity} · אתר הדגמה, לא לפרסום</p>
        </div>
      </div>
      <p
        aria-hidden="true"
        className="pointer-events-none -mb-[0.28em] select-none text-center font-heading text-[clamp(7rem,26vw,22rem)] font-light leading-[0.8] text-sanctuary-foreground/[0.07]"
      >
        מטיב
      </p>
    </footer>
  );
}

// ── Page header (the DemoChrome PageHeader contract) ──

const TITLE_SIZE = {
  default: 'text-[2.3rem] sm:text-5xl md:text-6xl',
  editorial: 'text-[2.6rem] sm:text-6xl md:text-7xl',
  hero: 'text-[2.8rem] sm:text-6xl md:text-7xl lg:text-8xl',
};
const HEADER_PAD = { default: 'py-10 md:py-16', editorial: 'py-12 md:py-20', hero: 'py-14 md:py-28' };
const ARCH_WIDTH = { default: 'max-w-[13rem]', editorial: 'max-w-[17rem]', hero: 'max-w-[21rem]' };
const TONE_BG = {
  card: 'bg-card text-foreground border-b border-border',
  canvas: 'bg-background text-foreground border-b border-border',
  muted: 'bg-muted text-foreground',
  dark: 'bg-sanctuary text-sanctuary-foreground',
};

/**
 * Editorial page header. Same props as patterns/PageHeader.
 * @param {{ title: React.ReactNode, subtitle?: React.ReactNode, eyebrow?: React.ReactNode, actions?: React.ReactNode, image?: string, imageOpacity?: number, size?: 'default'|'editorial'|'hero', align?: 'center'|'start', tone?: 'card'|'canvas'|'muted'|'dark', className?: string }} props
 */
export function PageHeaderV1({ title, subtitle, eyebrow, actions, image, size = 'default', align = 'center', tone = 'card', className }) {
  const dark = tone === 'dark';
  const centered = align === 'center' && !image;
  return (
    <div className={cn('relative', TONE_BG[tone] || TONE_BG.card, className)}>
      <div className={cn(CONTAINER, HEADER_PAD[size] || HEADER_PAD.default, 'grid items-center gap-10 lg:grid-cols-12')}>
        <div className={cn(image ? 'lg:col-span-7' : 'lg:col-span-10', centered && 'mx-auto max-w-4xl text-center lg:col-span-12')}>
          {eyebrow && (
            <Eyebrow tone={dark ? 'dark' : 'light'} className={cn('mb-5', centered && 'justify-center')}>
              {eyebrow}
            </Eyebrow>
          )}
          <h1 className={cn('font-heading font-light leading-[1.06] tracking-tight', TITLE_SIZE[size] || TITLE_SIZE.default)}>{title}</h1>
          {subtitle && (
            <p className={cn('mt-6 max-w-2xl text-lg leading-relaxed md:text-xl', dark ? 'text-sanctuary-foreground/80' : 'text-muted-foreground', centered && 'mx-auto')}>
              {subtitle}
            </p>
          )}
          {actions && <div className={cn('mt-8 flex flex-wrap gap-3', centered && 'justify-center')}>{actions}</div>}
        </div>
        {image && (
          <div className="hidden lg:col-span-4 lg:col-start-9 lg:block">
            <Arch
              src={image}
              contain={isIllustration(image)}
              aspect="aspect-[4/5]"
              eager
              className={cn('mx-auto w-full', ARCH_WIDTH[size] || ARCH_WIDTH.default, dark && 'bg-sanctuary-foreground/10')}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shells ──

/** @param {{ area?: 'patient'|'therapist', landing?: boolean, children: React.ReactNode }} props */
export function MainShell({ area, landing = false, children }) {
  useQuickExitShortcut(area === 'patient');
  return (
    <div dir="rtl" lang="he" className="flex min-h-screen flex-col bg-background font-body text-foreground">
      <a
        href="#v1-main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-[70] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        דילוג לתוכן
      </a>
      <SiteHeader area={area} />
      {!landing && <AreaSwitchRow />}
      {area && <AreaNav area={area} />}
      <main id="v1-main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

/** Minimal, distraction-free shell for the calming exercises. @param {{ routeKey: string, children: React.ReactNode }} props */
export function SanctuaryShell({ routeKey, children }) {
  useQuickExitShortcut(true);
  const back = routeKey === 'calming'
    ? { to: ROUTES.patient, label: 'חזרה לאזור המידע' }
    : { to: ROUTES.calming, label: 'חזרה לתרגילים' };
  return (
    <div dir="rtl" lang="he" className="min-h-screen bg-background font-body text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-5">
          <DemoLink to={back.to} className={cn('inline-flex items-center gap-2 rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground', FOCUS)}>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
            {back.label}
          </DemoLink>
          <div className="flex items-center gap-3">
            <a href={ERAN.href} className={cn('rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground', FOCUS)}>
              ער&quot;ן {ERAN.value}
            </a>
            <QuickExitButton />
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
