import React, { useState, useRef, useEffect } from 'react';
import { Palette, Layers } from 'lucide-react';
import { useTheme, PALETTES, TEXTURES } from '@/lib/ThemeContext';

export default function ThemePicker() {
  const { paletteId, setPaletteId, textureId, setTextureId } = useTheme();
  const [open, setOpen] = useState(null); // 'palette' | 'texture' | null
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(null); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="flex items-center gap-1" ref={ref}>
      {/* Palette button */}
      <div className="relative">
        <button
          onClick={() => setOpen(open === 'palette' ? null : 'palette')}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors duration-300 ${open === 'palette' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          aria-label="בחר פלטת צבעים"
        >
          <Palette className="w-4 h-4" />
        </button>

        {open === 'palette' && (
          <div className="absolute top-full mt-2 left-0 z-50 bg-card border border-border rounded-xl shadow-atmospheric-md p-3 min-w-[180px]">
            <p className="text-xs text-muted-foreground font-medium mb-2 px-1">פלטת צבעים</p>
            {PALETTES.map(p => (
              <button
                key={p.id}
                onClick={() => { setPaletteId(p.id); setOpen(null); }}
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

      {/* Texture button */}
      <div className="relative">
        <button
          onClick={() => setOpen(open === 'texture' ? null : 'texture')}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors duration-300 ${open === 'texture' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          aria-label="בחר מרקם"
        >
          <Layers className="w-4 h-4" />
        </button>

        {open === 'texture' && (
          <div className="absolute top-full mt-2 left-0 z-50 bg-card border border-border rounded-xl shadow-atmospheric-md p-3 min-w-[140px]">
            <p className="text-xs text-muted-foreground font-medium mb-2 px-1">מרקם רקע</p>
            {TEXTURES.map(tx => (
              <button
                key={tx.id}
                onClick={() => { setTextureId(tx.id); setOpen(null); }}
                className={`w-full text-start px-2 py-2 rounded-lg text-sm transition-colors duration-200 ${textureId === tx.id ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:bg-muted'}`}
              >
                {tx.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}