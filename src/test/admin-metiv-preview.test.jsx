import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, cleanup, within } from '@testing-library/react';
import qaSeed from '../../scripts/metiv-seed/chatbot-qa/he.json';
import { renderAdmin } from './renderAdmin';

// /metiv-site-demo-v3/admin in the read-only preview, as the test run sees it:
// the Hebrew seed as fixtures, and the stand-in /translate.

describe('metiv admin preview', () => {
  let errorSpy;
  beforeEach(() => {
    localStorage.setItem('natal_lang', 'he');
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => { errorSpy.mockRestore(); cleanup(); localStorage.clear(); });

  it('opens on the seed and summarises the fake translations in the review dialog', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    renderAdmin({ variant: 'metiv' });
    expect(screen.getByText('מטיב')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'עריכת תוכן' }));
    const nav = await screen.findByRole('navigation', { name: 'עמודי האתר' });
    fireEvent.click(within(nav).getByRole('button', { name: 'אזור אנשי הטיפול והמקצוע' }));
    fireEvent.click(within(nav).getByRole('button', { name: 'קורסים והכשרות' }));
    const course = await screen.findByText('הכשרה לטיפול CBT בטראומה', { selector: 'section p' }, { timeout: 4000 });
    fireEvent.click(within(course.closest('.relative')).getByTitle('עריכה'));
    const input = screen.getByDisplayValue('הכשרה לטיפול CBT בטראומה');
    fireEvent.change(input, { target: { value: 'הכשרת CBT בטראומה' } });
    fireEvent.click(within(input.closest('section')).getByRole('button', { name: 'אישור' }));

    fireEvent.click(screen.getByRole('button', { name: /סקירה ושמירה/ }));
    const dialog = await screen.findByRole('dialog');
    // The stand-in translates every language (French comes back flagged); the
    // review names them under the Hebrew change instead of listing them.
    expect(await within(dialog).findByText('יתורגם אוטומטית ל: ערבית, אנגלית, רוסית, צרפתית', {}, { timeout: 4000 })).toBeInTheDocument();
    expect(await within(dialog).findByText('כדאי לבדוק אחרי השמירה את התרגום לצרפתית - הבודק האוטומטי סימן אותו.', {}, { timeout: 4000 })).toBeInTheDocument();
    const items = within(dialog).getAllByRole('listitem');
    expect(items).toHaveLength(1);
    expect(within(items[0]).getAllByText('הכשרת CBT בטראומה').length).toBeGreaterThan(0);
    expect(within(dialog).queryByText('[en] הכשרת CBT בטראומה')).toBeNull();
    expect(within(dialog).queryByText('תרגום דורש בדיקה')).toBeNull();
    // Nothing went over the network.
    expect(fetchSpy.mock.calls.filter(([url]) => String(url).includes('/translate'))).toEqual([]);
    fetchSpy.mockRestore();
  });

  it('shows the 35 chatbot Q&A seed rows in both variants', async () => {
    for (const variant of /** @type {const} */ (['ptsd', 'metiv'])) {
      renderAdmin({ variant });
      fireEvent.click(screen.getByRole('button', { name: 'עריכת תוכן' }));
      if (variant === 'metiv') fireEvent.click(await screen.findByRole('button', { name: 'כלים' }));
      fireEvent.click(screen.getByRole('button', { name: 'צ׳אטבוט: שאלות ותשובות מוכנות' }));
      expect(await screen.findByText('35 פריטים', {}, { timeout: 4000 })).toBeInTheDocument();
      expect(screen.getByText(qaSeed[0].question)).toBeInTheDocument();
      cleanup();
    }
  });
});
