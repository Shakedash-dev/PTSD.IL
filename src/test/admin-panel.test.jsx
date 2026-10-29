import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, fireEvent, cleanup, within } from '@testing-library/react';
import { t } from '@/lib/i18n';
import { fieldsDiff } from '@/components/admin/PendingChanges';
import { renderAdmin } from './renderAdmin';

// The /admin frame and the staged-edit flow, against the read-only preview's
// sample data (no network, every write refused).

const FAQ = 'מהי הפרעת דחק פוסט-טראומטית?';

async function openContent() {
  fireEvent.click(screen.getByRole('button', { name: 'עריכת תוכן' }));
  await waitFor(() => expect(screen.getByText(FAQ)).toBeInTheDocument(), { timeout: 4000 });
}

async function editFaqQuestion(newText) {
  const card = screen.getByText(FAQ).closest('.group');
  fireEvent.click(within(card).getByTitle('עריכה'));
  fireEvent.change(screen.getByDisplayValue(FAQ), { target: { value: newText } });
  fireEvent.click(screen.getByRole('button', { name: 'אישור' }));
  // The card closes once the (async) confirm handler returns.
  await screen.findByText(newText);
}

// A Hebrew edit is translated in the background (the preview's fake
// translator); the final save button only appears once every language is in.
function findFinalSave(dialog) {
  return within(dialog).findByRole('button', { name: /שמירה סופית/ }, { timeout: 4000 });
}

