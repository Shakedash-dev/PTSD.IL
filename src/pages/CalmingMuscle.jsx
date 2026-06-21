import React, { useState, useEffect } from 'react';
import { useLang } from '@/lib/LanguageContext';

const PHASES_HE = [
  { label: 'קמצו את כפות הידיים לאגרוף חזק', sub: 'חזק ככל שניתן', action: 'squeeze', duration: 5000 },
  { label: 'שחררו לאט', sub: 'שימו לב לתחושת השחרור', action: 'release', duration: 5000 },
  { label: 'עכשיו כתפיים - הרימו אותן לאוזניים', sub: 'עצרו שם', action: 'squeeze', duration: 5000 },
  { label: 'שחררו', sub: 'שימו לב כמה כבד כל שריר עכשיו', action: 'release', duration: 5000 },
  { label: 'קמצו את שרירי הבטן', sub: 'בעדינות אך בבירור', action: 'squeeze', duration: 5000 },
  { label: 'שחררו', sub: 'נשמו עמוק', action: 'release', duration: 5000 },
];

const PHASES_EN = [
  { label: 'Clench your fists as hard as you can', sub: 'As tight as possible', action: 'squeeze', duration: 5000 },
  { label: 'Slowly release', sub: 'Notice the feeling of letting go', action: 'release', duration: 5000 },
  { label: 'Raise your shoulders to your ears', sub: 'Hold there', action: 'squeeze', duration: 5000 },
  { label: 'Release', sub: 'Feel how heavy your shoulders are now', action: 'release', duration: 5000 },
  { label: 'Tighten your stomach muscles', sub: 'Gently but clearly', action: 'squeeze', duration: 5000 },
  { label: 'Release', sub: 'Take a deep breath', action: 'release', duration: 5000 },
];

export default function CalmingMuscle() {
  const { lang } = useLang();
  const phases = lang === 'en' ? PHASES_EN : PHASES_HE;

  const [started, setStarted] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!started || done) return;
    const phase = phases[phaseIdx];
    setCountdown(phase.duration / 1000);

    const countInterval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(countInterval); return 0; }
        return c - 1;
      });
    }, 1000);

    const phaseTimer = setTimeout(() => {
      if (phaseIdx < phases.length - 1) {
        setPhaseIdx(i => i + 1);
      } else {
        setDone(true);
      }
    }, phase.duration);

    return () => { clearTimeout(phaseTimer); clearInterval(countInterval); };
  }, [phaseIdx, started, done]);

  const phase = phases[phaseIdx];
  const isSqueeze = phase?.action === 'squeeze';

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 pt-14">
      <div className="w-full max-w-lg text-center">
        {!started ? (
          <div>
            <h2 className="text-3xl font-heading font-semibold text-foreground mb-4">
              {lang === 'en' ? 'Squeeze & Release' : 'כיווץ ושחרור שרירים'}
            </h2>
            <p className="text-card-foreground mb-10 leading-relaxed">
              {lang === 'en'
                ? 'This exercise reduces physical tension by alternating between tensing and releasing muscle groups.'
                : 'תרגיל זה מפחית מתח גופני על ידי כיווץ ושחרור של קבוצות שרירים.'}
            </p>
            <button
              onClick={() => setStarted(true)}
              className="px-8 py-3.5 bg-primary text-primary-foreground rounded-xl font-medium text-lg hover:bg-accent transition-colors duration-300"
            >
              {lang === 'en' ? 'Start' : 'התחלה'}
            </button>
          </div>
        ) : done ? (
          <div>
            <h2 className="text-3xl font-heading font-semibold text-foreground mb-4">
              {lang === 'en' ? 'Well done.' : 'כל הכבוד.'}
            </h2>
            <p className="text-card-foreground mb-10 leading-relaxed">
              {lang === 'en' ? 'Take a moment to notice how your body feels now.' : 'קחו רגע לשים לב איך הגוף שלכם מרגיש עכשיו.'}
            </p>
            <button
              onClick={() => { setStarted(false); setPhaseIdx(0); setDone(false); }}
              className="px-7 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-accent transition-colors duration-300"
            >
              {lang === 'en' ? 'Start again' : 'להתחיל מחדש'}
            </button>
          </div>
        ) : (
          <div key={phaseIdx}>
            {/* Phase indicator */}
            <div className="flex justify-center gap-1.5 mb-12">
              {phases.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-colors duration-300 ${
                    i < phaseIdx ? 'w-6 bg-primary' : i === phaseIdx ? 'w-8 bg-accent' : 'w-3 bg-border'
                  }`}
                />
              ))}
            </div>

            {/* Visual */}
            <div className="flex items-center justify-center mb-10 h-44">
              <div
                className="rounded-full transition-all duration-1000"
                style={{
                  width: isSqueeze ? '110px' : '160px',
                  height: isSqueeze ? '110px' : '160px',
                  backgroundColor: isSqueeze ? '#7A9489' : '#8EA89D',
                }}
              />
            </div>

            <h2 className="text-2xl sm:text-3xl font-heading font-semibold text-foreground mb-3 leading-snug px-2">
              {phase.label}
            </h2>
            <p className="text-card-foreground mb-6">{phase.sub}</p>

            <div className="text-4xl font-heading font-semibold text-primary">
              {countdown}
            </div>
          </div>
        )}

        <div className="mt-12">
          <a href="tel:1201" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">ער״ן: 1201</a>
        </div>
      </div>
    </div>
  );
}