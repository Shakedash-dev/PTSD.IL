import React, { useState } from 'react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { login } from '@/lib/auth';
import { Lock, Mail, Loader2 } from 'lucide-react';

// Admin login page. Rendered by the /admin route guard (App.jsx) whenever the
// visitor is not authenticated. On success, login() stores the token and
// fires AUTH_CHANGE_EVENT - the guard picks that up and swaps in the panel
// (or the "no access" view) without a manual refresh, so this component does
// not need to navigate anywhere itself.
export default function AdminLogin() {
  const { lang } = useLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(false);
    try {
      await login(email, password);
      // No further action needed - AUTH_CHANGE_EVENT triggers the guard.
    } catch {
      // Never reveal whether the email or the password was wrong.
      setError(true);
    } finally {
      setLoading(false);
    }
  }

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

        <form
          onSubmit={handleSubmit}
          className="bg-card rounded-super border border-border p-6 shadow-card space-y-4"
        >
          <div>
            <label htmlFor="admin-email" className="text-xs font-semibold text-muted-foreground block mb-1.5">
              {t(lang, 'admin_email')}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full ps-9 pe-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
              />
            </div>
          </div>

          <div>
            <label htmlFor="admin-password" className="text-xs font-semibold text-muted-foreground block mb-1.5">
              {t(lang, 'admin_password')}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="admin-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full ps-9 pe-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {t(lang, 'admin_login_error')}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-natural disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? t(lang, 'admin_login_loading') : t(lang, 'admin_login_button')}
          </button>
        </form>
      </div>
    </div>
  );
}
