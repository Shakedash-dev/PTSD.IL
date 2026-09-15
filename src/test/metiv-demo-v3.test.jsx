import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '@/lib/LanguageContext';
import { ChatProvider } from '@/lib/ChatContext';
import { ValidationProvider } from '@/contexts/ValidationContext';
import { UserTypeProvider } from '@/contexts/UserTypeContext';
import Site from '@/pages/metiv-demos/v3/Site';

// The V3 patient area renders the real PTSD-IL pages, which read content through
// these hooks. Stub them the way test/pages-render.test.jsx does.
vi.mock('@/api/hooks', () => {
  const empty = { data: [], isLoading: false, error: null };
  const one = { data: null, isLoading: false, error: null };
  return {
    useSources: () => empty,
    useCommunities: () => empty,
    useSelfHelpTools: () => empty,
    useTreatmentSteps: () => empty,
    useChildrenContent: () => empty,
    useRightsFaqs: () => empty,
    usePTSDInfoFaqs: () => empty,
    useSecondCircleTools: () => empty,
    useQuestionnaire: () => one,
    useLegalDocs: () => one,
  };
});
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { ARTICLES, COURSES } from '@/pages/metiv-demos/shared/therapist';

const BASE = '/metiv-site-demo-v3';
const SLUGS = { course: 'cbt-trauma', article: ARTICLES[0].slug };

/** @param {string} path */
function renderAt(path) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <LanguageProvider>
        <ChatProvider>
          <ValidationProvider>
            <MemoryRouter initialEntries={[`${BASE}${path === '/' ? '' : path}`]}>
              <UserTypeProvider>
                <Routes>
                  <Route path={`${BASE}/*`} element={<Site />} />
                </Routes>
              </UserTypeProvider>
            </MemoryRouter>
          </ValidationProvider>
        </ChatProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

const routeCases = Object.entries(ROUTES).map(([key, path]) => [
  key,
  path.replace(':slug', key === 'course' ? SLUGS.course : SLUGS.article),
]);

