import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import ChoiceChip from '@/components/patterns/ChoiceChip';
import ContentEditor from '@/components/admin/ContentEditor';
import { AddNewButton, Badge, DiscardButton, IconBtn, LoadingRow, Section, STATUS_BADGES } from '@/components/admin/AdminUi';
import { useAdminLang } from '@/components/admin/AdminLang';
import { TRANSLATION_BADGES, usePendingChanges } from '@/components/admin/PendingChanges';
import { stageSiblingDeletes, useStageTranslations } from '@/components/admin/translationStaging';
import { blankLike, contentDiff, isRef, isTechnicalKey, itemSummary } from '@/components/admin/contentFields';
import { TARGET_LANGS, humanStamp } from '@/api/adminTranslate';
import {
  createMetivRow, loadMetiv, metivTitle, newItemKey, removeMetivRow, resolveRef, setMetivSortOrder, updateMetivRow,
} from '@/api/metivAdminSource';
import { AREA_LABELS, COLLECTIONS, COPY_SLUG } from '@/pages/metiv-demos/v3/content/registry';

// The Metiv v3 content in /metiv-site-demo-v3/admin (docs/metiv-db-spec.md
// section 3). Three groups - general / patients / therapists - each a sidebar
// of sections: the registry's collections, then the copy namespaces ("page
// texts"). The patient group also holds the nine PTSD-IL panels, rendered by
// Admin.jsx and passed in.
//
// Every collection is edited with the schema-less ContentEditor and staged
// like every other panel: "אישור" stages, the save-all dialog writes. A Hebrew
// change stages its AI translations (translationStaging.js); a change in
// another language tab writes only that row and stamps `_tr.by = 'human'`.

const AREAS = ['general', 'patient', 'therapist'];

// ─── Data ────────────────────────────────────────────────────────────────────

const MetivStoreContext = createContext(/** @type {null | { store: import('@/api/metivAdminSource').MetivStore|null, loading: boolean, error: string }} */ (null));

// Loads every Metiv row once, and again after each save-all batch, for all
// sections to share.
export function MetivStoreProvider({ children }) {
  const { version } = usePendingChanges();
  const [state, setState] = useState({ store: null, loading: true, error: '' });
  useEffect(() => {
    let cancelled = false;
    setState(s => ({ ...s, loading: true }));
    loadMetiv()
      .then(store => { if (!cancelled) setState({ store, loading: false, error: '' }); })
      .catch(err => {
        if (cancelled) return;
        toast.error(err?.message || 'שגיאה בטעינת תוכן מטיב');
        setState({ store: null, loading: false, error: err?.message || 'שגיאה בטעינת תוכן מטיב' });
      });
    return () => { cancelled = true; };
  }, [version]);
  return <MetivStoreContext.Provider value={state}>{children}</MetivStoreContext.Provider>;
}

function useMetivStore() {
  const ctx = useContext(MetivStoreContext);
  if (!ctx) throw new Error('useMetivStore must be used inside <MetivStoreProvider>');
  return ctx;
}

/**
 * @typedef {{ id: string, area: string, label: string, kind: string, slug: string, titleField?: string, idField?: string, scope: string, copyKey?: string }} MetivSection
 */

/** The sections of each group: collections by registry order, then copy namespaces. */
export function metivSections(store) {
  /** @type {Record<string, MetivSection[]>} */
  const out = { general: [], patient: [], therapist: [] };
  for (const c of COLLECTIONS) {
    out[c.area].push({ id: `col:${c.slug}`, area: c.area, label: c.label, kind: c.kind, slug: c.slug, titleField: c.titleField, idField: c.idField, scope: `metiv:${c.slug}` });
  }
  const copies = (store?.rows || []).filter(r => r.col === COPY_SLUG && r.langId === 'he');
  for (const r of copies.slice().sort((a, b) => String(a.content._label || a.key).localeCompare(String(b.content._label || b.key), 'he'))) {
    const area = AREAS.includes(r.content._area) ? r.content._area : 'general';
    out[area].push({
      id: `copy:${r.key}`, area, label: `טקסטים בעמודים: ${r.content._label || r.key}`, kind: 'copy',
      slug: COPY_SLUG, scope: `metiv:copy:${r.key}`, copyKey: r.key,
    });
  }
  return out;
}

