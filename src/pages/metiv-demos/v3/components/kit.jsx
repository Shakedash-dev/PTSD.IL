import React, { useState } from 'react';
import { ArrowLeft, Check, ExternalLink as ExternalIcon, Mail, MessageCircle, Phone, ListChecks, Quote } from 'lucide-react';
import SectionBlock from '@/components/patterns/SectionBlock';
import ChoiceChip from '@/components/patterns/ChoiceChip';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { cn } from '@/lib/utils';

// Version-local building blocks for V3 "Guided Journey".

/** Shared focus ring for links styled by hand. */
export const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

/** Link styled as a solid pill (the primary CTA look, for anchors). */
export const PILL_SOLID = `inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold px-6 py-3 shadow-atmospheric-md hover:bg-accent hover:shadow-atmospheric-lg transition-natural ${FOCUS}`;
/** Link styled as a quiet outlined pill. */
export const PILL_OUTLINE = `inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card text-foreground font-medium px-5 py-2.5 hover:border-primary hover:bg-muted transition-natural ${FOCUS}`;
/** Link styled as a small chip. */
export const CHIP_LINK = `inline-flex items-center gap-1.5 rounded-full border border-border bg-card text-foreground text-sm font-medium px-4 py-2 hover:border-primary hover:bg-primary/10 transition-natural ${FOCUS}`;
/** Inline text link. */
export const TEXT_LINK = `font-medium text-accent underline decoration-primary/40 underline-offset-4 hover:decoration-accent ${FOCUS} rounded-sm`;

/**
 * Full-width band.
 * @param {{ tone?: 'canvas'|'card'|'muted'|'dark'|'primary', width?: 'narrow'|'default'|'wide'|'full', padding?: string, id?: string, className?: string, innerClassName?: string, children?: React.ReactNode, labelledBy?: string }} props
 */
export function Band({ tone = 'canvas', width = 'wide', padding = 'py-14 sm:py-20', id, className = '', innerClassName = '', children, labelledBy }) {
  return (
    <div id={id} aria-labelledby={labelledBy} className={cn('scroll-mt-28', className)}>
      <SectionBlock variant={tone} maxWidth={width} padding={padding} innerClassName={innerClassName}>
        {children}
      </SectionBlock>
    </div>
  );
}

/**
 * Section heading with an optional question-style eyebrow.
 * @param {{ eyebrow?: React.ReactNode, title: React.ReactNode, intro?: React.ReactNode, id?: string, align?: 'start'|'center', as?: 'h2'|'h3', className?: string, onDark?: boolean }} props
 */
export function SectionHeading({ eyebrow, title, intro, id, align = 'start', as = 'h2', className = '', onDark = false }) {
  const Tag = as;
  return (
    <div className={cn('mb-8', align === 'center' && 'text-center mx-auto max-w-2xl', className)}>
      {eyebrow && (
        <p className={cn('text-sm font-semibold mb-2', onDark ? 'text-sanctuary-foreground/80' : 'text-accent')}>{eyebrow}</p>
      )}
      <Tag id={id} className={cn('font-heading font-semibold leading-tight', as === 'h2' ? 'text-3xl sm:text-4xl' : 'text-2xl', onDark ? 'text-sanctuary-foreground' : 'text-foreground')}>
        {title}
      </Tag>
      {intro && (
        <p className={cn('mt-3 text-lg leading-relaxed max-w-2xl', align === 'center' && 'mx-auto', onDark ? 'text-sanctuary-foreground/85' : 'text-muted-foreground')}>
          {intro}
        </p>
      )}
    </div>
  );
}

/**
 * The "בקצרה" card that opens content pages.
 * @param {{ items: React.ReactNode[], title?: string, more?: { label: string, href: string }, className?: string }} props
 */
