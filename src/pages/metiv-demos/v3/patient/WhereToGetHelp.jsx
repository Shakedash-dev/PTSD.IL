import React from 'react';
import { IMAGES } from '@/lib/images';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { useDemoChrome } from '@/pages/metiv-demos/shared/DemoChrome';
import { useCopy, useMetiv } from '../content/MetivContent';
import { EntrySection, ConsultationBlock, CrisisLines, useWithReleaseJourneyPage } from './PatientKit';

// Metiv demo (V3): a copy of shared/patient/pages/WhereToGetHelp.jsx. Change only:
// the מסע שחרור entry links to the programme's own page.
//
// Metiv addition 1 (+ 8): a neutral directory of where treatment is available.
// Same card format for every provider, no ranking. Public-system entries use
// only details that already appear in the patient content snapshot.
export default function WhereToGetHelp() {
  const { PageHeader } = useDemoChrome();
  const { lang } = useLang();
  const { PUBLIC_OPTIONS, NONPROFIT_OPTIONS, METIV_SERVICES } = useMetiv();
  const c = useCopy('patientWhereToGetHelp');
  const withReleaseJourneyPage = useWithReleaseJourneyPage();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        size="editorial"
        align="start"
        tone="card"
        image={IMAGES.community_hero}
        eyebrow={t(lang, 'treatment')}
        title={c.title}
        subtitle={c.subtitle}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-14">
        <div className="bg-card border border-border rounded-super p-5 space-y-3">
          <CrisisLines />
          <p className="text-sm text-muted-foreground leading-relaxed">
            {c.disclaimer}
          </p>
        </div>

        <EntrySection id="public-system" title={c.publicTitle} entries={PUBLIC_OPTIONS} />
        <EntrySection id="nonprofits" title={c.nonprofitsTitle} entries={NONPROFIT_OPTIONS} />
        <EntrySection id="metiv" title={c.metivTitle} entries={withReleaseJourneyPage(METIV_SERVICES)} />

        <ConsultationBlock asAnchor />
      </div>
    </div>
  );
}
