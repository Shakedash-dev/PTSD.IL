import { describe, it, expect, vi, beforeEach } from 'vitest';

// Captures every admin API call instead of hitting the network, so the tests can
// assert on the exact payload a save would send.
const calls = [];
vi.mock('@/api/adminClient', () => ({
  adminApi: vi.fn(async (method, path, body) => {
    calls.push({ method, path, body });
    if (path === '/categories') return [{ id: 'cat-treatment', slug: 'treatment', children: [] }];
    if (path === '/audiences' || path === '/age-groups') return [];
    if (path.startsWith('/admin/articles?')) return [];
    // Like the real API: PATCH /admin/articles/:id answers with that row.
    if (method === 'PATCH') return { id: path.split('/').pop() };
    return { id: 'created-id' };
  }),
  ForbiddenError: class extends Error {},
  UnauthorizedError: class extends Error {},
}));
const reindexed = [];
vi.mock('@/api/reindex', () => ({
  reindexItem: vi.fn(async id => { reindexed.push(id); }),
  ChatbotSyncError: class extends Error {},
}));

const { loadTreatment, saveTreatment, _resetTaxonomyCache } = await import('@/api/adminSource');

describe('treatment admin: every language, and the chatbot stays in sync', () => {
  beforeEach(() => { calls.length = 0; reindexed.length = 0; _resetTaxonomyCache(); });

  it('loads the requested language, not always Hebrew', async () => {
    await loadTreatment({ lang: 'fr' });
    const list = calls.find(c => c.path.startsWith('/admin/articles?'));
    expect(list.path).toContain('langId=fr');
  });

  it('keeps an existing row in its own language when saving', async () => {
    await saveTreatment(
      { id: 'row-en', langId: 'en', step_number: 3, title_he: 'Trauma-Focused Therapies', description_he: '', how_to_start_he: '', methods: [], links: [] },
      { lang: 'he' } // even if the caller passes a different language
    );
    const patch = calls.find(c => c.method === 'PATCH');
    expect(patch.path).toBe('/admin/articles/row-en');
    expect(patch.body.langId).toBe('en');
  });

  it('writes the new method description into the content JSON and reindexes that row', async () => {
    await saveTreatment({
      id: 'row-he', langId: 'he', step_number: 3, title_he: 'טיפולים ממוקדי טראומה',
      description_he: 'x', how_to_start_he: '',
      methods: [{ title_he: 'CBT - טיפול קוגניטיבי-התנהגותי', description_he: 'תיאור מעודכן', how_to_start_he: '<p>a</p>', links: [] }],
      links: [],
    });
    const patch = calls.find(c => c.method === 'PATCH');
    const content = JSON.parse(patch.body.content);
    expect(content.methods[0]).toMatchObject({ title: 'CBT - טיפול קוגניטיבי-התנהגותי', description: 'תיאור מעודכן' });
    // The chatbot's vector DB is re-embedded for exactly the row that changed.
    expect(reindexed).toEqual(['row-he']);
  });
});
