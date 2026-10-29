import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react';
import routeMetaSeed from '../../scripts/metiv-seed/he/metiv-route-meta.json';
import navSeed from '../../scripts/metiv-seed/he/metiv-nav.json';
import patientNavSeed from '../../scripts/metiv-seed/he/metiv-patient-nav.json';
import coursesSeed from '../../scripts/metiv-seed/he/metiv-courses.json';
import landingCopy from '../../scripts/metiv-seed/copy/landing.json';
import supervisionCopy from '../../scripts/metiv-seed/copy/supervision.json';
import eventsSeed from '../../scripts/metiv-seed/he/metiv-events.json';
import { COPY_CONTENT_KEYS, copyContentKeys } from '@/components/admin/copyContentKeys';
import { NOT_EDITED, SITE_MAP, buildSiteTree, flattenPages } from '@/components/admin/metivSiteMap';
import { fieldRules, hasVisible } from '@/components/admin/metivFieldRules';
import { SITE_COPY_LABELS } from '@/components/admin/siteCopyLabels';
import { EDITABLE_I18N, EDITABLE_I18N_KEYS } from '@/lib/editableI18nKeys';
import { normalize, searchEntries } from '@/components/admin/adminSearch';
import { liveGet, publicPathFor } from '@/api/adminLiveRead';
import { adminApi, ReadOnlyPreviewError } from '@/api/adminClient';
import { inDevTokenSession, inReadOnlyPreview, loginWithToken, logout } from '@/lib/auth';
import { COLLECTIONS, COLLECTION_BY_KEY } from '@/pages/metiv-demos/v3/content/registry';
import { ALL_ROUTES } from '@/pages/metiv-demos/v3/meta';
import { renderAdmin } from './renderAdmin';

// The Metiv admin's structure: the page tree against the site's routes and
// menus, the content-only rules (page copy and collection fields), the search,
// and the dev server's two modes (read-only live data, pasted token).

const COPY_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../scripts/metiv-seed/copy');
const ROUTE_META = routeMetaSeed.rows[0].content;
const pages = flattenPages(buildSiteTree());
const real = pages.filter(p => !p.aliasOf);
const byId = Object.fromEntries(real.map(p => [p.id, p]));
const area = id => SITE_MAP.find(a => a.id === id);

describe('page copy: content keys only', () => {
  it('every listed key exists in the seed copy files', () => {
    for (const [ns, keys] of Object.entries(COPY_CONTENT_KEYS)) {
      const file = path.join(COPY_DIR, `${ns}.json`);
      expect(fs.existsSync(file), ns).toBe(true);
      const copy = JSON.parse(fs.readFileSync(file, 'utf8'));
      for (const k of Object.keys(keys)) expect(typeof copy[k], `${ns}.${k}`).toBe('string');
    }
  });

  it('headings, buttons, field labels and crisis-line labels are not editable', () => {
    const ui = [
      ['landing', 'titleName'], ['landing', 'ptsdTitle'], ['landing', 'serviceCta'], ['patientKit', 'fieldCost'],
      ['patientKit', 'fieldLocation'], ['patientLayout', 'sanctuaryCrisisLine'], ['chrome', 'eranCall'], ['courses', 'title'],
      ['courses', 'shortCount'], ['contact', 'subtitle'], ['research', 'subtitle'],
      // Texts that explain how the page works, and link captions.
      ['chrome', 'helpNowIntro'], ['courses', 'finderIntro'], ['courses', 'shortQuestions'], ['childrenFamily', 'modelsIntro'],
      ['supervision', 'optionsIntro'], ['events', 'shortFilter'], ['publications', 'shortFilter'], ['research', 'shortCards'],
      ['therapistHub', 'questionIntro'], ['about', 'short1'], ['aboutPartners', 'short2'], ['landing', 'moreServicesText'],
      ['patientReleaseJourney', 'modelsIntro'], ['donate', 'placeholderNote'],
    ];
    for (const [ns, k] of ui) expect(copyContentKeys(ns), `${ns}.${k}`).not.toContain(k);
    // Page subtitles (the sentence under the h1) and facts about Metiv are content.
    const content = [
      ['courses', 'subtitle'], ['events', 'subtitle'], ['aboutHistory', 'subtitle'], ['releaseJourneyPro', 'subtitle'],
      ['releaseJourneyPro', 'mod'], ['supervision', 'shortOptions'], ['organizations', 'shortPrograms'],
      ['patientWhereToGetHelp', 'subtitle'], ['patientFreeTreatment', 'subtitle'], ['patientReleaseJourney', 'subtitle'],
    ];
    for (const [ns, k] of content) expect(copyContentKeys(ns), `${ns}.${k}`).toContain(k);
    const rules = fieldRules({ copyKeys: copyContentKeys('landing') });
    expect(rules.visible('intro', 'intro')).toBe(true);
    expect(rules.visible('titleName', 'titleName')).toBe(false);
  });

  it('every page-copy section names a namespace with editable keys, and every such namespace is on a page', () => {
    const used = new Set();
    for (const p of real) for (const s of p.sections) if (s.kind === 'copy') {
      expect(copyContentKeys(s.ns).length, `${p.id}: ${s.ns}`).toBeGreaterThan(0);
      used.add(s.ns);
    }
    expect([...used].sort()).toEqual(Object.keys(COPY_CONTENT_KEYS).sort());
  });
});

