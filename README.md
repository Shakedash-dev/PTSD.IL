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

## Deployment (GitHub Pages)

Live at: `https://shakedash-dev.github.io/PTSD.IL/`

The base path (`/PTSD.IL/`) is defined in `src/base-path.js` and consumed by both `vite.config.js` (build `base`) and `App.jsx` (Router `basename`). Change it there if the repo is ever renamed.

`main` is the development branch. `gh-pages` is the release branch - never edit it directly.

```bash
cd src
npm run deploy     # builds and pushes dist/ to the gh-pages branch
```

The `gh-pages` branch is managed by the `gh-pages` npm package. GitHub Pages is configured to serve from that branch.

## Project structure

```
/
├── src/                  # React app
│   ├── pages/            # Route components - UI structure only, no inline content
│   ├── components/       # UI components (Radix wrappers + custom)
│   ├── lib/              # Language/theme contexts + i18n.js (UI strings)
│   ├── data/
│   │   ├── static/       # Content entity files - the only place raw content lives
│   │   └── db.js         # Aggregates static/ into one object for the API layer
│   ├── api/
│   │   ├── source.js     # Fetch functions - the sole swap point when the backend ships
│   │   └── hooks.js      # React Query hooks - what pages use to read data
│   ├── hooks/
│   └── utils/
├── entities/             # Database entity schemas (JSON) — for future backend
└── data_from_meitiv.txt  # Source material (Matityahu Center for Psychotrauma)
```

## Content architecture

The site has no backend yet, but it's built as if one already exists. The reason: when a real database and API eventually ship, the frontend should need zero changes except swapping one file. Everything else - the React components, the data-fetching hooks, the UI logic - stays identical.

To make that possible, content is split into three strict layers. **Content only flows downward.** Pages never reach past their layer to grab raw data directly.

```
i18n.js (UI strings)
    ↓
src/data/static/ (content entities)
    ↓
src/data/db.js (aggregator)
    ↓
src/api/source.js ← THE SWAP POINT - rewrite this when the backend ships
    ↓
src/api/hooks.js (React Query hooks)
    ↓
src/pages/*.jsx (components - read data only through hooks)
```

---

### Layer 1 - `src/lib/i18n.js`: UI strings

**What it is:** A flat dictionary of short, developer-controlled strings, keyed by language code. Accessed in components via `t(lang, 'key')`, which falls back to Hebrew if a key is missing in the requested language.

**What belongs here:** Page titles, subtitles, button labels, nav items, filter labels, section headings, error messages, any short text that is part of the interface itself rather than the content it displays. The rule of thumb: if a non-developer content editor wouldn't need to change it, it lives here.

**What does not belong here:** Body text of FAQs, source descriptions, tool content, treatment step explanations - anything that is a record with its own schema belongs in Layer 2.

**Adding a new string:** add the key to the `he` block (required), then to `en`, `ar`, `ru`, `fr` (can be stubbed - missing keys fall back to Hebrew automatically).

---

### Layer 2 - `src/data/static/`: Content entities

**What it is:** One JS file per content type, each exporting a named constant (`STATIC_SOURCES`, `STATIC_TOOLS`, `RIGHTS_FAQS`, etc.). These are pure data - no React imports, no component logic. They are the "mock database tables" for the current frontend-only phase.

**What belongs here:** Anything that is a structured record or a collection of records - FAQs, sources, communities, self-help tools, treatment steps, children's guidelines. If it has multi-language field variants (`title_he`, `title_ar`, etc.), if it contains HTML body content, or if it would logically be managed through an admin panel by a non-developer, it belongs here.

**The aggregator - `src/data/db.js`:** A single file that imports from all the static files and merges them into one `db` object. It exists so `src/api/source.js` has one place to import from. Nothing else should import from `src/data/` directly.

**Icon keys:** Data files store icon names as strings (e.g. `icon: 'Wind'`). The actual Lucide icon components live only in the page that renders them, in a local `ICON_MAP`. This keeps the data layer free of React imports.

---

### Layer 3 - `src/pages/*.jsx`: UI structure only

**What it is:** React components that define layout, styling, and interaction logic. They receive content through React Query hooks and display it. They contain no raw content of their own.

**What belongs here:** JSX component trees, Tailwind classes, React state and event handlers, icon maps (mapping string keys from data to Lucide components), filter/tab key arrays that reference i18n keys. That's it.

**What does not belong here:** Any string literal that isn't a `t()` call and isn't a Tailwind class. No hardcoded Hebrew. No inline data arrays. No direct imports from `src/data/` or `src/lib/pageContent`.

**The enforcement rule:** if you find yourself writing a string literal in JSX, ask: is this a UI label? → put it in `i18n.js`. Is it content? → put it in `src/data/static/`. Either way, not inline.

---

### How data reaches a component

```
1. Component calls:    const { data, isLoading } = useSources()
2. Hook calls:         useQuery({ queryFn: fetchSources })         [src/api/hooks.js]
3. Fetch fn returns:   Promise.resolve(db.sources)                 [src/api/source.js]
4. db.sources is:      STATIC_SOURCES                              [src/data/db.js]
5. Which lives in:     src/data/static/sources.js
```

React Query handles caching, loading states, and error states. The component never knows or cares where the data physically came from.

---

### When the real backend ships

Only one file changes: `src/api/source.js`. Each `fetch*()` function in it gets rewritten from `return Promise.resolve(db.sources)` to `return fetch('/api/sources').then(r => r.json())`. The function signatures stay identical, so every hook, every component, every loading state continues to work without modification. `src/data/` and `src/data/db.js` can then be deleted entirely.

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
