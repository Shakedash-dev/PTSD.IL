# AGENTS.md

Guidance for AI coding agents working in this repo. Human-oriented overview lives in `README.md` - read that first for product context.

## What this is

Hebrew-first React SPA providing PTSD info, self-help tools, screening, treatment pathways, rights, and community resources for trauma survivors in Israel. 5 languages with RTL support for Hebrew and Arabic. Currently frontend-only - no backend wired up yet.

## Working directory

**All commands run from `/workspace/src`, not the repo root.** The Vite app lives one level down.

```bash
cd src
npm install
npm run dev        # vite dev server, localhost:5173
npm run build      # production build to src/dist
npm run lint       # eslint, scoped to components/pages
npm run lint:fix
npm run typecheck  # tsc against jsconfig.json (checkJs on .jsx)
```

There is no test runner configured. Don't claim "tests pass" - there are none.

## Stack and conventions

- **React 18 + Vite 6**, JSX only (no TS source files, but `.jsx` is type-checked via `checkJs`)
- **Routing**: `react-router-dom` v6, all routes declared in `src/App.jsx`
- **Styling**: Tailwind + Radix primitives in `src/components/ui/` (shadcn-style). Prefer composing these over hand-rolled markup.
- **State**: `@tanstack/react-query` for any async data (client instance in `src/lib/query-client.js`)
- **Forms**: `react-hook-form` + `zod`
- **Path alias**: `@/` resolves to the `src/` directory (configured in `vite.config.js` and `jsconfig.json`). Use `@/components/...`, never relative `../../`.
- **i18n**: translation dictionary in `src/lib/i18n.js`, language context in `src/lib/LanguageContext.jsx`. Access with `useLang()`. Multi-field pattern for entity content: `title_he`, `title_ar`, `title_ru`, `title_en`, `title_fr`.
- **RTL**: `document.documentElement.dir` is set from the active language. Don't hardcode `left`/`right` - use Tailwind logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`) or `start/end` variants.

## Directory map

```
/workspace
├── src/
│   ├── App.jsx              # router + providers
│   ├── pages/               # one file per route
│   ├── components/
│   │   ├── ui/              # Radix wrappers (shadcn) - rarely modify
│   │   └── *.jsx            # app-specific components
│   ├── lib/                 # i18n, contexts, query client, utils
│   ├── hooks/
│   ├── utils/
│   ├── api/                 # EMPTY - placeholder for future backend client
│   └── dist/                # build output, gitignored
├── entities/                # JSON Schemas for the planned backend (not wired up)
└── data_from_meitiv.txt     # Source material from Matityahu Center (gitignored)
```

## Things that bite

- **`src/api/` is empty.** There is no backend. Don't fabricate API calls - check with the user before introducing one. Admin page (`/admin`) is a stub that needs a backend to do anything real.
- **`entities/` files are JSON Schemas**, not runtime code. They describe the future DB shape. Multi-language fields follow `<field>_<lang>` (e.g. `body_he`).
- **`localStorage` key is `natal_lang`** (legacy name from before the rename to PTSD-IL). Don't rename it casually - existing visitors would lose their language preference.
- **ESLint scope is narrow** - `src/lib/**` and `src/components/ui/**` are ignored. Don't assume lint covers everything.
- **`typecheck` runs on `.jsx`** via `checkJs`. JSDoc types are honored. Don't add `.ts`/`.tsx` files without checking the existing convention.
- **Mixed date libs**: both `date-fns` and `moment` are dependencies. Prefer `date-fns` in new code.

## Content sensitivity

This site serves trauma survivors. When touching content (text, screening questions, treatment descriptions, crisis-related copy):

- **Do not invent clinical content.** The README explicitly flags that current content is unvalidated and needs professional review. If asked to write new mental-health copy, default to "this needs a clinician to author" rather than generating it.
- **Don't remove disclaimers or anonymity language** from the screening questionnaire without explicit instruction.

## Punctuation rules

- **Never use em-dashes (`—`) or en-dashes (`–`) anywhere in the codebase** - not in JSX, strings, comments, or markdown. Use a regular hyphen (`-`) instead. This applies to all languages and all files.

## Style for changes

- Match the existing JSX style (functional components, hooks, named exports for utilities, default export for pages/components).
- Keep new components in line with the Radix-plus-Tailwind pattern already in use - don't introduce a competing UI library.
- When adding a page: create the file in `src/pages/`, register the route in `src/App.jsx`, add any nav strings to `src/lib/i18n.js` for all 5 languages (Hebrew is required, others can be stubbed with a ipsum lorem if needed).

## GitHub Pages compatibility

The site runs on both local dev (`localhost:5173`) and GitHub Pages (`https://shakedash-dev.github.io/PTSD.IL/`). Every new page or piece of content must work on both.

### The base path

The deployment lives under `/PTSD.IL/`, not at the root. The base path is defined once in `src/base-path.js`:

```js
export const BASE_PATH = '/PTSD.IL';
```

`vite.config.js` reads it for the build `base`, and `App.jsx` reads it for the Router `basename`. On local dev, Vite's dev server handles `base` transparently so routes work at `/` too.

### Rules for new code

**Always use React Router for internal navigation - never raw HTML or `window.location`.**

| Wrong | Right |
|---|---|
| `<a href="/some-page">` | `<Link to="/some-page">` |
| `window.location.href = '/some-page'` | `useNavigate()('/some-page')` |

The only exception is links inside raw HTML strings (e.g. `dangerouslySetInnerHTML` content). There, React Router can't be used, so prepend `BASE_PATH`:

```js
import { BASE_PATH } from '@/base-path';
// inside a template string:
`<a href="${BASE_PATH}/calming/breathing">...</a>`
```

**Never hardcode `/PTSD.IL/` as a string literal.** Always import from `@/base-path`.

### Git workflow

- **All commits go to `main`.** Never commit directly to `gh-pages`.
- `gh-pages` is the release branch managed by the `gh-pages` npm package. Only the user deploys to it:
  ```bash
  cd src && npm run deploy
  ```
- When asked to commit, push to `main` only and tell the user to run `npm run deploy` if they want the live site updated.

## Out-of-scope warnings

If the user asks for something that requires a backend (auth, persistence, admin CRUD, the chatbot in `ChatbotFAB.jsx`, Stripe checkout), surface that the backend doesn't exist yet rather than mocking it silently.