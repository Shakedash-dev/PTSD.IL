# DB Re-migration — Structured Markdown-JSON (Spec)

**Date:** 2026-07-22
**Goal:** Replace all article content in the DB so the DB holds **pure data**:
structured JSON (mirroring the admin editing screen) with **Markdown** in every
rich-text leaf. Zero HTML. Source of truth = the static files
(`src/data/static/*`), which hold the approved, full-structure content incl. ar/en.

**Mutation channel:** the admin REST API (`https://ptsd-il-api.onrender.com/api`).
Requires `admin` role (masteradmin ≠ admin — grant it in Phase 2).

## Storage design

The `articles` schema is fixed (no per-field columns). So:

- **Native columns** (structural/relational, used to serve/filter pages):
  `type`, `langId`, `groupId`, `title` (required; the display title/question),
  `sortOrder`, `isPublished:true`, `parentId`, and taxonomy relations
  (`categoryIds`, `audienceIds`, `ageGroupIds`). Native `url` ONLY for
  `type=source`/`app` (API requires it).
- **`content` column**: a JSON **string** = the item's editing-screen fields,
  every rich value as Markdown. Everything not in a native column lives here
  (answer, body, sections, callout, steps, description, authors, year, links,
  cta, apps, methods, general_only, ...). `description`/`authors`/`year`/`links`
  native columns stay `null`.

FE (rewritten later) does `JSON.parse(content)`. Not this task's concern.

## Taxonomy (already exists — resolve slug→id live via GET; reference)

Categories: `self-help`(→`sleep`,`journaling`,`apps`,`complementary`), `sources`(→`research`,`clinical`,`ngo`,`international`,`official`), `children`, `treatment`, `second-circle`, `ptsd-info`, `rights`.
Audiences: `general`,`security-forces`,`sexual-harassment`,`hostilities`,`accidents-work`,`spouses`,`parents`.
Age-groups: `0-4`,`4-6`,`7-10`,`10-13`,`14-16`,`16+`.

## Loading static files

They use `@/` alias and `@/base-path` (value now `''`). Load via esbuild/vite
with alias `@`→`src`, or shim `@/base-path` to export `BASE_PATH=''`. Do NOT
edit the static files.

## HTML → Markdown

Use `turndown` (GFM: keep `**bold**`, `*em*`, `-`/`1.` lists, `[t](url)`,
paragraphs, `<br>`→newline). Fidelity is the hard requirement. Fields already
plain text (e.g. `description_he` on sources/treatment/children/communities) are
NOT run through turndown — copy verbatim.

## Per-entity mapping

`sortOrder` = array index unless noted. `groupId` links the same item across
languages (share one generated UUID per item; he-only items get their own).

| static | type | taxonomy | title | content JSON | langs |
|--------|------|----------|-------|--------------|-------|
| `STATIC_SOURCES` | `source` | categorySlug=`sources` + the sub-cat slug from `category` (research/clinical/ngo/international/official) | `title` | `{authors, year, description}` (description plain) | he |
| `STATIC_TOOLS` | `tool` | `self-help` + sub-cat from `category` (sleep/journaling/apps/complementary) | `title_he` | `{body: md(content_he)}`, plus `apps:[{title,description,ios_url,android_url}]` when present. Drop icon/color/iconBg (UI). | he |
| `STATIC_STEPS` | `treatment_step` | `treatment` | `title_he` | `{description: description_he (plain), how_to_start: md(how_to_start_he), methods?:[{title, description: md, how_to_start: md, ...}], links?:[{label,url}]}`. sortOrder=`step_number`. Drop icon/color. Keep `methods` for fidelity even though not in editor. | he |
| `STATIC_CONTENT` (children) | guidelines→`article`; resources→`book`/`activity`/`story`/`video` | categorySlug=`children` + ageGroupSlug=the key | guidelines: `"הנחיות"`; resource: `title_he` | guidelines: `{body: md(guidelines)}`; resource: `{body: md(content_he), cta?:{label:cta_label,url:cta_url}}` (description_he plain → put in content `{description}` too). | he |
| `PTSD_INFO_FAQS` | `faq` | `ptsd-info` | `q` | `{answer: md(a)}` | he/ar/en |
| `RIGHTS_FAQS` | `faq` | `rights` + audienceSlug=bucket (underscore→hyphen: `security_forces`→`security-forces`, etc.) | `q` | `{answer: md(a), steps?: md(steps), links?:[{label,url}], general_only?: true}` | he/ar/en |
| `SECOND_CIRCLE_TOOLS` | `faq` | `second-circle` | `q` | `{intro: md(intro), sections:[{heading, body: md(body)}], closing?: md(closing), callout?: md(callout)}` | he/ar/en |

Communities (`STATIC_COMMUNITIES`) live in a separate table (native fields, plain
text — no HTML). Phase 1: VERIFY current DB communities already match static; only
re-migrate (via `/admin/communities`) if they contain HTML or differ. Report.

Questionnaire: out of scope (stays static, no endpoint).

## Translation linking

For he/ar/en entities, arrays are parallel by index. Verify per-lang counts; link
`faq[i]` across langs with a shared `groupId`. If ar/en is shorter, link the
overlap; extra he items get their own groupId. REPORT any count mismatch.

## Phase 1 — build & verify (NO DB writes)

1. **Backup** current DB to `docs/superpowers/specs/db-backup-<stamp>/`:
   GET all `/articles?langId={he,ar,en}`, `/communities`, and the taxonomy. Save raw JSON.
2. **Build** the full target dataset offline → write to a `migration-dataset.json`
   (array of article-create payloads, taxonomy IDs resolved).
3. **Self-verify** and FAIL loudly on any violation:
   - Per type/lang counts equal the static item counts (print the table).
   - Every `content` is valid JSON and parses.
   - **No HTML tag** (`/<[a-z][^>]*>/i`) survives in ANY content leaf.
   - Every taxonomy slug resolved to a real id.
   - groupId linking is consistent (same groupId ⇒ same item across langs).
4. **Fidelity diff**: for a sample per entity (≥2 items each, incl. the
   second-circle callout item and a rights item with steps), print
   ORIGINAL html → PRODUCED markdown side by side for human review.
5. Output a summary + the dataset path. STOP. Do not touch the DB.

## Phase 2 — execute (separate, after human approves the diff)

1. Grant `admin` role to user `e0a11133-6aa1-49d2-b0a4-ca0ba4fe6464`
   (`PUT /admin/users/:id/roles` body `{"roles":["masteradmin","admin"]}`), re-login.
2. DELETE all existing articles (ids from backup). POST the dataset.
3. Verify live: counts per type/lang match the dataset; GET a sample and confirm
   `content` parses to the expected shape; no HTML anywhere.
4. Report. Backup enables rollback.
