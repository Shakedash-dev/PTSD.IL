# Questionnaire DB wiring + admin CRUD - design

Date: 2026-07-25
Status: approved (pending spec review)

## Goal

Make the PCL-5 questionnaire the same as every other content entity: **read from the API**
(no static reads) and **editable in `/admin`**. Today it is the last static-only content
module (`src/data/static/questionnaire.js` via `db.questionnaire`), and its admin panel is
read-only.

The backend already exposes a dedicated questionnaires resource, documented in
`docs/questionnaires-api.md`. **Live data check (2026-07-25):** `pcl-5` is seeded in `en`
and `he` with full flat 20-question/5-option payloads (scores 0-4, option answers carry the
scale labels). `ar`, `ru`, `fr` return `[]` (not seeded).

## Key constraint: dedicated endpoints, NOT the article/content pattern

The rest of the site funnels everything through `/articles` with a `content` JSON-string
column parsed by `parseContent`. **Questionnaires do NOT.** They are their own REST resource
with native fields (`name`, `description`, `maxScore`, `cutoffScore`, `totalQuestions`,
`questions[].options[]`). So:

- No `parseContent`, no `JSON.stringify(content)`, no `writeArticle`/`reindexItem`.
- Public reads hit `/questionnaires*`; admin writes hit `/admin/questionnaires*`.
- Reuse from the existing layer: the `adminApi(method, path, body)` wrapper, the `api(path)`
  public fetch helper, and `getTaxonomy()`/`audiencesBySlug` for audience resolution only.

## Decisions (locked with the user)

1. **Hebrew sectioned UI: keep via a presentation overlay.** The DB stores a flat 20-question
   list; the DB has no notion of the 4 sections/icons or the "קח נשימה" intro line. Question
   *text* comes from the DB; a small client-side overlay supplies section titles, icons, the
   intro line, and per-section counts `[5, 2, 7, 6]`, slicing the flat DB list into sections
   by order. en/ar/ru/fr render the flat list.
2. **Seed ar/ru/fr into the DB now** from the existing static translations, via the new admin
   endpoints (needs an admin JWT - provided in-session). Then retire the static question
   arrays. Note: ar/ru/fr are machine-translated pending clinician review; seeding does not
   change that.
3. **Full CRUD admin panel** matching the documented API: list/create/edit/delete
   questionnaires, edit metadata, nested questions+options editor.

## Architecture

### Public read layer

- `src/api/source.js` -> `fetchQuestionnaire({ lang, slug = 'pcl-5' })`
  - `GET /questionnaires/slug/:slug?langId=<lang>` (single translation, with `questions`).
  - On `404`/empty and `lang !== 'he'`, retry with `langId=he` (Hebrew fallback, consistent
    with `fetchWithHebrewFallback` elsewhere). This keeps a not-yet-seeded language from
    crashing; after seeding, every language resolves directly.
  - Sort `questions` by `sortOrder`; sort each question's `options` by `order`.
  - Return native shape unchanged: `{ id, langId, slug, name, description, totalQuestions,
    maxScore, cutoffScore, questions: [{ id, sortOrder, text, options: [{answer, score,
    order}] }] }`.
- `src/api/hooks.js` -> `useQuestionnaire({ lang, slug = 'pcl-5' })`, queryKey
  `['questionnaire', slug, lang]`.

### Page: `src/pages/Questionnaire.jsx`

- Replace `db.questionnaire` with `useQuestionnaire({ lang })`.
- Add **loading** and **error** states (none exist today - static never failed).
- Header title/subtitle from DB `name`/`description`, falling back to
  `t(lang,'questionnaire_title')`/`t(lang,'questionnaire_intro')` while data loads.
- `maxScore`, `cutoffScore`, `totalQuestions` from DB.
- **Scoring uses `option.score`**, not the button index. Sum the selected option's `score`
  per question. (Identical to today for PCL-5, but correct against the schema and future-proof
  if scores ever differ.)
- **Button labels from DB `options[].answer`** for every language (retires the i18n scale-key
  path - `not_at_all`... - for the answer buttons). `min`/`max` end labels use the first/last
  option's answer.
- **Hebrew**: render sectioned using `src/data/questionnaireSections.js` (new, presentation
  only): `{ intro, sections: [{icon, title, count}] }`. Walk the flat DB `questions` and emit
  `count` questions under each section header, in order. If the DB question count ever diverges
  from the overlay's summed counts, render any leftover questions flat below the last section
  (defensive - avoids dropping questions).
- **en/ar/ru/fr**: flat list from DB `questions`, `QuestionCard` per question, labels from that
  question's options.

### Admin write layer: `src/api/adminSource.js`

New dedicated functions (endpoint const `QUESTIONNAIRES = '/admin/questionnaires'`):

