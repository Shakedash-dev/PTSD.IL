// Admin write layer. The data-layer counterpart to src/api/source.js (public
// reads): this is where the admin panels (src/pages/Admin.jsx, wired in a
// later stage) will read (incl. unpublished), create, update and delete
// content, converting between the DB's Markdown-JSON `content` column and the
// react-quill HTML the panels edit.
//
// See docs/superpowers/specs/2026-07-22-admin-write-layer-spec.md (the entity
// table this file implements) and
// docs/superpowers/specs/2026-07-22-db-remigration-spec.md (DB shape).
//
// Every network call goes through adminApi() (src/api/adminClient.js) - Bearer
// auth, 401/403 handling already built there.
//
// Do NOT edit Admin.jsx from this file's concerns - this is the layer only.

import { adminApi } from './adminClient';
import { reindexItem } from './reindex';
import { mdToHtml, htmlToMd } from '@/lib/markdownHtml';

const ARTICLES = '/admin/articles';
const COMMUNITIES = '/admin/communities';

// ─── Taxonomy (fetched once, cached) ───────────────────────────────────────
// Categories are hierarchical (GET /categories returns top-level items with a
// nested `children` array) - flatten both levels into one slug->id map so
// tools/sources can look up `[parentId, subCategoryId]` by slug.

function flattenCategories(categories) {
  const bySlug = new Map();
  for (const c of categories) {
    bySlug.set(c.slug, c.id);
    for (const child of c.children || []) {
      bySlug.set(child.slug, child.id);
    }
  }
  return bySlug;
}

let taxonomyPromise = null;

async function fetchTaxonomy() {
  const [categories, audiences, ageGroups] = await Promise.all([
    adminApi('GET', '/categories'),
    adminApi('GET', '/audiences'),
    adminApi('GET', '/age-groups'),
  ]);
  return {
    categoriesBySlug: flattenCategories(categories),
    audiencesBySlug: new Map(audiences.map(a => [a.slug, a.id])),
    ageGroupsBySlug: new Map(ageGroups.map(a => [a.slug, a.id])),
  };
}

// Fetches taxonomy once per page load and memoizes it. Exported so tests /
// callers can pre-warm or reuse it; not required by load*/save* callers.
export function getTaxonomy() {
  if (!taxonomyPromise) taxonomyPromise = fetchTaxonomy();
  return taxonomyPromise;
}

// Test-only escape hatch: force the next getTaxonomy() call to re-fetch.
export function _resetTaxonomyCache() {
  taxonomyPromise = null;
}

function requireCategoryId(taxonomy, slug) {
  const id = taxonomy.categoriesBySlug.get(slug);
  if (!id) throw new Error(`Unknown category slug: "${slug}"`);
  return id;
}

// Like requireCategoryId, but creates the category if the DB has never seen it.
// Only the edit log needs this: it is a bucket introduced after the initial
// migration, so a fresh database has no `admin-log` row and the first save
// would otherwise hit "Unknown category slug". Creating it needs
// the same admin/moderator role the write itself needs. The taxonomy cache is
// dropped afterwards so the new id is picked up by later calls.
async function resolveOrCreateCategoryId(taxonomy, slug, name) {
  const existing = taxonomy.categoriesBySlug.get(slug);
  if (existing) return existing;
  const created = await adminApi('POST', '/admin/categories', { slug, name });
  taxonomy.categoriesBySlug.set(slug, created.id);
  return created.id;
}

function requireAgeGroupId(taxonomy, slug) {
  const id = taxonomy.ageGroupsBySlug.get(slug);
  if (!id) throw new Error(`Unknown age group slug: "${slug}"`);
  return id;
}

function requireAudienceId(taxonomy, slug) {
  const id = taxonomy.audiencesBySlug.get(slug);
  if (!id) throw new Error(`Unknown audience slug: "${slug}"`);
  return id;
}

// Admin panels/static data use underscores for audience bucket keys
// (security_forces); the API's slugs use hyphens (security-forces). Accept
// either from callers.
function toHyphenSlug(slug) {
  return slug.replace(/_/g, '-');
}

// The sub-category (e.g. "sleep", "research") is the categories[] entry that
// has a parentId set - the top-level category has parentId === null. Mirrors
// src/api/source.js's subCategorySlug().
function subCategorySlug(categories) {
  return (categories || []).find(c => c.parentId)?.slug ?? categories?.[0]?.slug;
}

// `content` is stored as a JSON string. Defensive JSON.parse, same as
// src/api/source.js's parseContent().
function parseContent(item) {
  if (!item.content) return {};
  try {
    return JSON.parse(item.content);
  } catch {
    return {};
  }
}

