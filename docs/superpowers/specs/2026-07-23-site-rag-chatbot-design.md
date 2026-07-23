# PTSD.IL - Grounded RAG Chatbot - Design Spec

- **Date:** 2026-07-23
- **Status:** Draft (awaiting review)
- **Repo:** `PTSD.IL` (React 18 SPA, Vite, deployed as a Render static site)
- **Backend (existing, external):** NestJS headless API at `https://ptsd-il-api.onrender.com/api`

## 1. Goal

Add a kind, helpful chatbot to the site that answers **only** from the site's own vetted
content, cites its sources, is available and warm 24/7 (no container spin-up), stays cheap
at low-to-medium volume, and handles user distress safely.

Correctness ("true to source") is enforced by **retrieval grounding + citations**, not by
hoping the model behaves.

## 2. Non-goals (YAGNI)

- No general-purpose chat / off-topic conversation. Grounded answers only.
- No clinical or medical advice. The bot informs and refers; it never diagnoses or treats.
- No persistent chat history across reloads, no per-user accounts for the bot (anonymous).
- No conversation logging / analytics storage (privacy - see §12).
- No fine-tuning. Retrieval + prompting only.
- No new per-article routes in the SPA (see §8, citation drawer instead).

## 3. Architecture overview

The entire user-facing request path is warm 24/7. Nothing is container-based; the Render
API is touched **only during offline ingestion**, never on a user request.

```
                          USER (browser, React widget)
                                     |  POST /chat (SSE stream)
                                     v
        +--------------------------------------------------------------+
        |            Cloudflare Worker  (edge, ~5ms warm)              |
        |                                                              |
        |  /chat (public, rate-limited)                                |
        |    1. crisis check (deterministic, per-language)             |
        |    2. embed question   -> Workers AI  (bge-m3)               |
        |    3. retrieve top-k    -> Vectorize  (native vector DB)     |
        |    4. generate (stream) -> Gemini Flash (hosted)             |
        |                                                              |
        |  /reindex (admin-JWT gated)                                  |
        |    pull -> chunk -> embed -> upsert into Vectorize           |
        +--------------------------------------------------------------+
                 |  (ingestion only)                 ^
                 v                                   |  admin JWT (Bearer)
   NestJS API /articles, /communities        Admin SPA (adminSource.js hook)
   (Render free tier; cold starts OK here)
```

All of Worker, Vectorize, and Workers AI are Cloudflare-native and always-on. Gemini Flash
is a hosted endpoint (no cold start). The cold-starting Render API is never on the hot path.

## 4. Components

### 4.1 Cloudflare Worker
Single Worker, two routes:
- `POST /chat` - public, per-session rate-limited. Orchestrates crisis check + retrieval +
  generation, returns an SSE stream.
- `POST /reindex` - admin-only (see §11). Runs ingestion.

Bindings: Vectorize index, Workers AI, `GEMINI_API_KEY` secret, rate-limit binding (or KV),
and the ingestion source config (API base URL).

### 4.2 Vectorize index
- Dimensions: match bge-m3 (**1024**). Metric: cosine.
- One vector per **chunk**. Metadata per vector: `itemId`, `groupId`, `type`, `langId`,
  `title`, `sectionRoute` (see §8), `chunkIndex`, and the raw chunk text.

### 4.3 Embeddings - Workers AI `bge-m3`
- Multilingual (incl. Hebrew/Arabic/Russian/French), runs on Cloudflare, no external key.
- **Same model for ingestion and queries** (non-negotiable - mismatched embedders break
  retrieval). Swappable to Gemini embedding later behind a one-line change if Hebrew recall
  disappoints in eval (§18).

### 4.4 Generation - Gemini Flash
- Streamed. Cheap, large context, strong multilingual incl. Hebrew.
- No native citation API (unlike Claude); citations are produced by our own retrieval
  metadata + a prompt instruction (§8), so "true to source" does not depend on the model
  self-citing correctly - we map cited chunk numbers to known sources.
