import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, fireEvent, cleanup, within } from '@testing-library/react';
import coursesSeed from '../../scripts/metiv-seed/he/metiv-courses.json';
import orgSeed from '../../scripts/metiv-seed/he/metiv-org.json';
import { applyLeaves, extractLeaves } from '@/lib/translatable';
import { COLLECTIONS } from '@/pages/metiv-demos/v3/content/registry';
import { translations } from '@/lib/i18n';
import { renderAdmin } from './renderAdmin';

// /metiv-site-demo-v3/admin against an in-memory API (with the live API's
// categoryId quirk) and a mocked /translate. The preview is switched off so
// every write and every translation request is real and recorded.

const h = vi.hoisted(() => ({ api: null }));
vi.mock('@/lib/adminPreview', () => ({ ADMIN_PREVIEW: false }));
vi.mock('@/lib/auth', () => ({
  AUTH_CHANGE_EVENT: 'test-auth-change',
  isAuthenticated: () => true,
  hasAdminAccess: () => true,
  hasUserManagementAccess: () => true,
  getToken: () => 'tok',
  getClaims: () => ({ sub: 'u1' }),
  getCurrentUserId: () => 'u1',
  getCurrentUser: () => ({ id: 'u1', email: 'editor@example.org', name: null }),
  logout: () => {},
  loginWithGoogle: async () => ({ ok: true }),
}));
vi.mock('@/api/adminClient', () => ({
  adminApi: (...args) => h.api(...args),
  ForbiddenError: class ForbiddenError extends Error {},
  UnauthorizedError: class UnauthorizedError extends Error {},
  ReadOnlyPreviewError: class ReadOnlyPreviewError extends Error {},
}));
vi.mock('@/api/reindex', () => ({
  reindexItem: vi.fn(async () => {}),
  ChatbotSyncError: class ChatbotSyncError extends Error {},
}));

// ─── In-memory API ───────────────────────────────────────────────────────────

const PARENT = { id: 'cat-metiv', slug: 'metiv', parentId: null };
const child = slug => ({ id: `cat-${slug}`, slug, parentId: PARENT.id });
const CHILDREN = COLLECTIONS.map(c => child(c.slug));
const PTSD_INFO = { id: 'cat-ptsd-info', slug: 'ptsd-info', parentId: null };
const SELF_HELP = { id: 'cat-self-help', slug: 'self-help', parentId: null };
const SLEEP = { id: 'cat-sleep', slug: 'sleep', parentId: SELF_HELP.id };
const SITE_COPY = { id: 'cat-site-copy', slug: 'site-copy', parentId: null };
const APPS = [
  { title: 'Calm', description: 'מדיטציה מודרכת ושינה.', ios_url: 'https://apps.apple.com/calm', android_url: 'https://play.google.com/calm' },
  { title: 'Headspace', description: 'מדיטציה בתשלום.', ios_url: 'https://apps.apple.com/headspace', android_url: 'https://play.google.com/headspace' },
];

function siteCopyRow(id, groupId, langId, key, text, extra = {}) {
  return {
    id, groupId, langId, type: 'article', title: key, sortOrder: 0, isPublished: true,
    content: JSON.stringify({ text, ...extra }), categories: [SITE_COPY], audiences: [], ageGroups: [],
  };
}

const COURSE_1 = coursesSeed.rows[0].content; // cbt-trauma
const COURSE_2 = coursesSeed.rows[1].content; // roadmap
const SYLLABUS_0 = COURSE_1.syllabus[0].title;

/** A sibling's content: every Hebrew text leaf prefixed with its language. */
function translated(content, lang, by) {
  const leaves = Object.fromEntries(Object.entries(extractLeaves(content)).map(([k, v]) => [k, `[${lang}] ${v}`]));
  return { ...applyLeaves(content, leaves), _tr: { by, at: '2026-10-01T00:00:00.000Z' } };
}

function metivRow(id, groupId, langId, slug, sortOrder, content) {
  return {
    id, groupId, langId, type: 'article', title: content.title || content._key, sortOrder, isPublished: true,
    content: JSON.stringify(content), categories: [PARENT, child(slug)], audiences: [], ageGroups: [],
  };
}

let db;
let writes;
let translateCalls;
let translateImpl;
let created;
let siteCopyCategory;

