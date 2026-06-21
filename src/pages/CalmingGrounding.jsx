import React, { useState } from 'react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

const STEPS_HE = [
  { num: 5, instruction: 'מצאו 5 דברים שאתם רואים סביבכם', tip: 'הכיסא, הדלת, החלון' },
  { num: 4, instruction: 'מצאו 4 דברים שאתם יכולים לגעת בהם', tip: 'המשטח שעליו אתם יושבים, הבגד' },
  { num: 3, instruction: 'הקשיבו ל-3 קולות שאתם שומעים', tip: 'נשימה, תנועת אוויר, קולות מבחוץ' },
  { num: 2, instruction: 'שימו לב ל-2 ריחות שאתם מריחים', tip: 'אפילו ריח עדין של האוויר' },
  { num: 1, instruction: 'שימו לב לטעם אחד שאתם טועמים', tip: 'הטעם שנמצא כרגע בפה' },
];

const STEPS_EN = [
  { num: 5, instruction: 'Find 5 things you can see around you', tip: 'The chair, the door, the window' },
  { num: 4, instruction: 'Find 4 things you can touch', tip: "The surface you're sitting on, your clothing" },
  { num: 3, instruction: 'Listen for 3 sounds you can hear', tip: 'Breathing, air movement, sounds from outside' },
  { num: 2, instruction: 'Notice 2 things you can smell', tip: 'Even the faint smell of the air' },
  { num: 1, instruction: 'Notice 1 thing you can taste', tip: 'The taste currently in your mouth' },
];

export default function CalmingGrounding() {
  const { lang } = useLang();
  const steps = lang === 'en' ? STEPS_EN : STEPS_HE;

  const [stepIdx, setStepIdx] = useState(0);
  const [done, setDone] = useState(false);

  const current = steps[stepIdx];

  function advance() {
    if (stepIdx < steps.length - 1) {
      setStepIdx(i => i + 1);
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 text-center pt-14">
        <h2 className="text-3xl font-heading font-semibold text-foreground mb-4">
          {t(lang, 'ground_complete')}
        </h2>
        <p className="text-card-foreground mb-10">5 · 4 · 3 · 2 · 1</p>
        <button
          onClick={() => { setStepIdx(0); setDone(false); }}
          className="px-7 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-accent transition-colors duration-300"
        >
          {lang === 'en' ? 'Start again' : 'להתחיל מחדש'}
        </button>
        <div className="mt-10">
          <a href="tel:1201" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">ער״ן: 1201</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 pt-14">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex justify-center gap-2 mb-12">
          {steps.map((s, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-colors duration-300 ${
                i < stepIdx ? 'w-8 bg-primary' : i === stepIdx ? 'w-8 bg-accent' : 'w-3 bg-border'
              }`}
            />
          ))}
        </div>

        <div className="text-center" key={stepIdx}>
          <div className="text-8xl font-heading font-bold text-primary mb-8 leading-none select-none">
            {current.num}
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-semibold text-foreground mb-4 leading-snug px-2">
            {current.instruction}
          </h2>
          <p className="text-card-foreground mb-12 leading-relaxed">{current.tip}</p>

          <button
            onClick={advance}
            className="px-8 py-3.5 bg-primary text-primary-foreground rounded-xl font-medium text-lg hover:bg-accent transition-colors duration-300 w-full max-w-xs"
          >
            {stepIdx < steps.length - 1
              ? (lang === 'en' ? 'Next' : 'הבא')
              : (lang === 'en' ? 'Complete' : 'סיום')}
          </button>
        </div>

        <div className="mt-12 text-center">
          <a href="tel:1201" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">ער״ן: 1201</a>
        </div>
      </div>
    </div>
  );
}