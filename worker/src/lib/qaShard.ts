// The playbook match vectors of ONE language as one binary KV value
// (docs/chatbot-guide.md section 15). Chat reads at most two of them (the user's
// language and Hebrew) and scores the query against every vector in place: no
// JSON over a few KB, no Float64 array per vector.
//
// Layout, little-endian:
//   0   u32  MAGIC
//   4   u32  header length in bytes (UTF-8 JSON, ShardHeader)
//   8   u32  vector count
//   12  u32  dims
//   16  header JSON, zero-padded to a multiple of 4
//   ..  f32  scale per vector
//   ..  i8   vectors, count x dims
// A row's vectors are contiguous and in header order (`n` each), so the row of a
// vector is found by walking the row table; nothing else is stored per vector.
//
// Quantization: each vector is L2-normalized, then stored as round(v / s) with
// s = max|v| / 127 (its scale). The query is normalized and quantized to
// round(v / sq), sq = max|v| / QUERY_MAX, so a dot product is integer math:
// |sum| <= 1024 * 16383 * 127 < 2^31 keeps the Math.imul accumulator exact.
// score = dot * sq * s. Against float32 the score moves by ~1e-3 at most
// (worker/test/qa-int8.test.ts measures it on 2,500 vectors).

export function unit(v: ArrayLike<number>): Float32Array {
  let n = 0;
  for (let i = 0; i < v.length; i++) n += v[i] * v[i];
  const out = new Float32Array(v.length);
  const d = Math.sqrt(n) || 1;
  for (let i = 0; i < v.length; i++) out[i] = v[i] / d;
  return out;
}

