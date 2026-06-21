import React, { useState } from 'react';
import { useLang } from '@/lib/LanguageContext';

export default function CalmingBreathing() {
  const { lang } = useLang();
  const [started, setStarted] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 pt-14">
      <div className="w-full max-w-md flex flex-col items-center">
        {!started ? (
          <div className="text-center">
            {/* Only Hebrew and English are translated here — other languages see Hebrew. */}
            <p className="text-card-foreground mb-10 text-lg leading-relaxed">
              {lang === 'en' ? 'Follow the circle as it grows and shrinks' : 'עקבו אחרי העיגול בזמן שהוא גדל ומתכווץ'}
            </p>
            <button
              onClick={() => setStarted(true)}
              className="px-8 py-3.5 bg-primary text-primary-foreground rounded-xl font-medium text-lg hover:bg-accent transition-colors duration-300"
            >
              {lang === 'en' ? 'Start' : 'התחלה'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-72 h-72">
              {/* Color is hardcoded — intentionally fixed so the circle stays calm and consistent
                  regardless of which palette the user has selected. */}
              <div
                className="rounded-full breathing-circle"
                style={{ width: '260px', height: '260px', backgroundColor: '#8EA89D' }}
              />
            </div>
            <button
              onClick={() => setStarted(false)}
              className="mt-12 text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              {lang === 'en' ? 'Stop' : 'עצירה'}
            </button>
          </div>
        )}

        <div className="mt-12 text-center">
          <a href="tel:1201" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">
            ער״ן: 1201
          </a>
        </div>
      </div>
    </div>
  );
}