import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '@/lib/LanguageContext';
import { ValidationProvider } from '@/contexts/ValidationContext';
import {
  translations, COPY_SECTIONS, t, setCopyOverrides, clearCopyOverrides, getCopyOverrides,
} from '@/lib/i18n';
import { loadSiteCopy } from '@/api/adminSource';
import Admin from '@/pages/Admin';

describe('site copy: the catalogue', () => {
  it('covers every shipped Hebrew key exactly once', () => {
    const catalogued = COPY_SECTIONS.flatMap(s => s.keys);
    const shipped = Object.keys(translations.he);

    // No key is silently uneditable...
    expect([...shipped].sort()).toEqual([...catalogued].sort());
    // ...and none is listed under two sections, which would render it twice.
    expect(new Set(catalogued).size).toBe(catalogued.length);
  });

  it('gives every section an id and a Hebrew label', () => {
    for (const s of COPY_SECTIONS) {
      expect(s.id).toMatch(/^[a-z0-9_]+$/);
      expect(s.label.length).toBeGreaterThan(1);
      expect(s.keys.length).toBeGreaterThan(0);
    }
    expect(new Set(COPY_SECTIONS.map(s => s.id)).size).toBe(COPY_SECTIONS.length);
  });
});

describe('site copy: t() override resolution', () => {
  afterEach(() => clearCopyOverrides());

  it('returns the shipped string when nothing is overridden', () => {
    expect(t('he', 'treatment_title')).toBe(translations.he.treatment_title);
    expect(t('en', 'treatment_title')).toBe(translations.en.treatment_title);
  });

  it('prefers an override for the requested language', () => {
    setCopyOverrides('he', { treatment_title: 'כותרת חדשה' });
    expect(t('he', 'treatment_title')).toBe('כותרת חדשה');
  });

  it('does not leak a Hebrew override onto a language that has its own string', () => {
    setCopyOverrides('he', { treatment_title: 'כותרת חדשה' });
    expect(t('en', 'treatment_title')).toBe(translations.en.treatment_title);
  });

  it('falls back through Hebrew for a language with no string of its own', () => {
    // ru has fewer keys than he - pick one it genuinely lacks.
    const heOnly = Object.keys(translations.he).find(k => !(k in translations.ru));
    expect(heOnly, 'expected at least one he-only key').toBeTruthy();
    expect(t('ru', heOnly)).toBe(translations.he[heOnly]);
    setCopyOverrides('he', { [heOnly]: 'נוסח מעודכן' });
    expect(t('ru', heOnly)).toBe('נוסח מעודכן');
  });

  it('unknown keys still come back as the key itself', () => {
    expect(t('he', 'no_such_key_anywhere')).toBe('no_such_key_anywhere');
  });

  it('setCopyOverrides replaces one language without touching the others', () => {
    setCopyOverrides('he', { a: '1' });
    setCopyOverrides('en', { b: '2' });
    expect(getCopyOverrides('he')).toEqual({ a: '1' });
    setCopyOverrides('he', {});
    expect(getCopyOverrides('he')).toEqual({});
    expect(getCopyOverrides('en')).toEqual({ b: '2' });
  });
});

describe('site copy: the admin panel', () => {
  let errorSpy;
  beforeEach(() => {
    localStorage.setItem('natal_lang', 'he');
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => { errorSpy.mockRestore(); cleanup(); localStorage.clear(); clearCopyOverrides(); });

  it('loadSiteCopy keys the stored overrides by i18n key', async () => {
    const map = await loadSiteCopy({ lang: 'he' });
    expect(map.treatment_title).toBeTruthy();
    expect(map.treatment_title.text).toContain('תצוגה מקדימה');
    expect(map.treatment_title.id).toBeTruthy();
    // A language with no rows gets an empty map, not the Hebrew ones.
    expect(await loadSiteCopy({ lang: 'en' })).toEqual({});
  });

  it('lists a section of keys with their current wording, marking the overridden ones', async () => {
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}>
        <LanguageProvider>
          <ValidationProvider>
            <MemoryRouter>
              <Admin />
            </MemoryRouter>
          </ValidationProvider>
        </LanguageProvider>
      </QueryClientProvider>
    );

    fireEvent.click(await screen.findByText('תוכן דפים', {}, { timeout: 4000 }));

    // Defaults to the first section (navigation), so switch to the one that
    // holds an overridden key.
    const sectionSelect = await screen.findByLabelText('אזור באתר');
    fireEvent.change(sectionSelect, { target: { value: 'treatment' } });

    await waitFor(() => expect(screen.getByText('treatment_title')).toBeInTheDocument());
    // The stored override is what the field shows...
    expect(screen.getByDisplayValue('מפת הדרכים לטיפול (תצוגה מקדימה)')).toBeInTheDocument();
    // ...and a key with no override shows the shipped string.
    expect(screen.getByDisplayValue(translations.he.step_label)).toBeInTheDocument();
    // Every key in the section is editable, not just the overridden ones.
    for (const key of COPY_SECTIONS.find(s => s.id === 'treatment').keys) {
      expect(screen.getByText(key)).toBeInTheDocument();
    }
  });
});
