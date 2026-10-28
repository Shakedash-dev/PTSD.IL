// Test fixtures for the read-only admin preview (see src/lib/adminPreview.js).
//
// Used only by the test run (`import.meta.env.MODE === 'test'` in adminApi()):
// the dev server reads the live data through the public endpoints instead
// (src/api/adminLiveRead.js), so nothing here is ever shown in a browser. The
// PTSD-IL rows are invented, in the shape the real API returns; the Metiv rows
// are the Hebrew seed (scripts/metiv-seed/he, copy) and the chatbot Q&A rows the
// Hebrew Q&A seed (scripts/metiv-seed/chatbot-qa/he.json), since a schema-less
// editor is only worth testing against real shapes. Never part of a production
// build - the whole preview branch is compiled out.

import { COLLECTIONS, COPY_SLUG, METIV_PARENT_SLUG } from '@/pages/metiv-demos/v3/content/registry';

const METIV_SEED = import.meta.glob('../../scripts/metiv-seed/he/*.json', { eager: true, import: 'default' });
const METIV_COPY = import.meta.glob('../../scripts/metiv-seed/copy/*.json', { eager: true, import: 'default' });
const QA_SEED = import.meta.glob('../../scripts/metiv-seed/chatbot-qa/he.json', { eager: true, import: 'default' });

const METIV_PARENT = { id: 'cat-metiv', slug: METIV_PARENT_SLUG, name: 'מטיב', parentId: null };
const METIV_CHILDREN = [...COLLECTIONS.map(c => ({ slug: c.slug, name: c.label })), { slug: COPY_SLUG, name: 'טקסטים בעמודים' }]
  .map(c => ({ id: `cat-${c.slug}`, slug: c.slug, name: c.name, parentId: METIV_PARENT.id }));

/** The Hebrew seed as GET /admin/articles rows, each with both its categories. */
function metivRows() {
  const rows = [];
  const push = (slug, key, title, sortOrder, content) => rows.push({
    id: `m-${slug}-${key}`,
    groupId: `grp-m-${slug}-${key}`,
    langId: 'he',
    type: 'article',
    title,
    content: JSON.stringify(content),
    sortOrder,
    isPublished: true,
    categories: [METIV_PARENT, { id: `cat-${slug}`, slug, parentId: METIV_PARENT.id }],
    audiences: [],
    ageGroups: [],
  });
  for (const file of Object.values(METIV_SEED)) {
    const { slug, rows: items } = /** @type {any} */ (file);
    for (const r of items) push(slug, r._key, r.title, r.sortOrder, r.content);
  }
  for (const [path, file] of Object.entries(METIV_COPY)) {
    const ns = path.split('/').pop().replace(/\.json$/, '');
    push(COPY_SLUG, ns, ns, 0, { _key: ns, _col: COPY_SLUG, .../** @type {any} */ (file) });
  }
  return rows;
}

const QA_CATEGORY = { id: 'cat-chatbot-qa', slug: 'chatbot-qa', name: 'צ׳אטבוט: שאלות ותשובות מוכנות', parentId: null };

/** The Hebrew Q&A seed as GET /admin/articles rows: one category, chatbot-qa. */
function qaRows() {
  const items = /** @type {any[]} */ (Object.values(QA_SEED)[0] ?? []);
  return items.map((q, i) => ({
    id: `qa-${q._key}`,
    groupId: `grp-qa-${q._key}`,
    langId: 'he',
    type: 'article',
    title: q.question,
    content: JSON.stringify(q),
    sortOrder: i,
    isPublished: true,
    categories: [QA_CATEGORY],
    audiences: [],
    ageGroups: [],
  }));
}

const CATEGORIES = [
  { id: 'cat-ptsd-info', slug: 'ptsd-info', name: 'מידע על PTSD', children: [] },
  { id: 'cat-rights', slug: 'rights', name: 'זכויות', children: [] },
  { id: 'cat-self-help', slug: 'self-help', name: 'עזרה עצמית', children: [] },
  { id: 'cat-treatment', slug: 'treatment', name: 'טיפול', children: [] },
  { id: 'cat-sources', slug: 'sources', name: 'מקורות', children: [] },
  { id: 'cat-children', slug: 'children', name: 'ילדים', children: [] },
  { id: 'cat-second-circle', slug: 'second-circle', name: 'מעגל שני', children: [] },
  { id: 'cat-admin-log', slug: 'admin-log', name: 'יומן עריכות', children: [] },
  { ...METIV_PARENT, children: METIV_CHILDREN },
  { ...QA_CATEGORY, children: [] },
];

