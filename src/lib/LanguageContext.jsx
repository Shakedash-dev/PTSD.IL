import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_LANG, getDir } from './i18n';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  // 'natal_lang' is legacy from the original project name - do not rename, existing visitors would lose their preference.
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('natal_lang') || DEFAULT_LANG;
  });

  useEffect(() => {
    localStorage.setItem('natal_lang', lang);
    document.documentElement.setAttribute('dir', getDir(lang));
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}