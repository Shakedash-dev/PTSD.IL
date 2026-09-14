import React, { useState } from 'react';
import { Mail, MessageCircle, ExternalLink, Youtube, Users, Target, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChoiceChip from '@/components/patterns/ChoiceChip';
import { DemoMarkdown, useDemoChrome } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { RESEARCH_INTRO, ACTIVE_STUDIES, PAPERS, BOOKS } from '@/pages/metiv-demos/shared/therapist';
import { cn } from '@/lib/utils';
import { FOCUS_DARK, PROSE_DARK, whatsappHref } from '../lib';
import { AreaDisclosure, ArrowLink, Container, DoorCard, Fact, Panel, SectionTitle, StatusPill, Tag, chipClass } from '../components/ui';

function StudyCard({ s }) {
  return (
    <Panel as="article" className="h-full flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill kind={s.recruiting ? 'recruiting' : 'active'} label={s.recruiting ? 'מגייס משתתפים' : `סטטוס: ${s.status}`} />
      </div>
      <h3 className="font-heading font-semibold text-xl leading-snug">{s.title}</h3>
      <p className="text-sanctuary-foreground/85 leading-relaxed">{s.summary}</p>
      <dl>
        <Fact label="אוכלוסיית המחקר" icon="Users">{s.population}</Fact>
      </dl>
      <AreaDisclosure label="פרטי המחקר" size="tight" className="mt-auto">
        <div className="space-y-4 text-sm">
          <DemoMarkdown className={PROSE_DARK}>{s.description}</DemoMarkdown>
          {s.eligibility?.length > 0 && (
            <div>
              <p className="font-semibold mb-1">תנאי השתתפות</p>
              <ul className="list-disc ps-5 space-y-1">
                {s.eligibility.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}
          {s.team?.length > 0 && (
            <div>
              <p className="font-semibold mb-1">צוות המחקר</p>
              <p>{s.team.join(' · ')}</p>
            </div>
          )}
          {s.links?.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {s.links.map((l) => (
                <li key={l.url}>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className={cn('inline-flex items-center gap-1.5 rounded-full border border-sanctuary-foreground/30 px-3 py-1.5 hover:bg-sanctuary-foreground/10', FOCUS_DARK)}>
                    {l.label}
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          )}
          {s.contact && (s.contact.email || s.contact.whatsapp) && (
            <div className="flex flex-wrap gap-4">
              {s.contact.name && <span className="font-semibold">{s.contact.name}</span>}
              {s.contact.email && (
                <a href={`mailto:${s.contact.email}`} className={cn('inline-flex items-center gap-1.5 underline underline-offset-4 rounded', FOCUS_DARK)}>
                  <Mail className="w-4 h-4" aria-hidden="true" />
                  <span dir="ltr">{s.contact.email}</span>
                </a>
              )}
              {s.contact.whatsapp && (
                <a href={whatsappHref(s.contact.whatsapp)} target="_blank" rel="noopener noreferrer" className={cn('inline-flex items-center gap-1.5 underline underline-offset-4 rounded', FOCUS_DARK)}>
                  <MessageCircle className="w-4 h-4" aria-hidden="true" />
                  וואטסאפ
                </a>
              )}
            </div>
          )}
          {s.contact?.name && !s.contact.email && !s.contact.whatsapp && (
            <p>
              איש/אשת קשר: {s.contact.name}
              {s.contact.role ? `, ${s.contact.role}` : ''}
            </p>
          )}
        </div>
      </AreaDisclosure>
    </Panel>
  );
}

export default function Research() {
  const { PageHeader } = useDemoChrome();
  const r = RESEARCH_INTRO;
  const [only, setOnly] = useState(false);
  const recruiting = ACTIVE_STUDIES.filter((s) => s.recruiting);
  const studies = only ? recruiting : ACTIVE_STUDIES;

  return (
    <div>
      <PageHeader
        eyebrow="מחקר"
        title={r.title}
        subtitle={r.paragraphs[0]}
        meta={
          <>
            <Tag className="text-sm px-3 py-1">{ACTIVE_STUDIES.length} מחקרים פעילים</Tag>
            <StatusPill kind="recruiting" label={`${recruiting.length} מגייסים משתתפים`} />
          </>
        }
        actions={
          <>
            <Button asChild variant="pill-light" size="pill-lg" className={FOCUS_DARK}>
              <a href={`mailto:${r.collaborationContact.email}`}>
                <Mail aria-hidden="true" />
                לשיתופי פעולה מחקריים
              </a>
            </Button>
            <a href="#studies" className={cn('inline-flex items-center h-14 px-6 rounded-full border-2 border-sanctuary-foreground/40 font-semibold hover:bg-sanctuary-foreground/10', FOCUS_DARK)}>
              המחקרים הפעילים
            </a>
          </>
        }
      />

      <Container className="py-12 space-y-16">
        <section className="grid gap-4 md:grid-cols-3" aria-label="על היחידה">
          <Panel>
            <Target className="w-6 h-6 mb-3 text-sanctuary-foreground/80" aria-hidden="true" />
            <h2 className="font-heading font-semibold text-lg mb-2">מוקד המחקר</h2>
            <p className="text-sanctuary-foreground/85 leading-relaxed">{r.focus}</p>
          </Panel>
          <Panel>
            <Compass className="w-6 h-6 mb-3 text-sanctuary-foreground/80" aria-hidden="true" />
            <h2 className="font-heading font-semibold text-lg mb-2">תפקיד היחידה</h2>
            <p className="text-sanctuary-foreground/85 leading-relaxed">{r.role}</p>
          </Panel>
          <Panel>
            <Users className="w-6 h-6 mb-3 text-sanctuary-foreground/80" aria-hidden="true" />
            <h2 className="font-heading font-semibold text-lg mb-2">עקרונות</h2>
            <ul className="flex flex-wrap gap-2">
              {r.principles.map((p) => (
                <li key={p}>
                  <Tag>{p}</Tag>
                </li>
              ))}
            </ul>
          </Panel>
          <p className="md:col-span-3 text-sanctuary-foreground/85 leading-relaxed max-w-3xl">{r.paragraphs[1]}</p>
        </section>

        <section id="studies" className="scroll-mt-40" aria-labelledby="studies-title">
          <SectionTitle
            id="studies-title"
            eyebrow="מחקרים פעילים"
            title="המחקרים שמתנהלים עכשיו"
            action={
              <div role="group" aria-label="סינון מחקרים" className="flex gap-2">
                <ChoiceChip selected={!only} onClick={() => setOnly(false)} className={chipClass(!only, true)}>
                  כל המחקרים ({ACTIVE_STUDIES.length})
                </ChoiceChip>
                <ChoiceChip selected={only} onClick={() => setOnly(true)} className={chipClass(only, true)}>
                  מגייסים משתתפים ({recruiting.length})
                </ChoiceChip>
              </div>
            }
          />
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-live="polite">
            {studies.map((s) => (
              <li key={s.slug}>
                <StudyCard s={s} />
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Panel className="p-6 sm:p-8">
            <h2 className="font-heading font-semibold text-2xl mb-4">תחומי מחקר קודמים</h2>
            <ul className="space-y-3">
              {r.pastResearchAreas.map((a) => (
                <li key={a} className="flex gap-3">
                  <span className="mt-2.5 w-2 h-2 rounded-full bg-sanctuary-foreground/60 flex-shrink-0" aria-hidden="true" />
                  <span className="leading-relaxed">{a}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <ArrowLink to={ROUTES.publications}>
                {BOOKS.length} ספרים ו-{PAPERS.length} מאמרים ופרקים
              </ArrowLink>
            </div>
          </Panel>
          <div className="rounded-super-sm bg-sanctuary-foreground text-sanctuary p-6 sm:p-8 flex flex-col gap-4">
            <Youtube className="w-8 h-8" aria-hidden="true" />
            <h2 className="font-heading font-semibold text-2xl">{r.journalClub.title}</h2>
            <p className="leading-relaxed">{r.journalClub.description} הרצאות קודמות זמינות ביוטיוב.</p>
            <a
              href={r.journalClub.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-sanctuary text-sanctuary-foreground font-semibold w-fit hover:bg-accent transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sanctuary focus-visible:ring-offset-2"
            >
              לרשימת ההרצאות
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        </section>

        <DoorCard
          to={ROUTES.freeTreatment}
          target="patient"
          title="מחפשים מחקר שאפשר להשתתף בו כמטופלים?"
          text="טיפולים ללא עלות ומחקרים שמגייסים משתתפים, מוסברים בשפה פשוטה באזור המטופלים."
          className="max-w-2xl"
        />
      </Container>
    </div>
  );
}
