// Tiny static server for the prototypes in this folder. No dependencies, and
// no reliance on the process working directory: the root is resolved from this
// file's own location.
//
//   node prototypes/serve.mjs [port] [folder]
//
// Defaults to port 5180 serving prototypes/metiv-redesign.

import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const port = Number(process.argv[2]) || 5180;
const root = resolve(here, process.argv[3] || 'metiv-redesign');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.md': 'text/markdown; charset=utf-8',
};

createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = join(root, normalize(rel).replace(/^(\.\.[/\\])+/, ''));

  if (!file.startsWith(root)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  let stat;
  try {
    stat = statSync(file);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('לא נמצא');
    return;
  }
  if (stat.isDirectory()) {
    res.writeHead(302, { Location: rel + '/' }).end();
    return;
  }

  res.writeHead(200, {
    'Content-Type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream',
    'Content-Length': stat.size,
    'Cache-Control': 'no-store',
  });
  createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => {
  console.log(`prototype server: http://localhost:${port}  (root: ${root})`);
});
