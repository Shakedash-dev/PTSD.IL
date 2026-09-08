import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Recursively collect .jsx files under a directory, skipping build output. */
function collect(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collect(full));
    else if (entry.name.endsWith('.jsx')) out.push(full);
  }
  return out;
}

const rel = (f) => path.relative(SRC, f).split(path.sep).join('/');

// Tailwind's built-in palettes. Using them directly bypasses the token layer,
// so a designer changing a token would not change these call sites.
const RAW_PALETTE = String.raw`\b(?:text|bg|border|from|to|via|ring|divide|outline)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|[1-9]00)\b`;

// Physical direction utilities. In an RTL-first site these must be logical
// (ms/me/ps/pe/start/end) so Hebrew and Arabic mirror automatically.
const PHYSICAL = String.raw`\b(?:ml|mr|pl|pr)-(?:\d+(?:\.\d+)?|px|auto|full|\d+\/\d+|\[[^\]]+\])\b|\b(?:left|right)-(?:\d+(?:\.\d+)?|px|auto|full|\d+\/\d+|\[[^\]]+\])\b|\btext-(?:left|right)\b|\b(?:rounded|border)-(?:l|r)-`;

function violations(files, pattern, { allow = [] } = {}) {
  const re = new RegExp(pattern, 'g');
  const found = [];
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    src.split('\n').forEach((line, i) => {
      const loc = `${rel(file)}:${i + 1}`;
      if (allow.includes(loc)) return;
      for (const m of line.matchAll(re)) found.push(`${loc}  ${m[0]}`);
    });
  }
  return found;
}

const pages = () => collect(path.join(SRC, 'pages'));
const nonUiComponents = () =>
  collect(path.join(SRC, 'components')).filter((f) => !rel(f).startsWith('components/ui/'));

describe('design system: off-token colors', () => {
  it('pages use no raw Tailwind palette colors', () => {
    const found = violations(pages(), RAW_PALETTE);
    expect(found, `Use semantic tokens instead:\n${found.join('\n')}`).toEqual([]);
  });

  it('components outside ui/ use no raw Tailwind palette colors', () => {
    const found = violations(nonUiComponents(), RAW_PALETTE);
    expect(found, `Use semantic tokens instead:\n${found.join('\n')}`).toEqual([]);
  });
});

describe('design system: primitives', () => {
  it('pages render no bare <button> elements', () => {
    const found = violations(pages(), String.raw`<button(?=[\s>]|$)`);
    expect(found, `Use <Button> from @/components/ui/button:\n${found.join('\n')}`).toEqual([]);
  });

  it('components outside ui/ render no bare <button> elements', () => {
    const found = violations(nonUiComponents(), String.raw`<button(?=[\s>]|$)`);
    expect(found, `Use <Button> from @/components/ui/button:\n${found.join('\n')}`).toEqual([]);
  });
});

describe('design system: legacy palette', () => {
  it('no references remain to the retired teal/clay/sage/oatmeal/midnight colors', () => {
    const files = [...pages(), ...nonUiComponents()];
    const pattern = String.raw`\b(?:text|bg|border|from|to|via|shadow)-(?:teal|clay|sage|oatmeal|midnight)(?:-[a-z]+)?\b`;
    const found = violations(files, pattern);
    expect(found, `These resolve to nothing after the token migration:\n${found.join('\n')}`).toEqual([]);
  });
});

describe('design system: RTL', () => {
  // Genuinely physical, not directional. Centering geometry and an explicitly
  // dir="ltr" floating control are not mirrored by language.
  const PHYSICAL_ALLOW = [];

  it('uses logical direction utilities, not physical ones', () => {
    const found = violations([...pages(), ...nonUiComponents()], PHYSICAL, {
      allow: PHYSICAL_ALLOW,
    });
    expect(found, `Use ms-/me-/ps-/pe-/start-/end-:\n${found.join('\n')}`).toEqual([]);
  });

  it('reads direction through useDirection(), not the DOM', () => {
    const files = [...pages(), ...collect(path.join(SRC, 'components'))];
    const found = violations(files, String.raw`documentElement\.getAttribute\(['"]dir['"]\)`);
    expect(found, `Use useDirection() from @/lib/useDirection:\n${found.join('\n')}`).toEqual([]);
  });
});
