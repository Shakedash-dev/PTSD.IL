import type { Env } from "../index";
import type { Area, Msg, Playbook } from "./prompt";
import { recentCrisisMessage } from "./crisis";
import { detectLang } from "./lang";
import { embed } from "./embed";
import { query, type Hit } from "./vector";
import { buildContents } from "./prompt";
import { streamGemini, ABNORMAL_FINISH, type StreamMeta } from "./gemini";
import { findPlaybooks, loadPlaybookStore, thresholds, type FindInput, type Found, type PlaybookMatch, type PlaybookStore, type Thresholds } from "./qa";

const RETRIEVAL_MIN_SCORE = 0.4;
const TOP_K_FETCH = 20; // Vectorize allows 50 with returnMetadata:"all"; 20 keeps the response ~35 KB
const TOP_K_USE = 15;
const GUIDED_KEEP = 5; // playbook-guided hits always kept, when they pass the filters

// Closing line when the model stops early on its own filters (e.g. RECITATION),
// so the visitor never sees an answer that just breaks off mid-sentence.
const CUT_SHORT: Record<string, string> = {
  he: "התשובה נקטעה. אפשר לנסות לשאול שוב במילים אחרות, או לעיין בעמודים שבקישורים למטה. במצוקה: ער״ן 1201.",
  ar: "انقطعت الإجابة. يمكنك إعادة طرح السؤال بكلمات أخرى، أو الاطلاع على الصفحات في الروابط أدناه. في حالة الضيق: عيران 1201.",
  en: "This answer was cut short. You can ask again in other words, or see the pages linked below. If you are in distress: ERAN 1201.",
  ru: "Ответ прервался. Можно спросить ещё раз другими словами или открыть страницы по ссылкам ниже. Если вам плохо: ЭРАН 1201.",
  fr: "La réponse a été interrompue. Vous pouvez reformuler la question ou consulter les pages en lien ci-dessous. En cas de détresse : ERAN 1201.",
};

// The same request plus what was already streamed, asking Gemini to go on from
// there (or to answer afresh when nothing was written yet).
function continuation(payload: ReturnType<typeof buildContents>, written: string): ReturnType<typeof buildContents> {
  if (!written.trim()) return payload;
  return {
    ...payload,
    contents: [
      ...payload.contents,
      { role: "model", parts: [{ text: written }] },
      { role: "user", parts: [{ text: "Continue your previous answer exactly where it stopped, without repeating anything already written. Same language, same format, in your own words." }] },
    ],
  };
}

const REFUSAL: Record<string, string> = {
  he: "אני יכול לעזור רק בנושאים שמופיעים באתר. אפשר לנסח מחדש?",
  ar: "يمكنني المساعدة فقط في المواضيع الموجودة على هذا الموقع.",
  en: "I can only help with topics covered on this site. Could you rephrase?",
  ru: "Я могу помочь только по темам, представленным на этом сайте.",
  fr: "Je ne peux aider que sur les sujets présents sur ce site.",
};

// Playbooks are an enhancement: if KV fails, chat carries on without them.
// Until the full reindex after the shard deploy has written the user's
// language, they come from the old one-value index (lib/qaLegacy.ts).
async function safeStore(env: Env, lang: string): Promise<PlaybookStore | null> {
  try {
    return await loadPlaybookStore(env, lang);
  } catch (e) {
    console.log(`qa-index-error ${(e as Error).message}`);
    return null;
  }
}

async function safePlaybooks(env: Env, store: PlaybookStore | null, input: FindInput, th: Thresholds): Promise<Found | null> {
  if (!store) return null;
  try {
    return await findPlaybooks(env, store, input, th);
  } catch (e) {
    console.log(`qa-index-error ${(e as Error).message}`);
    return null;
  }
}

