import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import LanguageSwitcher from './LanguageSwitcher';
import ThemePicker from './ThemePicker';
import { Menu, X, Home } from 'lucide-react';

const navItems = [
  { key: 'ptsd_info', path: '/ptsd-info' },
  { key: 'treatment', path: '/treatment' },
  { key: 'rights', path: '/rights' },
  { key: 'community', path: '/community' },
  { key: 'calming', path: '/calming' },
];

export default function Navbar() {
  const { lang } = useLang();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <nav className="max-w-5xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center flex-shrink-0">
          <Home className="w-5 h-5 text-primary" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-7">
          {navItems.map(item => (
            <Link
              key={item.key}
              to={item.path}
              className={`text-sm transition-colors duration-300 ${
                location.pathname === item.path
                  ? 'text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t(lang, item.key)}
            </Link>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          <ThemePicker />
          <LanguageSwitcher />
          <button
            className="md:hidden p-2 rounded-lg text-foreground hover:bg-muted transition-colors duration-300"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="תפריט"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-4 py-3 space-y-1">
            {navItems.map(item => (
              <Link
                key={item.key}
                to={item.path}
                className={`block px-3 py-2.5 rounded-lg text-sm transition-colors duration-300 ${
                  location.pathname === item.path
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {t(lang, item.key)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}