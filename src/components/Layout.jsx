import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import ChatbotFAB from './ChatbotFAB';
import TextureOverlay from './TextureOverlay';

// Sanctuary pages are therapeutic exercises; they get a minimal header so nothing distracts users mid-session.
const SANCTUARY_PATHS = ['/calming', '/calming/breathing', '/calming/grounding', '/calming/muscle'];

export default function Layout() {
  const location = useLocation();
  const isSanctuary = SANCTUARY_PATHS.some(p => location.pathname.startsWith(p));
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <TextureOverlay />
      {!isSanctuary && <Navbar />}
      {isSanctuary && <SanctuaryNav />}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      {!isSanctuary && <Footer />}
      <ChatbotFAB />
    </div>
  );
}

// SanctuaryNav intentionally uses hardcoded Hebrew and a tel: anchor - it's a minimal safety strip,
// not a full i18n'd nav. The crisis line (1201) is Israel-specific and needs no translation.
function SanctuaryNav() {
  const location = useLocation();
  const backTo = location.pathname === '/calming' ? '/' : '/calming';
  return (
    <header className="fixed top-0 inset-x-0 z-50 px-5 h-14 flex items-center justify-between bg-background border-b border-border">
      <Link to={backTo} className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-300">
        חזרה
      </Link>
      <a href="tel:1201" className="text-muted-foreground hover:text-foreground text-xs transition-colors duration-300">ער״ן: 1201</a>
    </header>
  );
}