// The first playbook injected (crisis, carried, current), for the SSE `done`
// event: scripts/qa-match-compare.mjs reads it. The site ignores it.
function donePlaybook(found: Found | null): { groupId: string; strength: PlaybookMatch["strength"]; score: number } | null {
  const p = found && (found.m.crisisPlaybook ?? found.carried ?? found.m.playbook);
  return p ? { groupId: p.row.groupId, strength: p.strength, score: Number(p.score.toFixed(4)) } : null;
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
        // The playbook shards (user's language + Hebrew, cached) load during the embedding.
        const [vecs, store] = await Promise.all([embed(env.AI, texts), safeStore(env, lang)]);
        const vecOf = (t: string | null) => (t ? vecs[texts.indexOf(t)] : undefined);
        const qv = vecs[0];
        const prevVec = vecOf(prev);
        const crisisVec = crisisText && crisisText !== last ? vecOf(crisisText) : undefined;
        // The user query runs while the playbooks are matched.
        const userHits = query(env.VECTORIZE, qv, TOP_K_FETCH);
        userHits.catch(() => {}); // awaited below; this only keeps it from counting as unhandled meanwhile

        // Curated playbooks, matched with the same query embedding. No strong
        // match now: a strong match on the previous message carries over for this
        // turn (as strong). A weak match of its own stays alongside.
        const th = thresholds(env);
        const found = await safePlaybooks(env, store, { qv, prevVec, crisisVec, lang, crisis }, th);
        const m: Found["m"] = found?.m ?? {};
        const carried = found?.carried;
        const playbooks = [m.crisisPlaybook, carried, m.playbook].filter((p): p is PlaybookMatch => !!p).map(toPlaybook);
        const strongMatch = (!!m.best && m.best.score >= th.strong) || !!carried;

        // Playbook-guided retrieval: ONE more Vectorize query, with the retrieval
        // vector (answer) of the first matched playbook that has one, in the
        // order crisis, carried, current. The playbook's facts often sit in rows
        // the user's own wording ranks below unrelated ones.
        const guide = found?.guide;
        const [raw, guided] = await Promise.all([userHits, guidedQuery(env, guide?.vec)]);
        const hits = selectHits(raw, guided, lang);
        if (found) {
          // Not part of the SSE stream: Worker logs only, for threshold tuning.
          console.log(`qa-match ${JSON.stringify({
            best: m.best && { groupId: m.best.groupId, score: Number(m.best.score.toFixed(4)) },
            used: m.playbook && { groupId: m.playbook.row.groupId, strength: m.playbook.strength },
            carried: carried && { groupId: carried.row.groupId, score: Number(carried.score.toFixed(4)) },
            crisis: m.crisisPlaybook && { groupId: m.crisisPlaybook.row.groupId, score: Number(m.crisisPlaybook.score.toFixed(4)) },
            guide: guide && { groupId: guide.p.row.groupId, hits: guided.length },
            store: store?.kind === "legacy" ? "legacy" : "shards",
          })}`);
        }

        // Zero hits still refuses, unless a strong playbook covers the question.
        // A crisis message never gets the refusal: the model answers with the
        // crisis playbook and the system prompt's ERAN rule even without sources.
        if (hits.length === 0 && !strongMatch && !crisis) {
          send("token", { text: REFUSAL[lang] ?? REFUSAL.en });
          send("done", { playbook: donePlaybook(found) });
          return; // the finally block is the sole closer of the controller
        }

        const payload = buildContents(body.messages, hits, lang, playbooks, body.area);
        const meta: StreamMeta = {};
        let written = "";
        for await (const delta of streamGemini(env, payload, meta)) { written += delta; send("token", { text: delta }); }
        // Gemini's filters occasionally stop a harmless answer (seen live: RECITATION,
        // PROHIBITED_CONTENT on an Arabic panic-attack answer, ~1 in 15). Ask once
        // to continue from where it stopped; only if that stops too, close with the
        // fallback line so the answer never just breaks off.
        let finish = meta.finishReason;
        if (finish && ABNORMAL_FINISH.has(finish)) {
          console.log(`gemini-finish ${JSON.stringify({ finishReason: finish, lang, chars: written.length, attempt: 1 })}`);
          const again: StreamMeta = {};
          for await (const delta of streamGemini(env, continuation(payload, written), again)) send("token", { text: delta });
          finish = again.finishReason;
          if (finish && ABNORMAL_FINISH.has(finish)) {
            console.log(`gemini-finish ${JSON.stringify({ finishReason: finish, lang, attempt: 2 })}`);
            send("token", { text: `\n\n${CUT_SHORT[lang] ?? CUT_SHORT.en}` });
          }
          meta.finishReason = finish;
        }

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
        send("done", { ...(meta.finishReason ? { finishReason: meta.finishReason } : {}), playbook: donePlaybook(found) });
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
