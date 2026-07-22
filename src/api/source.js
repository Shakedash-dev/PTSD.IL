// Data source layer. The ONLY file in src/api/ that knows where data
// physically lives. This talks to the live API gateway and reshapes each
// response back into the exact shape the pages/hooks have always consumed -
// pages and hooks.js are untouched.
//
// The API flattens what used to be structured static content into a single
// HTML `content` blob per article. Each adapter below maps that blob into the
// page's primary display field and leaves now-gone structured extras (e.g.
// second-circle's intro/sections/closing/callout split, rights' separate
// `steps` block, treatment's per-method breakdown) empty. See
// docs/superpowers/specs/2026-07-22-api-integration-design.md for the full
// per-entity mapping and the accepted degradations.

const API = import.meta.env.VITE_API_URL; // e.g. https://ptsd-il-api.onrender.com/api

async function api(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
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

export async function fetchSources() {
  const items = await api('/articles?type=source&langId=he');
  return items.map(item => ({
    title: item.title,
    authors: item.authors,
    year: item.year,
    url: item.url,
    description_he: item.content ?? item.description ?? '',
    category: subCategorySlug(item.categories),
  }));
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

export async function fetchSelfHelpTools() {
  const [tools, apps] = await Promise.all([
    api('/articles?type=tool&langId=he'),
    api('/articles?type=app&langId=he'),
  ]);

  const appsByParentId = apps.reduce((acc, a) => {
    (acc[a.parentId] ??= []).push(a);
    return acc;
  }, {});

  return tools
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(item => {
      const category = subCategorySlug(item.categories);
      const icon =
        category === 'complementary' && item.title.includes('יוגה')
          ? 'Moon'
          : SELF_HELP_ICON_BY_CATEGORY[category] ?? 'Wind';

      const tool = {
        category,
        icon,
        title_he: item.title,
        content_he: item.content ?? '',
      };

      const childApps = appsByParentId[item.id];
      if (childApps?.length) {
        tool.apps = childApps
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(a => ({
            title_he: a.title,
            description_he: a.description ?? '',
            ios_url: a.url ?? '',
            android_url: a.links?.find(l => /google ?play/i.test(l.label))?.url ?? '',
          }));
      }

      return tool;
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

export async function fetchTreatmentSteps() {
  const items = await api('/articles?type=treatment_step&langId=he');
  return items
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(item => ({
      step_number: item.sortOrder,
      icon: TREATMENT_STEP_ICON_BY_NUMBER[item.sortOrder],
      title_he: item.title,
      description_he: item.content ?? '',
      how_to_start_he: '',
      links: item.links ?? [],
    }));
}

export async function fetchChildrenContent() {
  const items = await api('/articles?categorySlug=children&langId=he');
  const RESOURCE_TYPES = new Set(['book', 'activity', 'story', 'video', 'app']);

  const result = {};
  for (const item of items) {
    const ageGroupSlug = item.ageGroups?.[0]?.slug;
    if (!ageGroupSlug) continue;
    result[ageGroupSlug] ??= { guidelines: '', resources: [] };

    if (item.type === 'article') {
      // The per-age-group container article - its content is the guidelines HTML.
      result[ageGroupSlug].guidelines = item.content ?? '';
    } else if (RESOURCE_TYPES.has(item.type)) {
      result[ageGroupSlug].resources.push({
        type: item.type,
        title_he: item.title,
        description_he: item.description ?? '',
        content_he: item.content ?? '',
        cta_label: '',
        cta_url: item.url ?? '',
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
// every other category, matching the pre-API behavior in source.js.
//
// NOTE: the static data had a `general_only` flag on one "general" FAQ to keep
// it from being appended to other tabs (it pointed at the wrong process for
// e.g. security-forces claimants). The API carries no equivalent flag, so
// that item is now appended everywhere "general" is appended. Minor,
// accepted behavior change - see report.
export async function fetchRightsFaqs({ lang = 'he', category }) {
  const items = await fetchWithHebrewFallback('/articles?type=faq&categorySlug=rights', lang);

  const toFaq = item => ({
    q: item.title,
    a: item.content ?? '',
    steps: '',
    links: item.links ?? [],
  });
  const audienceOf = item => toUnderscore(item.audiences[0]?.slug ?? 'general');

  const specific = items
    .filter(item => audienceOf(item) === category)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(toFaq);

  if (category === 'general') return specific;

  const general = items
    .filter(item => audienceOf(item) === 'general')
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(toFaq);

  return [...specific, ...general];
}

export async function fetchPTSDInfoFaqs({ lang = 'he' }) {
  const items = await fetchWithHebrewFallback('/articles?type=faq&categorySlug=ptsd-info', lang);
  return items
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(item => ({ q: item.title, a: item.content ?? '' }));
}

export async function fetchSecondCircleTools({ lang = 'he' }) {
  const items = await fetchWithHebrewFallback('/articles?type=faq&categorySlug=second-circle', lang);
  return items
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(item => ({
      q: item.title,
      intro: item.content ?? '',
      sections: [],
      closing: '',
      callout: '',
    }));
}
