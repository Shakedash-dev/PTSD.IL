import React from 'react';
import { ExternalLink, Mail, Quote, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DemoLink, DemoMarkdown, useDemoChrome } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { ORGANIZATION_PROGRAMS, ORG, getCourse } from '@/pages/metiv-demos/shared/therapist';
import { cn } from '@/lib/utils';
import { FOCUS_DARK, PROSE_DARK } from '../lib';
import { AreaDisclosure, Container, IconBadge, Panel, SectionTitle, Tag } from '../components/ui';

const ICONS = { 'metiv-space': 'Building2', 'trauma-informed-org': 'Presentation', 'custom-workshops': 'Puzzle', 'org-trainings': 'Users' };
const CLIENT_PREVIEW = 12;

function Program({ p, index }) {
  const course = p.relatedCourseSlug ? getCourse(p.relatedCourseSlug) : null;
  return (
    <section id={p.slug} className="scroll-mt-40" aria-labelledby={`${p.slug}-title`}>
      <Panel className="p-6 sm:p-10">
        <div className="flex flex-wrap items-start gap-4 mb-6">
          <IconBadge name={ICONS[p.slug]} size="lg" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-sanctuary-foreground/75 font-semibold">תכנית {index + 1} מתוך {ORGANIZATION_PROGRAMS.length}</p>
            <h2 id={`${p.slug}-title`} className="font-heading font-semibold text-2xl sm:text-3xl leading-tight">
              {p.title}
            </h2>
            {p.subtitle && <p className="text-sanctuary-foreground/85 mt-1">{p.subtitle}</p>}
          </div>
        </div>
        <p className="text-lg leading-relaxed text-sanctuary-foreground/90 max-w-3xl">{p.summary}</p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="font-semibold mb-2">מתכונות</h3>
            <ul className="flex flex-wrap gap-2">
              {p.formats.map((f) => (
                <li key={f}>
                  <Tag className="text-sm px-3 py-1">{f}</Tag>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">למי</h3>
            <ul className="flex flex-wrap gap-2">
              {p.audience.map((a) => (
                <li key={a}>
                  <Tag className="text-sm px-3 py-1">{a}</Tag>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {p.topics?.length > 0 && (
          <div className="mt-8">
            <h3 className="font-semibold mb-3">נושאים</h3>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {p.topics.map((t) => (
                <li key={t} className="rounded-xl bg-sanctuary-foreground/[0.06] px-4 py-3 text-sm leading-snug">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}

        <AreaDisclosure label="פירוט התכנית" className="mt-8">
          <DemoMarkdown className={PROSE_DARK}>{p.description}</DemoMarkdown>
        </AreaDisclosure>

        {p.voices?.length > 0 && (
          <div className="mt-8">
            <h3 className="font-semibold mb-1">קולות מהשטח</h3>
            <p className="text-sm text-sanctuary-foreground/75 mb-3">ציטוטים של נפגעי טראומה על המפגש עם שירותים, כפי שהובאו באתר מטיב.</p>
            <ul className="grid gap-3 md:grid-cols-2">
              {p.voices.map((v) => (
                <li key={v}>
                  <figure className="h-full rounded-2xl border-s-4 border-sanctuary-foreground/40 bg-sanctuary-foreground/[0.04] p-4">
                    <Quote className="w-5 h-5 text-sanctuary-foreground/60 mb-2" aria-hidden="true" />
                    <blockquote className="text-sm leading-relaxed text-sanctuary-foreground/90">{v}</blockquote>
                  </figure>
                </li>
              ))}
            </ul>
          </div>
        )}

        {p.clientList.length > 0 && (
          <div className="mt-8">
            <h3 className="font-semibold mb-3">ארגונים שעבדו עם מטיב בתכנית זו ({p.clientList.length})</h3>
            <ul className="flex flex-wrap gap-2">
              {p.clientList.slice(0, CLIENT_PREVIEW).map((c) => (
                <li key={c}>
                  <Tag className="text-sm px-3 py-1">{c}</Tag>
                </li>
              ))}
            </ul>
            {p.clientList.length > CLIENT_PREVIEW && (
              <AreaDisclosure label={`עוד ${p.clientList.length - CLIENT_PREVIEW} ארגונים`} size="tight" className="mt-3">
                <ul className="flex flex-wrap gap-2">
                  {p.clientList.slice(CLIENT_PREVIEW).map((c) => (
                    <li key={c}>
                      <Tag className="text-sm px-3 py-1">{c}</Tag>
                    </li>
                  ))}
                </ul>
              </AreaDisclosure>
            )}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-sanctuary-foreground/10 flex flex-wrap items-center gap-3">
          {p.links?.map((l, i) => (
            <Button key={l.url} asChild variant={i === 0 ? 'pill-light' : 'ghost'} size="pill" className={cn(i === 0 ? '' : 'text-sanctuary-foreground border border-sanctuary-foreground/30 hover:bg-sanctuary-foreground/10 hover:text-sanctuary-foreground whitespace-normal h-auto min-h-11 py-2', FOCUS_DARK)}>
              <a href={l.url} target="_blank" rel="noopener noreferrer">
                {l.label}
                <ExternalLink aria-hidden="true" />
              </a>
            </Button>
          ))}
          {p.contact?.email && (
            <Button asChild variant={p.links?.length ? 'ghost' : 'pill-light'} size="pill" className={cn(p.links?.length ? 'text-sanctuary-foreground border border-sanctuary-foreground/30 hover:bg-sanctuary-foreground/10 hover:text-sanctuary-foreground' : '', FOCUS_DARK)}>
              <a href={`mailto:${p.contact.email}`}>
                <Mail aria-hidden="true" />
                {p.contact.name ? `פנייה ל${p.contact.name}` : 'פנייה במייל'}
              </a>
            </Button>
          )}
          {course && (
            <DemoLink to={`${ROUTES.courses}/${course.slug}`} className={cn('inline-flex items-center gap-1.5 font-semibold underline-offset-4 hover:underline rounded', FOCUS_DARK)}>
              לעמוד הקורס: {course.title}
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </DemoLink>
          )}
        </div>
      </Panel>
    </section>
  );
}

export default function Organizations() {
  const { PageHeader } = useDemoChrome();
  return (
    <div>
      <PageHeader
        eyebrow="לארגונים"
        title="הכשרה וליווי לארגונים וצוותים"
        subtitle="תכניות של מטיב לארגונים, למוסדות שנותנים שירות לנפגעי טראומה ולצוותים טיפוליים: פיתוח ארגון מותאם טראומה, קורס לצוותים, וסדנאות שנבנות לפי הצורך."
        actions={
          <Button asChild variant="pill-light" size="pill-lg" className={FOCUS_DARK}>
            <a href={ORG.trainingsFormUrl} target="_blank" rel="noopener noreferrer">
              טופס פנייה להכשרה לארגון
              <ExternalLink aria-hidden="true" />
            </a>
          </Button>
        }
      />
      <Container className="py-12 space-y-10">
        <nav aria-label="התכניות בעמוד">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ORGANIZATION_PROGRAMS.map((p) => (
              <li key={p.slug}>
                <a
                  href={`#${p.slug}`}
                  className={cn('group flex flex-col gap-2 h-full min-h-[88px] rounded-super-sm border border-sanctuary-foreground/15 bg-sanctuary-foreground/[0.06] p-5 hover:bg-sanctuary-foreground/[0.11] transition-colors duration-300', FOCUS_DARK)}
                >
                  <IconBadge name={ICONS[p.slug]} />
                  <span className="font-heading font-semibold text-lg leading-snug">{p.title}</span>
                  <span className="text-sm text-sanctuary-foreground/75 leading-relaxed line-clamp-3">{p.summary}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <SectionTitle title="התכניות" className="sr-only" />
        {ORGANIZATION_PROGRAMS.map((p, i) => (
          <Program key={p.slug} p={p} index={i} />
        ))}
      </Container>
    </div>
  );
}
