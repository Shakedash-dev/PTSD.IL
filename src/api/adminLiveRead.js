// The dev server's read-only admin (src/lib/adminPreview.js): the admin's GET
// calls answered from the LIVE API through its public endpoints, so the panel
// shows the real content without a session. Every Metiv, PTSD-IL and chatbot
// Q&A row is published, so the public lists hold everything the admin lists
// would. What only exists behind a login (the user list, the unpublished edit
// log) is empty or refused here.
//
// Loaded by a dynamic import inside the preview branch of adminApi(), so it is
// never part of a production build. Writes never get here - adminApi() refuses
// them first.

const API = import.meta.env.VITE_API_URL;

/** Admin path -> public path. Exported for tests. @param {string} path */
export function publicPathFor(path) {
  const [base, query = ''] = path.split('?');
  const qs = query ? `?${query}` : '';
  if (base === '/admin/articles') return `/articles${qs}`;
  if (base === '/admin/questionnaires') return `/questionnaires${qs}`;
  if (base.startsWith('/admin/questionnaires/')) return `${base.slice('/admin'.length)}${qs}`;
  if (base === '/admin/users') return null;
  if (base.startsWith('/admin/')) return null;
  return path;
}

/** @param {string} path */
export async function liveGet(path) {
  const target = publicPathFor(path);
  if (target === null) {
    if (path.startsWith('/admin/users')) throw new Error('רשימת המשתמשים אינה ציבורית: היא מוצגת רק אחרי התחברות');
    throw new Error(`אין מקבילה ציבורית לקריאה ${path} במצב קריאה בלבד`);
  }
  const res = await fetch(`${API}${target}`);
  if (!res.ok) throw new Error(`${res.status} ${await res.text().catch(() => '')}`.trim());
  return res.json();
}

/**
 * A stand-in for the chatbot worker's POST /translate, so the translation
 * flow can be seen without a session: every text comes back prefixed with its
 * language. French answers "flagged" so the warning state is visible too.
 * Nothing it returns can be saved - the preview refuses every write.
 * @param {{ target: string, items: Record<string, string> }} body
 */
export async function previewTranslate({ target, items }) {
  await new Promise(r => setTimeout(r, 400));
  const flagged = target === 'fr';
  return {
    items: Object.fromEntries(Object.entries(items).map(([k, v]) => [k, `[${target}] ${v}`])),
    status: /** @type {'flagged'|'pass'} */ (flagged ? 'flagged' : 'pass'),
    notes: flagged ? ['מצב קריאה בלבד: דוגמה לתרגום שסומן לבדיקה'] : [],
    model: 'preview',
  };
}
