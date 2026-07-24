# Chatbot — Mobile App Integration Guide

How to add the site chatbot to the mobile app.

Companion to [`mobile-data-guide.md`](./mobile-data-guide.md): that doc is about
rendering content, this one is about the chatbot.

**The whole thing is one endpoint.** You POST the conversation to `POST /chat` and
read the answer back as a stream. The app runs no AI — everything heavy already
lives on the server. You send messages, read the stream, render it.

Worker URL (production): `https://ptsd-chatbot-worker.ptsd-il.workers.dev`

---

## 0. Prerequisite — CORS must be opened first ⚠️

Right now the chatbot server only accepts requests from the website's origin. **It
must be changed to allow all origins before the app can call it.** This is a
one-line server change (not something you do in the app), but nothing below works
until it's done:

- In [`worker/src/index.ts`](../worker/src/index.ts) the CORS `origin` is set to the
  single site origin (`c.env.SITE_ORIGIN`).
- Change it to allow everyone — `origin: "*"`. `/chat` uses no cookies or auth, so
  `*` is safe here.
- Redeploy the Worker (`wrangler deploy`).

Until that ships, `/chat` requests from the app will be rejected. Flag this to
whoever owns the Worker.

---

## 1. What it is (only what affects the app)

A chatbot that answers **only** from the site's own vetted content, in the user's
language, and cites its sources. It never gives medical advice, and it flags user
distress so the app can show the crisis helpline. Three things this means for your
UI:

- **It can refuse.** If the question isn't covered by site content, it returns a
  short "I can only help with topics on this site" answer instead of making
  something up. Render it like any other answer.
