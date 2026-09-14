import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { tx } from '../copy';

// The 5-4-3-2-1 script lives in src/lib/i18n.js (read through ../copy.js). The
// countdown (5 senses, 5 down to 1) is the exercise's structure, not copy.
const STEP_NUMBERS = [5, 4, 3, 2, 1];

export default function CalmingGrounding() {
  const [stepIdx, setStepIdx] = useState(0);
  const [done, setDone] = useState(false);

  const currentNum = STEP_NUMBERS[stepIdx];

  function advance() {
    if (stepIdx < STEP_NUMBERS.length - 1) {
      setStepIdx(i => i + 1);
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 text-center pt-14">
        <h2 className="text-3xl font-heading font-semibold text-foreground mb-4">
          {tx('ground_complete')}
        </h2>
        <p className="text-card-foreground mb-10">5 · 4 · 3 · 2 · 1</p>
        <Button
          variant="solid"
          radius="xl"
          size="roomy"
          onClick={() => { setStepIdx(0); setDone(false); }}
        >
          {tx('ground_again')}
        </Button>
        <div className="mt-10">
          <a href="tel:1201" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">{tx('crisis_line_short')}</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 pt-14">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex justify-center gap-2 mb-12" aria-hidden="true">
          {STEP_NUMBERS.map((num, i) => (
            <div
              key={num}
              className={`h-1.5 rounded-full transition-colors duration-300 ${
                i < stepIdx ? 'w-8 bg-primary' : i === stepIdx ? 'w-8 bg-accent' : 'w-3 bg-border'
              }`}
            />
          ))}
        </div>

        <div className="text-center" key={stepIdx}>
          <div className="text-8xl font-heading font-semibold text-primary mb-8 leading-none select-none">
            {currentNum}
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-semibold text-foreground mb-4 leading-snug px-2">
            {tx(`ground_step_${currentNum}`)}
          </h2>
          <p className="text-card-foreground mb-12 leading-relaxed">{tx(`ground_tip_${currentNum}`)}</p>

          <Button
            variant="solid"
            radius="xl"
            size="roomy-lg"
            onClick={advance}
            className="w-full max-w-xs"
          >
            {tx(stepIdx < STEP_NUMBERS.length - 1 ? 'ground_next' : 'ground_finish')}
          </Button>
        </div>

        <div className="mt-12 text-center">
          <a href="tel:1201" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">{tx('crisis_line_short')}</a>
        </div>
      </div>
    </div>
  );
}
