import React, { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { DemoChromeProvider } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { PATIENT_HUB, PATIENT_NAV, PATIENT_PAGES, SANCTUARY_ROUTES } from '@/pages/metiv-demos/shared/patient';
import { BASE } from './lib';
import { MainShell, PageHeaderV1, SanctuaryShell } from './components/Chrome';
import { useV1Title } from './components/primitives';
import Landing from './pages/Landing';
import About from './pages/About';
import Donate from './pages/Donate';
import Contact from './pages/Contact';
import Accessibility from './pages/Accessibility';
import PatientHub from './pages/PatientHub';
import TherapistHub from './pages/TherapistHub';
import Courses from './pages/Courses';
import Course from './pages/Course';
import ChildrenFamily from './pages/ChildrenFamily';
import Supervision from './pages/Supervision';
import Organizations from './pages/Organizations';
import Research from './pages/Research';
import Publications from './pages/Publications';
import ArticlesPage, { ArticlePage } from './pages/Articles';
import Events from './pages/Events';

// v1 "Calm Editorial": magazine rhythm, arch frames, two strong doors.

/** Route path relative to the version base. @param {string} path */
const rel = (path) => path.replace(/^\//, '');

/** @type {Record<string, string>} */
const KIT_TITLES = {
  ...Object.fromEntries(PATIENT_HUB.quickLinks.map((l) => [l.key, l.label])),
  ...Object.fromEntries(PATIENT_NAV.map((l) => [l.key, l.label])),
  calming: 'תרגילי הרגעה',
  calmingBreathing: 'תרגיל נשימה',
  calmingGrounding: 'תרגיל קרקוע',
  calmingMuscle: 'הרפיית שרירים',
  privacy: 'מדיניות פרטיות',
  terms: 'תנאי שימוש',
};

/** Scroll to top on navigation, or to the #hash target once it renders. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (typeof window.scrollTo !== 'function') return undefined;
    if (!hash) {
      window.scrollTo(0, 0);
      return undefined;
    }
    let tries = 0;
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    let timer;
    const go = () => {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 150;
        window.scrollTo({ top: Math.max(0, top) });
      } else if (tries < 30) {
        tries += 1;
        timer = setTimeout(go, 50);
      }
    };
    go();
    return () => clearTimeout(timer);
  }, [pathname, hash]);
  return null;
}

function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
}

/** A patient kit page with its document title. @param {{ routeKey: string }} props */
function KitPage({ routeKey }) {
  useV1Title(KIT_TITLES[routeKey] || 'למתמודדים ולמשפחות');
  const Page = PATIENT_PAGES[routeKey];
  return <Page />;
}

const METIV_KIT_KEYS = ['privacy', 'terms'];

export default function Site() {
  useNoIndex();

  return (
    <DemoChromeProvider base={BASE} version="v1" PageHeader={PageHeaderV1}>
      <ScrollManager />
      <Routes>
        {/* Metiv (general) */}
        <Route index element={<MainShell landing><Landing /></MainShell>} />
        <Route path={rel(ROUTES.about)} element={<MainShell><About /></MainShell>} />
        <Route path={rel(ROUTES.donate)} element={<MainShell><Donate /></MainShell>} />
        <Route path={rel(ROUTES.contact)} element={<MainShell><Contact /></MainShell>} />
        <Route path={rel(ROUTES.accessibility)} element={<MainShell><Accessibility /></MainShell>} />
        {METIV_KIT_KEYS.map((key) => (
          <Route key={key} path={rel(ROUTES[key])} element={<MainShell><KitPage routeKey={key} /></MainShell>} />
        ))}

        {/* Area B: patients and families */}
        <Route path={rel(ROUTES.patient)} element={<MainShell area="patient"><PatientHub /></MainShell>} />
        {Object.keys(PATIENT_PAGES)
          .filter((key) => !METIV_KIT_KEYS.includes(key))
          .map((key) => (
            <Route
              key={key}
              path={rel(ROUTES[key])}
              element={
                SANCTUARY_ROUTES.includes(key) ? (
                  <SanctuaryShell routeKey={key}><KitPage routeKey={key} /></SanctuaryShell>
                ) : (
                  <MainShell area="patient"><KitPage routeKey={key} /></MainShell>
                )
              }
            />
          ))}

        {/* Area C: therapists and professionals */}
        <Route path={rel(ROUTES.therapist)} element={<MainShell area="therapist"><TherapistHub /></MainShell>} />
        <Route path={rel(ROUTES.courses)} element={<MainShell area="therapist"><Courses /></MainShell>} />
        <Route path={rel(ROUTES.course)} element={<MainShell area="therapist"><Course /></MainShell>} />
        <Route path={rel(ROUTES.childrenFamily)} element={<MainShell area="therapist"><ChildrenFamily /></MainShell>} />
        <Route path={rel(ROUTES.supervision)} element={<MainShell area="therapist"><Supervision /></MainShell>} />
        <Route path={rel(ROUTES.organizations)} element={<MainShell area="therapist"><Organizations /></MainShell>} />
        <Route path={rel(ROUTES.research)} element={<MainShell area="therapist"><Research /></MainShell>} />
        <Route path={rel(ROUTES.publications)} element={<MainShell area="therapist"><Publications /></MainShell>} />
        <Route path={rel(ROUTES.articles)} element={<MainShell area="therapist"><ArticlesPage /></MainShell>} />
        <Route path={rel(ROUTES.article)} element={<MainShell area="therapist"><ArticlePage /></MainShell>} />
        <Route path={rel(ROUTES.events)} element={<MainShell area="therapist"><Events /></MainShell>} />

        <Route path="*" element={<Navigate to={BASE} replace />} />
      </Routes>
    </DemoChromeProvider>
  );
}
