import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, AlertCircle, HelpCircle, X } from 'lucide-react';
import { useValidation } from '@/contexts/ValidationContext';
import { Button } from '@/components/ui/button';

const STATUS_CFG = {
  unvalidated: {
    outline: '2px solid hsl(var(--destructive) / 0.55)',
    badge: 'bg-destructive/80 text-destructive-foreground',
    label: 'לא מאומת',
    Icon: HelpCircle,
    alwaysVisible: true,
  },
  validated: {
    outline: '2px solid hsl(var(--success) / 0.5)',
    badge: 'bg-success text-success-foreground',
    label: 'מאומת',
    Icon: CheckCircle,
    alwaysVisible: false,
  },
  invalid: {
    outline: '2px solid hsl(var(--destructive) / 0.9)',
    badge: 'bg-destructive text-destructive-foreground',
    label: 'לא תקין',
    Icon: XCircle,
    alwaysVisible: true,
  },
  needs_fix: {
    outline: '2px solid hsl(var(--warning) / 0.8)',
    badge: 'bg-warning text-warning-foreground',
    label: 'דורש תיקון',
    Icon: AlertCircle,
    alwaysVisible: true,
  },
};

function ValidationDialog({ contentId, label, anchorRect, onClose }) {
  const { getStatus, getEntry, updateValidation, resetValidation } = useValidation();
  const [mode, setMode] = useState(null);
  const [suggestion, setSuggestion] = useState(getEntry(contentId)?.suggestion || '');
  const status = getStatus(contentId);
  const cfg = STATUS_CFG[status];
  const entry = getEntry(contentId);

  // Position below the badge, clamped to viewport
  const top = anchorRect
    ? Math.min(anchorRect.bottom + 6, window.innerHeight - 280)
    : window.innerHeight / 2 - 140;
  const left = anchorRect
    ? Math.max(8, Math.min(anchorRect.left - 260, window.innerWidth - 316))
    : window.innerWidth / 2 - 150;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div
        style={{ position: 'fixed', top, left, width: 300, zIndex: 9999 }}
        className="bg-card border border-border rounded-xl shadow-2xl p-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground font-mono leading-tight mb-0.5 truncate">{contentId}</p>
            {label && <p className="font-semibold text-sm text-foreground leading-snug">{label}</p>}
          </div>
          <Button variant="quiet" size="none" onClick={onClose} className="flex-shrink-0 mt-0.5">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Status badge */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-3 text-sm font-medium ${
          status === 'validated' ? 'bg-success/10 text-success' :
          status === 'invalid'   ? 'bg-destructive/10 text-destructive' :
          status === 'needs_fix' ? 'bg-warning/10 text-warning' :
          'bg-muted text-muted-foreground'
        }`}>
          <cfg.Icon className="w-4 h-4 flex-shrink-0" />
          <span>{cfg.label}</span>
        </div>

        {/* Suggest-fix form */}
        {mode === 'suggest_fix' && (
          <div className="mb-3">
            <textarea
              className="w-full text-sm border border-border rounded-lg p-2 resize-none bg-card text-foreground"
              rows={3}
              placeholder="תיאור התיקון המוצע..."
              value={suggestion}
              onChange={e => setSuggestion(e.target.value)}
              dir="rtl"
              autoFocus
            />
            <div className="flex gap-2 mt-1.5">
              <Button
                variant="warning"
                size="none"
                className="flex-1 px-3 py-2 rounded-lg text-sm"
                onClick={() => { updateValidation(contentId, 'needs_fix', suggestion); onClose(); }}
              >
                שמור הצעה
              </Button>
              <Button
                variant="subtle"
                size="none"
                className="px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-border"
                onClick={() => setMode(null)}
              >
                ביטול
              </Button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {mode !== 'suggest_fix' && (
          <div className="flex flex-col gap-1.5">
            <Button
              variant="success"
              size="none"
              className="w-full px-3 py-2 rounded-lg text-sm justify-end"
              onClick={() => { updateValidation(contentId, 'validated'); onClose(); }}
            >
              ✓ אמת תוכן
            </Button>
            <Button
              variant="warning"
              size="none"
              className="w-full px-3 py-2 rounded-lg text-sm justify-end"
              onClick={() => setMode('suggest_fix')}
            >
              ✎ הצע תיקון
            </Button>
            <Button
              variant="destructive"
              size="none"
              className="w-full px-3 py-2 rounded-lg text-sm justify-end"
              onClick={() => { updateValidation(contentId, 'invalid'); onClose(); }}
            >
              ✗ סמן כלא תקין
            </Button>
            {status !== 'unvalidated' && (
              <Button
                variant="subtle"
                size="none"
                className="w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-border justify-end"
                onClick={() => { resetValidation(contentId); onClose(); }}
              >
                ↺ אפס סטטוס
              </Button>
            )}
          </div>
        )}

        {/* Stored suggestion display */}
        {status === 'needs_fix' && entry?.suggestion && mode !== 'suggest_fix' && (
          <div className="mt-3 p-2.5 bg-warning/10 rounded-lg text-xs text-warning leading-relaxed" dir="rtl">
            <span className="font-semibold">הצעת תיקון: </span>{entry.suggestion}
          </div>
        )}
      </div>
    </>,
    document.body
  );
}

export default function ValidatableContent({ contentId, label, children, className = '' }) {
  const { isValidationMode, getStatus } = useValidation();
  const [open, setOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);
  const badgeRef = useRef(null);

  const handleBadgeClick = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    setAnchorRect(badgeRef.current?.getBoundingClientRect() || null);
    setOpen(true);
  }, []);

  if (!isValidationMode) return <>{children}</>;

  const status = getStatus(contentId);
  const cfg = STATUS_CFG[status];
  const Icon = cfg.Icon;

  return (
    <div
      className={`relative group/v ${className}`}
      style={{ outline: cfg.outline, outlineOffset: '2px', borderRadius: '4px' }}
    >
      {children}

      {/* Badge - always visible for unvalidated/invalid/needs_fix, hover-only for validated */}
      <Button
        ref={badgeRef}
        variant="ghost"
        size="none"
        onClick={handleBadgeClick}
        className={`absolute top-0 right-0 z-50 p-0.5 rounded-bl-md ${cfg.badge} transition-opacity
          ${cfg.alwaysVisible ? 'opacity-80 hover:opacity-100' : 'opacity-0 group-hover/v:opacity-100'}`}
        title={`${cfg.label} (${contentId})`}
        style={{ fontSize: 0 }}
      >
        <Icon className="w-3.5 h-3.5" />
      </Button>

      {open && (
        <ValidationDialog
          contentId={contentId}
          label={label}
          anchorRect={anchorRect}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
