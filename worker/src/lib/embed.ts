const MODEL = "@cf/baai/bge-m3";

export async function embed(ai: Ai, texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const res = (await ai.run(MODEL, { text: texts })) as { data: number[][] };
  return res.data;
}
