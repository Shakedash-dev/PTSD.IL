import type { Env } from "../index";

type Payload = {
  systemInstruction: { parts: { text: string }[] };
  contents: { role: "user" | "model"; parts: { text: string }[] }[];
};

export async function* streamGemini(env: Env, payload: Payload): AsyncGenerator<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${env.GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok || !res.body) throw new Error(`Gemini ${res.status}`);

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      for (const t of extractTexts(buf.slice(0, nl))) yield t;
      buf = buf.slice(nl + 1);
    }
  }
  // Flush a final frame that arrived without a trailing newline (truncated / early close).
  for (const t of extractTexts(buf)) yield t;
}

// Parse one SSE line into zero or more text deltas.
function extractTexts(rawLine: string): string[] {
  const line = rawLine.trim();
  if (!line.startsWith("data:")) return [];
  const json = line.slice(5).trim();
  if (!json || json === "[DONE]") return [];
  try {
    const obj = JSON.parse(json) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    return (obj.candidates?.[0]?.content?.parts ?? []).map((p) => p.text).filter((t): t is string => !!t);
  } catch {
    return [];
  }
}
