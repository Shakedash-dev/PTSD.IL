import type { Env } from "../index";

type Payload = {
  systemInstruction: { parts: { text: string }[] };
  contents: { role: "user" | "model"; parts: { text: string }[] }[];
};

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// The API key goes in a header, never the URL (URLs end up in logs).
export async function* streamGemini(env: Env, payload: Payload): AsyncGenerator<string> {
  const url = `${BASE}/${env.GEMINI_MODEL}:streamGenerateContent?alt=sse`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
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

export type JsonCall = {
  model: string;
  system: string;
  user: string;
  schema: Record<string, unknown>;
  temperature: number;
  thinkingLevel: "minimal" | "low" | "medium" | "high";
  timeoutMs?: number;
};

// Non-streaming structured-output call (used by /translate). Returns the parsed
// JSON of the model's answer; thought parts, if any, are ignored.
export async function generateJson<T>(env: Env, call: JsonCall): Promise<T> {
  const res = await fetch(`${BASE}/${call.model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: call.system }] },
      contents: [{ role: "user", parts: [{ text: call.user }] }],
      generationConfig: {
        temperature: call.temperature,
        responseMimeType: "application/json",
        responseSchema: call.schema,
        thinkingConfig: { thinkingLevel: call.thinkingLevel },
      },
    }),
    signal: AbortSignal.timeout(call.timeoutMs ?? 90_000),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const obj = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
  };
  const cand = obj.candidates?.[0];
  const text = (cand?.content?.parts ?? []).filter((p) => !p.thought).map((p) => p.text ?? "").join("");
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Gemini returned no valid JSON (finishReason ${cand?.finishReason ?? "none"})`);
  }
}
