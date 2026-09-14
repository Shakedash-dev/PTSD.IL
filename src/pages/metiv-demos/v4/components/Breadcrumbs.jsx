import React from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { crumbsFor, relativePath } from '../lib/nav';

/** Breadcrumb trail derived from the current path. Hidden on the landing page. */
export default function Breadcrumbs() {
  const { pathname } = useLocation();
  const crumbs = crumbsFor(relativePath(pathname));
  if (crumbs.length < 2) return null;
  return (
    <nav aria-label="מיקום באתר" className="border-b border-border bg-background">
      <ol className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-1.5 gap-y-1 px-4 py-2.5 text-sm text-muted-foreground sm:px-6">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={c.route} className="inline-flex items-center gap-1.5">
              {last ? (
                <span aria-current="page" className="font-medium text-foreground line-clamp-1">{c.label}</span>
              ) : (
                <>
                  <DemoLink to={c.route} className="rounded hover:text-foreground hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {c.label}
                  </DemoLink>
                  <ChevronLeft aria-hidden="true" className="w-3.5 h-3.5" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