describe('metiv demo v3 (Guided Journey)', () => {
  let errorSpy;
  let fetchSpy;

  beforeAll(() => {
    class IO {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() { return []; }
    }
    vi.stubGlobal('IntersectionObserver', IO);
    window.IntersectionObserver = /** @type {any} */ (IO);
    if (!window.matchMedia) {
      window.matchMedia = /** @type {any} */ ((q) => ({ matches: false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, onchange: null, dispatchEvent: () => false }));
    }
    if (!window.ResizeObserver) window.ResizeObserver = /** @type {any} */ (IO);
    Element.prototype.scrollIntoView = () => {};
  });

  beforeEach(() => {
    window.scrollTo = /** @type {any} */ (vi.fn());
    errorSpy = vi.spyOn(console, 'error');
    // The patient area is the real PTSD-IL site, so the app providers read site
    // copy over the network like the live app does. Answer with an empty list.
    const emptyResponse = () => Promise.resolve(new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } }));
    if (typeof globalThis.fetch === 'function') {
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(emptyResponse);
    } else {
      fetchSpy = vi.fn(emptyResponse);
      globalThis.fetch = fetchSpy;
    }
  });

  afterEach(() => {
    cleanup();
    errorSpy.mockRestore();
    fetchSpy.mockRestore?.();
  });

  /** @param {HTMLElement} container */
  function assertClean(container) {
    expect(errorSpy).not.toHaveBeenCalled();
    expect(document.body.textContent).not.toMatch(/PTSD[.-]IL/i);
    const hrefs = [...container.querySelectorAll('a[href]')].map((a) => a.getAttribute('href') || '');
    const escaping = hrefs.filter((h) => h.startsWith('/') && !h.startsWith(BASE));
    expect(escaping, `links leaving the version: ${escaping.join(', ')}`).toEqual([]);
    expect(hrefs, 'crisis line on every page').toContain('tel:1201');
  }

  for (const [key, path] of routeCases) {
    it(`${key} (${path}) renders cleanly inside the version`, () => {
      const { container } = renderAt(path);
      // Metiv and therapist shells pin dir on a wrapper; the patient area is the
      // PTSD-IL layout, where LanguageProvider sets dir on the document.
      const rtl = container.querySelector('[dir="rtl"]') || document.documentElement.getAttribute('dir') === 'rtl';
      expect(rtl, `${key} renders right-to-left`).toBeTruthy();
      if (!['calmingBreathing', 'calmingGrounding', 'calmingMuscle'].includes(key)) {
        expect(container.querySelector('h1'), `${key} has an h1`).not.toBeNull();
      }
      assertClean(container);
    });
  }

  it('every course slug renders its detail page', () => {
    for (const course of COURSES) {
      const { container, unmount } = renderAt(`/therapist/courses/${course.slug}`);
      expect(container.querySelector('h1')?.textContent).toContain(course.title);
      assertClean(container);
      unmount();
    }
  });

  it('landing sends visitors to both areas, repeatedly', () => {
    const { container } = renderAt('/');
    const hrefs = [...container.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
    expect(hrefs.filter((h) => h === `${BASE}/patient`).length).toBeGreaterThanOrEqual(2);
    expect(hrefs.filter((h) => h === `${BASE}/therapist`).length).toBeGreaterThanOrEqual(2);
    expect(hrefs).toContain(`${BASE}/patient/first-circle`);
    expect(hrefs).toContain(`${BASE}/therapist/organizations`);
    // Owner feedback: a short about-PTSD section right below the doors.
    expect(container.querySelector('#landing-ptsd')).not.toBeNull();
    expect(hrefs).toContain(`${BASE}/patient/ptsd-info`);
    // Owner feedback: the doors are the focus; no sitemap, no help band, no question headline.
    expect(container.querySelector('#sitemap')).toBeNull();
    expect(container.querySelector('h1')?.textContent).toBe('מטיב - המרכז הישראלי לטיפול בפסיכוטראומה');
    expect(document.body.textContent).not.toMatch(/מה מביא אותך לכאן|הצג הכל|צריך\/ה לדבר עם מישהו עכשיו\?/);
  });

  it('chrome: no crisis strip, area switcher, "back to start" or "both areas" lines; help-now stays', () => {
    for (const path of ['/', '/therapist', '/contact']) {
      const { container, unmount } = renderAt(path);
      const text = container.textContent || '';
      expect(text).not.toMatch(/חזרה להתחלה|גם וגם|עדיין מחפשים/);
      expect(container.querySelector('nav[aria-label="שני האזורים באתר"]')).toBeNull();
      expect(screen.getAllByRole('button', { name: /עזרה עכשיו/ }).length).toBeGreaterThan(0);
      unmount();
    }
  });

  it('patient area is the PTSD-IL site: its navbar and footer with the Metiv logo, none of the V3 chrome', () => {
    for (const path of ['/patient/rights', '/patient/treatment', '/patient/children']) {
      const { container, unmount } = renderAt(path);
      const text = container.textContent || '';
      expect(container.querySelector('header img[alt^="מטיב"]'), `${path}: Metiv logo in the navbar`).not.toBeNull();
      expect(text).not.toMatch(/יציאה מהירה|בקצרה|כל הנושאים|את\/ה כאן/);
      // Owner decision: the patient header carries the site's help-now button,
      // and the footer is the V3 site footer, with a link to the sources page.
      expect(screen.getAllByRole('button', { name: /עזרה עכשיו/ }).length).toBeGreaterThan(0);
      expect(container.querySelector('footer a[href="tel:1201"]')).not.toBeNull();
      expect(container.querySelector(`footer a[href="${BASE}/patient/sources"]`)).not.toBeNull();
      unmount();
    }
  });

  it('patient hub mirrors the PTSD-IL home page, with the Metiv logo and the new Metiv pages', () => {
    const { container } = renderAt('/patient');
    const main = container.querySelector('main');
    expect(main?.querySelector('img[alt="מטיב"]'), 'Metiv logo in the hero').not.toBeNull();
    const hrefs = [...(main?.querySelectorAll('a[href]') || [])].map((a) => a.getAttribute('href'));
    for (const route of ['firstCircle', 'secondCircle', 'questionnaire', 'ptsdInfo', 'whereToGetHelp', 'freeTreatment']) {
      expect(hrefs, route).toContain(`${BASE}${ROUTES[route]}`);
    }
    expect(main?.querySelector('#paths')).not.toBeNull();
    assertClean(container);
  });

  it('course finder narrows the list and "show all" restores it', () => {
    const { container } = renderAt('/therapist/courses');
    const cards = () => container.querySelectorAll(`a[href^="${BASE}/therapist/courses/"]`).length;
    const all = cards();
    expect(all).toBe(COURSES.length);
    fireEvent.click(screen.getByRole('button', { name: /^ילדים ומשפחות/ }));
    const kids = cards();
    expect(kids).toBeLessThan(all);
    expect(kids).toBe(COURSES.filter((c) => c.category === 'children-family').length);
    fireEvent.click(screen.getAllByRole('button', { name: 'הצג את כל הקורסים' })[0]);
    expect(cards()).toBe(all);
    assertClean(container);
  });
});
