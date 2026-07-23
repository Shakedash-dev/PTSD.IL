# Spec: make Communities multilingual (for the backend)

## Problem
Every other content type (`articles`: FAQs, tools, treatment steps, children content,
sources, ...) is multilingual via the pattern **one row per item per language**, linked
by `groupId`, filtered by `?langId=`. The FE already threads the active language through
those endpoints.

**Communities are the exception.** `GET /api/communities` returns a single row per
community with a single set of text fields and NO language dimension - so community
content can only ever be Hebrew. This is the last major surface that cannot be translated
without a backend change.

## Which fields actually need translation (free text)
From live data, per community:
- `name` - Hebrew free text -> translate
- `description` - Hebrew free text -> translate
- `organization` - Hebrew free text -> translate

Do NOT need per-row translation (handled elsewhere on the FE):
- `location` (`center` / `jerusalem` / `online` / ...) - enum slug, displayed via FE label maps
- `meetingType` (`frontal` / `hybrid` / `digital`) - enum slug, FE label maps
- `contactUrl` - URL
- `targetAudiences[]` - shared taxonomy (translate once at the audience level, not per community)

## Recommended approach: mirror the `articles` model (Option 1)
Add `langId` and `groupId` to the communities table, **one row per community per language**,
exactly like `articles`. This keeps communities consistent with the rest of the content model
and lets the FE reuse the same language-threading + Hebrew-fallback logic it already has.

### Schema changes
- `communities.langId` : string (2-5, FK to `languages.id`), NOT NULL, default `he`.
- `communities.groupId` : uuid, NOT NULL. Links the language variants of one community.
  (Auto-generate on create if omitted, like articles.)
- Keep `location`, `meetingType`, `contactUrl`, `isActive`, `targetAudiences` on every row
  (or, if you prefer, only on the `he` row - but simplest is to duplicate them per row so
  each row is self-contained, matching how articles carry `url`/taxonomy per language).

### API changes
- `GET /api/communities?langId=<lang>` - filter by language. Return published/active rows
  for that language. (FE will call with the active UI language and fall back to `he` when a
  translation is missing, same as `fetchWithHebrewFallback` for articles.)
- Admin `POST /api/admin/communities` and `PUT /api/admin/communities/:id` - accept
  `langId` (required) and `groupId` (optional, auto-generated when absent), same semantics
  as `POST /api/admin/articles`.
- Response `Community` shape gains `langId` and `groupId`.

### Migration
1. Backfill: every existing community row gets `langId = 'he'` and a freshly generated
   `groupId` (unique per community).
2. Then translated sibling rows (ar/ru/en/fr) can be created via the admin endpoint, reusing
   the same `groupId` - identical to how the article translation backfill was done
   (`scripts/translation_backfill.json`).

## Alternatives (not recommended)
- **Per-language JSON columns** (`name`/`description`/`organization` as `{he, ar, ...}`):
  works, but diverges from the article model and complicates querying.
- **Separate `community_translations` table** keyed by `(communityId, langId)`: cleanest
  normalization, but more FE/BE plumbing and inconsistent with articles.

## FE follow-up (our side, once the BE supports the above)
1. Thread `lang` through `fetchCommunities` / `useCommunities` in `src/api/source.js` +
   `src/api/hooks.js` (identical to the recent selfHelp/treatment/children/sources fix).
2. Produce a translation backfill for the 7 communities x 4 languages (name, description,
   organization), warm/faithful tone, and POST via the admin endpoint - same process as the
   article backfill.

Blocking dependency: the schema + `?langId=` filter above must land first.
