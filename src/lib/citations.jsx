import { ROUTES, versionBase } from "@/pages/metiv-demos/shared/routes";

// Metiv rows the chatbot indexes (worker METIV_CHATBOT_SLUGS) link to the v3
// demo page that shows that collection. Release Journey is a v3-only route
// (v3/meta.js), so it is spelled out here.
const METIV_BASE = versionBase("v3");
const RELEASE_JOURNEY = "/patient/release-journey";

/** True on any /metiv-site-demo-v3 page. @param {string} pathname */
export function isMetivDemoPath(pathname) {
  return pathname === METIV_BASE || pathname.startsWith(`${METIV_BASE}/`);
}
const METIV_ROUTES = {
  "metiv-services": ROUTES.whereToGetHelp,
  "metiv-public-options": ROUTES.whereToGetHelp,
  "metiv-nonprofit-options": ROUTES.whereToGetHelp,
  "metiv-consultation": ROUTES.whereToGetHelp, // ConsultationBlock lives on this page
  "metiv-free-treatments": ROUTES.freeTreatment,
  "metiv-research-studies": ROUTES.freeTreatment,
  "metiv-veterans": ROUTES.community,
  "metiv-parent-child": ROUTES.children,
  "metiv-reservist-family": ROUTES.secondCircleTools,
  "metiv-patient-books": ROUTES.sources,
  "metiv-video-lectures": ROUTES.selfHelp,
  "metiv-release-journey": RELEASE_JOURNEY,
  "metiv-org": ROUTES.contact,
  "metiv-contacts": ROUTES.contact,
};

/** v3 route for a Metiv source, or null when none of its slugs is a Metiv one. */
export function metivRoute(slugs) {
  const list = slugs.filter(Boolean);
  for (const s of list) {
    if (METIV_ROUTES[s]) return METIV_BASE + METIV_ROUTES[s];
    if (s.startsWith("metiv-rj-")) return METIV_BASE + RELEASE_JOURNEY;
  }
  if (list.some((s) => s === "metiv" || s.startsWith("metiv-"))) return METIV_BASE + ROUTES.patient;
  return null;
}

/**
 * Page a cited source links to. Inside the v3 demo (`inMetivDemo`), PTSD-IL
 * pages are the demo's patient area, so the chip stays in the demo.
 */
export function sectionRoute(type, categorySlug, categorySlugs = [], inMetivDemo = false) {
  const metiv = metivRoute([categorySlug, ...categorySlugs]);
  if (metiv) return metiv;
  const route = ptsdIlRoute(type, categorySlug);
  return inMetivDemo ? `${METIV_BASE}/patient${route}` : route;
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
