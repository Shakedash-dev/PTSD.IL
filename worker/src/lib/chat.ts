import type { Env } from "../index";
import type { Area, Msg, Playbook } from "./prompt";
import { recentCrisisMessage } from "./crisis";
import { detectLang } from "./lang";
import { embed } from "./embed";
import { query, type Hit } from "./vector";
import { buildContents } from "./prompt";
import { streamGemini } from "./gemini";
import { loadQaIndex, matchPlaybooks, retrievalVector, thresholds, type PlaybookMatch } from "./qa";

const RETRIEVAL_MIN_SCORE = 0.4;
const TOP_K_FETCH = 20; // Vectorize caps topK at 20 with returnMetadata:"all"
const TOP_K_USE = 15;
const GUIDED_KEEP = 5; // playbook-guided hits always kept, when they pass the filters

const REFUSAL: Record<string, string> = {
  he: "אני יכול לעזור רק בנושאים שמופיעים באתר. אפשר לנסח מחדש?",
  ar: "يمكنني المساعدة فقط في المواضيع الموجودة على هذا الموقع.",
  en: "I can only help with topics covered on this site. Could you rephrase?",
  ru: "Я могу помочь только по темам, представленным на этом сайте.",
  fr: "Je ne peux aider que sur les sujets présents sur ce site.",
};

// The playbook index is an enhancement: if KV is down or the value is bad, chat
// carries on without playbooks.
async function safeQaIndex(env: Env) {
  try {
    return await loadQaIndex(env);
  } catch (e) {
    console.log(`qa-index-error ${(e as Error).message}`);
    return null;
  }
}

const toPlaybook = (m: PlaybookMatch): Playbook => ({
  kind: m.strength, question: m.row.question, guidance: m.row.guidance,
  ...(m.row.answer ? { answer: m.row.answer } : {}),
});

// The user message right before the latest one, if an assistant turn came
// after it (the bot replied, and the latest message answers that reply).
export function previousUserMessage(messages: Msg[]): string | null {
  const lastUser = messages.map((x) => x.role).lastIndexOf("user");
  if (lastUser < 0) return null;
  const before = messages.slice(0, lastUser);
  const prevUser = before.map((x) => x.role).lastIndexOf("user");
  const lastAssistant = before.map((x) => x.role).lastIndexOf("assistant");
  if (prevUser < 0 || lastAssistant < prevUser) return null;
  const text = before[prevUser].content;
  return text && text !== messages[lastUser].content ? text : null;
}

const hitKey = (h: Hit) => h.id ?? `${h.meta.itemId}:${h.meta.chunkIndex}`;
const byScore = (a: Hit, b: Hit) => b.score - a.score;

// SOURCES from the user-query hits and the playbook-guided hits: the union,
// deduped by vector id at the higher score, filtered by RETRIEVAL_MIN_SCORE and
// language (the user's language if it has 3+ hits, else Hebrew, else all), then
// capped at TOP_K_USE by score, keeping the top GUIDED_KEEP guided hits that
// survived the filters. Without guided hits this is the plain retrieval.
export function selectHits(user: Hit[], guided: Hit[], lang: string): Hit[] {
  const best = new Map<string, Hit>();
  for (const h of [...user, ...guided]) {
    const cur = best.get(hitKey(h));
    if (!cur || h.score > cur.score) best.set(hitKey(h), h);
  }
  const all = [...best.values()].filter((h) => h.score >= RETRIEVAL_MIN_SCORE).sort(byScore);
  const sameLang = all.filter((h) => h.meta.langId === lang);
  const chosen = sameLang.length >= 3 ? sameLang : all.filter((h) => h.meta.langId === "he");
  const pool = chosen.length ? chosen : all;
  const inPool = new Map(pool.map((h) => [hitKey(h), h]));
  const keep = new Set<Hit>();
  for (const g of [...guided].sort(byScore)) {
    if (keep.size >= GUIDED_KEEP) break;
    const h = inPool.get(hitKey(g));
    if (h) keep.add(h);
  }
  const rest = pool.filter((h) => !keep.has(h)).slice(0, TOP_K_USE - keep.size);
  return [...keep, ...rest].sort(byScore);
}

