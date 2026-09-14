import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Mail } from 'lucide-react';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { TREATMENT_STEP_IMAGES } from '@/lib/images';
import { NamedIcon } from '@/pages/metiv-demos/shared/patient/components';
import { COURSES, ORG, THERAPIST_HUB, UPCOMING_EVENTS, getCourse } from '@/pages/metiv-demos/shared/therapist';
import { cn } from '@/lib/utils';
import PageHeaderV3 from '../components/PageHeaderV3';
import { Band, ChipQuestion, ExternalLink, FOCUS, JourneySteps, LinkCard, PILL_OUTLINE, PILL_SOLID, SectionHeading, StatusPill, TEXT_LINK } from '../components/kit';
import { courseStatus } from '../lib';

/** @type {Record<string, { title: string, description: string, route: string, icon: string }>} */
const SECTION = Object.fromEntries(THERAPIST_HUB.sections.map((s) => [s.key, s]));

/** @param {string} key */
const sectionStep = (key) => ({ title: SECTION[key].title, text: SECTION[key].description, to: SECTION[key].route, cta: 'לעמוד' });
/** @param {string} slug */
const courseStep = (slug) => {
  const c = getCourse(slug);
  return { title: c?.title || slug, text: c?.summary, to: `${ROUTES.courses}/${slug}`, cta: 'לפרטי הקורס' };
};

const NEEDS = [
  { key: 'learn', label: 'ללמוד ולהתמקצע', steps: [sectionStep('courses'), sectionStep('events'), sectionStep('articles')] },
  { key: 'supervision', label: 'לקבל הדרכה', steps: [sectionStep('supervision'), courseStep('roadmap')] },
  { key: 'team', label: 'להכשיר צוות או ארגון', steps: [sectionStep('organizations'), courseStep('org-therapist-training'), courseStep('trauma-informed-org-day')] },
  { key: 'kids', label: 'לעבוד עם ילדים ומשפחות', steps: [sectionStep('childrenFamily'), courseStep('kids-trauma-basics')] },
  { key: 'research', label: 'לקרוא ולהתעדכן במחקר', steps: [sectionStep('research'), sectionStep('publications'), sectionStep('articles')] },
  {
    key: 'refer',
    label: 'להפנות מטופל/ת',
    steps: [
      { title: 'איפה מקבלים טיפול', text: 'מסגרות ציבוריות, עמותות ומרפאות מטיב, עם פרטי פנייה.', to: ROUTES.whereToGetHelp, cta: 'לאזור המטופלים' },
      { title: 'טיפולים ללא עלות ומחקרים', text: 'מסגרות ללא עלות ומחקרים שמגייסים משתתפים.', to: ROUTES.freeTreatment, cta: 'לעמוד' },
      { title: 'מחקרים שמגייסים עכשיו', text: 'תנאי השתתפות ופרטי קשר לכל מחקר.', to: ROUTES.research, cta: 'למחקרים' },
    ],
  },
];

