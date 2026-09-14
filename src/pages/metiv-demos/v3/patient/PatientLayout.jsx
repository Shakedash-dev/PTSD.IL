import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import Navbar from './PatientNavbar';
import ChatbotFAB from '@/components/ChatbotFAB';
import { Footer } from '../components/Chrome';
import { PtsdIlLinks, usePtsdIlPathname, VersionLinks } from './PtsdIlRouting';

// Metiv demo (V3): a copy of src/components/Layout.jsx for the patient area.
// Changes only: the footer is the V3 site footer (owner decision), the path is
// read through usePtsdIlPathname() because the demo URL carries a prefix, links
// resolve inside the demo via <PtsdIlLinks>, and useSeo() is not called (the
// demo is noindex and sets its own titles).

// Sanctuary pages are therapeutic exercises; they get a minimal header so nothing distracts users mid-session.
const SANCTUARY_PATHS = ['/calming', '/calming/breathing', '/calming/grounding', '/calming/muscle'];

export default function Layout() {
  const pathname = usePtsdIlPathname();
  const isSanctuary = SANCTUARY_PATHS.some(p => pathname.startsWith(p));
  const isHome = pathname === '/';

  return (
    <PtsdIlLinks>
    <div className="min-h-screen flex flex-col bg-background relative">
      {!isSanctuary && <Navbar />}
      {isSanctuary && <SanctuaryNav />}
      <main className="flex-1">
        <Outlet />
      </main>
      {!isSanctuary && (
        <VersionLinks>
          <div dir="rtl" lang="he">
            <Footer />
          </div>
        </VersionLinks>
      )}
      <ChatbotFAB />
    </div>
    </PtsdIlLinks>
  );
}

// SanctuaryNav is a minimal safety strip for the calming pages. The crisis line (1201)
// is Israel-specific and intentionally hardcoded; the "Back" label is localized.
function SanctuaryNav() {
  const pathname = usePtsdIlPathname();
  const { lang } = useLang();
  const backTo = pathname === '/calming' ? '/' : '/calming';
  return (
    <header className="fixed top-0 inset-x-0 z-50 px-5 h-14 flex items-center justify-between bg-background border-b border-border">
      <Link to={backTo} className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-300">
        {t(lang, 'back')}
      </Link>
      <a href="tel:1201" className="text-muted-foreground hover:text-foreground text-xs transition-colors duration-300">ער״ן: 1201</a>
    </header>
  );
}