import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, fireEvent, cleanup, within } from '@testing-library/react';
import { renderAdmin } from './renderAdmin';

// "Save all" against an API that accepts writes: reads come from the preview
// fixtures, every write is recorded. Pins that a batch sends exactly the staged
// writes - including the AI translations a Hebrew edit stages (the preview's
// fake translator) - then one unpublished edit-log row describing them.

const calls = [];
// When set, every write waits for it - a save that is still running.
// `patchGet` rewrites a read: what another session saved meanwhile.
const hold = { gate: null, patchGet: null, reads: 0 };
vi.mock('@/api/adminClient', async () => {
  const { previewGet } = await vi.importActual('@/api/adminPreviewFixtures');
  return {
    adminApi: vi.fn(async (method, path, body) => {
      if (method === 'GET') {
        hold.reads += 1;
        const data = JSON.parse(JSON.stringify(previewGet(path)));
        return hold.patchGet ? hold.patchGet(path, data) : data;
      }
      calls.push({ method, path, body });
      if (hold.gate) await hold.gate;
      if (method === 'PATCH') return { id: path.split('/').pop() };
      if (method === 'DELETE') return null;
      return { id: 'created-id' };
    }),
    ForbiddenError: class ForbiddenError extends Error {},
    UnauthorizedError: class UnauthorizedError extends Error {},
    ReadOnlyPreviewError: class ReadOnlyPreviewError extends Error {},
  };
});
vi.mock('@/api/reindex', () => ({
  reindexItem: vi.fn(async () => {}),
  ChatbotSyncError: class ChatbotSyncError extends Error {},
}));

const FAQ1 = 'מהי הפרעת דחק פוסט-טראומטית?';
const FAQ2 = 'כמה זמן נמשכים התסמינים?';

