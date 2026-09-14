// The information architecture every version implements. Paths are relative to
// the version base (/metiv-site-demo-vN). All four versions expose exactly these
// routes so they can be compared page by page. Versions choose how pages look,
// never which pages exist.

export const DEMO_VERSIONS = ['v1', 'v2', 'v3', 'v4'];

/** @param {string} version */
export const versionBase = (version) => `/metiv-site-demo-${version}`;

export const ROUTES = {
  // ── Metiv (general) ──
  home: '/',
  about: '/about',
  donate: '/donate',
  contact: '/contact',
  privacy: '/privacy-policy',
  terms: '/terms-of-use',
  accessibility: '/accessibility',

  // ── Area B: for patients and families (the former PTSD-IL site, now Metiv) ──
  patient: '/patient',
  firstCircle: '/patient/first-circle',
  secondCircle: '/patient/second-circle',
  secondCircleTools: '/patient/second-circle-tools',
  questionnaire: '/patient/questionnaire',
  ptsdInfo: '/patient/ptsd-info',
  selfHelp: '/patient/self-help',
  treatment: '/patient/treatment',
  whereToGetHelp: '/patient/where-to-get-help', // new: suggestion 1 (+ 8, consultation)
  freeTreatment: '/patient/free-treatment-and-research', // new: suggestion 2
  rights: '/patient/rights',
  community: '/patient/community', // + suggestion 3 (veterans and reservists)
  children: '/patient/children', // + suggestion 4 (parent and child groups)
  sources: '/patient/sources', // + suggestion 6 (books)
  calming: '/patient/calming',
  calmingBreathing: '/patient/calming/breathing',
  calmingGrounding: '/patient/calming/grounding',
  calmingMuscle: '/patient/calming/muscle',

  // ── Area C: for therapists and professionals ──
  therapist: '/therapist',
  courses: '/therapist/courses',
  course: '/therapist/courses/:slug',
  childrenFamily: '/therapist/children-and-family',
  supervision: '/therapist/supervision',
  organizations: '/therapist/organizations',
  research: '/therapist/research',
  publications: '/therapist/publications',
  articles: '/therapist/articles',
  article: '/therapist/articles/:slug',
  events: '/therapist/events',
};
