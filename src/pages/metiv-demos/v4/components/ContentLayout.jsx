import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import Disclosure from '@/components/patterns/Disclosure';
import { cn } from '@/lib/utils';
import { relativePath } from '../lib/nav';

/** @typedef {{ id: string, label: string }} TocItem */
/** @typedef {{ key: string, label: string, route: string }} RailItem */

/** @param {RailItem[]} rail @param {string} rel */
function activeRailKey(rail, rel) {
  let best = null;
  let bestLen = -1;
  for (const item of rail) {
    if (rel === item.route || (item.route !== '/' && rel.startsWith(`${item.route}/`))) {
      if (item.route.length > bestLen) {
        best = item.key;
        bestLen = item.route.length;
      }
    }
  }
  return best;
}

/** @param {TocItem[]} toc */
function useActiveSection(toc) {
  const [active, setActive] = useState(toc[0]?.id || '');
  const ids = toc.map((t) => t.id).join('|');
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.IntersectionObserver !== 'function' || !ids) return undefined;
    const els = /** @type {HTMLElement[]} */ (ids.split('|').map((id) => document.getElementById(id)).filter(Boolean));
    const obs = new window.IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-20% 0px -65% 0px' }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [ids]);
  return active;
}

/** @param {{ toc: TocItem[], active?: string, onPick?: () => void }} props */
function TocList({ toc, active, onPick }) {
  return (
    <ul className="space-y-0.5 border-s border-border">
      {toc.map((t) => (
        <li key={t.id}>
          <a
            href={`#${t.id}`}
            onClick={onPick}
            aria-current={active === t.id ? 'location' : undefined}
            className={cn(
              '-ms-px block border-s-2 py-1.5 ps-3 text-sm leading-snug transition-colors',
              active === t.id ? 'border-primary font-semibold text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

/**
 * Three-zone content layout: section rail (start), main column, "on this page"
 * rail (end, wide screens). On small screens the rail becomes a scrolling tab
 * row and the table of contents a disclosure under the header.
 *
 * @param {{
 *   rail?: RailItem[],
 *   railTitle?: string,
 *   toc?: TocItem[],
 *   aside?: React.ReactNode,
 *   children: React.ReactNode,
 *   className?: string,
 * }} props
 */
export default function ContentLayout({ rail = [], railTitle, toc = [], aside, children, className }) {
  const { pathname } = useLocation();
  const rel = relativePath(pathname);
  const activeKey = activeRailKey(rail, rel);
  const active = useActiveSection(toc);
  const [tocOpen, setTocOpen] = useState(false);

  return (
    <div className={cn('mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12', className)}>
      {rail.length > 0 && (
        <nav aria-label={railTitle || 'ניווט באזור'} className="-mx-4 mb-6 overflow-x-auto px-4 lg:hidden">
          <ul className="flex w-max gap-2 pb-1">
            {rail.map((r) => (
              <li key={r.key}>
                <DemoLink
                  to={r.route}
                  aria-current={activeKey === r.key ? 'page' : undefined}
                  className={cn(
                    'inline-flex whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium',
                    activeKey === r.key ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:bg-muted'
                  )}
                >
                  {r.label}
                </DemoLink>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {toc.length > 1 && (
        <div className="mb-8 xl:hidden">
          <Disclosure label="בעמוד זה" size="tight" variant="soft" open={tocOpen} onOpenChange={setTocOpen}>
            <TocList toc={toc} active={active} onPick={() => setTocOpen(false)} />
          </Disclosure>
        </div>
      )}

      <div
        className={cn(
          'grid gap-10',
          rail.length > 0 ? 'lg:grid-cols-[13rem_minmax(0,1fr)]' : '',
          rail.length > 0 && toc.length > 1 && 'xl:grid-cols-[13rem_minmax(0,1fr)_13rem]',
          rail.length === 0 && toc.length > 1 && 'xl:grid-cols-[minmax(0,1fr)_14rem]'
        )}
      >
        {rail.length > 0 && (
          <aside className="hidden lg:block">
            <nav aria-label={railTitle || 'ניווט באזור'} className="sticky top-[8.5rem]">
              {railTitle && <p className="mb-3 text-sm font-semibold text-muted-foreground">{railTitle}</p>}
              <ul className="space-y-0.5">
                {rail.map((r) => (
                  <li key={r.key}>
                    <DemoLink
                      to={r.route}
                      aria-current={activeKey === r.key ? 'page' : undefined}
                      className={cn(
                        'block rounded-lg border-s-[3px] px-3 py-2 text-sm leading-snug transition-colors',
                        activeKey === r.key
                          ? 'border-primary bg-muted font-semibold text-foreground'
                          : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {r.label}
                    </DemoLink>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        )}

        <div className="min-w-0">{children}</div>

        {(toc.length > 1 || aside) && (
          <aside className="hidden xl:block">
            <div className="sticky top-[8.5rem] space-y-6">
              {toc.length > 1 && (
                <nav aria-label="בעמוד זה">
                  <p className="mb-3 text-sm font-semibold text-muted-foreground">בעמוד זה</p>
                  <TocList toc={toc} active={active} />
                </nav>
              )}
              {aside}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
