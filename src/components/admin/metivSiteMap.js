// The Metiv admin's page tree: the v3 site's own navigation, page by page, so
// an editor finds a text where a visitor sees it. Each node is ONE site page
// and lists, in the order the page shows them, the sections an editor can
// change there:
//
//   collection  a Metiv collection from the registry (`fields`: only these
//               parts of a singleton, when the rest is shown on another page)
//   item        one item of a list (a course page, an article page)
//   copy        the editable (content) keys of a page-copy namespace
//               (copyContentKeys.js)
//   i18n        the editable i18n texts of this page (src/lib/editableI18nKeys.js),
//               edited as site-copy override rows shared with PTSD-IL. Filled
//               in by buildSiteTree from EDITABLE_I18N[page id]: where the spec
//               places `{ kind: 'i18n' }`, else first on the page
//   ptsd        one of the PTSD-IL panels (src/pages/Admin.jsx)
//   link        data shown here but edited on its main page: a pointer, not a
//               second editor
//   qa / users / log  the chatbot Q&A, user management, the edit log
//
// Where the tree comes from: the routes in v3/Site.jsx, the order of the
// patient menu (PATIENT_NAV, with מסע שחרור above "איפה מקבלים טיפול") and of
// the professional tabs (NAV, with "על מטיב" after the area home and מסע שחרור
// last) in v3/components/Chrome.jsx, and the page names in ROUTE_META. What
// each page shows comes from the collections and copy namespaces its component
// and children read (useMetiv / useCopy). src/test/admin-metiv-sitemap.test.js
// checks the tree against the routes, the menus and the registry.
//
// Not in the tree at all: pure navigation and taxonomy - NAV, PATIENT_NAV,
// ROUTE_META, NEXT_STEPS (menu entries, page names, "next step" links),
// COURSE_CATEGORIES, PAPER_TOPICS, TEAM_GROUPS (filter labels; their values are
// offered as choices where an item picks one) - and what is fixed or not shown:
// CONTACTS and PATIENT_HUB (crisis-line numbers, the consultation link and
// chatbot-only material), SHORT_VERSIONS (no page renders it).
//
// Pages with nothing editable (the calming exercises, a page whose texts are
// all headings and buttons) are left out of the tree by buildSiteTree; their
// child pages move up to their place, so the tree still follows the site.

import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { V3_ROUTES } from '@/pages/metiv-demos/v3/meta';
import { EDITABLE_I18N } from '@/lib/editableI18nKeys';
import { copyContentKeys } from './copyContentKeys';

/**
 * @typedef {{ kind: 'collection', key: string, fields?: string[], label?: string }
 *   | { kind: 'item', key: string, itemKey: string, label?: string }
 *   | { kind: 'copy', ns: string, label?: string }
 *   | { kind: 'i18n', keys?: string[], label?: string }
 *   | { kind: 'ptsd', panel: string, label?: string }
 *   | { kind: 'link', to: string, label: string, key?: string, ns?: string, panel?: string }
 *   | { kind: 'qa' | 'users' | 'log', label?: string }} SectionSpec
 * @typedef {{ from: string, route: string, prefix: string }} DynamicChildren
 * @typedef {{ id: string, label: string, route?: string, sections?: SectionSpec[], children?: PageSpec[], dynamic?: DynamicChildren, aliasOf?: string, alsoIn?: string, note?: string, masterOnly?: boolean }} PageSpec
 * @typedef {{ id: string, label: string, pages: PageSpec[] }} AreaSpec
 */

/** Collections never edited here: navigation, taxonomy, fixed crisis lines, unrendered data. */
export const NOT_EDITED = [
  'NAV', 'PATIENT_NAV', 'ROUTE_META', 'NEXT_STEPS', 'COURSE_CATEGORIES', 'PAPER_TOPICS', 'TEAM_GROUPS',
  'CONTACTS', 'PATIENT_HUB', 'SHORT_VERSIONS',
];

const ORG_ABOUT = ['headline', 'tagline', 'intro', 'vision'];
const ORG_CONTACT = ['name', 'legalName', 'legalEntity', 'address', 'mail', 'phones', 'emails', 'social', 'donateUrl', 'trainingsFormUrl', 'adultsClinicFormUrl', 'kidsClinicFormUrl'];
const ABOUT_HISTORY = ['history', 'timeline', 'activitiesIntro', 'activities', 'communities', 'partnersAbroad'];
const RESEARCH_MAIN = ['paragraphs', 'focus', 'role', 'principles', 'pastResearchAreas', 'collaborationContact', 'journalClub'];

