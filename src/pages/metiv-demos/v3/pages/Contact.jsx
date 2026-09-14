import React, { useState } from 'react';
import { Facebook, Mail, MapPin, Phone, Printer, Youtube } from 'lucide-react';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ORG, RESEARCH_INTRO, THERAPIST_HUB } from '@/pages/metiv-demos/shared/therapist';
import PageHeaderV3 from '../components/PageHeaderV3';
import { Band, ChipQuestion, ContactChips, ExternalLink, SectionHeading, TEXT_LINK } from '../components/kit';

const TOPICS = [
  {
    key: 'adults',
    label: 'טיפול למבוגרים',
    text: 'מרפאת המבוגרים של מטיב, לפונים בני 17 ומעלה.',
    contact: { phone: ORG.phones.main, email: ORG.emails.general },
    form: { label: 'טופס פנייה למרפאת המבוגרים', url: ORG.adultsClinicFormUrl },
    more: { label: 'על המרפאה באזור המטופלים', to: `${ROUTES.whereToGetHelp}#adults-clinic` },
  },
  {
    key: 'kids',
    label: 'טיפול בילדים ובהורים',
    text: 'מטיב ילדים: טיפול לילדים עד גיל 18 וקבוצות להורים.',
    contact: { phone: ORG.phones.kids, email: ORG.emails.kids },
    form: { label: 'טופס פנייה למטיב ילדים', url: ORG.kidsClinicFormUrl },
    more: { label: 'על מטיב ילדים באזור המטופלים', to: `${ROUTES.whereToGetHelp}#kids-clinic` },
  },
  {
    key: 'courses',
    label: 'קורסים והכשרות',
    text: 'שאלות על קורסים, הרשמה והדרכה לארגונים.',
    contact: { email: ORG.emails.courses, whatsapp: ORG.phones.coursesWhatsapp },
    form: { label: THERAPIST_HUB.cta.label, url: THERAPIST_HUB.cta.url },
    more: { label: 'לקורסים והכשרות', to: ROUTES.courses },
  },
  {
    key: 'research',
    label: 'מחקר',
    text: 'השתתפות במחקרים ושיתופי פעולה מחקריים.',
    contact: { ...RESEARCH_INTRO.collaborationContact, whatsapp: ORG.phones.researchWhatsapp },
    more: { label: 'למחקרים הפעילים', to: ROUTES.research },
  },
  {
    key: 'partners',
    label: 'שותפויות ותרומות',
    text: 'חיים לנדאו, אחראי פיתוח ושיתופי פעולה.',
    contact: { email: ORG.emails.partnerships },
    more: { label: 'לעמוד התרומה', to: ROUTES.donate },
  },
  {
    key: 'general',
    label: 'משהו אחר',
    text: 'לכל נושא אחר.',
    contact: { phone: ORG.phones.main, email: ORG.emails.general },
  },
];

export default function Contact() {
  const [topic, setTopic] = useState('');
  const chosen = TOPICS.find((t) => t.key === topic);

  return (
    <div className="bg-background">
      <PageHeaderV3
        tone="muted"
        eyebrow="יצירת קשר"
        title="למי כדאי לפנות?"
        subtitle="בוחרים נושא ומקבלים את הכתובת הנכונה. כל הפרטים מופיעים גם ברשימה המלאה."
        short={[]}
      />

      <Band tone="card" labelledBy="contact-q">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div>
            <SectionHeading id="contact-q" as="h2" title="במה מדובר?" className="mb-4" />
            <ChipQuestion legend="במה מדובר?" options={TOPICS} value={topic} onChange={setTopic} />
            <p className="mt-6 rounded-super-sm bg-muted p-4 text-foreground">
              לשיחה מיידית עם מישהו: <a href="tel:1201" className={TEXT_LINK}>ער"ן 1201</a>.
            </p>
          </div>
          <div aria-live="polite">
            {chosen ? (
              <div className="rounded-super bg-background border-2 border-primary/25 p-6 sm:p-8">
                <p className="font-heading font-semibold text-2xl text-foreground">{chosen.label}</p>
                <p className="mt-1 text-muted-foreground">{chosen.text}</p>
                <ContactChips contact={chosen.contact} className="mt-5" />
                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
                  {chosen.form && <ExternalLink href={chosen.form.url} className={TEXT_LINK}>{chosen.form.label}</ExternalLink>}
                  {chosen.more && <DemoLink to={chosen.more.to} className={TEXT_LINK}>{chosen.more.label}</DemoLink>}
                </div>
              </div>
            ) : (
              <div className="h-full rounded-super border-2 border-dashed border-border p-8 flex items-center justify-center text-center text-muted-foreground">
                בחירת נושא תציג כאן את פרטי הקשר המתאימים.
              </div>
            )}
          </div>
        </div>
      </Band>

      <Band tone="canvas" labelledBy="contact-all">
        <SectionHeading id="contact-all" title="כל פרטי הקשר" />
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TOPICS.map((t) => (
            <li key={t.key} className="rounded-super bg-card border border-border p-5">
              <p className="font-heading font-semibold text-lg text-foreground">{t.label}</p>
              <p className="text-sm text-muted-foreground mb-3">{t.text}</p>
              <ContactChips contact={t.contact} />
            </li>
          ))}
        </ul>
        <dl className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-super-sm bg-muted p-4"><dt className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="w-4 h-4" aria-hidden="true" />כתובת</dt><dd className="mt-1 text-foreground">{ORG.address}</dd></div>
          <div className="rounded-super-sm bg-muted p-4"><dt className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="w-4 h-4" aria-hidden="true" />דואר</dt><dd className="mt-1 text-foreground">{ORG.mail}</dd></div>
          <div className="rounded-super-sm bg-muted p-4"><dt className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="w-4 h-4" aria-hidden="true" />טלפון ראשי</dt><dd className="mt-1"><a href={`tel:${ORG.phones.main.replace(/\D/g, '')}`} className={TEXT_LINK} dir="ltr">{ORG.phones.main}</a></dd></div>
          <div className="rounded-super-sm bg-muted p-4"><dt className="flex items-center gap-2 text-sm text-muted-foreground"><Printer className="w-4 h-4" aria-hidden="true" />פקס</dt><dd className="mt-1 text-foreground" dir="ltr">{ORG.phones.fax}</dd></div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
          <ExternalLink href={ORG.social.facebook} className={TEXT_LINK}><Facebook className="w-4 h-4" aria-hidden="true" /> מטיב בפייסבוק</ExternalLink>
          <ExternalLink href={ORG.social.facebookKids} className={TEXT_LINK}><Facebook className="w-4 h-4" aria-hidden="true" /> מטיב ילדים בפייסבוק</ExternalLink>
          <ExternalLink href={ORG.social.youtube} className={TEXT_LINK}><Youtube className="w-4 h-4" aria-hidden="true" /> ערוץ היוטיוב</ExternalLink>
        </div>
      </Band>
    </div>
  );
}
