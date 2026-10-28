#!/usr/bin/env node
// One-time bulk translation helpers for the Metiv seed. Works on UNIQUE
// strings: every distinct Hebrew string is translated once and reused
// everywhere it appears, so a value that several items share (a team group,
// an event type, a provider name) stays identical in every language.
//
//   node scripts/metiv-seed/strings.mjs extract
//       -> tr/he.json        { id: text } for every translatable string
//          tr/context.json   { id: "where it first appears" }
//          tr/batches/NN.json  ~12k-char batches of { id: text }
//   node scripts/metiv-seed/strings.mjs assemble <lang>
//       reads tr/<lang>/NN.json ({ id: translation }) and writes
//       <lang>/*.json, <lang>/copy/*.json and chatbot-qa/<lang>.json
//
// Which leaves are translatable: src/lib/translatable.js (same rule the admin
// uses). Checks: check-translations.mjs.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const { extractLeaves, applyLeaves } = await import(path.join(root, 'src/lib/translatable.js'));

const trDir = path.join(here, 'tr');
const readJson = (/** @type {string} */ f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const writeJson = (/** @type {string} */ f, /** @type {any} */ v) => {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(v, null, 2) + '\n');
};
const idOf = (/** @type {string} */ text) => crypto.createHash('sha1').update(text).digest('hex').slice(0, 10);

/** Every Hebrew source document: { kind, file, label, docs: [{ ctx, content }] } */
function sources() {
  /** @type {{ kind: 'seed'|'copy'|'qa', name: string, data: any }[]} */
  const out = [];
  for (const f of fs.readdirSync(path.join(here, 'he')).filter((x) => x.endsWith('.json')).sort()) {
    out.push({ kind: 'seed', name: f, data: readJson(path.join(here, 'he', f)) });
  }
  const copyDir = path.join(here, 'copy');
  if (fs.existsSync(copyDir)) {
    for (const f of fs.readdirSync(copyDir).filter((x) => x.endsWith('.json')).sort()) {
      out.push({ kind: 'copy', name: f, data: readJson(path.join(copyDir, f)) });
    }
  }
  const qa = path.join(here, 'chatbot-qa', 'he.json');
  if (fs.existsSync(qa)) out.push({ kind: 'qa', name: 'he.json', data: readJson(qa) });
  return out;
}

/** @param {{ kind: string, name: string, data: any }} s @returns {{ ctx: string, content: any }[]} */
function docsOf(s) {
  if (s.kind === 'seed') return s.data.rows.map((/** @type {any} */ r) => ({ ctx: `${s.data.key}/${r._key}`, content: r.content }));
  if (s.kind === 'copy') return [{ ctx: `copy/${s.name.replace(/\.json$/, '')}`, content: s.data }];
  return s.data.map((/** @type {any} */ q) => ({ ctx: `chatbot-qa/${q._key}`, content: q }));
}

function extract() {
  /** @type {Record<string, string>} */
  const he = {};
  /** @type {Record<string, string>} */
  const context = {};
  for (const s of sources()) {
    for (const d of docsOf(s)) {
      for (const [p, text] of Object.entries(extractLeaves(d.content))) {
        const id = idOf(/** @type {string} */ (text));
        if (!(id in he)) {
          he[id] = /** @type {string} */ (text);
          context[id] = `${d.ctx} :: ${p}`;
        }
      }
    }
  }
  writeJson(path.join(trDir, 'he.json'), he);
  writeJson(path.join(trDir, 'context.json'), context);
  // Batches hold only strings some language still lacks, numbered after the
  // existing ones, so a second run (new copy, Q&A) only adds the delta.
  // Insertion order follows the files, which keeps related strings together.
  const batchDir = path.join(trDir, 'batches');
  fs.mkdirSync(batchDir, { recursive: true });
  const queued = new Set();
  let n = 0;
  for (const f of fs.readdirSync(batchDir).filter((x) => /^\d+\.json$/.test(x))) {
    n = Math.max(n, Number(f.slice(0, -5)) + 1);
    for (const id of Object.keys(readJson(path.join(batchDir, f)))) queued.add(id);
  }
  let size = 0;
  /** @type {Record<string, string>} */
  let batch = {};
  const flush = () => {
    if (!Object.keys(batch).length) return;
    writeJson(path.join(batchDir, `${String(n).padStart(2, '0')}.json`), batch);
    n++; size = 0; batch = {};
  };
  let added = 0;
  for (const [id, text] of Object.entries(he)) {
    if (queued.has(id)) continue;
    added++;
    if (size + text.length > 12000) flush();
    batch[id] = text;
    size += text.length;
  }
  flush();
  const chars = Object.values(he).reduce((a, t) => a + t.length, 0);
  console.log(`${Object.keys(he).length} unique strings (${chars} chars); ${added} new, batches now 00-${String(n - 1).padStart(2, '0')}`);
}

/** @param {string} lang */
function assemble(lang) {
  const dir = path.join(trDir, lang);
  /** @type {Record<string, string>} */
  const tr = {};
  for (const f of fs.readdirSync(dir).filter((x) => /^\d+\.json$/.test(x))) Object.assign(tr, readJson(path.join(dir, f)));
  const missing = new Set();
  /** @param {any} content */
  const translate = (content) => {
    /** @type {Record<string, string>} */
    const leaves = {};
    for (const [p, text] of Object.entries(extractLeaves(content))) {
      const t = tr[idOf(/** @type {string} */ (text))];
      if (t === undefined) missing.add(idOf(/** @type {string} */ (text)));
      else leaves[p] = t;
    }
    return applyLeaves(content, leaves);
  };
  const outBase = path.join(here, lang);
  for (const s of sources()) {
    if (s.kind === 'seed') {
      const rows = s.data.rows.map((/** @type {any} */ r) => {
        const content = translate(r.content);
        const titleTr = tr[idOf(r.title)];
        return { ...r, title: titleTr ?? r.title, content };
      });
      writeJson(path.join(outBase, s.name), { ...s.data, rows });
    } else if (s.kind === 'copy') {
      writeJson(path.join(outBase, 'copy', s.name), translate(s.data));
    } else {
      writeJson(path.join(here, 'chatbot-qa', `${lang}.json`), s.data.map((/** @type {any} */ q) => translate(q)));
    }
  }
  console.log(`assembled ${lang}: ${Object.keys(tr).length} translations, ${missing.size} source strings missing`);
  if (missing.size) {
    writeJson(path.join(dir, 'missing.json'), Object.fromEntries([...missing].map((id) => [id, readJson(path.join(trDir, 'he.json'))[id]])));
    process.exitCode = 1;
  }
}

const [cmd, lang] = process.argv.slice(2);
if (cmd === 'extract') extract();
else if (cmd === 'assemble' && ['ar', 'en', 'ru', 'fr'].includes(lang)) assemble(lang);
else {
  console.error('usage: strings.mjs extract | assemble <ar|en|ru|fr>');
  process.exitCode = 2;
}
