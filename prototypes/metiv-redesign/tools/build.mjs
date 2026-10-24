// Writes the generated pages into the prototype folder.
//
// The pages listed here are GENERATED: running this overwrites them, so a
// hand edit to one of them belongs in the generator, not in the .html file.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const modules = ['./pages-patient.mjs', './pages-site.mjs'];
let n = 0;
for (const m of modules) {
  const mod = await import(m);
  for (const p of mod.all()) {
    fs.writeFileSync(path.join(ROOT, p.file), p.html);
    n++;
    console.log('wrote', p.file, p.html.length);
  }
}
console.log(n, 'pages');

// The menu is wired after the pages exist, so a new page is linked the moment
// it is generated.
await import('./wire.mjs');
