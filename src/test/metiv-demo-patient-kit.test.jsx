import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DemoChromeProvider } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import {
  PATIENT_PAGES,
  PATIENT_HUB,
  PATIENT_NAV,
  SANCTUARY_ROUTES,
} from '@/pages/metiv-demos/shared/patient';
import { tx } from '@/pages/metiv-demos/shared/patient/copy';

const BASE = '/metiv-site-demo-v9';
const EXERCISE_SCREENS = ['calmingBreathing', 'calmingGrounding', 'calmingMuscle'];

function renderPage(Page, path = '/') {
  return render(
    <MemoryRouter initialEntries={[`${BASE}${path}`]}>
      <DemoChromeProvider base={BASE} version="v9">
        <Page />
      </DemoChromeProvider>
    </MemoryRouter>
  );
}

describe('metiv demo patient kit', () => {
  let errorSpy;
  let fetchSpy;

  beforeEach(() => {
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

  for (const [key, Page] of Object.entries(PATIENT_PAGES)) {
    it(`${key} renders cleanly, stays inside the version and never fetches`, () => {
      expect(ROUTES[key], `${key} is a ROUTES key`).toBeTruthy();
      const { container } = renderPage(Page, ROUTES[key]);
      expect(container.firstChild).not.toBeNull();
      // The three exercise screens have no page header in the originals either.
      if (!EXERCISE_SCREENS.includes(key)) expect(container.querySelector('h1')).not.toBeNull();
      assertClean(container);
    });
  }

  it('WhereToGetHelp exposes the 5 service anchors and the consultation anchor', () => {
    const { container } = renderPage(PATIENT_PAGES.whereToGetHelp, ROUTES.whereToGetHelp);
    for (const id of ['adults-clinic', 'kids-clinic', 'migdalor', 'release-journey', 'free-treatments', 'consultation']) {
      expect(container.querySelector(`#${id}`), `#${id}`).not.toBeNull();
    }
    expect(container.textContent).toContain('02-6449666');
  });

  it('questionnaire scores, shows the result, the consultation link and the crisis lines', () => {
    const { container } = renderPage(PATIENT_PAGES.questionnaire, ROUTES.questionnaire);
    const chips = [...container.querySelectorAll('button[aria-pressed]')];
    expect(chips.length).toBe(100);
    // Highest option on every question -> above the cutoff.
    chips.forEach((chip, i) => { if (i % 5 === 4) fireEvent.click(chip); });
    fireEvent.click(screen.getByRole('button', { name: tx('calculate') }));
    expect(container.textContent).toContain(tx('result_high_title'));
    expect(container.textContent).toContain(tx('questionnaire_anonymous_note'));
    const hrefs = [...container.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
    expect(hrefs).toContain(`${BASE}/patient/where-to-get-help#consultation`);
    expect(hrefs).toContain('tel:1201');
    expect(hrefs).toContain('https://api.whatsapp.com/send?phone=9720528451201');
    assertClean(container);
  });

  it('additions render on the extended pages', () => {
    const checks = [
      ['community', '#veterans'],
      ['children', '#parent-child-groups'],
      ['secondCircleTools', '#reservist-families'],
      ['sources', '#metiv-books'],
      ['selfHelp', '#video-lectures'],
    ];
    for (const [key, selector] of checks) {
      const { container, unmount } = renderPage(PATIENT_PAGES[key], ROUTES[key]);
      expect(container.querySelector(selector), `${key} ${selector}`).not.toBeNull();
      unmount();
    }
    const { container } = renderPage(PATIENT_PAGES.treatment, ROUTES.treatment);
    const hrefs = [...container.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
    expect(hrefs).toContain(`${BASE}/patient/where-to-get-help`);
  });

  it('exports hub, nav and sanctuary data that point at real routes', () => {
    const routes = new Set(Object.values(ROUTES));
    const stripHash = (r) => r.split('#')[0];
    expect(PATIENT_HUB.paths).toHaveLength(3);
    for (const link of [...PATIENT_HUB.paths, ...PATIENT_HUB.quickLinks, ...PATIENT_HUB.additions]) {
      expect(routes.has(stripHash(link.route)), link.route).toBe(true);
    }
    expect(PATIENT_HUB.additions).toHaveLength(8);
    for (const item of PATIENT_NAV) {
      expect(routes.has(item.route)).toBe(true);
      for (const child of item.children ?? []) expect(routes.has(child.route)).toBe(true);
    }
    expect(SANCTUARY_ROUTES.every((k) => k in PATIENT_PAGES)).toBe(true);
    expect(JSON.stringify({ PATIENT_HUB, PATIENT_NAV })).not.toMatch(/PTSD[.-]IL/i);
  });
});
