import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Languages, RotateCw, Save, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ForbiddenError, UnauthorizedError } from '@/api/adminClient';
import { ChatbotSyncError, reindexItem } from '@/api/reindex';
import { collectReindexes } from '@/api/reindexQueue';
import { createSaveStatus, patchSaveStatus, pruneSaveStatuses } from '@/api/adminStatus';
import { LANG_BY_ID } from '@/api/adminTranslate';
import { appendEditLog } from '@/api/adminSource';
import { getCurrentUser, inReadOnlyPreview } from '@/lib/auth';
import { ADMIN_PREVIEW } from '@/lib/adminPreview';
import { createLimiter } from '@/lib/concurrency';
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
//
// A Hebrew edit of article-backed content also stages one change per other
// language (src/components/admin/translationStaging.js): the AI translation of
// the sibling row, or its deletion. Those carry
//   linkedTo     the Hebrew change's key - discarding it discards them too, and
//                they are skipped when it fails to save
//   lang         the sibling's language
//   translation  { state: 'pending'|'done'|'error', status?, notes?, error?,
//                humanEdited? } - nothing can be saved while one is pending; a
//                failed one stays staged with a retry and does not block the rest
//   retranslate  false once the editor unticks "translate again" on a language
//                edited by hand; the change is then dropped instead of written
//   retry        () => void, re-runs a failed translation
//   rev          which staging round a translation answers (stale ones are ignored)

/**
 * @typedef {{ label: string, before: string, after: string }} FieldDiff
 * @typedef {{ state: 'pending'|'done'|'error', status?: 'pass'|'fixed'|'flagged', notes?: string[], error?: string, humanEdited?: boolean }} TranslationState
 * @typedef {{ key: string, scope: string, section: string, action: 'create'|'update'|'delete', itemId?: string, title: string, draft?: any, diff: FieldDiff[], run: () => Promise<any>, linkedTo?: string, lang?: string, translation?: TranslationState, retranslate?: boolean, retry?: () => void, rev?: number }} PendingChange
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
    case 'apps':
      return (value || [])
        .map(a => [a.title, a.description, a.ios_url, a.android_url].filter(Boolean).join('\n'))
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
    case 'apps':
      return (value || []).map(a => [a.title || '', a.description || '', a.ios_url || '', a.android_url || '']);
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

// A batch writes this many changes at once. The order that matters is kept:
// a change linked to a Hebrew one (its translations, which need the new row's
// groupId, and its sibling deletes) starts only after that one landed, and
// deletes start only after every other write, so a delete never races a write
// to the same rows (a reorder of a list it is removed from).
const WRITE_CONCURRENCY = 4;
// Chatbot reindex calls after a batch; the worker is the slow side.
const REINDEX_CONCURRENCY = 3;
// The shared status row is PATCHed after every this many finished writes.
const STATUS_EVERY = 3;

/**
 * @typedef {{ change: PendingChange, error: string }} FailedWrite
 * @typedef {{
 *   phase: 'saving'|'done',
 *   done: number,
 *   total: number,
 *   saved: number,
 *   failed: FailedWrite[],
 *   unsaved: PendingChange[],
 *   authLost: boolean,
 *   untranslated: number,
 * }} SaveJob
 * @typedef {{ running: boolean, done: number, total: number, failedIds: string[], error?: string }} SyncState
 */

// One write of a batch. Unlike runWrite it reports instead of toasting - the
// progress strip lists what failed. UnauthorizedError is re-thrown so the batch
// stops. A ChatbotSyncError cannot happen inside a batch (its reindexes are
// queued, src/api/reindexQueue.js) and would still mean the content is saved.
async function attemptWrite(run) {
  try {
    await run();
    return { ok: true, error: '' };
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    if (err instanceof ChatbotSyncError) return { ok: true, error: '' };
    if (err instanceof ForbiddenError) return { ok: false, error: 'אין לך הרשאה לבצע פעולה זו' };
    return { ok: false, error: err?.message || 'אירעה שגיאה' };
  }
}

