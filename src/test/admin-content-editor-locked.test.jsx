import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ContentEditor from '@/components/admin/ContentEditor';

// A non-Hebrew tab edits text only: switches, numbers and dates come from the
// Hebrew row (a Hebrew save copies them to every language).
describe('ContentEditor in a non-Hebrew tab', () => {
  const value = { title: 'Course', isPast: false, startDateISO: '2026-10-14', summary: 'Text' };

  it('keeps text editable and shows non-text fields read-only', () => {
    const { container } = render(<ContentEditor value={value} onChange={() => {}} dir="ltr" structureLocked />);
    expect(container.querySelector('input[type="checkbox"]')?.hasAttribute('disabled') ?? true).toBe(true);
    expect(container.querySelector('input[type="date"]')).toBeNull();
    expect(screen.getAllByText(/נקבע בלשונית העברית/).length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue('Text')).toBeTruthy();
  });

  it('leaves everything editable in the Hebrew tab', () => {
    const { container } = render(<ContentEditor value={value} onChange={() => {}} dir="rtl" structureLocked={false} />);
    expect(screen.queryByText(/נקבע בלשונית העברית/)).toBeNull();
    const box = container.querySelector('input[type="checkbox"]');
    if (box) expect(box.hasAttribute('disabled')).toBe(false);
  });
});
