#!/usr/bin/env node
/**
 * Generates docs/figma/component-specs.json - the exact, resolved geometry and
 * colour of every component variant, for building a matching Figma library.
 *
 * Fidelity comes from deriving rather than transcribing:
 *   1. cva + tailwind-merge produce each variant's real final class list, using
 *      the app's own code (bundled with esbuild).
 *   2. Those classes are resolved against the CSS Vite actually ships, so the
 *      declarations are the ones the browser applies - not a reading of the
 *      Tailwind docs.
 *   3. rem is converted at this project's 18px root, not the 16px default.
 *   4. hsl(var(--token)) is resolved to hex through docs/design-tokens.json.
 *
 * Run `npm run build` first - this reads dist/assets/*.css.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const OUT_DIR = path.join(ROOT, 'docs', 'figma');
const ROOT_FONT_PX = 18; // src/index.css: html { font-size: 18px }

const fail = (m) => { console.error(`build-figma-specs: ${m}`); process.exit(1); };

/* ------------------------------------------------------------------ 1. classes */

/* --------------------------------------------------------------- 0. usage scan */

// The Figma library should contain what the site actually uses. A component set
// with every variant x size x radius would be 936 entries and useless to a
// designer; these are the combinations that appear at real call sites.
function scanUsage() {
  const dirs = ['pages', 'components', 'components/chat', 'components/patterns'];
  const files = [];
  for (const d of dirs) {
    let entries = [];
    try { entries = readdirSync(path.join(SRC, d)); } catch { continue; }
    for (const f of entries) if (f.endsWith('.jsx')) files.push(path.join(SRC, d, f));
  }
  const attr = (a, name, fallback) => {
    const m = a.match(new RegExp(`${name}="([^"]+)"`));
    return m ? m[1] : fallback;
  };
  const button = new Set(), choiceChip = new Set(), disclosure = new Set();
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(/<Button\b([^>]*?)>/gs))
      button.add([attr(m[1], 'variant', 'default'), attr(m[1], 'size', 'default'), attr(m[1], 'radius', 'md')].join('/'));
    for (const m of src.matchAll(/<ChoiceChip\b([^>]*?)>/gs))
      choiceChip.add([attr(m[1], 'variant', 'outline'), attr(m[1], 'size', 'default')].join('/'));
    for (const m of src.matchAll(/<Disclosure\b([^>]*?)>/gs))
      disclosure.add([attr(m[1], 'variant', 'soft'), attr(m[1], 'size', 'default')].join('/'));
  }
  return {
    button: [...button].sort(),
    choiceChip: [...choiceChip].sort(),
    disclosure: [...disclosure].sort(),
  };
}

const used = scanUsage();
if (!used.button.length) fail('found no <Button> call sites - the scan is broken');

