import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_LANG, getDir, setCopyOverrides } from './i18n';
import { fetchSiteCopy } from '@/api/source';

const LanguageContext = createContext(null);


export function LanguageProvider({ children }) {
  // 'natal_lang' is legacy from the original project name - do not rename, existing visitors would lose their preference.
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('natal_lang') || DEFAULT_LANG;
  });
  // Bumped once the admin's copy overrides for `lang` are installed. It is part
  // of the context value purely so every consumer of useLang() - i.e. every
  // page, since they all call t() - re-renders with the new wording. t() reads
  // a module-level registry, so React has no other way to know it changed.
  const [copyVersion, setCopyVersion] = useState(0);

  useEffect(() => {
    localStorage.setItem('natal_lang', lang);
    document.documentElement.setAttribute('dir', getDir(lang));
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  // Site-copy overrides (/admin's "תוכן דפים" tab). Fetched directly rather
  // than through React Query so this provider stays usable outside a
  // QueryClientProvider. A failure here is not an error state: the site simply
  // keeps the strings it shipped with, which is the correct rendering.
  useEffect(() => {
    let cancelled = false;
    setCopyOverrides(lang, null); // clear the previous language while the new one is in flight
    fetchSiteCopy({ lang })
      .then(map => {
        if (cancelled) return;
        setCopyOverrides(lang, map);
        // Only re-render when something actually changed - the common case is
        // an empty map, and a pointless bump would re-render the whole tree.
        if (Object.keys(map).length > 0) setCopyVersion(v => v + 1);
      })
      .catch(() => { /* offline / API down - shipped strings stand */ });
    return () => { cancelled = true; };
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, copyVersion }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
