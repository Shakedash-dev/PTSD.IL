import React from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowRight, Phone } from 'lucide-react';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { PATIENT_NAV, PATIENT_HUB } from '@/pages/metiv-demos/shared/patient';
import { cn } from '@/lib/utils';
import Header, { LOGO } from './Header';
import Footer from './Footer';
import Breadcrumbs from './Breadcrumbs';
import QuickExit from './QuickExit';
import { relativePath, PATH_LABELS } from '../lib/nav';

const ERAN = PATIENT_HUB.crisisLines.find((l) => l.key === 'eranPhone');

function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-2 focus:text-foreground focus:shadow-atmospheric-lg"
    >
      דילוג לתוכן העמוד
    </a>
  );
}

/** Calm secondary navigation for the patient area. */
function PatientSubnav() {
  const { pathname } = useLocation();
  const rel = relativePath(pathname);
  /** @param {{ route: string }} item */
  const isActive = (item) => rel === item.route || (item.route !== ROUTES.patient && rel.startsWith(`${item.route}/`));
  return (
    <nav aria-label="ניווט באזור המטופלים והמשפחות" className="border-b border-border bg-card">
      <div className="mx-auto max-w-7xl overflow-x-auto px-4 sm:px-6">
        <ul className="flex w-max items-stretch gap-1">
          {PATIENT_NAV.map((item) => {
            const active = isActive(item);
            return (
              <li key={item.key}>
                <DemoLink
                  to={item.route}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative inline-flex h-11 items-center whitespace-nowrap px-3 text-sm transition-colors',
                    active ? 'font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {PATH_LABELS[item.key] || item.label}
                  {active && <span aria-hidden="true" className="absolute inset-x-3 bottom-0 h-[3px] rounded-t-full bg-secondary" />}
                </DemoLink>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

/**
 * Standard shell: header, breadcrumbs, optional patient sub-navigation, footer.
 * @param {{ area: 'metiv'|'patient'|'therapist', children: React.ReactNode }} props
 */
export function SiteShell({ area, children }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SkipLink />
      <Header />
      {area === 'patient' && <PatientSubnav />}
      <Breadcrumbs />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <Footer />
    </div>
  );
}

/** Minimal distraction-free shell for the calming exercises. @param {{ children: React.ReactNode }} props */
export function SanctuaryShell({ children }) {
  const { pathname } = useLocation();
  const rel = relativePath(pathname);
  const backTo = rel === ROUTES.calming ? ROUTES.patient : ROUTES.calming;
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SkipLink />
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <DemoLink to={backTo} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowRight aria-hidden="true" className="w-4 h-4" />
            {rel === ROUTES.calming ? 'חזרה לאזור המטופלים' : 'חזרה לתרגילים'}
          </DemoLink>
          <img src={LOGO} alt="מטיב" className="hidden h-7 w-auto opacity-80 sm:block" />
          <div className="flex items-center gap-3">
            <a href={ERAN?.href} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <Phone aria-hidden="true" className="w-3.5 h-3.5" /> {'ער"ן'} {ERAN?.value}
            </a>
            <QuickExit tone="light" />
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
    </div>
  );
}
