// Mock database. Aggregates all entity content into a single object so the
// api/ layer has one source of truth. All data lives in static/ - nothing else.
//
// When the real backend ships (see docs/preparing_for_db.md):
//   1. Delete this file and src/data/static/
//   2. Swap src/api/source.js to fetch from HTTP instead of importing db
//   3. The api/hooks/ layer stays unchanged - components don't notice

import { STATIC_SOURCES } from './static/sources.js';
import { STATIC_COMMUNITIES } from './static/communities.js';
import { STATIC_TOOLS } from './static/self_help_tools.js';
import { STATIC_STEPS } from './static/treatment_steps.js';
import { STATIC_CONTENT } from './static/children.js';
import { RIGHTS_FAQS } from './static/rights_faqs.js';
import { PTSD_INFO_FAQS } from './static/ptsd_info_faqs.js';
import { SECOND_CIRCLE_TOOLS } from './static/second_circle_tools.js';
import { QUESTIONNAIRE } from './static/questionnaire.js';

export const db = {
  sources: STATIC_SOURCES,
  communities: STATIC_COMMUNITIES,
  self_help_tools: STATIC_TOOLS,
  treatment_steps: STATIC_STEPS,
  children_content: STATIC_CONTENT,
  rights_faqs: RIGHTS_FAQS,
  ptsd_info_faqs: PTSD_INFO_FAQS,
  second_circle_tools: SECOND_CIRCLE_TOOLS,
  questionnaire: QUESTIONNAIRE,
};
