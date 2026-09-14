import React from 'react';
import { ArrowLeft, ChevronLeft, CalendarDays, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { PATIENT_HUB } from '@/pages/metiv-demos/shared/patient';
import {
  ORG,
  FACTS,
  METIV_SERVICES,
  RESEARCH_INTRO,
  ACTIVE_STUDIES,
  PAPERS,
  UPCOMING_EVENTS,
  PAST_EVENTS,
  ARTICLES,
  PARTNERS,
  DONATE,
  THERAPIST_HUB,
} from '@/pages/metiv-demos/shared/therapist';
import { cn } from '@/lib/utils';
import Icon from '../components/Icon';
import { StatusPill, SectionTitle, Tag } from '../components/primitives';
import { PATH_LABELS } from '../lib/nav';

const quick = Object.fromEntries(PATIENT_HUB.quickLinks.map((l) => [l.key, l]));
const hub = Object.fromEntries(THERAPIST_HUB.sections.map((s) => [s.key, s]));

const PATIENT_DESTINATIONS = [
  { key: 'questionnaire', label: quick.questionnaire.label, route: quick.questionnaire.route, icon: quick.questionnaire.icon },
  { key: 'whereToGetHelp', label: quick.whereToGetHelp.label, route: quick.whereToGetHelp.route, icon: quick.whereToGetHelp.icon },
  { key: 'selfHelp', label: quick.selfHelp.label, route: quick.selfHelp.route, icon: quick.selfHelp.icon },
  { key: 'rights', label: quick.rights.label, route: quick.rights.route, icon: quick.rights.icon },
  { key: 'calming', label: quick.calming.label, route: quick.calming.route, icon: quick.calming.icon },
  { key: 'secondCircle', label: PATH_LABELS.secondCircle, route: ROUTES.secondCircle, icon: 'Users' },
];

const THERAPIST_DESTINATIONS = ['courses', 'childrenFamily', 'supervision', 'organizations', 'research', 'publications'].map((k) => ({
  key: k,
  label: hub[k].title,
  route: hub[k].route,
  icon: hub[k].icon,
}));

/**
 * A portal panel: the area CTA and its table of contents in one.
 * @param {{ id: string, dark?: boolean, stripe: string, eyebrow: string, title: string, text: string, cta: string, route: string, destinations: { key: string, label: string, route: string, icon?: string }[] }} props
 */
function Portal({ id, dark = false, stripe, eyebrow, title, text, cta, route, destinations }) {
  return (
    <section aria-labelledby={id} className="flex flex-col overflow-hidden rounded-super border border-border bg-card shadow-card">
      <div aria-hidden="true" className={cn('h-1.5', stripe)} />
      <div className={cn('px-6 py-6 sm:px-8 sm:py-7', dark ? 'bg-sanctuary text-sanctuary-foreground' : 'bg-muted text-foreground')}>
        <p className={cn('text-sm font-semibold', dark ? 'text-sanctuary-foreground/85' : 'text-category-2')}>{eyebrow}</p>
        <h2 id={id} className="mt-1 font-heading text-2xl font-semibold leading-tight sm:text-3xl">{title}</h2>
        <p className={cn('mt-2 max-w-xl leading-relaxed', dark ? 'text-sanctuary-foreground/85' : 'text-muted-foreground')}>{text}</p>
        <Button
          asChild
          variant={dark ? 'pill-light' : 'elevated'}
          size="none"
          radius="full"
          className="mt-5 min-h-14 w-full gap-3 whitespace-normal px-6 py-3 text-center text-base font-semibold leading-snug sm:w-auto sm:px-8 sm:text-lg"
        >
          <DemoLink to={route}>
            {cta}
            <ArrowLeft aria-hidden="true" className="!size-5" />
          </DemoLink>
        </Button>
      </div>
      <div className="flex-1 px-6 pb-5 pt-4 sm:px-8">
        <p className="mb-1 text-sm font-semibold text-muted-foreground">יעדים מרכזיים באזור</p>
        <ul className="grid sm:grid-cols-2 sm:gap-x-8">
          {destinations.map((d) => (
            <li key={d.key}>
              <DemoLink
                to={d.route}
                className="group flex items-center gap-3 border-b border-border py-2.5 text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon name={d.icon} className="w-4 h-4 shrink-0 text-primary" />
                <span className="flex-1 font-medium leading-snug">{d.label}</span>
                <ChevronLeft aria-hidden="true" className="w-4 h-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
              </DemoLink>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** @param {string} iso */
function dateParts(iso) {
  const [y, m, d] = (iso || '').split('-');
  return { day: d ? String(Number(d)) : '', month: m ? String(Number(m)) : '', year: y || '' };
}

export default function Landing() {
  const recruiting = ACTIVE_STUDIES.filter((s) => s.recruiting).slice(0, 3);
  const featuredPapers = PAPERS.filter((p) => p.featured).sort((a, b) => (b.year || 0) - (a.year || 0)).slice(0, 3);
  const events = [...UPCOMING_EVENTS, ...PAST_EVENTS].slice(0, 4);
  const article = ARTICLES[0];

  return (
    <div className="bg-background">
      {/* Hero + portals */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:pb-14 lg:pt-10">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-x-10 gap-y-3">
            <div className="max-w-3xl">
              <p className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                <span aria-hidden="true" className="h-1 w-6 rounded-full bg-foreground" />
                עמותת מטיב · מאז 1989 · ירושלים
              </p>
              <h1 className="font-heading text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-[2.6rem]">
                {ORG.name}
              </h1>
              <p className="mt-2 text-lg leading-relaxed text-muted-foreground">{ORG.vision}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              טיפול · הכשרות · הדרכה · מחקר
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Portal
              id="portal-patient"
              stripe="bg-secondary"
              eyebrow="אזור למתמודדים ולמשפחות"
              title="למי שחווה טראומה ולבני המשפחה"
              text="מידע ברור על פוסט-טראומה, כלים להתמודדות, זכויות, ודרכים לקבל טיפול, בקצב שלכם."
              cta="כניסה לאזור המטופלים והמשפחות"
              route={ROUTES.patient}
              destinations={PATIENT_DESTINATIONS}
            />
            <Portal
              id="portal-therapist"
              dark
              stripe="bg-primary"
              eyebrow="אזור לאנשי מקצוע"
              title="לאנשי טיפול, חוקרים וארגונים"
              text="קורסים והכשרות, הדרכה, תוכניות לארגונים, מחקרים פעילים ופרסומים של אנשי מטיב."
              cta="כניסה לאזור אנשי המקצוע"
              route={ROUTES.therapist}
              destinations={THERAPIST_DESTINATIONS}
            />
          </div>
        </div>
      </section>

      {/* Org overview + counts */}
      <section aria-labelledby="overview" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="mb-1 text-sm font-semibold text-primary">מטיב במבט אחד</p>
            <h2 id="overview" className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">{ORG.headline}</h2>
            <p className="mt-4 leading-relaxed text-foreground">{ORG.mission}</p>
            <Button asChild variant="outline" radius="full" size="roomy" className="mt-6 bg-card text-foreground">
              <DemoLink to={ROUTES.about}>
                אודות מטיב <ArrowLeft aria-hidden="true" />
              </DemoLink>
            </Button>
          </div>
          <div className="lg:col-span-7">
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {FACTS.map((f) => (
                <li key={f.label} className="rounded-super-sm border border-border bg-card p-4">
                  <p className="font-heading text-3xl font-semibold text-foreground" dir="ltr">{f.value}</p>
                  <p className="mt-1 text-sm leading-snug text-foreground">{f.label}</p>
                  <p className="mt-2 text-xs text-muted-foreground">מקור: {f.source}</p>
                </li>
              ))}
              <li className="flex flex-col justify-center rounded-super-sm bg-muted p-4 text-sm leading-snug text-muted-foreground">
                נתוני היקף כפי שפורסמו באתר מטיב. אינם מדדי תוצאה.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Services */}
      <section aria-labelledby="services" className="border-y border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-16">
          <SectionTitle
            id="services"
            eyebrow="טיפול"
            title="שירותי הטיפול של מטיב"
            description="מרפאות ותוכניות לאנשים שחוו טראומה ולבני משפחותיהם. פרטי הפנייה המלאים נמצאים באזור המטופלים."
            action={
              <DemoLink to={ROUTES.whereToGetHelp} className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline underline-offset-4">
                כל מסגרות הטיפול <ArrowLeft aria-hidden="true" className="w-4 h-4" />
              </DemoLink>
            }
          />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {METIV_SERVICES.map((s) => (
              <li key={s.slug}>
                <DemoLink
                  to={s.href}
                  className="group flex h-full flex-col rounded-super-sm border border-border bg-background p-5 transition-shadow hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex size-10 items-center justify-center rounded-xl bg-card text-primary">
                    <Icon name={s.icon} />
                  </span>
                  <span className="mt-3 font-heading text-lg font-semibold text-foreground">{s.title}</span>
                  <span className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">{s.summary}</span>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                    פרטים ודרכי פנייה <ArrowLeft aria-hidden="true" className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                  </span>
                </DemoLink>
              </li>
            ))}
            <li>
              <DemoLink
                to={PATIENT_HUB.consultation.route}
                className="flex h-full flex-col justify-between rounded-super-sm bg-muted p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span>
                  <span className="block font-heading text-lg font-semibold text-foreground">{PATIENT_HUB.consultation.title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{PATIENT_HUB.consultation.text}</span>
                </span>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  {PATIENT_HUB.consultation.linkLabel} <ArrowLeft aria-hidden="true" className="w-4 h-4" />
                </span>
              </DemoLink>
            </li>
          </ul>
        </div>
      </section>

      {/* Research highlights */}
      <section aria-labelledby="research" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="mb-1 text-sm font-semibold text-primary">מחקר</p>
            <h2 id="research" className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">{RESEARCH_INTRO.title}</h2>
            <p className="mt-3 leading-relaxed text-foreground">{RESEARCH_INTRO.paragraphs[0]}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">מיקוד: </span>
              {RESEARCH_INTRO.focus}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="solid" radius="full" size="roomy">
                <DemoLink to={ROUTES.research}>מחקרים פעילים</DemoLink>
              </Button>
              <Button asChild variant="outline" radius="full" size="roomy" className="bg-card text-foreground">
                <DemoLink to={ROUTES.publications}>פרסומים</DemoLink>
              </Button>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:col-span-8">
            <div className="rounded-super-sm border border-border bg-card p-5">
              <p className="mb-3 font-heading font-semibold text-foreground">מחקרים שמגייסים משתתפים</p>
              <ul className="divide-y divide-border">
                {recruiting.map((s) => (
                  <li key={s.slug} className="py-3 first:pt-0 last:pb-0">
                    <StatusPill tone="positive">מגייס משתתפים</StatusPill>
                    <DemoLink to={`${ROUTES.research}#${s.slug}`} className="mt-1.5 block font-medium leading-snug text-foreground hover:text-primary">
                      {s.title}
                    </DemoLink>
                    <p className="mt-0.5 text-sm leading-snug text-muted-foreground line-clamp-2">{s.population}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-super-sm border border-border bg-card p-5">
              <p className="mb-3 font-heading font-semibold text-foreground">פרסומים נבחרים</p>
              <ul className="divide-y divide-border">
                {featuredPapers.map((p) => (
                  <li key={p.title} className="py-3 first:pt-0 last:pb-0" dir="auto">
                    <p className="text-sm font-medium leading-snug text-foreground line-clamp-2" dir="auto">{p.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-1" dir="auto">
                      {p.authors.slice(0, 3).join(', ')}{p.authors.length > 3 ? ' et al.' : ''} ({p.year || 'n.d.'}). {p.journal}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Events + article */}
      <section aria-labelledby="events" className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:py-16">
          <div className="lg:col-span-8">
            <SectionTitle
              id="events"
              eyebrow="עדכונים"
              title="אירועים ומחזורים"
              action={
                <DemoLink to={ROUTES.events} className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline underline-offset-4">
                  לכל האירועים <ArrowLeft aria-hidden="true" className="w-4 h-4" />
                </DemoLink>
              }
            />
            <ul className="divide-y divide-border rounded-super-sm border border-border bg-background">
              {events.map((e) => {
                const d = dateParts(e.dateISO || '');
                return (
                  <li key={e.slug} className="flex gap-4 p-4 sm:p-5">
                    <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-card py-2 text-center">
                      <span className="font-heading text-xl font-semibold leading-none text-foreground">{d.day}.{d.month}</span>
                      <span className="mt-1 text-xs text-muted-foreground">{d.year}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Tag>{e.type}</Tag>
                        {e.isPast ? <StatusPill tone="neutral">התקיים</StatusPill> : <StatusPill tone="info">קרוב</StatusPill>}
                      </div>
                      {e.link && !e.external ? (
                        <DemoLink to={e.link} className="mt-1.5 block font-heading text-lg font-semibold leading-snug text-foreground hover:text-primary">{e.title}</DemoLink>
                      ) : (
                        <p className="mt-1.5 font-heading text-lg font-semibold leading-snug text-foreground">{e.title}</p>
                      )}
                      <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><CalendarDays aria-hidden="true" className="w-3.5 h-3.5" /> {e.date}</span>
                        {e.location && <span className="inline-flex items-center gap-1"><MapPin aria-hidden="true" className="w-3.5 h-3.5" /> {e.location}</span>}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          {article && (
            <div className="lg:col-span-4">
              <p className="mb-1 text-sm font-semibold text-primary">מאמר</p>
              <h2 className="mb-6 font-heading text-2xl font-semibold text-foreground sm:text-3xl">כתיבה מקצועית</h2>
              <article className="rounded-super-sm border border-border bg-background p-5">
                <p className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{article.date}</span>
                  <span className="inline-flex items-center gap-1"><Clock aria-hidden="true" className="w-3.5 h-3.5" /> {article.readingMinutes} דקות קריאה</span>
                </p>
                <DemoLink to={`${ROUTES.articles}/${article.slug}`} className="mt-2 block font-heading text-xl font-semibold text-foreground hover:text-primary">
                  {article.title}
                </DemoLink>
                <p className="mt-1 text-sm text-foreground">{article.authors.join(' ו')}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{article.excerpt}</p>
                <DemoLink to={ROUTES.articles} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                  לכל המאמרים <ArrowLeft aria-hidden="true" className="w-4 h-4" />
                </DemoLink>
              </article>
            </div>
          )}
        </div>
      </section>

      {/* Partners */}
      <section aria-labelledby="partners" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="partners" className="font-heading text-xl font-semibold text-foreground">ארגונים שמטיב הכשירה או הדריכה</h2>
          <DemoLink to={`${ROUTES.about}#partners`} className="text-sm font-medium text-primary hover:underline">שותפים ומממנים</DemoLink>
        </div>
        <ul className="mt-5 flex flex-wrap gap-2">
          {PARTNERS.map((p) => (
            <li key={p} className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground">{p}</li>
          ))}
        </ul>
      </section>

      {/* Donate + contact */}
      <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-16 sm:px-6 md:grid-cols-2">
        <div className="rounded-super-sm bg-muted p-6 sm:p-8">
          <h2 className="font-heading text-2xl font-semibold text-foreground">{DONATE.title}</h2>
          <p className="mt-2 leading-relaxed text-foreground">{DONATE.intro}</p>
          <Button asChild variant="elevated" radius="full" size="roomy" className="mt-5">
            <DemoLink to={ROUTES.donate}>לדרכי התרומה</DemoLink>
          </Button>
        </div>
        <div className="rounded-super-sm border border-border bg-card p-6 sm:p-8">
          <h2 className="font-heading text-2xl font-semibold text-foreground">יצירת קשר</h2>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-muted-foreground">כתובת</dt>
            <dd className="text-foreground">{ORG.address}</dd>
            <dt className="text-muted-foreground">טלפון</dt>
            <dd><a href={`tel:${ORG.phones.main}`} className="text-primary hover:underline" dir="ltr">{ORG.phones.main}</a></dd>
            <dt className="text-muted-foreground">דוא"ל</dt>
            <dd><a href={`mailto:${ORG.emails.general}`} className="text-primary hover:underline">{ORG.emails.general}</a></dd>
          </dl>
          <Button asChild variant="outline" radius="full" size="roomy" className="mt-5 text-foreground">
            <DemoLink to={ROUTES.contact}>כל פרטי הקשר לפי נושא</DemoLink>
          </Button>
        </div>
      </section>
    </div>
  );
}
