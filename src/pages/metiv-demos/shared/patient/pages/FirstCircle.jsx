import React from 'react';
import ArchFrame from '@/components/patterns/ArchFrame';
import { IMAGES, FIRST_CIRCLE_ILLUSTRATIONS } from '@/lib/images';
import { DemoLink, useDemoChrome } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { tx } from '../copy';

const sections = [
  { key: 'ptsd_info', path: ROUTES.ptsdInfo },
  { key: 'self_help', path: ROUTES.selfHelp },
  { key: 'rights', path: ROUTES.rights },
  { key: 'treatment', path: ROUTES.treatment },
  { key: 'community', path: ROUTES.community },
  { key: 'children_content', path: ROUTES.children },
];

export default function FirstCircle() {
  const { PageHeader } = useDemoChrome();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        size="editorial"
        align="center"
        tone="dark"
        image={IMAGES.firstcircle_hero}
        title={tx('path1_title')}
        subtitle={tx('first_circle_welcome')}
      />

      {/* Illustration-first grid, no subtext - one glance per section is the goal. */}
      <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-20">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 md:gap-10">
          {sections.map((section) => (
            <DemoLink key={section.key} to={section.path} className="group block text-center">
              <ArchFrame
                src={FIRST_CIRCLE_ILLUSTRATIONS[section.key]}
                alt={tx(section.key)}
                aspect="portrait"
                objectFit="contain"
                className="mb-4 bg-muted shadow-card group-hover:shadow-card-hover transition-all duration-500 group-hover:-translate-y-1"
              />
              <h3 className="font-heading font-semibold text-base sm:text-lg text-foreground">
                {tx(section.key)}
              </h3>
            </DemoLink>
          ))}
        </div>
      </div>
    </div>
  );
}