const PROBE = `
const USED = ${JSON.stringify(used)};
` + `
import { buttonVariants } from '@/components/ui/button';
import { choiceChipVariants } from '@/components/patterns/ChoiceChip';
import { wrapperVariants, triggerVariants, panelVariants } from '@/components/patterns/Disclosure';
import { sectionBlockVariants, sectionBlockInnerVariants } from '@/components/patterns/SectionBlock';
import { pageHeaderWrapperVariants, pageHeaderInnerVariants, pageHeaderTitleVariants, pageHeaderSubtitleVariants } from '@/components/patterns/PageHeader';
import { cn } from '@/lib/utils';

const BTN_VARIANTS = ['default','destructive','outline','secondary','ghost','link','pill','pill-outline','pill-light','pill-green','solid','elevated','success','warning','subtle','outline-subtle','dashed','quiet'];
const BTN_SIZES = ['default','sm','lg','icon','pill','pill-lg','pill-xl','none','xs','roomy','roomy-lg','roomy-xl','cta'];
const RADII = ['md','xl','super','full'];

const out = { button: {}, choiceChip: {}, disclosure: {}, sectionBlock: {}, pageHeader: {} };

// Exact specs for the combinations the app actually renders. Each is the real
// composed class list - the axes cannot be layered independently, because cva
// fills any unspecified axis with its default.
for (const combo of USED.button) {
  const [variant, size, radius] = combo.split('/');
  out.button['used/' + combo] = cn(buttonVariants({ variant, size, radius }));
}
// Catalogue: every value of each axis with the other axes at their defaults, so
// the whole palette is documented even where the app does not use it yet.
for (const variant of BTN_VARIANTS) out.button['catalogue/variant/' + variant] = cn(buttonVariants({ variant }));
for (const size of BTN_SIZES) out.button['catalogue/size/' + size] = cn(buttonVariants({ size }));
for (const radius of RADII) out.button['catalogue/radius/' + radius] = cn(buttonVariants({ radius }));
for (const variant of ['outline','plain'])
  for (const size of ['sm','default','stacked','list'])
    for (const selected of [true,false]) {
      const key = variant + '/' + size;
      const prefix = USED.choiceChip.includes(key) ? 'used/' : 'catalogue/';
      out.choiceChip[prefix + key + '/' + (selected ? 'selected' : 'unselected')] =
        cn(choiceChipVariants({ variant, size, selected }));
    }

for (const variant of ['outlined','soft','plain']) {
  out.disclosure[variant + '/wrapper'] = cn(wrapperVariants({ variant }));
  for (const size of ['tight','compact','default']) {
    out.disclosure[variant + '/' + size + '/trigger'] = cn(triggerVariants({ size, justify: 'between' }));
    out.disclosure[variant + '/' + size + '/panel'] = cn(panelVariants({ size }));
  }
}
for (const variant of ['canvas','card','muted','dark','primary'])
  out.sectionBlock[variant + '/band'] = cn(sectionBlockVariants({ variant }));
for (const maxWidth of ['narrow','default','wide','full'])
  out.sectionBlock['inner/' + maxWidth] = cn(sectionBlockInnerVariants({ maxWidth }));

for (const tone of ['card','canvas','muted','dark'])
  out.pageHeader[tone + '/wrapper'] = cn(pageHeaderWrapperVariants({ tone }));
for (const size of ['default','editorial','hero']) {
  for (const align of ['center','start'])
    out.pageHeader[size + '/' + align + '/inner'] = cn(pageHeaderInnerVariants({ size, align }));
  out.pageHeader[size + '/title'] = cn(pageHeaderTitleVariants({ size }));
  out.pageHeader[size + '/subtitle'] = cn(pageHeaderSubtitleVariants({ size }));
}

process.stdout.write(JSON.stringify(out));
`;

const TMP = path.join(ROOT, 'node_modules', '.cache', 'figma-specs');
mkdirSync(TMP, { recursive: true });
writeFileSync(path.join(TMP, 'probe.mjs'), PROBE);

const BANNER =
  "globalThis.window=globalThis.window||globalThis;" +
  "globalThis.self=globalThis.self||globalThis;" +
  "globalThis.top=globalThis.top||globalThis;" +
  "globalThis.document=globalThis.document||{createElement:()=>({style:{}}),documentElement:{style:{},getAttribute:()=>'rtl'},head:{appendChild(){}},body:{}};";

execFileSync(path.join(SRC, 'node_modules', '.bin', 'esbuild'), [
  path.join(TMP, 'probe.mjs'), '--bundle', '--format=esm', '--platform=node',
  `--outfile=${path.join(TMP, 'probe.bundle.mjs')}`,
  `--alias:@=${SRC}`, '--loader:.jsx=jsx', '--jsx=automatic', '--log-level=error',
  `--banner:js=${BANNER}`,
], { cwd: SRC, stdio: ['ignore', 'inherit', 'inherit'] });

const classes = JSON.parse(
  execFileSync(process.execPath, [path.join(TMP, 'probe.bundle.mjs')], { encoding: 'utf8' })
);

/* ---------------------------------------------------------------------- 2. css */

const distDir = path.join(SRC, 'dist', 'assets');
let cssFile;
try {
  cssFile = readdirSync(distDir).filter((f) => f.endsWith('.css')).sort().pop();
} catch {
  fail('no src/dist/assets - run `npm run build` in src/ first');
}
if (!cssFile) fail('no compiled css in src/dist/assets - run `npm run build` first');
const css = readFileSync(path.join(distDir, cssFile), 'utf8');

/** A selector that is exactly one class, allowing escaped characters. */
function classNameOf(sel) {
  const s = sel.trim();
  if (!s.startsWith('.')) return null;
  const raw = s.slice(1);
  // Blank out escape pairs, then reject anything structural in what remains.
  const bare = raw.replace(/\\./g, '\0');
  if (/[\s>+~:.[\]]/.test(bare)) return null;
  return raw.replace(/\\(.)/g, '$1');
}