// The playbook-guided query is an enhancement too: if it fails, SOURCES come
// from the user query alone.
async function guidedQuery(env: Env, vec: number[] | undefined): Promise<Hit[]> {
  if (!vec) return [];
  try {
    return await query(env.VECTORIZE, vec, TOP_K_FETCH);
  } catch (e) {
    console.log(`qa-guide-error ${(e as Error).message}`);
    return [];
  }
}

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export function handleChat(env: Env, body: { messages: Msg[]; lang: string; sessionId: string; area?: Area }): Response {
  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(ctrl) {
      const send = (event: string, data: unknown) => ctrl.enqueue(enc.encode(sse(event, data)));
      try {
        const userTurns = body.messages.filter((m) => m.role === "user").map((m) => m.content);
        const last = userTurns[userTurns.length - 1] ?? "";
        // Reply in the language the user actually WROTE in, not whatever the site
        // UI is set to. Falls back to the site language only for undecidable input.
        const lang = detectLang(last, body.lang);
        // A crisis in any of the last few user turns keeps the crisis playbook
        // on, picked by the message that said it (not by a follow-up like "no").
        const crisisText = recentCrisisMessage(userTurns);
        const crisis = crisisText !== null;
        if (crisis) send("crisis", { lang });

        // A short reply to the bot's scoping question ("how old is the child?" ->
        // "5") matches no playbook on its own, so the user message right before
        // it is matched too, when the bot answered it in between.
        const prev = previousUserMessage(body.messages);
        const texts = [...new Set([last, ...(prev ? [prev] : []), ...(crisisText ? [crisisText] : [])])];
        const vecs = await embed(env.AI, texts);
        const vecOf = (t: string | null) => (t ? vecs[texts.indexOf(t)] : undefined);
        const qv = vecs[0];
        const prevVec = vecOf(prev);
        const crisisVec = crisisText && crisisText !== last ? vecOf(crisisText) : undefined;
        // The user query runs while the playbook index loads and matches.
        const userHits = query(env.VECTORIZE, qv, TOP_K_FETCH);
        userHits.catch(() => {}); // awaited below; this only keeps it from counting as unhandled meanwhile
        const qaIndex = await safeQaIndex(env);

        // Curated playbooks, matched with the same query embedding.
        const th = thresholds(env);
        const m: ReturnType<typeof matchPlaybooks> = qaIndex ? matchPlaybooks(qaIndex, qv, lang, crisis, th) : {};
        // No strong match now: a strong match on the previous message carries
        // over for this turn (as strong). A weak match of its own stays alongside.
        let carried: PlaybookMatch | undefined;
        if (qaIndex && prevVec && m.playbook?.strength !== "strong") {
          const p = matchPlaybooks(qaIndex, prevVec, lang, false, th).playbook;
          if (p?.strength === "strong") carried = p;
          if (carried && m.playbook?.row.groupId === carried.row.groupId) delete m.playbook;
        }
        if (qaIndex && crisisVec) {
          m.crisisPlaybook = matchPlaybooks(qaIndex, crisisVec, lang, true, th).crisisPlaybook;
        }
        const crisisGroup = m.crisisPlaybook?.row.groupId;
        if (crisisGroup && m.playbook?.row.groupId === crisisGroup) delete m.playbook;
        if (crisisGroup && carried?.row.groupId === crisisGroup) carried = undefined;
        const playbooks = [m.crisisPlaybook, carried, m.playbook].filter((p): p is PlaybookMatch => !!p).map(toPlaybook);
        const strongMatch = (!!m.best && m.best.score >= th.strong) || !!carried;

        // Playbook-guided retrieval: ONE more Vectorize query, with the retrieval
        // vector (answer) of the first matched playbook that has one, in the
        // order crisis, carried, current. The playbook's facts often sit in rows
        // the user's own wording ranks below unrelated ones.
        const guide = qaIndex
          ? [m.crisisPlaybook, carried, m.playbook]
            .filter((p): p is PlaybookMatch => !!p)
            .map((p) => ({ p, vec: retrievalVector(qaIndex, p) }))
            .find((g) => g.vec)
          : undefined;
        const [raw, guided] = await Promise.all([userHits, guidedQuery(env, guide?.vec)]);
        const hits = selectHits(raw, guided, lang);
        if (qaIndex) {
          // Not part of the SSE stream: Worker logs only, for threshold tuning.
          console.log(`qa-match ${JSON.stringify({
            best: m.best && { groupId: m.best.groupId, score: Number(m.best.score.toFixed(4)) },
            used: m.playbook && { groupId: m.playbook.row.groupId, strength: m.playbook.strength },
            carried: carried && { groupId: carried.row.groupId, score: Number(carried.score.toFixed(4)) },
            crisis: m.crisisPlaybook && { groupId: m.crisisPlaybook.row.groupId, score: Number(m.crisisPlaybook.score.toFixed(4)) },
            guide: guide && { groupId: guide.p.row.groupId, hits: guided.length },
          })}`);
        }

        // Zero hits still refuses, unless a strong playbook covers the question.
        // A crisis message never gets the refusal: the model answers with the
        // crisis playbook and the system prompt's ERAN rule even without sources.
        if (hits.length === 0 && !strongMatch && !crisis) {
          send("token", { text: REFUSAL[lang] ?? REFUSAL.en });
          send("done", {});
          return; // the finally block is the sole closer of the controller
        }

        const payload = buildContents(body.messages, hits, lang, playbooks, body.area);
        for await (const delta of streamGemini(env, payload)) send("token", { text: delta });

        if (hits.length) {
          send("sources", hits.map((h, i) => ({
            n: i + 1, itemId: h.meta.itemId, groupId: h.meta.groupId,
            type: h.meta.type, langId: h.meta.langId, title: h.meta.title, text: h.meta.text,
            categorySlug: h.meta.categorySlug,
            ...(h.meta.categorySlugs ? { categorySlugs: h.meta.categorySlugs } : {}),
            ...(h.meta.key ? { key: h.meta.key } : {}),
            ...(h.meta.section ? { section: h.meta.section } : {}),
          })));
        }
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
