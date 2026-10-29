# AGENTS.md

Guidance for AI coding agents working in this repo. Human-oriented overview lives in `README.md` - read that first for product context.

## What this is

Hebrew-first React SPA providing PTSD info, self-help tools, screening, treatment pathways, rights, and community resources for trauma survivors in Israel. 5 languages with RTL support for Hebrew and Arabic.

**It is backed by a live API gateway** (a headless-CMS-style backend that reads/writes a database). The site fetches content from `https://ptsd-il-api.onrender.com/api`. The backend code is NOT in this repo - it's a black box we talk to over HTTP; its contract is documented in `docs/api.md`.

## Working directory

**All commands run from `src/`, not the repo root.** The Vite app lives one level down.

```bash
cd src
npm install
npm run dev        # vite dev server, localhost:5173
npm run build      # production build to src/dist
npm run lint       # eslint, scoped to components/ and pages/
npm run typecheck  # tsc against jsconfig.json (checkJs on .jsx)
npm run test       # vitest
npm run tokens     # regenerate docs/design-tokens.json from index.css
```

**Vitest is configured** and `src/test/` holds the suite - run `npm run test`
from `src/`. All four of lint, typecheck, test and build must pass before a
commit.

Two caveats. `Admin.jsx` is covered only against the preview fixtures and a
mocked client (`src/test/admin-*.test.jsx`), so a change there still needs
manual verification against the live API. Google sign-in does not work on
`npm run dev` (localhost is not an authorised OAuth origin), so the panel's real
read/write behaviour is exercised on the deployed site, or locally by pasting
an admin token (see the dev-server bullet under "Auth & DB access").

## Design system

Styling follows a documented system - read `docs/design-system.md` before
changing how anything looks. In short:

- **Colour is defined once**, as HSL custom properties on `:root` in
  `src/index.css`. `tailwind.config.js` only maps names onto them. Never write a
  literal hex into the config or a component. To change a colour, edit
  `index.css` and run `npm run tokens` to regenerate the Figma token export.
- **Components sit in three tiers.** `components/ui/` holds the shadcn
  primitives (styled from tokens, no business logic). `components/patterns/`
  holds composed but content-agnostic pieces - `Disclosure`, `ChoiceChip`,
  `PageHeader`, `SectionBlock`. `pages/` is data and composition only.
- **Pages and patterns may not use raw Tailwind palette colours**
  (`bg-red-500`, `text-zinc-600`) or raw `<button>`. Use a semantic token
  (`primary`, `muted`, `destructive`, `success`, `warning`, `info`), the
  categorical scale (`category-1`..`5`), and `Button` / `ChoiceChip`.
- **Pair text with its background token** - `bg-primary text-primary-foreground`,
  never `bg-primary text-white`.
- **Use logical direction utilities** (`ms-`, `ps-`, `start-`, `end-`), never
  physical ones, and get direction from `useDirection()` rather than reading the
  `dir` attribute off the DOM.
- **Need a new look?** Add a variant to the component's `cva` block and document
  it. Do not inline appearance at the call site.

`src/test/design-system.test.jsx` enforces all of this and will fail the build
if it is broken. If a rule genuinely does not fit, change the rule and record
why - do not weaken a check to get a commit through.

## Architecture: how content flows

**Public reads** (the whole public site):
```
src/pages/*.jsx        <- render data; rich text via <Markdown> (react-markdown)
src/api/hooks.js       <- React Query hooks: useSources(), useRightsFaqs(), ...
src/api/source.js      <- fetch* adapters: GET the API, reshape to the page shape
                          THE integration layer. Fully API-backed (no static reads).
```
The API returns generic "article" rows. Each row is **one content item in one language**; `type` says the kind (`faq`/`tool`/`treatment_step`/`source`/`book`/`article`/...). The item's real payload is its **`content` column, a JSON string with Markdown leaves** (never HTML - the DB stores pure data, the UI styles it). `source.js` `JSON.parse`es it and maps to the shape each page expects; rich fields render through `src/components/Markdown.jsx`. Full content model: `docs/mobile-data-guide.md`; endpoint reference: `docs/api.md`.