/** @type {AreaSpec[]} */
export const SITE_MAP = [
  {
    id: 'metiv',
    label: 'מטיב: דף הבית ועמודים כלליים',
    pages: [
      {
        id: 'home', label: 'דף הבית', route: ROUTES.home,
        sections: [
          { kind: 'copy', ns: 'landing' },
          { kind: 'i18n', label: 'מה זה פוסט-טראומה (משותף עם אזור המטופלים)' },
          { kind: 'link', key: 'METIV_SERVICES', to: 'whereToGetHelp', label: 'השירותים הטיפוליים של מטיב' },
          { kind: 'collection', key: 'ORG', fields: ORG_ABOUT, label: 'מי אנחנו' },
          { kind: 'collection', key: 'FACTS' },
          { kind: 'link', key: 'RESEARCH_INTRO', to: 'research', label: 'מחקר: פתיחה' },
          { kind: 'link', key: 'ACTIVE_STUDIES', to: 'research', label: 'מחקרים שמגייסים משתתפים' },
          { kind: 'link', key: 'EVENTS', to: 'events', label: 'אירועים קרובים' },
          { kind: 'link', key: 'ARTICLES', to: 'articles', label: 'המאמר האחרון' },
          { kind: 'link', key: 'DONATE', to: 'donate', label: 'תרומה' },
          { kind: 'collection', key: 'PARTNERS', label: 'שותפים וארגונים שעבדו עם מטיב' },
          { kind: 'collection', key: 'FUNDERS_AND_COLLABORATORS', label: 'שיתופי פעולה ומימון' },
          { kind: 'link', key: 'ORG', to: 'contact', label: 'כתובת, טלפון ומייל' },
        ],
      },
      {
        id: 'donate', label: 'תרומה', route: ROUTES.donate,
        sections: [{ kind: 'copy', ns: 'donate' }, { kind: 'collection', key: 'DONATE' }],
      },
      {
        id: 'contact', label: 'יצירת קשר', route: ROUTES.contact,
        sections: [
          { kind: 'copy', ns: 'contact' },
          { kind: 'collection', key: 'ORG', fields: ORG_CONTACT, label: 'פרטי הארגון ויצירת קשר' },
          { kind: 'link', key: 'THERAPIST_HUB', to: 'therapist', label: 'טופס פנייה להכשרה או הדרכה' },
          { kind: 'link', key: 'RESEARCH_INTRO', to: 'research', label: 'איש/אשת קשר למחקר' },
          { kind: 'link', key: 'COLLABORATION_CONTACT', to: 'aboutCollaborations', label: 'איש קשר לשותפויות' },
        ],
      },
      {
        id: 'accessibility', label: 'הצהרת נגישות', route: ROUTES.accessibility,
        sections: [{ kind: 'copy', ns: 'accessibility' }, { kind: 'collection', key: 'LEGAL', fields: ['accessibility'], label: 'הצהרת הנגישות' }],
      },
      {
        id: 'privacy', label: 'מדיניות פרטיות', route: ROUTES.privacy,
        sections: [{ kind: 'collection', key: 'LEGAL_DOCS', fields: ['privacy'], label: 'מדיניות הפרטיות' }],
      },
      {
        id: 'terms', label: 'תנאי שימוש', route: ROUTES.terms,
        sections: [{ kind: 'collection', key: 'LEGAL_DOCS', fields: ['terms'], label: 'תנאי השימוש' }],
      },
      {
        id: 'siteFrame', label: 'בכל העמודים: תחתית העמוד',
        sections: [
          { kind: 'copy', ns: 'chrome', label: 'חלון "עזרה עכשיו"' },
          { kind: 'i18n', label: 'הסתייגות בתחתית' },
          { kind: 'link', key: 'ORG', to: 'contact', label: 'פרטי הקשר בתחתית' },
        ],
      },
    ],
  },
  {
    id: 'patient',
    label: 'אזור המטופלים והמשפחות',
    pages: [
      { id: 'patient', label: 'למטופלים ולמשפחות', route: ROUTES.patient },
      {
        id: 'firstCircle', label: 'מי שחווה אירוע קשה', route: ROUTES.firstCircle,
        children: [
          { id: 'ptsdInfo', label: 'מה זה פוסט-טראומה', route: ROUTES.ptsdInfo, sections: [{ kind: 'ptsd', panel: 'ptsd_faqs' }] },
          {
            id: 'selfHelp', label: 'עזרה עצמית', route: ROUTES.selfHelp,
            sections: [{ kind: 'ptsd', panel: 'self_help' }, { kind: 'collection', key: 'VIDEO_LECTURES' }],
          },
          {
            id: 'rights', label: 'זכויות', route: ROUTES.rights,
            sections: [
              { kind: 'ptsd', panel: 'rights' },
              { kind: 'link', key: 'METIV_SERVICES', to: 'whereToGetHelp', label: 'תוכניות מטיב בלשונית כוחות הביטחון' },
            ],
          },
          {
            id: 'treatment', label: 'המסע הטיפולי', route: ROUTES.treatment,
            sections: [{ kind: 'ptsd', panel: 'treatment' }, { kind: 'collection', key: 'TREATMENT_WHERE_BLOCK' }],
          },
          {
            id: 'community', label: 'קהילות תמיכה', route: ROUTES.community,
            sections: [{ kind: 'ptsd', panel: 'communities' }, { kind: 'copy', ns: 'patientCommunity' }, { kind: 'collection', key: 'VETERANS_PROGRAMS' }],
          },
          {
            id: 'children', label: 'לדבר עם ילדים', route: ROUTES.children,
            sections: [{ kind: 'ptsd', panel: 'children' }, { kind: 'copy', ns: 'patientChildren' }, { kind: 'collection', key: 'PARENT_CHILD_GROUPS' }],
          },
        ],
      },
      {
        id: 'secondCircle', label: 'קרובים ובני משפחה', route: ROUTES.secondCircle,
        children: [
          {
            id: 'secondCircleTools', label: 'כלים לבני משפחה', route: ROUTES.secondCircleTools,
            sections: [{ kind: 'ptsd', panel: 'second_circle' }, { kind: 'copy', ns: 'patientSecondCircleTools' }, { kind: 'collection', key: 'RESERVIST_FAMILY_PROGRAMS' }],
          },
        ],
      },
      {
        id: 'questionnaire', label: 'שאלון אנונימי', route: ROUTES.questionnaire,
        sections: [
          { kind: 'ptsd', panel: 'questionnaire' },
          { kind: 'i18n', label: 'הנחיה, פתיחה והסברי התוצאה' },
          { kind: 'link', key: 'CONSULTATION', to: 'whereToGetHelp', label: 'לא בטוחים אם לפנות?' },
        ],
      },
      {
        id: 'releaseJourney', label: 'מסע שחרור', route: V3_ROUTES.releaseJourney, alsoIn: 'therapist',
        sections: [
          { kind: 'copy', ns: 'patientReleaseJourney', label: 'טקסטים בעמוד למשתתפים' },
          { kind: 'collection', key: 'RELEASE_JOURNEY', label: 'על מסע שחרור' },
          { kind: 'collection', key: 'RELEASE_JOURNEY_STATS', label: 'מספרים' },
          { kind: 'collection', key: 'RELEASE_JOURNEY_WAITING', label: 'רשימת ההמתנה' },
          { kind: 'collection', key: 'JOURNEY_MODELS', label: 'מסלולים ומודלים' },
          { kind: 'collection', key: 'RELEASE_JOURNEY_CONTACTS', label: 'אנשי קשר' },
          { kind: 'copy', ns: 'releaseJourneyPro', label: 'טקסטים בעמוד לאנשי מקצוע' },
          { kind: 'link', key: 'TEAM', to: 'aboutTeam', label: 'צוות מסע שחרור (מתוך הצוות)' },
          { kind: 'link', key: 'ACTIVE_STUDIES', to: 'research', label: 'המחקר שמלווה את התוכנית' },
          { kind: 'link', key: 'PAPERS', to: 'publications', label: 'פרסומים על התוכנית' },
        ],
      },
      {
        id: 'whereToGetHelp', label: 'איפה מקבלים טיפול', route: ROUTES.whereToGetHelp,
        sections: [
          { kind: 'copy', ns: 'patientWhereToGetHelp' },
          { kind: 'collection', key: 'PUBLIC_OPTIONS', label: 'המערכת הציבורית' },
          { kind: 'collection', key: 'NONPROFIT_OPTIONS', label: 'עמותות וקווי סיוע' },
          { kind: 'collection', key: 'METIV_SERVICES', label: 'מרפאות ותוכניות של מטיב' },
          { kind: 'collection', key: 'CONSULTATION', label: 'לא בטוחים אם לפנות?' },
        ],
      },
      {
        id: 'freeTreatment', label: 'טיפולים ללא עלות ומחקרים', route: ROUTES.freeTreatment,
        sections: [
          { kind: 'copy', ns: 'patientFreeTreatment' },
          { kind: 'collection', key: 'FREE_TREATMENTS' },
          { kind: 'collection', key: 'RESEARCH_STUDIES' },
          { kind: 'link', key: 'RESERVIST_FAMILY_PROGRAMS', to: 'secondCircleTools', label: 'קבוצות למילואימניקים ולבני משפחותיהם' },
          { kind: 'link', key: 'CONSULTATION', to: 'whereToGetHelp', label: 'לא בטוחים אם לפנות?' },
        ],
      },
      {
        // The exercises are locked (owner, 2026-10-29): left out of the tree.
        id: 'calming', label: 'תרגילי הרגעה', route: ROUTES.calming,
        children: [
          { id: 'calmingBreathing', label: 'נשימה', route: ROUTES.calmingBreathing },
          { id: 'calmingGrounding', label: 'קרקוע', route: ROUTES.calmingGrounding },
          { id: 'calmingMuscle', label: 'הרפיית שרירים', route: ROUTES.calmingMuscle },
        ],
      },
      {
        id: 'sources', label: 'מקורות', route: ROUTES.sources,
        sections: [
          { kind: 'ptsd', panel: 'sources' },
          { kind: 'copy', ns: 'patientSources' },
          { kind: 'collection', key: 'METIV_BOOKS' },
          { kind: 'collection', key: 'METIV_BOOKS_ORDER_NOTE' },
        ],
      },
    ],
  },
  {
    id: 'therapist',
    label: 'אזור אנשי הטיפול והמקצוע',
    pages: [
      {
        id: 'therapist', label: 'לאנשי טיפול ומקצוע', route: ROUTES.therapist,
        sections: [
          { kind: 'copy', ns: 'therapistHub' },
          { kind: 'collection', key: 'THERAPIST_HUB' },
          { kind: 'link', key: 'COURSES', to: 'courses', label: 'מה פתוח להרשמה' },
          { kind: 'link', key: 'EVENTS', to: 'events', label: 'מחזורים ואירועים קרובים' },
        ],
      },
      {
        id: 'about', label: 'על מטיב', route: ROUTES.about,
        sections: [
          { kind: 'copy', ns: 'about' },
          { kind: 'collection', key: 'DEPARTMENT_GROUPS' },
          { kind: 'link', key: 'ORG', to: 'contact', label: 'פרטי הקשר' },
        ],
        children: [
          {
            id: 'aboutHistory', label: 'הסיפור של מטיב', route: V3_ROUTES.aboutHistory,
            sections: [
              { kind: 'copy', ns: 'aboutHistory' },
              { kind: 'collection', key: 'ORG', fields: ['mission'], label: 'המטרה שלנו' },
              { kind: 'collection', key: 'ABOUT', fields: ABOUT_HISTORY, label: 'ההיסטוריה ותחומי הפעילות' },
              { kind: 'link', key: 'FACTS', to: 'home', label: 'מטיב במספרים' },
            ],
          },
          {
            id: 'aboutTeam', label: 'הצוות', route: V3_ROUTES.aboutTeam,
            sections: [
              { kind: 'collection', key: 'ABOUT', fields: ['teamIntro'], label: 'פתיחה' },
              { kind: 'collection', key: 'TEAM' },
            ],
          },
          {
            id: 'aboutPartners', label: 'השותפים שלנו', route: V3_ROUTES.aboutPartners,
            sections: [
              { kind: 'copy', ns: 'aboutPartners' },
              { kind: 'collection', key: 'PARTNER_GROUPS' },
              { kind: 'link', key: 'COLLABORATION_CONTACT', to: 'aboutCollaborations', label: 'איש קשר לשותפויות' },
            ],
          },
          {
            id: 'aboutCollaborations', label: 'שיתופי פעולה', route: V3_ROUTES.aboutCollaborations,
            sections: [
              { kind: 'copy', ns: 'aboutCollaborations' },
              { kind: 'collection', key: 'COLLABORATION_GROUPS' },
              { kind: 'collection', key: 'COLLABORATION_CONTACT' },
              { kind: 'link', key: 'PARTNERS', to: 'home', label: 'רשימת השותפים' },
              { kind: 'link', key: 'ABOUT', to: 'aboutHistory', label: 'קהילות ואזורי אסון' },
            ],
          },
        ],
      },
      {
        id: 'courses', label: 'קורסים והכשרות', route: ROUTES.courses,
        sections: [
          { kind: 'copy', ns: 'courses' },
          { kind: 'collection', key: 'COURSES' },
          { kind: 'copy', ns: 'courseDetail', label: 'טקסטים בעמוד של כל קורס' },
          { kind: 'link', key: 'THERAPIST_HUB', to: 'therapist', label: 'טופס הפנייה להכשרה' },
        ],
        dynamic: { from: 'COURSES', route: ROUTES.course, prefix: 'course' },
      },
      {
        id: 'childrenFamily', label: 'ילדים ומשפחה', route: ROUTES.childrenFamily,
        sections: [
          { kind: 'copy', ns: 'childrenFamily' },
          { kind: 'collection', key: 'CHILDREN_FAMILY_INTRO' },
          { kind: 'link', key: 'COURSES', to: 'courses', label: 'הכשרות בתחום הילדים והמשפחה' },
        ],
      },
      {
        id: 'supervision', label: 'הדרכה', route: ROUTES.supervision,
        sections: [{ kind: 'copy', ns: 'supervision' }, { kind: 'collection', key: 'SUPERVISION' }],
      },
      {
        id: 'organizations', label: 'לארגונים', route: ROUTES.organizations,
        sections: [
          { kind: 'copy', ns: 'organizations' },
          { kind: 'collection', key: 'ORGANIZATION_PROGRAMS' },
          { kind: 'link', key: 'COURSES', to: 'courses', label: 'הקורס של כל תוכנית' },
        ],
      },
      {
        id: 'research', label: 'מחקר', route: ROUTES.research,
        sections: [
          { kind: 'copy', ns: 'research' },
          { kind: 'collection', key: 'RESEARCH_INTRO', fields: RESEARCH_MAIN, label: 'יחידת המחקר' },
          { kind: 'collection', key: 'ACTIVE_STUDIES' },
        ],
      },
      {
        id: 'publications', label: 'פרסומים', route: ROUTES.publications,
        sections: [
          { kind: 'copy', ns: 'publications' },
          { kind: 'collection', key: 'RESEARCH_INTRO', fields: ['booksOrderingNote'], label: 'הערה על הזמנת ספרים' },
          { kind: 'collection', key: 'BOOKS' },
          { kind: 'collection', key: 'PAPERS' },
        ],
      },
      {
        id: 'articles', label: 'מאמרים', route: ROUTES.articles,
        sections: [{ kind: 'copy', ns: 'articles' }, { kind: 'collection', key: 'ARTICLES' }],
        dynamic: { from: 'ARTICLES', route: ROUTES.article, prefix: 'article' },
      },
      {
        id: 'events', label: 'אירועים ועדכונים', route: ROUTES.events,
        sections: [{ kind: 'copy', ns: 'events' }, { kind: 'collection', key: 'EVENTS' }],
      },
      { id: 'releaseJourneyPro', label: 'מסע שחרור', route: V3_ROUTES.releaseJourneyPro, aliasOf: 'releaseJourney' },
    ],
  },
  {
    id: 'tools',
    label: 'כלים',
    pages: [
      { id: 'chatbotQa', label: 'צ׳אטבוט: שאלות ותשובות מוכנות', sections: [{ kind: 'qa' }] },
      { id: 'users', label: 'משתמשים', sections: [{ kind: 'users' }], masterOnly: true },
      { id: 'log', label: 'יומן שינויים', sections: [{ kind: 'log' }], masterOnly: true },
    ],
  },
];

