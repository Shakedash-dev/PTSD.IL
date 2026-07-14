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
| `FAQItem` | `RIGHTS_FAQS` in `pageContent.js`, future PTSD info Q&A |
| `CommunityGroup` | `STATIC_COMMUNITIES` in `Community.jsx` |
| `TreatmentStep` | Hardcoded treatment steps in `Treatment.jsx` |
| `SelfHelpTool` | `STATIC_TOOLS` in `SelfHelp.jsx` |
| `SourceReference` | `SOURCES` in `Sources.jsx` |
| `ChildAgeContent` | Hardcoded children content in `Children.jsx` |
| `PageBlock` | All `*_welcome`, `*_intro`, `*_subtitle`, hero copy currently in `i18n.js` |
| `SiteSettings` | Future misc config (feature flags, banner messages, etc.) |
| `MediaAsset` | Uploaded images/PDFs/audio |

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
-- FAQItem
CREATE TABLE faq_items (
  -- system fields
  category     text NOT NULL,  -- 'rights' | 'ptsd_info' | ...
  subcategory  text            -- e.g. 'security_forces' for rights
);
-- translatable fields: question, answer, optional steps, optional links

-- CommunityGroup
CREATE TABLE community_groups (
  -- system fields
  target_audience  text[] NOT NULL,
  location         text NOT NULL,   -- 'north' | 'center' | ...
  meeting_type     text NOT NULL,   -- 'frontal' | 'digital' | 'hybrid'
  contact_url      text NOT NULL,
  organization     text             -- not translated; org names stay native
);
-- translatable fields: name, description

-- TreatmentStep
CREATE TABLE treatment_steps (
  -- system fields
  category     text NOT NULL,  -- 'self_start' | 'professional' | ...
  icon         text NOT NULL   -- lucide icon name
);
-- translatable fields: title, description, steps (markdown list)

-- SelfHelpTool
CREATE TABLE self_help_tools (
  -- system fields
  category     text NOT NULL,
  icon         text NOT NULL,
  cta_route    text             -- e.g. '/calming/breathing'
);
-- translatable fields: title, content (markdown)

-- SourceReference
CREATE TABLE source_references (
  -- system fields
  url          text,
  year         int,
  authors      text             -- not translated
);
-- translatable fields: title, description

-- ChildAgeContent
CREATE TABLE child_age_contents (
  -- system fields
  age_range    text NOT NULL,  -- '4-6' | '7-10' | '10-13' | '14-16'
  content_type text NOT NULL   -- 'book' | 'activity' | 'video' | 'story'
);
-- translatable fields: title, description, body

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
GET  /api/v1/communities?audience=security_forces&location=center
GET  /api/v1/treatment-steps
GET  /api/v1/self-help-tools
GET  /api/v1/sources
GET  /api/v1/children?age_range=4-6
GET  /api/v1/page-blocks?page=home
GET  /api/v1/site-settings/:key
```

**Response shape (example for `/faq-items`):**

```json
{
  "data": [
    {
      "id": "0193...",
      "category": "rights",
      "subcategory": "security_forces",
      "sort_order": 0,
      "translations": {
        "he": { "question": "...", "answer": "..." },
        "ar": { "question": "...", "answer": "..." },
        "ru": { "question": "...", "answer": "..." },
        "en": { "question": "...", "answer": "..." },
        "fr": { "question": "...", "answer": "..." }
      }
    }
  ]
}
```

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

### 5.1 Markdown only

All translatable rich text fields are markdown. Rendered client-side via a sanitizer (e.g., `markdown-it` + `DOMPurify`). No raw HTML in the DB.

**Allowed:** headings, bold/italic, lists, links, inline code, blockquotes, simple tables.

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
    useFaqItems.js       # React Query hook
    useCommunities.js
    useTreatmentSteps.js
    useSelfHelpTools.js
    useSources.js
    useChildContent.js
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
One-off Node script that walks the current static content (`STATIC_TOOLS`, `STATIC_COMMUNITIES`, `RIGHTS_FAQS`, etc.) and POSTs to the admin API. Idempotent - safe to re-run. Run once with the initial approved content.

### Phase 3 - wire up React Query hooks
Replace one entity at a time:

1. SelfHelpTools (smallest, lowest risk)
2. SourceReference
3. CommunityGroup
4. ChildAgeContent
5. TreatmentStep
6. FAQItem (rights)
7. PageBlock (touches most pages)

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

---

## 11. Out of scope (explicitly)

- User accounts for survivors (no auth for end-users).
- Analytics, tracking, telemetry of any kind.
- Chatbot / semantic search over content.
- Payments / Stripe (the dep is in package.json but no flow uses it).
- Push notifications, email.
- A mobile app (separate project, but should be able to use the same API).