// GET /admin/articles?... - note per docs/api.md the admin findAll only
// honors type/langId/parentId/categoryId server-side (categorySlug/
// audienceSlug/ageGroupSlug are accepted but ignored). Any audience/age-group
// filtering below is therefore done client-side against the relations
// (`item.audiences`, `item.ageGroups`) included on each returned Article.
/**
 * @param {Object} [opts]
 * @param {string} [opts.type]
 * @param {string} [opts.langId]
 * @param {string} [opts.categoryId]
 * @param {string} [opts.parentId]
 */
async function fetchArticles({ type, langId, categoryId, parentId } = {}) {
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  if (langId) params.set('langId', langId);
  if (categoryId) params.set('categoryId', categoryId);
  if (parentId) params.set('parentId', parentId);
  const qs = params.toString();
  return adminApi('GET', `${ARTICLES}${qs ? `?${qs}` : ''}`);
}

// Builds the common create/update payload plumbing shared by every
// article-backed entity: PATCH by id when draft.id is present (update,
// isPublished untouched/preserved by omission), otherwise POST (create,
// isPublished defaults true, groupId omitted so the API auto-generates one
// unless ctx.groupId is supplied for linking a new translation).
// `ctx.onSaved` sees the stored row before the reindex runs, so a caller that
// needs the new row's groupId (its translations) gets it even when the chatbot
// sync then fails.
async function writeArticle(draft, ctx, payload) {
  let saved;
  if (draft.id) {
    saved = await adminApi('PATCH', `${ARTICLES}/${draft.id}`, payload);
  } else {
    const createPayload = { ...payload, isPublished: ctx.isPublished ?? true };
    if (ctx.groupId) createPayload.groupId = ctx.groupId;
    saved = await adminApi('POST', ARTICLES, createPayload);
  }
  ctx.onSaved?.(saved);
  // Sync the chatbot's vector DB for this item (create/update). Runs after the
  // content write succeeds; a sync failure surfaces as a ChatbotSyncError the
  // panel treats as a non-fatal warning (the content is already saved).
  // `ctx.skipReindex` is for rows that are UI chrome rather than answerable
  // content - see appendEditLog.
  if (!ctx.skipReindex) await reindexItem(saved?.id ?? draft.id);
  return saved;
}

async function removeArticle(id, { skipReindex = false } = {}) {
  const res = await adminApi('DELETE', `${ARTICLES}/${id}`);
  if (!skipReindex) await reindexItem(id); // worker 404s on the deleted id and drops its vectors
  return res;
}

// ─── Reserved `_` keys and translations ─────────────────────────────────────
// A row's content JSON may carry reserved keys that start with `_` (`_tr`, the
// translation stamp, see docs/metiv-db-spec.md). The panels never edit them, so
// load* keeps them on the draft as `_meta` and build* writes them back. A save
// from a non-Hebrew tab (ctx.human) stamps the row as edited by hand.

function metaOf(content) {
  const meta = Object.fromEntries(Object.entries(content || {}).filter(([k]) => k.startsWith('_')));
  return Object.keys(meta).length ? { _meta: meta } : {};
}

function withMeta(content, draft, ctx) {
  const out = { ...content, ...(draft._meta || {}) };
  if (ctx.human) out._tr = { by: 'human', at: new Date().toISOString() };
  return out;
}

/**
 * The other-language rows of a group (ar/en/ru/fr), by language. Fetched
 * unfiltered by category on purpose: a categoryId-filtered list only returns
 * the matched category in each row.
 * @param {string|undefined} groupId
 * @param {string} type
 * @returns {Promise<Record<string, { id: string, title: string, content: any }>>}
 */
export async function loadArticleSiblings(groupId, type) {
  if (!groupId) return {};
  const items = await fetchArticles({ type });
  /** @type {Record<string, { id: string, title: string, content: any }>} */
  const out = {};
  for (const item of items) {
    if (item.groupId === groupId && item.langId !== 'he') {
      out[item.langId] = { id: item.id, title: item.title, content: parseContent(item) };
    }
  }
  return out;
}

/**
 * Writes one translated sibling of a Hebrew row. Every non-content column
 * (type, categories, audiences, age groups, url, sortOrder) comes from the
 * Hebrew row's payload; title and content are the translation's.
 * @param {any} hePayload what build* produced for the Hebrew row
 * @param {string} lang
 * @param {{ title: string|undefined, content: any }} built
 * @param {{ id: string }|null} sibling
 * @param {string|undefined} groupId the Hebrew row's
 */
