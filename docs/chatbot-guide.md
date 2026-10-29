# Chatbot - Mobile App Integration Guide

How to add the site chatbot to the mobile app.

Companion to [`mobile-data-guide.md`](./mobile-data-guide.md): that doc is about
rendering content, this one is about the chatbot.

**The whole thing is one endpoint.** You POST the conversation to `POST /chat` and
read the answer back as a stream. The app runs no AI - everything heavy already
lives on the server. You send messages, read the stream, render it.

Worker URL (production): `https://ptsd-chatbot-worker.ptsd-il.workers.dev`

---

## 0. Prerequisite - CORS must be opened first ⚠️

Right now the chatbot server only accepts requests from the website's origin. **It
must be changed to allow all origins before the app can call it.** This is a
one-line server change (not something you do in the app), but nothing below works
until it's done:

- In [`worker/src/index.ts`](../worker/src/index.ts) the CORS `origin` is set to the
  single site origin (`c.env.SITE_ORIGIN`).
- Change it to allow everyone - `origin: "*"`. `/chat` uses no cookies or auth, so
  `*` is safe here.
- Redeploy the Worker (`wrangler deploy`).

Until that ships, `/chat` requests from the app will be rejected. Flag this to
whoever owns the Worker.

---

## 1. What it is (only what affects the app)

A chatbot that answers **only** from the site's own vetted content, in the user's
language, and cites its sources. The content covers both audiences of the site
(trauma survivors and families, and mental-health professionals) and Metiv itself. It never gives medical advice, and it flags user
distress so the app can show the crisis helpline. Three things this means for your
UI:

- **It can refuse.** If the question isn't covered by site content, it returns a
  short "I can only help with topics on this site" answer instead of making
  something up. Render it like any other answer.
