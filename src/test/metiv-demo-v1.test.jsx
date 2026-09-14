import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Site from '@/pages/metiv-demos/v1/Site';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { ARTICLES, COURSES } from '@/pages/metiv-demos/shared/therapist';

const BASE = '/metiv-site-demo-v1';

/** @type {Record<string, string[]>} */
const SLUGS = {
  course: COURSES.map((c) => c.slug),
  article: ARTICLES.map((a) => a.slug),
};

/** Every ROUTES path, with each :slug replaced by every real slug. */
const PATHS = Object.entries(ROUTES).flatMap(([key, path]) =>
  path.includes(':slug')
    ? SLUGS[key].map((slug) => [`${key} (${slug})`, path.replace(':slug', slug)])
    : [[key, path]]
);

function renderAt(path) {
  const url = path === '/' ? BASE : `${BASE}${path}`;
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/metiv-site-demo-v1/*" element={<Site />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('metiv demo v1', () => {
  let errorSpy;
  let fetchSpy;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error');
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubGlobal('scrollTo', vi.fn());
  });

  afterEach(() => {
    cleanup();
    errorSpy.mockRestore();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function assertClean(container) {
    expect(errorSpy).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(container.textContent).not.toMatch(/PTSD[.-]IL/i);
    const hrefs = [...container.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
    const escaping = hrefs.filter((h) => h.startsWith('/') && !h.startsWith(BASE));
    expect(escaping, `links leaving the version: ${escaping.join(', ')}`).toEqual([]);
  }

  for (const [name, path] of PATHS) {
    it(`${name} renders at ${path}, stays inside v1 and never fetches`, () => {
      const { container } = renderAt(path);
      expect(container.querySelector('h1, h2'), 'page has a heading').not.toBeNull();
      // The crisis line is reachable from every page.
      expect(container.querySelector('a[href="tel:1201"]'), 'crisis line link').not.toBeNull();
      assertClean(container);
    });
  }

  it('landing links strongly to both areas', () => {
    const { container } = renderAt('/');
    const hrefs = [...container.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
    expect(hrefs.filter((h) => h === `${BASE}/patient`).length).toBeGreaterThanOrEqual(2);
    expect(hrefs.filter((h) => h === `${BASE}/therapist`).length).toBeGreaterThanOrEqual(2);
  });

  it('patient pages carry the quick exit button, other areas do not', () => {
    renderAt('/patient/rights');
    expect(screen.getAllByText('יציאה מהירה').length).toBeGreaterThan(0);
    cleanup();
    renderAt('/therapist/courses');
    expect(screen.queryByText('יציאה מהירה')).toBeNull();
  });

  it('the calming exercises use the minimal shell with quick exit', () => {
    const { container } = renderAt('/patient/calming/breathing');
    expect(container.querySelector('footer')).toBeNull();
    expect(screen.getByText('יציאה מהירה')).toBeTruthy();
  });

  it('course catalog filters narrow the list and can be reset', () => {
    renderAt('/therapist/courses');
    const count = () => screen.getByText(/מתוך \d+ קורסים והכשרות/).textContent;
    const all = count();
    fireEvent.click(screen.getByRole('button', { name: /ילדים ומשפחה/ }));
    expect(count()).not.toEqual(all);
    fireEvent.click(screen.getAllByRole('button', { name: 'איפוס הסינון' })[0]);
    expect(count()).toEqual(all);
  });

  it('the menu opens as a dialog and closes with Escape', () => {
    renderAt('/about');
    fireEvent.click(screen.getByRole('button', { name: 'תפריט' }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('unknown paths return to the version home', () => {
    const { container } = renderAt('/no-such-page');
    expect(container.textContent).toContain('למתמודדים ולמשפחות');
    expect(container.querySelector(`a[href="${BASE}/therapist"]`)).not.toBeNull();
  });

  it('marks the demo as noindex', () => {
    renderAt('/');
    expect(document.head.querySelector('meta[name="robots"][content*="noindex"]')).not.toBeNull();
  });
});
