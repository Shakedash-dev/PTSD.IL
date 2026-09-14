import React from 'react';
import { ArrowLeft, MessageCircle, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IMAGES } from '@/lib/images';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { PATIENT_HUB } from '@/pages/metiv-demos/shared/patient';
import {
  Arch,
  ArrowLink,
  Chapter,
  ChapterHead,
  CONTAINER,
  FOCUS,
  NamedIcon,
  NumberedIndex,
  PillLink,
  Reveal,
  useV1Title,
} from '../components/primitives';
import { patientLabel, telHref } from '../lib';

const CALMING = [
  { key: 'breathing', title: 'תרגיל נשימה', to: ROUTES.calmingBreathing, image: IMAGES.calming_breathing },
  { key: 'grounding', title: 'תרגיל קרקוע', to: ROUTES.calmingGrounding, image: IMAGES.calming_grounding },
  { key: 'muscle', title: 'הרפיית שרירים', to: ROUTES.calmingMuscle, image: IMAGES.calming_muscle },
];

export default function PatientHub() {
  useV1Title('למתמודדים ולמשפחות');
  const { hero, paths, quickLinks, additions, crisisLines, consultation, metivServices, disclaimer } = PATIENT_HUB;
  const [eran, whatsapp] = crisisLines;

  return (
    <>
      {/* Chapter opener */}
      <section className="border-b border-border bg-card">
        <div className={cn(CONTAINER, 'grid items-center gap-10 py-12 md:py-24 lg:grid-cols-12')}>
          <div className="lg:col-span-7">
            <p className="mb-5 flex items-center gap-3 text-xs font-semibold tracking-wide text-muted-foreground">
              <span aria-hidden="true" className="h-px w-8 bg-secondary" />
              למתמודדים ולמשפחות · {hero.eyebrow}
            </p>
            <h1 className="font-heading text-[3rem] font-light leading-[1.02] tracking-tight text-foreground sm:text-7xl lg:text-8xl">
              {hero.headline}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">{hero.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <PillLink to="#paths" size="lg">
                {hero.ctaLabel}
                <ArrowLeft aria-hidden="true" />
              </PillLink>
              <PillLink to={ROUTES.questionnaire} tone="light" size="lg">
                שאלון אנונימי
              </PillLink>
            </div>
            <p className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              צריך/ה לדבר עם מישהו עכשיו?
              <a href={eran.href} className={cn('inline-flex items-center gap-1.5 rounded-sm font-semibold text-foreground hover:text-primary', FOCUS)}>
                <Phone className="h-4 w-4" aria-hidden="true" />
                ער&quot;ן {eran.value}
              </a>
              <a href={whatsapp.href} target="_blank" rel="noreferrer" className={cn('inline-flex items-center gap-1.5 rounded-sm text-foreground hover:text-primary', FOCUS)}>
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                וואטסאפ
              </a>
            </p>
          </div>
          <div className="hidden lg:col-span-4 lg:col-start-9 lg:block">
            <Arch src={hero.image} eager aspect="aspect-[4/5]" className="mx-auto w-full max-w-[21rem]" />
          </div>
        </div>
      </section>

      {/* Three ways in */}
      <Chapter id="paths" rule={false}>
        <ChapterHead number="01" label="איפה להתחיל" title="שלוש דרכים להיכנס" lead="אפשר לבחור לפי המצב שלך. כל דרך מובילה לאותו מידע, בסדר אחר." />
        <div className="grid gap-6 md:grid-cols-3 md:gap-8">
          {paths.map((p, i) => (
            <Reveal key={p.key} delay={i * 90}>
              <DemoLink to={p.route} className={cn('group block rounded-super', FOCUS)}>
                <Arch src={p.image} contain className="w-full" imgClassName="group-hover:scale-[1.03]" />
                <h3 className="mt-6 font-heading text-3xl font-light leading-tight text-foreground transition-colors group-hover:text-primary">{patientLabel(p)}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{p.subtitle}</p>
                <span className="mt-4 inline-flex items-center gap-2 font-medium text-primary">
                  {p.ctaLabel}
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                </span>
              </DemoLink>
            </Reveal>
          ))}
        </div>
      </Chapter>

      {/* Right now */}
      <section className="bg-muted">
        <div className={cn(CONTAINER, 'grid gap-10 py-14 md:py-20 lg:grid-cols-12')}>
          <div className="lg:col-span-4">
            <p className="flex items-center gap-3 text-xs font-semibold tracking-wide text-muted-foreground">
              <span className="font-heading text-2xl font-light text-secondary">02</span>
              עכשיו
            </p>
            <h2 className="mt-4 font-heading text-4xl font-light leading-tight text-foreground md:text-5xl">מה אפשר לעשות עכשיו</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">תרגילים קצרים, במסך שקט בלי הסחות. אפשר להפסיק בכל רגע.</p>
            <ArrowLink to={ROUTES.calming} className="mt-6">לכל תרגילי ההרגעה</ArrowLink>
          </div>
          <ul className="grid grid-cols-3 gap-3 sm:gap-6 lg:col-span-7 lg:col-start-6">
            {CALMING.map((c) => (
              <li key={c.key}>
                <DemoLink to={c.to} className={cn('group block rounded-super', FOCUS)}>
                  <Arch src={c.image} className="w-full" imgClassName="group-hover:scale-[1.04]" />
                  <span className="mt-3 block text-center text-sm font-medium text-foreground group-hover:text-primary md:text-lg">{c.title}</span>
                </DemoLink>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Contents */}
      <Chapter>
        <ChapterHead number="03" label="תוכן העניינים" title="כל המידע באזור" />
        <NumberedIndex items={quickLinks.map((l) => ({ key: l.key, title: l.label, description: l.description, to: l.route }))} />
      </Chapter>

      {/* New in the area */}
      <Chapter>
        <ChapterHead number="04" label="חדש באזור" title="מה נוסף עם מטיב" lead="תוכן חדש שנוסף לאזור: מסגרות טיפול, קבוצות ומשאבים של אנשי מטיב." />
        <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
          {additions.map((a) => (
            <li key={a.key} className="border-t border-border">
              <DemoLink to={a.route} className={cn('group flex h-full flex-col gap-3 rounded-sm py-6', FOCUS)}>
                <NamedIcon name={a.icon} className="h-5 w-5 text-primary" />
                <span className="font-heading text-xl leading-snug text-foreground group-hover:text-primary">{a.label}</span>
                <span className="text-sm leading-relaxed text-muted-foreground">{a.description}</span>
              </DemoLink>
            </li>
          ))}
        </ul>
      </Chapter>

      {/* About PTSD */}
      <section className={cn(CONTAINER, 'py-14 md:py-24')}>
        <Reveal className="mx-auto max-w-4xl text-center">
          <p className="font-heading text-2xl font-light leading-[1.4] text-foreground md:text-4xl">{hero.about}</p>
          <ArrowLink to={hero.aboutRoute} className="mt-8">{hero.aboutLinkLabel}</ArrowLink>
        </Reveal>
      </section>

      {/* Consultation + Metiv services */}
      <Chapter>
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="rounded-super border border-border bg-card p-7 md:p-10 lg:col-span-6">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground">התייעצות</p>
            <h2 className="mt-3 font-heading text-3xl font-light leading-tight text-foreground md:text-4xl">{consultation.title}</h2>
            <p className="mt-4 leading-relaxed text-card-foreground">{consultation.text}</p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <PillLink to={telHref(consultation.phone)} size="md">
                <Phone aria-hidden="true" />
                <span dir="ltr">{consultation.phone}</span>
              </PillLink>
              <ArrowLink to={consultation.route}>{consultation.linkLabel}</ArrowLink>
            </div>
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground">שירותי הטיפול של מטיב</p>
            <ul className="mt-4 border-t border-border">
              {metivServices.map((s) => (
                <li key={s.id} className="border-b border-border">
                  <DemoLink to={s.route} className={cn('group flex items-center gap-4 rounded-sm py-4', FOCUS)}>
                    <NamedIcon name={s.icon} className="h-5 w-5 text-primary" />
                    <span className="flex-1 text-lg text-foreground group-hover:text-primary">{s.title}</span>
                    <ArrowLeft className="h-4 w-4 text-primary opacity-50 group-hover:opacity-100" aria-hidden="true" />
                  </DemoLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-14 text-sm text-muted-foreground">{disclaimer}</p>
      </Chapter>
    </>
  );
}
