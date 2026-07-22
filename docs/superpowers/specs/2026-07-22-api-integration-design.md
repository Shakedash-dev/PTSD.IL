# API Integration (Sub-project B) — Design / Build Spec

**Date:** 2026-07-22
**Goal:** Make the *public* site read live data from the API gateway
(`https://ptsd-il-api.onrender.com/api`) instead of the bundled static files,
with **zero changes to pages or hooks**. Admin writes and auth are out of scope
(later sub-project A).

## Guiding decision

`src/api/source.js` is the sole swap point (as the README always intended).
Every `fetch*()` function is rewritten to call the API and **reshape the
response back into the exact shape it returns today** (the shape hooks/pages
already consume). Pages and `hooks.js` are NOT touched.

The API flattened structured content into a single HTML `content` blob. The
adapter maps that blob into each page's **primary display field** and leaves the
now-gone structured extras **empty** — the pages render the blob in their main
slot and render nothing for the empty extras. This is an accepted, minor visual
degradation (e.g. second-circle loses its distinct callout box). Confirmed OK.

## Scope

- IN: all public read `fetch*()` in `source.js`; a `VITE_API_URL`-based fetch
  helper; Render env var.
- OUT: `Admin.jsx` / `ghostCommit` (writes), any auth, Google SSO, the
  questionnaire (no endpoint — **stays static**, leave the questionnaire path
  reading `db` untouched), pages, hooks, `hooks.js`.
- No page JSX changes. If any page genuinely cannot render without a change,
  STOP and report rather than editing the page.

## Transport

Add a tiny helper (top of `source.js`):

```js
const API = import.meta.env.VITE_API_URL; // e.g. https://ptsd-il-api.onrender.com/api
async function api(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}
```

Reads are public — no Authorization header. Keep functions returning Promises
(hooks already await them). Drop the `import { db }` for the migrated entities;
keep it only for anything left static (questionnaire).

## API facts (verified against live API)

- Article shape: `{ id, type, groupId, langId, title, description, content, url,
  authors, year, links[], parentId, authorId, categories[{slug,name,parentId,...}],
  audiences[{slug,name}], ageGroups[{slug,min,max}], sortOrder, isPublished }`.
- `content` is HTML. `links` is `[{label,url}]` or null.
- Languages populated: he=81, ar=31, en=31, ru=0, fr=0. Non-populated langs
  return `[]` → adapter must fall back to `he` (matches current behavior).
- Types present: faq(31), activity(11), story(7), source(7), article(6),
  book(5), tool(5), treatment_step(5), app(4).
- Categories are hierarchical (parent `self-help` → children `sleep`/`journaling`/`apps`).
- Communities shape: `{ id, name, description, location, meetingType,
  organization, contactUrl, targetAudiences[{slug,name}] }`.

## Per-entity mapping

Target shapes are whatever `source.js` returns today / the `src/data/static/*`
files define — read those to confirm field names before writing each adapter.

| fn | API call | transform → target shape |
|----|----------|--------------------------|
| `fetchSources` | `GET /articles?type=source&langId=he` | `{ title, authors, year, url, description_he: content ?? description, category: categories.find(c=>c.parentId)?.slug ?? categories[0]?.slug }` |
| `fetchSelfHelpTools` | `GET /articles?type=tool&langId=he` | `{ category: sub-category slug (the categories entry whose parentId is set), title_he: title, content_he: content }` |
| `fetchTreatmentSteps` | `GET /articles?type=treatment_step&langId=he` | `{ step_number: sortOrder, title_he: title, description_he: content, how_to_start_he: '', links: links ?? [] }` sorted by `sortOrder` |
| `fetchCommunities` | `GET /communities` | `{ name, organization, description_he: description, target_audience: targetAudiences.map(a=>a.slug), location, meeting_type: meetingType, contact_url: contactUrl }` |
| `fetchPTSDInfoFaqs({lang})` | `GET /articles?type=faq&categorySlug=ptsd-info&langId=<lang>` (fallback he if empty) | `{ q: title, a: content }` |
| `fetchRightsFaqs({lang, category})` | `GET /articles?type=faq&categorySlug=rights&langId=<lang>` then filter by `audiences[].slug === <category>` | `{ q: title, a: content, steps: '', links: links ?? [] }`. Preserve current general-append behavior. NOTE slug format: API uses hyphens (`accidents-work`, `sexual-harassment`, `security-forces`); current code uses underscores — normalize `_`↔`-` when matching. |
| `fetchSecondCircleTools({lang})` | `GET /articles?type=story&langId=<lang>` (or `categorySlug=second-circle`; fallback he) | `{ q: title, intro: content, sections: [], closing: '', callout: '' }` |
| `fetchChildrenContent` | `GET /articles?categorySlug=children&langId=he` | Rebuild `{ [ageGroupSlug]: { guidelines, resources: [{type, title_he: title, description_he: description, content_he: content, cta_label: '', cta_url: url ?? ''}] } }`. Group items by `ageGroups[].slug`. **Guidelines:** investigate — likely a per-age-group `type:'article'` item (the `parentId` container) whose `content` is the guidelines HTML; if not cleanly findable, use `guidelines: ''` (page tolerates empty). Only `book/activity/story/video/app` items become `resources`. |

Questionnaire: leave as-is (static). Do not touch its fetch/consumption.

## Language fallback

For lang-parameterized fetches: request `langId=<lang>`; if the array is empty,
re-request `langId=he`. Mirrors the existing Hebrew-fallback the static layer had.

## Env var

- Local: add `src/.env` (gitignored) with
  `VITE_API_URL=https://ptsd-il-api.onrender.com/api`.
- Render: add `VITE_API_URL=https://ptsd-il-api.onrender.com/api` (Vite bakes at
  build time → triggers rebuild). Note this for the human to add in the dashboard.

## Verification (required before done)

1. `npm run build` succeeds.
2. Smoke test against live API (dev server or a node fetch): each `fetch*()`
   returns a non-empty array with the target field names populated
   (`title_he`/`content_he`/`q`/`a`/etc. present, not `undefined`).
3. Confirm rights category filtering returns the right buckets and the
   hyphen/underscore normalization works.
4. Report any entity where the shape can't be reproduced without a page edit.

## Known/accepted degradations

- second-circle: intro/sections/closing/callout collapse into one blob shown in
  the `intro` slot. Callout box styling lost.
- rights: `steps` block gone (merged into `a`).
- treatment: `how_to_start_he` gone (merged into `description_he`).
- children: `cta_label` gone (button may not render); guidelines best-effort.
- ru/fr have no content → those languages fall back to Hebrew.
