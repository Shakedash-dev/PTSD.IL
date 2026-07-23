import React, { useState } from 'react';
import { useLang } from '@/lib/LanguageContext';
import { LANGUAGES, t } from '@/lib/i18n';
import { Languages } from 'lucide-react';

export default function LanguageSwitcher() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);

  const current = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];
  const isRTL = document.documentElement.getAttribute('dir') === 'rtl';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-300 px-2 py-1"
        aria-label={t(lang, 'lang_switcher_label')}
      >
        <Languages className="w-4 h-4" />
        {current.label}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className={`absolute top-full mt-2 z-50 rounded-xl overflow-hidden border border-border bg-card min-w-[130px] ${
              isRTL ? 'left-0' : 'right-0'
            }`}
          >
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => { setLang(l.code); setOpen(false); }}
                className={`w-full text-start px-4 py-2 text-sm transition-colors duration-300 ${
                  l.code === lang
                    ? 'text-foreground font-medium bg-muted'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}