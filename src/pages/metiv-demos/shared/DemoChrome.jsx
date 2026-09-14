import React, { createContext, useCallback, useContext } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import DefaultPageHeader from '@/components/patterns/PageHeader';

// Shared contract between the patient kit / shared pages and the four design
// versions (/metiv-site-demo-v1..v4). A version wraps its routes in
// <DemoChromeProvider base="/metiv-site-demo-vN" PageHeader={...}> so that:
//  - every internal link written as a site-relative path ("/patient/rights")
//    resolves inside that version, never to the real PTSD-IL site at "/";
//  - shared pages render the version's own page header design.

/**
 * @typedef {Object} DemoChrome
 * @property {string} base         e.g. "/metiv-site-demo-v2"
 * @property {React.ComponentType<any>} PageHeader  same props as patterns/PageHeader
 * @property {string} version      "v1".."v4"
 */

/** @type {React.Context<DemoChrome>} */
const DemoChromeContext = createContext({ base: '', PageHeader: DefaultPageHeader, version: 'v0' });

/**
 * @param {{ base: string, version: string, PageHeader?: React.ComponentType<any>, children: React.ReactNode }} props
 */
export function DemoChromeProvider({ base, version, PageHeader = DefaultPageHeader, children }) {
  return (
    <DemoChromeContext.Provider value={{ base, version, PageHeader }}>
      {children}
    </DemoChromeContext.Provider>
  );
}

export function useDemoChrome() {
  return useContext(DemoChromeContext);
}

/** Returns a resolver: "/patient" -> "/metiv-site-demo-vN/patient". External, hash and relative paths pass through. */
export function useDemoPath() {
  const { base } = useDemoChrome();
  return useCallback(
    /** @param {string} path */
    (path) => {
      if (!path || !path.startsWith('/') || path.startsWith('//')) return path;
      if (base && (path === base || path.startsWith(`${base}/`) || path.startsWith(`${base}#`))) return path;
      return path === '/' ? base || '/' : `${base}${path}`;
    },
    [base]
  );
}

/** react-router Link whose `to` is written site-relative and resolved inside the current version. */
export function DemoLink({ to, ...props }) {
  const resolve = useDemoPath();
  return <Link to={resolve(to)} {...props} />;
}

/** Markdown renderer for demo content: internal links stay inside the version, external links open a new tab. */
export function DemoMarkdown({ className, children }) {
  const resolve = useDemoPath();
  if (!children) return null;
  return (
    <div className={className}>
      <ReactMarkdown
        components={{
          a: ({ href, children: kids }) =>
            href?.startsWith('/') ? (
              <Link to={resolve(href)}>{kids}</Link>
            ) : (
              <a href={href} target="_blank" rel="noreferrer">{kids}</a>
            ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
