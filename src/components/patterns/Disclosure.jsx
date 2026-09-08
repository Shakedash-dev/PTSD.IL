import React, { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Expand/collapse section. Six pages hand-rolled this same trigger-plus-panel
// with slightly different padding and border treatments, and only some of them
// set aria-expanded. This owns the markup, the state and the accessibility so
// every accordion on the site behaves the same way.

const wrapperVariants = cva('transition-natural overflow-hidden', {
  variants: {
    variant: {
      // Heavy border that turns primary when open. Rights, SecondCircleTools.
      outlined: 'border-2 rounded-2xl',
      // Hairline border, subtle hover. SelfHelp, PTSDInfo.
      soft: 'border rounded-2xl',
      // No chrome of its own; the caller supplies it. Treatment.
      plain: 'rounded-2xl border',
    },
  },
  defaultVariants: { variant: 'soft' },
});

const wrapperStateVariants = {
  outlined: {
    open: 'bg-card border-primary shadow-card-hover',
    closed: 'bg-card border-border hover:border-primary/40',
  },
  soft: {
    open: 'bg-card border-primary/40',
    closed: 'bg-card border-border hover:bg-muted',
  },
  plain: {
    open: 'bg-card border-primary/40',
    closed: 'bg-muted/40 border-transparent hover:bg-muted',
  },
};

const triggerVariants = cva(
  'w-full text-start flex items-center transition-natural',
  {
    variants: {
      size: {
        tight: 'px-4 py-3 gap-3',
        compact: 'px-5 py-4 gap-3',
        default: 'px-6 py-5 gap-4',
      },
      justify: {
        between: 'justify-between',
        start: '',
      },
    },
    defaultVariants: { size: 'default', justify: 'between' },
  }
);

const panelVariants = cva('', {
  variants: {
    size: {
      tight: 'px-4 pb-3',
      compact: 'px-5 pt-4 pb-5',
      default: 'px-6 pt-5 pb-6',
    },
  },
  defaultVariants: { size: 'default' },
});

export { wrapperVariants, triggerVariants, panelVariants };

/**
 * @param {Object} props
 * @param {React.ReactNode} props.label content of the trigger
 * @param {React.ReactNode} [props.leading] rendered before the label (an icon, an avatar)
 * @param {'outlined'|'soft'|'plain'} [props.variant]
 * @param {'tight'|'compact'|'default'} [props.size]
 * @param {boolean} [props.open] controlled state; omit for uncontrolled
 * @param {(open: boolean) => void} [props.onOpenChange]
 * @param {boolean} [props.defaultOpen]
 * @param {boolean} [props.tintTriggerWhenOpen] highlight the trigger row while open
 * @param {string} [props.className] wrapper override
 * @param {string} [props.triggerClassName]
 * @param {string} [props.labelClassName]
 * @param {string} [props.panelClassName]
 * @param {string} [props.chevronClassName]
 * @param {React.ReactNode} [props.children] panel content
 */
export default function Disclosure({
  label,
  leading,
  variant = 'soft',
  size = 'default',
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
  tintTriggerWhenOpen = false,
  className,
  triggerClassName,
  labelClassName,
  panelClassName,
  chevronClassName,
  children,
}) {
  const panelId = useId();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  function toggle() {
    const next = !open;
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  }

  const state = wrapperStateVariants[variant] || wrapperStateVariants.soft;

  return (
    <div className={cn(wrapperVariants({ variant }), open ? state.open : state.closed, className)}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          triggerVariants({ size, justify: leading ? 'start' : 'between' }),
          tintTriggerWhenOpen && open && 'bg-primary/15',
          triggerClassName
        )}
      >
        {leading}
        <span className={cn('font-heading font-semibold text-foreground leading-snug', leading && 'flex-1', labelClassName)}>
          {label}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'w-5 h-5 text-primary flex-shrink-0 transition-transform duration-300',
            open && 'rotate-180',
            chevronClassName
          )}
        />
      </button>
      {open && (
        <div id={panelId} className={cn(panelVariants({ size }), panelClassName)}>
          {children}
        </div>
      )}
    </div>
  );
}
