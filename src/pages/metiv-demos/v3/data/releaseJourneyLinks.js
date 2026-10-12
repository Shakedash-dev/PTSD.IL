// Sends the existing מסע שחרור mentions in the patient area to the programme's
// own page (owner feedback). V3 only, so the shared entries stay as they are.

import { V3_ROUTES } from '../meta';

/** @typedef {import('@/pages/metiv-demos/shared/patient/additions').Entry} Entry */

/** @type {import('@/pages/metiv-demos/shared/patient/additions').Contact} */
const PAGE_LINK = { kind: 'internal', label: 'לעמוד מסע שחרור', href: V3_ROUTES.releaseJourney };

/**
 * The same entries, with a link to the מסע שחרור page leading its contacts.
 * @param {Entry[]} entries
 * @returns {Entry[]}
 */
export function withReleaseJourneyPage(entries) {
  return entries.map((e) => (e.id === 'release-journey' ? { ...e, contacts: [PAGE_LINK, ...(e.contacts || [])] } : e));
}