const withoutMeta = content => Object.fromEntries(Object.entries(content || {}).filter(([k]) => !k.startsWith('_')));

// ─── Staging ─────────────────────────────────────────────────────────────────

/** Staging for one section: Hebrew edits (with translations) and per-language edits. */
function useMetivStaging(section, store) {
  const { changes, stage, discard, newKey } = usePendingChanges();
  const stageTranslations = useStageTranslations();
  const sectionName = `${AREA_LABELS[section.area]} / ${section.label}`;
  const scope = section.scope;
  const slug = section.slug;
  const titleOf = content => metivTitle(slug, content);
  const context = title => `${sectionName}: ${title}`;

  /** @param {import('@/api/metivAdminSource').MetivRow} row */
  function siblingsOf(row) {
    return Object.fromEntries(TARGET_LANGS.map(l => [l, store.rows.find(r => r.groupId === row.groupId && r.langId === l) ?? null]));
  }

  function writeSibling(heRow, groupRef) {
    return (lang, built, sibling) => {
      const title = titleOf(built.content);
      if (sibling) return updateMetivRow(sibling, { title, content: built.content });
      const groupId = heRow?.groupId ?? groupRef.groupId;
      if (!groupId) throw new Error('השורה העברית לא נשמרה, ולכן אין לאן לקשר את התרגום');
      return createMetivRow(store, { lang, slug, title, content: built.content, sortOrder: heRow?.sortOrder ?? groupRef.sortOrder, groupId });
    };
  }

  function stageHeUpdate(row, content) {
    const key = `metiv:${row.id}`;
    const diff = contentDiff(row.content, content);
    if (!diff.length) { discard(key); return; }
    const title = titleOf(content);
    stage({ key, scope, section: sectionName, action: 'update', itemId: row.id, title, draft: { content }, diff, run: () => updateMetivRow(row, { title, content }) });
    const siblings = siblingsOf(row);
    stageTranslations({
      heKey: key, scope, section: sectionName, title, context: context(title),
      handEdited: (lang, sib) => changes.some(c => c.key === `metiv:${sib.id}`),
      prepare: async () => ({ oldContent: row.content, newContent: content, siblings, write: writeSibling(row, {}) }),
    });
  }

  function stageHeCreate(key, content, sortOrder, takenKeys) {
    const title = titleOf(content);
    const _key = content._key || newItemKey(slug, title, takenKeys);
    const full = { _key, _col: slug, ...withoutMeta(content) };
    // A new course/article needs its slug (routes use it): default to the key.
    if (section.idField && isTechnicalKey(section.idField) && !full[section.idField]) full[section.idField] = _key;
    const groupRef = { groupId: undefined, sortOrder };
    stage({
      key, scope, section: sectionName, action: 'create', title, draft: { content: full, sortOrder }, diff: contentDiff({}, full),
      run: () => createMetivRow(store, { lang: 'he', slug, title, content: full, sortOrder, onSaved: s => { groupRef.groupId = s?.groupId; } }),
    });
    stageTranslations({
      heKey: key, scope, section: sectionName, title, context: context(title),
      prepare: async () => ({ oldContent: null, newContent: full, siblings: {}, write: writeSibling(null, groupRef) }),
    });
  }

  function stageHeDelete(row) {
    const key = `metiv:${row.id}`;
    const title = titleOf(row.content);
    stage({ key, scope, section: sectionName, action: 'delete', itemId: row.id, title, diff: [], run: () => removeMetivRow(row.id) });
    stageSiblingDeletes(stage, { heKey: key, scope, section: sectionName, title, siblings: siblingsOf(row), remove: removeMetivRow });
  }

  /** A non-Hebrew edit: that row only, stamped as edited by hand, no translation. */
  function stageHuman(heRow, sibling, lang, content) {
    const key = sibling ? `metiv:${sibling.id}` : `metiv:new:${heRow.groupId}:${lang}`;
    const next = { ...content, _tr: humanStamp() };
    const diff = contentDiff(sibling?.content ?? {}, next);
    if (sibling && !diff.length) { discard(key); return; }
    const title = titleOf(next);
    stage({
      key, scope, section: sectionName, lang, action: sibling ? 'update' : 'create', ...(sibling ? { itemId: sibling.id } : {}),
      title, draft: { content: next }, diff,
      run: () => (sibling
        ? updateMetivRow(sibling, { title, content: next })
        : createMetivRow(store, { lang, slug, title, content: next, sortOrder: heRow.sortOrder, groupId: heRow.groupId })),
    });
  }

  return { changes, stage, discard, newKey, siblingsOf, stageHeUpdate, stageHeCreate, stageHeDelete, stageHuman, sectionName, titleOf };
}

