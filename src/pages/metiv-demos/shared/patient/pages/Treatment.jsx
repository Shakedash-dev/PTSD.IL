import React, { useState } from 'react';
import { Wrench, Building2, Brain, Leaf, Pill, ExternalLink, ChevronDown, MapPin, ArrowLeft } from 'lucide-react';
import ArchFrame from '@/components/patterns/ArchFrame';
import Disclosure from '@/components/patterns/Disclosure';
import { TREATMENT_STEP_IMAGES } from '@/lib/images';
import { DemoLink, useDemoChrome } from '@/pages/metiv-demos/shared/DemoChrome';
import { tx } from '../copy';
import { getTreatmentSteps } from '../staticData';
import { KitMarkdown, SmartLink } from '../components';
import { TREATMENT_WHERE_BLOCK } from '../additions';

const STEP_ICON_MAP = { Wrench, Building2, Brain, Leaf, Pill };

// One collapsible method within a step's method list (steps 3 & 4, which offer
// several treatment options). Closed by default so a step with many options
// doesn't dump all their "how to start" text on screen at once.
function MethodAccordion({ method }) {
  return (
    <Disclosure
      label={method.title_he}
      variant="plain"
      size="tight"
      labelClassName="text-sm leading-normal"
      chevronClassName="w-4 h-4"
      panelClassName="pb-4 space-y-3"
    >
      <>
        <p className="text-sm text-muted-foreground leading-relaxed">{method.description_he}</p>
        {method.how_to_start_he && (
          <div className="bg-primary/5 rounded-lg p-3">
            <KitMarkdown className="text-sm text-foreground leading-relaxed rich-content">
              {method.how_to_start_he}
            </KitMarkdown>
          </div>
        )}
        {method.links?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {method.links.map((link, i) => (
              <SmartLink
                key={i}
                href={link.url}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-foreground rounded-full text-xs font-medium hover:bg-primary/20 transition-colors duration-300"
              >
                {link.label}
                {!link.url.startsWith('/') && <ExternalLink className="w-3 h-3" />}
              </SmartLink>
            ))}
          </div>
        )}
      </>
    </Disclosure>
  );
}

// Per-step waypoint X coordinate in SVG viewBox space (0..1000).
// Alternates side: step 1 right, 2 left, 3 right... giving the trail a swirl/zig-zag
// rather than a straight vertical line.
const SIDE_X_RIGHT = 820;
const SIDE_X_LEFT = 180;

function waypointX(index) {
  return index % 2 === 0 ? SIDE_X_RIGHT : SIDE_X_LEFT;
}
function isRightSide(index) {
  return index % 2 === 0;
}

// Per-step background tint for the photo placeholder.
const STEP_TINTS = [
  'bg-gradient-to-br from-primary/30 via-muted to-card',
  'bg-gradient-to-br from-secondary/30 via-muted to-card',
  'bg-gradient-to-br from-accent/30 via-primary/15 to-muted',
  'bg-gradient-to-br from-primary/20 via-muted/40 to-card',
  'bg-gradient-to-br from-secondary/25 via-muted/30 to-muted',
];

// Builds an SVG path that snakes between the waypoints with smooth bezier curves.
function buildTrailPath(stepCount, stepHeightSvg) {
  const segments = [];
  const firstX = waypointX(0);
  segments.push(`M ${firstX} 0`);

  for (let i = 0; i < stepCount; i++) {
    const x = waypointX(i);
    const yMid = i * stepHeightSvg + stepHeightSvg / 2;

    if (i === 0) {
      segments.push(`L ${x} ${yMid}`);
    }

    if (i < stepCount - 1) {
      const nextX = waypointX(i + 1);
      const yNextMid = (i + 1) * stepHeightSvg + stepHeightSvg / 2;
      const c1y = yMid + (yNextMid - yMid) * 0.45;
      const c2y = yMid + (yNextMid - yMid) * 0.55;
      segments.push(`C ${x} ${c1y}, ${nextX} ${c2y}, ${nextX} ${yNextMid}`);
    }
  }
  return segments.join(' ');
}