function collectRules(block, into) {
  for (const m of block.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const decls = m[2].trim();
    if (!decls) continue;
    for (const sel of m[1].split(',')) {
      const name = classNameOf(sel);
      if (name === null) continue;
      const list = into.get(name) || [];
      for (const d of decls.split(';')) {
        const i = d.indexOf(':');
        if (i === -1) continue;
        list.push({ prop: d.slice(0, i).trim(), value: d.slice(i + 1).trim() });
      }
      into.set(name, list);
    }
  }
}

/** Selectors of the form ".<one class> <tag>" - e.g. Tailwind's [&_svg]: rules,
 *  which size the icon inside a button. Returns [class, descendantTag]. */
function descendantOf(sel) {
  const s = sel.trim();
  const m = s.match(/^(\.\S+)\s+([a-z]+)$/);
  if (!m) return null;
  const cls = classNameOf(m[1]);
  return cls === null ? null : [cls, m[2]];
}

function collectDescendants(block, into) {
  for (const m of block.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const decls = m[2].trim();
    if (!decls) continue;
    for (const sel of m[1].split(',')) {
      const d = descendantOf(sel);
      if (!d) continue;
      const [cls, tag] = d;
      const key = `${cls}::${tag}`;
      const list = into.get(key) || [];
      for (const dec of decls.split(';')) {
        const i = dec.indexOf(':');
        if (i === -1) continue;
        list.push({ prop: dec.slice(0, i).trim(), value: dec.slice(i + 1).trim() });
      }
      into.set(key, list);
    }
  }
}

const descendants = new Map();

// Base rules, plus one map per min-width breakpoint. Tailwind emits breakpoints
// in ascending order, so applying them in file order matches the cascade.
const rules = new Map();
const breakpoints = new Map(); // "640" -> Map(class -> decls)

let cursor = 0;
const mediaRe = /@media\s*\(min-width:\s*([\d.]+)px\)\s*\{/g;
let mm;
const mediaRanges = [];
while ((mm = mediaRe.exec(css)) !== null) {
  // find the matching close brace
  let depth = 1;
  let i = mediaRe.lastIndex;
  while (i < css.length && depth > 0) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') depth--;
    i++;
  }
  mediaRanges.push({ min: mm[1], start: mediaRe.lastIndex, end: i - 1, outerStart: mm.index, outerEnd: i });
  mediaRe.lastIndex = i;
}

for (const r of mediaRanges) {
  collectRules(css.slice(r.outerStart, r.start), rules); // nothing, but harmless
  const map = breakpoints.get(r.min) || new Map();
  collectRules(css.slice(r.start, r.end), map);
  breakpoints.set(r.min, map);
}

// Everything outside any @media block is the base layer.
let base = '';
let last = 0;
for (const r of mediaRanges) { base += css.slice(last, r.outerStart); last = r.outerEnd; }
base += css.slice(last);
// Drop other at-rules with bodies (@supports, @keyframes, @font-face).
const baseClean = base.replace(/@(?:supports|keyframes|font-face|layer)[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
collectRules(baseClean, rules);
collectDescendants(baseClean, descendants);

/* ------------------------------------------------------------------- 3. resolve */

const tokens = JSON.parse(readFileSync(path.join(ROOT, 'docs', 'design-tokens.json'), 'utf8'));
const tokenHex = (name) => tokens.color[name]?.$value ?? null;

const remToPx = (v) =>
  v.replace(/(-?[\d.]+)rem/g, (_, n) => `${+(parseFloat(n) * ROOT_FONT_PX).toFixed(3)}px`);

/** hsl(var(--primary)/var(--tw-bg-opacity)) -> {hex, alpha} */
function resolveColor(value) {
  const m = value.match(/hsl\(var\(--([a-z0-9-]+)\)(?:\s*\/\s*([^)]+))?\)/i);
  if (!m) return null;
  const hex = tokenHex(m[1]);
  if (!hex) return null;
  let alpha = 1;
  if (m[2] && !m[2].includes('var(')) {
    const a = parseFloat(m[2]);
    if (!Number.isNaN(a)) alpha = m[2].includes('%') ? a / 100 : a;
  }
  return { token: m[1], hex, alpha };
}

const FONT_STACKS = Object.fromEntries(
  Object.entries(tokens.font).map(([k, v]) => [`--font-${k}`, v.$value])
);

function resolveVars(value) {
  // Tailwind composes box-shadow from --tw-shadow; substitute what the class set.
  return value
    .replace(/var\(--font-([a-z]+)\)/g, (m, k) => FONT_STACKS[`--font-${k}`] ?? m)
    .replace(/var\(--tw-ring-offset-shadow,\s*[^)]*\)\s*,\s*var\(--tw-ring-shadow,\s*[^)]*\)\s*,\s*/g, '');
}

