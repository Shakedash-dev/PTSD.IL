import { ROUTES, versionBase } from "@/pages/metiv-demos/shared/routes";
import { t } from "@/lib/i18n";

// Metiv rows the chatbot indexes (worker METIV_CHATBOT_SLUGS) link to the v3
// demo page that shows that collection. The v3-only routes (v3/meta.js
// V3_ROUTES) are spelled out here so the shared chat panel does not load the
// demo; test/citations.test.jsx checks them against meta.js.
const METIV_BASE = versionBase("v3");
export const V3_ONLY_ROUTES = {
  aboutHistory: "/about/history",
  aboutTeam: "/about/team",
  aboutPartners: "/about/partners",
  aboutCollaborations: "/about/collaborations",
  releaseJourney: "/patient/release-journey",
};
const R = { ...ROUTES, ...V3_ONLY_ROUTES };

/** True on any /metiv-site-demo-v3 page. @param {string} pathname */
export function isMetivDemoPath(pathname) {
  return pathname === METIV_BASE || pathname.startsWith(`${METIV_BASE}/`);
}

const under = (/** @type {string} */ rel, /** @type {string} */ route) => rel === route || rel.startsWith(`${route}/`);

/**
 * The site area a path belongs to, sent with each chat request so the bot can
 * pick its audience. Only the v3 demo has areas; elsewhere it is undefined and
 * the request carries no `area`. The "about Metiv" pages count as Metiv pages.
 * @param {string} pathname
 * @returns {'patient'|'therapist'|'metiv'|undefined}
 */
export function chatArea(pathname) {
  if (!isMetivDemoPath(pathname)) return undefined;
  const rel = pathname.slice(METIV_BASE.length) || "/";
  if (under(rel, ROUTES.patient)) return "patient";
  if (under(rel, ROUTES.therapist)) return "therapist";
  return "metiv";
}

/** @typedef {{ key?: string, section?: string }} SourceRef */

const anchor = (/** @type {string} */ route) => (/** @type {SourceRef} */ { key }) => (key ? `${route}#${encodeURIComponent(key)}` : route);
const legalDoc = (/** @type {SourceRef} */ { section }) => (section === "terms" ? R.terms : R.privacy);

/** @type {Record<string, string | ((ref: SourceRef) => string)>} */
const METIV_ROUTES = {
  // General / about Metiv
  "metiv-org": R.contact,
  "metiv-contacts": R.contact,
  "metiv-about": R.aboutHistory,
  "metiv-facts": R.aboutHistory,
  "metiv-team": R.aboutTeam,
  "metiv-department-groups": ({ key }) => (key ? `${R.about}#about-${encodeURIComponent(key)}` : R.about),
  "metiv-partners": R.aboutCollaborations,
  "metiv-funders": R.aboutPartners,
  "metiv-partner-groups": R.aboutPartners,
  "metiv-collaboration-groups": R.aboutCollaborations,
  "metiv-collaboration-contact": R.aboutCollaborations,
  "metiv-donate": R.donate,
  "metiv-legal-docs": legalDoc, // privacy + terms, one section each
  "metiv-legal": ({ section }) => (section === "privacy" ? R.privacy : R.accessibility),
  // Patient area
  "metiv-services": R.whereToGetHelp,
  "metiv-public-options": R.whereToGetHelp,
  "metiv-nonprofit-options": R.whereToGetHelp,
  "metiv-consultation": R.whereToGetHelp, // ConsultationBlock lives on this page
  "metiv-free-treatments": R.freeTreatment,
  "metiv-research-studies": R.freeTreatment,
  "metiv-veterans": R.community,
  "metiv-parent-child": R.children,
  "metiv-reservist-family": R.secondCircleTools,
  "metiv-patient-books": R.sources,
  "metiv-books-note": R.sources,
  "metiv-video-lectures": R.selfHelp,
  "metiv-treatment-where": R.treatment,
  "metiv-patient-hub": R.patient,
  // One section per patient page, named by its route key.
  "metiv-short-versions": ({ section }) => (section && R[section]?.startsWith(R.patient) ? R[section] : R.patient),
  "metiv-release-journey": R.releaseJourney,
  // Therapist area
  "metiv-therapist-hub": R.therapist,
  "metiv-courses": ({ key }) => (key ? `${R.courses}/${encodeURIComponent(key)}` : R.courses),
  "metiv-course-categories": R.courses,
  "metiv-supervision": R.supervision,
  "metiv-org-programs": anchor(R.organizations),
  "metiv-children-family": R.childrenFamily,
  "metiv-research-intro": R.research,
  "metiv-studies": anchor(R.research),
  "metiv-books": R.publications,
  "metiv-papers": R.publications,
  "metiv-paper-topics": R.publications,
  "metiv-articles": ({ key }) => (key ? `${R.articles}/${encodeURIComponent(key)}` : R.articles),
  "metiv-events": R.events,
};

/**
 * v3 route for a Metiv source, or null when none of its slugs is a Metiv one.
 * `ref` carries the row's `_key` and section (worker vector metadata) for deep links.
 * @param {(string|undefined)[]} slugs
 * @param {SourceRef} [ref]
 */
