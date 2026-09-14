import React, { useMemo, useState } from 'react';
import { ArrowLeft, Search, Phone, MessageCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { PATIENT_HUB } from '@/pages/metiv-demos/shared/patient';
import { cn } from '@/lib/utils';
import { FOCUS_LIGHT, telHref } from '../lib';
import { CardLink, Container, DoorCard, EmptyState, Icon, IconBadge, SectionTitle } from '../components/ui';

// Patient hub: an app dashboard. Banner with a topic filter, the crisis and
// consultation cards, three starting paths, then every topic as a tap target.

const FEATURED = ['questionnaire', 'calming'];

function Banner({ query, setQuery }) {
  const { hero } = PATIENT_HUB;
  return (
    <header className="bg-card border-b border-border">
      <Container className="py-10 sm:py-14 grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] items-center">
        <div className="max-w-2xl">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-foreground mb-4">{hero.eyebrow}</span>
          <h1 className="font-heading font-semibold text-4xl sm:text-5xl text-foreground leading-tight">{hero.headline}</h1>
          <p className="mt-4 text-lg text-card-foreground leading-relaxed">{hero.subtitle}</p>
          <div className="mt-7 relative max-w-xl">
            <label htmlFor="hub-search" className="sr-only">
              חיפוש נושא
            </label>
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <input
              id="hub-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="מה מחפשים? למשל: זכויות, ילדים, נשימה"
              className="w-full border placeholder:text-muted-foreground focus-visible:outline-none h-14 rounded-full ps-12 pe-5 text-base bg-background border-border shadow-atmospheric focus-visible:ring-2"
            />
          </div>
        </div>
        <div className="hidden lg:block">
          <div className="aspect-square rounded-super overflow-hidden border-8 border-background shadow-card">
            <img src={hero.image} alt="" aria-hidden="true" className="w-full h-full object-cover" />
          </div>
        </div>
      </Container>
    </header>
  );
}

function SupportRow() {
  const { crisisLines, consultation } = PATIENT_HUB;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section aria-labelledby="hub-crisis" className="rounded-super-sm bg-primary text-primary-foreground p-6 flex flex-col gap-4">
        <div>
          <h2 id="hub-crisis" className="font-heading font-semibold text-xl">צריכים לדבר עם מישהו עכשיו?</h2>
          <p className="opacity-90 text-sm mt-1">ער&quot;ן, עזרה ראשונה נפשית. אנונימי, בכל שעה.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {crisisLines.map((c) => (
            <a
              key={c.key}
              href={c.href}
              target={c.href.startsWith('http') ? '_blank' : undefined}
              rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className={cn('inline-flex items-center gap-2 h-12 px-5 rounded-full bg-primary-foreground text-foreground font-semibold hover:bg-card transition-colors duration-300', FOCUS_LIGHT)}
            >
              {c.icon === 'Phone' ? <Phone className="w-4 h-4" aria-hidden="true" /> : <MessageCircle className="w-4 h-4" aria-hidden="true" />}
              {c.key === 'eranPhone' ? `חיוג ${c.value}` : c.label}
            </a>
          ))}
        </div>
      </section>
      <section aria-labelledby="hub-consult" className="rounded-super-sm bg-card border border-border p-6 flex flex-col gap-3 shadow-card">
        <h2 id="hub-consult" className="font-heading font-semibold text-xl text-foreground">{consultation.title}</h2>
        <p className="text-sm text-card-foreground leading-relaxed">{consultation.text}</p>
        <div className="flex flex-wrap items-center gap-3 mt-auto">
          <a href={telHref(consultation.phone)} className={cn('inline-flex items-center gap-2 h-11 px-5 rounded-full bg-muted text-foreground font-semibold hover:bg-border transition-colors duration-300', FOCUS_LIGHT)}>
            <Phone className="w-4 h-4" aria-hidden="true" />
            <span dir="ltr">{consultation.phone}</span>
          </a>
          <DemoLink to={consultation.route} className={cn('inline-flex items-center gap-1 font-semibold text-accent underline-offset-4 hover:underline rounded', FOCUS_LIGHT)}>
            {consultation.linkLabel}
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </DemoLink>
        </div>
      </section>
    </div>
  );
}

