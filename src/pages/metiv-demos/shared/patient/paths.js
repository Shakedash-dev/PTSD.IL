// Maps the old PTSD-IL site paths (as they appear in API content and in the
// original pages) onto the demo IA in ../routes.js. The result is still
// site-relative; DemoLink / useDemoPath then put it inside the version base.

import { ROUTES } from '@/pages/metiv-demos/shared/routes';

/** @type {Record<string, string>} */
const LEGACY_TO_DEMO = {
  '/': ROUTES.patient,
  '/first-circle': ROUTES.firstCircle,
  '/second-circle': ROUTES.secondCircle,
  '/second-circle-tools': ROUTES.secondCircleTools,
  '/questionnaire': ROUTES.questionnaire,
  '/ptsd-info': ROUTES.ptsdInfo,
  '/ptsd-info-2': ROUTES.ptsdInfo,
  '/self-help': ROUTES.selfHelp,
  '/treatment': ROUTES.treatment,
  '/rights': ROUTES.rights,
  '/community': ROUTES.community,
  '/children': ROUTES.children,
  '/sources': ROUTES.sources,
  '/calming': ROUTES.calming,
  '/calming/breathing': ROUTES.calmingBreathing,
  '/calming/grounding': ROUTES.calmingGrounding,
  '/calming/muscle': ROUTES.calmingMuscle,
  '/privacy-policy': ROUTES.privacy,
  '/terms-of-use': ROUTES.terms,
};

/**
 * "/rights" -> "/patient/rights", "/" -> "/patient". Paths already in the demo
 * IA, external URLs, hashes, tel: and mailto: pass through unchanged.
 * @param {string} url
 * @returns {string}
 */
export function mapLegacyPath(url) {
  if (!url || !url.startsWith('/') || url.startsWith('//')) return url;
  const hashAt = url.search(/[#?]/);
  const pathname = hashAt === -1 ? url : url.slice(0, hashAt);
  const suffix = hashAt === -1 ? '' : url.slice(hashAt);
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const mapped = LEGACY_TO_DEMO[normalized];
  return mapped ? `${mapped}${suffix}` : url;
}

/**
 * Rewrites every internal Markdown link target through mapLegacyPath.
 * @param {string} markdown
 * @returns {string}
 */
export function mapLegacyMarkdown(markdown) {
  if (!markdown) return markdown;
  return markdown.replace(/\]\((\/[^)\s]*)\)/g, (_m, target) => `](${mapLegacyPath(target)})`);
}
