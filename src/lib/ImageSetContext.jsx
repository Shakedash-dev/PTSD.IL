import React, { createContext, useContext, useState, useEffect } from 'react';
import { IMAGE_SETS, IMAGE_SET_IDS, TREATMENT_STEP_IMAGES_BY_SET } from '@/lib/images';

const STORAGE_KEY = 'ptsd_il_image_set';
const DEFAULT_SET = 'set1';

const ImageSetContext = createContext(null);

function readInitial() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && IMAGE_SET_IDS.includes(stored)) return stored;
  } catch (_e) {
    // localStorage may be unavailable (private mode, SSR) - fall through.
  }
  return DEFAULT_SET;
}

export function ImageSetProvider({ children }) {
  const [setId, setSetIdState] = useState(readInitial);

  // Persist on change so the user's chosen set survives a refresh.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, setId);
    } catch (_e) {
      // ignore - persistence is best-effort
    }
  }, [setId]);

  function setSetId(next) {
    if (IMAGE_SET_IDS.includes(next)) setSetIdState(next);
  }

  return (
    <ImageSetContext.Provider value={{ setId, setSetId, availableSets: IMAGE_SET_IDS }}>
      {children}
    </ImageSetContext.Provider>
  );
}

export function useImageSet() {
  const ctx = useContext(ImageSetContext);
  if (!ctx) throw new Error('useImageSet must be used within ImageSetProvider');
  return ctx;
}

// Convenience hook: returns the active image map directly.
// Pages call `const IMAGES = useImages();` then use as before.
export function useImages() {
  const { setId } = useImageSet();
  return IMAGE_SETS[setId];
}

export function useTreatmentImages() {
  const { setId } = useImageSet();
  return TREATMENT_STEP_IMAGES_BY_SET[setId];
}