function Paths() {
  return (
    <section className="mt-14" aria-labelledby="hub-paths">
      <SectionTitle id="hub-paths" eyebrow="מאיפה להתחיל" title="בחרו את הדרך שמתאימה לכם" />
      <ul className="grid gap-4 md:grid-cols-3">
        {PATIENT_HUB.paths.map((p) => (
          <li key={p.key}>
            <CardLink to={p.route} className="flex-col items-start gap-4 h-full p-6">
              <span className="w-24 h-24 rounded-full overflow-hidden bg-muted flex-shrink-0">
                <img src={p.image} alt="" aria-hidden="true" className="w-full h-full object-cover" />
              </span>
              <span className="font-heading font-semibold text-2xl text-foreground leading-snug">{p.title}</span>
              <span className="text-card-foreground leading-relaxed flex-1">{p.subtitle}</span>
              <span className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-primary text-primary-foreground font-semibold group-hover:bg-accent transition-colors duration-300">
                {p.ctaLabel}
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              </span>
            </CardLink>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Topics({ query, setQuery }) {
  const q = query.trim();
  const links = useMemo(() => {
    const all = [...PATIENT_HUB.quickLinks, ...PATIENT_HUB.additions.filter((a) => !PATIENT_HUB.quickLinks.some((l) => l.route === a.route))];
    if (!q) {
      const featured = FEATURED.map((k) => PATIENT_HUB.quickLinks.find((l) => l.key === k)).filter(Boolean);
      return [...featured, ...PATIENT_HUB.quickLinks.filter((l) => !FEATURED.includes(l.key))];
    }
    return all.filter((l) => `${l.label} ${l.description}`.includes(q));
  }, [q]);

  return (
    <section className="mt-14" aria-labelledby="hub-topics">
      <SectionTitle
        id="hub-topics"
        eyebrow="כל הנושאים"
        title={q ? `תוצאות עבור "${q}"` : 'מידע, כלים ועזרה'}
        description={q ? `${links.length} נושאים נמצאו` : undefined}
      />
      <div aria-live="polite">
        {links.length === 0 ? (
          <EmptyState
            title="לא מצאנו נושא כזה"
            text="אפשר לנסות מילה אחרת, או לפנות לייעוץ טלפוני."
            action={
              <Button type="button" variant="subtle" radius="full" onClick={() => setQuery('')}>
                ניקוי החיפוש
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {links.map((l) => {
              const featured = !q && FEATURED.includes(l.key);
              return (
                <li key={l.key} className={featured ? 'sm:col-span-1 lg:col-span-2' : ''}>
                  <DemoLink
                    to={l.route}
                    className={cn(
                      'group flex gap-4 h-full min-h-[88px] rounded-super-sm p-5 border transition-all duration-300 motion-reduce:transition-none',
                      featured
                        ? 'bg-sanctuary-foreground border-primary/40 hover:border-primary shadow-card hover:shadow-card-hover items-center'
                        : 'bg-card border-border shadow-card hover:shadow-card-hover hover:border-primary/50 items-start',
                      FOCUS_LIGHT
                    )}
                  >
                    <IconBadge name={l.icon} size={featured ? 'lg' : 'md'} className={featured ? 'bg-primary text-primary-foreground' : ''} />
                    <span className="min-w-0 flex-1">
                      <span className={cn('block font-heading font-semibold text-foreground leading-snug', featured ? 'text-xl' : 'text-lg')}>{l.label}</span>
                      <span className="block text-sm text-card-foreground leading-relaxed mt-1">{l.description}</span>
                    </span>
                    <ArrowLeft className="w-5 h-5 text-accent flex-shrink-0 self-center transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
                  </DemoLink>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function Additions() {
  return (
    <section className="mt-16 rounded-super bg-muted p-5 sm:p-8" aria-labelledby="hub-additions">
      <SectionTitle
        id="hub-additions"
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            חדש באתר
          </span>
        }
        title="שירותים ומידע של מטיב"
        description="מסגרות טיפול, קבוצות למשפחות ולילדים, ספרים והרצאות, מבית מטיב."
      />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PATIENT_HUB.additions.map((a) => (
          <li key={a.key}>
            <DemoLink
              to={a.route}
              className={cn('group flex flex-col gap-2 h-full min-h-[88px] rounded-2xl bg-card border border-border p-4 hover:border-primary transition-colors duration-300', FOCUS_LIGHT)}
            >
              <span className="flex items-center gap-2">
                <Icon name={a.icon} className="w-5 h-5 text-accent" />
                <span className="font-semibold text-foreground leading-snug">{a.label}</span>
              </span>
              <span className="text-sm text-card-foreground leading-relaxed">{a.description}</span>
            </DemoLink>
          </li>
        ))}
      </ul>
      <h3 className="font-heading font-semibold text-lg text-foreground mt-8 mb-3">המרפאות והתכניות של מטיב</h3>
      <ul className="flex flex-wrap gap-2">
        {PATIENT_HUB.metivServices.map((s) => (
          <li key={s.id}>
            <DemoLink
              to={s.route}
              className={cn('inline-flex items-center gap-2 h-11 px-4 rounded-full bg-card border border-border text-sm font-medium text-foreground hover:border-primary transition-colors duration-300', FOCUS_LIGHT)}
            >
              <Icon name={s.icon} className="w-4 h-4 text-accent" />
              {s.title}
            </DemoLink>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function PatientHub() {
  const [query, setQuery] = useState('');
  const { hero } = PATIENT_HUB;
  return (
    <div className="bg-background">
      <Banner query={query} setQuery={setQuery} />
      <Container className="py-10 sm:py-14">
        <SupportRow />
        {!query && <Paths />}
        <Topics query={query} setQuery={setQuery} />
        {!query && <Additions />}
        <section className="mt-16 grid gap-6 lg:grid-cols-2 items-center">
          <div>
            <h2 className="font-heading font-semibold text-2xl text-foreground">מה זו פוסט-טראומה?</h2>
            <p className="mt-3 text-card-foreground leading-relaxed">{hero.about}</p>
            <DemoLink to={hero.aboutRoute} className={cn('mt-4 inline-flex items-center gap-1 font-semibold text-accent hover:underline underline-offset-4 rounded', FOCUS_LIGHT)}>
              {hero.aboutLinkLabel}
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </DemoLink>
          </div>
          <DoorCard
            to={ROUTES.therapist}
            target="pro"
            title="עובדים בתחום הטיפול?"
            text="קורסים, הדרכה ומחקר נמצאים באזור אנשי המקצוע. אפשר לחזור לכאן בכל רגע."
          />
        </section>
        <p className="mt-12 text-xs text-muted-foreground leading-relaxed max-w-3xl">{PATIENT_HUB.disclaimer}</p>
      </Container>
    </div>
  );
}
