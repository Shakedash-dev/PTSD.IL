#!/usr/bin/env node
// Deterministic checks for the bulk translation (tr/<lang>/NN.json against
// tr/he.json). The same rules /translate runs in the worker:
// every id present and non-empty, no Hebrew letters left, {placeholders},
// URLs, emails and digit groups preserved, Markdown structure kept (links,
// list items, headings, bold markers), no en/em dash, sane length.
//
//   node scripts/metiv-seed/check-translations.mjs ar [--batch 03]
//
// Exit code 1 when anything fails; warnings do not fail.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const trDir = path.join(here, 'tr');
const [lang, flag, batchArg] = process.argv.slice(2);
if (!['ar', 'en', 'ru', 'fr'].includes(lang)) {
  console.error('usage: check-translations.mjs <ar|en|ru|fr> [--batch NN]');
  process.exit(2);
}
const readJson = (/** @type {string} */ f) => JSON.parse(fs.readFileSync(f, 'utf8'));

const batchDir = path.join(trDir, 'batches');
const batches = fs.readdirSync(batchDir).filter((f) => /^\d+\.json$/.test(f) && (flag !== '--batch' || f === `${batchArg}.json`)).sort();

const HEBREW = /[֐-׿]/;
const multiset = (/** @type {string[]} */ xs) => xs.slice().sort().join('\u0001');
const all = (/** @type {RegExp} */ re, /** @type {string} */ s) => [...s.matchAll(re)].map((m) => m[0]);

/** Structural fingerprints that must survive translation. @param {string} s */
function shape(s) {
  return {
    placeholders: multiset(all(/\{\w+\}/g, s)),
    urls: multiset(all(/https?:\/\/[^\s)\]>"']+/g, s)),
    emails: multiset(all(/[\w.+][\w.+-]*@[\w-]+\.[\w.-]+/g, s)),
    digits: multiset(all(/\d+/g, s.replace(/https?:\/\/\S+/g, ''))),
    links: all(/\]\(/g, s).length,
    listItems: all(/^\s*(?:[-*+]|\d+\.)\s/gm, s).length,
    headings: all(/^#{1,6}\s/gm, s).length,
    bold: all(/\*\*/g, s).length,
    lines: s.split('\n').length,
  };
}

let errors = 0, warnings = 0, checked = 0;
/** @param {string} kind @param {string} id @param {string} msg */
const report = (kind, id, msg) => {
  if (kind === 'error') errors++; else warnings++;
  console.log(`${kind === 'error' ? 'ERROR' : 'warn '} ${id}: ${msg}`);
};

for (const b of batches) {
  const src = readJson(path.join(batchDir, b));
  const file = path.join(trDir, lang, b);
  if (!fs.existsSync(file)) {
    report('error', b, 'batch not translated');
    continue;
  }
  const tr = readJson(file);
  for (const id of Object.keys(tr)) if (!(id in src)) report('error', `${b}/${id}`, 'id not in source batch');
  for (const [id, he] of Object.entries(src)) {
    checked++;
    const t = tr[id];
    const where = `${b}/${id}`;
    if (typeof t !== 'string' || !t.trim()) { report('error', where, 'missing or empty'); continue; }
    if (HEBREW.test(t)) report('error', where, `Hebrew left: ${t.slice(0, 80)}`);
    if (/[\u2013\u2014]/.test(t)) report('error', where, 'en/em dash');
    const a = shape(/** @type {string} */ (he)), c = shape(t);
    for (const k of /** @type {const} */ (['placeholders', 'urls', 'emails'])) {
      if (a[k] !== c[k]) report('error', where, `${k} differ`);
    }
    for (const k of /** @type {const} */ (['links', 'listItems', 'headings', 'bold'])) {
      if (a[k] !== c[k]) report('error', where, `${k}: ${a[k]} -> ${c[k]}`);
    }
    if (a.digits !== c.digits) report('warn', where, `digit groups differ: [${a.digits.split('\u0001')}] -> [${c.digits.split('\u0001')}]`);
    if (a.lines !== c.lines) report('warn', where, `line count ${a.lines} -> ${c.lines}`);
    const ratio = t.length / /** @type {string} */ (he).length;
    if (he.length > 20 && (ratio < 0.5 || ratio > 3)) report('warn', where, `length ratio ${ratio.toFixed(2)}`);
  }
}
console.log(`${lang}: ${checked} strings in ${batches.length} batches, ${errors} errors, ${warnings} warnings`);
process.exitCode = errors ? 1 : 0;
