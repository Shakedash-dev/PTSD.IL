import React, { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { BASE_PATH } from '@/base-path';
import PageNotFound from './lib/PageNotFound';
import ScrollToTop from './components/ScrollToTop';
import { LanguageProvider, useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { ThemeProvider } from '@/lib/ThemeContext';
import { ValidationProvider } from '@/contexts/ValidationContext';
import { UserTypeProvider } from '@/contexts/UserTypeContext';
import Layout from '@/components/Layout';
import { isAuthenticated, hasAdminAccess, logout, AUTH_CHANGE_EVENT } from '@/lib/auth';

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
import Admin from '@/pages/Admin';
import AdminLogin from '@/pages/AdminLogin';

// Route guard for /admin: not authenticated -> login page; authenticated but
// without admin/moderator role -> a short "no access" message + logout
// button (the panel itself is never rendered in that case); otherwise the
// panel. Listens for AUTH_CHANGE_EVENT (fired by src/lib/auth.js on
// login/logout, and by src/api/adminClient.js on a 401) so the view updates
// reactively without a manual refresh.
function AdminGate() {
  const { lang } = useLang();
  const [authed, setAuthed] = useState(() => isAuthenticated());
  const [allowed, setAllowed] = useState(() => hasAdminAccess());

  useEffect(() => {
    function sync() {
      setAuthed(isAuthenticated());
      setAllowed(hasAdminAccess());
    }
    window.addEventListener(AUTH_CHANGE_EVENT, sync);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, sync);
  }, []);

  if (!authed) return <AdminLogin />;

  if (!allowed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-16 px-4">
        <div className="text-center max-w-sm">
          <p className="text-foreground font-medium mb-4">{t(lang, 'admin_no_access')}</p>
          <button
            type="button"
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-muted text-foreground text-sm font-semibold hover:bg-border transition-natural"
          >
            {t(lang, 'admin_logout')}
          </button>
        </div>
      </div>
    );
  }

  return <Admin />;
}

// Provider order matters: QueryClientProvider must be outermost (hooks used inside all children).
// Toaster sits outside ThemeProvider - it uses its own portal and doesn't need theme context.
function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <LanguageProvider>
        <ThemeProvider>
          <ValidationProvider>
            <Router basename={BASE_PATH}>
            <UserTypeProvider>
            <ScrollToTop />
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
                <Route path="/admin" element={<AdminGate />} />
              </Route>
              <Route path="*" element={<PageNotFound />} />
            </Routes>
            </UserTypeProvider>
          </Router>
          </ValidationProvider>
        </ThemeProvider>
        <Toaster />
        <SonnerToaster />
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
