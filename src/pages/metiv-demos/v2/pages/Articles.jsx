import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, Clock, CalendarDays, ExternalLink, PenLine } from 'lucide-react';
import { DemoLink, DemoMarkdown, useDemoChrome, useDemoPath } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { ARTICLES, TEAM, getArticle, RESEARCH_INTRO } from '@/pages/metiv-demos/shared/therapist';
import { cn } from '@/lib/utils';
import { FOCUS_DARK, PROSE_DARK } from '../lib';
import { ArrowLink, Avatar, CardLink, Container, Panel, SectionTitle, Tag } from '../components/ui';

function ArticleMeta({ a }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-sanctuary-foreground/85">
      <li className="inline-flex items-center gap-1.5">
        <PenLine className="w-4 h-4" aria-hidden="true" />
        {a.authors.join(' ו')}
      </li>
      <li className="inline-flex items-center gap-1.5">
        <CalendarDays className="w-4 h-4" aria-hidden="true" />
        {a.date}
      </li>
      <li className="inline-flex items-center gap-1.5">
        <Clock className="w-4 h-4" aria-hidden="true" />
        {a.readingMinutes} דקות קריאה
      </li>
    </ul>
  );
}

export function ArticlesList() {
  const { PageHeader } = useDemoChrome();
  const [featured, ...rest] = ARTICLES;
  return (
    <div>
      <PageHeader eyebrow="מאמרים" title="מאמרים וכתיבה מקצועית" subtitle="מאמרי דעה וכתיבה של צוות מטיב על העבודה הטיפולית בטראומה." />
      <Container className="py-12 space-y-12">
        {featured && (
          <DemoLink
            to={`${ROUTES.articles}/${featured.slug}`}
            className={cn(
              'group grid lg:grid-cols-[minmax(0,1fr)_18rem] rounded-super overflow-hidden border border-sanctuary-foreground/15 bg-sanctuary-foreground/[0.06] hover:bg-sanctuary-foreground/[0.1] transition-colors duration-300',
              FOCUS_DARK
            )}
          >
            <div className="p-6 sm:p-10">
              <div className="flex flex-wrap gap-2 mb-4">
                {featured.tags?.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
              <h2 className="font-heading font-semibold text-3xl sm:text-4xl leading-tight">{featured.title}</h2>
              <p className="mt-4 text-lg text-sanctuary-foreground/85 leading-relaxed max-w-2xl">{featured.excerpt}</p>
              <div className="mt-6">
                <ArticleMeta a={featured} />
              </div>
              <span className="mt-8 inline-flex items-center gap-2 h-12 px-6 rounded-full bg-sanctuary-foreground text-sanctuary font-semibold">
                לקריאת המאמר
                <ArrowLeft className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
              </span>
            </div>
            <div className="hidden lg:flex items-center justify-center bg-sanctuary-foreground/[0.06] p-8" aria-hidden="true">
              <p className="font-heading font-semibold text-8xl text-sanctuary-foreground/20 leading-none">&quot;</p>
            </div>
          </DemoLink>
        )}

        {rest.length > 0 && (
          <ul className="grid gap-4 md:grid-cols-2">
            {rest.map((a) => (
              <li key={a.slug}>
                <CardLink to={`${ROUTES.articles}/${a.slug}`} className="flex-col gap-2">
                  <span className="font-heading font-semibold text-xl">{a.title}</span>
                  <span className="text-sm text-sanctuary-foreground/80">{a.excerpt}</span>
                </CardLink>
              </li>
            ))}
          </ul>
        )}

        <section className="rounded-super-sm border border-dashed border-sanctuary-foreground/25 p-6 sm:p-8" aria-labelledby="more-writing">
          <h2 id="more-writing" className="font-heading font-semibold text-xl">עוד מהכתיבה של מטיב</h2>
          <p className="mt-1 text-sanctuary-foreground/80">מאמרים נוספים יתווספו כאן. בינתיים, אפשר לעיין בפרסומים האקדמיים או בהרצאות הג&apos;ורנל קלאב.</p>
          <div className="mt-5 flex flex-wrap gap-6">
            <ArrowLink to={ROUTES.publications}>ספרים ומאמרים אקדמיים</ArrowLink>
            <ArrowLink to={RESEARCH_INTRO.journalClub.url}>הרצאות הג&apos;ורנל קלאב</ArrowLink>
          </div>
        </section>
      </Container>
    </div>
  );
}

export function ArticlePage() {
  const { slug } = useParams();
  const { PageHeader } = useDemoChrome();
  const resolve = useDemoPath();
  const a = getArticle(slug || '');
  if (!a) return <Navigate to={resolve(ROUTES.articles)} replace />;
  const authors = a.authors.map((name) => TEAM.find((t) => t.name === name) || { name, role: '' });

  return (
    <div>
      <PageHeader
        breadcrumb={
          <nav aria-label="מיקום בעמוד">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-sanctuary-foreground/80">
              <li>
                <DemoLink to={ROUTES.therapist} className={cn('hover:underline underline-offset-4 rounded', FOCUS_DARK)}>
                  אנשי מקצוע
                </DemoLink>
              </li>
              <li aria-hidden="true">
                <ChevronLeft className="w-4 h-4" />
              </li>
              <li>
                <DemoLink to={ROUTES.articles} className={cn('hover:underline underline-offset-4 rounded', FOCUS_DARK)}>
                  מאמרים
                </DemoLink>
              </li>
            </ol>
          </nav>
        }
        eyebrow={a.tags?.includes('מאמר דעה') ? 'מאמר דעה' : 'מאמר'}
        title={a.title}
        subtitle={a.excerpt}
        meta={<ArticleMeta a={a} />}
      />
      <Container size="default" className="py-10 sm:py-14 grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem] items-start">
        <article className="min-w-0">
          <DemoMarkdown className={cn(PROSE_DARK, 'text-lg leading-8 [&_p]:my-5 max-w-[42rem]')}>{a.body}</DemoMarkdown>
          <p className="mt-10 text-sm text-sanctuary-foreground/75">
            פורסם באתר מטיב.{' '}
            <a href={a.sourceUrl} target="_blank" rel="noopener noreferrer" className={cn('underline underline-offset-4 font-semibold text-sanctuary-foreground inline-flex items-center gap-1 rounded', FOCUS_DARK)}>
              למקור
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </p>
        </article>
        <aside className="lg:sticky lg:top-[170px] space-y-4" aria-label="על הכותבות">
          <Panel>
            <h2 className="font-heading font-semibold mb-3">הכותבות</h2>
            <ul className="space-y-4">
              {authors.map((au) => (
                <li key={au.name} className="flex gap-3 items-start">
                  <Avatar name={au.name} className="w-10 h-10 text-base" />
                  <div>
                    <p className="font-semibold text-sm">{au.name}</p>
                    {au.role && <p className="text-xs text-sanctuary-foreground/75 leading-relaxed">{au.role}</p>}
                  </div>
                </li>
              ))}
            </ul>
            {a.authorsAffiliation && <p className="mt-4 text-xs text-sanctuary-foreground/75">{a.authorsAffiliation}</p>}
          </Panel>
          {a.tags?.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="תגיות">
              {a.tags.map((t) => (
                <li key={t}>
                  <Tag>{t}</Tag>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </Container>
      <section className="border-t border-sanctuary-foreground/10 py-12">
        <Container size="default">
          <SectionTitle title="להמשך" />
          <div className="grid gap-4 sm:grid-cols-2">
            <CardLink to={`${ROUTES.courses}/roadmap`} className="flex-col gap-1">
              <span className="text-sm text-sanctuary-foreground/75">קורס</span>
              <span className="font-heading font-semibold text-lg">מפת הדרכים לטיפול בטראומה</span>
            </CardLink>
            <CardLink to={ROUTES.articles} className="flex-col gap-1">
              <span className="text-sm text-sanctuary-foreground/75">כל המאמרים</span>
              <span className="font-heading font-semibold text-lg">חזרה לרשימת המאמרים</span>
            </CardLink>
          </div>
        </Container>
      </section>
    </div>
  );
}
