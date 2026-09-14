import React from 'react';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IMAGES } from '@/lib/images';
import { PATIENT_HUB } from '@/pages/metiv-demos/shared/patient';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { ORG } from '@/pages/metiv-demos/shared/therapist';
import { PageHeaderV1 } from '../components/Chrome';
import { DoorsCompact } from '../components/Doors';
import { ArrowLink, Chapter, ChapterHead, FOCUS, useV1Title } from '../components/primitives';
import { telHref, whatsappHref } from '../lib';

const PHONES = [
  { key: 'main', label: 'מרכזייה ומרפאת המבוגרים', value: ORG.phones.main },
  { key: 'kids', label: 'מטיב ילדים', value: ORG.phones.kids },
  { key: 'footer', label: 'משרדי מטיב', value: ORG.phones.footer },
  { key: 'accessibility', label: 'רכז נגישות', value: ORG.phones.accessibilityCoordinator },
  { key: 'fax', label: 'פקס', value: ORG.phones.fax, noLink: true },
];

const WHATSAPP = [
  { key: 'courses', label: 'שאלות על קורסים', value: ORG.phones.coursesWhatsapp },
  { key: 'research', label: 'השתתפות במחקרים', value: ORG.phones.researchWhatsapp },
];

const EMAILS = [
  { key: 'general', label: 'פניות כלליות', value: ORG.emails.general },
  { key: 'kids', label: 'מטיב ילדים', value: ORG.emails.kids },
  { key: 'courses', label: 'קורסים והרשמה', value: ORG.emails.courses },
  { key: 'registration', label: 'הכשרות ילדים ומשפחה', value: ORG.emails.registration },
  { key: 'research', label: 'מחקר', value: ORG.emails.research },
  { key: 'partnerships', label: 'שותפויות ותרומות', value: ORG.emails.partnerships },
];

const FORMS = [
  { key: 'adults', label: 'טופס פנייה למרפאת המבוגרים', url: ORG.adultsClinicFormUrl },
  { key: 'kids', label: 'טופס פנייה למטיב ילדים', url: ORG.kidsClinicFormUrl },
  { key: 'trainings', label: 'טופס פנייה להכשרה או הדרכה', url: ORG.trainingsFormUrl },
];

const SOCIAL = [
  { key: 'facebook', label: 'פייסבוק', url: ORG.social.facebook },
  { key: 'facebookKids', label: 'פייסבוק מטיב ילדים', url: ORG.social.facebookKids },
  { key: 'youtube', label: 'יוטיוב', url: ORG.social.youtube },
];

/** @param {{ title: string, children: React.ReactNode }} props */
function Block({ title, children }) {
  return (
    <div className="border-t border-border pt-5">
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

const ROW = 'flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border py-3';
const VALUE = cn('rounded-sm text-foreground underline-offset-4 hover:text-primary hover:underline', FOCUS);

export default function Contact() {
  useV1Title('צור קשר');
  const [eran, whatsapp] = PATIENT_HUB.crisisLines;

  return (
    <>
      <PageHeaderV1
        size="editorial"
        align="start"
        tone="canvas"
        eyebrow="צור קשר"
        title="צור קשר"
        subtitle="פרטי הפנייה למטיב. לשירותי טיפול אפשר לפנות ישירות למרפאות, בטלפון או בטופס."
        image={IMAGES.calming_breathing}
      />

      <Chapter rule={false}>
        <div className="grid gap-6 rounded-super bg-sanctuary p-8 text-sanctuary-foreground md:grid-cols-12 md:p-12">
          <div className="md:col-span-7">
            <p className="text-xs font-semibold tracking-wide text-sanctuary-foreground/80">אם צריך לדבר עם מישהו עכשיו</p>
            <p className="mt-3 font-heading text-3xl font-light leading-tight md:text-4xl">ער&quot;ן, קו לעזרה ראשונה נפשית, זמין בכל שעה</p>
          </div>
          <div className="flex flex-wrap items-end gap-6 md:col-span-5 md:justify-end">
            <a href={eran.href} className={cn('rounded-sm font-heading text-6xl font-light tabular-nums', FOCUS)}>{eran.value}</a>
            <a href={whatsapp.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 pb-2 underline underline-offset-4">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {whatsapp.label}
            </a>
          </div>
        </div>
      </Chapter>

      <Chapter rule={false} className="pt-0 md:pt-0">
        <ChapterHead label="מטיב" title="פרטי ההתקשרות" />
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-10">
            <Block title="כתובת">
              <p className="text-lg text-foreground">{ORG.address}</p>
              <p className="mt-1 text-muted-foreground">{ORG.mail}</p>
            </Block>
            <Block title="טפסי פנייה">
              <ul className="space-y-3">
                {FORMS.map((f) => (
                  <li key={f.key}><ArrowLink to={f.url}>{f.label}</ArrowLink></li>
                ))}
              </ul>
            </Block>
          </div>
          <div className="space-y-10">
            <Block title="טלפונים">
              <ul>
                {PHONES.map((p) => (
                  <li key={p.key} className={ROW}>
                    <span className="text-muted-foreground">{p.label}</span>
                    {p.noLink ? <span dir="ltr" className="text-foreground">{p.value}</span> : <a href={telHref(p.value)} dir="ltr" className={VALUE}>{p.value}</a>}
                  </li>
                ))}
              </ul>
            </Block>
            <Block title="וואטסאפ">
              <ul>
                {WHATSAPP.map((p) => (
                  <li key={p.key} className={ROW}>
                    <span className="text-muted-foreground">{p.label}</span>
                    <a href={whatsappHref(p.value)} target="_blank" rel="noreferrer" dir="ltr" className={VALUE}>{p.value}</a>
                  </li>
                ))}
              </ul>
            </Block>
          </div>
          <div className="space-y-10">
            <Block title="דואר אלקטרוני">
              <ul>
                {EMAILS.map((e) => (
                  <li key={e.key} className={ROW}>
                    <span className="text-muted-foreground">{e.label}</span>
                    <a href={`mailto:${e.value}`} dir="ltr" className={VALUE}>{e.value}</a>
                  </li>
                ))}
              </ul>
            </Block>
            <Block title="ברשתות">
              <ul className="space-y-3">
                {SOCIAL.map((s) => (
                  <li key={s.key}><ArrowLink to={s.url}>{s.label}</ArrowLink></li>
                ))}
              </ul>
            </Block>
          </div>
        </div>
        <p className="mt-12 text-sm text-muted-foreground">
          מחפשים מסגרת טיפול? <ArrowLink to={ROUTES.whereToGetHelp} className="text-sm">איפה אפשר לקבל טיפול</ArrowLink>
        </p>
      </Chapter>

      <DoorsCompact />
    </>
  );
}