**Admin writes** (`/admin`, behind login):
```
src/components/admin/AdminGate.jsx     <- /admin route guard; mounted OUTSIDE <Layout>
src/components/admin/AdminShell.jsx    <- the whole frame: wordmark + logout, RTL, nothing else
src/components/admin/PendingChanges.jsx <- staged edits, save-all review dialog, edit-log write
src/components/admin/AdminGuide.jsx    <- /admin home page (how to use, no-revert, permissions)
src/components/admin/EditLogPanel.jsx  <- edit log viewer (masteradmin)
src/components/admin/AdminLang.jsx     <- content-language tabs (he/ar/en/ru/fr)
src/components/admin/translationStaging.js <- stages AI translations of Hebrew edits
src/components/admin/MetivAdmin.jsx    <- metiv variant: page tree, search, the page's sections
src/components/admin/metivSiteMap.js   <- the tree: one node per v3 page, its sections in site order
src/components/admin/copyContentKeys.js <- which page-copy keys are content (editable); the rest is UI
src/components/admin/metivFieldRules.js <- which collection fields show (no ids/routes/icons/headings)
src/components/admin/ContentEditor.jsx <- schema-less JSON editor (Metiv collections)
src/components/admin/ChatbotQaAdmin.jsx <- chatbot Q&A playbooks (category chatbot-qa), both variants
src/pages/Admin.jsx    <- 9 content panels (CRUD UI, react-quill editor) + users
src/api/metivAdminSource.js <- Metiv rows (categories metiv + metiv-<slug>, _key/_col)
src/api/chatbotQaAdminSource.js <- chatbot-qa rows (one category, no _col; reindex rebuilds the Q&A index)
src/api/adminTranslate.js   <- worker POST /translate, what to send, sibling build
src/api/adminSource.js <- load/save/remove per entity; taxonomy resolution;
                          serializes the content JSON; md<->html conversion
src/lib/markdownHtml.js <- mdToHtml (marked) / htmlToMd (turndown)
src/api/adminClient.js  <- authenticated fetch (Bearer); 401 -> logout, 403 -> error
src/lib/auth.js         <- login/logout, JWT in sessionStorage, isAuthenticated/hasAdminAccess
```
`Admin.jsx`'s panels edit HTML (react-quill); `adminSource` converts to/from the DB's Markdown on save/load.

### /admin edit flow: staged, then saved together

- **Nothing in a content panel writes on its own.** "אישור" on a card stages
  the change in `PendingChangesProvider`; a delete is staged the same way. The
  only write path is the bottom bar's **סקירה ושמירה** dialog, which lists every
  change with before/after text, states that a save cannot be undone (the
  backend keeps no versions) and needs a confirmation tick. New content panels
  must render through `StagedList` (or stage by hand like the children
  guidelines / questionnaire), never call `save*`/`remove*` directly.
- The provider sits in `AdminGate`, above the login screen, so a session that
  expires mid-edit keeps its staged changes; a 401 stops the batch and leaves
  the rest staged.
- **User management is the exception**: role/account changes write
  immediately and are not logged.
- **Edit log**: after a batch, one row per batch - `type: 'article'`, category
  `admin-log` (created on first save), `isPublished: false`, skipped by the
  reindex, content `{ at, user, changes: [{ section, action, title, fields:
  [{label, before, after}] }] }`. Viewable by masteradmin; reading it needs
  admin/moderator too (GET /admin/articles). **Not tamper-proof** - any
  admin/moderator token can PATCH/DELETE the rows; a real audit trail needs a
  backend log.
- **Two variants, one panel**: `/admin` (PTSD-IL) and
  `/metiv-site-demo-v3/admin` (`AdminGate variant="metiv"`: the Metiv v3
  collections in three groups, with the nine PTSD-IL panels under patients).
  Contract: `docs/metiv-db-spec.md` section 3.
- **Languages**: one set of language tabs at the top. A Hebrew edit of an
  article-backed row stages the AI translation of its four siblings (same
  groupId) via the worker's `POST /translate`; nothing can be saved while one is
  pending, a failed one stays staged with a retry, and a sibling edited by hand
  (`_tr.by === 'human'`) asks before it is overwritten. An edit in another tab
  writes only that row and stamps `content._tr = { by: 'human', at }`.
  Communities and the questionnaire have no cross-language link, so they are
  edited per language and never translated.

**Static layer is fully retired.** `src/data/static/*` and `src/data/db.js` have been deleted. The PCL-5 questionnaire, like every other content type, is now served from dedicated API endpoints (`/api/questionnaires`, `/api/admin/questionnaires`) and is fully editable in the admin panel. `src/data/questionnaireSections.js` remains, but it is a presentation-only overlay (Hebrew section grouping for the question list) - not a content source; do NOT add new content data under `src/data/`, new content goes through the API/admin.

### Site copy and legal documents: override rows

Page headings, subtitles, intros, questionnaire result text, the footer and the
SEO descriptions ship in `src/lib/i18n.js`; `/privacy-policy` and
`/terms-of-use` ship their Markdown in `PrivacyPolicy.jsx` / `TermsOfUse.jsx`.
The PTSD-IL `/admin` does not edit either. The Metiv admin
(`/metiv-site-demo-v3/admin`) edits the i18n texts listed in
`src/lib/editableI18nKeys.js` (content only: intros, page subtitles,
questionnaire result texts; never h1s, labels, crisis lines or the calming
exercises), on the admin page each key belongs to, through the same override
rows - so an edit there changes the live PTSD-IL site too:

- Site copy: `type: 'article'`, category `site-copy` (created on the first
  save), `title` = the i18n key, `content` = `{ text }` (+ `_tr`), one row per
  language, the rows of a key linked by groupId. Read/write layer:
  `src/api/adminSiteCopy.js` (no chatbot reindex). A Hebrew edit stages the AI
  translation of the four others (a language without a row translates over
  its shipped text); another language is edited by hand. "חזרה לנוסח המקורי"
  stages deleting the rows (every language from the Hebrew tab). Hebrew names
  per key: `src/components/admin/siteCopyLabels.js`.
  `fetchSiteCopy()` reads them; `LanguageProvider` installs them via
  `setCopyOverrides()`; `t()` resolves
  *lang override -> lang default -> Hebrew override -> Hebrew default -> key*.
  `src/lib/seo.js` sees shipped defaults only.
- Legal: category `legal`, `title` = the slug, content `{ body, updated }`, raw
  Markdown. `LegalPage` renders the shipped text unless a row exists. Not
  editable from either admin.
- To revert either by hand, DELETE the row (`/api/admin/articles/:id`).

## Auth & DB access

- **Auth is backend-enforced via JWT, Google-only.** `POST /api/auth/google {idToken}` -> `{accessToken}`; the password `/api/auth/login` endpoint is gone (404). `idToken` is the Google Identity Services credential collected by `AdminLogin.jsx`; the returned JWT's shape (`roles`/`sub` claims, sessionStorage handling) is unchanged. Every `/api/admin/*` call re-checks the token + role server-side (401/403). The client-side `/admin` guard (`AdminGate` in `App.jsx`, `hasAdminAccess()`) is **UX only** - it shows/hides the panel, it is NOT a security boundary.
- **Roles are exact-match** (`docs/api.md`): article CRUD needs `admin` or `moderator`; `masteradmin` manages users but is NOT implicitly admin.
- **`VITE_GOOGLE_CLIENT_ID`** (the Google OAuth Web Client ID) is required at build time - it's `VITE_*` so it's baked in, not read at runtime; changing it needs a redeploy. Set in `src/.env` (gitignored, for reference) and in the Render dashboard. `VITE_API_URL` lives the same way. Note: localhost is intentionally not an authorized origin on the OAuth client, so Google sign-in only works on the deployed prod URL, not `npm run dev`.
- Google sign-in is the only login path (no password fallback) - see README "Known limitations".
- **`/admin` opens without signing in on a dev server**, read-only, on the
  LIVE data - see `src/lib/adminPreview.js`. Its GET calls are answered from
  the public endpoints (`src/api/adminLiveRead.js`: `/admin/articles` ->
  `/articles`, `/admin/questionnaires` -> `/questionnaires`; users and the
  unpublished edit log are not readable this way). It exists because Google is
  the only login path and localhost is not an authorised OAuth origin. Every
  write is refused and a banner says it is live data, read-only. Its
  "התחברות עם טוקן" button takes an admin JWT copied from sessionStorage
  `ptsd_admin_token` of the signed-in deployed admin and switches to the normal
  signed-in mode against the live API, under a red banner (saves change the
  live site); switching mode drops anything staged. The test run reads
  `src/api/adminPreviewFixtures.js` instead. All of it is compiled out of
  production builds (`import.meta.env.DEV`), which
  `src/test/admin-preview.test.jsx` asserts against the built bundle. Set
  `VITE_ADMIN_PREVIEW=off` in `src/.env` for the real login screen. It grants no
  access: the backend re-checks the JWT on every `/api/admin/*` call.
  `ADMIN_LIVE=1 npx vitest run src/test/admin-metiv-live.test.jsx` walks every
  page of the Metiv admin on the live data.

## Stack and conventions

