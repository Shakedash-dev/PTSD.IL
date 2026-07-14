# Preparing for the Backend

This document is the source of truth for how the site will move from frontend-only static content to a real backend + database. Written for the future backend developer and for the agents/humans wiring up the frontend integration.

> **Scope**: API contract, data model, migration phases. Backend implementation language and hosting are out of scope - this spec is technology-agnostic. Any stack that can serve REST + JWT (Node/Postgres, Django, Rails, Go, Supabase, etc.) can implement it.

---

## 1. Guiding principles

1. **All content in all languages, always.** A piece of content is not "published" until it exists in all 5 supported languages (he, ar, ru, en, fr). No partial publishing.
2. **The frontend never owns content.** Anything a clinician or content reviewer might want to change is in the DB.
3. **The backend is the source of truth.** No content fallback baked into the frontend. If the API is down, the page shows an error, not stale data.
4. **Editor-first admin UI.** The editor is a non-technical PTSD professional, not a developer. Friction-free editing > feature richness.
5. **Auditable.** Every content change creates a version snapshot. Rollback is a single click.
6. **No PII, no analytics.** The site collects nothing about visitors. Anonymous and uncached on the user side.

---

## 2. What goes where

### Stays in code (compiled into the React bundle)

| Item | Location | Why |
|---|---|---|
| UI labels (buttons, nav, form fields) | `src/lib/i18n.js` | High frequency, low churn, sub-100ms render matters |
| Page routes | `src/App.jsx` | Code, not content |
| PCL-5 questionnaire questions | `src/pages/Questionnaire.jsx` | Fixed clinical instrument - editing it would be malpractice |
| Crisis line number (1201) | hardcoded | Too critical to depend on DB availability |
| Calming exercise mechanics (breathing animation, grounding sequence) | `src/pages/Calming*.jsx` | Logic, not text. Text is in DB. |

### Lives in the database

| Entity | Replaces |
|---|---|
| `FAQItem` | `RIGHTS_FAQS` in `src/data/static/rights_faqs.js` (rights tab content) |
| `PTSDInfoFAQ` | `PTSD_INFO_FAQS` in `src/data/static/ptsd_info_faqs.js` (`/ptsd-info`, `/ptsd-info-2`) - see note below |
| `SecondCircleTool` | `SECOND_CIRCLE_TOOLS` in `src/data/static/second_circle_tools.js` (`/second-circle-tools`) - new entity, not in the original plan |
| `CommunityGroup` | `STATIC_COMMUNITIES` in `src/data/static/communities.js` |
| `TreatmentStep` | `STATIC_STEPS` in `src/data/static/treatment_steps.js` |
| `SelfHelpTool` | `STATIC_TOOLS` in `src/data/static/self_help_tools.js` |
| `SourceReference` | `STATIC_SOURCES` in `src/data/static/sources.js` |
| `ChildAgeContent` | `STATIC_CONTENT` in `src/data/static/children.js` - shape is richer than originally speced, see 3.4 |
| `PageBlock` | All `*_welcome`, `*_intro`, `*_subtitle`, hero copy currently in `i18n.js` - **not started**, still 100% in code |
| `SiteSettings` | Future misc config (feature flags, banner messages, etc.) - **not started** |
| `MediaAsset` | Uploaded images/PDFs/audio - **not started** |

> **PTSDInfoFAQ note:** when this doc was first written, PTSD info Q&A was hypothetical ("future"). It now exists as real content, but was built as a fully separate structure (own top-level data key, own `fetchPTSDInfoFaqs`/`usePTSDInfoFaqs`) instead of `FAQItem` with `category='ptsd_info'` as originally planned. The shape is a strict subset of `FAQItem` (just `q`/`a`, no `subcategory`/`steps`/`links`), so it fits cleanly under the existing `faq_items` table. **Recommendation:** unify it under `FAQItem` before backend work starts and collapse the two frontend fetch functions into one - avoids a table and an endpoint that don't earn their keep. Listed separately above only to flag that it currently exists as separate frontend code.

> **SecondCircleTool note:** this is genuinely new, not a renamed/expanded existing entity. Shape is `{ q, intro, sections: [{ heading, body }], closing, callout? }` - nested sections, not a flat title/content pair. Doesn't fit any existing table; schema is in 3.4.

---

## 3. Data model

### 3.1 System fields (every entity)

