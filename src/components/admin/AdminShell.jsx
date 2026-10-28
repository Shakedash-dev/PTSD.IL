import React, { useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BASE_PATH } from '@/base-path';
import { logout } from '@/lib/auth';
import { usePendingChanges } from '@/components/admin/PendingChanges';

// The /admin frame. /admin is routed outside the site <Layout>, so none of the
// public chrome (nav links, language switcher, footer, chatbot) appears here -
// just the wordmark and, once signed in, a logout button. The panel's own text
// is Hebrew, so the frame pins RTL regardless of the site language a visitor
// last picked; only content inputs follow the language being edited.
//
// The wordmark opens the public site in a new tab rather than navigating away:
// leaving /admin unmounts it, and staged changes would go with it.
export default function AdminShell({ children, signedIn = false, banner = null, variant = 'ptsd' }) {
  const { changes, clear } = usePendingChanges();
  const metiv = variant === 'metiv';

  useEffect(() => {
    const previous = document.title;
    document.title = metiv ? 'ממשק ניהול | מטיב' : 'ממשק ניהול | PTSD.IL';
    return () => { document.title = previous; };
  }, [metiv]);

  function handleLogout() {
    if (changes.length && !window.confirm(`יש ${changes.length} שינויים שלא נשמרו. התנתקות תמחק אותם. להתנתק בכל זאת?`)) return;
    clear();
    logout();
  }

  return (
    <div dir="rtl" lang="he" className="min-h-screen flex flex-col bg-background">
      {banner}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between gap-4">
          <a href={metiv ? `${BASE_PATH}/metiv-site-demo-v3` : `${BASE_PATH}/`} target="_blank" rel="noopener noreferrer" className="flex items-center flex-shrink-0 group" title="פתיחת האתר בלשונית חדשה">
            {metiv ? (
              <span className="font-heading font-semibold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors duration-300">
                מטיב <span className="text-primary text-sm font-medium">· ממשק ניהול</span>
              </span>
            ) : (
              <span className="font-heading font-semibold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors duration-300">
                PTSD<span className="text-primary">.IL</span>
              </span>
            )}
          </a>
          {signedIn && (
            <Button
              type="button"
              variant="subtle"
              size="none"
              onClick={handleLogout}
              className="gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-border"
            >
              <LogOut className="w-3.5 h-3.5" /> התנתקות
            </Button>
          )}
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
