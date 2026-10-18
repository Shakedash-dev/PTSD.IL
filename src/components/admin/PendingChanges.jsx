import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Save, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ForbiddenError, UnauthorizedError } from '@/api/adminClient';
import { ChatbotSyncError } from '@/api/reindex';
import { appendEditLog } from '@/api/adminSource';
import { getCurrentUser } from '@/lib/auth';
import { htmlToMd } from '@/lib/markdownHtml';

// ─── Staged edits for /admin ────────────────────────────────────────────────
// Nothing an editor does in a content panel reaches the server on its own.
// "אישור" on a card only stages the change here; the one way to write is the
// "save all" dialog below, which lists every staged change with its before and
// after text and makes the editor confirm that the save cannot be undone (the
// backend keeps no versions). After a batch lands it is appended to the edit
// log (adminSource.appendEditLog) under the signed-in user.
//
// The provider sits in AdminGate (src/App.jsx), above the login screen, so an
// expired session does not throw away staged work: the editor signs in again
// and the changes are still there to save.
//
// A change:
//   key     unique per target; staging the same key again replaces it, which is
//           how a second edit of one item, or deleting an edited item, works
//   scope   which list the change belongs to, so a panel can overlay it
//   section the Hebrew name of that list, for the dialog and the log
//   action  'create' | 'update' | 'delete'
//   itemId  the row being changed (update/delete)
//   title   the item's display name
//   draft   the staged value (create/update), rendered in place of the row
//   diff    [{ label, before, after }] as plain text - what the dialog shows
//   run     () => Promise, the actual write

/**
 * @typedef {{ label: string, before: string, after: string }} FieldDiff
 * @typedef {{ key: string, scope: string, section: string, action: 'create'|'update'|'delete', itemId?: string, title: string, draft?: any, diff: FieldDiff[], run: () => Promise<any> }} PendingChange
 */

// Runs one write, converting the admin client's typed errors
// (src/api/adminClient.js) into a toast instead of letting the panel crash.
// Returns true on success, false on a handled failure. UnauthorizedError is
// re-thrown - adminApi() has already dropped the session, and the caller has to
// stop rather than fire the rest of a batch at a dead token.
export async function runWrite(action) {
  try {
    await action();
    return true;
  } catch (err) {
    if (err instanceof ForbiddenError) {
      toast.error('אין לך הרשאה לבצע פעולה זו');
      return false;
    }
    if (err instanceof UnauthorizedError) {
      throw err;
    }
    // The content write succeeded but the chatbot vector-DB sync did not. The
    // content IS persisted; only the bot is temporarily stale.
    if (err instanceof ChatbotSyncError) {
      toast.warning(`${err.message}. נסו לשמור שוב או להריץ אינדוקס מלא.`);
      return true;
    }
    toast.error(err?.message || 'אירעה שגיאה. נסו שוב.');
    return false;
  }
}

// ─── Field values as text ───────────────────────────────────────────────────
// The dialog and the log compare and show plain text, not HTML or JSON, so a
// non-technical editor can read exactly what will change.

