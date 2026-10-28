// Sends the existing מסע שחרור mentions in the patient area to the programme's
// own page (owner feedback). V3 only, so the shared entries stay as they are.
// The link label is copy (`releaseJourneyLinks.pageLink`); call this while
// rendering, inside MetivContentProvider.

import { getCopy } from '../content/MetivContent';
import { V3_ROUTES } from '../meta';

/** @typedef {import('@/pages/metiv-demos/shared/patient/additions').Entry} Entry */

/**
 * The same entries, with a link to the מסע שחרור page leading its contacts.
 * @param {Entry[]} entries
 * @returns {Entry[]}
 */
export function withReleaseJourneyPage(entries) {
  /** @type {import('@/pages/metiv-demos/shared/patient/additions').Contact} */
  const pageLink = { kind: 'internal', label: getCopy('releaseJourneyLinks').pageLink, href: V3_ROUTES.releaseJourney };
  return entries.map((e) => (e.id === 'release-journey' ? { ...e, contacts: [pageLink, ...(e.contacts || [])] } : e));
}
