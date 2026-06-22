// Data source layer. The ONLY file in src/api/ that knows where data
// physically lives. When the real backend ships, replace each function with an
// HTTP fetch. Signatures stay the same so the rest of the stack is unaffected.
//
// All functions return Promises and a tiny artificial delay (0ms by default,
// can be bumped to simulate network for testing loading states).

import { db } from '@/data/db';

const ARTIFICIAL_DELAY_MS = 0;

function resolveLater(value) {
  if (ARTIFICIAL_DELAY_MS === 0) return Promise.resolve(value);
  return new Promise(res => setTimeout(() => res(value), ARTIFICIAL_DELAY_MS));
}

export function fetchSources() {
  return resolveLater(db.sources);
}

export function fetchCommunities() {
  return resolveLater(db.communities);
}

export function fetchSelfHelpTools() {
  return resolveLater(db.self_help_tools);
}

export function fetchTreatmentSteps() {
  return resolveLater(db.treatment_steps);
}

export function fetchChildrenContent() {
  return resolveLater(db.children_content);
}

// Rights FAQs are bucketed by lang then category in the source data.
// Returns the items for a given (lang, category), with general-category
// items appended (matches the behavior in lib/pageContent.js#getRightsFaqs).
export function fetchRightsFaqs({ lang = 'he', category }) {
  const langData = db.rights_faqs[lang] || db.rights_faqs.he;
  const specific = langData[category] || db.rights_faqs.he[category] || [];
  if (category === 'general') return resolveLater(specific);
  const general = langData.general || db.rights_faqs.he.general || [];
  return resolveLater([...specific, ...general]);
}

export function fetchPTSDInfoFaqs({ lang = 'he' }) {
  return resolveLater(db.ptsd_info_faqs[lang] || db.ptsd_info_faqs.he);
}

export function fetchSecondCircleTools({ lang = 'he' }) {
  return resolveLater(db.second_circle_tools[lang] || db.second_circle_tools.he);
}
