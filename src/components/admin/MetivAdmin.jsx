import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronLeft, ChevronUp, ExternalLink, Menu, Pencil, RotateCcw, Search, Trash2, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import ChoiceChip from '@/components/patterns/ChoiceChip';
import ContentEditor from '@/components/admin/ContentEditor';
import { AddNewButton, Badge, DiscardButton, IconBtn, LoadingRow, STATUS_BADGES } from '@/components/admin/AdminUi';
import { useAdminLang } from '@/components/admin/AdminLang';
import { AdminFocusProvider, revealElement, useAdminFocus } from '@/components/admin/AdminFocus';
import { TRANSLATION_BADGES, usePendingChanges } from '@/components/admin/PendingChanges';
import { ServerChangedNote, sameJson, useChangedWhileOpen } from '@/components/admin/ServerChanged';
import { stageSiblingDeletes, useStageTranslations } from '@/components/admin/translationStaging';
import { blankLike, contentDiff, fieldLabel, isRef, isTechnicalKey, itemSummary } from '@/components/admin/contentFields';
import { fieldRules, hasVisible, isNavLink, patternOf } from '@/components/admin/metivFieldRules';
import { COPY_CONTENT_KEYS, copyContentKeys } from '@/components/admin/copyContentKeys';
import { buildSiteTree, findPage, flattenPages } from '@/components/admin/metivSiteMap';
import { siteCopyLabel } from '@/components/admin/siteCopyLabels';
import { groupByPage, plainText, searchEntries } from '@/components/admin/adminSearch';
import { LANG_BY_ID, TARGET_LANGS, humanStamp } from '@/api/adminTranslate';
import { createSiteCopyRow, loadSiteCopyRows, removeSiteCopyRow, siteCopyRow, updateSiteCopyRow } from '@/api/adminSiteCopy';
import { translations } from '@/lib/i18n';
import { loadChatbotQa, qaTitle } from '@/api/chatbotQaAdminSource';
import {
  createMetivRow, loadMetiv, metivTitle, newItemKey, removeMetivRow, resolveRef, setMetivSortOrder, updateMetivRow,
} from '@/api/metivAdminSource';
import { COLLECTION_BY_KEY, COPY_SLUG } from '@/pages/metiv-demos/v3/content/registry';
import { BASE } from '@/pages/metiv-demos/v3/meta';
import { BASE_PATH } from '@/base-path';

// The Metiv v3 content in /metiv-site-demo-v3/admin (docs/metiv-db-spec.md
// section 3), laid out the way the site is: a page tree (metivSiteMap.js) that
// mirrors the site's navigation, and for the chosen page its sections in the
// order the page shows them - Metiv collections, the page's editable texts,
// the PTSD-IL panels (rendered by Admin.jsx and passed in), and pointers to
// data edited on another page. One search box above the tree finds any text
// and opens the item that holds it. The current page lives in the URL
// (?page=...), so refresh and back keep the place.
//
// Only content is editable, never format: page copy shows its content keys
// only (copyContentKeys.js), collection items hide ids, routes, icons and
// layout headings (metivFieldRules.js), and the i18n texts shared with PTSD-IL
// are the ones in src/lib/editableI18nKeys.js, edited as site-copy override
// rows (SiteCopySection below).
//
// Every edit is staged like every other panel: "אישור" stages, the save-all
// dialog writes. A Hebrew change stages its AI translations
// (translationStaging.js); a change in another language tab writes only that
// row and stamps `_tr.by = 'human'`.

// ─── Data ────────────────────────────────────────────────────────────────────

const MetivStoreContext = createContext(/** @type {null | { store: import('@/api/metivAdminSource').MetivStore|null, loading: boolean, error: string }} */ (null));

// Loads every Metiv row once, and again after each save-all batch, for all
// sections to share. A reload swaps the store in place, so sections stay
// mounted and open editors keep their drafts (ServerChanged.jsx).
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
        // A failed refresh keeps what is on screen (and every open editor).
        setState(s => ({ store: s.store, loading: false, error: err?.message || 'שגיאה בטעינת תוכן מטיב' }));
      });
    return () => { cancelled = true; };
  }, [version]);
  return <MetivStoreContext.Provider value={state}>{children}</MetivStoreContext.Provider>;
}

const SiteCopyStoreContext = createContext(/** @type {null | { store: import('@/api/adminSiteCopy').SiteCopyStore|null, loading: boolean, error: string }} */ (null));

// The site-copy override rows, loaded once and again after each save-all batch.
function SiteCopyStoreProvider({ children }) {
  const { version } = usePendingChanges();
  const [state, setState] = useState({ store: null, loading: true, error: '' });
  useEffect(() => {
    let cancelled = false;
    setState(s => ({ ...s, loading: true }));
    loadSiteCopyRows()
      .then(store => { if (!cancelled) setState({ store, loading: false, error: '' }); })
      .catch(err => { if (!cancelled) setState(s => ({ store: s.store, loading: false, error: err?.message || 'שגיאה בטעינת הטקסטים' })); });
    return () => { cancelled = true; };
  }, [version]);
  return <SiteCopyStoreContext.Provider value={state}>{children}</SiteCopyStoreContext.Provider>;
}

function useSiteCopyStore() {
  const ctx = useContext(SiteCopyStoreContext);
  if (!ctx) throw new Error('useSiteCopyStore must be used inside <SiteCopyStoreProvider>');
  return ctx;
}

function useMetivStore() {
  const ctx = useContext(MetivStoreContext);
  if (!ctx) throw new Error('useMetivStore must be used inside <MetivStoreProvider>');
  return ctx;
}

/** The Hebrew rows of one collection, in order. */
function heRowsOf(store, slug) {
  return (store?.rows || []).filter(r => r.col === slug && r.langId === 'he').sort((a, b) => a.sortOrder - b.sortOrder);
}

/** A row in another language (same groupId), or null. */
function siblingIn(store, row, lang) {
  if (lang === 'he') return row;
  return store.rows.find(r => r.groupId === row.groupId && r.langId === lang) ?? null;
}

/** The Hebrew data by collection key - list contents, singleton content, string items - and the page copy (COPY), for select choices. */
function heCollections(store) {
  /** @type {Record<string, any>} */
  const out = {};
  for (const col of Object.values(COLLECTION_BY_KEY)) {
    const rows = heRowsOf(store, col.slug);
    if (col.kind === 'list') out[col.key] = rows.map(r => r.content);
    else if (col.kind === 'strings') out[col.key] = rows[0]?.content?.items ?? [];
    else out[col.key] = rows[0]?.content ?? {};
  }
  // The page copy by namespace, for choices labelled with a page's chip texts.
  out.COPY = Object.fromEntries(heRowsOf(store, COPY_SLUG).map(r => [r.key, r.content]));
  return out;
}

/** The items the tree builds pages for (a course page per course, an article page per article). */
function dynamicItems(store) {
  /** @type {Record<string, { key: string, title: string }[]>} */
  const out = {};
  for (const key of ['COURSES', 'ARTICLES']) {
    const col = COLLECTION_BY_KEY[key];
    out[key] = heRowsOf(store, col.slug).filter(r => !isRef(r.content)).map(r => ({ key: r.key, title: metivTitle(col.slug, r.content) }));
  }
  return out;
}

