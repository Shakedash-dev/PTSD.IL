import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '@/lib/LanguageContext';
import { ChatProvider } from '@/lib/ChatContext';
import { ValidationProvider } from '@/contexts/ValidationContext';
import { UserTypeProvider } from '@/contexts/UserTypeContext';
import Site from '@/pages/metiv-demos/v3/Site';
import { isExternalLink, metivQueryOptions, withIsoDates } from '@/pages/metiv-demos/v3/content/MetivContent';
import { EDITABLE_I18N } from '@/lib/editableI18nKeys';
import copySupervision from '../../scripts/metiv-seed/copy/supervision.json';
import copyOrganizations from '../../scripts/metiv-seed/copy/organizations.json';
import copyChildrenFamily from '../../scripts/metiv-seed/copy/childrenFamily.json';
import { metivSeedData } from '@/test/fixtures/metivSeed';
import { t } from '@/lib/i18n';

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
import { ALL_ROUTES, V3_ROUTES } from '@/pages/metiv-demos/v3/meta';
// Expected values come from the seed the pages render from.
const { ARTICLES, COURSES } = metivSeedData();

const BASE = '/metiv-site-demo-v3';
const SLUGS = { course: 'cbt-trauma', article: ARTICLES[0].slug };

/** @param {string} path */
function renderAt(path) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity, staleTime: Infinity } } });
  // The Metiv content comes from the API; prefill it with the seed the DB holds.
  client.setQueryData(metivQueryOptions('he').queryKey, metivSeedData());
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

