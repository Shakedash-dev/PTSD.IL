import React, { useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// GOV.UK "Exit this page" pattern: a visible button that replaces the current
// history entry with a neutral page, plus Shift pressed three times in a row.
export const NEUTRAL_URL = 'https://www.google.com/search?q=weather';

export function exitNow() {
  try {
    window.location.replace(NEUTRAL_URL);
  } catch {
    /* jsdom or blocked navigation: nothing else to do */
  }
}

/** @param {{ className?: string, tone?: 'dark'|'light' }} props */
export default function QuickExit({ className, tone = 'dark' }) {
  useEffect(() => {
    let count = 0;
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    let timer;
    /** @param {KeyboardEvent} e */
    const onKey = (e) => {
      if (e.key !== 'Shift' || e.repeat) return;
      count += 1;
      clearTimeout(timer);
      timer = setTimeout(() => { count = 0; }, 1500);
      if (count >= 3) exitNow();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(timer);
    };
  }, []);

  return (
    <Button
      type="button"
      variant={tone === 'dark' ? 'pill-light' : 'outline-subtle'}
      size="xs"
      radius="full"
      onClick={exitNow}
      title="יציאה מהירה לאתר אחר. אפשר גם ללחוץ 3 פעמים על Shift"
      className={cn('gap-1.5 font-semibold', className)}
    >
      <LogOut aria-hidden="true" className="w-3.5 h-3.5 rtl:-scale-x-100" />
      יציאה מהירה
      <span className="sr-only">. אפשר גם ללחוץ 3 פעמים על מקש Shift</span>
    </Button>
  );
}
