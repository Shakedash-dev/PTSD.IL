import React from 'react';
import { DemoMarkdown } from '@/pages/metiv-demos/shared/DemoChrome';
import PageHeaderV3 from '../components/PageHeaderV3';
import { fmt, useCopy, useMetiv } from '../content/MetivContent';

// Privacy policy and terms of use: the Markdown body and its date from
// LEGAL_DOCS, in the current language (same layout as the patient kit's page).

/** @param {{ doc: 'privacy'|'terms' }} props */
export default function Legal({ doc }) {
  const c = useCopy('legal');
  const { LEGAL_DOCS } = useMetiv();
  /** @type {{ body?: string, updated?: string }} */
  const entry = LEGAL_DOCS?.[doc] ?? {};
  return (
    <div className="min-h-screen bg-background">
      <PageHeaderV3
        size="default"
        align="start"
        tone="canvas"
        eyebrow={c.eyebrow}
        title={doc === 'privacy' ? c.privacyTitle : c.termsTitle}
        subtitle={entry.updated ? fmt(c.updated, { date: entry.updated }) : undefined}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-24">
        <div className="text-start">
          <DemoMarkdown className="rich-content legal-prose text-foreground">{entry.body}</DemoMarkdown>
        </div>
      </div>
    </div>
  );
}
