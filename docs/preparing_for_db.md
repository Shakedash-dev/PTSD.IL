# Frontend Data Contract

This document specifies what data the frontend needs from the backend and the shape it needs it in - nothing else. It is **not** a backend implementation guide. Schema design, auth mechanics, security hardening, rate limiting, hosting, and infra choices are the backend developer's call to make. Where a frontend requirement is stated below, it's because the frontend genuinely can't function without it (e.g. "one response must carry all 5 languages" is a UI performance requirement, not a design suggestion) - not because it's telling the backend dev how to build their system.

---

## 1. Content boundary

### Stays in code (compiled into the React bundle, never fetched)

| Item | Location | Why |
|---|---|---|
| UI labels (buttons, nav, form fields) | `src/lib/i18n.js` | High frequency, low churn, sub-100ms render matters |
| Page routes | `src/App.jsx` | Code, not content |
| PCL-5 questionnaire questions | `src/pages/Questionnaire.jsx` | Fixed clinical instrument - editing it would be malpractice |
| Crisis line number (1201) | hardcoded | Too critical to depend on API availability |
| Calming exercise mechanics (breathing animation, grounding sequence) | `src/pages/Calming*.jsx` | Logic, not text. Text is in the DB. |

### Comes from the API

| Entity | Replaces (current static file) |
|---|---|
| `FAQItem` | `RIGHTS_FAQS` in `src/data/static/rights_faqs.js` (rights tab content) |
| `PTSDInfoFAQ` | `PTSD_INFO_FAQS` in `src/data/static/ptsd_info_faqs.js` (`/ptsd-info`, `/ptsd-info-2`) |
| `SecondCircleTool` | `SECOND_CIRCLE_TOOLS` in `src/data/static/second_circle_tools.js` (`/second-circle-tools`) |
| `CommunityGroup` | `STATIC_COMMUNITIES` in `src/data/static/communities.js` |
| `TreatmentStep` | `STATIC_STEPS` in `src/data/static/treatment_steps.js` |
| `SelfHelpTool` | `STATIC_TOOLS` in `src/data/static/self_help_tools.js` |
| `SourceReference` | `STATIC_SOURCES` in `src/data/static/sources.js` |
| `ChildAgeContent` | `STATIC_CONTENT` in `src/data/static/children.js` |
| `PageBlock` | All `*_welcome`, `*_intro`, `*_subtitle`, hero copy currently in `i18n.js` - **not started**, still 100% in code |
| `SiteSettings` | Future misc config (feature flags, banner messages, etc.) - **not started** |
| `MediaAsset` | Uploaded images/PDFs/audio - **not started** |

> **PTSDInfoFAQ:** currently built as a separate frontend structure (`fetchPTSDInfoFaqs`/`usePTSDInfoFaqs`). Its shape is a strict subset of `FAQItem` (just question/answer, no subcategory/steps/links) - the frontend is fine either consuming it as `faq-items?category=ptsd_info` (one hook, one endpoint) or as its own endpoint. Pick whichever the backend finds simpler; the frontend hook layer absorbs the difference either way.

> **SecondCircleTool:** genuinely new shape, not a variant of anything else - `{ question, intro, sections: [{ heading, body }], closing, callout? }`. Nested sections, not a flat title/content pair.

---

## 2. Entity field shapes the frontend renders

This is the field list each entity's UI needs - not a database schema. Fields marked *(translated)* must come back per-language (see section 3); everything else is a single value shared across languages.

**FAQItem** (also covers PTSDInfoFAQ, see note above)
`category`, `subcategory` (nullable), `general_only` (bool - rights only, see below) · *(translated)*: `question`, `answer`, `steps` (optional, markdown list), `links` (optional, `[{ label, url }]` - `label` translated, `url` shared)