export function writeArticleSibling(hePayload, lang, built, sibling, groupId) {
  if (!sibling && !groupId) throw new Error('השורה העברית לא נשמרה, ולכן אין לאן לקשר את התרגום');
  const payload = { ...hePayload, langId: lang, title: built.title ?? hePayload.title, content: JSON.stringify(built.content) };
  return writeArticle(sibling ? { id: sibling.id } : {}, { groupId }, payload);
}

// ─── editLog - article, category `admin-log`, unpublished ───────────────────
// Who saved what from /admin. One row per "save all" batch: `title` is the
// timestamp, content JSON is `{ at, user, changes }` where every change is
// `{ section, action, title, fields: [{ label, before, after }] }` with the
// values already flattened to the plain text the review dialog showed.
//
// Stored as an article because the backend has no audit endpoint, which has
// two consequences worth knowing:
//   - It is written by the editor's own browser after their batch lands, so it
//     records what the panel did, not what the API received. A failed log
//     write never undoes the content write.
//   - It is NOT tamper-proof. Anyone with admin/moderator can PATCH or DELETE
//     these rows through the API directly, exactly like any other article. A
//     real audit trail needs a server-side log, which is outside this repo.
//
// Rows are created with isPublished: false, so the public /articles endpoint
// never returns them, and they skip the chatbot reindex.
const EDIT_LOG_CATEGORY = 'admin-log';
const EDIT_LOG_CATEGORY_NAME = 'יומן עריכות';
// A single rich-text field can be long; the log is for "who changed what",
// not a version store, so each before/after value is capped.
const EDIT_LOG_VALUE_MAX = 4000;

function capLogValue(text) {
  const s = text ?? '';
  return s.length > EDIT_LOG_VALUE_MAX ? `${s.slice(0, EDIT_LOG_VALUE_MAX)}...` : s;
}

/**
 * @param {{ user: { id: string|null, email: string|null, name: string|null }, changes: Array<{ section: string, action: string, title: string, fields: Array<{ label: string, before: string, after: string }> }> }} entry
 */
export async function appendEditLog(entry) {
  const taxonomy = await getTaxonomy();
  const categoryId = await resolveOrCreateCategoryId(
    taxonomy, EDIT_LOG_CATEGORY, EDIT_LOG_CATEGORY_NAME
  );
  const at = new Date().toISOString();
  const changes = entry.changes.map(c => ({
    section: c.section,
    action: c.action,
    title: c.title,
    fields: (c.fields || []).map(f => ({
      label: f.label,
      before: capLogValue(f.before),
      after: capLogValue(f.after),
    })),
  }));
  const payload = {
    type: 'article',
    langId: 'he',
    title: at,
    content: JSON.stringify({ at, user: entry.user, changes }),
    categoryIds: [categoryId],
  };
  return writeArticle({}, { isPublished: false, skipReindex: true }, payload);
}

/**
 * Every logged batch, newest first.
 * @returns {Promise<Array<{ id: string, at: string, user: { id: string|null, email: string|null, name: string|null }, changes: any[] }>>}
 */
export async function loadEditLog() {
  const taxonomy = await getTaxonomy();
  const categoryId = taxonomy.categoriesBySlug.get(EDIT_LOG_CATEGORY);
  if (!categoryId) return []; // nothing has been saved since the log existed
  const items = await fetchArticles({ type: 'article', langId: 'he', categoryId });
  return items
    .map(item => {
      const c = parseContent(item);
      return {
        id: item.id,
        at: c.at || item.createdAt || '',
        user: c.user || { id: null, email: null, name: null },
        changes: Array.isArray(c.changes) ? c.changes : [],
      };
    })
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}

// ─── ptsdFaq - faq, category `ptsd-info`, per langId ───────────────────────
// draft: { id, groupId, langId, q, a }         (a = rich, md<->html)
// content JSON: { answer }

export async function loadPtsdFaq(ctx = {}) {
  const lang = ctx.lang || 'he';
  const taxonomy = await getTaxonomy();
  const categoryId = requireCategoryId(taxonomy, 'ptsd-info');
  const items = await fetchArticles({ type: 'faq', langId: lang, categoryId });
  return items
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(item => {
      const c = parseContent(item);
      return {
        id: item.id,
        groupId: item.groupId,
        langId: item.langId,
        q: item.title,
        a: mdToHtml(c.answer),
        ...metaOf(c),
      };
    });
}

