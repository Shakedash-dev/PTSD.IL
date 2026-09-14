import React, { useState } from 'react';
import { Mail, Phone, MapPin, Printer, ExternalLink, Info, Facebook, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui';
import Disclosure from '@/components/patterns/Disclosure';
import ChoiceChip from '@/components/patterns/ChoiceChip';
import { DemoLink, useDemoChrome } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { PATIENT_HUB } from '@/pages/metiv-demos/shared/patient';
import {
  ORG,
  ABOUT,
  FACTS,
  TEAM,
  TEAM_GROUPS,
  PARTNERS,
  FUNDERS_AND_COLLABORATORS,
  DONATE,
  LEGAL,
  METIV_SERVICES,
} from '@/pages/metiv-demos/shared/therapist';
import ContentLayout from '../components/ContentLayout';
import Icon from '../components/Icon';
import { KeyFacts, ContactCard, ExtLink, SectionTitle, Panel, Tag, Avatar, waLink } from '../components/primitives';
import { METIV_RAIL } from '../lib/nav';

const ERAN = PATIENT_HUB.crisisLines.find((l) => l.key === 'eranPhone');

// ── About ───────────────────────────────────────────────────────────────────

export function About() {
  const { PageHeader } = useDemoChrome();
  const [group, setGroup] = useState('all');
  const team = TEAM.filter((m) => group === 'all' || m.group === group);
  const toc = [
    { id: 'vision', label: 'חזון ומטרה' },
    { id: 'numbers', label: 'מטיב במספרים' },
    { id: 'activities', label: 'תחומי פעילות' },
    { id: 'history', label: 'היסטוריה' },
    { id: 'timeline', label: 'ציוני דרך' },
    { id: 'team', label: 'צוות' },
    { id: 'partners', label: 'שותפים ומממנים' },
  ];

  return (
    <div className="bg-background">
      <PageHeader tone="card" eyebrow="מטיב" title={ABOUT.title} subtitle={ORG.name} meta={<span>{ORG.legalEntity}</span>} />
      <ContentLayout rail={METIV_RAIL} railTitle="מטיב" toc={toc}>
        <div className="space-y-14">
          <section aria-labelledby="vision">
            <SectionTitle id="vision" title="חזון ומטרה" />
            <div className="grid gap-4 md:grid-cols-2">
              <Panel className="bg-muted border-transparent">
                <p className="text-sm font-semibold text-primary">החזון</p>
                <p className="mt-2 font-heading text-xl font-semibold leading-snug text-foreground">{ORG.vision}</p>
              </Panel>
              <Panel>
                <p className="text-sm font-semibold text-primary">המטרה</p>
                <p className="mt-2 leading-relaxed text-foreground">{ORG.mission}</p>
              </Panel>
            </div>
          </section>

          <section aria-labelledby="numbers">
            <SectionTitle id="numbers" title="מטיב במספרים" description="נתוני היקף כפי שפורסמו באתר מטיב. אינם מדדי תוצאה." />
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {FACTS.map((f) => (
                <li key={f.label} className="rounded-super-sm border border-border bg-card p-4">
                  <p className="font-heading text-2xl font-semibold text-foreground" dir="ltr">{f.value}</p>
                  <p className="mt-1 text-sm leading-snug text-foreground">{f.label}</p>
                  <p className="mt-2 text-xs text-muted-foreground"><a href={f.sourceUrl} target="_blank" rel="noreferrer" className="hover:underline">מקור: {f.source}</a></p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="activities">
            <SectionTitle id="activities" title="תחומי פעילות" />
            <div className="space-y-3 leading-relaxed text-foreground">{ABOUT.activitiesIntro.map((p) => <p key={p}>{p}</p>)}</div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Panel>
                <p className="mb-3 font-heading font-semibold text-foreground">מה מטיב עושה</p>
                <ul className="space-y-2">{ABOUT.activities.map((a) => <li key={a} className="flex gap-2 text-foreground"><span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />{a}</li>)}</ul>
              </Panel>
              <Panel>
                <p className="mb-3 font-heading font-semibold text-foreground">קהילות</p>
                <ul className="space-y-2">{ABOUT.communities.map((a) => <li key={a} className="flex gap-2 text-foreground"><span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />{a}</li>)}</ul>
                <p className="mb-2 mt-5 font-heading font-semibold text-foreground">התערבות באזורי אסון בעולם</p>
                <ul className="flex flex-wrap gap-1.5">{ABOUT.partnersAbroad.map((a) => <li key={a}><Tag>{a}</Tag></li>)}</ul>
              </Panel>
            </div>
            <div className="mt-6">
              <p className="mb-3 font-heading font-semibold text-foreground">שירותי הטיפול</p>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {METIV_SERVICES.map((s) => (
                  <li key={s.slug}>
                    <DemoLink to={s.href} className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5 font-medium text-foreground hover:border-primary">
                      <Icon name={s.icon} className="w-4 h-4 text-primary" /> {s.title}
                    </DemoLink>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section aria-labelledby="history">
            <SectionTitle id="history" title="היסטוריה" />
            <div className="space-y-4 leading-relaxed text-foreground">{ABOUT.history.slice(0, 2).map((p) => <p key={p}>{p}</p>)}</div>
            <Disclosure className="mt-4" variant="soft" size="compact" label="להמשך הקריאה">
              <div className="space-y-4 leading-relaxed text-foreground">{ABOUT.history.slice(2).map((p) => <p key={p}>{p}</p>)}</div>
            </Disclosure>
          </section>

          <section aria-labelledby="timeline">
            <SectionTitle id="timeline" title="ציוני דרך" />
            <ol className="relative space-y-5 border-s-2 border-border ps-6">
              {ABOUT.timeline.map((t) => (
                <li key={t.year + t.text} className="relative">
                  <span aria-hidden="true" className="absolute -start-[1.95rem] top-1.5 size-3 rounded-full border-2 border-card bg-primary" />
                  <p className="font-heading text-lg font-semibold text-foreground">{t.year}</p>
                  <p className="leading-relaxed text-foreground">{t.text}</p>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="team">
            <SectionTitle id="team" title="צוות" description={ABOUT.teamIntro} />
            <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="סינון לפי תחום">
              <ChoiceChip size="sm" selected={group === 'all'} onClick={() => setGroup('all')}>הכל ({TEAM.length})</ChoiceChip>
              {TEAM_GROUPS.map((g) => (
                <ChoiceChip key={g} size="sm" selected={group === g} onClick={() => setGroup(g)}>
                  {g} ({TEAM.filter((m) => m.group === g).length})
                </ChoiceChip>
              ))}
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {team.map((m) => (
                <li key={m.name} className="rounded-super-sm border border-border bg-card p-4">
                  <div className="flex gap-3">
                    <Avatar name={m.name} />
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{m.name}</p>
                      <p className="text-sm leading-snug text-muted-foreground">{m.role}</p>
                      {m.email && <a href={`mailto:${m.email}`} className="text-sm text-primary hover:underline" dir="ltr">{m.email}</a>}
                    </div>
                  </div>
                  {m.bio && (
                    <Disclosure className="mt-3" variant="plain" size="tight" label="קצת עליי">
                      <p className="text-sm leading-relaxed text-foreground">{m.bio}</p>
                    </Disclosure>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="partners">
            <SectionTitle id="partners" title="שותפים ומממנים" description="כפי שמוזכרים בטקסטים של מטיב." />
            <div className="hidden overflow-hidden rounded-super-sm border border-border bg-card md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted hover:bg-muted">
                    <TableHead className="text-start font-semibold text-foreground">ארגון</TableHead>
                    <TableHead className="text-start font-semibold text-foreground">הקשר</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {FUNDERS_AND_COLLABORATORS.map((f) => (
                    <TableRow key={f.name}>
                      <TableCell className="py-3 font-medium text-foreground">{f.name}</TableCell>
                      <TableCell className="py-3 text-foreground">{f.role}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ul className="space-y-2 md:hidden">
              {FUNDERS_AND_COLLABORATORS.map((f) => (
                <li key={f.name} className="rounded-xl border border-border bg-card p-3">
                  <p className="font-medium text-foreground">{f.name}</p>
                  <p className="text-sm text-muted-foreground">{f.role}</p>
                </li>
              ))}
            </ul>
            <p className="mb-2 mt-6 font-heading font-semibold text-foreground">ארגונים שמטיב הכשירה או הדריכה</p>
            <ul className="flex flex-wrap gap-2">{PARTNERS.map((p) => <li key={p} className="rounded-xl border border-border bg-card px-3.5 py-2 text-sm text-foreground">{p}</li>)}</ul>
          </section>

          <p className="text-sm text-muted-foreground">מקור: <ExtLink href={ABOUT.sourceUrl}>עמוד אודות באתר מטיב</ExtLink></p>
        </div>
      </ContentLayout>
    </div>
  );
}

// ── Donate ──────────────────────────────────────────────────────────────────

export function Donate() {
  const { PageHeader } = useDemoChrome();
  return (
    <div className="bg-background">
      <PageHeader tone="card" eyebrow="מטיב" title={DONATE.title} subtitle={DONATE.intro} meta={<span>{DONATE.legalEntity}</span>} />
      <ContentLayout rail={METIV_RAIL} railTitle="מטיב">
        {DONATE.isPlaceholder && (
          <div role="note" className="mb-6 flex gap-3 rounded-xl border border-info/40 bg-card p-4 text-foreground">
            <Info aria-hidden="true" className="mt-0.5 w-5 h-5 shrink-0 text-info" />
            <p className="text-sm leading-relaxed">התוכן בעמוד זה זמני ומסומן [טקסט זמני]. הנוסח הסופי יגיע ממטיב.</p>
          </div>
        )}
        <ul className="grid gap-4 md:grid-cols-2">
          {DONATE.ways.map((w) => (
            <li key={w.key} className="flex flex-col rounded-super-sm border border-border bg-card p-6">
              <h2 className="font-heading text-xl font-semibold text-foreground">{w.title}</h2>
              <p className="mt-2 flex-1 leading-relaxed text-foreground">{w.description}</p>
              {w.url && (
                <Button asChild variant="elevated" radius="full" size="roomy-lg" className="mt-5 self-start">
                  <a href={w.url} target="_blank" rel="noreferrer">{w.cta} <ExternalLink aria-hidden="true" /></a>
                </Button>
              )}
              {w.email && (
                <Button asChild variant="outline" radius="full" size="roomy-lg" className="mt-5 self-start text-foreground">
                  <a href={`mailto:${w.email}`}><Mail aria-hidden="true" /> {w.cta}</a>
                </Button>
              )}
            </li>
          ))}
        </ul>
        <Panel className="mt-6 bg-muted border-transparent">
          <p className="text-sm leading-relaxed text-foreground">{DONATE.paymentNote}</p>
          <p className="mt-2 text-sm text-muted-foreground">{ORG.legalName} · {DONATE.legalEntity}</p>
        </Panel>
        <p className="mt-6 text-foreground">
          רוצים להכיר את הפעילות לפני שתורמים? <DemoLink to={ROUTES.about} className="font-medium text-primary hover:underline">אודות מטיב</DemoLink>
        </p>
      </ContentLayout>
    </div>
  );
}

// ── Contact ─────────────────────────────────────────────────────────────────

export function Contact() {
  const { PageHeader } = useDemoChrome();
  const byTopic = [
    { topic: 'פניות כלליות ומרפאת המבוגרים', email: ORG.emails.general, phone: ORG.phones.main },
    { topic: 'מטיב ילדים', email: ORG.emails.kids, phone: ORG.phones.kids },
    { topic: 'קורסים, קליידוסקופ והדרכה לארגונים', email: ORG.emails.courses, whatsapp: ORG.phones.coursesWhatsapp },
    { topic: 'הרשמה להכשרות בתחום הילדים והמשפחה', email: ORG.emails.registration },
    { topic: 'מחקר והשתתפות במחקרים', email: ORG.emails.research, whatsapp: ORG.phones.researchWhatsapp },
    { topic: 'שותפויות ותרומות', email: ORG.emails.partnerships },
    { topic: 'רכז הנגישות', phone: ORG.phones.accessibilityCoordinator },
  ];
  const toc = [
    { id: 'urgent', label: 'פנייה דחופה' },
    { id: 'general', label: 'פרטי המרכז' },
    { id: 'by-topic', label: 'לפי נושא' },
    { id: 'forms', label: 'טפסי פנייה' },
    { id: 'social', label: 'רשתות' },
  ];

  return (
    <div className="bg-background">
      <PageHeader tone="card" eyebrow="מטיב" title="יצירת קשר" subtitle="כתובת, טלפונים ודואר אלקטרוני, לפי נושא הפנייה." />
      <ContentLayout rail={METIV_RAIL} railTitle="מטיב" toc={toc}>
        <div className="space-y-12">
          <section aria-labelledby="urgent" className="rounded-super-sm bg-sanctuary p-5 text-sanctuary-foreground sm:p-6">
            <h2 id="urgent" className="font-heading text-xl font-semibold">פנייה דחופה</h2>
            <p className="mt-1 text-sanctuary-foreground/85">פנייה למטיב אינה מענה חירום. לעזרה נפשית מיידית אפשר לפנות לער"ן בכל שעה.</p>
            <a href={ERAN?.href} className="mt-3 inline-flex items-center gap-2 rounded-full bg-card px-5 py-2.5 font-semibold text-foreground hover:bg-muted">
              <Phone aria-hidden="true" className="w-4 h-4" /> {'ער"ן'} {ERAN?.value}
            </a>
          </section>

          <section aria-labelledby="general">
            <SectionTitle id="general" title="פרטי המרכז" />
            <KeyFacts
              items={[
                { label: 'כתובת', value: ORG.address, icon: MapPin },
                { label: 'דואר', value: ORG.mail, icon: Mail },
                { label: 'טלפון', value: <a href={`tel:${ORG.phones.main}`} className="text-primary hover:underline" dir="ltr">{ORG.phones.main}</a>, icon: Phone },
                { label: 'טלפון מטיב ילדים', value: <a href={`tel:${ORG.phones.kids}`} className="text-primary hover:underline" dir="ltr">{ORG.phones.kids}</a>, icon: Phone },
                { label: 'פקס', value: <span dir="ltr">{ORG.phones.fax}</span>, icon: Printer },
                { label: 'דואר אלקטרוני', value: <a href={`mailto:${ORG.emails.general}`} className="text-primary hover:underline">{ORG.emails.general}</a>, icon: Mail },
              ]}
            />
          </section>

          <section aria-labelledby="by-topic">
            <SectionTitle id="by-topic" title="לפי נושא" />
            <div className="hidden overflow-hidden rounded-super-sm border border-border bg-card md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted hover:bg-muted">
                    <TableHead className="text-start font-semibold text-foreground">נושא</TableHead>
                    <TableHead className="text-start font-semibold text-foreground">דואר אלקטרוני</TableHead>
                    <TableHead className="text-start font-semibold text-foreground">טלפון או וואטסאפ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byTopic.map((r) => (
                    <TableRow key={r.topic}>
                      <TableCell className="py-3 font-medium text-foreground">{r.topic}</TableCell>
                      <TableCell className="py-3">{r.email ? <a href={`mailto:${r.email}`} className="text-primary hover:underline">{r.email}</a> : <span className="text-muted-foreground">-</span>}</TableCell>
                      <TableCell className="py-3">
                        {r.phone && <a href={`tel:${r.phone}`} className="text-primary hover:underline" dir="ltr">{r.phone}</a>}
                        {r.whatsapp && <a href={waLink(r.whatsapp)} target="_blank" rel="noreferrer" className="text-primary hover:underline">וואטסאפ <span dir="ltr">{r.whatsapp}</span></a>}
                        {!r.phone && !r.whatsapp && <span className="text-muted-foreground">-</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ul className="space-y-3 md:hidden">
              {byTopic.map((r) => (
                <li key={r.topic}>
                  <ContactCard title={r.topic} contact={{ email: r.email, phone: r.phone, whatsapp: r.whatsapp }} />
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="forms">
            <SectionTitle id="forms" title="טפסי פנייה" />
            <ul className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'פנייה למרפאת המבוגרים', url: ORG.adultsClinicFormUrl },
                { label: 'פנייה למרפאת הילדים', url: ORG.kidsClinicFormUrl },
                { label: 'פנייה להכשרה או הדרכה', url: ORG.trainingsFormUrl },
              ].map((f) => (
                <li key={f.url} className="rounded-xl border border-border bg-card p-4"><ExtLink href={f.url}>{f.label}</ExtLink></li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="social">
            <SectionTitle id="social" title="רשתות" />
            <ul className="flex flex-wrap gap-3">
              <li><ExtLink href={ORG.social.facebook} className="rounded-full border border-border bg-card px-4 py-2"><Facebook aria-hidden="true" className="w-4 h-4" /> מטיב בפייסבוק</ExtLink></li>
              <li><ExtLink href={ORG.social.facebookKids} className="rounded-full border border-border bg-card px-4 py-2"><Facebook aria-hidden="true" className="w-4 h-4" /> מטיב ילדים</ExtLink></li>
              <li><ExtLink href={ORG.social.youtube} className="rounded-full border border-border bg-card px-4 py-2"><Youtube aria-hidden="true" className="w-4 h-4" /> ערוץ היוטיוב</ExtLink></li>
            </ul>
          </section>
        </div>
      </ContentLayout>
    </div>
  );
}

// ── Accessibility ───────────────────────────────────────────────────────────

export function AccessibilityStatement() {
  const { PageHeader } = useDemoChrome();
  const A = LEGAL.accessibility;
  const toc = A.sections.map((s, i) => ({ id: `a11y-${i + 1}`, label: s.title }));
  return (
    <div className="bg-background">
      <PageHeader tone="card" eyebrow="מטיב" title={A.title} meta={<span>עודכן לאחרונה: {A.updated}</span>} />
      <ContentLayout rail={METIV_RAIL} railTitle="מטיב" toc={toc} aside={<ContactCard title="רכז הנגישות" contact={{ phone: A.coordinator.phone, email: A.coordinator.email }} />}>
        <div role="note" className="mb-8 flex gap-3 rounded-xl border border-info/40 bg-card p-4 text-foreground">
          <Info aria-hidden="true" className="mt-0.5 w-5 h-5 shrink-0 text-info" />
          <p className="text-sm leading-relaxed">{A.demoNote}</p>
        </div>
        <div className="max-w-3xl space-y-8">
          {A.sections.map((s, i) => (
            <section key={s.title} aria-labelledby={`a11y-${i + 1}`}>
              <h2 id={`a11y-${i + 1}`} className="font-heading text-xl font-semibold text-foreground">{s.title}</h2>
              <p className="mt-2 leading-relaxed text-foreground">{s.body}</p>
            </section>
          ))}
        </div>
        <ContactCard className="mt-10 max-w-md" title="רכז הנגישות של העמותה" contact={{ phone: A.coordinator.phone, email: A.coordinator.email, name: A.coordinator.address }} />
        <p className="mt-6 text-sm text-muted-foreground">מקור: <ExtLink href={A.sourceUrl}>הצהרת הנגישות באתר מטיב</ExtLink></p>
      </ContentLayout>
    </div>
  );
}
