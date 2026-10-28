// Builds the Hebrew seed for the Metiv v3 content DB from the static demo
// modules. One JSON file per collection in scripts/metiv-seed/he/, each
// { key, slug, kind, rows: [{ _key, title, sortOrder, content }] }.
// Model: docs/metiv-db-spec.md. Run from src/ (needs the "@" alias):
//
//   cd src && npx vite-node ../scripts/metiv-seed/build-seed.mjs
//
// Deterministic: re-running overwrites he/*.json with the same output.
//
// HISTORICAL (2026-10-28): this ran once to create the seed. The v3 static
// data files it reads (v3/data/aboutMetiv.js, releaseJourney.js and the
// ROUTE_META/SHORT_VERSIONS/NEXT_STEPS exports of v3/meta.js) were removed when
// v3 moved to the DB, so it no longer runs. The live DB is the source of truth;
// edit content in /metiv-site-demo-v3/admin, not here.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// shared/patient/index.js imports page components; some touch `window` at load.
globalThis.window ??= /** @type {any} */ ({ self: globalThis, top: globalThis, location: { search: '', hostname: 'localhost' }, matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }), addEventListener() {}, removeEventListener() {}, localStorage: { getItem: () => null, setItem() {} }, sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} } });
globalThis.window.self ??= globalThis;
globalThis.document ??= /** @type {any} */ ({ documentElement: { setAttribute() {}, style: {} }, addEventListener() {}, createElement: () => ({ style: {} }) });
globalThis.localStorage ??= globalThis.window.localStorage;
globalThis.sessionStorage ??= globalThis.window.sessionStorage;

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, 'he');

const { COLLECTIONS } = await import('@/pages/metiv-demos/v3/content/registry.js');
const therapist = await import('@/pages/metiv-demos/shared/therapist/index.js');
const additions = await import('@/pages/metiv-demos/shared/patient/additions.js');
const patient = await import('@/pages/metiv-demos/shared/patient/index.js');
const legal = await import('@/pages/metiv-demos/shared/patient/legal.js');
const about = await import('@/pages/metiv-demos/v3/data/aboutMetiv.js');
const rj = await import('@/pages/metiv-demos/v3/data/releaseJourney.js');
const meta = await import('@/pages/metiv-demos/v3/meta.js');

// The two METIV_SERVICES are one record per service: the patient directory
// entry (full) plus the landing card's short title and summary.
const cardById = Object.fromEntries(therapist.METIV_SERVICES.map((s) => [s.slug, s]));
const mergedServices = additions.METIV_SERVICES.map((s) => ({
  ...s,
  shortTitle: cardById[s.id]?.title ?? s.title,
  summary: cardById[s.id]?.summary ?? '',
}));

/** @type {Record<string, unknown>} */
const SOURCES = {
  ...therapist,
  ...rj,
  ...about,
  ...meta,
  PATIENT_HUB: patient.PATIENT_HUB,
  PATIENT_NAV: patient.PATIENT_NAV,
  PUBLIC_OPTIONS: additions.PUBLIC_OPTIONS,
  NONPROFIT_OPTIONS: additions.NONPROFIT_OPTIONS,
  CONSULTATION: additions.CONSULTATION,
  FREE_TREATMENTS: additions.FREE_TREATMENTS,
  RESEARCH_STUDIES: additions.RESEARCH_STUDIES,
  RESERVIST_FAMILY_PROGRAMS: additions.RESERVIST_FAMILY_PROGRAMS,
  VETERANS_PROGRAMS: additions.VETERANS_PROGRAMS,
  PARENT_CHILD_GROUPS: additions.PARENT_CHILD_GROUPS,
  METIV_BOOKS: additions.METIV_BOOKS,
  METIV_BOOKS_ORDER_NOTE: { text: additions.METIV_BOOKS_ORDER_NOTE },
  VIDEO_LECTURES: additions.VIDEO_LECTURES,
  TREATMENT_WHERE_BLOCK: additions.TREATMENT_WHERE_BLOCK,
  METIV_SERVICES: mergedServices,
  CONTACTS: {
    METIV_PHONE: additions.METIV_PHONE,
    METIV_KIDS_PHONE: additions.METIV_KIDS_PHONE,
    METIV_YOUTUBE: additions.METIV_YOUTUBE,
    ERAN_PHONE: additions.ERAN_PHONE,
    ERAN_WHATSAPP: additions.ERAN_WHATSAPP,
  },
  LEGAL_DOCS: {
    privacy: { body: legal.PRIVACY_HE.trim(), updated: legal.PRIVACY_UPDATED_HE },
    terms: { body: legal.TERMS_HE.trim(), updated: legal.TERMS_UPDATED_HE },
  },
};