// The payload a save would send, without sending it - the AI translation
// compares two of these (see src/components/admin/translationStaging.js).
export async function buildPtsdFaq(draft, ctx = {}) {
  const lang = draft.langId || ctx.lang || 'he';
  const taxonomy = await getTaxonomy();
  const categoryId = requireCategoryId(taxonomy, 'ptsd-info');
  const content = withMeta({ answer: htmlToMd(draft.a) }, draft, ctx);
  return {
    type: 'faq',
    langId: lang,
    title: draft.q,
    content: JSON.stringify(content),
    categoryIds: [categoryId],
  };
}

export async function savePtsdFaq(draft, ctx = {}) {
  return writeArticle(draft, ctx, await buildPtsdFaq(draft, ctx));
}

export function removePtsdFaq(id) {
  return removeArticle(id);
}

// ─── rightsFaq - faq, category `rights`, audienceSlug=bucket, per langId ───
// draft: { id, groupId, langId, q, a, steps, links, general_only? }
//   (a/steps = rich; links = structured passthrough; general_only is not a
//   panel field per the spec's draft column, but is carried through here as
//   an optional passthrough so an existing `general_only:true` FAQ - see
//   src/api/source.js's fetchRightsFaqs comment on the disability-claim FAQ -
//   isn't silently dropped by a save() that doesn't touch it.)
// content JSON: { answer, steps?, links?, general_only? }
// ctx: { lang?, audienceSlug }  (audienceSlug accepts underscore or hyphen)

export async function loadRightsFaq(ctx = {}) {
  const lang = ctx.lang || 'he';
  const audienceSlug = toHyphenSlug(ctx.audienceSlug || 'general');
  const taxonomy = await getTaxonomy();
  const categoryId = requireCategoryId(taxonomy, 'rights');
  const items = await fetchArticles({ type: 'faq', langId: lang, categoryId });
  return items
    .filter(item => (item.audiences || []).some(a => a.slug === audienceSlug))
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(item => {
      const c = parseContent(item);
      const draft = {
        id: item.id,
        groupId: item.groupId,
        langId: item.langId,
        q: item.title,
        a: mdToHtml(c.answer),
        steps: mdToHtml(c.steps),
        links: c.links ?? [],
      };
      if (c.general_only) draft.general_only = true;
      return { ...draft, ...metaOf(c) };
    });
}

export async function buildRightsFaq(draft, ctx = {}) {
  const lang = draft.langId || ctx.lang || 'he';
  const audienceSlug = toHyphenSlug(ctx.audienceSlug || 'general');
  const taxonomy = await getTaxonomy();
  const categoryId = requireCategoryId(taxonomy, 'rights');
  const audienceId = requireAudienceId(taxonomy, audienceSlug);
  const content = withMeta({
    answer: htmlToMd(draft.a),
    ...(draft.steps ? { steps: htmlToMd(draft.steps) } : {}),
    ...(draft.links?.length ? { links: draft.links } : {}),
    ...(draft.general_only ? { general_only: true } : {}),
  }, draft, ctx);
  return {
    type: 'faq',
    langId: lang,
    title: draft.q,
    content: JSON.stringify(content),
    categoryIds: [categoryId],
    audienceIds: [audienceId],
  };
}

export async function saveRightsFaq(draft, ctx = {}) {
  return writeArticle(draft, ctx, await buildRightsFaq(draft, ctx));
}

export function removeRightsFaq(id) {
  return removeArticle(id);
}

// ─── secondCircle - faq, category `second-circle`, per langId ─────────────
// draft: { id, groupId, langId, q, intro, sections:[{heading,body}], closing, callout }
//   (intro/section.body/closing/callout = rich)
// content JSON: { intro, sections:[{heading,body}], closing?, callout? }

export async function loadSecondCircle(ctx = {}) {
  const lang = ctx.lang || 'he';
  const taxonomy = await getTaxonomy();
  const categoryId = requireCategoryId(taxonomy, 'second-circle');
  const items = await fetchArticles({ type: 'faq', langId: lang, categoryId });
  return items
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(item => {
      const c = parseContent(item);
      return {
        id: item.id,
        groupId: item.groupId,
        langId: item.langId,
        q: item.title,
        intro: mdToHtml(c.intro),
        sections: (c.sections ?? []).map(s => ({ heading: s.heading, body: mdToHtml(s.body) })),
        closing: mdToHtml(c.closing),
        callout: mdToHtml(c.callout),
        ...metaOf(c),
      };
    });
}