```sql
id            uuid          PRIMARY KEY
entity_type   text          NOT NULL  -- 'faq_item', 'community_group', ...
created_at    timestamptz   NOT NULL
updated_at    timestamptz   NOT NULL
created_by    uuid          NOT NULL  REFERENCES users(id)
updated_by    uuid          NOT NULL  REFERENCES users(id)
published_at  timestamptz   NULL      -- NULL = draft
sort_order    int           DEFAULT 0
deleted_at    timestamptz   NULL      -- soft delete
```

### 3.2 Translations (normalized)

Every translatable field of every entity lives here. Avoids schema changes when a 6th language is added.

```sql
CREATE TABLE translations (
  entity_type  text NOT NULL,
  entity_id    uuid NOT NULL,
  lang         text NOT NULL CHECK (lang IN ('he','ar','ru','en','fr')),
  field        text NOT NULL,
  value        text NOT NULL,           -- markdown
  PRIMARY KEY (entity_type, entity_id, lang, field)
);

CREATE INDEX ON translations (entity_type, entity_id);
```

Reads are a single JOIN: fetch the entity row, LEFT JOIN translations filtered to the user's lang.

### 3.3 Versioning

```sql
CREATE TABLE content_versions (
  entity_type  text         NOT NULL,
  entity_id    uuid         NOT NULL,
  version_no   int          NOT NULL,
  snapshot     jsonb        NOT NULL,   -- {entity: {...}, translations: [...]}
  change_note  text,
  created_at   timestamptz  NOT NULL,
  created_by   uuid         NOT NULL,
  PRIMARY KEY (entity_type, entity_id, version_no)
);
```

Every write to an entity inserts a new snapshot. Rollback = copy snapshot back into live tables and bump version.

### 3.4 Per-entity tables

Only non-translatable fields live in the entity table. Translatable text lives in `translations`.

