import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

// Open editors and data refreshes.
//
// Panels re-fetch after every save (this tab's background save, or "רענון
// התוכן" after another session's) without unmounting: lists and closed items
// show what the server holds now, and an open editor keeps its draft. When the
// item an open editor started from changed on the server in the meantime, the
// editor says so - saving the draft overwrites that newer version.

/** JSON equality, the default comparison. */
export const sameJson = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/**
 * Whether the server copy of an item changed while its editor was open.
 * `server` is the server's copy now, `shown` what the editor was showing (the
 * staged draft, or the server copy); both are captured when the editor opens
 * and again whenever `rebase` changes. A change to exactly what the editor
 * showed is this tab's own save landing, not news.
 * @param {boolean} open
 * @param {any} server
 * @param {any} shown
 * @param {{ same?: (a: any, b: any) => boolean, rebase?: any }} [opts]
 */
export function useChangedWhileOpen(open, server, shown, { same = sameJson, rebase } = {}) {
  const [base, setBase] = useState(/** @type {null | { server: any, shown: any }} */ (null));
  useEffect(() => {
    setBase(open ? { server, shown } : null);
    // Captured on opening (and on rebase) only, on purpose.
  }, [open, rebase]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!open || !base || server === undefined) return false;
  return !same(server, base.server) && !same(server, base.shown);
}

export function ServerChangedNote() {
  return (
    <p role="status" className="flex items-start gap-1.5 rounded-lg border border-warning/40 bg-warning/10 p-2 text-xs text-foreground">
      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" aria-hidden="true" />
      הפריט עודכן בינתיים - השמירה שלך תדרוס את הגרסה החדשה.
    </p>
  );
}
