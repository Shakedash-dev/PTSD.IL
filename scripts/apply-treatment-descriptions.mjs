// Writes the treatment method descriptions in scripts/treatment_method_descriptions.json
// into the live DB, then re-embeds each changed row in the chatbot's vector DB.
//
//   node scripts/apply-treatment-descriptions.mjs            # dry run: shows what would change
//   node scripts/apply-treatment-descriptions.mjs --apply    # writes + reindexes + verifies
//
// Auth: an admin JWT, read from ADMIN_TOKEN in the environment or from `.env.admin`
// (gitignored via `.env.*`). The same token authorises both the API write and the
// worker's /reindex - the worker verifies it by calling /api/admin/articles.
//
// Only `methods[i].description` changes. Method titles must match exactly or the
// script aborts before writing anything; how_to_start, links and every other field
// are carried over untouched. The PATCH sends `content` only.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const APPLY = process.argv.includes('--apply');

function readEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs.readFileSync(file, 'utf8').split('\n')
      .map(l => l.trim()).filter(l => l && !l.startsWith('#') && l.includes('='))
      .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; })
  );
}
// The app's VITE_* settings live in src/.env; the root .env is checked as a fallback.
const rootEnv = { ...readEnvFile(path.join(ROOT, '.env')), ...readEnvFile(path.join(ROOT, 'src', '.env')) };
const adminEnv = readEnvFile(path.join(ROOT, '.env.admin'));
const API = process.env.VITE_API_URL || rootEnv.VITE_API_URL;
const CHATBOT = process.env.VITE_CHATBOT_URL || rootEnv.VITE_CHATBOT_URL;
const TOKEN = (process.env.ADMIN_TOKEN || adminEnv.ADMIN_TOKEN || '').trim();

function die(msg) { console.error(`\n✗ ${msg}`); process.exit(1); }
if (!API) die('VITE_API_URL not found in src/.env');
if (!TOKEN) die('No admin token. Put ADMIN_TOKEN=<jwt> in .env.admin (see instructions).');

// Read the claims (no signature check - the server does that) to fail early and clearly.
let claims;
try { claims = JSON.parse(Buffer.from(TOKEN.split('.')[1], 'base64url').toString('utf8')); }
catch { die('ADMIN_TOKEN is not a JWT.'); }
const roles = claims.roles || [];
if (!roles.some(r => r === 'admin' || r === 'moderator')) die(`Token roles ${JSON.stringify(roles)} cannot write articles (needs admin or moderator).`);
if (typeof claims.exp === 'number' && claims.exp * 1000 < Date.now()) die(`Token expired at ${new Date(claims.exp * 1000).toISOString()}. Sign in again and copy a fresh one.`);
console.log(`token ok - roles ${roles.join(',')}, expires ${claims.exp ? new Date(claims.exp * 1000).toISOString() : 'n/a'}`);

async function call(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${url} -> ${res.status} ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

const wanted = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'treatment_method_descriptions.json'), 'utf8'));

// 1. Build every change first; abort on any mismatch before a single write.
const plan = [];
for (const [lang, steps] of Object.entries(wanted)) {
  const rows = await call('GET', `${API}/admin/articles?type=treatment_step&langId=${lang}`);
  for (const [step, methods] of Object.entries(steps)) {
    const row = rows.find(r => r.sortOrder === Number(step) && r.langId === lang);
    if (!row) die(`${lang}: no treatment_step with sortOrder ${step}`);
    const content = JSON.parse(row.content);
    const titles = (content.methods || []).map(m => m.title);
    const missing = Object.keys(methods).filter(t => !titles.includes(t));
    const extra = titles.filter(t => !(t in methods));
    if (missing.length || extra.length) die(`${lang} step ${step}: titles differ. not in DB: ${JSON.stringify(missing)} / not in file: ${JSON.stringify(extra)}`);
    let changed = 0;
    const next = { ...content, methods: content.methods.map(m => {
      if (m.description === methods[m.title]) return m;
      changed++;
      return { ...m, description: methods[m.title] };
    }) };
    plan.push({ lang, step, id: row.id, title: row.title, before: content, next, changed });
  }
}

const total = plan.reduce((n, p) => n + p.changed, 0);
for (const p of plan) console.log(`${p.lang} step ${p.step} (${p.id}): ${p.changed} description(s) to change`);
console.log(`\n${total} descriptions across ${plan.filter(p => p.changed).length} rows`);
if (!APPLY) { console.log('\ndry run - nothing written. Re-run with --apply.'); process.exit(0); }
if (!CHATBOT) die('VITE_CHATBOT_URL not found in src/.env - refusing to write without being able to reindex.');

// 2. Write, read back, reindex - one row at a time, stop on the first failure.
const reindexFailures = [];
for (const p of plan.filter(x => x.changed)) {
  await call('PATCH', `${API}/admin/articles/${p.id}`, { content: JSON.stringify(p.next) });
  const back = JSON.parse((await call('GET', `${API}/admin/articles/${p.id}`)).content);
  for (const m of back.methods) {
    const exp = p.next.methods.find(x => x.title === m.title);
    if (m.description !== exp.description || m.how_to_start !== exp.how_to_start) die(`${p.lang} step ${p.step}: read-back mismatch on "${m.title}" - stopping.`);
  }
  try {
    await call('POST', `${CHATBOT}/reindex`, { scope: 'item', itemId: p.id });
    console.log(`✓ ${p.lang} step ${p.step}: saved, verified, reindexed`);
  } catch (e) {
    reindexFailures.push(p.id);
    console.log(`! ${p.lang} step ${p.step}: saved and verified, but reindex failed: ${e.message}`);
  }
}
console.log(reindexFailures.length
  ? `\nDB updated. Reindex failed for ${reindexFailures.length} row(s): ${reindexFailures.join(', ')} - re-run with --apply (it will skip unchanged rows) or reindex them from /admin.`
  : '\nDone: DB updated and every changed row re-embedded in the vector DB.');
