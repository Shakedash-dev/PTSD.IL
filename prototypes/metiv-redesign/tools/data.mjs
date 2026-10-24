// Everything the generated pages say comes from here, and here reads the v3
// demo's own files. Nothing in tools/ invents a sentence: if a page needs a
// line the demo does not have, that is a content decision and it goes to Ofri
// in CONTENT.md first.

import fs from 'node:fs';
import { translations } from '@/lib/i18n';

export const DEMO = '/Users/ofrieven/Documents/claude/PTSD.IL/src/pages/metiv-demos/';

const json = (p) => JSON.parse(fs.readFileSync(DEMO + p, 'utf8'));

/* The patient kit's own copy layer: the shipped Hebrew strings, plus the
   rebrand overrides in shared/patient/copy.js. Mirrored rather than imported
   because copy.js imports a JSON module, which node will not load without an
   import attribute. The overrides below are copied from that file verbatim. */
const REBRAND = {
  site_name: 'מטיב - המרכז הישראלי לטיפול בפסיכוטראומה',
  path1_title: 'מתמודד/ת עם פוסט טראומה',
  path2_title: 'קרוב/ה של מתמודד/ת',
  nav_path1: 'למתמודדים',
  nav_path2: 'לבני משפחה וקרובים',
  sources_approved_prefix: 'אלה המקורות שעליהם מבוסס המידע באזור למטופלים ולמשפחות של',
};
const HE = { ...translations.he, ...REBRAND };

/** Hebrew string for an i18n key, exactly as the demo resolves it. */
export const tx = (key) => (typeof HE[key] === 'string' && HE[key] !== '' ? HE[key] : key);

/* ------------------------------------------------------------- patient data */
export const ptsdFaqs = json('shared/patient/data/ptsdInfoFaqs.json');
export const selfHelpTools = json('shared/patient/data/selfHelpTools.json');
export const rightsFaqs = json('shared/patient/data/rightsFaqs.json');
export const treatmentSteps = json('shared/patient/data/treatmentSteps.json');
export const communities = json('shared/patient/data/communities.json');
export const childrenContent = json('shared/patient/data/childrenContent.json');
export const secondCircleTools = json('shared/patient/data/secondCircleTools.json');
export const sources = json('shared/patient/data/sources.json');
export const questionnaire = json('shared/patient/data/questionnaire.json');

export * as additions from '@/pages/metiv-demos/shared/patient/additions';
export * as org from '@/pages/metiv-demos/shared/therapist/org';
export * as programs from '@/pages/metiv-demos/shared/therapist/programs';
export * as research from '@/pages/metiv-demos/shared/therapist/research';
export * as articles from '@/pages/metiv-demos/shared/therapist/articles';
export * as courses from '@/pages/metiv-demos/shared/therapist/courses';
export * as aboutMetiv from '@/pages/metiv-demos/v3/data/aboutMetiv';
export * as releaseJourney from '@/pages/metiv-demos/v3/data/releaseJourney';
export * as legal from '@/pages/metiv-demos/shared/patient/legal';
