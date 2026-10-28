// The v3 demo's text lives in the DB (docs/metiv-db-spec.md): page copy in
// metiv-copy rows, data in the metiv-* collections. Hebrew typed straight into
// a v3 source file would never be translated, so it is not allowed outside
// comments. Exceptions: the content provider's pre-load status text (shown
// before the DB answers) and the registry's admin labels (the admin is Hebrew).
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const V3 = path.resolve(__dirname, '../pages/metiv-demos/v3');
const ALLOWED = new Set(['content/MetivContent.jsx', 'content/registry.js']);
const HEBREW = /[֐-׿]/;

/** @param {string} dir @returns {string[]} */
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? files(p) : /\.(jsx?|tsx?)$/.test(e.name) ? [p] : [];
  });
}

/** Source with comments removed (good enough for this code base: no comment markers inside strings with Hebrew). @param {string} src */
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

describe('v3 source has no inline Hebrew', () => {
  for (const file of files(V3)) {
    const rel = path.relative(V3, file);
    if (ALLOWED.has(rel)) continue;
    it(rel, () => {
      const lines = stripComments(fs.readFileSync(file, 'utf8')).split('\n').filter((l) => HEBREW.test(l));
      expect(lines, `move these to a metiv-copy namespace:\n${lines.join('\n')}`).toEqual([]);
    });
  }
});
