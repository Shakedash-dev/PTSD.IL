import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChoiceChip from '@/components/patterns/ChoiceChip';
import { ADMIN_LANGS } from '@/api/adminTranslate';
import { ForbiddenError } from '@/api/adminClient';
import { loadEditLog } from '@/api/adminSource';
import { listUsers } from '@/api/adminUsers';
import { usePendingChanges } from '@/components/admin/PendingChanges';

// Edit log - masteradmin only (gated in Admin.jsx). Lists every "save all"
// batch, newest first: who, when, and each change with its before/after text.
// See appendEditLog in src/api/adminSource.js for how rows are stored and what
// the log can and cannot guarantee.
//
// Reading the rows goes through GET /admin/articles, which the API grants to
// admin/moderator only - a masteradmin without one of those roles gets a 403,
// shown below as an explanation rather than an error.

const ACTION_LABELS = {
  create: { label: 'הוספה', color: 'bg-success/10 text-success' },
  update: { label: 'עריכה', color: 'bg-info/10 text-info' },
  delete: { label: 'מחיקה', color: 'bg-destructive/10 text-destructive' },
};

function formatWhen(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || '';
  return d.toLocaleString('he-IL', { dateStyle: 'medium', timeStyle: 'short' });
}

function Value({ label, text }) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
      <div className="rounded-lg border border-border bg-background p-2 text-xs whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
        {text || <span className="text-muted-foreground">(ריק)</span>}
      </div>
    </div>
  );
}

// Languages a change can be in, besides Hebrew, in button order.
const OTHER_LANGS = ['ar', 'en', 'ru', 'fr'];
const LANG_LABELS = Object.fromEntries(ADMIN_LANGS.map(l => [l.id, l.label]));
const SUFFIX_LANG = new Map(OTHER_LANGS.map(id => [`(${LANG_LABELS[id]})`, id]));

/**
 * The language of a logged change: its `lang`, or for rows logged before
 * changes carried one, the " (ערבית)" suffix translations are titled with.
 * Anything else is Hebrew.
 */
export function changeLang(change) {
  if (change.lang) return change.lang;
  const m = String(change.title || '').match(/\([^()]+\)\s*$/);
  return (m && SUFFIX_LANG.get(m[0].trim())) || 'he';
}

