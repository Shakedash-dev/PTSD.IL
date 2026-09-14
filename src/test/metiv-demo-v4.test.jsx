import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { COURSES, ARTICLES } from '@/pages/metiv-demos/shared/therapist';
import Site from '@/pages/metiv-demos/v4/Site';

const BASE = '/metiv-site-demo-v4';

/** Every ROUTES path with real slugs substituted. */
const PATHS = Object.entries(ROUTES).map(([key, p]) => [
  key,
  p.replace(':slug', key === 'course' ? 'cbt-trauma' : ARTICLES[0].slug),
]);

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[`${BASE}${path === '/' ? '' : path}`]}>
      <Routes>
        <Route path={`${BASE}/*`} element={<Site />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeAll(() => {
  if (!window.matchMedia) {
    window.matchMedia = (query) => ({
      matches: false, media: query, onchange: null,
      addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
    });
  }
  if (!window.IntersectionObserver) {
    window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
  }
  if (!window.ResizeObserver) {
    window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  }
});

describe('metiv demo v4', () => {
  let errorSpy;
  let fetchSpy;

  beforeEach(() => {
    window.scrollTo = vi.fn();
    Element.prototype.scrollIntoView = vi.fn();
    errorSpy = vi.spyOn(console, 'error');
    if (typeof globalThis.fetch === 'function') {
      fetchSpy = vi.spyOn(globalThis, 'fetch');
    } else {
      fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);
    }
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function assertClean(container) {
    expect(errorSpy).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(document.body.textContent).not.toMatch(/PTSD[.-]IL/i);
    const hrefs = [...container.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
    const escaping = hrefs.filter((h) => h.startsWith('/') && !h.startsWith(BASE));
    expect(escaping, `links leaving the version: ${escaping.join(', ')}`).toEqual([]);
  }

  for (const [key, path] of PATHS) {
    it(`${key} (${path}) renders cleanly inside the version`, () => {
      const { container } = renderAt(path);
      expect(container.querySelector('h1, h2'), 'has a heading').not.toBeNull();
      // Crisis line reachable on every page.
      expect(container.querySelector('a[href="tel:1201"]'), 'crisis line link').not.toBeNull();
      assertClean(container);
    });
  }

  it('landing links prominently to both areas', () => {
    const { container } = renderAt('/');
    const hrefs = [...container.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
    expect(hrefs).toContain(`${BASE}/patient`);
    expect(hrefs).toContain(`${BASE}/therapist`);
    expect(screen.getByRole('link', { name: /כניסה לאזור המטופלים והמשפחות/ })).toHaveAttribute('href', `${BASE}/patient`);
    expect(screen.getByRole('link', { name: /כניסה לאזור אנשי המקצוע/ })).toHaveAttribute('href', `${BASE}/therapist`);
  });

  it('patient pages show the quick exit, therapist pages do not', () => {
    renderAt(ROUTES.rights);
    expect(screen.getAllByRole('button', { name: /יציאה מהירה/ }).length).toBeGreaterThan(0);
    cleanup();
    renderAt(ROUTES.courses);
    expect(screen.queryByRole('button', { name: /יציאה מהירה/ })).toBeNull();
  });

  it('inner pages carry breadcrumbs', () => {
    renderAt(ROUTES.publications);
    const nav = screen.getByRole('navigation', { name: 'מיקום באתר' });
    expect(nav.textContent).toContain('לאנשי מקצוע');
    expect(nav.textContent).toContain('פרסומים');
  });

  it('mega menu opens on click and closes on Escape', () => {
    renderAt('/');
    const trigger = screen.getByRole('button', { name: /לאנשי מקצוע/ });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('course catalog filters by status and shows an empty state', () => {
    const { container } = renderAt(ROUTES.courses);
    expect(container.textContent).toContain(`${COURSES.length} תוצאות`);
    const openBox = screen.getAllByRole('checkbox', { name: 'ההרשמה פתוחה' })[0];
    fireEvent.click(openBox);
    const openCount = COURSES.filter((c) => c.registration?.status === 'open').length;
    expect(container.textContent).toContain(`${openCount} תוצאות`);
    fireEvent.change(screen.getAllByRole('searchbox', { name: 'חיפוש קורסים' })[0], { target: { value: 'zzzz-no-match' } });
    expect(container.textContent).toContain('לא נמצאו תכניות');
  });

  it('unknown paths redirect to the version home', () => {
    renderAt('/no-such-page');
    expect(screen.getByRole('link', { name: /כניסה לאזור המטופלים והמשפחות/ })).toBeInTheDocument();
  });
});
