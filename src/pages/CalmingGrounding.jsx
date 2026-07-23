import React, { useState } from 'react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

// he/en are the clinician-authored source scripts.
// ar/ru/fr are machine-assisted translations pending clinician review.
const STEPS = {
  he: [
    { num: 5, instruction: 'מצאו 5 דברים שאתם רואים סביבכם', tip: 'הכיסא, הדלת, החלון' },
    { num: 4, instruction: 'מצאו 4 דברים שאתם יכולים לגעת בהם', tip: 'המשטח שעליו אתם יושבים, הבגד' },
    { num: 3, instruction: 'הקשיבו ל-3 קולות שאתם שומעים', tip: 'נשימה, תנועת אוויר, קולות מבחוץ' },
    { num: 2, instruction: 'שימו לב ל-2 ריחות שאתם מריחים', tip: 'אפילו ריח עדין של האוויר' },
    { num: 1, instruction: 'שימו לב לטעם אחד שאתם טועמים', tip: 'הטעם שנמצא כרגע בפה' },
  ],
  en: [
    { num: 5, instruction: 'Find 5 things you can see around you', tip: 'The chair, the door, the window' },
    { num: 4, instruction: 'Find 4 things you can touch', tip: "The surface you're sitting on, your clothing" },
    { num: 3, instruction: 'Listen for 3 sounds you can hear', tip: 'Breathing, air movement, sounds from outside' },
    { num: 2, instruction: 'Notice 2 things you can smell', tip: 'Even the faint smell of the air' },
    { num: 1, instruction: 'Notice 1 thing you can taste', tip: 'The taste currently in your mouth' },
  ],
  ar: [
    { num: 5, instruction: 'ابحث عن 5 أشياء تراها حولك', tip: 'الكرسي، الباب، النافذة' },
    { num: 4, instruction: 'ابحث عن 4 أشياء يمكنك لمسها', tip: 'السطح الذي تجلس عليه، ملابسك' },
    { num: 3, instruction: 'أنصت إلى 3 أصوات تسمعها', tip: 'التنفّس، حركة الهواء، أصوات من الخارج' },
    { num: 2, instruction: 'انتبه إلى رائحتين تشمّهما', tip: 'حتى الرائحة الخفيفة للهواء' },
    { num: 1, instruction: 'انتبه إلى طعم واحد تتذوّقه', tip: 'الطعم الموجود في فمك الآن' },
  ],
  ru: [
    { num: 5, instruction: 'Найдите 5 вещей, которые вы видите вокруг', tip: 'Стул, дверь, окно' },
    { num: 4, instruction: 'Найдите 4 вещи, которых вы можете коснуться', tip: 'Поверхность, на которой вы сидите, ваша одежда' },
    { num: 3, instruction: 'Прислушайтесь к 3 звукам, которые вы слышите', tip: 'Дыхание, движение воздуха, звуки снаружи' },
    { num: 2, instruction: 'Обратите внимание на 2 запаха', tip: 'Даже едва уловимый запах воздуха' },
    { num: 1, instruction: 'Обратите внимание на 1 вкус', tip: 'Вкус, который сейчас у вас во рту' },
  ],
  fr: [
    { num: 5, instruction: 'Trouvez 5 choses que vous voyez autour de vous', tip: 'La chaise, la porte, la fenêtre' },
    { num: 4, instruction: 'Trouvez 4 choses que vous pouvez toucher', tip: 'La surface sur laquelle vous êtes assis, vos vêtements' },
    { num: 3, instruction: 'Écoutez 3 sons que vous entendez', tip: 'La respiration, le mouvement de l\'air, les bruits du dehors' },
    { num: 2, instruction: 'Remarquez 2 odeurs que vous sentez', tip: 'Même l\'odeur légère de l\'air' },
    { num: 1, instruction: 'Remarquez 1 goût que vous percevez', tip: 'Le goût présent dans votre bouche en ce moment' },
  ],
};

// UI chrome for the grounding flow (buttons + crisis-line label).
// he/en source; ar/ru/fr machine-assisted, pending clinician review.
const UI = {
  he: { next: 'הבא', complete: 'סיום', again: 'להתחיל מחדש', eran: 'ער״ן: 1201' },
  en: { next: 'Next', complete: 'Complete', again: 'Start again', eran: 'Eran: 1201' },
  ar: { next: 'التالي', complete: 'إنهاء', again: 'ابدأ من جديد', eran: 'إيران: 1201' },
  ru: { next: 'Далее', complete: 'Завершить', again: 'Начать заново', eran: 'ЭРАН: 1201' },
  fr: { next: 'Suivant', complete: 'Terminer', again: 'Recommencer', eran: 'ERAN : 1201' },
};

export default function CalmingGrounding() {
  const { lang } = useLang();
  const steps = STEPS[lang] || STEPS.he;
  const ui = UI[lang] || UI.he;

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
          {ui.again}
        </button>
        <div className="mt-10">
          <a href="tel:1201" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">{ui.eran}</a>
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
            {stepIdx < steps.length - 1 ? ui.next : ui.complete}
          </button>
        </div>

        <div className="mt-12 text-center">
          <a href="tel:1201" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">{ui.eran}</a>
        </div>
      </div>
    </div>
  );
}