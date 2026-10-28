import React from 'react';
import * as Icons from 'lucide-react';
import { ExternalLink, Phone, Mail, MessageCircle } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { mapLegacyPath } from '@/pages/metiv-demos/shared/patient/paths';
import { useCopy, useMetiv } from '../content/MetivContent';
import { V3_ROUTES } from '../meta';

// Metiv demo (V3): copies of the shared patient-kit pieces (shared/patient/
// components.jsx) that carried Hebrew labels or read the static additions. Same
// markup; the labels come from the `patientKit` copy namespace and the data
// from useMetiv(), so they follow the visitor's language.

/**
 * @typedef {{ kind: 'phone'|'email'|'link'|'internal'|'text', label: string, value?: string, href?: string }} Contact
 * @typedef {{ id: string, title: string, provider?: string, icon?: string, who?: string, ages?: string, what?: string, location?: string, cost?: string, process?: string, note?: string, contacts?: Contact[] }} Entry
 */

/** Anchors of the Metiv additions inside the PTSD-IL pages (ids, not text). */
export const PATIENT_ANCHORS = {
  veterans: 'veterans',
  parentChildGroups: 'parent-child-groups',
  reservistFamilies: 'reservist-families',
  metivBooks: 'metiv-books',
};

/**
 * Sends the מסע שחרור entry to the programme's own page (owner feedback): a
 * link to that page leads its contacts.
 * @returns {(entries: Entry[]) => Entry[]}
 */
export function useWithReleaseJourneyPage() {
  const c = useCopy('patientKit');
  return (entries) => entries.map((e) => (
    e.id === 'release-journey'
      ? { ...e, contacts: [{ kind: 'internal', label: c.releaseJourneyPageLink, href: V3_ROUTES.releaseJourney }, ...(e.contacts || [])] }
      : e
  ));
}

/**
 * Internal paths go through DemoLink, everything else opens in a new tab.
 * @param {{ href: string, className?: string, children?: React.ReactNode, 'aria-label'?: string }} props
 */
function SmartLink({ href, className, children, ...rest }) {
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
function NamedIcon({ name, className }) {
  const Icon = name ? /** @type {Record<string, any>} */ (Icons)[name] : null;
  return Icon ? <Icon className={className} aria-hidden="true" /> : null;
}

const CHIP = 'inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-foreground rounded-full text-sm font-medium hover:bg-primary/20 transition-colors duration-300';

/** @param {{ contacts?: Contact[] }} props */
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
            <SmartLink href={c.href || ''} className={CHIP}>
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

/** Entry fields in display order, with their `patientKit` label keys. */
const FIELDS = /** @type {const} */ ([
  ['who', 'fieldWho'],
  ['ages', 'fieldAges'],
  ['what', 'fieldWhat'],
  ['location', 'fieldLocation'],
  ['cost', 'fieldCost'],
  ['process', 'fieldProcess'],
]);

/**
 * One provider / programme, always in the same format so no entry reads as
 * more prominent than another.
 * @param {{ entry: Entry }} props
 */
export function EntryCard({ entry }) {
  const c = useCopy('patientKit');
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
        {FIELDS.filter(([key]) => entry[key]).map(([key, labelKey]) => (
          <div key={key}>
            <dt className="text-xs font-semibold text-primary tracking-wide mb-0.5">{c[labelKey]}</dt>
            <dd className="text-sm text-card-foreground leading-relaxed">{entry[key]}</dd>
          </div>
        ))}
      </dl>

      {entry.note && (
        <p className="text-sm text-foreground bg-muted/60 rounded-lg p-3 leading-relaxed">{entry.note}</p>
      )}

      {(entry.contacts?.length ?? 0) > 0 && (
        <div className="mt-auto">
          <p className="text-xs font-semibold text-primary tracking-wide mb-2">{c.contactHeading}</p>
          <ContactList contacts={entry.contacts} />
        </div>
      )}
    </article>
  );
}

/**
 * A titled group of entries.
 * @param {{ id?: string, title: string, intro?: string, entries: Entry[], className?: string }} props
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

/** The crisis line (ער"ן) phone + WhatsApp. @param {{ className?: string }} props */
export function CrisisLines({ className = '' }) {
  const { lang } = useLang();
  const { ERAN_PHONE, ERAN_WHATSAPP } = useMetiv();
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-sm font-semibold text-foreground">{t(lang, 'footer_emergency_heading')}</span>
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
  const { CONSULTATION } = useMetiv();
  const c = useCopy('patientKit');
  return (
    <section
      id={asAnchor ? CONSULTATION.id : undefined}
      className={`scroll-mt-24 bg-primary/5 border border-primary/20 rounded-super p-6 ${className}`}
    >
      <h2 className="font-heading font-semibold text-xl text-foreground mb-2">{CONSULTATION.title}</h2>
      <p className="text-foreground leading-relaxed mb-4">{CONSULTATION.text}</p>
      <div className="flex flex-wrap gap-2">
        <a href={`tel:${(CONSULTATION.phone || '').replace(/\D/g, '')}`} className={CHIP}>
          <Phone className="w-4 h-4" aria-hidden="true" />
          <span>{c.consultationPhoneLabel}: <span dir="ltr">{CONSULTATION.phone}</span></span>
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
