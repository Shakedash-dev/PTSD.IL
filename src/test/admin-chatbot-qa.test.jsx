import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, fireEvent, cleanup, within } from '@testing-library/react';
import qaSeed from '../../scripts/metiv-seed/chatbot-qa/he.json';
import { applyLeaves, extractLeaves } from '@/lib/translatable';
import { reindexItem } from '@/api/reindex';
import { renderAdmin } from './renderAdmin';

// The chatbot Q&A section in both admin variants, against an in-memory API
// (with the live API's categoryId quirk) and a mocked /translate. The preview
// is switched off so every write and translation request is real and recorded.

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

const SECTION = 'צ׳אטבוט: שאלות ותשובות מוכנות';
const QA_CAT = { id: 'cat-chatbot-qa', slug: 'chatbot-qa', parentId: null };
const METIV = { id: 'cat-metiv', slug: 'metiv', parentId: null };

const CRISIS = qaSeed.find(q => q.crisis); // suicidal-thoughts
const PLAIN = qaSeed.filter(q => !q.crisis);
const Q1 = PLAIN[0];
const Q2 = PLAIN[1];

function translated(content, lang) {
  const leaves = Object.fromEntries(Object.entries(extractLeaves(content)).map(([k, v]) => [k, `[${lang}] ${v}`]));
  return { ...applyLeaves(content, leaves), _tr: { by: 'claude', at: '2026-10-01T00:00:00.000Z' } };
}

function qaRow(id, groupId, langId, sortOrder, content) {
  return {
    id, groupId, langId, type: 'article', title: content.question, sortOrder, isPublished: true,
    content: JSON.stringify(content), categories: [QA_CAT], audiences: [], ageGroups: [],
  };
}

let db;
let writes;
let translateCalls;
let created;

function resetDb() {
  created = 0;
  writes = [];
  translateCalls = [];
  db = [
    qaRow('q0', 'g0', 'he', 0, CRISIS),
    qaRow('q1', 'g1', 'he', 1, Q1),
    ...['ar', 'en', 'ru', 'fr'].map(l => qaRow(`q1-${l}`, 'g1', l, 1, translated(Q1, l))),
    qaRow('q2', 'g2', 'he', 2, Q2),
  ];
}