/**
 * @typedef {{ id: string, label: string, route?: string, area: string, areaLabel: string, sections: (SectionSpec & { id: string })[], children: PageNode[], aliasOf?: string, alsoIn?: string, note?: string, masterOnly?: boolean, parentId?: string }} PageNode
 * @typedef {{ id: string, label: string, pages: PageNode[] }} AreaNode
 */

/** The sections of a spec page as shown: copy only with editable keys, the i18n texts filled in. @param {PageSpec} p @param {Record<string, string[]>} i18n */
function specSections(p, i18n) {
  const keys = i18n[p.id] ?? [];
  /** @type {SectionSpec[]} */
  let out = (p.sections ?? []).filter(s => s.kind !== 'copy' || copyContentKeys(s.ns).length > 0);
  const at = out.findIndex(s => s.kind === 'i18n');
  if (keys.length) {
    const i18n = /** @type {SectionSpec} */ ({ ...(at >= 0 ? out[at] : {}), kind: 'i18n', keys });
    out = at >= 0 ? out.map((s, i) => (i === at ? i18n : s)) : [i18n, ...out];
  } else if (at >= 0) {
    out = out.filter(s => s.kind !== 'i18n');
  }
  return out;
}

/** Does a page have anything to edit (not only pointers to other pages)? */
const editable = (/** @type {{ sections: SectionSpec[] }} */ p) => p.sections.some(s => s.kind !== 'link');

