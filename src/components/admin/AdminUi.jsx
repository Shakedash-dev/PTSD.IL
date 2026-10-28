import React from 'react';
import { Plus, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Small pieces every /admin panel shares (src/pages/Admin.jsx and the Metiv
// sections in MetivAdmin.jsx): count headings, status badges, icon controls.

export function LoadingRow() {
  return <p className="text-sm text-muted-foreground py-6 text-center">טוען...</p>;
}

export function Badge({ children, color = 'bg-muted text-muted-foreground' }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {children}
    </span>
  );
}

export function Section({ title, count }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="font-heading font-semibold text-lg text-foreground">{title}</h2>
      <Badge color="bg-primary/10 text-primary">{count} פריטים</Badge>
    </div>
  );
}

/**
 * @param {Object} props
 * @param {React.ComponentType<{className?: string}>} props.icon
 * @param {() => void} props.onClick
 * @param {string} props.title
 * @param {'danger'} [props.tone]
 * @param {boolean} [props.disabled]
 */
export function IconBtn({ icon: Icon, onClick, title, tone, disabled }) {
  return (
    <Button
      type="button"
      variant="outline-subtle"
      size="none"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`p-1.5 rounded-lg bg-card text-muted-foreground disabled:opacity-30 ${
        tone === 'danger'
          ? 'hover:text-destructive hover:border-destructive/30'
          : 'hover:text-primary hover:border-primary/30'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
    </Button>
  );
}

export function AddNewButton({ onClick, label }) {
  return (
    <Button
      type="button"
      variant="dashed"
      radius="xl"
      size="none"
      onClick={onClick}
      className="w-full gap-1.5 px-4 py-2.5 text-sm font-medium"
    >
      <Plus className="w-4 h-4" /> {label}
    </Button>
  );
}

// What a card shows while it carries a staged change.
export const STATUS_BADGES = {
  update: { label: 'נערך · ממתין לשמירה', color: 'bg-warning/20 text-foreground' },
  create: { label: 'חדש · ממתין לשמירה', color: 'bg-warning/20 text-foreground' },
  delete: { label: 'יימחק בשמירה', color: 'bg-destructive/10 text-destructive' },
};

export function DiscardButton({ onClick }) {
  return (
    <Button type="button" variant="quiet" size="none" onClick={onClick} className="gap-1 text-xs">
      <Undo2 className="w-3.5 h-3.5" /> ביטול השינוי
    </Button>
  );
}
