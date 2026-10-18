import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '@/lib/LanguageContext';
import { ValidationProvider } from '@/contexts/ValidationContext';
import PrivacyPolicy, { PRIVACY_CONTENT } from '@/pages/PrivacyPolicy';
import TermsOfUse, { TERMS_CONTENT } from '@/pages/TermsOfUse';

// The legal pages ship their own Markdown and always render it - the API is an
// override layer, never the only copy, so the policy stays on screen when the
// content API is down. /admin does not edit them.

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
});