// ── stable keys ──────────────────────────────────────────────────────────────

/** @param {any} item @param {any} col @param {number} i */
function baseKey(item, col, i) {
  const v = col.idField ? item?.[col.idField] : (item?.slug ?? item?.id ?? item?.key);
  return typeof v === 'string' && v.trim() ? v.trim() : `${col.slug}-${i}`;
}

// ── cross references: identity map of every top-level item and singleton ────

/** @type {Map<object, string>} */
const refOf = new Map();
/** @type {Map<string, string[]>} */
const keysOf = new Map();

for (const col of COLLECTIONS) {
  const data = SOURCES[col.key];
  if (data === undefined) throw new Error(`no source for ${col.key}`);
  if (col.kind === 'list') {
    const seen = new Set();
    const keys = /** @type {any[]} */ (data).map((item, i) => {
      let k = baseKey(item, col, i);
      while (seen.has(k)) k = `${k}-${i}`;
      seen.add(k);
      return k;
    });
    keysOf.set(col.key, keys);
    /** @type {any[]} */ (data).forEach((item, i) => {
      if (item && typeof item === 'object' && !refOf.has(item)) refOf.set(item, `${col.key}#${keys[i]}`);
    });
  } else if (col.kind === 'single' && data && typeof data === 'object' && !refOf.has(data)) {
    refOf.set(data, col.key);
  }
}
// The original card-shaped service objects are the merged ones now.
additions.METIV_SERVICES.forEach((s) => refOf.set(s, `METIV_SERVICES#${s.id}`));

/**
 * Deep copy for JSON, replacing any object that is another collection's
 * item (or singleton) with { $ref }. `self` is the object being serialized as
 * its own row, which must not turn into a reference to itself.
 * @param {any} v @param {object} self
 */
function serialize(v, self) {
  if (Array.isArray(v)) return v.map((x) => serialize(x, self));
  if (v && typeof v === 'object') {
    if (v !== self && refOf.has(v)) return { $ref: refOf.get(v) };
    /** @type {Record<string, any>} */
    const out = {};
    for (const [k, x] of Object.entries(v)) {
      if (typeof x === 'function' || x === undefined) continue;
      out[k] = serialize(x, self);
    }
    return out;
  }
  return v;
}

// ── write ────────────────────────────────────────────────────────────────────

fs.mkdirSync(outDir, { recursive: true });
let total = 0;
for (const col of COLLECTIONS) {
  const data = /** @type {any} */ (SOURCES[col.key]);
  /** @type {{ _key: string, title: string, sortOrder: number, content: any }[]} */
  let rows;
  if (col.kind === 'list') {
    const keys = keysOf.get(col.key) ?? [];
    rows = data.map((item, i) => {
      const own = refOf.get(item);
      // An item that belongs to an earlier collection is stored as a reference.
      const content = own && own !== `${col.key}#${keys[i]}` ? { $ref: own } : serialize(item, item);
      const title = content.$ref ? content.$ref : String(item?.[col.titleField ?? 'title'] ?? keys[i]);
      return { _key: keys[i], title, sortOrder: i, content: { _key: keys[i], _col: col.slug, ...content } };
    });
  } else if (col.kind === 'strings') {
    rows = [{ _key: col.key, title: col.key, sortOrder: 0, content: { _key: col.key, _col: col.slug, items: [...data] } }];
  } else {
    rows = [{ _key: col.key, title: col.key, sortOrder: 0, content: { _key: col.key, _col: col.slug, ...serialize(data, data) } }];
  }
  total += rows.length;
  fs.writeFileSync(
    path.join(outDir, `${col.slug}.json`),
    JSON.stringify({ key: col.key, slug: col.slug, kind: col.kind, rows }, null, 2) + '\n',
  );
}
console.log(`wrote ${COLLECTIONS.length} collections, ${total} rows to ${path.relative(process.cwd(), outDir)}`);
