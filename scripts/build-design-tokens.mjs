#!/usr/bin/env node
/**
 * Generates docs/design-tokens.json from src/index.css.
 *
 * The CSS is the single source of truth for every design value. This script
 * reads the :root block, converts each HSL triple to the hex Figma variables
 * expect, and writes the W3C Design Tokens Community Group format.
 *
 * Never hand-edit docs/design-tokens.json - it is overwritten from here.
 * Change src/index.css instead and re-run `npm run tokens`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CSS = path.join(ROOT, 'src', 'index.css');
const OUT = path.join(ROOT, 'docs', 'design-tokens.json');
const TAILWIND = path.join(ROOT, 'src', 'tailwind.config.js');

/** Fail loudly rather than emit a wrong colour. */
function fail(msg) {
  console.error(`build-design-tokens: ${msg}`);
  process.exit(1);
}

/** "268 42% 52%" -> "#8050b8" */
function hslToHex(triple) {
  const m = triple.trim().match(/^(-?[\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/);
  if (!m) return null;
  const h = parseFloat(m[1]) / 360;
  const s = parseFloat(m[2]) / 100;
  const l = parseFloat(m[3]) / 100;

  const hue = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue(p, q, h + 1 / 3);
    g = hue(p, q, h);
    b = hue(p, q, h - 1 / 3);
  }
  const to255 = (v) => Math.round(v * 255).toString(16).padStart(2, '0');
  return `#${to255(r)}${to255(g)}${to255(b)}`;
}

const css = readFileSync(CSS, 'utf8');
const rootStart = css.indexOf(':root {');
if (rootStart === -1) fail('no :root block in src/index.css');
const rootEnd = css.indexOf('\n  }', rootStart);
const block = css.slice(rootStart, rootEnd);

/** @type {Record<string,string>} */
const vars = {};
for (const line of block.split('\n')) {
  const m = line.match(/^\s*--([a-z0-9-]+):\s*([^;]+);/i);
  if (m) vars[m[1]] = m[2].trim();
}
if (Object.keys(vars).length === 0) fail('parsed no custom properties');

// Group by prefix. Anything that is not an HSL triple is carried through as-is
// under the group its name implies, so nothing is silently dropped.
const color = {};
const other = { radius: {}, font: {}, shadow: {} };
const skipped = [];

for (const [name, value] of Object.entries(vars)) {
  if (name.startsWith('font-')) {
    other.font[name.slice(5)] = { $value: value, $type: 'fontFamily' };
    continue;
  }
  if (name === 'radius') {
    other.radius.base = { $value: value, $type: 'dimension' };
    continue;
  }
  if (name.startsWith('shadow-')) {
    other.shadow[name.slice(7)] = { $value: value, $type: 'shadow' };
    continue;
  }
  const hex = hslToHex(value);
  if (hex === null) {
    skipped.push(`${name}: ${value}`);
    continue;
  }
  color[name] = { $value: hex, $type: 'color', $description: `hsl(${value})` };
}

if (skipped.length) {
  fail(`could not parse these as colours - add an explicit rule for them:\n  ${skipped.join('\n  ')}`);
}

// Radii and shadows that live in the Tailwind config rather than the CSS.
const tw = readFileSync(TAILWIND, 'utf8');
for (const [key, re] of [
  ['super', /super:\s*'([^']+)'/],
  ['super-sm', /'super-sm':\s*'([^']+)'/],
]) {
  const m = tw.match(re);
  if (m) other.radius[key] = { $value: m[1], $type: 'dimension' };
}
for (const m of tw.matchAll(/'(atmospheric(?:-\w+)?|card(?:-hover)?)':\s*'([^']+)'/g)) {
  other.shadow[m[1]] = { $value: m[2], $type: 'shadow' };
}

const tokens = {
  $description:
    'PTSD.IL design tokens. Generated from src/index.css by scripts/build-design-tokens.mjs - do not edit by hand.',
  color,
  radius: other.radius,
  font: other.font,
  shadow: other.shadow,
};

writeFileSync(OUT, JSON.stringify(tokens, null, 2) + '\n', 'utf8');
console.log(
  `build-design-tokens: wrote ${path.relative(ROOT, OUT)} - ` +
    `${Object.keys(color).length} colours, ${Object.keys(other.radius).length} radii, ` +
    `${Object.keys(other.font).length} fonts, ${Object.keys(other.shadow).length} shadows`
);
