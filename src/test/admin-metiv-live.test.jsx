import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '@/lib/LanguageContext';
import { ValidationProvider } from '@/contexts/ValidationContext';
import AdminGate from '@/components/admin/AdminGate';
import { liveGet } from '@/api/adminLiveRead';
import { loadPtsdFaq, loadRightsFaq } from '@/api/adminSource';
import { loadMetiv } from '@/api/metivAdminSource';
import { loadChatbotQa } from '@/api/chatbotQaAdminSource';
import { loadSiteCopyRows } from '@/api/adminSiteCopy';
import { buildSiteTree, flattenPages } from '@/components/admin/metivSiteMap';
import { copyContentKeys } from '@/components/admin/copyContentKeys';
import { COLLECTION_BY_KEY, COPY_SLUG } from '@/pages/metiv-demos/v3/content/registry';

// The dev server's read-only admin against the LIVE API, end to end: the same
// public-endpoint client the dev server uses (src/api/adminLiveRead.js), the
// real loaders and the real page tree. Network, so opt-in:
//   ADMIN_LIVE=1 npx vitest run src/test/admin-metiv-live.test.jsx

const live = process.env.ADMIN_LIVE === '1';

vi.mock('@/api/adminClient', async () => {
  const actual = await vi.importActual('@/api/adminClient');
  const { liveGet: get } = await vi.importActual('@/api/adminLiveRead');
  return {
    ...actual,
    adminApi: async (method, path) => {
      if (method !== 'GET') throw new actual.ReadOnlyPreviewError();
      return get(path);
    },
  };
});

describe.skipIf(!live)('metiv admin on the live data (read-only)', () => {
  let store;
  beforeAll(async () => { store = await loadMetiv(); }, 60000);
  afterAll(() => cleanup());

  it('reads the 12 Hebrew PTSD FAQs and the rights FAQs', async () => {
    expect(await loadPtsdFaq({ lang: 'he' })).toHaveLength(12);
    const rights = await Promise.all(['security_forces', 'general', 'hostilities'].map(c => loadRightsFaq({ lang: 'he', audienceSlug: c })));
    expect(rights.flat().length).toBeGreaterThan(5);
    expect(rights.every(r => r.length > 0)).toBe(true);
  }, 60000);

  it('reads the chatbot Q&A and the questionnaire', async () => {
    const qa = await loadChatbotQa();
    expect(qa.rows.filter(r => r.langId === 'he').length).toBeGreaterThan(20);
    const list = await liveGet('/admin/questionnaires');
    expect(list.some(q => q.langId === 'he')).toBe(true);
  }, 60000);

  it('reads the site-copy override rows through the public endpoint (none is fine)', async () => {
    const siteCopy = await loadSiteCopyRows();
    expect(Array.isArray(siteCopy.rows)).toBe(true);
    for (const r of siteCopy.rows) expect(typeof r.key).toBe('string');
  }, 60000);

  it('every site-map page resolves each of its sections to live rows', () => {
    const tree = buildSiteTree();
    const problems = [];
    for (const page of flattenPages(tree)) {
      for (const s of page.sections) {
        if (s.kind === 'collection' || s.kind === 'item') {
          const col = COLLECTION_BY_KEY[s.key];
          const rows = store.rows.filter(r => r.col === col.slug && r.langId === 'he');
          if (!rows.length) problems.push(`${page.id}: no rows for ${s.key}`);
          for (const f of s.fields ?? []) {
            const top = f.split('.')[0];
            if (!rows.some(r => top in r.content)) problems.push(`${page.id}: ${s.key} has no field ${f}`);
          }
        }
        if (s.kind === 'copy') {
          const row = store.rows.find(r => r.col === COPY_SLUG && r.langId === 'he' && r.key === s.ns);
          if (!row) problems.push(`${page.id}: no copy row ${s.ns}`);
          for (const k of copyContentKeys(s.ns)) if (row && typeof row.content[k] !== 'string') problems.push(`${page.id}: copy ${s.ns}.${k} missing`);
        }
      }
    }
    expect(problems).toEqual([]);
    // Every language has the Metiv rows.
    for (const lang of ['ar', 'en', 'ru', 'fr']) expect(store.rows.some(r => r.langId === lang)).toBe(true);
  });

  it('the panel opens every page of the tree on live data without an error', async () => {
    localStorage.setItem('natal_lang', 'he');
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <LanguageProvider>
          <ValidationProvider>
            <MemoryRouter initialEntries={['/metiv-site-demo-v3/admin']}>
              <AdminGate variant="metiv" />
            </MemoryRouter>
          </ValidationProvider>
        </LanguageProvider>
      </QueryClientProvider>
    );
    expect(screen.getByText(/התוכן האמיתי מהאתר החי, לקריאה בלבד/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'עריכת תוכן' }));
    const nav = await screen.findByRole('navigation', { name: 'עמודי האתר' });
    // Wait for the course pages, which come from the live rows.
    await waitFor(() => {
      for (const b of within(nav).queryAllByRole('button', { expanded: false })) fireEvent.click(b);
      expect(within(nav).getByRole('button', { name: /הכשרה לטיפול CBT בטראומה/ })).toBeInTheDocument();
    }, { timeout: 60000 });

    const pages = within(nav).getAllByRole('button', { pressed: false }).concat(within(nav).getAllByRole('button', { pressed: true }));
    const labels = pages.map(b => b.textContent);
    expect(labels.length).toBeGreaterThan(50);
    const visited = [];
    for (const label of labels) {
      const button = within(nav).getAllByRole('button').find(b => b.textContent === label && b.hasAttribute('aria-pressed'));
      fireEvent.click(button);
      const [heading] = await screen.findAllByRole('heading', { level: 2 });
      await waitFor(() => expect(screen.queryAllByText('טוען...')).toHaveLength(0), { timeout: 30000 });
      expect(screen.queryByText(/שגיאה בטעינת/)).toBeNull();
      expect(screen.queryByText(/אין עדיין שורה במסד/)).toBeNull();
      visited.push(heading.textContent);
    }
    expect(visited).toHaveLength(labels.length);
    expect(visited).toContain('מה זה פוסט-טראומה');
    // The where-to-get-help page: its sections, in site order, with live data.
    fireEvent.click(within(nav).getByRole('button', { name: 'איפה מקבלים טיפול' }));
    const regions = await screen.findAllByRole('region');
    expect(regions.map(r => r.getAttribute('aria-label')).slice(0, 5)).toEqual([
      'טקסטים בעמוד', 'המערכת הציבורית', 'עמותות וקווי סיוע', 'מרפאות ותוכניות של מטיב', 'לא בטוחים אם לפנות?',
    ]);
    const services = store.rows.filter(r => r.col === 'metiv-services' && r.langId === 'he').length;
    expect(within(regions[3]).getByText(`${services} פריטים`)).toBeInTheDocument();
    // The PTSD FAQ page shows all 12 live questions.
    fireEvent.click(within(nav).getByRole('button', { name: 'מה זה פוסט-טראומה' }));
    expect(await screen.findByText('12 פריטים', {}, { timeout: 30000 })).toBeInTheDocument();
  }, 600000);
});
