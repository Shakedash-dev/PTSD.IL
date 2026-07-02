import React, { useState, useRef, useEffect } from 'react';
import { Image } from 'lucide-react';
import { useImageSet } from '@/lib/ImageSetContext';

const LABELS = {
  set1: 'סט 1',
  set2: 'סט 2',
  set3: 'סט 3',
  set4: 'סט 4',
  set5: 'סט 5',
};

// Mirrors ThemePicker visually: small icon button in the navbar, popover dropdown
// of available sets. The active set is highlighted. Selection persists via
// ImageSetContext's localStorage write.
export default function ImageSetPicker() {
  const { setId, setSetId, availableSets } = useImageSet();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors duration-300 ${
          open ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
        aria-label="בחר סט תמונות"
      >
        <Image className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 z-50 bg-card border border-border rounded-xl shadow-atmospheric-md p-3 min-w-[140px]">
          {availableSets.map(id => (
            <button
              key={id}
              onClick={() => { setSetId(id); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors duration-200 text-start ${
                setId === id ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <span className="w-4 h-4 rounded-full flex-shrink-0 border border-border bg-primary/40" />
              {LABELS[id] || id}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
