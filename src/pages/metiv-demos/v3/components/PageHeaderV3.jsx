import React from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { cn } from '@/lib/utils';
import { resolveRoute, trailFor, SHORT_VERSIONS } from '../meta';
import { ShortVersion, FOCUS } from './kit';

/**
 * Plain-language trail: "את/ה כאן: מטיב › למטופלים ולמשפחות › זכויות".
 * @param {{ onDark?: boolean }} props
 */
export function Trail({ onDark = false }) {
  const { pathname } = useLocation();
  const { key, params } = resolveRoute(pathname);
  const trail = trailFor(key, params);
  if (!trail.length) return null;
  return (
    <nav aria-label="את/ה כאן" className="mb-5">
      <ol className={cn('flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm', onDark ? 'text-sanctuary-foreground/85' : 'text-muted-foreground')}>
        <li className="font-medium">את/ה כאן:</li>
        {trail.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronLeft className="w-3.5 h-3.5 opacity-60" aria-hidden="true" />}
            {item.to ? (
              <DemoLink to={item.to} className={cn('underline-offset-4 hover:underline rounded-sm', FOCUS, onDark ? 'hover:text-sanctuary-foreground' : 'hover:text-foreground')}>
                {item.label}
              </DemoLink>
            ) : (
              <span aria-current="page" className={onDark ? 'text-sanctuary-foreground' : 'text-foreground'}>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

const TONES = {
  card: 'bg-card text-foreground border-b border-border',
  canvas: 'bg-background text-foreground',
  muted: 'bg-muted text-foreground',
  dark: 'bg-sanctuary text-sanctuary-foreground',
};

const TITLE = {
  default: 'text-3xl sm:text-4xl font-semibold',
  editorial: 'text-4xl sm:text-5xl font-medium',
  hero: 'text-4xl sm:text-6xl font-medium',
};

/**
 * V3 page header. Accepts the patterns/PageHeader contract, plus V3 extras:
 * `illustration` (hand-drawn art, shown whole), `short` (the "בקצרה" items,
 * defaults to the patient-kit entry for the current route) and `meta` (a row
 * under the subtitle).
 * @param {{
 *   title: React.ReactNode, subtitle?: React.ReactNode, eyebrow?: React.ReactNode, actions?: React.ReactNode,
 *   image?: string, imageOpacity?: number, size?: 'default'|'editorial'|'hero', align?: 'center'|'start',
 *   tone?: 'card'|'canvas'|'muted'|'dark', className?: string,
 *   illustration?: string, short?: React.ReactNode[], meta?: React.ReactNode,
 * }} props
 */
export default function PageHeaderV3({
  title,
  subtitle,
  eyebrow,
  actions,
  image,
  size = 'default',
  align = 'start',
  tone = 'muted',
  className = '',
  illustration,
  short,
  meta,
}) {
  const { pathname } = useLocation();
  const { key } = resolveRoute(pathname);
  const shortItems = short ?? (key ? SHORT_VERSIONS[key] : undefined);
  const onDark = tone === 'dark';
  const art = illustration || image;
  const centered = align === 'center' && !art;

  return (
    <header className={cn('relative overflow-hidden', TONES[tone] || TONES.muted, className)}>
      {/* soft decorative shapes */}
      <span aria-hidden="true" className={cn('pointer-events-none absolute -top-24 -end-24 w-80 h-80 rounded-full', onDark ? 'bg-primary/20' : 'bg-primary/10')} />
      <span aria-hidden="true" className={cn('pointer-events-none absolute -bottom-32 start-1/3 w-72 h-72 rounded-full', onDark ? 'bg-secondary/10' : 'bg-secondary/10')} />

      <div className={cn('relative max-w-6xl mx-auto px-5 sm:px-8', size === 'hero' ? 'pt-8 pb-14 sm:pb-20' : 'pt-7 pb-10 sm:pb-14')}>
        <Trail onDark={onDark} />
        <div className={cn('grid gap-8 items-center', art && 'md:grid-cols-[minmax(0,1fr)_13rem] lg:grid-cols-[minmax(0,1fr)_17rem]')}>
          <div className={cn('min-w-0', centered ? 'text-center mx-auto max-w-3xl' : 'max-w-3xl')}>
            {eyebrow && (
              <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold mb-4', onDark ? 'bg-sanctuary-foreground/10 text-sanctuary-foreground' : 'bg-card text-accent border border-border')}>
                {eyebrow}
              </span>
            )}
            <h1 className={cn('font-heading leading-[1.15] tracking-tight', TITLE[size] || TITLE.default)}>{title}</h1>
            {subtitle && (
              <p className={cn('mt-4 text-lg sm:text-xl leading-relaxed', centered && 'mx-auto', onDark ? 'text-sanctuary-foreground/85' : 'text-muted-foreground')}>
                {subtitle}
              </p>
            )}
            {meta && <div className="mt-4">{meta}</div>}
            {actions && <div className={cn('mt-6 flex flex-wrap gap-3', centered && 'justify-center')}>{actions}</div>}
          </div>
          {art && (
            <div className="hidden md:block" aria-hidden="true">
              {illustration ? (
                <div className={cn('rounded-full aspect-square flex items-end justify-center overflow-hidden', onDark ? 'bg-sanctuary-foreground/10' : 'bg-card')}>
                  <img src={illustration} alt="" className="h-[90%] w-auto object-contain" />
                </div>
              ) : (
                <img src={image} alt="" className="w-full aspect-[4/3] object-cover rounded-super shadow-card rotate-1" />
              )}
            </div>
          )}
        </div>
        {shortItems?.length > 0 && <ShortVersion items={shortItems} className={cn('mt-8 max-w-3xl', centered && 'mx-auto')} />}
      </div>
    </header>
  );
}
