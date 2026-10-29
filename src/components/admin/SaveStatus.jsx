import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, RotateCw, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePendingChanges } from '@/components/admin/PendingChanges';
import { finishedAtMs, isOwnSaveStatus, isRunningStatus, loadSaveStatuses } from '@/api/adminStatus';
import { hasAdminAccess, inReadOnlyPreview } from '@/lib/auth';
import { ADMIN_PREVIEW } from '@/lib/adminPreview';

// The two save notices under the admin header (AdminShell):
//
// SaveProgressStrip - this tab's own "save all" batch, which runs in the
//   background (PendingChangesProvider.startSave): progress while it writes,
//   then the result - what failed, with a retry - and the chatbot reindex
//   queue after it, with a retry when that failed.
//
// OtherSavesBanner - batches of OTHER admin sessions, read from the shared
//   status rows (src/api/adminStatus.js): polled every POLL_MS and on window
//   focus, in both admin variants. A running batch shows while it runs; a
//   finished one for a short while, suggesting a refresh before editing. This
//   tab's own rows are skipped (its strip covers them), and so is the dev
//   server's read-only mode: the rows are unpublished, so the public endpoints
//   it reads through cannot see them.

export const POLL_MS = 15 * 1000;
// How long a batch that finished after this page opened stays announced.
export const JUST_FINISHED_MS = 2 * 60 * 1000;

const TONES = {
  info: 'border-info/30 bg-info/10',
  success: 'border-success/40 bg-success/10',
  warning: 'border-warning/40 bg-warning/10',
  danger: 'border-destructive/30 bg-destructive/10',
};

function Row({ tone, role = 'status', children }) {
  return (
    <div role={role} className={`border-t ${TONES[tone]}`}>
      <div className="max-w-5xl mx-auto px-5 sm:px-6 py-2 text-sm text-foreground">{children}</div>
    </div>
  );
}

function DismissButton({ onClick }) {
  return (
    <Button type="button" variant="quiet" size="none" onClick={onClick} title="סגירה" aria-label="סגירה" className="flex-shrink-0">
      <X className="w-4 h-4" />
    </Button>
  );
}

const plural = (n, one, many) => (n === 1 ? one : many.replace('{n}', String(n)));

export function SaveProgressStrip() {
  const { job, sync, changes, saving, startSave, retrySync, dismissJob } = usePendingChanges();
  const rows = [];

  if (job?.phase === 'saving') {
    rows.push(
      <Row key="job" tone="info">
        <p className="flex items-center gap-2 flex-wrap">
          <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" aria-hidden="true" />
          <span className="font-semibold">שומר {job.done} מתוך {job.total}...</span>
          <span className="text-muted-foreground">
            אפשר להמשיך לעבוד ולערוך בינתיים. סגירה או רענון של הלשונית יעצרו את השמירה.
          </span>
        </p>
      </Row>
    );
  } else if (job?.phase === 'done') {
    // What is still staged of the batch: a retry writes exactly those objects,
    // never an edit made to the same item since.
    const retryable = changes.filter(c => job.unsaved.includes(c));
    const skipped = job.unsaved.length - job.failed.length;
    if (job.authLost) {
      rows.push(
        <Row key="job" tone="danger" role="alert">
          <div className="flex items-start justify-between gap-2">
            <p>
              <span className="font-semibold">פג תוקף ההתחברות, והשמירה נעצרה.</span>{' '}
              {job.saved > 0 && `${plural(job.saved, 'שינוי אחד נשמר', '{n} שינויים נשמרו')}. `}
              השינויים שלא נשמרו עדיין ממתינים - התחברו מחדש ושמרו שוב.
            </p>
            <DismissButton onClick={dismissJob} />
          </div>
        </Row>
      );
    } else if (job.unsaved.length > 0) {
      rows.push(
        <Row key="job" tone="danger" role="alert">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <p className="font-semibold">
                {job.saved} שינויים נשמרו, {job.unsaved.length} לא נשמרו ונשארו ברשימה.
              </p>
              <ul className="text-xs space-y-0.5">
                {job.failed.map(f => (
                  <li key={f.change.key} className="break-words">
                    <span className="font-medium">{f.change.section} · {f.change.title}:</span> {f.error}
                  </li>
                ))}
                {skipped > 0 && (
                  <li className="text-muted-foreground">
                    {plural(skipped, 'שינוי אחד נוסף לא נשמר', 'עוד {n} שינויים לא נשמרו')} כי השינוי בעברית שהם תלויים בו נכשל.
                  </li>
                )}
              </ul>
              {retryable.length > 0 && (
                <Button
                  type="button"
                  variant="outline-subtle"
                  size="xs"
                  disabled={saving}
                  onClick={() => startSave(retryable)}
                  className="gap-1 rounded-lg"
                >
                  <RotateCw className="w-3.5 h-3.5" /> ניסיון חוזר
                </Button>
              )}
            </div>
            <DismissButton onClick={dismissJob} />
          </div>
        </Row>
      );
    } else {
      rows.push(
        <Row key="job" tone="success">
          <div className="flex items-start justify-between gap-2">
            <p className="flex items-center gap-2 flex-wrap">
              <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" aria-hidden="true" />
              <span className="font-semibold">
                {plural(job.saved, 'השינוי נשמר ומופיע באתר', '{n} שינויים נשמרו ומופיעים באתר')}
              </span>
              {job.untranslated > 0 && (
                <span className="text-muted-foreground">
                  · {plural(job.untranslated, 'תרגום שנכשל לא נשמר', '{n} תרגומים שנכשלו לא נשמרו')} ונשאר ברשימה לניסיון חוזר
                </span>
              )}
            </p>
            <DismissButton onClick={dismissJob} />
          </div>
        </Row>
      );
    }
  }

  if (sync?.running) {
    rows.push(
      <Row key="sync" tone="info">
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" aria-hidden="true" />
          מעדכן את הצ׳אטבוט {sync.done} מתוך {sync.total}... התוכן כבר נשמר.
        </p>
      </Row>
    );
  } else if (sync?.failedIds.length) {
    rows.push(
      <Row key="sync" tone="warning" role="alert">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="flex items-start gap-2 text-xs">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              <span className="font-semibold">
                התוכן נשמר, אך עדכון הצ׳אטבוט נכשל ל{plural(sync.failedIds.length, 'פריט אחד', '-{n} פריטים')}.
              </span>{' '}
              עד שיתעדכן, הצ׳אטבוט עלול לענות לפי הנוסח הקודם.
              {sync.error && <span className="block text-muted-foreground break-words">{sync.error}</span>}
            </span>
          </p>
          <Button type="button" variant="outline-subtle" size="xs" onClick={() => retrySync()} className="gap-1 rounded-lg flex-shrink-0">
            <RotateCw className="w-3.5 h-3.5" /> ניסיון חוזר לסנכרון הצ׳אטבוט
          </Button>
        </div>
      </Row>
    );
  }

  return rows.length ? <div data-testid="save-progress">{rows}</div> : null;
}

