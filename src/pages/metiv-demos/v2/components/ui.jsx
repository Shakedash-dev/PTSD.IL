import React, { createContext, useContext } from 'react';
import * as Icons from 'lucide-react';
import { ArrowLeft, CheckCircle2, Clock, Lock, ExternalLink } from 'lucide-react';
import Disclosure from '@/components/patterns/Disclosure';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { cn } from '@/lib/utils';
import { FOCUS_DARK, FOCUS_LIGHT } from '../lib';

/** @type {React.Context<import('../lib').Area>} */
export const AreaContext = createContext(/** @type {import('../lib').Area} */ ('metiv'));
export const useArea = () => useContext(AreaContext);
export const useIsDark = () => useContext(AreaContext) === 'pro';

/**
 * Lucide icon by name.
 * @param {{ name?: string, className?: string }} props
 */
export function Icon({ name, className }) {
  const Cmp = name ? /** @type {Record<string, any>} */ (Icons)[name] : null;
  return Cmp ? <Cmp className={className} aria-hidden="true" /> : null;
}

/**
 * Content container. Wide by default: V2 is app-like, not a reading column.
 * @param {{ size?: 'narrow'|'default'|'wide', className?: string, children?: React.ReactNode }} props
 */
export function Container({ size = 'wide', className, children }) {
  const max = size === 'narrow' ? 'max-w-3xl' : size === 'default' ? 'max-w-5xl' : 'max-w-7xl';
  return <div className={cn('mx-auto px-4 sm:px-6 lg:px-8', max, className)}>{children}</div>;
}

/**
 * Section title row: optional eyebrow, title, description, trailing action.
 * @param {{ id?: string, eyebrow?: React.ReactNode, title: React.ReactNode, description?: React.ReactNode, action?: React.ReactNode, className?: string, as?: 'h2'|'h3' }} props
 */
export function SectionTitle({ id, eyebrow, title, description, action, className, as = 'h2' }) {
  const dark = useIsDark();
  const H = as;
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-4 mb-6', className)}>
      <div className="min-w-0 max-w-3xl">
        {eyebrow && (
          <p className={cn('text-sm font-semibold mb-1', dark ? 'text-sanctuary-foreground/75' : 'text-accent')}>{eyebrow}</p>
        )}
        <H id={id} className={cn('font-heading font-semibold text-2xl sm:text-3xl leading-tight scroll-mt-40', dark ? 'text-sanctuary-foreground' : 'text-foreground')}>
          {title}
        </H>
        {description && (
          <p className={cn('mt-2 leading-relaxed', dark ? 'text-sanctuary-foreground/75' : 'text-card-foreground')}>{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/**
 * Surface card. On the dark area it is a lifted plum panel; on light, a card.
 * @param {{ as?: any, className?: string, children?: React.ReactNode, id?: string }} props
 */
export function Panel({ as: As = 'div', className, children, ...rest }) {
  const dark = useIsDark();
  return (
    <As
      className={cn(
        'rounded-super-sm border p-5 sm:p-6',
        dark ? 'bg-sanctuary-foreground/[0.06] border-sanctuary-foreground/15' : 'bg-card border-border shadow-card',
        className
      )}
      {...rest}
    >
      {children}
    </As>
  );
}

/**
 * Whole-card link with a chunky tap target (min 88px).
 * @param {{ to: string, className?: string, children?: React.ReactNode, 'aria-label'?: string }} props
 */
export function CardLink({ to, className, children, ...rest }) {
  const dark = useIsDark();
  const external = /^https?:/.test(to);
  const cls = cn(
    'group relative flex min-h-[88px] rounded-super-sm border p-5 transition-all duration-300 motion-reduce:transition-none',
    dark
      ? cn('bg-sanctuary-foreground/[0.06] border-sanctuary-foreground/15 hover:bg-sanctuary-foreground/[0.11] hover:border-sanctuary-foreground/35', FOCUS_DARK)
      : cn('bg-card border-border shadow-card hover:shadow-card-hover hover:border-primary/50 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0', FOCUS_LIGHT),
    className
  );
  if (external) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={cls} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <DemoLink to={to} className={cls} {...rest}>
      {children}
    </DemoLink>
  );
}

/** Round icon badge used on cards. @param {{ name?: string, className?: string, size?: 'md'|'lg' }} props */
export function IconBadge({ name, className, size = 'md' }) {
  const dark = useIsDark();
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-2xl flex-shrink-0',
        size === 'lg' ? 'w-14 h-14' : 'w-11 h-11',
        dark ? 'bg-sanctuary-foreground/10 text-sanctuary-foreground' : 'bg-primary/10 text-accent',
        className
      )}
    >
      <Icon name={name} className={size === 'lg' ? 'w-7 h-7' : 'w-5 h-5'} />
    </span>
  );
}