export function ShortVersion({ items, title = 'בקצרה', more, className = '' }) {
  if (!items?.length) return null;
  return (
    <aside aria-label={title} className={cn('rounded-super border-2 border-primary/25 bg-card p-5 sm:p-6 shadow-card text-start', className)}>
      <p className="flex items-center gap-2 font-heading font-semibold text-foreground mb-3">
        <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <ListChecks className="w-4 h-4 text-accent" aria-hidden="true" />
        </span>
        {title}
      </p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-foreground leading-relaxed">
            <Check className="w-4 h-4 mt-1.5 text-success flex-shrink-0" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {more && (
        <a href={more.href} className={cn('mt-4 inline-flex items-center gap-1 text-sm', TEXT_LINK)}>
          {more.label}
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        </a>
      )}
    </aside>
  );
}

/**
 * @typedef {{ title: React.ReactNode, text?: React.ReactNode, to?: string, href?: string, cta?: string }} JourneyStep
 */

/**
 * Numbered steps joined by a hand-drawn-style dashed path.
 * @param {{ steps: JourneyStep[], className?: string, label?: string }} props
 */
export function JourneySteps({ steps, className = '', label }) {
  return (
    <ol aria-label={label} className={cn('relative space-y-4', className)}>
      {steps.map((step, i) => (
        <li key={i} className="relative flex gap-4">
          {i < steps.length - 1 && (
            <span aria-hidden="true" className="absolute start-5 top-11 -bottom-4 border-s-2 border-dashed border-primary/40" />
          )}
          <span className="relative z-10 w-10 h-10 flex-shrink-0 rounded-full bg-primary text-primary-foreground font-heading font-semibold flex items-center justify-center shadow-atmospheric-md">
            {i + 1}
          </span>
          <div className="flex-1 min-w-0 rounded-super-sm bg-card border border-border p-4 sm:p-5">
            <p className="font-heading font-semibold text-lg text-foreground leading-snug">{step.title}</p>
            {step.text && <p className="text-muted-foreground mt-1 leading-relaxed">{step.text}</p>}
            {step.to && (
              <DemoLink to={step.to} className={cn('mt-3 inline-flex items-center gap-1', TEXT_LINK)}>
                {step.cta || 'להמשיך'}
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              </DemoLink>
            )}
            {step.href && <ExternalLink href={step.href} className={cn('mt-3', TEXT_LINK)}>{step.cta || 'לפרטים'}</ExternalLink>}
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * External link that says it opens a new tab.
 * @param {{ href: string, children?: React.ReactNode, className?: string, icon?: boolean }} props
 */
export function ExternalLink({ href, children, className = '', icon = true }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cn('inline-flex items-center gap-1.5', className)}>
      {children}
      {icon && <ExternalIcon className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />}
      <span className="sr-only">(נפתח בלשונית חדשה)</span>
    </a>
  );
}

/**
 * Whole-card internal link with an icon or illustration.
 * @param {{ to: string, title: React.ReactNode, description?: React.ReactNode, icon?: React.ReactNode, image?: string, meta?: React.ReactNode, className?: string, cta?: string }} props
 */
export function LinkCard({ to, title, description, icon, image, meta, className = '', cta }) {
  return (
    <DemoLink
      to={to}
      className={cn(
        'group flex flex-col h-full rounded-super bg-card border border-border p-5 sm:p-6 shadow-card hover:shadow-card-hover hover:border-primary/50 hover:-translate-y-0.5 transition-natural',
        FOCUS,
        className
      )}
    >
      {image && (
        <div className="mb-4 -mt-1 h-36 rounded-super-sm bg-muted flex items-end justify-center overflow-hidden">
          <img src={image} alt="" className="h-full w-auto object-contain" loading="lazy" />
        </div>
      )}
      {icon && !image && (
        <span className="mb-4 w-12 h-12 rounded-2xl bg-primary/10 text-accent flex items-center justify-center">{icon}</span>
      )}
      {meta && <div className="mb-2">{meta}</div>}
      <span className="font-heading font-semibold text-lg text-foreground leading-snug">{title}</span>
      {description && <span className="mt-1.5 text-muted-foreground leading-relaxed">{description}</span>}
      <span className="mt-auto pt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent">
        {cta || 'לעמוד'}
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
      </span>
    </DemoLink>
  );
}

/**
 * Small status label. Status tones only for status; muted for neutral.
 * @param {{ tone?: 'success'|'info'|'warning'|'muted'|'primary', children?: React.ReactNode, className?: string }} props
 */
export function StatusPill({ tone = 'muted', children, className = '' }) {
  const tones = {
    success: 'bg-success/10 text-success border-success/30',
    info: 'bg-info/10 text-info border-info/30',
    warning: 'bg-warning/10 text-warning border-warning/30',
    muted: 'bg-muted text-muted-foreground border-border',
    primary: 'bg-primary/10 text-accent border-primary/30',
  };
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', tones[tone], className)}>
      {tone === 'success' && <span className="w-1.5 h-1.5 rounded-full bg-success" aria-hidden="true" />}
      {children}
    </span>
  );
}

/**
 * Definition list of facts.
 * @param {{ items: { label: string, value?: React.ReactNode, icon?: React.ReactNode }[], columns?: 1|2|3, className?: string }} props
 */
export function FactGrid({ items, columns = 2, className = '' }) {
  const shown = items.filter((i) => i.value);
  if (!shown.length) return null;
  return (
    <dl className={cn('grid gap-3', columns === 2 && 'sm:grid-cols-2', columns === 3 && 'sm:grid-cols-2 lg:grid-cols-3', className)}>
      {shown.map((item) => (
        <div key={item.label} className="flex gap-3 rounded-super-sm bg-card border border-border p-4">
          {item.icon && <span className="mt-0.5 text-accent flex-shrink-0" aria-hidden="true">{item.icon}</span>}
          <div className="min-w-0">
            <dt className="text-xs font-semibold text-muted-foreground mb-0.5">{item.label}</dt>
            <dd className="text-foreground leading-relaxed break-words">{item.value}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}

/**
 * Contact chips: email, phone, WhatsApp.
 * @param {{ contact?: { name?: string, role?: string, email?: string, phone?: string, whatsapp?: string }, className?: string }} props
 */
export function ContactChips({ contact, className = '' }) {
  if (!contact) return null;
  const digits = (s) => (s || '').replace(/[^\d+]/g, '');
  const wa = (s) => `https://wa.me/972${digits(s).replace(/^0/, '')}`;
  return (
    <div className={cn('space-y-2', className)}>
      {(contact.name || contact.role) && (
        <p className="text-foreground">
          {contact.name && <span className="font-semibold">{contact.name}</span>}
          {contact.name && contact.role && ', '}
          {contact.role && <span className="text-muted-foreground">{contact.role}</span>}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {contact.email && (
          <a href={`mailto:${contact.email}`} className={CHIP_LINK}>
            <Mail className="w-4 h-4 text-accent" aria-hidden="true" />
            <span dir="ltr">{contact.email}</span>
          </a>
        )}
        {contact.phone && (
          <a href={`tel:${digits(contact.phone)}`} className={CHIP_LINK}>
            <Phone className="w-4 h-4 text-accent" aria-hidden="true" />
            <span dir="ltr">{contact.phone}</span>
          </a>
        )}
        {contact.whatsapp && (
          <a href={wa(contact.whatsapp)} target="_blank" rel="noopener noreferrer" className={CHIP_LINK}>
            <MessageCircle className="w-4 h-4 text-accent" aria-hidden="true" />
            וואטסאפ <span dir="ltr">{contact.whatsapp}</span>
            <span className="sr-only">(נפתח בלשונית חדשה)</span>
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * Empty state for filters.
 * @param {{ title: string, text?: string, action?: React.ReactNode }} props
 */
export function EmptyState({ title, text, action }) {
  return (
    <div className="rounded-super border-2 border-dashed border-border bg-card/60 p-8 text-center">
      <p className="font-heading font-semibold text-lg text-foreground">{title}</p>
      {text && <p className="text-muted-foreground mt-1">{text}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

/**
 * Quote card.
 * @param {{ quote: string, name?: string, role?: string }} props
 */
export function QuoteCard({ quote, name, role }) {
  return (
    <figure className="h-full rounded-super bg-card border border-border p-6 shadow-card">
      <Quote className="w-6 h-6 text-secondary mb-3" aria-hidden="true" />
      <blockquote className="text-foreground leading-relaxed">{quote}</blockquote>
      {(name || role) && (
        <figcaption className="mt-4 text-sm">
          {name && <span className="font-semibold text-foreground">{name}</span>}
          {role && <span className="block text-muted-foreground">{role}</span>}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * Plain-text with bare URLs turned into links.
 * @param {{ text?: string }} props
 */
export function Linkify({ text }) {
  if (!text) return null;
  const parts = text.split(/(https?:\/\/[^\s)]+)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <ExternalLink key={i} href={part} className={TEXT_LINK}>
            <span dir="ltr">{part.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
          </ExternalLink>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

/**
 * "האם זה עזר?" with a next suggested step. Nothing is sent anywhere.
 * @param {{ steps?: { label: string, to: string }[], className?: string }} props
 */
export function WasThisHelpful({ steps = [], className = '' }) {
  const [answer, setAnswer] = useState(/** @type {null|'yes'|'no'} */ (null));
  return (
    <div className={cn('rounded-super bg-muted p-6 sm:p-8', className)}>
      <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-12">
        <div className="lg:w-1/3">
          <p className="font-heading font-semibold text-xl text-foreground">האם העמוד הזה עזר?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ChoiceChip selected={answer === 'yes'} onClick={() => setAnswer('yes')}>כן, תודה</ChoiceChip>
            <ChoiceChip selected={answer === 'no'} onClick={() => setAnswer('no')}>לא ממש</ChoiceChip>
          </div>
          <p className="mt-3 text-sm text-muted-foreground min-h-[1.5rem]" aria-live="polite">
            {answer === 'yes' && 'תודה ששיתפת. באתר ההדגמה שום דבר לא נשמר.'}
            {answer === 'no' && (
              <>
                מצטערים. אפשר לנסות{' '}
                <DemoLink to="/patient/where-to-get-help#consultation" className={TEXT_LINK}>שיחת התייעצות</DemoLink>
                {' '}או לחזור ל<DemoLink to="/patient" className={TEXT_LINK}>כל הנושאים</DemoLink>.
              </>
            )}
          </p>
        </div>
        {steps.length > 0 && (
          <div className="flex-1">
            <p className="font-heading font-semibold text-xl text-foreground">הצעד הבא, אם מתאים</p>
            <div className="mt-3 grid sm:grid-cols-2 gap-3">
              {steps.map((s) => (
                <DemoLink
                  key={s.to}
                  to={s.to}
                  className={cn('group flex items-center justify-between gap-3 rounded-super-sm bg-card border border-border px-5 py-4 font-medium text-foreground hover:border-primary transition-natural', FOCUS)}
                >
                  {s.label}
                  <ArrowLeft className="w-4 h-4 text-accent transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                </DemoLink>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Chip row for a guided question. Options carry their own count when given.
 * @param {{ legend: string, options: { key: string, label: string, count?: number }[], value: string, onChange: (key: string) => void, className?: string, size?: 'sm'|'default' }} props
 */
export function ChipQuestion({ legend, options, value, onChange, className = '', size = 'default' }) {
  return (
    <div role="group" aria-label={legend} className={cn('flex flex-wrap gap-2', className)}>
      {options.map((o) => (
        <ChoiceChip key={o.key} size={size} selected={value === o.key} onClick={() => onChange(o.key)}>
          {o.label}
          {typeof o.count === 'number' && (
            <span className={cn('rounded-full px-1.5 text-xs', value === o.key ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground')}>
              {o.count}
            </span>
          )}
        </ChoiceChip>
      ))}
    </div>
  );
}

/**
 * A soft illustration disc.
 * @param {{ src: string, className?: string, flip?: boolean }} props
 */
export function IllustrationDisc({ src, className = '', flip = false }) {
  return (
    <div className={cn('rounded-full bg-muted flex items-end justify-center overflow-hidden aspect-square', className)} aria-hidden="true">
      <img src={src} alt="" className={cn('h-[88%] w-auto object-contain', flip && '-scale-x-100')} loading="lazy" />
    </div>
  );
}
