import * as D from './data.mjs';
console.log('tx ok:', D.tx('rights_title'));
console.log('faqs', D.ptsdFaqs.length, 'self-help', D.selfHelpTools.length, 'steps', D.treatmentSteps.length);
console.log('additions keys', Object.keys(D.additions).length, 'org', Object.keys(D.org).length);
console.log('releaseJourney', Object.keys(D.releaseJourney).join(','));
console.log('aboutMetiv', Object.keys(D.aboutMetiv).join(','));