export function metivRoute(slugs, ref = {}) {
  const list = slugs.filter(Boolean);
  for (const s of list) {
    const route = METIV_ROUTES[s];
    if (route) return METIV_BASE + (typeof route === "function" ? route(ref) : route);
    if (s.startsWith("metiv-rj-")) return METIV_BASE + R.releaseJourney;
  }
  if (list.some((s) => s === "metiv" || s.startsWith("metiv-"))) return METIV_BASE + R.patient;
  return null;
}

// PTSD-IL legal rows are titled with their page slug.
const ptsdIlLegal = (/** @type {string|undefined} */ title) => (title === "terms-of-use" ? ROUTES.terms : ROUTES.privacy);

/**
 * Page a cited source links to. Inside the v3 demo (`inMetivDemo`), PTSD-IL
 * pages are the demo's patient area, so the chip stays in the demo; the legal
 * pages sit at the demo root.
 * @param {string} type
 * @param {string} [categorySlug]
 * @param {string[]} [categorySlugs]
 * @param {boolean} [inMetivDemo]
 * @param {SourceRef & { title?: string }} [ref]
 */
export function sectionRoute(type, categorySlug, categorySlugs = [], inMetivDemo = false, ref = {}) {
  const metiv = metivRoute([categorySlug, ...categorySlugs], ref);
  if (metiv) return metiv;
  if (categorySlug === "legal") return (inMetivDemo ? METIV_BASE : "") + ptsdIlLegal(ref.title);
  const route = ptsdIlRoute(type, categorySlug);
  return inMetivDemo ? `${METIV_BASE}/patient${route}` : route;
}

/**
 * Route for one `sources` entry of the chat stream.
 * @param {{ type: string, categorySlug?: string, categorySlugs?: string[], key?: string, section?: string, title?: string }} s
 * @param {boolean} [inMetivDemo]
 */
export function sourceRoute(s, inMetivDemo = false) {
  return sectionRoute(s.type, s.categorySlug, s.categorySlugs, inMetivDemo, { key: s.key, section: s.section, title: s.title });
}

/**
 * Chip label for a source. The legal documents are titled with a slug or a
 * collection key, so they get the page name in the UI language instead.
 * @param {{ title: string, categorySlug?: string, categorySlugs?: string[], section?: string }} s
 * @param {string} lang
 */
// Metiv singleton rows with no title of their own reach the chip with their
// collection key ("CONTACTS"); name the page they come from instead.
const KEY_TITLES = {
  contact: { he: "יצירת קשר", ar: "اتصل بنا", en: "Contact us", ru: "Связаться с нами", fr: "Nous contacter" },
  releaseJourney: { he: "מסע שחרור", ar: "Peace of Mind", en: "Peace of Mind", ru: "Peace of Mind", fr: "Peace of Mind" },
  patient: { he: "למטופלים ולמשפחות", ar: "للمتعالجين والعائلات", en: "For patients and families", ru: "Для клиентов и семей", fr: "Patients et familles" },
  sources: { he: "מקורות", ar: "المصادر", en: "Sources", ru: "Источники", fr: "Sources" },
  accessibility: { he: "הצהרת נגישות", ar: "بيان إمكانية الوصول", en: "Accessibility statement", ru: "Заявление о доступности", fr: "Déclaration d'accessibilité" },
};
const KEY_PAGE = {
  CONTACTS: "contact", ORG: "contact", COLLABORATION_CONTACT: "contact",
  RELEASE_JOURNEY_CONTACTS: "releaseJourney", RELEASE_JOURNEY_WAITING: "releaseJourney", RELEASE_JOURNEY: "releaseJourney",
  PATIENT_HUB: "patient", METIV_BOOKS_ORDER_NOTE: "sources", LEGAL: "accessibility",
};

export function sourceTitle(s, lang) {
  if (Object.hasOwn(KEY_PAGE, s.title ?? "")) {
    const names = KEY_TITLES[KEY_PAGE[s.title]];
    return names[lang] ?? names.he;
  }
  const slugs = [s.categorySlug, ...(s.categorySlugs ?? [])];
  let doc = null;
  if (slugs.includes("metiv-legal-docs")) doc = legalDoc(s);
  else if (s.categorySlug === "legal") doc = ptsdIlLegal(s.title);
  if (!doc) return s.title;
  return t(lang, doc === ROUTES.terms ? "terms_of_use" : "privacy_policy");
}

function ptsdIlRoute(type, categorySlug) {
  if (type === "faq") {
    if (categorySlug === "ptsd-info") return "/ptsd-info";
    if (categorySlug === "second-circle") return "/second-circle-tools";
    return "/rights"; // rights or missing (safe fallback)
  }
  switch (type) {
    case "source": return "/sources";
    case "tool": return "/self-help";
    case "treatment_step": return "/treatment";
    case "community": return "/community";
    default: return "/children"; // article, book, activity, story, video
  }
}
