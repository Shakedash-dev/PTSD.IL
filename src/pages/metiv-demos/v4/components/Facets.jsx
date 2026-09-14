import React, { useId } from 'react';
import { X } from 'lucide-react';
import { Checkbox } from './ui';
import { Button } from '@/components/ui/button';

/**
 * Checkbox facet group with counts.
 * @param {{
 *   title: string,
 *   options: { key: string, label: string, count: number }[],
 *   selected: string[],
 *   onToggle: (key: string) => void,
 * }} props
 */
export function FacetGroup({ title, options, selected, onToggle }) {
  const uid = useId();
  return (
    <fieldset className="border-t border-border pt-4 first:border-t-0 first:pt-0">
      <legend className="mb-2 text-sm font-semibold text-foreground">{title}</legend>
      <ul className="space-y-1">
        {options.map((o) => {
          const id = `${uid}-${o.key}`;
          const checked = selected.includes(o.key);
          return (
            <li key={o.key} className="flex items-center gap-2.5 rounded-lg px-1 py-1 hover:bg-muted">
              <Checkbox id={id} checked={checked} onCheckedChange={() => onToggle(o.key)} disabled={!o.count && !checked} />
              <label htmlFor={id} className="flex-1 cursor-pointer text-sm leading-snug text-foreground">
                {o.label}
              </label>
              <span className="min-w-6 rounded-full bg-muted px-1.5 text-center text-xs text-muted-foreground">{o.count}</span>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

/**
 * Removable chips for the active filters.
 * @param {{ chips: { key: string, label: string, onRemove: () => void }[], onClear: () => void }} props
 */
export function ActiveChips({ chips, onClear }) {
  if (!chips.length) return null;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <Button key={c.key} variant="subtle" size="xs" radius="full" onClick={c.onRemove} className="gap-1">
          {c.label}
          <X aria-hidden="true" />
          <span className="sr-only">הסרת הסינון</span>
        </Button>
      ))}
      <Button variant="link" size="xs" onClick={onClear}>ניקוי הכל</Button>
    </div>
  );
}

/** @param {string[]} list @param {string} key */
export const toggleIn = (list, key) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);