// Pages with nothing to edit: the calming exercises are locked.
const HIDDEN = ['calming', 'calmingBreathing', 'calmingGrounding', 'calmingMuscle'];

describe('page tree: mirrors the site', () => {
  it('has a page for every route with something to edit, with the route and the page name of ROUTE_META', () => {
    for (const [key, route] of Object.entries(ALL_ROUTES)) {
      if (key === 'course' || key === 'article') continue;
      const page = pages.find(p => p.id === key);
      if (HIDDEN.includes(key)) { expect(page, key).toBeUndefined(); continue; }
      expect(page, key).toBeTruthy();
      expect(page.route).toBe(route);
      expect(page.label).toBe(ROUTE_META[key].label);
    }
  });

  it('orders the patient area like its menu, with מסע שחרור above "איפה מקבלים טיפול"', () => {
    const menu = patientNavSeed.rows.map(r => r.content.key).flatMap(k => (k === 'whereToGetHelp' ? ['releaseJourney', k] : [k]));
    expect(area('patient').pages.map(p => p.id)).toEqual(menu);
    const tree = buildSiteTree().find(a => a.id === 'patient');
    expect(tree.pages.map(p => p.id)).toEqual(menu.filter(k => !HIDDEN.includes(k)));
    const firstCircle = patientNavSeed.rows.find(r => r.content.key === 'firstCircle').content.children.map(c => c.key);
    expect(byId.firstCircle.children.map(c => c.id)).toEqual(firstCircle);
  });

  it('leaves out pages with nothing to edit, and moves their children up in their place', () => {
    for (const id of HIDDEN) expect(pages.some(p => p.id === id), id).toBe(false);
    for (const p of real) expect(p.sections.some(s => s.kind !== 'link') || p.masterOnly, p.id).toBeTruthy();
    // A parent with nothing of its own: its children take its place, in order.
    const map = [{
      id: 'a', label: 'A', pages: [
        { id: 'first', label: '1', sections: [{ kind: 'qa' }] },
        { id: 'empty', label: 'E', sections: [{ kind: 'link', to: 'first', label: 'x' }], children: [{ id: 'c1', label: 'C1', sections: [{ kind: 'i18n' }] }, { id: 'c2', label: 'C2', sections: [{ kind: 'qa' }] }] },
        { id: 'last', label: 'L', sections: [{ kind: 'link', to: 'empty', label: 'y' }, { kind: 'qa' }] },
      ],
    }];
    const t = buildSiteTree({}, { map, i18n: { c1: ['k'] } });
    expect(t[0].pages.map(p => p.id)).toEqual(['first', 'c1', 'c2', 'last']);
    expect(t[0].pages[1].parentId).toBeUndefined();
    expect(t[0].pages[1].sections).toMatchObject([{ kind: 'i18n', keys: ['k'] }]);
    // A pointer to a page that is left out is dropped.
    expect(t[0].pages[3].sections.map(s => s.kind)).toEqual(['qa']);
    // Without its i18n keys the child has nothing either, and goes too.
    expect(flattenPages(buildSiteTree({}, { map, i18n: {} })).map(p => p.id)).toEqual(['first', 'c2', 'last']);
  });

  it('shows the editable i18n texts on their pages, each with a Hebrew name', () => {
    for (const [pageId, keys] of Object.entries(EDITABLE_I18N)) {
      const page = byId[pageId];
      expect(page, pageId).toBeTruthy();
      expect(page.sections.find(s => s.kind === 'i18n')?.keys, pageId).toEqual(keys);
    }
    for (const k of EDITABLE_I18N_KEYS) expect(SITE_COPY_LABELS[k]?.label, k).toBeTruthy();
    // One text on two pages is one row: the same key on both.
    expect(byId.home.sections.find(s => s.kind === 'i18n').keys).toContain('about_ptsd_short');
    expect(byId.patient.sections.find(s => s.kind === 'i18n').keys).toContain('about_ptsd_short');
  });

  it('orders the professional area like its tabs: "על מטיב" after the home, מסע שחרור last', () => {
    const tabs = navSeed.rows.map(r => r.content.key);
    expect(area('therapist').pages.map(p => p.id)).toEqual([tabs[0], 'about', ...tabs.slice(1), 'releaseJourneyPro']);
    expect(byId.about.children.map(c => c.id)).toEqual(['aboutHistory', 'aboutTeam', 'aboutPartners', 'aboutCollaborations']);
  });

  it('builds a page per course under the courses page', () => {
    const tree = buildSiteTree({ COURSES: coursesSeed.rows.map(r => ({ key: r._key, title: r.content.title })) });
    const courses = flattenPages(tree).find(p => p.id === 'courses');
    expect(courses.children).toHaveLength(coursesSeed.rows.length);
    expect(courses.children[0]).toMatchObject({ id: `course:${coursesSeed.rows[0]._key}`, route: `/therapist/courses/${coursesSeed.rows[0]._key}` });
    expect(courses.children[0].sections[0]).toMatchObject({ kind: 'item', key: 'COURSES', itemKey: coursesSeed.rows[0]._key });
  });

  it('edits every collection somewhere, except navigation and taxonomy, and each part in one place only', () => {
    for (const col of COLLECTIONS) {
      const sections = real.flatMap(p => p.sections.filter(s => s.kind === 'collection' && s.key === col.key));
      if (NOT_EDITED.includes(col.key)) { expect(sections, col.key).toEqual([]); continue; }
      expect(sections.length, col.key).toBeGreaterThan(0);
      if (sections.length > 1) {
        const fields = sections.map(s => s.fields);
        expect(fields.every(Boolean), `${col.key} on several pages needs fields`).toBe(true);
        const flat = fields.flat();
        expect(new Set(flat).size, `${col.key} fields overlap`).toBe(flat.length);
      }
    }
  });

  it('every pointer leads to the page that edits that data', () => {
    for (const p of real) for (const s of p.sections) {
      if (s.kind !== 'link') continue;
      const target = byId[s.to];
      expect(target, `${p.id} -> ${s.to}`).toBeTruthy();
      if (s.key) expect(target.sections.some(t => t.kind === 'collection' && t.key === s.key), `${p.id}: ${s.key} on ${s.to}`).toBe(true);
      if (s.ns) expect(target.sections.some(t => t.kind === 'copy' && t.ns === s.ns)).toBe(true);
    }
  });

  it('holds מסע שחרור on ONE page, shown in both areas', () => {
    const rj = byId.releaseJourney;
    const editable = rj.sections.filter(s => s.kind !== 'link');
    expect(editable.filter(s => s.kind === 'copy').map(s => s.ns)).toEqual(['patientReleaseJourney', 'releaseJourneyPro']);
    expect(editable.filter(s => s.kind === 'collection').map(s => s.key)).toEqual([
      'RELEASE_JOURNEY', 'RELEASE_JOURNEY_STATS', 'RELEASE_JOURNEY_WAITING', 'JOURNEY_MODELS', 'RELEASE_JOURNEY_CONTACTS',
    ]);
    expect(rj.alsoIn).toBe('therapist');
    expect(pages.find(p => p.id === 'releaseJourneyPro').aliasOf).toBe('releaseJourney');
    // No other page edits any of it.
    const rjKeys = new Set(editable.map(s => s.key ?? s.ns));
    for (const p of real) if (p.id !== 'releaseJourney') {
      for (const s of p.sections) if (s.kind !== 'link') expect(rjKeys.has(s.key ?? s.ns), `${p.id}`).toBe(false);
    }
  });
});

