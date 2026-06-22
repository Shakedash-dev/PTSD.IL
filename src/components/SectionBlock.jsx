import React from 'react';

// Full-width colored band with a centered content container. Each page composes a
// vertical stack of these to create distinct section identities (vs the old "one
// background color per page" feel). Variants pull from the palette so theme swaps
// follow automatically.
const VARIANT_CLASSES = {
  canvas: 'bg-background',                                  // page bg
  card: 'bg-card',                                          // lighter than canvas
  muted: 'bg-muted',                                        // clearly tinted
  dark: 'bg-sanctuary text-sanctuary-foreground',           // hero / CTA block, inverted text
  primary: 'bg-primary text-primary-foreground',            // strong accent block
};

const MAX_WIDTH = {
  narrow: 'max-w-2xl',
  default: 'max-w-3xl',
  wide: 'max-w-5xl',
  full: 'max-w-7xl',
};

export default function SectionBlock({
  variant = 'canvas',
  maxWidth = 'default',
  padding = 'py-16 sm:py-20',
  className = '',
  innerClassName = '',
  children,
}) {
  return (
    <section className={`w-full ${VARIANT_CLASSES[variant]} ${padding} ${className}`}>
      <div className={`${MAX_WIDTH[maxWidth]} mx-auto px-5 sm:px-6 ${innerClassName}`}>
        {children}
      </div>
    </section>
  );
}