const withoutMeta = content => Object.fromEntries(Object.entries(content || {}).filter(([k]) => !k.startsWith('_')));

/**
 * What a section edits, resolved against the registry.
 * @typedef {{ id: string, kind: string, label: string, slug: string, collection?: string, scope: string, sectionName: string, titleField?: string, idField?: string, copyKey?: string, fields?: string[], itemKey?: string, keys?: string[] }} SectionMeta
 */

/** @param {any} section @param {import('./metivSiteMap').PageNode} page @param {Record<string, string>} ptsdLabels @returns {SectionMeta} */
function sectionMeta(section, page, ptsdLabels) {
  const where = `${page.areaLabel} / ${page.label}`;
  if (section.kind === 'copy') {
    const label = section.label || 'טקסטים בעמוד';
    return { id: section.id, kind: 'copy', label, slug: COPY_SLUG, scope: `metiv:copy:${section.ns}`, sectionName: `${where} / ${label}`, copyKey: section.ns };
  }
  if (section.kind === 'collection' || section.kind === 'item') {
    const col = COLLECTION_BY_KEY[section.key];
    const label = section.label || col.label;
    // A list shares one scope wherever it shows (new items and the order are
    // matched on it); a singleton's scope is per page, since a page may show
    // only some of its fields.
    const scope = col.kind === 'list' ? `metiv:${col.slug}` : `metiv:${col.slug}:${page.id}`;
    return {
      id: section.id, kind: section.kind === 'item' ? 'item' : col.kind, label, slug: col.slug, collection: col.key, scope,
      sectionName: `${where} / ${label}`, titleField: col.titleField, idField: col.idField, fields: section.fields, itemKey: section.itemKey,
    };
  }
  if (section.kind === 'i18n') {
    const label = section.label || 'טקסטים בעמוד (משותפים עם PTSD-IL)';
    return { id: section.id, kind: 'i18n', label, slug: '', scope: 'sitecopy', sectionName: `${where} / ${label}`, keys: section.keys ?? [] };
  }
  const label = section.label || ptsdLabels[section.panel] || '';
  return { id: section.id, kind: section.kind, label, slug: '', scope: section.panel || section.kind, sectionName: `${where} / ${label}` };
}

// ─── Staging ─────────────────────────────────────────────────────────────────

