import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import ChatbotFAB from './ChatbotFAB';
import TextureOverlay from './TextureOverlay';

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
        <div key={location.pathname} className="page-enter">
          <Outlet />
        </div>
      </main>
      {!isSanctuary && <Footer />}
      <ChatbotFAB />
    </div>
  );
}

function SanctuaryNav() {
  const location = useLocation();
  const backTo = location.pathname === '/calming' ? '/' : '/calming';
  return (
    <header className="fixed top-0 inset-x-0 z-50 px-5 h-14 flex items-center justify-between bg-background border-b border-border">
      <a href={backTo} className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-300">
        חזרה
      </a>
      <a href="tel:1201" className="text-muted-foreground hover:text-foreground text-xs transition-colors duration-300">ער״ן: 1201</a>
    </header>
  );
}