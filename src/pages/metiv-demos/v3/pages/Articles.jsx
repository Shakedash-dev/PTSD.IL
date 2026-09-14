import React from 'react';
import { ArrowLeft, Clock, PenLine } from 'lucide-react';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { ARTICLES } from '@/pages/metiv-demos/shared/therapist';
import { cn } from '@/lib/utils';
import PageHeaderV3 from '../components/PageHeaderV3';
import { Band, FOCUS, LinkCard, SectionHeading, StatusPill } from '../components/kit';

export default function Articles() {
  const [lead, ...rest] = ARTICLES;
  return (
    <div className="bg-background">
      <PageHeaderV3
        tone="muted"
        eyebrow="מאמרים"
        title="כתיבה מקצועית של צוות מטיב"
        subtitle="מאמרי דעה והתבוננות על העבודה הטיפולית בטראומה."
        short={[]}
      />
      <Band tone="canvas" labelledBy="articles-list">
        <h2 id="articles-list" className="sr-only">רשימת המאמרים</h2>
        {lead && (
          <DemoLink
            to={`${ROUTES.articles}/${lead.slug}`}
            className={cn('group grid gap-6 md:grid-cols-[minmax(0,1fr)_16rem] items-center rounded-super bg-card border border-border p-6 sm:p-10 shadow-card hover:shadow-card-hover hover:border-primary/50 transition-natural', FOCUS)}
          >
            <span className="block">
              <span className="flex flex-wrap items-center gap-2">
                <StatusPill tone="primary">המאמר האחרון</StatusPill>
                {lead.tags?.map((t) => <StatusPill key={t} tone="muted">{t}</StatusPill>)}
              </span>
              <span className="mt-4 block font-heading font-semibold text-3xl sm:text-4xl text-foreground leading-tight">{lead.title}</span>
              <span className="mt-3 block text-lg text-muted-foreground leading-relaxed">{lead.excerpt}</span>
              <span className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-foreground">
                <span className="inline-flex items-center gap-1.5"><PenLine className="w-4 h-4 text-accent" aria-hidden="true" />{lead.authors.join(' ו')}</span>
                <span>{lead.date}</span>
                <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4 text-accent" aria-hidden="true" />{lead.readingMinutes} דקות קריאה</span>
              </span>
              <span className="mt-6 inline-flex items-center gap-1 font-semibold text-accent">לקריאת המאמר <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" /></span>
            </span>
            <span aria-hidden="true" className="hidden md:flex aspect-square rounded-full bg-muted items-center justify-center">
              <PenLine className="w-20 h-20 text-primary/60" />
            </span>
          </DemoLink>
        )}
        {rest.length > 0 && (
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {rest.map((a) => <li key={a.slug}><LinkCard to={`${ROUTES.articles}/${a.slug}`} title={a.title} description={a.excerpt} /></li>)}
          </ul>
        )}
        <div className="mt-12 rounded-super border-2 border-dashed border-border p-6 text-center">
          <p className="font-heading font-semibold text-foreground">מאמרים נוספים יתווספו כאן.</p>
          <p className="text-muted-foreground mt-1">בינתיים אפשר לעיין ב<DemoLink to={ROUTES.publications} className="text-accent underline underline-offset-4">פרסומים המדעיים</DemoLink> של אנשי מטיב.</p>
        </div>
      </Band>
      <Band tone="muted" padding="py-12">
        <SectionHeading title="עוד לקריאה ולצפייה" className="mb-4" />
        <DemoLink to={ROUTES.research} className="font-medium text-accent underline underline-offset-4">ג'ורנל קלאב ומחקרים פעילים</DemoLink>
      </Band>
    </div>
  );
}
