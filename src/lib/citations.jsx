const ROUTES = {
  source: "/sources",
  treatment_step: "/treatment",
  tool: "/self-help",
  book: "/children",
  activity: "/children",
  story: "/children",
  video: "/children",
  article: "/children",
  faq: "/rights",
};

export function sectionRoute(type) {
  return ROUTES[type] ?? "/";
}