export default function TherapistHub() {
  const [params, setParams] = useSearchParams();
  const needKey = params.get('need') || '';
  const need = NEEDS.find((n) => n.key === needKey);
  const openCourses = COURSES.filter((c) => courseStatus(c).key === 'open');
  const upcomingRuns = UPCOMING_EVENTS;

  /** @param {string} key */
  const choose = (key) => {
    const next = new URLSearchParams(params);
    if (key === needKey) next.delete('need');
    else next.set('need', key);
    setParams(next, { replace: true });
  };

  return (
    <div className="bg-background">
      <PageHeaderV3
        tone="muted"
        size="editorial"
        eyebrow="לאנשי טיפול ומקצוע"
        title="ללמוד, להתייעץ ולחקור טראומה, יחד"
        subtitle={THERAPIST_HUB.intro}
        image={TREATMENT_STEP_IMAGES[2]}
        actions={
          <>
            <DemoLink to={ROUTES.courses} className={PILL_SOLID}>לקורסים והכשרות <ArrowLeft className="w-4 h-4" aria-hidden="true" /></DemoLink>
            <ExternalLink href={THERAPIST_HUB.cta.url} className={PILL_OUTLINE}>{THERAPIST_HUB.cta.label}</ExternalLink>
          </>
        }
      />

      <Band tone="card" labelledBy="pro-question">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div>
            <SectionHeading id="pro-question" eyebrow="נתחיל בשאלה אחת" title="במה נוכל לעזור לך?" className="mb-4" />
            <p className="text-muted-foreground leading-relaxed mb-5">בוחרים מטרה, ומופיע המסלול באתר. כל העמודים זמינים גם ברשימה המלאה שמתחת.</p>
            <ChipQuestion legend="במה נוכל לעזור לך?" options={NEEDS} value={needKey} onChange={choose} />
            <p className="mt-5 text-sm text-muted-foreground">
              מעדיפים לדלג? <a href="#pro-all" className={TEXT_LINK}>הצג את כל התחומים</a>
            </p>
          </div>
          <div aria-live="polite">
            {need ? (
              <>
                <p className="font-heading font-semibold text-xl text-foreground mb-4">{need.label}: המסלול המוצע</p>
                <JourneySteps steps={need.steps} label={need.label} />
              </>
            ) : (
              <>
                <p className="font-heading font-semibold text-xl text-foreground mb-4">בינתיים, מה פתוח להרשמה</p>
                <ul className="space-y-3">
                  {openCourses.map((c) => (
                    <li key={c.slug}>
                      <DemoLink to={`${ROUTES.courses}/${c.slug}`} className={cn('group flex items-start gap-4 rounded-super-sm bg-background border border-border p-4 hover:border-primary/60 transition-natural', FOCUS)}>
                        <span className="w-14 flex-shrink-0 rounded-2xl bg-primary/10 text-accent text-center py-2 font-heading font-semibold leading-tight">
                          <CalendarDays className="w-5 h-5 mx-auto mb-0.5" aria-hidden="true" />
                          <span className="text-xs" dir="ltr">{(c.startDate || '').split('.').slice(0, 2).join('.')}</span>
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-heading font-semibold text-foreground">{c.title}</span>
                            <StatusPill tone="success">הרשמה פתוחה</StatusPill>
                          </span>
                          <span className="block text-sm text-muted-foreground mt-1">{[c.startDate && `פתיחה ${c.startDate}`, c.format, c.hours].filter(Boolean).join(' · ')}</span>
                        </span>
                        <ArrowLeft className="w-5 h-5 text-accent mt-1 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                      </DemoLink>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </Band>

      <Band tone="canvas" id="pro-all" labelledBy="pro-all-title">
        <SectionHeading id="pro-all-title" title="כל התחומים באזור" />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {THERAPIST_HUB.sections.map((s) => (
            <li key={s.key}>
              <LinkCard to={s.route} title={s.title} description={s.description} icon={<NamedIcon name={s.icon} className="w-6 h-6" />} />
            </li>
          ))}
        </ul>
      </Band>

      {upcomingRuns.length > 0 && (
        <Band tone="muted" labelledBy="pro-upcoming">
          <SectionHeading id="pro-upcoming" eyebrow="בלוח הקרוב" title="מחזורים ואירועים קרובים" />
          <ul className="grid gap-4 md:grid-cols-2">
            {upcomingRuns.map((e) => (
              <li key={e.slug} className="rounded-super bg-card border border-border p-6 shadow-card">
                <p className="text-sm font-semibold text-accent flex items-center gap-2"><CalendarDays className="w-4 h-4" aria-hidden="true" /> {e.date} · {e.type}</p>
                <p className="mt-2 font-heading font-semibold text-xl text-foreground">{e.title}</p>
                <p className="mt-1 text-muted-foreground leading-relaxed">{e.summary}</p>
                {e.link && !e.external && (
                  <DemoLink to={e.link} className={cn('mt-3 inline-flex items-center gap-1', TEXT_LINK)}>לפרטים <ArrowLeft className="w-4 h-4" aria-hidden="true" /></DemoLink>
                )}
              </li>
            ))}
          </ul>
        </Band>
      )}

      <Band tone="card" labelledBy="pro-contact">
        <div className="rounded-super bg-sanctuary text-sanctuary-foreground p-8 sm:p-10 grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] items-center">
          <div>
            <h2 id="pro-contact" className="font-heading font-semibold text-2xl sm:text-3xl">לא מצאת את מה שחיפשת?</h2>
            <p className="mt-2 text-sanctuary-foreground/85 text-lg">אפשר להשאיר פרטים בטופס הפנייה להכשרה או הדרכה, או לכתוב לנו.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ExternalLink href={THERAPIST_HUB.cta.url} className={cn('rounded-full bg-card text-foreground font-semibold px-6 py-3 hover:bg-muted transition-natural', FOCUS)}>{THERAPIST_HUB.cta.label}</ExternalLink>
            <a href={`mailto:${ORG.emails.courses}`} className={cn('inline-flex items-center gap-2 rounded-full border border-sanctuary-foreground/40 px-6 py-3 font-semibold hover:bg-sanctuary-foreground/10 transition-natural', FOCUS)}>
              <Mail className="w-4 h-4" aria-hidden="true" /> <span dir="ltr">{ORG.emails.courses}</span>
            </a>
          </div>
        </div>
      </Band>
    </div>
  );
}
