import React from 'react';
import { IMAGES } from '@/lib/images';
import { useDemoChrome } from '@/pages/metiv-demos/shared/DemoChrome';
import { tx } from '../copy';
import { EntrySection, ConsultationBlock, CrisisLines } from '../components';
import { PUBLIC_OPTIONS, NONPROFIT_OPTIONS, METIV_SERVICES } from '../additions';

// Metiv addition 1 (+ 8): a neutral directory of where treatment is available.
// Same card format for every provider, no ranking. Public-system entries use
// only details that already appear in the patient content snapshot.
export default function WhereToGetHelp() {
  const { PageHeader } = useDemoChrome();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        size="editorial"
        align="start"
        tone="card"
        image={IMAGES.community_hero}
        eyebrow={tx('treatment')}
        title="איפה אפשר לקבל טיפול"
        subtitle="מסגרות שבהן ניתן טיפול בטראומה ובפוסט-טראומה: המערכת הציבורית, עמותות וקווי סיוע, ומרפאות ותכניות של מטיב. כל המסגרות מוצגות באותו מבנה, בלי דירוג."
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-14">
        <div className="bg-card border border-border rounded-super p-5 space-y-3">
          <CrisisLines />
          <p className="text-sm text-muted-foreground leading-relaxed">
            הפרטים נאספו מאתרי הגופים ועשויים להשתנות. כדאי לוודא אותם מול הגוף עצמו לפני פנייה.
          </p>
        </div>

        <EntrySection id="public-system" title="המערכת הציבורית" entries={PUBLIC_OPTIONS} />
        <EntrySection id="nonprofits" title="עמותות וקווי סיוע" entries={NONPROFIT_OPTIONS} />
        <EntrySection id="metiv" title="מטיב" entries={METIV_SERVICES} />

        <ConsultationBlock asAnchor />
      </div>
    </div>
  );
}
