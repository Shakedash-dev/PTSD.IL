# PTSD-IL

A Hebrew-first web application providing information, self-help tools, and support resources for PTSD trauma survivors and their families in Israel. Supports 5 languages (Hebrew, Arabic, Russian, English, French) with full RTL.

## What it does

- **Self-help tools** - guided breathing, grounding (5-4-3-2-1), progressive muscle relaxation
- **PTSD screening** - anonymous self-assessment questionnaire (PCL-based)
- **Treatment pathways** - step-by-step guidance through therapeutic options
- **Rights & bureaucracy** - legal rights, disability support, compensation processes
- **Children's content** - age-appropriate trauma education
- **Community groups** - connecting survivors with local support groups
- **Admin dashboard** - content management interface (requires backend, TBD)

Two user journeys: survivors (first circle) and their loved ones (second circle).

## Stack

- **Frontend** - React 18, React Router 6, Vite 6
- **Styling** - Tailwind CSS, Radix UI, Framer Motion
- **State** - TanStack React Query
- **Forms** - React Hook Form + Zod
- **Other** - Three.js, Recharts, Leaflet, jsPDF, Stripe

## Running locally

```bash
cd src
npm install
npm run dev        # dev server at localhost:5173
npm run build      # production build
npm run lint       # ESLint
npm run typecheck  # type checking
```

## Deployment (Render)

