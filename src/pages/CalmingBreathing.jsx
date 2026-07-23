import React, { useEffect, useState } from 'react';
import { useLang } from '@/lib/LanguageContext';

const PHASES = [
  { key: 'inhale', seconds: 4 },
  { key: 'hold',   seconds: 4 },
  { key: 'exhale', seconds: 8 },
];

// he/en are the clinician-authored source scripts.
// ar/ru/fr are machine-assisted translations pending clinician review.
const STRINGS = {
  he: {
    setup_title: 'לפני שמתחילים',
    setup_steps: [
      'שב/י או שכב/י בנוחות.',
      'יד אחת על הבטן, יד שנייה על החזה.',
      'תן/י לבטן לעלות עם השאיפה - לא לחזה.',
      'הכתפיים והגרון רפויים.',
    ],
    start: 'התחלה',
    stop: 'עצירה',
    inhale: 'שאיפה',
    hold: 'החזיקו',
    exhale: 'נשיפה',
    next_label: 'הבא',
    cycle_label: 'מחזור',
    eran_link: 'ער״ן: 1201',
  },
  en: {
    setup_title: 'Before you begin',
    setup_steps: [
      'Sit or lie down comfortably.',
      'One hand on your belly, one on your chest.',
      'Let the belly rise on the inhale — not the chest.',
      'Keep shoulders and throat relaxed.',
    ],
    start: 'Start',
    stop: 'Stop',
    inhale: 'Inhale',
    hold: 'Hold',
    exhale: 'Exhale',
    next_label: 'Next',
    cycle_label: 'Cycle',
    eran_link: 'Eran helpline: 1201',
  },
  ar: {
    setup_title: 'قبل أن نبدأ',
    setup_steps: [
      'اجلس أو استلقِ بشكل مريح.',
      'ضع يدًا على بطنك، واليد الأخرى على صدرك.',
      'دع بطنك يرتفع مع الشهيق - لا صدرك.',
      'أبقِ كتفيك وحلقك مرتخيين.',
    ],
    start: 'ابدأ',
    stop: 'توقّف',
    inhale: 'شهيق',
    hold: 'احبس النفس',
    exhale: 'زفير',
    next_label: 'التالي',
    cycle_label: 'دورة',
    eran_link: 'إيران: 1201',
  },
  ru: {
    setup_title: 'Прежде чем начать',
    setup_steps: [
      'Сядьте или лягте удобно.',
      'Одну руку положите на живот, другую на грудь.',
      'Пусть на вдохе поднимается живот, а не грудь.',
      'Плечи и горло расслаблены.',
    ],
    start: 'Начать',
    stop: 'Остановить',
    inhale: 'Вдох',
    hold: 'Задержка',
    exhale: 'Выдох',
    next_label: 'Далее',
    cycle_label: 'Цикл',
    eran_link: 'ЭРАН: 1201',
  },
  fr: {
    setup_title: 'Avant de commencer',
    setup_steps: [
      'Asseyez-vous ou allongez-vous confortablement.',
      'Une main sur le ventre, l\'autre sur la poitrine.',
      'Laissez le ventre se soulever à l\'inspiration, pas la poitrine.',
      'Gardez les épaules et la gorge détendues.',
    ],
    start: 'Commencer',
    stop: 'Arrêter',
    inhale: 'Inspiration',
    hold: 'Retenez',
    exhale: 'Expiration',
    next_label: 'Suivant',
    cycle_label: 'Cycle',
    eran_link: 'ERAN : 1201',
  },
};

const TICK_MS = 100;

// Ring sits just outside the breathing circle at full scale
const RING_PX = 288;
const CIRCLE_PX = 240;
const RING_R = RING_PX / 2 - 5;
const RING_CIRC = 2 * Math.PI * RING_R;

function ProgressRing({ progress }) {
  const offset = RING_CIRC * (1 - progress);
  return (
    <svg
      width={RING_PX}
      height={RING_PX}
      className="absolute inset-0 text-primary"
      style={{ transform: 'rotate(-90deg)' }}
    >
      <circle
        cx={RING_PX / 2} cy={RING_PX / 2} r={RING_R}
        fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={3}
      />
      <circle
        cx={RING_PX / 2} cy={RING_PX / 2} r={RING_R}
        fill="none" stroke="currentColor" strokeOpacity={0.55} strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={RING_CIRC}
        strokeDashoffset={offset}
        style={{ transition: `stroke-dashoffset ${TICK_MS}ms linear` }}
      />
    </svg>
  );
}

