import React, { useEffect, useRef, useState } from 'react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { loginWithGoogle } from '@/lib/auth';
import { Lock } from 'lucide-react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

// Loads the Google Identity Services script at most once per page, even if
// this component mounts more than once (StrictMode double-invoke, route
// re-entry, etc). Resolves once `window.google.accounts.id` is usable.
let gsiScriptPromise = null;
function loadGsiScript() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no_window'));
  if (window.google?.accounts?.id) return Promise.resolve();

  if (!gsiScriptPromise) {
    gsiScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${GSI_SCRIPT_SRC}"]`);
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('gsi_load_failed')));
        return;
      }

      const script = document.createElement('script');
      script.src = GSI_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('gsi_load_failed'));
      document.head.appendChild(script);
    });
  }

  return gsiScriptPromise;
}

// Admin login page. Rendered by the /admin route guard (App.jsx) whenever the
// visitor is not authenticated. Google-only SSO via Google Identity Services
// (GIS): the rendered button collects a Google idToken, which
// loginWithGoogle() exchanges for our own JWT. On success loginWithGoogle()
// stores the token and fires AUTH_CHANGE_EVENT - the guard picks that up and
// swaps in the panel (or the "no access" view) without a manual refresh, so
// this component does not need to navigate anywhere itself.
export default function AdminLogin() {
  const { lang } = useLang();
  const [error, setError] = useState(false);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    let cancelled = false;

    async function handleCredentialResponse(response) {
      setError(false);
      try {
        // response.credential is the Google idToken - never log it.
        await loginWithGoogle(response.credential);
        // No further action needed - AUTH_CHANGE_EVENT triggers the guard.
      } catch {
        setError(true);
      }
    }

    loadGsiScript()
      .then(() => {
        if (cancelled || !buttonRef.current) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text: 'signin_with',
        });
        // Optional One Tap prompt - best-effort, ignore if it can't display
        // (e.g. third-party cookies blocked).
        window.google.accounts.id.prompt();
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 pt-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <h1 className="font-heading font-bold text-2xl text-foreground">{t(lang, 'admin_login_title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t(lang, 'admin_login_subtitle')}</p>
        </div>

        <div className="bg-card rounded-super border border-border p-6 shadow-card space-y-4 flex flex-col items-center">
          {GOOGLE_CLIENT_ID ? (
            <div ref={buttonRef} />
          ) : (
            <p className="text-sm text-red-600 text-center" role="alert">
              {t(lang, 'admin_google_config_error')}
            </p>
          )}

          {error && GOOGLE_CLIENT_ID && (
            <p className="text-sm text-red-600" role="alert">
              {t(lang, 'admin_google_signin_error')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
