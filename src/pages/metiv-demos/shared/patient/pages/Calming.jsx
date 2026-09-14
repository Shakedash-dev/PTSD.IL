import React from 'react';
import SectionBlock from '@/components/patterns/SectionBlock';
import ArchFrame from '@/components/patterns/ArchFrame';
import { IMAGES } from '@/lib/images';
import { DemoLink, useDemoChrome } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { tx } from '../copy';

// breathing = sky, grounding = earth, muscle = hands.
// All three tiles use the same shape so the row reads as one cohesive set.
const EXERCISES_META = [
  {
    key: 'breathing',
    path: ROUTES.calmingBreathing,
    imageKey: 'calming_breathing',
    placeholder: 'bg-gradient-to-br from-primary/30 via-card to-muted',
  },
  {
    key: 'grounding',
    path: ROUTES.calmingGrounding,
    imageKey: 'calming_grounding',
    placeholder: 'bg-gradient-to-br from-secondary/30 via-muted to-primary/15',
  },
  {
    key: 'muscle',
    path: ROUTES.calmingMuscle,
    imageKey: 'calming_muscle',
    placeholder: 'bg-gradient-to-br from-secondary/20 via-muted/30 to-card',
  },
];

const TILE_SHAPE = 'arch';

export default function Calming() {
  const { PageHeader } = useDemoChrome();
  const exercises = EXERCISES_META.map(e => ({ ...e, image: IMAGES[e.imageKey] }));

  return (
    <div className="min-h-screen bg-background">
      {/* Sanctuary hero - quiet nature background, low opacity */}
      <PageHeader
        size="hero"
        align="center"
        tone="dark"
        image={IMAGES.calming_main}
        imageOpacity={0.25}
        title={tx('calming_title')}
        subtitle={tx('calming_subtitle')}
      />

      {/* Exercise tiles - image-first cards */}
      <SectionBlock variant="canvas" maxWidth="wide" padding="py-16 sm:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-10">
          {exercises.map((ex) => (
            <DemoLink key={ex.key} to={ex.path} className="group block">
              <ArchFrame
                src={ex.image}
                alt={tx(`${ex.key}_title`)}
                shape={TILE_SHAPE}
                aspect="portrait"
                placeholderClass={ex.placeholder}
                className="mb-5 shadow-card group-hover:shadow-card-hover transition-all duration-500 group-hover:-translate-y-1"
              />
              <div className="px-2 text-center">
                <h2 className="font-heading font-semibold text-2xl text-foreground mb-2 leading-snug">
                  {tx(`${ex.key}_title`)}
                </h2>
                <p className="font-body text-card-foreground leading-relaxed">
                  {tx(`${ex.key}_subtitle`)}
                </p>
              </div>
            </DemoLink>
          ))}
        </div>

        <div className="mt-16 text-center">
          <a
            href="tel:1201"
            className="inline-block text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
          >
            {tx('eran_link')} - 1201
          </a>
        </div>
      </SectionBlock>
    </div>
  );
}
