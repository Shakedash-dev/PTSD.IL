// Sample data for the read-only admin preview (see src/lib/adminPreview.js).
//
// This exists so the admin panel can be opened and designed against locally,
// where real sign-in is impossible: Google is the only login path and localhost
// is not an authorised OAuth origin. The rows are invented, in the shape the
// real API returns, and are never reachable from a production build - the whole
// preview branch is compiled out (see the guard in src/lib/adminPreview.js).
//
// Deliberately NOT real content: this is scaffolding to design against, and it
// should be obvious in the UI that it is not the live database.

const CATEGORIES = [
  { id: 'cat-ptsd-info', slug: 'ptsd-info', name: 'מידע על PTSD', children: [] },
  { id: 'cat-rights', slug: 'rights', name: 'זכויות', children: [] },
  { id: 'cat-self-help', slug: 'self-help', name: 'עזרה עצמית', children: [] },
  { id: 'cat-treatment', slug: 'treatment', name: 'טיפול', children: [] },
  { id: 'cat-sources', slug: 'sources', name: 'מקורות', children: [] },
  { id: 'cat-children', slug: 'children', name: 'ילדים', children: [] },
  { id: 'cat-second-circle', slug: 'second-circle', name: 'מעגל שני', children: [] },
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
  article('a10', 'treatment_step', 'cat-treatment', 'שלב 2 - פנייה לעזרה', { description: 'תוכן לדוגמה', icon: 'Building2', methods: [] }, 2),
  article('a11', 'source', 'cat-sources', 'מחקר לדוגמה על טיפול ממוקד טראומה', { url: 'https://example.org', category: 'research', description: 'תקציר לדוגמה.' }, 1),
  article('a12', 'source', 'cat-sources', 'הנחיות קליניות לדוגמה', { url: 'https://example.org', category: 'clinical', description: 'תקציר לדוגמה.' }, 2),
  article('a13', 'article', 'cat-children', 'הנחיות להורים', { guidelines: 'תוכן לדוגמה להנחיות.' }, 1),
  article('a14', 'article', 'cat-children', 'משאב לדוגמה לגיל 6-12', { title: 'משאב', description: 'תיאור לדוגמה', url: '' }, 2),
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

  if (base === '/categories') return CATEGORIES;
  if (base === '/audiences') return AUDIENCES;
  if (base === '/age-groups') return AGE_GROUPS;
  if (base === '/communities') return COMMUNITIES;
  if (base === '/admin/users') return USERS;
  if (base === '/admin/questionnaires') return QUESTIONNAIRES;
  if (base.startsWith('/admin/questionnaires/')) return QUESTIONNAIRE_DETAIL;

  if (base === '/admin/articles') {
    const type = params.get('type');
    const categoryId = params.get('categoryId');
    return ARTICLES.filter(
      (a) =>
        (!type || a.type === type) &&
        (!categoryId || a.categories.some((c) => c.id === categoryId))
    );
  }
  return undefined;
}