function htmlText(html) {
  if (!html) return '';
  const withBreaks = String(html).replace(/<\/(p|h[1-6]|li|blockquote)>|<br\s*\/?>/gi, '$&\n');
  const doc = new DOMParser().parseFromString(withBreaks, 'text/html');
  return (doc.body.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
}

function optionLabel(options, value) {
  return options?.find(o => o.value === value)?.label ?? (value ?? '');
}

function linksText(links) {
  return (links || [])
    .filter(l => l.label || l.url)
    .map(l => `${l.label || ''} - ${l.url || ''}`)
    .join('\n');
}

/** Plain-text rendering of one field value, by field type. */
export function fieldText(field, value) {
  switch (field.type) {
    case 'richtext':
      return htmlText(value);
    case 'select':
      return String(optionLabel(field.options, value));
    case 'tags':
      return (value || []).map(v => optionLabel(field.options, v)).join(', ');
    case 'links':
      return linksText(value);
    case 'sections':
      return (value || [])
        .map(s => [s.heading, htmlText(s.body)].filter(Boolean).join('\n'))
        .join('\n\n');
    case 'methods':
      return (value || [])
        .map(m => [m.title_he, m.description_he, htmlText(m.how_to_start_he), linksText(m.links)].filter(Boolean).join('\n'))
        .join('\n\n');
    case 'checkbox':
      return value ? 'כן' : 'לא';
    default:
      return value === undefined || value === null ? '' : String(value);
  }
}

// What a field is worth comparing on. Rich text goes through the same
// html->markdown conversion adminSource applies on save, so the editor
// re-wrapping a paragraph in <p> on load is not mistaken for an edit.
function comparable(field, value) {
  const md = v => htmlToMd(v || '');
  switch (field.type) {
    case 'richtext':
      return md(value);
    case 'sections':
      return (value || []).map(s => ({ heading: s.heading || '', body: md(s.body) }));
    case 'methods':
      return (value || []).map(m => ({
        title: m.title_he || '', description: m.description_he || '',
        how: md(m.how_to_start_he), links: (m.links || []).map(l => [l.label || '', l.url || '']),
      }));
    case 'links':
      return (value || []).map(l => [l.label || '', l.url || '']);
    case 'tags':
      return [...(value || [])].sort();
    case 'checkbox':
      return Boolean(value);
    default:
      return value === undefined || value === null ? '' : String(value);
  }
}

/**
 * The fields that differ between two values of one item, as plain text.
 * @param {Array<{ key: string, label: string, type?: string, options?: any[] }>} fields
 * @param {any} before
 * @param {any} after
 * @returns {FieldDiff[]}
 */
export function fieldsDiff(fields, before, after) {
  const out = [];
  for (const f of fields) {
    const a = before?.[f.key];
    const b = after?.[f.key];
    if (JSON.stringify(comparable(f, a)) === JSON.stringify(comparable(f, b))) continue;
    const beforeText = fieldText(f, a);
    const afterText = fieldText(f, b);
    out.push({
      label: f.label,
      before: beforeText,
      after: beforeText === afterText ? `${afterText}\n(שינוי עיצוב בלבד)` : afterText,
    });
  }
  return out;
}

// ─── Context ────────────────────────────────────────────────────────────────

const PendingChangesContext = createContext(null);

export function PendingChangesProvider({ children }) {
  const [changes, setChanges] = useState(/** @type {PendingChange[]} */ ([]));
  // Bumped after a batch lands; panels list it as a reload dependency so they
  // re-fetch what the server now holds.
  const [version, setVersion] = useState(0);
  const counter = useRef(0);

  const stage = useCallback((/** @type {PendingChange} */ change) => {
    setChanges(cs => {
      const i = cs.findIndex(c => c.key === change.key);
      if (i === -1) return [...cs, change];
      const next = cs.slice();
      next[i] = change;
      return next;
    });
  }, []);

  const discard = useCallback((/** @type {string} */ key) => {
    setChanges(cs => cs.filter(c => c.key !== key));
  }, []);

  const clear = useCallback(() => setChanges([]), []);

  const newKey = useCallback((/** @type {string} */ scope) => {
    counter.current += 1;
    return `${scope}:new:${counter.current}`;
  }, []);

  // Closing or reloading the tab would silently drop staged work.
  useEffect(() => {
    if (!changes.length) return undefined;
    const warn = e => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [changes.length]);

  // Writes every staged change in the order it was staged. A failed change
  // stays staged (its toast says why); the rest still go through. A dead
  // session stops the batch - the remaining changes stay staged for after the
  // editor signs back in.
  const saveAll = useCallback(async (/** @type {(done: number, total: number) => void} */ onProgress) => {
    const batch = changes;
    const saved = [];
    let authLost = false;
    for (let i = 0; i < batch.length; i++) {
      onProgress?.(i + 1, batch.length);
      try {
        if (await runWrite(batch[i].run)) saved.push(batch[i]);
      } catch (err) {
        if (err instanceof UnauthorizedError) { authLost = true; break; }
        throw err;
      }
    }
    const savedKeys = new Set(saved.map(c => c.key));
    setChanges(cs => cs.filter(c => !savedKeys.has(c.key)));
    if (saved.length) {
      try {
        await appendEditLog({
          user: getCurrentUser(),
          changes: saved.map(c => ({ section: c.section, action: c.action, title: c.title, fields: c.diff })),
        });
      } catch {
        toast.warning('השינויים נשמרו, אך הרישום ביומן העריכות נכשל.');
      }
      setVersion(v => v + 1);
    }
    return { saved: saved.length, failed: batch.length - saved.length, authLost };
  }, [changes]);

  const value = useMemo(
    () => ({ changes, version, stage, discard, clear, newKey, saveAll }),
    [changes, version, stage, discard, clear, newKey, saveAll]
  );
  return <PendingChangesContext.Provider value={value}>{children}</PendingChangesContext.Provider>;
}

export function usePendingChanges() {
  const ctx = useContext(PendingChangesContext);
  if (!ctx) throw new Error('usePendingChanges must be used inside <PendingChangesProvider>');
  return ctx;
}

// ─── Save-all bar + review dialog ───────────────────────────────────────────

const ACTION_LABELS = {
  create: { label: 'הוספה', color: 'bg-success/10 text-success' },
  update: { label: 'עריכה', color: 'bg-info/10 text-info' },
  delete: { label: 'מחיקה', color: 'bg-destructive/10 text-destructive' },
};

function ValueBox({ text, tone }) {
  const cls = tone === 'before'
    ? 'bg-destructive/5 border-destructive/20'
    : 'bg-success/10 border-success/40';
  return (
    <div className={`flex-1 min-w-0 rounded-lg border p-2 text-xs leading-relaxed whitespace-pre-wrap break-words max-h-48 overflow-y-auto ${cls}`}>
      {text || <span className="text-muted-foreground">(ריק)</span>}
    </div>
  );
}

function ChangeItem({ change, onDiscard, disabled }) {
  const action = ACTION_LABELS[change.action];
  return (
    <li className="rounded-xl border border-border bg-background p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${action.color}`}>{action.label}</span>
          <span className="font-medium text-sm text-foreground break-words">{change.title}</span>
        </div>
        <Button type="button" variant="quiet" size="none" disabled={disabled} onClick={onDiscard} className="gap-1 text-xs flex-shrink-0">
          <Undo2 className="w-3.5 h-3.5" /> ביטול השינוי
        </Button>
      </div>
      {change.action === 'delete' ? (
        <p className="text-xs text-destructive">הפריט יימחק מהאתר לצמיתות.</p>
      ) : (
        <div className="space-y-2">
          {change.diff.map(d => (
            <div key={d.label}>
              <p className="text-xs font-semibold text-muted-foreground mb-1">{d.label}</p>
              {change.action === 'create' ? (
                <ValueBox text={d.after} tone="after" />
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-muted-foreground mb-0.5">לפני</p>
                    <ValueBox text={d.before} tone="before" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-muted-foreground mb-0.5">אחרי</p>
                    <ValueBox text={d.after} tone="after" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </li>
  );
}

export function SaveAllBar() {
  const { changes, discard, saveAll } = usePendingChanges();
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [progress, setProgress] = useState(/** @type {null | { done: number, total: number }} */ (null));
  const saving = progress !== null;

  // Every time the dialog opens the editor confirms afresh.
  useEffect(() => { if (open) setChecked(false); }, [open]);
  // The last change discarded from inside the dialog leaves nothing to review.
  useEffect(() => { if (open && !changes.length && !saving) setOpen(false); }, [open, changes.length, saving]);

  if (!changes.length && !open) return null;

  const sections = [...new Set(changes.map(c => c.section))];

  async function handleSave() {
    setProgress({ done: 0, total: changes.length });
    let result;
    try {
      result = await saveAll((done, total) => setProgress({ done, total }));
    } finally {
      setProgress(null);
    }
    if (result.authLost) {
      toast.error('פג תוקף ההתחברות. התחברו מחדש - השינויים שלא נשמרו עדיין ממתינים.');
      setOpen(false);
      return;
    }
    if (result.failed === 0) {
      toast.success(result.saved === 1 ? 'השינוי נשמר ומופיע באתר' : `${result.saved} שינויים נשמרו ומופיעים באתר`);
      setOpen(false);
    } else {
      toast.error(`${result.saved} שינויים נשמרו, ${result.failed} נכשלו ונשארו ברשימה`);
    }
  }

  return (
    <>
      {changes.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-warning/40 bg-card shadow-card">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-foreground">
              <span className="font-semibold">{changes.length === 1 ? 'שינוי אחד ממתין לשמירה' : `${changes.length} שינויים ממתינים לשמירה`}</span>
              <span className="text-muted-foreground"> · עדיין לא מופיעים באתר</span>
            </p>
            <Button type="button" variant="solid" size="xs" onClick={() => setOpen(true)} className="gap-1.5 rounded-lg font-semibold">
              <Save className="w-3.5 h-3.5" /> סקירה ושמירה
            </Button>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={v => { if (!saving) setOpen(v); }}>
        <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto text-start">
          <DialogHeader className="text-start sm:text-start ps-8">
            <DialogTitle className="font-heading">סקירת שינויים לפני שמירה</DialogTitle>
            <DialogDescription>
              {changes.length === 1 ? 'שינוי אחד' : `${changes.length} שינויים`} ב{sections.length === 1 ? sections[0] : `-${sections.length} עמודים`}.
            </DialogDescription>
          </DialogHeader>

          <div role="alert" className="flex gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              <span className="font-semibold">השמירה סופית ואין אפשרות לבטל אותה.</span>{' '}
              השינויים יופיעו באתר מיד, והמערכת לא שומרת את הנוסח הקודם. עברו על כל שינוי ובדקו שהוא נכון לפני השמירה.
            </p>
          </div>

          <div className="space-y-4">
            {sections.map(section => (
              <section key={section}>
                <h3 className="text-sm font-semibold text-foreground mb-2">{section}</h3>
                <ul className="space-y-2">
                  {changes.filter(c => c.section === section).map(c => (
                    <ChangeItem key={c.key} change={c} disabled={saving} onDiscard={() => discard(c.key)} />
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <label className="flex items-start gap-2 text-sm text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={checked}
              disabled={saving}
              onChange={e => setChecked(e.target.checked)}
              className="mt-1"
            />
            עברתי על כל השינויים ואני מאשר/ת שהם נכונים. ידוע לי שלא ניתן לבטל אותם אחרי השמירה.
          </label>

          <div className="flex gap-2 flex-wrap">
            <Button
              type="button"
              variant="solid"
              size="xs"
              disabled={!checked || saving}
              onClick={handleSave}
              className="gap-1.5 rounded-lg font-semibold"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? `שומר ${progress.done} מתוך ${progress.total}...` : 'שמירה סופית'}
            </Button>
            <Button
              type="button"
              variant="subtle"
              size="xs"
              disabled={saving}
              onClick={() => setOpen(false)}
              className="rounded-lg font-semibold hover:bg-border"
            >
              חזרה לעריכה
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