/** Badges summarising the translations staged with a Hebrew change. */
export function TranslationSummary({ heKey }) {
  const { changes } = usePendingChanges();
  const linked = changes.filter(c => c.linkedTo === heKey && c.translation);
  if (!linked.length) return null;
  const pending = linked.filter(c => c.translation.state === 'pending').length;
  const failed = linked.filter(c => c.translation.state === 'error').length;
  const flagged = linked.filter(c => c.translation.status === 'flagged').length;
  return (
    <>
      {pending > 0 && <Badge color={TRANSLATION_BADGES.pending.color}>{TRANSLATION_BADGES.pending.label}</Badge>}
      {failed > 0 && <Badge color={TRANSLATION_BADGES.error.color}>{TRANSLATION_BADGES.error.label} ({failed})</Badge>}
      {flagged > 0 && <Badge color={TRANSLATION_BADGES.flagged.color}>{TRANSLATION_BADGES.flagged.label} ({flagged})</Badge>}
      {!pending && !failed && !flagged && <Badge color="bg-success/10 text-success">{linked.length} תרגומים מוכנים</Badge>}
    </>
  );
}

// ─── Cards ───────────────────────────────────────────────────────────────────

function EditorButtons({ onConfirm, onCancel, cancelLabel = 'ביטול' }) {
  return (
    <div className="flex gap-2 pt-1 items-center flex-wrap">
      <Button type="button" variant="solid" size="xs" onClick={onConfirm} className="gap-1.5 rounded-lg font-semibold">
        <Check className="w-3.5 h-3.5" /> אישור
      </Button>
      <Button type="button" variant="subtle" size="xs" onClick={onCancel} className="gap-1.5 rounded-lg font-semibold hover:bg-border">
        <X className="w-3.5 h-3.5" /> {cancelLabel}
      </Button>
      <span className="text-xs text-muted-foreground">השינוי יעלה לאתר רק אחרי &quot;סקירה ושמירה&quot;</span>
    </div>
  );
}

/**
 * One list item: title and summary, or the editor.
 * @param {Object} props
 * @param {any} props.content
 * @param {string} props.title
 * @param {'create'|'update'|'delete'} [props.status]
 * @param {(content: any) => (void|boolean)} props.onConfirm  false keeps the editor open (invalid draft)
 * @param {() => void} [props.onCancel]
 * @param {() => void} [props.onDelete]
 * @param {() => void} [props.onDiscard]
 * @param {() => void} [props.onUp]
 * @param {() => void} [props.onDown]
 * @param {React.ReactNode} [props.extra]
 * @param {boolean} [props.startInEdit]
 * @param {'rtl'|'ltr'} props.dir
 * @param {boolean} props.structureLocked
 * @param {(ref: string) => { label: string, title: string }} props.resolve
 * @param {React.ReactNode} [props.summary]  replaces the card's text summary
 * @param {{ labels?: Record<string, string>, help?: Record<string, string>, lockedKeys?: string[] }} [props.editorProps]
 */
