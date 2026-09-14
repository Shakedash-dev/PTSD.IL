import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { DemoChromeProvider } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { PATIENT_PAGES } from '@/pages/metiv-demos/shared/patient';
import { BASE, VERSION } from './meta';
import PageHeaderV3 from './components/PageHeaderV3';
import { DocumentMeta, ScrollManager, SiteShell } from './components/Chrome';
import Landing from './pages/Landing';
import About from './pages/About';
import Donate from './pages/Donate';
import Contact from './pages/Contact';
import Accessibility from './pages/Accessibility';
import TherapistHub from './pages/TherapistHub';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import ChildrenFamily from './pages/ChildrenFamily';
import Supervision from './pages/Supervision';
import Organizations from './pages/Organizations';
import Research from './pages/Research';
import Publications from './pages/Publications';
import Articles from './pages/Articles';
import ArticlePage from './pages/ArticlePage';
import Events from './pages/Events';

// Patient area: the PTSD-IL site itself. Pages without Metiv additions are the
// original page files, imported as they are. Pages with additions are verbatim
// copies with only the addition inserted (./patient/*). The two new Metiv pages
// come from the shared patient kit.
import FirstCircle from '@/pages/FirstCircle';
import SecondCircle from '@/pages/SecondCircle';
import PTSDInfo from '@/pages/PTSDInfo';
import Rights from './patient/Rights';
import Calming from '@/pages/Calming';
import CalmingBreathing from '@/pages/CalmingBreathing';
import CalmingGrounding from '@/pages/CalmingGrounding';
import CalmingMuscle from '@/pages/CalmingMuscle';
import PatientLayout from './patient/PatientLayout';
import PatientHome from './patient/PatientHome';
import SecondCircleTools from './patient/SecondCircleTools';
import Questionnaire from './patient/Questionnaire';
import SelfHelp from './patient/SelfHelp';
import Treatment from './patient/Treatment';
import Community from './patient/Community';
import Children from './patient/Children';
import Sources from './patient/Sources';
import { VersionLinks } from './patient/PtsdIlRouting';

// V3 "Guided Journey". Mounted by App.jsx at /metiv-site-demo-v3/*.
// Paths below are relative to that base (leading slash stripped).

/** @param {string} path */
const rel = (path) => path.replace(/^\//, '');

const WhereToGetHelp = PATIENT_PAGES.whereToGetHelp;
const FreeTreatmentAndResearch = PATIENT_PAGES.freeTreatment;
const PrivacyPolicy = PATIENT_PAGES.privacy;
const TermsOfUse = PATIENT_PAGES.terms;

/** A shared-kit page inside the patient area: version links, the site's standard page header. */
function KitPage({ children }) {
  return (
    <VersionLinks>
      <DemoChromeProvider base={BASE} version={VERSION}>{children}</DemoChromeProvider>
    </VersionLinks>
  );
}

export default function Site() {
  return (
    <DemoChromeProvider base={BASE} version={VERSION} PageHeader={PageHeaderV3}>
      <div className="min-h-screen bg-background text-foreground font-body">
        <ScrollManager />
        <DocumentMeta />
        <Routes>
          <Route element={<SiteShell area="metiv" />}>
            <Route index element={<Landing />} />
            <Route path={rel(ROUTES.about)} element={<About />} />
            <Route path={rel(ROUTES.donate)} element={<Donate />} />
            <Route path={rel(ROUTES.contact)} element={<Contact />} />
            <Route path={rel(ROUTES.accessibility)} element={<Accessibility />} />
            <Route path={rel(ROUTES.privacy)} element={<PrivacyPolicy />} />
            <Route path={rel(ROUTES.terms)} element={<TermsOfUse />} />
          </Route>

          <Route element={<PatientLayout />}>
            <Route path={rel(ROUTES.patient)} element={<PatientHome />} />
            <Route path={rel(ROUTES.firstCircle)} element={<FirstCircle />} />
            <Route path={rel(ROUTES.secondCircle)} element={<SecondCircle />} />
            <Route path={rel(ROUTES.secondCircleTools)} element={<SecondCircleTools />} />
            <Route path={rel(ROUTES.questionnaire)} element={<Questionnaire />} />
            <Route path={rel(ROUTES.ptsdInfo)} element={<PTSDInfo />} />
            <Route path={rel(ROUTES.selfHelp)} element={<SelfHelp />} />
            <Route path={rel(ROUTES.treatment)} element={<Treatment />} />
            <Route path={rel(ROUTES.rights)} element={<Rights />} />
            <Route path={rel(ROUTES.community)} element={<Community />} />
            <Route path={rel(ROUTES.children)} element={<Children />} />
            <Route path={rel(ROUTES.sources)} element={<Sources />} />
            <Route path={rel(ROUTES.calming)} element={<Calming />} />
            <Route path={rel(ROUTES.calmingBreathing)} element={<CalmingBreathing />} />
            <Route path={rel(ROUTES.calmingGrounding)} element={<CalmingGrounding />} />
            <Route path={rel(ROUTES.calmingMuscle)} element={<CalmingMuscle />} />
            <Route path={rel(ROUTES.whereToGetHelp)} element={<KitPage><WhereToGetHelp /></KitPage>} />
            <Route path={rel(ROUTES.freeTreatment)} element={<KitPage><FreeTreatmentAndResearch /></KitPage>} />
          </Route>

          <Route element={<SiteShell area="therapist" />}>
            <Route path={rel(ROUTES.therapist)} element={<TherapistHub />} />
            <Route path={rel(ROUTES.courses)} element={<Courses />} />
            <Route path={rel(ROUTES.course)} element={<CourseDetail />} />
            <Route path={rel(ROUTES.childrenFamily)} element={<ChildrenFamily />} />
            <Route path={rel(ROUTES.supervision)} element={<Supervision />} />
            <Route path={rel(ROUTES.organizations)} element={<Organizations />} />
            <Route path={rel(ROUTES.research)} element={<Research />} />
            <Route path={rel(ROUTES.publications)} element={<Publications />} />
            <Route path={rel(ROUTES.articles)} element={<Articles />} />
            <Route path={rel(ROUTES.article)} element={<ArticlePage />} />
            <Route path={rel(ROUTES.events)} element={<Events />} />
          </Route>

          <Route path="*" element={<Navigate to={BASE} replace />} />
        </Routes>
      </div>
    </DemoChromeProvider>
  );
}
