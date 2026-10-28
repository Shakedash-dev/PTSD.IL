// The Hebrew seed (scripts/metiv-seed/he/*.json + copy/*.json) shaped like
// GET /articles rows, for tests and the admin preview. Same data the DB gets.

import { buildMetivData } from '@/pages/metiv-demos/v3/content/MetivContent';
import { COPY_SLUG, METIV_PARENT_SLUG } from '@/pages/metiv-demos/v3/content/registry';

const seedFiles = import.meta.glob('../../../scripts/metiv-seed/he/*.json', { eager: true, import: 'default' });
const copyFiles = import.meta.glob('../../../scripts/metiv-seed/copy/*.json', { eager: true, import: 'default' });

const PARENT = { slug: METIV_PARENT_SLUG, parentId: null };

/** @param {string} lang @returns {import('@/pages/metiv-demos/v3/content/MetivContent').ApiRow[]} */
export function metivSeedRows(lang = 'he') {
  /** @type {any[]} */
  const rows = [];
  for (const file of Object.values(seedFiles)) {
    const { slug, rows: items } = /** @type {any} */ (file);
    for (const r of items) {
      rows.push({
        id: `${slug}:${r._key}:${lang}`,
        groupId: `${slug}:${r._key}`,
        langId: lang,
        title: r.title,
        content: JSON.stringify(r.content),
        sortOrder: r.sortOrder,
        categories: [PARENT],
      });
    }
  }
  for (const [path, file] of Object.entries(copyFiles)) {
    const ns = path.split('/').pop()?.replace(/\.json$/, '') ?? '';
    rows.push({
      id: `${COPY_SLUG}:${ns}:${lang}`,
      groupId: `${COPY_SLUG}:${ns}`,
      langId: lang,
      title: ns,
      content: JSON.stringify({ _key: ns, _col: COPY_SLUG, ...(/** @type {any} */ (file)) }),
      sortOrder: 0,
      categories: [PARENT],
    });
  }
  return rows;
}

/** The provider's data built from the seed. */
export function metivSeedData() {
  return buildMetivData(metivSeedRows('he'));
}
