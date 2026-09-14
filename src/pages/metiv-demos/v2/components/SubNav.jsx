import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { cn } from '@/lib/utils';
import { FOCUS_DARK, FOCUS_LIGHT, stripBase } from '../lib';
import { PATIENT_TABS, PRO_TABS, patientSection, proSection } from './nav';

/**
 * Sticky in-area tabs, directly under the header on desktop. On mobile they
 * scroll with the page (the bottom bar is the sticky navigation there).
 * @param {{ area: 'patient'|'pro' }} props
 */
export default function SubNav({ area }) {
  const location = useLocation();
  const path = stripBase(location.pathname);
  const dark = area === 'pro';
  const railRef = useRef(null);

  const tabs = dark ? PRO_TABS : PATIENT_TABS;
  const { tab: activePatient, rail } = dark ? { tab: '', rail: null } : patientSection(path);
  const active = dark ? proSection(path) : activePatient;

  // Keep the active tab in view in the horizontal scroller.
  useEffect(() => {
    const el = railRef.current?.querySelector('[aria-current="page"]');
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }, [active]);

  return (
    <div
      className={cn(
        'lg:sticky lg:top-[4.5rem] z-30 border-b transition-colors duration-300 motion-reduce:transition-none',
        dark ? 'bg-sanctuary border-sanctuary-foreground/10' : 'bg-background/95 backdrop-blur border-border'
      )}
    >
      <nav aria-label={dark ? 'ניווט באזור אנשי המקצוע' : 'ניווט באזור המטופלים'} className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <ul ref={railRef} className="flex gap-1 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((t) => {
            const isActive = t.key === active;
            return (
              <li key={t.key} className="flex-shrink-0">
                <DemoLink
                  to={t.route}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'inline-flex items-center h-10 px-4 rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-300',
                    dark
                      ? cn(isActive ? 'bg-sanctuary-foreground text-sanctuary font-semibold' : 'text-sanctuary-foreground/85 hover:bg-sanctuary-foreground/10 hover:text-sanctuary-foreground', FOCUS_DARK)
                      : cn(isActive ? 'bg-primary text-primary-foreground font-semibold' : 'text-foreground hover:bg-muted', FOCUS_LIGHT)
                  )}
                >
                  {t.label}
                </DemoLink>
              </li>
            );
          })}
        </ul>
        {rail?.children && (
          <ul className="flex gap-2 overflow-x-auto pb-2.5 -mt-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label={`נושאים: ${rail.label}`}>
            {rail.children.map((c) => {
              const isHere = c.route === path;
              return (
                <li key={c.key} className="flex-shrink-0">
                  <DemoLink
                    to={c.route}
                    aria-current={isHere ? 'page' : undefined}
                    className={cn(
                      'inline-flex items-center h-8 px-3 rounded-full border text-xs font-medium whitespace-nowrap transition-colors duration-300',
                      isHere ? 'bg-card border-primary text-foreground font-semibold' : 'bg-card/60 border-border text-card-foreground hover:border-primary/50 hover:text-foreground',
                      FOCUS_LIGHT
                    )}
                  >
                    {c.label}
                  </DemoLink>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </div>
  );
}
