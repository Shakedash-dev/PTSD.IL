import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Phone, MessageCircle, LifeBuoy, HeartHandshake, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from './Sheet';
import { DemoLink, useDemoPath } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { cn } from '@/lib/utils';
import { AREA_LABELS, ERAN_PHONE, ERAN_WHATSAPP, FOCUS_DARK, FOCUS_LIGHT, LOGO, stripBase, telHref } from '../lib';
import { METIV_LINKS, PATIENT_TABS, PRO_TABS } from './nav';
import { useHelp } from './HelpSheet';
import QuickExitButton from './QuickExit';

/**
 * Crisis strip, at every width. On phones it is compact (the bottom bar also
 * carries "עזרה עכשיו"). It must stay exactly h-9 on mobile: the app-wide toast
 * viewport is a 36px full-width fixed strip at the top of small screens that
 * swallows taps, so this strip keeps the header controls below that dead zone.
 */
function CrisisStrip({ dark }) {
  return (
    <div
      className={cn(
        'block text-sm transition-colors duration-300 motion-reduce:transition-none',
        dark ? 'bg-sanctuary text-sanctuary-foreground border-b border-sanctuary-foreground/10' : 'bg-muted text-foreground'
      )}
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 h-9 flex items-center justify-between gap-6">
        <p className="flex items-center gap-2 whitespace-nowrap">
          <LifeBuoy className="w-4 h-4" aria-hidden="true" />
          <span className="lg:hidden">ער&quot;ן:</span>
          <span className="hidden lg:inline">קשה עכשיו? ער&quot;ן, עזרה ראשונה נפשית:</span>
          <a href={telHref(ERAN_PHONE)} className={cn('font-semibold underline underline-offset-4 rounded', dark ? FOCUS_DARK : FOCUS_LIGHT)}>
            <Phone className="inline w-3.5 h-3.5 me-1" aria-hidden="true" />
            {ERAN_PHONE}
          </a>
          <span aria-hidden="true">·</span>
          <a href={ERAN_WHATSAPP} target="_blank" rel="noopener noreferrer" className={cn('font-semibold underline underline-offset-4 rounded', dark ? FOCUS_DARK : FOCUS_LIGHT)}>
            <MessageCircle className="inline w-3.5 h-3.5 me-1" aria-hidden="true" />
            וואטסאפ
          </a>
        </p>
        <p className={cn('hidden lg:block', dark ? 'text-sanctuary-foreground/80' : 'text-card-foreground')}>גם וגם? אפשר לעבור בין האזורים בכל רגע</p>
      </div>
    </div>
  );
}

/**
 * The persistent segmented switcher. Two links, the current area filled in its own colour.
 * @param {{ area: import('../lib').Area, compact?: boolean, className?: string }} props
 */
export function AreaSwitcher({ area, compact = false, className }) {
  const dark = area === 'pro';
  const seg = 'flex items-center justify-center gap-1.5 rounded-full font-semibold whitespace-nowrap transition-colors duration-300 motion-reduce:transition-none';
  const size = compact ? 'h-9 px-2 text-sm flex-1' : 'h-10 px-5 text-sm';
  return (
    <nav aria-label="בחירת אזור" className={className}>
      <div
        className={cn(
          'flex items-center gap-1 rounded-full p-1 border',
          dark ? 'bg-sanctuary-foreground/[0.06] border-sanctuary-foreground/20' : 'bg-muted border-border'
        )}
      >
        <DemoLink
          to={ROUTES.patient}
          aria-current={area === 'patient' ? 'true' : undefined}
          className={cn(
            seg,
            size,
            area === 'patient'
              ? 'bg-card text-foreground shadow-atmospheric-md'
              : dark
                ? 'text-sanctuary-foreground/85 hover:text-sanctuary-foreground hover:bg-sanctuary-foreground/10'
                : 'text-foreground hover:bg-card/70',
            dark ? FOCUS_DARK : FOCUS_LIGHT
          )}
        >
          <HeartHandshake className="w-4 h-4" aria-hidden="true" />
          {compact ? AREA_LABELS.patient.short : AREA_LABELS.patient.full}
        </DemoLink>
        <DemoLink
          to={ROUTES.therapist}
          aria-current={area === 'pro' ? 'true' : undefined}
          className={cn(
            seg,
            size,
            area === 'pro'
              ? 'bg-sanctuary-foreground text-sanctuary shadow-atmospheric-md'
              : 'text-foreground hover:bg-sanctuary hover:text-sanctuary-foreground',
            dark ? FOCUS_DARK : FOCUS_LIGHT
          )}
        >
          <GraduationCap className="w-4 h-4" aria-hidden="true" />
          {compact ? AREA_LABELS.pro.short : AREA_LABELS.pro.full}
        </DemoLink>
      </div>
    </nav>
  );
}

/**
 * Logo. On the dark area it sits on a light chip so the navy wordmark stays legible.
 * @param {{ dark: boolean, className?: string }} props
 */
export function Logo({ dark, className = '' }) {
  return (
    <DemoLink
      to={ROUTES.home}
      className={cn('inline-flex items-center rounded-xl flex-shrink-0', dark ? cn('bg-card px-2 py-1', FOCUS_DARK) : FOCUS_LIGHT, className)}
    >
      <img src={LOGO} alt="מטיב - המרכז הישראלי לטיפול בפסיכוטראומה, לדף הבית" className="h-8 lg:h-11 w-auto" />
    </DemoLink>
  );
}

