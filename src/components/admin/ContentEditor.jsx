import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Link2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { blankLike, fieldLabel, isMarkdownField, isRef, isTechnicalKey, itemTitle } from './contentFields';
import { fieldRules, hasVisible, isDateKey, patternOf } from './metivFieldRules';

// Schema-less editor for one content JSON object (a Metiv collection item, a
// singleton, a copy namespace). It renders whatever shape it is given:
//   string            input, or an auto-growing textarea when long/multi-line
//                     (Markdown fields get a small hint - the DB stores
//                     Markdown, never HTML, so there is no rich-text editor)
//   number / boolean  number input / checkbox
//   string[]          list with add, remove, move up/down
//   object[]          collapsible cards titled by the item's title/name/label/q
//   object            fieldset
//   { $ref }          read-only note: the item lives in another collection
// Which fields show is decided by `rules` (metivFieldRules.js): ids, routes,
// icons, category keys, provenance and layout headings are not shown at all,
// and a list or object with nothing visible inside is left out too. Keys
// starting with `_` are never shown. A field with a fixed set of choices is a
// select, an ISO date a date picker. Every input carries `data-path` (the
// field's dot path), so a search result can focus it.
//
// `structureLocked` (non-Hebrew tabs) hides add/remove/reorder: a translation
// must keep the Hebrew row's structure, since translations are written back
// path by path (src/lib/translatable.js).
//
// A section that knows its keys can pass its own field names (`labels`), a
// short help line per key (`help`) and keys whose value is read-only here
// (`lockedKeys`, e.g. a flag that is set in Hebrew for every language).

const INPUT = 'w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground';

/**
 * @typedef {ReturnType<typeof fieldRules>} Rules
 * @typedef {{
 *   idBase: string, dir: 'rtl'|'ltr', structureLocked: boolean, resolveRef?: (ref: string) => { label: string, title: string },
 *   labels?: Record<string, string>, help?: Record<string, string>, lockedKeys?: string[], rules: Rules, plainText?: boolean,
 * }} EditorCtx
 */

const DEFAULT_RULES = fieldRules({});

function AutoTextarea({ id, value, onChange, dir, path }) {
  const ref = useRef(/** @type {HTMLTextAreaElement|null} */ (null));
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    if (el.scrollHeight) el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      id={id}
      data-path={path}
      dir={dir}
      rows={3}
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`${INPUT} leading-relaxed resize-y`}
    />
  );
}

function TextControl({ id, k, value, onChange, dir, path, plain }) {
  const text = value ?? '';
  if (isDateKey(k)) {
    return <input id={id} data-path={path} type="date" dir="ltr" value={text} onChange={e => onChange(e.target.value)} className={`${INPUT} max-w-[12rem]`} />;
  }
  const long = text.length > 90 || text.includes('\n') || (!plain && isMarkdownField(k, text));
  if (long) return <AutoTextarea id={id} value={text} onChange={onChange} dir={dir} path={path} />;
  return <input id={id} data-path={path} type="text" dir={dir} value={text} onChange={e => onChange(e.target.value)} className={INPUT} />;
}

