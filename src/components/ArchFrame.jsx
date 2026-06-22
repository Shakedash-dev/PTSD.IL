import React from 'react';

// Photo frame with a softly arched top (rounded-t-[50%]) and rounded bottom.
// Inspired by the Amble/Forma examples - more architectural than a plain card.
// Variants control the shape ratio. Accepts an `src` for the image; falls back
// to a gradient placeholder when no src is provided, so layouts can be built
// before photography arrives.
const SHAPE_CLASSES = {
  arch: 'rounded-t-[50%] rounded-b-3xl',
  pill: 'rounded-[50%]',                       // full ellipse
  capsule: 'rounded-[40%_40%_2rem_2rem]',      // gentler arch
  card: 'rounded-super',                        // rectangle with super-rounded corners
};

const ASPECT_CLASSES = {
  portrait: 'aspect-[3/4]',
  square: 'aspect-square',
  landscape: 'aspect-[4/3]',
  wide: 'aspect-[16/9]',
  tall: 'aspect-[2/3]',
};

export default function ArchFrame({
  src,
  alt = '',
  shape = 'arch',
  aspect = 'portrait',
  className = '',
  placeholderClass = 'bg-gradient-to-br from-primary/30 via-muted to-card',
}) {
  return (
    <div
      className={`overflow-hidden ${SHAPE_CLASSES[shape]} ${ASPECT_CLASSES[aspect]} ${className}`}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className={`w-full h-full ${placeholderClass}`} aria-hidden="true" />
      )}
    </div>
  );
}