const AUDIENCES = [
  { id: 'aud-1', slug: 'first-circle', name: 'מעגל ראשון' },
  { id: 'aud-2', slug: 'second-circle', name: 'מעגל שני' },
  { id: 'aud-3', slug: 'professionals', name: 'אנשי מקצוע' },
];

const AGE_GROUPS = [
  { id: 'age-1', slug: '0-6', name: '0-6' },
  { id: 'age-2', slug: '6-12', name: '6-12' },
  { id: 'age-3', slug: '12-18', name: '12-18' },
];

/** One article row in the shape GET /admin/articles returns. */
function article(id, type, categoryId, title, content, sortOrder) {
  return {
    id,
    groupId: `grp-${id}`,
    langId: 'he',
    type,
    title,
    content: JSON.stringify(content),
    sortOrder,
    isPublished: true,
    categories: [{ id: categoryId }],
    audiences: [],
    ageGroups: [],
  };
}

const ARTICLES = [
  article('a1', 'faq', 'cat-ptsd-info', 'מהי הפרעת דחק פוסט-טראומטית?', { answer: 'תוכן לדוגמה עבור התצוגה המקדימה. זהו אינו תוכן אמיתי מהמסד.' }, 1),
  article('a2', 'faq', 'cat-ptsd-info', 'כמה זמן נמשכים התסמינים?', { answer: 'תוכן לדוגמה שני, לבדיקת פריסה של פריט ארוך יותר ברשימה.' }, 2),
  article('a3', 'faq', 'cat-ptsd-info', 'האם ילדים מפתחים PTSD אחרת?', { answer: 'תוכן לדוגמה שלישי.' }, 3),
  article('a4', 'faq', 'cat-rights', 'איך מגישים תביעה לקצין התגמולים?', { answer: 'תוכן לדוגמה.', steps: 'שלב א\nשלב ב', links: [] }, 1),
  article('a5', 'faq', 'cat-rights', 'מה הזכויות לאחר אירוע איבה?', { answer: 'תוכן לדוגמה.', steps: '', links: [] }, 2),
  article('a6', 'faq', 'cat-second-circle', 'איך תומכים בבן משפחה?', { intro: 'מבוא לדוגמה', sections: [{ heading: 'כותרת', body: 'גוף' }], closing: '', callout: '' }, 1),
  article('a7', 'tool', 'cat-self-help', 'תרגיל נשימה מרובעת', { content: 'תוכן לדוגמה', icon: 'Wind', apps: [] }, 1),
  article('a8', 'tool', 'cat-self-help', 'יומן מחשבות', { content: 'תוכן לדוגמה', icon: 'PenLine', apps: [] }, 2),
  article('a9', 'treatment_step', 'cat-treatment', 'שלב 1 - זיהוי', { description: 'תוכן לדוגמה', icon: 'Wrench', methods: [] }, 1),
  article('a10', 'treatment_step', 'cat-treatment', 'שלב 2 - פנייה לעזרה', { description: 'תוכן לדוגמה', icon: 'Building2', methods: [
    { title: 'שיטת טיפול לדוגמה', description: 'תיאור לדוגמה של השיטה.', how_to_start: 'כך מתחילים - טקסט לדוגמה.', links: [{ label: 'קישור לדוגמה', url: 'https://example.org' }] },
    { title: 'שיטה שנייה לדוגמה', description: 'תיאור שני לדוגמה.', how_to_start: 'טקסט לדוגמה נוסף.', links: [] },
  ] }, 2),
  article('a11', 'source', 'cat-sources', 'מחקר לדוגמה על טיפול ממוקד טראומה', { url: 'https://example.org', category: 'research', description: 'תקציר לדוגמה.' }, 1),
  article('a12', 'source', 'cat-sources', 'הנחיות קליניות לדוגמה', { url: 'https://example.org', category: 'clinical', description: 'תקציר לדוגמה.' }, 2),
  article('a13', 'article', 'cat-children', 'הנחיות להורים', { guidelines: 'תוכן לדוגמה להנחיות.' }, 1),
  article('a14', 'article', 'cat-children', 'משאב לדוגמה לגיל 6-12', { title: 'משאב', description: 'תיאור לדוגמה', url: '' }, 2),
  // One edit-log batch (see appendEditLog in adminSource.js) so the log panel
  // has something to show.
  { ...article('a15', 'article', 'cat-admin-log', '2026-01-01T10:00:00.000Z', {
    at: '2026-01-01T10:00:00.000Z',
    user: { id: 'u1', email: 'preview-admin@example.org', name: null },
    changes: [
      { section: 'שאלות PTSD', action: 'update', title: 'מהי הפרעת דחק פוסט-טראומטית?', fields: [{ label: 'תשובה', before: 'נוסח קודם לדוגמה.', after: 'תוכן לדוגמה עבור התצוגה המקדימה.' }] },
      { section: 'מקורות', action: 'delete', title: 'מקור ישן לדוגמה', fields: [] },
    ],
  }, 0), isPublished: false },
  ...metivRows(),
  ...qaRows(),
];

