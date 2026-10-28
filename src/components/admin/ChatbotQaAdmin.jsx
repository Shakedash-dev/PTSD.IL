import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AddNewButton, Badge, LoadingRow, Section } from '@/components/admin/AdminUi';
import { useAdminLang } from '@/components/admin/AdminLang';
import { useAdminFocus } from '@/components/admin/AdminFocus';
import { ItemCard, TranslationSummary } from '@/components/admin/MetivAdmin';
import { TRANSLATION_BADGES, usePendingChanges } from '@/components/admin/PendingChanges';
import { stageSiblingDeletes, useStageTranslations } from '@/components/admin/translationStaging';
import { contentDiff } from '@/components/admin/contentFields';
import { TARGET_LANGS, humanStamp } from '@/api/adminTranslate';
import {
  createQaRow, loadChatbotQa, newQaKey, qaTitle, removeQaRow, setQaSortOrder, updateQaRow,
} from '@/api/chatbotQaAdminSource';

// The chatbot's curated Q&A playbooks (docs/metiv-db-spec.md section 5), in
// both admin variants: the chatbot serves PTSD-IL and Metiv alike. One card
// per question; the editor is the schema-less ContentEditor with this
// section's own field names and help lines.
//
// Staged like every other panel: "אישור" stages, the save-all dialog writes.
// A Hebrew change stages its AI translations (translationStaging.js); a change
// in another language tab writes only that row and stamps `_tr.by = 'human'`.
// Every write is followed by a reindex of the row, which makes the worker
// rebuild its Q&A index (chatbotQaAdminSource.js).

export const QA_SCOPE = 'chatbot_qa';
export const QA_SECTION = 'צ׳אטבוט: שאלות ותשובות מוכנות';

export const QA_LABELS = {
  question: 'שאלה',
  paraphrases: 'ניסוחים נוספים שמשתמשים כותבים',
  guidance: 'הנחיות לצ׳אטבוט',
  answer: 'תשובה לדוגמה',
  crisis: 'שאלת חירום',
};

const QA_HELP = {
  question: 'השאלה כפי שמשתמש/ת היה כותב/ת אותה. היא גם הכותרת של השורה.',
  paraphrases: 'ניסוחים אחרים של אותה שאלה. הצ׳אטבוט מזהה את השאלה לפי השאלה והניסוחים יחד, ולכן כדאי לכתוב אותם כמו שאנשים באמת כותבים.',
  guidance: 'הוראות לצ׳אטבוט, לא מוצגות למשתמש/ת: מה תשובה טובה כוללת ובאיזה סדר. פרטים שמשתנים (טלפונים, כתובות, שמות) עדיף שייקח מהמקורות.',
  answer: 'תשובה לדוגמה שהצ׳אטבוט נעזר בה. הוא מתאים את הניסוח ואת השפה לשיחה ולא מעתיק אותה מילה במילה.',
  crisis: 'כשמזהה החירום של הצ׳אטבוט מופעל, שאלת החירום הקרובה ביותר מוזרקת לשיחה גם בלי התאמה לשאלה. יש לסמן רק שאלות על אובדנות ופגיעה עצמית.',
};

const QA_HELP_TRANSLATION = { ...QA_HELP, crisis: `${QA_HELP.crisis} נקבע בעברית לכל השפות.` };

const BLANK = { question: '', paraphrases: [], guidance: '', answer: '', crisis: false };

const paraphrasesOf = content => (Array.isArray(content?.paraphrases) ? content.paraphrases : []);

/** Trims the texts and drops empty paraphrases. */
function normalize(content) {
  const trim = v => (typeof v === 'string' ? v.trim() : v);
  return {
    ...content,
    question: trim(content.question ?? ''),
    paraphrases: paraphrasesOf(content).map(trim).filter(p => typeof p === 'string' && p),
    guidance: trim(content.guidance ?? ''),
    answer: trim(content.answer ?? ''),
    crisis: content.crisis === true,
  };
}

// The worker skips a row without a question or guidance (worker/src/lib/qa.ts).
function validate(content) {
  if (!String(content?.question ?? '').trim()) return 'יש למלא שאלה';
  if (!String(content?.guidance ?? '').trim()) return 'יש למלא הנחיות לצ׳אטבוט - בלעדיהן הצ׳אטבוט מתעלם מהשאלה';
  return '';
}

