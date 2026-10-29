// Full reindex of the chatbot (playbook shards and rows in KV, content vectors),
// step by step. ~90 short steps today (docs/chatbot-guide.md section 18).
//
//   node scripts/reindex-all.mjs                                   # production Worker
//   node scripts/reindex-all.mjs https://ptsd-chatbot-worker-staging.ptsd-il.workers.dev
//
// The Worker does one bounded slice per POST /reindex {scope:"all"} (the free
// plan caps a call at 50 subrequests and 10 ms of CPU) and returns a cursor;
// this loops until it says done. A failed call is retried up to 3 times with backoff, with the same
// cursor, so a retry never redoes finished work.
//
// Auth: an admin JWT, read from ADMIN_TOKEN in the environment or from `.env.admin`
// (gitignored via `.env.*`). The worker verifies it against /api/admin/articles.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const WORKER = (process.argv[2] || 'https://ptsd-chatbot-worker.ptsd-il.workers.dev').replace(/\/+$/, '');
const RETRIES = 3;
const MAX_STEPS = 500; // a guard against a cursor that never finishes
// Cloudflare answers 403 to some default client User-Agents.
const USER_AGENT = 'ptsd-il-reindex-all/1.0';

function readEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs.readFileSync(file, 'utf8').split('\n')
      .map(l => l.trim()).filter(l => l && !l.startsWith('#') && l.includes('='))
      .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; })
  );
}
const TOKEN = (process.env.ADMIN_TOKEN || readEnvFile(path.join(ROOT, '.env.admin')).ADMIN_TOKEN || '').trim();

function die(msg) { console.error(`\n✗ ${msg}`); process.exit(1); }
if (!TOKEN) die('No admin token. Put ADMIN_TOKEN=<jwt> in .env.admin (an admin login keeps it in sessionStorage as ptsd_admin_token).');

// Read the expiry (no signature check - the Worker does that) to fail early and clearly.
try {
  const { exp } = JSON.parse(Buffer.from(TOKEN.split('.')[1], 'base64url').toString('utf8'));
  if (typeof exp === 'number' && exp * 1000 < Date.now()) die(`Token expired at ${new Date(exp * 1000).toISOString()}. Sign in again and copy a fresh one.`);
} catch { die('ADMIN_TOKEN is not a JWT.'); }

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function step(cursor) {
  const res = await fetch(`${WORKER}/reindex`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': USER_AGENT },
    body: JSON.stringify({ scope: 'all', ...(cursor ? { cursor } : {}) }),
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`POST /reindex -> ${res.status} ${text.slice(0, 300)}`);
    err.fatal = res.status === 400 || res.status === 401; // bad cursor or token: retrying won't help
    throw err;
  }
  const body = JSON.parse(text);
  if (!body.ok || (!body.done && !body.cursor)) throw new Error(`unexpected response: ${text.slice(0, 300)}`);
  return body;
}

async function stepWithRetry(cursor) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await step(cursor);
    } catch (e) {
      if (e.fatal || attempt >= RETRIES) throw e;
      const wait = 2000 * 2 ** attempt;
      console.log(`  ! ${e.message} - retry ${attempt + 1}/${RETRIES} in ${wait / 1000}s`);
      await sleep(wait);
    }
  }
}

console.log(`full reindex of ${WORKER}`);
const started = Date.now();
let cursor;
for (let i = 1; i <= MAX_STEPS; i++) {
  let r;
  try {
    r = await stepWithRetry(cursor);
  } catch (e) {
    die(`step ${i} failed: ${e.message}${cursor ? '\nRe-run to start over (finished chunks are already live).' : ''}`);
  }
  const { phase, slice, processed, total } = r.progress;
  console.log(`step ${i}: ${phase}${slice ? `/${slice}` : ''} ${processed}/${total}${r.done ? ' - done' : ''}`);
  if (r.done) {
    console.log(`\n✓ ${r.upserted} chunks upserted, ${r.qa} playbook rows, ${r.excluded} excluded rows (${Math.round((Date.now() - started) / 1000)}s)`);
    process.exit(0);
  }
  cursor = r.cursor;
}
die(`not done after ${MAX_STEPS} steps - stopping.`);