export async function buildSecondCircle(draft, ctx = {}) {
  const lang = draft.langId || ctx.lang || 'he';
  const taxonomy = await getTaxonomy();
  const categoryId = requireCategoryId(taxonomy, 'second-circle');
  const content = withMeta({
    intro: htmlToMd(draft.intro),
    sections: (draft.sections ?? []).map(s => ({ heading: s.heading, body: htmlToMd(s.body) })),
    ...(draft.closing ? { closing: htmlToMd(draft.closing) } : {}),
    ...(draft.callout ? { callout: htmlToMd(draft.callout) } : {}),
  }, draft, ctx);
  return {
    type: 'faq',
    langId: lang,
    title: draft.q,
    content: JSON.stringify(content),
    categoryIds: [categoryId],
  };
}

export async function saveSecondCircle(draft, ctx = {}) {
  return writeArticle(draft, ctx, await buildSecondCircle(draft, ctx));
}

export function removeSecondCircle(id) {
  return removeArticle(id);
}

// ─── selfHelp - tool, category self-help+sub(category), per langId ────────
// draft: { id, groupId, langId, category, title_he, content_he, apps? }   (per langId)
//   (content_he = rich; apps is an optional passthrough array - no dedicated
//   panel UI edits it yet, so it's carried through byte-for-byte)
// content JSON: { body, apps? }

export async function loadSelfHelp(ctx = {}) {
  const lang = ctx.lang || 'he';
  const taxonomy = await getTaxonomy();
  const parentId = requireCategoryId(taxonomy, 'self-help');
  const items = await fetchArticles({ type: 'tool', langId: lang, categoryId: parentId });
  return items
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(item => {
      const c = parseContent(item);
      return {
        id: item.id,
        groupId: item.groupId,
        langId: item.langId,
        category: subCategorySlug(item.categories),
        title_he: item.title,
        content_he: mdToHtml(c.body),
        ...(c.apps?.length ? { apps: c.apps } : {}),
        ...metaOf(c),
      };
    });
}

export async function buildSelfHelp(draft, ctx = {}) {
  const taxonomy = await getTaxonomy();
  const parentId = requireCategoryId(taxonomy, 'self-help');
  const subId = requireCategoryId(taxonomy, draft.category);
  const content = withMeta({
    body: htmlToMd(draft.content_he),
    ...(draft.apps?.length ? { apps: draft.apps } : {}),
  }, draft, ctx);
  return {
    type: 'tool',
    langId: draft.langId || ctx.lang || 'he',
    title: draft.title_he,
    content: JSON.stringify(content),
    categoryIds: [parentId, subId],
  };
}

export async function saveSelfHelp(draft, ctx = {}) {
  return writeArticle(draft, ctx, await buildSelfHelp(draft, ctx));
}

export function removeSelfHelp(id) {
  return removeArticle(id);
}

// ─── treatment - treatment_step, category `treatment`, per langId ──────────
// draft: { id, groupId, langId, step_number, title_he, description_he, how_to_start_he, methods, links }
//   (how_to_start_he = rich; description_he = plain per spec notes; `methods`
//   is the per-step list of individual therapies - steps 3 and 4 carry them -
//   edited by Admin.jsx's MethodsField; within a method, how_to_start is rich
//   and title/description/links are plain/native)
// content JSON: { description, how_to_start, methods?, links? }
//   `methods` is omitted from the JSON entirely when the step has none, so a
//   step without therapies doesn't grow an empty array in the DB.
// sortOrder = step_number

// ctx.lang picks the translation to edit. All five languages carry their own
// rows (linked by groupId), so the panel has to be able to reach each of them -
// Hebrew-only would leave four fifths of the treatment page uneditable.
export async function loadTreatment(ctx = {}) {
  const lang = ctx.lang || 'he';
  const taxonomy = await getTaxonomy();
  const categoryId = requireCategoryId(taxonomy, 'treatment');
  const items = await fetchArticles({ type: 'treatment_step', langId: lang, categoryId });
  return items
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(item => {
      const c = parseContent(item);
      return {
        id: item.id,
        groupId: item.groupId,
        langId: item.langId,
        step_number: item.sortOrder,
        title_he: item.title,
        description_he: c.description ?? '',
        how_to_start_he: mdToHtml(c.how_to_start),
        // Always an array (never undefined) - the panel binds a methods editor
        // to every step, including ones that don't have any therapies yet.
        methods: (c.methods ?? []).map(m => ({
          title_he: m.title ?? '',
          description_he: m.description ?? '',
          how_to_start_he: mdToHtml(m.how_to_start),
          links: m.links ?? [],
        })),
        links: c.links ?? [],
        ...metaOf(c),
      };
    });
}

