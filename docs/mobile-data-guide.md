# Mobile App — Data Handling Guide

How to fetch content from the API and parse it for the mobile app. This covers
**data only** — how the content is shaped and what you must render. Visual design
(layout, colors, typography) is out of scope here; this just tells you what the
bytes mean and how to turn them into renderable content.

Base URL: `https://ptsd-il-api.onrender.com/api` (the "API"). Full endpoint
reference: [`api.md`](./api.md).

---

## 1. Fetching (read-only)

Everything the app displays is a **public GET - no auth, no token, ever.** The
app only reads, and every read endpoint is open. (Writing is admin-only, done
from the website's admin panel behind Google SSO - never from the app.)

| You want | Call |
|----------|------|
| Content items | `GET /api/articles?…` (filters below) |
| One item | `GET /api/articles/:id` |
| Support communities | `GET /api/communities` |
| Category list (with hierarchy) | `GET /api/categories` |
| Audience list | `GET /api/audiences` |
| Age-group list | `GET /api/age-groups` |
| Language list | `GET /api/languages` |

`GET /api/articles` accepts any combination of these query params (all optional):
`type`, `langId`, `categorySlug`, `audienceSlug`, `ageGroupSlug`, `parentId`
(and the `*Id` UUID variants). Results are **already sorted** by `sortOrder`
then `createdAt`. Only published items are returned.

> The API is on a free host that cold-starts — the first request after idle can
> take ~30–60s. Use generous timeouts and a loading state.

---

## 2. The core model: everything is an "article"

There is one generic content table. **Each row is one content item, in one
language.** The `type` field says what kind of thing it is. Despite the name
"article", it covers FAQs, tools, sources, treatment steps, children content,
etc. Communities are the one exception - they have their own endpoint/shape (§7).

An article looks like this (top-level, from the API):

```jsonc
{
  "id": "uuid",
  "type": "faq",              // see enum below
  "groupId": "uuid",          // links translations of the SAME item (§5)
  "langId": "he",             // "he" | "ar" | "en" | "ru" | "fr" | "ru" | "fr"
  "title": "…",               // plain text (the question / title / name)
  "description": null,        // native columns below are usually null —
  "content": "{…json…}",      //   the real payload is this JSON STRING (§4)
  "url": null,                // native; only sources use it
  "authors": null, "year": null, "links": null,   // null — data is in content
  "parentId": null,
  "sortOrder": 0,
  "isPublished": true,
  "categories": [ { "slug": "rights", "name": "…", "parentId": null, … } ],
  "audiences":  [ { "slug": "general", "name": "…" } ],
  "ageGroups":  [ { "slug": "4-6", "min": 4, "max": 6, … } ]
}
```

**`type` enum:** `article`, `faq`, `tool`, `treatment_step`, `source`, `book`,
`video`, `activity`, `download`, `story`, `app`.

Two things to internalize:

1. **`content` is a JSON string, not an object.** You must `JSON.parse(content)`
   to get the real fields. Everything the item actually says lives in there
   (§4). The native columns `description`/`authors`/`year`/`links` are `null` —
   ignore them (except `url` on sources). Design decision: the DB stores *pure
   data*, never HTML/styling.
2. **Taxonomy comes as relation arrays of `{slug, …}`.** You filter and group by
   the **slug** (`categories[].slug`, `audiences[].slug`, `ageGroups[].slug`).
   Categories are hierarchical — some items carry both a parent and a child
   category (e.g. `self-help` + `sleep`); the child is the one whose `parentId`
   is set.

---

## 3. Assembling a screen (which items belong where)

Filter `GET /api/articles` by `type` (+ category/audience/age-group) to build
each screen:

| Screen | Filter |
|--------|--------|
| PTSD info FAQs | `type=faq` + `categorySlug=ptsd-info` |
| Rights FAQs | `type=faq` + `categorySlug=rights`, then group by `audiences[].slug` |
| Second-circle (for loved ones) | `type=faq` + `categorySlug=second-circle` |
| Self-help tools | `type=tool` |
| Treatment pathway | `type=treatment_step` (render in `sortOrder`) |
| Sources / references | `type=source` |
| Children content | `categorySlug=children`, group by `ageGroups[].slug`; within a group, `type=article` is the **guidelines** block and `book`/`activity`/`story`/`video` are the resource cards |
| Communities | `GET /api/communities` |

Rights extra rule: items whose parsed content has `general_only: true` belong
**only** to the `general` audience tab — do not show them under other audience
tabs (they'd point people at the wrong process).

---

## 4. The `content` JSON per type

After `JSON.parse(content)`, this is what you get. **Bold field names are
Markdown** (render with a Markdown renderer, §5); all other fields are **plain
text** (render as-is, no Markdown parsing).

### `faq` — categorySlug `ptsd-info`
```jsonc
{ "answer": "**markdown**" }
```
- **`answer`** — Markdown. `title` (top-level) is the question, plain.

### `faq` — categorySlug `rights`
```jsonc
{
  "answer": "**markdown**",
  "steps": "1.  …\n2.  …",              // optional
  "links": [ { "label": "…", "url": "…" } ],  // optional
  "general_only": true                   // optional flag, see §3
}
```
- **`answer`**, **`steps`** — Markdown. `links[].label`/`url` plain. Group the
  item by `audiences[].slug` (`general`, `security-forces`, `hostilities`,
  `sexual-harassment`, `accidents-work`).

### `faq` — categorySlug `second-circle`
```jsonc
{
  "intro": "**markdown**",
  "sections": [ { "heading": "plain title", "body": "**markdown**" } ],
  "closing": "markdown",     // optional
  "callout": "markdown"      // optional — often an urgent-help note
}
```
- **`intro`**, **`sections[].body`**, **`closing`**, **`callout`** — Markdown.
  `sections[].heading` is plain.

### `tool` — self-help
```jsonc
{
  "body": "**markdown**",
  "apps": [ { "title": "…", "description": "…", "ios_url": "…", "android_url": "…" } ]  // optional
}
```
- **`body`** — Markdown. `apps[]` fields all plain (they're names/links).

### `treatment_step`
```jsonc
{
  "description": "plain subtitle",
  "how_to_start": "**markdown**",
  "methods": [ { "title": "plain", "description": "plain", "how_to_start": "**markdown**", "links": [ … ] } ],  // optional
  "links": [ { "label": "…", "url": "…" } ]   // optional
}
```
- **`how_to_start`** and each **`methods[].how_to_start`** — Markdown. `description`,
  `methods[].title`, `methods[].description` are plain. Use `sortOrder` for step order.

### `source`
```jsonc
{ "authors": "plain", "year": "plain", "description": "plain" }
```
- All plain. The link is the **native top-level `url`** field (not inside content).

### `article` — children **guidelines** (one per age group)
```jsonc
{ "body": "**markdown**" }
```
- **`body`** — Markdown. This is the guidance block for the age group
  (`ageGroups[].slug`).

### `book` / `activity` / `story` / `video` — children **resource**
```jsonc
{
  "body": "**markdown**",
  "description": "plain",
  "cta": { "label": "plain", "url": "…" }   // optional call-to-action
}
```
- **`body`** — Markdown. `description`, `cta.label` plain; `cta.url` is a link.

> **Rule of thumb:** the Markdown fields are exactly: `answer`, `steps`, `intro`,
> `sections[].body`, `closing`, `callout`, `body`, `how_to_start` (top-level and
> inside methods). Everything else — titles, headings, `description`, `authors`,
> `year`, `cta.label`, app fields, method titles/descriptions, link labels,
> community fields — is plain text. Render plain fields as-is; do **not** pass
> them through the Markdown renderer (they may contain stray `*`/`_`/`[` that a
> parser would misread).

---

## 5. Markdown — every element we actually use

The Markdown is **standard CommonMark**. Use any CommonMark-compliant renderer
(e.g. `flutter_markdown`, `react-native-markdown-display`, `swift-markdown`,
`Markwon` on Android) and it will handle everything below. This is the **complete
set of constructs that appears in the data** — nothing else is used, so this is
all you need to support/test/style:

| Element | Looks like | Notes |
|---------|-----------|-------|
| Paragraph | text blocks separated by a blank line (`\n\n`) | most common |
| Bold | `**text**` | ~205 uses |
| Italic | `*text*` | rare (~7) |
| Unordered list | lines starting `-   ` (dash + spaces) | ~311 uses |
| Ordered list | lines starting `1.  ` (number + spaces) | ~109 uses |
| Link | `[text](url)` | see internal vs external below |
| Blockquote | line starting `> ` | 1 use (a children quote) |
| Escaped char | `\*` | a literal asterisk (e.g. a footnote marker or `8703\*`) — the renderer outputs `*`, not emphasis |

**Not used at all** (but a compliant parser handles them if they ever appear):
headings (`#`), inline/fenced code, images, tables, horizontal rules, nested
lists, hard line breaks. There are **no HTML tags** anywhere — content is pure
Markdown.

**List spacing:** bullets are `-` followed by *three* spaces, ordered items are
`1.` followed by *two* spaces. CommonMark treats any 1+ spaces the same, so a
compliant renderer handles it — just don't write a hand-rolled parser that
assumes exactly one space.

### Links — the one behavior you must implement

A link target is either **internal** or **external**:

- **Internal** — starts with `/` (e.g. `[…](/questionnaire)`, `[…](/calming)`).
  These are *in-app routes*, not web URLs. Intercept them and navigate within the
  app to the matching screen (map `/questionnaire`, `/calming`, `/self-help`,
  etc. to your screens). Do **not** open a browser for these.
- **External** — starts with `http://` / `https://` (e.g. a gov.il form). Open in
  the system browser / in-app web view.

There are only a handful of link targets in the whole dataset; the internal ones
today are `/questionnaire` and `/calming`. Detect by `url.startsWith('/')`.

---

## 6. Languages & translations

- Request a language with `langId` (`he`, `ar`, `en`, `ru`, `fr`). All five are
  active in the DB (`GET /api/languages`).
- **Articles are fully translated.** Every content group now exists in all five
  languages across every `type` (not just FAQs) - one row per language, so a group
  is five rows. Hebrew (`he`) is the source language. As a defensive measure, if a
  `langId` query ever returns `[]` or is missing a specific item, **fall back to
  Hebrew**.
- **`groupId` links the translations of one item.** To fetch another language's
  version of a specific item, match on `groupId`.
- **Communities are the exception - still Hebrew-only.** `GET /api/communities`
  has no `langId`/`groupId` (one row per community, see §7); it is not yet
  multilingual. Everything served from `/api/articles` is.
- **Direction:** each language's `direction` (`rtl`/`ltr`) comes from
  `GET /api/languages`. `he`/`ar` are RTL; `en`/`ru`/`fr` are LTR.

---

## 7. Communities (separate shape)

`GET /api/communities` returns support groups (not articles, no `content` JSON —
these are plain native fields, no Markdown):

```jsonc
{
  "id": "uuid",
  "name": "…",
  "description": "plain text",
  "location": "center" | "jerusalem" | "south" | "online" | null,
  "meetingType": "frontal" | "hybrid" | "digital" | null,
  "organization": "…" | null,
  "contactUrl": "…" | null,
  "targetAudiences": [ { "slug": "sexual-harassment", "name": "…" } ]
}
```
All text is plain. Group/filter by `targetAudiences[].slug`, `location`,
`meetingType`.

---

## 8. Defensive parsing checklist

- `JSON.parse(content)` inside a try/catch; treat failure as an empty item.
- Rich fields can be `""` or absent (`steps`, `closing`, `callout`, `cta`,
  `methods`, `apps`, `links` are optional) — render nothing when empty.
- Never assume a native column (`description`/`authors`/`year`/`links`) holds
  data — read those from the parsed `content` instead (except `url` on sources).
- Render **plain** fields as raw text; render **Markdown** fields through the
  Markdown renderer. Don't mix them up.
- Handle the internal-vs-external link split (§5) — this is the only place data
  drives navigation behavior.
