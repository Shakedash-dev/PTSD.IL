// In-memory KVNamespace stand-in: get (text, or `arrayBuffer` as the type or
// `{ type }`), put (string or ArrayBuffer, with metadata), delete, list by
// prefix with metadata (`limit` honoured; cacheTtl and expirationTtl ignored).
// `bytes(key)` is a value's size, for the read-size tests.
type Value = string | ArrayBuffer;

const enc = new TextEncoder();
const toBuffer = (v: Value) => (typeof v === "string" ? enc.encode(v).buffer as ArrayBuffer : v.slice(0));
const toText = (v: Value) => (typeof v === "string" ? v : new TextDecoder().decode(v));

export function fakeKV(initial: Record<string, Value> = {}) {
  const store = new Map<string, Value>(Object.entries(initial));
  const meta = new Map<string, unknown>();
  return {
    store,
    meta,
    bytes: (k: string) => {
      const v = store.get(k);
      return v === undefined ? 0 : typeof v === "string" ? enc.encode(v).length : v.byteLength;
    },
    text: (k: string) => {
      const v = store.get(k);
      return v === undefined ? undefined : toText(v);
    },
    get: async (k: string, o?: string | { type?: string }) => {
      const v = store.get(k);
      if (v === undefined) return null;
      const type = typeof o === "string" ? o : o?.type;
      return type === "arrayBuffer" ? toBuffer(v) : toText(v);
    },
    put: async (k: string, v: Value, o?: { metadata?: unknown }) => {
      store.set(k, typeof v === "string" ? v : v.slice(0));
      if (o?.metadata !== undefined) meta.set(k, o.metadata);
      else meta.delete(k);
    },
    delete: async (k: string) => {
      store.delete(k);
      meta.delete(k);
    },
    list: async (o: { prefix?: string; limit?: number } = {}) => ({
      keys: [...store.keys()].filter((k) => k.startsWith(o.prefix ?? "")).sort().slice(0, o.limit ?? 1000)
        .map((name) => ({ name, ...(meta.has(name) ? { metadata: meta.get(name) } : {}) })),
      list_complete: true,
    }),
  } as unknown as KVNamespace & {
    store: Map<string, Value>; meta: Map<string, unknown>; bytes: (k: string) => number; text: (k: string) => string | undefined;
  };
}
