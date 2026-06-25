import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { useUserType } from '@/contexts/UserTypeContext';
import LanguageSwitcher from './LanguageSwitcher';
import ThemePicker from './ThemePicker';
import ImageSetPicker from './ImageSetPicker';
import { Menu, X } from 'lucide-react';

// Three user-type entry points, shown when the user is on a path-picker page
// (/first-circle, /second-circle, /questionnaire). The label keys are the short
// versions; the path-card titles on the home page use the longer `path*_title` keys.
const PATH_LINKS = [
  { labelKey: 'nav_path1', path: '/first-circle' },
  { labelKey: 'nav_path2', path: '/second-circle' },
  { labelKey: 'nav_path3', path: '/questionnaire' },
];

// Sub-section links for a user who has chosen first-circle. Mirrors the cards
// on the FirstCircle landing page so the navbar acts as a persistent in-path nav.
const FIRST_CIRCLE_LINKS = [
  { labelKey: 'nav_ptsd_info', path: '/ptsd-info' },
  { labelKey: 'nav_self_help', path: '/self-help' },
  { labelKey: 'nav_rights', path: '/rights' },
  { labelKey: 'nav_treatment', path: '/treatment' },
  { labelKey: 'nav_community', path: '/community' },
  { labelKey: 'nav_children', path: '/children' },
];

// Sub-section links for second-circle (supporter). Swaps self-help for the
// supporter-specific tools page. Order must mirror the SecondCircle landing
// page (children comes before community here, the reverse of FirstCircle).
const SECOND_CIRCLE_LINKS = [
  { labelKey: 'nav_ptsd_info', path: '/ptsd-info' },
  { labelKey: 'nav_second_circle_tools', path: '/second-circle-tools' },
  { labelKey: 'nav_rights', path: '/rights' },
  { labelKey: 'nav_treatment', path: '/treatment' },
  { labelKey: 'nav_children', path: '/children' },
  { labelKey: 'nav_community', path: '/community' },
];

const PATH_PICKER_ROUTES = ['/first-circle', '/second-circle', '/questionnaire'];

// Choose which set of links the navbar should show. The home page gets nothing,
// the path-picker pages get the three user-type entry points, and any other
// page (a "sub-page") gets the sub-section list for the user's current path.
// If we don't know the user type yet (e.g. they deep-linked into /ptsd-info
// without picking a path first) we fall back to the three path links so they
// can identify themselves.
function selectLinks(pathname, userType) {
  if (pathname === '/') return [];
  if (PATH_PICKER_ROUTES.includes(pathname)) return PATH_LINKS;
  if (userType === 'first_circle') return FIRST_CIRCLE_LINKS;
  if (userType === 'second_circle') return SECOND_CIRCLE_LINKS;
  return PATH_LINKS;
}

export default function Navbar() {
  const { lang } = useLang();
  const { userType } = useUserType();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = selectLinks(location.pathname, userType);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <nav className="max-w-5xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Wordmark */}
        <Link to="/" className="flex items-center flex-shrink-0 group">
          <span className="font-heading font-bold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors duration-300">
            PTSD<span className="text-primary">.IL</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm transition-colors duration-300 ${
                location.pathname === item.path
                  ? 'text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t(lang, item.labelKey)}
            </Link>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          <ThemePicker />
          <ImageSetPicker />
          <LanguageSwitcher />
          {navItems.length > 0 && (
            <button
              className="md:hidden p-2 rounded-lg text-foreground hover:bg-muted transition-colors duration-300"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="תפריט"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && navItems.length > 0 && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-4 py-3 space-y-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-3 py-2.5 rounded-lg text-sm transition-colors duration-300 ${
                  location.pathname === item.path
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {t(lang, item.labelKey)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
