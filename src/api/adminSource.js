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
async function writeArticle(draft, ctx, payload) {
  if (draft.id) {
    return adminApi('PATCH', `${ARTICLES}/${draft.id}`, payload);
  }
  const createPayload = { ...payload, isPublished: ctx.isPublished ?? true };
  if (ctx.groupId) createPayload.groupId = ctx.groupId;
  return adminApi('POST', ARTICLES, createPayload);
}

function removeArticle(id) {
  return adminApi('DELETE', `${ARTICLES}/${id}`);
}

// ─── ptsdFaq — faq, category `ptsd-info`, per langId ───────────────────────
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
      };
    });
}

export async function savePtsdFaq(draft, ctx = {}) {
  const lang = ctx.lang || draft.langId || 'he';
  const taxonomy = await getTaxonomy();
  const categoryId = requireCategoryId(taxonomy, 'ptsd-info');
  const content = { answer: htmlToMd(draft.a) };
  const payload = {
    type: 'faq',
    langId: lang,
    title: draft.q,
    content: JSON.stringify(content),
    categoryIds: [categoryId],
  };
  return writeArticle(draft, ctx, payload);
}

export function removePtsdFaq(id) {
  return removeArticle(id);
}

// ─── rightsFaq — faq, category `rights`, audienceSlug=bucket, per langId ───
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
      return draft;
    });
}

export async function saveRightsFaq(draft, ctx = {}) {
  const lang = ctx.lang || draft.langId || 'he';
  const audienceSlug = toHyphenSlug(ctx.audienceSlug || 'general');
  const taxonomy = await getTaxonomy();
  const categoryId = requireCategoryId(taxonomy, 'rights');
  const audienceId = requireAudienceId(taxonomy, audienceSlug);
  const content = {
    answer: htmlToMd(draft.a),
    ...(draft.steps ? { steps: htmlToMd(draft.steps) } : {}),
    ...(draft.links?.length ? { links: draft.links } : {}),
    ...(draft.general_only ? { general_only: true } : {}),
  };
  const payload = {
    type: 'faq',
    langId: lang,
    title: draft.q,
    content: JSON.stringify(content),
    categoryIds: [categoryId],
    audienceIds: [audienceId],
  };
  return writeArticle(draft, ctx, payload);
}

export function removeRightsFaq(id) {
  return removeArticle(id);
}

// ─── secondCircle — faq, category `second-circle`, per langId ─────────────
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
      };
    });
}

export async function saveSecondCircle(draft, ctx = {}) {
  const lang = ctx.lang || draft.langId || 'he';
  const taxonomy = await getTaxonomy();
  const categoryId = requireCategoryId(taxonomy, 'second-circle');
  const content = {
    intro: htmlToMd(draft.intro),
    sections: (draft.sections ?? []).map(s => ({ heading: s.heading, body: htmlToMd(s.body) })),
    ...(draft.closing ? { closing: htmlToMd(draft.closing) } : {}),
    ...(draft.callout ? { callout: htmlToMd(draft.callout) } : {}),
  };
  const payload = {
    type: 'faq',
    langId: lang,
    title: draft.q,
    content: JSON.stringify(content),
    categoryIds: [categoryId],
  };
  return writeArticle(draft, ctx, payload);
}

export function removeSecondCircle(id) {
  return removeArticle(id);
}

// ─── selfHelp — tool, category self-help+sub(category), he ────────────────
// draft: { id, groupId, langId, category, title_he, content_he, apps? }
//   (content_he = rich; apps is an optional passthrough array - no dedicated
//   panel UI edits it yet, so it's carried through byte-for-byte)
// content JSON: { body, apps? }

export async function loadSelfHelp() {
  const taxonomy = await getTaxonomy();
  const parentId = requireCategoryId(taxonomy, 'self-help');
  const items = await fetchArticles({ type: 'tool', langId: 'he', categoryId: parentId });
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
      };
    });
}

