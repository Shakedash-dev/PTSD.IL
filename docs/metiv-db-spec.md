# Metiv v3 content in the DB - spec

Status: in progress (2026-10-28). Owner decision: every piece of content the v3
demo (`/metiv-site-demo-v3`) shows comes from the live API, is editable at
`/metiv-site-demo-v3/admin`, and exists in all 5 languages (he, ar, en, ru, fr).
No static fallback: the v3 Metiv pages read the DB only.

This supersedes rule 4 of `src/pages/metiv-demos/README.md` for v3, and rule 1
for the admin/API/worker files listed below. The live PTSD-IL site must keep
working exactly as before.

## 1. Rows

Everything is a normal article row (`docs/api.md`), so no backend change.

- `type: 'article'` for **every** Metiv row. Never `source`/`tool`/`book`/
  `treatment_step`: PTSD-IL fetches those types with no category filter and
  would show Metiv rows on its own pages.
- Categories: one parent `metiv` (top level) and one child per collection,
  `metiv-<collection-slug>` with `parentId` = the `metiv` id. Each row carries
  **both** category ids, so `GET /articles?categorySlug=metiv&langId=xx` returns
  the whole Metiv content of a language in one request.
- `langId`, `groupId`: one row per item per language, the 5 rows share a
  `groupId` (the Hebrew row's).
- `sortOrder`: position in the collection (0-based).
- `isPublished: true`.
- `title`: the item's display title (the registry's `titleField`), or the
  collection key for singletons, or the namespace for copy rows. It mirrors the
  content; the content is the source of truth.
- `content`: `JSON.stringify(item)` - the item object exactly as the v3 pages
  consume it, plus reserved keys that start with `_`:
  - `_key` (all rows): stable id inside the collection (slug/id/key/name, else
    `<collection>-<index>`). Same in every language.
  - `_tr` (non-Hebrew rows): `{ by: 'ai' | 'human' | 'claude', at: ISO,
    model?: string, status?: 'pass' | 'fixed' | 'flagged' }`. `by: 'human'`
    means someone edited this language by hand after the last translation.
  - `_area`, `_label` (copy rows): admin grouping (`general` | `patient` |
    `therapist`) and the Hebrew label shown in the admin.
  Keys starting with `_` are never shown as fields, never translated, and the
  content provider strips them.

### Collection kinds

| kind | DB rows | content |
|---|---|---|
| `list` | one row per array item | the item object |
| `single` | one row | the object |
| `strings` | one row | `{ items: string[] }` |
| `copy` | one row per namespace | `{ [key]: string }`, plus `_area`, `_label` |

Cross references: when an item of one list is the very same object as an item
of another list (e.g. `VETERANS_PROGRAMS[0] === METIV_SERVICES[3]`), the seed
stores `{ "$ref": "METIV_SERVICES#release-journey" }` in its place and the
provider resolves it. The admin shows it as a link to the original.

The collection list (key, slug, kind, area, admin label, title/id fields, and
whether the chatbot indexes it) lives in
`src/pages/metiv-demos/v3/content/registry.js`. The worker keeps its own copy of
the chatbot flag (`METIV_CHATBOT_SLUGS` in `worker/src/lib/api.ts`, see 5); a
worker test imports the registry and checks they match.

### Copy (inline page text)

Inline Hebrew in v3 JSX moves to copy rows. One namespace per page or component
(`landing`, `chrome`, `courseDetail`, ...), camelCase keys, Hebrew values.
Placeholders are `{name}` and must survive translation. A value may be Markdown
only when the page renders it through `DemoMarkdown`/`Markdown`. Seed files:
`scripts/metiv-seed/copy/<namespace>.json` =
`{ "_area": "...", "_label": "...", "key": "text", ... }`.

## 2. Reading (v3 runtime)

`src/pages/metiv-demos/v3/content/MetivContent.jsx`:

- `MetivContentProvider` fetches `categorySlug=metiv` for the current language
  (`useLang().lang`) and, when that is not Hebrew, for Hebrew too; merges by
  `groupId` (item-level fallback to Hebrew; copy and singletons fall back per
  key). Renders a loading state until the data is in, and an error state with a
  retry button on failure. No static data.
- `useMetiv()` returns the collections under the **same names the static
  modules export** (`COURSES`, `ORG`, `METIV_SERVICES`, ...), plus the derived
  helpers the static modules had (`getCourse`, `coursesByCategory`,
  `getArticle`, `UPCOMING_EVENTS`, `PAST_EVENTS`, `RELEASE_JOURNEY_TEAM`,
  `RELEASE_JOURNEY_RESEARCHERS`, `RELEASE_JOURNEY_STUDY`,
  `RELEASE_JOURNEY_PAPERS`, `METIV_SERVICE_CARDS`, ...).