```sql
-- FAQItem (also covers PTSDInfoFAQ under category='ptsd_info' - see 2)
CREATE TABLE faq_items (
  -- system fields
  category      text NOT NULL,  -- 'rights' | 'ptsd_info' | ...
  subcategory   text,           -- e.g. 'security_forces' for rights; NULL for ptsd_info
  general_only  boolean NOT NULL DEFAULT false
                                 -- rights only: item belongs to category='general' AND must
                                 -- NOT be appended to other subcategory tabs. Currently a
                                 -- frontend filter in src/api/source.js#fetchRightsFaqs -
                                 -- move the append/filter logic server-side so the frontend
                                 -- just requests a category and gets the right set back.
);
-- translatable fields: question, answer, optional steps (markdown list), optional links
-- links shape (JSON-encoded per language in translations.value, since url is shared but
-- label text is not): [{ label: string, url: string }]

-- SecondCircleTool (new - see 2)
CREATE TABLE second_circle_tools (
  -- system fields only; no non-translatable structured fields today
);
-- translatable fields: question, intro (markdown), sections (jsonb array of
-- { heading, body } - body is markdown), closing, optional callout
-- `sections` is stored as one JSON-encoded translations.value per language, same pattern
-- as FAQItem.links - it's a structured field, not a single string.

-- CommunityGroup
CREATE TABLE community_groups (
  -- system fields
  target_audience  text[] NOT NULL,
  location         text NOT NULL,   -- 'north' | 'center' | ... | 'online'
  meeting_type     text NOT NULL,   -- 'frontal' | 'digital' | 'hybrid'
  contact_url      text NOT NULL,
  organization     text             -- not translated; org names stay native
);
-- translatable fields: name, description
-- NOTE: current static content (src/data/static/communities.js) only has Hebrew -
-- name/description are not yet translated to ar/ru/en/fr. Per principle 1 ("no partial
-- publishing"), these can't go live until translated - see Phase 2.

-- TreatmentStep
CREATE TABLE treatment_steps (
  -- system fields
  step_number  int NOT NULL,
  category     text,           -- currently unused in static content, reserved
  icon         text NOT NULL,  -- lucide icon key, resolved client-side via an icon map
  color        text NOT NULL   -- hex value, e.g. '#3A7B71' - see styling note below
);
-- translatable fields: title, description, how_to_start (markdown), optional links
-- links shape: [{ label: string, url: string }] (same pattern as FAQItem.links)
-- STYLING NOTE: `color` is presentation data living in content today (also true for
-- SelfHelpTool.color/iconBg below). Violates principle 2 ("frontend never owns content" -
-- the inverse holds too: content shouldn't own styling). Recommend resolving color from a
-- `category`-keyed lookup map in code before migration, same pattern already used for
-- `icon` (STEP_ICON_MAP in Treatment.jsx), and dropping color from the DB row.

-- SelfHelpTool
CREATE TABLE self_help_tools (
  -- system fields
  category     text NOT NULL,
  icon         text NOT NULL,   -- lucide icon key
  color        text,            -- Tailwind class string, e.g. 'bg-secondary/10 text-secondary'
  icon_bg      text,            -- Tailwind class string, e.g. 'bg-secondary/15'
  cta_route    text             -- e.g. '/calming/breathing'
);
-- translatable fields: title, content (markdown)
-- STYLING NOTE: color/icon_bg are raw Tailwind utility classes stored per-row today
-- (src/data/static/self_help_tools.js). Same issue as TreatmentStep.color above - move to
-- a category-keyed map in code, don't carry Tailwind classes into the DB.

-- SourceReference
CREATE TABLE source_references (
  -- system fields
  title        text NOT NULL,   -- NOT translated - citation titles stay in original language
  category     text NOT NULL,   -- 'research' | 'legal' | 'clinical' | ...
  url          text,
  year         int,
  authors      text             -- not translated
);
-- translatable fields: description
-- CORRECTION: earlier draft of this doc listed `title` as translatable. Actual content
-- (src/data/static/sources.js) keeps title in its original citation language across all
-- locales - that's the correct call for academic references, doc was wrong, not the content.

-- ChildAgeContent
-- Actual shape (src/data/static/children.js) is richer than a flat title/description/body
-- row: each age range has ONE guidelines blob plus MANY resources. Splitting into two
-- tables to match:
CREATE TABLE child_age_guidance (
  -- system fields
  age_range    text NOT NULL UNIQUE  -- '0-4' | '4-6' | '7-10' | '10-13' | '14-16'
);
-- translatable fields: guidelines (markdown)

CREATE TABLE child_resources (
  -- system fields
  age_range    text NOT NULL,   -- FK-ish to child_age_guidance.age_range
  type         text NOT NULL,   -- 'book' | 'activity' | 'video' | 'story'
  cta_url      text             -- optional, e.g. deep link to a calming exercise
);
-- translatable fields: title, description, optional content (markdown, only when the
-- resource card is expandable), optional cta_label

-- PageBlock
CREATE TABLE page_blocks (
  -- system fields
  page         text NOT NULL,  -- 'home' | 'first_circle' | 'rights' | ...
  slot         text NOT NULL,  -- 'hero_title' | 'hero_subtitle' | 'welcome' | ...
  block_type   text NOT NULL   -- 'heading' | 'paragraph' | 'callout'
);
-- translatable fields: value (markdown)

-- SiteSettings
CREATE TABLE site_settings (
  key          text PRIMARY KEY,
  value        jsonb NOT NULL,
  description  text
);

-- MediaAsset
CREATE TABLE media_assets (
  -- system fields
  filename     text NOT NULL,
  mime_type    text NOT NULL,
  size_bytes   bigint NOT NULL,
  storage_url  text NOT NULL,
  width        int,            -- for images
  height       int             -- for images
);
-- translatable fields: alt_text, caption
```

### 3.5 Page blocks: granular, not blobs

Each piece of page copy is its own row. `page='home', slot='hero_subtitle'` is one row; `page='home', slot='quick_nav_title'` is another. Industry standard (Sanity, Contentful, Strapi all work this way). Editor benefits: reorder via `sort_order`, swap blocks without touching code, future A/B testing on individual sections.

**Implication for the frontend:** components fetch blocks by `page` once, then look up specific slots. One API call per page, not one per block.

---

## 4. API contract

All responses JSON. UTF-8. Errors follow RFC 7807 (`application/problem+json`).

### 4.1 Public endpoints (no auth, CDN-cacheable)

```
GET  /api/v1/faq-items?category=rights&subcategory=security_forces
GET  /api/v1/faq-items?category=ptsd_info
GET  /api/v1/second-circle-tools
GET  /api/v1/communities?audience=security_forces&location=center
GET  /api/v1/treatment-steps
GET  /api/v1/self-help-tools
GET  /api/v1/sources
GET  /api/v1/children/guidance?age_range=4-6
GET  /api/v1/children/resources?age_range=4-6
GET  /api/v1/page-blocks?page=home
GET  /api/v1/site-settings/:key
```

