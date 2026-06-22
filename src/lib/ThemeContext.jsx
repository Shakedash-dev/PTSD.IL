import React, { createContext, useContext, useState, useEffect } from 'react';

export const PALETTES = [
  // ─────────────────────────────────────────────────────────────────────────────
  // THEME 1 · Forest Canopy - Earth & Grounding
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'forest-canopy',
    label: 'ירוק',
    background: '#DCF2E6',
    card:       '#F0FAF5',
    primary:    '#2E7A48',
    primaryHover: '#206040',
    highlight:  '#A86E48',
    text:       '#1E2E22',
    secondary:  '#3C5842',
    muted:      '#BEE0CE',
    border:     '#8EC4A4',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // THEME 2 · Lavender - soft purple
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'lavender',
    label: 'סגול',
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
  // sanctuary = deepest palette color (text), used as background for dark hero blocks
  root.style.setProperty('--sanctuary', hexToHsl(palette.text));
  root.style.setProperty('--sanctuary-foreground', hexToHsl(palette.background));
}

export function ThemeProvider({ children }) {
  const [paletteId, setPaletteId] = useState('forest-canopy');

  const palette = PALETTES.find(p => p.id === paletteId) || PALETTES[0];

  useEffect(() => {
    applyPalette(palette);
  }, [paletteId]);

  return (
    <ThemeContext.Provider value={{ paletteId, setPaletteId, palette }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}