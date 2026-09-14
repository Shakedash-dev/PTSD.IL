import React from 'react';
import { cn } from '@/lib/utils';
import { useArea } from './ui';

// V2 page header. Same props as patterns/PageHeader so the patient kit can use
// it. It is an "area banner": the ground follows the area (light for patients,
// sanctuary for professionals), the eyebrow is a pill, and a photo sits in a
// rounded frame beside the text instead of washing out behind it.

const TONES = {
  card: 'bg-card text-foreground border-b border-border',
  canvas: 'bg-background text-foreground',
  muted: 'bg-muted text-foreground',
  dark: 'bg-sanctuary text-sanctuary-foreground',
};

const TITLE = {
  default: 'text-3xl sm:text-4xl',
  editorial: 'text-4xl sm:text-5xl',
  hero: 'text-4xl sm:text-5xl lg:text-6xl',
};

const PAD = {
  default: 'pt-8 pb-10 sm:pt-12 sm:pb-12',
  editorial: 'pt-10 pb-12 sm:pt-14 sm:pb-16',
  hero: 'pt-12 pb-14 sm:pt-20 sm:pb-20',
};

/**
 * @param {Object} props
 * @param {React.ReactNode} props.title
 * @param {React.ReactNode} [props.subtitle]
 * @param {React.ReactNode} [props.eyebrow]
 * @param {'default'|'editorial'|'hero'} [props.size]
 * @param {'center'|'start'} [props.align]
 * @param {'card'|'canvas'|'muted'|'dark'} [props.tone]
 * @param {React.ReactNode} [props.actions]
 * @param {string} [props.image]
 * @param {number} [props.imageOpacity]
 * @param {string} [props.className]
 * @param {React.ReactNode} [props.meta] V2 only: a row under the subtitle (tags, status)
 * @param {React.ReactNode} [props.breadcrumb] V2 only
 */
export default function V2PageHeader({
  title,
  subtitle,
  eyebrow,
  size = 'default',
  align = 'start',
  tone,
  actions,
  image,
  imageOpacity,
  className,
  meta,
  breadcrumb,
}) {
  const area = useArea();
  // The professional area is always dark. Elsewhere the page picks its tone,
  // and "dark" is honoured (the calming hub) because it is a deliberate choice.
  const resolvedTone = area === 'pro' ? 'dark' : tone || 'card';
  const dark = resolvedTone === 'dark';
  const centered = align === 'center';
  const framed = Boolean(image) && !centered;

  return (
    <header className={cn('relative w-full overflow-hidden', TONES[resolvedTone], className)}>
      {image && centered && (
        <>
          <img
            src={image}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: typeof imageOpacity === 'number' ? imageOpacity : dark ? 0.25 : 0.35 }}
          />
          <div
            aria-hidden="true"
            className={cn(
              'absolute inset-0 bg-gradient-to-b',
              dark ? 'from-sanctuary/50 via-sanctuary/70 to-sanctuary' : resolvedTone === 'muted' ? 'from-muted/50 via-muted/75 to-muted' : 'from-card/50 via-card/75 to-card'
            )}
          />
        </>
      )}
      <div
        className={cn(
          'relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8',
          PAD[size] || PAD.default,
          framed && 'grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] items-center'
        )}
      >
        <div className={cn('flex flex-col min-w-0', centered ? 'items-center text-center mx-auto max-w-3xl' : 'items-start text-start max-w-3xl')}>
          {breadcrumb && <div className="mb-4">{breadcrumb}</div>}
          {eyebrow && (
            <span
              className={cn(
                'inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold mb-4',
                dark ? 'bg-sanctuary-foreground/10 text-sanctuary-foreground border border-sanctuary-foreground/20' : 'bg-primary/10 text-foreground'
              )}
            >
              {eyebrow}
            </span>
          )}
          <h1 className={cn('font-heading font-semibold leading-tight tracking-tight', TITLE[size] || TITLE.default)}>{title}</h1>
          {subtitle && (
            <p
              className={cn(
                'mt-4 text-lg leading-relaxed max-w-2xl',
                dark ? 'text-sanctuary-foreground/85' : resolvedTone === 'card' ? 'text-card-foreground' : 'text-muted-foreground'
              )}
            >
              {subtitle}
            </p>
          )}
          {meta && <div className={cn('mt-5 flex flex-wrap gap-2', centered && 'justify-center')}>{meta}</div>}
          {actions && <div className={cn('mt-7 flex flex-wrap gap-3', centered && 'justify-center')}>{actions}</div>}
        </div>
        {framed && (
          <div className="hidden lg:block">
            <div
              className={cn(
                'aspect-[4/3] rounded-super overflow-hidden border-4',
                dark ? 'border-sanctuary-foreground/15' : 'border-background shadow-card'
              )}
            >
              <img src={image} alt="" aria-hidden="true" className="w-full h-full object-cover" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
