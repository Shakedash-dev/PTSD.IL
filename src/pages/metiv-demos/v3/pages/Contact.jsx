import React, { useState } from 'react';
import { Facebook, Mail, MapPin, Phone, Printer, Youtube } from 'lucide-react';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import PageHeaderV3 from '../components/PageHeaderV3';
import { fmt, useCopy, useMetiv } from '../content/MetivContent';
import { Band, ChipQuestion, ContactChips, ExternalLink, fmtNodes, SectionHeading, TEXT_LINK } from '../components/kit';

/**
 * The contact topics. Labels and texts are copy (`contact.topic<Key>`,
 * `topic<Key>Text`, ...); addresses come from the content.
 * @param {Record<string, string>} c
 * @param {Record<string, any>} d  useMetiv()
 */
function topicsFrom(c, { ORG, RESEARCH_INTRO, THERAPIST_HUB, COLLABORATION_CONTACT }) {
  return [
    {
      key: 'adults',
      label: c.topicAdults,
      text: c.topicAdultsText,
      contact: { phone: ORG.phones.main, email: ORG.emails.general },
      form: { label: c.topicAdultsForm, url: ORG.adultsClinicFormUrl },
      more: { label: c.topicAdultsMore, to: `${ROUTES.whereToGetHelp}#adults-clinic` },
    },
    {
      key: 'kids',
      label: c.topicKids,
      text: c.topicKidsText,
      contact: { phone: ORG.phones.kids, email: ORG.emails.kids },
      form: { label: c.topicKidsForm, url: ORG.kidsClinicFormUrl },
      more: { label: c.topicKidsMore, to: `${ROUTES.whereToGetHelp}#kids-clinic` },
    },
    {
      key: 'courses',
      label: c.topicCourses,
      text: c.topicCoursesText,
      contact: { email: ORG.emails.courses, whatsapp: ORG.phones.coursesWhatsapp },
      form: { label: THERAPIST_HUB.cta.label, url: THERAPIST_HUB.cta.url },
      more: { label: c.topicCoursesMore, to: ROUTES.courses },
    },
    {
      key: 'research',
      label: c.topicResearch,
      text: c.topicResearchText,
      contact: { ...RESEARCH_INTRO.collaborationContact, whatsapp: ORG.phones.researchWhatsapp },
      more: { label: c.topicResearchMore, to: ROUTES.research },
    },
    {
      key: 'partners',
      label: c.topicPartners,
      text: fmt(c.topicPartnersText, { name: COLLABORATION_CONTACT?.name ?? '', role: COLLABORATION_CONTACT?.role ?? '' }),
      contact: { email: ORG.emails.partnerships },
      more: { label: c.topicPartnersMore, to: ROUTES.donate },
    },
    {
      key: 'general',
      label: c.topicGeneral,
      text: c.topicGeneralText,
      contact: { phone: ORG.phones.main, email: ORG.emails.general },
    },
  ];
}

export default function Contact() {
  const c = useCopy('contact');
  const data = useMetiv();
  const { ORG } = data;
  const TOPICS = topicsFrom(c, data);
  const [topic, setTopic] = useState('');
  const chosen = TOPICS.find((t) => t.key === topic);

  return (
    <div className="bg-background">
      <PageHeaderV3
        tone="muted"
        eyebrow={c.eyebrow}
        title={c.title}
        subtitle={c.subtitle}
        short={[]}
      />

      <Band tone="card" labelledBy="contact-q">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div>
            <SectionHeading id="contact-q" as="h2" title={c.question} className="mb-4" />
            <ChipQuestion legend={c.question} options={TOPICS} value={topic} onChange={setTopic} />
            <p className="mt-6 rounded-super-sm bg-muted p-4 text-foreground">
              {fmtNodes(c.immediate, { eran: <a href="tel:1201" className={TEXT_LINK}>{c.eran1201}</a> })}
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
                {c.placeholder}
              </div>
            )}
          </div>
        </div>
      </Band>

      <Band tone="canvas" labelledBy="contact-all">
        <SectionHeading id="contact-all" title={c.allTitle} />
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
          <div className="rounded-super-sm bg-muted p-4"><dt className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="w-4 h-4" aria-hidden="true" />{c.address}</dt><dd className="mt-1 text-foreground">{ORG.address}</dd></div>
          <div className="rounded-super-sm bg-muted p-4"><dt className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="w-4 h-4" aria-hidden="true" />{c.mail}</dt><dd className="mt-1 text-foreground">{ORG.mail}</dd></div>
          <div className="rounded-super-sm bg-muted p-4"><dt className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="w-4 h-4" aria-hidden="true" />{c.mainPhone}</dt><dd className="mt-1"><a href={`tel:${ORG.phones.main.replace(/\D/g, '')}`} className={TEXT_LINK} dir="ltr">{ORG.phones.main}</a></dd></div>
          <div className="rounded-super-sm bg-muted p-4"><dt className="flex items-center gap-2 text-sm text-muted-foreground"><Printer className="w-4 h-4" aria-hidden="true" />{c.fax}</dt><dd className="mt-1 text-foreground" dir="ltr">{ORG.phones.fax}</dd></div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
          <ExternalLink href={ORG.social.facebook} className={TEXT_LINK}><Facebook className="w-4 h-4" aria-hidden="true" /> {c.facebook}</ExternalLink>
          <ExternalLink href={ORG.social.facebookKids} className={TEXT_LINK}><Facebook className="w-4 h-4" aria-hidden="true" /> {c.facebookKids}</ExternalLink>
          <ExternalLink href={ORG.social.youtube} className={TEXT_LINK}><Youtube className="w-4 h-4" aria-hidden="true" /> {c.youtube}</ExternalLink>
        </div>
      </Band>
    </div>
  );
}