const COMMUNITIES = [
  { id: 'c1', name: 'קבוצת תמיכה לדוגמה', organization: 'ארגון לדוגמה', description: 'תיאור לדוגמה של הקבוצה.', location: 'תל אביב', meetingType: 'physical', contactUrl: 'https://example.org', targetAudiences: [{ slug: 'first-circle' }] },
  { id: 'c2', name: 'מפגש מקוון לדוגמה', organization: 'ארגון לדוגמה', description: 'תיאור לדוגמה.', location: 'זום', meetingType: 'digital', contactUrl: 'https://example.org', targetAudiences: [{ slug: 'second-circle' }] },
  { id: 'c3', name: 'קבוצה משולבת לדוגמה', organization: '', description: '', location: 'חיפה', meetingType: 'hybrid', contactUrl: '', targetAudiences: [] },
];

const QUESTIONNAIRES = [
  { id: 'q1', slug: 'pcl-5', name: 'PCL-5 (תצוגה מקדימה)', langId: 'he', totalQuestions: 3, maxScore: 12 },
];

const QUESTIONNAIRE_DETAIL = {
  id: 'q1',
  slug: 'pcl-5',
  name: 'PCL-5 (תצוגה מקדימה)',
  langId: 'he',
  maxScore: 12,
  questions: [
    { id: 'q1-1', text: 'זיכרונות חוזרים ומטרידים של האירוע', sortOrder: 1, options: [
      { id: 'o1', answer: 'כלל לא', score: 0, order: 0 },
      { id: 'o2', answer: 'מעט', score: 1, order: 1 },
      { id: 'o3', answer: 'במידה בינונית', score: 2, order: 2 },
      { id: 'o4', answer: 'הרבה', score: 3, order: 3 },
    ] },
    { id: 'q1-2', text: 'חלומות חוזרים הקשורים לאירוע', sortOrder: 2, options: [
      { id: 'o5', answer: 'כלל לא', score: 0, order: 0 },
      { id: 'o6', answer: 'מעט', score: 1, order: 1 },
    ] },
  ],
};

const USERS = [
  { id: 'u1', email: 'preview-admin@example.org', roles: ['admin'] },
  { id: 'u2', email: 'preview-moderator@example.org', roles: ['moderator'] },
  { id: 'u3', email: 'preview-master@example.org', roles: ['masteradmin'] },
];

/**
 * Answers a GET the way the real API would. Returns undefined when a path has
 * no fixture, so the caller can fail loudly rather than render a silent blank.
 *
 * @param {string} path e.g. '/admin/articles?type=faq&langId=he&categoryId=cat-rights'
 */
export function previewGet(path) {
  const [base, query = ''] = path.split('?');
  const params = new URLSearchParams(query);

  if (base === '/categories') {
    const parentId = params.get('parentId');
    return parentId ? CATEGORIES.find(c => c.id === parentId)?.children ?? [] : CATEGORIES;
  }
  if (base === '/audiences') return AUDIENCES;
  if (base === '/age-groups') return AGE_GROUPS;
  if (base === '/communities') return COMMUNITIES;
  if (base === '/admin/users') return USERS;
  if (base === '/admin/questionnaires') return QUESTIONNAIRES;
  if (base.startsWith('/admin/questionnaires/')) return QUESTIONNAIRE_DETAIL;

  if (base === '/admin/articles') {
    const type = params.get('type');
    const categoryId = params.get('categoryId');
    const langId = params.get('langId');
    return ARTICLES.filter(
      (a) =>
        (!type || a.type === type) &&
        (!langId || a.langId === langId) &&
        (!categoryId || a.categories.some((c) => c.id === categoryId))
    );
  }
  return undefined;
}
