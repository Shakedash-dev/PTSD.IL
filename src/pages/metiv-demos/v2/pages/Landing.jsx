import React from 'react';
import { ArrowLeft, Phone, MessageCircle, HandHeart, MapPin, Mail, FileText, CheckCircle2 } from 'lucide-react';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { IMAGES } from '@/lib/images';
import {
  ORG,
  ABOUT,
  FACTS,
  METIV_SERVICES,
  DONATE,
  PARTNERS,
  FUNDERS_AND_COLLABORATORS,
  ACTIVE_STUDIES,
  UPCOMING_EVENTS,
  ARTICLES,
} from '@/pages/metiv-demos/shared/therapist';
import { cn } from '@/lib/utils';
import { ERAN_PHONE, ERAN_WHATSAPP, FOCUS_DARK, FOCUS_LIGHT, telHref } from '../lib';
// FOCUS_DARK: door panel and its quick links on the sanctuary half.
import { AreaContext, ArrowLink, CardLink, Container, IconBadge, Panel, SectionTitle, StatusPill, Tag } from '../components/ui';
import { EventCard } from '../components/cards';

const ILLUS = `${import.meta.env.BASE_URL || '/'}images/illustrations`;

// The two doors. Each panel is one big tap target (stretched link); the quick
// pills sit above it. Hover or keyboard focus widens a panel to ~54%.
const DOORS = [
  {
    key: 'patient',
    to: ROUTES.patient,
    chip: 'למתמודדים, לבני משפחה ולקרובים',
    title: 'אני מתמודד/ת, או קרוב/ה למי שמתמודד',
    text: 'מידע בשפה פשוטה, כלים לרגעים קשים, זכויות ודרכים לקבל טיפול.',
    cta: 'כניסה לאזור המטופלים והמשפחות',
    image: IMAGES.home_path1,
    quick: [
      { label: 'שאלון אנונימי', to: ROUTES.questionnaire },
      { label: 'תרגילי הרגעה', to: ROUTES.calming },
      { label: 'איפה מקבלים טיפול', to: ROUTES.whereToGetHelp },
    ],
  },
  {
    key: 'pro',
    to: ROUTES.therapist,
    chip: 'לפסיכולוגים, עו"ס, מטפלים וארגונים',
    title: 'אני איש/אשת מקצוע',
    text: 'קורסים והכשרות, הדרכה, תכניות לארגונים, מחקר ופרסומים של מטיב.',
    cta: 'כניסה לאזור אנשי המקצוע',
    image: `${ILLUS}/communities-second-circle.webp`,
    quick: [
      { label: 'קורסים והכשרות', to: ROUTES.courses },
      { label: 'מחקרים פעילים', to: ROUTES.research },
      { label: 'הדרכה', to: ROUTES.supervision },
    ],
  },
];