- Exact model id + current pricing confirmed at implementation time (§18).

### 4.5 Ingestion pipeline (inside `/reindex`)
- Pull published items from the same endpoints the SPA uses: `/articles` (all types) and
  `/communities`. Enumerate across available languages (he full corpus; ar/en FAQs).
- For each item: `JSON.parse(content)`, walk the per-type content schema (per
  `docs/mobile-data-guide.md` §4), extract Markdown/plain-text leaf fields, concatenate
  with the `title`.
- Chunk each item (target ~300-500 tokens, small overlap). Attach metadata (§4.2).
- Embed with bge-m3, upsert into Vectorize keyed by `${itemId}:${chunkIndex}`.
- Incremental: reindex a single item on content change; full reindex via a manual button.
- Deletion: when an item is unpublished/deleted, remove its chunk vectors.

### 4.6 Crisis / safety layer
Deterministic, model-independent (§10).

### 4.7 Frontend widget
React, in the existing SPA (§13). In-memory conversation state, global FAB, home input box,
streaming render, superscript citations, source drawer.

## 5. Data flow - query (`/chat`)

1. Widget POSTs `{ messages, lang, sessionId }`.
2. Worker enforces per-session rate limit (§11). Over limit -> `429`.
3. **Crisis check** on the latest user message (§10). If triggered, emit a `crisis` SSE
   frame first (widget shows the ERAN banner), then continue with a supportive grounded
   answer.
4. Embed the (rewritten, if needed) query with bge-m3.
5. Query Vectorize for top-k chunks (k ~6-8), optionally filtered by relevance threshold.
6. If nothing relevant is retrieved -> return a gentle "I can only help with topics covered
   on this site" refusal (no hallucinated answer).
7. Build the prompt (§8) with numbered chunks. Call Gemini Flash streaming.
8. Stream `token` frames as text arrives; when done, emit a `sources` frame (chunk-number ->
   source metadata) and `done`.

## 6. Data flow - reindex (`/reindex`)

1. Admin SPA calls `/reindex` with the admin's Google JWT (Bearer) after a successful
   create/update/delete, or via a manual "Reindex all" button.
2. Worker validates the JWT (§11). Invalid/insufficient -> `401`/`403`.
3. Worker pulls the changed item(s) (or all) from the NestJS API, chunks, embeds, upserts,
   and removes stale/deleted vectors.

## 7. Content & chunking model

- Source of truth: `articles` (one row = one item in one language) + `communities`.
- `content` is a JSON **string** (`JSON.parse` required) whose rich leaves are **Markdown,
  never HTML**. Per-type schemas are in `docs/mobile-data-guide.md` §4.
- Translations share a `groupId`; `langId` is the language. Coverage: `he` complete;
  `ar`/`en` FAQs only; `ru`/`fr` empty (fall back to `he`).
- We index every published item in every language that exists. Missing-language answers are
  produced by retrieving Hebrew chunks and translating at generation time (§9).

## 8. Retrieval, generation, citations

**Prompt structure** (Gemini follows structured input well):
- System: persona (warm, non-clinical, everyday language), grounding rules ("answer only
  from the provided sources; if they don't cover it, say so"), no-medical-advice rule,
  citation instruction, output language = user's language.
- Context: retrieved chunks, each numbered `[1]..[k]` with its `title`.
- User: the conversation.

**Citations:** the model is instructed to append the supporting chunk number(s) as `[[n]]`
after each sentence that uses a source. Because the Worker owns the chunk-number -> source
mapping, citations are trustworthy regardless of the model's self-citation accuracy: any
`[[n]]` the widget can't map is dropped. The `sources` SSE frame carries, per cited `n`:
`{ n, itemId, groupId, type, langId, title, sectionRoute }`.

**Citation target - DECISION (discovered during spec):** the SPA has **no per-article
route** - routes are section-level (`/rights`, `/sources`, `/treatment`, `/community`,
`/self-help`, `/calming`, `/ptsd-info`, ...). Therefore a citation cannot deep-link to an
individual item's page because none exists. Resolution: **clicking a superscript number
opens an in-app source drawer/panel** that renders that item's title + content (already in
hand from retrieval, or fetched by `itemId`) plus a link to its section page. This keeps the
chat alive (no navigation), works uniformly for all content types, and needs no new routes
or section-page anchor support. (Alternatives considered: map to the section page - too
coarse; section page + `#id` anchor - requires every page to support highlight-by-id.)
**Flag for user review** (§18).

