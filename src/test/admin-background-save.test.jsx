import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup, within, act } from '@testing-library/react';
import { PendingChangesProvider, SaveAllBar, usePendingChanges } from '@/components/admin/PendingChanges';
import { OtherSavesBanner, SaveProgressStrip } from '@/components/admin/SaveStatus';
import EditLogPanel, { changeLang } from '@/components/admin/EditLogPanel';
import { reindexItem } from '@/api/reindex';
import { requestReindex } from '@/api/reindexQueue';
import { appendEditLog, loadEditLog } from '@/api/adminSource';
import { UnauthorizedError } from '@/api/adminClient';
import { _resetSaveStatusCache, createSaveStatus } from '@/api/adminStatus';

// The background "save all" (PendingChangesProvider.startSave) and the save
// notices (SaveStatus.jsx), on synthetic staged changes whose writes the test
// controls: concurrency and ordering, the queued chatbot reindex, the shared
// status row other sessions poll, and the edit log's language buttons.

const h = vi.hoisted(() => ({ api: null, preview: false }));
vi.mock('@/lib/adminPreview', () => ({ ADMIN_PREVIEW: true }));
vi.mock('@/lib/auth', () => ({
  AUTH_CHANGE_EVENT: 'test-auth-change',
  inReadOnlyPreview: () => h.preview,
  hasAdminAccess: () => true,
  getToken: () => 'tok',
  getCurrentUser: () => ({ id: 'u1', email: 'me@example.org', name: 'אני' }),
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
vi.mock('@/api/adminSource', () => ({
  appendEditLog: vi.fn(async () => {}),
  loadEditLog: vi.fn(async () => []),
}));
vi.mock('@/api/adminUsers', () => ({ listUsers: async () => [] }));

// ─── A recording API with the admin-status category ─────────────────────────

let api;
function resetApi({ statusCategory = false, statusRows = [] } = {}) {
  api = { writes: [], statusCategory, statusRows, created: 0 };
  h.api = async (method, path, body) => {
    const [base, query = ''] = path.split('?');
    if (method === 'GET') {
      if (base === '/categories') return api.statusCategory ? [{ id: 'cat-admin-status', slug: 'admin-status', parentId: null }] : [];
      if (base === '/admin/articles' && new URLSearchParams(query).get('categoryId') === 'cat-admin-status') {
        return api.statusRows.map(r => ({ id: r.id, type: 'article', langId: 'he', content: JSON.stringify(r.content) }));
      }
      throw new Error(`no GET fixture for ${path}`);
    }
    api.writes.push({ method, path, body });
    if (path === '/admin/categories') { api.statusCategory = true; return { id: `cat-${body.slug}` }; }
    if (method === 'POST') { api.created += 1; return { id: `status-${api.created}` }; }
    return {};
  };
}

// ─── Synthetic changes with controllable writes ─────────────────────────────

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

let log; // ['start:key', 'end:key'] in the order they happened
let active;
let maxActive;
function change(key, { action = 'update', linkedTo, lang, section = 'שאלות PTSD', gate, reindex = [], fail } = {}) {
  return {
    key, scope: 's', section, action, title: key, diff: [{ label: 'שדה', before: 'א', after: 'ב' }],
    ...(linkedTo ? { linkedTo } : {}), ...(lang ? { lang } : {}),
    run: async () => {
      log.push(`start:${key}`);
      active += 1;
      maxActive = Math.max(maxActive, active);
      try {
        if (gate) await gate.promise;
        else await Promise.resolve();
        if (fail) throw fail;
        for (const id of reindex) await requestReindex(id);
      } finally {
        active -= 1;
        log.push(`end:${key}`);
      }
    },
  };
}

let ctx;
function Grab() {
  ctx = usePendingChanges();
  return null;
}

function renderSave() {
  return render(
    <PendingChangesProvider>
      <Grab />
      <SaveProgressStrip />
      <SaveAllBar />
    </PendingChangesProvider>
  );
}

function stageAll(list) {
  act(() => { for (const c of list) ctx.stage(c); });
}

const unloadBlocked = () => {
  const e = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(e);
  return e.defaultPrevented;
};

describe('admin: background save', () => {
  let errorSpy;
  beforeEach(() => {
    log = [];
    active = 0;
    maxActive = 0;
    h.preview = false;
    resetApi();
    _resetSaveStatusCache();
    vi.mocked(reindexItem).mockReset();
    vi.mocked(reindexItem).mockImplementation(async () => {});
    vi.mocked(appendEditLog).mockClear();
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => { errorSpy.mockRestore(); cleanup(); });

  it('the review closes at once; new edits during the save are not part of it, and a second save waits', async () => {
    renderSave();
    const gate = deferred();
    stageAll([change('a', { gate }), change('b', { gate }), change('c', { gate })]);

    fireEvent.click(screen.getByRole('button', { name: /סקירה ושמירה/ }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('checkbox'));
    fireEvent.click(within(dialog).getByRole('button', { name: /שמירה סופית/ }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const strip = screen.getByTestId('save-progress');
    expect(within(strip).getByText('שומר 0 מתוך 3...')).toBeInTheDocument();
    expect(unloadBlocked()).toBe(true);
    // The running batch is not "waiting to be saved" any more.
    expect(screen.queryByText(/ממתינים לשמירה/)).toBeNull();

    // A new edit while it runs: staged on its own, and its save has to wait.
    stageAll([change('d')]);
    expect(screen.getByText('שינוי אחד ממתין לשמירה')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /סקירה ושמירה/ }));
    const second = await screen.findByRole('dialog');
    expect(within(second).getByText(/שמירה קודמת עדיין רצה ברקע/)).toBeInTheDocument();
    fireEvent.click(within(second).getByRole('checkbox'));
    expect(within(second).getByRole('button', { name: /ממתין לסיום השמירה הקודמת/ })).toBeDisabled();
    fireEvent.click(within(second).getByRole('button', { name: 'חזרה לעריכה' }));

    await act(async () => { gate.resolve(); });
    await waitFor(() => expect(screen.getByText('3 שינויים נשמרו ומופיעים באתר')).toBeInTheDocument());
    expect(log.filter(l => l.startsWith('start:'))).toEqual(['start:a', 'start:b', 'start:c']);
    expect(ctx.changes.map(c => c.key)).toEqual(['d']);
    expect(vi.mocked(appendEditLog).mock.calls[0][0].changes.map(c => c.title)).toEqual(['a', 'b', 'c']);
  });

  it('an item edited again during the save keeps the new edit staged', async () => {
    renderSave();
    const gate = deferred();
    stageAll([change('a', { gate })]);
    let run;
    act(() => { run = ctx.startSave(ctx.changes); });
    const again = change('a');
    again.title = 'a again';
    stageAll([again]);
    await act(async () => { gate.resolve(); await run; });
    expect(ctx.changes).toEqual([again]);
  });

  it('writes at most 4 at once; translations start after their Hebrew create, deletes after every other write', async () => {
    renderSave();
    const heGate = deferred();
    const gates = [deferred(), deferred(), deferred(), deferred(), deferred()];
    let groupId = null;
    const he = change('he', { action: 'create', gate: heGate });
    const heRun = he.run;
    he.run = async () => { await heRun(); groupId = 'grp-new'; };
    const translations = ['ar', 'en', 'ru', 'fr'].map(lang => {
      const t = change(`he::${lang}`, { action: 'create', linkedTo: 'he', lang });
      const tRun = t.run;
      t.run = async () => {
        if (!groupId) throw new Error('no groupId yet');
        await tRun();
      };
      return t;
    });
    const updates = gates.map((g, i) => change(`u${i}`, { gate: g }));
    const del = change('del', { action: 'delete' });
    stageAll([del, he, ...translations, ...updates]);

    let run;
    act(() => { run = ctx.startSave(ctx.changes); });
    await waitFor(() => expect(log.filter(l => l.startsWith('start:'))).toHaveLength(4));
    // The Hebrew create and the first three updates; the delete, the
    // translations and the fifth update wait.
    expect(log).toEqual(['start:he', 'start:u0', 'start:u1', 'start:u2']);
    expect(maxActive).toBe(4);

    await act(async () => { heGate.resolve(); });
    await waitFor(() => expect(log).toContain('start:u3'));
    for (const g of gates) g.resolve();
    await act(async () => { await run; });

    const at = l => log.indexOf(l);
    for (const t of translations) expect(at(`start:${t.key}`)).toBeGreaterThan(at('end:he'));
    for (const c of [he, ...translations, ...updates]) expect(at('start:del')).toBeGreaterThan(at(`end:${c.key}`));
    expect(maxActive).toBeLessThanOrEqual(4);
    expect(screen.getByText('11 שינויים נשמרו ומופיעים באתר')).toBeInTheDocument();
    expect(ctx.changes).toEqual([]);
  });

  it('a failed Hebrew write skips its translations; the strip lists it, and the retry writes only what is left', async () => {
    renderSave();
    let fail = true;
    const he = change('he');
    const heRun = he.run;
    he.run = async () => { if (fail) throw new Error('500 boom'); return heRun(); };
    const tr = change('he::ar', { linkedTo: 'he', lang: 'ar' });
    stageAll([he, tr, change('ok')]);

    await act(async () => { await ctx.startSave(ctx.changes); });
    expect(log).toEqual(['start:ok', 'end:ok']);
    const strip = screen.getByTestId('save-progress');
    expect(within(strip).getByText('1 שינויים נשמרו, 2 לא נשמרו ונשארו ברשימה.')).toBeInTheDocument();
    expect(within(strip).getByText(/500 boom/)).toBeInTheDocument();
    expect(within(strip).getByText(/שינוי אחד נוסף לא נשמר/)).toBeInTheDocument();
    expect(ctx.changes.map(c => c.key)).toEqual(['he', 'he::ar']);

    fail = false;
    log = [];
    fireEvent.click(within(strip).getByRole('button', { name: /ניסיון חוזר/ }));
    await waitFor(() => expect(screen.getByText('2 שינויים נשמרו ומופיעים באתר')).toBeInTheDocument());
    expect(log.filter(l => l.startsWith('start:'))).toEqual(['start:he', 'start:he::ar']);
    expect(ctx.changes).toEqual([]);
  });

  it('a dead session stops the batch and keeps the rest staged', async () => {
    renderSave();
    stageAll([
      change('a', { fail: new UnauthorizedError() }),
      ...['b', 'c', 'd', 'e', 'f'].map(k => change(k)),
    ]);
    await act(async () => { await ctx.startSave(ctx.changes); });
    const strip = screen.getByTestId('save-progress');
    expect(within(strip).getByText(/פג תוקף ההתחברות, והשמירה נעצרה/)).toBeInTheDocument();
    // The writes already in flight finish; nothing new starts after the 401.
    expect(log.filter(l => l.startsWith('start:'))).toEqual(['start:a', 'start:b', 'start:c', 'start:d']);
    expect(ctx.changes.map(c => c.key)).toEqual(['a', 'e', 'f']);
  });

  it('queues the chatbot reindexes after the writes, deduped, 3 at a time, and never blocks the save', async () => {
    renderSave();
    const calls = [];
    let running = 0;
    let peak = 0;
    const syncGates = new Map();
    vi.mocked(reindexItem).mockImplementation(async id => {
      calls.push({ id, writesLeft: active });
      running += 1;
      peak = Math.max(peak, running);
      const g = deferred();
      syncGates.set(id, g);
      try { await g.promise; } finally { running -= 1; }
    });
    stageAll([
      change('a', { reindex: ['r1'] }),
      change('b', { reindex: ['r2', 'r1'] }),
      change('c', { reindex: ['r3'] }),
      change('d', { reindex: ['r4'] }),
      change('e', { reindex: ['r5'] }),
    ]);
    let run;
    act(() => { run = ctx.startSave(ctx.changes); });
    // The save is done (and logged) while the worker has not answered once.
    await waitFor(() => expect(screen.getByText('5 שינויים נשמרו ומופיעים באתר')).toBeInTheDocument());
    expect(appendEditLog).toHaveBeenCalledTimes(1);
    expect(calls.map(c => c.id)).toEqual(['r1', 'r2', 'r3']);
    expect(calls.every(c => c.writesLeft === 0)).toBe(true);
    expect(screen.getByText(/מעדכן את הצ׳אטבוט 0 מתוך 5/)).toBeInTheDocument();
    // Closing the tab now would drop the sync.
    expect(unloadBlocked()).toBe(true);

    await act(async () => { syncGates.get('r1').resolve(); });
    await waitFor(() => expect(calls.map(c => c.id)).toEqual(['r1', 'r2', 'r3', 'r4']));
    await act(async () => {
      syncGates.get('r2').reject(new Error('worker 502'));
      for (const id of ['r3', 'r4']) syncGates.get(id).resolve();
    });
    await waitFor(() => expect(syncGates.has('r5')).toBe(true));
    await act(async () => { syncGates.get('r5').resolve(); await run; });

    expect(peak).toBeLessThanOrEqual(3);
    expect(calls.map(c => c.id).sort()).toEqual(['r1', 'r2', 'r3', 'r4', 'r5']);
    const warning = screen.getByText(/עדכון הצ׳אטבוט נכשל לפריט אחד/).closest('[role="alert"]');
    expect(within(warning).getByText(/worker 502/)).toBeInTheDocument();
    // The content result stands.
    expect(screen.getByText('5 שינויים נשמרו ומופיעים באתר')).toBeInTheDocument();
    expect(unloadBlocked()).toBe(false);

    vi.mocked(reindexItem).mockImplementation(async id => { calls.push({ id, writesLeft: 0 }); });
    fireEvent.click(within(warning).getByRole('button', { name: /ניסיון חוזר לסנכרון הצ׳אטבוט/ }));
    await waitFor(() => expect(screen.queryByText(/עדכון הצ׳אטבוט נכשל/)).toBeNull());
    expect(calls.at(-1).id).toBe('r2');
    expect(calls).toHaveLength(6);
  });

  it('keeps a shared status row: created at the start, patched every 3 writes, finished at the end', async () => {
    renderSave();
    const gate = deferred();
    stageAll([
      change('a', { section: 'שאלות PTSD', gate }),
      ...['b', 'c', 'd', 'e', 'f', 'g'].map(k => change(k, { section: k < 'e' ? 'שאלות PTSD' : 'צ׳אטבוט' })),
    ]);
    let run;
    act(() => { run = ctx.startSave(ctx.changes); });
    await waitFor(() => expect(api.writes.some(w => w.method === 'POST' && w.path === '/admin/articles')).toBe(true));

    expect(api.writes[0]).toEqual({ method: 'POST', path: '/admin/categories', body: expect.objectContaining({ slug: 'admin-status' }) });
    const create = api.writes[1];
    expect(create.body).toMatchObject({ type: 'article', langId: 'he', isPublished: false, categoryIds: ['cat-admin-status'] });
    const started = JSON.parse(create.body.content);
    expect(started).toMatchObject({
      user: { id: 'u1', email: 'me@example.org', name: 'אני' },
      total: 7, done: 0, failed: 0, sections: ['שאלות PTSD', 'צ׳אטבוט'],
    });
    expect(started.finishedAt).toBeUndefined();

    await act(async () => { gate.resolve(); await run; });
    const patches = api.writes.filter(w => w.method === 'PATCH' && w.path === '/admin/articles/status-1').map(w => JSON.parse(w.body.content));
    expect(patches.map(p => p.done)).toEqual([3, 6, 7]);
    expect(patches.slice(0, -1).every(p => !p.finishedAt)).toBe(true);
    expect(patches.at(-1)).toMatchObject({ done: 7, total: 7, failed: 0, startedAt: started.startedAt });
    expect(patches.at(-1).finishedAt).toEqual(expect.any(String));
  });

  it('a status row that cannot be written never holds up the save', async () => {
    renderSave();
    h.api = async () => { throw new Error('status down'); };
    stageAll([change('a'), change('b')]);
    await act(async () => { await ctx.startSave(ctx.changes); });
    expect(screen.getByText('2 שינויים נשמרו ומופיעים באתר')).toBeInTheDocument();
  });

  it('writes no status row in the read-only preview', async () => {
    h.preview = true;
    renderSave();
    stageAll([change('a')]);
    await act(async () => { await ctx.startSave(ctx.changes); });
    expect(api.writes).toEqual([]);
  });
});

// ─── Other sessions ─────────────────────────────────────────────────────────

describe('admin: saves in other sessions', () => {
  beforeEach(() => {
    h.preview = false;
    _resetSaveStatusCache();
  });
  afterEach(() => cleanup());

  const iso = msAgo => new Date(Date.now() - msAgo).toISOString();
  const row = (id, content) => ({ id, content: { user: { id: 'u2', email: 'dana@example.org', name: 'דנה' }, startedAt: iso(60000), sections: ['שאלות PTSD', 'צ׳אטבוט'], total: 5, done: 2, failed: 0, ...content } });

  function renderBanner() {
    return render(
      <PendingChangesProvider>
        <Grab />
        <OtherSavesBanner signedIn />
      </PendingChangesProvider>
    );
  }

  it('shows another session\'s running batch, ignores a stale one and this tab\'s own', async () => {
    resetApi({ statusCategory: true });
    const ownId = await createSaveStatus({ user: { id: 'u1', email: 'me@example.org', name: 'אני' }, startedAt: iso(0), updatedAt: iso(0), total: 9, done: 1, failed: 0, sections: ['ילדים'] });
    api.statusRows = [
      row('running', { updatedAt: iso(20 * 1000) }),
      row('stale', { updatedAt: iso(11 * 60 * 1000), user: { id: 'u3', email: 'old@example.org', name: 'ישן' } }),
      row(ownId, { updatedAt: iso(0), user: { id: 'u1', email: 'me@example.org', name: 'אני' } }),
    ];
    renderBanner();
    const banner = await screen.findByTestId('other-saves');
    expect(within(banner).getByText(/שומר כרגע 5 שינויים בשאלות PTSD, צ׳אטבוט \(2\/5\)/)).toBeInTheDocument();
    expect(within(banner).getByText('דנה')).toBeInTheDocument();
    expect(within(banner).queryByText('ישן')).toBeNull();
    expect(within(banner).queryByText('אני')).toBeNull();
    expect(within(banner).getAllByRole('status')).toHaveLength(1);
  });

  it('on focus, picks up a batch that just finished and suggests a refresh, which reloads the panels', async () => {
    resetApi({ statusCategory: true, statusRows: [row('r1', { updatedAt: iso(5000) })] });
    renderBanner();
    await screen.findByText(/שומר כרגע/);

    await new Promise(r => setTimeout(r, 5));
    api.statusRows = [row('r1', { updatedAt: iso(0), done: 5, finishedAt: iso(0) })];
    await act(async () => { window.dispatchEvent(new Event('focus')); });
    const notice = await screen.findByText(/עודכן לפני רגע - כדאי לרענן לפני עריכה/);
    expect(screen.queryByText(/שומר כרגע/)).toBeNull();
    expect(notice.textContent).toContain('סיים לשמור 5 שינויים');

    const before = ctx.version;
    fireEvent.click(screen.getByRole('button', { name: /רענון התוכן/ }));
    expect(ctx.version).toBe(before + 1);
    expect(screen.queryByText(/עודכן לפני רגע/)).toBeNull();
  });

  it('a batch that finished before the page opened is not announced', async () => {
    resetApi({ statusCategory: true, statusRows: [row('r1', { updatedAt: iso(30000), finishedAt: iso(30000), done: 5 })] });
    const get = vi.fn(h.api);
    h.api = get;
    renderBanner();
    await waitFor(() => expect(get).toHaveBeenCalledWith('GET', '/admin/articles?type=article&categoryId=cat-admin-status'));
    expect(screen.queryByTestId('other-saves')).toBeNull();
  });

  it('does not poll in the read-only preview', async () => {
    h.preview = true;
    resetApi({ statusCategory: true, statusRows: [row('r1', { updatedAt: iso(0) })] });
    const get = vi.fn(h.api);
    h.api = get;
    renderBanner();
    await act(async () => { window.dispatchEvent(new Event('focus')); });
    expect(get).not.toHaveBeenCalled();
    expect(screen.queryByTestId('other-saves')).toBeNull();
  });
});

// ─── Edit log languages ─────────────────────────────────────────────────────

describe('edit log: Hebrew first, other languages on demand', () => {
  afterEach(() => cleanup());

  it('reads a change\'s language from `lang`, else from an old title suffix', () => {
    expect(changeLang({ title: 'x', lang: 'ru' })).toBe('ru');
    expect(changeLang({ title: 'שאלה (ערבית)' })).toBe('ar');
    expect(changeLang({ title: 'שאלה (צרפתית) ' })).toBe('fr');
    expect(changeLang({ title: 'שאלה (הערה)' })).toBe('he');
    expect(changeLang({ title: 'שאלה' })).toBe('he');
  });

  it('lists the Hebrew changes, with one button per other language that reveals its changes', async () => {
    vi.mocked(loadEditLog).mockResolvedValue([{
      id: 'log1',
      at: '2026-10-29T10:00:00.000Z',
      user: { id: 'u2', email: 'dana@example.org', name: 'דנה' },
      changes: [
        { section: 'שאלות PTSD', action: 'update', title: 'שאלה ערוכה', lang: 'he', fields: [{ label: 'שאלה', before: 'ישנה', after: 'חדשה' }] },
        { section: 'שאלות PTSD', action: 'update', title: 'שאלה ערוכה (ערבית)', lang: 'ar', fields: [{ label: 'שאלה', before: 'ar-old', after: 'ar-new' }] },
        // Logged before changes carried `lang`.
        { section: 'שאלות PTSD', action: 'update', title: 'שאלה ערוכה (אנגלית)', fields: [{ label: 'שאלה', before: 'en-old', after: 'en-new' }] },
        { section: 'שאלות PTSD', action: 'update', title: 'שאלה ערוכה (רוסית)', lang: 'ru', fields: [] },
        { section: 'שאלות PTSD', action: 'delete', title: 'אחרת (רוסית)', lang: 'ru', fields: [] },
      ],
    }]);
    render(<PendingChangesProvider><EditLogPanel /></PendingChangesProvider>);
    const head = await screen.findByText('דנה');
    expect(screen.getByText(/שינוי אחד · ועוד 4 בשפות אחרות/)).toBeInTheDocument();
    expect(screen.queryByText(/ערבית\)/)).toBeNull();
    fireEvent.click(head);

    expect(screen.getByText('חדשה')).toBeInTheDocument();
    expect(screen.queryByText('ar-new')).toBeNull();
    expect(screen.queryByText('en-new')).toBeNull();
    const ar = screen.getByRole('button', { name: 'ערבית (1)' });
    expect(screen.getByRole('button', { name: 'אנגלית (1)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'רוסית (2)' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /צרפתית/ })).toBeNull();

    fireEvent.click(ar);
    expect(ar).toHaveAttribute('aria-pressed', 'true');
    const arSection = screen.getByRole('region', { name: 'ערבית' });
    expect(within(arSection).getByText('ar-new')).toBeInTheDocument();
    expect(screen.queryByText('en-new')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'אנגלית (1)' }));
    expect(screen.getByText('en-new')).toBeInTheDocument();
    fireEvent.click(ar);
    expect(screen.queryByText('ar-new')).toBeNull();
  });
});
