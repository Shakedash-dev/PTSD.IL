import React from 'react';
import { ArrowLeft, Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { PATIENT_HUB } from '@/pages/metiv-demos/shared/patient';
import Icon from '../components/Icon';
import { PATIENT_MENU, PATH_LABELS } from '../lib/nav';

const { hero, paths, quickLinks, additions, crisisLines, consultation, metivServices, disclaimer } = PATIENT_HUB;
const quick = Object.fromEntries(quickLinks.map((l) => [l.key, l]));
const TOP_TASKS = ['questionnaire', 'calming', 'whereToGetHelp', 'rights'].map((k) => quick[k]);

// The patient area keeps the V4 structure but at a lower density: fewer boxes,
// more whitespace, one idea per band.
export default function PatientHub() {
  const eran = crisisLines.find((l) => l.key === 'eranPhone');
  const whatsapp = crisisLines.find((l) => l.key === 'eranWhatsapp');

  return (
    <div className="bg-background">
      {/* Hero */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-center">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <span aria-hidden="true" className="h-1 w-6 rounded-full bg-secondary" />
              {hero.eyebrow}
            </p>
            <h1 className="font-heading text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">{hero.headline}</h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-card-foreground">{hero.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="elevated" radius="full" size="roomy-lg">
                <a href="#paths">
                  {hero.ctaLabel} <ArrowLeft aria-hidden="true" />
                </a>
              </Button>
              <Button asChild variant="outline" radius="full" size="roomy-lg" className="text-foreground">
                <DemoLink to={ROUTES.questionnaire}>{quick.questionnaire.label}</DemoLink>
              </Button>
            </div>
          </div>
          <aside aria-label="עזרה מיידית" className="rounded-super bg-muted p-6">
            <p className="font-heading text-xl font-semibold text-foreground">אם קשה עכשיו</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">אפשר לדבר עם מישהו בכל שעה. השיחה אנונימית וללא עלות.</p>
            <Button asChild variant="solid" radius="full" size="roomy-lg" className="mt-4 w-full">
              <a href={eran?.href}>
                <Phone aria-hidden="true" /> {eran?.label} {eran?.value}
              </a>
            </Button>
            <a href={whatsapp?.href} target="_blank" rel="noreferrer" className="mt-3 flex items-center justify-center gap-2 text-sm font-medium text-primary hover:underline">
              <MessageCircle aria-hidden="true" className="w-4 h-4" /> {whatsapp?.label}
            </a>
            <div className="mt-5 border-t border-border pt-4">
              <DemoLink to={consultation.route} className="text-sm font-medium text-foreground underline underline-offset-4 hover:text-primary">
                {consultation.title}
              </DemoLink>
            </div>
          </aside>
        </div>
      </header>

      {/* Paths */}
      <section id="paths" aria-labelledby="paths-title" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 id="paths-title" className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">מאיפה להתחיל</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">שלוש דרכים להיכנס, לפי מי שאתם ומה מתאים לכם עכשיו.</p>
        <ul className="mt-8 grid gap-6 md:grid-cols-3">
          {paths.map((p) => (
            <li key={p.key}>
              <DemoLink
                to={p.route}
                className="group flex h-full flex-col overflow-hidden rounded-super border border-border bg-card transition-shadow hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="block aspect-[16/10] bg-muted">
                  <img src={p.image} alt="" aria-hidden="true" loading="lazy" className="h-full w-full object-contain p-4" />
                </span>
                <span className="flex flex-1 flex-col p-6">
                  <span className="font-heading text-xl font-semibold text-foreground">{PATH_LABELS[p.key] || p.title}</span>
                  <span className="mt-2 flex-1 leading-relaxed text-muted-foreground">{p.subtitle}</span>
                  <span className="mt-5 inline-flex items-center gap-2 font-medium text-primary">
                    {p.ctaLabel} <ArrowLeft aria-hidden="true" className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                  </span>
                </span>
              </DemoLink>
            </li>
          ))}
        </ul>
      </section>

      {/* Top tasks */}
      <section aria-labelledby="top-tasks" className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 id="top-tasks" className="font-heading text-xl font-semibold text-foreground">הכי מבוקשים</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TOP_TASKS.map((t) => (
              <li key={t.key}>
                <DemoLink to={t.route} className="flex h-full items-start gap-3 rounded-super-sm bg-muted p-4 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-card text-primary">
                    <Icon name={t.icon} className="w-4 h-4" />
                  </span>
                  <span>
                    <span className="block font-medium leading-snug text-foreground">{t.label}</span>
                    <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">{t.description}</span>
                  </span>
                </DemoLink>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* All topics */}
      <section aria-labelledby="topics" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 id="topics" className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">כל הנושאים</h2>
        <div className="mt-8 grid gap-x-12 gap-y-10 md:grid-cols-2">
          {PATIENT_MENU.map((g) => (
            <div key={g.title}>
              <h3 className="mb-2 flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
                <span aria-hidden="true" className="h-4 w-1 rounded-full bg-secondary" />
                {g.title}
              </h3>
              <ul className="divide-y divide-border">
                {g.links.map((l) => (
                  <li key={l.key}>
                    <DemoLink to={l.route} className="group flex items-center gap-4 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-foreground group-hover:text-primary">{l.label}</span>
                        {l.description && <span className="block text-sm leading-snug text-muted-foreground">{l.description}</span>}
                      </span>
                      <ArrowLeft aria-hidden="true" className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                    </DemoLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Metiv additions */}
      <section aria-labelledby="additions" className="bg-muted">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 id="additions" className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">מידע ושירותים ממטיב</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">מסגרות, קבוצות ותוכניות שמטיב מפעילה, לצד מידע על טיפול ללא עלות.</p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {additions.map((a) => (
              <li key={a.key}>
                <DemoLink to={a.route} className="flex h-full flex-col rounded-super-sm bg-card p-5 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Icon name={a.icon} className="w-5 h-5 text-primary" />
                  <span className="mt-3 font-medium leading-snug text-foreground">{a.label}</span>
                  <span className="mt-1 text-sm leading-snug text-muted-foreground">{a.description}</span>
                </DemoLink>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Consultation + services */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
        <div id="consultation-hub">
          <h2 className="font-heading text-2xl font-semibold text-foreground">{consultation.title}</h2>
          <p className="mt-3 leading-relaxed text-foreground">{consultation.text}</p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Button asChild variant="solid" radius="full" size="roomy">
              <a href={`tel:${consultation.phone}`}>
                <Phone aria-hidden="true" /> <span dir="ltr">{consultation.phone}</span>
              </a>
            </Button>
            <DemoLink to={consultation.route} className="font-medium text-primary hover:underline underline-offset-4">{consultation.linkLabel}</DemoLink>
          </div>
        </div>
        <div>
          <h2 className="font-heading text-2xl font-semibold text-foreground">שירותי הטיפול של מטיב</h2>
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {metivServices.map((s) => (
              <li key={s.id}>
                <DemoLink to={s.route} className="group flex items-center gap-3 py-3">
                  <Icon name={s.icon} className="w-4 h-4 text-primary" />
                  <span className="flex-1 font-medium text-foreground group-hover:text-primary">{s.title}</span>
                  <ArrowLeft aria-hidden="true" className="w-4 h-4 text-muted-foreground" />
                </DemoLink>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* About PTSD */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 sm:px-6 md:grid-cols-[18rem_minmax(0,1fr)]">
          <img src={hero.image} alt="" aria-hidden="true" loading="lazy" className="aspect-[4/3] w-full rounded-super-sm object-cover" />
          <div>
            <h2 className="font-heading text-2xl font-semibold text-foreground">מהי פוסט-טראומה</h2>
            <p className="mt-3 leading-relaxed text-foreground">{hero.about}</p>
            <DemoLink to={hero.aboutRoute} className="mt-4 inline-flex items-center gap-1.5 font-medium text-primary hover:underline underline-offset-4">
              {hero.aboutLinkLabel} <ArrowLeft aria-hidden="true" className="w-4 h-4" />
            </DemoLink>
            <p className="mt-6 text-xs leading-relaxed text-muted-foreground">{disclaimer}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
