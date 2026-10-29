// The i18n strings (src/lib/i18n.js) that are content, so the Metiv admin shows
// them for editing, grouped by the admin page they appear on (page ids of
// src/components/admin/metivSiteMap.js). An edit is a site-copy override row
// (category `site-copy`, title = key, one row per language), so it changes the
// live PTSD-IL site too. Everything else in i18n.js (h1s, labels, buttons, nav,
// crisis lines, calming exercises, the anonymity note) stays locked.
// A key can sit on two pages when the text shows on both; it is still one row.

/** @type {Record<string, string[]>} */
export const EDITABLE_I18N = {
  // Metiv home: the "what is PTSD" paragraph is the patient home's text.
  home: ['about_ptsd_short'],
  // Footer on every page.
  siteFrame: ['footer_disclaimer'],
  patient: ['path1_subtitle', 'path2_subtitle', 'path3_subtitle', 'about_ptsd_short'],
  firstCircle: ['first_circle_welcome'],
  ptsdInfo: ['ptsd_info_subtitle'],
  selfHelp: ['self_help_intro'],
  rights: ['rights_subtitle'],
  treatment: ['treatment_subtitle'],
  community: ['community_subtitle', 'community_why_p1', 'community_why_p2'],
  children: ['children_intro'],
  secondCircle: ['second_circle_welcome'],
  secondCircleTools: ['second_circle_tools_subtitle', 'second_circle_tools_intro'],
  questionnaire: [
    'pcl_instruction',
    'questionnaire_sections_intro',
    'result_high_title',
    'result_high_text',
    'result_low_title',
    'result_low_text',
  ],
  sources: ['sources_subtitle', 'sources_approved_prefix', 'footer_partner_org'],
};

/** Every editable key once. */
export const EDITABLE_I18N_KEYS = [...new Set(Object.values(EDITABLE_I18N).flat())];
