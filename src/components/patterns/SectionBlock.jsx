import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Full-width colored band with a centered content container. Each page composes a
// vertical stack of these to create distinct section identities (vs the old "one
// background color per page" feel). Variants pull from the palette so a token
// change follows automatically.
//
// `variant` and `maxWidth` are the design-system axes and are expressed through
// cva, which also makes them machine-readable for the Figma export. `padding`
// stays a free-form class string: vertical rhythm is per-composition layout
// rather than a component variant, and every call site uses a different value.
const sectionBlockVariants = cva('w-full', {
  variants: {
    variant: {
      canvas: 'bg-background',                        // page bg
      card: 'bg-card',                                // lighter than canvas
      muted: 'bg-muted',                              // clearly tinted
      dark: 'bg-sanctuary text-sanctuary-foreground', // hero / CTA block, inverted text
      primary: 'bg-primary text-primary-foreground',  // strong accent block
    },
  },
  defaultVariants: { variant: 'canvas' },
});

const sectionBlockInnerVariants = cva('mx-auto px-5 sm:px-6', {
  variants: {
    maxWidth: {
      narrow: 'max-w-2xl',
      default: 'max-w-3xl',
      wide: 'max-w-5xl',
      full: 'max-w-7xl',
    },
  },
  defaultVariants: { maxWidth: 'default' },
});

export { sectionBlockVariants, sectionBlockInnerVariants };

/**
 * @param {Object} props
 * @param {'canvas'|'card'|'muted'|'dark'|'primary'} [props.variant]
 * @param {'narrow'|'default'|'wide'|'full'} [props.maxWidth]
 * @param {string} [props.padding] vertical rhythm, as Tailwind classes
 * @param {string} [props.className]
 * @param {string} [props.innerClassName]
 * @param {React.ReactNode} [props.children]
 */
export default function SectionBlock({
  variant = 'canvas',
  maxWidth = 'default',
  padding = 'py-16 sm:py-20',
  className = '',
  innerClassName = '',
  children,
}) {
  return (
    <section className={cn(sectionBlockVariants({ variant }), padding, className)}>
      <div className={cn(sectionBlockInnerVariants({ maxWidth }), innerClassName)}>
        {children}
      </div>
    </section>
  );
}
