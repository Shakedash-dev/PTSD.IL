import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Pill-shaped toggle used for filters and tab-like choices. Rights categories,
// Children age tabs and the questionnaire answer scale all hand-rolled the same
// selected/unselected pair; this makes the selected state a prop rather than a
// ternary repeated at each call site, and reports it as aria-pressed.
const choiceChipVariants = cva(
  'inline-flex items-center font-medium transition-natural',
  {
    variants: {
      size: {
        sm: 'gap-1.5 px-3 py-1.5 text-xs rounded-full',
        default: 'gap-2 px-4 py-2.5 text-sm rounded-full',
        // The questionnaire scale: a stacked score + label, not a pill.
        stacked: 'flex-col gap-1 p-2 rounded-lg text-center',
        // A full-width row in a vertical list of choices.
        list: 'w-full text-start px-4 py-3 rounded-lg text-sm leading-snug',
      },
      variant: {
        outline: 'border',
        plain: '',
      },
      selected: { true: '', false: '' },
    },
    compoundVariants: [
      { variant: 'outline', selected: true, class: 'bg-primary text-primary-foreground border-primary' },
      { variant: 'outline', selected: false, class: 'bg-card text-foreground border-border hover:bg-muted' },
      { variant: 'plain', selected: true, class: 'bg-primary text-primary-foreground font-semibold' },
      { variant: 'plain', selected: false, class: 'text-muted-foreground hover:bg-muted hover:text-foreground' },
    ],
    defaultVariants: { size: 'default', variant: 'outline', selected: false },
  }
);

export { choiceChipVariants };

/**
 * Accepts every native button attribute in addition to its own props.
 *
 * @param {{
 *   selected?: boolean,
 *   size?: 'sm'|'default'|'stacked'|'list',
 *   variant?: 'outline'|'plain',
 *   className?: string,
 *   children?: React.ReactNode,
 * } & React.ComponentPropsWithoutRef<'button'>} props
 */
export default function ChoiceChip({
  selected = false,
  size = 'default',
  variant = 'outline',
  className,
  children,
  ...props
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(choiceChipVariants({ size, variant, selected }), className)}
      {...props}
    >
      {children}
    </button>
  );
}
