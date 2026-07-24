# Chatbot — Full Breakdown & App Integration Guide

How the site chatbot works end-to-end, and how to add it to the mobile app.

This is the companion to [`mobile-data-guide.md`](./mobile-data-guide.md). That doc
tells you how to render the site's content; this one tells you how the chatbot
works and how to wire it into the app.

**The short version for the app dev:** the chatbot is one public HTTP endpoint —
`POST /chat` — that streams an answer back over Server-Sent Events (SSE). The app
does **not** need to run any AI, embeddings, vector DB, or ingestion. You send the
conversation, you read the stream, you render it. Everything heavy already runs on
Cloudflare. Jump to [§3 The only endpoint the app calls](#3-the-only-endpoint-the-app-calls)
if you just want to integrate.

---

## 1. What it is (and what makes it safe)

A **grounded RAG chatbot**. It answers **only** from the site's own vetted content
(the same `/articles` + `/communities` you already fetch), cites its sources, speaks
in the user's language, and handles distress safely. It is warm 24/7 — no cold
starts on the user path.

"True to source" is not a hope about model behavior. It's enforced structurally:

- **Retrieval grounding** — before answering, the question is embedded and matched
  against a vector index built from site content. The model is handed the top
  matching passages and told: *answer only from these; if they don't cover it, say
  so.* No relevant passages → it refuses instead of inventing.
- **Citations we own** — the model tags each sourced sentence with a marker like
  `[[3]]`. The Worker owns the number→source mapping, so citations are trustworthy
  regardless of whether the model self-cites perfectly. Markers the app can't map
  are simply dropped.
- **Deterministic crisis layer** — a keyword check runs on the user's message
  independently of the model. On a hit, a crisis signal is emitted and the app must
  surface the ERAN helpline (1201). This does not depend on the model noticing.

What it deliberately does **not** do: general/off-topic chat, medical or clinical
advice, diagnosis, persistent history across reloads, per-user accounts, or any
logging of conversations (nothing is stored — see [§9](#9-privacy)).

---

## 2. Architecture (how the pieces fit)

The entire user-facing path is Cloudflare-native and always warm. The cold-starting
Render API is touched **only during offline ingestion**, never on a chat request.

```
                    USER (app / browser)
                          |  POST /chat   (SSE stream back)
                          v
   +-------------------------------------------------------------+
   |          Cloudflare Worker  (edge, warm ~5ms)               |
   |                                                             |
   |  POST /chat   (public, rate-limited)                        |
   |    1. crisis check   (deterministic keyword match)          |
   |    2. embed question -> Workers AI  (bge-m3, 1024-dim)      |
   |    3. retrieve top-k -> Vectorize   (vector DB)             |
   |    4. generate       -> Gemini Flash (streamed)            |
   |                                                             |
   |  POST /reindex  (admin-JWT gated — app never calls this)    |
   |    pull -> chunk -> embed -> upsert into Vectorize          |
   +-------------------------------------------------------------+
             |  (ingestion only)                  ^
             v                                    |  admin JWT
     NestJS API /articles, /communities     Website admin panel
     (Render free tier; cold starts OK here)
```

| Piece | Tech | Notes |
|-------|------|-------|
| Orchestration | Cloudflare Worker (Hono) | Two routes: `/chat` (public), `/reindex` (admin). |
| Embeddings | Workers AI `@cf/baai/bge-m3` | Multilingual (incl. Hebrew/Arabic), 1024-dim. Same model for indexing and querying. |
| Vector DB | Cloudflare Vectorize | Index `ptsd-chatbot`, cosine, 1024-dim. One vector per content **chunk**. |
| Generation | Google **Gemini Flash** (`gemini-flash-latest`) | Streamed. Strong multilingual incl. Hebrew. |
| Rate limit | Cloudflare KV | 20 messages / hour / session. |

Live worker URL (production): `https://ptsd-chatbot-worker.ptsd-il.workers.dev`

Source lives in the repo under [`worker/`](../worker); the website widget under
[`src/components/chat/`](../src/components/chat) and [`src/lib/ChatContext.jsx`](../src/lib/ChatContext.jsx).
The website reference implementation is the best example to copy from.

---

## 3. The only endpoint the app calls

### `POST /chat`

**Request** — JSON body:

```json
{
  "messages": [
    { "role": "user", "content": "מהן הזכויות שלי?" },
    { "role": "assistant", "content": "..." },
    { "role": "user", "content": "ומה עם דיור?" }
  ],
  "lang": "he",
  "sessionId": "a1b2c3d4-...."
}
```

| Field | Type | Meaning |
|-------|------|---------|
| `messages` | array of `{ role, content }` | The full conversation so far. `role` is `"user"` or `"assistant"`. Send the whole history each turn (the Worker is stateless) — but **do not** include the empty assistant turn you're about to fill. |
| `lang` | `"he" \| "ar" \| "en" \| "ru" \| "fr"` | The user's current UI language. The bot answers in this language. |
| `sessionId` | string (UUID) | Client-generated, held in memory. Identifies the session for rate limiting. Generate once per app session; regenerate on restart. See [§7](#7-rate-limiting--sessions). |

**Response** — `text/event-stream` (SSE). Status codes:

| Status | Meaning | What the app does |
|--------|---------|-------------------|
| `200` + SSE stream | Normal | Read the stream (see [§4](#4-the-sse-stream)). |
| `429` | Rate limited | Show "too many messages, try again later". |
| other non-2xx | Worker/backend error | Show a generic error. |

CORS: the Worker restricts browser origins to the website. **Native mobile apps are
not subject to browser CORS**, so a React Native / native HTTP client calls it
directly with no issue. A **web-based** app on a different origin would be blocked
until that origin is added to the Worker's `SITE_ORIGIN` — see [§12](#12-config--gotchas).

---

## 4. The SSE stream

The response body is a stream of SSE frames. Each frame is `event: <name>` + `data:
<json>`, separated by a blank line (`\n\n`). Frames arrive in this order:

```
event: crisis    data: { "lang": "he" }                          (0 or 1, first)
event: token     data: { "text": "..." }                          (many)
event: sources   data: [ { "n": 1, "itemId": "...", ... }, ... ]   (0 or 1)
event: done      data: {}                                          (1, last)
event: error     data: { "message": "..." }                        (on failure)
```

| Event | Payload | What to do |
|-------|---------|------------|
| `crisis` | `{ lang }` | User's message tripped the crisis check. **Pin the ERAN banner** (helpline 1201) using the `eran_link` + `eran_phone` strings ([§10](#10-copyable-ui-strings)). Fires before any token. |
| `token` | `{ text }` | A chunk of the answer. **Append** to the current assistant message and render live. Contains inline `[[n]]` markers — strip them for display ([§5](#5-citations--source-links)). |
| `sources` | array of source objects | The passages behind the answer. Store on the message; use to build source links. Shape below. |
| `done` | `{}` | Stream finished cleanly. Stop the "thinking" indicator. |
| `error` | `{ message }` | Something failed mid-stream. Show an error; stop the indicator. |

**Refusal is a normal `200`.** When retrieval finds nothing relevant, the Worker
sends one `token` with a polite "I can only help with topics on this site" line (in
the user's language) then `done`. There's no special event — just render it.

**`sources` object shape:**

```json
{
  "n": 1,                       // citation number, matches [[n]] in the text
  "itemId": "uuid",             // the article/item id
  "groupId": "uuid",            // translation group (see mobile-data-guide §2)
  "type": "faq",                // content type: faq | source | tool | treatment_step | article | ...
  "langId": "he",               // language of the passage (may differ from `lang`)
  "title": "זכויות נפגעי פעולות איבה",
  "text": "the exact passage the answer drew from",
  "categorySlug": "rights"      // primary category (used to route faq citations)
}
```

---

## 5. Citations → source links

The answer text contains inline markers like `[[1]]` or `[[2]][[3]]` right after
sentences that used a source. These are **internal** — the reader never sees the raw
markers. Do this:

1. **Collect** the cited numbers: regex `/\[\[(\d+)\]\]/g` over the full answer.
2. **Strip** them from the display text: `.replace(/\[\[\d+\]\]/g, "")`
   (and tidy any space left before punctuation: `.replace(/[ \t]+([.,!?])/g, "$1")`).
3. **Render source links** for only the `sources` whose `n` is in the cited set.
   De-duplicate by `(route, title)` so the same source doesn't appear twice.

On the **website**, each source becomes a chip linking to the section page for that
content type. The mapping ([`src/lib/citations.jsx`](../src/lib/citations.jsx)):

```js
function sectionRoute(type, categorySlug) {
  if (type === "faq") {
    if (categorySlug === "ptsd-info")     return "/ptsd-info";
    if (categorySlug === "second-circle") return "/second-circle-tools";
    return "/rights";                       // rights or missing (safe fallback)
  }
  switch (type) {
    case "source":         return "/sources";
    case "tool":           return "/self-help";
    case "treatment_step": return "/treatment";
    default:               return "/children";   // article, book, activity, story, video
  }
}
```

**For the app:** replace these web routes with your **in-app navigation targets**
for each content type. The `type` + `categorySlug` → screen mapping is yours to
define; the logic above is the reference. You already fetch items by `itemId`
(mobile-data-guide §1), so a chip can deep-link straight to that item's screen if
you prefer that over a section screen.

The website renders the answer as **Markdown** (bold, lists, paragraphs) — use a
Markdown renderer in the app too, since the model is prompted to format that way.

---

## 6. Safety & crisis handling — required

This is not optional UI polish. If you ship the chatbot, you ship the crisis banner.

- On a `crisis` event, **pin a visible banner** for the rest of the conversation
  showing the ERAN helpline. Use the localized strings: `eran_link` (label) +
  `eran_phone` (`1201`), and make the phone tappable (`tel:1201`). Strings are in
  [§10](#10-copyable-ui-strings).
- The check is a per-language keyword/regex match (self-harm / suicide / acute
  distress phrasing across all 5 languages). It runs **before** the model and is
  independent of it. False positives fail safe — showing ERAN is low-harm.
- The model is *also* prompted to surface ERAN on distress (belt and suspenders),
  but your banner must not depend on the model — key off the `crisis` event.
- Show a small **"not medical advice"** disclaimer near the chat input
  (`chat_disclaimer` string). The bot never diagnoses or gives treatment advice by
  design; the disclaimer reinforces it.

---

## 7. Rate limiting & sessions

- **20 messages per hour per `sessionId`.** Over the limit → `POST /chat` returns
  `429`. Show a friendly "you've reached the limit, try again shortly" message.
- `sessionId` is a **client-generated UUID** you create once and keep in memory for
  the session. On the website it's regenerated on full page reload — so a reload
  resets the limit. This is intentional and acceptable. For the app: generate one
  per app launch (or per chat session); it does not need to be stable across
  restarts.
- The limit is enforced in Cloudflare KV keyed on `sessionId`. No auth, no account.

---

## 8. Languages & RTL

- Five languages: `he`, `ar`, `en`, `ru`, `fr`. Pass the user's current one as
  `lang`. The bot **answers in that language**.
- Most vetted content exists only in **Hebrew**. When you ask in another language,
  the Worker retrieves the Hebrew passages and Gemini translates at answer time.
  Tradeoff: non-Hebrew answers are one machine-translation hop from the vetted
  Hebrew text. (Retrieval prefers same-language passages when at least 3 exist,
  otherwise falls back to Hebrew.)
- `he` and `ar` are **RTL** — render the chat panel, bubbles, and banner RTL for
  those languages, LTR otherwise. The website already does this via its language
  context; mirror that.

---

## 9. Privacy

**Nothing is stored.** No questions, answers, or conversation content are persisted
anywhere. Requests are processed in memory on the Worker and discarded. There is no
analytics or transcript logging. Keep it that way in the app — don't log message
bodies to a backend.

---

## 10. Copyable UI strings

All chat strings already exist localized for all 5 languages in
[`src/lib/i18n.js`](../src/lib/i18n.js). Copy them into the app's i18n. Keys:

| Key | Purpose |
|-----|---------|
| `chat_title` | Panel header ("Chat") |
| `chat_placeholder` | Input placeholder ("Type here…") |
| `hero_chat_placeholder` | Home/hero input placeholder ("Ask me anything…") |
| `chat_send` | Send button label |
| `chat_close` | Close button label |
| `chat_thinking` | "Thinking" indicator label |
| `chat_starters` | Array of 3 starter suggestion prompts |
| `chat_disclaimer` | "This information is general and not medical advice." |
| `chat_view_in_site` | "View source on site" (rename for app context) |
| `eran_link` | Crisis banner label ("If you are in distress — talk to ERAN") |
| `eran_phone` | `1201` |

English reference values:

```js
chat_title:            "Chat",
chat_placeholder:      "Type here...",
hero_chat_placeholder: "Ask me anything...",
chat_send:             "Send",
chat_close:            "Close",
chat_thinking:         "Thinking",
chat_disclaimer:       "This information is general and not medical advice.",
chat_view_in_site:     "View source on site",
chat_starters:         ["What are my rights?", "What is a flashback?", "How can I calm down right now?"],
eran_link:             "If you are in distress - talk to ERAN",
eran_phone:            "1201",
```

Grab the `he`/`ar`/`ru`/`fr` values from `src/lib/i18n.js` (search the key).

---

## 11. Reference client (SSE parsing)

The website's client is [`src/lib/chatClient.js`](../src/lib/chatClient.js). It POSTs
the body and parses the SSE frames with a small state machine. The core loop,
framework-agnostic:

```js
export async function streamChat({ base, messages, lang, sessionId }, handlers = {}) {
  const res = await fetch(`${base}/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages, lang, sessionId }),
  });
  if (res.status === 429) return handlers.onError?.("rate_limited");
  if (!res.ok || !res.body) return handlers.onError?.(`http_${res.status}`);

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    let sep;
    while ((sep = buf.indexOf("\n\n")) >= 0) {        // one frame per blank line
      const raw = buf.slice(0, sep);
      buf = buf.slice(sep + 2);
      const ev   = /^event:\s*(.+)$/m.exec(raw)?.[1]?.trim();
      const data = JSON.parse(/^data:\s*(.*)$/m.exec(raw)?.[1] ?? "{}");
      if      (ev === "crisis")  handlers.onCrisis?.(data.lang);
      else if (ev === "token")   handlers.onToken?.(data.text ?? "");
      else if (ev === "sources") handlers.onSources?.(data);
      else if (ev === "error")   handlers.onError?.(data.message ?? "error");
      else if (ev === "done")    handlers.onDone?.();
    }
  }
}
```

Message-state handling (append tokens, attach sources) is in
[`src/lib/ChatContext.jsx`](../src/lib/ChatContext.jsx) — copy its `send` reducer
logic.

### ⚠️ Mobile streaming caveat (read this)

`res.body.getReader()` (streaming fetch) is the one thing that differs on mobile.
**React Native's default `fetch` does not expose a readable stream body** — `res.body`
is null, so the loop above won't work as-is. Options, pick one:

- **`react-native-sse`** (EventSource for RN) — cleanest. But it's GET-oriented;
  since `/chat` is POST with a JSON body, use a library that supports POST SSE
  (e.g. `react-native-sse` supports `method` + `body`), or the XHR approach below.
- **`XMLHttpRequest` with `onprogress`** — RN's XHR delivers partial
  `responseText` as it arrives; diff the new tail each `onprogress` and run the same
  frame-splitting on `\n\n`. Works without extra deps.
- **Expo:** `expo/fetch` (`fetch` from `expo/fetch`) supports streaming response
  bodies and gives you the `getReader()` API above directly.
- **Fallback (no streaming):** call `/chat`, wait for the full response text, then
  split frames and replay them. You lose the live typewriter effect but the crisis
  banner, answer, and sources all still work. Fine for a first cut.

Everything else (the frame format, event names, payloads) is identical to the web.

---

## 12. Config & gotchas

**Worker environment** (set in [`worker/wrangler.toml`](../worker/wrangler.toml) +
secrets):

| Var | Value / purpose |
|-----|-----------------|
| `SITE_ORIGIN` | Allowed CORS origin. Currently the website. **Add the app's web origin here if the app is browser-based on a different domain.** Native apps are unaffected. |
| `API_BASE` | `https://ptsd-il-api.onrender.com/api` — ingestion source. |
| `GEMINI_MODEL` | `gemini-flash-latest`. |
| `GEMINI_API_KEY` | Secret (Worker secret, never in any client bundle). |
| `ADMIN_VERIFY_URL` | Admin endpoint used to validate reindex JWTs. |
| `VECTORIZE` / `AI` / `RL` | Vectorize index, Workers AI, KV rate-limit bindings. |

**App-side config:** one value — the Worker base URL. The website reads it from
`VITE_CHATBOT_URL` (`src/.env.example`). Production:
`https://ptsd-chatbot-worker.ptsd-il.workers.dev`.

**Gotchas:**

- **CORS on web apps.** Native = fine. Web app on a new origin = add it to
  `SITE_ORIGIN` first, or `/chat` requests get blocked by the browser.
- **Send history minus the placeholder.** Send prior turns, but not the empty
  assistant turn you're about to stream into. The Worker takes the last `user`
  message as the question.
- **Strip `[[n]]` before display**, always. Raw markers leaking into the UI is the
  most common integration bug.
- **`sources[].langId` can differ from `lang`.** A Hebrew source backing an English
  answer is expected (translate-from-Hebrew). Don't filter sources by language.
- **First reindex / cold data only.** The chat path is always warm; the Render API
  cold-start only affects the admin reindex, not users.

---

## 13. Ingestion & reindex (context — the app does NOT do this)

For completeness. The content in the vector index is built by the admin flow, not
the app:

- `POST /reindex` is **admin-only** (validated against the admin's Google JWT — the
  same token the website admin panel already holds). The app never calls it.
- The website admin panel triggers a reindex after create/update/delete, and has a
  "reindex all" button.
- Ingestion pulls published items from `/articles` + `/communities`, extracts the
  Markdown/plain-text leaves from each item's `content` JSON (skipping URLs/ids —
  see [`worker/src/lib/content.ts`](../worker/src/lib/content.ts)), chunks (~1600
  chars, 200 overlap), embeds with bge-m3, and upserts into Vectorize keyed
  `${itemId}:${chunkIndex}`.

If content changes and isn't reflected in answers, the fix is a reindex from the
admin panel — nothing in the app.

---

## 14. App integration checklist

- [ ] Add the Worker base URL to app config.
- [ ] Generate a `sessionId` (UUID) per session; keep it in memory.
- [ ] Build the chat UI: message list, input, send button, "thinking" indicator.
- [ ] POST `{ messages, lang, sessionId }` to `/chat` on send (history minus the
      empty assistant placeholder).
- [ ] Parse the SSE stream — pick a mobile streaming approach ([§11](#11-reference-client-sse-parsing)).
- [ ] Handle each event: `crisis` → banner, `token` → append, `sources` → attach,
      `done`/`error` → stop indicator.
- [ ] Strip `[[n]]` markers from display; build source links from cited `sources`.
- [ ] Map `type` + `categorySlug` → in-app navigation for source links ([§5](#5-citations--source-links)).
- [ ] Render answers as **Markdown**.
- [ ] Pin the **ERAN banner** on `crisis`; show the **not-medical-advice**
      disclaimer near the input.
- [ ] Handle `429` (rate limited) gracefully.
- [ ] RTL for `he`/`ar`.
- [ ] Copy the `chat_*` / `eran_*` i18n strings for all 5 languages.
- [ ] Store nothing — no conversation logging.
