import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

// Compact dropdown filter chip (Booking/Airbnb style).
// Props:
//   label: shown when nothing selected, e.g. "קהל יעד"
//   options: [{ key, label }]
//   value: currently selected key
//   onChange: (newKey) => void
//   activeLabel: optional override for chip label when something is selected
export default function FilterChip({ label, options, value, onChange, activeLabel }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isActive = value && value !== 'all';
  const selectedOption = options.find(o => o.key === value);
  const chipText = isActive
    ? (activeLabel || selectedOption?.label || label)
    : label;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-natural ${
          isActive
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-card text-foreground border-border hover:border-primary/50'
        }`}
      >
        <span>{chipText}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-2 start-0 z-40 bg-card border border-border rounded-2xl shadow-atmospheric-md p-2 min-w-[200px] max-h-[60vh] overflow-y-auto">
          {options.map(opt => {
            const selected = opt.key === value;
            return (
              <button
                key={opt.key}
                onClick={() => { onChange(opt.key); setOpen(false); }}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm text-start transition-colors duration-200 ${
                  selected ? 'bg-muted text-foreground font-medium' : 'text-foreground hover:bg-muted'
                }`}
              >
                <span>{opt.label}</span>
                {selected && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
