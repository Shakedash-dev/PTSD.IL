import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CODE = path.join(ROOT, 'figma-plugin', 'code.js');

/**
 * The generated Figma plugin cannot be run here, so this exercises its logic
 * against a mock Figma API. That will not catch a wrong Figma API call, but it
 * does catch the failure modes that come from the data: a spec key that no
 * longer exists, a NaN size, an empty text run - all of which would otherwise
 * only surface when the designer runs the import.
 */
function mockFigma() {
  const problems = [];
  const notes = [];
  const numeric = new Set([
    'itemSpacing', 'paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom',
    'cornerRadius', 'strokeWeight', 'fontSize', 'x', 'y', 'opacity',
  ]);

  function node(type) {
    const n = {
      type,
      children: [],
      appendChild(c) {
        if (!c) problems.push(`appendChild(${c}) on ${type}`);
        this.children.push(c);
      },
      resize(w, h) {
        if (!Number.isFinite(w) || !Number.isFinite(h)) problems.push(`resize(${w},${h}) on ${type}`);
      },
      get height() { return 100; },
      get width() { return 100; },
    };
    return new Proxy(n, {
      set(t, k, v) {
        if (numeric.has(k) && (typeof v !== 'number' || !Number.isFinite(v))) {
          problems.push(`${type}.${String(k)} = ${v}`);
        }
        if (k === 'characters' && (v === undefined || v === null || v === '')) {
          problems.push(`${type}.characters is empty`);
        }
        if (k === 'fontName' && (!v || !v.family)) {
          problems.push(`${type}.fontName = ${JSON.stringify(v)}`);
        }
        t[k] = v;
        return true;
      },
    });
  }

  const created = { component: 0, variable: 0, page: 0, variantSets: [] };
  const figma = {
    notify: (m, o) => { if (o && o.error) problems.push(`notify(error): ${m}`); notes.push(m); },
    closePlugin: () => {},
    createFrame: () => node('FRAME'),
    createComponent: () => { created.component++; return node('COMPONENT'); },
    createText: () => node('TEXT'),
    createRectangle: () => node('RECTANGLE'),
    createPage: () => { created.page++; return node('PAGE'); },
    loadFontAsync: async () => {},
    combineAsVariants: (nodes) => { created.variantSets.push(nodes.length); return node('COMPONENT_SET'); },
    variables: {
      createVariableCollection: (n) => ({ name: n, modes: [{ modeId: 'm1' }] }),
      createVariable: () => { created.variable++; return { setValueForMode() {}, set description(v) {} }; },
      setBoundVariableForPaint: (paint) => paint,
    },
    set currentPage(p) {},
  };
  return { figma, problems, notes, created };
}

describe('generated Figma plugin', () => {
  it('is present and syntactically valid', () => {
    expect(fs.existsSync(CODE), 'run `npm run figma` from src/').toBe(true);
    expect(() => new Function(fs.readFileSync(CODE, 'utf8'))).not.toThrow();
  });

  it('embeds tokens, specs and Hebrew page copy', () => {
    const src = fs.readFileSync(CODE, 'utf8');
    const data = JSON.parse(src.match(/const DATA = (\{.*?\});\n/s)[1]);
    expect(Object.keys(data.tokens.color).length).toBeGreaterThan(30);
    expect(Object.keys(data.specs.button).filter((k) => k.startsWith('used/')).length).toBeGreaterThan(10);
    expect(data.strings.pages.length).toBeGreaterThan(4);
    // Hebrew, not a placeholder or an untranslated key.
    for (const page of data.strings.pages) {
      expect(page.title, `${page.name} title`).toMatch(/[֐-׿]/);
    }
    expect(data.meta.rootFontPx).toBe(18);
  });

  it('runs end to end without a data or geometry fault', async () => {
    const { figma, problems, created } = mockFigma();
    const previous = globalThis.figma;
    globalThis.figma = figma;
    try {
      const src = fs.readFileSync(CODE, 'utf8');
      // eslint-disable-next-line no-new-func
      await new Function(src)();
      await new Promise((r) => setTimeout(r, 50));
    } finally {
      globalThis.figma = previous;
    }
    expect([...new Set(problems)]).toEqual([]);
    expect(created.variable).toBeGreaterThan(30);
    expect(created.component).toBeGreaterThan(20);
    expect(created.variantSets.length).toBeGreaterThanOrEqual(2);
  });
});