The site is a **Render static site** served from the domain root. (It previously ran on GitHub Pages under `/PTSD.IL/`; that's retired.)

- Render config: root directory `src`, build command `npm install && npm run build`, publish directory `dist`.
- `src/base-path.js` exports `BASE_PATH = ''` (root) - consumed by `vite.config.js` (build `base`) and `App.jsx` (Router `basename`).
- `VITE_API_URL` must be set in the Render dashboard (baked in at build time).
- An SPA rewrite rule (`/*` -> `/index.html`) is configured so deep links and refresh work.
- Render auto-deploys from `master` on push. Commit to `master`; the owner pushes when ready.

## Project structure

```
/
├── src/                  # React app
│   ├── pages/            # Route components - UI structure only, no inline content
│   ├── components/       # UI components (Radix wrappers + custom)
│   ├── lib/              # Language/theme contexts + i18n.js (UI strings)
│   ├── data/            # static/ + db.js - RETIRED, kept only for the questionnaire
│   ├── api/
│   │   ├── source.js     # public read adapters (API -> page shapes)
│   │   ├── hooks.js      # React Query hooks - what pages use to read data
│   │   ├── adminClient.js# authenticated fetch wrapper (Bearer JWT)
│   │   └── adminSource.js# admin CRUD layer
│   ├── hooks/
│   └── utils/
├── docs/                 # api.md (backend contract), mobile-data-guide.md, specs
└── entities/             # legacy DB entity schemas (JSON)
```

## Architecture: content & backend

The site is backed by a **live API gateway** (a headless-CMS-style backend over a database) at `https://ptsd-il-api.onrender.com/api`. The backend code is not in this repo - it's a black box we call over HTTP. Its full contract is in [`docs/api.md`](docs/api.md); the content model (for the mobile app or any consumer) is in [`docs/mobile-data-guide.md`](docs/mobile-data-guide.md).

### The content model - pure data, no styling

The DB stores content as **pure data**: each row is one content item in one language, and the item's payload is a **JSON string (the `content` column) with Markdown in every rich-text field** - never HTML. The frontend parses that JSON and applies all styling. This is deliberate: the same data drives this website and the future mobile app, each rendering it however it wants.

- One row = one item per language. `type` distinguishes the kind (`faq`, `tool`, `treatment_step`, `source`, `book`, `article`, ...).
- Translations of the same item share a `groupId`. Taxonomy (categories / audiences / age-groups) is referenced by slug.
- Only the FAQs are translated (he/ar/en); everything else is Hebrew-only; `ru`/`fr` are empty and fall back to Hebrew.

### How data reaches the public site

```
src/pages/*.jsx     <- render; rich text via <Markdown> (react-markdown)
src/api/hooks.js    <- React Query hooks (useSources, useRightsFaqs, ...)
src/api/source.js   <- fetch* adapters: GET the API, JSON.parse content,
                        reshape into the shape each page expects
```
`src/api/source.js` is the single integration layer - it fetches from the API and maps each response to the page shape. Rich Markdown fields render through `src/components/Markdown.jsx` (internal `/...` links become router links; external open in a new tab).

### The admin panel (`/admin`)

Content is edited through the admin panel, behind login:

- **Auth** (`src/lib/auth.js`, `src/pages/AdminLogin.jsx`): email/password -> JWT (`POST /api/auth/login`), stored in `sessionStorage`. The `/admin` route guard (`AdminGate` in `App.jsx`) is UX only - **authorization is enforced server-side** by the backend re-checking the JWT + role on every write.
- **Writes** (`src/api/adminSource.js`, `src/api/adminClient.js`): each panel loads from the API and does real create/update/delete. `src/lib/markdownHtml.js` converts between the react-quill HTML editor and the DB's Markdown on save/load.

### The retired static layer

`src/data/static/*` + `src/data/db.js` used to be the mock "database" and are now retired. They remain only for the **PCL-5 questionnaire**, which has no API endpoint yet (`Questionnaire.jsx` and the read-only admin questionnaire panel still read `db`), and as the historical source the DB was migrated from. New content goes through the API/admin, not here.

### i18n vs content

`src/lib/i18n.js` still holds **UI strings** (button labels, nav, headings) via `t(lang, 'key')` with Hebrew fallback. That's distinct from **content**, which comes from the API. Rule of thumb: interface chrome -> `i18n.js`; anything a content editor would manage -> the API/admin.

## TODO

- [ ] Replace all content with validated content (reviewed by professionals/verified sources)
- [ ] Make every piece of content dynamic - move all content to a database so the site parses data from it, enabling updates without code changes
- [ ] Change the background texture - pick the best one along with the best matching color palette
- [ ] Create a full design system/theme from the site that will serve as the foundation for the mobile application development

## Known limitations (to fix)

The backend API gateway has shipped and the site now reads/writes live data (the
"When the real backend ships" note above is largely historical — `src/api/source.js`
now fetches from the API instead of static `db`). Content is stored as pure data:
each article's `content` is a JSON string with **Markdown** leaves; the UI renders
the styling. The admin panel (`/admin`) is behind login and does real CRUD. These
items are known-incomplete and should be revisited:

- [ ] **Auth is temporary password login, not SSO.** Move admin auth to Google SSO
      (`POST /api/auth/google` on the BE + a sign-in button) — the current flow slots
      out cleanly. Note: authentication and role checks are enforced **server-side via
      JWT** on every `/api/admin/*` call; the client-side `/admin` route guard is UX
      only (show/hide), not a security boundary.
- [ ] **New admin items don't link translations.** Creating a new FAQ in one language
      makes a single-language item (fresh `groupId`). Editing/deleting existing
      translated items works. Add translation-linked creation (create he + ar + en
      sharing one `groupId`).
- [ ] **Community target-audiences may not persist on save.** The API docs don't
      document how to set `targetAudiences` on `POST/PUT /api/admin/communities`; the
      admin wires it by analogy but it's unverified. Confirm the field name / BE support.
- [ ] **Treatment `methods` and self-help `apps` aren't editable in the admin UI.**
      They're carried through as passthrough data (edits don't strip them) but there
      are no form controls to edit them yet. Add UI.
- [ ] **Questionnaire admin panel is read-only.** The PCL-5 questionnaire has no API
      endpoint, so it still reads the static file and can't be edited. Add a BE
      endpoint + migrate it, then wire the panel.
- [ ] **No `ru`/`fr` content in the DB.** Those languages fall back to Hebrew. Add
      translations (or hide the language options until content exists).
- [ ] **Deployment note:** the "Deployment (GitHub Pages)" section above is stale —
      the site is now a Render static site served from the domain root (`BASE_PATH`
      is `''`), with `VITE_API_URL` set in the Render dashboard.
