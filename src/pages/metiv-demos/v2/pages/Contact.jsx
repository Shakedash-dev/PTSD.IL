import React from 'react';
import { Phone, Mail, MessageCircle, ExternalLink, MapPin, Printer, Facebook, Youtube, Link2, LifeBuoy } from 'lucide-react';
import { useDemoChrome } from '@/pages/metiv-demos/shared/DemoChrome';
import { ORG } from '@/pages/metiv-demos/shared/therapist';
import { cn } from '@/lib/utils';
import { ERAN_PHONE, ERAN_WHATSAPP, FOCUS_LIGHT, telHref, whatsappHref } from '../lib';
import { Container, IconBadge, Panel, SectionTitle } from '../components/ui';
import { RepeatDoors } from './Landing';

const ROW = cn('flex items-center gap-2.5 rounded-xl px-3 py-2.5 -mx-3 text-foreground hover:bg-muted transition-colors duration-200', FOCUS_LIGHT);

/** @typedef {{ kind: 'phone'|'email'|'whatsapp'|'form'|'text', label: string, value: string }} Line */

/** @type {{ key: string, title: string, icon: string, text: string, lines: Line[] }[]} */
const DESKS = [
  {
    key: 'adults',
    title: 'מרפאת המבוגרים',
    icon: 'HeartHandshake',
    text: 'פנייה לטיפול לבני 17 ומעלה.',
    lines: [
      { kind: 'phone', label: 'טלפון', value: ORG.phones.main },
      { kind: 'form', label: 'טופס פנייה למרפאה', value: ORG.adultsClinicFormUrl },
    ],
  },
  {
    key: 'kids',
    title: 'מטיב ילדים',
    icon: 'Baby',
    text: 'טיפול בילדים עד גיל 18 והורים, קבוצות והדרכה בתחום הילדים.',
    lines: [
      { kind: 'phone', label: 'טלפון', value: ORG.phones.kids },
      { kind: 'email', label: 'מייל', value: ORG.emails.kids },
      { kind: 'form', label: 'טופס פנייה למטיב ילדים', value: ORG.kidsClinicFormUrl },
    ],
  },
  {
    key: 'courses',
    title: 'קורסים והכשרות',
    icon: 'GraduationCap',
    text: 'שאלות על קורסים, הרשמה והדרכה לארגונים.',
    lines: [
      { kind: 'email', label: 'מייל', value: ORG.emails.courses },
      { kind: 'whatsapp', label: 'וואטסאפ', value: ORG.phones.coursesWhatsapp },
      { kind: 'form', label: 'טופס פנייה להכשרה או הדרכה', value: ORG.trainingsFormUrl },
    ],
  },
  {
    key: 'research',
    title: 'מחקר',
    icon: 'Microscope',
    text: 'השתתפות במחקרים ושיתופי פעולה מחקריים.',
    lines: [
      { kind: 'email', label: 'מייל', value: ORG.emails.research },
      { kind: 'whatsapp', label: 'וואטסאפ', value: ORG.phones.researchWhatsapp },
    ],
  },
  {
    key: 'partners',
    title: 'שותפויות ותרומות',
    icon: 'Handshake',
    text: 'פיתוח ושיתופי פעולה.',
    lines: [{ kind: 'email', label: 'מייל', value: ORG.emails.partnerships }],
  },
  {
    key: 'general',
    title: 'פניות כלליות ונגישות',
    icon: 'Mail',
    text: 'כל נושא אחר, ורכז הנגישות של העמותה.',
    lines: [
      { kind: 'email', label: 'מייל כללי', value: ORG.emails.general },
      { kind: 'phone', label: 'רכז נגישות', value: ORG.phones.accessibilityCoordinator },
    ],
  },
];

function LineLink({ line }) {
  if (line.kind === 'phone') {
    return (
      <a href={telHref(line.value)} className={ROW}>
        <Phone className="w-4 h-4 text-accent" aria-hidden="true" />
        <span className="text-sm text-card-foreground">{line.label}</span>
        <span className="font-semibold ms-auto" dir="ltr">
          {line.value}
        </span>
      </a>
    );
  }
  if (line.kind === 'email') {
    return (
      <a href={`mailto:${line.value}`} className={ROW}>
        <Mail className="w-4 h-4 text-accent" aria-hidden="true" />
        <span className="text-sm text-card-foreground">{line.label}</span>
        <span className="font-semibold ms-auto" dir="ltr">
          {line.value}
        </span>
      </a>
    );
  }
  if (line.kind === 'whatsapp') {
    return (
      <a href={whatsappHref(line.value)} target="_blank" rel="noopener noreferrer" className={ROW}>
        <MessageCircle className="w-4 h-4 text-accent" aria-hidden="true" />
        <span className="text-sm text-card-foreground">{line.label}</span>
        <span className="font-semibold ms-auto" dir="ltr">
          {line.value}
        </span>
      </a>
    );
  }
  return (
    <a href={line.value} target="_blank" rel="noopener noreferrer" className={ROW}>
      <ExternalLink className="w-4 h-4 text-accent" aria-hidden="true" />
      <span className="font-semibold text-sm">{line.label}</span>
    </a>
  );
}

