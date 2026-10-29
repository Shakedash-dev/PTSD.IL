// Which fields of a Metiv collection item the admin shows, and how. The rule is
// "content, not format": an editor changes what the visitor reads and the
// facts a person keeps up to date (phones, emails, links, dates, prices, the
// flags that change what the page shows), never ids, routes, icons, category
// keys, scrape provenance or the headings the page layout uses.
//
// Hidden fields are not shown at all, not even collapsed; they are still saved
// unchanged, because the editor edits the whole object. A `{ $ref }` item is
// shown read-only, as a pointer to where it is edited.
//
// Paths are patterns: keys joined by ".", "[]" after a key for "any item of
// this list" - "contacts[].kind", "syllabus[].items[]".
//
// Three rules also look at the value:
//   - an object with a `to` (an internal route, e.g. a department's "קורסים
//     והכשרות" link) is navigation: its caption and target are both fixed;
//   - a date with an ISO twin (`date` next to `dateISO`, `startDate` next to
//     `startDateISO`) is derived by the site from the ISO date, and so is
//     `isPast` in that object: only the ISO date is edited (a date picker).
//     Items without an ISO date keep their free-text date and manual isPast;
//   - per collection, `hideIf` hides a field by its value (an event link that
//     is an internal route).

/** Keys hidden wherever they appear (collection items, not page copy). */
export const HIDDEN_KEYS = new Set([
  'id', 'slug', 'key', 'anchor', 'icon', 'kind', 'route', 'to', 'area', 'parent',
  'category', 'topic', 'image',
  'courseSlug', 'relatedCourseSlug', 'relatedSlugs', 'trainingSlug',
  'sourceUrl', 'source', 'relatedSourceUrls',
  // Derived by the site from the link (absolute http(s) = external).
  'external', 'aboutRoute',
  // Button and link captions, and the small label above a heading: format.
  'ctaLabel', 'linkLabel', 'aboutLinkLabel', 'eyebrow',
]);

/**
 * A fixed list of choices: shown as a select instead of being hidden.
 * @typedef {{ value: string, label: string }} Choice
 */

const REGISTRATION_STATUS = [
  { value: 'open', label: 'הרשמה פתוחה' },
  { value: 'closed', label: 'ההרשמה נסגרה' },
  { value: 'unknown', label: 'פרטים בפנייה' },
];
const UNIT_STATUS = [
  { value: 'soon', label: 'בקרוב' },
  { value: 'closed', label: 'ההרשמה נסגרה' },
  { value: 'ended', label: 'הסתיים' },
];
const PAPER_TYPE = [
  { value: 'article', label: 'מאמר' },
  { value: 'chapter', label: 'פרק בספר' },
];

/**
 * Where a select's choices come from: a fixed list, or another collection's
 * Hebrew data (the taxonomies are not edited here, so new items pick from them).
 * @typedef {Choice[] | ((he: Record<string, any>) => Choice[])} ChoiceSource
 */

/**
 * Choices whose labels are the page's own chip labels (page copy), so the
 * editor picks with the words the visitor sees. `he.COPY` is the Hebrew page
 * copy by namespace.
 * @param {string} ns @param {[string, string][]} pairs  [stored key, copy key]
 * @returns {ChoiceSource}
 */
const fromCopy = (ns, pairs) => he => pairs.map(([value, key]) => ({ value, label: String(he.COPY?.[ns]?.[key] ?? value) }));

const isRoute = v => typeof v === 'string' && v.startsWith('/');

/** @type {Record<string, { hide?: string[], options?: Record<string, ChoiceSource>, hideIf?: Record<string, (value: any) => boolean> }>} */
export const COLLECTION_RULES = {
  // The slogan (headline) and tagline are content; the short name is the brand.
  ORG: { hide: ['shortName'] },
  ABOUT: { hide: ['title'] },
  DONATE: { hide: ['title', 'ways[].cta'] },
  LEGAL: { hide: ['accessibility.title', 'privacy.title'] },
  // Crisis lines (ERAN 1201, MDA 101...) are fixed national numbers: not edited.
  PATIENT_HUB: { hide: ['hero.brand', 'hero.headline', 'hero.subtitle', 'crisisLines'] },
  CONSULTATION: { hide: ['title'] },
  VIDEO_LECTURES: { hide: ['title'] },
  TREATMENT_WHERE_BLOCK: { hide: ['title'] },
  RELEASE_JOURNEY: { hide: ['title', 'social[].label'] },
  // The chip label repeats the title.
  JOURNEY_MODELS: { hide: ['label'] },
  // An internal route ("/therapist/courses/...") is navigation; an external
  // URL is content.
  EVENTS: { hideIf: { link: isRoute } },
  THERAPIST_HUB: { hide: ['title', 'sections[].title', 'cta.label'] },
  RESEARCH_INTRO: { hide: ['title', 'journalClub.title'] },
  BOOKS: { hide: ['language', 'audience'] },
  // Which chips of a page's question an item answers: a pick from the chips.
  CHILDREN_FAMILY_INTRO: {
    hide: ['title'],
    options: { 'models[].ageGroups': fromCopy('childrenFamily', [['early', 'ageEarly'], ['school', 'ageSchool'], ['parents', 'ageParents']]) },
  },
  SUPERVISION: {
    hide: ['title'],
    options: { 'options[].kinds': fromCopy('supervision', [['individual', 'kindIndividual'], ['group', 'kindGroup'], ['team', 'kindTeam'], ['kids', 'kindKids']]) },
  },
  ORGANIZATION_PROGRAMS: {
    options: { needs: fromCopy('organizations', [['informed', 'needInformed'], ['workshop', 'needWorkshop'], ['clinical', 'needClinical']]) },
  },
  ARTICLES: {
    options: { genre: fromCopy('articlePage', [['opinion', 'eyebrow']]) },
  },
  PAPERS: {
    hide: ['language'],
    options: {
      type: PAPER_TYPE,
      topic: he => Object.entries(he.PAPER_TOPICS ?? {}).filter(([k]) => !k.startsWith('_')).map(([value, label]) => ({ value, label: String(label) })),
    },
  },
  COURSES: {
    hide: ['registration.label', 'formats[].registration.label'],
    options: {
      category: he => (he.COURSE_CATEGORIES ?? []).map(c => ({ value: c.key, label: c.label })),
      'registration.status': REGISTRATION_STATUS,
      'formats[].registration.status': REGISTRATION_STATUS,
      'units[].status': UNIT_STATUS,
      therapistNeeds: fromCopy('therapistHub', [['supervision', 'needSupervision'], ['team', 'needTeam'], ['kids', 'needKids']]),
    },
  },
  TEAM: {
    options: { group: he => (he.TEAM_GROUPS ?? []).map(g => ({ value: g, label: g })) },
  },
};