The `/faq-items` category param does double duty as the PTSDInfoFAQ replacement per the unification note in section 2 - `category=ptsd_info` returns the old `/ptsd-info` and `/ptsd-info-2` content, `subcategory` is absent for that category. `/children` was split into two endpoints to match the guidance-vs-resources split in the ChildAgeContent schema (3.4).

**Response shape (example for `/faq-items`):**

```json
{
  "data": [
    {
      "id": "0193...",
      "category": "rights",
      "subcategory": "security_forces",
      "general_only": false,
      "sort_order": 0,
      "translations": {
        "he": { "question": "...", "answer": "...", "steps": null, "links": [] },
        "ar": { "question": "...", "answer": "...", "steps": null, "links": [] },
        "ru": { "question": "...", "answer": "...", "steps": null, "links": [] },
        "en": { "question": "...", "answer": "...", "steps": null, "links": [] },
        "fr": { "question": "...", "answer": "...", "steps": null, "links": [] }
      }
    }
  ]
}
```

`links` here is `[{ label, url }]` per language - `label` is translated, `url` is repeated identically across languages (same pattern applies to TreatmentStep and SecondCircleTool per their schemas in 3.4).

Frontend picks the active language client-side. The full multi-language payload is shipped so language switches don't trigger refetches.

**Public endpoints serve only `published_at IS NOT NULL` rows.**

### 4.2 Admin endpoints (auth required)

```
POST   /api/v1/auth/login              -> JWT + refresh token
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout

# CRUD per entity
GET    /api/v1/admin/{entity}                  -> includes drafts
POST   /api/v1/admin/{entity}                  -> create
GET    /api/v1/admin/{entity}/:id
PUT    /api/v1/admin/{entity}/:id              -> update + new version snapshot
DELETE /api/v1/admin/{entity}/:id              -> soft delete

# Publish gate
POST   /api/v1/admin/{entity}/:id/publish      -> 409 if any required translation missing
POST   /api/v1/admin/{entity}/:id/unpublish

# Versioning
GET    /api/v1/admin/{entity}/:id/versions
GET    /api/v1/admin/{entity}/:id/versions/:n
POST   /api/v1/admin/{entity}/:id/rollback/:n

# Translation helper (server proxies to translation provider)
POST   /api/v1/admin/translate
       body: { from: 'he', to: ['ar','ru','en','fr'], texts: ['...'] }
       returns: { ar: ['...'], ru: ['...'], en: ['...'], fr: ['...'] }

# Media uploads
POST   /api/v1/admin/media               -> multipart, returns MediaAsset
DELETE /api/v1/admin/media/:id
```

### 4.3 Publish validation

The publish endpoint MUST verify, before flipping `published_at`:

1. Every required translatable field has a translation in every supported language.
2. Markdown parses cleanly (no broken syntax).
3. No `<script>` tags or other unsafe HTML after sanitization.
4. If the entity references media, all referenced media assets exist.

Otherwise return 409 with a structured error pointing at the missing fields.

### 4.4 Auth

- JWT in `Authorization: Bearer ...` header.
- Short-lived access token (15 min), long-lived refresh token (7 days, httpOnly cookie).
- One role for now: `admin`. Future: `editor`, `translator`, `reviewer`.
- Rate limiting on `/auth/login` (5 attempts per 15 min per IP).

### 4.5 Caching

- All public GET endpoints: `Cache-Control: public, max-age=60, stale-while-revalidate=300`.
- ETag on every response.
- Admin endpoints: `Cache-Control: no-store`.
- CDN in front (Cloudflare, Fastly, whatever the hosting provides).

---

## 5. Content format

### 5.1 Markdown only - **not what the current content actually is, needs a decision**

The original plan: all translatable rich text fields are markdown, rendered client-side via a sanitizer (`markdown-it` + `DOMPurify`), no raw HTML in the DB.

**This is no longer true of the real content.** `src/data/static/self_help_tools.js`, `ptsd_info_faqs.js`, and `rights_faqs.js` all contain raw HTML strings with hardcoded Tailwind utility classes, e.g.:

```html
<a href="${BASE_PATH}/calming" class="inline-flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-foreground rounded-full text-sm font-medium hover:bg-primary/20 transition-colors duration-300">
  דף הרגעה אינטראקטיבי עם תרגילים מודרכים
</a>
```

Plain markdown cannot express this - `[text](url)` has no way to attach a Tailwind class. This is a real fork, not a typo, and needs an explicit decision before the backend is built:

