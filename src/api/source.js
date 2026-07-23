// Data source layer. The ONLY file in src/api/ that knows where data
// physically lives. This talks to the live API gateway and reshapes each
// response back into the exact shape the pages/hooks have always consumed -
// pages and hooks.js are untouched.
//
// Post re-migration, each article's `content` is a JSON STRING holding the
// item's structured editing-screen fields, with every rich-text leaf as
// Markdown (rendered client-side by <Markdown>, see src/components/Markdown.jsx).
// Every adapter below JSON.parses `content` and rebuilds the page's shape from
// the structured fields, instead of relying on a single flattened HTML blob.
// See docs/superpowers/specs/2026-07-22-db-remigration-spec.md and
// 2026-07-22-fe-markdown-rewrite-spec.md for the full per-entity mapping.

const API = import.meta.env.VITE_API_URL; // e.g. https://ptsd-il-api.onrender.com/api

async function api(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

// `content` is a JSON string (structured fields, Markdown leaves) or null for
// items that don't carry any (shouldn't normally happen, but be defensive).
function parseContent(item) {
  if (!item.content) return {};
  try {
    return JSON.parse(item.content);
  } catch {
    return {};
  }
}

// The API's audience/target-audience slugs use hyphens (e.g.
// "security-forces"), but the pages/filters use underscores (e.g.
// "security_forces"). Normalize so existing category keys keep matching.
function toUnderscore(slug) {
  return slug.replace(/-/g, '_');
}

// The sub-category (e.g. "sleep", "research") is the categories[] entry that
// has a parentId set - the top-level category (e.g. "self-help", "sources")
// has parentId === null.
function subCategorySlug(categories) {
  return categories.find(c => c.parentId)?.slug ?? categories[0]?.slug;
}

async function fetchWithHebrewFallback(path, lang) {
  const items = await api(`${path}&langId=${lang}`);
  if (items.length === 0 && lang !== 'he') {
    return api(`${path}&langId=he`);
  }
  return items;
}

export async function fetchSources({ lang = 'he' } = {}) {
  const items = await fetchWithHebrewFallback('/articles?type=source', lang);
  return items.map(item => {
    const c = parseContent(item);
    return {
      title: item.title,
      authors: c.authors,
      year: c.year,
      // Native column - required by the API for type=source.
      url: item.url,
      // Plain text (not Markdown) - Sources.jsx renders it as-is.
      description_he: c.description ?? '',
      category: subCategorySlug(item.categories),
    };
  });
}

export async function fetchCommunities() {
  const items = await api('/communities');
  return items.map(item => ({
    id: item.id,
    name: item.name,
    organization: item.organization,
    description_he: item.description ?? '',
    target_audience: item.targetAudiences.map(a => toUnderscore(a.slug)),
    location: item.location,
    meeting_type: item.meetingType,
    contact_url: item.contactUrl,
  }));
}

// Self-help tools carry no icon in the API (icons are a pure UI concern).
// Map by sub-category, with a title-based override for "complementary" since
// two distinct tools (BBM breathing, yoga nidra) share that sub-category.
const SELF_HELP_ICON_BY_CATEGORY = {
  sleep: 'Moon',
  journaling: 'PenLine',
  apps: 'Smartphone',
  complementary: 'Wind',
};

export async function fetchSelfHelpTools({ lang = 'he' } = {}) {
  const tools = await fetchWithHebrewFallback('/articles?type=tool', lang);

  return tools
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(item => {
      const c = parseContent(item);
      const category = subCategorySlug(item.categories);
      const icon =
        category === 'complementary' && item.title.includes('יוגה')
          ? 'Moon'
          : SELF_HELP_ICON_BY_CATEGORY[category] ?? 'Wind';

      return {
        category,
        icon,
        title_he: item.title,
        content_he: c.body ?? '',
        apps: (c.apps ?? []).map(a => ({
          title_he: a.title,
          description_he: a.description ?? '',
          ios_url: a.ios_url ?? '',
          android_url: a.android_url ?? '',
        })),
      };
    });
}

// Treatment steps are a fixed, ordered sequence of 5 - icon is pure UI, not
// content, and isn't carried by the API. Map it positionally by step_number.
const TREATMENT_STEP_ICON_BY_NUMBER = {
  1: 'Wrench',
  2: 'Building2',
  3: 'Brain',
  4: 'Leaf',
  5: 'Pill',
};

export async function fetchTreatmentSteps({ lang = 'he' } = {}) {
  const items = await fetchWithHebrewFallback('/articles?type=treatment_step', lang);
  return items
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(item => {
      const c = parseContent(item);
      return {
        step_number: item.sortOrder,
        icon: TREATMENT_STEP_ICON_BY_NUMBER[item.sortOrder],
        title_he: item.title,
        // Plain text (subtitle).
        description_he: c.description ?? '',
        // Markdown (the "איך מתחילים" box) - only used when there are no methods.
        how_to_start_he: c.how_to_start ?? '',
        methods: (c.methods ?? []).map(m => ({
          title_he: m.title,
          description_he: m.description ?? '',
          how_to_start_he: m.how_to_start ?? '',
          links: m.links ?? [],
        })),
        links: c.links ?? [],
      };
    });
}

export async function fetchChildrenContent({ lang = 'he' } = {}) {
  const items = await fetchWithHebrewFallback('/articles?categorySlug=children', lang);
  const RESOURCE_TYPES = new Set(['book', 'activity', 'story', 'video']);

  const result = {};
  for (const item of items) {
    const ageGroupSlug = item.ageGroups?.[0]?.slug;
    if (!ageGroupSlug) continue;
    result[ageGroupSlug] ??= { guidelines: '', resources: [] };
    const c = parseContent(item);

    if (item.type === 'article') {
      // The per-age-group container article - its content is the guidelines (md).
      result[ageGroupSlug].guidelines = c.body ?? '';
    } else if (RESOURCE_TYPES.has(item.type)) {
      result[ageGroupSlug].resources.push({
        type: item.type,
        title_he: item.title,
        description_he: c.description ?? '',
        content_he: c.body ?? '',
        cta_label: c.cta?.label ?? '',
        cta_url: c.cta?.url ?? '',
        _sortOrder: item.sortOrder,
      });
    }
  }

  for (const ageGroupSlug of Object.keys(result)) {
    result[ageGroupSlug].resources.sort((a, b) => a._sortOrder - b._sortOrder);
    result[ageGroupSlug].resources.forEach(r => delete r._sortOrder);
  }
  return result;
}

// Rights FAQs are bucketed by lang then category via the `audiences[]` field
// (normalized hyphen->underscore). General-category items are appended to
// every other category, matching the pre-migration static-data behavior -
// EXCEPT items flagged `general_only` in content (kept for the "general" tab
// itself, but not appended anywhere else - e.g. the general disability-claim
// FAQ that would otherwise mislead security-forces claimants).
export async function fetchRightsFaqs({ lang = 'he', category }) {
  const items = await fetchWithHebrewFallback('/articles?type=faq&categorySlug=rights', lang);
  const parsed = items.map(item => ({ item, c: parseContent(item) }));

  const toFaq = ({ item, c }) => ({
    q: item.title,
    a: c.answer ?? '',
    steps: c.steps ?? '',
    links: c.links ?? [],
  });
  const audienceOf = ({ item }) => toUnderscore(item.audiences[0]?.slug ?? 'general');

  const specific = parsed
    .filter(entry => audienceOf(entry) === category)
    .sort((a, b) => a.item.sortOrder - b.item.sortOrder)
    .map(toFaq);

  if (category === 'general') return specific;

  const general = parsed
    .filter(entry => audienceOf(entry) === 'general' && !entry.c.general_only)
    .sort((a, b) => a.item.sortOrder - b.item.sortOrder)
    .map(toFaq);

  return [...specific, ...general];
}

export async function fetchPTSDInfoFaqs({ lang = 'he' }) {
  const items = await fetchWithHebrewFallback('/articles?type=faq&categorySlug=ptsd-info', lang);
  return items
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(item => {
      const c = parseContent(item);
      return { q: item.title, a: c.answer ?? '' };
    });
}

export async function fetchSecondCircleTools({ lang = 'he' }) {
  const items = await fetchWithHebrewFallback('/articles?type=faq&categorySlug=second-circle', lang);
  return items
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(item => {
      const c = parseContent(item);
      return {
        q: item.title,
        intro: c.intro ?? '',
        sections: (c.sections ?? []).map(s => ({ heading: s.heading, body: s.body ?? '' })),
        closing: c.closing ?? '',
        callout: c.callout ?? '',
      };
    });
}
