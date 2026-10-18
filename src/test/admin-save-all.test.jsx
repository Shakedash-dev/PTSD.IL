import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, fireEvent, cleanup, within } from '@testing-library/react';
import { renderAdmin } from './renderAdmin';

// "Save all" against an API that accepts writes: reads come from the preview
// fixtures, every write is recorded. Pins that a batch sends exactly the staged
// writes, then one unpublished edit-log row describing them.

const calls = [];
vi.mock('@/api/adminClient', async () => {
  const { previewGet } = await vi.importActual('@/api/adminPreviewFixtures');
  return {
    adminApi: vi.fn(async (method, path, body) => {
      if (method === 'GET') return JSON.parse(JSON.stringify(previewGet(path)));
      calls.push({ method, path, body });
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
    fireEvent.click(within(dialog).getByRole('checkbox'));
    fireEvent.click(within(dialog).getByRole('button', { name: /שמירה סופית/ }));

    await waitFor(() => expect(calls.some(c => c.method === 'POST')).toBe(true));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    const [patch, del, log] = calls;
    expect(patch).toMatchObject({ method: 'PATCH', path: '/admin/articles/a1' });
    expect(patch.body.title).toBe('שאלה ערוכה');
    expect(del).toMatchObject({ method: 'DELETE', path: '/admin/articles/a2' });

    expect(log.path).toBe('/admin/articles');
    expect(log.body).toMatchObject({ type: 'article', categoryIds: ['cat-admin-log'], isPublished: false });
    const entry = JSON.parse(log.body.content);
    expect(entry.user).toHaveProperty('id');
    expect(entry.changes).toEqual([
      { section: 'שאלות PTSD', action: 'update', title: 'שאלה ערוכה', fields: [{ label: 'שאלה', before: FAQ1, after: 'שאלה ערוכה' }] },
      { section: 'שאלות PTSD', action: 'delete', title: FAQ2, fields: [] },
    ]);
    expect(calls).toHaveLength(3);
    expect(screen.queryByText(/ממתין לשמירה/)).toBeNull();
  });
});
