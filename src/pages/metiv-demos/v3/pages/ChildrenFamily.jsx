import React, { useState } from 'react';
import { ArrowLeft, Baby, Users } from 'lucide-react';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { SECOND_CIRCLE_ILLUSTRATIONS } from '@/lib/images';
import { CHILDREN_FAMILY_INTRO, coursesByCategory } from '@/pages/metiv-demos/shared/therapist';
import { cn } from '@/lib/utils';
import PageHeaderV3 from '../components/PageHeaderV3';
import { Band, ChipQuestion, ContactChips, ExternalLink, FactGrid, FOCUS, PILL_OUTLINE, PILL_SOLID, SectionHeading, StatusPill } from '../components/kit';
import { courseStatus } from '../lib';

// Which age groups each model serves, for the "which age?" question.
const MODEL_AGES = {
  panda: ['school'],
  'panda-parents': ['parents'],
  'panda-family': ['early', 'school', 'parents'],
  'panda-two': ['early', 'parents'],
  namal: ['early', 'parents'],
};
const AGE_OPTIONS = [
  { key: 'all', label: 'הצג הכל' },
  { key: 'early', label: 'גיל הרך' },
  { key: 'school', label: 'גיל בית ספר' },
  { key: 'parents', label: 'עבודה עם הורים' },
];

export default function ChildrenFamily() {
  const [age, setAge] = useState('all');
  const intro = CHILDREN_FAMILY_INTRO;
  const trainings = coursesByCategory('children-family');
  const models = intro.models.filter((m) => age === 'all' || (MODEL_AGES[m.key] || []).includes(age));

  return (
    <div className="bg-background">
      <PageHeaderV3
        tone="muted"
        eyebrow="ילדים ומשפחה"
        title={intro.title}
        subtitle="מודלים קבוצתיים והכשרות למנחים ולמטפלים שעובדים עם ילדים, פעוטות והורים."
        illustration={SECOND_CIRCLE_ILLUSTRATIONS.children_content}
        short={[
          `${intro.models.length} מודלים קבוצתיים שפותחו או מיושמים במטיב ילדים.`,
          'הכשרות למנחים נפתחות מעת לעת.',
          'אפשר לרשום התעניינות ולקבל עדכון לפני שנפתחת הכשרה.',
        ]}
        actions={<ExternalLink href={intro.trainingInterestFormUrl} className={PILL_SOLID}>רישום התעניינות בהכשרות</ExternalLink>}
      />

      <Band tone="canvas" width="default" labelledBy="cf-about">
        <SectionHeading id="cf-about" eyebrow="על המרכז" title="מטיב ילדים, בכמה מילים" />
        <div className="space-y-4 text-lg text-foreground leading-relaxed">
          {intro.paragraphs.map((p) => <p key={p}>{p}</p>)}
        </div>
      </Band>

      <Band tone="card" labelledBy="cf-models">
        <SectionHeading id="cf-models" eyebrow="המודלים" title="עם איזה גיל את/ה עובד/ת?" intro="בוחרים גיל, והמודלים הרלוונטיים נשארים. אפשר תמיד לחזור להצג הכל." />
        <ChipQuestion legend="עם איזה גיל את/ה עובד/ת?" options={AGE_OPTIONS} value={age} onChange={setAge} className="mb-8" />
        <p className="sr-only" aria-live="polite">{models.length} מודלים מוצגים</p>
        <ul className="grid gap-5 md:grid-cols-2">
          {models.map((m) => {
            const training = trainings.find((c) => c.slug === m.trainingSlug);
            return (
              <li key={m.key} id={m.key} className="scroll-mt-36 flex flex-col rounded-super bg-background border border-border p-6">
                <div className="flex items-start gap-3">
                  <span className="w-12 h-12 rounded-2xl bg-primary/10 text-accent flex items-center justify-center flex-shrink-0">
                    {m.key.includes('parents') ? <Users className="w-6 h-6" aria-hidden="true" /> : <Baby className="w-6 h-6" aria-hidden="true" />}
                  </span>
                  <div>
                    <h3 className="font-heading font-semibold text-2xl text-foreground">{m.title}</h3>
                    {m.fullName && <p className="text-muted-foreground">{m.fullName}</p>}
                  </div>
                </div>
                <p className="mt-4 text-foreground leading-relaxed">{m.description}</p>
                <FactGrid
                  className="mt-4"
                  columns={1}
                  items={[
                    { label: 'גילאים', value: m.ages },
                    { label: 'מבנה', value: m.structure },
                    { label: 'פותח על ידי', value: m.developedBy },
                  ]}
                />
                {m.keyMessages?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-muted-foreground mb-2">מסרים מרכזיים</p>
                    <ul className="flex flex-wrap gap-2">{m.keyMessages.map((k) => <li key={k}><StatusPill tone="primary">{k}</StatusPill></li>)}</ul>
                  </div>
                )}
                <div className="mt-auto pt-5 flex flex-wrap gap-3">
                  {training && (
                    <DemoLink to={`${ROUTES.courses}/${training.slug}`} className={cn(PILL_OUTLINE, 'text-sm')}>
                      להכשרת המנחים <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    </DemoLink>
                  )}
                  <ExternalLink href={m.sourceUrl} className="text-sm text-muted-foreground hover:text-foreground">באתר מטיב</ExternalLink>
                </div>
              </li>
            );
          })}
        </ul>
      </Band>

      <Band tone="muted" labelledBy="cf-trainings">
        <SectionHeading id="cf-trainings" eyebrow="הכשרות" title="הכשרות בתחום הילדים והמשפחה" intro={`הכשרות שמתקיימות מפעם לפעם: ${intro.periodicTrainings.join(', ')}.`} />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trainings.map((c) => {
            const st = courseStatus(c);
            return (
              <li key={c.slug}>
                <DemoLink to={`${ROUTES.courses}/${c.slug}`} className={cn('group flex h-full flex-col rounded-super bg-card border border-border p-5 hover:border-primary/60 hover:shadow-card transition-natural', FOCUS)}>
                  <StatusPill tone={st.tone} className="self-start">{st.label}</StatusPill>
                  <span className="mt-2 font-heading font-semibold text-lg text-foreground leading-snug">{c.title}</span>
                  <span className="mt-1 text-sm text-muted-foreground leading-relaxed">{c.summary}</span>
                  <span className="mt-auto pt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent">לפרטים <ArrowLeft className="w-4 h-4" aria-hidden="true" /></span>
                </DemoLink>
              </li>
            );
          })}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <ExternalLink href={intro.trainingInterestFormUrl} className={PILL_SOLID}>רישום התעניינות</ExternalLink>
          <ExternalLink href={intro.programSiteUrl} className={PILL_OUTLINE}>אתר תוכנית פנד"ה</ExternalLink>
        </div>
      </Band>

      <Band tone="canvas" width="default" labelledBy="cf-contact">
        <SectionHeading id="cf-contact" title="יצירת קשר עם מטיב ילדים" className="mb-4" />
        <ContactChips contact={intro.contact} />
        <p className="mt-6 text-muted-foreground">
          מחפשים מידע להורים?{' '}
          <DemoLink to={ROUTES.children} className="font-medium text-accent underline underline-offset-4">לעמוד "לדבר עם ילדים" באזור המטופלים</DemoLink>
        </p>
      </Band>
    </div>
  );
}
