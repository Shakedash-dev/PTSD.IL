// A minimal concurrency limiter: at most `limit` of the functions handed to it
// run at once, the rest wait in the order they were handed in. Used by the
// admin "save all" batch (src/components/admin/PendingChanges.jsx) for its
// writes and for the chatbot reindex queue after them.

/**
 * @param {number} limit
 * @returns {<T>(fn: () => Promise<T>) => Promise<T>}
 */
export function createLimiter(limit) {
  let active = 0;
  /** @type {Array<{ fn: () => Promise<any>, resolve: (v: any) => void, reject: (e: any) => void }>} */
  const queue = [];
  const next = () => {
    if (active >= limit || !queue.length) return;
    active += 1;
    const { fn, resolve, reject } = queue.shift();
    Promise.resolve()
      .then(fn)
      .then(resolve, reject)
      .finally(() => { active -= 1; next(); });
  };
  return fn => new Promise((resolve, reject) => {
    queue.push({ fn, resolve, reject });
    next();
  });
}
