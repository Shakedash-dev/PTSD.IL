import React from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowRight, Phone } from 'lucide-react';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { cn } from '@/lib/utils';
import { ERAN_PHONE, FOCUS_LIGHT, stripBase, telHref } from '../lib';
import QuickExitButton from './QuickExit';

// Distraction-free shell for the calming exercises (mirrors Layout.jsx): a
// 3.5rem strip with a way back, the crisis line and the quick exit. No nav,
// no footer, no bottom bar. The exercise pages already pad for this strip.

export default function SanctuaryShell({ children }) {
  const location = useLocation();
  const path = stripBase(location.pathname);
  const backTo = path === ROUTES.calming ? ROUTES.patient : ROUTES.calming;
  const backLabel = path === ROUTES.calming ? 'חזרה' : 'לתרגילים';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed top-0 inset-x-0 z-50 h-14 px-4 flex items-center justify-between gap-3 bg-background/95 backdrop-blur border-b border-border">
        <DemoLink to={backTo} className={cn('whitespace-nowrap inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground rounded-md', FOCUS_LIGHT)}>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
          {backLabel}
        </DemoLink>
        <div className="flex items-center gap-3">
          <a href={telHref(ERAN_PHONE)} className={cn('inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground rounded-md', FOCUS_LIGHT)}>
            <Phone className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">ער&quot;ן</span> {ERAN_PHONE}
          </a>
          <QuickExitButton compact />
        </div>
      </header>
      <main id="main" className={path === ROUTES.calming ? 'pt-14' : ''}>
        {children}
      </main>
    </div>
  );
}