/** Small neutral tag. @param {{ className?: string, children?: React.ReactNode }} props */
export function Tag({ className, children }) {
  const dark = useIsDark();
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border',
        dark ? 'bg-sanctuary-foreground/10 text-sanctuary-foreground border-sanctuary-foreground/20' : 'bg-muted text-foreground border-transparent',
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * Status pill with an icon and a text label, never colour alone.
 * @param {{ kind: 'open'|'closed'|'unknown'|'past'|'soon'|'recruiting'|'active', label?: string, className?: string }} props
 */
export function StatusPill({ kind, label, className }) {
  const dark = useIsDark();
  const MAP = {
    open: { text: 'הרשמה פתוחה', icon: CheckCircle2, tone: 'success' },
    recruiting: { text: 'מגייס משתתפים', icon: CheckCircle2, tone: 'success' },
    active: { text: 'פעיל', icon: Clock, tone: 'neutral' },
    unknown: { text: 'פרטים בפנייה', icon: Clock, tone: 'neutral' },
    soon: { text: 'בקרוב', icon: Clock, tone: 'neutral' },
    closed: { text: 'הרשמה סגורה', icon: Lock, tone: 'quiet' },
    past: { text: 'התקיים', icon: Lock, tone: 'quiet' },
  };
  const m = MAP[kind] || MAP.unknown;
  const I = m.icon;
  const tone =
    m.tone === 'success'
      ? 'bg-success text-success-foreground border-success'
      : dark
        ? m.tone === 'neutral'
          ? 'bg-sanctuary-foreground text-sanctuary border-sanctuary-foreground'
          : 'bg-transparent text-sanctuary-foreground/85 border-sanctuary-foreground/30'
        : m.tone === 'neutral'
          ? 'bg-muted text-foreground border-border'
          : 'bg-card text-card-foreground border-border';
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap', tone, className)}>
      <I className="w-3.5 h-3.5" aria-hidden="true" />
      {label || m.text}
    </span>
  );
}

/** Registration status of a course or run -> StatusPill kind. */
export function regKind(status, isPast) {
  if (status === 'open' && !isPast) return 'open';
  if (status === 'closed' || isPast) return 'closed';
  return 'unknown';
}

/**
 * Disclosure that adapts to the area. The shared pattern is styled for light
 * surfaces; on the dark area its chrome is overridden to stay readable.
 * @param {{ label: React.ReactNode, leading?: React.ReactNode, defaultOpen?: boolean, size?: 'tight'|'compact'|'default', className?: string, children?: React.ReactNode }} props
 */
export function AreaDisclosure({ label, leading, defaultOpen, size = 'compact', className, children }) {
  const dark = useIsDark();
  if (!dark) {
    return (
      <Disclosure label={label} leading={leading} defaultOpen={defaultOpen} size={size} variant="soft" className={className}>
        {children}
      </Disclosure>
    );
  }
  return (
    <Disclosure
      label={label}
      leading={leading}
      defaultOpen={defaultOpen}
      size={size}
      variant="soft"
      className={cn('bg-sanctuary-foreground/[0.06] border-sanctuary-foreground/15 hover:bg-sanctuary-foreground/[0.1]', className)}
      triggerClassName={cn('rounded-2xl', FOCUS_DARK)}
      labelClassName="text-sanctuary-foreground"
      chevronClassName="text-sanctuary-foreground"
      panelClassName="text-sanctuary-foreground/90"
    >
      {children}
    </Disclosure>
  );
}

/** Text link with arrow. @param {{ to: string, children?: React.ReactNode, className?: string }} props */
export function ArrowLink({ to, children, className }) {
  const dark = useIsDark();
  const external = /^https?:/.test(to);
  const cls = cn(
    'inline-flex items-center gap-1.5 font-semibold underline-offset-4 hover:underline rounded-md',
    dark ? cn('text-sanctuary-foreground', FOCUS_DARK) : cn('text-accent', FOCUS_LIGHT),
    className
  );
  if (external) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
        <ExternalLink className="w-4 h-4" aria-hidden="true" />
      </a>
    );
  }
  return (
    <DemoLink to={to} className={cls}>
      {children}
      <ArrowLeft className="w-4 h-4" aria-hidden="true" />
    </DemoLink>
  );
}

/**
 * Definition row used in fact panels.
 * @param {{ label: React.ReactNode, children?: React.ReactNode, icon?: string }} props
 */
export function Fact({ label, children, icon }) {
  const dark = useIsDark();
  if (!children) return null;
  return (
    <div className={cn('flex gap-3 py-3 border-b last:border-b-0', dark ? 'border-sanctuary-foreground/10' : 'border-border')}>
      {icon && <Icon name={icon} className={cn('w-5 h-5 mt-0.5 flex-shrink-0', dark ? 'text-sanctuary-foreground/75' : 'text-accent')} />}
      <div className="min-w-0">
        <dt className={cn('text-xs font-semibold mb-0.5', dark ? 'text-sanctuary-foreground/75' : 'text-card-foreground')}>{label}</dt>
        <dd className={cn('text-sm leading-relaxed', dark ? 'text-sanctuary-foreground' : 'text-foreground')}>{children}</dd>
      </div>
    </div>
  );
}

