import React, { createContext, useContext } from 'react';
import ChoiceChip from '@/components/patterns/ChoiceChip';
import { ADMIN_LANGS, LANG_BY_ID } from '@/api/adminTranslate';

// The content language /admin is editing (the language tabs at the top of the
// content view). The admin frame itself stays Hebrew and RTL; only the content
// inputs follow the tab's direction. Hebrew is the source language: editing it
// translates the other four (translationStaging.js), editing any other tab
// writes only that language's row and marks it as edited by hand.

const AdminLangContext = createContext(LANG_BY_ID.he);

export function AdminLangProvider({ lang, children }) {
  return <AdminLangContext.Provider value={LANG_BY_ID[lang] || LANG_BY_ID.he}>{children}</AdminLangContext.Provider>;
}

/** @returns {{ id: string, label: string, dir: 'rtl'|'ltr' }} */
export function useAdminLang() {
  return useContext(AdminLangContext);
}

export function LanguageTabs({ lang, onChange }) {
  return (
    <div className="mb-6 space-y-2">
      <div role="group" aria-label="שפת העריכה" className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground me-1">שפת העריכה:</span>
        {ADMIN_LANGS.map(l => (
          <ChoiceChip key={l.id} size="sm" selected={lang === l.id} onClick={() => onChange(l.id)}>
            {l.label}
          </ChoiceChip>
        ))}
      </div>
      {lang === 'he' ? (
        <p className="text-xs text-muted-foreground">
          עריכה בעברית מתורגמת אוטומטית לשאר השפות, והתרגומים מופיעים לבדיקה בחלון &quot;סקירה ושמירה&quot;.
        </p>
      ) : (
        <p role="note" className="text-xs text-foreground rounded-lg border border-info/30 bg-info/10 px-3 py-2">
          עורכים את ה{LANG_BY_ID[lang]?.label}. השמירה משנה רק את השורה בשפה הזו ומסמנת אותה כעריכה ידנית - בלי תרגום אוטומטי.
          הוספה, מחיקה ושינוי סדר נעשים בלשונית העברית.
        </p>
      )}
    </div>
  );
}
