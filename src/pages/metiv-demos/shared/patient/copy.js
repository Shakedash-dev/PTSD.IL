// Hebrew UI strings for the patient kit.
//
// Starts from the shipped Hebrew strings in @/lib/i18n (read-only), applies the
// Hebrew site-copy overrides captured in the snapshot (the same override layer
// LanguageProvider installs on the live site), then applies the Metiv rebrand.
// Hebrew and RTL are fixed: nothing here reads the visitor's saved language.

import { translations } from '@/lib/i18n';
import siteCopy from './data/siteCopy.json';

export const SITE_NAME = 'מטיב - המרכז הישראלי לטיפול בפסיכוטראומה';
export const SITE_SHORT_NAME = 'מטיב';

// Keys whose shipped wording names the old brand or credits Metiv as an outside
// partner. The patient area IS Metiv now, so the credit wording goes away.
/** @type {Record<string, string>} */
const REBRAND = {
  site_name: SITE_NAME,
  footer_partner_org: SITE_NAME,
  footer_credit_prefix: '',
  // The shipped titles are fragments that the old wordmark completed visually
  // ("מתמודד/ת עם" + PTSD). Without that brand they read as cut off.
  path1_title: 'מתמודד/ת עם פוסט טראומה',
  path2_title: 'קרוב/ה של מתמודד/ת',
  nav_path1: 'למתמודדים',
  nav_path2: 'לבני משפחה וקרובים',
  sources_approved_prefix: 'אלה המקורות שעליהם מבוסס המידע באזור למטופלים ולמשפחות של',
  seo_desc_sources: 'המקורות המקצועיים שעליהם מבוסס המידע באזור למטופלים ולמשפחות.',
  // The chatbot has no backend in the demo; these keys are no longer rendered,
  // but keep them free of promises about a feature that does not exist.
  chatbot_soon: '',
  chatbot_description: '',
};

/** @type {Record<string, any>} */
const HE = { ...translations.he, ...siteCopy, ...REBRAND };

/**
 * Hebrew string for an i18n key. Falls back to the key itself, like t().
 * @param {string} key
 * @returns {string}
 */
export function tx(key) {
  const value = HE[key];
  return typeof value === 'string' && value !== '' ? value : key;
}

/**
 * Like tx() but returns '' for a missing key instead of echoing the key.
 * @param {string} key
 * @returns {string}
 */
export function txOptional(key) {
  const value = HE[key];
  return typeof value === 'string' ? value : '';
}

/**
 * Replace old-brand wording in free text (legal documents, stray content).
 * @param {string} text
 * @returns {string}
 */
export function rebrandText(text) {
  if (!text) return text;
  return text
    .replace(/https?:\/\/(?:www\.)?ptsd-il\.site\/?/gi, 'https://metiv.org/')
    .replace(/ptsd-il\.site/gi, 'metiv.org')
    .replace(/PTSD[.-]IL/gi, SITE_SHORT_NAME);
}
