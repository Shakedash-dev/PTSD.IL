import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, cleanup, within } from '@testing-library/react';
import qaSeed from '../../scripts/metiv-seed/chatbot-qa/he.json';
import { renderAdmin } from './renderAdmin';

// /metiv-site-demo-v3/admin in the read-only dev preview: the Hebrew seed as
// sample data, and the fake /translate so the translation flow shows locally.

describe('metiv admin preview', () => {
  let errorSpy;
  beforeEach(() => {
    localStorage.setItem('natal_lang', 'he');
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => { errorSpy.mockRestore(); cleanup(); localStorage.clear(); });

  it('opens on the seed and shows fake translations in the review dialog', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    renderAdmin({ variant: 'metiv' });
    expect(screen.getByText('מטיב')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'עריכת תוכן' }));
    fireEvent.click(screen.getByRole('button', { name: 'מטפלים' }));
    fireEvent.click(within(screen.getByRole('navigation', { name: 'הסעיפים של מטפלים' })).getByRole('button', { name: 'קורסים והכשרות' }));
    const course = await screen.findByText('הכשרה לטיפול CBT בטראומה', {}, { timeout: 4000 });
    fireEvent.click(within(course.closest('.relative')).getByTitle('עריכה'));
    fireEvent.change(screen.getByDisplayValue('הכשרה לטיפול CBT בטראומה'), { target: { value: 'הכשרת CBT בטראומה' } });
    fireEvent.click(screen.getByRole('button', { name: 'אישור' }));

    fireEvent.click(screen.getByRole('button', { name: /סקירה ושמירה/ }));
    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByText('[en] הכשרת CBT בטראומה', {}, { timeout: 4000 })).toBeInTheDocument();
    expect(within(dialog).getByText('תרגום דורש בדיקה')).toBeInTheDocument();
    // Nothing went over the network.
    expect(fetchSpy.mock.calls.filter(([url]) => String(url).includes('/translate'))).toEqual([]);
    fetchSpy.mockRestore();
  });

  it('shows the 35 chatbot Q&A seed rows in both variants', async () => {
    for (const variant of /** @type {const} */ (['ptsd', 'metiv'])) {
      renderAdmin({ variant });
      fireEvent.click(screen.getByRole('button', { name: 'עריכת תוכן' }));
      if (variant === 'metiv') fireEvent.click(screen.getByRole('button', { name: 'מטופלים' }));
      fireEvent.click(screen.getByRole('button', { name: 'צ׳אטבוט: שאלות ותשובות מוכנות' }));
      expect(await screen.findByText('35 פריטים', {}, { timeout: 4000 })).toBeInTheDocument();
      expect(screen.getByText(qaSeed[0].question)).toBeInTheDocument();
      cleanup();
    }
  });
});