// Keeps the batch's shared status row (src/api/adminStatus.js) current, so
// other open admin sessions can say a save is running. Every request is
// chained, so PATCHes land in order, and every failure is swallowed: the row is
// advisory and never holds up or fails the content writes. Off in the dev
// server's read-only mode, where nothing can be written.
/** @param {PendingChange[]} batch */
function statusReporter(batch) {
  if (ADMIN_PREVIEW && inReadOnlyPreview()) return null;
  const startedAt = new Date().toISOString();
  const base = {
    user: getCurrentUser(),
    startedAt,
    total: batch.length,
    sections: [...new Set(batch.map(c => c.section))],
  };
  /** @type {Promise<string|null>} */
  let chain = createSaveStatus({ ...base, updatedAt: startedAt, done: 0, failed: 0 }).catch(() => null);
  chain.then(id => (id ? pruneSaveStatuses(id) : null)).catch(() => {});
  let reported = 0;
  const push = extra => {
    const content = { ...base, ...extra, updatedAt: new Date().toISOString() };
    chain = chain.then(async id => {
      if (id) await patchSaveStatus(id, content).catch(() => {});
      return id;
    });
    return chain;
  };
  return {
    /** @param {number} done @param {number} failed */
    progress(done, failed) {
      if (done - reported < STATUS_EVERY) return;
      reported = done;
      push({ done, failed });
    },
    /** @param {number} done @param {number} failed */
    finish(done, failed) {
      return push({ done, failed, finishedAt: new Date().toISOString() });
    },
  };
}

const PendingChangesContext = createContext(null);

