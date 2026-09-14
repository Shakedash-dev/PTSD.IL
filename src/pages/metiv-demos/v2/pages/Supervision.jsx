import React from 'react';
import { Mail, ExternalLink, Check, X, UserRound, MessageSquareQuote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDemoChrome } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { SUPERVISION } from '@/pages/metiv-demos/shared/therapist';
import { cn } from '@/lib/utils';
import { FOCUS_DARK } from '../lib';
import { ArrowLink, Container, Panel, SectionTitle, StatusPill, Tag } from '../components/ui';

export default function Supervision() {
  const { PageHeader } = useDemoChrome();
  const s = SUPERVISION;

  return (
    <div>
      <PageHeader
        eyebrow="הדרכה"
        title={s.title}
        subtitle={s.intro}
        actions={
          <>
            <Button asChild variant="pill-light" size="pill-lg" className={FOCUS_DARK}>
              <a href={`mailto:${s.contact.email}`}>
                <Mail aria-hidden="true" />
                פנייה להדרכה
              </a>
            </Button>
            <a href="#compare" className={cn('inline-flex items-center h-14 px-6 rounded-full border-2 border-sanctuary-foreground/40 font-semibold hover:bg-sanctuary-foreground/10', FOCUS_DARK)}>
              השוואת אפשרויות
            </a>
          </>
        }
      />

      <Container className="py-12 space-y-16">
        <section aria-labelledby="challenges">
          <SectionTitle id="challenges" eyebrow="מה מביאים להדרכה" title="מצבים שמטפלים בטראומה פוגשים" />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {s.challenges.map((c) => (
              <li key={c} className="rounded-super-sm bg-sanctuary-foreground/[0.06] border border-sanctuary-foreground/15 p-5 flex flex-col gap-3">
                <MessageSquareQuote className="w-6 h-6 text-sanctuary-foreground/75" aria-hidden="true" />
                <p className="font-medium leading-snug">{c}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="compare" className="scroll-mt-40" aria-labelledby="compare-title">
          <SectionTitle id="compare-title" eyebrow="אפשרויות" title="מסגרות ההדרכה, זו לצד זו" description="המחירים והפרטים כפי שפורסמו באתר מטיב." />

          <div className="hidden md:block overflow-x-auto rounded-super-sm border border-sanctuary-foreground/15 mb-8">
            <table className="w-full text-sm">
              <caption className="sr-only">השוואת מסגרות ההדרכה</caption>
              <thead className="bg-sanctuary-foreground/[0.08]">
                <tr>
                  {['מסגרת', 'מתכונת', 'עלות', 'פנייה'].map((h) => (
                    <th key={h} scope="col" className="text-start font-semibold p-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.options.map((o) => (
                  <tr key={o.key} className="border-t border-sanctuary-foreground/10 align-top">
                    <th scope="row" className="text-start p-3">
                      <a href={`#opt-${o.key}`} className={cn('font-semibold underline-offset-4 hover:underline rounded', FOCUS_DARK)}>
                        {o.title}
                      </a>
                    </th>
                    <td className="p-3 text-sanctuary-foreground/90">{o.format}</td>
                    <td className="p-3 text-sanctuary-foreground/90">{o.price || 'בפנייה'}</td>
                    <td className="p-3 text-sanctuary-foreground/90" dir="ltr">
                      <span className="block text-end">{o.contact?.email || (o.registrationUrl ? 'קישור הרשמה' : '-')}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {s.options.map((o) => (
              <li key={o.key} id={`opt-${o.key}`} className="scroll-mt-40">
                <Panel className="h-full flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-heading font-semibold text-xl leading-snug">{o.title}</h3>
                    {o.isPast && <StatusPill kind="past" label="מחזור שהתקיים" />}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Tag>{o.format}</Tag>
                    {o.startDate && <Tag>החל מ-{o.startDate}</Tag>}
                  </div>
                  <p className="font-heading font-semibold text-2xl">{o.price || 'עלות בפנייה'}</p>
                  {o.facilitator && (
                    <p className="text-sm inline-flex items-center gap-2">
                      <UserRound className="w-4 h-4" aria-hidden="true" />
                      בהנחיית {o.facilitator}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed text-sanctuary-foreground/85">{o.description}</p>
                  {o.details?.length > 0 && (
                    <ul className="space-y-1.5 text-sm">
                      {o.details.map((d) => (
                        <li key={d} className="flex gap-2">
                          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-sanctuary-foreground/60 flex-shrink-0" aria-hidden="true" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  )}
                  {(o.suitableFor?.length > 0 || o.notSuitableFor?.length > 0) && (
                    <div className="grid gap-3 rounded-2xl bg-sanctuary-foreground/[0.06] p-4 text-sm">
                      {o.suitableFor?.length > 0 && (
                        <div>
                          <p className="font-semibold mb-1">מתאים ל</p>
                          <ul className="space-y-1">
                            {o.suitableFor.map((x) => (
                              <li key={x} className="flex gap-2">
                                <Check className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                                {x}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {o.notSuitableFor?.length > 0 && (
                        <div>
                          <p className="font-semibold mb-1">פחות מתאים ל</p>
                          <ul className="space-y-1">
                            {o.notSuitableFor.map((x) => (
                              <li key={x} className="flex gap-2">
                                <X className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                                {x}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="mt-auto pt-2 flex flex-wrap gap-2">
                    {o.contact?.email && (
                      <Button asChild variant="pill-light" size="pill" className={FOCUS_DARK}>
                        <a href={`mailto:${o.contact.email}`}>
                          <Mail aria-hidden="true" />
                          <span dir="ltr">{o.contact.email}</span>
                        </a>
                      </Button>
                    )}
                    {o.registrationUrl && !o.isPast && (
                      <Button asChild variant="pill-light" size="pill" className={FOCUS_DARK}>
                        <a href={o.registrationUrl} target="_blank" rel="noopener noreferrer">
                          להרשמה
                          <ExternalLink aria-hidden="true" />
                        </a>
                      </Button>
                    )}
                    {o.key === 'after-roadmap' && <ArrowLink to={`${ROUTES.courses}/roadmap`}>לקורס מפת הדרכים</ArrowLink>}
                    {o.isPast && !o.contact?.email && (
                      <a href={`mailto:${s.contact.email}`} className={cn('text-sm font-semibold underline underline-offset-4 rounded', FOCUS_DARK)}>
                        לשאול על הקבוצה הבאה
                      </a>
                    )}
                  </div>
                </Panel>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="sv-clients">
          <SectionTitle id="sv-clients" eyebrow="ארגונים" title="גופים שקיבלו הדרכה ממטיב" />
          <ul className="flex flex-wrap gap-2">
            {s.clientList.map((c) => (
              <li key={c}>
                <Tag className="text-sm px-3 py-1.5">{c}</Tag>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-6">
            <ArrowLink to={ROUTES.organizations}>הכשרות וליווי לארגונים</ArrowLink>
            <ArrowLink to={ROUTES.courses}>קורסים והכשרות</ArrowLink>
          </div>
        </section>
      </Container>
    </div>
  );
}