/**
 * The tree with ids on every section and the dynamic children (one page per
 * course, per article) built from the loaded Hebrew rows. A page with nothing
 * to edit is left out and its children take its place; a pointer to a page
 * that is left out is dropped.
 * @param {Record<string, { key: string, title: string }[]>} [items]  per collection key, the Hebrew items in order
 * @param {{ map?: AreaSpec[], i18n?: Record<string, string[]> }} [spec]  the tree and the i18n keys (tests pass their own)
 * @returns {AreaNode[]}
 */
export function buildSiteTree(items = {}, { map = SITE_MAP, i18n = EDITABLE_I18N } = {}) {
  /** @param {PageSpec} p @param {AreaSpec} area @param {string} [parentId] @returns {PageNode[]} */
  const node = (p, area, parentId) => {
    const sections = specSections(p, i18n);
    const keep = p.aliasOf || p.masterOnly || editable({ sections });
    const childParent = keep ? p.id : parentId;
    const own = (p.children ?? []).flatMap(c => node(c, area, childParent));
    const dyn = p.dynamic
      ? (items[p.dynamic.from] ?? []).flatMap(it => node({
        id: `${p.dynamic.prefix}:${it.key}`,
        label: it.title,
        route: p.dynamic.route.replace(':slug', it.key),
        sections: [
          { kind: 'item', key: p.dynamic.from, itemKey: it.key, label: it.title },
          ...(p.dynamic.from === 'COURSES' ? [/** @type {SectionSpec} */ ({ kind: 'link', ns: 'courseDetail', to: 'courses', label: 'טקסטים שמשותפים לכל עמודי הקורסים' })] : []),
        ],
      }, area, childParent))
      : [];
    if (!keep) return [...own, ...dyn];
    return [{
      id: p.id,
      label: p.label,
      route: p.route,
      area: area.id,
      areaLabel: area.label,
      sections: sections.map((s, i) => ({ ...s, id: `${p.id}/${i}` })),
      children: [...own, ...dyn],
      aliasOf: p.aliasOf,
      alsoIn: p.alsoIn,
      note: p.note,
      masterOnly: p.masterOnly,
      parentId,
    }];
  };
  const tree = map.map(area => ({ id: area.id, label: area.label, pages: area.pages.flatMap(p => node(p, area)) }));
  // Pointers to a page that is not in the tree go too.
  const ids = new Set(flattenPages(tree).map(p => p.id));
  const prune = (/** @type {PageNode[]} */ pages) => {
    for (const p of pages) {
      p.sections = p.sections.filter(s => s.kind !== 'link' || ids.has(s.to));
      prune(p.children);
    }
  };
  for (const a of tree) prune(a.pages);
  return tree;
}

/** Every page of the tree, depth first, in tree order. @param {AreaNode[]} tree */
export function flattenPages(tree) {
  /** @type {PageNode[]} */
  const out = [];
  const walk = (/** @type {PageNode[]} */ pages) => { for (const p of pages) { out.push(p); walk(p.children); } };
  for (const a of tree) walk(a.pages);
  return out;
}

/** A page and the trail of its ancestors, root first. @param {AreaNode[]} tree @param {string} id */
export function findPage(tree, id) {
  const pages = flattenPages(tree);
  const page = pages.find(p => p.id === id && !p.aliasOf) ?? null;
  /** @type {PageNode[]} */
  const trail = [];
  let at = page;
  while (at?.parentId) {
    const parent = pages.find(p => p.id === at.parentId);
    if (!parent) break;
    trail.unshift(parent);
    at = parent;
  }
  return { page, trail };
}

/** The area labels by id, for the breadcrumb and the review dialog. */
export const AREA_TITLES = Object.fromEntries(SITE_MAP.map(a => [a.id, a.label]));