describe('collection fields: content, not format', () => {
  it('hides ids, routes, icons, category keys and provenance; keeps phones, links, dates, prices and flags', () => {
    const r = fieldRules({ collection: 'METIV_SERVICES' });
    for (const [pattern, key] of [['id', 'id'], ['icon', 'icon'], ['source', 'source'], ['contacts[].kind', 'kind'], ['route', 'route']]) {
      expect(r.visible(pattern, key), pattern).toBe(false);
    }
    for (const [pattern, key] of [['title', 'title'], ['cost', 'cost'], ['contacts[].value', 'value'], ['contacts[].href', 'href']]) {
      expect(r.visible(pattern, key), pattern).toBe(true);
    }
    const c = fieldRules({ collection: 'COURSES', he: { COURSE_CATEGORIES: [{ key: 'adults', label: 'מבוגרים' }] } });
    expect(c.visible('slug', 'slug')).toBe(false);
    expect(c.visible('sourceUrl', 'sourceUrl')).toBe(false);
    expect(c.visible('relatedSlugs', 'relatedSlugs')).toBe(false);
    expect(c.visible('isPast', 'isPast')).toBe(true);
    expect(c.visible('startDateISO', 'startDateISO')).toBe(true);
    expect(c.visible('price', 'price')).toBe(true);
    expect(c.visible('registration.url', 'url')).toBe(true);
    // A category key is a choice from the categories, not a free id.
    expect(c.visible('category', 'category')).toBe(true);
    expect(c.options('category')).toEqual([{ value: 'adults', label: 'מבוגרים' }]);
    // ...set in Hebrew for every language.
    expect(fieldRules({ collection: 'COURSES', translation: true }).visible('category', 'category')).toBe(false);
    // A page heading inside a singleton is format.
    expect(fieldRules({ collection: 'CONSULTATION' }).visible('title', 'title')).toBe(false);
  });

  it('a page that shows part of a singleton edits only that part', () => {
    const r = fieldRules({ collection: 'ORG', fields: ['intro', 'vision'] });
    expect(r.visible('intro', 'intro')).toBe(true);
    expect(r.visible('phones', 'phones')).toBe(false);
    const legal = fieldRules({ collection: 'LEGAL', fields: ['accessibility'] });
    expect(legal.visible('accessibility', 'accessibility')).toBe(true);
    expect(legal.visible('accessibility.sections[].body', 'body')).toBe(true);
    expect(legal.visible('privacy', 'privacy')).toBe(false);
  });

  it('the slogan is content; crisis lines, an internal link and a duplicate chip label are not', () => {
    const org = fieldRules({ collection: 'ORG' });
    expect(org.visible('headline', 'headline')).toBe(true);
    expect(org.visible('tagline', 'tagline')).toBe(true);
    expect(org.visible('shortName', 'shortName')).toBe(false);
    expect(fieldRules({ collection: 'PATIENT_HUB' }).visible('crisisLines', 'crisisLines')).toBe(false);
    expect(fieldRules({ collection: 'JOURNEY_MODELS' }).visible('label', 'label')).toBe(false);
    // An event link to a page of the site is navigation; an external one is content.
    const ev = fieldRules({ collection: 'EVENTS' });
    expect(ev.visible('link', 'link', '/therapist/courses/cbt-trauma')).toBe(false);
    expect(ev.visible('link', 'link', 'https://example.org/x')).toBe(true);
    // A { label, to } link (a department's link to a page of the site) is not shown at all.
    const dep = fieldRules({ collection: 'DEPARTMENT_GROUPS' });
    expect(hasVisible({ label: 'קורסים והכשרות', to: '/therapist/courses' }, 'departments[].links[]', dep.visible)).toBe(false);
    expect(hasVisible({ label: 'טופס פנייה', href: 'https://example.org' }, 'departments[].links[]', dep.visible)).toBe(true);
    // The placeholder flags are switches the editor can clear.
    expect(fieldRules({ collection: 'DONATE' }).visible('isPlaceholder', 'isPlaceholder')).toBe(true);
    expect(fieldRules({ collection: 'PARTNER_GROUPS' }).visible('partners[].placeholder', 'placeholder')).toBe(true);
  });

  it('an item with an ISO date edits only the ISO date: no display text, no past flag', () => {
    const ev = fieldRules({ collection: 'EVENTS' });
    const event = { date: '3 במרץ', dateISO: '2027-03-03', isPast: false, title: 'x' };
    expect(ev.visible('dateISO', 'dateISO', event.dateISO, event)).toBe(true);
    expect(ev.visible('date', 'date', event.date, event)).toBe(false);
    expect(ev.visible('isPast', 'isPast', false, event)).toBe(false);
    // Without an ISO date the free-text date and the manual flag stay.
    const c = fieldRules({ collection: 'COURSES' });
    const course = { startDate: 'בפנייה', isPast: true };
    expect(c.visible('startDate', 'startDate', course.startDate, course)).toBe(true);
    expect(c.visible('isPast', 'isPast', true, course)).toBe(true);
    const run = { startDate: '1.3.2027', startDateISO: '2027-03-01', isPast: false };
    expect(c.visible('formats[].startDate', 'startDate', run.startDate, run)).toBe(false);
    expect(c.visible('formats[].isPast', 'isPast', false, run)).toBe(false);
  });

  it('the new data fields are picks from the page\'s own chips, labelled in Hebrew', () => {
    const he = { COPY: { childrenFamily: { ageEarly: 'גיל הרך', ageSchool: 'גיל בית ספר', ageParents: 'עבודה עם הורים' }, supervision: { kindIndividual: 'אחד על אחד' } } };
    expect(fieldRules({ collection: 'CHILDREN_FAMILY_INTRO', he }).options('models[].ageGroups')).toEqual([
      { value: 'early', label: 'גיל הרך' }, { value: 'school', label: 'גיל בית ספר' }, { value: 'parents', label: 'עבודה עם הורים' },
    ]);
    expect(fieldRules({ collection: 'SUPERVISION', he }).options('options[].kinds')[0]).toEqual({ value: 'individual', label: 'אחד על אחד' });
    expect(fieldRules({ collection: 'ORGANIZATION_PROGRAMS' }).options('needs').map(c => c.value)).toEqual(['informed', 'workshop', 'clinical']);
    expect(fieldRules({ collection: 'COURSES' }).options('therapistNeeds').map(c => c.value)).toEqual(['supervision', 'team', 'kids']);
    expect(fieldRules({ collection: 'ARTICLES' }).options('genre').map(c => c.value)).toEqual(['opinion']);
    for (const col of ['PAPERS', 'ACTIVE_STUDIES']) expect(fieldRules({ collection: col }).visible('releaseJourney', 'releaseJourney')).toBe(true);
    expect(fieldRules({ collection: 'TEAM' }).visible('releaseJourneyTeam', 'releaseJourneyTeam')).toBe(true);
  });
});

