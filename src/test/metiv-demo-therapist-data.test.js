import { describe, it, expect } from 'vitest';
import * as data from '@/pages/metiv-demos/shared/therapist/index.js';
import { ROUTES } from '@/pages/metiv-demos/shared/routes.js';

const BANNED = ['מוכח', 'מבוסס ראיות', 'אפקטיבי', 'PTSD-IL', 'PTSD.IL'];
const DASHES = new RegExp('[\\u2013\\u2014]');

/** Collect every string reachable from a value, with its path. */
function collectStrings(value, path, out) {
  if (typeof value === 'string') out.push([path, value]);
  else if (Array.isArray(value)) value.forEach((v, i) => collectStrings(v, `${path}[${i}]`, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) collectStrings(v, `${path}.${k}`, out);
  }
  return out;
}

const allStrings = Object.entries(data)
  .filter(([, v]) => typeof v !== 'function')
  .flatMap(([name, v]) => collectStrings(v, name, []));

function expectUnique(list, key) {
  const values = list.map((x) => x[key]);
  const dupes = values.filter((v, i) => values.indexOf(v) !== i);
  expect(dupes).toEqual([]);
}

describe('metiv demo therapist data', () => {
  it('exports non-empty collections', () => {
    for (const name of ['COURSES', 'ORGANIZATION_PROGRAMS', 'ACTIVE_STUDIES', 'BOOKS', 'PAPERS', 'ARTICLES', 'EVENTS', 'TEAM', 'METIV_SERVICES']) {
      expect(Array.isArray(data[name]) && data[name].length > 0, name).toBe(true);
    }
  });

  it('has unique slugs per collection', () => {
    expectUnique(data.COURSES, 'slug');
    expectUnique(data.ORGANIZATION_PROGRAMS, 'slug');
    expectUnique(data.ACTIVE_STUDIES, 'slug');
    expectUnique(data.ARTICLES, 'slug');
    expectUnique(data.EVENTS, 'slug');
    expectUnique(data.METIV_SERVICES, 'slug');
    expectUnique(data.PAPERS, 'title');
    expectUnique(data.BOOKS, 'title');
    for (const c of data.COURSES) {
      if (c.units) expectUnique(c.units, 'slug');
      if (c.formats) expectUnique(c.formats, 'key');
    }
  });

  it('uses latin kebab-case slugs', () => {
    const slugs = [data.COURSES, data.ORGANIZATION_PROGRAMS, data.ACTIVE_STUDIES, data.ARTICLES, data.EVENTS]
      .flat()
      .map((x) => x.slug);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('courses have the required fields', () => {
    const categories = ['adults', 'children-family', 'organizations'];
    for (const c of data.COURSES) {
      for (const f of ['slug', 'title', 'summary', 'category', 'description', 'sourceUrl']) {
        expect(typeof c[f] === 'string' && c[f].length > 0, `${c.slug}.${f}`).toBe(true);
      }
      expect(categories).toContain(c.category);
      expect(Array.isArray(c.tags)).toBe(true);
      expect(typeof c.isPast).toBe('boolean');
      if (c.registration) expect(['open', 'closed', 'unknown']).toContain(c.registration.status);
    }
  });

  it('sourceUrl is present where applicable', () => {
    for (const list of [data.COURSES, data.ORGANIZATION_PROGRAMS, data.ACTIVE_STUDIES, data.ARTICLES, data.EVENTS, data.BOOKS, data.PAPERS, data.METIV_SERVICES]) {
      for (const item of list) expect(item.sourceUrl, item.slug || item.title).toMatch(/^https:\/\//);
    }
  });

  it('events and articles have required fields', () => {
    const types = ['כנס', 'סדנה', 'מחזור קורס', 'חדשות'];
    for (const e of data.EVENTS) {
      expect(types).toContain(e.type);
      expect(e.title && e.date && e.summary).toBeTruthy();
      expect(typeof e.isPast).toBe('boolean');
    }
    for (const a of data.ARTICLES) {
      expect(a.body.length).toBeGreaterThan(1000);
      expect(a.authors.length).toBeGreaterThan(0);
    }
  });

  it('every hub and nav route exists in ROUTES', () => {
    const routes = Object.values(ROUTES);
    for (const s of data.THERAPIST_HUB.sections) expect(routes, s.key).toContain(s.route);
    for (const n of data.NAV) expect(routes, n.key).toContain(n.route);
  });

  it('service cards link to anchors on the where-to-get-help page', () => {
    for (const s of data.METIV_SERVICES) {
      expect(s.anchor).toBe(s.slug);
      expect(s.href).toBe(`${ROUTES.whereToGetHelp}#${s.anchor}`);
    }
  });

  it('course relations point at existing slugs', () => {
    const slugs = new Set(data.COURSES.map((c) => c.slug));
    for (const c of data.COURSES) for (const r of c.relatedSlugs || []) expect(slugs.has(r), `${c.slug} -> ${r}`).toBe(true);
    for (const p of data.ORGANIZATION_PROGRAMS) if (p.relatedCourseSlug) expect(slugs.has(p.relatedCourseSlug)).toBe(true);
    for (const e of data.EVENTS) if (e.courseSlug) expect(slugs.has(e.courseSlug)).toBe(true);
  });

  it('contains no en-dash or em-dash characters', () => {
    const hits = allStrings.filter(([, s]) => DASHES.test(s)).map(([p]) => p);
    expect(hits).toEqual([]);
  });

  it('contains no efficacy wording or old brand names', () => {
    const hits = allStrings.flatMap(([p, s]) => BANNED.filter((w) => s.includes(w)).map((w) => `${p}: ${w}`));
    expect(hits).toEqual([]);
  });

  it('donate copy is marked as placeholder', () => {
    expect(data.DONATE.intro).toContain('[טקסט זמני]');
    for (const w of data.DONATE.ways) expect(w.description).toContain('[טקסט זמני]');
  });
});
