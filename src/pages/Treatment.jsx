import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { useTreatmentSteps } from '@/api/hooks';
import { Wrench, Building2, Brain, Leaf, Pill, ExternalLink, ChevronDown } from 'lucide-react';
import ArchFrame from '@/components/ArchFrame';
import { TREATMENT_STEP_IMAGES } from '@/lib/images';
import ValidatableContent from '@/components/ValidatableContent';

const STEP_ICON_MAP = { Wrench, Building2, Brain, Leaf, Pill };

// Per-step waypoint X coordinate in SVG viewBox space (0..1000).
// Alternates side: step 1 right, 2 left, 3 right... giving the trail a swirl/zig-zag
// rather than a straight vertical line. This is the "map feel" the brief asked for.
const SIDE_X_RIGHT = 820;
const SIDE_X_LEFT = 180;

function waypointX(index) {
  return index % 2 === 0 ? SIDE_X_RIGHT : SIDE_X_LEFT;
}
function isRightSide(index) {
  return index % 2 === 0;
}

// Per-step background tint for the photo placeholder, so each step looks
// distinct before real images arrive.
const STEP_TINTS = [
  'bg-gradient-to-br from-primary/30 via-muted to-card',           // 1 self-help
  'bg-gradient-to-br from-secondary/30 via-muted to-card',         // 2 healthcare
  'bg-gradient-to-br from-accent/30 via-primary/15 to-muted',      // 3 trauma therapy
  'bg-gradient-to-br from-sage/35 via-oatmeal/20 to-card',         // 4 mind-body
  'bg-gradient-to-br from-clay/30 via-oatmeal/30 to-muted',        // 5 medication
];

// Builds an SVG path that snakes between the 5 waypoints with smooth bezier curves.
// Each segment uses control points that "stay" in the current lane for half the
// distance before pulling over to the next, producing a soft S-shape per leg.
function buildTrailPath(stepCount, stepHeightSvg) {
  const segments = [];
  // Start above the first waypoint so the trail visually "enters" from the hero.
  const firstX = waypointX(0);
  segments.push(`M ${firstX} 0`);

  for (let i = 0; i < stepCount; i++) {
    const x = waypointX(i);
    const yMid = i * stepHeightSvg + stepHeightSvg / 2;

    if (i === 0) {
      // straight down into first waypoint
      segments.push(`L ${x} ${yMid}`);
    }

    if (i < stepCount - 1) {
      const nextX = waypointX(i + 1);
      const yNextMid = (i + 1) * stepHeightSvg + stepHeightSvg / 2;
      // control points: hold current lane until ~midway between waypoints,
      // then swing to next lane just before arriving.
      const c1y = yMid + (yNextMid - yMid) * 0.45;
      const c2y = yMid + (yNextMid - yMid) * 0.55;
      segments.push(`C ${x} ${c1y}, ${nextX} ${c2y}, ${nextX} ${yNextMid}`);
    }
  }
  return segments.join(' ');
}

function StepView({ step, index, total, lang, stepImages }) {
  const Icon = STEP_ICON_MAP[step.icon];
  const onRight = isRightSide(index);

  return (
    <section
      id={`step-${index + 1}`}
      className="w-full relative"
      data-step={index + 1}
    >
      <div className="max-w-6xl w-full mx-auto px-5 sm:px-8 lg:px-12 py-16 sm:py-24">
        <div className={`flex ${onRight ? 'justify-end' : 'justify-start'}`}>
          <div className="w-full max-w-md lg:max-w-lg">
            {/* Per-step image. Falls back to gradient placeholder if undefined. */}
            <ArchFrame
              src={stepImages[index]}
              alt={step.title_he}
              shape={index % 3 === 0 ? 'arch' : index % 3 === 1 ? 'capsule' : 'card'}
              aspect="landscape"
              placeholderClass={STEP_TINTS[index % STEP_TINTS.length]}
              className="mb-6 shadow-card"
            />

            <ValidatableContent contentId={`treatment.step.${index}`} label={step.title_he}>
            <div className="bg-card/95 backdrop-blur-sm border border-border rounded-super shadow-card-hover p-6 sm:p-8">
              {/* Step number + icon row */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                  {Icon && <Icon className="w-5 h-5" />}
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary block leading-tight">
                    {t(lang, 'step_label')} {step.step_number} / {total}
                  </span>
                  <h2 className="font-heading font-semibold text-xl sm:text-2xl text-foreground leading-tight">
                    {step.title_he}
                  </h2>
                </div>
              </div>

              <p className="font-body text-card-foreground leading-relaxed mb-5">
                {step.description_he}
              </p>

              <div className="bg-muted/60 rounded-2xl p-4 mb-5">
                <p className="text-xs font-bold text-primary uppercase tracking-[0.15em] mb-2">
                  {t(lang, 'how_to_start')}
                </p>
                <div
                  className="text-sm text-foreground leading-relaxed rich-content"
                  dangerouslySetInnerHTML={{ __html: step.how_to_start_he }}
                />
              </div>

              {step.links?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {step.links.map((link, i) =>
                    link.url.startsWith('/') ? (
                      <Link
                        key={i}
                        to={link.url}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-foreground rounded-full text-sm font-medium hover:bg-primary/20 transition-colors duration-300"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-foreground rounded-full text-sm font-medium hover:bg-primary/20 transition-colors duration-300"
                      >
                        {link.label}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )
                  )}
                </div>
              )}
            </div>
            </ValidatableContent>
          </div>
        </div>
      </div>
    </section>
  );
}

