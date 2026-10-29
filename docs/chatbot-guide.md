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
| `POST` | `/reindex` | `Authorization: Bearer <admin JWT>` | `{ "scope": "all" }` or `{ "scope": "item", "itemId": "..." }` |
| `POST` | `/translate` | `Authorization: Bearer <admin JWT>` (240/hour per token) | Hebrew to ar/en/ru/fr for the admin (section 16) |

Admin auth: the Worker forwards the header to `ADMIN_VERIFY_URL`; a 2xx means
admin. `/translate` caches a success in the `RL` KV namespace under
`auth:<sha256 of the token>` for 300 seconds (the raw token is never stored), so a
revoked token can keep translating for up to 5 minutes.

`/reindex` responses: `scope: "all"` returns `{ ok, upserted, excluded, qa }`
(vectors written, rows skipped by the exclusions below, Q&A rows in the playbook
index). `scope: "item"` returns `{ ok, upserted }`, plus `qa` when the item was
(or used to be) a Q&A row.

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

Excluded rows lose their vectors: an item reindex of an excluded id deletes them,
and a full reindex deletes the chunk ids every excluded row could hold.

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

**Index.** Not in Vectorize. A full reindex, an item reindex of a Q&A row, and an
item reindex of an id that was a Q&A row (deleted or unpublished) rebuild one KV
value, `qa:index:v1` in the `RL` namespace (or the `QA_INDEX_KEY` var, which
staging sets, [§19](#19-staging)): every `question` and `paraphrase` of
every published Q&A row embedded with `@cf/baai/bge-m3` (the retrieval model),
stored as L2-normalized base64 Float32 vectors, plus each row's text. About 5.5KB
per embedded text; the KV value limit is 25MB (roughly 4,000 texts). A chat
request reads it once (in-isolate cache 60s, KV edge cache 60s, so an edit can
take up to ~2 minutes to reach chat).

**At chat time** the query embedding already computed for retrieval is scored
(cosine) against every Q&A vector; each `groupId` keeps its best score. The row
used is the user's language row of the group, else the Hebrew row.

| Best score | Effect |
|------------|--------|
| `>= QA_STRONG` (0.80) | `PLAYBOOK` block before `SOURCES`, system rule: follow its guidance in order, adapt wording, take changeable facts from SOURCES, never contradict it. The bot answers even with zero retrieval hits. |
| `>= QA_WEAK` (0.72) | `POSSIBLY RELEVANT PLAYBOOK` block: use only if it fits. Zero hits still refuses. |
| lower | nothing |

When `detectCrisis` fires, the best `crisis: true` group (any score) is always
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
messages go in the same embedding call. Retrieval (SOURCES) still uses only the
latest message.
If the KV value can't be read, chat carries on without playbooks.

**Tuning.** Every chat writes one Worker log line (not part of the stream):

```
qa-match {"best":{"groupId":"...","score":0.8312},"used":{"groupId":"...","strength":"strong"},"crisis":null}
```

`carried` (`{ groupId, score }`) is added when the previous message's playbook
was used.

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
| `QA_INDEX_KEY` | `qa:index:v1` (unset) | KV key of the playbook index. Only staging sets it ([§19](#19-staging)) |

Secret: `GEMINI_API_KEY` (`npx wrangler secret put GEMINI_API_KEY`), used by chat
and `/translate`. Bindings: `AI`, `VECTORIZE` (`ptsd-chatbot`), `RL` (KV: rate
limits `rl:*`, auth cache `auth:*`, playbook index `qa:index:v1`).

## 18. Deploy

```bash
cd worker
npx vitest run && npx tsc --noEmit
npx wrangler deploy
# Then ONE full reindex, required after this deploy: it indexes every Metiv
# collection (courses, events, papers, team, about, legal...) and the PTSD-IL
# legal rows, rewrites every chunk with its title header, adds categorySlugs /
# key / section to the vectors, drops the vectors of excluded rows, and builds
# the playbook index (chat has no playbooks until it runs).
curl -X POST https://ptsd-chatbot-worker.ptsd-il.workers.dev/reindex \
  -H "Authorization: Bearer $ADMIN_JWT" -H "content-type: application/json" \
  -d '{"scope":"all"}'
```

A full reindex makes about `2 + ceil(chunks / 50) + ceil(vectors / 500) +
ceil(excluded ids / 500) + ceil(QA texts / 50) + 1` subrequests; on the free plan
(50 per invocation) a large corpus can hit that cap. Indexing every Metiv
collection adds roughly 300 chunks per language from the seed (about 1,500 for
5 languages, so about 31 more embedding calls and 3 more upserts per full
reindex).

## 19. Staging

A second Worker, `ptsd-chatbot-worker-staging` (`[env.staging]` in
[`wrangler.toml`](../worker/wrangler.toml)), for trying chat changes from a
local dev server before they ship. The live chatbot is not touched:

| | Production | Staging |
|---|---|---|
| Worker | `ptsd-chatbot-worker` | `ptsd-chatbot-worker-staging` |
| Vectorize index | `ptsd-chatbot` | `ptsd-chatbot-staging` (1024 dims, cosine) |
| KV namespace `RL` | `6167ce06...` | the same namespace |
| Playbook index key | `qa:index:v1` | `qa:index:staging:v1` (`QA_INDEX_KEY`) |
| `SITE_ORIGIN` | the site origins | the same plus `http://localhost:5173` |
| Content | `API_BASE` (live DB) | the same live DB, read only |

Why its own playbook key: KV is shared, and a staging full reindex rebuilds the
playbook index. On the production key it would overwrite what the live chatbot
reads, with whatever the staging code builds. Rate-limit keys (`rl:<sessionId>`)
and the admin auth cache (`auth:<hash>`) stay shared, which is harmless: session
ids are random UUIDs and the auth cache only says a token is an admin.

The index must match production's: `@cf/baai/bge-m3` embeddings, 1024
dimensions, cosine. No metadata indexes are needed: `/chat` queries without a
filter. The admin console reindexes only the production Worker on save, so
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
# Full reindex of the staging index (and the staging playbook key) from the live
# DB. $ADMIN_JWT: a token from an admin login on the site (the admin keeps it in
# sessionStorage).
curl -X POST https://ptsd-chatbot-worker-staging.ptsd-il.workers.dev/reindex \
  -H "Authorization: Bearer $ADMIN_JWT" -H "content-type: application/json" \
  -d '{"scope":"all"}'
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