function resetDb() {
  created = 0;
  siteCopyCategory = false;
  writes = [];
  translateCalls = [];
  translateImpl = body => ({
    target: body.target,
    items: Object.fromEntries(Object.entries(body.items).map(([k, v]) => [k, `[${body.target}] ${v}`])),
    status: body.target === 'fr' ? 'flagged' : 'pass',
    notes: body.target === 'fr' ? ['מונח לא עקבי בכותרת'] : [],
    model: 'gemini-test',
  });
  db = [
    metivRow('c1', 'g1', 'he', 'metiv-courses', 0, COURSE_1),
    metivRow('c1-ar', 'g1', 'ar', 'metiv-courses', 0, translated(COURSE_1, 'ar', 'claude')),
    metivRow('c1-en', 'g1', 'en', 'metiv-courses', 0, translated(COURSE_1, 'en', 'human')),
    metivRow('c1-ru', 'g1', 'ru', 'metiv-courses', 0, translated(COURSE_1, 'ru', 'claude')),
    metivRow('c1-fr', 'g1', 'fr', 'metiv-courses', 0, translated(COURSE_1, 'fr', 'ai')),
    metivRow('c2', 'g2', 'he', 'metiv-courses', 1, COURSE_2),
    metivRow('org', 'g-org', 'he', 'metiv-org', 0, orgSeed.rows[0].content),
    { id: 'a1', groupId: 'g-a1', langId: 'he', type: 'faq', title: 'מהי הפרעת דחק?', sortOrder: 1, content: JSON.stringify({ answer: 'תשובה בעברית.' }), categories: [PTSD_INFO], audiences: [], ageGroups: [] },
    { id: 'a1-en', groupId: 'g-a1', langId: 'en', type: 'faq', title: 'What is PTSD?', sortOrder: 1, content: JSON.stringify({ answer: 'An English answer.', _tr: { by: 'claude' } }), categories: [PTSD_INFO], audiences: [], ageGroups: [] },
    { id: 't1', groupId: 'g-t1', langId: 'he', type: 'tool', title: 'אפליקציות מומלצות', sortOrder: 1, content: JSON.stringify({ body: 'אפליקציות שיכולות לעזור.', apps: APPS }), categories: [SELF_HELP, SLEEP], audiences: [], ageGroups: [] },
  ];
}

h.api = async (method, path, body) => {
  const [base, query = ''] = path.split('?');
  const q = new URLSearchParams(query);
  if (method === 'GET') {
    if (base === '/categories') {
      if (q.get('parentId') === PARENT.id) return CHILDREN;
      return [
        { ...PARENT, children: CHILDREN }, { ...PTSD_INFO, children: [] }, { ...SELF_HELP, children: [SLEEP] },
        ...(siteCopyCategory ? [{ ...SITE_COPY, children: [] }] : []),
      ];
    }
    if (base === '/audiences' || base === '/age-groups' || base === '/admin/questionnaires') return [];
    if (base === '/admin/articles') {
      const categoryId = q.get('categoryId');
      return db
        .filter(a => (!q.get('type') || a.type === q.get('type')) && (!q.get('langId') || a.langId === q.get('langId')))
        .filter(a => !categoryId || a.categories.some(c => c.id === categoryId))
        // The live API's quirk: a categoryId-filtered row only carries the matched category.
        .map(a => (categoryId ? { ...a, categories: a.categories.filter(c => c.id === categoryId) } : a))
        .map(a => JSON.parse(JSON.stringify(a)));
    }
    throw new Error(`no GET fixture for ${path}`);
  }
  writes.push({ method, path, body });
  if (path === '/admin/categories') return { id: `cat-${body.slug}`, ...body };
  if (method === 'POST') {
    created += 1;
    return { id: `new-${created}`, groupId: body.groupId ?? `grp-new-${created}`, ...body };
  }
  if (method === 'PATCH') return { id: path.split('/').pop(), ...body };
  return null;
};

const articleWrites = () => writes.filter(w => w.path.startsWith('/admin/articles') && w.body?.categoryIds?.[0] !== 'cat-admin-log');
const translateFor = target => translateCalls.find(c => c.target === target);

// ─── UI helpers ──────────────────────────────────────────────────────────────

/** Opens a page of the tree: expands every collapsed area and parent, then picks the page. */
async function openPage(label) {
  // The tree entry's name, with or without its count of staged changes.
  const named = (/** @type {string} */ name) => name === label || name.replace(/\d+$/, '') === label;
  const content = screen.queryByRole('button', { name: /^עריכת תוכן/ });
  if (content && content.getAttribute('aria-pressed') !== 'true') fireEvent.click(content);
  const nav = await screen.findByRole('navigation', { name: 'עמודי האתר' });
  await waitFor(() => {
    for (let collapsed = within(nav).queryAllByRole('button', { expanded: false }); collapsed.length; collapsed = within(nav).queryAllByRole('button', { expanded: false })) {
      for (const b of collapsed) fireEvent.click(b);
    }
    expect(within(nav).getAllByRole('button').filter(b => named(b.textContent)).length).toBeGreaterThan(0);
  });
  fireEvent.click(within(nav).getAllByRole('button').filter(b => named(b.textContent)).find(b => b.hasAttribute('aria-pressed')));
  return nav;
}

/** An item card in the page (not the tree entry of the same name). */
async function card(title) {
  await screen.findAllByText(title, {}, { timeout: 4000 });
  return screen.getAllByText(title).map(el => el.closest('section') && el.closest('.relative')).find(Boolean);
}

