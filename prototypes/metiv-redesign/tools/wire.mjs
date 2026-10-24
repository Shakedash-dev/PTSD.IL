// Gives every inert href="#" a destination, matched by the link's own label.
//
// The pages were written first and the menu second, so the menu still points
// at nothing in places. Matching on the visible label rather than on position
// means this stays correct when a menu is rearranged, and anything left over
// is printed at the end: those are the links that need a decision from Ofri,
// not a page we can build.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as D from './data.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** label (exact, trimmed) -> file */
const BY_LABEL = {
  // patient area
  'חוויתי אירוע קשה': 'first-circle.html',
  'מישהו קרוב אליי מתמודד': 'second-circle.html',
  'שאלון אנונימי': 'questionnaire.html',
  'לשאלון': 'questionnaire.html',
  'לשאלון האנונימי': 'questionnaire.html',
  'תרגילי הרגעה': 'calming.html',
  'עזרה עצמית': 'self-help.html',
  'כלים לבני משפחה': 'second-circle-tools.html',
  'לדבר עם ילדים': 'children.html',
  'מקורות': 'sources.html',
  'טיפולים ללא עלות ומחקרים': 'free-treatment.html',
  'לפירוט המסגרות': 'free-treatment.html',
  'המסע הטיפולי': 'treatment.html',
  'זכויות': 'rights.html',
  'קהילות תמיכה': 'community.html',
  // professional area
  'הדרכה למטפלים': 'supervision.html',
  'הדרכה': 'supervision.html',
  'ילדים ומשפחה': 'children-family.html',
  'תוכניות לארגונים': 'organizations.html',
  'לארגונים': 'organizations.html',
  'מחקר': 'research.html',
  'מחקרים פעילים': 'research.html',
  'פרסומים': 'publications.html',
  'מחקר ופרסומים': 'research.html',
  'מאמרים': 'articles.html',
  'אירועים ועדכונים': 'events.html',
  'לכל האירועים והעדכונים': 'events.html',
  // organisation
  'הסיפור של מטיב': 'history.html',
  'הצוות': 'team.html',
  'השותפים שלנו': 'partners.html',
  'שיתופי פעולה': 'collaborations.html',
  'לכל שיתופי הפעולה': 'collaborations.html',
  'הצהרת נגישות': 'accessibility.html',
  'מדיניות פרטיות': 'privacy.html',
  'תנאי שימוש': 'terms.html',
  'למי לפנות בכל נושא': 'contact.html',
  'דרכים נוספות לתרום': 'donate.html',
  // the six service cards on the home page: four are frameworks on the
  // frameworks page, two belong to the professional area
  'מרפאת המבוגרים': 'where-to-get-help.html#adults-clinic',
  'מטיב ילדים': 'where-to-get-help.html#kids-clinic',
  'מרפאת מגדלור': 'where-to-get-help.html#migdalor',
  'יחידת ההכשרות': 'courses.html',
  'יחידת המחקר': 'research.html',
  'טיפולים ללא עלות דרך מטיב': 'where-to-get-help.html#free-treatment-entry',
  'לא בטוח/ה מה עובר עליי': 'questionnaire.html',
  'לכלים לעזרה עצמית': 'self-help.html',
};

/* מסע שחרור exists twice, written for two readers. Which one a link means
   depends on the menu it sits in, so it is resolved by the file and the
   surrounding panel rather than by the label alone. */
const RELEASE = { patient: 'release-journey.html', therapist: 'release-journey-pro.html' };

/* Links that point at something outside the prototype. Taken from the demo's
   own ORG record, so they are the organisation's real addresses. */
const O = D.org.ORG;
const EXTERNAL = {
  'לתרומה מאובטחת': O.donateUrl,
  'תרומה': 'donate.html',
  'לדרכי התרומה': 'donate.html',
  'טופס פנייה להכשרה או הדרכה': O.trainingsFormUrl,
  'טופס פנייה להכשרה': O.trainingsFormUrl,
  'לפרטים ולפנייה': 'organizations.html',
  'טופס פנייה למרפאה': O.adultsClinicFormUrl,
  'טופס פנייה למרפאת המבוגרים': O.adultsClinicFormUrl,
  'טופס פנייה למטיב ילדים': O.kidsClinicFormUrl,
};

