import React from 'react';
import { useLocation } from 'react-router-dom';
import { LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { cn } from '@/lib/utils';
import { FOCUS_DARK, FOCUS_LIGHT, stripBase } from '../lib';
import { BOTTOM_NAV } from './nav';
import { Icon } from './ui';
import { useHelp } from './HelpSheet';

/** Mobile bottom bar (NHS App pattern): 4 area links + "עזרה עכשיו". @param {{ area: import('../lib').Area }} props */
export default function BottomNav({ area }) {
  const location = useLocation();
  const path = stripBase(location.pathname);
  const { openHelp } = useHelp();
  const dark = area === 'pro';
  const items = BOTTOM_NAV[area];

  const isActive = (route) => {
    if (route === ROUTES.home) return path === '/';
    if (route === ROUTES.patient || route === ROUTES.therapist) return path === route;
    return path === route || path.startsWith(`${route}/`);
  };

  const item = 'flex flex-col items-center justify-center gap-0.5 h-full w-full rounded-2xl text-[0.7rem] font-medium leading-tight transition-colors duration-200';

  return (
    <nav
      aria-label="ניווט תחתון"
      className={cn(
        'lg:hidden fixed bottom-0 inset-x-0 z-40 border-t pb-[env(safe-area-inset-bottom)]',
        dark ? 'bg-sanctuary text-sanctuary-foreground border-sanctuary-foreground/15' : 'bg-card text-foreground border-border shadow-atmospheric-lg'
      )}
    >
      <ul className="grid grid-cols-5 h-16 px-1.5 py-1.5 gap-1">
        {items.map((it) => {
          const active = isActive(it.route);
          return (
            <li key={it.key}>
              <DemoLink
                to={it.route}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  item,
                  dark
                    ? cn(active ? 'bg-sanctuary-foreground/15 font-semibold' : 'text-sanctuary-foreground/80', FOCUS_DARK)
                    : cn(active ? 'bg-primary/10 font-semibold text-foreground' : 'text-card-foreground', FOCUS_LIGHT)
                )}
              >
                <Icon name={it.icon} className="w-5 h-5" />
                {it.label}
              </DemoLink>
            </li>
          );
        })}
        <li>
          <Button
            type="button"
            size="none"
            radius="xl"
            onClick={openHelp}
            variant={dark ? 'pill-light' : 'solid'}
            className={cn(item, 'shadow-none font-semibold [&_svg]:size-5', dark ? FOCUS_DARK : FOCUS_LIGHT)}
          >
            <LifeBuoy aria-hidden="true" />
            עזרה עכשיו
          </Button>
        </li>
      </ul>
    </nav>
  );
}
