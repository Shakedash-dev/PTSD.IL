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
npm run lint       # eslint, scoped to components/pages
npm run typecheck  # tsc against jsconfig.json (checkJs on .jsx)
```

There is no test runner configured. Don't claim "tests pass" - there are none. Verify by building and by exercising the change against the live API.

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

**Static layer is mostly retired.** `src/data/static/*` + `src/data/db.js` remain ONLY for: (a) the PCL-5 questionnaire, which has no API endpoint yet (`Questionnaire.jsx` and the read-only admin questionnaire panel still read `db`); (b) historical record - they were the source of truth the DB was migrated from. Do NOT add new content there; new content goes through the API/admin.

## Auth & DB access

- **Auth is backend-enforced via JWT.** `POST /api/auth/login {email,password}` -> `{accessToken}`. Every `/api/admin/*` call re-checks the token + role server-side (401/403). The client-side `/admin` guard (`AdminGate` in `App.jsx`, `hasAdminAccess()`) is **UX only** - it shows/hides the panel, it is NOT a security boundary.
- **Roles are exact-match** (`docs/api.md`): article CRUD needs `admin` or `moderator`; `masteradmin` manages users but is NOT implicitly admin.
- **Credentials** for the existing admin user (`masteradmin1@ptsd-il.local`, roles `masteradmin,admin`) live in `PTSD.IL/.env` (gitignored). `VITE_API_URL` lives in `src/.env` (gitignored) and must be set in the Render dashboard for deploys.
- Auth is temporary email/password; Google SSO is planned (see README "Known limitations").

## Stack and conventions

- **React 18 + Vite 6**, JSX only (no TS source files, but `.jsx` is type-checked via `checkJs`)
- **Routing**: `react-router-dom` v6, all routes in `src/App.jsx`
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
├── data/                # static/ + db.js - RETAINED ONLY for the questionnaire (see above)
└── dist/                # build output, gitignored
docs/
├── api.md                       # API endpoint reference (the backend contract)
├── mobile-data-guide.md         # content model + per-type content JSON + markdown used
└── superpowers/specs/*          # design specs for each migration/wiring stage
```

## Things that bite

- **`content` is a JSON string, not an object** - always `JSON.parse` it (defensively). Native columns `description`/`authors`/`year`/`links` are usually null; the data is inside `content` (except `url` on sources).
- **The DB stores Markdown, never HTML.** Don't write HTML into content. The admin editor is HTML (react-quill) but `adminSource` converts on save.
- **The questionnaire is still static** (no API endpoint) - editing it in admin is disabled/read-only.
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
