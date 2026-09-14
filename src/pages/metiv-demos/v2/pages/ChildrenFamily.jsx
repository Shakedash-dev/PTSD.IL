import React, { useState } from 'react';
import { ExternalLink, Mail, Phone, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChoiceChip from '@/components/patterns/ChoiceChip';
import { DemoLink, useDemoChrome } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { CHILDREN_FAMILY_INTRO, coursesByCategory, getCourse } from '@/pages/metiv-demos/shared/therapist';
import { PATIENT_HUB } from '@/pages/metiv-demos/shared/patient';
import { cn } from '@/lib/utils';
import { FOCUS_DARK, telHref } from '../lib';
import { ArrowLink, Container, DoorCard, Fact, Panel, SectionTitle, Tag, chipClass } from '../components/ui';
import { CourseCard } from '../components/cards';

export default function ChildrenFamily() {
  const { PageHeader } = useDemoChrome();
  const intro = CHILDREN_FAMILY_INTRO;
  const [active, setActive] = useState(intro.models[0].key);
  const model = intro.models.find((m) => m.key === active) || intro.models[0];
  const training = model.trainingSlug ? getCourse(model.trainingSlug) : null;
  const trainings = coursesByCategory('children-family');
  const parentGroups = PATIENT_HUB.additions.find((a) => a.key === 'parentChildGroups');

  return (
    <div>
      <PageHeader
        eyebrow="ילדים ומשפחה"
        title={intro.title}
        subtitle={intro.paragraphs[0]}
        actions={
          <>
            <Button asChild variant="pill-light" size="pill-lg" className={FOCUS_DARK}>
              <a href={intro.trainingInterestFormUrl} target="_blank" rel="noopener noreferrer">
                רישום התעניינות בהכשרות
                <ExternalLink aria-hidden="true" />
              </a>
            </Button>
            <a href="#trainings" className={cn('inline-flex items-center h-14 px-6 rounded-full border-2 border-sanctuary-foreground/40 font-semibold hover:bg-sanctuary-foreground/10', FOCUS_DARK)}>
              ההכשרות למטפלים
            </a>
          </>
        }
      />

      <Container className="py-12 space-y-16">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] items-start">
          <Panel className="p-6 sm:p-8 space-y-4">
            {intro.paragraphs.slice(1).map((p) => (
              <p key={p} className="leading-relaxed text-sanctuary-foreground/90">
                {p}
              </p>
            ))}
            <div>
              <h2 className="font-heading font-semibold text-lg mb-3">הכשרות שמתקיימות מפעם לפעם</h2>
              <ul className="flex flex-wrap gap-2">
                {intro.periodicTrainings.map((t) => (
                  <li key={t}>
                    <Tag className="text-sm px-3 py-1">{t}</Tag>
                  </li>
                ))}
              </ul>
            </div>
            <ArrowLink to={intro.programSiteUrl}>אתר תכנית פנד&quot;ה</ArrowLink>
          </Panel>
          <Panel className="p-6">
            <h2 className="font-heading font-semibold text-lg mb-3">פנייה למטיב ילדים</h2>
            <div className="space-y-2 text-sm">
              <a href={`mailto:${intro.contact.email}`} className={cn('flex items-center gap-2 hover:underline underline-offset-4 rounded', FOCUS_DARK)}>
                <Mail className="w-4 h-4" aria-hidden="true" />
                <span dir="ltr">{intro.contact.email}</span>
              </a>
              <a href={telHref(intro.contact.phone)} className={cn('flex items-center gap-2 hover:underline underline-offset-4 rounded', FOCUS_DARK)}>
                <Phone className="w-4 h-4" aria-hidden="true" />
                <span dir="ltr">{intro.contact.phone}</span>
              </a>
            </div>
          </Panel>
        </section>

        <section aria-labelledby="models">
          <SectionTitle id="models" eyebrow="המודלים הקבוצתיים" title="התכניות שמטיב ילדים מלמדת" description="בחרו תכנית כדי לראות גילאים, מבנה, מי פיתח ומה ההכשרה." />
          <div role="group" aria-label="בחירת תכנית" className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {intro.models.map((m) => (
              <ChoiceChip key={m.key} selected={m.key === active} onClick={() => setActive(m.key)} className={cn('flex-shrink-0 min-h-[2.75rem] px-5 text-base', chipClass(m.key === active, true))}>
                {m.title}
              </ChoiceChip>
            ))}
          </div>

          <Panel className="mt-4 p-6 sm:p-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]" aria-live="polite">
            <div>
              <h3 className="font-heading font-semibold text-2xl">{model.title}</h3>
              {model.fullName && <p className="text-sanctuary-foreground/80 mt-1">{model.fullName}</p>}
              <p className="mt-4 leading-relaxed text-sanctuary-foreground/90">{model.description}</p>
              {model.keyMessages?.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">המסרים המרכזיים</h4>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {model.keyMessages.map((k) => (
                      <li key={k} className="flex gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 mt-1 flex-shrink-0" aria-hidden="true" />
                        {k}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="rounded-2xl bg-sanctuary-foreground/[0.06] p-5 h-fit">
              <dl>
                <Fact label="גילאים" icon="Baby">{model.ages}</Fact>
                <Fact label="מבנה" icon="LayoutList">{model.structure}</Fact>
                <Fact label="פותחה על ידי" icon="UserRound">{model.developedBy}</Fact>
              </dl>
              {training ? (
                <DemoLink
                  to={`${ROUTES.courses}/${training.slug}`}
                  className={cn('mt-4 flex items-center justify-between gap-2 rounded-2xl bg-sanctuary-foreground text-sanctuary p-4 font-semibold hover:bg-card transition-colors duration-300', FOCUS_DARK)}
                >
                  <span>
                    <span className="block text-xs font-medium">ההכשרה למטפלים</span>
                    {training.title}
                  </span>
                  <ArrowLeft className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                </DemoLink>
              ) : (
                <p className="mt-4 text-sm text-sanctuary-foreground/80">אין עמוד הכשרה נפרד לתכנית זו.</p>
              )}
            </div>
          </Panel>

          <div className="mt-6 overflow-x-auto rounded-super-sm border border-sanctuary-foreground/15">
            <table className="w-full text-sm text-start min-w-[36rem]">
              <caption className="sr-only">השוואה בין התכניות</caption>
              <thead className="bg-sanctuary-foreground/[0.08]">
                <tr>
                  <th scope="col" className="text-start font-semibold p-3">תכנית</th>
                  <th scope="col" className="text-start font-semibold p-3">גילאים</th>
                  <th scope="col" className="text-start font-semibold p-3">מבנה</th>
                </tr>
              </thead>
              <tbody>
                {intro.models.map((m) => (
                  <tr key={m.key} className="border-t border-sanctuary-foreground/10">
                    <th scope="row" className="text-start font-semibold p-3 whitespace-nowrap">{m.title}</th>
                    <td className="p-3 text-sanctuary-foreground/90">{m.ages}</td>
                    <td className="p-3 text-sanctuary-foreground/90">{m.structure}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="trainings" className="scroll-mt-40" aria-labelledby="trainings-title">
          <SectionTitle id="trainings-title" eyebrow="הכשרות" title="הכשרות למטפלים בתחום הילדים והמשפחה" action={<ArrowLink to={`${ROUTES.courses}?category=children-family`}>בקטלוג הקורסים</ArrowLink>} />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {trainings.map((c) => (
              <li key={c.slug}>
                <CourseCard course={c} />
              </li>
            ))}
          </ul>
        </section>

        {parentGroups && (
          <DoorCard to={parentGroups.route} target="patient" title="הורים? קבוצות להורים וילדים" text="מידע למשפחות על פנד&quot;ה, נמ&quot;ל ומפגשי משחק, באזור המטופלים והמשפחות." className="max-w-2xl" />
        )}
      </Container>
    </div>
  );
}
