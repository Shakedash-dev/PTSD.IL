#!/usr/bin/env node
// Writes the Metiv seed into the live content API. Dry run by default; --apply
// writes. Idempotent: rows are matched by (collection, language, _key) and only
// changed ones are PATCHed. Never triggers a chatbot reindex.
//
//   node scripts/metiv-seed/import.mjs                    # dry run, Hebrew
//   node scripts/metiv-seed/import.mjs --apply            # write Hebrew
//   node scripts/metiv-seed/import.mjs --lang ar --apply  # write a translation
//   node scripts/metiv-seed/import.mjs --qa --apply       # chatbot Q&A rows
//
// Hebrew comes from he/*.json and copy/*.json; a translation from
// <lang>/*.json and <lang>/copy/*.json (same shape, translated content and
// title), linked to the Hebrew row by groupId. Q&A rows: chatbot-qa/<lang>.json.
// Needs ADMIN_TOKEN in the repo's .env.admin. Model: docs/metiv-db-spec.md.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const API = process.env.API_URL ?? 'https://ptsd-il-api.onrender.com/api';
const UA = 'ptsd-il-metiv-seed/1.0';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const QA = args.includes('--qa');
const LANG = args.includes('--lang') ? args[args.indexOf('--lang') + 1] : 'he';
if (!['he', 'ar', 'en', 'ru', 'fr'].includes(LANG)) throw new Error(`bad --lang ${LANG}`);

const TOKEN = (fs.readFileSync(path.join(root, '.env.admin'), 'utf8').match(/^ADMIN_TOKEN=(.+)$/m) ?? [])[1]?.trim();
if (!TOKEN) throw new Error('ADMIN_TOKEN missing from .env.admin');

const { COLLECTIONS, COPY_SLUG, METIV_PARENT_SLUG } = await import(
  path.join(root, 'src/pages/metiv-demos/v3/content/registry.js')
);
const QA_SLUG = 'chatbot-qa';