/* Labels the demo itself gives an address to: every contact and every link in
   the frameworks, the treatment steps and the services. Collected rather than
   typed out, so a URL here is the demo's and not one I remembered. */
const FROM_DEMO = {};
const ROUTE_TO_FILE = {
  '/patient/rights': 'rights.html',
  '/patient/where-to-get-help': 'where-to-get-help.html',
  '/patient/free-treatment-and-research': 'free-treatment.html',
  '/patient/self-help': 'self-help.html',
  '/self-help': 'self-help.html',
  '/patient/calming': 'calming.html',
  '/patient/community': 'community.html',
  '/patient/questionnaire': 'questionnaire.html',
  '/patient/children': 'children.html',
  '/patient/treatment': 'treatment.html',
  '/therapist/courses': 'courses.html',
};
const asHref = (raw) => {
  const v = String(raw || '');
  if (ROUTE_TO_FILE[v]) return ROUTE_TO_FILE[v];
  if (/^https?:/.test(v)) return v;
  if (/^[\d*-]+$/.test(v)) return 'tel:' + v.replace(/[^\d*]/g, '');
  if (/@/.test(v)) return 'mailto:' + v;
  return null;
};
for (const group of ['PUBLIC_OPTIONS', 'NONPROFIT_OPTIONS', 'METIV_SERVICES', 'FREE_TREATMENTS', 'RESEARCH_STUDIES', 'VETERANS_PROGRAMS', 'PARENT_CHILD_GROUPS', 'RESERVIST_FAMILY_PROGRAMS']) {
  for (const option of D.additions[group] || []) {
    for (const c of option.contacts || []) {
      const href = asHref(c.href || c.value);
      if (href && c.label && !FROM_DEMO[c.label]) FROM_DEMO[c.label] = href;
    }
  }
}
for (const step of D.treatmentSteps) {
  for (const l of step.links || []) {
    const href = asHref(l.url);
    if (href && !FROM_DEMO[l.label]) FROM_DEMO[l.label] = href;
  }
}

const strip = (html) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

/* A card carries a title and a description inside the same <a>. The title is
   what names the destination, so it is read on its own when there is one. */
const labelOf = (inner) => {
  const title = inner.match(/<(h[2-6]|b|strong)\b[^>]*>([\s\S]*?)<\/\1>/);
  return strip(title ? title[2] : inner);
};

const unresolved = [];
let rewritten = 0;

for (const file of [...fs.readdirSync(ROOT).filter((f) => f.endsWith('.html')),
  ...fs.readdirSync(path.join(ROOT, 'partials')).map((f) => path.join('partials', f))]) {
  const full = path.join(ROOT, file);
  let html = fs.readFileSync(full, 'utf8');

  html = html.replace(/<a\b([^>]*?)href="#"([^>]*)>([\s\S]*?)<\/a>/g, (whole, before, after, inner) => {
    const label = labelOf(inner);
    let target = BY_LABEL[label] || EXTERNAL[label] || FROM_DEMO[label];

    if (!target && label === 'מסע שחרור') {
      // the professional menu panel is the one with id="mega-therapists"
      const at = html.indexOf(whole);
      const panel = html.lastIndexOf('id="mega-', at);
      const which = html.slice(panel, panel + 30).includes('therapists') ? 'therapist' : 'patient';
      target = RELEASE[which];
    }
    if (!target && label === 'לעמוד מסע שחרור') target = RELEASE.patient;

    if (!target) { unresolved.push(`${file}: "${label}"`); return whole; }
    rewritten++;
    return `<a${before}href="${target}"${after}>${inner}</a>`;
  });

  fs.writeFileSync(full, html);
}

console.log(`${rewritten} links wired`);
if (unresolved.length) {
  console.log('\nstill inert - these need an address or a decision:');
  const seen = new Set();
  for (const u of unresolved) {
    const label = u.split('"')[1];
    if (seen.has(label)) continue;
    seen.add(label);
    console.log('  ' + u);
  }
}
