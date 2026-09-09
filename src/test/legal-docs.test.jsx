import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '@/lib/LanguageContext';
import { ValidationProvider } from '@/contexts/ValidationContext';
import { loadLegalDocs, LEGAL_DOC_SLUGS } from '@/api/adminSource';
import PrivacyPolicy, { PRIVACY_CONTENT } from '@/pages/PrivacyPolicy';
import TermsOfUse, { TERMS_CONTENT } from '@/pages/TermsOfUse';
import Admin from '@/pages/Admin';

// The legal pages ship their own Markdown and always render it - the API is an
// override layer, never the only copy, so the policy stays on screen when the
// content API is down. /admin can replace it, but only for `admin`, and
// clearing the editor reverts to the shipped text.

function withProviders(ui) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return (
    <QueryClientProvider client={client}>
      <LanguageProvider>
        <ValidationProvider>
          <MemoryRouter>{ui}</MemoryRouter>
        </ValidationProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

describe('legal documents', () => {
  let errorSpy;
  beforeEach(() => {
    localStorage.setItem('natal_lang', 'he');
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => { errorSpy.mockRestore(); cleanup(); localStorage.clear(); });

  it('ships Hebrew and English text for both documents', () => {
    for (const content of [PRIVACY_CONTENT, TERMS_CONTENT]) {
      expect(content.he.length).toBeGreaterThan(500);
      expect(content.en.length).toBeGreaterThan(500);
    }
    expect(LEGAL_DOC_SLUGS).toEqual(['privacy-policy', 'terms-of-use']);
  });

  it('renders the shipped policy even with no API behind it', async () => {
    render(withProviders(<PrivacyPolicy />));
    // First heading of the shipped Hebrew policy.
    await waitFor(() => expect(screen.getByText('1. מי אנחנו')).toBeInTheDocument());
  });

  it('renders the shipped terms too', async () => {
    render(withProviders(<TermsOfUse />));
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
    expect(document.body.textContent.length).toBeGreaterThan(1000);
  });

  it('loadLegalDocs keys overrides by slug and leaves untouched documents out', async () => {
    const docs = await loadLegalDocs({ lang: 'he' });
    expect(docs['privacy-policy']).toBeTruthy();
    expect(docs['privacy-policy'].body).toContain('תוכן לדוגמה');
    expect(docs['privacy-policy'].updated).toBe('1 בינואר 2026');
    // Terms were never overridden - no row, so the page keeps its shipped text.
    expect(docs['terms-of-use']).toBeUndefined();
    expect(await loadLegalDocs({ lang: 'en' })).toEqual({});
  });

  it('gives the admin panel a Markdown editor seeded from the live text', async () => {
    render(withProviders(<Admin />));

    fireEvent.click(await screen.findByText('מסמכים משפטיים', {}, { timeout: 4000 }));

    // The overridden document shows what is stored...
    await waitFor(() =>
      expect(screen.getByDisplayValue(/תוכן לדוגמה עבור התצוגה המקדימה/)).toBeInTheDocument()
    );
    expect(screen.getByDisplayValue('1 בינואר 2026')).toBeInTheDocument();
    // ...and the untouched one is seeded with the text the site ships, not a
    // blank box, so an admin edits from the real baseline.
    const bodies = [...document.querySelectorAll('textarea')].map(el => el.value);
    expect(bodies.some(v => v.trim() === TERMS_CONTENT.he.trim())).toBe(true);
  });
});
