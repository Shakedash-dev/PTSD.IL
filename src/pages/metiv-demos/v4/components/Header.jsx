import React, { useEffect, useId, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronRight, Menu, Phone, MessageCircle, CalendarDays, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from './ui';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { PATIENT_HUB } from '@/pages/metiv-demos/shared/patient';
import { ORG, UPCOMING_EVENTS } from '@/pages/metiv-demos/shared/therapist';
import { cn } from '@/lib/utils';
import Icon from './Icon';
import QuickExit from './QuickExit';
import { PATIENT_MENU, THERAPIST_MENU, METIV_MENU, areaOf, relativePath } from '../lib/nav';

export const LOGO = `${import.meta.env.BASE_URL || '/'}images/metiv-demo/metiv-logo.png`;

const ERAN = PATIENT_HUB.crisisLines.find((l) => l.key === 'eranPhone');
const ERAN_WA = PATIENT_HUB.crisisLines.find((l) => l.key === 'eranWhatsapp');

/** @typedef {import('../lib/nav').MenuGroup} MenuGroup */

const MENUS = [
  { key: 'patient', label: 'למתמודדים ולמשפחות', short: 'מטופלים ומשפחות', route: ROUTES.patient, groups: PATIENT_MENU, stripe: 'bg-secondary', intro: 'מידע, כלים והכוונה לאנשים שחוו טראומה ולבני המשפחה.' },
  { key: 'therapist', label: 'לאנשי מקצוע', short: 'אנשי מקצוע', route: ROUTES.therapist, groups: THERAPIST_MENU, stripe: 'bg-primary', intro: 'קורסים, הכשרות, הדרכה, מחקר ופרסומים.' },
  { key: 'metiv', label: 'אודות מטיב', short: 'אודות', route: ROUTES.about, groups: METIV_MENU, stripe: 'bg-foreground', intro: ORG.name },
];

/** Featured column per mega menu. @param {{ menuKey: string }} props */
function Featured({ menuKey }) {
  if (menuKey === 'patient') {
    return (
      <div className="flex h-full flex-col rounded-super-sm bg-muted p-5">
        <p className="font-heading text-lg font-semibold text-foreground">צריכים לדבר עם מישהו עכשיו?</p>
        <p className="mt-1 text-sm text-muted-foreground">ער"ן, עזרה ראשונה נפשית. זמין בכל שעה, ללא עלות.</p>
        <Button asChild variant="solid" radius="full" size="roomy" className="mt-4 w-full">
          <a href={ERAN?.href}>
            <Phone aria-hidden="true" />
            חיוג ל{'ער"ן'} {ERAN?.value}
          </a>
        </Button>
        <a href={ERAN_WA?.href} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center justify-center gap-2 text-sm font-medium text-primary hover:underline">
          <MessageCircle aria-hidden="true" className="w-4 h-4" /> {ERAN_WA?.label}
        </a>
        <DemoLink to={PATIENT_HUB.consultation.route} className="mt-auto pt-4 text-sm font-medium text-foreground underline underline-offset-4 hover:text-primary">
          {PATIENT_HUB.consultation.title}
        </DemoLink>
      </div>
    );
  }
  if (menuKey === 'therapist') {
    const next = UPCOMING_EVENTS[0];
    return (
      <div className="flex h-full flex-col rounded-super-sm bg-muted p-5">
        <p className="text-sm font-semibold text-primary">המחזור הקרוב</p>
        {next ? (
          <>
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarDays aria-hidden="true" className="w-4 h-4" /> {next.date}
            </p>
            <p className="mt-1 font-heading text-lg font-semibold leading-snug text-foreground">{next.title}</p>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{next.summary}</p>
            <Button asChild variant="solid" radius="full" size="roomy" className="mt-auto w-full">
              <DemoLink to={next.link || ROUTES.events}>לפרטים והרשמה</DemoLink>
            </Button>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">אין כרגע מחזורים מתוכננים.</p>
        )}
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col rounded-super-sm bg-muted p-5 text-sm">
      <p className="font-heading text-lg font-semibold text-foreground">{ORG.shortName}</p>
      <p className="mt-1 text-muted-foreground">{ORG.address}</p>
      <a href={`tel:${ORG.phones.main}`} className="mt-3 font-medium text-primary hover:underline" dir="ltr">{ORG.phones.main}</a>
      <a href={`mailto:${ORG.emails.general}`} className="font-medium text-primary hover:underline">{ORG.emails.general}</a>
      <Button asChild variant="outline" radius="full" size="roomy" className="mt-auto w-full bg-card">
        <DemoLink to={ROUTES.contact}>כל פרטי הקשר</DemoLink>
      </Button>
    </div>
  );
}

/** @param {{ groups: MenuGroup[], onNavigate?: () => void, compact?: boolean }} props */
function GroupColumns({ groups, onNavigate, compact = false }) {
  return (
    <div className={cn('grid gap-x-6 gap-y-6', !compact && (groups.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'))}>
      {groups.map((g) => (
        <div key={g.title}>
          <p className="mb-2 border-b border-border pb-2 text-sm font-semibold text-muted-foreground">{g.title}</p>
          <ul className="space-y-0.5">
            {g.links.map((l) => (
              <li key={l.key}>
                <DemoLink
                  to={l.route}
                  onClick={onNavigate}
                  className="group flex gap-3 rounded-xl p-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-primary group-hover:bg-card">
                    <Icon name={l.icon} className="w-4 h-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium leading-snug text-foreground">{l.label}</span>
                    {l.description && !compact && <span className="mt-0.5 block text-sm leading-snug text-muted-foreground line-clamp-2">{l.description}</span>}
                  </span>
                </DemoLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** @param {{ open: boolean, onOpenChange: (o: boolean) => void }} props */
function MobileMenu({ open, onOpenChange }) {
  const [level, setLevel] = useState(/** @type {string|null} */ (null));
  const menu = MENUS.find((m) => m.key === level);
  const close = () => onOpenChange(false);

  useEffect(() => { if (!open) setLevel(null); }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-sm flex-col gap-0 overflow-y-auto border-border bg-card p-0">
        <div className="flex h-14 items-center border-b border-border pe-4 ps-14">
          {menu ? (
            <Button variant="quiet" size="xs" className="-ms-2 gap-1 text-foreground" onClick={() => setLevel(null)}>
              <ChevronRight aria-hidden="true" /> חזרה לתפריט
            </Button>
          ) : (
            <img src={LOGO} alt="מטיב" className="h-8 w-auto" />
          )}
        </div>
        <SheetTitle className="sr-only">{menu ? menu.label : 'תפריט ראשי'}</SheetTitle>
        <SheetDescription className="sr-only">ניווט באתר מטיב</SheetDescription>
        {menu ? (
          <div className="p-4">
            <div className="mb-4 flex items-center gap-2">
              <span aria-hidden="true" className={cn('h-1 w-6 rounded-full', menu.stripe)} />
              <p className="font-heading text-xl font-semibold text-foreground">{menu.label}</p>
            </div>
            <DemoLink to={menu.route} onClick={close} className="mb-5 flex items-center justify-between rounded-xl bg-muted px-4 py-3 font-medium text-foreground">
              לעמוד הראשי של האזור <ArrowLeft aria-hidden="true" className="w-4 h-4" />
            </DemoLink>
            <GroupColumns groups={menu.groups} onNavigate={close} compact />
          </div>
        ) : (
          <nav aria-label="תפריט ראשי" className="p-4">
            <ul className="space-y-2">
              {MENUS.map((m) => (
                <li key={m.key}>
                  <Button
                    variant="outline-subtle"
                    size="none"
                    className="flex w-full items-center justify-between rounded-xl px-4 py-4 text-start text-lg font-semibold text-foreground"
                    onClick={() => setLevel(m.key)}
                  >
                    <span className="flex items-center gap-3">
                      <span aria-hidden="true" className={cn('h-6 w-1 rounded-full', m.stripe)} />
                      {m.label}
                    </span>
                    <ChevronLeft aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
            <ul className="mt-6 space-y-1 border-t border-border pt-4">
              {[
                { to: ROUTES.events, label: 'אירועים ועדכונים' },
                { to: ROUTES.donate, label: 'תרומה' },
                { to: ROUTES.contact, label: 'יצירת קשר' },
                { to: ROUTES.accessibility, label: 'נגישות' },
              ].map((l) => (
                <li key={l.to}>
                  <DemoLink to={l.to} onClick={close} className="block rounded-lg px-4 py-2.5 text-foreground hover:bg-muted">{l.label}</DemoLink>
                </li>
              ))}
            </ul>
            <a href={ERAN?.href} className="mt-6 flex items-center gap-3 rounded-xl bg-sanctuary px-4 py-3 text-sanctuary-foreground">
              <Phone aria-hidden="true" className="w-5 h-5" />
              <span>
                <span className="block text-sm opacity-85">עזרה נפשית מיידית</span>
                <span className="block font-semibold">{'ער"ן'} {ERAN?.value}</span>
              </span>
            </a>
          </nav>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** Utility bar + main bar with click-to-open mega menus. Sticky. */
export default function Header() {
  const { pathname } = useLocation();
  const area = areaOf(relativePath(pathname));
  const [openKey, setOpenKey] = useState(/** @type {string|null} */ (null));
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef(/** @type {HTMLElement|null} */ (null));
  const panelId = useId();

  useEffect(() => { setOpenKey(null); setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    if (!openKey) return undefined;
    /** @param {KeyboardEvent} e */
    const onKey = (e) => {
      if (e.key === 'Escape') {
        const trigger = headerRef.current?.querySelector(`[data-menu-trigger="${openKey}"]`);
        setOpenKey(null);
        if (trigger instanceof HTMLElement) trigger.focus();
      }
    };
    /** @param {MouseEvent} e */
    const onDown = (e) => {
      if (headerRef.current && e.target instanceof Node && !headerRef.current.contains(e.target)) setOpenKey(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [openKey]);

  const openMenu = MENUS.find((m) => m.key === openKey);

  return (
    <header ref={headerRef} className="sticky top-0 z-40">
      {/* Utility bar */}
      <div className="bg-sanctuary text-sanctuary-foreground">
        <div className="mx-auto flex h-10 max-w-7xl items-center justify-between gap-3 px-4 text-sm sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <a href={ERAN?.href} className="inline-flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sanctuary-foreground">
              <Phone aria-hidden="true" className="w-3.5 h-3.5" />
              <span className="hidden sm:inline opacity-85">זקוקים לעזרה נפשית עכשיו?</span>
              <span className="font-semibold underline underline-offset-4">{'ער"ן'} {ERAN?.value}</span>
            </a>
            <a href={ERAN_WA?.href} target="_blank" rel="noreferrer" className="hidden md:inline-flex items-center gap-1.5 opacity-85 hover:opacity-100">
              <MessageCircle aria-hidden="true" className="w-3.5 h-3.5" /> וואטסאפ
            </a>
          </div>
          <div className="flex items-center gap-4">
            <ul className="hidden items-center gap-4 md:flex">
              <li><DemoLink to={ROUTES.contact} className="opacity-85 hover:opacity-100 hover:underline underline-offset-4">יצירת קשר</DemoLink></li>
              <li><DemoLink to={ROUTES.accessibility} className="opacity-85 hover:opacity-100 hover:underline underline-offset-4">נגישות</DemoLink></li>
              <li><DemoLink to={ROUTES.donate} className="opacity-85 hover:opacity-100 hover:underline underline-offset-4">תרומה</DemoLink></li>
            </ul>
            {area === 'patient' && <QuickExit />}
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="relative border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-[4.25rem]">
          <DemoLink to="/" className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <img src={LOGO} alt="מטיב - המרכז הישראלי לטיפול בפסיכוטראומה, לדף הבית" className="h-9 w-auto lg:h-11" />
          </DemoLink>

          <nav aria-label="ניווט ראשי" className="hidden flex-1 lg:block">
            <ul className="flex items-center gap-1">
              {MENUS.map((m) => {
                const expanded = openKey === m.key;
                const current = area === m.key && m.key !== 'metiv';
                return (
                  <li key={m.key} className="relative">
                    <Button
                      variant="quiet"
                      size="none"
                      data-menu-trigger={m.key}
                      aria-expanded={expanded}
                      aria-controls={panelId}
                      onClick={() => setOpenKey(expanded ? null : m.key)}
                      className={cn(
                        'relative h-11 gap-1.5 rounded-xl px-3.5 text-base font-medium text-foreground hover:bg-muted',
                        expanded && 'bg-muted'
                      )}
                    >
                      {m.label}
                      <ChevronDown aria-hidden="true" className={cn('transition-transform duration-200', expanded && 'rotate-180')} />
                      {current && <span aria-hidden="true" className={cn('absolute inset-x-3.5 -bottom-[0.55rem] h-1 rounded-full', m.stripe)} />}
                    </Button>
                  </li>
                );
              })}
              <li>
                <DemoLink to={ROUTES.events} className="inline-flex h-11 items-center rounded-xl px-3.5 font-medium text-foreground hover:bg-muted">
                  אירועים
                </DemoLink>
              </li>
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild variant="elevated" radius="full" size="roomy" className="hidden xl:inline-flex">
              <DemoLink to={ROUTES.donate}>תרומה למטיב</DemoLink>
            </Button>
            <Button
              variant="outline-subtle"
              size="none"
              className="h-10 gap-2 rounded-full px-4 font-medium text-foreground lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="פתיחת תפריט"
            >
              <Menu aria-hidden="true" />
              <span>תפריט</span>
            </Button>
          </div>
        </div>

        {openMenu && (
          <div id={panelId} className="absolute inset-x-0 top-full hidden border-b border-border bg-card shadow-atmospheric-lg lg:block rounded-b-super">
            <div className="mx-auto grid max-w-7xl grid-cols-12 gap-8 px-6 pb-8 pt-6">
              <div className="col-span-9">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="flex items-center gap-2 font-heading text-xl font-semibold text-foreground">
                      <span aria-hidden="true" className={cn('h-1 w-6 rounded-full', openMenu.stripe)} />
                      {openMenu.label}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{openMenu.intro}</p>
                  </div>
                  <DemoLink to={openMenu.route} className="inline-flex shrink-0 items-center gap-1.5 font-medium text-primary hover:underline underline-offset-4">
                    {openMenu.key === 'metiv' ? 'לעמוד אודות' : 'לעמוד הראשי של האזור'} <ArrowLeft aria-hidden="true" className="w-4 h-4" />
                  </DemoLink>
                </div>
                <GroupColumns groups={openMenu.groups} />
              </div>
              <div className="col-span-3">
                <Featured menuKey={openMenu.key} />
              </div>
            </div>
          </div>
        )}
      </div>

      <MobileMenu open={mobileOpen} onOpenChange={setMobileOpen} />
    </header>
  );
}