function applyClasses(classList, layer) {
  const applied = {};
  const unknown = [];
  const twVars = {};
  for (const cls of classList) {
    const decls = layer.get(cls);
    if (!decls) { unknown.push(cls); continue; }
    for (const { prop, value } of decls) {
      if (prop.startsWith('--tw-')) { twVars[prop] = value; continue; }
      if (prop.startsWith('-webkit-') || prop.startsWith('-moz-')) continue;
      applied[prop] = value;
    }
  }
  if (applied['box-shadow'] && twVars['--tw-shadow']) {
    applied['box-shadow'] = twVars['--tw-shadow'];
  }
  return { applied, unknown };
}

function present(applied) {
  const out = {};
  for (const [prop, rawValue] of Object.entries(applied)) {
    const value = resolveVars(rawValue);
    const colour = resolveColor(value);
    out[prop] = colour
      ? { value, hex: colour.hex, alpha: colour.alpha, token: colour.token }
      : { value: remToPx(value) };
  }
  return out;
}

const BREAKPOINT_NAME = { '640': 'sm', '768': 'md', '1024': 'lg', '1280': 'xl', '1536': '2xl' };

function resolve(classList) {
  const all = classList.split(/\s+/).filter(Boolean);
  // Base classes carry no variant prefix.
  const baseClasses = all.filter((c) => !/^[a-z0-9]+:/.test(c) || rules.has(c));
  const { applied, unknown } = applyClasses(baseClasses, rules);

  const responsive = {};
  for (const [min, layer] of breakpoints) {
    const name = BREAKPOINT_NAME[min] || min;
    const prefixed = all.filter((c) => c.startsWith(`${name}:`));
    if (!prefixed.length) continue;
    const r = applyClasses(prefixed, layer);
    if (Object.keys(r.applied).length) responsive[name] = present(r.applied);
  }

  // Descendant rules such as [&_svg]:size-4, which size an icon inside the
  // control - needed to place the icon correctly in Figma.
  const descendant = {};
  const matchedDescendants = new Set();
  for (const cls of unknown) {
    for (const tag of ['svg']) {
      const decls = descendants.get(`${cls}::${tag}`);
      if (!decls) continue;
      matchedDescendants.add(cls);
      const bucket = (descendant[tag] ||= {});
      for (const { prop, value } of decls) {
        if (prop.startsWith('--tw-')) continue;
        bucket[prop] = value;
      }
    }
  }
  for (const tag of Object.keys(descendant)) descendant[tag] = present(descendant[tag]);

  // Anything left is a state (hover:, disabled:, focus-visible:) - not part of a
  // static frame, but recorded so nothing is silently lost.
  const rest = unknown.filter((c) => !matchedDescendants.has(c));
  const states = rest.filter((c) => /^[a-z-]+:/.test(c) && !/^(sm|md|lg|xl|2xl):/.test(c));
  const skipped = rest.filter((c) => !states.includes(c));

  return { css: present(applied), responsive, descendant, states, unresolved: skipped };
}

