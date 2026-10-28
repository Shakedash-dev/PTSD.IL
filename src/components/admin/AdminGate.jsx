import React, { useEffect, useState } from 'react';
import Admin from '@/pages/Admin';
import AdminLogin from '@/pages/AdminLogin';
import AdminShell from '@/components/admin/AdminShell';
import { PendingChangesProvider } from '@/components/admin/PendingChanges';
import { isAuthenticated, hasAdminAccess, hasUserManagementAccess, AUTH_CHANGE_EVENT } from '@/lib/auth';
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
// Local design preview: the panel opens without signing in, backed by sample
// data, with every write disabled. Only ever reachable on a dev server - see
// src/lib/adminPreview.js for why it cannot exist in a production build.
function AdminPreviewBanner() {
  return (
    <div
      role="status"
      className="bg-warning text-warning-foreground text-center text-sm font-semibold py-1.5 px-4"
    >
      תצוגה מקדימה לעיצוב · נתוני דוגמה, לא המסד האמיתי · שמירה ומחיקה מושבתות
    </div>
  );
}

/** @param {{ variant?: 'ptsd'|'metiv' }} props */
export default function AdminGate({ variant = 'ptsd' }) {
  const [authed, setAuthed] = useState(() => isAuthenticated());
  const [allowed, setAllowed] = useState(() => hasAdminAccess() || hasUserManagementAccess());

  useEffect(() => {
    function sync() {
      setAuthed(isAuthenticated());
      setAllowed(hasAdminAccess() || hasUserManagementAccess());
    }
    window.addEventListener(AUTH_CHANGE_EVENT, sync);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, sync);
  }, []);

  let body;
  if (ADMIN_PREVIEW || (authed && allowed)) {
    body = <Admin variant={variant} />;
  } else if (!authed) {
    body = <AdminLogin />;
  } else {
    body = (
      <div className="flex items-center justify-center py-24 px-4">
        <p className="text-foreground font-medium text-center max-w-sm">{t('he', 'admin_no_access')}</p>
      </div>
    );
  }

  return (
    <PendingChangesProvider>
      <AdminShell variant={variant} signedIn={ADMIN_PREVIEW || authed} banner={ADMIN_PREVIEW ? <AdminPreviewBanner /> : null}>
        {body}
      </AdminShell>
    </PendingChangesProvider>
  );
}
