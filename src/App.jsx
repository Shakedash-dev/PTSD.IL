import React, { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { BASE_PATH } from '@/base-path';
import PageNotFound from './lib/PageNotFound';
import ScrollToTop from './components/ScrollToTop';
import ContentPrefetcher from './components/ContentPrefetcher';
import { LanguageProvider } from '@/lib/LanguageContext';
import { ChatProvider } from '@/lib/ChatContext';
import { ValidationProvider } from '@/contexts/ValidationContext';
import { UserTypeProvider } from '@/contexts/UserTypeContext';
import Layout from '@/components/Layout';

import Home from '@/pages/Home';
import FirstCircle from '@/pages/FirstCircle';
import SecondCircle from '@/pages/SecondCircle';
import SecondCircleTools from '@/pages/SecondCircleTools';
import Questionnaire from '@/pages/Questionnaire';
import PTSDInfo from '@/pages/PTSDInfo';
import PTSDInfo2 from '@/pages/PTSDInfo2';
import SelfHelp from '@/pages/SelfHelp';
import Treatment from '@/pages/Treatment';
import Rights from '@/pages/Rights';
import Community from '@/pages/Community';
import Children from '@/pages/Children';
import Calming from '@/pages/Calming';
import CalmingBreathing from '@/pages/CalmingBreathing';
import CalmingGrounding from '@/pages/CalmingGrounding';
import CalmingMuscle from '@/pages/CalmingMuscle';
import Sources from '@/pages/Sources';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsOfUse from '@/pages/TermsOfUse';
import AdminGate from '@/components/admin/AdminGate';

// Metiv merged-site demos (see pages/metiv-demos/README.md). Lazy so none of the
// demo code or its static content enters the main bundle; each version renders
// outside <Layout> with its own header and footer.
const MetivDemoChooser = lazy(() => import('@/pages/metiv-demos/chooser/Chooser'));
const MetivDemoV1 = lazy(() => import('@/pages/metiv-demos/v1/Site'));
const MetivDemoV2 = lazy(() => import('@/pages/metiv-demos/v2/Site'));
const MetivDemoV3 = lazy(() => import('@/pages/metiv-demos/v3/Site'));
const MetivDemoV4 = lazy(() => import('@/pages/metiv-demos/v4/Site'));

// Provider order matters: QueryClientProvider must be outermost (hooks used inside all children).
function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <LanguageProvider>
        <ChatProvider>
          <ValidationProvider>
            <Router basename={BASE_PATH}>
              <UserTypeProvider>
              <ScrollToTop />
              <ContentPrefetcher />
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/first-circle" element={<FirstCircle />} />
                  <Route path="/second-circle" element={<SecondCircle />} />
                  <Route path="/second-circle-tools" element={<SecondCircleTools />} />
                  <Route path="/questionnaire" element={<Questionnaire />} />
                  <Route path="/ptsd-info" element={<PTSDInfo />} />
                  <Route path="/ptsd-info-2" element={<PTSDInfo2 />} />
                  <Route path="/self-help" element={<SelfHelp />} />
                  <Route path="/treatment" element={<Treatment />} />
                  <Route path="/rights" element={<Rights />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/children" element={<Children />} />
                  <Route path="/calming" element={<Calming />} />
                  <Route path="/calming/breathing" element={<CalmingBreathing />} />
                  <Route path="/calming/grounding" element={<CalmingGrounding />} />
                  <Route path="/calming/muscle" element={<CalmingMuscle />} />
                  <Route path="/sources" element={<Sources />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-of-use" element={<TermsOfUse />} />
                </Route>
                <Route path="/admin" element={<AdminGate />} />
                <Route path="/metiv-site-demo" element={<Suspense fallback={null}><MetivDemoChooser /></Suspense>} />
                <Route path="/metiv-site-demo-v1/*" element={<Suspense fallback={null}><MetivDemoV1 /></Suspense>} />
                <Route path="/metiv-site-demo-v2/*" element={<Suspense fallback={null}><MetivDemoV2 /></Suspense>} />
                {/* The Metiv content admin. More specific than the v3 splat, so it wins. */}
                <Route path="/metiv-site-demo-v3/admin" element={<AdminGate variant="metiv" />} />
                <Route path="/metiv-site-demo-v3/*" element={<Suspense fallback={null}><MetivDemoV3 /></Suspense>} />
                <Route path="/metiv-site-demo-v4/*" element={<Suspense fallback={null}><MetivDemoV4 /></Suspense>} />
                <Route path="*" element={<PageNotFound />} />
              </Routes>
              </UserTypeProvider>
            </Router>
          </ValidationProvider>
          <Toaster />
          <SonnerToaster />
        </ChatProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
