import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import SectionBlock from '@/components/SectionBlock';
import ArchFrame from '@/components/ArchFrame';
import { useImages } from '@/lib/ImageSetContext';

// breathing = sky, grounding = earth, muscle = hands.
// imageKey is resolved against the active image set at render time.
// All three tiles use the same shape so the row reads as one cohesive set.
const EXERCISES_META = [
  {
    key: 'breathing',
    path: '/calming/breathing',
    imageKey: 'calming_breathing',
    placeholder: 'bg-gradient-to-br from-primary/30 via-card to-muted',
  },
  {
    key: 'grounding',
    path: '/calming/grounding',
    imageKey: 'calming_grounding',
    placeholder: 'bg-gradient-to-br from-secondary/30 via-muted to-primary/15',
  },
  {
    key: 'muscle',
    path: '/calming/muscle',
    imageKey: 'calming_muscle',
    placeholder: 'bg-gradient-to-br from-clay/25 via-oatmeal/30 to-card',
  },
];

const TILE_SHAPE = 'arch';

export default function Calming() {
  const { lang } = useLang();
  const IMAGES = useImages();
  const exercises = EXERCISES_META.map(e => ({ ...e, image: IMAGES[e.imageKey] }));

  return (
    <div className="min-h-screen bg-background">
      {/* Sanctuary hero - quiet nature background, low opacity */}
      <section className="relative bg-sanctuary text-sanctuary-foreground overflow-hidden">
        <img
          src={IMAGES.calming_main}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-25"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-sanctuary/55 via-sanctuary/70 to-sanctuary" aria-hidden="true" />
        <div className="relative max-w-5xl mx-auto px-5 sm:px-6 pt-32 pb-20 sm:pt-40 sm:pb-24 text-center">
          <h1 className="font-heading font-light text-5xl sm:text-6xl lg:text-7xl leading-[1.0] tracking-tight mb-6">
            {t(lang, 'calming_title')}
          </h1>
          <p className="font-body text-lg sm:text-xl opacity-85 max-w-md mx-auto leading-relaxed">
            {t(lang, 'calming_subtitle')}
          </p>
        </div>
      </section>

      {/* Exercise tiles - image-first cards */}
      <SectionBlock variant="canvas" maxWidth="wide" padding="py-16 sm:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-10">
          {exercises.map((ex) => (
            <Link key={ex.key} to={ex.path} className="group block">
              <ArchFrame
                src={ex.image}
                alt={t(lang, `${ex.key}_title`)}
                shape={TILE_SHAPE}
                aspect="portrait"
                placeholderClass={ex.placeholder}
                className="mb-5 shadow-card group-hover:shadow-card-hover transition-all duration-500 group-hover:-translate-y-1"
              />
              <div className="px-2 text-center">
                <h2 className="font-heading font-semibold text-2xl text-foreground mb-2 leading-snug">
                  {t(lang, `${ex.key}_title`)}
                </h2>
                <p className="font-body text-card-foreground leading-relaxed">
                  {t(lang, `${ex.key}_subtitle`)}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 text-center">
          <a
            href="tel:1201"
            className="inline-block text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
          >
            {t(lang, 'eran_link')} - 1201
          </a>
        </div>
      </SectionBlock>
    </div>
  );
}