## 9. Languages

- 5 languages: `he`, `ar`, `en`, `ru`, `fr`. UI already supports RTL (`he`/`ar`).
- The bot answers in the **user's current language**. When source content exists only in
  Hebrew (the common case), it retrieves Hebrew chunks and Gemini translates into the user's
  language at generation time. Accepted tradeoff: answers in non-Hebrew languages are one
  machine-translation hop from the vetted Hebrew text.
- Crisis banner and disclaimer use the existing per-language i18n strings (§10, §12).

## 10. Safety & crisis handling

- **Deterministic crisis layer.** A per-language keyword/regex check runs on the incoming
  message before/independently of the model. On a hit, the Worker emits a `crisis` SSE frame
  and the widget pins a banner built from existing i18n keys:
  `eran_link` + `eran_phone` (`1201`) - already localized for all 5 languages in
  `src/lib/i18n.js`. The model is *also* instructed to surface ERAN when it detects distress
  (belt and suspenders), but the banner does not depend on the model.
- **No medical advice.** System prompt forbids diagnosis/treatment/clinical instructions;
  the bot informs and refers to the site's resources and professionals.
- **Grounded refusal.** If retrieval finds nothing relevant, the bot says it can only help
  with site topics rather than inventing an answer.
- The exact keyword lists per language will be drafted with care (self-harm, suicide,
  acute-danger phrasing) and reviewed; false positives fail safe (showing ERAN is low-harm).

## 11. Security

- Two routes, two policies.
- `POST /chat` - **public**, per-**session** rate limited. `sessionId` is a client-generated
  UUID held in memory and regenerated on reload, so a reload resets the limit (explicitly
  acceptable per requirements). Implemented via Cloudflare's rate-limit binding or KV with a
  short TTL, keyed on `sessionId` (optionally IP as a secondary signal). CORS restricted to
  the site origin.
- `POST /reindex` - **admin only**. Requires the admin's existing Google-issued JWT as
  `Authorization: Bearer` (the same token the admin UI already sends to `/api/admin/*`).
  **No secret is baked into the public SPA bundle** (that would leak). The Worker validates
  the token before doing anything:
  - Preferred: verify the JWT signature locally with the backend's key and check the role
    claim (`masteradmin`/`admin`).
  - Fallback: forward the token to an authenticated `/api/admin/*` endpoint; `200` proves a
    valid admin, otherwise `401`.
  - The exact mechanism is confirmed at implementation (§18). If neither is feasible, the
    fallback is a backend-issued webhook (out of current scope).
- Defense in depth: `/reindex` only re-reads the site's own public API and rewrites the
  vector store - it cannot inject arbitrary content. Worst case of a bypass is cost/abuse,
  closed by the auth gate + rate limiting.
- Secrets (`GEMINI_API_KEY`, any JWT key) live as Worker secrets, never in the SPA.

## 12. Privacy & logging

- **Store nothing.** No conversation content, questions, or answers are persisted. Requests
  are processed in-memory and discarded. (Operational error logs must not contain message
  bodies.)
- A **very small, low-visibility disclaimer** in the widget: "not medical advice", per §2.
  Reuse/adapt the existing `footer_disclaimer` i18n strings.

## 13. Frontend / UI

- **Conversation state:** a React context provider mounted at app root holds
  `messages` in memory. It survives route changes (SPA navigation) and is cleared on full
  reload. No `localStorage`.
- **Global FAB:** wire up the existing placeholder `src/components/ChatbotFAB.jsx` (already
  mounted globally via `src/components/Layout.jsx`) to open the chat panel.
