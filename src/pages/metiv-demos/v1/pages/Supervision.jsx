import React from 'react';
import { Check, ExternalLink, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TREATMENT_STEP_IMAGES } from '@/lib/images';
import { SUPERVISION, THERAPIST_HUB } from '@/pages/metiv-demos/shared/therapist';
import { PageHeaderV1 } from '../components/Chrome';
import {
  ArrowLink,
  Chapter,
  ChapterHead,
  ContactLines,
  PillLink,
  StatusPill,
  useV1Title,
} from '../components/primitives';
import { pad } from '../lib';

const COMPARE_ROWS = [
  { key: 'format', label: 'מסגרת' },
  { key: 'price', label: 'עלות' },
  { key: 'facilitator', label: 'מנחה' },
  { key: 'suitableFor', label: 'מתאים ל' },
  { key: 'startDate', label: 'מועד' },
  { key: 'contact', label: 'פנייה' },
];

/** @param {any} option @param {string} key */
function cellValue(option, key) {
  if (key === 'suitableFor') return option.suitableFor?.join(', ');
  if (key === 'contact') return option.contact?.email;
  if (key === 'startDate') return option.startDate ? `${option.startDate}${option.isPast ? ' (הסתיים)' : ''}` : '';
  return option[key];
}

export default function Supervision() {
  useV1Title('הדרכה');
  const { options } = SUPERVISION;

  return (
    <>
      <PageHeaderV1
        size="editorial"
        align="start"
        tone="canvas"
        eyebrow="לאנשי טיפול ומקצוע"
        title="הדרכה"
        subtitle={SUPERVISION.intro}
        image={TREATMENT_STEP_IMAGES[2]}
      />

      <Chapter rule={false}>
        <ChapterHead number="01" label="בחדר הטיפול" title="מה מביאים להדרכה" lead="קשיים ודילמות שמטפלים בטראומה פוגשים, כפי שמטיב מתאר אותם." />
        <ol className="grid border-t border-border md:grid-cols-2 md:gap-x-12">
          {SUPERVISION.challenges.map((c, i) => (
            <li key={c} className="flex items-baseline gap-5 border-b border-border py-6">
              <span aria-hidden="true" className="font-heading text-3xl font-light tabular-nums text-secondary">{pad(i + 1)}</span>
              <span className="font-heading text-xl font-light leading-snug text-foreground md:text-2xl">{c}</span>
            </li>
          ))}
        </ol>
      </Chapter>

      <Chapter>
        <ChapterHead number="02" label="השוואה" title={`${options.length} אפשרויות הדרכה`} lead="סקירה מהירה, ומתחתיה הפירוט המלא של כל אפשרות." />

        {/* Comparison table, from tablet up */}
        <div className="hidden overflow-x-auto rounded-super border border-border bg-card md:block">
          <table className="w-full min-w-[56rem] border-collapse text-sm">
            <caption className="sr-only">השוואת אפשרויות ההדרכה</caption>
            <thead>
              <tr>
                <th scope="col" className="w-28 p-5 text-start align-bottom text-xs font-semibold tracking-wide text-muted-foreground" />
                {options.map((o) => (
                  <th key={o.key} scope="col" className="border-s border-border p-5 text-start align-bottom">
                    <a href={`#option-${o.key}`} className="font-heading text-lg font-normal leading-snug text-foreground hover:text-primary">{o.title}</a>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row) => (
                <tr key={row.key} className="border-t border-border">
                  <th scope="row" className="p-5 text-start align-top text-xs font-semibold tracking-wide text-muted-foreground">{row.label}</th>
                  {options.map((o) => {
                    const value = cellValue(o, row.key);
                    return (
                      <td key={o.key} className="border-s border-border p-5 align-top leading-relaxed text-foreground">
                        {value ? (
                          row.key === 'contact' ? <a href={`mailto:${value}`} dir="ltr" className="text-primary underline underline-offset-4">{value}</a> : value
                        ) : (
                          <span className="text-muted-foreground">לא צוין</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 md:mt-16">
          {options.map((o, i) => (
            <article key={o.key} id={`option-${o.key}`} className="grid scroll-mt-40 gap-6 border-t border-border py-10 md:grid-cols-12 md:gap-10 md:py-14">
              <div className="md:col-span-4">
                <span aria-hidden="true" className="font-heading text-2xl font-light tabular-nums text-secondary">{pad(i + 1)}</span>
                <h3 className="mt-2 font-heading text-3xl font-light leading-tight text-foreground md:text-4xl">{o.title}</h3>
                <p className="mt-3 text-muted-foreground">{o.format}</p>
                {o.price && <p className="mt-4 font-heading text-2xl font-light text-foreground">{o.price}</p>}
                {o.startDate && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    מחזור אחרון: {o.startDate}
                    {o.isPast && <StatusPill status={{ key: 'closed', label: 'המחזור הסתיים' }} />}
                  </div>
                )}
              </div>
              <div className="md:col-span-8">
                <p className="text-lg leading-[1.8] text-foreground">{o.description}</p>
                {o.details?.length > 0 && (
                  <ul className="mt-6 divide-y divide-border border-y border-border">
                    {o.details.map((d) => (
                      <li key={d} className="py-3 text-foreground">{d}</li>
                    ))}
                  </ul>
                )}
                {(o.suitableFor?.length > 0 || o.notSuitableFor?.length > 0) && (
                  <div className="mt-6 grid gap-6 sm:grid-cols-2">
                    {o.suitableFor?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold tracking-wide text-muted-foreground">מתאים ל</p>
                        <ul className="mt-2 space-y-2">
                          {o.suitableFor.map((s) => (
                            <li key={s} className="flex gap-2 text-foreground"><Check className="mt-1 h-4 w-4 shrink-0 text-success" aria-hidden="true" />{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {o.notSuitableFor?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold tracking-wide text-muted-foreground">פחות מתאים ל</p>
                        <ul className="mt-2 space-y-2">
                          {o.notSuitableFor.map((s) => (
                            <li key={s} className="flex gap-2 text-foreground"><Minus className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                {o.facilitator && <p className="mt-6 text-foreground"><span className="text-muted-foreground">מנחה: </span>{o.facilitator}</p>}
                <div className={cn('mt-6 flex flex-wrap items-center gap-6')}>
                  {o.registrationUrl && !o.isPast && (
                    <PillLink to={o.registrationUrl} size="md">להרשמה <ExternalLink aria-hidden="true" /></PillLink>
                  )}
                  {o.contact && <ContactLines contact={o.contact} />}
                </div>
              </div>
            </article>
          ))}
        </div>
      </Chapter>

      <Chapter>
        <ChapterHead number="03" label="הדרכות לארגונים" title="ארגונים שקיבלו הדרכה ממטיב" />
        <ul className="flex flex-wrap gap-x-2 gap-y-3 font-heading text-2xl font-light text-foreground md:text-3xl">
          {SUPERVISION.clientList.map((c, i) => (
            <li key={c} className="flex items-center gap-2">
              {c}
              {i < SUPERVISION.clientList.length - 1 && <span aria-hidden="true" className="text-secondary">·</span>}
            </li>
          ))}
        </ul>
      </Chapter>

      <Chapter>
        <div className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-7">
            <h2 className="font-heading text-3xl font-light leading-tight text-foreground md:text-5xl">לתיאום הדרכה</h2>
            <p className="mt-4 text-lg text-muted-foreground">אפשר לכתוב ישירות, או להשאיר פרטים בטופס הפנייה.</p>
          </div>
          <div className="flex flex-col items-start gap-4 md:col-span-5">
            <ContactLines contact={SUPERVISION.contact} className="text-base" />
            <ArrowLink to={THERAPIST_HUB.cta.url}>{THERAPIST_HUB.cta.label}</ArrowLink>
            <ArrowLink to={SUPERVISION.sourceUrl}>לעמוד ההדרכות באתר מטיב</ArrowLink>
          </div>
        </div>
      </Chapter>
    </>
  );
}
