import React, { useEffect, useRef, useState } from 'react';
import { cva } from 'class-variance-authority';
import * as Icons from 'lucide-react';
import { ArrowLeft, ExternalLink, Mail, Phone, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { HE_MONTHS, pad, telHref, whatsappHref } from '../lib';

// Editorial building blocks for v1. Every colour is a semantic token.

export const LOGO = `${import.meta.env.BASE_URL || '/'}images/metiv-demo/metiv-logo.png`;
export const CONTAINER = 'mx-auto w-full max-w-[80rem] px-5 sm:px-8 lg:px-12';
export const READING = 'mx-auto w-full max-w-[42rem]';
/** The one arch mask used site-wide: a full semicircle on top, soft corners below. */
export const ARCH = 'rounded-t-[999px] rounded-b-super overflow-hidden';
export const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

/** Sets document.title for the page. @param {string} [title] */
export function useV1Title(title) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} | מטיב` : 'מטיב - המרכז הישראלי לטיפול בפסיכוטראומה';
    return () => {
      document.title = prev;
    };
  }, [title]);
}

const pillVariants = cva(
  `inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-all duration-300 active:scale-[0.98] motion-reduce:transition-none [&_svg]:size-4 [&_svg]:shrink-0 ${FOCUS}`,
  {
    variants: {
      tone: {
        primary: 'bg-primary text-primary-foreground shadow-atmospheric-md hover:bg-accent hover:text-accent-foreground hover:shadow-atmospheric-lg',
        dark: 'bg-sanctuary text-sanctuary-foreground shadow-atmospheric-md hover:bg-accent hover:text-accent-foreground',
        light: 'border border-border bg-card text-foreground hover:border-primary hover:text-primary',
        onDark: 'bg-sanctuary-foreground text-sanctuary hover:bg-card hover:shadow-atmospheric-lg',
        outlineDark: 'border border-sanctuary-foreground/35 text-sanctuary-foreground hover:bg-sanctuary-foreground/10',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-6 text-sm',
        lg: 'h-14 px-8 text-base',
        xl: 'h-16 px-10 text-lg [&_svg]:size-5',
      },
    },
    defaultVariants: { tone: 'primary', size: 'md' },
  }
);

/** Is this an address that leaves the demo? @param {string} [href] */
const isExternal = (href = '') => /^https?:\/\//.test(href);

/**
 * Link that routes internal paths through DemoLink and opens web links in a new tab.
 * @param {any} props
 */
export function V1Link({ to, className, children, ...rest }) {
  if (typeof to === 'string' && to.startsWith('/') && !to.startsWith('//')) {
    return <DemoLink to={to} className={className} {...rest}>{children}</DemoLink>;
  }
  if (isExternal(to)) {
    return <a href={to} target="_blank" rel="noreferrer" className={className} {...rest}>{children}</a>;
  }
  return <a href={to} className={className} {...rest}>{children}</a>;
}

/** Stadium-shaped call to action rendered as a link. @param {any} props */
export function PillLink({ to, tone, size, className, children, ...rest }) {
  return (
    <V1Link to={to} className={cn(pillVariants({ tone, size }), className)} {...rest}>
      {children}
    </V1Link>
  );
}

/** Quiet text link with a forward (leftward) arrow. @param {any} props */
export function ArrowLink({ to, children, className, tone = 'primary', external }) {
  const ext = external ?? isExternal(to);
  return (
    <V1Link
      to={to}
      className={cn(
        'group inline-flex items-center gap-2 font-medium underline-offset-[6px] hover:underline rounded-sm',
        FOCUS,
        tone === 'dark' ? 'text-sanctuary-foreground' : 'text-primary',
        className
      )}
    >
      {children}
      {ext ? (
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
      ) : (
        <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
      )}
      {ext && <span className="sr-only">(נפתח בלשונית חדשה)</span>}
    </V1Link>
  );
}

/** Small spaced label with a hairline before it. @param {any} props */
export function Eyebrow({ children, className, tone = 'light', rule = true }) {
  return (
    <p
      className={cn(
        'flex items-center gap-3 text-xs font-semibold tracking-wide',
        tone === 'dark' ? 'text-sanctuary-foreground/80' : 'text-muted-foreground',
        className
      )}
    >
      {rule && <span aria-hidden="true" className={cn('h-px w-8', tone === 'dark' ? 'bg-sanctuary-foreground/40' : 'bg-secondary')} />}
      <span>{children}</span>
    </p>
  );
}

/** Nested-arch glyph, the chapter mark. @param {any} props */
export function ArchGlyph({ className }) {
  return (
    <svg width="22" height="28" viewBox="0 0 22 28" fill="none" aria-hidden="true" className={className}>
      <path d="M1.5 27V11.5a9.5 9.5 0 0 1 19 0V27" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6.5 27V15.5a4.5 4.5 0 0 1 9 0V27" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

/** Centered glyph with generous air, instead of rules or colour bands. @param {any} props */
export function ChapterBreak({ className }) {
  return (
    <div aria-hidden="true" className={cn('flex justify-center py-12 text-secondary md:py-20', className)}>
      <ArchGlyph />
    </div>
  );
}

/** Image in the site-wide arch frame. @param {any} props */
export function Arch({ src, alt = '', aspect = 'aspect-[3/4]', contain = false, className, imgClassName, eager = false, flip = false }) {
  return (
    <div className={cn('relative bg-muted', ARCH, aspect, className)}>
      {src && (
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          className={cn(
            'absolute inset-0 h-full w-full transition-transform duration-700 ease-out motion-reduce:transition-none',
            contain ? 'object-contain object-bottom px-2 pt-4' : 'object-cover',
            flip && '-scale-x-100',
            imgClassName
          )}
        />
      )}
    </div>
  );
}

/**
 * Chapter heading: numeral and label in a narrow column, a large light title beside.
 * @param {any} props
 */
export function ChapterHead({ number, label, title, lead, action, id, className, tone = 'light', level = 2 }) {
  const dark = tone === 'dark';
  const H = level === 3 ? 'h3' : 'h2';
  return (
    <header id={id} className={cn('mb-10 grid scroll-mt-32 gap-5 md:mb-14 md:grid-cols-12 md:gap-10', className)}>
      <div className="flex items-baseline gap-3 md:col-span-3 md:flex-col md:gap-2 md:pt-3">
        {number && (
          <span className={cn('font-heading text-2xl font-light tabular-nums', dark ? 'text-sanctuary-foreground/70' : 'text-secondary')}>
            {number}
          </span>
        )}
        {label && (
          <span className={cn('text-xs font-semibold tracking-wide', dark ? 'text-sanctuary-foreground/80' : 'text-muted-foreground')}>
            {label}
          </span>
        )}
      </div>
      <div className="md:col-span-9">
        <H className={cn('font-heading text-4xl font-light leading-[1.1] tracking-tight md:text-6xl', dark ? 'text-sanctuary-foreground' : 'text-foreground')}>
          {title}
        </H>
        {lead && (
          <p className={cn('mt-5 max-w-2xl text-lg leading-relaxed md:text-xl', dark ? 'text-sanctuary-foreground/80' : 'text-muted-foreground')}>
            {lead}
          </p>
        )}
        {action && <div className="mt-6">{action}</div>}
      </div>
    </header>
  );
}

/** A chapter band: container, top hairline, vertical rhythm. @param {any} props */
export function Chapter({ children, className, innerClassName, id, rule = true }) {
  return (
    <section id={id} className={cn(CONTAINER, 'scroll-mt-32 py-14 md:py-24', className)}>
      <div className={cn(rule && 'border-t border-border pt-10 md:pt-14', innerClassName)}>{children}</div>
    </section>
  );
}

/**
 * Table-of-contents list: oversized rose numerals, titles, one-line descriptors, hairlines.
 * @param {{ items: { key: string, title: React.ReactNode, description?: React.ReactNode, to: string }[], columns?: 1|2, start?: number, className?: string }} props
 */
export function NumberedIndex({ items, columns = 2, start = 1, className }) {
  return (
    <ol className={cn('grid border-t border-border', columns === 2 && 'md:grid-cols-2 md:gap-x-12', className)}>
      {items.map((item, i) => (
        <li key={item.key} className="border-b border-border">
          <V1Link to={item.to} className={cn('group flex items-start gap-4 rounded-sm py-6 md:gap-6 md:py-7', FOCUS)}>
            <span aria-hidden="true" className="w-11 shrink-0 font-heading text-3xl font-light leading-none tabular-nums text-secondary md:w-14 md:text-4xl">
              {pad(i + start)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-heading text-xl leading-snug text-foreground transition-colors duration-300 group-hover:text-primary md:text-2xl">
                {item.title}
              </span>
              {item.description && (
                <span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground md:text-base">{item.description}</span>
              )}
            </span>
            <ArrowLeft
              aria-hidden="true"
              className="mt-1.5 h-5 w-5 shrink-0 text-primary opacity-40 transition-all duration-300 group-hover:-translate-x-1 group-hover:opacity-100 motion-reduce:transition-none"
            />
          </V1Link>
        </li>
      ))}
    </ol>
  );
}

const statusVariants = cva(
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold leading-none',
  {
    variants: {
      tone: {
        open: 'border-success/30 bg-success/10 text-success',
        soon: 'border-info/30 bg-info/10 text-info',
        closed: 'border-border bg-muted text-muted-foreground',
      },
    },
    defaultVariants: { tone: 'closed' },
  }
);

/** Status with a text label, never colour alone. @param {any} props */
export function StatusPill({ status, className }) {
  return (
    <span className={cn(statusVariants({ tone: status.key }), className)}>
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {status.label}
    </span>
  );
}

/**
 * Date set inside an arch plate, the thumbnail for courses and events.
 * @param {any} props
 */
export function DatePlate({ iso, fallback = 'מועד יפורסם', size = 'md', className }) {
  const month = iso ? HE_MONTHS[Number(iso.slice(5, 7)) - 1] : '';
  return (
    <div
      aria-hidden="true"
      className={cn(ARCH, 'flex aspect-[3/4] flex-col items-center justify-end bg-muted pb-3 text-center text-foreground md:pb-5', className)}
    >
      {iso ? (
        <>
          <span className={cn('font-heading font-light leading-none tabular-nums', size === 'sm' ? 'text-3xl' : 'text-4xl md:text-6xl')}>
            {Number(iso.slice(8, 10))}
          </span>
          <span className={cn('mt-1 font-medium', size === 'sm' ? 'text-xs' : 'text-xs md:text-sm')}>{month}</span>
          <span className="text-xs tabular-nums text-muted-foreground">{iso.slice(0, 4)}</span>
        </>
      ) : (
        <span className="px-2 pb-2 text-xs font-medium leading-snug text-muted-foreground md:text-sm">{fallback}</span>
      )}
    </div>
  );
}

/** Definition list with hairlines. @param {{ items: { label: string, value: React.ReactNode }[], className?: string }} props */
export function MetaList({ items, className }) {
  const rows = items.filter((r) => r.value);
  if (!rows.length) return null;
  return (
    <dl className={cn('divide-y divide-border border-y border-border', className)}>
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[6.5rem_1fr] gap-4 py-3">
          <dt className="pt-0.5 text-xs font-semibold tracking-wide text-muted-foreground">{row.label}</dt>
          <dd className="text-sm leading-relaxed text-foreground">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Large rose pull-quote. @param {any} props */
export function PullQuote({ children, cite, className }) {
  return (
    <figure className={cn('mx-auto max-w-3xl text-center', className)}>
      <ArchGlyph className="mx-auto mb-6 text-secondary" />
      <blockquote className="font-heading text-2xl font-light leading-[1.35] text-category-2 md:text-[2.4rem]">{children}</blockquote>
      {cite && <figcaption className="mt-5 text-sm tracking-wide text-muted-foreground">{cite}</figcaption>}
    </figure>
  );
}

/** Plain text with bare URLs turned into links. @param {{ text: string }} props */
export function Linkify({ text }) {
  const parts = String(text || '').split(/(https?:\/\/[^\s)]+)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noreferrer" className="break-all text-primary underline underline-offset-4">
            {part.replace(/^https?:\/\//, '').replace(/\/$/, '')}
          </a>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

/** Lucide icon by name. @param {{ name?: string, className?: string }} props */
export function NamedIcon({ name, className }) {
  const Icon = name ? /** @type {Record<string, any>} */ (Icons)[name] : null;
  return Icon ? <Icon className={className} aria-hidden="true" /> : null;
}

/** Contact lines (name, email, phone, WhatsApp). @param {any} props */
export function ContactLines({ contact, className, tone = 'light' }) {
  if (!contact) return null;
  const dark = tone === 'dark';
  const link = cn('inline-flex items-center gap-2 rounded-sm underline-offset-4 hover:underline', FOCUS, dark ? 'text-sanctuary-foreground' : 'text-primary');
  return (
    <div className={cn('space-y-2 text-sm', className)}>
      {contact.name && (
        <p className={dark ? 'text-sanctuary-foreground' : 'text-foreground'}>
          <span className="font-medium">{contact.name}</span>
          {contact.role && <span className={dark ? 'text-sanctuary-foreground/75' : 'text-muted-foreground'}>, {contact.role}</span>}
        </p>
      )}
      {contact.email && (
        <p><a className={link} href={`mailto:${contact.email}`}><Mail className="h-4 w-4" aria-hidden="true" /><span dir="ltr">{contact.email}</span></a></p>
      )}
      {contact.phone && (
        <p><a className={link} href={telHref(contact.phone)}><Phone className="h-4 w-4" aria-hidden="true" /><span dir="ltr">{contact.phone}</span></a></p>
      )}
      {contact.whatsapp && (
        <p>
          <a className={link} href={whatsappHref(contact.whatsapp)} target="_blank" rel="noreferrer">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            וואטסאפ <span dir="ltr">{contact.whatsapp}</span>
          </a>
        </p>
      )}
    </div>
  );
}

/** Round initials avatar. @param {any} props */
export function Initials({ name, className }) {
  const letters = name
    .replace(/(ד"ר|פרופ')\s*/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
  return (
    <span aria-hidden="true" className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted font-heading text-lg text-primary', className)}>
      {letters}
    </span>
  );
}

/** Friendly empty state for filtered lists. @param {any} props */
export function EmptyState({ title, text, action }) {
  return (
    <div className="flex flex-col items-center border-y border-border px-6 py-16 text-center">
      <ArchGlyph className="mb-5 text-secondary" />
      <p className="font-heading text-2xl font-light text-foreground">{title}</p>
      {text && <p className="mt-2 max-w-md text-muted-foreground">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/**
 * Fades content up once it scrolls into view. Content is visible immediately
 * when IntersectionObserver is missing or the visitor prefers reduced motion.
 * @param {any} props
 */
export function Reveal({ children, className, delay = 0 }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return true;
    return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  });

  useEffect(() => {
    if (shown || !ref.current) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -6% 0px' }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [shown]);

  return (
    <div
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        'transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none',
        shown ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
        className
      )}
    >
      {children}
    </div>
  );
}
