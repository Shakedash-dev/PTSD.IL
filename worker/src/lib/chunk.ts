export type Chunk = { text: string; index: number };

export function chunk(text: string, opts: { max?: number; overlap?: number } = {}): Chunk[] {
  const max = opts.max ?? 1600;
  const overlap = opts.overlap ?? 200;
  const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paras.length === 0) return [];

  const chunks: string[] = [];
  let buf = "";
  for (const p of paras) {
    if (buf && buf.length + p.length + 2 > max) {
      chunks.push(buf);
      buf = buf.slice(Math.max(0, buf.length - overlap)); // carry overlap
    }
    buf = buf ? `${buf}\n\n${p}` : p;
    // Hard-split a single oversized paragraph.
    while (buf.length > max + overlap) {
      chunks.push(buf.slice(0, max));
      buf = buf.slice(max - overlap);
    }
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks.map((text, index) => ({ text, index }));
}
