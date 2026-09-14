import React from 'react';
import { IMAGES } from '@/lib/images';
import { DemoMarkdown } from '@/pages/metiv-demos/shared/DemoChrome';
import { ORGANIZATION_PROGRAMS, PARTNERS, THERAPIST_HUB } from '@/pages/metiv-demos/shared/therapist';
import { PageHeaderV1 } from '../components/Chrome';
import {
  ArrowLink,
  Chapter,
  ChapterHead,
  ContactLines,
  MetaList,
  NumberedIndex,
  PillLink,
  useV1Title,
} from '../components/primitives';
import { pad } from '../lib';

export default function Organizations() {
  useV1Title('לארגונים');
  const clients = [...new Set([...PARTNERS, ...ORGANIZATION_PROGRAMS.flatMap((p) => p.clientList)])];

  return (
    <>
      <PageHeaderV1
        size="editorial"
        align="start"
        tone="canvas"
        eyebrow="לאנשי טיפול ומקצוע"
        title="לארגונים"
        subtitle="הכשרות, ליווי וסדנאות לארגונים, למוסדות ולצוותים טיפוליים. כל תכנית נבנית לפי צורכי הארגון המזמין."
        image={IMAGES.community_hero}
        actions={<PillLink to={THERAPIST_HUB.cta.url} size="lg">{THERAPIST_HUB.cta.label}</PillLink>}
      />

      <Chapter rule={false}>
        <ChapterHead label="בעמוד זה" title={`${ORGANIZATION_PROGRAMS.length} תכניות לארגונים`} />
        <NumberedIndex
          items={ORGANIZATION_PROGRAMS.map((p) => ({ key: p.slug, title: p.title, description: p.summary, to: `#${p.slug}` }))}
        />
      </Chapter>

      {ORGANIZATION_PROGRAMS.map((p, i) => (
        <Chapter key={p.slug} id={p.slug}>
          <ChapterHead number={pad(i + 1)} label={p.subtitle || 'תכנית'} title={p.title} lead={p.summary} />
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-7">
              <DemoMarkdown className="rich-content text-lg leading-[1.85] text-foreground">{p.description}</DemoMarkdown>
              {p.topics?.length > 0 && (
                <div className="mt-10">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground">נושאים</p>
                  <ol className="mt-3 divide-y divide-border border-y border-border">
                    {p.topics.map((t, j) => (
                      <li key={t} className="flex items-baseline gap-4 py-3">
                        <span className="w-6 shrink-0 text-sm tabular-nums text-secondary">{j + 1}</span>
                        <span className="text-foreground">{t}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {p.voices?.length > 0 && (
                <div className="mt-12">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground">קולות מהשטח, כפי שנאספו במטיב</p>
                  <div className="mt-6 space-y-8">
                    {p.voices.map((v) => (
                      <blockquote key={v.slice(0, 20)} className="border-s-2 border-secondary ps-6 font-heading text-xl font-light leading-[1.55] text-category-2 md:text-2xl">
                        {v}
                      </blockquote>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <aside className="lg:col-span-4 lg:col-start-9">
              <div className="space-y-8 lg:sticky lg:top-40">
                <MetaList
                  items={[
                    { label: 'מסגרות', value: p.formats.join(' · ') },
                    { label: 'למי', value: p.audience.join(' · ') },
                  ]}
                />
                {p.links?.length > 0 && (
                  <ul className="space-y-3">
                    {p.links.map((l) => (
                      <li key={l.url}><ArrowLink to={l.url} className="text-sm">{l.label}</ArrowLink></li>
                    ))}
                  </ul>
                )}
                {p.relatedCourseSlug && (
                  <ArrowLink to={`/therapist/courses/${p.relatedCourseSlug}`}>לעמוד הקורס</ArrowLink>
                )}
                <div className="rounded-super border border-border bg-card p-6">
                  <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground">לפרטים</p>
                  <ContactLines contact={p.contact} />
                </div>
              </div>
            </aside>
          </div>
        </Chapter>
      ))}

      <Chapter>
        <ChapterHead label="ארגונים" title="ארגונים שעבדו עם מטיב" lead="ארגונים שהזמינו הכשרות, סדנאות או הדרכה, כפי שהם מופיעים באתר מטיב." />
        <ul className="columns-1 gap-10 sm:columns-2 lg:columns-3">
          {clients.map((c) => (
            <li key={c} className="break-inside-avoid border-b border-border py-3 text-lg text-foreground">{c}</li>
          ))}
        </ul>
      </Chapter>
    </>
  );
}
