import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const LOGO = `${import.meta.env.BASE_URL || '/'}images/metiv-demo/metiv-logo.png`;

// One entry per design direction. Same content and page set, different design.
const VERSIONS = [
  { to: '/metiv-site-demo-v1', name: 'גרסה 1 - עריכה שקטה', text: 'מגזיני ושקט: טיפוגרפיה גדולה, הרבה אוויר, מסגרות קשת.' },
  { to: '/metiv-site-demo-v2', name: 'גרסה 2 - שתי דלתות', text: 'נועז ודו-גוני: הפיצול בין האזורים מלווה את כל האתר, כרטיסים ומעברים ברורים.' },
  { to: '/metiv-site-demo-v3', name: 'גרסה 3 - מסע מלווה', text: 'חם ומאויר: שאלות מכוונות, צעדים, ותוכן שנפתח בהדרגה.' },
  { to: '/metiv-site-demo-v4', name: 'גרסה 4 - מוסדי ומודרני', text: 'מובנה וענייני: ניווט עשיר, רשתות מידע, היררכיה חדה.' },
];

export default function Chooser() {
  useEffect(() => {
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex, nofollow';
    document.head.appendChild(robots);
    const prev = document.title;
    document.title = 'מטיב - גרסאות דמו';
    return () => { robots.remove(); document.title = prev; };
  }, []);

  return (
    <div dir="rtl" lang="he" className="min-h-screen bg-background px-5 py-12 sm:py-20">
      <div className="max-w-4xl mx-auto">
        <img src={LOGO} alt="מטיב - המרכז הישראלי לפסיכוטראומה" className="h-14 w-auto mx-auto mb-8" />
        <h1 className="font-heading font-semibold text-3xl sm:text-4xl text-foreground text-center mb-3">האתר המאוחד של מטיב - 4 גרסאות עיצוב</h1>
        <p className="text-center text-card-foreground mb-10">אותו תוכן ואותם עמודים בכל הגרסאות. דמו בלבד, לא לפרסום.</p>
        <div className="grid sm:grid-cols-2 gap-5">
          {VERSIONS.map((v) => (
            <Link
              key={v.to}
              to={v.to}
              className="group flex flex-col p-6 rounded-super-sm bg-card border border-border hover:border-primary shadow-card hover:shadow-card-hover transition-all duration-300"
            >
              <h2 className="font-heading font-semibold text-xl text-foreground mb-2">{v.name}</h2>
              <p className="text-sm text-card-foreground leading-relaxed flex-1">{v.text}</p>
              <span className="mt-4 inline-flex items-center gap-2 font-semibold text-primary group-hover:gap-3 transition-all">
                כניסה <ArrowLeft className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