export default function Contact() {
  const { PageHeader } = useDemoChrome();
  return (
    <div className="bg-background">
      <PageHeader eyebrow="צור קשר" title="צור קשר עם מטיב" subtitle="טלפונים, מיילים וטפסי פנייה לפי נושא, כדי שהפנייה תגיע ישר לצוות הנכון." tone="card" />
      <Container className="py-12 space-y-10">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <section aria-labelledby="crisis" className="rounded-super-sm bg-primary text-primary-foreground p-6 sm:p-8 flex flex-wrap items-center gap-5 justify-between">
            <div className="flex items-center gap-4">
              <LifeBuoy className="w-10 h-10 flex-shrink-0" aria-hidden="true" />
              <div>
                <h2 id="crisis" className="font-heading font-semibold text-2xl">במצב חירום נפשי</h2>
                <p className="opacity-90">מטיב אינה מוקד חירום. ער&quot;ן, עזרה ראשונה נפשית, זמינים בכל שעה.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={telHref(ERAN_PHONE)} className={cn('inline-flex items-center gap-2 h-12 px-5 rounded-full bg-primary-foreground text-foreground font-semibold', FOCUS_LIGHT)}>
                <Phone className="w-4 h-4" aria-hidden="true" />
                {ERAN_PHONE}
              </a>
              <a href={ERAN_WHATSAPP} target="_blank" rel="noopener noreferrer" className={cn('inline-flex items-center gap-2 h-12 px-5 rounded-full border-2 border-primary-foreground/60 font-semibold', FOCUS_LIGHT)}>
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                וואטסאפ
              </a>
            </div>
          </section>
          <Panel className="p-6">
            <h2 className="font-heading font-semibold text-xl text-foreground mb-3">כתובת</h2>
            <p className="flex gap-2 text-foreground">
              <MapPin className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
              {ORG.address}
            </p>
            <p className="mt-2 text-sm text-card-foreground">דואר: {ORG.mail}</p>
            <p className="mt-1 text-sm text-card-foreground inline-flex items-center gap-1.5">
              <Printer className="w-4 h-4" aria-hidden="true" />
              פקס: <span dir="ltr">{ORG.phones.fax}</span>
            </p>
          </Panel>
        </div>

        <section aria-labelledby="desks">
          <SectionTitle id="desks" title="לפי נושא הפנייה" />
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {DESKS.map((d) => (
              <li key={d.key}>
                <Panel className="h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-2">
                    <IconBadge name={d.icon} />
                    <h3 className="font-heading font-semibold text-lg text-foreground">{d.title}</h3>
                  </div>
                  <p className="text-sm text-card-foreground mb-3">{d.text}</p>
                  <div className="mt-auto divide-y divide-border">
                    {d.lines.map((l) => (
                      <LineLink key={`${l.kind}-${l.value}`} line={l} />
                    ))}
                  </div>
                </Panel>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="social" className="flex flex-wrap items-center gap-3">
          <h2 id="social" className="font-heading font-semibold text-lg text-foreground me-2">
            מטיב ברשת
          </h2>
          {[
            { href: ORG.social.facebook, label: 'פייסבוק מטיב', icon: Facebook },
            { href: ORG.social.facebookKids, label: 'פייסבוק מטיב ילדים', icon: Facebook },
            { href: ORG.social.youtube, label: 'יוטיוב', icon: Youtube },
            { href: ORG.social.linktree, label: 'קישורי מטיב ילדים', icon: Link2 },
          ].map((s) => {
            const I = s.icon;
            return (
              <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" className={cn('inline-flex items-center gap-2 h-11 px-4 rounded-full bg-card border border-border text-sm font-medium text-foreground hover:border-primary', FOCUS_LIGHT)}>
                <I className="w-4 h-4 text-accent" aria-hidden="true" />
                {s.label}
              </a>
            );
          })}
        </section>
      </Container>
      <RepeatDoors />
    </div>
  );
}