export function PendingChangesProvider({ children }) {
  const [changes, setChanges] = useState(/** @type {PendingChange[]} */ ([]));
  // Bumped after a batch lands; panels list it as a reload dependency so they
  // re-fetch what the server now holds.
  const [version, setVersion] = useState(0);
  const counter = useRef(0);
  // The batch running now (or last), and the chatbot reindex queue after it.
  const [job, setJob] = useState(/** @type {SaveJob|null} */ (null));
  const [sync, setSync] = useState(/** @type {SyncState|null} */ (null));
  // The staged change objects the running batch is writing. Compared by
  // identity: an item edited again during the save is a new object under the
  // same key, which stays staged after the batch.
  const [running, setRunning] = useState(/** @type {Set<PendingChange>} */ (new Set()));
  const savingRef = useRef(false);
  const syncQueue = useRef(/** @type {{ limit: ReturnType<typeof createLimiter>|null, waiting: Set<string>, failed: Set<string> }} */ ({ limit: null, waiting: new Set(), failed: new Set() }));

  const stage = useCallback((/** @type {PendingChange} */ change) => {
    setChanges(cs => {
      const i = cs.findIndex(c => c.key === change.key);
      if (i === -1) return [...cs, change];
      const next = cs.slice();
      next[i] = change;
      return next;
    });
  }, []);

  // Discarding a change drops the translations and sibling deletes linked to it.
  const discard = useCallback((/** @type {string} */ key) => {
    setChanges(cs => cs.filter(c => c.key !== key && c.linkedTo !== key));
  }, []);

  // Rewrites one staged change in place (no-op if it is gone): `fn` returns
  // the new change, undefined to leave it, or null to drop it.
  const patch = useCallback((/** @type {string} */ key, /** @type {(c: PendingChange) => PendingChange|null|undefined} */ fn) => {
    setChanges(cs => cs.flatMap(c => {
      if (c.key !== key) return [c];
      const next = fn(c);
      return next === null ? [] : [next ?? c];
    }));
  }, []);

  const clear = useCallback(() => setChanges([]), []);

  const newKey = useCallback((/** @type {string} */ scope) => {
    counter.current += 1;
    return `${scope}:new:${counter.current}`;
  }, []);

  // Panels re-fetch from the server (another session saved).
  const refresh = useCallback(() => setVersion(v => v + 1), []);

  const saving = job?.phase === 'saving';
  const busy = saving || Boolean(sync?.running);

  // Closing or reloading the tab would silently drop staged work, or stop a
  // save (or its chatbot sync) half-way.
  useEffect(() => {
    if (!changes.length && !busy) return undefined;
    const warn = e => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [changes.length, busy]);

  // Queues chatbot reindexes. An id already waiting is not queued twice; a
  // failed one is kept for "retry chatbot sync". The content is saved either way.
  const enqueueSync = useCallback((/** @type {string[]} */ ids) => {
    const q = syncQueue.current;
    if (!q.limit) q.limit = createLimiter(REINDEX_CONCURRENCY);
    const fresh = [...new Set(ids)].filter(id => !q.waiting.has(id));
    if (!fresh.length) return Promise.resolve();
    for (const id of fresh) { q.waiting.add(id); q.failed.delete(id); }
    setSync(s => ({
      running: true,
      done: s?.running ? s.done : 0,
      total: (s?.running ? s.total : 0) + fresh.length,
      failedIds: [...q.failed],
      error: s?.error,
    }));
    const settle = (/** @type {string} */ id, /** @type {string|null} */ error) => {
      if (error !== null) q.failed.add(id);
      setSync(s => {
        const done = (s?.done ?? 0) + 1;
        const total = s?.total ?? done;
        return { running: done < total, done, total, failedIds: [...q.failed], error: error ?? s?.error };
      });
    };
    return Promise.all(fresh.map(id => q.limit(async () => {
      q.waiting.delete(id);
      try {
        await reindexItem(id);
        settle(id, null);
      } catch (err) {
        settle(id, err?.message || 'סנכרון הצ׳אטבוט נכשל');
      }
    }))).then(() => {});
  }, []);

  const retrySync = useCallback(() => {
    const ids = [...syncQueue.current.failed];
    if (!ids.length) return Promise.resolve();
    setSync(s => (s ? { ...s, error: undefined } : s));
    return enqueueSync(ids);
  }, [enqueueSync]);

  const dismissJob = useCallback(() => {
    if (!savingRef.current) setJob(null);
  }, []);

  // Writes `list` (normally every staged change) in the background: the
  // progress strip follows it, and the editor keeps navigating and staging new
  // edits, which are not part of it. Returns the batch's promise (resolved once
  // its chatbot sync is done too), or null when a batch is already running.
  //
  // A failed change stays staged (the strip says why and offers a retry); the
  // rest still go through, except the changes linked to a Hebrew change that
  // failed. A dead session stops the batch - the remaining changes stay staged
  // for after the editor signs back in. Translations that failed stay staged
  // (with their retry) and are not written; ones the editor declined are
  // dropped. The edit-log row is written after the last content write, then
  // the chatbot reindexes run, queued.
  const startSave = useCallback((/** @type {PendingChange[]} */ list) => {
    if (savingRef.current || !list.length) return null;
    savingRef.current = true;

    const declined = list.filter(c => c.retranslate === false);
    const left = list.filter(c => c.translation && c.translation.state !== 'done' && c.retranslate !== false);
    const batch = list.filter(c => !declined.includes(c) && !left.includes(c));
    const byKey = new Map(batch.map(c => [c.key, c]));
    /** @type {PendingChange[]} */
    const saved = [];
    /** @type {FailedWrite[]} */
    const failed = [];
    let done = 0;
    let authLost = false;

    setRunning(new Set(batch));
    setJob({ phase: 'saving', done: 0, total: batch.length, saved: 0, failed: [], unsaved: [], authLost: false, untranslated: left.length });
    const status = statusReporter(batch);
    const stopCollecting = collectReindexes();
    const limit = createLimiter(WRITE_CONCURRENCY);

    const finishOne = () => {
      done += 1;
      const d = done;
      const f = failed.length;
      setJob(j => (j ? { ...j, done: d, saved: saved.length, failed: failed.slice() } : j));
      status?.progress(d, f);
    };

    /** @type {Map<string, Promise<boolean>>} */
    const outcome = new Map();
    const write = (/** @type {PendingChange} */ c) => {
      if (!outcome.has(c.key)) outcome.set(c.key, (async () => {
        const parent = c.linkedTo ? byKey.get(c.linkedTo) : undefined;
        if (parent && !(await write(parent))) { finishOne(); return false; }
        const ok = await limit(async () => {
          if (authLost) return false;
          try {
            const r = await attemptWrite(c.run);
            if (r.ok) saved.push(c);
            else failed.push({ change: c, error: r.error });
            return r.ok;
          } catch (err) {
            if (err instanceof UnauthorizedError) { authLost = true; return false; }
            failed.push({ change: c, error: err?.message || 'אירעה שגיאה' });
            return false;
          }
        });
        finishOne();
        return ok;
      })());
      return outcome.get(c.key);
    };
    const isDelete = (/** @type {PendingChange} */ c) => c.action === 'delete' || byKey.get(c.linkedTo)?.action === 'delete';

    const run = (async () => {
      /** @type {string[]} */
      let reindexIds = [];
      try {
        await Promise.all(batch.filter(c => !isDelete(c)).map(write));
        await Promise.all(batch.filter(isDelete).map(write));
      } finally {
        reindexIds = stopCollecting();
      }
      const savedSet = new Set(saved);
      const declinedSet = new Set(declined);
      setChanges(cs => cs.filter(c => !savedSet.has(c) && !declinedSet.has(c)));
      if (saved.length) {
        try {
          await appendEditLog({
            user: getCurrentUser(),
            // In staged order, whatever order the concurrent writes landed in.
            changes: batch.filter(c => savedSet.has(c)).map(c => ({ section: c.section, action: c.action, title: c.title, lang: c.lang || 'he', fields: c.diff })),
          });
        } catch {
          toast.warning('השינויים נשמרו, אך הרישום ביומן העריכות נכשל.');
        }
      }
      await status?.finish(done, failed.length);
      if (saved.length) setVersion(v => v + 1);
      if (authLost) toast.error('פג תוקף ההתחברות. התחברו מחדש - השינויים שלא נשמרו עדיין ממתינים.');
      setJob({
        phase: 'done',
        done,
        total: batch.length,
        saved: saved.length,
        failed: failed.slice(),
        unsaved: batch.filter(c => !savedSet.has(c)),
        authLost,
        untranslated: left.length,
      });
      setRunning(new Set());
      savingRef.current = false;
      if (reindexIds.length) await enqueueSync(reindexIds);
    })();
    run.catch(() => {
      savingRef.current = false;
      setRunning(new Set());
      setJob(j => (j ? { ...j, phase: 'done' } : j));
    });
    return run;
  }, [enqueueSync]);

  const value = useMemo(
    () => ({ changes, version, stage, discard, patch, clear, newKey, refresh, startSave, job, sync, running, saving, retrySync, dismissJob }),
    [changes, version, stage, discard, patch, clear, newKey, refresh, startSave, job, sync, running, saving, retrySync, dismissJob]
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

// The result of an AI translation, as the review dialog and the panels show it.
export const TRANSLATION_BADGES = {
  pending: { label: 'מתרגם...', color: 'bg-info/10 text-info' },
  error: { label: 'התרגום נכשל', color: 'bg-destructive/10 text-destructive' },
  pass: { label: 'תרגום תקין', color: 'bg-success/10 text-success' },
  fixed: { label: 'תרגום תוקן בבדיקה', color: 'bg-info/10 text-info' },
  flagged: { label: 'תרגום דורש בדיקה', color: 'bg-warning/20 text-foreground' },
};

/** @param {{ change: PendingChange }} props */
function TranslationInfo({ change }) {
  const { patch } = usePendingChanges();
  const t = change.translation;
  if (!t) return null;
  const langLabel = LANG_BY_ID[change.lang]?.label || change.lang;
  if (t.state === 'pending') return <p className="text-xs text-muted-foreground">התרגום ל{langLabel} רץ ברקע...</p>;
  if (t.state === 'error') {
    return (
      <div className="flex items-start justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2">
        <p className="text-xs text-destructive break-words">
          <span className="font-semibold">{langLabel}: התרגום נכשל.</span> {t.error}
          <span className="block text-muted-foreground mt-0.5">אפשר לשמור את העברית בלי התרגום הזה, ולנסות שוב אחר כך.</span>
        </p>
        <Button type="button" variant="outline-subtle" size="xs" onClick={() => change.retry?.()} className="gap-1 rounded-lg flex-shrink-0">
          <RotateCw className="w-3.5 h-3.5" /> ניסיון חוזר
        </Button>
      </div>
    );
  }
  return (
    <>
      {t.status === 'flagged' && t.notes?.length > 0 && (
        <ul className="rounded-lg border border-warning/40 bg-warning/10 p-2 text-xs text-foreground list-disc ps-6 space-y-0.5">
          {t.notes.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      )}
      {t.humanEdited && (
        <label className="flex items-start gap-2 text-xs text-foreground cursor-pointer rounded-lg border border-warning/40 bg-warning/10 p-2">
          <input
            type="checkbox"
            checked={change.retranslate !== false}
            onChange={e => {
              const retranslate = e.target.checked;
              patch(change.key, c => ({ ...c, retranslate }));
            }}
            className="mt-0.5"
          />
          <span>
            <span className="font-semibold">{langLabel} נערך ידנית - לתרגם מחדש?</span>{' '}
            {change.retranslate === false ? 'התרגום לא יישמר והנוסח הידני יישאר.' : 'הנוסח הידני יוחלף בתרגום.'}
          </span>
        </label>
      )}
    </>
  );
}

// An AI translation of a language nobody edited by hand is saved with its
// Hebrew change but not listed in the review: the editor reviews Hebrew, and a
// translation only needs eyes when it would replace someone's own wording.
/** @param {PendingChange} c */
export const isAutoTranslation = c => !!c.translation && !c.translation.humanEdited;

/** One line under a Hebrew change: which languages it translates to, and any that need attention. */
function AutoTranslationsLine({ items }) {
  if (items.length === 0) return null;
  const name = c => LANG_BY_ID[c.lang]?.label || c.lang;
  const pending = items.filter(c => c.translation?.state === 'pending');
  const failed = items.filter(c => c.translation?.state === 'error');
  const flagged = items.filter(c => c.translation?.state === 'done' && c.translation.status === 'flagged');
  return (
    <div className="text-xs text-muted-foreground space-y-1">
      <p className="flex items-center gap-1">
        <Languages className="w-3 h-3" aria-hidden="true" />
        יתורגם אוטומטית ל: {items.map(name).join(', ')}
        {pending.length > 0 && ' (מתרגם...)'}
      </p>
      {flagged.length > 0 && (
        <p className="text-foreground">כדאי לבדוק אחרי השמירה את התרגום ל{flagged.map(name).join(', ')} - הבודק האוטומטי סימן אותו.</p>
      )}
      {failed.map(c => (
        <p key={c.key} className="flex items-center gap-2 text-destructive">
          התרגום ל{name(c)} נכשל ולא יישמר.
          {c.retry && (
            <Button type="button" variant="quiet" size="none" onClick={c.retry} className="text-xs underline">
              לנסות שוב
            </Button>
          )}
        </p>
      ))}
    </div>
  );
}

/** @param {{ change: PendingChange, onDiscard: () => void, disabled?: boolean, autoTranslations?: PendingChange[] }} props */
function ChangeItem({ change, onDiscard, disabled = false, autoTranslations = [] }) {
  const action = ACTION_LABELS[change.action];
  const t = change.translation;
  const badge = t && (t.state === 'done' ? t.status && TRANSLATION_BADGES[t.status] : TRANSLATION_BADGES[t.state]);
  const declined = change.retranslate === false;
  return (
    <li className={`rounded-xl border bg-background p-3 space-y-2 ${change.linkedTo ? 'ms-4 border-dashed border-border' : 'border-border'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${action.color}`}>{action.label}</span>
          {change.lang && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground">
              <Languages className="w-3 h-3" /> {LANG_BY_ID[change.lang]?.label || change.lang}
            </span>
          )}
          {badge && <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>{badge.label}</span>}
          <span className="font-medium text-sm text-foreground break-words">{change.title}</span>
        </div>
        <Button type="button" variant="quiet" size="none" disabled={disabled} onClick={onDiscard} className="gap-1 text-xs flex-shrink-0">
          <Undo2 className="w-3.5 h-3.5" /> ביטול השינוי
        </Button>
      </div>
      <TranslationInfo change={change} />
      <AutoTranslationsLine items={autoTranslations} />
      {change.action === 'delete' ? (
        <p className="text-xs text-destructive">הפריט יימחק מהאתר לצמיתות.</p>
      ) : t && t.state !== 'done' ? null : (
        <div className={`space-y-2 ${declined ? 'opacity-50' : ''}`}>
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

function barText(primary, linked) {
  if (primary === 0) return linked === 1 ? 'שינוי אחד בשפה אחרת ממתין לשמירה' : `${linked} שינויים בשפות אחרות ממתינים לשמירה`;
  return primary === 1 ? 'שינוי אחד ממתין לשמירה' : `${primary} שינויים ממתינים לשמירה`;
}

export function SaveAllBar() {
  const { changes: staged, running, saving, discard, startSave } = usePendingChanges();
  // Changes the running batch is writing are out of the editor's hands; the
  // bar and the review cover what is staged besides them.
  const changes = staged.filter(c => !running.has(c));
  const translating = changes.filter(c => c.translation?.state === 'pending').length;
  // Translations and sibling deletes ride along with the Hebrew change that
  // caused them, so the bar counts the editor's own changes.
  const linked = changes.filter(c => c.linkedTo).length;
  const primary = changes.length - linked;
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  // Every time the dialog opens the editor confirms afresh.
  useEffect(() => { if (open) setChecked(false); }, [open]);
  // The last change discarded from inside the dialog leaves nothing to review.
  useEffect(() => { if (open && !changes.length) setOpen(false); }, [open, changes.length]);

  if (!changes.length && !open) return null;

  // The review lists the editor's own changes and hand-edited languages; plain
  // AI translations show as one line under their Hebrew change. One whose
  // Hebrew change is no longer staged (it saved, the translation failed) is
  // listed on its own, or its retry would have nowhere to show.
  const stagedKeys = new Set(changes.map(c => c.key));
  const visible = changes.filter(c => !isAutoTranslation(c) || !c.linkedTo || !stagedKeys.has(c.linkedTo));
  const sections = [...new Set(visible.map(c => c.section))];

  // The save runs in the background (SaveProgressStrip follows it); the
  // dialog closes at once and the editor carries on.
  function handleSave() {
    startSave(changes);
    setOpen(false);
  }

  return (
    <>
      {changes.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-warning/40 bg-card shadow-card">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-foreground">
              <span className="font-semibold">{barText(primary, linked)}</span>
              {primary > 0 && linked > 0 && <span className="text-muted-foreground"> · ועוד {linked} בשפות אחרות</span>}
              <span className="text-muted-foreground"> · עדיין לא מופיעים באתר</span>
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {translating > 0 && (
                <span className="text-xs text-muted-foreground">מתרגם {translating === 1 ? 'שפה אחת' : `${translating} שפות`}...</span>
              )}
              <Button type="button" variant="solid" size="xs" onClick={() => setOpen(true)} className="gap-1.5 rounded-lg font-semibold">
                <Save className="w-3.5 h-3.5" /> סקירה ושמירה
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto text-start">
          <DialogHeader className="text-start sm:text-start ps-8">
            <DialogTitle className="font-heading">סקירת שינויים לפני שמירה</DialogTitle>
            <DialogDescription>
              {visible.length === 1 ? 'שינוי אחד' : `${visible.length} שינויים`} ב{sections.length === 1 ? sections[0] : `-${sections.length} עמודים`}.
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
                  {visible.filter(c => c.section === section).map(c => (
                    <ChangeItem
                      key={c.key}
                      change={c}
                      onDiscard={() => discard(c.key)}
                      autoTranslations={changes.filter(x => x.linkedTo === c.key && isAutoTranslation(x))}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <label className="flex items-start gap-2 text-sm text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={checked}
              onChange={e => setChecked(e.target.checked)}
              className="mt-1"
            />
            עברתי על כל השינויים ואני מאשר/ת שהם נכונים. ידוע לי שלא ניתן לבטל אותם אחרי השמירה.
          </label>

          {saving && (
            <p role="status" className="text-xs text-muted-foreground">
              שמירה קודמת עדיין רצה ברקע. אפשר לשמור את השינויים האלה כשהיא תסתיים.
            </p>
          )}

          <div className="flex gap-2 flex-wrap">
            <Button
              type="button"
              variant="solid"
              size="xs"
              disabled={!checked || saving || translating > 0}
              onClick={handleSave}
              className="gap-1.5 rounded-lg font-semibold"
            >
              <Save className="w-3.5 h-3.5" />
              {saving
                ? 'ממתין לסיום השמירה הקודמת...'
                : translating > 0 ? `ממתין לתרגומים (${translating})...` : 'שמירה סופית'}
            </Button>
            <Button
              type="button"
              variant="subtle"
              size="xs"
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