/** Staging for one section: Hebrew edits (with translations) and per-language edits. */
function useMetivStaging(meta, store) {
  const { changes, stage, discard, newKey } = usePendingChanges();
  const stageTranslations = useStageTranslations();
  const { sectionName, scope, slug } = meta;
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
    if (meta.idField && isTechnicalKey(meta.idField) && !full[meta.idField]) full[meta.idField] = _key;
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
 * @param {boolean} [props.reveal]  scroll the open editor into view (a search result)
 * @param {'rtl'|'ltr'} props.dir
 * @param {boolean} props.structureLocked
 * @param {(ref: string) => { label: string, title: string }} props.resolve
 * @param {React.ReactNode} [props.summary]  replaces the card's text summary
 * @param {{ labels?: Record<string, string>, help?: Record<string, string>, lockedKeys?: string[], rules?: any }} [props.editorProps]
 * @param {any} [props.server]  the server's copy of the item, to tell when it changes under an open editor
 * @param {boolean} [props.locked]  a staged create the running save is writing: not editable until it lands
 */
export function ItemCard({ content, title, status, onConfirm, onCancel, onDelete, onDiscard, onUp, onDown, extra, startInEdit = false, reveal = false, dir, structureLocked, resolve, summary, editorProps, server, locked = false }) {
  const [editing, setEditing] = useState(startInEdit);
  const [draft, setDraft] = useState(content);
  const changed = useChangedWhileOpen(editing, server, content);
  const box = useRef(/** @type {HTMLDivElement|null} */ (null));
  const badge = status && STATUS_BADGES[status];
  const ref = isRef(content);

  useEffect(() => { if (reveal && editing) revealElement(box.current); }, [reveal, editing]);

  if (editing) {
    return (
      <div ref={box} className="p-4 rounded-xl border border-primary/40 bg-background space-y-3">
        {changed && <ServerChangedNote />}
        <ContentEditor value={draft} onChange={setDraft} dir={dir} structureLocked={structureLocked} resolveRef={resolve} {...editorProps} />
        <EditorButtons
          onConfirm={() => { if (onConfirm(draft) !== false) setEditing(false); }}
          onCancel={() => { setDraft(content); setEditing(false); onCancel?.(); }}
        />
      </div>
    );
  }

  const shownTitle = ref ? (() => { const t = resolve(content.$ref); return t.title || t.label; })() : title;
  return (
    <div className={`relative p-4 rounded-xl border bg-background ${badge ? 'border-warning/60' : 'border-border'}`}>
      {(badge || extra) && (
        <div className="flex items-center gap-2 mb-2 flex-wrap pe-28">
          {badge && <Badge color={badge.color}>{locked ? 'נשמר כעת...' : badge.label}</Badge>}
          {extra}
          {onDiscard && !locked && <DiscardButton onClick={onDiscard} />}
        </div>
      )}
      <div className={`pe-28 ${status === 'delete' ? 'opacity-50 line-through' : ''}`}>
        <p className="font-medium text-foreground" dir="auto">{shownTitle}</p>
        {ref
          ? <p className="text-xs text-muted-foreground mt-1">מופיע מתוך: {resolve(content.$ref).label}. נערך במקום המקורי שלו.</p>
          : summary ?? <p className="text-sm text-muted-foreground mt-1 line-clamp-2" dir="auto">{itemSummary(content)}</p>}
      </div>
      {status !== 'delete' && !locked && (
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

/** A collection list (or, on an item page, the one item). */
function ListSection({ meta, store }) {
  const lang = useAdminLang();
  const hebrew = lang.id === 'he';
  const focus = useAdminFocus();
  const s = useMetivStaging(meta, store);
  const { changes, stage, discard, newKey } = s;
  const { running } = usePendingChanges();
  const [creating, setCreating] = useState(false);
  const resolve = ref => resolveRef(store, ref);
  const he = useMemo(() => heCollections(store), [store]);
  const rules = useMemo(() => fieldRules({ collection: meta.collection, he, translation: !hebrew }), [meta.collection, he, hebrew]);
  const editorProps = { rules };
  const single = meta.kind === 'item';

  const allHe = heRowsOf(store, meta.slug);
  const heRows = single ? allHe.filter(r => r.key === meta.itemKey) : allHe;
  const pending = changes.filter(c => c.scope === meta.scope && !c.linkedTo);
  const orderKey = `${meta.scope}:order`;
  const orderChange = !single && pending.find(c => c.key === orderKey);
  const ordered = orderChange
    ? orderChange.draft.order.map(id => heRows.find(r => r.id === id)).filter(Boolean)
    : heRows;
  const creates = single ? [] : pending.filter(c => c.action === 'create' && !c.lang);
  const sample = heRows.find(r => !isRef(r.content))?.content;
  const blank = sample ? blankLike(sample) : { [meta.titleField || 'title']: '' };
  const takenKeys = new Set([...allHe.map(r => r.key), ...creates.map(c => c.draft.content._key)]);
  const nextSort = Math.max(-1, ...allHe.map(r => r.sortOrder), ...creates.map(c => c.draft.sortOrder)) + 1;
  const focused = row => focus?.sectionId === meta.id && focus?.rowId === row.id;

  function move(index, delta) {
    const ids = ordered.map(r => r.id);
    const t = index + delta;
    if (t < 0 || t >= ids.length) return;
    [ids[index], ids[t]] = [ids[t], ids[index]];
    if (ids.every((id, i) => id === heRows[i].id)) { discard(orderKey); return; }
    const titles = rows => rows.map((r, i) => `${i + 1}. ${s.titleOf(r.content)}`).join('\n');
    const nextRows = ids.map(id => heRows.find(r => r.id === id));
    stage({
      key: orderKey, scope: meta.scope, section: s.sectionName, action: 'update', title: 'סדר הפריטים',
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
      <div className="space-y-3">
        {ordered.map((row, i) => {
          const open = focused(row);
          if (hebrew) {
            const key = `metiv:${row.id}`;
            const p = changes.find(c => c.key === key);
            const content = p?.action === 'update' ? p.draft.content : row.content;
            return (
              <ItemCard
                key={open ? `${row.id}:${focus.nonce}` : row.id}
                content={content}
                title={s.titleOf(content)}
                status={p?.action}
                extra={p ? <TranslationSummary heKey={key} /> : null}
                onDiscard={p ? () => discard(key) : undefined}
                server={row.content}
                onConfirm={c => s.stageHeUpdate(row, c)}
                onDelete={single ? undefined : () => s.stageHeDelete(row)}
                onUp={!single && i > 0 ? () => move(i, -1) : undefined}
                onDown={!single && i < ordered.length - 1 ? () => move(i, 1) : undefined}
                startInEdit={open || single}
                reveal={open}
                dir={lang.dir}
                structureLocked={false}
                resolve={resolve}
                editorProps={editorProps}
              />
            );
          }
          const sib = s.siblingsOf(row)[lang.id];
          const key = sib ? `metiv:${sib.id}` : `metiv:new:${row.groupId}:${lang.id}`;
          const p = changes.find(c => c.key === key);
          const content = p ? p.draft.content : sib?.content ?? row.content;
          const translating = changes.some(c => c.linkedTo === `metiv:${row.id}` && c.lang === lang.id);
          // Keyed by the item and language, not the sibling's id: a save that
          // creates the translation must not remount an open editor.
          const cardKey = `${row.id}:${lang.id}`;
          return (
            <ItemCard
              key={open ? `${cardKey}:${focus.nonce}` : cardKey}
              server={sib?.content}
              content={content}
              title={s.titleOf(content)}
              status={p?.action}
              extra={!sib && !p
                ? <Badge color="bg-muted text-muted-foreground">טרם תורגם - מוצג הנוסח העברי</Badge>
                : translating ? <Badge color={TRANSLATION_BADGES.pending.color}>תרגום מהעברית ממתין לשמירה</Badge> : null}
              onDiscard={p ? () => discard(key) : undefined}
              onConfirm={c => s.stageHuman(row, sib, lang.id, c)}
              startInEdit={open || single}
              reveal={open}
              dir={lang.dir}
              structureLocked
              resolve={resolve}
              editorProps={editorProps}
            />
          );
        })}
        {hebrew && creates.map(c => (
          <ItemCard
            key={c.key}
            content={c.draft.content}
            title={c.title}
            status="create"
            locked={running.has(c)}
            extra={<TranslationSummary heKey={c.key} />}
            onDiscard={() => discard(c.key)}
            onConfirm={content => s.stageHeCreate(c.key, content, c.draft.sortOrder, takenKeys)}
            dir={lang.dir}
            structureLocked={false}
            resolve={resolve}
            editorProps={editorProps}
          />
        ))}
        {hebrew && creating && (
          <ItemCard
            content={blank}
            title=""
            startInEdit
            onConfirm={content => { s.stageHeCreate(newKey(meta.scope), content, nextSort, takenKeys); setCreating(false); }}
            onCancel={() => setCreating(false)}
            dir={lang.dir}
            structureLocked={false}
            resolve={resolve}
            editorProps={editorProps}
          />
        )}
      </div>
      {hebrew && !single && (
        <div className="mt-3">
          <AddNewButton label="הוספת פריט חדש" onClick={() => setCreating(true)} />
        </div>
      )}
    </div>
  );
}

// Always open. It follows what it shows (the staged draft, else the server
// copy) while the editor has not typed anything new, and keeps the draft once
// they have - a background save or refresh landing never resets typing.
function SingleForm({ initial, server, onConfirm, dir, structureLocked, resolve, rules, labels, focusPath, plainText = false }) {
  const [draft, setDraft] = useState(initial);
  const [adopted, setAdopted] = useState(initial);
  const [rebase, setRebase] = useState(0);
  const initialJson = JSON.stringify(initial ?? null);
  useEffect(() => {
    if (sameJson(initial, adopted)) return;
    if (sameJson(draft, adopted) || sameJson(draft, initial)) {
      setDraft(initial);
      setAdopted(initial);
      setRebase(r => r + 1);
    }
  }, [initialJson]); // eslint-disable-line react-hooks/exhaustive-deps
  const changed = useChangedWhileOpen(true, server, adopted, { rebase });
  const box = useRef(/** @type {HTMLDivElement|null} */ (null));
  useEffect(() => {
    if (!focusPath || !box.current) return;
    revealElement(box.current.querySelector(`[data-path="${focusPath}"]`) ?? box.current);
  }, [focusPath]);
  return (
    <div ref={box} className="space-y-3">
      {changed && <ServerChangedNote />}
      <ContentEditor value={draft} onChange={setDraft} dir={dir} structureLocked={structureLocked} resolveRef={resolve} rules={rules} labels={labels} plainText={plainText} />
      <EditorButtons onConfirm={() => onConfirm(draft)} onCancel={() => setDraft(initial)} cancelLabel="איפוס הטופס" />
    </div>
  );
}

/** A singleton (or the shown part of one), or a page's editable texts. */
function SingleSection({ meta, store }) {
  const lang = useAdminLang();
  const hebrew = lang.id === 'he';
  const focus = useAdminFocus();
  const s = useMetivStaging(meta, store);
  // Bumped by "discard", which resets the form to what the server holds.
  const [reset, setReset] = useState(0);
  const he = useMemo(() => heCollections(store), [store]);
  const rules = useMemo(() => (meta.kind === 'copy'
    ? fieldRules({ copyKeys: copyContentKeys(meta.copyKey) })
    : fieldRules({ collection: meta.collection, fields: meta.fields, he, translation: !hebrew })), [meta, he, hebrew]);
  const heRow = store.rows.find(r => r.col === meta.slug && r.langId === 'he' && (meta.kind !== 'copy' || r.key === meta.copyKey));
  if (!heRow) {
    return <p className="text-sm text-muted-foreground">אין עדיין שורה במסד לתוכן הזה. יש לייבא אותו קודם (scripts/metiv-seed/import.mjs).</p>;
  }
  const sib = hebrew ? null : s.siblingsOf(heRow)[lang.id];
  const key = hebrew ? `metiv:${heRow.id}` : sib ? `metiv:${sib.id}` : `metiv:new:${heRow.groupId}:${lang.id}`;
  const p = s.changes.find(c => c.key === key);
  const base = hebrew ? heRow.content : sib?.content ?? heRow.content;
  const shown = p?.draft?.content ?? base;
  const badge = p && STATUS_BADGES[p.action];
  const focusPath = focus?.sectionId === meta.id ? focus.path : undefined;

  return (
    <div>
      {(badge || (!hebrew && !sib && !p)) && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {badge && <Badge color={badge.color}>{badge.label}</Badge>}
          {hebrew && p && <TranslationSummary heKey={key} />}
          {!hebrew && !sib && !p && <Badge>טרם תורגם - מוצג הנוסח העברי</Badge>}
          {p && <DiscardButton onClick={() => { s.discard(key); setReset(r => r + 1); }} />}
        </div>
      )}
      <SingleForm
        key={`${heRow.id}:${lang.id}:${reset}:${focusPath ? focus.nonce : ''}`}
        initial={shown}
        server={hebrew ? heRow.content : sib?.content}
        onConfirm={c => (hebrew ? s.stageHeUpdate(heRow, c) : s.stageHuman(heRow, sib, lang.id, c))}
        dir={lang.dir}
        structureLocked={!hebrew}
        resolve={ref => resolveRef(store, ref)}
        rules={rules}
        labels={meta.kind === 'copy' ? COPY_CONTENT_KEYS[meta.copyKey] : undefined}
        focusPath={focusPath}
        plainText={meta.kind === 'copy'}
      />
    </div>
  );
}

// ─── Site copy (i18n texts shared with PTSD-IL) ──────────────────────────────

/** The text the site ships for a key in a language (src/lib/i18n.js), or ''. */
function shippedText(key, lang) {
  const v = /** @type {any} */ (translations)[lang]?.[key];
  return typeof v === 'string' ? v : '';
}

/**
 * What a key shows in a language, the way t() resolves it: the language's
 * override, its shipped text, then the Hebrew override and shipped text.
 * @param {import('@/api/adminSiteCopy').SiteCopyStore} store @param {string} key @param {string} lang
 */
function siteCopyText(store, key, lang) {
  const own = siteCopyRow(store, key, lang)?.text || shippedText(key, lang);
  if (own || lang === 'he') return own;
  return siteCopyRow(store, key, 'he')?.text || shippedText(key, 'he');
}

/** Change keys: the Hebrew edit (and the revert of every language), a hand edit in another language. */
export const siteCopyKey = (/** @type {string} */ key, /** @type {string} */ lang = 'he') => (lang === 'he' ? `sitecopy:${key}` : `sitecopy:${key}:${lang}`);
const siteCopyScope = (/** @type {string} */ key) => `sitecopy:${key}`;

/** Staging for the site-copy texts of one section. */
function useSiteCopyStaging(meta, store) {
  const { changes, stage, discard } = usePendingChanges();
  const stageTranslations = useStageTranslations();
  const section = meta.sectionName;
  const rowOf = (key, lang) => siteCopyRow(store, key, lang);
  // The key's rows share one groupId: the Hebrew row's, else any language's.
  const groupOf = key => rowOf(key, 'he')?.groupId ?? store.rows.find(r => r.key === key)?.groupId;

  /** A Hebrew edit: the Hebrew row, and the AI translation of the four others. */
  function stageHe(key, text) {
    const heKey = siteCopyKey(key);
    const row = rowOf(key, 'he');
    const before = siteCopyText(store, key, 'he');
    const title = siteCopyLabel(key).label;
    if (text === before) { discard(heKey); return; }
    const groupRef = { groupId: groupOf(key) };
    const content = { ...(row?.content ?? {}), text };
    discard(heKey);
    stage({
      key: heKey, scope: siteCopyScope(key), section, action: row ? 'update' : 'create', ...(row ? { itemId: row.id } : {}),
      title, draft: { text }, diff: [{ label: 'נוסח', before, after: text }],
      run: () => (row
        ? updateSiteCopyRow(row, content)
        : createSiteCopyRow(store, { key, lang: 'he', content, groupId: groupRef.groupId, onSaved: saved => { groupRef.groupId = groupRef.groupId ?? saved?.groupId; } })),
    });
    // A language with no override row yet translates from its shipped text.
    const siblings = Object.fromEntries(TARGET_LANGS.map(l => {
      const r = rowOf(key, l);
      if (r) return [l, { id: r.id, title: key, content: r.content }];
      const shipped = shippedText(key, l);
      return [l, shipped ? { id: '', title: key, content: { text: shipped } } : null];
    }));
    stageTranslations({
      heKey, scope: siteCopyScope(key), section, title,
      context: `${title}${siteCopyLabel(key).where ? ` (${siteCopyLabel(key).where})` : ''}`,
      handEdited: lang => changes.some(c => c.key === siteCopyKey(key, lang)),
      prepare: async () => ({
        oldContent: { text: before },
        newContent: { text },
        siblings,
        write: (lang, built) => {
          const r = rowOf(key, lang);
          return r ? updateSiteCopyRow(r, built.content) : createSiteCopyRow(store, { key, lang, content: built.content, groupId: groupRef.groupId });
        },
      }),
    });
  }

  /** A hand edit in another language: that row only, stamped as edited by hand. */
  function stageHuman(key, lang, text) {
    const ck = siteCopyKey(key, lang);
    const row = rowOf(key, lang);
    const before = siteCopyText(store, key, lang);
    if (text === before) { discard(ck); return; }
    const content = { ...(row?.content ?? {}), text, _tr: humanStamp() };
    stage({
      key: ck, scope: siteCopyScope(key), section, lang, action: row ? 'update' : 'create', ...(row ? { itemId: row.id } : {}),
      title: `${siteCopyLabel(key).label} (${LANG_BY_ID[lang].label})`, draft: { text }, diff: [{ label: 'נוסח', before, after: text }],
      run: () => (row ? updateSiteCopyRow(row, content) : createSiteCopyRow(store, { key, lang, content, groupId: groupOf(key) })),
    });
  }

  /** Back to the shipped text: deletes the override rows (every language from the Hebrew tab). */
  function stageRevert(key, lang) {
    const title = siteCopyLabel(key).label;
    const original = shippedText(key, lang) || shippedText(key, 'he');
    if (lang !== 'he') {
      const row = rowOf(key, lang);
      if (!row) return;
      stage({
        key: siteCopyKey(key, lang), scope: siteCopyScope(key), section, lang, action: 'delete', itemId: row.id,
        title: `${title} (${LANG_BY_ID[lang].label}): חזרה לנוסח המקורי`, diff: [{ label: 'נוסח', before: row.text, after: original }],
        run: () => removeSiteCopyRow(row.id),
      });
      return;
    }
    const heKey = siteCopyKey(key);
    const row = rowOf(key, 'he');
    discard(heKey);
    for (const l of TARGET_LANGS) discard(siteCopyKey(key, l));
    stage({
      key: heKey, scope: siteCopyScope(key), section, action: 'delete', ...(row ? { itemId: row.id } : {}),
      title: `${title}: חזרה לנוסח המקורי בכל השפות`,
      diff: row ? [{ label: 'נוסח', before: row.text, after: original }] : [],
      run: async () => (row ? removeSiteCopyRow(row.id) : null),
    });
    stageSiblingDeletes(stage, {
      heKey, scope: siteCopyScope(key), section, title: `${title}: חזרה לנוסח המקורי`,
      siblings: Object.fromEntries(TARGET_LANGS.map(l => { const r = rowOf(key, l); return [l, r && { id: r.id, title: key, content: r.content }]; })),
      remove: removeSiteCopyRow,
    });
  }

  return { changes, discard, stageHe, stageHuman, stageRevert };
}

/** One editable i18n text: its name, where it shows, its text in the tab's language. */
function SiteCopyCard({ k, store, s, lang, open }) {
  const hebrew = lang.id === 'he';
  const { label, where } = siteCopyLabel(k);
  const ck = siteCopyKey(k, lang.id);
  const p = s.changes.find(c => c.key === ck);
  const row = siteCopyRow(store, k, lang.id);
  const overridden = hebrew ? store.rows.some(r => r.key === k) : Boolean(row);
  const reverting = p?.action === 'delete';
  const current = siteCopyText(store, k, lang.id);
  const shown = reverting ? (shippedText(k, lang.id) || shippedText(k, 'he')) : p?.draft?.text ?? current;
  const [editing, setEditing] = useState(open);
  const [draft, setDraft] = useState(shown);
  const changed = useChangedWhileOpen(editing, current, shown);
  const box = useRef(/** @type {HTMLDivElement|null} */ (null));
  const id = `sitecopy-${k}-${lang.id}`;
  // A first override row is a create, but to the editor it is an edit of the text.
  const badge = p && STATUS_BADGES[p.action === 'delete' ? 'delete' : 'update'];
  const translating = !hebrew && s.changes.some(c => c.linkedTo === siteCopyKey(k) && c.lang === lang.id);
  useEffect(() => { if (open) revealElement(box.current); }, [open]);

  function confirm() {
    const text = draft.trim();
    if (!text) { toast.error('הטקסט ריק. כדי לחזור לנוסח המקורי יש ללחוץ על "חזרה לנוסח המקורי".'); return; }
    if (hebrew) s.stageHe(k, text); else s.stageHuman(k, lang.id, text);
    setEditing(false);
  }

  return (
    <div ref={box} className={`relative p-4 rounded-xl border bg-background ${badge ? 'border-warning/60' : editing ? 'border-primary/40' : 'border-border'}`}>
      <div className="flex items-center gap-2 flex-wrap pe-20">
        <label htmlFor={id} className="font-medium text-foreground">{label}</label>
        {badge
          ? <Badge color={badge.color}>{reverting ? 'יחזור לנוסח המקורי בשמירה' : badge.label}</Badge>
          : <Badge color={overridden ? 'bg-info/10 text-info' : 'bg-muted text-muted-foreground'}>{overridden ? 'נוסח שנערך' : 'הנוסח המקורי של האתר'}</Badge>}
        {hebrew && p && !reverting && <TranslationSummary heKey={ck} />}
        {translating && <Badge color={TRANSLATION_BADGES.pending.color}>תרגום מהעברית ממתין לשמירה</Badge>}
        {p && <DiscardButton onClick={() => s.discard(ck)} />}
      </div>
      {where && <p className="text-xs text-muted-foreground mt-1">{where}</p>}
      {editing ? (
        <div className="space-y-2 mt-2">
          {changed && <ServerChangedNote />}
          <textarea
            id={id}
            dir={lang.dir}
            rows={3}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground leading-relaxed resize-y"
          />
          <EditorButtons onConfirm={confirm} onCancel={() => { setDraft(shown); setEditing(false); }} />
        </div>
      ) : (
        <p id={id} className={`text-sm text-muted-foreground mt-2 whitespace-pre-line ${reverting ? 'opacity-70' : ''}`} dir={lang.dir}>{shown}</p>
      )}
      {!editing && (
        <div className="absolute top-3 end-3 flex gap-1">
          <IconBtn icon={Pencil} title="עריכה" onClick={() => { setDraft(shown); setEditing(true); }} />
          {overridden && !reverting && (
            <IconBtn icon={RotateCcw} title={hebrew ? 'חזרה לנוסח המקורי (בכל השפות)' : 'חזרה לנוסח המקורי'} onClick={() => s.stageRevert(k, lang.id)} />
          )}
        </div>
      )}
    </div>
  );
}

/** A page's i18n texts. They are shared with PTSD-IL: one row per text per language. */
function SiteCopySection({ meta }) {
  const lang = useAdminLang();
  const focus = useAdminFocus();
  const { store, loading, error } = useSiteCopyStore();
  const s = useSiteCopyStaging(meta, store || { categoryId: null, rows: [] });
  if (loading && !store) return <LoadingRow />;
  if (!store) return <p className="text-sm text-destructive py-6 text-center">{error || 'שגיאה בטעינת הטקסטים'}</p>;
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground leading-relaxed">
        הטקסטים האלה משותפים לאתר PTSD-IL: שינוי כאן משנה אותם גם שם. עריכה בעברית מתורגמת לשאר השפות.
      </p>
      {meta.keys.map(k => {
        const open = focus?.sectionId === meta.id && focus.path === k;
        return (
          <SiteCopyCard
            key={`${k}:${lang.id}:${open ? focus.nonce : ''}`}
            k={k}
            store={store}
            s={s}
            lang={lang}
            open={open}
          />
        );
      })}
    </div>
  );
}

function MetivSectionBody({ meta }) {
  const { store, loading, error } = useMetivStore();
  if (loading && !store) return <LoadingRow />;
  if (!store) return <p className="text-sm text-destructive py-6 text-center">{error || 'שגיאה בטעינת תוכן מטיב'}</p>;
  return meta.kind === 'list' || meta.kind === 'item'
    ? <ListSection key={meta.id} meta={meta} store={store} />
    : <SingleSection key={meta.id} meta={meta} store={store} />;
}

/** How many of a section's items there are, for its card header. */
function sectionCount(meta, store) {
  if (!store || meta.kind !== 'list') return null;
  return heRowsOf(store, meta.slug).length;
}

/** Staged changes (the editor's own, not the translations riding along) per section. */
function sectionPending(section, meta, changes, store) {
  const own = changes.filter(c => !c.linkedTo);
  if (section.kind === 'ptsd') return own.filter(c => c.scope.split(':')[0] === section.panel).length;
  if (section.kind === 'qa') return own.filter(c => c.scope.split(':')[0] === 'chatbot_qa').length;
  if (section.kind === 'item') {
    const row = heRowsOf(store, meta.slug).find(r => r.key === meta.itemKey);
    if (!row) return 0;
    const ids = new Set(store.rows.filter(r => r.groupId === row.groupId).map(r => r.id));
    return own.filter(c => c.scope === meta.scope && ids.has(c.itemId)).length;
  }
  if (section.kind === 'collection' || section.kind === 'copy') return own.filter(c => c.scope === meta.scope).length;
  if (section.kind === 'i18n') {
    const scopes = new Set((section.keys ?? []).map(siteCopyScope));
    return own.filter(c => scopes.has(c.scope)).length;
  }
  return 0;
}

// ─── Page ────────────────────────────────────────────────────────────────────

const PageContext = createContext(/** @type {any} */ (null));

function LinkSection({ section }) {
  const { pagesById, goTo } = useContext(PageContext);
  const target = pagesById[section.to];
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap rounded-xl border border-dashed border-border px-4 py-3">
      <span className="text-sm text-foreground">{section.label}</span>
      <Button type="button" variant="link" size="none" onClick={() => goTo(section.to)} className="text-sm gap-1">
        עריכה בעמוד {target?.label ?? section.to} <ChevronLeft className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

function SectionCard({ section, page }) {
  const { ptsdLabels, renderPtsd, renderTool } = useContext(PageContext);
  const { store } = useMetivStore();
  const { changes } = usePendingChanges();
  const meta = sectionMeta(section, page, ptsdLabels);

  if (section.kind === 'link') return <div id={`sec-${section.id}`}><LinkSection section={section} /></div>;
  const pending = store ? sectionPending(section, meta, changes, store) : 0;
  // The PTSD-IL panels and the tools carry their own heading and count.
  const own = section.kind === 'ptsd' || section.kind === 'qa' || section.kind === 'users' || section.kind === 'log';
  const count = sectionCount(meta, store);
  return (
    <section id={`sec-${section.id}`} aria-label={meta.label} className="bg-card rounded-super border border-border p-5 sm:p-6 shadow-card min-w-0 scroll-mt-24">
      {!own && (
        <header className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h3 className="font-heading font-semibold text-lg text-foreground">{meta.label}</h3>
          <span className="flex items-center gap-2">
            {pending > 0 && <Badge color="bg-warning/20 text-foreground">{pending} ממתינים לשמירה</Badge>}
            {count !== null && <Badge color="bg-primary/10 text-primary">{count} פריטים</Badge>}
          </span>
        </header>
      )}
      {section.kind === 'ptsd' && renderPtsd(section.panel)}
      {(section.kind === 'qa' || section.kind === 'users' || section.kind === 'log') && renderTool(section.kind)}
      {(section.kind === 'collection' || section.kind === 'item' || section.kind === 'copy') && <MetivSectionBody meta={meta} />}
      {section.kind === 'i18n' && <SiteCopySection meta={meta} />}
    </section>
  );
}

/** @param {{ page: import('./metivSiteMap').PageNode, trail: import('./metivSiteMap').PageNode[] }} props */
function PageView({ page, trail }) {
  const { goTo } = useContext(PageContext);
  const focus = useAdminFocus();
  const sections = page.sections;
  const editable = sections.filter(s => s.kind !== 'link');

  useEffect(() => {
    if (!focus?.sectionId || focus.rowId || focus.path || focus.itemId || focus.qaId) return;
    revealElement(document.getElementById(`sec-${focus.sectionId}`));
  }, [focus]);

  return (
    <div className="space-y-5 min-w-0">
      <div>
        <nav aria-label="מיקום העמוד" className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
          <span>{page.areaLabel}</span>
          {trail.map(t => (
            <React.Fragment key={t.id}>
              <ChevronLeft className="w-3 h-3" aria-hidden="true" />
              <Button type="button" variant="quiet" size="none" onClick={() => goTo(t.id)} className="text-xs">{t.label}</Button>
            </React.Fragment>
          ))}
        </nav>
        <div className="flex items-center justify-between gap-3 flex-wrap mt-1">
          <h2 className="font-heading font-semibold text-2xl text-foreground">{page.label}</h2>
          {page.route && (
            <a
              href={`${BASE_PATH}${BASE}${page.route === '/' ? '' : page.route}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
            >
              פתיחת העמוד באתר <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
        {page.alsoIn && (
          <p className="mt-2 text-sm text-muted-foreground">
            עמוד אחד עם כל התוכן של מסע שחרור: הוא מוצג גם באזור המטופלים וגם באזור אנשי המקצוע, וכל שינוי כאן מופיע בשניהם.
          </p>
        )}
      </div>
      {!editable.length && <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">{page.note || 'אין בעמוד הזה תוכן לעריכה.'}</p>}
      {sections.map(s => <SectionCard key={s.id} section={s} page={page} />)}
    </div>
  );
}

// ─── Tree ────────────────────────────────────────────────────────────────────

function TreeNode({ node, depth, current, expanded, toggle, onPick, countOf }) {
  const hasChildren = node.children.length > 0;
  const open = expanded.has(node.id);
  const target = node.aliasOf || node.id;
  const count = countOf(node);
  return (
    <li>
      <div className="flex items-center gap-0.5" style={{ paddingInlineStart: `${depth * 0.875}rem` }}>
        {hasChildren ? (
          <Button type="button" variant="quiet" size="none" onClick={() => toggle(node.id)} aria-expanded={open} title={open ? 'קיפול' : 'פתיחה'} className="p-1 flex-shrink-0">
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? '' : 'ltr:-rotate-90 rtl:rotate-90'}`} />
          </Button>
        ) : <span className="w-[1.375rem] flex-shrink-0" aria-hidden="true" />}
        <ChoiceChip
          variant="plain"
          size="list"
          selected={current === target}
          aria-current={current === target ? 'page' : undefined}
          onClick={() => onPick(target)}
          className="flex items-center justify-between gap-2 py-1.5 px-2.5"
        >
          <span className="min-w-0">
            {node.label}
            {node.aliasOf && <span className="block text-[11px] opacity-80">אותו עמוד כמו באזור המטופלים</span>}
          </span>
          {count > 0 && <Badge color="bg-warning/20 text-foreground">{count}</Badge>}
        </ChoiceChip>
      </div>
      {hasChildren && open && (
        <ul className="mt-0.5 space-y-0.5">
          {node.children.map(c => (
            <TreeNode key={c.id} node={c} depth={depth + 1} current={current} expanded={expanded} toggle={toggle} onPick={onPick} countOf={countOf} />
          ))}
        </ul>
      )}
    </li>
  );
}

function Sidebar({ tree, current, expanded, toggle, onPick, countOf, query, setQuery }) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <label htmlFor="metiv-admin-search" className="sr-only">חיפוש בתוכן</label>
        <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground pointer-events-none" aria-hidden="true" />
        <input
          id="metiv-admin-search"
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="חיפוש בכל התוכן"
          className="w-full ps-9 pe-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground"
        />
      </div>
      <nav aria-label="עמודי האתר" className="space-y-1">
        {tree.map(area => {
          const open = expanded.has(`area:${area.id}`);
          const total = area.pages.reduce((n, p) => n + countOf(p, true), 0);
          return (
            <div key={area.id}>
              <Button
                type="button"
                variant="quiet"
                size="none"
                onClick={() => toggle(`area:${area.id}`)}
                aria-expanded={open}
                className="w-full justify-between gap-2 px-2 py-2 text-xs font-semibold text-foreground"
              >
                <span className="flex items-center gap-1.5">
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? '' : 'ltr:-rotate-90 rtl:rotate-90'}`} />
                  {area.label}
                </span>
                {total > 0 && <Badge color="bg-warning/20 text-foreground">{total}</Badge>}
              </Button>
              {open && (
                <ul className="space-y-0.5 pb-2">
                  {area.pages.map(p => (
                    <TreeNode key={p.id} node={p} depth={0} current={current} expanded={expanded} toggle={toggle} onPick={onPick} countOf={countOf} />
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

// ─── Search ──────────────────────────────────────────────────────────────────

/** Every visible string leaf of a content object under the rules: [{ path, key, text }]. */
function visibleLeaves(value, rules) {
  /** @type {{ path: string, key: string, text: string }[]} */
  const out = [];
  const walk = (v, path, key) => {
    if (typeof v === 'string') { if (v.trim()) out.push({ path, key, text: v }); return; }
    if (Array.isArray(v)) { v.forEach((x, i) => walk(x, path ? `${path}.${i}` : String(i), key)); return; }
    if (v && typeof v === 'object' && !isRef(v) && !isNavLink(v)) {
      for (const [k, x] of Object.entries(v)) {
        const p = path ? `${path}.${k}` : k;
        const pattern = patternOf(p);
        if (rules.visible(pattern, k, x, v) && hasVisible(x, pattern, rules.visible)) walk(x, p, k);
      }
    }
  };
  walk(value, '', '');
  return out;
}

/** Search entries for the Metiv rows and the site-copy texts of every page, in one language. */
function metivEntries(pages, store, siteCopy, lang, ptsdLabels) {
  /** @type {import('./adminSearch').SearchEntry[]} */
  const out = [];
  const he = store ? heCollections(store) : {};
  for (const page of pages) {
    if (page.aliasOf) continue;
    for (const section of page.sections) {
      if (section.kind === 'i18n') {
        if (!siteCopy) continue;
        const meta = sectionMeta(section, page, ptsdLabels);
        for (const k of section.keys ?? []) {
          const { label, where } = siteCopyLabel(k);
          out.push({
            pageId: page.id, sectionId: section.id, sectionLabel: meta.label, title: label,
            text: [siteCopyText(siteCopy, k, lang), where].filter(Boolean).join(' · '), focus: { sectionId: section.id, path: k },
          });
        }
        continue;
      }
      if (!store || (section.kind !== 'collection' && section.kind !== 'copy')) continue;
      const meta = sectionMeta(section, page, ptsdLabels);
      const base = { pageId: page.id, sectionId: section.id, sectionLabel: meta.label };
      if (meta.kind === 'copy') {
        const row = heRowsOf(store, COPY_SLUG).find(r => r.key === meta.copyKey);
        if (!row) continue;
        const content = siblingIn(store, row, lang)?.content ?? row.content;
        for (const [k, label] of Object.entries(COPY_CONTENT_KEYS[meta.copyKey] ?? {})) {
          if (typeof content[k] === 'string') out.push({ ...base, title: label, text: content[k], focus: { sectionId: section.id, path: k } });
        }
        continue;
      }
      const rules = fieldRules({ collection: meta.collection, fields: meta.fields, he });
      const rows = heRowsOf(store, meta.slug);
      if (meta.kind === 'list') {
        for (const row of rows) {
          if (isRef(row.content)) continue;
          const content = siblingIn(store, row, lang)?.content ?? row.content;
          out.push({
            ...base, title: metivTitle(meta.slug, content), text: visibleLeaves(content, rules).map(l => l.text).join(' · '),
            focus: { sectionId: section.id, rowId: row.id },
          });
        }
      } else if (rows[0]) {
        const content = siblingIn(store, rows[0], lang)?.content ?? rows[0].content;
        const leaves = meta.kind === 'strings' ? (content.items || []).map((t, i) => ({ path: `items.${i}`, key: 'items', text: t })) : visibleLeaves(content, rules);
        for (const l of leaves) {
          const last = l.path.split('.').filter(x => !/^\d+$/.test(x)).pop() || l.key;
          out.push({ ...base, title: `${meta.label}: ${fieldLabel(last)}`, text: l.text, focus: { sectionId: section.id, path: l.path } });
        }
      }
    }
  }
  return out;
}

function SearchResults({ query, groups, pagesById, onOpen, onClear, loadingMore }) {
  const total = groups.reduce((n, [, hits]) => n + hits.length, 0);
  return (
    <div className="space-y-4 min-w-0">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-heading font-semibold text-xl text-foreground">
          {total ? `${total} תוצאות ל"${query}"` : `אין תוצאות ל"${query}"`}
        </h2>
        <Button type="button" variant="subtle" size="xs" onClick={onClear} className="gap-1.5 rounded-lg">
          <X className="w-3.5 h-3.5" /> ניקוי החיפוש
        </Button>
      </div>
      {loadingMore && <p className="text-xs text-muted-foreground">מחפש גם בתכני PTSD-IL ובצ׳אטבוט...</p>}
      {groups.map(([pageId, hits]) => (
        <section key={pageId} className="bg-card rounded-super border border-border p-4 sm:p-5 shadow-card">
          <h3 className="text-sm font-semibold text-foreground mb-2">{pagesById[pageId]?.label ?? pageId}</h3>
          <ul className="space-y-1">
            {hits.map((h, i) => (
              <li key={i}>
                <Button type="button" variant="quiet" size="none" onClick={() => onOpen(h)} className="w-full justify-start text-start whitespace-normal rounded-lg px-3 py-2 hover:bg-muted">
                  <span className="block min-w-0">
                    <span className="block text-sm font-medium text-foreground" dir="auto">{h.title}</span>
                    <span className="block text-xs text-muted-foreground mt-0.5" dir="auto">
                      {h.sectionLabel} · {h.snippet.before}<mark className="bg-warning/20 text-foreground rounded px-0.5">{h.snippet.match}</mark>{h.snippet.after}
                    </span>
                  </span>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

// ─── View ────────────────────────────────────────────────────────────────────

/**
 * The metiv variant's content view: the page tree, the search, and the chosen
 * page with its sections.
 * @param {Object} props
 * @param {{ key: string, label: string }[]} props.ptsdTabs  the PTSD-IL panels' names
 * @param {(key: string) => React.ReactNode} props.renderPtsd
 * @param {(kind: 'qa'|'users'|'log') => React.ReactNode} props.renderTool
 * @param {(lang: string) => Promise<{ panel: string, itemId: string, title: string, text: string, cat?: string, age?: string }[]>} props.ptsdSearch
 * @param {boolean} props.showContent  admin/moderator: the site pages and the chatbot Q&A
 * @param {boolean} props.showUsers    masteradmin: users and the edit log
 */
export function MetivContentView(props) {
  return (
    <MetivStoreProvider>
      <SiteCopyStoreProvider>
        <MetivView {...props} />
      </SiteCopyStoreProvider>
    </MetivStoreProvider>
  );
}

function MetivView({ ptsdTabs, renderPtsd, renderTool, ptsdSearch, showContent, showUsers }) {
  const { store } = useMetivStore();
  const { store: siteCopy } = useSiteCopyStore();
  const { changes, version } = usePendingChanges();
  const lang = useAdminLang();
  const [params, setParams] = useSearchParams();
  const ptsdLabels = useMemo(() => Object.fromEntries(ptsdTabs.map(t => [t.key, t.label])), [ptsdTabs]);

  const tree = useMemo(() => {
    const full = buildSiteTree(store ? dynamicItems(store) : {});
    return full
      .map(a => ({ ...a, pages: a.pages.filter(p => (a.id === 'tools' ? (p.masterOnly ? showUsers : showContent) : showContent)) }))
      .filter(a => a.pages.length);
  }, [store, showContent, showUsers]);
  const pages = useMemo(() => flattenPages(tree), [tree]);
  const pagesById = useMemo(() => Object.fromEntries(pages.filter(p => !p.aliasOf).map(p => [p.id, p])), [pages]);

  const asked = params.get('page') || '';
  const fallback = pages.find(p => !p.aliasOf)?.id ?? '';
  const current = pagesById[asked] ? asked : (asked.startsWith('course:') || asked.startsWith('article:')) && !store ? asked : fallback;
  const { page, trail } = findPage(tree, current);

  const [expanded, setExpanded] = useState(() => new Set(/** @type {string[]} */ ([])));
  // The current page's area and ancestors are open.
  useEffect(() => {
    if (!page) return;
    setExpanded(prev => {
      const next = new Set(prev);
      next.add(`area:${page.area}`);
      for (const t of trail) next.add(t.id);
      return next.size === prev.size ? prev : next;
    });
  }, [page, trail]);
  const toggle = id => setExpanded(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  const [focus, setFocus] = useState(/** @type {import('./AdminFocus').AdminFocus|null} */ (null));
  const [drawer, setDrawer] = useState(false);
  const [query, setQuery] = useState('');

  function goTo(id, nextFocus = null) {
    setFocus(nextFocus ? { ...nextFocus, nonce: Date.now() } : null);
    setDrawer(false);
    if (id !== current) setParams(prev => { const p = new URLSearchParams(prev); p.set('page', id); return p; });
    else if (!nextFocus) window.scrollTo?.({ top: 0 });
  }

  // Staged changes per page (its own sections) and per subtree (collapsed parents, areas).
  const countOf = (node, deep = false) => {
    const target = node.aliasOf ? pagesById[node.aliasOf] : node;
    if (!target) return 0;
    let n = target.sections.reduce((sum, s) => (s.kind === 'link' ? sum : sum + sectionPending(s, sectionMeta(s, target, ptsdLabels), changes, store || { rows: [] })), 0);
    if (deep || !expanded.has(node.id)) n += node.children.reduce((sum, c) => sum + countOf(c, true), 0);
    return n;
  };

  // Search: the Metiv rows are in memory; the PTSD-IL panels and the Q&A are
  // fetched for the language the first time a search runs in it.
  const [extra, setExtra] = useState(/** @type {Record<string, import('./adminSearch').SearchEntry[]>} */ ({}));
  const [extraLoading, setExtraLoading] = useState(false);
  const searching = query.trim().length >= 2;
  // A save may have changed any of it.
  useEffect(() => { setExtra({}); }, [version]);
  useEffect(() => {
    if (!searching || extra[lang.id] || !showContent) return;
    let cancelled = false;
    setExtraLoading(true);
    const pageOf = panel => pages.find(p => !p.aliasOf && p.sections.some(s => s.kind === 'ptsd' && s.panel === panel));
    Promise.allSettled([ptsdSearch(lang.id), loadChatbotQa()]).then(([ptsd, qa]) => {
      if (cancelled) return;
      /** @type {import('./adminSearch').SearchEntry[]} */
      const out = [];
      for (const e of ptsd.status === 'fulfilled' ? ptsd.value : []) {
        const p = pageOf(e.panel);
        const section = p?.sections.find(s => s.kind === 'ptsd' && s.panel === e.panel);
        if (!p || !section) continue;
        out.push({ pageId: p.id, sectionId: section.id, sectionLabel: ptsdLabels[e.panel] || '', title: e.title, text: plainText(e.text), focus: { sectionId: section.id, panel: e.panel, itemId: e.itemId, cat: e.cat, age: e.age } });
      }
      const qaPage = pages.find(p => p.sections.some(s => s.kind === 'qa'));
      if (qa.status === 'fulfilled' && qaPage) {
        const qaStore = qa.value;
        for (const row of qaStore.rows.filter(r => r.langId === 'he')) {
          const shown = lang.id === 'he' ? row : qaStore.rows.find(r => r.groupId === row.groupId && r.langId === lang.id) ?? row;
          out.push({
            pageId: qaPage.id, sectionId: qaPage.sections[0].id, sectionLabel: qaPage.label, title: qaTitle(shown.content),
            text: (shown.content.paraphrases || []).join(' · '), focus: { sectionId: qaPage.sections[0].id, qaId: row.id },
          });
        }
      }
      setExtra(prev => ({ ...prev, [lang.id]: out }));
      setExtraLoading(false);
    });
    return () => { cancelled = true; };
  }, [searching, lang.id, extra, pages, ptsdSearch, ptsdLabels, showContent]);

  const metiv = useMemo(() => (searching && showContent ? metivEntries(pages, store, siteCopy, lang.id, ptsdLabels) : []), [searching, showContent, pages, store, siteCopy, lang.id, ptsdLabels]);
  const groups = useMemo(() => {
    if (!searching) return [];
    const hits = searchEntries([...metiv, ...(extra[lang.id] ?? [])], query);
    return groupByPage(hits, pages.map(p => p.id));
  }, [searching, metiv, extra, lang.id, query, pages]);

  function openHit(hit) {
    setQuery('');
    goTo(hit.pageId, hit.focus);
  }

  const sidebar = (
    <Sidebar tree={tree} current={current} expanded={expanded} toggle={toggle} onPick={id => goTo(id)} countOf={countOf} query={query} setQuery={setQuery} />
  );

  return (
    <PageContext.Provider value={{ pagesById, goTo, ptsdLabels, renderPtsd, renderTool }}>
      <AdminFocusProvider focus={focus}>
        {/* Below lg the tree is a drawer that opens above the page. */}
        <div className="lg:hidden mb-4">
          <Button type="button" variant="outline-subtle" size="xs" onClick={() => setDrawer(d => !d)} aria-expanded={drawer} className="gap-1.5 rounded-lg">
            <Menu className="w-4 h-4" /> {drawer ? 'סגירת עמודי האתר' : 'עמודי האתר וחיפוש'}
          </Button>
          {drawer && <div className="mt-3 bg-card rounded-super border border-border p-3 shadow-card">{sidebar}</div>}
        </div>
        <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] items-start">
          <aside className="hidden lg:block bg-card rounded-super border border-border p-3 shadow-card lg:sticky lg:top-20 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
            {sidebar}
          </aside>
          <div className="min-w-0">
            {searching ? (
              <SearchResults query={query.trim()} groups={groups} pagesById={pagesById} onOpen={openHit} onClear={() => setQuery('')} loadingMore={extraLoading} />
            ) : page ? (
              <PageView key={page.id} page={page} trail={trail} />
            ) : (
              <LoadingRow />
            )}
          </div>
        </div>
      </AdminFocusProvider>
    </PageContext.Provider>
  );
}