export function ItemCard({ content, title, status, onConfirm, onCancel, onDelete, onDiscard, onUp, onDown, extra, startInEdit = false, dir, structureLocked, resolve, summary, editorProps }) {
  const [editing, setEditing] = useState(startInEdit);
  const [draft, setDraft] = useState(content);
  const badge = status && STATUS_BADGES[status];
  const ref = isRef(content);

  if (editing) {
    return (
      <div className="p-4 rounded-xl border border-primary/40 bg-background space-y-3">
        <ContentEditor value={draft} onChange={setDraft} dir={dir} structureLocked={structureLocked} resolveRef={resolve} {...editorProps} />
        <EditorButtons
          onConfirm={() => { if (onConfirm(draft) !== false) setEditing(false); }}
          onCancel={() => { setDraft(content); setEditing(false); onCancel?.(); }}
        />
      </div>
    );
  }

  const shownTitle = ref ? (() => { const t = resolve(content.$ref); return `${t.label} / ${t.title}`; })() : title;
  return (
    <div className={`relative p-4 rounded-xl border bg-background ${badge ? 'border-warning/60' : 'border-border'}`}>
      {(badge || extra) && (
        <div className="flex items-center gap-2 mb-2 flex-wrap pe-28">
          {badge && <Badge color={badge.color}>{badge.label}</Badge>}
          {extra}
          {onDiscard && <DiscardButton onClick={onDiscard} />}
        </div>
      )}
      <div className={`pe-28 ${status === 'delete' ? 'opacity-50 line-through' : ''}`}>
        <p className="font-medium text-foreground" dir="auto">{shownTitle}</p>
        {ref
          ? <p className="text-xs text-muted-foreground mt-1">פריט מקושר - נערך במקום המקורי שלו</p>
          : summary ?? <p className="text-sm text-muted-foreground mt-1 line-clamp-2" dir="auto">{itemSummary(content)}</p>}
      </div>
      {status !== 'delete' && (
        <div className="absolute top-3 end-3 flex gap-1">
          {onUp && <IconBtn icon={ChevronUp} title="הזזה למעלה" onClick={onUp} />}
          {onDown && <IconBtn icon={ChevronDown} title="הזזה למטה" onClick={onDown} />}
          {!ref && <IconBtn icon={Pencil} title="עריכה" onClick={() => { setDraft(content); setEditing(true); }} />}
          {onDelete && <IconBtn icon={Trash2} title="מחיקה" tone="danger" onClick={onDelete} />}
        </div>
      )}
    </div>
  );
}

// ─── Sections ────────────────────────────────────────────────────────────────