/**
 * The "other door": a small card in the colour of the other area, so crossing
 * over is always one tap away (survivors who are also therapists).
 * @param {{ to: string, target: 'patient'|'pro', title: string, text: string, className?: string }} props
 */
export function DoorCard({ to, target, title, text, className }) {
  const toPatient = target === 'patient';
  return (
    <DemoLink
      to={to}
      className={cn(
        'group flex items-center gap-4 rounded-super-sm border p-5 transition-all duration-300 motion-reduce:transition-none',
        toPatient
          ? cn('bg-card text-foreground border-border hover:shadow-card-hover', FOCUS_DARK)
          : cn('bg-sanctuary text-sanctuary-foreground border-sanctuary hover:bg-accent', FOCUS_LIGHT),
        className
      )}
    >
      <span
        className={cn(
          'inline-flex w-12 h-12 rounded-2xl items-center justify-center flex-shrink-0',
          toPatient ? 'bg-primary/10 text-accent' : 'bg-sanctuary-foreground/10 text-sanctuary-foreground'
        )}
      >
        <Icon name={toPatient ? 'HeartHandshake' : 'GraduationCap'} className="w-6 h-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-heading font-semibold text-lg leading-snug">{title}</span>
        <span className={cn('block text-sm leading-relaxed', toPatient ? 'text-card-foreground' : 'text-sanctuary-foreground/80')}>{text}</span>
      </span>
      <ArrowLeft className="w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
    </DemoLink>
  );
}

/**
 * Plain text with bare URLs and emails turned into links.
 * @param {{ text?: string }} props
 */
export function Linkify({ text }) {
  const dark = useIsDark();
  if (!text) return null;
  const parts = String(text).split(/(https?:\/\/[^\s)]+|[\w.+-]+@[\w-]+\.[\w.]+)/g);
  const cls = cn('underline underline-offset-2 font-semibold break-all rounded', dark ? cn('text-sanctuary-foreground', FOCUS_DARK) : cn('text-accent', FOCUS_LIGHT));
  return (
    <>
      {parts.map((p, i) => {
        if (/^https?:\/\//.test(p)) {
          return (
            <a key={i} href={p} target="_blank" rel="noopener noreferrer" className={cls} dir="ltr">
              {p.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
            </a>
          );
        }
        if (/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(p)) {
          return (
            <a key={i} href={`mailto:${p}`} className={cls} dir="ltr">
              {p}
            </a>
          );
        }
        return <React.Fragment key={i}>{p}</React.Fragment>;
      })}
    </>
  );
}

/** Initials avatar. @param {{ name: string, className?: string }} props */
export function Avatar({ name, className }) {
  const dark = useIsDark();
  const initials = name
    .replace(/(ד"ר|פרופ'|דר')\s*/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex w-12 h-12 rounded-full items-center justify-center font-heading font-semibold text-lg flex-shrink-0',
        dark ? 'bg-sanctuary-foreground text-sanctuary' : 'bg-primary/15 text-foreground',
        className
      )}
    >
      {initials}
    </span>
  );
}

/** Empty state. @param {{ title: string, text?: string, action?: React.ReactNode }} props */
export function EmptyState({ title, text, action }) {
  const dark = useIsDark();
  return (
    <div
      className={cn(
        'rounded-super-sm border border-dashed p-10 text-center',
        dark ? 'border-sanctuary-foreground/25 text-sanctuary-foreground' : 'border-border text-foreground bg-card'
      )}
      role="status"
    >
      <Icon name="SearchX" className={cn('w-8 h-8 mx-auto mb-3', dark ? 'text-sanctuary-foreground/75' : 'text-accent')} />
      <p className="font-heading font-semibold text-lg">{title}</p>
      {text && <p className={cn('mt-1 text-sm', dark ? 'text-sanctuary-foreground/75' : 'text-card-foreground')}>{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/**
 * Extra classes for a ChoiceChip so it reads correctly on either ground.
 * @param {boolean} selected
 * @param {boolean} dark
 */
export function chipClass(selected, dark) {
  if (dark) {
    return selected
      ? cn('bg-sanctuary-foreground text-sanctuary border-sanctuary-foreground', FOCUS_DARK)
      : cn('bg-transparent text-sanctuary-foreground border-sanctuary-foreground/30 hover:bg-sanctuary-foreground/10', FOCUS_DARK);
  }
  return selected ? FOCUS_LIGHT : cn('hover:border-primary/50', FOCUS_LIGHT);
}
