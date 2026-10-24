// Resolves the demo's imports so the generator can read its data modules
// unchanged: `@/...` points at the repo's src/, and a relative import written
// without a file extension (which Vite allows and node does not) is tried
// against .js, .jsx and /index.js.
import fs from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

const SRC = '/Users/ofrieven/Documents/claude/PTSD.IL/src/';

function firstFile(base) {
  for (const c of [base, base + '.js', base + '.jsx', base + '/index.js']) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

export async function resolve(spec, ctx, next) {
  let base = null;
  if (spec.startsWith('@/')) base = SRC + spec.slice(2);
  else if (spec.startsWith('.') && ctx.parentURL?.startsWith('file:')) {
    base = path.resolve(path.dirname(fileURLToPath(ctx.parentURL)), spec);
  }
  const hit = base && firstFile(base);
  if (hit) return { url: pathToFileURL(hit).href, shortCircuit: true };
  return next(spec, ctx);
}

// Vite imports JSON with a plain `import x from "./x.json"`; node needs an
// import attribute. Added here rather than in the demo's own files, which are
// read-only as far as the prototype is concerned.
export async function load(url, ctx, next) {
  const r = await next(url, ctx);
  if (r.format === 'module' && typeof r.source !== 'undefined') {
    const src = r.source.toString();
    if (/\.json['"];?\s*$/m.test(src)) {
      return { ...r, source: src.replace(/(from\s+['"][^'"]+\.json['"])\s*;/g, "$1 with { type: 'json' };") };
    }
  }
  return r;
}
