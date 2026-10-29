// In-memory Vectorize index that enforces the documented limits
// (https://developers.cloudflare.com/vectorize/platform/limits/): ids <= 64
// bytes, metadata <= 10 KiB, upsert <= 1000 per call, topK <= 50 with metadata
// (100 without), plus deleteByIds <= 100 (error 40007 in production).
// Semantics where the docs are silent, chosen as the stricter reading:
// - ids are unique across the index: an upsert replaces a vector in full,
//   namespace included (the docs: "A vector can only be part of a single
//   namespace");
// - a query without a namespace searches every namespace.
export type Stored = { id: string; values: number[]; namespace?: string; metadata?: Record<string, unknown> };

const bytes = (s: string) => new TextEncoder().encode(s).length;

// Vectors of different lengths compare as if padded with zeros.
export function cosine(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let d = 0, na = 0, nb = 0;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0, y = b[i] ?? 0;
    d += x * y; na += x * x; nb += y * y;
  }
  return d / (Math.sqrt(na * nb) || 1);
}

export function fakeVectorize(opts: { onCall?: (op: string) => void } = {}) {
  const store = new Map<string, Stored>();
  const calls: { op: string; arg: unknown }[] = [];
  const hit = (op: string, arg: unknown) => { calls.push({ op, arg }); opts.onCall?.(op); };
  const index = {
    store,
    calls,
    inNs: (ns?: string) => [...store.values()].filter((v) => v.namespace === ns),
    upsert: async (rows: Stored[]) => {
      hit("upsert", rows);
      if (rows.length > 1000) throw new Error("upsert: more than 1000 vectors");
      for (const r of rows) {
        if (bytes(r.id) > 64) throw new Error(`id over 64 bytes: ${r.id}`);
        if (r.namespace && bytes(r.namespace) > 64) throw new Error("namespace over 64 bytes");
        if (r.metadata && bytes(JSON.stringify(r.metadata)) > 10240) throw new Error(`metadata over 10 KiB: ${r.id}`);
        store.set(r.id, { id: r.id, values: [...r.values], ...(r.namespace ? { namespace: r.namespace } : {}), ...(r.metadata ? { metadata: r.metadata } : {}) });
      }
      return { mutationId: "m" };
    },
    deleteByIds: async (ids: string[]) => {
      hit("deleteByIds", ids);
      if (ids.length > 100) throw new Error("40007: more than 100 ids");
      for (const id of ids) store.delete(id);
      return { mutationId: "m" };
    },
    getByIds: async (ids: string[]) => {
      hit("getByIds", ids);
      return ids.map((id) => store.get(id)).filter((v): v is Stored => !!v).map((v) => ({ ...v }));
    },
    query: async (vec: number[], o: { topK?: number; namespace?: string; returnMetadata?: string; returnValues?: boolean } = {}) => {
      hit("query", { vec, ...o });
      const topK = o.topK ?? 5;
      if (topK > ((o.returnMetadata === "all" || o.returnValues) ? 50 : 100)) throw new Error("topK over the limit");
      const pool = [...store.values()].filter((v) => !o.namespace || v.namespace === o.namespace);
      const matches = pool.map((v) => ({ id: v.id, score: cosine(vec, v.values), ...(o.returnMetadata === "all" ? { metadata: v.metadata } : {}) }))
        .sort((a, b) => b.score - a.score).slice(0, topK);
      return { count: matches.length, matches };
    },
  };
  return index;
}
