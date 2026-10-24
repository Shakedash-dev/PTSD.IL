// Copies the standalone redesign prototype into the built site, so it is
// served at /metiv-site-demo-v3/redesign-v1/ without being part of the app.
//
// The prototype is plain HTML, CSS and JS with no build of its own and no
// import from src/. It lives in prototypes/ and is copied here at the end of
// the site's build, which is the only place the two ever meet: nothing in the
// app imports it, and nothing in it imports the app.
//
// The path sits under the v3 demo's route on purpose - it is a redesign *of*
// that demo, and the URL says so. /metiv-site-demo-v3 itself stays a client
// route of the React app: only the redesign-v1 folder below it exists on
// disk, so a request for the demo still falls through to index.html.
//
// This file lives with the prototype, not with the site's own scripts: the
// whole redesign - pages, stylesheet, images, generator and this step - is
// one folder, and `postbuild` in src/package.json is the single line of it
// that has to sit anywhere else. Remove that line and the prototype stops
// shipping; nothing else in the repo knows it exists.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FROM = path.resolve(HERE, '..');
const REPO = path.resolve(HERE, '..', '..', '..');
const INTO = path.join(REPO, 'src', 'dist', 'metiv-site-demo-v3', 'redesign-v1');

// Build tooling is not needed to view the prototype and has no business being
// served with it.
const SKIP = new Set(['tools', 'node_modules', '.DS_Store']);

if (!fs.existsSync(FROM)) {
  console.error(`[redesign] nothing at ${FROM} - skipped`);
  process.exit(0);
}
if (!fs.existsSync(path.join(REPO, 'src', 'dist'))) {
  console.error('[redesign] src/dist does not exist - run this after the site build');
  process.exit(1);
}

fs.rmSync(INTO, { recursive: true, force: true });
fs.mkdirSync(INTO, { recursive: true });

let files = 0;
fs.cpSync(FROM, INTO, {
  recursive: true,
  filter: (src) => {
    if (SKIP.has(path.basename(src))) return false;
    if (fs.statSync(src).isFile()) files++;
    return true;
  },
});

console.log(`[redesign] ${files} files -> dist/metiv-site-demo-v3/redesign-v1/`);