describe('search: Hebrew-friendly', () => {
  it('ignores niqqud, quote variants and final letters', () => {
    expect(normalize('פנד"ה')).toBe(normalize('פנד״ה'));
    expect(normalize('פנד״ה')).toBe(normalize('פנדה'));
    expect(normalize('שָׁלוֹם')).toBe(normalize('שלומ'));
    expect(normalize('ער\'ן')).toBe(normalize('ער׳ן'));
    const entries = [{ pageId: 'p', sectionId: 's', sectionLabel: 'x', focus: {}, title: 'קבוצת פנד״ה לילדים', text: '' }];
    expect(searchEntries(entries, 'פנדה')).toHaveLength(1);
    expect(searchEntries(entries, 'ילדימ')).toHaveLength(1);
  });
});

describe('metiv admin: content-only editors, search and the merged page (preview fixtures)', () => {
  let errorSpy;
  beforeEach(() => {
    localStorage.setItem('natal_lang', 'he');
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => { errorSpy.mockRestore(); cleanup(); localStorage.clear(); sessionStorage.clear(); });

  async function openTree() {
    renderAdmin({ variant: 'metiv' });
    fireEvent.click(screen.getByRole('button', { name: 'עריכת תוכן' }));
    return screen.findByRole('navigation', { name: 'עמודי האתר' });
  }

  it('the home page shows the landing copy content keys only, never its headings', async () => {
    await openTree();
    expect(await screen.findByDisplayValue(landingCopy.intro, {}, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.getByLabelText('פתיחה בראש העמוד')).toBeInTheDocument();
    expect(screen.queryByDisplayValue(landingCopy.ptsdTitle)).toBeNull();
    expect(screen.queryByDisplayValue(landingCopy.servicesTitle)).toBeNull();
  });

  it('a course editor shows no technical fields', async () => {
    const nav = await openTree();
    fireEvent.click(within(nav).getByRole('button', { name: 'אזור אנשי הטיפול והמקצוע' }));
    fireEvent.click(within(nav).getByRole('button', { name: 'קורסים והכשרות' }));
    const course = coursesSeed.rows[0].content;
    const title = await screen.findByText(course.title, { selector: 'section p' }, { timeout: 4000 });
    fireEvent.click(within(title.closest('.relative')).getByTitle('עריכה'));
    const editor = screen.getByDisplayValue(course.title).closest('section');
    expect(within(editor).queryByDisplayValue(course.slug)).toBeNull();
    expect(within(editor).queryByDisplayValue(course.sourceUrl)).toBeNull();
    expect(within(editor).queryByText('שדות טכניים', { exact: false })).toBeNull();
    // Content that looks technical stays: the registration link, the ISO date as a date picker.
    expect(within(editor).getByDisplayValue(course.registration.url)).toBeInTheDocument();
    expect(within(editor).getByDisplayValue(course.startDateISO)).toHaveAttribute('type', 'date');
  });

  /** Opens a page of the tree by its label: every area and parent expanded first. */
  async function openPage(nav, label) {
    await waitFor(() => {
      for (const b of within(nav).queryAllByRole('button', { expanded: false })) fireEvent.click(b);
      expect(within(nav).getAllByRole('button').some(b => b.textContent === label)).toBe(true);
    });
    fireEvent.click(within(nav).getAllByRole('button').find(b => b.textContent === label && b.hasAttribute('aria-pressed')));
    return screen.findByRole('heading', { level: 2, name: label });
  }

  it('a page subtitle is editable; a text that explains how the page works is not', async () => {
    const nav = await openTree();
    await openPage(nav, 'הדרכה');
    expect(await screen.findByDisplayValue(supervisionCopy.subtitle, {}, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.getByLabelText('המשפט שמתחת לכותרת העמוד')).toBeInTheDocument();
    expect(screen.queryByDisplayValue(supervisionCopy.optionsIntro)).toBeNull();
    expect(screen.queryByDisplayValue(supervisionCopy.shortCompare)).toBeNull();
  });

  it('crisis-line numbers are not in the admin', async () => {
    const nav = await openTree();
    await openPage(nav, 'בכל העמודים: תחתית העמוד');
    await screen.findByText('הסתייגות רפואית בתחתית', {}, { timeout: 4000 });
    expect(screen.queryByDisplayValue(/1201/)).toBeNull();
    expect(screen.queryByText(/ער"ן בעמודי האזור למטופלים/)).toBeNull();
    for (const label of ['למטופלים ולמשפחות', 'שאלון אנונימי', 'איפה מקבלים טיפול']) {
      await openPage(nav, label);
      expect(screen.queryByRole('button', { name: /עריכה בעמוד בכל העמודים/ })).toBeNull();
    }
    expect(within(nav).queryByRole('button', { name: 'תרגילי הרגעה' })).toBeNull();
  });

  it('an event with an ISO date edits only that date: no date text, no past flag', async () => {
    const nav = await openTree();
    await openPage(nav, 'אירועים ועדכונים');
    const ev = eventsSeed.rows[0].content;
    const title = await screen.findByText(ev.title, { selector: 'section p' }, { timeout: 4000 });
    fireEvent.click(within(title.closest('.relative')).getByTitle('עריכה'));
    const editor = screen.getByDisplayValue(ev.title).closest('section');
    expect(within(editor).getByDisplayValue(ev.dateISO)).toHaveAttribute('type', 'date');
    expect(within(editor).queryByDisplayValue(ev.date)).toBeNull();
    expect(within(editor).queryByLabelText('אירוע שעבר')).toBeNull();
  });

  it('the PTSD-IL panels show content only: no step number, no questionnaire name, slug, scores or structure', async () => {
    const nav = await openTree();
    await openPage(nav, 'המסע הטיפולי');
    const step = (await screen.findByText('שלב 1 - זיהוי', {}, { timeout: 4000 })).closest('.group');
    fireEvent.click(within(step).getByTitle('עריכה'));
    expect(screen.queryByText('מספר שלב')).toBeNull();
    expect(screen.getByText('כותרת')).toBeInTheDocument();

    await openPage(nav, 'שאלון אנונימי');
    const q = await screen.findByText('PCL-5 (תצוגה מקדימה)', {}, { timeout: 4000 });
    expect(screen.queryByText(/slug:/)).toBeNull();
    expect(screen.queryByRole('button', { name: /הוספת שאלון חדש/ })).toBeNull();
    const row = q.closest('.rounded-xl');
    expect(within(row).queryByTitle('מחיקה')).toBeNull();
    fireEvent.click(within(row).getByTitle('עריכה'));
    expect(within(row).getByText('תיאור')).toBeInTheDocument();
    for (const label of ['slug', 'שם', 'ציון מקסימלי', 'סף קליני', 'סדר תצוגה', 'פעיל']) expect(within(row).queryByText(label), label).toBeNull();
    fireEvent.click(within(row).getByRole('button', { name: /ביטול/ }));
    fireEvent.click(within(row).getByRole('button', { name: /שאלות/ }));
    const question = (await within(row).findByText('זיכרונות חוזרים ומטרידים של האירוע')).closest('.rounded-lg');
    expect(within(question).getByText('כלל לא · מעט · במידה בינונית · הרבה')).toBeInTheDocument();
    expect(within(row).queryByRole('button', { name: /הוספת שאלה/ })).toBeNull();
    fireEvent.click(within(question).getByTitle('עריכה'));
    expect(within(row).getByLabelText('תשובה 1')).toHaveValue('כלל לא');
    expect(within(row).queryByTitle('score')).toBeNull();
    expect(within(row).queryByTitle('order')).toBeNull();
    expect(within(row).queryByRole('button', { name: /הוספת תשובה/ })).toBeNull();
  });

  it('opens מסע שחרור from either area as one page with both pages\' texts', async () => {
    const nav = await openTree();
    fireEvent.click(within(nav).getByRole('button', { name: 'אזור אנשי הטיפול והמקצוע' }));
    fireEvent.click(within(nav).getByRole('button', { name: /אותו עמוד כמו באזור המטופלים/ }));
    expect(await screen.findByRole('heading', { level: 2, name: 'מסע שחרור' })).toBeInTheDocument();
    const regions = screen.getAllByRole('region').map(r => r.getAttribute('aria-label'));
    expect(regions).toEqual(['טקסטים בעמוד למשתתפים', 'על מסע שחרור', 'מספרים', 'רשימת ההמתנה', 'מסלולים ומודלים', 'אנשי קשר', 'טקסטים בעמוד לאנשי מקצוע']);
    expect(screen.getByText(/מוצג גם באזור המטופלים וגם באזור אנשי המקצוע/)).toBeInTheDocument();
  });

  it('search finds a course by a Hebrew variant and opens its editor', async () => {
    await openTree();
    fireEvent.change(screen.getAllByRole('searchbox')[0], { target: { value: 'מפת הדרכים' } });
    const results = await screen.findByText(/תוצאות ל"מפת הדרכים"/, {}, { timeout: 4000 });
    expect(results).toBeInTheDocument();
    const course = coursesSeed.rows.find(r => r.content.title.includes('מפת הדרכים')).content;
    const hit = screen.getAllByRole('button').find(b => b.textContent.startsWith(course.title));
    fireEvent.click(hit);
    expect(await screen.findByRole('heading', { level: 2, name: 'קורסים והכשרות' })).toBeInTheDocument();
    expect(await screen.findByDisplayValue(course.title)).toBeInTheDocument();
  });

  it('search finds a PTSD-IL item and opens it in its panel', async () => {
    await openTree();
    fireEvent.change(screen.getAllByRole('searchbox')[0], { target: { value: 'הפרעת דחק' } });
    const hit = await waitFor(() => {
      const b = screen.getAllByRole('button').find(x => x.textContent.startsWith('מהי הפרעת דחק פוסט-טראומטית?'));
      expect(b).toBeTruthy();
      return b;
    }, { timeout: 6000 });
    fireEvent.click(hit);
    expect(await screen.findByRole('heading', { level: 2, name: 'מה זה פוסט-טראומה' })).toBeInTheDocument();
    expect(await screen.findByDisplayValue('מהי הפרעת דחק פוסט-טראומטית?', {}, { timeout: 4000 })).toBeInTheDocument();
  });
});

describe('dev server: read-only live data', () => {
  afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear(); });

  it('maps the admin reads onto the public endpoints', () => {
    expect(publicPathFor('/admin/articles?type=faq&langId=he&categoryId=x')).toBe('/articles?type=faq&langId=he&categoryId=x');
    expect(publicPathFor('/admin/articles?type=article')).toBe('/articles?type=article');
    expect(publicPathFor('/admin/questionnaires')).toBe('/questionnaires');
    expect(publicPathFor('/admin/questionnaires/q1')).toBe('/questionnaires/q1');
    expect(publicPathFor('/categories?parentId=p')).toBe('/categories?parentId=p');
    expect(publicPathFor('/communities?langId=ar')).toBe('/communities?langId=ar');
    expect(publicPathFor('/admin/users')).toBeNull();
  });

  it('reads through fetch without a token, and refuses what has no public counterpart', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('[{"id":"a"}]', { status: 200 }));
    expect(await liveGet('/admin/articles?type=faq&langId=he')).toEqual([{ id: 'a' }]);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe(`${import.meta.env.VITE_API_URL}/articles?type=faq&langId=he`);
    expect(init).toBeUndefined();
    await expect(liveGet('/admin/users')).rejects.toThrow(/רק אחרי התחברות/);
  });

  it('refuses every write while no token is pasted', async () => {
    expect(inReadOnlyPreview()).toBe(true);
    for (const method of ['POST', 'PATCH', 'PUT', 'DELETE']) {
      await expect(adminApi(method, '/admin/articles/x', {})).rejects.toBeInstanceOf(ReadOnlyPreviewError);
    }
  });
});

describe('dev server: signed in with a pasted token', () => {
  const b64 = obj => btoa(JSON.stringify(obj)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const jwt = claims => `${b64({ alg: 'HS256' })}.${b64(claims)}.sig`;
  const future = Math.floor(Date.now() / 1000) + 3600;
  let errorSpy;
  beforeEach(() => { errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {}); });
  afterEach(() => { errorSpy.mockRestore(); vi.restoreAllMocks(); cleanup(); sessionStorage.clear(); localStorage.clear(); });

  it('rejects a malformed, expired or role-less token and keeps the read-only mode', () => {
    expect(() => loginWithToken('not-a-token')).toThrow(/JWT/);
    expect(() => loginWithToken(jwt({ sub: 'u', roles: ['admin'], exp: 10 }))).toThrow(/פג תוקף/);
    expect(() => loginWithToken(jwt({ sub: 'u', roles: ['viewer'], exp: future }))).toThrow(/הרשאת עריכה/);
    expect(sessionStorage.getItem('ptsd_admin_token')).toBeNull();
    expect(inReadOnlyPreview()).toBe(true);
  });

  it('a valid token switches to the live API: writes go out with the Bearer token', async () => {
    const token = jwt({ sub: 'u1', roles: ['admin'], exp: future });
    loginWithToken(`Bearer ${token}`);
    expect(sessionStorage.getItem('ptsd_admin_token')).toBe(token);
    expect(inReadOnlyPreview()).toBe(false);
    expect(inDevTokenSession()).toBe(true);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"id":"x"}', { status: 200 }));
    await adminApi('PATCH', '/admin/articles/x', { title: 't' });
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe(`${import.meta.env.VITE_API_URL}/admin/articles/x`);
    expect(init.headers.Authorization).toBe(`Bearer ${token}`);
    logout();
    expect(inReadOnlyPreview()).toBe(true);
  });

  it('the banner offers the token sign-in, and turns red once signed in', async () => {
    localStorage.setItem('natal_lang', 'he');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('[]', { status: 200 }));
    renderAdmin({ variant: 'metiv' });
    expect(screen.getByText(/התוכן האמיתי מהאתר החי, לקריאה בלבד/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /התחברות עם טוקן/ }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('הטוקן'), { target: { value: jwt({ sub: 'u1', roles: ['admin'], exp: future }) } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'התחברות למסד החי' }));
    expect(await screen.findByText(/כל שמירה משנה את האתר החי/)).toBeInTheDocument();
    expect(screen.queryByText(/לקריאה בלבד/)).toBeNull();
  });
});

describe('registry coverage', () => {
  it('names only registry collections', () => {
    for (const p of real) for (const s of p.sections) if (s.key) expect(COLLECTION_BY_KEY[s.key], s.key).toBeTruthy();
  });
});