export async function buildTreatment(draft, ctx = {}) {
  // An existing row keeps its own language: PATCHing an English step with
  // langId 'he' would silently re-label it as Hebrew.
  const lang = draft.langId || ctx.lang || 'he';
  const taxonomy = await getTaxonomy();
  const categoryId = requireCategoryId(taxonomy, 'treatment');
  const content = withMeta({
    description: draft.description_he ?? '',
    how_to_start: htmlToMd(draft.how_to_start_he),
    ...(draft.methods?.length
      ? {
          methods: draft.methods.map(m => ({
            title: m.title_he ?? '',
            description: m.description_he ?? '',
            how_to_start: htmlToMd(m.how_to_start_he),
            links: m.links ?? [],
          })),
        }
      : {}),
    ...(draft.links?.length ? { links: draft.links } : {}),
  }, draft, ctx);
  return {
    type: 'treatment_step',
    langId: lang,
    title: draft.title_he,
    content: JSON.stringify(content),
    categoryIds: [categoryId],
    sortOrder: draft.step_number,
  };
}

export async function saveTreatment(draft, ctx = {}) {
  return writeArticle(draft, ctx, await buildTreatment(draft, ctx));
}

export function removeTreatment(id) {
  return removeArticle(id);
}

// ─── source - source, category sources+sub(category), per langId, native url
// draft: { id, groupId, langId, title, authors, year, url, description_he, category }
//   (all plain - description_he is plain text per src/api/source.js's comment)
// content JSON: { authors, year, description }

export async function loadSource(ctx = {}) {
  const lang = ctx.lang || 'he';
  const taxonomy = await getTaxonomy();
  const parentId = requireCategoryId(taxonomy, 'sources');
  const items = await fetchArticles({ type: 'source', langId: lang, categoryId: parentId });
  return items.map(item => {
    const c = parseContent(item);
    return {
      id: item.id,
      groupId: item.groupId,
      langId: item.langId,
      title: item.title,
      authors: c.authors ?? '',
      year: c.year ?? '',
      url: item.url ?? '',
      description_he: c.description ?? '',
      category: subCategorySlug(item.categories),
      ...metaOf(c),
    };
  });
}

export async function buildSource(draft, ctx = {}) {
  const taxonomy = await getTaxonomy();
  const parentId = requireCategoryId(taxonomy, 'sources');
  const subId = requireCategoryId(taxonomy, draft.category);
  const content = withMeta({
    authors: draft.authors ?? '',
    year: draft.year ?? '',
    description: draft.description_he ?? '',
  }, draft, ctx);
  return {
    type: 'source',
    langId: draft.langId || ctx.lang || 'he',
    title: draft.title,
    url: draft.url, // native column, required by the API for type=source
    content: JSON.stringify(content),
    categoryIds: [parentId, subId],
  };
}

export async function saveSource(draft, ctx = {}) {
  return writeArticle(draft, ctx, await buildSource(draft, ctx));
}

export function removeSource(id) {
  return removeArticle(id);
}

// ─── childrenGuidelines - article, category children+ageGroup, per langId ──
// Singleton per age group (the "הנחיות" box), not a list - draft is a single
// object (or null if that age group has no guidelines article yet).
// draft: { id, groupId, langId, ageGroup, guidelines }   (guidelines = rich)
// content JSON: { body }
// ctx: { ageGroupSlug, lang? }

export async function loadChildrenGuidelines(ctx = {}) {
  const ageGroupSlug = ctx.ageGroupSlug;
  if (!ageGroupSlug) throw new Error('loadChildrenGuidelines requires ctx.ageGroupSlug');
  const taxonomy = await getTaxonomy();
  const categoryId = requireCategoryId(taxonomy, 'children');
  const items = await fetchArticles({ type: 'article', langId: ctx.lang || 'he', categoryId });
  const item = items.find(it => (it.ageGroups || []).some(g => g.slug === ageGroupSlug));
  if (!item) return null;
  const c = parseContent(item);
  return {
    id: item.id,
    groupId: item.groupId,
    langId: item.langId,
    ageGroup: ageGroupSlug,
    title: item.title,
    guidelines: mdToHtml(c.body),
    ...metaOf(c),
  };
}

