import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { tx } from '../copy';

const PHASES = [
  { key: 'inhale', seconds: 4 },
  { key: 'hold',   seconds: 4 },
  { key: 'exhale', seconds: 8 },
];

// The exercise's wording lives in src/lib/i18n.js (read through ../copy.js).
const SETUP_STEP_KEYS = [
  'breathing_setup_step_1',
  'breathing_setup_step_2',
  'breathing_setup_step_3',
  'breathing_setup_step_4',
];

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
      aria-hidden="true"
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
              {tx('breathing_setup_title')}
            </h2>
            <ol className="text-start space-y-4 mb-10">
              {SETUP_STEP_KEYS.map((stepKey, i) => (
                <li key={stepKey} className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-card-foreground leading-relaxed">{tx(stepKey)}</span>
                </li>
              ))}
            </ol>
            <Button
              variant="elevated"
              radius="full"
              size="cta"
              onClick={start}
            >
              {tx('breathing_start')}
            </Button>
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
                    {tx(`breathing_${p.key}`)}
                  </span>
                  {i < PHASES.length - 1 && (
                    <div className="w-5 h-px bg-border mx-0.5 flex-shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Breathing circle + ring. The circle colour is a token (the
                original used a literal hex, which the demo rules forbid). */}
            <div className="relative" style={{ width: RING_PX, height: RING_PX }}>
              <ProgressRing progress={progress} />
              <div
                className="absolute rounded-full bg-category-3/60"
                style={{
                  width: CIRCLE_PX,
                  height: CIRCLE_PX,
                  inset: 0,
                  margin: 'auto',
                  transform: `scale(${scale})`,
                  transition: `transform ${TICK_MS}ms linear`,
                }}
              />
            </div>

            {/* Phase label + countdown below circle */}
            <div className="mt-7 text-center" aria-live="polite">
              <div className="font-heading font-semibold text-xl text-foreground mb-1">
                {tx(`breathing_${phase.key}`)}
              </div>
              <div className="font-heading font-semibold text-6xl text-foreground tabular-nums leading-none">
                {secondsLeft}
              </div>
              <div className="text-xs text-muted-foreground mt-2 tracking-wide">
                {tx('breathing_next_label')}: {tx(`breathing_${nextPhase.key}`)}
              </div>
            </div>

            {/* Cycle counter */}
            <div className="mt-6 text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
              {tx('breathing_cycle_label')} {cycle}
            </div>

            <Button
              variant="quiet"
              size="none"
              onClick={() => setStage('setup')}
              className="mt-10 text-sm"
            >
              {tx('breathing_stop')}
            </Button>
          </div>
        )}

        <div className="mt-12 text-center">
          <a href="tel:1201" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">
            {tx('crisis_line_short')}
          </a>
        </div>
      </div>
    </div>
  );
}