- **Answers carry sources.** Each answer comes with the passages behind it, which
  you turn into tappable links ([§4](#4-citations--in-app-source-links)).
- **It can signal a crisis.** On distress, the stream emits a `crisis` signal and
  you must show the ERAN helpline banner ([§5](#5-crisis--safety--required)).

You don't need to know how retrieval or generation works to integrate it.

---

## 2. The endpoint: `POST /chat`

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
| `messages` | array of `{ role, content }` | The full conversation so far. `role` is `"user"` or `"assistant"`. Send the whole history each turn (the server keeps no state) — but **not** the empty assistant turn you're about to fill. |
| `lang` | `"he" \| "ar" \| "en" \| "ru" \| "fr"` | The user's current UI language. The bot answers in this language. |
| `sessionId` | string (UUID) | Client-generated, kept in memory. Used for rate limiting. One per app session ([§6](#6-rate-limiting--sessions)). |

**Response** — a stream (`text/event-stream`). Status codes:

| Status | Meaning | App does |
|--------|---------|----------|
| `200` + stream | Normal | Read the stream ([§3](#3-the-stream)). |
| `429` | Rate limited | Show "too many messages, try again shortly". |
| other non-2xx | Server error | Show a generic error. |

---

## 3. The stream

The `200` response body streams **Server-Sent Events (SSE)**: `event: <name>` +
`data: <json>` frames, each separated by a blank line (`\n\n`). They arrive in this
order:

```
event: crisis    data: { "lang": "he" }                          (0 or 1, first)
event: token     data: { "text": "..." }                          (many)
event: sources   data: [ { "n": 1, "itemId": "...", ... }, ... ]   (0 or 1)
event: done      data: {}                                          (1, last)
event: error     data: { "message": "..." }                        (on failure)
```

| Event | Payload | What to do |
|-------|---------|------------|
| `crisis` | `{ lang }` | Show the **ERAN banner** ([§5](#5-crisis--safety--required)). Fires before any token. |
| `token` | `{ text }` | A chunk of the answer. **Append** it to the current assistant message and render live. Contains inline `[[n]]` markers — strip them ([§4](#4-citations--in-app-source-links)). |
| `sources` | array of source objects | The passages behind the answer. Store them on the message to build links. Shape below. |
| `done` | `{}` | Finished cleanly. Stop the "thinking" indicator. |
| `error` | `{ message }` | Failed mid-stream. Show an error; stop the indicator. |

**`sources` object shape:**

```json
{
  "n": 1,                       // citation number, matches [[n]] in the text
  "itemId": "uuid",             // the article/item id (fetch it via the API if needed)
  "groupId": "uuid",            // translation group (mobile-data-guide §2)
  "type": "faq",                // faq | source | tool | treatment_step | article | ...
  "langId": "he",               // language of the passage (MAY differ from `lang`)
  "title": "זכויות נפגעי פעולות איבה",
  "text": "the exact passage the answer drew from",
  "categorySlug": "rights"      // primary category, used to route the link
}
```

---

## 4. Citations → in-app source links

Answer text contains inline markers like `[[1]]` or `[[2]][[3]]` after sentences
that used a source. These are **internal** — the user never sees the raw markers.

1. **Collect** cited numbers: regex `/\[\[(\d+)\]\]/g` over the full answer text.
2. **Strip** them from what you display:
   `.replace(/\[\[\d+\]\]/g, "").replace(/[ \t]+([.,!?])/g, "$1")`
3. **Show a link** for each `sources` entry whose `n` is in the cited set. De-dupe by
   `(destination, title)` so the same source doesn't repeat.

Each source links to the screen for that content type. Map `type` (+ `categorySlug`
for `faq`) to **your in-app navigation**. Reference logic (from the website):

```js
function destinationFor(type, categorySlug) {
  if (type === "faq") {
    if (categorySlug === "ptsd-info")     return "ptsd-info screen";
    if (categorySlug === "second-circle") return "second-circle-tools screen";
    return "rights screen";                 // rights or missing (safe fallback)
  }
  switch (type) {
    case "source":         return "sources screen";
    case "tool":           return "self-help screen";
    case "treatment_step": return "treatment screen";
    default:               return "children screen"; // article, book, activity, story, video
  }
}
```

You already fetch items by `itemId` (mobile-data-guide §1), so a link can deep-link
straight to that item's screen instead if you prefer.

**Render answers as Markdown** — the bot formats with bold, lists, and paragraphs.

---

## 5. Crisis & safety — required

Not optional. If you ship the chatbot, you ship the crisis banner.

- On a `crisis` event, **pin a visible banner** for the rest of the conversation with
  the ERAN helpline: label `eran_link`, number `eran_phone` (`1201`), phone tappable
  (`tel:1201`). Strings in [§9](#9-ui-strings).
- The check runs independently of the AI, so **key your banner off the `crisis`
  event**, not off anything in the answer text.
- Show a small **"not medical advice"** disclaimer near the input (`chat_disclaimer`).

---

## 6. Rate limiting & sessions

- **20 messages per hour per `sessionId`.** Over the limit → `POST /chat` returns
  `429`. Show a friendly "reached the limit, try again shortly".
- `sessionId` is a **client-generated UUID** you create once and keep in memory.
  Generate one per app launch (or per chat session). It doesn't need to survive a
  restart — a fresh id just resets the limit.

---

## 7. Languages & RTL

- Five languages: `he`, `ar`, `en`, `ru`, `fr`. Pass the current one as `lang`; the
  bot answers in it.
- Most content exists only in **Hebrew**; for other languages the answer is
  translated at generation time. So `sources[].langId` can be `he` even when the
  answer is English — **don't filter sources by language.**
- `he` and `ar` are **RTL** — render the panel, bubbles, and banner RTL for those.

---

## 8. Privacy

**Nothing is stored** server-side — no questions, answers, or transcripts. Keep it
that way in the app: don't log conversation content to any backend.

---

## 9. UI strings

All chat strings are already localized for all 5 languages in
[`src/lib/i18n.js`](../src/lib/i18n.js). Copy them into the app. Keys:

| Key | Purpose |
|-----|---------|
| `chat_title` | Panel header |
| `chat_placeholder` | Input placeholder |
| `hero_chat_placeholder` | Home/hero input placeholder |
| `chat_send` / `chat_close` | Button labels |
| `chat_thinking` | "Thinking" indicator |
| `chat_starters` | Array of 3 starter-suggestion prompts |
| `chat_disclaimer` | "…general and not medical advice." |
| `eran_link` | Crisis banner label |
| `eran_phone` | `1201` |

English reference values (pull `he`/`ar`/`ru`/`fr` from the same file):

```js
chat_title:            "Chat",
chat_placeholder:      "Type here...",
hero_chat_placeholder: "Ask me anything...",
chat_send:             "Send",
chat_close:            "Close",
chat_thinking:         "Thinking",
chat_disclaimer:       "This information is general and not medical advice.",
chat_starters:         ["What are my rights?", "What is a flashback?", "How can I calm down right now?"],
eran_link:             "If you are in distress - talk to ERAN",
eran_phone:            "1201",
```

---

## 10. Reference client + mobile streaming caveat

The website's parser is [`src/lib/chatClient.js`](../src/lib/chatClient.js). The core
loop — POST, then split the stream into frames on the blank line:

```js
async function streamChat({ base, messages, lang, sessionId }, handlers = {}) {
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

### ⚠️ React Native doesn't stream `fetch` bodies

The line above — `res.body.getReader()` — is the one thing that differs on mobile.
**React Native's default `fetch` returns `res.body === null`**, so you can't read the
stream that way. Pick one:

- **`expo/fetch`** (`import { fetch } from "expo/fetch"`) — supports streaming
  bodies and gives you the exact `getReader()` code above. Easiest if you're on Expo.
- **`react-native-sse`** — an EventSource that supports `method: "POST"` + `body`.
  Handle its `message`/named events instead of the manual split.
- **`XMLHttpRequest` + `onprogress`** — RN's XHR exposes partial `responseText` as it
  arrives; on each `onprogress`, take the new tail and run the same `\n\n` frame
  split. No extra dependency.
- **No-streaming fallback** — await the full response text, then split and replay the
  frames. You lose the live typewriter effect, but the answer, sources, and crisis
  banner all still work. Fine for a first version.

The frame format and event names are identical to the web either way.

---

## 11. App config

One value: the Worker base URL —
`https://ptsd-chatbot-worker.ptsd-il.workers.dev`. (The website reads it from
`VITE_CHATBOT_URL`; the app just needs the same URL.)

Reminder: CORS must be opened first ([§0](#0-prerequisite--cors-must-be-opened-first-️)).

---

## 12. Integration checklist

- [ ] Confirm the Worker CORS is opened to all origins ([§0](#0-prerequisite--cors-must-be-opened-first-️)).
- [ ] Add the Worker base URL to app config.
- [ ] Generate a `sessionId` (UUID) per session; keep it in memory.
- [ ] Build the chat UI: message list, input, send, "thinking" indicator.
- [ ] POST `{ messages, lang, sessionId }` on send (history minus the empty
      assistant placeholder).
- [ ] Parse the SSE stream — pick a mobile approach ([§10](#10-reference-client--mobile-streaming-caveat)).
- [ ] Handle events: `crisis` → banner, `token` → append, `sources` → attach,
      `done`/`error` → stop indicator.
- [ ] Strip `[[n]]` markers from display; build source links from cited `sources`.
- [ ] Map `type` (+ `categorySlug`) → in-app navigation for links ([§4](#4-citations--in-app-source-links)).
- [ ] Render answers as **Markdown**.
- [ ] Pin the **ERAN banner** on `crisis`; show the **not-medical-advice** disclaimer.
- [ ] Handle `429` gracefully.
- [ ] RTL for `he`/`ar`.
- [ ] Copy the `chat_*` / `eran_*` strings for all 5 languages.
- [ ] Store nothing — no conversation logging.