function ChangeRow({ c }) {
  const action = ACTION_LABELS[c.action] || { label: c.action, color: 'bg-muted text-muted-foreground' };
  return (
    <li className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${action.color}`}>{action.label}</span>
        <span className="text-xs text-muted-foreground">{c.section}</span>
        <span className="text-sm font-medium text-foreground">{c.title}</span>
      </div>
      {(c.fields || []).map((f, j) => (
        <div key={j}>
          <p className="text-xs font-semibold text-muted-foreground mb-1">{f.label}</p>
          <div className="flex flex-col sm:flex-row gap-2">
            {c.action !== 'create' && <Value label="לפני" text={f.before} />}
            <Value label={c.action === 'create' ? 'תוכן' : 'אחרי'} text={f.after} />
          </div>
        </div>
      ))}
    </li>
  );
}

// One batch. Opened, it lists the Hebrew changes; the other languages' changes
// (mostly AI translations of those) stay behind one button per language.
function LogEntry({ entry, who }) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(() => new Set());
  const byLang = new Map();
  for (const c of entry.changes) {
    const lang = changeLang(c);
    if (!byLang.has(lang)) byLang.set(lang, []);
    byLang.get(lang).push(c);
  }
  const hebrew = byLang.get('he') || [];
  const others = OTHER_LANGS.filter(l => byLang.has(l));
  const otherCount = entry.changes.length - hebrew.length;
  const toggle = lang => setShown(s => {
    const next = new Set(s);
    if (next.has(lang)) next.delete(lang); else next.add(lang);
    return next;
  });
  return (
    <li className="rounded-xl border border-border bg-background">
      <Button
        type="button"
        variant="quiet"
        size="none"
        onClick={() => setOpen(v => !v)}
        className="w-full justify-between text-start p-4 whitespace-normal"
      >
        <span className="min-w-0">
          <span className="block font-medium text-foreground">{who}</span>
          <span className="block text-xs text-muted-foreground mt-0.5">
            {formatWhen(entry.at)} · {hebrew.length === 1 ? 'שינוי אחד' : `${hebrew.length} שינויים`}
            {otherCount > 0 && ` · ועוד ${otherCount} בשפות אחרות`}
          </span>
        </span>
        {open ? <ChevronUp className="w-4 h-4 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 flex-shrink-0" />}
      </Button>
      {!open && hebrew.length > 0 && (
        <p className="px-4 pb-3 -mt-2 text-xs text-muted-foreground line-clamp-1">
          {hebrew.map(c => `${c.section}: ${c.title}`).join(' · ')}
        </p>
      )}
      {open && (
        <div className="border-t border-border p-4 space-y-3">
          {hebrew.length > 0 ? (
            <ul className="space-y-3">
              {hebrew.map((c, i) => <ChangeRow key={i} c={c} />)}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">אין בשמירה הזו שינויים בעברית.</p>
          )}
          {others.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-xs text-muted-foreground">שפות נוספות:</span>
              {others.map(lang => (
                <ChoiceChip key={lang} size="sm" selected={shown.has(lang)} onClick={() => toggle(lang)}>
                  {LANG_LABELS[lang]} ({byLang.get(lang).length})
                </ChoiceChip>
              ))}
            </div>
          )}
          {others.filter(l => shown.has(l)).map(lang => (
            <section key={lang} aria-label={LANG_LABELS[lang]} className="rounded-lg border border-dashed border-border p-3 space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground">{LANG_LABELS[lang]}</h4>
              <ul className="space-y-3">
                {byLang.get(lang).map((c, i) => <ChangeRow key={i} c={c} />)}
              </ul>
            </section>
          ))}
        </div>
      )}
    </li>
  );
}

export default function EditLogPanel() {
  const { version } = usePendingChanges();
  const [entries, setEntries] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    setError(null);
    loadEditLog()
      .then(rows => { if (!cancelled) setEntries(rows); })
      .catch(err => {
        if (cancelled) return;
        setEntries([]);
        setError(err instanceof ForbiddenError
          ? 'כדי לצפות ביומן נדרש גם תפקיד "מנהל תוכן". הוסיפו אותו למשתמש שלכם בלשונית ניהול משתמשים.'
          : (err?.message || 'שגיאה בטעינת היומן'));
      });
    // Names only - a failure here just means the log falls back to emails.
    listUsers().then(u => { if (!cancelled) setUsers(u); }).catch(() => {});
    return () => { cancelled = true; };
  }, [version]);

  const nameById = useMemo(() => {
    const m = new Map();
    for (const u of users) {
      const name = [u.firstName, u.lastName].filter(n => n && n !== '-').join(' ');
      m.set(u.id, name ? `${name}${u.email ? ` (${u.email})` : ''}` : u.email);
    }
    return m;
  }, [users]);

  function who(entry) {
    const u = entry.user || {};
    return nameById.get(u.id) || u.name || u.email || 'משתמש לא מזוהה';
  }

  const q = query.trim();
  const visible = (entries || []).filter(e => !q || who(e).includes(q)
    || e.changes.some(c => `${c.section} ${c.title}`.includes(q)));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-heading font-semibold text-lg text-foreground">יומן עריכות</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        כל שמירה מממשק הניהול: מי שמר, מתי ומה השתנה. היומן לא מאפשר שחזור - הוא מתעד בלבד.
      </p>
      <input
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="חיפוש לפי שם, עמוד או פריט"
        className="w-full mb-4 px-3 py-2 rounded-lg border border-border bg-background text-sm"
      />
      {entries === null ? (
        <p className="text-sm text-muted-foreground py-6 text-center">טוען...</p>
      ) : error ? (
        <p role="alert" className="text-sm text-destructive py-4">{error}</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">{q ? 'אין תוצאות' : 'עדיין לא נשמרו שינויים'}</p>
      ) : (
        <ul className="space-y-3">
          {visible.map(e => <LogEntry key={e.id} entry={e} who={who(e)} />)}
        </ul>
      )}
    </div>
  );
}
