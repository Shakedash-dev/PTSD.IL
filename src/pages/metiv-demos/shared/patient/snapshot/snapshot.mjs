// One-off snapshot of the live content API for the Metiv demo patient kit.
// Reuses the real adapters in src/api/source.js so every JSON file has exactly
// the shape the original pages consume. Never imported at runtime.
//
// Run from src/:
//   VITE_API_URL=https://ptsd-il-api.onrender.com/api npx vite-node pages/metiv-demos/shared/patient/snapshot/snapshot.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  fetchSources,
  fetchCommunities,
  fetchSelfHelpTools,
  fetchTreatmentSteps,
  fetchChildrenContent,
  fetchRightsFaqs,
  fetchPTSDInfoFaqs,
  fetchSecondCircleTools,
  fetchQuestionnaire,
  fetchSiteCopy,
  fetchLegalDocs,
} from '@/api/source';

const lang = 'he';
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');

// Every category Rights.jsx offers as a tab.
const RIGHTS_CATEGORIES = ['security_forces', 'sexual_harassment', 'hostilities', 'accidents_work', 'general'];

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const rights = {};
  for (const category of RIGHTS_CATEGORIES) {
    rights[category] = await fetchRightsFaqs({ lang, category });
  }
  const files = {
    sources: await fetchSources({ lang }),
    communities: await fetchCommunities({ lang }),
    selfHelpTools: await fetchSelfHelpTools({ lang }),
    treatmentSteps: await fetchTreatmentSteps({ lang }),
    childrenContent: await fetchChildrenContent({ lang }),
    rightsFaqs: rights,
    ptsdInfoFaqs: await fetchPTSDInfoFaqs({ lang }),
    secondCircleTools: await fetchSecondCircleTools({ lang }),
    questionnaire: await fetchQuestionnaire({ lang, slug: 'pcl-5' }),
    siteCopy: await fetchSiteCopy({ lang }),
    legalDocs: await fetchLegalDocs({ lang }),
  };
  for (const [name, data] of Object.entries(files)) {
    fs.writeFileSync(path.join(OUT, `${name}.json`), `${JSON.stringify(data, null, 2)}\n`);
    const size = Array.isArray(data) ? data.length : Object.keys(data).length;
    console.log(`${name}.json: ${size}`);
  }
}

main().catch((err) => {
  console.error(err);
  throw err;
});
