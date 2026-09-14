import React from 'react';
import { ExternalLink as ExternalIcon, Mail, Phone, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

// Small version-local building blocks for V4 "Institutional Modern".

const PILL_TONES = {
  positive: 'border-success/40 bg-card text-success',
  info: 'border-info/40 bg-card text-info',
  neutral: 'border-border bg-muted text-muted-foreground',
};

/**
 * Status pill: always a text label, colour is secondary.
 * @param {{ tone?: 'positive'|'info'|'neutral', children: React.ReactNode, className?: string }} props
 */
export function StatusPill({ tone = 'neutral', children, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        PILL_TONES[tone],
        className
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

/** @param {string|undefined} status */
export function registrationPill(status) {
  if (status === 'open') return { tone: /** @type {const} */ ('positive'), label: 'ההרשמה פתוחה' };
  if (status === 'closed') return { tone: /** @type {const} */ ('neutral'), label: 'ההרשמה סגורה' };
  return { tone: /** @type {const} */ ('info'), label: 'פרטים בפנייה' };
}

/** @param {string} status */
export function unitPill(status) {
  if (status === 'soon') return { tone: /** @type {const} */ ('info'), label: 'בקרוב' };
  if (status === 'closed') return { tone: /** @type {const} */ ('neutral'), label: 'ההרשמה סגורה' };
  return { tone: /** @type {const} */ ('neutral'), label: 'הסתיים' };
}

/** @param {{ children: React.ReactNode, className?: string }} props */
export function Tag({ children, className }) {
  return (
    <span className={cn('inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground', className)}>
      {children}
    </span>
  );
}

/**
 * Section heading with an anchor id (used by the "on this page" rail).
 * @param {{ id?: string, eyebrow?: React.ReactNode, title: React.ReactNode, description?: React.ReactNode, action?: React.ReactNode, as?: 'h2'|'h3', className?: string }} props
 */
export function SectionTitle({ id, eyebrow, title, description, action, as = 'h2', className }) {
  const H = as;
  return (
    <div className={cn('mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3', className)}>
      <div className="min-w-0 max-w-3xl">
        {eyebrow && <p className="mb-1 text-sm font-semibold text-primary">{eyebrow}</p>}
        <H id={id} className={cn('font-heading font-semibold text-foreground', as === 'h2' ? 'text-2xl sm:text-3xl' : 'text-xl')}>
          {title}
        </H>
        {description && <p className="mt-2 text-muted-foreground leading-relaxed">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/**
 * Definition grid for key facts. Items without a value are skipped.
 * @param {{ items: { label: string, value?: React.ReactNode, icon?: React.ComponentType<any> }[], className?: string, columns?: string }} props
 */
export function KeyFacts({ items, className, columns = 'sm:grid-cols-2' }) {
  const shown = items.filter((i) => i.value !== undefined && i.value !== null && i.value !== '');
  if (!shown.length) return null;
  return (
    <dl className={cn('grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border', columns, className)}>
      {shown.map(({ label, value, icon: I }) => (
        <div key={label} className="bg-card px-4 py-3">
          <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {I && <I aria-hidden="true" className="w-4 h-4" />}
            {label}
          </dt>
          <dd className="mt-0.5 font-medium text-foreground leading-snug">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** @param {{ href: string, children: React.ReactNode, className?: string, icon?: boolean }} props */
export function ExtLink({ href, children, className, icon = true }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={cn('inline-flex items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline', className)}>
      {children}
      {icon && <ExternalIcon aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />}
      <span className="sr-only">(נפתח בחלון חדש)</span>
    </a>
  );
}

/** Surface with the V4 hairline border. @param {{ children: React.ReactNode, className?: string, as?: 'div'|'section'|'article'|'aside' }} props */
export function Panel({ children, className, as = 'div' }) {
  const T = as;
  return <T className={cn('rounded-super-sm border border-border bg-card p-5 sm:p-6', className)}>{children}</T>;
}

/** @param {string} num */
export function waLink(num) {
  const digits = num.replace(/\D/g, '').replace(/^0/, '');
  return `https://wa.me/972${digits}`;
}

/**
 * @param {{ contact?: { name?: string, role?: string, email?: string, phone?: string, whatsapp?: string }, title?: string, className?: string }} props
 */
export function ContactCard({ contact, title = 'לפרטים ושאלות', className }) {
  if (!contact) return null;
  const { name, role, email, phone, whatsapp } = contact;
  return (
    <div className={cn('rounded-xl border border-border bg-card p-4', className)}>
      <p className="text-sm font-semibold text-foreground mb-2">{title}</p>
      {name && (
        <p className="flex items-center gap-2 text-foreground">
          <User aria-hidden="true" className="w-4 h-4 text-primary" />
          <span className="font-medium">{name}</span>
        </p>
      )}
      {role && <p className="text-sm text-muted-foreground ms-6">{role}</p>}
      <ul className="mt-2 space-y-1.5 text-sm">
        {email && (
          <li>
            <a className="inline-flex items-center gap-2 text-primary hover:underline break-all" href={`mailto:${email}`}>
              <Mail aria-hidden="true" className="w-4 h-4 shrink-0" />
              <span dir="ltr">{email}</span>
            </a>
          </li>
        )}
        {phone && (
          <li>
            <a className="inline-flex items-center gap-2 text-primary hover:underline" href={`tel:${phone.replace(/[^\d*]/g, '')}`}>
              <Phone aria-hidden="true" className="w-4 h-4 shrink-0" />
              <span dir="ltr">{phone}</span>
            </a>
          </li>
        )}
        {whatsapp && (
          <li>
            <a className="inline-flex items-center gap-2 text-primary hover:underline" href={waLink(whatsapp)} target="_blank" rel="noreferrer">
              <MessageCircle aria-hidden="true" className="w-4 h-4 shrink-0" />
              וואטסאפ <span dir="ltr">{whatsapp}</span>
            </a>
          </li>
        )}
      </ul>
    </div>
  );
}

/** @param {string} name */
export function initials(name) {
  const clean = name.replace(/(ד"ר|פרופ'|ד״ר)\s*/g, '').trim();
  const parts = clean.split(/\s+/);
  return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
}

/** @param {{ name: string, className?: string }} props */
export function Avatar({ name, className }) {
  return (
    <span aria-hidden="true" className={cn('inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-muted font-heading font-semibold text-primary', className)}>
      {initials(name)}
    </span>
  );
}