/** @param {{ area: import('../lib').Area }} props */
export default function Header({ area }) {
  const dark = area === 'pro';
  const { openHelp } = useHelp();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <CrisisStrip dark={dark} />
      <header
        className={cn(
          'sticky top-0 z-40 border-b transition-colors duration-300 motion-reduce:transition-none',
          dark ? 'bg-sanctuary text-sanctuary-foreground border-sanctuary-foreground/10' : 'bg-card/95 backdrop-blur text-foreground border-border'
        )}
      >
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 h-14 lg:h-[4.5rem] flex items-center gap-3">
          <Logo dark={dark} />
          <div className="flex-1 flex justify-center min-w-0">
            <AreaSwitcher area={area} className="hidden lg:block" />
          </div>
          <nav aria-label="מטיב" className="hidden xl:flex items-center gap-1">
            {METIV_LINKS.filter((l) => l.key !== 'donate').map((l) => (
              <DemoLink
                key={l.key}
                to={l.route}
                className={cn(
                  'px-3 py-2 rounded-full text-sm font-medium transition-colors duration-300',
                  dark ? cn('hover:bg-sanctuary-foreground/10', FOCUS_DARK) : cn('hover:bg-muted', FOCUS_LIGHT)
                )}
              >
                {l.label}
              </DemoLink>
            ))}
          </nav>
          <div className="hidden lg:flex items-center gap-2">
            {area === 'patient' && <QuickExitButton />}
            <Button
              type="button"
              onClick={openHelp}
              variant={dark ? 'pill-light' : 'solid'}
              size="sm"
              radius="full"
              className={cn('gap-1.5', dark ? FOCUS_DARK : FOCUS_LIGHT)}
            >
              <LifeBuoy aria-hidden="true" />
              עזרה עכשיו
            </Button>
            <DemoLink
              to={ROUTES.donate}
              className={cn(
                'inline-flex items-center h-8 px-4 rounded-full border-2 text-sm font-semibold transition-colors duration-300',
                dark
                  ? cn('border-sanctuary-foreground/40 text-sanctuary-foreground hover:bg-sanctuary-foreground/10', FOCUS_DARK)
                  : cn('border-secondary text-foreground hover:bg-secondary/15', FOCUS_LIGHT)
              )}
            >
              תרומה
            </DemoLink>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            radius="full"
            onClick={() => setMenuOpen(true)}
            aria-label="תפריט"
            className={cn('lg:hidden flex-shrink-0 [&_svg]:size-5', dark ? cn('text-sanctuary-foreground hover:bg-sanctuary-foreground/10 hover:text-sanctuary-foreground', FOCUS_DARK) : FOCUS_LIGHT)}
          >
            <Menu />
          </Button>
        </div>
        <div className="lg:hidden px-3 sm:px-6 pb-2">
          <AreaSwitcher area={area} compact />
        </div>
      </header>
      <MobileMenu open={menuOpen} onOpenChange={setMenuOpen} area={area} />
    </>
  );
}

/** Full menu for small screens: both areas, current one first and expanded. */
function MobileMenu({ open, onOpenChange, area }) {
  const location = useLocation();
  const resolve = useDemoPath();
  const here = stripBase(location.pathname);
  const dark = area === 'pro';
  const close = () => onOpenChange(false);

  const linkCls = (route) =>
    cn(
      'block rounded-xl px-3 py-2.5 text-base transition-colors duration-200',
      resolve(route) === location.pathname || here === route ? 'font-semibold' : '',
      dark ? cn('hover:bg-sanctuary-foreground/10', FOCUS_DARK) : cn('hover:bg-muted', FOCUS_LIGHT)
    );

  const patientBlock = (
    <section className={cn('rounded-super-sm p-3', dark ? 'bg-card text-foreground' : 'bg-card border border-border')}>
      <h3 className="font-heading font-semibold px-3 pt-1 pb-2 text-lg">{AREA_LABELS.patient.full}</h3>
      <ul>
        {PATIENT_TABS.map((t) => (
          <li key={t.key}>
            <DemoLink to={t.route} onClick={close} className={cn(linkCls(t.route), dark && 'hover:bg-muted')}>
              {t.label}
            </DemoLink>
          </li>
        ))}
      </ul>
    </section>
  );
  const proBlock = (
    <section className="rounded-super-sm p-3 bg-sanctuary text-sanctuary-foreground">
      <h3 className="font-heading font-semibold px-3 pt-1 pb-2 text-lg">{AREA_LABELS.pro.full}</h3>
      <ul>
        {PRO_TABS.map((t) => (
          <li key={t.key}>
            <DemoLink to={t.route} onClick={close} className={cn(linkCls(t.route), 'hover:bg-sanctuary-foreground/10', FOCUS_DARK)}>
              {t.label}
            </DemoLink>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="start" dir="rtl" className={cn('w-[88vw] max-w-sm overflow-y-auto p-4 pt-12', dark ? 'bg-sanctuary text-sanctuary-foreground border-sanctuary-foreground/10' : 'bg-background')}>
        <SheetTitle className="sr-only">תפריט</SheetTitle>
        <SheetDescription className="sr-only">ניווט באתר מטיב</SheetDescription>
        <div className="space-y-4">
          {area === 'pro' ? proBlock : patientBlock}
          {area === 'pro' ? patientBlock : proBlock}
          <section className={cn('rounded-super-sm p-3', dark ? 'border border-sanctuary-foreground/15' : 'border border-border')}>
            <h3 className="font-heading font-semibold px-3 pt-1 pb-2 text-lg">מטיב</h3>
            <ul>
              <li>
                <DemoLink to={ROUTES.home} onClick={close} className={linkCls(ROUTES.home)}>
                  דף הבית
                </DemoLink>
              </li>
              {METIV_LINKS.map((l) => (
                <li key={l.key}>
                  <DemoLink to={l.route} onClick={close} className={linkCls(l.route)}>
                    {l.label}
                  </DemoLink>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