function Door({ door }) {
  const dark = door.key === 'pro';
  return (
    <section
      aria-labelledby={`door-${door.key}`}
      className={cn(
        'group/door relative flex flex-col justify-center overflow-hidden lg:flex-1 lg:basis-0',
        'transition-[flex-grow] duration-300 ease-out lg:hover:grow-[1.18] lg:focus-within:grow-[1.18] motion-reduce:transition-none',
        dark ? 'bg-sanctuary text-sanctuary-foreground' : 'bg-card text-foreground'
      )}
    >
      <div className="relative z-0 flex flex-col items-start gap-3 sm:gap-5 px-5 py-5 sm:px-10 sm:py-12 lg:px-14 xl:px-20 lg:py-14">
        <div className="flex items-center gap-4">
          <span
            className={cn(
              'inline-flex rounded-full overflow-hidden flex-shrink-0 w-14 h-14 sm:w-20 sm:h-20 lg:w-28 lg:h-28 border-4 transition-transform duration-300 group-hover/door:scale-105 motion-reduce:transition-none',
              dark ? 'bg-card border-sanctuary-foreground/15' : 'bg-muted border-background'
            )}
          >
            <img src={door.image} alt="" aria-hidden="true" className="w-full h-full object-cover" />
          </span>
          <span
            className={cn(
              'hidden sm:inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold',
              dark ? 'bg-sanctuary-foreground/10 border border-sanctuary-foreground/20' : 'bg-primary/10'
            )}
          >
            {door.chip}
          </span>
        </div>
        <h2 id={`door-${door.key}`} className="font-heading font-semibold text-2xl sm:text-4xl xl:text-5xl leading-tight max-w-lg">
          {door.title}
        </h2>
        <p className={cn('text-sm sm:text-lg leading-relaxed max-w-md', dark ? 'text-sanctuary-foreground/85' : 'text-card-foreground')}>{door.text}</p>
        <DemoLink
          to={door.to}
          className={cn(
            'inline-flex items-center justify-between sm:justify-center gap-3 rounded-full font-heading font-semibold sm:text-xl',
            'h-12 sm:h-16 px-6 sm:px-9 w-full sm:w-auto text-base shadow-atmospheric-lg transition-colors duration-300',
            'after:absolute after:inset-0 after:content-[""]',
            dark
              ? cn('bg-sanctuary-foreground text-sanctuary hover:bg-card', FOCUS_DARK)
              : cn('bg-primary text-primary-foreground hover:bg-accent', FOCUS_LIGHT)
          )}
        >
          {door.cta}
          <ArrowLeft className="w-6 h-6 transition-transform duration-300 group-hover/door:-translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
        </DemoLink>
        <ul className="relative z-10 hidden sm:flex flex-wrap gap-2 pt-1" aria-label="קיצורי דרך">
          {door.quick.map((q) => (
            <li key={q.to}>
              <DemoLink
                to={q.to}
                className={cn(
                  'inline-flex items-center h-10 px-4 rounded-full border text-sm font-medium transition-colors duration-300',
                  dark
                    ? cn('border-sanctuary-foreground/30 hover:bg-sanctuary-foreground/10', FOCUS_DARK)
                    : cn('border-border bg-background hover:border-primary', FOCUS_LIGHT)
                )}
              >
                {q.label}
              </DemoLink>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function DoorsHero() {
  return (
    <div>
      <div className="bg-background border-b border-border">
        <Container className="py-3 sm:py-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h1 className="font-heading font-semibold text-base sm:text-xl text-foreground">{ORG.name}</h1>
          <p className="hidden sm:block text-base text-card-foreground">{ORG.headline}. לאן תרצו להיכנס?</p>
        </Container>
      </div>
      <div className="flex flex-col lg:flex-row lg:min-h-[calc(100vh-11rem)]">
        {DOORS.map((d) => (
          <Door key={d.key} door={d} />
        ))}
      </div>
    </div>
  );
}

function HelpStrip() {
  const item = 'flex items-center gap-3 rounded-2xl p-3 sm:p-4 transition-colors duration-300';
  return (
    <Container size="default" className="relative z-10 -mt-6 lg:-mt-12">
      <div className="grid sm:grid-cols-3 gap-2 rounded-super bg-card border border-border shadow-atmospheric-lg p-2 sm:p-3">
        <div className={cn(item, 'bg-muted')}>
          <IconBadge name="LifeBuoy" />
          <div className="min-w-0">
            <p className="font-semibold text-foreground">קשה עכשיו? ער&quot;ן</p>
            <p className="text-sm flex flex-wrap gap-x-3">
              <a href={telHref(ERAN_PHONE)} className={cn('inline-flex items-center gap-1 font-semibold text-accent underline underline-offset-4 rounded', FOCUS_LIGHT)}>
                <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                {ERAN_PHONE}
              </a>
              <a href={ERAN_WHATSAPP} target="_blank" rel="noopener noreferrer" className={cn('inline-flex items-center gap-1 font-semibold text-accent underline underline-offset-4 rounded', FOCUS_LIGHT)}>
                <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                וואטסאפ
              </a>
            </p>
          </div>
        </div>
        <DemoLink to={ROUTES.about} className={cn(item, 'hover:bg-muted', FOCUS_LIGHT)}>
          <IconBadge name="Info" />
          <span className="min-w-0">
            <span className="block font-semibold text-foreground">מי אנחנו</span>
            <span className="block text-sm text-card-foreground">מטיב פועל מאז 1989</span>
          </span>
        </DemoLink>
        <DemoLink to={ROUTES.donate} className={cn(item, 'hover:bg-muted', FOCUS_LIGHT)}>
          <IconBadge name="HandHeart" className="bg-secondary/15" />
          <span className="min-w-0">
            <span className="block font-semibold text-foreground">תרומה למטיב</span>
            <span className="block text-sm text-card-foreground">{ORG.legalEntity}</span>
          </span>
        </DemoLink>
      </div>
    </Container>
  );
}

function Services() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <SectionTitle
          eyebrow="טיפול"
          title="השירותים הטיפוליים של מטיב"
          description="מרפאות ותכניות של מטיב. בכל כרטיס: למי זה מיועד ואיך פונים."
          action={<ArrowLink to={ROUTES.whereToGetHelp}>כל המסגרות ופרטי הפנייה</ArrowLink>}
        />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {METIV_SERVICES.map((s) => (
            <li key={s.slug}>
              <CardLink to={s.href} className="flex-col gap-3 h-full">
                <IconBadge name={s.icon} />
                <span className="font-heading font-semibold text-lg text-foreground leading-snug">{s.title}</span>
                <span className="text-sm text-card-foreground leading-relaxed flex-1">{s.summary}</span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
                  לפרטים ופנייה <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                </span>
              </CardLink>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/** @param {{ className?: string }} props */
export function FactsBand({ className = '' }) {
  return (
    <section aria-label="מטיב במספרים" className={cn('bg-muted py-12', className)}>
      <Container>
        <ul className="grid grid-cols-2 lg:grid-cols-5 gap-6">
          {FACTS.map((f) => (
            <li key={f.label} className="text-center lg:text-start">
              <p className="font-heading font-semibold text-4xl text-foreground" dir="ltr">
                {f.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground leading-snug">{f.label}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs text-muted-foreground">המספרים כפי שהם מופיעים באתר מטיב.</p>
      </Container>
    </section>
  );
}

function AboutTeaser() {
  return (
    <section className="py-16 sm:py-20">
      <Container className="grid gap-10 lg:grid-cols-2 items-start">
        <div>
          <SectionTitle eyebrow="אודות" title="על מטיב" description={ORG.intro} className="mb-6" />
          <div className="grid sm:grid-cols-2 gap-4">
            <Panel>
              <h3 className="font-heading font-semibold text-foreground mb-2">החזון</h3>
              <p className="text-sm text-card-foreground leading-relaxed">{ORG.vision}</p>
            </Panel>
            <Panel>
              <h3 className="font-heading font-semibold text-foreground mb-2">המטרה</h3>
              <p className="text-sm text-card-foreground leading-relaxed line-clamp-6">{ORG.mission}</p>
            </Panel>
          </div>
          <div className="mt-6">
            <ArrowLink to={ROUTES.about}>ההיסטוריה, הצוות והשותפים</ArrowLink>
          </div>
        </div>
        <Panel className="p-6 sm:p-8">
          <h3 className="font-heading font-semibold text-xl text-foreground mb-4">מה עושים במטיב</h3>
          <ul className="space-y-3">
            {ABOUT.activities.map((a) => (
              <li key={a} className="flex gap-3 text-foreground">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>{a}</span>
              </li>
            ))}
          </ul>
          <ol className="mt-8 grid grid-cols-3 gap-3 border-t border-border pt-6">
            {ABOUT.timeline.slice(0, 3).map((t, i) => (
              <li key={`${t.year}-${i}`}>
                <p className="font-heading font-semibold text-2xl text-foreground">{t.year}</p>
                <p className="text-xs text-card-foreground leading-snug mt-1">{t.text}</p>
              </li>
            ))}
          </ol>
        </Panel>
      </Container>
    </section>
  );
}

/** A dark band inside the landing: professional news, in the professional colour. */
function ProBand() {
  const recruiting = ACTIVE_STUDIES.filter((s) => s.recruiting);
  const article = ARTICLES[0];
  return (
    <AreaContext.Provider value="pro">
      <section className="bg-sanctuary text-sanctuary-foreground py-16 sm:py-20">
        <Container>
          <SectionTitle
            eyebrow="מהאזור המקצועי"
            title="אירועים, מחקר וכתיבה"
            description="מחזורי קורסים קרובים, מחקרים שמגייסים משתתפים, ומאמרים של צוות מטיב."
            action={<ArrowLink to={ROUTES.therapist}>לאזור אנשי המקצוע</ArrowLink>}
          />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <h3 className="font-heading font-semibold text-lg">בקרוב</h3>
              {UPCOMING_EVENTS.map((e) => (
                <EventCard key={e.slug} event={e} />
              ))}
              <ArrowLink to={ROUTES.events}>כל האירועים והעדכונים</ArrowLink>
            </div>
            <div className="space-y-4">
              <Panel>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="font-heading font-semibold text-lg">מחקרים פעילים</h3>
                  <StatusPill kind="recruiting" label={`${recruiting.length} מגייסים`} />
                </div>
                <ul className="space-y-3">
                  {recruiting.map((s) => (
                    <li key={s.slug} className="text-sm">
                      <p className="font-semibold">{s.title}</p>
                      <p className="text-sanctuary-foreground/75 leading-relaxed line-clamp-2">{s.summary}</p>
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                  <ArrowLink to={ROUTES.research}>למחקרים</ArrowLink>
                </div>
              </Panel>
              {article && (
                <CardLink to={`${ROUTES.articles}/${article.slug}`} className="flex-col gap-2">
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4" aria-hidden="true" />
                    <span className="text-sm text-sanctuary-foreground/80">מאמר · {article.date}</span>
                  </span>
                  <span className="font-heading font-semibold text-lg">{article.title}</span>
                  <span className="text-sm text-sanctuary-foreground/80 leading-relaxed">{article.authors.join(' ו')}</span>
                </CardLink>
              )}
            </div>
          </div>
        </Container>
      </section>
    </AreaContext.Provider>
  );
}

function DonateBand() {
  return (
    <section className="py-16 sm:py-20">
      <Container size="default">
        <div className="rounded-super bg-card border border-border shadow-card overflow-hidden grid md:grid-cols-[1fr_auto]">
          <div className="p-6 sm:p-10 border-s-8 border-secondary">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
              <HandHeart className="w-4 h-4 text-accent" aria-hidden="true" />
              תרומה
            </p>
            <h2 className="font-heading font-semibold text-3xl text-foreground">{DONATE.title}</h2>
            <p className="mt-3 text-card-foreground leading-relaxed max-w-2xl">{DONATE.intro}</p>
          </div>
          <div className="p-6 sm:p-10 flex flex-col justify-center gap-3 bg-muted">
            <DemoLink
              to={ROUTES.donate}
              className={cn('inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-primary text-primary-foreground font-semibold text-lg hover:bg-accent transition-colors duration-300', FOCUS_LIGHT)}
            >
              לדרכי התרומה
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </DemoLink>
            <p className="text-xs text-muted-foreground text-center">{DONATE.legalEntity}</p>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Partners() {
  return (
    <section className="pb-16 sm:pb-20">
      <Container>
        <SectionTitle eyebrow="שותפים" title="שותפים וגופים שעבדו עם מטיב" description="שיתופי פעולה, מממנים וארגונים שמטיב הכשירה או הדריכה, כפי שהם מופיעים באתר מטיב." />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FUNDERS_AND_COLLABORATORS.slice(0, 8).map((f) => (
            <li key={f.name} className="rounded-2xl bg-card border border-border p-4">
              <p className="font-semibold text-foreground leading-snug">{f.name}</p>
              <p className="text-xs text-card-foreground mt-1 leading-relaxed line-clamp-3">{f.role}</p>
            </li>
          ))}
        </ul>
        <ul className="mt-5 flex flex-wrap gap-2" aria-label="ארגונים שהוכשרו או הודרכו">
          {PARTNERS.map((p) => (
            <li key={p}>
              <Tag className="text-sm py-1 px-3 bg-card border-border">{p}</Tag>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

function ContactTeaser() {
  return (
    <section className="bg-muted py-16 sm:py-20">
      <Container className="grid gap-8 lg:grid-cols-[1fr_2fr] items-start">
        <SectionTitle eyebrow="צור קשר" title="אפשר לפנות אלינו" description="לשאלות על טיפול, הכשרות, מחקר או שותפות." action={<ArrowLink to={ROUTES.contact}>כל דרכי הפנייה</ArrowLink>} />
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            { icon: Phone, label: 'מרפאת המבוגרים', value: ORG.phones.main, href: telHref(ORG.phones.main), ltr: true },
            { icon: Phone, label: 'מטיב ילדים', value: ORG.phones.kids, href: telHref(ORG.phones.kids), ltr: true },
            { icon: Mail, label: 'מייל כללי', value: ORG.emails.general, href: `mailto:${ORG.emails.general}`, ltr: true },
            { icon: MapPin, label: 'כתובת', value: ORG.address },
          ].map((c) => {
            const I = c.icon;
            const body = (
              <>
                <span className="inline-flex w-11 h-11 rounded-2xl items-center justify-center bg-primary/10 text-accent flex-shrink-0">
                  <I className="w-5 h-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm text-card-foreground">{c.label}</span>
                  <span className="block font-semibold text-foreground" dir={c.ltr ? 'ltr' : undefined}>
                    {c.value}
                  </span>
                </span>
              </>
            );
            return (
              <li key={c.label}>
                {c.href ? (
                  <a href={c.href} className={cn('flex items-center gap-3 rounded-2xl bg-card border border-border p-4 hover:border-primary transition-colors duration-300 min-h-[88px]', FOCUS_LIGHT)}>
                    {body}
                  </a>
                ) : (
                  <div className="flex items-center gap-3 rounded-2xl bg-card border border-border p-4 min-h-[88px]">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

/** The doors again, at the end of the page. */
export function RepeatDoors({ title = 'לאן ממשיכים?' }) {
  return (
    <section className="py-16 sm:py-20" aria-labelledby="repeat-doors">
      <Container>
        <h2 id="repeat-doors" className="font-heading font-semibold text-2xl sm:text-3xl text-foreground mb-6">
          {title}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <DemoLink
            to={ROUTES.patient}
            className={cn('group flex items-center gap-5 rounded-super p-6 sm:p-8 bg-card border-2 border-primary/30 hover:border-primary shadow-card hover:shadow-card-hover transition-all duration-300 min-h-[140px]', FOCUS_LIGHT)}
          >
            <span className="inline-flex w-20 h-20 rounded-full overflow-hidden bg-muted flex-shrink-0">
              <img src={IMAGES.home_path1} alt="" aria-hidden="true" className="w-full h-full object-cover" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-heading font-semibold text-2xl text-foreground">למטופלים ומשפחות</span>
              <span className="block text-card-foreground mt-1">מידע, כלים, זכויות ודרכים לטיפול</span>
            </span>
            <span className="inline-flex w-12 h-12 rounded-full items-center justify-center bg-primary text-primary-foreground flex-shrink-0">
              <ArrowLeft className="w-6 h-6 transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
            </span>
          </DemoLink>
          <DemoLink
            to={ROUTES.therapist}
            className={cn('group flex items-center gap-5 rounded-super p-6 sm:p-8 bg-sanctuary text-sanctuary-foreground border-2 border-sanctuary hover:border-accent shadow-card hover:shadow-card-hover transition-all duration-300 min-h-[140px]', FOCUS_LIGHT)}
          >
            <span className="inline-flex w-20 h-20 rounded-full overflow-hidden bg-card flex-shrink-0">
              <img src={`${ILLUS}/communities-second-circle.webp`} alt="" aria-hidden="true" className="w-full h-full object-cover" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-heading font-semibold text-2xl">למטפלים ואנשי מקצוע</span>
              <span className="block text-sanctuary-foreground/85 mt-1">קורסים, הדרכה, מחקר ופרסומים</span>
            </span>
            <span className="inline-flex w-12 h-12 rounded-full items-center justify-center bg-sanctuary-foreground text-sanctuary flex-shrink-0">
              <ArrowLeft className="w-6 h-6 transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
            </span>
          </DemoLink>
        </div>
      </Container>
    </section>
  );
}

export default function Landing() {
  return (
    <>
      <DoorsHero />
      <HelpStrip />
      <Services />
      <FactsBand />
      <AboutTeaser />
      <ProBand />
      <DonateBand />
      <Partners />
      <ContactTeaser />
      <RepeatDoors />
    </>
  );
}