/** "syllabus.0.title" / ["syllabus", 0, "title"] -> "syllabus[].title" */
export function patternOf(path) {
  const parts = Array.isArray(path) ? path : String(path).split('.').filter(Boolean);
  let out = '';
  for (const p of parts) {
    if (typeof p === 'number' || /^\d+$/.test(String(p))) out += '[]';
    else out += out ? `.${p}` : String(p);
  }
  return out;
}

/** Is `pattern` the same as `prefix`, or inside it? */
function within(pattern, prefix) {
  return pattern === prefix || pattern.startsWith(`${prefix}.`) || pattern.startsWith(`${prefix}[]`);
}

/** Dates kept as ISO strings for sorting; edited with a date picker. */
export function isDateKey(key) {
  return /ISO$/.test(key);
}

/**
 * Is a field shown? `value` is the field's value and `parent` the object that
 * holds it, for the value rules above; both optional.
 * @typedef {(pattern: string, key: string, value?: any, parent?: any) => boolean} Visible
 */

/** Keys of `parent` the site derives from an ISO date next to them. */
function derivedFromIso(key, parent) {
  if (!parent || typeof parent !== 'object' || Array.isArray(parent)) return false;
  if (`${key}ISO` in parent) return true;
  return key === 'isPast' && Object.keys(parent).some(isDateKey);
}

/** An internal link ({ label, to }): navigation, not content. */
export function isNavLink(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && typeof value.to === 'string';
}

/**
 * The editor rules for one section.
 * @param {{ collection?: string, fields?: string[], copyKeys?: string[], he?: Record<string, any>, translation?: boolean }} opts
 *   collection  the registry key (absent for page copy)
 *   fields      only these paths (and what is inside them) are shown
 *   copyKeys    page copy: only these keys are shown
 *   he          the Hebrew data by collection key, for select choices
 *   translation a non-Hebrew tab: choices are set in Hebrew for every language
 * @returns {{ visible: Visible, options: (pattern: string) => Choice[]|null }}
 */
export function fieldRules({ collection, fields, copyKeys, he = {}, translation = false }) {
  if (copyKeys) {
    const keys = new Set(copyKeys);
    return { visible: (pattern, key) => !pattern.includes('.') && keys.has(key), options: () => null };
  }
  const rules = (collection && COLLECTION_RULES[collection]) || {};
  const options = (/** @type {string} */ pattern) => {
    const src = rules.options?.[pattern];
    if (!src) return null;
    return typeof src === 'function' ? src(he) : src;
  };
  /** @type {Visible} */
  const visible = (pattern, key, value, parent) => {
    if (key.startsWith('_') || key === '$ref') return false;
    if (rules.options?.[pattern]) return !translation;
    if (HIDDEN_KEYS.has(key)) return false;
    if (isNavLink(value)) return false;
    if (derivedFromIso(key, parent)) return false;
    if (value !== undefined && rules.hideIf?.[pattern]?.(value)) return false;
    if (rules.hide?.some(h => within(pattern, h))) return false;
    if (fields && !fields.some(f => within(pattern, f) || within(f, pattern))) return false;
    return true;
  };
  return { visible, options };
}

/**
 * Does a value have anything an editor would see under these rules? A list or
 * object whose every field is hidden is hidden itself, and so is an internal
 * link.
 * @param {any} value @param {string} pattern @param {Visible} visible
 */
export function hasVisible(value, pattern, visible) {
  if (Array.isArray(value)) {
    if (!value.length) return true;
    return value.some(x => hasVisible(x, `${pattern}[]`, visible));
  }
  if (value && typeof value === 'object') {
    if ('$ref' in value) return true;
    if (isNavLink(value)) return false;
    return Object.entries(value).some(([k, v]) => {
      const p = pattern ? `${pattern}.${k}` : k;
      return visible(p, k, v, value) && hasVisible(v, p, visible);
    });
  }
  return true;
}