// Waypoint markers as absolutely-positioned HTML circles. Done in HTML (not SVG)
// because the parent SVG uses preserveAspectRatio="none" which stretches the viewBox
// aspect to match the container - that turns SVG circles into ellipses.
// HTML divs with percentage offsets stay perfectly circular regardless of viewport size.
function TrailMarkers({ stepCount }) {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {Array.from({ length: stepCount }).map((_, i) => {
        // x as percent of width (waypointX is 0..1000, so /10 -> 0..100)
        const leftPct = waypointX(i) / 10;
        // y as percent of total height: each step takes 1/stepCount of vertical space,
        // waypoint sits at midpoint.
        const topPct = ((i + 0.5) / stepCount) * 100;
        return (
          <div
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-card border-[3px] border-primary flex items-center justify-center shadow-card"
            style={{ left: `${leftPct}%`, top: `${topPct}%` }}
          >
            <span className="font-heading font-bold text-primary text-2xl sm:text-3xl">
              {i + 1}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function Treatment() {
  const { lang } = useLang();
  const stepImages = TREATMENT_STEP_IMAGES;
  const { data: steps = [], isLoading, error } = useTreatmentSteps();
  const [hovered, setHovered] = useState(false);

  const stepHeightSvg = 1000; // SVG units per step
  const totalSvgHeight = (steps.length || 1) * stepHeightSvg;
  const trailPath = steps.length ? buildTrailPath(steps.length, stepHeightSvg) : '';

  return (
    <div className="bg-background">
      {/* ── Hero ── */}
      <section className="min-h-[calc(100vh-4rem)] w-full bg-sanctuary text-sanctuary-foreground flex flex-col items-center justify-center px-5 py-24 relative">
        <ValidatableContent contentId="treatment.hero" label="כותרת דף טיפולים">
        <div className="max-w-3xl mx-auto text-center">
          <span className="font-heading font-bold text-sm tracking-[0.2em] opacity-70 mb-6 block">
            {t(lang, 'treatment')}
          </span>
          <h1 className="font-heading font-light text-5xl sm:text-7xl lg:text-8xl leading-[1.0] tracking-tight mb-8">
            {t(lang, 'treatment_title')}
          </h1>
          <p className="font-body text-lg sm:text-xl opacity-85 max-w-xl mx-auto leading-relaxed">
            {t(lang, 'treatment_subtitle')}
          </p>
        </div>
        </ValidatableContent>

        {/* Clickable scroll indicator → first step */}
        <a
          href="#step-1"
          aria-label="Scroll to first step"
          className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-70 hover:opacity-100 transition-opacity p-3 -m-3"
        >
          <ChevronDown className="w-7 h-7 animate-bounce" />
        </a>
      </section>

      {/* ── Map: steps with swirl trail ── */}
      {isLoading && (
        <p className="text-center text-muted-foreground py-12">{t(lang, 'loading')}</p>
      )}
      {error && (
        <p className="text-center text-muted-foreground py-12">{t(lang, 'content_error')}</p>
      )}

      {steps.length > 0 && (
        <div
          className="relative"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* SVG trail: positioned absolute, full size of the steps container,
              viewBox stretches with preserveAspectRatio="none" so it spans every step. */}
          <svg
            viewBox={`0 0 1000 ${totalSvgHeight}`}
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full text-primary pointer-events-none"
            aria-hidden="true"
          >
            {/* Soft underlay for the trail */}
            <path
              d={trailPath}
              fill="none"
              stroke="currentColor"
              strokeWidth="20"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              opacity="0.12"
            />
            {/* Main trail */}
            <path
              d={trailPath}
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="8 12"
              vectorEffect="non-scaling-stroke"
              opacity={hovered ? 0.85 : 0.6}
              style={{ transition: 'opacity 400ms ease' }}
            />
          </svg>

          <TrailMarkers stepCount={steps.length} />

          {/* Steps stacked */}
          {steps.map((step, i) => (
            <StepView key={i} step={step} index={i} total={steps.length} lang={lang} stepImages={stepImages} />
          ))}
        </div>
      )}
    </div>
  );
}
