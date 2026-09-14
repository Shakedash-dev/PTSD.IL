import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { tx } from '../copy';

// Full Jacobson PMR sequence: 6 muscle groups.
// Each group: squeeze (tense) then release. Total about 2 minutes.
const SQUEEZE_SECS = 6;
const RELEASE_SECS = 10;
const TICK_MS = 100;

// The muscle-group script lives in src/lib/i18n.js (read through ../copy.js).
const GROUP_COUNT = 6;
const GROUP_INDEXES = Array.from({ length: GROUP_COUNT }, (_, i) => i);

// Flat phase list: [squeeze g0, release g0, squeeze g1, release g1, ...]
const PHASES = GROUP_INDEXES.flatMap(gi => [
  { groupIdx: gi, action: 'squeeze', seconds: SQUEEZE_SECS },
  { groupIdx: gi, action: 'release', seconds: RELEASE_SECS },
]);

// group 0 -> muscle_group_1_*, matching the 1-based numbering an editor sees.
function groupKey(groupIdx, field) {
  return `muscle_group_${groupIdx + 1}_${field}`;
}

const SHAPE_PX = 208;
const RING_R = SHAPE_PX / 2 - 5;
const RING_CIRC = 2 * Math.PI * RING_R;

// Warm for squeeze, cool for release. The original used literal hex colours
// (clay / sage); the demo rules require tokens, so these are the categorical
// warm (category-4) and green (category-3) tokens, each with a light label.
const COLOR_SQUEEZE = 'hsl(var(--category-4))';
const COLOR_RELEASE = 'hsl(var(--category-3))';

function TimerRing({ progress, isSqueeze }) {
  const offset = RING_CIRC * (1 - progress);
  const color = isSqueeze ? COLOR_SQUEEZE : COLOR_RELEASE;
  return (
    <svg
      width={SHAPE_PX}
      height={SHAPE_PX}
      className="absolute inset-0"
      style={{ transform: 'rotate(-90deg)' }}
      aria-hidden="true"
    >
      <circle
        cx={SHAPE_PX / 2} cy={SHAPE_PX / 2} r={RING_R}
        fill="none" stroke={color} strokeOpacity={0.15} strokeWidth={3}
      />
      <circle
        cx={SHAPE_PX / 2} cy={SHAPE_PX / 2} r={RING_R}
        fill="none" stroke={color} strokeOpacity={0.65} strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={RING_CIRC}
        strokeDashoffset={offset}
        style={{ transition: `stroke-dashoffset ${TICK_MS}ms linear` }}
      />
    </svg>
  );
}

export default function CalmingMuscle() {
  const phases = PHASES;

  const [started, setStarted] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!started || done) return;
    const id = setInterval(() => setElapsed(e => e + TICK_MS / 1000), TICK_MS);
    return () => clearInterval(id);
  }, [started, done]);

  useEffect(() => {
    if (!started || done) return;
    const phase = phases[phaseIdx];
    if (elapsed >= phase.seconds) {
      if (phaseIdx < phases.length - 1) {
        setPhaseIdx(i => i + 1);
        setElapsed(0);
      } else {
        setDone(true);
      }
    }
  }, [elapsed, phaseIdx, started, done, phases]);

  function restart() {
    setStarted(false);
    setPhaseIdx(0);
    setElapsed(0);
    setDone(false);
  }

  const phase = phases[phaseIdx];
  const isSqueeze = phase?.action === 'squeeze';
  const progress = phase ? Math.min(1, elapsed / phase.seconds) : 0;
  const secondsLeft = phase ? Math.max(1, Math.ceil(phase.seconds - elapsed)) : 0;
  const completedGroups = Math.floor(phaseIdx / 2);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 pt-14">
      <div className="w-full max-w-sm flex flex-col items-center text-center">

        {!started ? (
          <>
            <h2 className="font-heading font-semibold text-3xl text-foreground mb-3">{tx('muscle_page_title')}</h2>
            <p className="text-card-foreground leading-relaxed mb-10 max-w-xs">{tx('muscle_intro')}</p>
            <Button
              variant="elevated"
              radius="full"
              size="cta"
              onClick={() => setStarted(true)}
            >
              {tx('muscle_start')}
            </Button>
          </>

        ) : done ? (
          <>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 mx-auto">
              <span className="text-3xl font-heading font-semibold text-primary" aria-hidden="true">✓</span>
            </div>
            <h2 className="font-heading font-semibold text-3xl text-foreground mb-3">{tx('muscle_done_title')}</h2>
            <p className="text-card-foreground leading-relaxed mb-10 max-w-xs">{tx('muscle_done_text')}</p>
            <Button
              variant="elevated"
              radius="full"
              size="cta"
              onClick={restart}
            >
              {tx('muscle_again')}
            </Button>
          </>

        ) : (
          <>
            {/* Group progress dots */}
            <div className="flex gap-2.5 mb-10" aria-hidden="true">
              {GROUP_INDEXES.map(i => {
                const isDone = i < completedGroups;
                const isActive = i === completedGroups;
                return (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-500 ${isDone ? 'bg-primary' : isActive ? 'scale-125' : 'bg-border'}`}
                    style={isActive ? { backgroundColor: isSqueeze ? COLOR_SQUEEZE : COLOR_RELEASE } : undefined}
                  />
                );
              })}
            </div>

            {/* Body part label */}
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-2 font-semibold">
              {tx(groupKey(phase?.groupIdx ?? 0, 'name'))}
            </div>

            {/* Morphing shape + timer ring */}
            <div className="relative flex items-center justify-center mb-7" style={{ width: SHAPE_PX, height: SHAPE_PX }}>
              <TimerRing progress={progress} isSqueeze={isSqueeze} />
              <div
                style={{
                  width: isSqueeze ? '118px' : '158px',
                  height: isSqueeze ? '118px' : '158px',
                  borderRadius: isSqueeze ? '18px' : '50%',
                  backgroundColor: isSqueeze ? COLOR_SQUEEZE : COLOR_RELEASE,
                  transition: 'all 700ms ease-in-out',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span className="text-background text-sm font-semibold tracking-wide select-none">
                  {tx(isSqueeze ? 'muscle_squeeze_label' : 'muscle_release_label')}
                </span>
              </div>
            </div>

            {/* Instruction */}
            <p className="font-heading font-semibold text-lg text-foreground leading-snug mb-3 max-w-xs" aria-live="polite">
              {tx(groupKey(phase.groupIdx, phase.action))}
            </p>

            {/* Countdown */}
            <div
              className="text-5xl font-heading font-semibold tabular-nums transition-colors duration-700"
              style={{ color: isSqueeze ? COLOR_SQUEEZE : COLOR_RELEASE }}
            >
              {secondsLeft}
            </div>
          </>
        )}

        <div className="mt-12">
          <a href="tel:1201" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">
            {tx('crisis_line_short')}
          </a>
        </div>
      </div>
    </div>
  );
}
