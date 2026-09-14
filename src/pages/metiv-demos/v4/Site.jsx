import React, { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { DemoChromeProvider } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { PATIENT_PAGES, SANCTUARY_ROUTES } from '@/pages/metiv-demos/shared/patient';
import V4PageHeader from './components/V4PageHeader';
import { SiteShell, SanctuaryShell } from './components/Shells';
import { VERSION_BASE, labelFor, relativePath } from './lib/nav';
import Landing from './pages/Landing';
import PatientHub from './pages/PatientHub';
import TherapistHub from './pages/TherapistHub';
import Courses from './pages/Courses';
import Course from './pages/Course';
import { ChildrenFamily, Supervision, Organizations } from './pages/ProgramPages';
import { Research, Publications } from './pages/ResearchPages';
import { Articles, Article, Events } from './pages/UpdatesPages';
import { About, Donate, Contact, AccessibilityStatement } from './pages/OrgPages';

// V4 "Institutional Modern": utility bar + click-open mega menus, breadcrumbs on
// every inner page, three-zone content pages, faceted catalog and citations.

/** ROUTES path -> nested-route path (relative to /metiv-site-demo-v4/*). @param {string} p */
const rel = (p) => p.replace(/^\//, '');

/** noindex + per-page document title. */
function DocumentMeta() {
  const { pathname } = useLocation();
  useEffect(() => {
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex, nofollow';
    document.head.appendChild(robots);
    return () => robots.remove();
  }, []);
  useEffect(() => {
    const path = relativePath(pathname);
    const label = labelFor(path);
    document.title = path === '/' || !label ? 'מטיב - המרכז הישראלי לטיפול בפסיכוטראומה' : `${label} | מטיב`;
  }, [pathname]);
  return null;
}

/** Scroll to top on navigation, or to the #hash target once it has rendered. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    let cancelled = false;
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    let timer;
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      let tries = 0;
      const attempt = () => {
        if (cancelled) return;
        const el = document.getElementById(id);
        if (el) {
          if (typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'start' });
        } else if (tries++ < 20) {
          timer = setTimeout(attempt, 50);
        }
      };
      attempt();
    } else if (typeof window.scrollTo === 'function') {
      try {
        window.scrollTo(0, 0);
      } catch {
        /* non-browser environment */
      }
    }
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pathname, hash]);
  return null;
}

/** @param {'metiv'|'patient'|'therapist'} area @param {React.ReactNode} page */
const shell = (area, page) => <SiteShell area={area}>{page}</SiteShell>;

export default function Site() {
  const patientRoutes = Object.entries(PATIENT_PAGES).map(([key, Page]) => {
    let element;
    if (SANCTUARY_ROUTES.includes(key)) element = <SanctuaryShell><Page /></SanctuaryShell>;
    else if (key === 'privacy' || key === 'terms') element = shell('metiv', <Page />);
    else element = shell('patient', <Page />);
    return <Route key={key} path={rel(ROUTES[key])} element={element} />;
  });

  return (
    <DemoChromeProvider base={VERSION_BASE} version="v4" PageHeader={V4PageHeader}>
      <div dir="rtl" lang="he" className="min-h-screen bg-background font-body text-foreground [&_[id]]:scroll-mt-40">
        <DocumentMeta />
        <ScrollManager />
        <Routes>
          <Route index element={shell('metiv', <Landing />)} />
          <Route path={rel(ROUTES.about)} element={shell('metiv', <About />)} />
          <Route path={rel(ROUTES.donate)} element={shell('metiv', <Donate />)} />
          <Route path={rel(ROUTES.contact)} element={shell('metiv', <Contact />)} />
          <Route path={rel(ROUTES.accessibility)} element={shell('metiv', <AccessibilityStatement />)} />

          <Route path={rel(ROUTES.patient)} element={shell('patient', <PatientHub />)} />
          {patientRoutes}

          <Route path={rel(ROUTES.therapist)} element={shell('therapist', <TherapistHub />)} />
          <Route path={rel(ROUTES.courses)} element={shell('therapist', <Courses />)} />
          <Route path={rel(ROUTES.course)} element={shell('therapist', <Course />)} />
          <Route path={rel(ROUTES.childrenFamily)} element={shell('therapist', <ChildrenFamily />)} />
          <Route path={rel(ROUTES.supervision)} element={shell('therapist', <Supervision />)} />
          <Route path={rel(ROUTES.organizations)} element={shell('therapist', <Organizations />)} />
          <Route path={rel(ROUTES.research)} element={shell('therapist', <Research />)} />
          <Route path={rel(ROUTES.publications)} element={shell('therapist', <Publications />)} />
          <Route path={rel(ROUTES.articles)} element={shell('therapist', <Articles />)} />
          <Route path={rel(ROUTES.article)} element={shell('therapist', <Article />)} />
          <Route path={rel(ROUTES.events)} element={shell('therapist', <Events />)} />

          <Route path="*" element={<Navigate to={VERSION_BASE} replace />} />
        </Routes>
      </div>
    </DemoChromeProvider>
  );
}