const specs = { $used: used, $description: `Resolved from ${cssFile} at a ${ROOT_FONT_PX}px root. Generated by scripts/build-figma-specs.mjs - do not edit.`, rootFontPx: ROOT_FONT_PX, components: {} };
let resolved = 0;
for (const [component, entries] of Object.entries(classes)) {
  specs.components[component] = {};
  for (const [key, classList] of Object.entries(entries)) {
    specs.components[component][key] = { classes: classList, ...resolve(classList) };
    resolved++;
  }
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(path.join(OUT_DIR, 'component-specs.json'), JSON.stringify(specs, null, 2) + '\n');
console.log(
  `build-figma-specs: wrote docs/figma/component-specs.json - ${resolved} variants ` +
  `across ${Object.keys(classes).length} components, from ${cssFile}`
);

/* ----------------------------------------------------------- 4. figma plugin */

// Real Hebrew copy, read out of lib/i18n.js, so the page frames show the site's
// actual wording rather than placeholder text.
function hebrew(key) {
  const i18n = readFileSync(path.join(SRC, 'lib', 'i18n.js'), 'utf8');
  const he = i18n.slice(i18n.indexOf('\n  he: {'));
  const m = he.match(new RegExp(`\\b${key}:\\s*[\`'"]([^\`'"]*)`));
  return m ? m[1] : null;
}

const PAGE_FRAMES = [
  { name: 'Home',          titleKey: 'path1_title',          subtitleKey: 'first_circle_welcome', size: 'hero',      tone: 'dark',   band: 'canvas', itemKeys: ['self_help_title', 'treatment_title', 'rights_title'], ctaKey: 'questionnaire_title' },
  { name: 'Questionnaire', titleKey: 'questionnaire_title',  subtitleKey: null,                   size: 'default',   tone: 'muted',  band: 'canvas', itemKeys: [], ctaKey: 'calculate' },
  { name: 'Rights',        titleKey: 'rights_title',         subtitleKey: null,                   size: 'default',   tone: 'muted',  band: 'canvas', itemKeys: ['rights_security', 'rights_sexual', 'rights_hostilities'], ctaKey: null },
  { name: 'Self-help',     titleKey: 'self_help_title',      subtitleKey: null,                   size: 'editorial', tone: 'card',   band: 'canvas', itemKeys: [], ctaKey: null },
  { name: 'Treatment',     titleKey: 'treatment_title',      subtitleKey: null,                   size: 'editorial', tone: 'dark',   band: 'muted',  band2: null, itemKeys: [], ctaKey: null },
  { name: 'Community',     titleKey: 'community_title',      subtitleKey: null,                   size: 'default',   tone: 'card',   band: 'canvas', itemKeys: [], ctaKey: null },
  { name: 'Sources',       titleKey: 'sources_title',        subtitleKey: null,                   size: 'default',   tone: 'muted',  band: 'canvas', itemKeys: [], ctaKey: null },
  { name: 'Calming',       titleKey: 'calming_title',        subtitleKey: null,                   size: 'editorial', tone: 'dark',   band: 'canvas', itemKeys: [], ctaKey: null },
];

const pages = PAGE_FRAMES.map((p) => {
  const items = p.itemKeys.map(hebrew).filter(Boolean);
  return {
    name: p.name,
    title: hebrew(p.titleKey) || p.name,
    subtitle: p.subtitleKey ? hebrew(p.subtitleKey) : null,
    size: p.size,
    tone: p.tone,
    band: p.band,
    items: items.length ? items : ['\u05EA\u05D5\u05DB\u05DF', '\u05EA\u05D5\u05DB\u05DF', '\u05EA\u05D5\u05DB\u05DF'],
    cta: p.ctaKey ? hebrew(p.ctaKey) : null,
  };
});

const PLUGIN_DIR = path.join(ROOT, 'figma-plugin');
mkdirSync(PLUGIN_DIR, { recursive: true });

const pluginData = {
  tokens,
  specs: specs.components,
  strings: { pages },
  meta: { rootFontPx: ROOT_FONT_PX, frameWidth: 1440, frameHeight: 1024, generatedFrom: cssFile },
};

const pluginLogic = readFileSync(path.join(ROOT, 'scripts', 'figma-plugin', 'plugin.js'), 'utf8');
writeFileSync(
  path.join(PLUGIN_DIR, 'code.js'),
  `// GENERATED by scripts/build-figma-specs.mjs - do not edit.\n` +
  `// Regenerate with \`npm run figma\` from src/.\n` +
  `const DATA = ${JSON.stringify(pluginData)};\n\n` + pluginLogic
);

writeFileSync(path.join(PLUGIN_DIR, 'manifest.json'), JSON.stringify({
  name: 'PTSD.IL Design System',
  id: 'ptsd-il-design-system',
  api: '1.0.0',
  main: 'code.js',
  editorType: ['figma'],
  documentAccess: 'dynamic-page',
  networkAccess: { allowedDomains: ['none'] },
}, null, 2) + '\n');

console.log(
  `build-figma-specs: wrote figma-plugin/code.js and manifest.json - ` +
  `${Object.keys(tokens.color).length} colour variables, ${used.button.length} button variants, ${pages.length} page frames`
);