- **React 18 + Vite 6**, JSX only (no TS source files, but `.jsx` is type-checked via `checkJs`)
- **Routing**: `react-router-dom` v6, all routes in `src/App.jsx`. **Adding a public route means three more edits**: a `<url>` entry in `src/public/sitemap.xml`, and a title/description key in the two maps in `src/lib/seo.js` (skip both only if the route is intentionally unindexed, like `/admin`).
- **Page metadata**: the app is client-rendered, so every URL is served the same `src/index.html`. `src/lib/seo.js` rewrites title/description/canonical/OG per route and language; `useSeo()` is called once from `Layout`. `index.html`'s own head tags are the pre-JS defaults a crawler sees - keep them matching the Hebrew home page.
- **Legal pages**: `/privacy-policy` and `/terms-of-use` deliberately do NOT come from the content API - the text lives in the page files so it cannot be edited by a moderator and still renders when the API is down. Hebrew is the binding version; see `src/components/LegalPage.jsx` for the fallback rules.
- **Styling**: Tailwind + Radix primitives in `src/components/ui/` (shadcn-style). Compose these over hand-rolled markup.
- **State**: `@tanstack/react-query` for async data (client in `src/lib/query-client.js`)
- **Markdown**: rich content renders via `src/components/Markdown.jsx` (react-markdown). Internal links (`/...`) become router `<Link>`s; external open in a new tab.
- **Path alias**: `@/` -> `src/`. Use `@/components/...`, never `../../`.
- **i18n**: UI strings in `src/lib/i18n.js`, language context `src/lib/LanguageContext.jsx`, access with `useLang()`. Content itself comes from the API, not i18n. `source.js` still maps some API fields to `*_he`-suffixed keys the pages expect - that's an internal adapter detail.
- **RTL**: `document.documentElement.dir` follows the active language. Use logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`), never hardcoded `left`/`right`.

## Directory map

```
src/
├── App.jsx              # router + providers + Toasters (/admin -> components/admin/AdminGate)
├── pages/               # one file per route (Admin.jsx = CRUD panels; AdminLogin.jsx)
├── components/
│   ├── ui/              # Radix wrappers (shadcn) - rarely modify
│   ├── Markdown.jsx     # renders content Markdown
│   └── *.jsx
├── api/
│   ├── source.js        # public read adapters (API -> page shapes)
│   ├── hooks.js         # React Query hooks
│   ├── adminClient.js   # authenticated fetch wrapper
│   └── adminSource.js   # admin CRUD layer
├── lib/                 # auth.js, markdownHtml.js, i18n, contexts, query client
├── data/                # questionnaireSections.js - Hebrew section overlay only (see above)
└── dist/                # build output, gitignored
docs/
├── api.md                       # API endpoint reference (the backend contract)
├── mobile-data-guide.md         # content model + per-type content JSON + markdown used
└── superpowers/specs/*          # design specs for each migration/wiring stage
```

## Things that bite

- **`content` is a JSON string, not an object** - always `JSON.parse` it (defensively). Native columns `description`/`authors`/`year`/`links` are usually null; the data is inside `content` (except `url` on sources).
- **The DB stores Markdown, never HTML.** Don't write HTML into content. The admin editor is HTML (react-quill) but `adminSource` converts on save.
- **The questionnaire is now API-backed** (`/api/questionnaires`, `/api/admin/questionnaires`) - fully editable in admin, same as other content types.
- **`VITE_*` env vars are baked at build time**, not read at runtime - changing `VITE_API_URL` needs a redeploy.
- **`localStorage` key `natal_lang`** (legacy name) holds the language preference - don't rename it.
- **ESLint scope is narrow** (`src/lib/**`, `src/components/ui/**` ignored). **`typecheck` runs on `.jsx`** via `checkJs`.

## Deployment (Render)

The site is a **Render static site** served from the domain root. There is NO GitHub Pages anymore.

- `src/base-path.js` exports `BASE_PATH = ''` (root). `vite.config.js` uses it for build `base`, `App.jsx` for the Router `basename`.
- Render config: root directory `src`, build `npm install && npm run build`, publish `dist`.
- `VITE_API_URL` must be set in the Render dashboard (baked at build).
- An SPA rewrite (`/*` -> `/index.html`) is configured so deep links/refresh work.

## Git workflow

- **Commit directly to `master`.** No feature branches / worktrees for routine work (small solo project).
- **Never push and never open a PR** - the repo owner pushes when ready. Render auto-deploys from `master` on push.
- There is no `gh-pages` branch or `npm run deploy` flow anymore (ignore any lingering script).

## Content sensitivity

This site serves trauma survivors. When touching content (text, screening questions, treatment descriptions, crisis-related copy):

- **Do not invent clinical content.** Current content needs professional review. If asked to write new mental-health copy, default to "this needs a clinician to author."
- **Don't remove disclaimers or anonymity language** from the screening questionnaire without explicit instruction.

## Punctuation rules

- **Never use em-dashes (`—`) or en-dashes (`–`) anywhere in the codebase** - not in JSX, strings, comments, or markdown. Use a regular hyphen (`-`).

## Style for changes

- Match the existing JSX style (functional components, hooks, named exports for utilities, default export for pages/components).
- Keep new components in the Radix-plus-Tailwind pattern - don't introduce a competing UI library.
- When adding a page: create it in `src/pages/`, register the route in `src/App.jsx`, add nav strings to `src/lib/i18n.js` (Hebrew required, others can be stubbed).
