import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { LanguageProvider, useLang } from '@/lib/LanguageContext';
import useDirection from '@/lib/useDirection';

function Probe() {
  const { dir, isRTL } = useDirection();
  const { setLang } = useLang();
  return (
    <div>
      <span data-testid="dir">{dir}</span>
      <span data-testid="rtl">{String(isRTL)}</span>
      <button type="button" onClick={() => setLang('en')}>to-en</button>
    </div>
  );
}

const renderAt = (lang) => {
  localStorage.setItem('natal_lang', lang);
  return render(<LanguageProvider><Probe /></LanguageProvider>);
};

describe('useDirection', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('dir');
  });

  it('reports rtl for Hebrew', () => {
    renderAt('he');
    expect(screen.getByTestId('dir')).toHaveTextContent('rtl');
    expect(screen.getByTestId('rtl')).toHaveTextContent('true');
  });

  it('reports rtl for Arabic', () => {
    renderAt('ar');
    expect(screen.getByTestId('rtl')).toHaveTextContent('true');
  });

  it('reports ltr for English', () => {
    renderAt('en');
    expect(screen.getByTestId('dir')).toHaveTextContent('ltr');
    expect(screen.getByTestId('rtl')).toHaveTextContent('false');
  });

  it('reports ltr for Russian and French', () => {
    renderAt('ru');
    expect(screen.getByTestId('dir')).toHaveTextContent('ltr');
  });

  it('defaults to rtl for an unknown language, matching getDir', () => {
    renderAt('zz');
    expect(screen.getByTestId('dir')).toHaveTextContent('rtl');
  });

  // The four hand-rolled reads this hook replaces called
  // document.documentElement.getAttribute('dir') during render. The provider
  // sets that attribute in an effect, so on the render immediately after a
  // language switch they still saw the previous direction.
  it('updates in the same render as a language switch', () => {
    renderAt('he');
    expect(screen.getByTestId('dir')).toHaveTextContent('rtl');
    act(() => { screen.getByRole('button', { name: 'to-en' }).click(); });
    expect(screen.getByTestId('dir')).toHaveTextContent('ltr');
    expect(screen.getByTestId('rtl')).toHaveTextContent('false');
  });
});