- `useCopy(namespace)` returns `{ [key]: string }`; `fmt(text, vars)`
  fills `{name}` placeholders.
- `getMetiv()` is the same data for non-component code (`meta.js` helpers).
  Safe because the provider renders children only after the data is loaded.

## 3. Admin

`/metiv-site-demo-v3/admin` renders the shared admin (`AdminGate` / `Admin.jsx`)
in Metiv mode. `/admin` keeps working for PTSD-IL.

- Three top-level groups: **כללי / על מטיב**, **מטופלים**, **מטפלים**.
  The patient group holds the 9 existing PTSD-IL panels plus the patient-area
  Metiv collections. Metiv collections and copy namespaces are edited with one
  generic, schema-less JSON editor (strings, long text/Markdown, string lists,
  repeatable object lists with add/remove/reorder, numbers, booleans).
- Every write goes through the existing staged flow (`PendingChanges`,
  review-and-save dialog, edit log).
- Language tabs (he default, ar, en, ru, fr). Editing a non-Hebrew row writes
  only that row and sets `_tr.by = 'human'`. No translation runs.
- Editing a Hebrew row stages it, then calls the worker `/translate` once per
  target language in parallel and stages the 4 translated sibling rows (created
  with the same `groupId` when missing). If a sibling has `_tr.by === 'human'`
  the review dialog asks "<language> נערך ידנית - לתרגם מחדש?" with **yes** as
  the default. Only changed text leaves are sent for translation; unchanged ones
  keep the sibling's current text. `flagged` results are staged with a visible
  warning.
- Applies to the existing PTSD-IL panels too (siblings by `groupId`).

### Translatable leaves

The client walks the content object and sends a flat map `path -> text` of the
human-language strings only. Skipped: keys starting with `_`, `$ref` objects,
and keys in `NON_TRANSLATABLE_KEYS` (`src/lib/translatable.js`: slug, id, key,
icon, anchor, href, url, route, sourceUrl, source, kind, value, email, phone,
dateISO, startDateISO, doi, type, topic, category, status, group?...), plus
values that are URLs, emails, phone numbers, ISO dates or contain no letters.
The translated map is written back to the same paths.

## 4. Worker `/translate`

`POST /translate`, `Authorization: Bearer <admin JWT>` (verified like
`/reindex`).

Request:
```json
{ "source": "he", "target": "ar", "items": { "title": "...", "who": "..." },
  "context": "metiv / courses: <item title>" }
```
Response `200`:
```json
{ "target": "ar", "items": { "title": "...", "who": "..." },
  "status": "pass" | "fixed" | "flagged", "notes": ["..."],
  "model": "gemini-4-argon" }
```
Pipeline per request: translator call, deterministic checks (same keys, URLs,
emails, phones, numbers and `{placeholders}` preserved, Markdown structure kept,
no en/em dash), validator call (source + translation -> issues with fixes),
apply fixes, re-check; one retranslate with the issues if still failing, then
`flagged`. Model from `TRANSLATE_MODEL` (default `gemini-4-argon`). Glossary in
`worker/src/lib/glossary.ts` - the same glossary the one-time bulk translation
used.

## 5. Chatbot

- General Vectorize index: excludes `admin-log`, `site-copy`, `legal`,
  `chatbot-qa`, and every `metiv` row whose collection is not flagged
  `chatbot: true` in the registry (patient-facing services, programs, Metiv
  contact info and the patient release-journey page are indexed; courses,
  events, papers, team, page copy and legal are not).
- Curated Q&A: category `chatbot-qa` (top level), one row per question per
  language, content `{ question, paraphrases: string[], guidance, answer?,
  crisis: boolean }`. `guidance` says what a good answer contains and in which
  order, and says to take facts that change (phones, addresses, names) from
  SOURCES. The worker embeds `question` + `paraphrases` into a KV index (no new
  Vectorize index); at chat time a strong match injects the row as a PLAYBOOK
  block the model follows, adapting wording and language. Crisis rows always
  apply when `detectCrisis` fires.

## 6. One-time initialisation

1. `scripts/metiv-seed/build-seed.mjs` turned the static modules into
   `scripts/metiv-seed/he/*.json` (one-time; the static v3 data files are gone
   now, so it no longer runs). Copy namespaces are written by hand
   (`scripts/metiv-seed/copy/*.json`) while the pages are refactored.
2. `scripts/metiv-seed/import.mjs` creates the categories and writes the Hebrew
   rows (dry run by default, `--apply` writes, no chatbot reindex).
3. Claude Code agents translate the seed (one translator + one validator per
   language) into `scripts/metiv-seed/<lang>/`, checked by
   `scripts/metiv-seed/check-translations.mjs`, then `import.mjs --lang xx`
   writes them with `_tr.by = 'claude'`.
