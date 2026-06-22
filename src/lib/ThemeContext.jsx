import React, { createContext, useContext, useState, useEffect } from 'react';

export const PALETTES = [
  // ─────────────────────────────────────────────────────────────────────────────
  // THEME 1 · Forest Canopy - Earth & Grounding
  //
  // Page canvas: pale sage (#EEF4ED) - cool, outdoor, canopy light
  // Cards:       warm parchment (#F6F2E7) - earth underfoot, grounded warmth
  // Primary:     muted moss green (#4A7A58) - organic, deep, stabilizing
  // Accent:      muted clay-terracotta (#A86E48) - warm contrast, not aggressive
  // Typography:  deep forest charcoal (#1E2E22) - soft on eyes, earthy root
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'forest-canopy',
    label: 'חופת יער',
    background: '#EEF4ED',
    card:       '#F6F2E7',
    primary:    '#4A7A58',
    primaryHover: '#3A6047',
    highlight:  '#A86E48',
    text:       '#1E2E22',
    secondary:  '#3C5842',
    muted:      '#E4DDD0',
    border:     '#BACFBA',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // THEME 2 · Twilight - Calm & Serene Reflection
  //
  // Page canvas: dusty blue-slate (#ECF0F7) - dusk sky, cool and receding
  // Cards:       muted lavender (#F2EFF9) - the hue shifts family entirely,
  //              creating depth without any harsh jump in brightness
  // Primary:     deep dusty slate-blue (#4A6888) - authoritative but not cold
  // Accent:      muted violet (#887AAA) - gentle purple whisper
  // Typography:  deep navy-charcoal (#1C2838) - low-strain, high legibility
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'twilight',
    label: 'דמדומים',
    background: '#ECF0F7',
    card:       '#F2EFF9',
    primary:    '#4A6888',
    primaryHover: '#3A5472',
    highlight:  '#887AAA',
    text:       '#1C2838',
    secondary:  '#485A72',
    muted:      '#D8E2F0',
    border:     '#BEC8DC',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // THEME 3 · Early Dawn - Warmth & Hopeful Comfort
  //
  // Page canvas: warm almond (#FAF4EC) - morning light on parchment, inviting
  // Cards:       soft blush-peach (#FFF4EE) - cards are a shade warmer and
  //              rosier, creating gentle depth without white-on-white flatness
  // Primary:     muted warm terracotta (#A86448) - earthy, human, not orange
  // Accent:      dusty rose (#B8788A) - community warmth, soft
  // Typography:  dark espresso (#2A1E18) - warm, not harsh, low reading strain
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'early-dawn',
    label: 'שחר מוקדם',
    background: '#FAF4EC',
    card:       '#FFF4EE',
    primary:    '#A86448',
    primaryHover: '#8A5038',
    highlight:  '#B8788A',
    text:       '#2A1E18',
    secondary:  '#5E4840',
    muted:      '#F0E5D8',
    border:     '#D8C8B5',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // THEME 4 · Lavender - soft monochromatic purple
  // Single-hue: all surfaces are purple-family tones, cards barely shift.
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'lavender',
    label: 'לבנדר',
    background: '#F5F0FA',
    card:       '#FDF8FF',
    primary:    '#8050B8',
    primaryHover: '#6840A0',
    highlight:  '#C4708A',
    text:       '#28183A',
    secondary:  '#5E4878',
    muted:      '#EAE5F2',
    border:     '#D0C0E0',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // THEME 5 · Sky & Ocean - light blue + deeper blue, no purple
  // Very pale sky-blue page, soft powder-blue cards.
  // Deeper ocean blue for interactive elements - all within the blue family.
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'sky-ocean',
    label: 'תכלת + כחול',
    background: '#EDF5FB',
    card:       '#DDEEF8',
    primary:    '#3A78A8',
    primaryHover: '#2C5F88',
    highlight:  '#6AAED4',
    text:       '#162538',
    secondary:  '#385878',
    muted:      '#D0E6F4',
    border:     '#AACCE0',
  },
];

export const TEXTURES = [
  { id: 'none', label: 'ללא' },
  { id: 'bubbles', label: 'בועות' },
  { id: 'micro', label: 'מיקרו' },
  { id: 'constellation', label: 'כוכבים' },
  { id: 'topography', label: 'טופוגרפיה' },
];

const ThemeContext = createContext(null);

function hexToHsl(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Overrides the CSS custom properties defined in index.css :root at runtime.
// Theme state is NOT persisted to localStorage - palette choice is intentionally session-only.
// highlight = complementary accent color used for badges/secondary buttons (separate from secondary which is text-only)
function applyPalette(palette) {
  const root = document.documentElement;
  root.style.setProperty('--background', hexToHsl(palette.background));
  root.style.setProperty('--foreground', hexToHsl(palette.text));
  root.style.setProperty('--card', hexToHsl(palette.card));
  root.style.setProperty('--card-foreground', hexToHsl(palette.secondary));
  root.style.setProperty('--primary', hexToHsl(palette.primary));
  root.style.setProperty('--primary-foreground', hexToHsl(palette.background));
  root.style.setProperty('--secondary', hexToHsl(palette.highlight || palette.primaryHover));
  root.style.setProperty('--secondary-foreground', hexToHsl(palette.background));
  root.style.setProperty('--accent', hexToHsl(palette.primaryHover));
  root.style.setProperty('--accent-foreground', hexToHsl(palette.background));
  root.style.setProperty('--muted', hexToHsl(palette.muted));
  root.style.setProperty('--muted-foreground', hexToHsl(palette.secondary));
  root.style.setProperty('--border', hexToHsl(palette.border));
  root.style.setProperty('--input', hexToHsl(palette.border));
  root.style.setProperty('--ring', hexToHsl(palette.primary));
}

export function ThemeProvider({ children }) {
  const [paletteId, setPaletteId] = useState('forest-canopy');
  const [textureId, setTextureId] = useState('constellation');

  const palette = PALETTES.find(p => p.id === paletteId) || PALETTES[0];

  useEffect(() => {
    applyPalette(palette);
  }, [paletteId]);

  return (
    <ThemeContext.Provider value={{ paletteId, setPaletteId, textureId, setTextureId, palette }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}