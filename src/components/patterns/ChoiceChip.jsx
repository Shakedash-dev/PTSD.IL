import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Pill-shaped toggle used for filters and tab-like choices. Rights categories,
// Children age tabs and the questionnaire answer scale all hand-rolled the same
// selected/unselected pair; this makes the selected state a prop rather than a
// ternary repeated at each call site, and reports it as aria-pressed.
const choiceChipVariants = cva(
  'inline-flex items-center font-medium transition-natural border',
  {
    variants: {
      size: {
        sm: 'gap-1.5 px-3 py-1.5 text-xs rounded-full',
        default: 'gap-2 px-4 py-2.5 text-sm rounded-full',
        // The questionnaire scale: a stacked score + label, not a pill.
        stacked: 'flex-col gap-1 p-2 rounded-lg text-center',
      },
      selected: {
        true: 'bg-primary text-primary-foreground border-primary',
        false: 'bg-card text-foreground border-border hover:bg-muted',
      },
    },
    defaultVariants: { size: 'default', selected: false },
  }
);

export { choiceChipVariants };

/**
 * @param {Object} props
 * @param {boolean} [props.selected]
 * @param {'sm'|'default'|'stacked'} [props.size]
 * @param {string} [props.className]
 * @param {React.ReactNode} [props.children]
 */
export default function ChoiceChip({
  selected = false,
  size = 'default',
  className,
  children,
  ...props
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(choiceChipVariants({ size, selected }), className)}
      {...props}
    >
      {children}
    </button>
  );
}