export default function CalmingBreathing() {
  const { lang } = useLang();
  const s = STRINGS[lang] || STRINGS.he;

  const [stage, setStage] = useState('setup');
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseElapsed, setPhaseElapsed] = useState(0);
  const [cycle, setCycle] = useState(1);

  useEffect(() => {
    if (stage !== 'running') return;
    const id = setInterval(() => setPhaseElapsed(e => e + TICK_MS / 1000), TICK_MS);
    return () => clearInterval(id);
  }, [stage]);

  useEffect(() => {
    const current = PHASES[phaseIndex];
    if (phaseElapsed >= current.seconds) {
      setPhaseIndex(pi => {
        const next = (pi + 1) % PHASES.length;
        if (next === 0) setCycle(c => c + 1);
        return next;
      });
      setPhaseElapsed(0);
    }
  }, [phaseElapsed, phaseIndex]);

  function start() {
    setPhaseIndex(0);
    setPhaseElapsed(0);
    setCycle(1);
    setStage('running');
  }

  const phase = PHASES[phaseIndex];
  const nextPhase = PHASES[(phaseIndex + 1) % PHASES.length];
  const progress = Math.min(1, phaseElapsed / phase.seconds);
  const secondsLeft = Math.max(1, Math.ceil(phase.seconds - phaseElapsed));

  let scale;
  if (phase.key === 'inhale') scale = 0.5 + 0.5 * progress;
  else if (phase.key === 'hold') scale = 1;
  else scale = 1 - 0.5 * progress;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 pt-14">
      <div className="w-full max-w-md flex flex-col items-center">

        {stage === 'setup' ? (
          <div className="text-center max-w-sm">
            <h2 className="font-heading font-light text-3xl text-foreground mb-8">
              {s.setup_title}
            </h2>
            <ol className="text-start space-y-4 mb-10">
              {s.setup_steps.map((step, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-card-foreground leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
            <button
              onClick={start}
              className="px-10 py-4 bg-primary text-primary-foreground rounded-full font-medium text-lg hover:bg-primary/90 transition-colors duration-300 shadow-card hover:shadow-card-hover"
            >
              {s.start}
            </button>
          </div>

        ) : (
          <div className="flex flex-col items-center w-full">

            {/* Phase strip */}
            <div className="flex items-center mb-10">
              {PHASES.map((p, i) => (
                <React.Fragment key={p.key}>
                  <span className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-500 ${
                    i === phaseIndex
                      ? 'bg-primary text-primary-foreground shadow-card scale-105'
                      : 'text-muted-foreground'
                  }`}>
                    {s[p.key]}
                  </span>
                  {i < PHASES.length - 1 && (
                    <div className="w-5 h-px bg-border mx-0.5 flex-shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Breathing circle + ring */}
            <div className="relative" style={{ width: RING_PX, height: RING_PX }}>
              <ProgressRing progress={progress} />
              <div
                className="absolute rounded-full"
                style={{
                  width: CIRCLE_PX,
                  height: CIRCLE_PX,
                  top: '50%',
                  left: '50%',
                  backgroundColor: '#8EA89D',
                  transform: `translate(-50%, -50%) scale(${scale})`,
                  transition: `transform ${TICK_MS}ms linear`,
                }}
              />
            </div>

            {/* Phase label + countdown below circle */}
            <div className="mt-7 text-center">
              <div className="font-heading font-semibold text-xl text-foreground mb-1">
                {s[phase.key]}
              </div>
              <div className="font-heading font-bold text-6xl text-foreground tabular-nums leading-none">
                {secondsLeft}
              </div>
              <div className="text-xs text-muted-foreground mt-2 tracking-wide">
                {s.next_label}: {s[nextPhase.key]}
              </div>
            </div>

            {/* Cycle counter */}
            <div className="mt-6 text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
              {s.cycle_label} {cycle}
            </div>

            <button
              onClick={() => setStage('setup')}
              className="mt-10 text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              {s.stop}
            </button>
          </div>
        )}

        <div className="mt-12 text-center">
          <a href="tel:1201" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">
            {s.eran_link}
          </a>
        </div>
      </div>
    </div>
  );
}
