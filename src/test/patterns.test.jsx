import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import Disclosure from '@/components/patterns/Disclosure';
import ChoiceChip from '@/components/patterns/ChoiceChip';

const click = (el) => act(() => { el.click(); });

describe('Disclosure', () => {
  it('starts collapsed and hides its panel content', () => {
    render(<Disclosure label="שאלה">תשובה</Disclosure>);
    expect(screen.getByRole('button', { name: /שאלה/ })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('תשובה')).not.toBeInTheDocument();
  });

  it('expands on click and exposes the state to assistive tech', () => {
    render(<Disclosure label="שאלה">תשובה</Disclosure>);
    const trigger = screen.getByRole('button', { name: /שאלה/ });
    click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('תשובה')).toBeInTheDocument();
  });

  it('points aria-controls at the panel it actually controls', () => {
    render(<Disclosure label="שאלה">תשובה</Disclosure>);
    const trigger = screen.getByRole('button', { name: /שאלה/ });
    click(trigger);
    const panelId = trigger.getAttribute('aria-controls');
    expect(panelId).toBeTruthy();
    expect(document.getElementById(panelId)).toHaveTextContent('תשובה');
  });

  it('can be driven as a controlled component', () => {
    const onOpenChange = vi.fn();
    render(<Disclosure label="שאלה" open={false} onOpenChange={onOpenChange}>תשובה</Disclosure>);
    click(screen.getByRole('button', { name: /שאלה/ }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    // Still closed: the parent owns the state and did not change it.
    expect(screen.queryByText('תשובה')).not.toBeInTheDocument();
  });

  it('renders leading content next to the label', () => {
    render(<Disclosure label="שאלה" leading={<span>אייקון</span>}>תשובה</Disclosure>);
    expect(screen.getByText('אייקון')).toBeInTheDocument();
  });

  it('defaults to type=button so it never submits a surrounding form', () => {
    render(<Disclosure label="שאלה">תשובה</Disclosure>);
    expect(screen.getByRole('button', { name: /שאלה/ })).toHaveAttribute('type', 'button');
  });

  it('gives each instance a distinct panel id', () => {
    render(
      <>
        <Disclosure label="ראשון">א</Disclosure>
        <Disclosure label="שני">ב</Disclosure>
      </>
    );
    const [a, b] = screen.getAllByRole('button');
    expect(a.getAttribute('aria-controls')).not.toBe(b.getAttribute('aria-controls'));
  });
});

describe('ChoiceChip', () => {
  it('reports its selected state to assistive tech', () => {
    render(<ChoiceChip selected>הכל</ChoiceChip>);
    expect(screen.getByRole('button', { name: 'הכל' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('reports the unselected state too', () => {
    render(<ChoiceChip>הכל</ChoiceChip>);
    expect(screen.getByRole('button', { name: 'הכל' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onClick when pressed', () => {
    const onClick = vi.fn();
    render(<ChoiceChip onClick={onClick}>הכל</ChoiceChip>);
    click(screen.getByRole('button', { name: 'הכל' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('defaults to type=button so it never submits a surrounding form', () => {
    render(<ChoiceChip>הכל</ChoiceChip>);
    expect(screen.getByRole('button', { name: 'הכל' })).toHaveAttribute('type', 'button');
  });
});