`general_only` note: on the rights page, an item tagged `general_only` must appear **only** under the "general" tab, never appended to other subcategory tabs (e.g. the National Insurance general-disability FAQ shouldn't show under "security_forces"). Today `src/api/source.js#fetchRightsFaqs` does this filtering in the frontend by pulling `category=general` and stripping flagged items before appending them elsewhere. The frontend is fine either continuing to do this client-side, or having the API do it - whichever the backend prefers, as long as requesting a `subcategory` doesn't return `general_only` items mixed in.

**SecondCircleTool**
No non-translated fields · *(translated)*: `question`, `intro` (markdown), `sections` (array of `{ heading, body }`, body is markdown), `closing`, `callout` (optional)

**CommunityGroup**
`target_audience` (string array), `location`, `meeting_type`, `contact_url`, `organization` (not translated - org names stay native) · *(translated)*: `name`, `description`

**TreatmentStep**
`step_number`, `icon` (a key the frontend resolves to a Lucide component via a lookup map, e.g. `STEP_ICON_MAP` in `Treatment.jsx`) · *(translated)*: `title`, `description`, `how_to_start` (markdown), `links` (optional, `[{ label, url }]`)

Note: the current static data also carries a `color` hex value per step. That's presentation, not content - the frontend already resolves `icon` from a code-side map, and `color` should move to the same kind of map (keyed by `category` or `step_number`) instead of coming from the API. Don't build an API field for it.

**SelfHelpTool**
`category`, `icon` (lookup-map key, same pattern as TreatmentStep) · *(translated)*: `title`, `content` (markdown), `cta_route` (optional, e.g. `/calming/breathing`)

Same note as TreatmentStep: current static data has `color`/`iconBg` Tailwind class strings per row. Frontend should resolve these from a category-keyed map in code, not read them from the API.

**SourceReference**
`title` (**not translated** - citation titles stay in their original language), `category`, `url` (optional), `year` (optional), `authors` (not translated) · *(translated)*: `description`

**ChildAgeContent**
Two related shapes per age range (`'0-4' | '4-6' | '7-10' | '10-13' | '14-16'`):
- Guidance: one per age range · *(translated)*: `guidelines` (markdown)
- Resources: many per age range, each has `age_range`, `type` (`'book' | 'activity' | 'video' | 'story'`), `cta_url` (optional) · *(translated)*: `title`, `description`, `content` (optional markdown, only when the card expands), `cta_label` (optional)

**PageBlock** *(not started)*
`page`, `slot` · *(translated)*: `value` (markdown). One row per piece of copy (`page='home', slot='hero_subtitle'` is its own row) - the frontend fetches all blocks for a page in one call and looks up slots by key, not one call per block.

**SiteSettings** / **MediaAsset** *(not started, no frontend consumer yet)*

---

## 3. What the API response needs to look like

The frontend has two hard requirements on shape, regardless of how the backend is built:

1. **One response carries all 5 languages** (`he`, `ar`, `ru`, `en`, `fr`). The frontend picks the active language client-side so switching languages doesn't trigger a refetch. Example for an FAQItem:

```json
{
  "id": "0193...",
  "category": "rights",
  "subcategory": "security_forces",
  "general_only": false,
  "translations": {
    "he": { "question": "...", "answer": "...", "steps": null, "links": [] },
    "ar": { "question": "...", "answer": "...", "steps": null, "links": [] },
    "ru": { "question": "...", "answer": "...", "steps": null, "links": [] },
    "en": { "question": "...", "answer": "...", "steps": null, "links": [] },
    "fr": { "question": "...", "answer": "...", "steps": null, "links": [] }
  }
}
```

2. **Public reads only return published content.** The frontend never wants to see drafts on the public site and doesn't filter for this itself - if a piece of content isn't ready in all 5 languages, it shouldn't be in the response at all.

Beyond that, the frontend just needs: a list endpoint per entity (optionally filterable, e.g. FAQItem by category/subcategory), each returning `{ data: [...] }`. Auth mechanics, endpoint URLs, HTTP semantics, and everything else about how the API is built is the backend's call - the frontend adapts to whatever's handed to it, that's the entire point of the `src/api/source.js` boundary (see section 4).

**Admin UI needs**, beyond the public reads above:
- Login and a way to send credentials on subsequent requests (mechanics are the backend's call - the frontend will send whatever header/token it's told to).
- Create/update/delete per entity, including drafts.
- A publish action that can fail with enough detail to tell the editor which language/field is missing.
- A translate action: send Hebrew text + target languages, get machine translations back to show in editable fields per language. Provider, cost control, and API key handling are backend concerns.
- Version history + rollback per entity, for the "one-click rollback" requirement - the frontend just needs a list-versions call and a rollback call, however the backend implements the underlying storage.

---

## 4. Content format: what the frontend renders

Rich text fields are markdown by default, rendered client-side. **This doesn't match some of the current content yet**: `self_help_tools.js`, `ptsd_info_faqs.js`, and `rights_faqs.js` contain raw HTML with hardcoded Tailwind classes for styled CTA links, e.g.:

```html
<a href="${BASE_PATH}/calming" class="inline-flex items-center gap-1.5 px-4 py-2 bg-primary/10 ...">
  דף הרגעה אינטראקטיבי עם תרגילים מודרכים
</a>
```

Plain markdown can't express a styled button. Before this content moves into the DB, either:
- **(recommended)** rewrite these as a small CTA shortcode the frontend parses into its existing button component, e.g. `::cta[label](/calming)` - keeps the DB content style-free and keeps the frontend's markdown renderer simple, or
- render this specific handful of fields as raw HTML instead of markdown.

Either way, `markdown-it` isn't in `package.json` yet - it needs to be added along with whatever renderer/parser choice comes out of the above, before any entity migration lands.

Since only trusted admins write content, sanitizing against XSS on render (e.g. DOMPurify) isn't a hard blocker for launch - but if the CTA shortcode route is picked, whatever parses it should still fail closed on unrecognized syntax rather than passing it through as raw HTML.

Internal links in content use a relative path (`/calming/breathing`); the frontend rewrites these to include `BASE_PATH` at render time so editors never need to think about the site's base path.

---

## 5. Frontend integration

### 5.1 New folders

```
src/api/
  client.js              # base fetch wrapper, error normalization, auth header
  hooks/
    useFaqItems.js       # React Query hook - also covers category='ptsd_info', see 1
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

`src/api/source.js` is the only file that knows where data physically lives - each `fetchX` function there swaps from returning static-import data to an HTTP call, with the same signature, so nothing above it (`hooks.js`, pages) changes.

### 5.2 React Query setup

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

### 5.3 Loading + error UX

Build one generic component:

```jsx
<ContentBoundary loading={isLoading} error={error}>
  {/* page content */}
</ContentBoundary>
```

- Loading: skeleton matching the page's content shape (not a generic spinner).
- Error: gentle Hebrew message + retry button. Never expose raw error to the user. No stale-content fallback - if the API is down, show the error state, don't silently serve cached/stale data.
- Empty: per-page empty state (already exists for communities).

### 5.4 PageBlock usage pattern

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

### 5.5 Markdown rendering

One shared component `<Markdown>{value}</Markdown>` used everywhere, per section 4's content-format decision.

---

## 6. Admin UI

The current `/admin` page is a stub - it has no write operations wired up yet. Target structure:

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

Built with the same Radix + Tailwind primitives in `src/components/ui/`. No new UI library. The editor is a non-technical PTSD professional, not a developer - friction-free editing matters more than feature richness here.

The single `admin` role is intentional for launch. If an `editor` role (can save drafts, can't publish) gets added later, it only changes what the login response says the UI is allowed to show/do - no frontend restructuring needed, the forms and endpoints stay the same.

---

## 7. Migration phases (frontend-facing)

### Now
Current static structure stays as-is. Content still needs review/approval by PTSD professionals before it's seed-worthy.

### Once the API exists
Existing static content (`STATIC_TOOLS`, `STATIC_COMMUNITIES`, `RIGHTS_FAQS`, `PTSD_INFO_FAQS`, `SECOND_CIRCLE_TOOLS`, etc.) needs to be in the DB before the frontend can drop its static fallback for that entity. Most of today's static content is Hebrew-only (communities, treatment steps, self-help tools, children content, second-circle tools) - per the "no partial publishing" rule in section 3, none of it can go live until translated to ar/ru/en/fr.

### Wire up React Query hooks, one entity at a time
1. SelfHelpTools (smallest, lowest risk)
2. SourceReference
3. SecondCircleTool
4. CommunityGroup
5. ChildAgeContent (guidance + resources)
6. TreatmentStep
7. FAQItem (rights + ptsd_info)
8. PageBlock (touches most pages)

Each migration is a single PR. Static fallback removed only after the API path is verified in production.

### Admin UI
Wire the existing stub admin UI to real write operations, entity by entity, same order as above.

### Delete static content
Remove `STATIC_*` arrays and the page-block keys from `i18n.js`. Keep only UI labels and the questionnaire questions in code.