async function editSyllabusTitle(newText) {
  fireEvent.click(within(await card(COURSE_1.title)).getByTitle('עריכה'));
  const syllabus = screen.getByText('סילבוס').closest('fieldset');
  fireEvent.click(within(syllabus).getByRole('button', { name: new RegExp(SYLLABUS_0) }));
  fireEvent.change(screen.getByDisplayValue(SYLLABUS_0), { target: { value: newText } });
  fireEvent.click(screen.getByRole('button', { name: 'אישור' }));
}

async function openReview() {
  fireEvent.click(screen.getByRole('button', { name: /סקירה ושמירה/ }));
  const dialog = await screen.findByRole('dialog');
  const save = await within(dialog).findByRole('button', { name: /שמירה סופית/ }, { timeout: 4000 });
  return { dialog, save };
}

async function confirmSave({ dialog, save }) {
  fireEvent.click(within(dialog).getByRole('checkbox', { name: /עברתי על כל השינויים/ }));
  fireEvent.click(save);
  await waitFor(() => expect(writes.some(w => w.body?.categoryIds?.[0] === 'cat-admin-log')).toBe(true), { timeout: 4000 });
}

describe('metiv admin', () => {
  let errorSpy;
  beforeEach(() => {
    resetDb();
    localStorage.setItem('natal_lang', 'he');
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubEnv('VITE_CHATBOT_URL', 'https://worker');
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      if (String(url) === 'https://worker/translate') {
        const body = JSON.parse(init.body);
        translateCalls.push({ ...body, headers: init.headers });
        const res = translateImpl(body);
        return res instanceof Response ? res : new Response(JSON.stringify(res), { status: 200 });
      }
      return new Response('[]', { status: 200 }); // public reads (site copy)
    });
  });
  afterEach(() => {
    errorSpy.mockRestore();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    cleanup();
    localStorage.clear();
  });

  it('shows the site as a tree, each page with its sections in site order, the current page in the URL', async () => {
    renderAdmin({ variant: 'metiv' });
    const nav = await openPage('איפה מקבלים טיפול');
    // The three areas, then the tools.
    const text = nav.textContent;
    const at = ['מטיב: דף הבית ועמודים כלליים', 'אזור המטופלים והמשפחות', 'אזור אנשי הטיפול והמקצוע', 'צ׳אטבוט: שאלות ותשובות מוכנות'].map(a => text.indexOf(a));
    expect(at.every(i => i >= 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    expect(await screen.findByRole('heading', { level: 2, name: 'איפה מקבלים טיפול' })).toBeInTheDocument();
    const sections = screen.getAllByRole('region').map(r => r.getAttribute('aria-label'));
    expect(sections).toEqual(['טקסטים בעמוד', 'המערכת הציבורית', 'עמותות וקווי סיוע', 'מרפאות ותוכניות של מטיב', 'לא בטוחים אם לפנות?']);
    expect(within(nav).getByRole('button', { name: 'איפה מקבלים טיפול' })).toHaveAttribute('aria-current', 'page');
    // A shared item points to its main page instead of a second editor.
    fireEvent.click(within(nav).getByRole('button', { name: 'זכויות' }));
    expect(await screen.findByText('תוכניות מטיב בלשונית כוחות הביטחון')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /עריכה בעמוד איפה מקבלים טיפול/ }));
    expect(await screen.findByRole('heading', { level: 2, name: 'איפה מקבלים טיפול' })).toBeInTheDocument();
    // The language tabs sit above the tree.
    expect(screen.getByRole('group', { name: 'שפת העריכה' })).toBeInTheDocument();
  });

  it('a nested course edit stages one change with a readable before/after, and translates only that leaf', async () => {
    renderAdmin({ variant: 'metiv' });
    await openPage('קורסים והכשרות');
    await editSyllabusTitle('שנה א - טראומה פשוטה');

    expect(await screen.findByText('שינוי אחד ממתין לשמירה')).toBeInTheDocument();
    await waitFor(() => expect(translateCalls).toHaveLength(4));
    for (const target of ['ar', 'en', 'ru', 'fr']) {
      expect(translateFor(target)).toMatchObject({
        source: 'he',
        target,
        items: { 'syllabus.0.title': 'שנה א - טראומה פשוטה' },
        context: 'אזור אנשי הטיפול והמקצוע / קורסים והכשרות / קורסים והכשרות: הכשרה לטיפול CBT בטראומה',
      });
      expect(Object.keys(translateFor(target).items)).toEqual(['syllabus.0.title']);
      expect(translateFor(target).headers.Authorization).toBe('Bearer tok');
    }

    const { dialog } = await openReview();
    const he = within(dialog).getAllByRole('listitem').find(li => li.textContent.includes('סילבוס › #1 › כותרת') && !li.textContent.includes('['));
    expect(he).toBeTruthy();
    expect(within(he).getByText(SYLLABUS_0)).toBeInTheDocument();
    expect(within(he).getByText('שנה א - טראומה פשוטה')).toBeInTheDocument();
    // Four translations staged with the Hebrew one, each with its status.
    expect(within(dialog).getAllByText('תרגום תקין')).toHaveLength(3);
    expect(within(dialog).getByText('תרגום דורש בדיקה')).toBeInTheDocument();
    expect(within(dialog).getByText('מונח לא עקבי בכותרת')).toBeInTheDocument();
    expect(within(dialog).getByText('[ar] שנה א - טראומה פשוטה')).toBeInTheDocument();
  });

  it('saves the Hebrew row and the translated siblings with the right PATCH bodies', async () => {
    renderAdmin({ variant: 'metiv' });
    await openPage('קורסים והכשרות');
    await editSyllabusTitle('שנה א - טראומה פשוטה');
    await confirmSave(await openReview());

    const byPath = Object.fromEntries(articleWrites().map(w => [w.path, w]));
    const hePatch = byPath['/admin/articles/c1'];
    expect(hePatch.method).toBe('PATCH');
    expect(Object.keys(hePatch.body).sort()).toEqual(['content', 'title']); // no categoryIds
    const heContent = JSON.parse(hePatch.body.content);
    expect(heContent).toMatchObject({ _key: 'cbt-trauma', _col: 'metiv-courses', slug: 'cbt-trauma' });
    expect(heContent.syllabus[0].title).toBe('שנה א - טראומה פשוטה');

    const ar = JSON.parse(byPath['/admin/articles/c1-ar'].body.content);
    expect(byPath['/admin/articles/c1-ar'].body.categoryIds).toBeUndefined();
    expect(ar.syllabus[0].title).toBe('[ar] שנה א - טראומה פשוטה');
    // Unchanged texts keep the sibling's own translation, technical fields come from Hebrew.
    expect(ar.title).toBe(`[ar] ${COURSE_1.title}`);
    expect(ar.registration.url).toBe(COURSE_1.registration.url);
    expect(ar).toMatchObject({ _key: 'cbt-trauma', _col: 'metiv-courses' });
    expect(ar._tr).toMatchObject({ by: 'ai', model: 'gemini-test', status: 'pass' });
    expect(JSON.parse(byPath['/admin/articles/c1-fr'].body.content)._tr.status).toBe('flagged');
  });

  it('asks before overwriting a hand-edited language; yes by default, unticking drops it', async () => {
    renderAdmin({ variant: 'metiv' });
    await openPage('קורסים והכשרות');
    await editSyllabusTitle('שנה א - טראומה פשוטה');
    const review = await openReview();
    const ask = within(review.dialog).getByRole('checkbox', { name: /אנגלית נערך ידנית - לתרגם מחדש\?/ });
    expect(ask).toBeChecked();
    // Only English was edited by hand.
    expect(within(review.dialog).queryByRole('checkbox', { name: /ערבית נערך ידנית/ })).toBeNull();
    fireEvent.click(ask);
    expect(ask).not.toBeChecked();
    await confirmSave(review);

    const paths = articleWrites().map(w => w.path);
    expect(paths).toContain('/admin/articles/c1-ar');
    expect(paths).not.toContain('/admin/articles/c1-en');
    await waitFor(() => expect(screen.queryByText(/ממתין לשמירה/)).toBeNull());
  });

  it('adds a list item with a fresh _key, the next sortOrder and both categories, and creates its translations', async () => {
    renderAdmin({ variant: 'metiv' });
    await openPage('קורסים והכשרות');
    await card(COURSE_1.title);
    fireEvent.click(screen.getByRole('button', { name: /הוספת פריט חדש/ }));
    fireEvent.change(screen.getByLabelText('כותרת'), { target: { value: 'קורס Trauma Basics' } });
    fireEvent.click(screen.getByRole('button', { name: 'אישור' }));
    await screen.findByText('קורס Trauma Basics');
    await waitFor(() => expect(translateCalls).toHaveLength(4));
    // No sibling yet: every leaf is sent.
    expect(translateFor('en').items).toMatchObject({ title: 'קורס Trauma Basics' });

    await confirmSave(await openReview());
    const posts = articleWrites().filter(w => w.method === 'POST');
    expect(posts).toHaveLength(5);
    const [he, ...siblings] = posts;
    expect(he.body).toMatchObject({
      type: 'article', langId: 'he', title: 'קורס Trauma Basics', sortOrder: 2, isPublished: true,
      categoryIds: ['cat-metiv', 'cat-metiv-courses'],
    });
    const content = JSON.parse(he.body.content);
    expect(content).toMatchObject({ _key: 'trauma-basics', _col: 'metiv-courses', slug: 'trauma-basics', title: 'קורס Trauma Basics' });
    expect(siblings.map(s => s.body.langId)).toEqual(['ar', 'en', 'ru', 'fr']);
    for (const s of siblings) {
      expect(s.body).toMatchObject({ groupId: 'grp-new-1', sortOrder: 2, categoryIds: ['cat-metiv', 'cat-metiv-courses'] });
      expect(JSON.parse(s.body.content)).toMatchObject({ _key: 'trauma-basics', title: `[${s.body.langId}] קורס Trauma Basics` });
    }
  });

  it('deleting a Hebrew item stages the deletion of every translation too', async () => {
    renderAdmin({ variant: 'metiv' });
    await openPage('קורסים והכשרות');
    fireEvent.click(within(await card(COURSE_1.title)).getByTitle('מחיקה'));
    expect(screen.getByText('יימחק בשמירה')).toBeInTheDocument();
    const review = await openReview();
    expect(within(review.dialog).getAllByText('הפריט יימחק מהאתר לצמיתות.')).toHaveLength(5);
    await confirmSave(review);
    expect(articleWrites().filter(w => w.method === 'DELETE').map(w => w.path).sort()).toEqual(
      ['c1', 'c1-ar', 'c1-en', 'c1-fr', 'c1-ru'].map(id => `/admin/articles/${id}`)
    );
    expect(translateCalls).toHaveLength(0);
  });

  it('reorders list items by PATCHing sortOrder only, on every language', async () => {
    renderAdmin({ variant: 'metiv' });
    await openPage('קורסים והכשרות');
    fireEvent.click(within(await card(COURSE_2.title)).getByTitle('הזזה למעלה'));
    const review = await openReview();
    expect(within(review.dialog).getByText('סדר הפריטים', { selector: 'span' })).toBeInTheDocument();
    await confirmSave(review);
    const patches = articleWrites().filter(w => w.method === 'PATCH');
    expect(patches.every(p => Object.keys(p.body).join() === 'sortOrder')).toBe(true);
    const order = Object.fromEntries(patches.map(p => [p.path.split('/').pop(), p.body.sortOrder]));
    expect(order).toEqual({ c2: 0, c1: 1, 'c1-ar': 1, 'c1-en': 1, 'c1-ru': 1, 'c1-fr': 1 });
  });

  it('a nested list inside an item can be added to, removed from and reordered', async () => {
    renderAdmin({ variant: 'metiv' });
    await openPage('קורסים והכשרות');
    fireEvent.click(within(await card(COURSE_1.title)).getByTitle('עריכה'));
    const tags = screen.getByText('תגיות').closest('fieldset');
    // Move the second tag up, drop the last one, add a new one.
    fireEvent.click(within(tags).getAllByTitle('הזזה למעלה')[1]);
    const removes = within(tags).getAllByTitle('הסרת פריט');
    fireEvent.click(removes[removes.length - 1]);
    fireEvent.click(within(tags).getByRole('button', { name: /הוספה לתגיות/ }));
    const inputs = within(tags).getAllByRole('textbox');
    fireEvent.change(inputs[inputs.length - 1], { target: { value: 'תגית חדשה' } });
    fireEvent.click(screen.getByRole('button', { name: 'אישור' }));

    await waitFor(() => expect(translateCalls).toHaveLength(4));
    // The list's paths moved, so every leaf goes to translation.
    expect(Object.keys(translateFor('ar').items).length).toBeGreaterThan(5);
    await confirmSave(await openReview());
    const he = JSON.parse(articleWrites().find(w => w.path === '/admin/articles/c1').body.content);
    const t = COURSE_1.tags;
    expect(he.tags).toEqual([t[1], t[0], t[2], 'תגית חדשה']);
  });

  it('a non-Hebrew edit writes only that row, stamped as edited by hand, with no translation', async () => {
    renderAdmin({ variant: 'metiv' });
    fireEvent.click(screen.getByRole('button', { name: 'עריכת תוכן' }));
    fireEvent.click(within(screen.getByRole('group', { name: 'שפת העריכה' })).getByRole('button', { name: 'ערבית' }));
    await openPage('קורסים והכשרות');
    const arTitle = `[ar] ${COURSE_1.title}`;
    fireEvent.click(within(await card(arTitle)).getByTitle('עריכה'));
    // A translation keeps the Hebrew structure: no adding or reordering here.
    expect(screen.queryByRole('button', { name: /הוספה לתגיות/ })).toBeNull();
    const input = screen.getByDisplayValue(arTitle);
    expect(input).toHaveAttribute('dir', 'rtl');
    fireEvent.change(input, { target: { value: 'عنوان معدل' } });
    fireEvent.click(screen.getByRole('button', { name: 'אישור' }));
    await confirmSave(await openReview());

    expect(translateCalls).toHaveLength(0);
    const ws = articleWrites();
    expect(ws).toHaveLength(1);
    expect(ws[0]).toMatchObject({ method: 'PATCH', path: '/admin/articles/c1-ar' });
    const content = JSON.parse(ws[0].body.content);
    expect(content.title).toBe('عنوان معدل');
    expect(content._tr.by).toBe('human');
    expect(content._key).toBe('cbt-trauma');
  });

  it('a failed translation shows per language with a retry, and the Hebrew can be saved without it', async () => {
    const ok = translateImpl;
    translateImpl = body => (body.target === 'ru' ? new Response('boom', { status: 500 }) : ok(body));
    renderAdmin({ variant: 'metiv' });
    await openPage('קורסים והכשרות');
    await editSyllabusTitle('שנה א - טראומה פשוטה');
    const review = await openReview();
    expect(within(review.dialog).getByText(/רוסית: התרגום נכשל/)).toBeInTheDocument();
    expect(within(review.dialog).getByRole('button', { name: /ניסיון חוזר/ })).toBeInTheDocument();
    // Not waiting on the failed language: ticking the confirmation is enough.
    fireEvent.click(within(review.dialog).getByRole('checkbox', { name: /עברתי על כל השינויים/ }));
    expect(review.save).toBeEnabled();
    fireEvent.click(review.save);
    await waitFor(() => expect(writes.some(w => w.body?.categoryIds?.[0] === 'cat-admin-log')).toBe(true), { timeout: 4000 });

    const paths = articleWrites().map(w => w.path);
    expect(paths).toContain('/admin/articles/c1');
    expect(paths).toContain('/admin/articles/c1-ar');
    expect(paths).not.toContain('/admin/articles/c1-ru');
    // The failed language stays staged, ready to retry.
    expect(await screen.findByText('שינוי אחד בשפה אחרת ממתין לשמירה')).toBeInTheDocument();

    translateImpl = ok;
    writes.length = 0;
    const again = await openReview();
    fireEvent.click(within(again.dialog).getByRole('button', { name: /ניסיון חוזר/ }));
    expect(await within(again.dialog).findByText('[ru] שנה א - טראומה פשוטה', {}, { timeout: 4000 })).toBeInTheDocument();
    await confirmSave({ dialog: again.dialog, save: await within(again.dialog).findByRole('button', { name: /שמירה סופית/ }) });
    expect(articleWrites().map(w => w.path)).toEqual(['/admin/articles/c1-ru']);
  });

  it('a singleton is one form, labelled in Hebrew, staged and translated like a list item', async () => {
    renderAdmin({ variant: 'metiv' });
    await openPage('יצירת קשר');
    const address = await screen.findByLabelText('כתובת', {}, { timeout: 4000 });
    expect(address).toHaveValue(orgSeed.rows[0].content.address);
    // Only this page's part of ORG: the about texts are edited on the home page.
    expect(screen.queryByDisplayValue(orgSeed.rows[0].content.vision)).toBeNull();
    fireEvent.change(address, { target: { value: 'גבעת שאול, ירושלים' } });
    fireEvent.click(screen.getByRole('button', { name: 'אישור' }));
    await waitFor(() => expect(translateCalls).toHaveLength(4));
    // No sibling exists: everything translatable goes, the "ORG" row title does not.
    expect(translateFor('ru').items).toMatchObject({ address: 'גבעת שאול, ירושלים' });
    expect(translateFor('ru').items).not.toHaveProperty('@title');
    await confirmSave(await openReview());
    const ws = articleWrites();
    const he = ws.find(w => w.path === '/admin/articles/org');
    expect(he.body.title).toBe('ORG');
    // The fields this page does not show are saved unchanged.
    expect(JSON.parse(he.body.content)).toMatchObject({ vision: orgSeed.rows[0].content.vision, tagline: orgSeed.rows[0].content.tagline });
    const ru = ws.find(w => w.method === 'POST' && w.body.langId === 'ru');
    expect(ru.body).toMatchObject({ groupId: 'g-org', title: 'ORG', categoryIds: ['cat-metiv', 'cat-metiv-org'] });
  });

  it('a PTSD-IL panel Hebrew edit translates its siblings too, at the content level', async () => {
    renderAdmin({ variant: 'metiv' });
    await openPage('מה זה פוסט-טראומה');
    const faq = (await screen.findByText('מהי הפרעת דחק?', {}, { timeout: 4000 })).closest('.group');
    fireEvent.click(within(faq).getByTitle('עריכה'));
    fireEvent.change(screen.getByDisplayValue('מהי הפרעת דחק?'), { target: { value: 'מהי הפרעת דחק פוסט-טראומטית?' } });
    fireEvent.click(screen.getByRole('button', { name: 'אישור' }));

    await waitFor(() => expect(translateCalls).toHaveLength(4));
    // English exists and only the title changed; the others are created from every leaf.
    expect(translateFor('en').items).toEqual({ '@title': 'מהי הפרעת דחק פוסט-טראומטית?' });
    expect(translateFor('ar').items).toEqual({ '@title': 'מהי הפרעת דחק פוסט-טראומטית?', answer: 'תשובה בעברית.' });
    expect(translateFor('ar').context).toBe('מטופלים / שאלות PTSD: מהי הפרעת דחק פוסט-טראומטית?');

    await confirmSave(await openReview());
    const ws = articleWrites();
    const en = ws.find(w => w.path === '/admin/articles/a1-en');
    expect(en.body).toMatchObject({ type: 'faq', langId: 'en', title: '[en] מהי הפרעת דחק פוסט-טראומטית?', categoryIds: ['cat-ptsd-info'] });
    expect(JSON.parse(en.body.content)).toMatchObject({ answer: 'An English answer.', _tr: { by: 'ai' } });
    const ar = ws.find(w => w.method === 'POST' && w.body.langId === 'ar');
    expect(ar.body).toMatchObject({ groupId: 'g-a1', type: 'faq', title: '[ar] מהי הפרעת דחק פוסט-טראומטית?' });
    expect(JSON.parse(ar.body.content).answer).toBe('[ar] תשובה בעברית.');
  });
  // ─── Site copy: the i18n texts shared with PTSD-IL ───────────────────────

  /** The card of an editable i18n text, by its Hebrew name, on the open page. */
  async function textCard(label) {
    const name = await screen.findByText(label, { selector: 'label' }, { timeout: 4000 });
    return name.closest('.relative');
  }

  it('an i18n text shows the shipped wording; a Hebrew edit creates the category, the Hebrew row, then its translations linked by groupId', async () => {
    renderAdmin({ variant: 'metiv' });
    await openPage('עזרה עצמית');
    const box = await textCard('המשפט שמתחת לכותרת העמוד');
    expect(within(box).getByText(translations.he.self_help_intro)).toBeInTheDocument();
    expect(within(box).getByText('הנוסח המקורי של האתר')).toBeInTheDocument();
    // Nothing is overridden yet: nothing to revert.
    expect(within(box).queryByTitle(/חזרה לנוסח המקורי/)).toBeNull();
    fireEvent.click(within(box).getByTitle('עריכה'));
    fireEvent.change(within(box).getByRole('textbox'), { target: { value: 'אפשר להתחיל להרגיש טוב יותר כבר היום.' } });
    fireEvent.click(within(box).getByRole('button', { name: 'אישור' }));

    await waitFor(() => expect(translateCalls).toHaveLength(4));
    for (const target of ['ar', 'en', 'ru', 'fr']) expect(translateFor(target).items).toEqual({ text: 'אפשר להתחיל להרגיש טוב יותר כבר היום.' });
    const review = await openReview();
    // A language with no override row translates over its shipped text.
    expect(within(review.dialog).getByText(translations.en.self_help_intro)).toBeInTheDocument();
    await confirmSave(review);

    const ws = articleWrites();
    expect(writes.find(w => w.path === '/admin/categories').body).toMatchObject({ slug: 'site-copy' });
    const posts = ws.filter(w => w.method === 'POST');
    expect(posts.map(w => w.body.langId)).toEqual(['he', 'ar', 'en', 'ru', 'fr']);
    expect(posts[0].body).toMatchObject({ type: 'article', title: 'self_help_intro', categoryIds: ['cat-site-copy'], isPublished: true });
    expect(posts[0].body.groupId).toBeUndefined();
    expect(JSON.parse(posts[0].body.content)).toEqual({ text: 'אפשר להתחיל להרגיש טוב יותר כבר היום.' });
    for (const w of posts.slice(1)) {
      expect(w.body).toMatchObject({ title: 'self_help_intro', groupId: 'grp-new-1', categoryIds: ['cat-site-copy'] });
      const c = JSON.parse(w.body.content);
      expect(c.text).toBe(`[${w.body.langId}] אפשר להתחיל להרגיש טוב יותר כבר היום.`);
      expect(c._tr.by).toBe('ai');
    }
  });

  it('an i18n text on two pages is one row: staged on one page, it shows staged on the other', async () => {
    renderAdmin({ variant: 'metiv' });
    await openPage('דף הבית');
    const box = await textCard('מה זה פוסט-טראומה (פסקה קצרה)');
    fireEvent.click(within(box).getByTitle('עריכה'));
    fireEvent.change(within(box).getByRole('textbox'), { target: { value: 'פסקה חדשה.' } });
    fireEvent.click(within(box).getByRole('button', { name: 'אישור' }));
    await openPage('למטופלים ולמשפחות');
    const other = await textCard('מה זה פוסט-טראומה (פסקה קצרה)');
    expect(within(other).getByText('פסקה חדשה.')).toBeInTheDocument();
    expect(within(other).getByText('נערך · ממתין לשמירה')).toBeInTheDocument();
  });

  it('an edited i18n text: a hand edit in another language writes that row only; "back to the original" deletes the override rows', async () => {
    siteCopyCategory = true;
    db.push(
      siteCopyRow('sc-he', 'g-sc', 'he', 'self_help_intro', 'נוסח שנערך בעברית.'),
      siteCopyRow('sc-en', 'g-sc', 'en', 'self_help_intro', 'An edited English text.', { _tr: { by: 'ai' } }),
    );
    renderAdmin({ variant: 'metiv' });
    fireEvent.click(screen.getByRole('button', { name: 'עריכת תוכן' }));
    fireEvent.click(within(screen.getByRole('group', { name: 'שפת העריכה' })).getByRole('button', { name: 'צרפתית' }));
    await openPage('עזרה עצמית');
    // French has no row: it shows its shipped text, and a hand edit creates its row in the key's group.
    let box = await textCard('המשפט שמתחת לכותרת העמוד');
    expect(within(box).getByText(translations.fr.self_help_intro)).toBeInTheDocument();
    fireEvent.click(within(box).getByTitle('עריכה'));
    fireEvent.change(within(box).getByRole('textbox'), { target: { value: 'Un texte écrit à la main.' } });
    fireEvent.click(within(box).getByRole('button', { name: 'אישור' }));
    await confirmSave(await openReview());
    expect(translateCalls).toHaveLength(0);
    let ws = articleWrites();
    expect(ws).toHaveLength(1);
    expect(ws[0].method).toBe('POST');
    expect(ws[0].body).toMatchObject({ langId: 'fr', title: 'self_help_intro', groupId: 'g-sc', categoryIds: ['cat-site-copy'] });
    const fr = JSON.parse(ws[0].body.content);
    expect(fr.text).toBe('Un texte écrit à la main.');
    expect(fr._tr.by).toBe('human');

    // Hebrew: the edited wording, and the revert of every language.
    writes.length = 0;
    fireEvent.click(within(screen.getByRole('group', { name: 'שפת העריכה' })).getByRole('button', { name: 'עברית' }));
    box = await textCard('המשפט שמתחת לכותרת העמוד');
    expect(within(box).getByText('נוסח שנערך בעברית.')).toBeInTheDocument();
    expect(within(box).getByText('נוסח שנערך')).toBeInTheDocument();
    fireEvent.click(within(box).getByTitle('חזרה לנוסח המקורי (בכל השפות)'));
    expect(await within(box).findByText('יחזור לנוסח המקורי בשמירה')).toBeInTheDocument();
    expect(within(box).getByText(translations.he.self_help_intro)).toBeInTheDocument();
    await confirmSave(await openReview());
    ws = articleWrites();
    expect(ws.map(w => `${w.method} ${w.path}`).sort()).toEqual(['DELETE /admin/articles/sc-en', 'DELETE /admin/articles/sc-he']);
  });

  it('the self-help apps are edited in the tool: change, add, reorder, saved in the row and translated', async () => {
    renderAdmin({ variant: 'metiv' });
    await openPage('עזרה עצמית');
    const tool = (await screen.findByText('אפליקציות מומלצות', {}, { timeout: 4000 })).closest('.group');
    expect(within(tool).getByText('2 אפליקציות: Calm · Headspace')).toBeInTheDocument();
    fireEvent.click(within(tool).getByTitle('עריכה'));
    fireEvent.change(screen.getByDisplayValue('מדיטציה מודרכת ושינה.'), { target: { value: 'מדיטציה מודרכת, שינה ונשימה.' } });
    fireEvent.click(screen.getAllByTitle('הזזה למטה').find(b => b.closest('.space-y-3') && !b.disabled));
    fireEvent.click(screen.getByRole('button', { name: /הוספת אפליקציה/ }));
    fireEvent.change(screen.getByLabelText('שם האפליקציה 3'), { target: { value: 'Wysa' } });
    fireEvent.change(document.getElementById('app-2-ios'), { target: { value: 'https://apps.apple.com/wysa' } });
    fireEvent.click(screen.getByRole('button', { name: 'אישור' }));
    await waitFor(() => expect(translateCalls.length).toBe(4));
    expect(Object.values(translateFor('en').items)).toContain('מדיטציה מודרכת, שינה ונשימה.');
    await confirmSave(await openReview());
    const he = articleWrites().find(w => w.path === '/admin/articles/t1');
    const apps = JSON.parse(he.body.content).apps;
    expect(apps.map(a => a.title)).toEqual(['Headspace', 'Calm', 'Wysa']);
    expect(apps[1]).toMatchObject({ description: 'מדיטציה מודרכת, שינה ונשימה.', ios_url: 'https://apps.apple.com/calm' });
    expect(apps[2]).toMatchObject({ ios_url: 'https://apps.apple.com/wysa', android_url: '' });
  });
});
