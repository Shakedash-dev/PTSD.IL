import React, { useState, useRef, useEffect } from 'react';
import { Palette } from 'lucide-react';
import { useTheme, PALETTES } from '@/lib/ThemeContext';

export default function ThemePicker() {
  const { paletteId, setPaletteId } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors duration-300 ${open ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        aria-label="בחר פלטת צבעים"
      >
        <Palette className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 z-50 bg-card border border-border rounded-xl shadow-atmospheric-md p-3 min-w-[140px]">
          {PALETTES.map(p => (
            <button
              key={p.id}
              onClick={() => { setPaletteId(p.id); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors duration-200 text-start ${paletteId === p.id ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            >
              <span
                className="w-4 h-4 rounded-full flex-shrink-0 border border-border"
                style={{ backgroundColor: p.primary }}
              />
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
