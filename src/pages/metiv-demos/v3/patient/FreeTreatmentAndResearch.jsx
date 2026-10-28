import React from 'react';
import { IMAGES } from '@/lib/images';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { useDemoChrome } from '@/pages/metiv-demos/shared/DemoChrome';
import { useCopy, useMetiv } from '../content/MetivContent';
import { EntrySection, ConsultationBlock, CrisisLines } from './PatientKit';

// Metiv demo (V3): a copy of shared/patient/pages/FreeTreatmentAndResearch.jsx
// that reads its entries from the DB and its text from the `patientFreeTreatment`
// copy, so it follows the visitor's language.
//
// Metiv addition 2: free treatment frameworks and studies recruiting
// participants. Descriptive only: who, what it involves, how suitability is
// decided, how to reach out.
export default function FreeTreatmentAndResearch() {
  const { PageHeader } = useDemoChrome();
  const { lang } = useLang();
  const { FREE_TREATMENTS, RESEARCH_STUDIES, RESERVIST_FAMILY_PROGRAMS } = useMetiv();
  const c = useCopy('patientFreeTreatment');

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        size="editorial"
        align="start"
        tone="muted"
        image={IMAGES.rights_hero}
        imageOpacity={0.6}
        eyebrow={t(lang, 'rights')}
        title={c.title}
        subtitle={c.subtitle}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-14">
        <EntrySection id="free-frameworks" title={c.freeTitle} entries={FREE_TREATMENTS} />

        <div className="space-y-4">
          <div className="bg-muted/60 border border-border rounded-super p-5">
            <p className="text-foreground leading-relaxed">
              {c.researchNote}
            </p>
          </div>
          <EntrySection id="research" title={c.researchTitle} entries={RESEARCH_STUDIES} />
        </div>

        <EntrySection
          id="reservist-family-programs"
          title={c.reservistTitle}
          entries={RESERVIST_FAMILY_PROGRAMS}
        />

        <ConsultationBlock />
        <CrisisLines />
      </div>
    </div>
  );
}
