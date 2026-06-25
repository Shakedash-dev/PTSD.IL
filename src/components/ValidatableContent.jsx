import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, AlertCircle, HelpCircle, X } from 'lucide-react';
import { useValidation } from '@/contexts/ValidationContext';

const STATUS_CFG = {
  unvalidated: {
    outline: '2px solid rgba(239,68,68,0.7)',
    badge: 'bg-red-500 text-white',
    label: 'לא מאומת',
    Icon: HelpCircle,
    alwaysVisible: true,
  },
  validated: {
    outline: '2px solid rgba(34,197,94,0.5)',
    badge: 'bg-green-500 text-white',
    label: 'מאומת',
    Icon: CheckCircle,
    alwaysVisible: false,
  },
  invalid: {
    outline: '2px solid rgba(185,28,28,0.9)',
    badge: 'bg-red-700 text-white',
    label: 'לא תקין',
    Icon: XCircle,
    alwaysVisible: true,
  },
  needs_fix: {
    outline: '2px solid rgba(249,115,22,0.8)',
    badge: 'bg-orange-500 text-white',
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
        className="bg-white border border-zinc-200 rounded-xl shadow-2xl p-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <p className="text-[10px] text-zinc-400 font-mono leading-tight mb-0.5 truncate">{contentId}</p>
            {label && <p className="font-semibold text-sm text-zinc-800 leading-snug">{label}</p>}
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 flex-shrink-0 mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status badge */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-3 text-sm font-medium ${
          status === 'validated' ? 'bg-green-50 text-green-700' :
          status === 'invalid'   ? 'bg-red-50 text-red-700' :
          status === 'needs_fix' ? 'bg-orange-50 text-orange-700' :
          'bg-zinc-100 text-zinc-600'
        }`}>
          <cfg.Icon className="w-4 h-4 flex-shrink-0" />
          <span>{cfg.label}</span>
        </div>

        {/* Suggest-fix form */}
        {mode === 'suggest_fix' && (
          <div className="mb-3">
            <textarea
              className="w-full text-sm border border-zinc-200 rounded-lg p-2 resize-none bg-white text-zinc-900"
              rows={3}
              placeholder="תיאור התיקון המוצע..."
              value={suggestion}
              onChange={e => setSuggestion(e.target.value)}
              dir="rtl"
              autoFocus
            />
            <div className="flex gap-2 mt-1.5">
              <button
                className="flex-1 px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                onClick={() => { updateValidation(contentId, 'needs_fix', suggestion); onClose(); }}
              >
                שמור הצעה
              </button>
              <button
                className="px-3 py-2 bg-zinc-100 text-zinc-600 rounded-lg text-sm hover:bg-zinc-200 transition-colors"
                onClick={() => setMode(null)}
              >
                ביטול
              </button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {mode !== 'suggest_fix' && (
          <div className="flex flex-col gap-1.5">
            <button
              className="w-full px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors text-right"
              onClick={() => { updateValidation(contentId, 'validated'); onClose(); }}
            >
              ✓ אמת תוכן
            </button>
            <button
              className="w-full px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors text-right"
              onClick={() => setMode('suggest_fix')}
            >
              ✎ הצע תיקון
            </button>
            <button
              className="w-full px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors text-right"
              onClick={() => { updateValidation(contentId, 'invalid'); onClose(); }}
            >
              ✗ סמן כלא תקין
            </button>
            {status !== 'unvalidated' && (
              <button
                className="w-full px-3 py-2 bg-zinc-100 text-zinc-600 rounded-lg text-sm hover:bg-zinc-200 transition-colors text-right"
                onClick={() => { resetValidation(contentId); onClose(); }}
              >
                ↺ אפס סטטוס
              </button>
            )}
          </div>
        )}

        {/* Stored suggestion display */}
        {status === 'needs_fix' && entry?.suggestion && mode !== 'suggest_fix' && (
          <div className="mt-3 p-2.5 bg-orange-50 rounded-lg text-xs text-orange-800 leading-relaxed" dir="rtl">
            <span className="font-bold">הצעת תיקון: </span>{entry.suggestion}
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
      <button
        ref={badgeRef}
        onClick={handleBadgeClick}
        className={`absolute top-0 right-0 z-50 p-0.5 rounded-bl-md ${cfg.badge} transition-opacity
          ${cfg.alwaysVisible ? 'opacity-80 hover:opacity-100' : 'opacity-0 group-hover/v:opacity-100'}`}
        title={`${cfg.label} (${contentId})`}
        style={{ fontSize: 0 }}
      >
        <Icon className="w-3.5 h-3.5" />
      </button>

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
