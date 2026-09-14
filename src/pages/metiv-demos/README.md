# Metiv merged-site demos

DEMO ONLY. Not linked from the live site, not indexed, static data only (no API
calls at runtime). Hebrew only, RTL.

Four design variations of the same site:

| Route | Folder |
|---|---|
| `/metiv-site-demo` | `chooser/` - picks a version |
| `/metiv-site-demo-v1` | `v1/` |
| `/metiv-site-demo-v2` | `v2/` |
| `/metiv-site-demo-v3` | `v3/` |
| `/metiv-site-demo-v4` | `v4/` |

The site is **Metiv's**. The patient area is the former PTSD-IL site, rebranded:
no "PTSD.IL" wordmark, no "PTSD-IL" phrasing anywhere. The Metiv logo is
`/images/metiv-demo/metiv-logo.png`.

## Folder layout

```
pages/metiv-demos/
  README.md            this file - the rules
  shared/
    routes.js          the IA every version implements (identical page set)
    DemoChrome.jsx     base-path + PageHeader contract, DemoLink, DemoMarkdown
    metiv/             scraped metiv.org pages (content/*.md) + demoContent.js
    therapist/         structured therapist-area + org data (content agent)
    patient/           static patient data snapshot, Metiv additions, and
                       rebranded patient page bodies (patient kit agent)
  chooser/             /metiv-site-demo
  v1/ v2/ v3/ v4/      one design each; each owns Site.jsx and everything under it
```

## Hard rules for every agent

1. **Only write inside your own folder** (plus a test file named for it in
   `src/test/`, and image files under `src/public/images/metiv-demo/`).
   Never edit `App.jsx`, `index.css`, `tailwind.config.js`, `components/ui/*`,
   `components/patterns/*`, `lib/*`, existing pages, or another agent's folder.
   The live site must not change.
2. **Design system** (`docs/design-system.md`) applies in full, and
   `src/test/design-system.test.jsx` enforces it on these folders:
   semantic tokens only (no `bg-red-500`, no hex), no raw `<button>` (use
   `Button` / `ChoiceChip` / `Disclosure`), logical direction utilities only
   (`ms-`/`pe-`/`start-`...), text paired with its `-foreground` token.
   Need a new look? Build a version-local component - do not add variants to
   shared primitives.
3. **Links**: write internal links site-relative (`/patient/rights`) through
   `DemoLink` / `useDemoPath()` / `DemoMarkdown` so they stay inside the version.
   Never link to the real site root pages.
4. **No runtime API calls.** Never import `@/api/hooks` or `@/api/source`.
   Static data comes from `shared/`.
   **Exception, V3 patient area (owner decision):** it is the PTSD-IL site
   itself, not the static kit. `v3/Site.jsx` imports the original page files as
   they are, and `v3/patient/` holds verbatim copies of Layout, Navbar, Footer,
   Home and the pages that carry a Metiv addition, changed only by the logo, the
   addition, and path handling. Those pages read live content like the live
   site does. `v3/patient/PtsdIlRouting.jsx` explains how their links stay in
   the demo. Do not restyle or "improve" anything there.
5. **Content sensitivity**: no efficacy claims in anything we write
   ("effective", "proven", "recommended", "evidence-based", "leading"). Describe
   neutrally. Do not invent clinical content. Crisis lines (ער"ן 1201) stay
   visible in every version.
6. **Punctuation**: never use en-dash or em-dash characters anywhere. Hyphen only.
7. **Checks**: run `npm run lint`, `npm run typecheck` and
   `npx vitest run <your test files> test/design-system.test.jsx` from `src/`.
   Do **not** run `npm run build` or `npm run dev` on port 5173 (shared); if you
   need a browser, use another port. Other agents work in parallel: ignore
   typecheck errors outside your folder, fix all inside it.
8. Do not commit.
