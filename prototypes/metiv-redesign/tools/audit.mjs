// A static pass over every page in the prototype. It catches the things that
// are invisible in a screenshot and expensive to find by hand: two elements
// sharing an id (which silently breaks getElementById and aria-controls), a
// control pointing at a target that is not there, an <img> whose file is
// missing or whose alt is, and a heading level that skips a step.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];
const note = (file, msg) => problems.push(`${file}: ${msg}`);

const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
const partials = fs.readdirSync(path.join(ROOT, 'partials')).map((f) => fs.readFileSync(path.join(ROOT, 'partials', f), 'utf8')).join('\n');

for (const file of pages) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8') + partials;

  // ids
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) note(file, `duplicate id "${id}"`);
    seen.add(id);
  }

  // aria-controls / href="#x" targets
  for (const m of html.matchAll(/aria-controls="([^"]+)"/g)) {
    if (!seen.has(m[1])) note(file, `aria-controls="${m[1]}" has no target`);
  }
  for (const m of html.matchAll(/href="#([^"]+)"/g)) {
    if (m[1] !== 'top' && !seen.has(m[1])) note(file, `href="#${m[1]}" has no target`);
  }

  // images
  for (const m of html.matchAll(/<img\b([^>]*)>/g)) {
    const tag = m[1];
    const src = (tag.match(/src="([^"]+)"/) || [])[1];
    const alt = tag.match(/alt="/);
    if (!alt) note(file, `<img src="${src}"> has no alt`);
    if (src && !/^https?:/.test(src) && !fs.existsSync(path.join(ROOT, src))) note(file, `missing image ${src}`);
  }

  // links to pages that do not exist
  for (const m of html.matchAll(/href="([a-z0-9-]+\.html)(#[^"]*)?"/g)) {
    if (!fs.existsSync(path.join(ROOT, m[1]))) note(file, `link to missing page ${m[1]}`);
  }

  // heading order, within the page body only
  const body = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const levels = [...body.matchAll(/<h([1-6])\b/g)].map((m) => Number(m[1]));
  let prev = 0;
  for (const l of levels) {
    if (prev && l > prev + 1) note(file, `heading jumps from h${prev} to h${l}`);
    prev = l;
  }
  const h1s = levels.filter((l) => l === 1).length;
  if (h1s !== 1) note(file, `${h1s} <h1> elements`);
}

// CSS classes used in the pages that the stylesheet does not define
const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
const defined = new Set([...css.matchAll(/\.([a-z][a-z0-9_-]*)/g)].map((m) => m[1]));
const used = new Set();
for (const file of pages) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  for (const m of html.matchAll(/class="([^"]+)"/g)) m[1].split(/\s+/).forEach((c) => c && used.add(c));
}
// Classes that exist only as a hook for site.js and are never styled.
const JS_HOOKS = new Set(['toggle__label']);
for (const c of used) {
  if (!defined.has(c) && !JS_HOOKS.has(c)) problems.push(`styles.css: no rule for .${c}`);
}

// icons referenced but not in the sprite
const sprite = new Set([...partials.matchAll(/id="(i-[a-z-]+)"/g)].map((m) => m[1]));
for (const file of pages) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  for (const m of html.matchAll(/href="#(i-[a-z-]+)"/g)) {
    if (!sprite.has(m[1])) note(file, `icon ${m[1]} is not in the sprite`);
  }
}

if (!problems.length) console.log(`clean - ${pages.length} pages`);
else { console.log(problems.join('\n')); console.log(`\n${problems.length} problems across ${pages.length} pages`); }
