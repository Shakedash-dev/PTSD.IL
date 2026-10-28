import React, { useState } from 'react';
import { Check, MessageCircleQuestion, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import PageHeaderV3 from '../components/PageHeaderV3';
import { Band, ChipQuestion, ContactChips, EmptyState, ExternalLink, FactGrid, PILL_SOLID, SectionHeading, StatusPill, TEXT_LINK } from '../components/kit';
import { fmt, useCopy, useMetiv } from '../content/MetivContent';

// Group the five options for the "which kind?" question.
const KIND = {
  individual: ['individual'],
  organizations: ['team'],
  'supervision-group': ['group'],
  'after-roadmap': ['group'],
  'kids-clinic': ['individual', 'kids'],
};

export default function Supervision() {
  const { SUPERVISION } = useMetiv();
  const c = useCopy('supervision');
  const KIND_OPTIONS = [
    { key: 'all', label: c.kindAll },
    { key: 'individual', label: c.kindIndividual },
    { key: 'group', label: c.kindGroup },
    { key: 'team', label: c.kindTeam },
    { key: 'kids', label: c.kindKids },
  ];
  const [kind, setKind] = useState('all');
  const options = SUPERVISION.options.filter((/** @type {any} */ o) => kind === 'all' || (KIND[/** @type {keyof typeof KIND} */ (o.key)] || []).includes(kind));

  return (
    <div className="bg-background">
      <PageHeaderV3
        tone="muted"
        eyebrow={c.eyebrow}
        title={SUPERVISION.title}
        subtitle={c.subtitle}
        short={[
          fmt(c.shortOptions, { count: SUPERVISION.options.length }),
          c.shortCompare,
          c.shortContact,
        ]}
      />

      <Band tone="canvas" labelledBy="sup-familiar">
        <div className="grid gap-10 lg:grid-cols-2 items-start">
          <div>
            <SectionHeading id="sup-familiar" eyebrow={c.familiarEyebrow} title={c.familiarTitle} className="mb-4" />
            <p className="text-lg text-foreground leading-relaxed">{SUPERVISION.intro}</p>
          </div>
          <ul className="space-y-2">
            {SUPERVISION.challenges.map((/** @type {string} */ x, /** @type {number} */ i) => (
              <li key={i} className="flex items-center gap-3 rounded-2xl bg-card border border-border px-4 py-3 text-foreground">
                <MessageCircleQuestion className="w-5 h-5 text-secondary flex-shrink-0" aria-hidden="true" /> {x}
              </li>
            ))}
          </ul>
        </div>
      </Band>

      <Band tone="card" labelledBy="sup-options">
        <SectionHeading id="sup-options" eyebrow={c.optionsEyebrow} title={c.optionsTitle} intro={c.optionsIntro} />
        <ChipQuestion legend={c.optionsTitle} options={KIND_OPTIONS} value={kind} onChange={setKind} className="mb-8" />

        {options.length === 0 ? (
          <EmptyState title={c.emptyTitle} action={<ExternalLink href={`mailto:${SUPERVISION.contact.email}`} icon={false} className={TEXT_LINK}>{c.writeUs}</ExternalLink>} />
        ) : (
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {options.map((/** @type {any} */ o) => (
              <li key={o.key} id={o.key} className="scroll-mt-36 flex flex-col rounded-super bg-background border border-border p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-heading font-semibold text-xl text-foreground">{o.title}</h3>
                  {o.isPast && <StatusPill tone="muted">{c.pastRun}</StatusPill>}
                </div>
                <p className="mt-2 text-foreground leading-relaxed">{o.description}</p>
                <FactGrid
                  className="mt-4"
                  columns={1}
                  items={[
                    { label: c.factFormat, value: o.format },
                    { label: c.factPrice, value: o.price },
                    { label: c.factFacilitator, value: o.facilitator },
                    { label: c.factDate, value: o.startDate },
                  ]}
                />
                {o.details?.length > 0 && (
                  <ul className="mt-4 space-y-1.5 text-foreground">
                    {o.details.map((/** @type {string} */ d, /** @type {number} */ i) => <li key={i} className="flex gap-2"><span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" aria-hidden="true" />{d}</li>)}
                  </ul>
                )}
                {(o.suitableFor?.length > 0 || o.notSuitableFor?.length > 0) && (
                  <div className="mt-4 space-y-1.5 text-sm">
                    {o.suitableFor?.map((/** @type {string} */ s, /** @type {number} */ i) => <p key={i} className="flex items-center gap-2 text-foreground"><Check className="w-4 h-4 text-success" aria-hidden="true" />{fmt(c.suitableFor, { item: s })}</p>)}
                    {o.notSuitableFor?.map((/** @type {string} */ s, /** @type {number} */ i) => <p key={i} className="flex items-center gap-2 text-foreground"><X className="w-4 h-4 text-muted-foreground" aria-hidden="true" />{fmt(c.notSuitableFor, { item: s })}</p>)}
                  </div>
                )}
                <div className="mt-auto pt-5 space-y-3">
                  {o.registrationUrl && !o.isPast && <ExternalLink href={o.registrationUrl} className={PILL_SOLID}>{c.register}</ExternalLink>}
                  <ContactChips contact={o.contact || SUPERVISION.contact} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Band>

      <Band tone="muted" labelledBy="sup-compare">
        <SectionHeading id="sup-compare" eyebrow={c.compareEyebrow} title={c.compareTitle} />
        <div className="overflow-x-auto rounded-super border border-border bg-card">
          <table className="w-full min-w-[40rem] text-start">
            <caption className="sr-only">{c.compareCaption}</caption>
            <thead>
              <tr className="bg-primary/10 text-foreground">
                <th scope="col" className="px-5 py-3 text-start font-heading font-semibold">{c.colSupervision}</th>
                <th scope="col" className="px-5 py-3 text-start font-heading font-semibold">{c.colFormat}</th>
                <th scope="col" className="px-5 py-3 text-start font-heading font-semibold">{c.colPrice}</th>
                <th scope="col" className="px-5 py-3 text-start font-heading font-semibold">{c.colContact}</th>
              </tr>
            </thead>
            <tbody>
              {SUPERVISION.options.map((/** @type {any} */ o, /** @type {number} */ i) => (
                <tr key={o.key} className={cn('border-t border-border', i % 2 === 1 && 'bg-muted/40')}>
                  <th scope="row" className="px-5 py-3 text-start font-semibold text-foreground">{o.title}</th>
                  <td className="px-5 py-3 text-foreground">{o.format}</td>
                  <td className="px-5 py-3 text-foreground">{o.price || c.priceInContact}</td>
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
        <SectionHeading id="sup-clients" eyebrow={c.clientsEyebrow} title={c.clientsTitle} />
        <ul className="flex flex-wrap gap-2">
          {SUPERVISION.clientList.map((/** @type {string} */ x, /** @type {number} */ i) => <li key={i} className="rounded-full bg-card border border-border px-4 py-2 text-foreground">{x}</li>)}
        </ul>
        <div className="mt-10 rounded-super bg-card border-2 border-primary/25 p-6">
          <p className="font-heading font-semibold text-xl text-foreground">{c.notSureTitle}</p>
          <p className="text-muted-foreground mt-1 mb-4">{c.notSureText}</p>
          <ContactChips contact={SUPERVISION.contact} />
        </div>
      </Band>
    </div>
  );
}