function ListSection({ section, store }) {
  const lang = useAdminLang();
  const hebrew = lang.id === 'he';
  const s = useMetivStaging(section, store);
  const { changes, stage, discard, newKey } = s;
  const [creating, setCreating] = useState(false);
  const resolve = ref => resolveRef(store, ref);

  const heRows = store.rows.filter(r => r.col === section.slug && r.langId === 'he').sort((a, b) => a.sortOrder - b.sortOrder);
  const pending = changes.filter(c => c.scope === section.scope && !c.linkedTo);
  const orderKey = `${section.scope}:order`;
  const orderChange = pending.find(c => c.key === orderKey);
  const ordered = orderChange
    ? orderChange.draft.order.map(id => heRows.find(r => r.id === id)).filter(Boolean)
    : heRows;
  const creates = pending.filter(c => c.action === 'create' && !c.lang);
  const sample = heRows.find(r => !isRef(r.content))?.content;
  const blank = sample ? blankLike(sample) : { [section.titleField || 'title']: '' };
  const takenKeys = new Set([...heRows.map(r => r.key), ...creates.map(c => c.draft.content._key)]);
  const nextSort = Math.max(-1, ...heRows.map(r => r.sortOrder), ...creates.map(c => c.draft.sortOrder)) + 1;

  function move(index, delta) {
    const ids = ordered.map(r => r.id);
    const t = index + delta;
    if (t < 0 || t >= ids.length) return;
    [ids[index], ids[t]] = [ids[t], ids[index]];
    if (ids.every((id, i) => id === heRows[i].id)) { discard(orderKey); return; }
    const titles = rows => rows.map((r, i) => `${i + 1}. ${s.titleOf(r.content)}`).join('\n');
    const nextRows = ids.map(id => heRows.find(r => r.id === id));
    stage({
      key: orderKey, scope: section.scope, section: s.sectionName, action: 'update', title: 'סדר הפריטים',
      draft: { order: ids }, diff: [{ label: 'סדר הפריטים', before: titles(heRows), after: titles(nextRows) }],
      run: async () => {
        for (let i = 0; i < nextRows.length; i++) {
          const row = nextRows[i];
          if (row.sortOrder === i) continue;
          await setMetivSortOrder(row.id, i);
          for (const sib of Object.values(s.siblingsOf(row))) if (sib && sib.sortOrder !== i) await setMetivSortOrder(sib.id, i);
        }
      },
    });
  }

  return (
    <div>
      <Section title={section.label} count={heRows.length} />
      <div className="space-y-3">
        {ordered.map((row, i) => {
          if (hebrew) {
            const key = `metiv:${row.id}`;
            const p = changes.find(c => c.key === key);
            const content = p?.action === 'update' ? p.draft.content : row.content;
            return (
              <ItemCard
                key={row.id}
                content={content}
                title={s.titleOf(content)}
                status={p?.action}
                extra={p ? <TranslationSummary heKey={key} /> : null}
                onDiscard={p ? () => discard(key) : undefined}
                onConfirm={c => s.stageHeUpdate(row, c)}
                onDelete={() => s.stageHeDelete(row)}
                onUp={i > 0 ? () => move(i, -1) : undefined}
                onDown={i < ordered.length - 1 ? () => move(i, 1) : undefined}
                dir={lang.dir}
                structureLocked={false}
                resolve={resolve}
              />
            );
          }
          const sib = s.siblingsOf(row)[lang.id];
          const key = sib ? `metiv:${sib.id}` : `metiv:new:${row.groupId}:${lang.id}`;
          const p = changes.find(c => c.key === key);
          const content = p ? p.draft.content : sib?.content ?? row.content;
          const translating = changes.some(c => c.linkedTo === `metiv:${row.id}` && c.lang === lang.id);
          return (
            <ItemCard
              key={key}
              content={content}
              title={s.titleOf(content)}
              status={p?.action}
              extra={!sib && !p
                ? <Badge color="bg-muted text-muted-foreground">טרם תורגם - מוצג הנוסח העברי</Badge>
                : translating ? <Badge color={TRANSLATION_BADGES.pending.color}>תרגום מהעברית ממתין לשמירה</Badge> : null}
              onDiscard={p ? () => discard(key) : undefined}
              onConfirm={c => s.stageHuman(row, sib, lang.id, c)}
              dir={lang.dir}
              structureLocked
              resolve={resolve}
            />
          );
        })}
        {hebrew && creates.map(c => (
          <ItemCard
            key={c.key}
            content={c.draft.content}
            title={c.title}
            status="create"
            extra={<TranslationSummary heKey={c.key} />}
            onDiscard={() => discard(c.key)}
            onConfirm={content => s.stageHeCreate(c.key, content, c.draft.sortOrder, takenKeys)}
            dir={lang.dir}
            structureLocked={false}
            resolve={resolve}
          />
        ))}
        {hebrew && creating && (
          <ItemCard
            content={blank}
            title=""
            startInEdit
            onConfirm={content => { s.stageHeCreate(newKey(section.scope), content, nextSort, takenKeys); setCreating(false); }}
            onCancel={() => setCreating(false)}
            dir={lang.dir}
            structureLocked={false}
            resolve={resolve}
          />
        )}
      </div>
      {hebrew && (
        <div className="mt-3">
          <AddNewButton label="הוספת פריט חדש" onClick={() => setCreating(true)} />
        </div>
      )}
    </div>
  );
}