export async function buildChildrenGuidelines(draft, ctx = {}) {
  const ageGroupSlug = draft.ageGroup || ctx.ageGroupSlug;
  if (!ageGroupSlug) throw new Error('saveChildrenGuidelines requires draft.ageGroup or ctx.ageGroupSlug');
  const taxonomy = await getTaxonomy();
  const categoryId = requireCategoryId(taxonomy, 'children');
  const ageGroupId = requireAgeGroupId(taxonomy, ageGroupSlug);
  const content = withMeta({ body: htmlToMd(draft.guidelines) }, draft, ctx);
  return {
    type: 'article',
    langId: draft.langId || ctx.lang || 'he',
    // A translated row keeps its own (translated) title.
    title: draft.title || 'הנחיות',
    content: JSON.stringify(content),
    categoryIds: [categoryId],
    ageGroupIds: [ageGroupId],
  };
}

export async function saveChildrenGuidelines(draft, ctx = {}) {
  return writeArticle(draft, ctx, await buildChildrenGuidelines(draft, ctx));
}

export function removeChildrenGuidelines(id) {
  return removeArticle(id);
}

// ─── childrenResource - book/activity/story/video, category children+ageGroup, per langId
// draft: { id, groupId, langId, type, title_he, description_he, content_he, cta_label, cta_url }
//   (content_he = rich; description_he/cta_* = plain)
// content JSON: { body, description, cta?:{label,url} }
// ctx: { ageGroupSlug }

const CHILDREN_RESOURCE_TYPES = new Set(['book', 'activity', 'story', 'video']);

export async function loadChildrenResource(ctx = {}) {
  const ageGroupSlug = ctx.ageGroupSlug;
  if (!ageGroupSlug) throw new Error('loadChildrenResource requires ctx.ageGroupSlug');
  const taxonomy = await getTaxonomy();
  const categoryId = requireCategoryId(taxonomy, 'children');
  const items = await fetchArticles({ langId: ctx.lang || 'he', categoryId });
  return items
    .filter(it => CHILDREN_RESOURCE_TYPES.has(it.type) && (it.ageGroups || []).some(g => g.slug === ageGroupSlug))
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(item => {
      const c = parseContent(item);
      return {
        id: item.id,
        groupId: item.groupId,
        langId: item.langId,
        type: item.type,
        title_he: item.title,
        description_he: c.description ?? '',
        content_he: mdToHtml(c.body),
        cta_label: c.cta?.label ?? '',
        cta_url: c.cta?.url ?? '',
        ...metaOf(c),
      };
    });
}

export async function buildChildrenResource(draft, ctx = {}) {
  const ageGroupSlug = ctx.ageGroupSlug;
  if (!ageGroupSlug) throw new Error('saveChildrenResource requires ctx.ageGroupSlug');
  const taxonomy = await getTaxonomy();
  const categoryId = requireCategoryId(taxonomy, 'children');
  const ageGroupId = requireAgeGroupId(taxonomy, ageGroupSlug);
  const content = withMeta({
    body: htmlToMd(draft.content_he),
    description: draft.description_he ?? '',
    ...(draft.cta_label || draft.cta_url
      ? { cta: { label: draft.cta_label ?? '', url: draft.cta_url ?? '' } }
      : {}),
  }, draft, ctx);
  return {
    type: draft.type,
    langId: draft.langId || ctx.lang || 'he',
    title: draft.title_he,
    content: JSON.stringify(content),
    categoryIds: [categoryId],
    ageGroupIds: [ageGroupId],
  };
}

export async function saveChildrenResource(draft, ctx = {}) {
  return writeArticle(draft, ctx, await buildChildrenResource(draft, ctx));
}

export function removeChildrenResource(id) {
  return removeArticle(id);
}

// ─── community - /admin/communities, native fields ─────────────────────────
// draft: { id, name, organization, description_he, target_audience[], location, meeting_type, contact_url }
//   (all plain - communities never carry HTML/Markdown per the db-remigration
//   spec)
// Native community fields, targetAudiences by audienceIds.
//
// NOTE (flagged): docs/api.md's POST/PUT /admin/communities body only lists
// name/description/location/meetingType/organization/contactUrl/isActive -
// there is no documented field for setting targetAudiences on write (only the
// GET response's `targetAudiences` relation is documented). `audienceIds`
// below is a best-effort guess by analogy with the articles endpoints'
// `audienceIds`; it is UNVERIFIED against the live API (communities were
// explicitly out of scope for this task's one live round-trip test). Also,
// there is no documented `GET /admin/communities` list endpoint - loadCommunity
// uses the public `GET /communities`, so inactive communities (if any) won't
// surface here.

