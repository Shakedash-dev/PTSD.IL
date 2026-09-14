import React from 'react';
import * as Icons from 'lucide-react';
import { ExternalLink, Phone, Mail, MessageCircle } from 'lucide-react';
import { DemoLink, DemoMarkdown } from '@/pages/metiv-demos/shared/DemoChrome';
import { mapLegacyMarkdown, mapLegacyPath } from './paths';
import { CONSULTATION, ERAN_PHONE, ERAN_WHATSAPP } from './additions';
import { tx } from './copy';

/**
 * Markdown from the snapshot: old-site links ("/rights") are mapped onto the
 * demo IA, then DemoMarkdown keeps them inside the current version.
 * @param {{ className?: string, children?: string }} props
 */
export function KitMarkdown({ className, children }) {
  if (!children) return null;
  return <DemoMarkdown className={className}>{mapLegacyMarkdown(children)}</DemoMarkdown>;
}

/**
 * Internal paths go through DemoLink, everything else opens in a new tab.
 * @param {{ href: string, className?: string, children?: React.ReactNode, 'aria-label'?: string }} props
 */
export function SmartLink({ href, className, children, ...rest }) {
  if (href?.startsWith('/') && !href.startsWith('//')) {
    return <DemoLink to={mapLegacyPath(href)} className={className} {...rest}>{children}</DemoLink>;
  }
  if (href?.startsWith('tel:') || href?.startsWith('mailto:')) {
    return <a href={href} className={className} {...rest}>{children}</a>;
  }
  return <a href={href} target="_blank" rel="noopener noreferrer" className={className} {...rest}>{children}</a>;
}

/**
 * Lucide icon by name, or nothing.
 * @param {{ name?: string, className?: string }} props
 */
export function NamedIcon({ name, className }) {
  const Icon = name ? /** @type {Record<string, any>} */ (Icons)[name] : null;
  return Icon ? <Icon className={className} aria-hidden="true" /> : null;
}

const CHIP = 'inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-foreground rounded-full text-sm font-medium hover:bg-primary/20 transition-colors duration-300';

/** @param {{ contacts: import('./additions').Contact[] }} props */
export function ContactList({ contacts }) {
  if (!contacts?.length) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {contacts.map((c, i) => (
        <li key={`${c.kind}-${i}`}>
          {c.kind === 'phone' && (
            <a href={`tel:${(c.value || '').replace(/[^\d*+]/g, '')}`} className={CHIP}>
              <Phone className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{c.label}: <span dir="ltr">{c.value}</span></span>
            </a>
          )}
          {c.kind === 'email' && (
            <a href={`mailto:${c.value}`} className={CHIP}>
              <Mail className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{c.label}: <span dir="ltr">{c.value}</span></span>
            </a>
          )}
          {c.kind === 'link' && (
            <SmartLink href={c.href} className={CHIP}>
              {c.label}
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </SmartLink>
          )}
          {c.kind === 'internal' && (
            <DemoLink to={c.href} className={CHIP}>
              {c.label}
            </DemoLink>
          )}
          {c.kind === 'text' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted text-foreground rounded-full text-sm">
              {c.label}: <span dir="ltr">{c.value}</span>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

const FIELD_LABELS = [
  ['who', 'למי מיועד'],
  ['ages', 'גילאים'],
  ['what', 'מה כולל'],
  ['location', 'מיקום'],
  ['cost', 'עלות ומימון'],
  ['process', 'איך פונים ומה קורה אחר כך'],
];

/**
 * One provider / programme, always in the same format so no entry reads as
 * more prominent than another.
 * @param {{ entry: import('./additions').Entry }} props
 */
export function EntryCard({ entry }) {
  return (
    <article
      id={entry.id}
      className="scroll-mt-24 bg-card rounded-super border border-border p-6 shadow-card flex flex-col gap-4"
    >
      <header className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <NamedIcon name={entry.icon} className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h3 className="font-heading font-semibold text-lg text-foreground leading-snug">{entry.title}</h3>
          {entry.provider && <p className="text-sm text-muted-foreground">{entry.provider}</p>}
        </div>
      </header>

      <dl className="space-y-3">
        {FIELD_LABELS.filter(([key]) => entry[key]).map(([key, label]) => (
          <div key={key}>
            <dt className="text-xs font-semibold text-primary tracking-wide mb-0.5">{label}</dt>
            <dd className="text-sm text-card-foreground leading-relaxed">{entry[key]}</dd>
          </div>
        ))}
      </dl>

      {entry.note && (
        <p className="text-sm text-foreground bg-muted/60 rounded-lg p-3 leading-relaxed">{entry.note}</p>
      )}

      {entry.contacts?.length > 0 && (
        <div className="mt-auto">
          <p className="text-xs font-semibold text-primary tracking-wide mb-2">יצירת קשר</p>
          <ContactList contacts={entry.contacts} />
        </div>
      )}
    </article>
  );
}

/**
 * A titled group of entries.
 * @param {{ id?: string, title: string, intro?: string, entries: import('./additions').Entry[], className?: string }} props
 */
export function EntrySection({ id, title, intro, entries, className = '' }) {
  return (
    <section id={id} className={`scroll-mt-24 ${className}`}>
      <h2 className="font-heading font-semibold text-2xl text-foreground mb-2">{title}</h2>
      {intro && <p className="text-muted-foreground leading-relaxed mb-6">{intro}</p>}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-5 ${intro ? '' : 'mt-4'}`}>
        {entries.map((entry) => (
          <EntryCard key={entry.id} entry={entry} />
        ))}
      </div>
    </section>
  );
}

/** ער"ן 1201 phone + WhatsApp. */
export function CrisisLines({ className = '' }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-sm font-semibold text-foreground">{tx('footer_emergency_heading')}</span>
      <a href={`tel:${ERAN_PHONE}`} className={CHIP}>
        <Phone className="w-4 h-4" aria-hidden="true" />
        {ERAN_PHONE}
      </a>
      <a href={ERAN_WHATSAPP} target="_blank" rel="noopener noreferrer" className={CHIP}>
        <MessageCircle className="w-4 h-4" aria-hidden="true" />
        WhatsApp
      </a>
    </div>
  );
}

/**
 * Suggestion 8: the "not sure whether to reach out" consultation offer.
 * `asAnchor` renders the id="consultation" target; elsewhere it links to it.
 * @param {{ asAnchor?: boolean, className?: string }} props
 */
export function ConsultationBlock({ asAnchor = false, className = '' }) {
  return (
    <section
      id={asAnchor ? CONSULTATION.id : undefined}
      className={`scroll-mt-24 bg-primary/5 border border-primary/20 rounded-super p-6 ${className}`}
    >
      <h2 className="font-heading font-semibold text-xl text-foreground mb-2">{CONSULTATION.title}</h2>
      <p className="text-foreground leading-relaxed mb-4">{CONSULTATION.text}</p>
      <div className="flex flex-wrap gap-2">
        <a href={`tel:${CONSULTATION.phone.replace(/\D/g, '')}`} className={CHIP}>
          <Phone className="w-4 h-4" aria-hidden="true" />
          <span>מטיב: <span dir="ltr">{CONSULTATION.phone}</span></span>
        </a>
        {!asAnchor && (
          <DemoLink to={CONSULTATION.route} className={CHIP}>
            {CONSULTATION.linkLabel}
          </DemoLink>
        )}
      </div>
    </section>
  );
}