/** A field with a fixed set of choices. A value outside them is kept as a choice of its own. */
function SelectControl({ id, value, onChange, choices, path }) {
  const known = choices.some(c => c.value === value);
  return (
    <select id={id} data-path={path} value={value ?? ''} onChange={e => onChange(e.target.value)} className={`${INPUT} max-w-sm`}>
      {!known && <option value={value ?? ''}>{value || 'לא נבחר'}</option>}
      {choices.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
    </select>
  );
}

function NumberControl({ id, value, onChange, path }) {
  return (
    <input
      id={id}
      data-path={path}
      type="number"
      dir="ltr"
      value={value}
      onChange={e => {
        const n = Number(e.target.value);
        onChange(Number.isNaN(n) ? 0 : n);
      }}
      className={`${INPUT} max-w-[12rem]`}
    />
  );
}

function FieldLabel({ htmlFor, k, markdown = false, ctx }) {
  return (
    <label htmlFor={htmlFor} className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
      {fieldLabel(k, ctx.labels)}
      {markdown && <span className="px-1.5 rounded bg-muted text-[10px] font-medium text-muted-foreground">Markdown</span>}
    </label>
  );
}

/** The section's help line for a key, and a reminder to keep `{placeholders}`. */
function FieldHelp({ k, value, ctx }) {
  const text = ctx.help?.[k];
  const slots = typeof value === 'string' ? [...new Set(value.match(/\{\w+\}/g) ?? [])] : [];
  if (!text && !slots.length) return null;
  return (
    <>
      {text && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{text}</p>}
      {slots.length > 0 && (
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          יש להשאיר את <span dir="ltr">{slots.join(' ')}</span> כמו שהוא: האתר מחליף אותו בתוכן.
        </p>
      )}
    </>
  );
}

/** @param {{ value: any, ctx: EditorCtx }} props */
function RefNote({ value, ctx }) {
  const target = ctx.resolveRef?.(value.$ref) ?? { label: value.$ref, title: '' };
  return (
    <p className="flex items-start gap-2 rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-xs text-foreground">
      <Link2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
      <span>
        מופיע מתוך: {target.label}{target.title ? ` / ${target.title}` : ''}
        <span className="block text-muted-foreground">הפריט הזה נערך במקום המקורי שלו.</span>
      </span>
    </p>
  );
}

/** Moves, removes. Hidden when the structure is locked. */
function ItemControls({ index, count, onMove, onRemove, ctx }) {
  if (ctx.structureLocked) return null;
  return (
    <div className="flex items-center gap-0.5 flex-shrink-0">
      <Button type="button" variant="quiet" size="none" onClick={() => onMove(index, -1)} disabled={index === 0} title="הזזה למעלה" className="p-1 disabled:opacity-30">
        <ChevronUp className="w-3.5 h-3.5" />
      </Button>
      <Button type="button" variant="quiet" size="none" onClick={() => onMove(index, 1)} disabled={index === count - 1} title="הזזה למטה" className="p-1 disabled:opacity-30">
        <ChevronDown className="w-3.5 h-3.5" />
      </Button>
      <Button type="button" variant="quiet" size="none" onClick={() => onRemove(index)} title="הסרת פריט" className="p-1 hover:text-destructive">
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

/** The editor for a value with no label of its own (a list item, a card body). */
function Value({ k, value, onChange, path, ctx }) {
  const id = `${ctx.idBase}-${path}`;
  const dir = isTechnicalKey(k) ? 'ltr' : ctx.dir;
  if (isRef(value)) return <RefNote value={value} ctx={ctx} />;
  if (Array.isArray(value)) return <ListField k={k} value={value} onChange={onChange} path={path} ctx={ctx} />;
  if (value && typeof value === 'object') return <ObjectFields value={value} onChange={onChange} path={path} ctx={ctx} />;
  if (typeof value === 'number') return <NumberControl id={id} value={value} onChange={onChange} path={path} />;
  if (typeof value === 'boolean') {
    return <input id={id} data-path={path} type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} />;
  }
  const choices = ctx.rules.options(patternOf(path));
  if (choices) return <SelectControl id={id} value={value} onChange={onChange} choices={choices} path={path} />;
  return <TextControl id={id} k={k} value={value} onChange={onChange} dir={dir} path={path} plain={ctx.plainText} />;
}

/** One labelled field of an object. */
function Field({ k, value, onChange, path, ctx }) {
  const id = `${ctx.idBase}-${path}`;
  if (typeof value === 'boolean') {
    return (
      <div>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input id={id} data-path={path} type="checkbox" checked={value} disabled={ctx.lockedKeys?.includes(k)} onChange={e => onChange(e.target.checked)} />
          {fieldLabel(k, ctx.labels)}
        </label>
        <FieldHelp k={k} value={value} ctx={ctx} />
      </div>
    );
  }
  if (Array.isArray(value) || (value && typeof value === 'object' && !isRef(value))) {
    return (
      <fieldset className="rounded-xl border border-border p-3 space-y-3 min-w-0">
        <legend className="px-1 text-xs font-semibold text-foreground">{fieldLabel(k, ctx.labels)}</legend>
        {ctx.help?.[k] && <p className="text-xs text-muted-foreground leading-relaxed">{ctx.help[k]}</p>}
        <Value k={k} value={value} onChange={onChange} path={path} ctx={ctx} />
      </fieldset>
    );
  }
  const markdown = !ctx.plainText && typeof value === 'string' && isMarkdownField(k, value);
  return (
    <div>
      <FieldLabel htmlFor={id} k={k} markdown={markdown} ctx={ctx} />
      <Value k={k} value={value} onChange={onChange} path={path} ctx={ctx} />
      <FieldHelp k={k} value={value} ctx={ctx} />
    </div>
  );
}

function ObjectFields({ value, onChange, path, ctx }) {
  const { visible } = ctx.rules;
  const at = k => (path ? `${path}.${k}` : k);
  const entries = Object.entries(value).filter(([k, v]) => {
    const pattern = patternOf(at(k));
    return visible(pattern, k) && hasVisible(v, pattern, visible);
  });
  const set = (k, v) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-3 min-w-0">
      {entries.map(([k, v]) => <Field key={k} k={k} value={v} onChange={x => set(k, x)} path={at(k)} ctx={ctx} />)}
    </div>
  );
}

function ItemCard({ index, item, count, k, onChange, onMove, onRemove, path, ctx, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const title = itemTitle(item, `פריט ${index + 1}`);
  return (
    <div className="rounded-lg border border-border bg-muted/30">
      <div className="flex items-center gap-1 pe-1">
        <Button
          type="button"
          variant="quiet"
          size="none"
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
          className="flex-1 min-w-0 justify-start gap-2 px-3 py-2 text-start text-sm font-medium whitespace-normal"
        >
          <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
          <span className="truncate">{index + 1}. {title}</span>
        </Button>
        <ItemControls index={index} count={count} onMove={onMove} onRemove={onRemove} ctx={ctx} />
      </div>
      {open && (
        <div className="px-3 pb-3">
          <Value k={k} value={item} onChange={onChange} path={path} ctx={ctx} />
        </div>
      )}
    </div>
  );
}

function ListField({ k, value: list, onChange, path, ctx }) {
  const [added, setAdded] = useState(-1);
  const primitive = list.every(x => x === null || typeof x !== 'object');
  const setAt = (i, v) => onChange(list.map((x, j) => (j === i ? v : x)));
  const remove = i => onChange(list.filter((_, j) => j !== i));
  const move = (i, delta) => {
    const t = i + delta;
    if (t < 0 || t >= list.length) return;
    const next = list.slice();
    [next[i], next[t]] = [next[t], next[i]];
    onChange(next);
  };
  const add = () => {
    const sample = list.find(x => x && typeof x === 'object' && !isRef(x)) ?? list[0];
    setAdded(list.length);
    onChange([...list, list.length ? blankLike(sample) : '']);
  };

  return (
    <div className="space-y-2">
      {list.length === 0 && <p className="text-xs text-muted-foreground">(רשימה ריקה)</p>}
      {primitive
        ? list.map((x, i) => (
          <div key={i} className="flex items-start gap-1">
            <span className="text-xs text-muted-foreground pt-2.5 w-5 flex-shrink-0">{i + 1}.</span>
            <div className="flex-1 min-w-0">
              <Value k={k} value={x} onChange={v => setAt(i, v)} path={`${path}.${i}`} ctx={ctx} />
            </div>
            <ItemControls index={i} count={list.length} onMove={move} onRemove={remove} ctx={ctx} />
          </div>
        ))
        : list.map((x, i) => (
          <ItemCard
            key={i}
            index={i}
            item={x}
            count={list.length}
            k={k}
            onChange={v => setAt(i, v)}
            onMove={move}
            onRemove={remove}
            path={`${path}.${i}`}
            ctx={ctx}
            defaultOpen={i === added}
          />
        ))}
      {!ctx.structureLocked && (
        <Button type="button" variant="link" size="none" onClick={add} className="text-xs gap-1">
          <Plus className="w-3 h-3" /> הוספה ל{fieldLabel(k, ctx.labels)}
        </Button>
      )}
    </div>
  );
}

/**
 * @param {Object} props
 * @param {any} props.value  the content object (never mutated)
 * @param {(next: any) => void} props.onChange
 * @param {'rtl'|'ltr'} [props.dir]  direction of the content language's text inputs
 * @param {boolean} [props.structureLocked]
 * @param {(ref: string) => { label: string, title: string }} [props.resolveRef]
 * @param {Record<string, string>} [props.labels]  field names, ahead of FIELD_LABELS
 * @param {Record<string, string>} [props.help]    a help line under a field
 * @param {string[]} [props.lockedKeys]            keys shown read-only
 * @param {Rules} [props.rules]                     which fields show (default: the generic hidden keys)
 * @param {boolean} [props.plainText]               page copy: no field is Markdown
 */
export default function ContentEditor({ value, onChange, dir = 'rtl', structureLocked = false, resolveRef, labels, help, lockedKeys, rules, plainText = false }) {
  const idBase = useId().replace(/:/g, '');
  /** @type {EditorCtx} */
  const ctx = { idBase, dir, structureLocked, resolveRef, labels, help, lockedKeys, rules: rules ?? DEFAULT_RULES, plainText };
  if (isRef(value)) return <RefNote value={value} ctx={ctx} />;
  return <ObjectFields value={value || {}} onChange={onChange} path="" ctx={ctx} />;
}