// Float32 as base64 (a KV row's retrieval vector, the old index's vectors).
export function encode(v: Float32Array): string {
  const bytes = new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export function decode(s: string): Float32Array {
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Float32Array(bytes.buffer);
}

const MAGIC = 0x32564151; // "QAV2"
const HEAD = 16;
const QUERY_MAX = 16383;

// One playbook row in a shard: id, group, crisis flag, `s` the stamp of what its
// vectors were embedded from (stamp()), and `n` its vector count.
export type ShardRow = { id: string; g: string; c?: 1; s: string; n: number };
// `ver` changes on every write (the concurrent-save check reads it back).
// `b`: a build part's id (full reindex), absent on a live shard.
export type ShardHeader = { v: 2; ver: string; rows: ShardRow[]; b?: string };

export type Shard = {
  header: ShardHeader;
  dims: number;
  count: number;
  scales: Float32Array;
  q: Int8Array; // count x dims
  bytes: number;
};

// A row's part of a shard, ready to splice into another one.
export type RowVectors = { row: ShardRow; scales: Float32Array; q: Int8Array };

// FNV-1a, 32 bits, hex. Not cryptographic, only a change detector.
export function fnv(parts: string[]): string {
  let h = 0x811c9dc5;
  for (const k of parts) {
    for (let i = 0; i < k.length; i++) h = Math.imul(h ^ k.charCodeAt(i), 0x01000193);
    h = Math.imul(h ^ 0x1f, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

// What a row's match vectors depend on. Equal stamps: the stored vectors are
// still right for the row (guidance and answer edits do not touch them).
export const stamp = (row: { groupId: string; crisis: boolean; texts: string[] }) =>
  fnv([row.groupId, row.crisis ? "1" : "0", ...row.texts]);

export function quantize(v: ArrayLike<number>, out: Int8Array, at: number): number {
  let n = 0;
  for (let i = 0; i < v.length; i++) n += v[i] * v[i];
  const norm = Math.sqrt(n) || 1;
  let max = 0;
  for (let i = 0; i < v.length; i++) max = Math.max(max, Math.abs(v[i]));
  const s = max / norm / 127 || 1;
  const k = 1 / (norm * s);
  for (let i = 0; i < v.length; i++) out[at + i] = Math.round(v[i] * k);
  return s;
}

// A row's vectors from its embeddings (one per match text).
export function rowVectors(row: ShardRow, embs: ArrayLike<number>[], dims: number): RowVectors {
  const q = new Int8Array(embs.length * dims);
  const scales = new Float32Array(embs.length);
  embs.forEach((e, k) => {
    if (e.length !== dims) throw new Error(`embedding has ${e.length} dims, shard has ${dims}`);
    scales[k] = quantize(e, q, k * dims);
  });
  return { row: { ...row, n: embs.length }, scales, q };
}

const pad4 = (n: number) => (n + 3) & ~3;

export function encodeShard(header: Omit<ShardHeader, "rows">, dims: number, rows: RowVectors[]): ArrayBuffer {
  const head = new TextEncoder().encode(JSON.stringify({ ...header, rows: rows.map((r) => r.row) }));
  const count = rows.reduce((s, r) => s + r.row.n, 0);
  const scalesAt = HEAD + pad4(head.length);
  const qAt = scalesAt + 4 * count;
  const buf = new ArrayBuffer(qAt + count * dims);
  const dv = new DataView(buf);
  dv.setUint32(0, MAGIC, true);
  dv.setUint32(4, head.length, true);
  dv.setUint32(8, count, true);
  dv.setUint32(12, dims, true);
  new Uint8Array(buf, HEAD, head.length).set(head);
  const scales = new Float32Array(buf, scalesAt, count);
  const q = new Int8Array(buf, qAt, count * dims);
  let k = 0;
  for (const r of rows) {
    scales.set(r.scales, k);
    q.set(r.q, k * dims);
    k += r.row.n;
  }
  return buf;
}

// Views over the value, no copy. Null for anything that is not a shard.
export function decodeShard(buf: ArrayBuffer | null): Shard | null {
  if (!buf || buf.byteLength < HEAD) return null;
  const dv = new DataView(buf);
  if (dv.getUint32(0, true) !== MAGIC) return null;
  const len = dv.getUint32(4, true);
  const count = dv.getUint32(8, true);
  const dims = dv.getUint32(12, true);
  const scalesAt = HEAD + pad4(len);
  const qAt = scalesAt + 4 * count;
  if (buf.byteLength !== qAt + count * dims) return null;
  let header: ShardHeader;
  try {
    header = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, HEAD, len)));
  } catch {
    return null;
  }
  if (header?.v !== 2 || !Array.isArray(header.rows) || header.rows.reduce((s, r) => s + r.n, 0) !== count) return null;
  return { header, dims, count, scales: new Float32Array(buf, scalesAt, count), q: new Int8Array(buf, qAt, count * dims), bytes: buf.byteLength };
}

// The shard as rows (views into it), to edit and encode again.
export function shardRows(s: Shard): RowVectors[] {
  const out: RowVectors[] = [];
  let k = 0;
  for (const row of s.header.rows) {
    out.push({ row, scales: s.scales.subarray(k, k + row.n), q: s.q.subarray(k * s.dims, (k + row.n) * s.dims) });
    k += row.n;
  }
  return out;
}

export type Query = { q: Int32Array; s: number };

export function quantizeQuery(v: ArrayLike<number>): Query {
  let n = 0;
  let max = 0;
  for (let i = 0; i < v.length; i++) {
    n += v[i] * v[i];
    max = Math.max(max, Math.abs(v[i]));
  }
  const norm = Math.sqrt(n) || 1;
  const s = max / norm / QUERY_MAX || 1;
  const k = 1 / (norm * s);
  const q = new Int32Array(v.length);
  for (let i = 0; i < v.length; i++) q[i] = Math.round(v[i] * k);
  return { q, s };
}

export type GroupBest = { groupId: string; score: number; langId: string; crisis: boolean };

// Best score per group over the rows of the shards (`crisisOnly`: crisis rows
// only), into `best`. One pass over the int8 vectors, integer dot products.
export function scan(shards: { lang: string; shard: Shard }[], query: Query, best: Map<string, GroupBest>, crisisOnly = false): void {
  const qv = query.q;
  for (const { lang, shard } of shards) {
    if (shard.dims !== qv.length) continue;
    const { dims, q, scales } = shard;
    let k = 0;
    for (const row of shard.header.rows) {
      const from = k;
      k += row.n;
      if (crisisOnly && !row.c) continue;
      let top = -Infinity;
      for (let n = from; n < k; n++) {
        const o = n * dims;
        let d = 0;
        for (let i = 0; i < dims; i++) d = (d + Math.imul(qv[i], q[o + i])) | 0;
        const sc = d * scales[n];
        if (sc > top) top = sc;
      }
      if (row.n === 0) continue;
      const score = top * query.s;
      const cur = best.get(row.g);
      if (!cur || score > cur.score) best.set(row.g, { groupId: row.g, score, langId: lang, crisis: (cur?.crisis ?? false) || !!row.c });
      else if (row.c) cur.crisis = true;
    }
  }
}

export const ranked = (best: Map<string, GroupBest>) => [...best.values()].sort((a, b) => b.score - a.score);
