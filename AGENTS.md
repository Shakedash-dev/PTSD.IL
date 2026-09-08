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

Two caveats. `Admin.jsx` has no automated coverage at all, so a change there
needs manual verification against the live API. Google sign-in does not work on
`npm run dev` (localhost is not an authorised OAuth origin), so the panel's real
read/write behaviour can only be exercised on the deployed site - the local
preview shows the UI against sample data, not the real thing.

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
src/pages/Admin.jsx    <- 9 content panels (CRUD UI, react-quill editor)
src/api/adminSource.js <- load/save/remove per entity; taxonomy resolution;
                          serializes the content JSON; md<->html conversion
src/lib/markdownHtml.js <- mdToHtml (marked) / htmlToMd (turndown)
src/api/adminClient.js  <- authenticated fetch (Bearer); 401 -> logout, 403 -> error
src/lib/auth.js         <- login/logout, JWT in sessionStorage, isAuthenticated/hasAdminAccess
```
`Admin.jsx`'s panels edit HTML (react-quill); `adminSource` converts to/from the DB's Markdown on save/load.

**Static layer is fully retired.** `src/data/static/*` and `src/data/db.js` have been deleted. The PCL-5 questionnaire, like every other content type, is now served from dedicated API endpoints (`/api/questionnaires`, `/api/admin/questionnaires`) and is fully editable in the admin panel. `src/data/questionnaireSections.js` remains, but it is a presentation-only overlay (Hebrew section grouping for the question list) - not a content source; do NOT add new content data under `src/data/`, new content goes through the API/admin.

## Auth & DB access

- **Auth is backend-enforced via JWT, Google-only.** `POST /api/auth/google {idToken}` -> `{accessToken}`; the password `/api/auth/login` endpoint is gone (404). `idToken` is the Google Identity Services credential collected by `AdminLogin.jsx`; the returned JWT's shape (`roles`/`sub` claims, sessionStorage handling) is unchanged. Every `/api/admin/*` call re-checks the token + role server-side (401/403). The client-side `/admin` guard (`AdminGate` in `App.jsx`, `hasAdminAccess()`) is **UX only** - it shows/hides the panel, it is NOT a security boundary.
- **Roles are exact-match** (`docs/api.md`): article CRUD needs `admin` or `moderator`; `masteradmin` manages users but is NOT implicitly admin.
- **`VITE_GOOGLE_CLIENT_ID`** (the Google OAuth Web Client ID) is required at build time - it's `VITE_*` so it's baked in, not read at runtime; changing it needs a redeploy. Set in `src/.env` (gitignored, for reference) and in the Render dashboard. `VITE_API_URL` lives the same way. Note: localhost is intentionally not an authorized origin on the OAuth client, so Google sign-in only works on the deployed prod URL, not `npm run dev`.
- Google sign-in is the only login path (no password fallback) - see README "Known limitations".
- **`/admin` opens without signing in on a dev server**, read-only, against
  sample data - see `src/lib/adminPreview.js`. It exists because Google is the
  only login path and localhost is not an authorised OAuth origin, so the panel
  could not otherwise be opened locally at all. Every write is refused, a banner
  marks it as sample data, and the whole branch is compiled out of production
  builds (`import.meta.env.DEV`), which `src/test/admin-preview.test.jsx`
  asserts against the built bundle. Set `VITE_ADMIN_PREVIEW=off` in `src/.env`
  for the real login screen. It grants no access: the backend re-checks the JWT
  on every `/api/admin/*` call, and in preview no request is made at all.

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
├── App.jsx              # router + providers + AdminGate + Toasters
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