- **Home input box:** on `src/pages/Home.jsx`, replace the `hero_subtitle` line
  (`Home.jsx:86`, `{t(lang, 'hero_subtitle')}`) with a prominent chat input. Keep the
  `hero_tagline` H1 above it. Submitting opens the chat panel seeded with that first message.
- **Streaming render:** tokens appended live; `[[n]]` markers rendered as clickable
  **superscript numbers** (exponent-style), no bottom "Sources" list. Click -> source drawer
  (§8).
- **Starter suggestions:** a small set of example prompts shown when the panel opens.
- **Crisis banner:** pinned ERAN banner rendered on a `crisis` frame.
- RTL respected (existing `he`/`ar` support).

## 14. Worker interface contracts

`POST /chat`
```
Request:  { messages: [{ role: "user"|"assistant", content: string }],
            lang: "he"|"ar"|"en"|"ru"|"fr", sessionId: string }
Response: text/event-stream
  event: crisis   data: { lang }                       (optional, first if triggered)
  event: token    data: { text }                       (repeated)
  event: sources  data: [{ n, itemId, groupId, type, langId, title, sectionRoute }]
  event: done     data: {}
  event: error    data: { message }
```

`POST /reindex`
```
Headers:  Authorization: Bearer <admin JWT>
Request:  { scope: "item", itemId: string } | { scope: "all" }
Response: { ok: true, upserted: number, deleted: number } | 401 | 403
```

## 15. Ops & cost

- Deploy: `wrangler` (Cloudflare). Worker + Vectorize index + Workers AI + a Gemini key.
- Cost at this volume: Workers free tier or $5/mo; Vectorize + Workers AI + Gemini Flash a
  few dollars/month, scaling with usage, not a flat SaaS fee. Only real variable cost is
  Gemini tokens per chat (fractions of a cent).
- Config: Worker secrets for keys; site origin for CORS; API base URL for ingestion.

## 16. Testing strategy

- **Unit:** content JSON -> Markdown extraction per type; chunking; crisis keyword matcher
  (per language, incl. false-positive/negative cases); `[[n]]` -> source mapping.
- **Integration:** end-to-end `/chat` stream (crisis -> token -> sources -> done); `/reindex`
  auth (valid admin, missing token, wrong role -> 401/403); rate-limit behavior.
- **Retrieval eval:** a fixed set of representative questions (Hebrew + at least one other
  language) -> assert the right source items are retrieved and cited; check grounding (no
  claims outside retrieved chunks); spot-check Hebrew answer quality.
- **Safety tests:** distress phrasings in each language must trigger the ERAN banner
  deterministically; medical-advice prompts must be deflected.

## 17. Rollout / phasing

1. **MVP:** Vectorize index + ingestion of the Hebrew corpus (manual reindex), `/chat` with
   grounding + `[[n]]` citations + source drawer, deterministic crisis layer, wired FAB.
2. Home input box replacing `hero_subtitle`; starter suggestions; tiny disclaimer.
3. Admin-JWT-gated `/reindex` + admin-side hook on content change + "Reindex all" button.
4. Multilingual polish (ar/en/ru/fr answers via translate-from-Hebrew), RTL checks.

## 18. Open decisions / dependencies to confirm at implementation

- **Citation target = source drawer** (§8) - recommended default, needs user sign-off since
  it differs from the earlier "navigate to source page" assumption (no such page exists).
- **`/reindex` auth mechanism** (§11): confirm we can either verify the JWT locally (need the
  key/alg) or verify by forwarding to an authenticated `/api/admin/*` endpoint.
- **Embedding model**: start bge-m3; hold Gemini embedding as fallback if Hebrew recall is
  weak in eval.
- **Ingestion enumeration**: confirm how `/articles` paginates and how to list all published
  items across languages (types + categorySlugs mirror `src/api/source.js`).
- **Gemini**: confirm exact Flash model id + current pricing.
- **Vectorize dimension**: fix to bge-m3's output dimension (1024) at index creation.
