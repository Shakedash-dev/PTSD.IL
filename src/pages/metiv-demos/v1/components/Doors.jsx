import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IMAGES } from '@/lib/images';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { Arch, CONTAINER, FOCUS, PillLink } from './primitives';

// The two doors: the landing hero, repeated lower on the page and elsewhere.
const DOORS = [
  {
    key: 'patient',
    number: '01',
    dark: false,
    who: 'למי שעבר/ה אירוע טראומטי, ולבני משפחה וקרובים',
    title: 'למתמודדים ולמשפחות',
    description: 'מידע ברור על פוסט-טראומה, כלים להתמודדות, זכויות ודרכים לקבל טיפול.',
    cta: 'כניסה למידע ולתמיכה',
    route: ROUTES.patient,
    image: IMAGES.home_path1,
    contain: true,
    links: [
      { label: 'שאלון אנונימי', route: ROUTES.questionnaire },
      { label: 'תרגילי הרגעה', route: ROUTES.calming },
      { label: 'איפה מקבלים טיפול', route: ROUTES.whereToGetHelp },
    ],
  },
  {
    key: 'therapist',
    number: '02',
    dark: true,
    who: 'למטפלים, לחוקרים ולארגונים',
    title: 'לאנשי טיפול ומקצוע',
    description: 'קורסים והכשרות, הדרכה, מחקר ופרסומים של מטיב.',
    cta: 'כניסה לאזור המקצועי',
    route: ROUTES.therapist,
    image: IMAGES.treatment_step3,
    contain: false,
    links: [
      { label: 'קורסים והכשרות', route: ROUTES.courses },
      { label: 'הדרכה', route: ROUTES.supervision },
      { label: 'מחקר', route: ROUTES.research },
    ],
  },
];

/** @param {any} props */
function WhoLine({ door, className }) {
  return (
    <p className={cn('flex items-center gap-3 text-xs font-semibold tracking-wide', className)}>
      <span className={cn('font-heading text-base font-light tabular-nums', door.dark ? 'text-sanctuary-foreground/70' : 'text-secondary')}>{door.number}</span>
      <span aria-hidden="true" className={cn('h-px w-6 shrink-0', door.dark ? 'bg-sanctuary-foreground/30' : 'bg-border')} />
      <span className={door.dark ? 'text-sanctuary-foreground/85' : 'text-muted-foreground'}>{door.who}</span>
    </p>
  );
}

/** @param {any} props */
function QuickLinks({ door, className }) {
  return (
    <ul className={cn('flex flex-wrap gap-x-5 gap-y-2 text-sm', className)}>
      {door.links.map((l) => (
        <li key={l.route}>
          <DemoLink
            to={l.route}
            className={cn(
              'rounded-sm underline decoration-1 underline-offset-[6px] transition-colors',
              FOCUS,
              door.dark
                ? 'text-sanctuary-foreground/90 decoration-sanctuary-foreground/30 hover:text-sanctuary-foreground hover:decoration-sanctuary-foreground'
                : 'text-foreground decoration-border hover:text-primary hover:decoration-primary'
            )}
          >
            {l.label}
          </DemoLink>
        </li>
      ))}
    </ul>
  );
}

/** @param {any} props */
function HeroDoor({ door }) {
  const archTone = door.dark ? 'bg-sanctuary-foreground/10' : 'bg-muted';
  return (
    <div
      className={cn(
        'group relative flex flex-col px-5 py-6 sm:px-8 md:px-10 md:py-12 xl:px-16 xl:py-14',
        door.dark ? 'bg-sanctuary text-sanctuary-foreground' : 'bg-card text-foreground'
      )}
    >
      {/* Desktop: label on top, arch at the end of the same row */}
      <div className="hidden items-start justify-between gap-8 md:flex">
        <WhoLine door={door} className="pt-2" />
        <Arch
          src={door.image}
          contain={door.contain}
          eager
          className={cn('w-28 shrink-0 lg:w-32 xl:w-36', archTone)}
          imgClassName="group-hover:scale-[1.03]"
        />
      </div>

      {/* Mobile: title beside a small arch, so both doors fit above the fold */}
      <div className="flex items-end gap-4 md:mt-auto">
        <div className="min-w-0 flex-1">
          <WhoLine door={door} className="mb-3 md:hidden" />
          <h2 className="font-heading text-[2.1rem] font-light leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            {door.title}
          </h2>
          <p className={cn('mt-4 hidden max-w-md text-base leading-relaxed sm:block md:text-lg', door.dark ? 'text-sanctuary-foreground/80' : 'text-muted-foreground')}>
            {door.description}
          </p>
        </div>
        <Arch src={door.image} contain={door.contain} className={cn('w-[4.75rem] shrink-0 md:hidden', archTone)} />
      </div>

      <div className="mt-5 flex flex-col gap-4 md:mt-10 xl:flex-row xl:items-center xl:gap-8">
        <PillLink to={door.route} tone={door.dark ? 'onDark' : 'primary'} size="lg" className="w-full sm:w-auto md:h-16 md:px-10 md:text-lg">
          {door.cta}
          <ArrowLeft aria-hidden="true" />
        </PillLink>
        <QuickLinks door={door} />
      </div>
    </div>
  );
}

/** Full-height split hero: patient door first (right, in RTL), professional door dark. */
export function DoorsHero() {
  return (
    <section aria-label="בחירת אזור באתר" className="grid md:min-h-[calc(100svh-9.75rem)] md:grid-cols-2">
      {DOORS.map((door) => (
        <HeroDoor key={door.key} door={door} />
      ))}
    </section>
  );
}

/** The doors again, as two cards, before contact and at the end of pages. @param {any} props */
export function DoorsCompact({ title = 'לאן ממשיכים מכאן?', className }) {
  return (
    <section aria-label={title} className={cn(CONTAINER, 'py-14 md:py-24', className)}>
      <p className="mb-8 text-center font-heading text-2xl font-light text-foreground md:mb-12 md:text-4xl">{title}</p>
      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        {DOORS.map((door) => (
          <div
            key={door.key}
            className={cn(
              'group flex flex-col rounded-super p-6 sm:p-8 md:p-12',
              door.dark ? 'bg-sanctuary text-sanctuary-foreground' : 'border border-border bg-card text-foreground'
            )}
          >
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0">
                <WhoLine door={door} className="mb-4" />
                <h2 className="font-heading text-3xl font-light leading-tight tracking-tight md:text-5xl">{door.title}</h2>
                <p className={cn('mt-3 max-w-md leading-relaxed', door.dark ? 'text-sanctuary-foreground/80' : 'text-muted-foreground')}>{door.description}</p>
              </div>
              <Arch src={door.image} contain={door.contain} className={cn('hidden w-24 shrink-0 sm:block md:w-28', door.dark ? 'bg-sanctuary-foreground/10' : 'bg-muted')} />
            </div>
            <div className="mt-8 flex flex-col gap-4 md:mt-auto md:pt-10 lg:flex-row lg:items-center lg:gap-6">
              <PillLink to={door.route} tone={door.dark ? 'onDark' : 'primary'} size="lg" className="w-full sm:w-auto">
                {door.cta}
                <ArrowLeft aria-hidden="true" />
              </PillLink>
              <QuickLinks door={door} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
