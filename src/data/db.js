// Mock database. Aggregates all entity content into a single object so the
// api/ layer has one source of truth.
//
// When the real backend ships (see docs/preparing_for_db.md):
//   1. Delete this file and src/data/static/
//   2. Swap src/api/source.js to fetch from HTTP instead of importing db
//   3. The api/hooks/ layer stays unchanged - components don't notice
//
// Why some entities live in src/data/static/ and others in their original
// locations: the small, simple entities (sources, communities) were extracted
// to pure-data files. The larger multi-language content blocks (FAQs, treatment
// steps, etc.) are still defined inline in their pages/lib modules and
// re-exported from there - moving them risks corrupting Hebrew/Arabic strings,
// and the API client doesn't care where the import comes from.

import { STATIC_SOURCES } from './static/sources.js';
import { STATIC_COMMUNITIES } from './static/communities.js';
import { STATIC_TOOLS as SELF_HELP_TOOLS } from '@/pages/SelfHelp';
import { STATIC_STEPS as TREATMENT_STEPS } from '@/pages/Treatment';
import { STATIC_CONTENT as CHILDREN_CONTENT } from '@/pages/Children';
import {
  RIGHTS_FAQS,
  PTSD_INFO_FAQS,
  SECOND_CIRCLE_TOOLS,
} from '@/lib/pageContent';

export const db = {
  sources: STATIC_SOURCES,
  communities: STATIC_COMMUNITIES,
  self_help_tools: SELF_HELP_TOOLS,
  treatment_steps: TREATMENT_STEPS,
  children_content: CHILDREN_CONTENT,
  rights_faqs: RIGHTS_FAQS,
  ptsd_info_faqs: PTSD_INFO_FAQS,
  second_circle_tools: SECOND_CIRCLE_TOOLS,
};