describe('admin: frame and home page', () => {
  let errorSpy;
  beforeEach(() => {
    localStorage.setItem('natal_lang', 'he');
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => { errorSpy.mockRestore(); cleanup(); localStorage.clear(); });

  it('has a clean header: the wordmark and logout, nothing from the public site', () => {
    renderAdmin();
    const header = document.querySelector('header');
    expect(within(header).getByText('PTSD')).toBeInTheDocument();
    expect(within(header).getByRole('button', { name: 'התנתקות' })).toBeInTheDocument();
    expect(within(header).getAllByRole('button')).toHaveLength(1);
    expect(screen.queryByLabelText(t('he', 'lang_switcher_label'))).toBeNull();
    expect(document.querySelector('footer')).toBeNull();
  });

  it('opens on the guide, which covers no-revert, how to edit and permissions', () => {
    renderAdmin();
    expect(screen.getByText('הכי חשוב: אין ביטול אחרי שמירה')).toBeInTheDocument();
    expect(screen.getByText('איך עורכים')).toBeInTheDocument();
    expect(screen.getByText('הרשאות: מי יכול לעשות מה')).toBeInTheDocument();
    // The guide is the home page - no content list is rendered yet.
    expect(screen.queryByText(FAQ)).toBeNull();
  });

  it('lists the editable pages under their own heading, without page copy or legal tabs', async () => {
    renderAdmin();
    await openContent();
    expect(screen.getByText('עמודי האתר הניתנים לעריכה')).toBeInTheDocument();
    expect(screen.queryByText('תוכן דפים')).toBeNull();
    expect(screen.queryByText('מסמכים משפטיים')).toBeNull();
  });

  it('picks the content language once, at the top, not per panel', async () => {
    renderAdmin();
    await openContent();
    const tabs = screen.getByRole('group', { name: 'שפת העריכה' });
    expect(within(tabs).getByRole('button', { name: 'עברית' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'שלבי טיפול' }));
    await waitFor(() => expect(screen.getByText('שלב 1 - זיהוי')).toBeInTheDocument(), { timeout: 4000 });
    expect(screen.queryByLabelText('שפה')).toBeNull();
    expect(document.querySelector('select#treatment-lang')).toBeNull();
  });

  it('shows the edit log to masteradmin', async () => {
    renderAdmin();
    fireEvent.click(screen.getByRole('button', { name: 'יומן עריכות' }));
    await waitFor(() => expect(screen.getByText(/שאלות PTSD: מהי הפרעת דחק/)).toBeInTheDocument(), { timeout: 4000 });
    expect(screen.getByText('preview-admin@example.org')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'יומן עריכות' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'עריכת תוכן' })).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('admin: edits are staged, then saved together', () => {
  let errorSpy;
  beforeEach(() => {
    localStorage.setItem('natal_lang', 'he');
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => { errorSpy.mockRestore(); cleanup(); localStorage.clear(); });

  it('"אישור" stages the edit instead of saving it', async () => {
    renderAdmin();
    await openContent();
    expect(screen.queryByRole('button', { name: 'שמירה' })).toBeNull();
    await editFaqQuestion('שאלה ערוכה');

    expect(screen.getByText('שאלה ערוכה')).toBeInTheDocument();
    expect(screen.getByText('נערך · ממתין לשמירה')).toBeInTheDocument();
    expect(screen.getByText('שינוי אחד ממתין לשמירה')).toBeInTheDocument();
  });

  it('the review dialog shows before/after, warns it is final, and needs a confirmation tick', async () => {
    renderAdmin();
    await openContent();
    await editFaqQuestion('שאלה ערוכה');
    fireEvent.click(screen.getByRole('button', { name: /סקירה ושמירה/ }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/השמירה סופית ואין אפשרות לבטל אותה/)).toBeInTheDocument();
    expect(within(dialog).getByText(FAQ)).toBeInTheDocument();
    expect(within(dialog).getAllByText('שאלה ערוכה').length).toBeGreaterThan(0);

    const save = await findFinalSave(dialog);
    expect(save).toBeDisabled();
    fireEvent.click(within(dialog).getByRole('checkbox'));
    expect(save).toBeEnabled();
  });

  it('a staged change can be discarded before saving', async () => {
    renderAdmin();
    await openContent();
    await editFaqQuestion('שאלה ערוכה');
    fireEvent.click(screen.getByRole('button', { name: /ביטול השינוי/ }));

    expect(screen.getByText(FAQ)).toBeInTheDocument();
    expect(screen.queryByText('שאלה ערוכה')).toBeNull();
    expect(screen.queryByText(/ממתין לשמירה/)).toBeNull();
  });

  it('a delete is staged too, not sent on the spot', async () => {
    renderAdmin();
    await openContent();
    const card = screen.getByText(FAQ).closest('.group');
    fireEvent.click(within(card).getByTitle('מחיקה'));
    expect(screen.getByText('יימחק בשמירה')).toBeInTheDocument();
    expect(screen.getByText(FAQ)).toBeInTheDocument();
  });

  it('a failed save keeps the change staged', async () => {
    renderAdmin();
    await openContent();
    await editFaqQuestion('שאלה ערוכה');
    fireEvent.click(screen.getByRole('button', { name: /סקירה ושמירה/ }));
    const dialog = await screen.findByRole('dialog');
    const save = await findFinalSave(dialog);
    fireEvent.click(within(dialog).getByRole('checkbox'));
    fireEvent.click(save);
    // The save runs in the background: the dialog closes at once. The preview
    // refuses every write; the strip says what failed and offers a retry.
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const strip = await screen.findByTestId('save-progress');
    await waitFor(() => expect(within(strip).getByText(/לא נשמרו ונשארו ברשימה/)).toBeInTheDocument());
    expect(within(strip).getByText(/קריאה בלבד/)).toBeInTheDocument();
    expect(within(strip).getByText(/כי השינוי בעברית שהם תלויים בו נכשל/)).toBeInTheDocument();
    expect(within(strip).getByRole('button', { name: /ניסיון חוזר/ })).toBeEnabled();
    expect(screen.getByText('שינוי אחד ממתין לשמירה')).toBeInTheDocument();
  });
});

describe('fieldsDiff', () => {
  const fields = [
    { key: 'q', label: 'שאלה', type: 'text' },
    { key: 'a', label: 'תשובה', type: 'richtext' },
  ];

  it('reports only the fields that changed, as plain text', () => {
    expect(fieldsDiff(fields, { q: 'א', a: '<p>ב</p>' }, { q: 'ג', a: '<p>ב</p>' }))
      .toEqual([{ label: 'שאלה', before: 'א', after: 'ג' }]);
  });

  it('does not count the editor re-wrapping text as an edit', () => {
    expect(fieldsDiff(fields, { q: 'א', a: 'טקסט' }, { q: 'א', a: '<p>טקסט</p>' })).toEqual([]);
  });

  it('flags a formatting-only change rather than hiding it', () => {
    const [d] = fieldsDiff(fields, { a: '<p>טקסט</p>' }, { a: '<p><strong>טקסט</strong></p>' });
    expect(d.label).toBe('תשובה');
    expect(d.after).toContain('שינוי עיצוב בלבד');
  });
});
