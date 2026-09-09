import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '@/lib/LanguageContext';
import { ValidationProvider } from '@/contexts/ValidationContext';
import { loadTreatment } from '@/api/adminSource';
import Admin from '@/pages/Admin';

// Treatment steps 3 and 4 on the live site carry a `methods[]` array - the
// individual therapies (PE, CBT, EMDR, ...), each with its own title,
// description, "how to start" rich text and links. That is the bulk of the
// treatment page's text, and it was an opaque passthrough in adminSource with
// no panel UI, so an admin could not edit it. These tests pin it as editable.

function renderAdmin() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
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
}

describe('admin: treatment methods', () => {
  let errorSpy;
  beforeEach(() => {
    localStorage.setItem('natal_lang', 'he');
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => { errorSpy.mockRestore(); cleanup(); localStorage.clear(); });

  it('loadTreatment always exposes methods as an array, with rich how-to-start as HTML', async () => {
    const steps = await loadTreatment();
    expect(steps.length).toBeGreaterThan(0);
    // Never undefined - the panel binds an editor to it on every step.
    expect(steps.every(s => Array.isArray(s.methods))).toBe(true);

    const withMethods = steps.find(s => s.methods.length > 0);
    expect(withMethods, 'fixtures must cover a step that has methods').toBeTruthy();
    const m = withMethods.methods[0];
    expect(m).toHaveProperty('title_he');
    expect(m).toHaveProperty('description_he');
    expect(m).toHaveProperty('how_to_start_he');
    expect(Array.isArray(m.links)).toBe(true);
    // Rich text arrives as HTML for react-quill, like every other rich field.
    expect(m.how_to_start_he).toMatch(/<[a-z]/i);
  });

  it('renders an editor for every method field when a step is edited', async () => {
    renderAdmin();

    fireEvent.click(await screen.findByText('שלבי טיפול', {}, { timeout: 4000 }));

    const steps = await loadTreatment();
    const withMethods = steps.find(s => s.methods.length > 0);
    await waitFor(
      () => expect(screen.getByText(withMethods.title_he)).toBeInTheDocument(),
      { timeout: 4000 }
    );

    const card = screen.getByText(withMethods.title_he).closest('.group');
    fireEvent.click(within(card).getByTitle('עריכה'));

    // The methods editor is present, seeded with the step's real methods.
    expect(screen.getByText('שיטות טיפול')).toBeInTheDocument();
    for (const m of withMethods.methods) {
      expect(screen.getByDisplayValue(m.title_he)).toBeInTheDocument();
      expect(screen.getByDisplayValue(m.description_he)).toBeInTheDocument();
    }
    // A method's links are editable too.
    const firstWithLink = withMethods.methods.find(m => m.links.length > 0);
    expect(screen.getByDisplayValue(firstWithLink.links[0].url)).toBeInTheDocument();
    // ...and a method can be added.
    expect(screen.getByText('הוספת שיטת טיפול')).toBeInTheDocument();
  });
});
