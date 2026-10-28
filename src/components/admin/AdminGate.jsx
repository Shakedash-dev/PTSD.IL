import React, { useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import Admin from '@/pages/Admin';
import AdminLogin from '@/pages/AdminLogin';
import AdminShell from '@/components/admin/AdminShell';
import { PendingChangesProvider, usePendingChanges } from '@/components/admin/PendingChanges';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  isAuthenticated, hasAdminAccess, hasUserManagementAccess, inDevTokenSession, inReadOnlyPreview, loginWithToken, AUTH_CHANGE_EVENT,
} from '@/lib/auth';
import { ADMIN_PREVIEW } from '@/lib/adminPreview';
import { t } from '@/lib/i18n';

// Route guard for /admin: not authenticated -> login page; authenticated but
// without admin/moderator role AND without masteradmin role -> a short "no
// access" message (logout is in the header); otherwise the panel. A pure
// masteradmin (no admin/moderator) must still get in - Admin.jsx itself decides
// which sections that user actually sees. Listens for AUTH_CHANGE_EVENT (fired
// by src/lib/auth.js on login/logout, and by src/api/adminClient.js on a 401)
// so the view updates reactively without a manual refresh.
//
// /admin is routed outside <Layout>: AdminShell is its whole frame (wordmark +
// logout, nothing from the public site). PendingChangesProvider wraps the login
// screen too, so a session that expires mid-edit keeps its staged changes for
// after the editor signs back in.
//
// `variant` picks the content the panel edits: 'ptsd' (/admin) or 'metiv'
// (/metiv-site-demo-v3/admin - the Metiv v3 content plus the PTSD-IL panels,
// see src/components/admin/MetivAdmin.jsx). Same origin, so Google sign-in and
// the session work on either path.
//
// Dev server: the panel opens without signing in, read-only, on the LIVE data
// (src/api/adminLiveRead.js). "התחברות עם טוקן" takes an admin JWT copied from
// the signed-in deployed admin and switches to the normal signed-in mode against
// the live API - saves then change the live site, which the red banner says.
// Only ever reachable on a dev server - see src/lib/adminPreview.js for why
// none of this exists in a production build.
function TokenDialog({ open, onOpenChange }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  function submit() {
    try {
      loginWithToken(value);
      setValue('');
      setError('');
      onOpenChange(false);
    } catch (err) {
      setError(err?.message || 'הטוקן לא התקבל');
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="text-start">
        <DialogHeader className="">
          <DialogTitle>התחברות עם טוקן</DialogTitle>
          <DialogDescription>
            בממשק הניהול באתר החי, אחרי התחברות: כלי המפתחים, Application, Session Storage, ולהעתיק את הערך של ptsd_admin_token.
            אחרי ההתחברות כל שמירה כאן משנה את האתר החי.
          </DialogDescription>
        </DialogHeader>
        <label htmlFor="dev-admin-token" className="text-xs font-semibold text-muted-foreground">הטוקן</label>
        <textarea
          id="dev-admin-token"
          dir="ltr"
          rows={4}
          value={value}
          onChange={e => setValue(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs font-mono text-foreground break-all"
        />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button type="button" variant="destructive" size="xs" onClick={submit} disabled={!value.trim()}>התחברות למסד החי</Button>
          <Button type="button" variant="subtle" size="xs" onClick={() => onOpenChange(false)}>ביטול</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AdminPreviewBanner() {
  const [open, setOpen] = useState(false);
  return (
    <div role="status" className="bg-warning text-warning-foreground text-sm font-semibold py-1.5 px-4 flex items-center justify-center gap-3 flex-wrap text-center">
      <span>מצב פיתוח · התוכן האמיתי מהאתר החי, לקריאה בלבד · שמירה ומחיקה מושבתות</span>
      <Button type="button" variant="pill-light" size="xs" onClick={() => setOpen(true)} className="gap-1.5">
        <KeyRound className="w-3.5 h-3.5" /> התחברות עם טוקן
      </Button>
      <TokenDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

function AdminLiveTokenBanner() {
  return (
    <div role="alert" className="bg-destructive text-destructive-foreground text-center text-sm font-semibold py-1.5 px-4">
      מצב פיתוח, מחובר/ת עם טוקן למסד החי · כל שמירה משנה את האתר החי
    </div>
  );
}

// Changes staged in the read-only view carry stand-in translations; they must
// never reach the live API once a token is pasted, so switching mode drops them.
/** @param {{ mode: string }} props */
function DropStagedOnModeChange({ mode }) {
  const { clear } = usePendingChanges();
  const [seen, setSeen] = useState(mode);
  useEffect(() => {
    if (mode === seen) return;
    setSeen(mode);
    clear();
  }, [mode, seen, clear]);
  return null;
}

/** @param {{ variant?: 'ptsd'|'metiv' }} props */
export default function AdminGate({ variant = 'ptsd' }) {
  const [authed, setAuthed] = useState(() => isAuthenticated());
  const [allowed, setAllowed] = useState(() => hasAdminAccess() || hasUserManagementAccess());
  const [preview, setPreview] = useState(() => ADMIN_PREVIEW && inReadOnlyPreview());
  const [devToken, setDevToken] = useState(() => ADMIN_PREVIEW && inDevTokenSession());

  useEffect(() => {
    function sync() {
      setAuthed(isAuthenticated());
      setAllowed(hasAdminAccess() || hasUserManagementAccess());
      if (ADMIN_PREVIEW) {
        setPreview(inReadOnlyPreview());
        setDevToken(inDevTokenSession());
      }
    }
    window.addEventListener(AUTH_CHANGE_EVENT, sync);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, sync);
  }, []);

  let body;
  if (preview || (authed && allowed)) {
    // Keyed on the mode, so switching to (or out of) the token session reloads
    // every panel from the API it now talks to.
    body = <Admin key={preview ? 'preview' : 'session'} variant={variant} />;
  } else if (!authed) {
    body = <AdminLogin />;
  } else {
    body = (
      <div className="flex items-center justify-center py-24 px-4">
        <p className="text-foreground font-medium text-center max-w-sm">{t('he', 'admin_no_access')}</p>
      </div>
    );
  }

  let banner = null;
  if (ADMIN_PREVIEW && preview) banner = <AdminPreviewBanner />;
  else if (ADMIN_PREVIEW && devToken) banner = <AdminLiveTokenBanner />;

  return (
    <PendingChangesProvider>
      {ADMIN_PREVIEW && <DropStagedOnModeChange mode={preview ? 'preview' : 'session'} />}
      <AdminShell variant={variant} signedIn={preview || authed} banner={banner}>
        {body}
      </AdminShell>
    </PendingChangesProvider>
  );
}
