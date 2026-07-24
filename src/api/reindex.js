// Keeps the chatbot's vector DB in sync with admin content changes. After an
// admin create/update/delete succeeds against the content API, we tell the
// chatbot worker to re-embed (or drop) that single item, so the bot's answers
// reflect the edit without a manual full reindex.
//
// The worker's /reindex resolves the id against articles then communities; a
// deleted id (404 on both) removes its vectors. Auth reuses the admin JWT
// (getToken) — the worker verifies it against the API's admin endpoint, same
// token that authorized the content write.

import { getToken } from '@/lib/auth';

// Thrown when the content write succeeded but the vector-DB sync did not. Callers
// treat this as a non-fatal warning (the content IS saved) rather than a failed
// write - see runWrite() in src/pages/Admin.jsx.
export class ChatbotSyncError extends Error {
  constructor(message = 'התוכן נשמר, אך סנכרון הצ׳אטבוט נכשל') {
    super(message);
    this.name = 'ChatbotSyncError';
  }
}

// Re-embed a single content item (article or community) on the chatbot worker.
// Throws ChatbotSyncError on any failure so it can be told apart from a failed
// content write.
export async function reindexItem(itemId) {
  if (!itemId) return null;
  const chatbotUrl = import.meta.env.VITE_CHATBOT_URL;
  if (!chatbotUrl) {
    throw new ChatbotSyncError('כתובת הצ׳אטבוט (VITE_CHATBOT_URL) לא הוגדרה');
  }
  const token = getToken();
  let res;
  try {
    res = await fetch(`${chatbotUrl}/reindex`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ scope: 'item', itemId }),
    });
  } catch (err) {
    throw new ChatbotSyncError(`סנכרון הצ׳אטבוט נכשל: ${err?.message || 'שגיאת רשת'}`);
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new ChatbotSyncError(`סנכרון הצ׳אטבוט נכשל (${res.status}) ${detail}`.trim());
  }
  return res.json().catch(() => null);
}