const routeCases = Object.entries(ALL_ROUTES).map(([key, path]) => [
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

  it('chat button on every shell: Metiv pages, therapist area and patient area, once each', () => {
    for (const path of ['/', '/donate', '/privacy-policy', '/about/team', '/therapist', '/therapist/courses/cbt-trauma', '/patient', '/patient/rights']) {
      const { unmount } = renderAt(path);
      expect(screen.getAllByRole('button', { name: t('he', 'chat_tooltip') }), path).toHaveLength(1);
      unmount();
    }
  });

  it('shell follows the language: English renders left-to-right with the English chrome copy', () => {
    // LanguageProvider reads the saved language from localStorage ('natal_lang').
    localStorage.setItem('natal_lang', 'en');
    try {
      const data = metivSeedData();
      data.copy = { ...data.copy, chrome: Object.fromEntries(Object.entries(data.copy.chrome).map(([k, v]) => [k, `EN:${v}`])) };
      const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity, staleTime: Infinity } } });
      client.setQueryData(metivQueryOptions('en').queryKey, data);
      const { container } = render(
        <QueryClientProvider client={client}>
          <LanguageProvider>
            <ChatProvider>
              <ValidationProvider>
                <MemoryRouter initialEntries={[`${BASE}/contact`]}>
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
      expect(container.querySelector('div[dir="ltr"][lang="en"]'), 'shell is ltr, lang=en').not.toBeNull();
      expect(container.querySelector('div[dir="rtl"][lang]'), 'no rtl shell').toBeNull();
      expect(screen.getAllByRole('button', { name: /EN:/ }).length).toBeGreaterThan(0);
    } finally {
      localStorage.setItem('natal_lang', 'he');
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

  it('"על מטיב" is a tab of the professional area, opening with the departments and leading to its sub-pages', () => {
    const { container } = renderAt('/about');
    const tabs = container.querySelector('nav[aria-label="על מטיב"]');
    const tabHrefs = [...(tabs?.querySelectorAll('a[href]') || [])].map((a) => a.getAttribute('href'));
    expect(tabHrefs).toEqual([`${BASE}/about`, ...['aboutHistory', 'aboutTeam', 'aboutPartners', 'aboutCollaborations'].map((k) => `${BASE}${V3_ROUTES[k]}`)]);
    const areaNav = container.querySelector('nav[aria-label^="ניווט ב"]');
    expect(areaNav?.querySelector(`a[href="${BASE}/about"]`)?.getAttribute('aria-current')).toBe('page');
    expect(areaNav?.querySelector(`a[href="${BASE}${V3_ROUTES.releaseJourneyPro}"]`)).not.toBeNull();
    for (const id of ['adults-clinic', 'kids-clinic', 'migdalor', 'release-journey', 'training-unit', 'research-unit']) {
      expect(container.querySelector(`#dept-${id}`), id).not.toBeNull();
    }
    assertClean(container);
  });

  it('מסע שחרור has a page in each area, with different content, and the existing mentions lead to it', () => {
    const patient = renderAt(V3_ROUTES.releaseJourney);
    const patientText = patient.container.querySelector('main')?.textContent || '';
    expect(patient.container.querySelector('h1')?.textContent).toBe('מסע שחרור');
    expect(patient.container.querySelector(`header a[href="${BASE}${V3_ROUTES.releaseJourney}"]`), 'tab in the patient navbar').not.toBeNull();
    expect(patientText).toMatch(/3,500/);
    expect(patient.container.querySelector('a[href="https://peaceofmind.org.il/"]')).not.toBeNull();
    patient.unmount();

    const pro = renderAt(V3_ROUTES.releaseJourneyPro);
    const proText = pro.container.querySelector('main')?.textContent || '';
    expect(proText).toMatch(/צוות מסע שחרור/);
    expect(proText).not.toBe(patientText);
    expect(patientText).not.toMatch(/צוות מסע שחרור/);
    pro.unmount();

    for (const path of [ROUTES.whereToGetHelp, ROUTES.community]) {
      const { container, unmount } = renderAt(path);
      expect(container.querySelector(`main a[href="${BASE}${V3_ROUTES.releaseJourney}"]`), path).not.toBeNull();
      unmount();
    }
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

describe('metiv demo v3: content decided by the data', () => {
  let fetchSpy;
  beforeAll(() => {
    class IO {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() { return []; }
    }
    vi.stubGlobal('IntersectionObserver', IO);
    window.scrollTo = vi.fn();
  });
  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise(() => {}));
  });
  afterEach(() => {
    cleanup();
    fetchSpy.mockRestore();
  });

  const seed = metivSeedData();
  /** @param {HTMLElement} container */
  const h3s = (container) => [...container.querySelectorAll('main h3')].map((h) => h.textContent?.trim());

  it('release-journey study, papers and people come from their flags', () => {
    expect(seed.RELEASE_JOURNEY_STUDY?.slug).toBe('release-journey-study');
    expect(seed.RELEASE_JOURNEY_PAPERS).toHaveLength(3);
    expect(seed.RELEASE_JOURNEY_PAPERS.every((p) => /peace of mind|battlefield to home/i.test(p.title))).toBe(true);
    expect(seed.RELEASE_JOURNEY_TEAM).toHaveLength(9);
    expect(seed.RELEASE_JOURNEY_RESEARCHERS).toHaveLength(2);
    expect(seed.RELEASE_JOURNEY_TEAM.every((m) => !m.releaseJourneyResearcher)).toBe(true);
  });

  it('ISO dates give the visible date in the page language and the past/upcoming state', () => {
    const d = {
      EVENTS: [
        { dateISO: '1999-03-05', date: 'old text', isPast: false },
        { dateISO: '2999-12-18', date: 'old text', isPast: true },
        { date: 'ימי שני', isPast: true },
      ],
      ARTICLES: [{ dateISO: '2025-12-18', date: 'x' }],
      COURSES: [{ startDateISO: '2999-01-09', startDate: 'x', formats: [{ startDateISO: '1999-01-01', startDate: 'x' }], units: [{ dateISO: '2025-02-06', date: 'x' }] }],
    };
    const he = withIsoDates(d, 'he');
    expect(he.EVENTS[0]).toMatchObject({ date: '5 במרץ 1999', isPast: true });
    expect(he.EVENTS[1]).toMatchObject({ date: '18 בדצמבר 2999', isPast: false });
    expect(he.EVENTS[2]).toMatchObject({ date: 'ימי שני', isPast: true });
    expect(he.ARTICLES[0].date).toBe('18 בדצמבר 2025');
    expect(he.ARTICLES[0].isPast).toBeUndefined();
    expect(he.COURSES[0]).toMatchObject({ startDate: '9 בינואר 2999', isPast: false });
    expect(he.COURSES[0].formats[0].isPast).toBe(true);
    expect(he.COURSES[0].units[0].date).toBe('6 בפברואר 2025');
    expect(withIsoDates(d, 'en').ARTICLES[0].date).toBe('December 18, 2025');
    expect(withIsoDates(d, 'ar').ARTICLES[0].date).toMatch(/18/);
  });

  it('an end date makes a localized range and decides past/upcoming; dateText overrides the text', () => {
    const d = {
      EVENTS: [
        { dateISO: '2023-02-28', endDateISO: '2023-03-01', date: 'x' },
        { dateISO: '1999-06-28', endDateISO: '2999-07-16', date: 'x', isPast: true },
        { dateISO: '2025-02-06', endDateISO: '2025-02-13', dateText: '6.2.2025 ו-13.2.2025', date: 'x' },
        { dateISO: '2025-02-06', dateText: '  ', date: 'x' },
      ],
      COURSES: [{ units: [{ dateISO: '2025-02-06', endDateISO: '2025-02-13', dateText: 'שני ימים', date: 'x' }] }],
    };
    const he = withIsoDates(d, 'he');
    expect(he.EVENTS[0].date).toBe('28 פברואר - 1 מרץ 2023');
    expect(he.EVENTS[0].isPast).toBe(true);
    expect(he.EVENTS[1].isPast).toBe(false);
    expect(he.EVENTS[2].date).toBe('6.2.2025 ו-13.2.2025');
    expect(he.EVENTS[3].date).toBe('6 בפברואר 2025');
    expect(he.COURSES[0].units[0].date).toBe('שני ימים');
    const en = withIsoDates(d, 'en');
    expect(en.EVENTS[0].date).toBe('February 28 - March 1, 2023');
    for (const lang of ['he', 'ar', 'en', 'ru', 'fr']) expect(withIsoDates(d, lang).EVENTS[0].date).not.toMatch(/[\u2013\u2014]/);
  });

  it('events with several dates show the same information as before', () => {
    const events = Object.fromEntries(seed.EVENTS.map((e) => [e.slug, e]));
    expect(events['summer-course-2026'].date).toBe('28.6-9.7.2026, הכשרה קלינית 12-16.7.2026');
    expect(events['summer-course-2026'].isPast).toBe(true);
    expect(events['kaleidoscope-dissociation'].date).toBe('6.2.2025 ו-13.2.2025');
    expect(events['kids-trauma-basics-2024-09'].date).toBe('11, 12, 15 בספטמבר 2024');
    expect(events['trauma-informed-care-conference-2023'].date).toBe('28 פברואר - 1 מרץ 2023');
    const unit = seed.COURSES.find((c) => c.slug === 'kaleidoscope').units[0];
    expect(unit.date).toBe('6.2.2025 ו-13.2.2025');
    const { container } = renderAt(ROUTES.events);
    expect(container.textContent).toContain('28.6-9.7.2026, הכשרה קלינית 12-16.7.2026');
    expect(container.textContent).toContain('28 פברואר - 1 מרץ 2023');
  });

  it('an event link is external exactly when it is an absolute http(s) URL', () => {
    expect(isExternalLink('https://metiv.org/x')).toBe(true);
    expect(isExternalLink('http://metiv.org')).toBe(true);
    expect(isExternalLink('/therapist/courses/roadmap')).toBe(false);
    expect(isExternalLink(undefined)).toBe(false);
  });

  it('supervision kinds, organisation needs and model ages filter by the item fields', () => {
    const sup = renderAt(ROUTES.supervision);
    fireEvent.click(screen.getByRole('button', { name: copySupervision.kindKids }));
    const kidsTitles = seed.SUPERVISION.options.filter((o) => o.kinds.includes('kids')).map((o) => o.title);
    expect(kidsTitles.length).toBeGreaterThan(0);
    for (const o of seed.SUPERVISION.options) expect(h3s(sup.container).includes(o.title), o.key).toBe(kidsTitles.includes(o.title));
    sup.unmount();

    const org = renderAt(ROUTES.organizations);
    fireEvent.click(screen.getByRole('button', { name: copyOrganizations.needWorkshop }));
    for (const p of seed.ORGANIZATION_PROGRAMS) expect(h3s(org.container).includes(p.title), p.slug).toBe(p.needs.includes('workshop'));
    org.unmount();

    const kids = renderAt(ROUTES.childrenFamily);
    fireEvent.click(screen.getByRole('button', { name: copyChildrenFamily.ageEarly }));
    for (const m of seed.CHILDREN_FAMILY_INTRO.models) expect(h3s(kids.container).includes(m.title), m.key).toBe(m.ageGroups.includes('early'));
    kids.unmount();
  });

  it('a therapist-hub goal lists the courses that name it, in course order', () => {
    const { container } = renderAt('/therapist?need=team');
    const expected = seed.COURSES.filter((c) => c.therapistNeeds.includes('team'));
    expect(expected.map((c) => c.slug)).toEqual(['org-therapist-training', 'trauma-informed-org-day']);
    const text = container.querySelector('main')?.textContent || '';
    for (const c of expected) expect(text).toContain(c.title);
  });

  it('shared texts come from i18n: the landing PTSD paragraph and the footer disclaimer', () => {
    const { container } = renderAt('/');
    const text = container.textContent || '';
    expect(text).toContain(t('he', 'about_ptsd_short'));
    expect(text).toContain(t('he', 'footer_disclaimer'));
    expect(seed.PATIENT_HUB.hero).toBeUndefined();
    expect(seed.PATIENT_HUB.disclaimer).toBeUndefined();
  });

  it('every editable i18n key exists in all five languages, on a known admin page', () => {
    for (const [page, keys] of Object.entries(EDITABLE_I18N)) {
      expect(keys.length, page).toBeGreaterThan(0);
      for (const key of keys) for (const lang of ['he', 'ar', 'en', 'ru', 'fr']) expect(t(lang, key), `${page}: ${lang}.${key}`).not.toBe(key);
    }
    for (const key of ['error_loading', 'questionnaire_sections_intro']) for (const lang of ['he', 'ar', 'en', 'ru', 'fr']) expect(t(lang, key)).not.toBe(key);
    expect(t('he', 'chatbot_description')).toContain('תשובות');
  });
});
