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
// offered as choices where an item picks one).

import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { V3_ROUTES } from '@/pages/metiv-demos/v3/meta';

/**
 * @typedef {{ kind: 'collection', key: string, fields?: string[], label?: string }
 *   | { kind: 'item', key: string, itemKey: string, label?: string }
 *   | { kind: 'copy', ns: string, label?: string }
 *   | { kind: 'ptsd', panel: string, label?: string }
 *   | { kind: 'link', to: string, label: string, key?: string, ns?: string, panel?: string }
 *   | { kind: 'qa' | 'users' | 'log', label?: string }} SectionSpec
 * @typedef {{ from: string, route: string, prefix: string }} DynamicChildren
 * @typedef {{ id: string, label: string, route?: string, sections?: SectionSpec[], children?: PageSpec[], dynamic?: DynamicChildren, aliasOf?: string, alsoIn?: string, note?: string, masterOnly?: boolean }} PageSpec
 * @typedef {{ id: string, label: string, pages: PageSpec[] }} AreaSpec
 */

/** Collections that are navigation or taxonomy only: never edited here. */
export const NOT_EDITED = ['NAV', 'PATIENT_NAV', 'ROUTE_META', 'NEXT_STEPS', 'COURSE_CATEGORIES', 'PAPER_TOPICS', 'TEAM_GROUPS'];

const NO_CONTENT = 'בעמוד הזה אין תוכן לעריכה: הכותרות, הכפתורים והניווט שלו קבועים.';

const ORG_ABOUT = ['intro', 'vision'];
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
          { kind: 'collection', key: 'PATIENT_HUB', fields: ['hero.about'], label: 'מה זה פוסט-טראומה (פסקה)' },
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
        id: 'siteFrame', label: 'בכל העמודים: עזרה עכשיו, קווי חירום ותחתית',
        sections: [
          { kind: 'copy', ns: 'chrome', label: 'חלון "עזרה עכשיו"' },
          { kind: 'collection', key: 'PATIENT_HUB', fields: ['crisisLines', 'disclaimer'], label: 'קווי חירום בכותרת והסתייגות בתחתית' },
          { kind: 'collection', key: 'CONTACTS', fields: ['ERAN_PHONE', 'ERAN_WHATSAPP'], label: 'ער"ן בעמודי האזור למטופלים' },
          { kind: 'link', key: 'ORG', to: 'contact', label: 'פרטי הקשר בתחתית' },
        ],
      },
    ],
  },
  {
    id: 'patient',
    label: 'אזור המטופלים והמשפחות',
    pages: [
      { id: 'patient', label: 'למטופלים ולמשפחות', route: ROUTES.patient, note: NO_CONTENT },
      {
        id: 'firstCircle', label: 'מי שחווה אירוע קשה', route: ROUTES.firstCircle, note: NO_CONTENT,
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
        id: 'secondCircle', label: 'קרובים ובני משפחה', route: ROUTES.secondCircle, note: NO_CONTENT,
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
          { kind: 'link', key: 'CONSULTATION', to: 'whereToGetHelp', label: 'לא בטוחים אם לפנות?' },
          { kind: 'link', key: 'CONTACTS', to: 'siteFrame', label: 'ער"ן' },
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
          { kind: 'collection', key: 'SHORT_VERSIONS', fields: ['whereToGetHelp'], label: 'תיבת "בקצרה"' },
          { kind: 'collection', key: 'PUBLIC_OPTIONS', label: 'המערכת הציבורית' },
          { kind: 'collection', key: 'NONPROFIT_OPTIONS', label: 'עמותות וקווי סיוע' },
          { kind: 'collection', key: 'METIV_SERVICES', label: 'מרפאות ותוכניות של מטיב' },
          { kind: 'collection', key: 'CONSULTATION', label: 'לא בטוחים אם לפנות?' },
          { kind: 'link', key: 'CONTACTS', to: 'siteFrame', label: 'ער"ן' },
        ],
      },
      {
        id: 'freeTreatment', label: 'טיפולים ללא עלות ומחקרים', route: ROUTES.freeTreatment,
        sections: [
          { kind: 'copy', ns: 'patientFreeTreatment' },
          { kind: 'collection', key: 'SHORT_VERSIONS', fields: ['freeTreatment'], label: 'תיבת "בקצרה"' },
          { kind: 'collection', key: 'FREE_TREATMENTS' },
          { kind: 'collection', key: 'RESEARCH_STUDIES' },
          { kind: 'link', key: 'RESERVIST_FAMILY_PROGRAMS', to: 'secondCircleTools', label: 'קבוצות למילואימניקים ולבני משפחותיהם' },
          { kind: 'link', key: 'CONSULTATION', to: 'whereToGetHelp', label: 'לא בטוחים אם לפנות?' },
          { kind: 'link', key: 'CONTACTS', to: 'siteFrame', label: 'ער"ן' },
        ],
      },
      {
        id: 'calming', label: 'תרגילי הרגעה', route: ROUTES.calming, note: NO_CONTENT,
        children: [
          { id: 'calmingBreathing', label: 'נשימה', route: ROUTES.calmingBreathing, note: NO_CONTENT },
          { id: 'calmingGrounding', label: 'קרקוע', route: ROUTES.calmingGrounding, note: NO_CONTENT },
          { id: 'calmingMuscle', label: 'הרפיית שרירים', route: ROUTES.calmingMuscle, note: NO_CONTENT },
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

/**
 * The tree with ids on every section and the dynamic children (one page per
 * course, per article) built from the loaded Hebrew rows.
 * @param {Record<string, { key: string, title: string }[]>} [items]  per collection key, the Hebrew items in order
 * @returns {AreaNode[]}
 */
export function buildSiteTree(items = {}) {
  /** @param {PageSpec} p @param {AreaSpec} area @param {string} [parentId] @returns {PageNode} */
  const node = (p, area, parentId) => {
    const own = (p.children ?? []).map(c => node(c, area, p.id));
    const dyn = p.dynamic
      ? (items[p.dynamic.from] ?? []).map(it => node({
        id: `${p.dynamic.prefix}:${it.key}`,
        label: it.title,
        route: p.dynamic.route.replace(':slug', it.key),
        sections: [
          { kind: 'item', key: p.dynamic.from, itemKey: it.key, label: it.title },
          ...(p.dynamic.from === 'COURSES' ? [/** @type {SectionSpec} */ ({ kind: 'link', ns: 'courseDetail', to: 'courses', label: 'טקסטים שמשותפים לכל עמודי הקורסים' })] : []),
        ],
      }, area, p.id))
      : [];
    return {
      id: p.id,
      label: p.label,
      route: p.route,
      area: area.id,
      areaLabel: area.label,
      sections: (p.sections ?? []).map((s, i) => ({ ...s, id: `${p.id}/${i}` })),
      children: [...own, ...dyn],
      aliasOf: p.aliasOf,
      alsoIn: p.alsoIn,
      note: p.note,
      masterOnly: p.masterOnly,
      parentId,
    };
  };
  return SITE_MAP.map(area => ({ id: area.id, label: area.label, pages: area.pages.map(p => node(p, area)) }));
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
