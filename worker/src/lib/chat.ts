import type { Env } from "../index";
import type { Msg } from "./prompt";
import { detectCrisis } from "./crisis";
import { embed } from "./embed";
import { query } from "./vector";
import { buildContents } from "./prompt";
import { streamGemini } from "./gemini";

const RETRIEVAL_MIN_SCORE = 0.4;
const TOP_K = 8;

const REFUSAL: Record<string, string> = {
  he: "אני יכול/ה לעזור רק בנושאים שמופיעים באתר. אפשר לנסח מחדש?",
  ar: "يمكنني المساعدة فقط في المواضيع الموجودة على هذا الموقع.",
  en: "I can only help with topics covered on this site. Could you rephrase?",
  ru: "Я могу помочь только по темам, представленным на этом сайте.",
  fr: "Je ne peux aider que sur les sujets présents sur ce site.",
};

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export function handleChat(env: Env, body: { messages: Msg[]; lang: string; sessionId: string }): Response {
  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(ctrl) {
      const send = (event: string, data: unknown) => ctrl.enqueue(enc.encode(sse(event, data)));
      try {
        const last = [...body.messages].reverse().find((m) => m.role === "user")?.content ?? "";
        if (detectCrisis(last)) send("crisis", { lang: body.lang });

        const [qv] = await embed(env.AI, [last]);
        const hits = (await query(env.VECTORIZE, qv, TOP_K)).filter((h) => h.score >= RETRIEVAL_MIN_SCORE);

        if (hits.length === 0) {
          send("token", { text: REFUSAL[body.lang] ?? REFUSAL.en });
          send("done", {});
          return; // the finally block is the sole closer of the controller
        }

        const payload = buildContents(body.messages, hits, body.lang);
        for await (const delta of streamGemini(env, payload)) send("token", { text: delta });

        send("sources", hits.map((h, i) => ({
          n: i + 1, itemId: h.meta.itemId, groupId: h.meta.groupId,
          type: h.meta.type, langId: h.meta.langId, title: h.meta.title,
        })));
        send("done", {});
      } catch (e) {
        send("error", { message: (e as Error).message });
      } finally {
        ctrl.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "content-type": "text/event-stream", "cache-control": "no-cache" },
  });
}