function SingleForm({ initial, onConfirm, dir, structureLocked, resolve }) {
  const [draft, setDraft] = useState(initial);
  return (
    <div className="space-y-3">
      <ContentEditor value={draft} onChange={setDraft} dir={dir} structureLocked={structureLocked} resolveRef={resolve} />
      <EditorButtons onConfirm={() => onConfirm(draft)} onCancel={() => setDraft(initial)} cancelLabel="איפוס הטופס" />
    </div>
  );
}

function SingleSection({ section, store }) {
  const lang = useAdminLang();
  const { version } = usePendingChanges();
  const s = useMetivStaging(section, store);
  const heRow = store.rows.find(r => r.col === section.slug && r.langId === 'he' && (section.kind !== 'copy' || r.key === section.copyKey));
  if (!heRow) {
    return (
      <div>
        <Section title={section.label} count={0} />
        <p className="text-sm text-muted-foreground">אין עדיין שורה במסד לאוסף הזה. יש לייבא אותו קודם (scripts/metiv-seed/import.mjs).</p>
      </div>
    );
  }
  const hebrew = lang.id === 'he';
  const sib = hebrew ? null : s.siblingsOf(heRow)[lang.id];
  const key = hebrew ? `metiv:${heRow.id}` : sib ? `metiv:${sib.id}` : `metiv:new:${heRow.groupId}:${lang.id}`;
  const p = s.changes.find(c => c.key === key);
  const base = hebrew ? heRow.content : sib?.content ?? heRow.content;
  const shown = p?.draft?.content ?? base;
  const badge = p && STATUS_BADGES[p.action];

  return (
    <div>
      <Section title={section.label} count={1} />
      <div className="flex items-center gap-2 mb-3 flex-wrap min-h-[1.5rem]">
        {badge && <Badge color={badge.color}>{badge.label}</Badge>}
        {hebrew && p && <TranslationSummary heKey={key} />}
        {!hebrew && !sib && !p && <Badge>טרם תורגם - מוצג הנוסח העברי</Badge>}
        {p && <DiscardButton onClick={() => s.discard(key)} />}
      </div>
      <SingleForm
        key={`${key}:${version}:${p ? 'staged' : 'server'}`}
        initial={shown}
        onConfirm={c => (hebrew ? s.stageHeUpdate(heRow, c) : s.stageHuman(heRow, sib, lang.id, c))}
        dir={lang.dir}
        structureLocked={!hebrew}
        resolve={ref => resolveRef(store, ref)}
      />
    </div>
  );
}

function MetivSectionPanel({ section }) {
  const { store, loading, error } = useMetivStore();
  if (loading && !store) return <LoadingRow />;
  if (!store) return <p className="text-sm text-destructive py-6 text-center">{error || 'שגיאה בטעינת תוכן מטיב'}</p>;
  return section.kind === 'list'
    ? <ListSection key={section.id} section={section} store={store} />
    : <SingleSection key={section.id} section={section} store={store} />;
}

// ─── Navigation ──────────────────────────────────────────────────────────────

function NavItem({ selected, onClick, label, count }) {
  return (
    <ChoiceChip variant="plain" size="list" selected={selected} onClick={onClick} className="flex items-center justify-between gap-2 py-2">
      <span className="min-w-0">{label}</span>
      {count > 0 && <Badge color="bg-warning/20 text-foreground">{count}</Badge>}
    </ChoiceChip>
  );
}

function NavHeading({ children }) {
  return <p className="text-[11px] font-semibold text-muted-foreground px-4 pt-3 pb-1">{children}</p>;
}

/**
 * The metiv variant's content view: the three groups, a section sidebar, and
 * the chosen section.
 * @param {Object} props
 * @param {{ key: string, label: string, shared?: boolean }[]} props.ptsdTabs  the nine PTSD-IL panels (patient group), plus the shared chatbot Q&A (`shared`)
 * @param {(key: string) => React.ReactNode} props.renderPtsd
 * @param {Record<string, number>} props.ptsdPending  staged changes per PTSD-IL panel
 */
export function MetivContentView({ ptsdTabs, renderPtsd, ptsdPending }) {
  return (
    <MetivStoreProvider>
      <MetivNav ptsdTabs={ptsdTabs} renderPtsd={renderPtsd} ptsdPending={ptsdPending} />
    </MetivStoreProvider>
  );
}