function QaSummary({ content }) {
  const n = paraphrasesOf(content).length;
  return (
    <div className="flex items-center gap-2 mt-1 flex-wrap">
      {content?.crisis === true && <Badge color="bg-destructive/10 text-destructive">שאלת חירום</Badge>}
      <span className="text-xs text-muted-foreground">{n === 1 ? 'ניסוח נוסף אחד' : `${n} ניסוחים נוספים`}</span>
    </div>
  );
}

/** Staging for the Q&A rows: Hebrew edits (with translations) and per-language edits. */
function useQaStaging(store) {
  const { changes, stage, discard, newKey } = usePendingChanges();
  const stageTranslations = useStageTranslations();
  const context = title => `${QA_SECTION}: ${title}`;

  function siblingsOf(row) {
    return Object.fromEntries(TARGET_LANGS.map(l => [l, store.rows.find(r => r.groupId === row.groupId && r.langId === l) ?? null]));
  }

  function writeSibling(heRow, groupRef) {
    return (lang, built, sibling) => {
      const title = qaTitle(built.content);
      if (sibling) return updateQaRow(sibling, { title, content: built.content });
      const groupId = heRow?.groupId ?? groupRef.groupId;
      if (!groupId) throw new Error('השורה העברית לא נשמרה, ולכן אין לאן לקשר את התרגום');
      return createQaRow(store, { lang, title, content: built.content, sortOrder: heRow?.sortOrder ?? groupRef.sortOrder, groupId });
    };
  }

  function stageHeUpdate(row, edited) {
    const key = `${QA_SCOPE}:${row.id}`;
    const content = normalize(edited);
    const diff = contentDiff(row.content, content, QA_LABELS);
    if (!diff.length) { discard(key); return; }
    const title = qaTitle(content);
    stage({ key, scope: QA_SCOPE, section: QA_SECTION, action: 'update', itemId: row.id, title, draft: { content }, diff, run: () => updateQaRow(row, { title, content }) });
    stageTranslations({
      heKey: key, scope: QA_SCOPE, section: QA_SECTION, title, context: context(title), labels: QA_LABELS,
      handEdited: (lang, sib) => changes.some(c => c.key === `${QA_SCOPE}:${sib.id}`),
      prepare: async () => ({ oldContent: row.content, newContent: content, siblings: siblingsOf(row), write: writeSibling(row, {}) }),
    });
  }

  function stageHeCreate(key, edited, sortOrder, takenKeys) {
    const body = normalize(edited);
    const title = qaTitle(body);
    const full = { _key: edited._key || newQaKey(title, takenKeys), ...Object.fromEntries(Object.entries(body).filter(([k]) => !k.startsWith('_'))) };
    const groupRef = { groupId: undefined, sortOrder };
    stage({
      key, scope: QA_SCOPE, section: QA_SECTION, action: 'create', title, draft: { content: full, sortOrder }, diff: contentDiff({}, full, QA_LABELS),
      run: () => createQaRow(store, { lang: 'he', title, content: full, sortOrder, onSaved: s => { groupRef.groupId = s?.groupId; } }),
    });
    stageTranslations({
      heKey: key, scope: QA_SCOPE, section: QA_SECTION, title, context: context(title), labels: QA_LABELS,
      prepare: async () => ({ oldContent: null, newContent: full, siblings: {}, write: writeSibling(null, groupRef) }),
    });
  }

  function stageHeDelete(row) {
    const key = `${QA_SCOPE}:${row.id}`;
    const title = qaTitle(row.content);
    stage({ key, scope: QA_SCOPE, section: QA_SECTION, action: 'delete', itemId: row.id, title, diff: [], run: () => removeQaRow(row.id) });
    stageSiblingDeletes(stage, { heKey: key, scope: QA_SCOPE, section: QA_SECTION, title, siblings: siblingsOf(row), remove: removeQaRow });
  }

  /** A non-Hebrew edit: that row only, stamped as edited by hand, no translation. */
  function stageHuman(heRow, sibling, lang, edited) {
    const key = sibling ? `${QA_SCOPE}:${sibling.id}` : `${QA_SCOPE}:new:${heRow.groupId}:${lang}`;
    // The crisis flag is the Hebrew row's, in every language.
    const next = { ...normalize(edited), crisis: heRow.content.crisis === true, _tr: humanStamp() };
    const diff = contentDiff(sibling?.content ?? {}, next, QA_LABELS);
    if (sibling && !diff.length) { discard(key); return; }
    const title = qaTitle(next);
    stage({
      key, scope: QA_SCOPE, section: QA_SECTION, lang, action: sibling ? 'update' : 'create', ...(sibling ? { itemId: sibling.id } : {}),
      title, draft: { content: next }, diff,
      run: () => (sibling
        ? updateQaRow(sibling, { title, content: next })
        : createQaRow(store, { lang, title, content: next, sortOrder: heRow.sortOrder, groupId: heRow.groupId })),
    });
  }

  return { changes, stage, discard, newKey, siblingsOf, stageHeUpdate, stageHeCreate, stageHeDelete, stageHuman };
}

