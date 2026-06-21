import React, { createContext, useContext, useState, useEffect } from 'react';

export const PALETTES = [
  {
    id: 'current',
    label: 'עכשווי',
    background: '#FAF2EB',
    card: '#E4ECE9',
    primary: '#608A7B',
    primaryHover: '#4D7063',
    text: '#1A3336',
    secondary: '#3D5A5E',
    muted: '#C8D8D5',
    border: '#C8D8D5',
  },
  {
    id: 'warm-sand',
    label: 'חול חם',
    background: '#F6F1E8',
    card: '#EDE8DF',
    primary: '#8FA68E',
    primaryHover: '#7B927A',
    text: '#36413E',
    secondary: '#5A6B68',
    muted: '#E8E1D5',
    border: '#D8D0C4',
  },
  {
    id: 'terracotta',
    label: 'טרקוטה',
    background: '#FAF4EC',
    card: '#EEE8E0',
    primary: '#C9856D',
    primaryHover: '#B8745D',
    text: '#4A403A',
    secondary: '#7A6A62',
    muted: '#EAE0D4',
    border: '#D8CCBE',
  },
  {
    id: 'dusty-green',
    label: 'ירוק עמום',
    background: '#F9F5EE',
    card: '#EDEAE2',
    primary: '#6F8F7A',
    primaryHover: '#5C7A67',
    text: '#2F3630',
    secondary: '#506058',
    muted: '#E4DFD6',
    border: '#D0C8BC',
  },
  {
    id: 'slate-blue',
    label: 'כחול-אפור',
    background: '#EEF1F4',
    card: '#E3E9F0',
    primary: '#6B7F99',
    primaryHover: '#5A6E87',
    text: '#2E3A45',
    secondary: '#506070',
    muted: '#DCE3EB',
    border: '#C8D2DC',
  },
  {
    id: 'healing-teal',
    label: 'טיל ריפוי',
    background: '#F2EFE6',
    card: '#E6E0D2',
    primary: '#5E8B82',
    primaryHover: '#4E7A71',
    text: '#2C3A36',
    secondary: '#4E6560',
    muted: '#E0D8C8',
    border: '#CCC4B4',
  },
  {
    id: 'lavender',
    label: 'לבנדר',
    background: '#F3F0F4',
    card: '#E7E2EC',
    primary: '#8B82A6',
    primaryHover: '#786F94',
    text: '#38323F',
    secondary: '#625A70',
    muted: '#E0DAE8',
    border: '#CCC4D8',
  },
  {
    id: 'forest',
    label: 'יער',
    background: '#F4F1E9',
    card: '#E5E0D3',
    primary: '#5A7058',
    primaryHover: '#495E47',
    text: '#2B332A',
    secondary: '#4E5E4C',
    muted: '#DDD8CC',
    border: '#C8C0B0',
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
// Theme state is NOT persisted to localStorage — palette choice is intentionally session-only.
function applyPalette(palette) {
  const root = document.documentElement;
  root.style.setProperty('--background', hexToHsl(palette.background));
  root.style.setProperty('--foreground', hexToHsl(palette.text));
  root.style.setProperty('--card', hexToHsl(palette.card));
  root.style.setProperty('--card-foreground', hexToHsl(palette.secondary));
  root.style.setProperty('--primary', hexToHsl(palette.primary));
  root.style.setProperty('--primary-foreground', hexToHsl(palette.background));
  root.style.setProperty('--secondary', hexToHsl(palette.secondary));
  root.style.setProperty('--accent', hexToHsl(palette.primaryHover));
  root.style.setProperty('--accent-foreground', hexToHsl(palette.background));
  root.style.setProperty('--muted', hexToHsl(palette.muted));
  root.style.setProperty('--muted-foreground', hexToHsl(palette.secondary));
  root.style.setProperty('--border', hexToHsl(palette.border));
  root.style.setProperty('--input', hexToHsl(palette.border));
  root.style.setProperty('--ring', hexToHsl(palette.primary));
}

export function ThemeProvider({ children }) {
  const [paletteId, setPaletteId] = useState('current');
  const [textureId, setTextureId] = useState('none');

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