**Option A - convert content to markdown + a CTA shortcode (recommended).** Rewrite these inline styled links as a small custom syntax the frontend parses into the existing button component, e.g. `::cta[דף הרגעה אינטראקטיבי](/calming)`. Keeps principle 2 intact (content has no styling opinions, the frontend decides how a CTA looks) and keeps the DB clean markdown as originally speced. Costs one editorial pass over the ~10 existing occurrences (`grep -l 'class="' src/data/static/*.js` to find them) before migration.

**Option B - allow a small sanitized HTML allowlist instead of markdown.** DOMPurify with `ALLOWED_TAGS`/`ALLOWED_ATTR` scoped to exactly the classes already in use. Zero content rewrite, but every future editor now needs to hand-write HTML with the right Tailwind classes memorized - directly conflicts with principle 4 ("editor is a non-technical PTSD professional"), and the sanitizer allowlist has to be kept in sync with the design system by hand.

Go with A unless there's a reason the migration effort is a blocker - B is a standing maintenance cost that fights the doc's own principles every time someone touches this.

**Allowed (once resolved to markdown):** headings, bold/italic, lists, links, inline code, blockquotes, simple tables, plus the CTA shortcode above.

**Not allowed:** script tags, iframes, inline event handlers, raw HTML pass-through.

### 5.2 Internal links

Internal links in markdown use a relative path (`/calming/breathing`). The frontend rewrites them to use `BASE_PATH` at render time. Editors never deal with the GitHub Pages base path.

### 5.3 Media references

Images embedded in markdown use the asset URL returned by `POST /api/v1/admin/media`. The CDN serves them.

---

## 6. Translation workflow

**Editor flow:**

1. Editor creates a new entity, fills in Hebrew fields.
2. Clicks "Translate" - admin UI calls `POST /api/v1/admin/translate` with all Hebrew text and target languages.
3. Server proxies to a translation provider (DeepL preferred for quality on European langs; Google Translate as fallback for Arabic).
4. UI shows the machine translations in editable fields per language.
5. Editor (or a human translator) reviews and adjusts each language.
6. Editor clicks "Publish" - server validates all langs present, then publishes.

**Why server-proxy and not client-side translation API call:**
- API key stays server-side.
- Cost control / rate limiting at the server.
- Audit trail of what was translated.

