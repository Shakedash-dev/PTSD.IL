// Which playbook does /chat match for each test question? Run it before and
// after a deploy that touches playbook matching and compare the two.
//
//   node scripts/qa-match-compare.mjs questions.txt --out before.json
//   (deploy + reindex)
//   node scripts/qa-match-compare.mjs questions.txt --out after.json --compare before.json
//
//   node scripts/qa-match-compare.mjs --from-db 40 --out before.json
//
// Questions: a text file, one per line, optionally `<lang><TAB><question>`
// (default lang he; lines starting with # are skipped). `--from-db N` instead
// takes the question and first paraphrase of N published chatbot-qa rows from
// the content API. `--worker <url>` targets another Worker (staging).
//
// Reads `playbook: { groupId, strength, score }` from the SSE `done` event
// (worker/src/lib/chat.ts; null when no playbook was used). Each question is a
// real chat: one Gemini call and one rate-limit KV write (the free plan has
// 1,000 KV writes a day), each with its own random sessionId (20 chats an hour
// per session).
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  if (i < 0) return undefined;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const WORKER = (opt('--worker') || 'https://ptsd-chatbot-worker.ptsd-il.workers.dev').replace(/\/+$/, '');
const API = (opt('--api') || 'https://ptsd-il-api.onrender.com/api').replace(/\/+$/, '');
const OUT = opt('--out');
const COMPARE = opt('--compare');
const FROM_DB = opt('--from-db');
// Cloudflare answers 403 to some default client User-Agents.
const USER_AGENT = 'ptsd-il-qa-match-compare/1.0';
const SCORE_EPS = 0.01;

function die(msg) { console.error(`\n✗ ${msg}`); process.exit(1); }

async function fromDb(n) {
  const res = await fetch(`${API}/articles?categorySlug=chatbot-qa`, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) die(`GET /articles -> ${res.status}`);
  const rows = (await res.json()).filter((r) => r.isPublished !== false);
  const out = [];
  for (const r of rows.slice(0, n)) {
    let c = {};
    try { c = JSON.parse(r.content || '{}'); } catch { continue; }
    const lang = r.langId || 'he';
    if (c.question) out.push({ lang, question: c.question, expect: r.groupId });
    if (c.paraphrases?.[0]) out.push({ lang, question: c.paraphrases[0], expect: r.groupId });
  }
  return out;
}

function fromFile(file) {
  if (!file || !fs.existsSync(file)) die('Give a questions file (one per line, optionally "<lang><TAB><question>") or --from-db N.');
  return fs.readFileSync(file, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => {
    const tab = l.indexOf('\t');
    return tab > 0 ? { lang: l.slice(0, tab).trim(), question: l.slice(tab + 1).trim() } : { lang: 'he', question: l };
  });
}

// One chat; the `done` event's playbook, or an error string.
async function ask({ lang, question }) {
  const res = await fetch(`${WORKER}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': USER_AGENT },
    body: JSON.stringify({ messages: [{ role: 'user', content: question }], lang, sessionId: randomUUID() }),
  });
  if (!res.ok) return { error: `HTTP ${res.status}` };
  const text = await res.text();
  for (const frame of text.split('\n\n')) {
    const ev = frame.match(/^event: (\w+)/)?.[1];
    const data = frame.split('\ndata: ')[1];
    if (ev === 'error') return { error: data };
    if (ev === 'done') {
      const d = JSON.parse(data || '{}');
      if (!('playbook' in d)) return { error: 'no playbook field in done (Worker older than this script)' };
      return { playbook: d.playbook };
    }
  }
  return { error: 'no done event' };
}

const fmt = (p) => (p ? `${p.groupId} ${p.strength} ${p.score.toFixed(4)}` : '-');

const questions = FROM_DB ? await fromDb(Number(FROM_DB) || 20) : fromFile(args[0]);
const before = COMPARE ? JSON.parse(fs.readFileSync(COMPARE, 'utf8')) : null;
const byKey = new Map((before ?? []).map((r) => [`${r.lang}\t${r.question}`, r]));
const results = [];
let same = 0, changed = 0;
for (const q of questions) {
  const r = { ...q, ...(await ask(q)) };
  results.push(r);
  let line = `${q.lang}  ${q.question.slice(0, 60).padEnd(60)}  ${r.error ? `ERROR ${r.error}` : fmt(r.playbook)}`;
  if (q.expect && r.playbook && r.playbook.groupId !== q.expect) line += `  (row's own group: ${q.expect})`;
  const b = byKey.get(`${q.lang}\t${q.question}`);
  if (b && !r.error && !b.error) {
    const p0 = b.playbook, p1 = r.playbook;
    const ok = (!p0 && !p1) || (p0 && p1 && p0.groupId === p1.groupId && p0.strength === p1.strength);
    if (ok) same++; else changed++;
    line += ok ? (p0 && p1 && Math.abs(p0.score - p1.score) > SCORE_EPS ? `  score ${p0.score.toFixed(4)} -> ${p1.score.toFixed(4)}` : '') : `  CHANGED from ${fmt(p0)}`;
  }
  console.log(line);
}
if (OUT) fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
if (before) console.log(`\n${same} same, ${changed} changed (group or strength), of ${same + changed} compared`);
if (results.some((r) => r.error)) process.exitCode = 1;