describe('admin: save all', () => {
  let errorSpy;
  beforeEach(() => {
    calls.length = 0;
    hold.gate = null;
    hold.patchGet = null;
    localStorage.setItem('natal_lang', 'he');
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => { errorSpy.mockRestore(); cleanup(); localStorage.clear(); });

  it('writes nothing until the batch is confirmed, then writes it and logs it', async () => {
    renderAdmin();
    fireEvent.click(screen.getByRole('button', { name: 'עריכת תוכן' }));
    await waitFor(() => expect(screen.getByText(FAQ1)).toBeInTheDocument(), { timeout: 4000 });

    const card1 = screen.getByText(FAQ1).closest('.group');
    fireEvent.click(within(card1).getByTitle('עריכה'));
    fireEvent.change(screen.getByDisplayValue(FAQ1), { target: { value: 'שאלה ערוכה' } });
    fireEvent.click(screen.getByRole('button', { name: 'אישור' }));

    const card2 = screen.getByText(FAQ2).closest('.group');
    fireEvent.click(within(card2).getByTitle('מחיקה'));

    expect(calls).toEqual([]);

    fireEvent.click(screen.getByRole('button', { name: /סקירה ושמירה/ }));
    const dialog = await screen.findByRole('dialog');
    const save = await within(dialog).findByRole('button', { name: /שמירה סופית/ }, { timeout: 4000 });
    fireEvent.click(within(dialog).getByRole('checkbox'));
    fireEvent.click(save);

    await waitFor(() => expect(calls.some(c => c.body?.categoryIds?.[0] === 'cat-admin-log')).toBe(true));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    const [patch, ...rest] = calls;
    expect(patch).toMatchObject({ method: 'PATCH', path: '/admin/articles/a1' });
    expect(patch.body.title).toBe('שאלה ערוכה');
    // The fixtures have no translations of a1, so each language is created,
    // linked to the Hebrew row's group.
    const siblings = rest.slice(0, 4);
    expect(siblings.map(c => c.body.langId)).toEqual(['ar', 'en', 'ru', 'fr']);
    for (const c of siblings) {
      expect(c).toMatchObject({ method: 'POST', path: '/admin/articles' });
      expect(c.body).toMatchObject({ type: 'faq', groupId: 'grp-a1', categoryIds: ['cat-ptsd-info'], title: `[${c.body.langId}] שאלה ערוכה` });
      expect(JSON.parse(c.body.content)._tr).toMatchObject({ by: 'ai', model: 'preview' });
    }
    const [del, log] = rest.slice(4);
    expect(del).toMatchObject({ method: 'DELETE', path: '/admin/articles/a2' });

    expect(log.path).toBe('/admin/articles');
    expect(log.body).toMatchObject({ type: 'article', categoryIds: ['cat-admin-log'], isPublished: false });
    const entry = JSON.parse(log.body.content);
    expect(entry.user).toHaveProperty('id');
    expect(entry.changes[0]).toEqual(
      { section: 'שאלות PTSD', action: 'update', title: 'שאלה ערוכה', lang: 'he', fields: [{ label: 'שאלה', before: FAQ1, after: 'שאלה ערוכה' }] },
    );
    expect(entry.changes.slice(1, 5).map(c => c.action)).toEqual(['create', 'create', 'create', 'create']);
    expect(entry.changes.slice(1, 5).map(c => c.lang)).toEqual(['ar', 'en', 'ru', 'fr']);
    expect(entry.changes[5]).toEqual({ section: 'שאלות PTSD', action: 'delete', title: FAQ2, lang: 'he', fields: [] });
    expect(calls).toHaveLength(7);
    expect(screen.queryByText(/ממתין לשמירה/)).toBeNull();
  });

  it('runs in the background: the dialog closes at once, the strip follows it, and the editor can move on', async () => {
    let release;
    hold.gate = new Promise(r => { release = r; });
    renderAdmin();
    fireEvent.click(screen.getByRole('button', { name: 'עריכת תוכן' }));
    await waitFor(() => expect(screen.getByText(FAQ2)).toBeInTheDocument(), { timeout: 4000 });
    fireEvent.click(within(screen.getByText(FAQ2).closest('.group')).getByTitle('מחיקה'));

    fireEvent.click(screen.getByRole('button', { name: /סקירה ושמירה/ }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('checkbox'));
    fireEvent.click(within(dialog).getByRole('button', { name: /שמירה סופית/ }));

    // Closed before a single write has answered.
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const strip = screen.getByTestId('save-progress');
    expect(within(strip).getByText('שומר 0 מתוך 1...')).toBeInTheDocument();
    expect(within(strip).getByText(/סגירה או רענון של הלשונית יעצרו את השמירה/)).toBeInTheDocument();
    const unload = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(true);

    // Another panel while it saves: the strip stays in the header.
    fireEvent.click(screen.getByRole('button', { name: 'שלבי טיפול' }));
    expect(screen.getByRole('button', { name: 'שלבי טיפול' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(screen.getByRole('banner')).getByText('שומר 0 מתוך 1...')).toBeInTheDocument();

    release();
    await waitFor(() => expect(within(screen.getByRole('banner')).getByText('השינוי נשמר ומופיע באתר')).toBeInTheDocument());
    expect(calls.find(c => c.method === 'DELETE')).toMatchObject({ path: '/admin/articles/a2' });
    const after = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(after);
    expect(after.defaultPrevented).toBe(false);
  });

  it('an open editor keeps what is typed when a background save lands and the panel refreshes', async () => {
    let release;
    hold.gate = new Promise(r => { release = r; });
    renderAdmin();
    fireEvent.click(screen.getByRole('button', { name: 'עריכת תוכן' }));
    await waitFor(() => expect(screen.getByText(FAQ2)).toBeInTheDocument(), { timeout: 4000 });
    fireEvent.click(within(screen.getByText(FAQ2).closest('.group')).getByTitle('מחיקה'));

    fireEvent.click(screen.getByRole('button', { name: /סקירה ושמירה/ }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('checkbox'));
    fireEvent.click(within(dialog).getByRole('button', { name: /שמירה סופית/ }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    // While it saves: open another item and type, without confirming.
    fireEvent.click(within(screen.getByText(FAQ1).closest('.group')).getByTitle('עריכה'));
    fireEvent.change(screen.getByDisplayValue(FAQ1), { target: { value: 'טיוטה שעוד לא אושרה' } });

    const readsBefore = hold.reads;
    release();
    await waitFor(() => expect(within(screen.getByRole('banner')).getByText('השינוי נשמר ומופיע באתר')).toBeInTheDocument());
    // The panel re-read the server, and the editor is untouched.
    await waitFor(() => expect(hold.reads).toBeGreaterThan(readsBefore));
    expect(screen.getByDisplayValue('טיוטה שעוד לא אושרה')).toBeInTheDocument();
    expect(screen.queryByText(/הפריט עודכן בינתיים/)).toBeNull();

    // Another session changes the same item; the next refresh brings it in:
    // the draft stays, with a note that saving overwrites the newer version.
    hold.gate = null;
    hold.patchGet = (path, data) => (Array.isArray(data)
      ? data.map(row => (row.id === 'a1' ? { ...row, title: 'נוסח חדש מעורך אחר' } : row))
      : data);
    // A second save (another item) is the refresh.
    fireEvent.click(within(screen.getByText(FAQ2).closest('.group')).getByTitle('מחיקה'));
    fireEvent.click(screen.getByRole('button', { name: /סקירה ושמירה/ }));
    const again = await screen.findByRole('dialog');
    fireEvent.click(within(again).getByRole('checkbox'));
    fireEvent.click(within(again).getByRole('button', { name: /שמירה סופית/ }));
    await waitFor(() => expect(screen.getByText(/הפריט עודכן בינתיים - השמירה שלך תדרוס את הגרסה החדשה/)).toBeInTheDocument());
    expect(screen.getByDisplayValue('טיוטה שעוד לא אושרה')).toBeInTheDocument();
  });

  it('per-language edits of communities and the questionnaire carry their language into the log', async () => {
    // The Arabic tab's questionnaire.
    hold.patchGet = (path, data) => (path.startsWith('/admin/questionnaires')
      ? (Array.isArray(data) ? data.map(q => ({ ...q, langId: 'ar' })) : { ...data, langId: 'ar' })
      : data);
    renderAdmin();
    fireEvent.click(screen.getByRole('button', { name: 'עריכת תוכן' }));
    fireEvent.click(within(screen.getByRole('group', { name: 'שפת העריכה' })).getByRole('button', { name: 'ערבית' }));

    fireEvent.click(screen.getByRole('button', { name: 'קהילות' }));
    const community = (await screen.findByText('קבוצת תמיכה לדוגמה', {}, { timeout: 4000 })).closest('.group');
    fireEvent.click(within(community).getByTitle('עריכה'));
    fireEvent.change(screen.getByDisplayValue('קבוצת תמיכה לדוגמה'), { target: { value: 'مجموعة دعم' } });
    fireEvent.click(screen.getByRole('button', { name: 'אישור' }));

    fireEvent.click(screen.getByRole('button', { name: 'שאלון PCL-5' }));
    await screen.findByText('PCL-5 (תצוגה מקדימה)', {}, { timeout: 4000 });
    fireEvent.click(screen.getByRole('button', { name: /שאלות \(/ }));
    const question = await screen.findByText('זיכרונות חוזרים ומטרידים של האירוע', {}, { timeout: 4000 });
    fireEvent.click(within(question.closest('.p-3')).getByTitle('עריכה'));
    fireEvent.change(screen.getByLabelText('טקסט השאלה'), { target: { value: 'ذكريات متكررة' } });
    fireEvent.click(screen.getByRole('button', { name: 'אישור' }));

    fireEvent.click(screen.getByRole('button', { name: /סקירה ושמירה/ }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('checkbox'));
    fireEvent.click(within(dialog).getByRole('button', { name: /שמירה סופית/ }));
    await waitFor(() => expect(calls.some(c => c.body?.categoryIds?.[0] === 'cat-admin-log')).toBe(true));
    const log = calls.find(c => c.body?.categoryIds?.[0] === 'cat-admin-log');
    const entry = JSON.parse(log.body.content);
    expect(entry.changes.map(c => [c.title, c.lang])).toEqual([['مجموعة دعم', 'ar'], ['ذكريات متكررة', 'ar']]);
  });
});
