// Static content for the patient kit: a Hebrew snapshot of the live content API,
// produced by ./snapshot/snapshot.mjs through the real adapters in
// src/api/source.js, so each shape is exactly what the original pages consume.
// Nothing here fetches. Snapshot taken 2026-09-13.

import sources from './data/sources.json';
import communities from './data/communities.json';
import selfHelpTools from './data/selfHelpTools.json';
import treatmentSteps from './data/treatmentSteps.json';
import childrenContent from './data/childrenContent.json';
import rightsFaqs from './data/rightsFaqs.json';
import ptsdInfoFaqs from './data/ptsdInfoFaqs.json';
import secondCircleTools from './data/secondCircleTools.json';
import questionnaire from './data/questionnaire.json';
import siteCopy from './data/siteCopy.json';
import legalDocs from './data/legalDocs.json';

export const SNAPSHOT_DATE = '2026-09-13';

/**
 * @typedef {{ title: string, authors?: string, year?: string, url?: string, description_he: string, category: string }} Source
 * @typedef {{ id: string, name: string, organization?: string, description_he: string, target_audience: string[], location?: string, meeting_type?: string, contact_url?: string, photo?: string }} Community
 * @typedef {{ title_he: string, description_he: string, ios_url: string, android_url: string }} SelfHelpApp
 * @typedef {{ category: string, icon: string, title_he: string, content_he: string, apps: SelfHelpApp[] }} SelfHelpTool
 * @typedef {{ label: string, url: string }} LinkItem
 * @typedef {{ title_he: string, description_he: string, how_to_start_he: string, links: LinkItem[] }} TreatmentMethod
 * @typedef {{ step_number: number, icon: string, title_he: string, description_he: string, how_to_start_he: string, methods: TreatmentMethod[], links: LinkItem[] }} TreatmentStep
 * @typedef {{ type: string, title_he: string, description_he: string, content_he: string, cta_label: string, cta_url: string, url?: string }} ChildrenResource
 * @typedef {{ guidelines: string, resources: ChildrenResource[] }} ChildrenAgeGroup
 * @typedef {{ q: string, a: string, steps: string, links: LinkItem[] }} RightsFaq
 * @typedef {'security_forces'|'sexual_harassment'|'hostilities'|'accidents_work'|'general'} RightsCategory
 * @typedef {{ q: string, a: string }} PTSDInfoFaq
 * @typedef {{ q: string, intro: string, sections: { heading: string, body: string }[], closing: string, callout: string }} SecondCircleTool
 * @typedef {{ order: number, score: number, answer: string }} QuestionOption
 * @typedef {{ id?: string, sortOrder: number, text: string, options: QuestionOption[] }} Question
 * @typedef {{ id?: string, slug: string, name: string, description: string, totalQuestions: number, maxScore: number, cutoffScore: number, questions: Question[] }} Questionnaire
 * @typedef {{ body: string, updated: string }} LegalDoc
 */

/** @returns {Source[]} */
export const getSources = () => sources;

/** @returns {Community[]} */
export const getCommunities = () => communities;

/** @returns {SelfHelpTool[]} */
export const getSelfHelpTools = () => selfHelpTools;

/** @returns {TreatmentStep[]} */
export const getTreatmentSteps = () => treatmentSteps;

/** @returns {Record<string, ChildrenAgeGroup>} */
export const getChildrenContent = () => childrenContent;

/**
 * Same result as fetchRightsFaqs({ lang: 'he', category }): the category's own
 * FAQs followed by the shared general ones.
 * @param {string} category
 * @returns {RightsFaq[]}
 */
export const getRightsFaqs = (category) => /** @type {Record<string, RightsFaq[]>} */ (rightsFaqs)[category] ?? [];

/** @returns {PTSDInfoFaq[]} */
export const getPTSDInfoFaqs = () => ptsdInfoFaqs;

/** @returns {SecondCircleTool[]} */
export const getSecondCircleTools = () => secondCircleTools;

/** @returns {Questionnaire} */
export const getQuestionnaire = () => /** @type {Questionnaire} */ (questionnaire);

/** Hebrew site-copy overrides (i18n key -> text). Empty at snapshot time. */
/** @returns {Record<string, string>} */
export const getSiteCopy = () => siteCopy;

/** Legal document overrides keyed by slug. Empty at snapshot time. */
/** @returns {Record<string, LegalDoc>} */
export const getLegalDocs = () => legalDocs;
