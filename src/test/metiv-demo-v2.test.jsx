import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { COURSES, ARTICLES } from '@/pages/metiv-demos/shared/therapist';
import Site from '@/pages/metiv-demos/v2/Site';

const BASE = '/metiv-site-demo-v2';
const EXERCISE_SCREENS = ['calmingBreathing', 'calmingGrounding', 'calmingMuscle'];

/** Every ROUTES path with real slugs substituted. */
function allPaths() {
  const out = [];
  for (const [key, path] of Object.entries(ROUTES)) {
    if (key === 'course') COURSES.forEach((c) => out.push([`course:${c.slug}`, `/therapist/courses/${c.slug}`]));
    else if (key === 'article') ARTICLES.forEach((a) => out.push([`article:${a.slug}`, `/therapist/articles/${a.slug}`]));
    else out.push([key, path]);
  }
  return out;
}

function renderAt(path) {
  const url = path === '/' ? BASE : `${BASE}${path}`;
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path={`${BASE}/*`} element={<Site />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('metiv demo v2 "Two Doors"', () => {
  let errorSpy;
  let fetchSpy;

  beforeAll(() => {
    // jsdom lacks these browser APIs.
    if (!('IntersectionObserver' in window)) {
      vi.stubGlobal(
        'IntersectionObserver',
        class {
          observe() {}
          unobserve() {}
          disconnect() {}
          takeRecords() {
            return [];
          }
        }
      );
    }
    if (!window.matchMedia) {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query) => ({ matches: false, media: query, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false }),
      });
    }
    if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
  });

  beforeEach(() => {
    window.scrollTo = vi.fn();
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
    errorSpy.mockRestore();
    vi.restoreAllMocks();
  });

  function assertClean(container) {
    expect(errorSpy).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(document.body.textContent).not.toMatch(/PTSD[.-]IL/i);
    const hrefs = [...container.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
    const escaping = hrefs.filter((h) => h.startsWith('/') && !h.startsWith(BASE));
    expect(escaping, `links leaving the version: ${escaping.join(', ')}`).toEqual([]);
    expect(container.querySelector('[dir="rtl"]')).not.toBeNull();
  }

  for (const [name, path] of allPaths()) {
    it(`${name} (${path}) renders cleanly`, () => {
      const { container } = renderAt(path);
      // The three exercise screens have no page header in the originals either.
      if (!EXERCISE_SCREENS.includes(name)) expect(container.querySelector('h1'), 'page has an h1').not.toBeNull();
      assertClean(container);
      // The crisis line is reachable from every page.
      expect(container.querySelector('a[href="tel:1201"]')).not.toBeNull();
    });
  }

  it('landing links to both areas, more than once', () => {
    const { container } = renderAt('/');
    const hrefs = [...container.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
    expect(hrefs.filter((h) => h === `${BASE}/patient`).length).toBeGreaterThanOrEqual(2);
    expect(hrefs.filter((h) => h === `${BASE}/therapist`).length).toBeGreaterThanOrEqual(2);
  });

  it('the area switcher marks the current area', () => {
    const { container } = renderAt('/therapist/research');
    const current = container.querySelector('nav[aria-label="בחירת אזור"] [aria-current="true"]');
    expect(current?.getAttribute('href')).toBe(`${BASE}/therapist`);
  });

  it('the patient area shows a quick exit, the professional area does not', () => {
    const patient = renderAt('/patient/rights');
    expect(patient.getAllByText('יציאה מהירה').length).toBeGreaterThan(0);
    cleanup();
    const pro = renderAt('/therapist/courses');
    expect(pro.queryAllByText('יציאה מהירה').length).toBe(0);
  });

  it('calming exercises use the distraction-free shell', () => {
    const { container } = renderAt('/patient/calming/breathing');
    expect(container.querySelector('nav[aria-label="בחירת אזור"]')).toBeNull();
    expect(container.querySelector('footer')).toBeNull();
  });

  it('unknown paths fall back to the version home', () => {
    const { container } = renderAt('/no-such-page');
    expect(container.querySelector('#door-patient')).not.toBeNull();
  });
});
