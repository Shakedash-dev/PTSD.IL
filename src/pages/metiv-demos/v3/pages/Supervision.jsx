import React, { useState } from 'react';
import { Check, MessageCircleQuestion, X } from 'lucide-react';
import { SUPERVISION } from '@/pages/metiv-demos/shared/therapist';
import { cn } from '@/lib/utils';
import PageHeaderV3 from '../components/PageHeaderV3';
import { Band, ChipQuestion, ContactChips, EmptyState, ExternalLink, FactGrid, PILL_SOLID, SectionHeading, StatusPill, TEXT_LINK } from '../components/kit';

// Group the five options for the "which kind?" question.
const KIND = {
  individual: ['individual'],
  organizations: ['team'],
  'supervision-group': ['group'],
  'after-roadmap': ['group'],
  'kids-clinic': ['individual', 'kids'],
};
const KIND_OPTIONS = [
  { key: 'all', label: 'הצג הכל' },
  { key: 'individual', label: 'אחד על אחד' },
  { key: 'group', label: 'בקבוצה של עמיתים' },
  { key: 'team', label: 'לצוות בארגון' },
  { key: 'kids', label: 'בתחום הילדים' },
];

export default function Supervision() {
  const [kind, setKind] = useState('all');
  const options = SUPERVISION.options.filter((o) => kind === 'all' || (KIND[o.key] || []).includes(kind));

  return (
    <div className="bg-background">
      <PageHeaderV3
        tone="muted"
        eyebrow="הדרכה"
        title={SUPERVISION.title}
        subtitle="טיפול בטראומה מורכב, ולא צריך להתמודד איתו לבד."
        short={[
          `${SUPERVISION.options.length} אפשרויות: פרטנית, קבוצתית, לצוותים ובתחום הילדים.`,
          'בטבלת ההשוואה אפשר לראות פורמט ועלות זה לצד זה.',
          'לכל אפשרות יש כתובת לפנייה.',
        ]}
      />

      <Band tone="canvas" labelledBy="sup-familiar">
        <div className="grid gap-10 lg:grid-cols-2 items-start">
          <div>
            <SectionHeading id="sup-familiar" eyebrow="לפני שבוחרים" title="נשמע מוכר?" className="mb-4" />
            <p className="text-lg text-foreground leading-relaxed">{SUPERVISION.intro}</p>
          </div>
          <ul className="space-y-2">
            {SUPERVISION.challenges.map((c) => (
              <li key={c} className="flex items-center gap-3 rounded-2xl bg-card border border-border px-4 py-3 text-foreground">
                <MessageCircleQuestion className="w-5 h-5 text-secondary flex-shrink-0" aria-hidden="true" /> {c}
              </li>
            ))}
          </ul>
        </div>
      </Band>

      <Band tone="card" labelledBy="sup-options">
        <SectionHeading id="sup-options" eyebrow="האפשרויות" title="איזו הדרכה מתאימה לך?" intro="בוחרים את צורת העבודה, והאפשרויות הרלוונטיות נשארות." />
        <ChipQuestion legend="איזו הדרכה מתאימה לך?" options={KIND_OPTIONS} value={kind} onChange={setKind} className="mb-8" />

        {options.length === 0 ? (
          <EmptyState title="אין אפשרות כזו כרגע" action={<ExternalLink href={`mailto:${SUPERVISION.contact.email}`} icon={false} className={TEXT_LINK}>כתבו לנו</ExternalLink>} />
        ) : (
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {options.map((o) => (
              <li key={o.key} id={o.key} className="scroll-mt-36 flex flex-col rounded-super bg-background border border-border p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-heading font-semibold text-xl text-foreground">{o.title}</h3>
                  {o.isPast && <StatusPill tone="muted">המחזור שפורסם התקיים</StatusPill>}
                </div>
                <p className="mt-2 text-foreground leading-relaxed">{o.description}</p>
                <FactGrid
                  className="mt-4"
                  columns={1}
                  items={[
                    { label: 'צורת עבודה', value: o.format },
                    { label: 'עלות', value: o.price },
                    { label: 'מנחה', value: o.facilitator },
                    { label: 'מועד', value: o.startDate },
                  ]}
                />
                {o.details?.length > 0 && (
                  <ul className="mt-4 space-y-1.5 text-foreground">
                    {o.details.map((d) => <li key={d} className="flex gap-2"><span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" aria-hidden="true" />{d}</li>)}
                  </ul>
                )}
                {(o.suitableFor?.length > 0 || o.notSuitableFor?.length > 0) && (
                  <div className="mt-4 space-y-1.5 text-sm">
                    {o.suitableFor?.map((s) => <p key={s} className="flex items-center gap-2 text-foreground"><Check className="w-4 h-4 text-success" aria-hidden="true" />מתאים ל{s}</p>)}
                    {o.notSuitableFor?.map((s) => <p key={s} className="flex items-center gap-2 text-foreground"><X className="w-4 h-4 text-muted-foreground" aria-hidden="true" />פחות מתאים ל{s}</p>)}
                  </div>
                )}
                <div className="mt-auto pt-5 space-y-3">
                  {o.registrationUrl && !o.isPast && <ExternalLink href={o.registrationUrl} className={PILL_SOLID}>להרשמה</ExternalLink>}
                  <ContactChips contact={o.contact || SUPERVISION.contact} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Band>

      <Band tone="muted" labelledBy="sup-compare">
        <SectionHeading id="sup-compare" eyebrow="השוואה מהירה" title="כל האפשרויות, זו לצד זו" />
        <div className="overflow-x-auto rounded-super border border-border bg-card">
          <table className="w-full min-w-[40rem] text-start">
            <caption className="sr-only">השוואת אפשרויות ההדרכה</caption>
            <thead>
              <tr className="bg-primary/10 text-foreground">
                <th scope="col" className="px-5 py-3 text-start font-heading font-semibold">הדרכה</th>
                <th scope="col" className="px-5 py-3 text-start font-heading font-semibold">צורת עבודה</th>
                <th scope="col" className="px-5 py-3 text-start font-heading font-semibold">עלות</th>
                <th scope="col" className="px-5 py-3 text-start font-heading font-semibold">פנייה</th>
              </tr>
            </thead>
            <tbody>
              {SUPERVISION.options.map((o, i) => (
                <tr key={o.key} className={cn('border-t border-border', i % 2 === 1 && 'bg-muted/40')}>
                  <th scope="row" className="px-5 py-3 text-start font-semibold text-foreground">{o.title}</th>
                  <td className="px-5 py-3 text-foreground">{o.format}</td>
                  <td className="px-5 py-3 text-foreground">{o.price || 'בפנייה'}</td>
                  <td className="px-5 py-3">
                    {(o.contact || SUPERVISION.contact).email && (
                      <a href={`mailto:${(o.contact || SUPERVISION.contact).email}`} className={TEXT_LINK} dir="ltr">{(o.contact || SUPERVISION.contact).email}</a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Band>

      <Band tone="canvas" labelledBy="sup-clients">
        <SectionHeading id="sup-clients" eyebrow="ארגונים" title="גופים שקיבלו הדרכה ממטיב" />
        <ul className="flex flex-wrap gap-2">
          {SUPERVISION.clientList.map((c) => <li key={c} className="rounded-full bg-card border border-border px-4 py-2 text-foreground">{c}</li>)}
        </ul>
        <div className="mt-10 rounded-super bg-card border-2 border-primary/25 p-6">
          <p className="font-heading font-semibold text-xl text-foreground">לא בטוח/ה מה מתאים?</p>
          <p className="text-muted-foreground mt-1 mb-4">כתבו לנו כמה מילים על העבודה שלכם, ונעזור לבחור את מסגרת ההדרכה המתאימה.</p>
          <ContactChips contact={SUPERVISION.contact} />
        </div>
      </Band>
    </div>
  );
}
