import React, { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { DemoChromeProvider } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { PATIENT_PAGES, SANCTUARY_ROUTES } from '@/pages/metiv-demos/shared/patient';
import { cn } from '@/lib/utils';
import { BASE, VERSION, areaOf, stripBase, titleFor } from './lib';
import V2PageHeader from './components/PageHeader';
import { AreaContext } from './components/ui';
import Header from './components/Header';
import SubNav from './components/SubNav';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';
import SanctuaryShell from './components/SanctuaryShell';
import { HelpProvider } from './components/HelpSheet';
import QuickExitButton, { useShiftTripleExit } from './components/QuickExit';
import Landing from './pages/Landing';
import About from './pages/About';
import Donate from './pages/Donate';
import Contact from './pages/Contact';
import Accessibility from './pages/Accessibility';
import PatientHub from './pages/PatientHub';
import TherapistHub from './pages/TherapistHub';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import ChildrenFamily from './pages/ChildrenFamily';
import Supervision from './pages/Supervision';
import Organizations from './pages/Organizations';
import Research from './pages/Research';
import Publications from './pages/Publications';
import { ArticlesList, ArticlePage } from './pages/Articles';
import Events from './pages/Events';

// V2 "Two Doors". Light = patients and families, sanctuary = professionals.
// Every ROUTES path is mounted here; unknown paths go to the version home.

/** Pages this version builds itself, keyed by ROUTES key. */
const OWN_PAGES = {
  home: Landing,
  about: About,
  donate: Donate,
  contact: Contact,
  accessibility: Accessibility,
  patient: PatientHub,
  therapist: TherapistHub,
  courses: Courses,
  course: CourseDetail,
  childrenFamily: ChildrenFamily,
  supervision: Supervision,
  organizations: Organizations,
  research: Research,
  publications: Publications,
  articles: ArticlesList,
  article: ArticlePage,
  events: Events,
};

const SANCTUARY_PATHS = SANCTUARY_ROUTES.map((k) => ROUTES[k]);

function useDocumentMeta(path) {
  useEffect(() => {
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex, nofollow';
    document.head.appendChild(robots);
    const prev = document.title;
    return () => {
      robots.remove();
      document.title = prev;
    };
  }, []);

  useEffect(() => {
    const t = titleFor(path);
    document.title = t && path !== '/' ? `${t} - מטיב (דמו גרסה 2)` : 'מטיב - המרכז הישראלי לטיפול בפסיכוטראומה (דמו גרסה 2)';
  }, [path]);
}

/** react-router does not scroll: top on page change, to the anchor when there is a hash. */
function useScrollManagement(pathname, hash) {
  useEffect(() => {
    if (typeof window.scrollTo !== 'function') return undefined;
    if (!hash) {
      window.scrollTo(0, 0);
      return undefined;
    }
    let tries = 0;
    let timer;
    const id = decodeURIComponent(hash.slice(1));
    const attempt = () => {
      const el = document.getElementById(id);
      if (el) {
        const offset = window.innerWidth >= 1024 ? 160 : 88;
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
        return;
      }
      if (tries++ < 15) timer = setTimeout(attempt, 80);
    };
    timer = setTimeout(attempt, 30);
    return () => clearTimeout(timer);
  }, [pathname, hash]);
}

function DemoRoutes() {
  const all = { ...PATIENT_PAGES, ...OWN_PAGES };
  return (
    <Routes>
      {Object.entries(ROUTES).map(([key, path]) => {
        const Page = all[key];
        if (!Page) return null;
        if (path === '/') return <Route key={key} index element={<Page />} />;
        return <Route key={key} path={path.slice(1)} element={<Page />} />;
      })}
      <Route path="*" element={<Navigate to={BASE} replace />} />
    </Routes>
  );
}

export default function Site() {
  const location = useLocation();
  const path = stripBase(location.pathname);
  const area = areaOf(path);
  const isSanctuary = SANCTUARY_PATHS.includes(path);

  useDocumentMeta(path);
  useScrollManagement(location.pathname, location.hash);
  useShiftTripleExit(area === 'patient');

  return (
    <div dir="rtl" lang="he" className="font-body">
      <DemoChromeProvider base={BASE} version={VERSION} PageHeader={V2PageHeader}>
        <AreaContext.Provider value={area}>
          {isSanctuary ? (
            <SanctuaryShell>
              <DemoRoutes />
            </SanctuaryShell>
          ) : (
            <HelpProvider area={area}>
              <div
                className={cn(
                  'min-h-screen flex flex-col transition-colors duration-300 motion-reduce:transition-none',
                  area === 'pro' ? 'bg-sanctuary text-sanctuary-foreground' : 'bg-background text-foreground'
                )}
              >
                <a
                  href="#main"
                  className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-50 focus:rounded-full focus:bg-card focus:text-foreground focus:px-4 focus:py-2 focus:shadow-atmospheric-lg"
                >
                  דילוג לתוכן
                </a>
                <Header area={area} />
                {area !== 'metiv' && <SubNav area={area} />}
                <main id="main" className="flex-1 pb-4 lg:pb-0">
                  <DemoRoutes />
                </main>
                <Footer area={area} />
                <BottomNav area={area} />
                {area === 'patient' && (
                  <div className="lg:hidden fixed bottom-[4.9rem] end-3 z-30">
                    <QuickExitButton compact className="shadow-atmospheric-lg bg-card" />
                  </div>
                )}
              </div>
            </HelpProvider>
          )}
        </AreaContext.Provider>
      </DemoChromeProvider>
    </div>
  );
}
