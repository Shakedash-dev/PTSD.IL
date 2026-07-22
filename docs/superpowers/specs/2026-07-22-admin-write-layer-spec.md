# Admin Write Layer (`adminSource.js`) — Spec

**Date:** 2026-07-22
**Goal:** A tested data layer the admin panels use to READ (incl. unpublished),
CREATE, UPDATE, DELETE content against the API, converting between the DB's
Markdown-JSON `content` and the react-quill HTML the panels edit. This stage is
the LAYER ONLY — do NOT edit `Admin.jsx` (that's the next stage).

Uses `adminApi(method, path, body)` from `src/api/adminClient.js` (Bearer auth,
401/403 handling already built). Auth: `src/lib/auth.js`.

## Dependencies
Add to the app: `npm install marked turndown` (in `src/`). `marked` = Markdown→HTML
(for loading into quill); `turndown` = HTML→Markdown (on save). Configure turndown
to match the migrated style: `bulletListMarker: '-'`, `headingStyle: 'atx'`,
`codeBlockStyle: 'fenced'`, emphasis `*`, strong `**`. Round-trip must be stable
for our simple formatting (bold, em, ul/ol, links, paragraphs).

## Conversion helpers (`src/lib/markdownHtml.js`)
- `mdToHtml(md)`: Markdown string → HTML (for quill). Empty/null → ''.
- `htmlToMd(html)`: quill HTML → Markdown string. Empty/`<p><br></p>` → ''.
Only RICH fields pass through these. PLAIN fields (titles, `q`, headings,
`description_he` subtitles, cta, authors/year/url) pass through untouched.

## Taxonomy
Fetch once and cache: `GET /categories`, `/audiences`, `/age-groups`. Build
slug→id maps. Reference IDs already known (see db-remigration-spec) but resolve
LIVE. Categories are hierarchical — for tools/sources, `categoryIds` =
`[parentId, subCategoryId]` (e.g. self-help + sleep).

## Entity mapping (API article ⇄ panel draft)

Each `load*` returns drafts carrying `id` + `groupId` + `langId` (where relevant)
so the panel can PATCH/DELETE by id. Rich fields are HTML (via `mdToHtml`); plain
fields are plain. Each `save*(draft, ctx)` builds the payload (rich → `htmlToMd`),
POSTs (no id → new, `groupId` omitted so API auto-generates) or PATCHes (has id).
`remove(id)` = `DELETE /admin/articles/:id`.

| entity | type | taxonomy (ctx) | draft (rich=HTML) | content JSON (rich=MD) |
|--------|------|----------------|-------------------|------------------------|
| ptsdFaq | faq | cat `ptsd-info`; langId | `{id,q,a}` | `{answer}` |
| rightsFaq | faq | cat `rights`; audienceSlug=bucket; langId | `{id,q,a,steps,links}` | `{answer,steps,links,general_only?}` |
| secondCircle | faq | cat `second-circle`; langId | `{id,q,intro,sections:[{heading,body}],closing,callout}` | `{intro,sections:[{heading,body}],closing,callout}` |
| selfHelp | tool | cat `self-help`+sub(`category`); he | `{id,category,title_he,content_he,apps?}` | `{body,apps?}` |
| treatment | treatment_step | cat `treatment`; he; sortOrder=`step_number` | `{id,step_number,title_he,description_he,how_to_start_he,methods?,links}` | `{description,how_to_start,methods?,links}` |
| source | source | cat `sources`+sub(`category`); he; native `url` | `{id,title,authors,year,url,description_he,category}` | `{authors,year,description}` |
| childrenGuidelines | article | cat `children`; ageGroupSlug; he | `{id,ageGroup,guidelines}` | `{body}` |
| childrenResource | book/activity/story/video (`type`) | cat `children`; ageGroupSlug; he | `{id,type,title_he,description_he,content_he,cta_label,cta_url}` | `{body,description,cta?}` |
| community | (communities table) | — | `{id,name,organization,description_he,target_audience[],location,meeting_type,contact_url}` | native `/admin/communities` fields; targetAudienceIds by slug |

Notes:
- Rich (md↔html): `a`, `steps`, `intro`, section `body`, `closing`, `callout`,
  `content_he`, `how_to_start_he` (+ method `how_to_start`), `guidelines`.
- Plain (verbatim): `q`, `title*`, `heading`, `description_he`, `cta_*`, `authors`,
  `year`, `url`, community fields.
- `title` (native, required) = `q`/`title_he`/`name` per entity.
- `isPublished`: default true on create; preserve on update.
- Communities use `/admin/communities` (POST/PUT/DELETE) with native fields;
  targetAudiences by `audienceIds`.
- Questionnaire: NO endpoint — not in this layer (panel stays read-only).

## Verify (required) — protect the production DB
1. `npm run build` passes.
2. Payload-shape unit checks (no writes): for a sample draft per entity, print the
   built payload; confirm content JSON shape + taxonomy IDs + native fields correct.
3. ONE controlled live round-trip, cleaned up:
   - Create a **`isPublished:false`** test faq (so it never hits the public site)
     with known Markdown in the answer.
   - `GET /admin/articles/:id`, confirm stored `content` = expected JSON with MD.
   - Load it (md→html), then save it back (html→md); assert the Markdown is stable
     (round-trip fidelity — flag any drift).
   - `DELETE` it. Confirm it's gone. Leave the DB exactly as before.
4. Report the round-trip fidelity result explicitly.

Do NOT edit `Admin.jsx`. Do NOT commit. Do NOT leave any test data in the DB.