function MetivNav({ ptsdTabs, renderPtsd, ptsdPending }) {
  const { store } = useMetivStore();
  const { changes } = usePendingChanges();
  const sections = useMemo(() => metivSections(store), [store]);
  const [area, setArea] = useState('general');
  const [picked, setPicked] = useState(/** @type {Record<string, string>} */ ({}));

  const scopeCount = {};
  for (const c of changes) scopeCount[c.scope] = (scopeCount[c.scope] || 0) + 1;
  const ptsdIds = ptsdTabs.map(t => `ptsd:${t.key}`);
  // Panels shared with /admin that are not PTSD-IL site content (the chatbot's
  // Q&A) get a heading of their own.
  const siteTabs = ptsdTabs.filter(t => !t.shared);
  const sharedTabs = ptsdTabs.filter(t => t.shared);
  const groupCount = a => sections[a].reduce((n, sec) => n + (scopeCount[sec.scope] || 0), 0)
    + (a === 'patient' ? ptsdTabs.reduce((n, t) => n + (ptsdPending[t.key] || 0), 0) : 0);

  const ids = [...(area === 'patient' ? ptsdIds : []), ...sections[area].map(sec => sec.id)];
  const current = ids.includes(picked[area]) ? picked[area] : ids[0];
  const pick = id => setPicked(p => ({ ...p, [area]: id }));
  const section = sections[area].find(sec => sec.id === current);
  const collections = sections[area].filter(sec => sec.kind !== 'copy');
  const copies = sections[area].filter(sec => sec.kind === 'copy');

  return (
    <>
      <div role="group" aria-label="אזורי התוכן" className="flex flex-wrap gap-2 mb-5">
        {AREAS.map(a => (
          <ChoiceChip key={a} variant="plain" selected={area === a} onClick={() => setArea(a)} className="gap-2 px-4 py-2 rounded-super-sm text-sm">
            {AREA_LABELS[a]}
            {groupCount(a) > 0 && <Badge color="bg-warning/20 text-foreground">{groupCount(a)}</Badge>}
          </ChoiceChip>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] items-start">
        <nav aria-label={`הסעיפים של ${AREA_LABELS[area]}`} className="bg-card rounded-super border border-border py-2 shadow-card lg:sticky lg:top-20 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          {area === 'patient' && (
            <>
              <NavHeading>תוכן PTSD-IL</NavHeading>
              {siteTabs.map(t => (
                <NavItem key={t.key} label={t.label} selected={current === `ptsd:${t.key}`} onClick={() => pick(`ptsd:${t.key}`)} count={ptsdPending[t.key] || 0} />
              ))}
              {sharedTabs.length > 0 && <NavHeading>צ׳אטבוט (משותף לשני האתרים)</NavHeading>}
              {sharedTabs.map(t => (
                <NavItem key={t.key} label={t.label} selected={current === `ptsd:${t.key}`} onClick={() => pick(`ptsd:${t.key}`)} count={ptsdPending[t.key] || 0} />
              ))}
              <NavHeading>תוכן מטיב</NavHeading>
            </>
          )}
          {collections.map(sec => (
            <NavItem key={sec.id} label={sec.label} selected={current === sec.id} onClick={() => pick(sec.id)} count={scopeCount[sec.scope] || 0} />
          ))}
          {copies.length > 0 && <NavHeading>טקסטים בעמודים</NavHeading>}
          {copies.map(sec => (
            <NavItem key={sec.id} label={sec.label.replace(/^טקסטים בעמודים: /, '')} selected={current === sec.id} onClick={() => pick(sec.id)} count={scopeCount[sec.scope] || 0} />
          ))}
        </nav>
        <div className="bg-card rounded-super border border-border p-6 shadow-card min-w-0">
          {current?.startsWith('ptsd:') ? renderPtsd(current.slice(5)) : section ? <MetivSectionPanel section={section} /> : null}
        </div>
      </div>
    </>
  );
}
