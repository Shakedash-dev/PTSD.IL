import React from 'react';

// Per-page hero. Pages opt into a personality by passing props:
//   size:  'default' (compact) | 'editorial' (light, larger) | 'hero' (massive magazine)
//   align: 'center' | 'start'
//   tone:  'card' (default tinted strip) | 'canvas' | 'muted' | 'dark'
//   eyebrow: small label above the title (e.g. "מסע הטיפול")
//   actions: render-prop or node placed under the subtitle (CTA pills, etc.)
//
// Default props preserve previous look so existing pages don't regress.
const SIZE_CLASSES = {
  default: {
    wrapper: 'pt-24 pb-10',
    title: 'font-bold text-3xl sm:text-4xl leading-snug',
    subtitle: 'leading-relaxed max-w-2xl',
  },
  editorial: {
    wrapper: 'pt-28 pb-16 sm:pt-32 sm:pb-20',
    title: 'font-light text-5xl sm:text-6xl leading-[1.05] tracking-tight',
    subtitle: 'text-lg leading-relaxed max-w-2xl',
  },
  hero: {
    wrapper: 'pt-32 pb-20 sm:pt-40 sm:pb-28',
    title: 'font-light text-6xl sm:text-7xl lg:text-8xl leading-[1.0] tracking-tight',
    subtitle: 'text-lg sm:text-xl leading-relaxed max-w-2xl',
  },
};

const TONE_CLASSES = {
  card: 'bg-card border-b border-border text-foreground',
  canvas: 'bg-background text-foreground',
  muted: 'bg-muted text-foreground',
  dark: 'bg-sanctuary text-sanctuary-foreground',
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
 * @param {string} [props.image] optional URL: renders a soft full-bleed background photo
 * @param {number} [props.imageOpacity] override opacity (0..1). Defaults vary by tone for contrast.
 * @param {string} [props.className]
 */
export default function PageHeader({
  title,
  subtitle,
  eyebrow,
  size = 'default',
  align = 'center',
  tone = 'card',
  actions,
  image,
  imageOpacity,
  className = '',
}) {
  const s = SIZE_CLASSES[size] || SIZE_CLASSES.default;
  const toneClass = TONE_CLASSES[tone] || TONE_CLASSES.card;
  const alignClass = align === 'start' ? 'items-start text-start' : 'items-center text-center';
  // dark tones need a dimmer image so light text stays readable; light tones can
  // show the image a bit brighter since the text is dark.
  const defaultOpacity = tone === 'dark' ? 0.3 : 0.45;
  const opacity = typeof imageOpacity === 'number' ? imageOpacity : defaultOpacity;

  // Overlay gradient pulls toward the tone color so text stays legible.
  // For light tones we layer a white-ish wash; for dark tones we layer a dark wash.
  const overlayClass = tone === 'dark'
    ? 'bg-gradient-to-b from-sanctuary/40 via-sanctuary/60 to-sanctuary'
    : tone === 'muted'
      ? 'bg-gradient-to-b from-muted/40 via-muted/65 to-muted'
      : 'bg-gradient-to-b from-card/40 via-card/65 to-card';

  return (
    <div className={`relative w-full ${toneClass} ${image ? 'overflow-hidden' : ''} ${className}`}>
      {image && (
        <>
          <img
            src={image}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity }}
            loading="eager"
          />
          <div className={`absolute inset-0 ${overlayClass}`} aria-hidden="true" />
        </>
      )}
      <div className={`relative max-w-3xl mx-auto px-5 sm:px-6 ${s.wrapper} flex flex-col ${alignClass}`}>
        {eyebrow && (
          <span className="font-body text-sm font-semibold uppercase tracking-[0.18em] opacity-70 mb-4">
            {eyebrow}
          </span>
        )}
        <h1 className={`font-heading ${s.title} mb-3`}>
          {title}
        </h1>
        {subtitle && (
          <p className={`font-body ${s.subtitle} ${tone === 'card' ? 'text-card-foreground' : 'opacity-85'}`}>
            {subtitle}
          </p>
        )}
        {actions && (
          <div className={`mt-8 flex flex-wrap gap-3 ${align === 'start' ? 'justify-start' : 'justify-center'}`}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
