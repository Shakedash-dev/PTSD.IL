// Defers the chatbot reindex of a "save all" batch until its writes are done.
//
// The admin sources (adminSource, metivAdminSource, chatbotQaAdminSource) ask
// for a reindex after every content write through requestReindex(). Outside a
// batch that is the worker call itself (reindexItem), as before. While a batch
// runs (PendingChanges.jsx, between collectReindexes() and the function it
// returns) the id is only recorded: the batch writes everything first, then
// queues the recorded ids, deduped, with limited concurrency - so a slow worker
// no longer holds up the content writes, and its failure is a warning about the
// chatbot, never a failed save.
//
// The collector is module state: one tab runs at most one batch at a time (the
// save button is disabled while one runs), and nothing else in the admin
// requests a reindex.

import { reindexItem } from './reindex';

/** @type {Set<string>|null} */
let collecting = null;

/**
 * Reindex one item now, or record it for the running batch.
 * @param {string|undefined|null} itemId
 */
export function requestReindex(itemId) {
  if (!itemId) return Promise.resolve(null);
  if (collecting) {
    collecting.add(itemId);
    return Promise.resolve(null);
  }
  return reindexItem(itemId);
}

/**
 * Start recording reindex requests. The returned function stops recording and
 * hands back the recorded ids, each once.
 * @returns {() => string[]}
 */
export function collectReindexes() {
  const ids = new Set();
  collecting = ids;
  return () => {
    if (collecting === ids) collecting = null;
    return [...ids];
  };
}
