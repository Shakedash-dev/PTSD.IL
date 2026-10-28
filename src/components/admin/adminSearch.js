// Search over everything the Metiv admin can edit in one language: the Metiv
// rows' visible text, the PTSD-IL panels' items and the chatbot Q&A. Pure
// functions; MetivAdmin.jsx builds the entries and renders the results.
//
// Matching is Hebrew-friendly: niqqud and cantillation marks are ignored,
// geresh/gershayim and every quote variant are dropped (פנד"ה = פנד״ה = פנדה),
// final letters match their regular form (ם = מ), and Latin is case-folded.

const MARKS = /[֑-ׇ]/;
const QUOTES = /['"`׳״‘’“”„´]/;
const FINALS = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };

/**
 * The searchable form of a text, and for each of its characters the index of
 * the character in the original it came from (to cut a snippet).
 * @param {string} text
 * @returns {{ norm: string, map: number[] }}
 */
export function normalizeWithMap(text) {
  let norm = '';
  /** @type {number[]} */
  const map = [];
  let space = false;
  const src = String(text ?? '');
  for (let i = 0; i < src.length; i++) {
    let ch = src[i];
    if (MARKS.test(ch) || QUOTES.test(ch)) continue;
    if (/\s/.test(ch)) {
      if (space || !norm) continue;
      space = true;
      norm += ' ';
      map.push(i);
      continue;
    }
    space = false;
    ch = FINALS[/** @type {keyof typeof FINALS} */ (ch)] ?? ch.toLowerCase();
    norm += ch;
    map.push(i);
  }
  return { norm: norm.trimEnd(), map };
}

/** @param {string} text */
export function normalize(text) {
  return normalizeWithMap(text).norm;
}

/**
 * @typedef {{ pageId: string, sectionId: string, sectionLabel: string, focus: Record<string, any>, title: string, text: string }} SearchEntry
 *   focus: what to open - { rowId } for a Metiv item, { path } for a field,
 *   { panel, itemId, cat?, age? } for a PTSD-IL item, { qaId } for a Q&A row
 * @typedef {SearchEntry & { snippet: { before: string, match: string, after: string } }} SearchHit
 */

/**
 * The part of `text` around the first match, as before / match / after.
 * @param {string} text @param {string} q normalized query
 */
export function snippetOf(text, q, radius = 50) {
  const { norm, map } = normalizeWithMap(text);
  const at = norm.indexOf(q);
  const flat = String(text).replace(/\s+/g, ' ');
  if (at < 0) return { before: '', match: '', after: flat.slice(0, radius * 2) };
  const start = map[at];
  const end = map[at + q.length - 1] + 1;
  const from = Math.max(0, start - radius);
  const to = Math.min(text.length, end + radius);
  const clean = s => s.replace(/\s+/g, ' ');
  return {
    before: (from > 0 ? '...' : '') + clean(text.slice(from, start)),
    match: clean(text.slice(start, end)),
    after: clean(text.slice(end, to)) + (to < text.length ? '...' : ''),
  };
}

/**
 * Entries matching every word of the query, title matches first.
 * @param {SearchEntry[]} entries @param {string} query @param {number} [limit]
 * @returns {SearchHit[]}
 */
export function searchEntries(entries, query, limit = 60) {
  const q = normalize(query);
  if (q.length < 2) return [];
  const words = q.split(' ').filter(Boolean);
  /** @type {(SearchHit & { score: number })[]} */
  const hits = [];
  for (const e of entries) {
    const title = normalize(e.title);
    const body = normalize(e.text);
    const all = `${title} ${body}`;
    if (!words.every(w => all.includes(w))) continue;
    const inTitle = title.includes(q);
    const shown = inTitle || !body.includes(q) ? e.title : e.text;
    const first = words.find(w => normalize(shown).includes(w)) ?? q;
    hits.push({ ...e, score: inTitle ? 0 : body.includes(q) ? 1 : 2, snippet: snippetOf(shown, inTitle || body.includes(q) ? q : first) });
  }
  hits.sort((a, b) => a.score - b.score);
  return hits.slice(0, limit).map(({ score: _score, ...h }) => h);
}

/** Hits grouped by page, pages in the order of `pageOrder`. @param {SearchHit[]} hits @param {string[]} pageOrder */
export function groupByPage(hits, pageOrder) {
  /** @type {Map<string, SearchHit[]>} */
  const by = new Map();
  for (const h of hits) {
    if (!by.has(h.pageId)) by.set(h.pageId, []);
    by.get(h.pageId).push(h);
  }
  const rank = id => { const i = pageOrder.indexOf(id); return i < 0 ? Infinity : i; };
  return [...by.entries()].sort((a, b) => rank(a[0]) - rank(b[0]));
}

/** Plain text of an HTML or Markdown fragment. @param {string} s */
export function plainText(s) {
  return String(s ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/[#*_>`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
