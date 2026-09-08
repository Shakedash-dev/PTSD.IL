import { describe, it, expect, vi } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import Disclosure from '@/components/patterns/Disclosure';
import ChoiceChip from '@/components/patterns/ChoiceChip';
import PageHeader from '@/components/patterns/PageHeader';
import SectionBlock from '@/components/patterns/SectionBlock';

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

describe('PageHeader', () => {
  it('renders the title as the page h1', () => {
    render(<PageHeader title="כותרת" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('כותרת');
  });

  it('renders eyebrow, subtitle and actions when given', () => {
    render(
      <PageHeader title="כותרת" eyebrow="מסע" subtitle="תיאור" actions={<span>פעולה</span>} />
    );
    expect(screen.getByText('מסע')).toBeInTheDocument();
    expect(screen.getByText('תיאור')).toBeInTheDocument();
    expect(screen.getByText('פעולה')).toBeInTheDocument();
  });

  it('marks a background image decorative so screen readers skip it', () => {
    const { container } = render(<PageHeader title="כותרת" image="/hero.jpg" />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('aria-hidden', 'true');
    expect(img).toHaveAttribute('alt', '');
  });

  it('keeps each size on its own type scale', () => {
    const { container: a } = render(<PageHeader title="כותרת" size="default" />);
    expect(a.querySelector('h1').className).toContain('text-3xl');
    cleanup();
    const { container: b } = render(<PageHeader title="כותרת" size="hero" />);
    expect(b.querySelector('h1').className).toContain('text-6xl');
  });

  it('inverts text on the dark tone', () => {
    const { container } = render(<PageHeader title="כותרת" tone="dark" />);
    expect(container.firstChild.className).toContain('text-sanctuary-foreground');
  });
});

describe('SectionBlock', () => {
  it('renders children inside a section landmark', () => {
    const { container } = render(<SectionBlock>תוכן</SectionBlock>);
    expect(container.querySelector('section')).toHaveTextContent('תוכן');
  });

  it('applies the variant background and the maxWidth container', () => {
    const { container } = render(<SectionBlock variant="muted" maxWidth="wide">תוכן</SectionBlock>);
    expect(container.querySelector('section').className).toContain('bg-muted');
    expect(container.querySelector('section > div').className).toContain('max-w-5xl');
  });

  it('takes padding as a pass-through, since vertical rhythm is per composition', () => {
    const { container } = render(<SectionBlock padding="py-6">תוכן</SectionBlock>);
    expect(container.querySelector('section').className).toContain('py-6');
  });
});
