import React, { useState } from 'react';
import { ArrowLeft, Check, PlayCircle, Users } from 'lucide-react';
import Disclosure from '@/components/patterns/Disclosure';
import { DemoLink, DemoMarkdown } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { ACTIVE_STUDIES, RESEARCH_INTRO } from '@/pages/metiv-demos/shared/therapist';
import { cn } from '@/lib/utils';
import PageHeaderV3 from '../components/PageHeaderV3';
import { PTSD_INFO_IMG } from '../images';
import { Band, ChipQuestion, ContactChips, ExternalLink, FactGrid, PILL_OUTLINE, PILL_SOLID, SectionHeading, StatusPill } from '../components/kit';

export default function Research() {
  const [show, setShow] = useState('all');
  const recruiting = ACTIVE_STUDIES.filter((s) => s.recruiting);
  const studies = show === 'recruiting' ? recruiting : ACTIVE_STUDIES;

  return (
    <div className="bg-background">
      <PageHeaderV3
        tone="muted"
        eyebrow="מחקר"
        title={RESEARCH_INTRO.title}
        subtitle={`מיקוד: ${RESEARCH_INTRO.focus}`}
        illustration={PTSD_INFO_IMG}
        short={[
          `${ACTIVE_STUDIES.length} מחקרים פעילים, מתוכם ${recruiting.length} מגייסים משתתפים.`,
          'לכל מחקר: אוכלוסייה, תנאי השתתפות ופרטי קשר.',
          `ג'ורנל קלאב: ${RESEARCH_INTRO.journalClub.description}`,
        ]}
        actions={<DemoLink to={ROUTES.publications} className={PILL_OUTLINE}>לפרסומים של אנשי מטיב <ArrowLeft className="w-4 h-4" aria-hidden="true" /></DemoLink>}
      />

      <Band tone="canvas" labelledBy="res-unit">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading id="res-unit" eyebrow="על היחידה" title="מה עושה יחידת המחקר" className="mb-4" />
            <div className="space-y-4 text-lg text-foreground leading-relaxed">
              {RESEARCH_INTRO.paragraphs.map((p) => <p key={p}>{p}</p>)}
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-super bg-card border border-border p-6">
              <p className="font-heading font-semibold text-lg text-foreground">התפקיד של היחידה</p>
              <p className="mt-1 text-foreground leading-relaxed">{RESEARCH_INTRO.role}</p>
            </div>
            <div className="rounded-super bg-card border border-border p-6">
              <p className="font-heading font-semibold text-lg text-foreground mb-3">עקרונות העבודה</p>
              <ul className="flex flex-wrap gap-2">{RESEARCH_INTRO.principles.map((p) => <li key={p}><StatusPill tone="primary">{p}</StatusPill></li>)}</ul>
            </div>
          </div>
        </div>
      </Band>

      <Band tone="card" labelledBy="res-studies">
        <SectionHeading id="res-studies" eyebrow="מחקרים פעילים" title="מה נחקר עכשיו?" intro="אם את/ה או מטופל/ת שלך מתאימים למחקר שמגייס, פרטי הקשר מופיעים בכרטיס." />
        <ChipQuestion
          legend="אילו מחקרים להציג?"
          value={show}
          onChange={setShow}
          className="mb-8"
          options={[
            { key: 'all', label: 'כל המחקרים', count: ACTIVE_STUDIES.length },
            { key: 'recruiting', label: 'רק מחקרים שמגייסים', count: recruiting.length },
          ]}
        />
        <ul className="grid gap-5 md:grid-cols-2" aria-live="polite">
          {studies.map((s) => (
            <li key={s.slug} id={s.slug} className={cn('scroll-mt-36 flex flex-col rounded-super border p-6', s.recruiting ? 'bg-background border-success/40' : 'bg-background border-border')}>
              <div className="flex flex-wrap items-center gap-2">
                {s.recruiting ? <StatusPill tone="success">מגייס משתתפים</StatusPill> : <StatusPill tone="muted">לא מגייס כרגע</StatusPill>}
                <StatusPill tone="muted">{s.status}</StatusPill>
              </div>
              <h3 className="mt-3 font-heading font-semibold text-xl text-foreground">{s.title}</h3>
              <p className="mt-1 text-foreground leading-relaxed">{s.summary}</p>
              <FactGrid className="mt-4" columns={1} items={[{ label: 'אוכלוסיית המחקר', value: s.population, icon: <Users className="w-5 h-5" /> }]} />
              {s.eligibility?.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">תנאי השתתפות</p>
                  <ul className="space-y-1.5">
                    {s.eligibility.map((e) => <li key={e} className="flex gap-2 text-foreground"><Check className="w-4 h-4 mt-1 text-success flex-shrink-0" aria-hidden="true" />{e}</li>)}
                  </ul>
                </div>
              )}
              {s.description && s.description !== s.summary && (
                <Disclosure label="על המחקר" variant="soft" size="compact" className="mt-4">
                  <DemoMarkdown className="rich-content text-foreground">{s.description}</DemoMarkdown>
                  {s.team?.length > 0 && <p className="mt-3 text-sm text-muted-foreground">צוות המחקר: {s.team.join(', ')}</p>}
                </Disclosure>
              )}
              <div className="mt-auto pt-5 space-y-3">
                {s.links?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {s.links.map((l, i) => <ExternalLink key={l.url} href={l.url} className={cn(i === 0 && s.recruiting ? PILL_SOLID : PILL_OUTLINE, 'text-sm px-4 py-2')}>{l.label}</ExternalLink>)}
                  </div>
                )}
                <ContactChips contact={s.contact} />
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-muted-foreground">
          מחפשים מסגרות טיפול ללא עלות למטופלים?{' '}
          <DemoLink to={ROUTES.freeTreatment} className="font-medium text-accent underline underline-offset-4">טיפולים ללא עלות ומחקרים באזור המטופלים</DemoLink>
        </p>
      </Band>

      <Band tone="muted" labelledBy="res-more">
        <div className="grid gap-5 lg:grid-cols-3">
          {/* The whole card opens the journal club playlist. */}
          <a
            href={RESEARCH_INTRO.journalClub.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-super bg-sanctuary text-sanctuary-foreground p-7 flex flex-col shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-natural focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <PlayCircle className="w-8 h-8" aria-hidden="true" />
            <h2 id="res-more" className="mt-3 font-heading font-semibold text-2xl">{RESEARCH_INTRO.journalClub.title}</h2>
            <p className="mt-1 text-sanctuary-foreground/85">{RESEARCH_INTRO.journalClub.description}</p>
            <span className="mt-auto pt-5 font-semibold underline underline-offset-4 group-hover:no-underline">לפלייליסט ביוטיוב</span>
            <span className="sr-only">(נפתח בלשונית חדשה)</span>
          </a>
          <div className="rounded-super bg-card border border-border p-7">
            <h3 className="font-heading font-semibold text-xl text-foreground mb-3">תחומים שנחקרו בעבר</h3>
            <ul className="space-y-2 text-foreground">
              {RESEARCH_INTRO.pastResearchAreas.map((a) => <li key={a} className="flex gap-2"><span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" aria-hidden="true" />{a}</li>)}
            </ul>
          </div>
          <div className="rounded-super bg-card border-2 border-primary/25 p-7">
            <h3 className="font-heading font-semibold text-xl text-foreground">שיתופי פעולה מחקריים</h3>
            <p className="text-muted-foreground mt-1 mb-4">לחוקרים ולגופים שרוצים לעבוד יחד.</p>
            <ContactChips contact={RESEARCH_INTRO.collaborationContact} />
          </div>
        </div>
      </Band>
    </div>
  );
}
