import React, { createContext, useContext } from 'react';
import { UNSAFE_NavigationContext as NavigationContext, useLocation } from 'react-router-dom';
import { BASE } from '../meta';

// The V3 patient area renders the PTSD-IL pages themselves, unchanged. Those
// pages link with site-root paths ("/rights"). Inside <PtsdIlLinks> the router
// basename is the patient area root, so react-router resolves every such Link,
// NavLink and navigate() to /metiv-site-demo-v3/patient/rights without touching
// the page code. Metiv additions inside those pages use the version's own
// DemoLink paths, so they go through <VersionLinks>, which restores the outer
// router context.

export const PTSD_IL_BASE = `${BASE}/patient`;

/** @type {React.Context<any>} */
const OuterNavigation = createContext(null);

/** @param {{ children: React.ReactNode }} props */
export function PtsdIlLinks({ children }) {
  const outer = useContext(NavigationContext);
  return (
    <OuterNavigation.Provider value={outer}>
      <NavigationContext.Provider value={{ ...outer, basename: PTSD_IL_BASE }}>{children}</NavigationContext.Provider>
    </OuterNavigation.Provider>
  );
}

/** @param {{ children: React.ReactNode }} props */
export function VersionLinks({ children }) {
  const outer = useContext(OuterNavigation);
  if (!outer) return <>{children}</>;
  return <NavigationContext.Provider value={outer}>{children}</NavigationContext.Provider>;
}

/** The PTSD-IL pathname of the current location: "/metiv-site-demo-v3/patient/rights" -> "/rights". */
export function usePtsdIlPathname() {
  const { pathname } = useLocation();
  const inner = pathname.startsWith(PTSD_IL_BASE) ? pathname.slice(PTSD_IL_BASE.length) : pathname;
  return inner.replace(/\/$/, '') || '/';
}
