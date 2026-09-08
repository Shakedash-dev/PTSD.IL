import React, { useState } from 'react';
import { useLang } from '@/lib/LanguageContext';
import { LANGUAGES, t } from '@/lib/i18n';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChoiceChip from '@/components/patterns/ChoiceChip';

export default function LanguageSwitcher() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);

  const current = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  return (
    <div className="relative">
      <Button
        variant="quiet"
        size="none"
        onClick={() => setOpen(o => !o)}
        className="gap-1.5 text-xs px-2 py-1"
        aria-label={t(lang, 'lang_switcher_label')}
      >
        <Languages className="w-4 h-4" />
        {current.label}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className={`absolute top-full mt-2 z-50 rounded-xl overflow-hidden border border-border bg-card min-w-[130px] ${
              'end-0'
            }`}
          >
            {LANGUAGES.map(l => (
              <ChoiceChip
                key={l.code}
                size="list"
                variant="plain"
                selected={l.code === lang}
                onClick={() => { setLang(l.code); setOpen(false); }}
                className={`px-4 py-2 rounded-none ${l.code === lang ? 'bg-muted text-foreground' : ''}`}
              >
                {l.label}
              </ChoiceChip>
            ))}
          </div>
        </>
      )}
    </div>
  );
}