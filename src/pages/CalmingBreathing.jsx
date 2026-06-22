import React, { useEffect, useState } from 'react';
import { useLang } from '@/lib/LanguageContext';

// Phase durations (seconds). Standard 4-4-8 calming protocol.
const PHASES = [
  { key: 'inhale', seconds: 4 },
  { key: 'hold',   seconds: 4 },
  { key: 'exhale', seconds: 8 },
];

// Exercise-local strings. Kept inline so adding `en`/`ar` later is one map entry,
// no i18n.js round-trip needed for these breathing-specific labels.
const STRINGS = {
  he: {
    setup_title: 'הכנה',
    setup_steps: [
      'שב/י או שכב/י בנוחות.',
      'יד אחת על הבטן, יד שנייה על החזה.',
      'תן/י לבטן לעלות עם השאיפה — לא לחזה.',
      'הכתפיים והגרון רפויים.',
    ],
    start: 'התחלה',
    stop: 'עצירה',
    inhale: 'שאיפה',
    hold: 'החזיקו',
    exhale: 'נשיפה',
    seconds_suffix: 'שניות',
    cycle_label: 'מחזור',
    eran_link: 'ער״ן: 1201',
  },
  en: {
    setup_title: 'Get ready',
    setup_steps: [
      'Sit or lie down comfortably.',
      'One hand on your belly, one on your chest.',
      'Let the belly hand rise on the inhale — not the chest.',
      'Keep shoulders and throat relaxed.',
    ],
    start: 'Start',
    stop: 'Stop',
    inhale: 'Inhale',
    hold: 'Hold',
    exhale: 'Exhale',
    seconds_suffix: 'seconds',
    cycle_label: 'Cycle',
    eran_link: 'Eran helpline: 1201',
  },
};

function pickStrings(lang) {
  return STRINGS[lang] || STRINGS.he;
}

const TICK_MS = 100;

export default function CalmingBreathing() {
  const { lang } = useLang();
  const s = pickStrings(lang);

  const [stage, setStage] = useState('setup'); // 'setup' | 'running'
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseElapsed, setPhaseElapsed] = useState(0); // seconds (float) into current phase
  const [cycle, setCycle] = useState(1);

  // Single clock: advances elapsed time. Phase boundary handled in render-derived state below.
  useEffect(() => {
    if (stage !== 'running') return undefined;
    const id = setInterval(() => {
      setPhaseElapsed(e => e + TICK_MS / 1000);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [stage]);

  // When elapsed crosses the phase duration, advance phase (and cycle if wrapping).
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

  function stop() {
    setStage('setup');
  }

  const phase = PHASES[phaseIndex];
  const phaseLabel = s[phase.key];
  const secondsLeft = Math.max(1, Math.ceil(phase.seconds - phaseElapsed));
  const progress = Math.min(1, phaseElapsed / phase.seconds); // 0..1

  // Circle scale: inhale 0.55→1, hold stays at 1, exhale 1→0.55.
  // Driven by phase progress so the visual is tightly in sync with the countdown.
  let scale;
  if (phase.key === 'inhale') scale = 0.55 + 0.45 * progress;
  else if (phase.key === 'hold') scale = 1;
  else scale = 1 - 0.45 * progress;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 pt-14">
      <div className="w-full max-w-md flex flex-col items-center">
        {stage === 'setup' ? (
          <div className="text-center">
            <h2 className="font-heading font-light text-3xl text-foreground mb-6">
              {s.setup_title}
            </h2>
            <ol className="text-card-foreground text-lg leading-relaxed text-start space-y-3 mb-10 list-decimal list-inside marker:text-primary marker:font-bold">
              {s.setup_steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
            <button
              onClick={start}
              className="px-10 py-4 bg-primary text-primary-foreground rounded-full font-medium text-lg hover:bg-accent transition-colors duration-300 shadow-card hover:shadow-card-hover"
            >
              {s.start}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {/* Cycle counter */}
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6 font-semibold">
              {s.cycle_label} {cycle}
            </div>

            {/* Animated circle - scale driven by phase progress */}
            <div className="flex items-center justify-center w-80 h-80 mb-4 relative">
              <div
                className="rounded-full absolute"
                style={{
                  width: '288px',
                  height: '288px',
                  backgroundColor: '#8EA89D',
                  transform: `scale(${scale})`,
                  // transition matches tick rate so motion looks continuous, not stuttery
                  transition: `transform ${TICK_MS}ms linear`,
                }}
              />
              <div className="relative z-10 text-center pointer-events-none">
                <div className="font-heading font-light text-3xl text-foreground mb-1">
                  {phaseLabel}
                </div>
                <div className="font-heading font-bold text-5xl text-foreground tabular-nums">
                  {secondsLeft}
                </div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground mt-1">
                  {s.seconds_suffix}
                </div>
              </div>
            </div>

            <button
              onClick={stop}
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