/** @param {string} p @param {RequestInit} [init] */
async function api(p, init = {}) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${API}${p}`, {
      ...init,
      headers: { 'User-Agent': UA, Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    });
    if (res.ok) return res.status === 204 ? null : res.json().catch(() => null);
    const body = await res.text();
    if (res.status >= 500 && attempt < 4) {
      await new Promise((r) => setTimeout(r, 1500 * attempt));
      continue;
    }
    throw new Error(`${init.method ?? 'GET'} ${p} -> ${res.status} ${body.slice(0, 300)}`);
  }
}

/** @param {string} slug @param {string} name @param {string|null} parentId */
async function ensureCategory(slug, name, parentId) {
  if (parentId?.startsWith('<new')) return `<new:${slug}>`;
  const list = await api(parentId ? `/categories?parentId=${parentId}` : '/categories');
  const found = list.find((/** @type {any} */ c) => c.slug === slug);
  if (found) return found.id;
  if (!APPLY) return `<new:${slug}>`;
  const created = await api('/admin/categories', { method: 'POST', body: JSON.stringify({ slug, name, parentId }) });
  console.log(`  + category ${slug}`);
  return created.id;
}

/** @param {string} file */
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

// ── desired rows ─────────────────────────────────────────────────────────────

/** @typedef {{ slug: string, key: string, title: string, sortOrder: number, content: any }} Desired */

/** @returns {Desired[]} */
function desiredMetiv() {
  const base = path.join(here, LANG);
  /** @type {Desired[]} */
  const out = [];
  for (const col of COLLECTIONS) {
    const file = path.join(base, `${col.slug}.json`);
    if (!fs.existsSync(file)) {
      if (LANG === 'he') throw new Error(`missing ${file}`);
      continue;
    }
    for (const r of readJson(file).rows) out.push({ slug: col.slug, key: r._key, title: r.title, sortOrder: r.sortOrder, content: r.content });
  }
  const copyDir = LANG === 'he' ? path.join(here, 'copy') : path.join(base, 'copy');
  if (fs.existsSync(copyDir)) {
    for (const f of fs.readdirSync(copyDir).filter((x) => x.endsWith('.json')).sort()) {
      const ns = f.replace(/\.json$/, '');
      out.push({ slug: COPY_SLUG, key: ns, title: ns, sortOrder: 0, content: { _key: ns, _col: COPY_SLUG, ...readJson(path.join(copyDir, f)) } });
    }
  }
  return out;
}

/** @returns {Desired[]} */
function desiredQa() {
  const file = path.join(here, 'chatbot-qa', `${LANG}.json`);
  return readJson(file).map((/** @type {any} */ q, /** @type {number} */ i) => ({
    slug: QA_SLUG, key: q._key, title: q.question, sortOrder: i, content: q,
  }));
}

// ── main ─────────────────────────────────────────────────────────────────────

/** @type {Record<string, string>} slug -> category id */
const catIds = {};
let parentId = null;
if (QA) {
  catIds[QA_SLUG] = await ensureCategory(QA_SLUG, 'צ׳אטבוט: שאלות ותשובות מוכנות', null);
} else {
  parentId = await ensureCategory(METIV_PARENT_SLUG, 'מטיב', null);
  for (const col of COLLECTIONS) catIds[col.slug] = await ensureCategory(col.slug, col.label, parentId);
  catIds[COPY_SLUG] = await ensureCategory(COPY_SLUG, 'טקסטים בעמודים', parentId);
}

// Existing rows, every language, for this set of categories.
/** @type {any[]} */
const existing = [];
// Unfiltered on purpose: a categoryId-filtered list only returns the matched
// category in each row's `categories`, which hides the collection.
const wanted = QA ? QA_SLUG : METIV_PARENT_SLUG;
for (const r of await api('/admin/articles?type=article')) {
  if ((r.categories ?? []).some((/** @type {any} */ c) => c.slug === wanted)) existing.push(r);
}

/** @param {any} row */
const rowSlug = (row) => (QA ? QA_SLUG : (row.categories ?? []).find((/** @type {any} */ c) => c.parentId)?.slug);
// (rows also carry their collection as content._col; the categories are the source of truth here)
/** @param {any} row */
const rowKey = (row) => {
  try {
    return JSON.parse(row.content ?? '{}')._key;
  } catch {
    return undefined;
  }
};
/** @type {Map<string, any>} */
const byId = new Map();
for (const r of existing) byId.set(`${rowSlug(r)}|${r.langId}|${rowKey(r)}`, r);

const desired = QA ? desiredQa() : desiredMetiv();
const stamp = new Date().toISOString();
let created = 0, patched = 0, same = 0, skipped = 0;

for (const d of desired) {
  const content = { ...d.content };
  if (LANG !== 'he') content._tr = { by: 'claude', at: stamp, ...(content._tr ?? {}) };
  const mine = byId.get(`${d.slug}|${LANG}|${d.key}`);
  const he = LANG === 'he' ? null : byId.get(`${d.slug}|he|${d.key}`);
  if (LANG !== 'he' && !he) {
    console.warn(`  ! no Hebrew row for ${d.slug}/${d.key} - skipped`);
    skipped++;
    continue;
  }
  const categoryIds = QA ? [catIds[QA_SLUG]] : [parentId, catIds[d.slug]];
  if (mine) {
    // Keep the stored translation stamp when nothing else changed.
    const old = JSON.parse(mine.content ?? '{}');
    const cmp = (/** @type {any} */ c) => JSON.stringify({ ...c, _tr: undefined });
    if (mine.title === d.title && mine.sortOrder === d.sortOrder && cmp(old) === cmp(content)) {
      same++;
      continue;
    }
    patched++;
    console.log(`  ~ ${d.slug}/${d.key}`);
    if (APPLY) await api(`/admin/articles/${mine.id}`, { method: 'PATCH', body: JSON.stringify({ title: d.title, sortOrder: d.sortOrder, content: JSON.stringify(content) }) });
  } else {
    created++;
    if (APPLY) {
      await api('/admin/articles', {
        method: 'POST',
        body: JSON.stringify({
          type: 'article',
          langId: LANG,
          ...(he ? { groupId: he.groupId } : {}),
          title: d.title,
          content: JSON.stringify(content),
          sortOrder: d.sortOrder,
          isPublished: true,
          categoryIds,
        }),
      });
    }
  }
}

const keep = new Set(desired.map((d) => `${d.slug}|${LANG}|${d.key}`));
const orphans = existing.filter((r) => r.langId === LANG && !keep.has(`${rowSlug(r)}|${r.langId}|${rowKey(r)}`));
console.log(`${APPLY ? 'APPLIED' : 'DRY RUN'} ${QA ? 'chatbot-qa' : 'metiv'} lang=${LANG}: ${created} create, ${patched} update, ${same} unchanged, ${skipped} skipped, ${orphans.length} in DB but not in seed (left alone)`);
