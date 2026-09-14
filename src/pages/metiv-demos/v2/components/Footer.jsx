import React from 'react';
import { Phone, Mail, MapPin, ArrowLeftRight } from 'lucide-react';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { PATIENT_HUB } from '@/pages/metiv-demos/shared/patient';
import { ORG } from '@/pages/metiv-demos/shared/therapist';
import { cn } from '@/lib/utils';
import { AREA_LABELS, ERAN_PHONE, FOCUS_DARK, FOCUS_LIGHT, LOGO, telHref } from '../lib';
import { PATIENT_TABS, PRO_TABS } from './nav';

const PATIENT_FOOTER = [
  ...PATIENT_TABS.filter((t) => t.key !== 'patient'),
  { key: 'rights', label: 'זכויות', route: ROUTES.rights },
  { key: 'treatment', label: 'המסע הטיפולי', route: ROUTES.treatment },
];

/** Two halves: light for patients, dark for professionals, then a shared legal row. */
export default function Footer({ area }) {
  return (
    <footer className="mt-auto">
      <div className="grid lg:grid-cols-2">
        <section
          aria-labelledby="v2-footer-patient"
          className={cn('bg-card text-foreground border-t border-border px-4 sm:px-8 py-12', area === 'pro' ? 'order-2 lg:order-none' : '')}
        >
          <div className="lg:max-w-xl lg:ms-auto">
            <h2 id="v2-footer-patient" className="font-heading font-semibold text-xl mb-4">
              <DemoLink to={ROUTES.patient} className={cn('hover:underline underline-offset-4 rounded', FOCUS_LIGHT)}>
                {AREA_LABELS.patient.full}
              </DemoLink>
            </h2>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {PATIENT_FOOTER.map((l) => (
                <li key={l.key}>
                  <DemoLink to={l.route} className={cn('text-card-foreground hover:text-foreground hover:underline underline-offset-4 rounded', FOCUS_LIGHT)}>
                    {l.label}
                  </DemoLink>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-card-foreground leading-relaxed">
              במצב חירום נפשי: ער&quot;ן{' '}
              <a href={telHref(ERAN_PHONE)} className={cn('font-semibold text-foreground underline underline-offset-4 rounded', FOCUS_LIGHT)}>
                {ERAN_PHONE}
              </a>
              . במצב חירום רפואי: 101.
            </p>
          </div>
        </section>
        <section aria-labelledby="v2-footer-pro" className="bg-sanctuary text-sanctuary-foreground px-4 sm:px-8 py-12">
          <div className="lg:max-w-xl">
            <h2 id="v2-footer-pro" className="font-heading font-semibold text-xl mb-4">
              <DemoLink to={ROUTES.therapist} className={cn('hover:underline underline-offset-4 rounded', FOCUS_DARK)}>
                {AREA_LABELS.pro.full}
              </DemoLink>
            </h2>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {PRO_TABS.filter((t) => t.key !== 'therapist').map((l) => (
                <li key={l.key}>
                  <DemoLink to={l.route} className={cn('text-sanctuary-foreground/85 hover:text-sanctuary-foreground hover:underline underline-offset-4 rounded', FOCUS_DARK)}>
                    {l.label}
                  </DemoLink>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-sanctuary-foreground/80 flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              גם וגם? אפשר לעבור בין האזורים בכל רגע, מהמתג שבראש העמוד.
            </p>
          </div>
        </section>
      </div>

      <div className="bg-muted text-foreground border-t border-border pb-20 lg:pb-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 py-8 grid gap-6 lg:grid-cols-[auto_1fr_auto] items-start">
          <img src={LOGO} alt="מטיב" className="h-10 w-auto" />
          <div className="text-sm text-muted-foreground space-y-1.5">
            <p className="font-semibold text-foreground">{ORG.name}</p>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4" aria-hidden="true" />
                {ORG.address}
              </span>
              <a href={telHref(ORG.phones.main)} className={cn('inline-flex items-center gap-1.5 hover:text-foreground rounded', FOCUS_LIGHT)}>
                <Phone className="w-4 h-4" aria-hidden="true" />
                <span dir="ltr">{ORG.phones.main}</span>
              </a>
              <a href={`mailto:${ORG.emails.general}`} className={cn('inline-flex items-center gap-1.5 hover:text-foreground rounded', FOCUS_LIGHT)}>
                <Mail className="w-4 h-4" aria-hidden="true" />
                {ORG.emails.general}
              </a>
            </p>
            <p>{PATIENT_HUB.disclaimer}</p>
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm lg:justify-end lg:max-w-xs">
            {[
              [ROUTES.about, 'אודות'],
              [ROUTES.contact, 'צור קשר'],
              [ROUTES.donate, 'תרומה'],
              [ROUTES.accessibility, 'הצהרת נגישות'],
              [ROUTES.privacy, 'מדיניות פרטיות'],
              [ROUTES.terms, 'תנאי שימוש'],
            ].map(([to, label]) => (
              <li key={to}>
                <DemoLink to={to} className={cn('text-foreground underline-offset-4 hover:underline rounded', FOCUS_LIGHT)}>
                  {label}
                </DemoLink>
              </li>
            ))}
          </ul>
        </div>
        <p className="mx-auto max-w-7xl px-4 sm:px-8 pb-6 text-xs text-muted-foreground">
          {ORG.legalEntity} · אתר הדגמה בלבד, נתונים סטטיים. לא לפרסום.
        </p>
      </div>
    </footer>
  );
}
