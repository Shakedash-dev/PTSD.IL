import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { BASE_PATH } from '@/base-path';
import PageNotFound from './lib/PageNotFound';
import ScrollToTop from './components/ScrollToTop';
import { LanguageProvider } from '@/lib/LanguageContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import Layout from '@/components/Layout';

import Home from '@/pages/Home';
import FirstCircle from '@/pages/FirstCircle';
import SecondCircle from '@/pages/SecondCircle';
import SecondCircleTools from '@/pages/SecondCircleTools';
import Questionnaire from '@/pages/Questionnaire';
import PTSDInfo from '@/pages/PTSDInfo';
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

// Provider order matters: QueryClientProvider must be outermost (hooks used inside all children).
// Toaster sits outside ThemeProvider - it uses its own portal and doesn't need theme context.
function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <LanguageProvider>
        <ThemeProvider>
          <Router basename={BASE_PATH}>
            <ScrollToTop />
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/first-circle" element={<FirstCircle />} />
                <Route path="/second-circle" element={<SecondCircle />} />
                <Route path="/second-circle-tools" element={<SecondCircleTools />} />
                <Route path="/questionnaire" element={<Questionnaire />} />
                <Route path="/ptsd-info" element={<PTSDInfo />} />
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
                <Route path="/admin" element={<Admin />} />
              </Route>
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </Router>
        </ThemeProvider>
        <Toaster />
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