const noRef = ref => ({ label: ref, title: '' });

function QaList({ store }) {
  const lang = useAdminLang();
  const hebrew = lang.id === 'he';
  const s = useQaStaging(store);
  const { changes, stage, discard, newKey } = s;
  // A search result in the Metiv admin opens one question's editor.
  const focus = useAdminFocus();
  const [creating, setCreating] = useState(false);
  const editorProps = hebrew
    ? { labels: QA_LABELS, help: QA_HELP }
    : { labels: QA_LABELS, help: QA_HELP_TRANSLATION, lockedKeys: ['crisis'] };

  const heRows = store.rows.filter(r => r.langId === 'he').sort((a, b) => a.sortOrder - b.sortOrder);
  const pending = changes.filter(c => c.scope === QA_SCOPE && !c.linkedTo);
  const orderKey = `${QA_SCOPE}:order`;
  const orderChange = pending.find(c => c.key === orderKey);
  const ordered = orderChange
    ? orderChange.draft.order.map(id => heRows.find(r => r.id === id)).filter(Boolean)
    : heRows;
  const creates = pending.filter(c => c.action === 'create' && !c.lang);
  const takenKeys = new Set([...store.rows.map(r => r.key), ...creates.map(c => c.draft.content._key)]);
  const nextSort = Math.max(-1, ...heRows.map(r => r.sortOrder), ...creates.map(c => c.draft.sortOrder)) + 1;

  function check(content) {
    const error = validate(content);
    if (error) toast.error(error);
    return !error;
  }

  function move(index, delta) {
    const ids = ordered.map(r => r.id);
    const t = index + delta;
    if (t < 0 || t >= ids.length) return;
    [ids[index], ids[t]] = [ids[t], ids[index]];
    if (ids.every((id, i) => id === heRows[i].id)) { discard(orderKey); return; }
    const titles = rows => rows.map((r, i) => `${i + 1}. ${qaTitle(r.content)}`).join('\n');
    const nextRows = ids.map(id => heRows.find(r => r.id === id));
    stage({
      key: orderKey, scope: QA_SCOPE, section: QA_SECTION, action: 'update', title: 'סדר השאלות',
      draft: { order: ids }, diff: [{ label: 'סדר השאלות', before: titles(heRows), after: titles(nextRows) }],
      run: async () => {
        for (let i = 0; i < nextRows.length; i++) {
          const row = nextRows[i];
          if (row.sortOrder === i) continue;
          await setQaSortOrder(row.id, i);
          for (const sib of Object.values(s.siblingsOf(row))) if (sib && sib.sortOrder !== i) await setQaSortOrder(sib.id, i);
        }
      },
    });
  }

  return (
    <div>
      <Section title={QA_SECTION} count={heRows.length} />
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
        שאלות שהצ׳אטבוט מזהה ועונה עליהן לפי הנחיות קבועות, באתר PTSD-IL ובאתר מטיב. כשמשתמש/ת כותב/ת שאלה שדומה מאוד לאחת מהן, הצ׳אטבוט עונה לפי ההנחיות שלה ומתאים את הניסוח ואת השפה.
      </p>
      <div className="space-y-3">
        {ordered.map((row, i) => {
          const open = focus?.qaId === row.id;
          if (hebrew) {
            const key = `${QA_SCOPE}:${row.id}`;
            const p = changes.find(c => c.key === key);
            const content = p?.action === 'update' ? p.draft.content : row.content;
            return (
              <ItemCard
                key={open ? `${row.id}:${focus.nonce}` : row.id}
                startInEdit={open}
                reveal={open}
                content={content}
                title={qaTitle(content)}
                summary={<QaSummary content={content} />}
                status={p?.action}
                extra={p ? <TranslationSummary heKey={key} /> : null}
                onDiscard={p ? () => discard(key) : undefined}
                onConfirm={c => { if (!check(c)) return false; s.stageHeUpdate(row, c); return true; }}
                onDelete={() => s.stageHeDelete(row)}
                onUp={i > 0 ? () => move(i, -1) : undefined}
                onDown={i < ordered.length - 1 ? () => move(i, 1) : undefined}
                dir={lang.dir}
                structureLocked={false}
                resolve={noRef}
                editorProps={editorProps}
              />
            );
          }
          const sib = s.siblingsOf(row)[lang.id];
          const key = sib ? `${QA_SCOPE}:${sib.id}` : `${QA_SCOPE}:new:${row.groupId}:${lang.id}`;
          const p = changes.find(c => c.key === key);
          const content = p ? p.draft.content : sib?.content ?? row.content;
          const translating = changes.some(c => c.linkedTo === `${QA_SCOPE}:${row.id}` && c.lang === lang.id);
          return (
            <ItemCard
              key={open ? `${key}:${focus.nonce}` : key}
              startInEdit={open}
              reveal={open}
              content={content}
              title={qaTitle(content)}
              summary={<QaSummary content={content} />}
              status={p?.action}
              extra={!sib && !p
                ? <Badge color="bg-muted text-muted-foreground">טרם תורגם - מוצג הנוסח העברי</Badge>
                : translating ? <Badge color={TRANSLATION_BADGES.pending.color}>תרגום מהעברית ממתין לשמירה</Badge> : null}
              onDiscard={p ? () => discard(key) : undefined}
              onConfirm={c => { if (!check(c)) return false; s.stageHuman(row, sib, lang.id, c); return true; }}
              dir={lang.dir}
              structureLocked
              resolve={noRef}
              editorProps={editorProps}
            />
          );
        })}
        {hebrew && creates.map(c => (
          <ItemCard
            key={c.key}
            content={c.draft.content}
            title={c.title}
            summary={<QaSummary content={c.draft.content} />}
            status="create"
            extra={<TranslationSummary heKey={c.key} />}
            onDiscard={() => discard(c.key)}
            onConfirm={content => { if (!check(content)) return false; s.stageHeCreate(c.key, content, c.draft.sortOrder, takenKeys); return true; }}
            dir={lang.dir}
            structureLocked={false}
            resolve={noRef}
            editorProps={editorProps}
          />
        ))}
        {hebrew && creating && (
          <ItemCard
            content={BLANK}
            title=""
            startInEdit
            onConfirm={content => {
              if (!check(content)) return false;
              s.stageHeCreate(newKey(QA_SCOPE), content, nextSort, takenKeys);
              setCreating(false);
              return true;
            }}
            onCancel={() => setCreating(false)}
            dir={lang.dir}
            structureLocked={false}
            resolve={noRef}
            editorProps={editorProps}
          />
        )}
      </div>
      {hebrew && (
        <div className="mt-3">
          <AddNewButton label="הוספת שאלה חדשה" onClick={() => setCreating(true)} />
        </div>
      )}
    </div>
  );
}

// Loads every Q&A row (all languages) once, and again after each save-all batch.
export default function ChatbotQaPanel() {
  const { version } = usePendingChanges();
  const [state, setState] = useState({ store: null, loading: true, error: '' });
  useEffect(() => {
    let cancelled = false;
    setState(st => ({ ...st, loading: true }));
    loadChatbotQa()
      .then(store => { if (!cancelled) setState({ store, loading: false, error: '' }); })
      .catch(err => {
        if (cancelled) return;
        toast.error(err?.message || 'שגיאה בטעינת שאלות הצ׳אטבוט');
        setState({ store: null, loading: false, error: err?.message || 'שגיאה בטעינת שאלות הצ׳אטבוט' });
      });
    return () => { cancelled = true; };
  }, [version]);
  if (state.loading && !state.store) return <LoadingRow />;
  if (!state.store) return <p className="text-sm text-destructive py-6 text-center">{state.error || 'שגיאה בטעינת שאלות הצ׳אטבוט'}</p>;
  return <QaList store={state.store} />;
}