export async function saveSelfHelp(draft, ctx = {}) {
  const taxonomy = await getTaxonomy();
  const parentId = requireCategoryId(taxonomy, 'self-help');
  const subId = requireCategoryId(taxonomy, draft.category);
  const content = {
    body: htmlToMd(draft.content_he),
    ...(draft.apps?.length ? { apps: draft.apps } : {}),
  };
  const payload = {
    type: 'tool',
    langId: 'he',
    title: draft.title_he,
    content: JSON.stringify(content),
    categoryIds: [parentId, subId],
  };
  return writeArticle(draft, ctx, payload);
}

export function removeSelfHelp(id) {
  return removeArticle(id);
}

// ─── treatment — treatment_step, category `treatment`, he ──────────────────
// draft: { id, groupId, langId, step_number, title_he, description_he, how_to_start_he, methods?, links }
//   (how_to_start_he = rich; description_he = plain per spec notes; methods
//   is an optional passthrough array - no dedicated panel UI edits it yet;
//   within it, how_to_start is rich, title/description/links are plain/native)
// content JSON: { description, how_to_start, methods?, links? }
// sortOrder = step_number

export async function loadTreatment() {
  const taxonomy = await getTaxonomy();
  const categoryId = requireCategoryId(taxonomy, 'treatment');
  const items = await fetchArticles({ type: 'treatment_step', langId: 'he', categoryId });
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
        ...(c.methods?.length
          ? {
              methods: c.methods.map(m => ({
                title_he: m.title,
                description_he: m.description ?? '',
                how_to_start_he: mdToHtml(m.how_to_start),
                links: m.links ?? [],
              })),
            }
          : {}),
        links: c.links ?? [],
      };
    });
}

export async function saveTreatment(draft, ctx = {}) {
  const taxonomy = await getTaxonomy();
  const categoryId = requireCategoryId(taxonomy, 'treatment');
  const content = {
    description: draft.description_he ?? '',
    how_to_start: htmlToMd(draft.how_to_start_he),
    ...(draft.methods?.length
      ? {
          methods: draft.methods.map(m => ({
            title: m.title_he,
            description: m.description_he ?? '',
            how_to_start: htmlToMd(m.how_to_start_he),
            links: m.links ?? [],
          })),
        }
      : {}),
    ...(draft.links?.length ? { links: draft.links } : {}),
  };
  const payload = {
    type: 'treatment_step',
    langId: 'he',
    title: draft.title_he,
    content: JSON.stringify(content),
    categoryIds: [categoryId],
    sortOrder: draft.step_number,
  };
  return writeArticle(draft, ctx, payload);
}

export function removeTreatment(id) {
  return removeArticle(id);
}

// ─── source — source, category sources+sub(category), he, native url ──────
// draft: { id, groupId, langId, title, authors, year, url, description_he, category }
//   (all plain - description_he is plain text per src/api/source.js's comment)
// content JSON: { authors, year, description }

export async function loadSource() {
  const taxonomy = await getTaxonomy();
  const parentId = requireCategoryId(taxonomy, 'sources');
  const items = await fetchArticles({ type: 'source', langId: 'he', categoryId: parentId });
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
    };
  });
}

export async function saveSource(draft, ctx = {}) {
  const taxonomy = await getTaxonomy();
  const parentId = requireCategoryId(taxonomy, 'sources');
  const subId = requireCategoryId(taxonomy, draft.category);
  const content = {
    authors: draft.authors ?? '',
    year: draft.year ?? '',
    description: draft.description_he ?? '',
  };
  const payload = {
    type: 'source',
    langId: 'he',
    title: draft.title,
    url: draft.url, // native column, required by the API for type=source
    content: JSON.stringify(content),
    categoryIds: [parentId, subId],
  };
  return writeArticle(draft, ctx, payload);
}

export function removeSource(id) {
  return removeArticle(id);
}

// ─── childrenGuidelines — article, category children+ageGroup, he ─────────
// Singleton per age group (the "הנחיות" box), not a list - draft is a single
// object (or null if that age group has no guidelines article yet).
// draft: { id, groupId, langId, ageGroup, guidelines }   (guidelines = rich)
// content JSON: { body }
// ctx: { ageGroupSlug }