function who(user) {
  return user?.name || user?.email || 'עורך/ת אחר/ת';
}

function inSections(sections) {
  if (!sections.length) return '';
  return ` ב${sections.join(', ')}`;
}

/** @param {{ signedIn: boolean }} props */
export function OtherSavesBanner({ signedIn }) {
  const { refresh } = usePendingChanges();
  const enabled = signedIn && hasAdminAccess() && !(ADMIN_PREVIEW && inReadOnlyPreview());
  const [rows, setRows] = useState(/** @type {import('@/api/adminStatus').SaveStatusRow[]} */ ([]));
  const [now, setNow] = useState(() => Date.now());
  const [dismissed, setDismissed] = useState(() => new Set());
  // A batch that finished before this page opened is already in what it loaded.
  const openedAt = useRef(Date.now());

  useEffect(() => {
    if (!enabled) { setRows([]); return undefined; }
    let cancelled = false;
    const poll = () => {
      loadSaveStatuses()
        .then(r => { if (!cancelled) { setRows(r); setNow(Date.now()); } })
        .catch(() => {});
    };
    poll();
    const timer = setInterval(poll, POLL_MS);
    window.addEventListener('focus', poll);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener('focus', poll);
    };
  }, [enabled]);

  if (!enabled) return null;
  const others = rows.filter(r => !isOwnSaveStatus(r.id) && !dismissed.has(r.id));
  const active = others.filter(r => isRunningStatus(r, now));
  const finished = others.filter(r => {
    const at = finishedAtMs(r);
    return at > openedAt.current && now - at < JUST_FINISHED_MS;
  });
  if (!active.length && !finished.length) return null;

  const dismiss = id => setDismissed(d => new Set(d).add(id));

  return (
    <div data-testid="other-saves">
      {active.map(r => (
        <Row key={r.id} tone="info">
          <p className="flex items-center gap-2 flex-wrap">
            <Users className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>
              <span className="font-semibold">{who(r.user)}</span> שומר כרגע {r.total} שינויים{inSections(r.sections)} ({r.done}/{r.total})
            </span>
            <span className="text-muted-foreground">· כדאי לא לערוך את אותם פריטים עד שיסיים</span>
          </p>
        </Row>
      ))}
      {finished.map(r => (
        <Row key={r.id} tone="warning">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p>
              <span className="font-semibold">{who(r.user)}</span> סיים לשמור {r.total} שינויים{inSections(r.sections)}.{' '}
              עודכן לפני רגע - כדאי לרענן לפני עריכה.
            </p>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline-subtle"
                size="xs"
                onClick={() => { refresh(); dismiss(r.id); }}
                className="gap-1 rounded-lg"
              >
                <RotateCw className="w-3.5 h-3.5" /> רענון התוכן
              </Button>
              <DismissButton onClick={() => dismiss(r.id)} />
            </div>
          </div>
        </Row>
      ))}
    </div>
  );
}