**Translation provider:** Start with DeepL. It supports he/en/ru/fr at high quality. Arabic needs Google Translate or Azure (DeepL doesn't support Arabic at the time of writing - confirm at implementation time).

---

## 7. Frontend integration

### 7.1 New folders

```
src/api/
  client.js              # base fetch wrapper, error normalization, auth header
  hooks/
    useFaqItems.js       # React Query hook - also covers category='ptsd_info', see 2
    useSecondCircleTools.js
    useCommunities.js
    useTreatmentSteps.js
    useSelfHelpTools.js
    useSources.js
    useChildGuidance.js
    useChildResources.js
    usePageBlocks.js
    useSiteSetting.js
  admin/
    auth.js
    crud.js              # generic create/update/delete/publish/rollback
    translate.js
    media.js
```

### 7.2 React Query setup

Already wired up in `src/lib/query-client.js`. Defaults to add:

```js
defaultOptions: {
  queries: {
    staleTime: 60_000,           // 1 minute
    gcTime: 5 * 60_000,          // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false, // not a live dashboard
  }
}
```

### 7.3 Loading + error UX

Build one generic component:

```jsx
<ContentBoundary loading={isLoading} error={error}>
  {/* page content */}
</ContentBoundary>
```

- Loading: skeleton matching the page's content shape (not a generic spinner).
- Error: gentle Hebrew message + retry button. Never expose raw error to the user.
- Empty: per-page empty state (already exists for communities).

### 7.4 PageBlock usage pattern

```jsx
function HomePage() {
  const { blocks } = usePageBlocks('home');
  return (
    <>
      <Hero title={blocks.hero_title} subtitle={blocks.hero_subtitle} />
      <QuickNav title={blocks.quick_nav_title} />
      ...
    </>
  );
}
```

The hook returns a `{slot: rendered_text}` map, already filtered to the active language.

### 7.5 Markdown rendering

One shared component `<Markdown>{value}</Markdown>` used everywhere. Uses `markdown-it` + `DOMPurify`. Strips dangerous HTML, rewrites internal links to use `BASE_PATH`.

---

## 8. Admin UI

The current `/admin` page is a stub. Replace with:

```
/admin                       -> login (if not authed) or dashboard
/admin/faq-items             -> list view with search/filter
/admin/faq-items/new         -> create form
/admin/faq-items/:id         -> edit form (tabs per language)
/admin/communities           -> list view
...etc for each entity
/admin/page-blocks           -> visual editor showing the page structure
/admin/media                 -> media library
```

**Per-entity edit form layout:**

```
┌───────────────────────────────────────────────────┐
│  [Hebrew] [Arabic] [Russian] [English] [French]   │  <- language tabs
├───────────────────────────────────────────────────┤
│  Question                                         │
│  [textarea, markdown]                             │
│                                                   │
│  Answer                                           │
│  [textarea, markdown, with preview]               │
│                                                   │
│  [Auto-translate to other langs] [Save draft]     │
└───────────────────────────────────────────────────┘
[Version history ▼]  [Publish] (disabled until all langs filled)
```

Built with the same Radix + Tailwind primitives in `src/components/ui/`. No new UI library.

---

## 9. Migration phases

### Phase 0 - now (no backend yet)
Keep the current static structure. Get content reviewed and approved by PTSD professionals.

### Phase 1 - backend dev hands over the API
The backend developer implements this spec on whatever stack they pick. Verified by:
- Each endpoint returns the documented shape.
- Publish gate rejects incomplete translations.
- Rollback restores the snapshot correctly.

### Phase 2 - seed script
One-off Node script that walks the current static content (`STATIC_TOOLS`, `STATIC_COMMUNITIES`, `RIGHTS_FAQS`, `PTSD_INFO_FAQS`, `SECOND_CIRCLE_TOOLS`, etc.) and POSTs to the admin API. Idempotent - safe to re-run. Run once with the initial approved content.

**Blocker to resolve before this phase, not during it:** most current static content (communities, treatment steps, self-help tools, children content, second-circle tools) is Hebrew-only. Principle 1 forbids partial publishing, so none of it can go live via the seed script until translated to ar/ru/en/fr. Either get translation done before seeding, or seed as unpublished drafts and translate before flipping `published_at`.

### Phase 3 - wire up React Query hooks
Replace one entity at a time:

1. SelfHelpTools (smallest, lowest risk)
2. SourceReference
3. PTSDInfoFAQ (if unified into FAQItem per section 2, this is really step 8 below)
4. SecondCircleTool
5. CommunityGroup
6. ChildAgeContent (guidance + resources)
7. TreatmentStep
8. FAQItem (rights)
9. PageBlock (touches most pages)

Each migration is a single PR. Static fallback removed only after the API path is verified in production.

### Phase 4 - admin UI
Need to connect the existing admin UI to the DB.
Currently admin UI is just a UI - it isn't connected to the data in terms of write operations.

### Phase 5 - delete static content
Remove `pageContent.js`, `STATIC_*` arrays, and the page-block keys from `i18n.js`. Keep only UI labels and the questionnaire questions in code.

---

## 10. Open questions for the backend dev

These are decisions the implementer needs to make - this doc takes no stance:

1. **Database**: Postgres is the default assumption (JSONB, RLS, mature). If you pick something else, document why.
2. **Image storage**: S3-compatible (R2, B2, MinIO) is standard. Decide based on hosting.
3. **Translation provider**: DeepL + Google Translate fallback for Arabic is the recommendation. Confirm pricing and quotas.
4. **Hosting**: out of scope for this doc but should be in EU/IL region (GDPR + latency).
5. **Backup**: I don't think we need backup.
6. **CDN**: I think Cloudflare will present a cloudflare capcha - if so, we don't really need it and we want te remove as much friction from the users.
7. **Content format (new, was implicit before)**: markdown-only vs. sanitized-HTML-allowlist for rich text - see 5.1. Content already has raw styled HTML in it; this needs to be resolved with an actual content pass, not just a doc edit.
8. **PTSDInfoFAQ unification (new)**: fold into `FAQItem` (`category='ptsd_info'`) or keep as its own table/endpoint - see 2. Recommendation is to unify.

---

## 11. Out of scope (explicitly)

- User accounts for survivors (no auth for end-users).
- Analytics, tracking, telemetry of any kind.
- Chatbot / semantic search over content.
- Payments / Stripe (the dep is in package.json but no flow uses it).
- Push notifications, email.
- A mobile app (separate project, but should be able to use the same API).
