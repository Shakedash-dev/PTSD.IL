// Stages the AI translations of a Hebrew edit (docs/metiv-db-spec.md section 3).
//
// After a Hebrew change is staged, its four sibling rows (ar/en/ru/fr, same
// groupId) are staged next to it as linked changes (see PendingChanges.jsx):
// first as "pending" placeholders, so nothing can be saved while a translation
// is still running, then each one replaced by its result as /translate answers.
// Languages run in parallel. A failure stays staged per language with a retry;
// the Hebrew change can be saved without it.
//
// Panels describe the edit through `prepare()` - the old and new Hebrew content
// JSON, the existing siblings and how to write one - so the same flow serves the
// Metiv collections (content edited as JSON) and the PTSD-IL panels (content
// serialized by adminSource from page-shaped drafts).

import { useCallback } from 'react';
import { LANG_BY_ID, TARGET_LANGS, buildSibling, planTranslation, requestTranslation } from '@/api/adminTranslate';
import { contentDiff } from './contentFields';
import { usePendingChanges } from './PendingChanges';

/**
 * @typedef {import('@/api/adminTranslate').Sibling} Sibling
 * @typedef {{
 *   oldContent: any,
 *   newContent: any,
 *   oldTitle?: string,
 *   newTitle?: string,
 *   siblings: Record<string, Sibling|null>,
 *   write: (lang: string, built: { title: string|undefined, content: any }, sibling: Sibling|null) => Promise<any>,
 * }} Prepared
 * @typedef {{
 *   heKey: string,
 *   scope: string,
 *   section: string,
 *   title: string,
 *   context: string,
 *   prepare: () => Promise<Prepared>,
 *   handEdited?: (lang: string, sibling: Sibling) => boolean,
 *   labels?: Record<string, string>,
 * }} TranslationSpec
 */

let revCounter = 0;

const notReady = () => Promise.reject(new Error('התרגום עדיין לא הסתיים'));

/** Translation key of the Hebrew change `heKey` in `lang`. */
export function siblingKey(heKey, lang) {
  return `${heKey}::${lang}`;
}

function siblingDiff(sibling, built, labels) {
  const diff = contentDiff(sibling?.content ?? {}, built.content, labels);
  if (built.title !== undefined && built.title !== (sibling?.title ?? '') && built.title !== built.content?.title) {
    diff.unshift({ label: 'כותרת השורה', before: sibling?.title ?? '', after: built.title });
  }
  return diff;
}

export function useStageTranslations() {
  const { stage, patch } = usePendingChanges();

  const stageTranslations = useCallback(async (/** @type {TranslationSpec} */ spec) => {
    const rev = ++revCounter;
    const base = lang => ({
      key: siblingKey(spec.heKey, lang),
      scope: spec.scope,
      section: spec.section,
      linkedTo: spec.heKey,
      lang,
      rev,
      title: `${spec.title} (${LANG_BY_ID[lang].label})`,
    });
    const apply = (lang, change) => patch(siblingKey(spec.heKey, lang), c => (c.rev === rev ? change : c));

    for (const lang of TARGET_LANGS) {
      stage({ ...base(lang), action: 'update', diff: [], translation: { state: 'pending' }, run: notReady });
    }

    /** @type {Prepared} */
    let prepared;
    try {
      prepared = await spec.prepare();
    } catch (err) {
      for (const lang of TARGET_LANGS) {
        apply(lang, { ...base(lang), action: 'update', diff: [], run: notReady, translation: { state: 'error', error: err?.message || '' } });
      }
      return;
    }

    async function runOne(lang) {
      const sibling = prepared.siblings[lang] ?? null;
      const head = { ...base(lang), action: sibling ? 'update' : 'create', ...(sibling ? { itemId: sibling.id } : {}) };
      const humanEdited = Boolean(sibling) && (sibling.content?._tr?.by === 'human' || Boolean(spec.handEdited?.(lang, sibling)));
      const { items, keep } = planTranslation({ ...prepared, sibling });

      const done = (built, translation) => {
        const diff = siblingDiff(sibling, built, spec.labels);
        if (!diff.length) {
          // Nothing reaches this language (e.g. a whitespace-only edit), so it
          // is not worth a line in the dialog.
          patch(head.key, c => (c.rev === rev ? null : c));
          return;
        }
        apply(lang, { ...head, draft: built, diff, translation, run: () => prepared.write(lang, built, sibling) });
      };

      if (!Object.keys(items).length) {
        // Only technical fields changed: carry them over, keep every text.
        done(buildSibling({ ...prepared, sibling, keep, translated: {} }), { state: 'done' });
        return;
      }
      try {
        const res = await requestTranslation({ target: lang, items, context: spec.context });
        const missing = Object.keys(items).filter(k => typeof res.items[k] !== 'string');
        const status = missing.length ? 'flagged' : res.status;
        const notes = missing.length ? [...res.notes, `חסרים בתרגום: ${missing.join(', ')}`] : res.notes;
        const translated = Object.fromEntries(Object.keys(items).filter(k => !missing.includes(k)).map(k => [k, res.items[k]]));
        const tr = { by: 'ai', at: new Date().toISOString(), model: res.model, status };
        done(buildSibling({ ...prepared, sibling, keep, translated, tr }), { state: 'done', status, notes, humanEdited });
      } catch (err) {
        apply(lang, {
          ...head,
          diff: [],
          run: notReady,
          translation: { state: 'error', error: err?.message || '', humanEdited },
          retry: () => {
            apply(lang, { ...head, diff: [], run: notReady, translation: { state: 'pending' } });
            runOne(lang);
          },
        });
      }
    }

    await Promise.all(TARGET_LANGS.map(runOne));
  }, [stage, patch]);

  return stageTranslations;
}

/**
 * Stages the deletion of every sibling of a deleted Hebrew item, linked to it.
 * @param {(c: import('./PendingChanges').PendingChange) => void} stage
 * @param {{ heKey: string, scope: string, section: string, title: string, siblings: Record<string, Sibling|null>, remove: (id: string) => Promise<any> }} args
 */
export function stageSiblingDeletes(stage, { heKey, scope, section, title, siblings, remove }) {
  for (const lang of TARGET_LANGS) {
    const sibling = siblings[lang];
    if (!sibling) continue;
    stage({
      key: siblingKey(heKey, lang),
      scope,
      section,
      linkedTo: heKey,
      lang,
      action: 'delete',
      itemId: sibling.id,
      title: `${title} (${LANG_BY_ID[lang].label})`,
      diff: [],
      run: () => remove(sibling.id),
    });
  }
}
