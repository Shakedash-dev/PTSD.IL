import React, { useState } from 'react';
import { ArrowLeft, Building2 } from 'lucide-react';
import Disclosure from '@/components/patterns/Disclosure';
import { DemoLink, DemoMarkdown } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { COMMUNITIES_IMG } from '../images';
import { ORGANIZATION_PROGRAMS, getCourse } from '@/pages/metiv-demos/shared/therapist';
import { cn } from '@/lib/utils';
import PageHeaderV3 from '../components/PageHeaderV3';
import { Band, ChipQuestion, ContactChips, ExternalLink, PILL_OUTLINE, QuoteCard, SectionHeading, StatusPill } from '../components/kit';

const NEEDS = [
  { key: 'informed', label: 'להפוך לארגון מותאם טראומה', slugs: ['metiv-space', 'trauma-informed-org'] },
  { key: 'workshop', label: 'סדנה או הרצאה בהתאמה', slugs: ['custom-workshops'] },
  { key: 'clinical', label: 'להכשיר צוות טיפולי', slugs: ['org-trainings'] },
];

export default function Organizations() {
  // No choice shows every programme; choosing the same answer again clears it.
  const [need, setNeed] = useState('');
  const chosen = NEEDS.find((n) => n.key === need);
  const programs = chosen ? ORGANIZATION_PROGRAMS.filter((p) => chosen.slugs.includes(p.slug)) : ORGANIZATION_PROGRAMS;
  const clients = [...new Set(ORGANIZATION_PROGRAMS.flatMap((p) => p.clientList))];

  return (
    <div className="bg-background">
      <PageHeaderV3
        tone="muted"
        eyebrow="לארגונים"
        title="הכשרות וליווי לארגונים"
        subtitle="לארגונים שנותנים שירות לנפגעי טראומה, ולצוותים טיפוליים שרוצים שפה וכלים משותפים."
        illustration={COMMUNITIES_IMG}
        short={[
          `${ORGANIZATION_PROGRAMS.length} תוכניות: ארגון מותאם טראומה, יום עיון, סדנאות בהתאמה והכשרת צוותים.`,
          'כל תוכנית נבנית מול הארגון.',
          'לכל תוכנית איש/אשת קשר.',
        ]}
      />

      <Band tone="card" labelledBy="org-question">
        <SectionHeading id="org-question" eyebrow="נתחיל בשאלה" title="מה הארגון שלכם צריך?" />
        <ChipQuestion legend="מה הארגון שלכם צריך?" options={NEEDS} value={need} onChange={(k) => setNeed((cur) => (cur === k ? '' : k))} className="mb-10" />

        <div className="space-y-8" aria-live="polite">
          {programs.map((p) => {
            const course = p.relatedCourseSlug ? getCourse(p.relatedCourseSlug) : null;
            return (
              <article key={p.slug} id={p.slug} aria-labelledby={`${p.slug}-title`} className="scroll-mt-36 rounded-super bg-background border border-border p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <span className="hidden sm:flex w-14 h-14 rounded-2xl bg-primary/10 text-accent items-center justify-center flex-shrink-0">
                    <Building2 className="w-7 h-7" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 id={`${p.slug}-title`} className="font-heading font-semibold text-2xl sm:text-3xl text-foreground">{p.title}</h3>
                    {p.subtitle && <p className="text-lg text-muted-foreground">{p.subtitle}</p>}
                    <p className="mt-3 text-lg text-foreground leading-relaxed">{p.summary}</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-super-sm bg-card border border-border p-4">
                    <p className="text-sm font-semibold text-muted-foreground mb-2">איך זה נראה</p>
                    <ul className="flex flex-wrap gap-2">{p.formats.map((f) => <li key={f}><StatusPill tone="primary">{f}</StatusPill></li>)}</ul>
                  </div>
                  <div className="rounded-super-sm bg-card border border-border p-4">
                    <p className="text-sm font-semibold text-muted-foreground mb-2">למי</p>
                    <ul className="flex flex-wrap gap-2">{p.audience.map((a) => <li key={a}><StatusPill tone="muted">{a}</StatusPill></li>)}</ul>
                  </div>
                </div>

                {p.topics?.length > 0 && (
                  <div className="mt-5">
                    <p className="font-heading font-semibold text-foreground mb-2">נושאים</p>
                    <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2 text-foreground">
                      {p.topics.map((t) => <li key={t} className="flex gap-2"><span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" aria-hidden="true" />{t}</li>)}
                    </ul>
                  </div>
                )}

                <Disclosure label="לקריאת הפירוט המלא" variant="soft" size="compact" className="mt-6">
                  <DemoMarkdown className="rich-content text-foreground">{p.description}</DemoMarkdown>
                </Disclosure>

                {p.voices?.length > 0 && (
                  <div className="mt-6">
                    <p className="font-heading font-semibold text-foreground mb-3">מה מספרים נפגעי טראומה על המפגש עם שירותים</p>
                    <div className="grid gap-4 md:grid-cols-2">{p.voices.map((v) => <QuoteCard key={v} quote={v} />)}</div>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {p.links?.map((l) => <ExternalLink key={l.url} href={l.url} className={cn(PILL_OUTLINE, 'text-sm')}>{l.label}</ExternalLink>)}
                  {course && (
                    <DemoLink to={`${ROUTES.courses}/${course.slug}`} className={cn(PILL_OUTLINE, 'text-sm')}>
                      לקורס: {course.title} <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    </DemoLink>
                  )}
                </div>
                <div className="mt-6 pt-5 border-t border-border">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">איש/אשת קשר</p>
                  <ContactChips contact={p.contact} />
                </div>
              </article>
            );
          })}
        </div>
      </Band>

      <Band tone="muted" labelledBy="org-clients">
        <SectionHeading id="org-clients" eyebrow="ניסיון" title="ארגונים שעבדו עם מטיב" intro="כפי שמופיע באתר מטיב." />
        <ul className="flex flex-wrap gap-2">
          {clients.map((c) => <li key={c} className="rounded-full bg-card border border-border px-4 py-2 text-foreground">{c}</li>)}
        </ul>
      </Band>
    </div>
  );
}
