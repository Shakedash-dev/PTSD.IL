import React from 'react';
import { useDemoChrome } from '@/pages/metiv-demos/shared/DemoChrome';
import { tx, rebrandText } from '../copy';
import { getLegalDocs } from '../staticData';
import { KitMarkdown } from '../components';

// Demo counterpart of src/components/LegalPage.jsx, Hebrew only. A legal
// override from the snapshot displaces the shipped text (body and date
// together), exactly like the live page; none existed at snapshot time.
export default function LegalPage({ slug, titleKey, updated, content }) {
  const { PageHeader } = useDemoChrome();
  const override = getLegalDocs()[slug];
  const body = rebrandText(override?.body || content);
  const updatedOn = override?.updated || updated;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        size="default"
        align="start"
        tone="canvas"
        eyebrow={tx('legal_eyebrow')}
        title={tx(titleKey)}
        subtitle={`${tx('legal_last_updated')} ${updatedOn}`}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-24">
        <div dir="rtl" className="text-start">
          <KitMarkdown className="rich-content legal-prose text-foreground">{body}</KitMarkdown>
        </div>
      </div>
    </div>
  );
}