function StepView({ step, index, total, stepImages }) {
  const Icon = STEP_ICON_MAP[step.icon];
  const onRight = isRightSide(index);

  return (
    <section id={`step-${index + 1}`} className="w-full relative" data-step={index + 1}>
      <div className="max-w-6xl w-full mx-auto px-5 sm:px-8 lg:px-12 py-16 sm:py-24">
        <div className={`flex ${onRight ? 'justify-end' : 'justify-start'}`}>
          <div className="w-full max-w-md lg:max-w-lg">
            <ArchFrame
              src={stepImages[index]}
              alt={step.title_he}
              shape={index % 3 === 0 ? 'arch' : index % 3 === 1 ? 'capsule' : 'card'}
              aspect="landscape"
              placeholderClass={STEP_TINTS[index % STEP_TINTS.length]}
              className="mb-6 bg-muted shadow-card"
            />

            <div className="bg-card/95 backdrop-blur-sm border border-border rounded-super shadow-card-hover p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                  {Icon && <Icon className="w-5 h-5" />}
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary block leading-tight">
                    {tx('step_label')} {step.step_number} / {total}
                  </span>
                  <h2 className="font-heading font-semibold text-xl sm:text-2xl text-foreground leading-tight">
                    {step.title_he}
                  </h2>
                </div>
              </div>

              <p className="font-body text-card-foreground leading-relaxed mb-5">
                {step.description_he}
              </p>

              {step.methods?.length > 0 ? (
                <div className="space-y-2 mb-5">
                  {step.methods.map((method, i) => (
                    <MethodAccordion key={i} method={method} />
                  ))}
                </div>
              ) : (
                <div className="bg-muted/60 rounded-2xl p-4 mb-5">
                  <p className="text-xs font-semibold text-primary uppercase tracking-[0.15em] mb-2">
                    {tx('how_to_start')}
                  </p>
                  <KitMarkdown className="text-sm text-foreground leading-relaxed rich-content">
                    {step.how_to_start_he}
                  </KitMarkdown>
                </div>
              )}

              {step.links?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {step.links.map((link, i) => (
                    <SmartLink
                      key={i}
                      href={link.url}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-foreground rounded-full text-sm font-medium hover:bg-primary/20 transition-colors duration-300"
                    >
                      {link.label}
                      {!link.url.startsWith('/') && <ExternalLink className="w-3 h-3" />}
                    </SmartLink>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Waypoint markers as absolutely-positioned HTML circles. Done in HTML (not SVG)
// because the parent SVG uses preserveAspectRatio="none", which would turn SVG
// circles into ellipses. The inline left/top percentages are trail geometry
// shared with the SVG, not reading direction.
function TrailMarkers({ stepCount }) {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {Array.from({ length: stepCount }).map((_, i) => {
        const leftPct = waypointX(i) / 10;
        const topPct = ((i + 0.5) / stepCount) * 100;
        return (
          <div
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-card border-[3px] border-primary flex items-center justify-center shadow-card"
            style={{ left: `${leftPct}%`, top: `${topPct}%` }}
          >
            <span className="font-heading font-semibold text-primary text-2xl sm:text-3xl">
              {i + 1}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function Treatment() {
  const { PageHeader } = useDemoChrome();
  const stepImages = TREATMENT_STEP_IMAGES;
  const steps = getTreatmentSteps();
  const [hovered, setHovered] = useState(false);

  const stepHeightSvg = 1000;
  const totalSvgHeight = (steps.length || 1) * stepHeightSvg;
  const trailPath = steps.length ? buildTrailPath(steps.length, stepHeightSvg) : '';

  return (
    <div className="bg-background">
      <PageHeader
        size="hero"
        align="center"
        tone="dark"
        eyebrow={tx('treatment')}
        title={tx('treatment_title')}
        subtitle={tx('treatment_subtitle')}
        actions={
          <a
            href="#step-1"
            aria-label="גלילה לשלב הראשון"
            className="opacity-70 hover:opacity-100 transition-opacity p-3 -m-3"
          >
            <ChevronDown className="w-7 h-7 animate-bounce" />
          </a>
        }
      />

      {steps.length > 0 && (
        <div
          className="relative"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <svg
            viewBox={`0 0 1000 ${totalSvgHeight}`}
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full text-primary pointer-events-none"
            aria-hidden="true"
          >
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

          {steps.map((step, i) => (
            <StepView key={i} step={step} index={i} total={steps.length} stepImages={stepImages} />
          ))}
        </div>
      )}

      {/* Metiv addition 8b: where treatment is available */}
      <div className="max-w-3xl mx-auto px-5 sm:px-6 pb-20">
        <section className="bg-card border border-border rounded-super shadow-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h2 className="font-heading font-semibold text-xl text-foreground mb-1">{TREATMENT_WHERE_BLOCK.title}</h2>
            <p className="text-card-foreground leading-relaxed">{TREATMENT_WHERE_BLOCK.text}</p>
          </div>
          <DemoLink
            to={TREATMENT_WHERE_BLOCK.route}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-accent transition-natural flex-shrink-0 inline-flex items-center gap-1"
          >
            {TREATMENT_WHERE_BLOCK.linkLabel}
            <ArrowLeft className="w-4 h-4" />
          </DemoLink>
        </section>
      </div>
    </div>
  );
}
