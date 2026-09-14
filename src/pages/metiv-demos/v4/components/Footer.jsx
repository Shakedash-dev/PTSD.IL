import React from 'react';
import { Phone, MessageCircle, Mail, MapPin, ArrowLeft } from 'lucide-react';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { PATIENT_HUB } from '@/pages/metiv-demos/shared/patient';
import { ORG, ABOUT } from '@/pages/metiv-demos/shared/therapist';
import { LOGO } from './Header';
import { PATIENT_MENU, THERAPIST_MENU } from '../lib/nav';

const ERAN = PATIENT_HUB.crisisLines.find((l) => l.key === 'eranPhone');
const ERAN_WA = PATIENT_HUB.crisisLines.find((l) => l.key === 'eranWhatsapp');

const COLUMNS = [
  { title: 'למתמודדים ולמשפחות', links: [{ label: 'לעמוד הראשי', route: ROUTES.patient }, ...PATIENT_MENU.flatMap((g) => g.links).slice(0, 7)] },
  { title: 'לאנשי מקצוע', links: [{ label: 'לעמוד הראשי', route: ROUTES.therapist }, ...THERAPIST_MENU.flatMap((g) => g.links)] },
  {
    title: 'מטיב',
    links: [
      { label: ABOUT.title, route: ROUTES.about },
      { label: 'יצירת קשר', route: ROUTES.contact },
      { label: 'תרומה', route: ROUTES.donate },
      { label: 'הצהרת נגישות', route: ROUTES.accessibility },
      { label: 'מדיניות פרטיות', route: ROUTES.privacy },
      { label: 'תנאי שימוש', route: ROUTES.terms },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-auto bg-sanctuary text-sanctuary-foreground">
      {/* Area switch, repeated at the foot of every page */}
      <div className="border-b border-sanctuary-foreground/15">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 py-6 sm:grid-cols-2 sm:px-6">
          <DemoLink to={ROUTES.patient} className="group flex items-center justify-between gap-4 rounded-super-sm bg-card px-5 py-4 text-foreground hover:bg-muted">
            <span className="flex items-center gap-3">
              <span aria-hidden="true" className="h-8 w-1 rounded-full bg-secondary" />
              <span>
                <span className="block text-sm text-muted-foreground">אזור</span>
                <span className="block font-heading text-lg font-semibold">למתמודדים עם טראומה ולבני משפחה</span>
              </span>
            </span>
            <ArrowLeft aria-hidden="true" className="w-5 h-5 shrink-0 text-primary transition-transform group-hover:-translate-x-1" />
          </DemoLink>
          <DemoLink to={ROUTES.therapist} className="group flex items-center justify-between gap-4 rounded-super-sm bg-card px-5 py-4 text-foreground hover:bg-muted">
            <span className="flex items-center gap-3">
              <span aria-hidden="true" className="h-8 w-1 rounded-full bg-primary" />
              <span>
                <span className="block text-sm text-muted-foreground">אזור</span>
                <span className="block font-heading text-lg font-semibold">לאנשי טיפול ומקצוע</span>
              </span>
            </span>
            <ArrowLeft aria-hidden="true" className="w-5 h-5 shrink-0 text-primary transition-transform group-hover:-translate-x-1" />
          </DemoLink>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <span className="inline-block rounded-xl bg-card px-3 py-2">
            <img src={LOGO} alt="מטיב" className="h-10 w-auto" />
          </span>
          <p className="mt-4 font-heading text-lg font-semibold">{ORG.name}</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-start gap-2"><MapPin aria-hidden="true" className="mt-1 w-4 h-4 shrink-0" /> {ORG.address}</li>
            <li className="flex items-center gap-2"><Phone aria-hidden="true" className="w-4 h-4 shrink-0" /> <a href={`tel:${ORG.phones.main}`} dir="ltr" className="hover:underline">{ORG.phones.main}</a></li>
            <li className="flex items-center gap-2"><Mail aria-hidden="true" className="w-4 h-4 shrink-0" /> <a href={`mailto:${ORG.emails.general}`} className="hover:underline">{ORG.emails.general}</a></li>
          </ul>

          <div className="mt-6 rounded-super-sm border border-sanctuary-foreground/25 p-4">
            <p className="text-sm opacity-85">עזרה נפשית מיידית, בכל שעה</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
              <a href={ERAN?.href} className="inline-flex items-center gap-2 font-heading text-2xl font-semibold hover:underline">
                <Phone aria-hidden="true" className="w-5 h-5" /> {'ער"ן'} {ERAN?.value}
              </a>
              <a href={ERAN_WA?.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm hover:underline">
                <MessageCircle aria-hidden="true" className="w-4 h-4" /> {ERAN_WA?.label}
              </a>
            </div>
          </div>
        </div>

        <nav aria-label="מפת האתר" className="grid gap-8 sm:grid-cols-3 lg:col-span-8">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="mb-3 font-heading font-semibold">{col.title}</p>
              <ul className="space-y-2 text-sm">
                {col.links.map((l) => (
                  <li key={l.route + l.label}>
                    <DemoLink to={l.route} className="opacity-85 hover:opacity-100 hover:underline underline-offset-4">{l.label}</DemoLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-sanctuary-foreground/15">
        <div className="mx-auto max-w-7xl space-y-2 px-4 py-5 text-xs leading-relaxed sm:px-6">
          <p className="opacity-85">{PATIENT_HUB.disclaimer}</p>
          <p className="opacity-85">
            © {ORG.legalName} · {ORG.legalEntity} · אתר הדגמה, לא לפרסום
          </p>
        </div>
      </div>
    </footer>
  );
}
