import React from 'react';
import { IMAGES } from '@/lib/images';
import { useDemoChrome } from '@/pages/metiv-demos/shared/DemoChrome';
import { tx } from '../copy';
import { EntrySection, ConsultationBlock, CrisisLines } from '../components';
import { FREE_TREATMENTS, RESEARCH_STUDIES, RESERVIST_FAMILY_PROGRAMS } from '../additions';

// Metiv addition 2: free treatment frameworks and studies recruiting
// participants. Descriptive only: who, what it involves, how suitability is
// decided, how to reach out.
export default function FreeTreatmentAndResearch() {
  const { PageHeader } = useDemoChrome();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        size="editorial"
        align="start"
        tone="muted"
        image={IMAGES.rights_hero}
        imageOpacity={0.6}
        eyebrow={tx('rights')}
        title="טיפולים ללא עלות והשתתפות במחקרים"
        subtitle="מסגרות טיפול ללא עלות ומחקרים שמגייסים משתתפים. לכל מסגרת: למי היא מיועדת, מה היא כוללת, איך נקבעת ההתאמה ואיך פונים."
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-14">
        <EntrySection id="free-frameworks" title="מסגרות טיפול ללא עלות" entries={FREE_TREATMENTS} />

        <div className="space-y-4">
          <div className="bg-muted/60 border border-border rounded-super p-5">
            <p className="text-foreground leading-relaxed">
              השתתפות במחקר היא בחירה אישית. ההתאמה נקבעת על ידי צוות המחקר בתהליך אבחון, ומטרת המחקר היא לבחון את הטיפולים.
            </p>
          </div>
          <EntrySection id="research" title="מחקרים שמגייסים משתתפים" entries={RESEARCH_STUDIES} />
        </div>

        <EntrySection
          id="reservist-family-programs"
          title="קבוצות למילואימניקים ולבני משפחותיהם"
          entries={RESERVIST_FAMILY_PROGRAMS}
        />

        <ConsultationBlock />
        <CrisisLines />
      </div>
    </div>
  );
}
