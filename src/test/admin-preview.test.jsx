import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LanguageProvider } from '@/lib/LanguageContext';
import { ValidationProvider } from '@/contexts/ValidationContext';
import { adminApi, ReadOnlyPreviewError } from '@/api/adminClient';
import { ADMIN_PREVIEW } from '@/lib/adminPreview';
import Admin from '@/pages/Admin';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('admin preview: safety', () => {
  it('is gated on import.meta.env.DEV, which Vite compiles to false in a build', () => {
    const src = fs.readFileSync(path.join(SRC, 'lib', 'adminPreview.js'), 'utf8');
    expect(src).toMatch(/import\.meta\.env\.DEV/);
    // No runtime escape hatch - nothing that could switch it on in production.
    expect(src).not.toMatch(/location|searchParams|localStorage|sessionStorage/);
  });

  it('loads the fixtures through a dynamic import, so they are not bundled', () => {
    const src = fs.readFileSync(path.join(SRC, 'api', 'adminClient.js'), 'utf8');
    expect(src).toMatch(/await import\('\.\/adminPreviewFixtures'\)/);
    expect(src).not.toMatch(/^import .*adminPreviewFixtures/m);
  });

  it('is on under the dev server, which is where the panel is designed', () => {
    expect(ADMIN_PREVIEW).toBe(true);
  });

  // The guarantee that matters: a deployed build must contain no trace of the
  // preview. Runs against whatever `npm run build` last produced; the four
  // gates build before every commit, so this sees a current bundle.
  it('leaves nothing behind in a production build', () => {
    const distDir = path.join(SRC, 'dist', 'assets');
    if (!fs.existsSync(distDir)) {
      throw new Error('no src/dist - run `npm run build` so this check is not vacuous');
    }
    const bundle = fs
      .readdirSync(distDir)
      .filter((f) => f.endsWith('.js') || f.endsWith('.css'))
      .map((f) => fs.readFileSync(path.join(distDir, f), 'utf8'))
      .join('\n');
    expect(bundle.length).toBeGreaterThan(1000);
    for (const needle of [
      'adminPreviewFixtures',
      'previewGet',
      'ReadOnlyPreviewError',
      'preview-admin@example.org',
      'cat-ptsd-info',
      '\u05EA\u05D5\u05DB\u05DF \u05DC\u05D3\u05D5\u05D2\u05DE\u05D4', // "sample content"
    ]) {
      expect(bundle.includes(needle), `production bundle contains "${needle}"`).toBe(false);
    }
    // ...while the real session handling is still there.
    expect(bundle).toContain('ptsd_admin_token');
  });
});

describe('admin preview: read-only', () => {
  it('serves sample data for reads', async () => {
    const categories = await adminApi('GET', '/categories');
    expect(categories.map((c) => c.slug)).toContain('ptsd-info');
  });

  it('filters articles by type and category, as the real API does', async () => {
    const faqs = await adminApi('GET', '/admin/articles?type=faq&langId=he&categoryId=cat-rights');
    expect(faqs.length).toBeGreaterThan(0);
    expect(faqs.every((a) => a.type === 'faq')).toBe(true);
  });

  it('refuses every kind of write', async () => {
    for (const method of ['POST', 'PATCH', 'PUT', 'DELETE']) {
      await expect(adminApi(method, '/admin/articles', {})).rejects.toBeInstanceOf(ReadOnlyPreviewError);
    }
  });

  it('fails loudly on a path with no fixture rather than rendering a blank panel', async () => {
    await expect(adminApi('GET', '/admin/unknown-thing')).rejects.toThrow(/no sample data/);
  });

  it('hands back a copy, so a panel mutating its data cannot corrupt the fixtures', async () => {
    const first = await adminApi('GET', '/categories');
    first[0].name = 'mutated';
    const second = await adminApi('GET', '/categories');
    expect(second[0].name).not.toBe('mutated');
  });
});

describe('admin preview: the panel itself', () => {
  let errorSpy;
  beforeEach(() => {
    localStorage.setItem('natal_lang', 'he');
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => { errorSpy.mockRestore(); cleanup(); localStorage.clear(); });

  it('renders without a session and shows real sample content', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    render(
      <QueryClientProvider client={client}>
        <LanguageProvider>
          <ValidationProvider>
            <MemoryRouter>
              <Admin />
            </MemoryRouter>
          </ValidationProvider>
        </LanguageProvider>
      </QueryClientProvider>
    );
    // Sign-in is never reached: no token exists in this test.
    expect(sessionStorage.getItem('ptsd_admin_token')).toBeNull();
    await waitFor(
      () => expect(screen.getByText('מהי הפרעת דחק פוסט-טראומטית?')).toBeInTheDocument(),
      { timeout: 4000 }
    );
  });
});
