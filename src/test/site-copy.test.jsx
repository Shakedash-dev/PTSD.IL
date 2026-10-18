import { describe, it, expect, afterEach } from 'vitest';
import {
  translations, t, setCopyOverrides, clearCopyOverrides, getCopyOverrides,
} from '@/lib/i18n';

// Site-copy override rows are no longer editable from /admin, but the public
// site still honours any that exist - this pins how t() resolves them.

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