export async function loadChildrenGuidelines(ctx = {}) {
  const ageGroupSlug = ctx.ageGroupSlug;
  if (!ageGroupSlug) throw new Error('loadChildrenGuidelines requires ctx.ageGroupSlug');
  const taxonomy = await getTaxonomy();
  const categoryId = requireCategoryId(taxonomy, 'children');
  const items = await fetchArticles({ type: 'article', langId: 'he', categoryId });
  const item = items.find(it => (it.ageGroups || []).some(g => g.slug === ageGroupSlug));
  if (!item) return null;
  const c = parseContent(item);
  return {
    id: item.id,
    groupId: item.groupId,
    langId: item.langId,
    ageGroup: ageGroupSlug,
    guidelines: mdToHtml(c.body),
  };
}

export async function saveChildrenGuidelines(draft, ctx = {}) {
  const ageGroupSlug = draft.ageGroup || ctx.ageGroupSlug;
  if (!ageGroupSlug) throw new Error('saveChildrenGuidelines requires draft.ageGroup or ctx.ageGroupSlug');
  const taxonomy = await getTaxonomy();
  const categoryId = requireCategoryId(taxonomy, 'children');
  const ageGroupId = requireAgeGroupId(taxonomy, ageGroupSlug);
  const content = { body: htmlToMd(draft.guidelines) };
  const payload = {
    type: 'article',
    langId: 'he',
    title: 'הנחיות',
    content: JSON.stringify(content),
    categoryIds: [categoryId],
    ageGroupIds: [ageGroupId],
  };
  return writeArticle(draft, ctx, payload);
}

export function removeChildrenGuidelines(id) {
  return removeArticle(id);
}

// ─── childrenResource — book/activity/story/video, category children+ageGroup, he ─
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
  const items = await fetchArticles({ langId: 'he', categoryId });
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
      };
    });
}

export async function saveChildrenResource(draft, ctx = {}) {
  const ageGroupSlug = ctx.ageGroupSlug;
  if (!ageGroupSlug) throw new Error('saveChildrenResource requires ctx.ageGroupSlug');
  const taxonomy = await getTaxonomy();
  const categoryId = requireCategoryId(taxonomy, 'children');
  const ageGroupId = requireAgeGroupId(taxonomy, ageGroupSlug);
  const content = {
    body: htmlToMd(draft.content_he),
    description: draft.description_he ?? '',
    ...(draft.cta_label || draft.cta_url
      ? { cta: { label: draft.cta_label ?? '', url: draft.cta_url ?? '' } }
      : {}),
  };
  const payload = {
    type: draft.type,
    langId: 'he',
    title: draft.title_he,
    content: JSON.stringify(content),
    categoryIds: [categoryId],
    ageGroupIds: [ageGroupId],
  };
  return writeArticle(draft, ctx, payload);
}

export function removeChildrenResource(id) {
  return removeArticle(id);
}

// ─── community — /admin/communities, native fields ─────────────────────────
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

export async function loadCommunity() {
  const items = await adminApi('GET', '/communities');
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

export async function saveCommunity(draft) {
  const taxonomy = await getTaxonomy();
  const audienceIds = (draft.target_audience || [])
    .map(slug => taxonomy.audiencesBySlug.get(toHyphenSlug(slug)))
    .filter(Boolean);
  const payload = {
    name: draft.name,
    organization: draft.organization || null,
    description: draft.description_he || null,
    location: draft.location || null,
    meetingType: draft.meeting_type || null,
    contactUrl: draft.contact_url || null,
    audienceIds, // see NOTE above - unverified field name
  };
  if (draft.id) {
    return adminApi('PUT', `${COMMUNITIES}/${draft.id}`, payload);
  }
  return adminApi('POST', COMMUNITIES, payload);
}

export function removeCommunity(id) {
  return adminApi('DELETE', `${COMMUNITIES}/${id}`);
}
