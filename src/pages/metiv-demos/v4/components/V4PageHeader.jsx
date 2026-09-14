import React from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { areaOf, relativePath } from '../lib/nav';

const TONES = {
  card: 'bg-card text-foreground border-b border-border',
  canvas: 'bg-background text-foreground',
  muted: 'bg-muted text-foreground',
  dark: 'bg-sanctuary text-sanctuary-foreground',
};

const PADDING = {
  default: 'py-7 sm:py-9',
  editorial: 'py-9 sm:py-12',
  hero: 'py-12 sm:py-16',
};

const TITLE = {
  default: 'text-3xl sm:text-4xl',
  editorial: 'text-3xl sm:text-5xl',
  hero: 'text-4xl sm:text-5xl lg:text-6xl',
};

/**
 * V4 page header. Same props as patterns/PageHeader. The institutional take:
 * a structured split band (text beside a framed image) rather than a full-bleed
 * photo. The eyebrow carries the area stripe: rose for patients and families,
 * purple for professionals, plum for Metiv pages.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.title
 * @param {React.ReactNode} [props.subtitle]
 * @param {React.ReactNode} [props.eyebrow]
 * @param {React.ReactNode} [props.actions]
 * @param {string} [props.image]
 * @param {number} [props.imageOpacity] accepted for contract parity; the framed image is shown at full opacity
 * @param {'default'|'editorial'|'hero'} [props.size]
 * @param {'center'|'start'} [props.align]
 * @param {'card'|'canvas'|'muted'|'dark'} [props.tone]
 * @param {React.ReactNode} [props.meta] optional V4 extra row under the subtitle
 * @param {string} [props.className]
 */
export default function V4PageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
  image,
  size = 'default',
  align = 'start',
  tone = 'card',
  meta,
  className,
}) {
  const { pathname } = useLocation();
  const area = areaOf(relativePath(pathname));
  const dark = tone === 'dark';
  const centered = align === 'center' && !image;
  const stripe = dark ? 'bg-sanctuary-foreground/70' : area === 'patient' ? 'bg-secondary' : area === 'therapist' ? 'bg-primary' : 'bg-foreground';
  const subtle = dark ? 'text-sanctuary-foreground/85' : tone === 'card' ? 'text-card-foreground' : 'text-muted-foreground';

  return (
    <header className={cn('relative w-full', TONES[tone] || TONES.card, className)}>
      <div
        className={cn(
          'mx-auto max-w-7xl px-4 sm:px-6',
          PADDING[size] || PADDING.default,
          image && 'grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_15rem] lg:grid-cols-[minmax(0,1fr)_19rem]'
        )}
      >
        <div className={cn('flex flex-col', centered ? 'items-center text-center' : 'items-start text-start')}>
          {eyebrow && (
            <p className={cn('mb-3 inline-flex items-center gap-2 text-sm font-semibold', dark ? 'text-sanctuary-foreground' : 'text-foreground')}>
              <span aria-hidden="true" className={cn('h-1 w-6 rounded-full', stripe)} />
              {eyebrow}
            </p>
          )}
          <h1 className={cn('font-heading font-semibold leading-tight tracking-tight', TITLE[size] || TITLE.default)}>{title}</h1>
          {subtitle && <p className={cn('mt-3 max-w-3xl text-lg leading-relaxed', subtle)}>{subtitle}</p>}
          {meta && <div className={cn('mt-4 flex flex-wrap items-center gap-2 text-sm', subtle)}>{meta}</div>}
          {actions && <div className={cn('mt-6 flex flex-wrap gap-3', centered && 'justify-center')}>{actions}</div>}
        </div>
        {image && (
          <div className="hidden md:block">
            <img
              src={image}
              alt=""
              aria-hidden="true"
              loading="eager"
              className={cn('aspect-[4/3] w-full rounded-super-sm object-cover', dark ? 'ring-1 ring-sanctuary-foreground/20' : 'border border-border')}
            />
          </div>
        )}
      </div>
    </header>
  );
}
