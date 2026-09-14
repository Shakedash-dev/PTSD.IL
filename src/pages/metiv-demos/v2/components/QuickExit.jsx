import React, { useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { QUICK_EXIT_URL } from '../lib';

// GOV.UK "Exit this page": a visible, calm (not red) button that replaces the
// current history entry with a neutral site, plus Shift pressed 3 times.

export function quickExit() {
  try {
    document.title = 'מזג אוויר';
    document.body.style.opacity = '0';
  } catch {
    // ignore
  }
  window.location.replace(QUICK_EXIT_URL);
}

/** Listens for Shift pressed 3 times within 5 seconds. */
export function useShiftTripleExit(enabled) {
  useEffect(() => {
    if (!enabled) return undefined;
    let count = 0;
    let timer;
    const onKey = (e) => {
      if (e.key !== 'Shift' || e.repeat) return;
      count += 1;
      clearTimeout(timer);
      timer = setTimeout(() => {
        count = 0;
      }, 5000);
      if (count >= 3) {
        count = 0;
        quickExit();
      }
    };
    window.addEventListener('keyup', onKey);
    return () => {
      window.removeEventListener('keyup', onKey);
      clearTimeout(timer);
    };
  }, [enabled]);
}

/** @param {{ className?: string, compact?: boolean }} props */
export default function QuickExitButton({ className, compact = false }) {
  return (
    <Button
      type="button"
      variant="subtle"
      size={compact ? 'xs' : 'sm'}
      radius="full"
      onClick={quickExit}
      className={cn('gap-1.5 font-semibold border border-border', className)}
      title="יציאה מהירה: אפשר גם ללחוץ 3 פעמים על Shift"
    >
      <LogOut aria-hidden="true" />
      יציאה מהירה
    </Button>
  );
}