- **Answers carry sources.** Each answer comes with the passages behind it, which
  you turn into tappable links ([§4](#4-citations--in-app-source-links)).
- **It can signal a crisis.** On distress, the stream emits a `crisis` signal and
  you must show the ERAN helpline banner ([§5](#5-crisis--safety---required)).

You don't need to know how retrieval or generation works to integrate it.

---

## 2. The endpoint: `POST /chat`

**Request** - JSON body:

```json
{
  "messages": [
    { "role": "user", "content": "מהן הזכויות שלי?" },
    { "role": "assistant", "content": "..." },
    { "role": "user", "content": "ומה עם דיור?" }
  ],
  "lang": "he",
  "sessionId": "a1b2c3d4-....",
  "area": "patient"
}
```

| Field | Type | Meaning |
|-------|------|---------|
| `messages` | array of `{ role, content }` | The full conversation so far. `role` is `"user"` or `"assistant"`. Send the whole history each turn (the server keeps no state) - but **not** the empty assistant turn you're about to fill. |
| `lang` | `"he" \| "ar" \| "en" \| "ru" \| "fr"` | The user's current UI language. The bot answers in this language. |
| `sessionId` | string (UUID) | Client-generated, kept in memory. Used for rate limiting. One per app session ([§6](#6-rate-limiting--sessions)). |
| `area` | `"patient" \| "therapist" \| "metiv"`, optional | The part of the site the user is on. `patient` (survivors and families) keeps the self-help-first rules as the default, `therapist` (professionals) answers in a professional register about courses, supervision, programs, research and events, `metiv` (the general pages about Metiv) lets the question decide. Missing or unknown: the question decides, and an unclear one is treated as a survivor's. The website derives it from the path ([`chatArea`](../src/lib/citations.jsx)): `/metiv-site-demo-v3/patient/*` is `patient`, `/metiv-site-demo-v3/therapist/*` is `therapist`, every other v3 page (home, about, contact, donate, legal) is `metiv`, and outside the v3 demo it is not sent. The app should send `patient` from its survivor screens. |

**Response** - a stream (`text/event-stream`). Status codes:

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
| `crisis` | `{ lang }` | Show the **ERAN banner** ([§5](#5-crisis--safety---required)). Fires before any token. |
| `token` | `{ text }` | A chunk of the answer. **Append** it to the current assistant message and render live. Contains inline `[[n]]` markers - strip them ([§4](#4-citations--in-app-source-links)). |
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
  "categorySlug": "rights",     // primary category, used to route the link
  "categorySlugs": ["rights"],  // every category of the item (Metiv rows: ["metiv", "metiv-veterans"])
  "key": "cbt-trauma",          // Metiv rows only: the row's `_key` (a course's or article's slug)
  "section": "terms"            // sectioned Metiv singletons only: "privacy" / "terms" of LEGAL_DOCS, a page key of SHORT_VERSIONS
}
```

`categorySlug` is the first category that is not the `metiv` parent, so a Metiv
row routes by its collection. `categorySlugs`, `key` and `section` are absent on
vectors indexed before they existed (until the next full reindex); fall back to
`categorySlug` and the collection's list page.

---

## 4. Citations → in-app source links

Answer text contains inline markers like `[[1]]` or `[[2]][[3]]` after sentences
that used a source. These are **internal** - the user never sees the raw markers.

1. **Collect** cited numbers: regex `/\[\[(\d+)\]\]/g` over the full answer text.
2. **Strip** them from what you display:
   `.replace(/\[\[\d+\]\]/g, "").replace(/[ \t]+([.,!?])/g, "$1")`
3. **Show a link** for each `sources` entry whose `n` is in the cited set. De-dupe by
   `(destination, title)` so the same source doesn't repeat.

Each source links to the screen for that content type. Map `type` (+ `categorySlug`
for `faq` and `legal`, + `categorySlugs`, `key` and `section` for Metiv rows) to
**your in-app navigation**. The legal documents' titles are a slug
(`privacy-policy`) or a collection key (`LEGAL_DOCS`), so label those chips with
the page name instead (the website uses the `privacy_policy` / `terms_of_use`
strings, [`sourceTitle`](../src/lib/citations.jsx)).
Reference logic (from the website, [`src/lib/citations.jsx`](../src/lib/citations.jsx)):

```js
function destinationFor(type, categorySlug, categorySlugs = [], { key, section, title } = {}) {
  // Metiv rows route by collection first (v3 demo pages):
  //   patient area:
  //   metiv-services / -public-options / -nonprofit-options / -consultation -> where-to-get-help
  //   metiv-free-treatments / -research-studies -> free-treatment-and-research
  //   metiv-veterans -> community, metiv-parent-child -> children,
  //   metiv-reservist-family -> second-circle-tools, metiv-patient-books / -books-note -> sources,
  //   metiv-video-lectures -> self-help, metiv-treatment-where -> treatment,
  //   metiv-release-journey / metiv-rj-* -> release-journey, metiv-patient-hub -> patient hub,
  //   metiv-short-versions -> the patient page named by `section` (else the hub)
  //   therapist area:
  //   metiv-therapist-hub -> therapist hub, metiv-courses -> courses/<key> (else courses),
  //   metiv-course-categories -> courses, metiv-supervision -> supervision,
  //   metiv-org-programs -> organizations#<key>, metiv-children-family -> children-and-family,
  //   metiv-research-intro -> research, metiv-studies -> research#<key>,
  //   metiv-books / -papers / -paper-topics -> publications,
  //   metiv-articles -> articles/<key> (else articles), metiv-events -> events
  //   Metiv itself:
  //   metiv-org / metiv-contacts -> contact, metiv-about / -facts -> about/history,
  //   metiv-team -> about/team, metiv-department-groups -> about#about-<key>,
  //   metiv-funders / -partner-groups -> about/partners,
  //   metiv-partners / -collaboration-groups / -collaboration-contact -> about/collaborations,
  //   metiv-donate -> donate, metiv-legal-docs -> terms-of-use when section is "terms", else privacy-policy,
  //   metiv-legal -> privacy-policy when section is "privacy", else accessibility,
  //   any other metiv slug -> patient hub
  // PTSD-IL privacy policy / terms of use (category "legal", titled with the page slug):
  if (categorySlug === "legal") return title === "terms-of-use" ? "terms screen" : "privacy screen";
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

**Render answers as Markdown** - the bot formats with bold, lists, and paragraphs.

---

## 5. Crisis & safety - required

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
  restart - a fresh id just resets the limit.

---

## 7. Languages & RTL

- Five languages: `he`, `ar`, `en`, `ru`, `fr`. Pass the current one as `lang`; the
  bot answers in it.
- Most content exists only in **Hebrew**; for other languages the answer is
  translated at generation time. So `sources[].langId` can be `he` even when the
  answer is English - **don't filter sources by language.**
- `he` and `ar` are **RTL** - render the panel, bubbles, and banner RTL for those.

---

## 8. Privacy

**Nothing is stored** server-side - no questions, answers, or transcripts. Keep it
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
loop - POST, then split the stream into frames on the blank line:

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

The line above - `res.body.getReader()` - is the one thing that differs on mobile.
**React Native's default `fetch` returns `res.body === null`**, so you can't read the
stream that way. Pick one:

- **`expo/fetch`** (`import { fetch } from "expo/fetch"`) - supports streaming
  bodies and gives you the exact `getReader()` code above. Easiest if you're on Expo.
- **`react-native-sse`** - an EventSource that supports `method: "POST"` + `body`.
  Handle its `message`/named events instead of the manual split.
- **`XMLHttpRequest` + `onprogress`** - RN's XHR exposes partial `responseText` as it
  arrives; on each `onprogress`, take the new tail and run the same `\n\n` frame
  split. No extra dependency.
- **No-streaming fallback** - await the full response text, then split and replay the
  frames. You lose the live typewriter effect, but the answer, sources, and crisis
  banner all still work. Fine for a first version.

The frame format and event names are identical to the web either way.

---

## 11. App config

One value: the Worker base URL -
`https://ptsd-chatbot-worker.ptsd-il.workers.dev`. (The website reads it from
`VITE_CHATBOT_URL`; the app just needs the same URL.)

Reminder: CORS must be opened first ([§0](#0-prerequisite---cors-must-be-opened-first-️)).

---

## 12. Integration checklist

- [ ] Confirm the Worker CORS is opened to all origins ([§0](#0-prerequisite---cors-must-be-opened-first-️)).
- [ ] Add the Worker base URL to app config.
- [ ] Generate a `sessionId` (UUID) per session; keep it in memory.
- [ ] Build the chat UI: message list, input, send, "thinking" indicator.
- [ ] POST `{ messages, lang, sessionId, area }` on send (history minus the empty
      assistant placeholder; `area` optional, [§2](#2-the-endpoint-post-chat)).
- [ ] Parse the SSE stream - pick a mobile approach ([§10](#10-reference-client--mobile-streaming-caveat)).
- [ ] Handle events: `crisis` → banner, `token` → append, `sources` → attach,
      `done`/`error` → stop indicator.
- [ ] Strip `[[n]]` markers from display; build source links from cited `sources`.
- [ ] Map `type` (+ `categorySlug`) → in-app navigation for links ([§4](#4-citations--in-app-source-links)).
- [ ] Render answers as **Markdown**.
- [ ] Pin the **ERAN banner** on `crisis`; show the **not-medical-advice** disclaimer.
- [ ] Handle `429` gracefully.
- [ ] RTL for `he`/`ar`.
- [ ] Copy the `chat_*` / `eran_*` strings for all 5 languages.
- [ ] Store nothing - no conversation logging.

---

# Part 2 - Server side (Worker owners)

Everything below is about the Worker itself, not the app.

## 13. Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/health` | none | `{ "ok": true }` |
| `POST` | `/chat` | none (20/hour per `sessionId`) | The chat stream (sections 2-3) |
| `POST` | `/reindex` | `Authorization: Bearer <admin JWT>` | `{ "scope": "all", "cursor"?: "..." }` (stepped, [§18](#18-deploy)) or `{ "scope": "item", "itemId": "..." }` |
| `POST` | `/translate` | `Authorization: Bearer <admin JWT>` (240/hour per token) | Hebrew to ar/en/ru/fr for the admin (section 16) |

Admin auth: the Worker forwards the header to `ADMIN_VERIFY_URL`; a 2xx means
admin. `/translate` caches a success in the `RL` KV namespace under
`auth:<sha256 of the token>` for 300 seconds (the raw token is never stored), so a
revoked token can keep translating for up to 5 minutes.

`/reindex` responses: `scope: "all"` does one bounded step of the full reindex
per call and returns `{ ok, done, cursor?, progress: { phase, slice, processed,
total }, excluded, qa }` (`excluded`: rows skipped by the exclusions below, `qa`:
Q&A rows written, both counted over the slices finished so far). While `done` is
false, call again with the returned `cursor`; the final step also carries
`upserted` (chunk vectors written by the run). A malformed cursor, or one from
an older Worker, is a 400 `invalid_cursor`. `scope: "item"` returns
`{ ok, upserted }`, plus `qa` when the item is or was a Q&A row (`1`: the row
was written, `0`: it was removed).

## 14. What gets indexed

The general Vectorize index holds every published article and active community
**except** rows in these categories:

- `admin-log`, `site-copy`, `chatbot-qa`, `metiv-copy` (the PTSD-IL `legal`
  rows, privacy policy and terms of use, are indexed);
- `metiv` (or any `metiv-*` child) unless one of the row's categories is in
  `METIV_CHATBOT_SLUGS` ([`worker/src/lib/api.ts`](../worker/src/lib/api.ts)),
  which must equal the `chatbot: true` collections of
  [`registry.js`](../src/pages/metiv-demos/v3/content/registry.js)
  (`worker/test/exclusions.test.ts` fails when they drift). That is every Metiv
  collection of all three areas (courses, events, papers, books, studies, team,
  about, partners, programs, supervision, legal docs, accessibility, donate, the
  hubs and the rest) except pure navigation and taxonomy: `NAV`, `PATIENT_NAV`,
  `ROUTE_META`, `NEXT_STEPS`, `TEAM_GROUPS`, `COURSE_CATEGORIES`, `PAPER_TOPICS`.

Content keys starting with `_` (`_key`, `_tr`, `_area`, `_label`) are never
indexed as text.

**Indexed text** ([`worker/src/lib/content.ts`](../worker/src/lib/content.ts)
`extractParts`, chunked by `chunkItem` in
[`ingest.ts`](../worker/src/lib/ingest.ts)) is the title, then a header line per
relation the row has, then the string leaves of `content`. The title and the
relation lines are the chunk **header**: every chunk starts with it, not only
the first, so the fifth chunk of a long course still names the course. A Metiv
singleton row is titled with its collection key (`SUPERVISION`); when its
content has a `title` that is used instead. A Metiv singleton whose top-level
fields are all objects or lists (`LEGAL_DOCS`: `privacy` + `terms`, `LEGAL`:
`accessibility` + `privacy`, `SHORT_VERSIONS`: one list per page) is chunked
per field: the field's `title` (else its key) joins the header, a chunk never
mixes two of them, and the field key goes into the vector metadata as
`section`. Metiv rows also carry their `_key` in the metadata as `key` (chip
deep links). The leaves:

- `ageGroups` / `audiences` names, labelled in the row's language
  (`קבוצת גיל: 4-6`, `קהל יעד: נפגעי פעולות איבה`), so same-titled rows (the
  children "הנחיות" rows) differ in the index.
- PTSD-IL rows: bare string leaves; URL leaves and the keys `url`, `link`,
  `links`, `id`, `slug`, `year`, `image`, `icon` (and similar) are skipped.
- Metiv rows: values that do not describe themselves (no letters, emails,
  URLs and numbers) keep the nearest meaningful key: `phones.fax: 02-644-9777`,
  `ERAN_WHATSAPP: https://api.whatsapp.com/...`, `year: 2025`, and a
  `{ label, value }` / `{ label, href }` pair becomes `label: value`. URL leaves
  and `year` are kept (only id and media keys are skipped). Prose leaves stay
  bare.
- Metiv `{ "$ref": "KEY#_key" }` (or `"KEY"` for a singleton) is replaced by the
  referenced item's text, looked up among the Metiv rows of the same language,
  else Hebrew; a ref to a ref resolves to nothing, like the v3 provider. A full
  reindex resolves against the rows it already fetched. An item reindex of a row
  with refs fetches `GET /articles?categorySlug=metiv&langId=<lang>` once, and the
  Hebrew list only if a ref is missing there (at most 2 extra subrequests).
  Editing a referenced item (e.g. a TEAM member) does not reindex the rows that
  point to it: run a full reindex, or an item reindex of the referencing row.
  The collection of a row is `content._col`, mapped to its registry key by
  `METIV_COLLECTION_KEYS` in `api.ts` (tested against `registry.js`).

Content vectors are the only vectors in the index: default namespace, id
`<itemId>:<chunkIndex>`, as they have been from the start (the playbooks live in
KV, [§15](#15-curated-qa-playbooks)).

Excluded rows lose their vectors: an item reindex of an excluded id deletes them,
and a full reindex deletes the chunk ids every excluded row could hold. An item
reindex upserts the new chunks first and then deletes the ids past the new count
(one `deleteByIds`), so an edited item never drops out of chat.

## 15. Curated Q&A playbooks

Rows in the top-level category `chatbot-qa`, `type: 'article'`, one row per
question per language, siblings sharing a `groupId`. `content`:

```json
{
  "question": "איך מתחילים טיפול במטיב?",
  "paraphrases": ["איך פונים למטיב", "רוצה טיפול, מה עושים"],
  "guidance": "1. ... 2. ... Take phone numbers and addresses from SOURCES.",
  "answer": "optional reference answer",
  "crisis": false
}
```

**Storage.** All in KV (`RL`), nothing in Vectorize
([`worker/src/lib/qa.ts`](../worker/src/lib/qa.ts),
[`qaShard.ts`](../worker/src/lib/qaShard.ts)). Texts are embedded with
`@cf/baai/bge-m3`, the retrieval model.

| Key | What | Size today |
|---|---|---|
| `<KV_PREFIX>qa:vec:v2:<langId>` | **Shard**: the match vectors (`question` + `paraphrases`, at most 30 per row) of every row of that language, int8, one binary value | ~470 KB (35 rows, ~470 vectors) |
| `<KV_PREFIX>qa:row:<groupId>:<langId>` | The row's text and its **retrieval vector** (below), base64 Float32, JSON | 6-11 KB |

Shard layout (little-endian): `u32` magic, `u32` header length, `u32` vector
count, `u32` dims, a JSON header (`{ v: 2, ver, rows: [{ id, g, c?, s, n }] }`,
~4 KB: row id, group, crisis flag, the stamp of its texts, its vector count),
padded to 4 bytes, then one `f32` scale per vector, then the vectors as `int8`
(1,024 bytes each), each row's contiguous and in header order. A vector is the
L2-normalized embedding times `127 / max|v|`; the query is normalized and scaled
to 16,383, so a dot product is integer math (`Math.imul`, exact in 32 bits) and
`score = dot x query scale x vector scale`. Against float32 the score moves by
< 0.0012 and the best group is the same for every query that can get a playbook
(`worker/test/qa-int8.test.ts`: 2,500 vectors with paraphrase clusters and
near-duplicate groups, 600 queries; only pure-noise queries at score ~0.09 can
order two float ties differently).

The row value carries KV metadata `{ rowId, h }` (`h`: hash of the value), so
one KV `list` gives every row's id, and the full reindex skips rows that did not
change. It is keyed by group and language (not row id) because chat needs "the
user's language row of the matched group, else the Hebrew row": 1-2 gets of
known keys, in parallel. Two rows of one group and language: the last one
written owns the key, as before. The retrieval vector sits in the row value,
not the shard: chat reads that value anyway for the text, so a shard holds only
what every chat scans.

Writes:

- **Item reindex of a Q&A row** (the admin's save) touches only that row and its
  language's shard: 1 KV `list` (where the row was), 1 embedding call, 1 row
  write, then the shard: 1 get, the row's old entries out and new ones in, 1 put,
  and 1 get back 1 s later. ~2 ms of CPU for the largest row against a real-size
  shard (it was ~400 ms when every save rebuilt the 13 MB index). A row whose
  language or group changed also leaves its old shard and row value. A deleted,
  unpublished or unparseable row is removed from every shard that has it (1 list +
  5 shard gets to find out) and its row value is deleted if it still owns the key.
- **Two saves at once.** KV has no compare-and-swap, and a shard holds a whole
  language. So each write gets a new `ver`, and the save reads the shard back 1 s
  after its put: if its row is not as it wrote it (another save, which read
  before ours, wrote after), it logs `qa-shard-retry` and redoes from that
  version, at most 3 times; a KV 429 (one write per second per key) is retried
  too. This catches two admins saving through the same Cloudflare location,
  where a write is visible at once. Across locations a read can be up to 60 s
  stale and a lost entry is possible; the next full reindex rebuilds every shard
  from the DB.
- **Full reindex**: the `qa` phase builds each language's shard and writes the
  changed row values ([§18](#18-deploy)); the `qa` cleanup slice deletes row
  values of rows that no longer exist.

Reads: KV edge cache 60s plus an in-isolate cache 60s, so an edit can take up to
~2 minutes to reach chat, as before.

**At chat time** the shards of the user's language and Hebrew (one when the
user writes Hebrew) are read while the query is embedded, and the query
embedding is scored against every vector in them: ~1,000 int8 dot products,
~0.5 ms; each `groupId` keeps its best score. Rows in the other three languages
are not scanned (the old index scanned all five): a group has its row in the
user's language or Hebrew whenever it has one there. The row used is the user's
language row of the group, else the Hebrew row.

| Best score | Effect |
|------------|--------|
| `>= QA_STRONG` (0.80) | `PLAYBOOK` block before `SOURCES`, system rule: follow its guidance in order, adapt wording, take changeable facts from SOURCES, never contradict it. The bot answers even with zero retrieval hits. |
| `>= QA_WEAK` (0.72) | `POSSIBLY RELEVANT PLAYBOOK` block: use only if it fits. Zero hits still refuses. |
| lower | nothing |

When `detectCrisis` fires, the best `crisis: true` group (any score, a scan of
the crisis rows of the same two shards with the message that fired) is always
injected as a `CRISIS PLAYBOOK` first, in addition to the `crisis` SSE event.
`detectCrisis` ([`worker/src/lib/crisis.ts`](../worker/src/lib/crisis.ts)) is a
substring phrase list in all 5 languages (suicide, self-harm, overdose wording,
including the phrasings of the crisis rows' paraphrases), checked over the last
3 user messages; the crisis playbook is picked by the message that fired. Words
that also appear in everyday questions (bare "חתכתי", "פגיעה", "פלאשבק") are
left out on purpose. The list still needs a clinician's review before launch.

**Follow-ups.** A row that ends with a scoping question ("how old is the
child?") would lose its playbook on the short reply ("5"), since that reply is
matched alone. So when the latest message has no strong match, the user message
directly before it is matched too, but only when an assistant turn came after
it. A strong match there is injected as `PLAYBOOK` (strong) for this turn, and it
counts as a strong match for the zero-hits refusal; a weak match of the latest
message stays alongside as `POSSIBLY RELEVANT PLAYBOOK`. Weak matches of the
previous message are not carried, and older messages are never used. Both
messages go in the same embedding call; the previous message costs one more scan
of the shards (CPU only), only when the latest has no strong match. Retrieval
(SOURCES) still uses only the latest message.
If KV fails for playbooks, chat carries on without them.

**Playbook-guided retrieval.** A playbook tells the bot what to say, but the
facts (phone numbers, dates, prices) must come from SOURCES, and the user's
wording does not always rank the right rows: "איך יוצרים קשר עם מטיב?" ranked
second-circle "איך לתקשר ביומיום" above `metiv-contacts`, and the bot said the
details were not available. So each row also has one retrieval vector, the
embedding of its `answer` (no answer: its `question` plus the first 3 lines of
`guidance`), stored in the row's KV value and never scored for matching. When a playbook is used (strong, carried, weak, or the crisis one, but
crisis only when its row has an `answer`), chat sends ONE more Vectorize query
(topK 20) with that row's retrieval vector: the user's language row's own, else
the group's Hebrew row's. With several playbooks the first that has one wins, in
the order crisis, carried, current. It runs once the rows are read, alongside
the user query.

The two hit lists are merged: deduped by vector id at the higher score, the
same `0.4` minimum score and language rule as before (the user's language if it
has 3+ hits, else Hebrew, else all) applied to the union, then the top 15 by
score, with the top 5 guided hits that passed the filters always kept. A failed
guided query only logs `qa-guide-error` and leaves the user-query hits.
Cost: one extra Vectorize subrequest per chat that uses a playbook, none
otherwise. So write the `answer` as the content it points to would read: it is
what pulls that content into SOURCES.

**Tuning.** Every chat writes one Worker log line (not part of the stream):

```
qa-match {"best":{"groupId":"...","score":0.8312},"used":{"groupId":"...","strength":"strong"},"crisis":null}
```

`carried` (`{ groupId, score }`) is added when the previous message's playbook
was used, and `guide` (`{ groupId, hits }`) when a playbook guided retrieval
(`hits`: what the guided query returned, before filtering). `store` is
`shards`, or `legacy` while chat still reads the old one-value index
([§18](#18-deploy)).

The SSE `done` event also carries `playbook: { groupId, strength, score }` (the
first playbook injected: crisis, carried, current; `null` when none). The site
ignores it; [`scripts/qa-match-compare.mjs`](../scripts/qa-match-compare.mjs)
reads it to compare matching before and after a deploy:

```bash
node scripts/qa-match-compare.mjs questions.txt --out before.json   # lines: <lang><TAB><question>
node scripts/qa-match-compare.mjs questions.txt --out after.json --compare before.json
node scripts/qa-match-compare.mjs --from-db 40 --out before.json      # questions + first paraphrases from the DB
```

Each question is a real chat (one Gemini call, one rate-limit KV write).

**Cost of one `/chat`** (subrequests, the free plan allows 50):

| | Subrequests |
|---|---|
| Rate limit (KV get + put) | 2 |
| Embedding (latest message, previous one, crisis one) | 1 |
| Shards (user's language + Hebrew, alongside the embedding; cached 60s) | 1-2 |
| Content query | 1 |
| KV rows: per playbook used (crisis, carried, current), user language + Hebrew | 0-6 (cached 60s) |
| Guided content query (a playbook was used) | 0-1 |
| Gemini | 1 |

A plain question that hits a playbook is 10 (8 when the isolate has the shards
cached), a crisis follow-up with three playbooks at most 14
(`worker/test/chat-storage.test.ts`). The largest KV value read is a shard,
~470 KB as a binary `ArrayBuffer`: no JSON is parsed but its ~4 KB header and
the 6-11 KB row values. CPU in node for the playbook part, worst case (two
shards, ~910 vectors, three query vectors: latest, previous, crisis): 0.1 ms to
load, ~1 ms to match, against ~27 ms to decode the old index. The biggest JSON
parsed is the content query's 20 matches with their chunk text (~35-70 KB), as
before.

Watch it with `npx wrangler tail` while asking real questions and their near
misses. Raise `QA_STRONG` if unrelated questions get a strong playbook; lower it
(or add paraphrases to the row, which is usually better) if the intended
questions land in the weak band. Keep `QA_WEAK` a few points under `QA_STRONG`.
Change the values in `wrangler.toml` `[vars]` and redeploy.

## 16. `POST /translate`

Used by the admin when a Hebrew row is saved (one call per target language).

Request:

```json
{ "source": "he", "target": "ar",
  "items": { "title": "...", "sections.0.body": "..." },
  "context": "metiv / courses: <item title>" }
```

- `source` must be `"he"`; `target` one of `ar`, `en`, `ru`, `fr`.
- `items`: object of string values (flat `path -> text`), at most 500 keys and
  40,000 characters (keys + values) in total, else `413 { "error": "too_large" }`.
- `context`: optional string (first 500 characters used); it tells the model the
  audience (therapist-area content gets a professional register).

Response `200`:

```json
{ "target": "ar", "items": { "title": "...", "sections.0.body": "..." },
  "status": "pass", "notes": [], "model": "gemini-3.5-flash-lite" }
```

- `pass`: the validator found nothing.
- `fixed`: validator fixes or the one retranslate were applied and all checks pass.
- `flagged`: checks still fail after the retranslate, a serious validator issue
  had no fix (retranslated but not re-reviewed), or the validator was unavailable.
  A path the model never returned is **left out** of `items` (keep the sibling's
  current text) and listed in `notes`.
- `notes`: `"<path>: <problem>"` lines, at most 50.

Errors: `400` (`invalid_json`, `unsupported_source`, `unsupported_target`,
`invalid_items`, `invalid_context`), `401`, `413`, `429` (`rate_limited`),
`502` (`translate_failed`: the translator call failed).

Pipeline: translator call, then deterministic checks (same keys; URLs, emails,
phone numbers, digit runs and `{placeholders}` preserved; same count of Markdown
links, list items, headings and `**`; en/em dashes are replaced by `-` before
checking), then a separate validator call that gets source, translation and the
check findings and returns `{ issues: [{ path, problem, severity, fix }] }` with
`fix` the full corrected string, then fixes applied and checks re-run, then one
retranslate of the failing paths with their problems in the prompt.

Both calls use Gemini `generateContent` (non-streaming) with
`responseMimeType: application/json` + `responseSchema`, temperature 0.2
(translator) / 0.1 (validator), `thinkingConfig.thinkingLevel` `low` / `medium`,
and the key in the `x-goog-api-key` header. The glossary of names and terms is
[`worker/src/lib/glossary.ts`](../worker/src/lib/glossary.ts); edit it there.

## 17. Configuration

`wrangler.toml` `[vars]`:

| Var | Default | Meaning |
|-----|---------|---------|
| `SITE_ORIGIN` | site origins | CORS allow-list (comma-separated) |
| `API_BASE` | backend `/api` | Content source |
| `ADMIN_VERIFY_URL` | admin articles URL | Admin token check |
| `GEMINI_MODEL` | `gemini-flash-latest` | Chat model |
| `TRANSLATE_MODEL` | `gemini-3.5-flash-lite` | `/translate` model. Must accept `thinkingLevel` |
| `QA_STRONG` | `0.80` | Playbook "follow it" threshold |
| `QA_WEAK` | `0.72` | Playbook "possibly relevant" threshold |
| `KV_PREFIX` | `""` (unset) | Prefix of the playbook KV keys (shards, rows). Only staging sets it (`staging:`, [§19](#19-staging)) |
| `QA_INDEX_KEY` | `qa:index:v1` (unset) | KV key of the OLD one-value playbook index, read until the first full reindex deletes it. Only staging sets it |

Secret: `GEMINI_API_KEY` (`npx wrangler secret put GEMINI_API_KEY`), used by chat
and `/translate`. Bindings: `AI`, `VECTORIZE` (`ptsd-chatbot`, content chunks
only, default namespace), `RL` (KV: rate limits `rl:*`, auth cache `auth:*`,
playbook shards `qa:vec:v2:<lang>` and their build parts
`qa:vec:v2:<lang>:build:*` (TTL 1 hour), playbook rows `qa:row:*`, and until the
first full reindex after the shard deploy the old playbook index `qa:index:v1`).

## 18. Deploy

```bash
cd worker
npx vitest run && npx tsc --noEmit
npx wrangler deploy
# Then a full reindex. From the repo root; the admin JWT comes from ADMIN_TOKEN
# in .env.admin (or the environment).
cd ..
node scripts/reindex-all.mjs
```

### The shard deploy (playbooks as per-language KV shards): steps

Production today has content vectors in the default namespace (ids
`<itemId>:<n>`) and the old one-value playbook index `qa:index:v1` (13 MB).
This deploy keeps the content vectors exactly as they are and moves only the
playbooks:

```bash
cd worker
npx vitest run && npx tsc --noEmit
cd ..
# 1. Optional, for the A/B below: a question list (lines "<lang><TAB><question>").
# 2. Deploy. No shard exists yet, so chat answers from the old index exactly as
#    the old Worker did (same matching code), now with `playbook` in `done`.
cd worker && npx wrangler deploy && cd ..
node scripts/qa-match-compare.mjs questions.txt --out before.json
# 3. Full reindex: shards first (~30 steps), then content, then cleanup.
node scripts/reindex-all.mjs
# 4. Same questions on the shards.
node scripts/qa-match-compare.mjs questions.txt --out after.json --compare before.json
```

Expected differences in step 4: none in group or strength except where the old
index matched a row of a third language (neither the user's nor Hebrew) best,
and scores that move by ~0.001.

| Moment | Content | Playbooks for a user writing language L |
|---|---|---|
| Deployed, run not started | unchanged | old index (`qa:index:v1`) |
| Run in its `qa` phase | unchanged | L's shard and Hebrew's written: shards; else the old index |
| `qa` phase done | upserted in place, same ids | shards |
| cleanup done | the same | shards; `qa:index:v1` deleted |

- **No content migration, no rollback break.** Content ids and namespace do not
  change, so rolling back to the previous Worker works at any time, as long as
  `qa:index:v1` still exists (it goes in the run's last step). After that the
  old Worker answers without playbooks until its own full reindex rebuilds it
  (and that rebuild is the ~400 ms 1102 path again).
- **Chat never sees a half-built shard.** A language's shard is written in ONE
  put by the step that finishes the language; until then chat reads the old
  index for it.
- **Admin edits during the window.** An item reindex only edits a shard that
  exists. Before the run reaches a language, a Q&A edit writes the row value
  only and shows up in chat when the run builds that language (the old index is
  no longer rebuilt on save). Run the reindex right after the deploy.
- **Stopped halfway?** Run the script again from the start.
- **Leftovers of the never-deployed namespaced layout.** The `rework` cleanup
  slice queries the `qa`, `qa-crisis` and `content` namespaces (ids only) and
  deletes what they return (only ids starting `qa:`, `qac:` or `c:`, never a
  default-namespace id), and deletes a `vec:layout` KV key. On production, which
  never had them, that is one step of 1 KV get + 3 queries.

### Why it is stepped, and the cost of a step

Two free-plan limits per invocation: 50 subrequests (fetches, Workers AI calls,
Vectorize calls and KV operations all count) and **10 ms of CPU**. CPU binds
first. Measured in node on the real corpus (`backups/articles-*.json`):

- The binding sends vectors as JSON. Parsing an embedding response plus
  rounding and stringifying the upsert is ~0.1 ms per 1024-dim vector (100
  vectors: 2.9 ms parse, 11 ms stringify at full precision, 6 ms rounded to 5
  decimals, which changes cosine by < 1e-8, so values are rounded).
- Parsing the whole `/articles` list (4.5 MB) is 6-11 ms by itself; one
  language (~700 KB) is 1.2-1.9 ms. Chunking a whole language is 3-4.5 ms.
- A playbook text has no upsert to stringify: its share of the embedding
  response parse plus int8 quantization.

So each step fetches ONE slice (one language of the Q&A rows, one language of
`/articles?langId=`, or the communities) and writes at most `STEP_VECTORS` = 40
content vectors or `QA_STEP_TEXTS` = 100 playbook texts (one embedding call;
whole items and rows only). On the real corpus that is 90 steps
(`worker/test/reindex-batch.test.ts`, which runs when a backup is present; node,
the first step also pays V8's first compile, ~7-16 ms):

| Phase | Steps | Median | Max |
|---|---|---|---|
| `qa` | 29 | 5.0 ms | 8.2-9.2 ms |
| `chunks` | 52 | 6.5 ms | 12.5-13 ms (one `chunks/he` step, ~11.5 ms in every run) |
| `cleanup` | 8 | 4 ms | 5-6 ms |

Node's `Response.json()` adds 3-5 ms per slice that workerd does natively, so
the test parses with `JSON.parse`. The `chunks` peak is one specific step of
Hebrew content (it is there with `STEP_VECTORS` = 30 too); the platform allows
short bursts over 10 ms, but if that step ever fails with 1102, that item's
chunking is what to look at.

| Phase | Slices | Work | Subrequests per step |
|---|---|---|---|
| `qa` | `he`, `ar`, `en`, `ru`, `fr` | Q&A rows into that language's shard, 100 texts per step | 1 fetch, 1 KV list, 1 embed, 1 put per changed row, 1 build part put; the last step of a language reads the parts and writes the shard (1 get per part + 1 put) |
| `chunks` | `he`, `ar`, `en`, `ru`, `fr`, `communities` | Content chunks, 40 per step | 1 fetch (+1 Hebrew Metiv list for refs), 1 embed, 1 upsert |
| `cleanup` | `he`...`fr` | Stale content ids of excluded rows | 1 fetch, 1 delete per 100 ids |
| | `qa` | Row values of Q&A rows that no longer exist | 1 fetch, 1 KV list, 1 delete each |
| | `rework` | Leftovers of the namespaced layout (above) | 1 KV get + 3 queries (+1 delete per namespace that had any) |
| | `legacy` | Delete `qa:index:v1` | 1 |

Subrequests per step: 3-16 of the budget's 40. Only these 5 languages are
fetched; a row in another language is not indexed. Every language gets a shard,
an empty one when it has no rows (a missing shard is what sends chat to the old
index).

- **Build parts.** Each `qa` step writes its rows' int8 vectors to its own KV key
  (`...:build:<buildId>:<n>`, TTL 1 hour), written once and read once, so KV's
  edge cache can never hand back an older version. A part that is missing at
  the end (expired, not visible yet) rebuilds that language under a new build id
  (`qa-build-restart` in the log). Parts expire on their own; no delete is spent.
- **Content chunks are upserted in place** (overwrite by id), so a run that stops
  halfway leaves a usable index.
- **Edits during a run.** The cursor carries a fingerprint of the slice's work
  list (item ids; for Q&A, row ids plus the stamp of each row's texts). If it
  changes (a row added or deleted, or a Q&A question or paraphrase edited), the
  slice starts over on the next step. A content text-only edit does not change
  it; the admin save reindexes that item anyway.

### Free-plan capacity

- **Stored dimensions: 5,000,000**, i.e. ~4,880 vectors of 1024. The pricing
  page gives it per plan, not per index, so read it as per account. Today:
  ~1,935 content chunks = ~40%. Playbooks use none of it (2,350 texts in
  Vectorize would have taken it to ~93%). Watch
  `npx wrangler vectorize info ptsd-chatbot`. A filled staging index counts
  against the same allowance ([§19](#19-staging)): empty it after testing
  (`npx wrangler vectorize delete ptsd-chatbot-staging`, then create it again
  before the next test).
- **Queried dimensions: 30,000,000 / month.** A chat makes 1-2 queries (content,
  plus the guided one when a playbook is used), as before.
- **KV storage**: 5 shards (~2.4 MB) + 175 row values (~1.5 MB); the largest
  value is a shard, far under the 25 MB cap. A language would need ~25,000
  texts to reach it.
- **KV: 1,000 writes / day** (puts and deletes are counted separately, 1,000
  each). A full reindex writes the changed row values (175 on the first run,
  none when nothing changed), ~24 build parts and 5 shards: ~205 puts the first
  time, ~30 after; plus 1 delete (`qa:index:v1`) and 1 per removed row. An admin
  save of a Q&A row is 2 puts (row value + shard), a few more on a retry. Every
  chat writes its rate-limit key; so does each question of
  `qa-match-compare.mjs`.

## 19. Staging

A second Worker, `ptsd-chatbot-worker-staging` (`[env.staging]` in
[`wrangler.toml`](../worker/wrangler.toml)), for trying chat changes from a
local dev server before they ship. The live chatbot is not touched:

| | Production | Staging |
|---|---|---|
| Worker | `ptsd-chatbot-worker` | `ptsd-chatbot-worker-staging` |
| Vectorize index | `ptsd-chatbot` | `ptsd-chatbot-staging` (1024 dims, cosine) |
| KV namespace `RL` | `6167ce06...` | the same namespace |
| Playbook shards and rows | `qa:vec:v2:*`, `qa:row:*` | `staging:qa:vec:v2:*`, `staging:qa:row:*` (`KV_PREFIX`) |
| Old playbook index key | `qa:index:v1` | `qa:index:staging:v1` (`QA_INDEX_KEY`) |
| `SITE_ORIGIN` | the site origins | the same plus `http://localhost:5173` |
| Content | `API_BASE` (live DB) | the same live DB, read only |

Why its own KV keys: KV is shared, and a staging full reindex writes the
playbook shards and rows. On the production keys it would overwrite what the
live chatbot reads, with whatever the staging code builds. Rate-limit keys (`rl:<sessionId>`)
and the admin auth cache (`auth:<hash>`) stay shared, which is harmless: session
ids are random UUIDs and the auth cache only says a token is an admin.

The index must match production's: `@cf/baai/bge-m3` embeddings, 1024
dimensions, cosine. No metadata indexes or namespaces are needed. The admin console reindexes only the production Worker on save, so
staging is current only after a manual full reindex.

One-time setup (from `worker/`):

```bash
npx wrangler vectorize create ptsd-chatbot-staging --dimensions=1024 --metric=cosine
npx wrangler secret put GEMINI_API_KEY --env staging
```

Each time you want to test:

```bash
cd worker
npx vitest run && npx tsc --noEmit
npx wrangler deploy --env staging
# Full reindex of the staging index (and the staging KV keys) from the live
# DB. ADMIN_TOKEN in .env.admin: a token from an admin login on the site (the
# admin keeps it in sessionStorage).
cd ..
node scripts/reindex-all.mjs https://ptsd-chatbot-worker-staging.ptsd-il.workers.dev
```

Then point the local site at it with `src/.env.development.local` (ignored by
git, read only by `npm run dev`, wins over `src/.env`):

```bash
VITE_CHATBOT_URL=https://ptsd-chatbot-worker-staging.ptsd-il.workers.dev
```

and open `http://localhost:5173/metiv-site-demo-v3`. Watch it with
`npx wrangler tail --env staging`. Delete the file (or the line) to go back to
the production Worker. Shipping is unchanged: `npx wrangler deploy` (no
`--env`) and the full reindex against the production URL ([§18](#18-deploy)).
