# FE Rewrite — consume structured Markdown-JSON (Spec)

**Date:** 2026-07-22
**Goal:** Update the public FE to consume the re-migrated DB, where each article's
`content` is a JSON string with **Markdown** leaves (see
`2026-07-22-db-remigration-spec.md`). Two coordinated changes: (1) `source.js`
adapters parse the JSON and rebuild the shapes pages already consume; (2) pages
render Markdown instead of HTML. This RESTORES the structure the first migration
flattened (second-circle callout, rights steps, treatment methods, children cta).

Scope: public pages + `source.js` + one new `Markdown` component. OUT: `Admin.jsx`
(still reads static `db` via react-quill — untouched), the questionnaire (static).

## 1. New component: `src/components/Markdown.jsx`

Wrap `react-markdown` (v9, already installed; NO remark-gfm — core CommonMark only).
- Render into `<div className={className}>` so existing CSS (`rich-content`) applies.
- Link handling (content has both internal and external links):
  - href starting with `/` → react-router `<Link to={href}>` (SPA nav, same tab).
  - else → `<a href target="_blank" rel="noreferrer">`.
- Signature: `<Markdown className="rich-content">{markdownString}</Markdown>`.
- Guard empty/null input (render nothing).

## 2. `src/api/source.js` — parse `content` JSON, rebuild page shapes

KEEP the existing UI-derivation helpers (icon maps, `subCategorySlug`, hyphen↔underscore
normalization, Hebrew fallback, `api()` fetch helper). CHANGE each adapter to
`JSON.parse(item.content)` and map structured fields. Rich fields below are **Markdown
strings** (rendered by `<Markdown>`); plain fields are plain text (rendered as-is).

| adapter | API call | returns (per item) |
|---------|----------|--------------------|
| `fetchSources` | `?type=source&langId=he` | `{ title, authors: c.authors, year: c.year, url (native), description_he: c.description (plain), category: subCategorySlug }` |
| `fetchSelfHelpTools` | `?type=tool&langId=he` | `{ category: subCategorySlug, icon (derived), title_he: title, content_he: c.body (md), apps: (c.apps||[]).map(a=>({ title_he:a.title, description_he:a.description (plain), ios_url:a.ios_url, android_url:a.android_url })) }` — apps now come from `c.apps`, NOT child articles. |
| `fetchTreatmentSteps` | `?type=treatment_step&langId=he` | `{ step_number: sortOrder, icon (derived), title_he: title, description_he: c.description (plain), how_to_start_he: c.how_to_start (md), methods: (c.methods||[]).map(m=>({ ...m, description_he:m.description (plain), how_to_start_he:m.how_to_start (md) })), links: c.links||[] }` sorted by sortOrder |
| `fetchCommunities` | `/communities` | UNCHANGED (communities weren't re-migrated; native plain fields). |
| `fetchPTSDInfoFaqs({lang})` | `?type=faq&categorySlug=ptsd-info&langId=<lang>` (he fallback) | `{ q: title, a: c.answer (md) }` |
| `fetchRightsFaqs({lang,category})` | `?type=faq&categorySlug=rights&langId=<lang>` (he fallback) | filter by `audiences[].slug===category` (hyphen↔underscore); `{ q: title, a: c.answer (md), steps: c.steps||'' (md), links: c.links||[] }`. Re-apply the general-append behavior; honor `c.general_only` (don't append general_only items to other buckets). |
| `fetchSecondCircleTools({lang})` | `?type=faq&categorySlug=second-circle&langId=<lang>` (he fallback) | `{ q: title, intro: c.intro (md), sections: (c.sections||[]).map(s=>({ heading:s.heading (plain), body:s.body (md) })), closing: c.closing||'' (md), callout: c.callout||'' (md) }` |
| `fetchChildrenContent` | `?categorySlug=children&langId=he` | Group by `ageGroups[0].slug`. `type==='article'` item → `guidelines: c.body (md)`. Resource items (`book/activity/story/video`) → `{ type, title_he: title, description_he: c.description (plain), content_he: c.body (md), cta_label: c.cta?.label||'', cta_url: c.cta?.url||'' }`. Result: `{ [slug]: { guidelines, resources:[...] } }`. Sort resources by sortOrder. |

Signatures unchanged (hooks call them as-is). Handle `content` null → `{}`.

## 3. Pages — replace `dangerouslySetInnerHTML` with `<Markdown>`

Import `Markdown`. For each site below, replace
`<div ... dangerouslySetInnerHTML={{ __html: X }} />` with
`<Markdown className="<same classes>">{X}</Markdown>` (keep the element's existing
classes — esp. `rich-content` — so styling holds). Leave plain-text fields
(`description_he` subtitles, `heading`, titles, `q`, `app.description_he`) as plain `{...}`.

- `SelfHelp.jsx` (1): `tool.content_he`.
- `Treatment.jsx` (2): `method.how_to_start_he`, `step.how_to_start_he`.
- `PTSDInfo.jsx` (1): `answer`.
- `PTSDInfo2.jsx` (1): `active.a`.
- `Rights.jsx` (2): `a`, `steps`.
- `SecondCircleTools.jsx` (4): `intro`, `s.body`, `closing`, `callout`.
- `Children.jsx` (2): `guidelines`, `r.content_he`.

Do NOT touch `Admin.jsx` (7 sites — static/react-quill, separate phase).

## Verify (required)
1. `npm run build` succeeds.
2. Smoke-test adapters against the LIVE API (node, inline `VITE_API_URL`): each returns
   populated shapes — rich fields are markdown strings (contain `\n`/`**`/`-`/`1.`, NOT
   `<tags>`); sections/callout/steps/methods/apps/cta are populated where expected;
   rights buckets filter correctly.
3. `grep -c dangerouslySetInnerHTML` on public pages (SelfHelp/Treatment/PTSDInfo/
   PTSDInfo2/Rights/SecondCircleTools/Children) = **0**. Admin unchanged.
4. Report any page that needed a change beyond a mechanical `<Markdown>` swap.
