// Every Metiv content collection the v3 demo reads from the DB. One entry per
// collection: the name the pages use (`key`, same as the old static export),
// its child category under `metiv` (`slug`), how it is stored (`kind`), which
// admin group it belongs to (`area`), the Hebrew admin label, and which fields
// give a row its title and its stable `_key`.
//
// `chatbot: true` collections are indexed by the chatbot worker (patient-facing
// facts only). The worker keeps its own list - worker/src/lib/api.ts
// METIV_CHATBOT_SLUGS - and src/test/metiv-db-registry.test.js keeps the two in
// sync. Full model: docs/metiv-db-spec.md.

/**
 * @typedef {'list'|'single'|'strings'|'copy'} CollectionKind
 * @typedef {'general'|'patient'|'therapist'} Area
 * @typedef {Object} Collection
 * @property {string} key
 * @property {string} slug
 * @property {CollectionKind} kind
 * @property {Area} area
 * @property {string} label
 * @property {string} [titleField]
 * @property {string} [idField]
 * @property {boolean} [chatbot]
 */

export const METIV_PARENT_SLUG = 'metiv';
export const COPY_SLUG = 'metiv-copy';

/** @type {Collection[]} */
export const COLLECTIONS = [
  // ── General / about Metiv ──────────────────────────────────────────────────
  { key: 'ORG', slug: 'metiv-org', kind: 'single', area: 'general', label: 'פרטי הארגון ויצירת קשר', chatbot: true },
  { key: 'CONTACTS', slug: 'metiv-contacts', kind: 'single', area: 'general', label: 'טלפונים וקווי חירום', chatbot: true },
  { key: 'ABOUT', slug: 'metiv-about', kind: 'single', area: 'general', label: 'על מטיב' },
  { key: 'FACTS', slug: 'metiv-facts', kind: 'list', area: 'general', label: 'מספרים ועובדות', titleField: 'label' },
  { key: 'TEAM', slug: 'metiv-team', kind: 'list', area: 'general', label: 'צוות', titleField: 'name', idField: 'name' },
  { key: 'TEAM_GROUPS', slug: 'metiv-team-groups', kind: 'strings', area: 'general', label: 'קבוצות צוות' },
  { key: 'DEPARTMENT_GROUPS', slug: 'metiv-department-groups', kind: 'list', area: 'general', label: 'מחלקות ויחידות', titleField: 'title', idField: 'key' },
  { key: 'PARTNERS', slug: 'metiv-partners', kind: 'strings', area: 'general', label: 'שותפים (רשימה)' },
  { key: 'FUNDERS_AND_COLLABORATORS', slug: 'metiv-funders', kind: 'list', area: 'general', label: 'גופים מממנים ושותפים', titleField: 'name', idField: 'name' },
  { key: 'PARTNER_GROUPS', slug: 'metiv-partner-groups', kind: 'list', area: 'general', label: 'קבוצות שותפים', titleField: 'title', idField: 'key' },
  { key: 'COLLABORATION_GROUPS', slug: 'metiv-collaboration-groups', kind: 'list', area: 'general', label: 'שיתופי פעולה', titleField: 'title', idField: 'key' },
  { key: 'COLLABORATION_CONTACT', slug: 'metiv-collaboration-contact', kind: 'single', area: 'general', label: 'איש קשר לשיתופי פעולה' },
  { key: 'METIV_SERVICES', slug: 'metiv-services', kind: 'list', area: 'general', label: 'הטיפולים במטיב', titleField: 'title', idField: 'id', chatbot: true },
  { key: 'DONATE', slug: 'metiv-donate', kind: 'single', area: 'general', label: 'תרומה' },
  { key: 'NAV', slug: 'metiv-nav', kind: 'list', area: 'general', label: 'תפריט ראשי', titleField: 'label', idField: 'key' },
  { key: 'ROUTE_META', slug: 'metiv-route-meta', kind: 'single', area: 'general', label: 'שמות עמודים ופירורי לחם' },
  { key: 'LEGAL', slug: 'metiv-legal', kind: 'single', area: 'general', label: 'הצהרת נגישות ופרטיות (תקציר)' },
  { key: 'LEGAL_DOCS', slug: 'metiv-legal-docs', kind: 'single', area: 'general', label: 'מדיניות פרטיות ותנאי שימוש' },

  // ── Patient area (Metiv additions to the PTSD-IL content) ──────────────────
  { key: 'PATIENT_NAV', slug: 'metiv-patient-nav', kind: 'list', area: 'patient', label: 'תפריט אזור המטופלים', titleField: 'label', idField: 'key' },
  { key: 'PATIENT_HUB', slug: 'metiv-patient-hub', kind: 'single', area: 'patient', label: 'כניסה לאזור המטופלים' },
  { key: 'SHORT_VERSIONS', slug: 'metiv-short-versions', kind: 'single', area: 'patient', label: 'תיבות "בקצרה"' },
  { key: 'NEXT_STEPS', slug: 'metiv-next-steps', kind: 'single', area: 'patient', label: 'הצעד הבא בכל עמוד' },
  { key: 'PUBLIC_OPTIONS', slug: 'metiv-public-options', kind: 'list', area: 'patient', label: 'איפה מקבלים טיפול: מסגרות ציבוריות', titleField: 'title', idField: 'id', chatbot: true },
  { key: 'NONPROFIT_OPTIONS', slug: 'metiv-nonprofit-options', kind: 'list', area: 'patient', label: 'איפה מקבלים טיפול: עמותות', titleField: 'title', idField: 'id', chatbot: true },
  { key: 'CONSULTATION', slug: 'metiv-consultation', kind: 'single', area: 'patient', label: 'לא בטוחים אם לפנות?', chatbot: true },
  { key: 'FREE_TREATMENTS', slug: 'metiv-free-treatments', kind: 'list', area: 'patient', label: 'טיפולים ללא עלות', titleField: 'title', idField: 'id', chatbot: true },
  { key: 'RESEARCH_STUDIES', slug: 'metiv-research-studies', kind: 'list', area: 'patient', label: 'מחקרים שמגייסים משתתפים', titleField: 'title', idField: 'id', chatbot: true },
  { key: 'RESERVIST_FAMILY_PROGRAMS', slug: 'metiv-reservist-family', kind: 'list', area: 'patient', label: 'למשפחות מילואימניקים', titleField: 'title', idField: 'id', chatbot: true },
  { key: 'VETERANS_PROGRAMS', slug: 'metiv-veterans', kind: 'list', area: 'patient', label: 'חיילים משוחררים ומילואימניקים', titleField: 'title', idField: 'id', chatbot: true },
  { key: 'PARENT_CHILD_GROUPS', slug: 'metiv-parent-child', kind: 'list', area: 'patient', label: 'קבוצות להורים וילדים', titleField: 'title', idField: 'id', chatbot: true },
  { key: 'METIV_BOOKS', slug: 'metiv-patient-books', kind: 'list', area: 'patient', label: 'ספרים של אנשי מטיב', titleField: 'title', idField: 'title', chatbot: true },
  { key: 'METIV_BOOKS_ORDER_NOTE', slug: 'metiv-books-note', kind: 'single', area: 'patient', label: 'הערת הזמנת ספרים' },
  { key: 'VIDEO_LECTURES', slug: 'metiv-video-lectures', kind: 'single', area: 'patient', label: 'הרצאות וידאו', chatbot: true },
  { key: 'TREATMENT_WHERE_BLOCK', slug: 'metiv-treatment-where', kind: 'single', area: 'patient', label: 'המסע הטיפולי: איפה מקבלים טיפול' },
  { key: 'RELEASE_JOURNEY', slug: 'metiv-release-journey', kind: 'single', area: 'patient', label: 'מסע שחרור', chatbot: true },
  { key: 'RELEASE_JOURNEY_STATS', slug: 'metiv-rj-stats', kind: 'list', area: 'patient', label: 'מסע שחרור: מספרים', titleField: 'label' },
  { key: 'RELEASE_JOURNEY_WAITING', slug: 'metiv-rj-waiting', kind: 'single', area: 'patient', label: 'מסע שחרור: רשימת המתנה' },
  { key: 'JOURNEY_MODELS', slug: 'metiv-rj-models', kind: 'list', area: 'patient', label: 'מסע שחרור: מודלים', titleField: 'title', idField: 'key', chatbot: true },
  { key: 'RELEASE_JOURNEY_CONTACTS', slug: 'metiv-rj-contacts', kind: 'single', area: 'patient', label: 'מסע שחרור: אנשי קשר', chatbot: true },

  // ── Therapist area ─────────────────────────────────────────────────────────
  { key: 'THERAPIST_HUB', slug: 'metiv-therapist-hub', kind: 'single', area: 'therapist', label: 'דף הבית למטפלים' },
  { key: 'COURSE_CATEGORIES', slug: 'metiv-course-categories', kind: 'list', area: 'therapist', label: 'קטגוריות קורסים', titleField: 'label', idField: 'key' },
  { key: 'COURSES', slug: 'metiv-courses', kind: 'list', area: 'therapist', label: 'קורסים והכשרות', titleField: 'title', idField: 'slug' },
  { key: 'SUPERVISION', slug: 'metiv-supervision', kind: 'single', area: 'therapist', label: 'הדרכה' },
  { key: 'ORGANIZATION_PROGRAMS', slug: 'metiv-org-programs', kind: 'list', area: 'therapist', label: 'לארגונים', titleField: 'title', idField: 'slug' },
  { key: 'CHILDREN_FAMILY_INTRO', slug: 'metiv-children-family', kind: 'single', area: 'therapist', label: 'ילדים ומשפחה' },
  { key: 'RESEARCH_INTRO', slug: 'metiv-research-intro', kind: 'single', area: 'therapist', label: 'מחקר: פתיחה' },
  { key: 'ACTIVE_STUDIES', slug: 'metiv-studies', kind: 'list', area: 'therapist', label: 'מחקרים', titleField: 'title', idField: 'slug' },
  { key: 'BOOKS', slug: 'metiv-books', kind: 'list', area: 'therapist', label: 'ספרים', titleField: 'title', idField: 'title' },
  { key: 'PAPER_TOPICS', slug: 'metiv-paper-topics', kind: 'single', area: 'therapist', label: 'נושאי מאמרים' },
  { key: 'PAPERS', slug: 'metiv-papers', kind: 'list', area: 'therapist', label: 'מאמרים ופרסומים', titleField: 'title', idField: 'title' },
  { key: 'ARTICLES', slug: 'metiv-articles', kind: 'list', area: 'therapist', label: 'כתבות', titleField: 'title', idField: 'slug' },
  { key: 'EVENTS', slug: 'metiv-events', kind: 'list', area: 'therapist', label: 'אירועים', titleField: 'title', idField: 'slug' },
];

/** @type {Record<string, Collection>} */
export const COLLECTION_BY_KEY = Object.fromEntries(COLLECTIONS.map((c) => [c.key, c]));
/** @type {Record<string, Collection>} */
export const COLLECTION_BY_SLUG = Object.fromEntries(COLLECTIONS.map((c) => [c.slug, c]));

/** Child-category slugs the chatbot indexes. */
export const CHATBOT_SLUGS = COLLECTIONS.filter((c) => c.chatbot).map((c) => c.slug);

export const AREA_LABELS = {
  general: 'כללי / על מטיב',
  patient: 'מטופלים',
  therapist: 'מטפלים',
};
