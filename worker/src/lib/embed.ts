const MODEL = "@cf/baai/bge-m3";

// Texts per Workers AI embedding call. bge-m3 takes up to 100 per call, and
// each call is one subrequest, so the bulk paths batch at the limit.
export const EMBED_BATCH = 100;
// bge-m3 output size; the Vectorize index is created with it.
export const EMBED_DIMS = 1024;

export async function embed(ai: Ai, texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const res = (await ai.run(MODEL, { text: texts })) as { data: number[][] };
  return res.data;
}