// Communities have no groupId linking a community to its translations, so they
// are edited per language (the admin's language tab) and never AI-translated.
export async function loadCommunity(ctx = {}) {
  // The /communities resource is language-scoped (one row per language), so
  // filter to the tab's language - otherwise every language's rows show up here.
  const items = await adminApi('GET', `/communities?langId=${ctx.lang || 'he'}`);
  return items.map(item => ({
    id: item.id,
    name: item.name,
    organization: item.organization ?? '',
    description_he: item.description ?? '',
    target_audience: (item.targetAudiences || []).map(a => a.slug.replace(/-/g, '_')),
    location: item.location ?? '',
    meeting_type: item.meetingType ?? '',
    contact_url: item.contactUrl ?? '',
  }));
}

export async function saveCommunity(draft, ctx = {}) {
  const taxonomy = await getTaxonomy();
  const audienceIds = (draft.target_audience || [])
    .map(slug => taxonomy.audiencesBySlug.get(toHyphenSlug(slug)))
    .filter(Boolean);
  const payload = {
    // langId is required on create (POST 422s without it) and keeps new
    // communities in that language's list. Verified against the live API.
    langId: ctx.lang || 'he',
    name: draft.name,
    organization: draft.organization || null,
    description: draft.description_he || null,
    location: draft.location || null,
    meetingType: draft.meeting_type || null,
    contactUrl: draft.contact_url || null,
    audienceIds, // see NOTE above - unverified field name
  };
  let saved;
  if (draft.id) {
    saved = await adminApi('PUT', `${COMMUNITIES}/${draft.id}`, payload);
  } else {
    saved = await adminApi('POST', COMMUNITIES, payload);
  }
  await reindexItem(saved?.id ?? draft.id);
  return saved;
}

export async function removeCommunity(id) {
  const res = await adminApi('DELETE', `${COMMUNITIES}/${id}`);
  await reindexItem(id);
  return res;
}

// ─── Questionnaires (dedicated resource; NOT /admin/articles) ─────────────────
// totalQuestions is server-managed - never sent. cutoffScore may be null.
const QUESTIONNAIRES = '/admin/questionnaires';

export function loadQuestionnaires() {
  return adminApi('GET', QUESTIONNAIRES);
}

export function loadQuestionnaireDetail(id) {
  return adminApi('GET', `${QUESTIONNAIRES}/${id}`);
}

function toNullableInt(v) {
  return v === '' || v === null || v === undefined ? null : Number(v);
}

export function createQuestionnaire(draft) {
  const body = {
    langId: draft.langId,
    slug: draft.slug,
    name: draft.name,
    description: draft.description ?? null,
    maxScore: Number(draft.maxScore),
    cutoffScore: toNullableInt(draft.cutoffScore),
    isActive: draft.isActive ?? true,
    sortOrder: Number(draft.sortOrder ?? 0),
  };
  if (Array.isArray(draft.audienceIds)) body.audienceIds = draft.audienceIds;
  return adminApi('POST', QUESTIONNAIRES, body);
}

export function updateQuestionnaire(id, draft) {
  const body = {};
  for (const k of ['langId', 'slug', 'name', 'description', 'isActive']) {
    if (k in draft) body[k] = draft[k];
  }
  if ('maxScore' in draft) body.maxScore = Number(draft.maxScore);
  if ('cutoffScore' in draft) body.cutoffScore = toNullableInt(draft.cutoffScore);
  if ('sortOrder' in draft) body.sortOrder = Number(draft.sortOrder);
  if (Array.isArray(draft.audienceIds)) body.audienceIds = draft.audienceIds;
  return adminApi('PUT', `${QUESTIONNAIRES}/${id}`, body);
}

export function removeQuestionnaire(id) {
  return adminApi('DELETE', `${QUESTIONNAIRES}/${id}`);
}

function normalizeOptions(options) {
  return (options ?? []).map((o, i) => ({
    answer: o.answer,
    score: Number(o.score),
    order: o.order === undefined || o.order === '' ? i : Number(o.order),
  }));
}

export function addQuestion(questionnaireId, q) {
  return adminApi('POST', `${QUESTIONNAIRES}/${questionnaireId}/questions`, {
    sortOrder: Number(q.sortOrder ?? 0),
    text: q.text,
    options: normalizeOptions(q.options),
  });
}

export function updateQuestion(questionnaireId, id, q) {
  const body = {};
  if ('sortOrder' in q) body.sortOrder = Number(q.sortOrder);
  if ('text' in q) body.text = q.text;
  if ('options' in q) body.options = normalizeOptions(q.options);
  return adminApi('PUT', `${QUESTIONNAIRES}/${questionnaireId}/questions/${id}`, body);
}

export function removeQuestion(questionnaireId, id) {
  return adminApi('DELETE', `${QUESTIONNAIRES}/${questionnaireId}/questions/${id}`);
}