h.api = async (method, path, body) => {
  const [base, query = ''] = path.split('?');
  const q = new URLSearchParams(query);
  if (method === 'GET') {
    if (base === '/categories') {
      if (q.get('parentId') === METIV.id) return [];
      return [{ ...METIV, children: [] }, { ...QA_CAT, children: [] }];
    }
    if (base === '/audiences' || base === '/age-groups') return [];
    if (base === '/communities') return [];
    if (base === '/admin/articles') {
      const categoryId = q.get('categoryId');
      return db
        .filter(a => (!q.get('type') || a.type === q.get('type')) && (!q.get('langId') || a.langId === q.get('langId')))
        .filter(a => !categoryId || a.categories.some(c => c.id === categoryId))
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

async function openPtsd() {
  renderAdmin();
  fireEvent.click(screen.getByRole('button', { name: 'עריכת תוכן' }));
  fireEvent.click(screen.getByRole('button', { name: SECTION }));
}

async function openMetiv() {
  renderAdmin({ variant: 'metiv' });
  fireEvent.click(screen.getByRole('button', { name: 'עריכת תוכן' }));
  fireEvent.click(await screen.findByRole('button', { name: 'מטופלים' }));
  const nav = screen.getByRole('navigation', { name: 'הסעיפים של מטופלים' });
  fireEvent.click(within(nav).getByRole('button', { name: SECTION }));
  return nav;
}

async function card(title) {
  const el = await screen.findByText(title, {}, { timeout: 4000 });
  return el.closest('.relative');
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

describe('chatbot Q&A admin', () => {
  let errorSpy;
  beforeEach(() => {
    resetDb();
    vi.mocked(reindexItem).mockClear();
    localStorage.setItem('natal_lang', 'he');
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubEnv('VITE_CHATBOT_URL', 'https://worker');
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      if (String(url) === 'https://worker/translate') {
        const b = JSON.parse(init.body);
        translateCalls.push(b);
        return new Response(JSON.stringify({
          target: b.target,
          items: Object.fromEntries(Object.entries(b.items).map(([k, v]) => [k, `[${b.target}] ${v}`])),
          status: 'pass', notes: [], model: 'gemini-test',
        }), { status: 200 });
      }
      return new Response('[]', { status: 200 });
    });
  });
  afterEach(() => {
    errorSpy.mockRestore();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    cleanup();
    localStorage.clear();
  });

  it('lists the questions in /admin: question, crisis badge, paraphrase count', async () => {
    await openPtsd();
    const crisis = await card(CRISIS.question);
    expect(within(crisis).getByText('שאלת חירום')).toBeInTheDocument();
    expect(within(crisis).getByText(`${CRISIS.paraphrases.length} ניסוחים נוספים`)).toBeInTheDocument();
    const plain = await card(Q1.question);
    expect(within(plain).queryByText('שאלת חירום')).toBeNull();
    expect(within(plain).getByText(`${Q1.paraphrases.length} ניסוחים נוספים`)).toBeInTheDocument();
    expect(screen.getByText('3 פריטים')).toBeInTheDocument(); // Hebrew rows only
  });

  it('lists the questions in the Metiv variant, under its own heading in the patient group', async () => {
    const nav = await openMetiv();
    expect(within(nav).getByText('צ׳אטבוט (משותף לשני האתרים)')).toBeInTheDocument();
    expect(await card(Q1.question)).toBeTruthy();
    expect(within(await card(CRISIS.question)).getByText('שאלת חירום')).toBeInTheDocument();
  });

  it('an edit stages a readable before/after, translates only the changed leaf into 4 languages, and reindexes every saved row', async () => {
    await openPtsd();
    fireEvent.click(within(await card(Q1.question)).getByTitle('עריכה'));
    // The section's own labels and help.
    expect(screen.getByLabelText(/הנחיות לצ׳אטבוט/)).toHaveValue(Q1.guidance);
    expect(screen.getByText('ניסוחים נוספים שמשתמשים כותבים')).toBeInTheDocument();
    expect(screen.getByLabelText(/תשובה לדוגמה/)).toBeInTheDocument();
    expect(screen.getByLabelText('שאלת חירום')).not.toBeChecked();
    expect(screen.getByText(/יש לסמן רק שאלות על אובדנות ופגיעה עצמית/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/הנחיות לצ׳אטבוט/), { target: { value: 'הנחיה חדשה וקצרה' } });
    fireEvent.click(screen.getByRole('button', { name: 'אישור' }));

    expect(await screen.findByText('שינוי אחד ממתין לשמירה')).toBeInTheDocument();
    await waitFor(() => expect(translateCalls).toHaveLength(4));
    for (const target of ['ar', 'en', 'ru', 'fr']) {
      expect(translateFor(target)).toMatchObject({ source: 'he', target, items: { guidance: 'הנחיה חדשה וקצרה' } });
      expect(Object.keys(translateFor(target).items)).toEqual(['guidance']);
      expect(translateFor(target).context).toBe(`${SECTION}: ${Q1.question}`);
    }

    const review = await openReview();
    const items = within(review.dialog).getAllByRole('listitem');
    const he = items.find(li => li.textContent.includes('הנחיה חדשה וקצרה') && !li.textContent.includes('['));
    expect(he.textContent).toContain('הנחיות לצ׳אטבוט');
    expect(he.textContent).toContain(Q1.guidance.split('\n')[0]);
    // Four translations, with this section's label too.
    expect(within(review.dialog).getAllByText('תרגום תקין')).toHaveLength(4);
    const ar = items.find(li => li.textContent.includes('[ar] הנחיה חדשה וקצרה'));
    expect(ar.textContent).toContain('הנחיות לצ׳אטבוט');

    await confirmSave(review);
    const byPath = Object.fromEntries(articleWrites().map(w => [w.path, w]));
    const heBody = byPath['/admin/articles/q1'].body;
    expect(Object.keys(heBody).sort()).toEqual(['content', 'title']);
    expect(heBody.title).toBe(Q1.question);
    expect(JSON.parse(heBody.content)).toEqual({ ...Q1, guidance: 'הנחיה חדשה וקצרה' });
    for (const l of ['ar', 'en', 'ru', 'fr']) {
      const body = byPath[`/admin/articles/q1-${l}`].body;
      const c = JSON.parse(body.content);
      expect(c.guidance).toBe(`[${l}] הנחיה חדשה וקצרה`);
      expect(c.question).toBe(`[${l}] ${Q1.question}`);
      expect(c._tr).toMatchObject({ by: 'ai', model: 'gemini-test', status: 'pass' });
      expect(c._col).toBeUndefined();
      expect(body.title).toBe(`[${l}] ${Q1.question}`);
    }
    expect(vi.mocked(reindexItem).mock.calls.map(c => c[0]).sort()).toEqual(['q1', 'q1-ar', 'q1-en', 'q1-fr', 'q1-ru']);
  });

  it('adds a question: one chatbot-qa category, no _col, an ascii _key, the next sortOrder, and 4 translated siblings', async () => {
    await openPtsd();
    await card(Q1.question);
    fireEvent.click(screen.getByRole('button', { name: /הוספת שאלה חדשה/ }));
    fireEvent.change(screen.getByLabelText('שאלה'), { target: { value: 'EMDR - מה זה?' } });
    // Guidance is required: the editor stays open without it.
    fireEvent.click(screen.getByRole('button', { name: 'אישור' }));
    expect(screen.getByLabelText('שאלה')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /הוספה לניסוחים נוספים שמשתמשים כותבים/ }));
    const para = screen.getByText('ניסוחים נוספים שמשתמשים כותבים').closest('fieldset');
    fireEvent.change(within(para).getByRole('textbox'), { target: { value: 'מה זה EMDR?' } });
    fireEvent.change(screen.getByLabelText(/הנחיות לצ׳אטבוט/), { target: { value: 'להסביר בקצרה.' } });
    fireEvent.click(screen.getByRole('button', { name: 'אישור' }));

    await screen.findByText('EMDR - מה זה?');
    await waitFor(() => expect(translateCalls).toHaveLength(4));
    expect(translateFor('en').items).toMatchObject({ question: 'EMDR - מה זה?', 'paraphrases.0': 'מה זה EMDR?', guidance: 'להסביר בקצרה.' });

    await confirmSave(await openReview());
    const posts = articleWrites().filter(w => w.method === 'POST');
    expect(posts).toHaveLength(5);
    const [he, ...siblings] = posts;
    expect(he.body).toMatchObject({
      type: 'article', langId: 'he', title: 'EMDR - מה זה?', sortOrder: 3, isPublished: true, categoryIds: ['cat-chatbot-qa'],
    });
    const content = JSON.parse(he.body.content);
    expect(content).toEqual({ _key: 'emdr', question: 'EMDR - מה זה?', paraphrases: ['מה זה EMDR?'], guidance: 'להסביר בקצרה.', answer: '', crisis: false });
    expect(siblings.map(s => s.body.langId)).toEqual(['ar', 'en', 'ru', 'fr']);
    for (const s of siblings) {
      expect(s.body).toMatchObject({ type: 'article', groupId: 'grp-new-1', sortOrder: 3, categoryIds: ['cat-chatbot-qa'] });
      const c = JSON.parse(s.body.content);
      expect(c).toMatchObject({ _key: 'emdr', question: `[${s.body.langId}] EMDR - מה זה?`, crisis: false });
      expect(c._col).toBeUndefined();
      expect(s.body.title).toBe(`[${s.body.langId}] EMDR - מה זה?`);
    }
    expect(vi.mocked(reindexItem).mock.calls.map(c => c[0])).toEqual(['new-1', 'new-2', 'new-3', 'new-4', 'new-5']);
  });

  it('a Hebrew question gets a random chatbot-qa _key', async () => {
    await openPtsd();
    await card(Q1.question);
    fireEvent.click(screen.getByRole('button', { name: /הוספת שאלה חדשה/ }));
    fireEvent.change(screen.getByLabelText('שאלה'), { target: { value: 'מה זה טיפול בחשיפה?' } });
    fireEvent.change(screen.getByLabelText(/הנחיות לצ׳אטבוט/), { target: { value: 'להסביר.' } });
    fireEvent.click(screen.getByRole('button', { name: 'אישור' }));
    await waitFor(() => expect(translateCalls).toHaveLength(4));
    await confirmSave(await openReview());
    const he = articleWrites().find(w => w.method === 'POST' && w.body.langId === 'he');
    expect(JSON.parse(he.body.content)._key).toMatch(/^chatbot-qa-[a-z0-9]{6}$/);
  });

  it('deleting a question stages the deletion of every language and reindexes each id', async () => {
    await openPtsd();
    fireEvent.click(within(await card(Q1.question)).getByTitle('מחיקה'));
    expect(screen.getByText('יימחק בשמירה')).toBeInTheDocument();
    const review = await openReview();
    expect(within(review.dialog).getAllByText('הפריט יימחק מהאתר לצמיתות.')).toHaveLength(5);
    await confirmSave(review);
    const deleted = ['q1', 'q1-ar', 'q1-en', 'q1-fr', 'q1-ru'];
    expect(articleWrites().filter(w => w.method === 'DELETE').map(w => w.path).sort()).toEqual(deleted.map(id => `/admin/articles/${id}`));
    expect(vi.mocked(reindexItem).mock.calls.map(c => c[0]).sort()).toEqual(deleted);
    expect(translateCalls).toHaveLength(0);
  });

  it('reorders by PATCHing sortOrder only, on every language', async () => {
    await openMetiv();
    fireEvent.click(within(await card(Q2.question)).getByTitle('הזזה למעלה'));
    const review = await openReview();
    expect(within(review.dialog).getByText('סדר השאלות', { selector: 'span' })).toBeInTheDocument();
    await confirmSave(review);
    const patches = articleWrites().filter(w => w.method === 'PATCH');
    expect(patches.every(p => Object.keys(p.body).join() === 'sortOrder')).toBe(true);
    const order = Object.fromEntries(patches.map(p => [p.path.split('/').pop(), p.body.sortOrder]));
    expect(order).toEqual({ q2: 1, q1: 2, 'q1-ar': 2, 'q1-en': 2, 'q1-ru': 2, 'q1-fr': 2 });
  });

  it('a non-Hebrew edit writes only that row, stamped by hand, keeping the Hebrew crisis flag', async () => {
    renderAdmin();
    fireEvent.click(screen.getByRole('button', { name: 'עריכת תוכן' }));
    fireEvent.click(within(screen.getByRole('group', { name: 'שפת העריכה' })).getByRole('button', { name: 'אנגלית' }));
    fireEvent.click(screen.getByRole('button', { name: SECTION }));
    const enQ = `[en] ${Q1.question}`;
    fireEvent.click(within(await card(enQ)).getByTitle('עריכה'));
    expect(screen.getByLabelText('שאלת חירום')).toBeDisabled();
    expect(screen.queryByRole('button', { name: /הוספה לניסוחים/ })).toBeNull();
    fireEvent.change(screen.getByDisplayValue(enQ), { target: { value: 'Edited question' } });
    fireEvent.click(screen.getByRole('button', { name: 'אישור' }));
    await confirmSave(await openReview());

    expect(translateCalls).toHaveLength(0);
    const ws = articleWrites();
    expect(ws).toHaveLength(1);
    expect(ws[0]).toMatchObject({ method: 'PATCH', path: '/admin/articles/q1-en', body: { title: 'Edited question' } });
    const content = JSON.parse(ws[0].body.content);
    expect(content).toMatchObject({ question: 'Edited question', crisis: false, _key: Q1._key });
    expect(content._tr.by).toBe('human');
    expect(vi.mocked(reindexItem)).toHaveBeenCalledWith('q1-en');
  });
});