- `loadQuestionnaires()` -> `GET /admin/questionnaires` (all langs, active + inactive).
- `loadQuestionnaireDetail(id)` -> `GET /admin/questionnaires/:id` (includes `questions`).
- `createQuestionnaire(draft)` -> `POST /admin/questionnaires`. Body: `langId, slug, name,
  description, maxScore, cutoffScore, isActive, sortOrder, audienceIds?`. Never sends
  `totalQuestions` (server-managed).
- `updateQuestionnaire(id, draft)` -> `PUT /admin/questionnaires/:id` (partial).
- `removeQuestionnaire(id)` -> `DELETE /admin/questionnaires/:id` (admin-only; 403 for
  moderator surfaces as a toast via existing `runWrite`).
- `addQuestion(qId, q)` -> `POST /admin/questionnaires/:qId/questions`. Body: `sortOrder, text,
  options: [{answer, score, order}]`.
- `updateQuestion(qId, id, q)` -> `PUT /admin/questionnaires/:qId/questions/:id`.
- `removeQuestion(qId, id)` -> `DELETE /admin/questionnaires/:qId/questions/:id` (admin-only).
- Audience resolution reuses `getTaxonomy()` + `requireAudienceId`, only if the panel exposes
  audience selection (see below).

### Admin panel: `src/pages/Admin.jsx` `QuestionnairePanel`

Rewrite from read-only to full CRUD. This is more than the generic `EditableCard` because of
nested questions/options, so it is a dedicated panel:

- **List** questionnaires from `loadQuestionnaires()`, grouped by `slug`, one row per `langId`
  within a group. Show `name`, `langId`, `isActive`, `totalQuestions`.
- **Metadata edit** (per row): `name`, `description`, `maxScore`, `cutoffScore`, `isActive`,
  `sortOrder`, `slug`, `langId`. `totalQuestions` shown read-only. Optional `targetAudiences`
  multiselect (audiences are currently empty for pcl-5; include it since the API supports it,
  low priority).
- **Questions editor** (expand a row -> `loadQuestionnaireDetail(id)`): list questions ordered
  by `sortOrder`; each editable (text + options list, each option `answer`/`score`/`order`);
  add question; delete question. Writes go through existing `runWrite` (handles 401/403 toasts)
  then reload.
- **Create** a new questionnaire (metadata form) and **delete** one (confirm dialog).
- Keep the `CONTENT_TABS` entry (`{ key: 'questionnaire', label: 'שאלון PCL-5' }`) and the
  `PANELS` mapping. Remove `admin_questionnaire_readonly` usage.

### Seeding ar/ru/fr + retiring static

1. After the panel + adminSource land, seed `ar`, `ru`, `fr` `pcl-5` rows from
   `src/data/static/questionnaire.js`: create the questionnaire (name/description from i18n +
   static; maxScore 80, cutoffScore 33, sortOrder 0, isActive true), then POST each of the 20
   questions with the standard 0-4 option scale (answers = that language's scale labels; en-style
   flat wording from the static file). Done via a one-off script using `adminApi` with the
   provided JWT, or through the new panel. Verify each seeded lang round-trips through
   `fetchQuestionnaire`.
2. Retire static: delete the question arrays from `src/data/static/questionnaire.js` and the
   `db.questionnaire` accessor once nothing reads them. Keep ONLY the Hebrew presentation
   overlay, extracted into `src/data/questionnaireSections.js` (icons, titles, counts, intro).
   Remove the now-unused `db.js` if `questionnaire` was its only export.

## Error handling

- Public: React Query surfaces fetch errors; page shows a short error state with a retry, and a
  loading skeleton. Hebrew fallback prevents a missing-lang hard failure.
- Admin: all writes through `runWrite` -> `ForbiddenError`/`UnauthorizedError` become toasts;
  401 logs out. Delete/question-delete are admin-only server-side; moderator gets a 403 toast.
- Defensive render if section overlay counts and DB question count diverge (leftover questions
  rendered flat).

## Verification

No test runner in this repo (`AGENTS.md`). Verify by:
- `cd src && npm run build` and `npm run typecheck` clean.
- Public read: `fetchQuestionnaire` returns en/he correctly; page renders Hebrew sectioned +
  English flat; scoring sums option scores; cutoff drives the result branch.
- After seeding: ar/ru/fr resolve directly (no Hebrew fallback) and render flat.
- Admin write path smoke test against the live API with the provided JWT: edit a question's
  text, add+delete a throwaway question, confirm `totalQuestions` recomputes, then revert.
  (Do NOT leave test data in the live DB.)

## Out of scope

- No change to the scoring math/cutoff semantics or clinical wording.
- No new audiences taxonomy work beyond reusing the existing resolver.
- No offline/caching behavior beyond React Query defaults.
