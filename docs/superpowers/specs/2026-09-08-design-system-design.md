# Design System & Component Consolidation

**Date:** 2026-09-08
**Status:** Approved, ready for implementation planning
**Goal:** Turn the current ad-hoc styling into an organised design system so a
designer (working in Figma, on her own machine) can take over the visual layer.

## Why

The repo has a good foundation that nothing uses. shadcn/ui is fully installed
(60+ components in `src/components/ui/`, radix + `cva` + `tailwind-merge` in
`package.json`) but pages import it exactly twice. Everything else is
hand-rolled Tailwind, so there is no standard way to change a component and no
vocabulary a designer can work against.

Measured state before work begins:

| Problem | Count |
|---|---|
| Raw `<button>` elements instead of `<Button>` | 66 (28 in `Admin.jsx`) |
| Off-token Tailwind palette colors (`zinc-600`, `red-500`, `orange-50`, ...) | 83 |
| Legacy green/terracotta classes on a lavender site (`teal`, `clay`, `sage`, `oatmeal`) | 33 |
| Directional classes that break RTL (`ml-`, `pl-`, `left-`) | ~80 |
| Duplicated `const isRTL = document.documentElement.getAttribute('dir')` | 4 copies |
| `components/ui/*` files installed | 60+, 2 imported |

Additional defects found during exploration:

- `ThemeContext.applyPalette()` writes CSS custom properties at runtime that are
  byte-identical to what `index.css` `:root` already declares. Dead indirection
  left over from a removed multi-palette feature.
- `TextureOverlay.jsx` destructures `textureId` from `useTheme()`, but
  `ThemeContext` does not provide that key. It is always `undefined`.
- `CalmingBreathing.jsx` and `CalmingMuscle.jsx` each hand-roll a near-identical
  SVG progress ring (`ProgressRing` / `TimerRing`).
- `FirstCircle.jsx` and `SecondCircle.jsx` differ only in data - six lines once
  identifiers are normalised.
- Three typo'd filenames in `components/ui/`: `calandar.jsx`, `textarena.jsx`,
  `ratio-group.jsx`.
- `AGENTS.md` states "There is no test runner configured. Don't claim tests
  pass." This is false: `vitest` is installed and `src/test/` holds 12 test
  files. The claim must be corrected.

## Decisions taken

Settled with the repo owner before design:

1. **Designer workflow is Figma-first.** She designs in Figma and hands off.
2. **No Figma writes from this machine.** The Figma MCP available here is
   authenticated as her account, but she works from her own machine with her own
   Claude Code, Figma MCP and GitHub access. This repo produces *files* she
   consumes; nothing crosses machines except git.
3. **No Storybook.** Figma is her surface; a markdown document is the written
   contract for the code side.
4. **Visual fidelity: keep the current look, fix obvious inconsistencies.**
   Layout and structure stay identical. The legacy green/terracotta colors are
   unified into the token set, which is a small deliberate visible change.
5. **`Admin.jsx` is in scope**, sequenced last because it carries the most risk
   and has no test coverage.
6. **Commit straight to `master`**, one commit per phase, per the project's
   `CLAUDE.md`.
7. **Order of work: clean the code first, then build the design system, then
   produce the Figma export.**

## Approach

Bottom-up: stabilise the token layer, then primitives, then composed patterns,
then Admin, then the handoff artifacts. Each phase rests on a stable layer below
it and ships to `master` independently.

Two alternatives were considered and rejected:

- **Figma handoff first** (unblocks the designer immediately) would have her
  design against a token set still containing the legacy sediment we are about
  to delete, guaranteeing rework on her side.
- **A fresh `src/design-system/` built alongside the old code** avoids a
  big-bang migration but leaves two systems coexisting indefinitely, which is
  the exact failure mode that produced the current state.

## Architecture

### 1. Token layer

`src/index.css` `:root` becomes the single source of truth for every design
value. Concretely:

- Delete `applyPalette()` and the runtime CSS-variable writes from
  `ThemeContext.jsx`. If `TextureOverlay` still needs a provider, keep a minimal
  one and fix the `textureId` bug; if not, remove the context entirely.
- Remove the hardcoded hex palettes from `tailwind.config.js`
  (`teal`, `clay`, `sage`, `oatmeal`, `midnight`). Every color in the config
  resolves to an HSL custom property.
- Introduce the tokens the codebase actually needs but lacks:
  - **Semantic status**: `--success`, `--warning`, `--info` (alongside the
    existing `--destructive`).
  - **Categorical**: promote the already-declared but unused `--chart-1..5` into
    a documented `--category-1..5` scale.

The 33 legacy-palette usages fall into three distinct jobs and must be remapped
by job, not mechanically:

| Job | Where | Maps to |
|---|---|---|
| Decorative gradient | `Treatment.jsx`, `Calming.jsx`, `Community.jsx` tile placeholders | token-based gradients (`primary`/`muted`/`card` at low alpha) |
| Categorical tag | `Sources.jsx` category badges, `Community.jsx` meeting types | `--category-1..5` |
| Semantic status | `Questionnaire.jsx` severity, `text-clay` on delete buttons | `--destructive` / `--success` |

The 83 off-token Tailwind palette colors are remapped against the same table.

### 2. Component taxonomy

Three tiers, with a rule per tier. This is the part the project currently
lacks entirely.

**Primitives - `src/components/ui/*`**
shadcn components. Styled exclusively from tokens, zero business logic, all
variants expressed through `cva`. Never import from `pages/`. Filename typos
fixed.

**Patterns - `src/components/patterns/*`**
Composed but content-agnostic. Existing components move here and have their
hand-rolled variant maps (`SIZE_CLASSES`, `TONE_CLASSES`, `VARIANT_CLASSES`)
converted to `cva`, so their variant sets are machine-readable and can be
mirrored as Figma component variants.

- Moved: `PageHeader`, `SectionBlock`, `ArchFrame`, `FilterChip`
- Extracted: `ContentCard` (the repeated
  `bg-card rounded-super border border-border p-6 shadow-card` string),
  `TimerRing` + `ExerciseRunner` (collapses the `CalmingBreathing` /
  `CalmingMuscle` duplication), `LinkGrid` (collapses `FirstCircle` /
  `SecondCircle`)

**Pages - `src/pages/*`**
Data and composition only. The enforced rule: **no raw Tailwind color classes in
`pages/`.** Colors arrive through primitives, patterns, or semantic tokens.

### 3. RTL

The site is Hebrew-first with Arabic also RTL, across 5 languages.

- One `useDirection()` hook replaces the four duplicated
  `document.documentElement.getAttribute('dir')` reads. The existing copies read
  the DOM during render and do not react to a language switch; the hook derives
  direction from `LanguageContext` and does.
- All directional utilities become logical: `ml-`/`mr-` -> `ms-`/`me-`,
  `pl-`/`pr-` -> `ps-`/`pe-`, `left-`/`right-` -> `start-`/`end-`,
  `text-left`/`text-right` -> `text-start`/`text-end`.
- **One component in code, two variants in Figma.** Logical properties mean a
  single React component renders correctly in both directions from the `dir`
  attribute; duplicating that into explicit code-level direction variants would
  reintroduce the duplication this project exists to remove. Figma has no
  auto-mirroring, so the Figma library does carry LTR and RTL variants per
  component - that is generated on the designer's machine and specified in the
  handoff document.

### 4. Figma export

Produced in this repo, consumed on her machine:

- `docs/design-tokens.json` - W3C Design Tokens format, importable as Figma
  variables. Generated from `index.css` so it cannot drift.
- `docs/design-system.md` - the written contract: every token, every component,
  its variants, and when to use which.
- `docs/figma-handoff.md` - the procedure her Claude Code follows to generate
  the Figma library from the token file and component manifest, including the
  LTR/RTL variant requirement.

### 5. Guardrails

Without enforcement this decays back within months.

- An ESLint rule rejecting raw Tailwind palette color classes inside `pages/`.
- An `AGENTS.md` section stating the three tiers and their rules.
- Correct the false "no test runner configured" claim in `AGENTS.md`.

## Phases

| # | Scope | Risk |
|---|---|---|
| 0 | Token unification; delete dead theme code; fix `textureId` bug; fix `ui/` filename typos | low |
| 1 | Primitives migration across the public site: 38 raw buttons, cards, inputs -> `ui/*` | medium |
| 2 | Patterns tier: move + `cva`-ify; extract `ContentCard`, `TimerRing`/`ExerciseRunner`, `LinkGrid` | medium |
| 3 | RTL: `useDirection()` hook + logical properties sitewide | low |
| 4 | `Admin.jsx`: 1839 lines, 28 raw buttons | high |
| 5 | Export + guardrails: `design-tokens.json`, `design-system.md`, `figma-handoff.md`, ESLint rule, `AGENTS.md` | low |

## Verification

There is no visual regression testing, so verification is mechanical plus
targeted manual review.

After every phase, from `src/`:

```
npm run lint
npm run typecheck
npm run test
npm run build
```

All four must pass before the phase is committed. Phase 4 additionally requires
manual review of the admin panel against the live API, since it has no test
coverage and the most surface area.

## Out of scope

Deliberately excluded to keep this focused:

- Any actual redesign. This project reorganises; the designer decides how it
  looks.
- The local `STRINGS` / `UI` objects in the Calming pages that bypass
  `lib/i18n.js`. Real problem, separate concern.
- Backend, API, and content-model work.
- The six stale worktrees under `.claude/worktrees/`.
