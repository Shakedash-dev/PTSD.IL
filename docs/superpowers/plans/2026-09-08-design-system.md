# Design System Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace ad-hoc Tailwind styling with a three-tier, token-driven component system, then export it for a designer working in Figma.

**Architecture:** Bottom-up. Unify the token layer first, migrate primitives onto the already-installed shadcn/ui components, extract composed patterns, apply RTL logical properties, then Admin, then the Figma export. Enforcement tests are written *before* each migration - they fail against the current code and pass when the phase lands, then stay as permanent guardrails.

**Tech Stack:** React 18, Vite 6, Tailwind 3.4, shadcn/ui (Radix + `cva` + `tailwind-merge`), vitest + @testing-library/react, react-router-dom v6.

**Spec:** `docs/superpowers/specs/2026-09-08-design-system-design.md`

## Global Constraints

- **All commands run from `src/`**, not the repo root.
- **Four gates must pass before every commit**, run from `src/`:
  `npm run lint` / `npm run typecheck` / `npm run test` / `npm run build`.
  Verified baseline at plan time: lint clean, typecheck clean, 48/48 tests
  passing across 9 files, build succeeds. Any failure is a regression
  introduced by this work.
- **Commit straight to `master`**, one commit per task. Never push, never open
  a PR - the repo owner pushes.
- **Visual fidelity: layout and structure must not change.** The only intended
  visible change is legacy palette colors resolving to token colors.
- **No new runtime dependencies.** Everything needed is already installed.
- **JSX only.** No `.tsx` source files; `.jsx` is type-checked via `checkJs`.
- **The `@` alias resolves to `src/`** (`vite.config.js`), so imports are
  `@/components/ui/button`.
- **Hebrew is the primary language.** Never reorder or reword Hebrew strings
  while migrating markup.
- Adding a public route requires three edits: `src/public/sitemap.xml`, and
  both maps in `src/lib/seo.js`. No task here adds a public route.

---

## File Structure

**Created:**
- `src/lib/useDirection.js` - single source of text direction, reactive to language
- `src/components/patterns/` - the composed, content-agnostic tier
- `src/components/patterns/ContentCard.jsx` - the repeated card surface
- `src/components/patterns/TimerRing.jsx` - SVG progress ring, shared
- `src/components/patterns/ExerciseRunner.jsx` - timed-exercise shell
- `src/components/patterns/LinkGrid.jsx` - the FirstCircle/SecondCircle grid
- `src/test/design-system.test.jsx` - the enforcement guardrails
- `src/test/useDirection.test.jsx`
- `src/test/patterns.test.jsx`
- `scripts/build-design-tokens.mjs` - generates the Figma token file from CSS
- `docs/design-tokens.json` - W3C token format, Figma-importable
- `docs/design-system.md` - the written contract
- `docs/figma-handoff.md` - procedure for the designer's own machine

**Modified:**
- `src/index.css` - becomes the single source of truth for tokens
- `src/tailwind.config.js` - hardcoded hex removed, all colors resolve to vars
- `src/lib/ThemeContext.jsx` - dead runtime palette application removed
- `src/components/TextureOverlay.jsx` - `textureId` bug fixed
- `src/components/ui/{calandar,textarena,ratio-group}.jsx` - renamed
- `src/pages/*.jsx` - migrated to primitives and patterns
- `src/components/{PageHeader,SectionBlock,ArchFrame,FilterChip}.jsx` - moved to `patterns/`, converted to `cva`
- `AGENTS.md` - tier rules added, false "no test runner" claim corrected
- `.eslintrc` / `eslint.config.js` - raw-color rule for `pages/`

---

## Task 1: Enforcement guardrails (failing)

Writes the tests that define "done" for phases 0-3. All three fail now. Later
tasks turn them green one at a time. This is the TDD spine of the whole plan.

**Files:**
- Create: `src/test/design-system.test.jsx`

**Interfaces:**
- Consumes: nothing
- Produces: three test suites - `off-token colors`, `raw buttons`,
  `directional classes` - each reading source files from disk with
  `node:fs`. Later tasks reference these by name.

- [ ] **Step 1: Write the failing test**

```jsx
// src/test/design-system.test.jsx
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Recursively collect .jsx files under a directory, skipping node_modules. */
function collect(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collect(full));
    else if (entry.name.endsWith('.jsx')) out.push(full);
  }
  return out;
}

const rel = (f) => path.relative(SRC, f);

// Tailwind's built-in palettes. Using them directly bypasses the token layer,
// so a designer changing a token would not change these call sites.
const RAW_PALETTE = String.raw`\b(?:text|bg|border|from|to|via|ring|divide|outline|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|[1-9]00)\b`;

// Physical direction utilities. In an RTL-first site these must be logical
// (ms/me/ps/pe/start/end) so Hebrew and Arabic mirror automatically.
const PHYSICAL = String.raw`\b(?:ml|mr|pl|pr)-(?:\d+(?:\.\d+)?|px|auto|\[[^\]]+\])\b|\b(?:left|right)-(?:\d+(?:\.\d+)?|px|auto|full|\d+\/\d+|\[[^\]]+\])\b|\btext-(?:left|right)\b|\b(?:rounded|border)-(?:l|r)(?:-|\b)`;

function violations(files, pattern) {
  const re = new RegExp(pattern, 'g');
  const found = [];
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    src.split('\n').forEach((line, i) => {
      for (const m of line.matchAll(re)) {
        found.push(`${rel(file)}:${i + 1}  ${m[0]}`);
      }
    });
  }
  return found;
}

describe('design system: off-token colors', () => {
  it('pages use no raw Tailwind palette colors', () => {
    const found = violations(collect(path.join(SRC, 'pages')), RAW_PALETTE);
    expect(found, `Use semantic tokens instead:\n${found.join('\n')}`).toEqual([]);
  });

  it('components use no raw Tailwind palette colors outside ui/', () => {
    const files = collect(path.join(SRC, 'components'))
      .filter((f) => !rel(f).startsWith('components/ui/'));
    const found = violations(files, RAW_PALETTE);
    expect(found, `Use semantic tokens instead:\n${found.join('\n')}`).toEqual([]);
  });
});

describe('design system: raw buttons', () => {
  it('pages render no bare <button> elements', () => {
    const found = violations(collect(path.join(SRC, 'pages')), String.raw`<button[\s>]`);
    expect(found, `Use <Button> from @/components/ui/button:\n${found.join('\n')}`).toEqual([]);
  });
});

describe('design system: RTL', () => {
  it('uses logical direction utilities, not physical ones', () => {
    const files = [
      ...collect(path.join(SRC, 'pages')),
      ...collect(path.join(SRC, 'components')).filter((f) => !rel(f).startsWith('components/ui/')),
    ];
    const found = violations(files, PHYSICAL);
    expect(found, `Use ms-/me-/ps-/pe-/start-/end-:\n${found.join('\n')}`).toEqual([]);
  });

  it('reads direction through useDirection(), not the DOM', () => {
    const files = [
      ...collect(path.join(SRC, 'pages')),
      ...collect(path.join(SRC, 'components')),
    ].filter((f) => !rel(f).endsWith('lib/useDirection.js'));
    const found = violations(files, String.raw`documentElement\.getAttribute\(['"]dir['"]\)`);
    expect(found, `Use useDirection() from @/lib/useDirection:\n${found.join('\n')}`).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail with the expected counts**

Run: `npm run test -- design-system`

Expected: FAIL. Five failing assertions. The failure output lists roughly 83
off-token color violations, 66 raw buttons, ~80 physical direction utilities,
and 4 DOM direction reads. Record the exact numbers - later tasks drive them
to zero.

- [ ] **Step 3: Mark the suite as the phase target, not a broken build**

The suite must fail loudly during migration but must not block the other 48
tests. Confirm `npm run test` still reports the original 48 passing alongside
the new failures. Do not add `.skip` - the failures are the worklist.

- [ ] **Step 4: Commit**

```bash
git add src/test/design-system.test.jsx
git commit -m "test: add design system enforcement guardrails (currently failing)"
```

---

## Task 2: Unify the token layer

Removes the competing color systems. After this task there is exactly one
place a color is defined.

**Files:**
- Modify: `src/index.css` (the `:root` block, lines ~7-64)
- Modify: `src/tailwind.config.js` (the `colors` block, lines ~15-79)

**Interfaces:**
- Consumes: nothing
- Produces: CSS custom properties `--success`, `--success-foreground`,
  `--warning`, `--warning-foreground`, `--info`, `--info-foreground`,
  `--category-1` through `--category-5`, each an HSL triple. Tailwind exposes
  them as `success`, `warning`, `info`, `category-1`..`category-5`. Tasks 3-6
  and 12 consume these names.

- [ ] **Step 1: Add the missing semantic and categorical tokens to `:root`**

Insert into the `:root` block in `src/index.css`, after the `--destructive`
pair. Hues are chosen to sit with the existing lavender palette
(`--primary: 268 42% 52%`) rather than fight it.

```css
    /* Semantic status. --destructive already exists above. */
    --success: 152 40% 40%;
    --success-foreground: 270 50% 96%;
    --warning: 28 65% 50%;
    --warning-foreground: 270 50% 96%;
    --info: 210 55% 48%;
    --info-foreground: 270 50% 96%;

    /* Categorical scale: for tagging unordered kinds (source categories,
       meeting types). Carries no good/bad meaning - never use for status. */
    --category-1: 268 42% 52%;
    --category-2: 341 42% 60%;
    --category-3: 152 40% 40%;
    --category-4: 28 65% 50%;
    --category-5: 210 55% 48%;
```

- [ ] **Step 2: Remove the hardcoded hex palettes from `tailwind.config.js`**

Delete the `teal`, `clay`, `sage`, `oatmeal`, and `midnight` keys from the
`colors` block. They are raw hex, so they never respond to a token change -
which is precisely the problem. Replace the deleted keys with:

```js
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))'
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))'
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))'
        },
        category: {
          1: 'hsl(var(--category-1))',
          2: 'hsl(var(--category-2))',
          3: 'hsl(var(--category-3))',
          4: 'hsl(var(--category-4))',
          5: 'hsl(var(--category-5))'
        },
```

Keep `chart-1..5` - `components/ui/chart.jsx` references them.

- [ ] **Step 3: Verify the build fails on the now-undefined classes**

Run: `npm run build`

Expected: the build itself still succeeds (Tailwind silently drops unknown
classes), so instead confirm the damage by grep:

```bash
grep -rnE '\b(text|bg|border|from|to|via)-(teal|clay|sage|oatmeal|midnight)' pages components | wc -l
```

Expected: 33. These are now dead classes rendering no color. Task 3 fixes
them. Do not commit a half-migrated state - continue to Task 3 before running
the gates.

- [ ] **Step 4: Do not commit yet**

This task and Task 3 form one atomic change. Committing here would leave the
site visibly unstyled in those 33 places.

---

## Task 3: Remap the 33 legacy palette usages

Each usage is remapped by the job it does, not mechanically. The three jobs
were identified in the spec.

**Files:**
- Modify: `src/pages/Treatment.jsx:93-94`
- Modify: `src/pages/Calming.jsx:28`
- Modify: `src/pages/Community.jsx:38-40,168-169`
- Modify: `src/pages/Questionnaire.jsx:22,118,119,175,178,191`
- Modify: `src/pages/Sources.jsx:9-13`
- Modify: `src/pages/Admin.jsx:1568,1724`

**Interfaces:**
- Consumes: the token names produced by Task 2
- Produces: no new interfaces

- [ ] **Step 1: Remap the decorative gradients**

These are pure decoration behind tile placeholders. Preserve the *structure*
of each gradient (direction, stops, alpha) and swap only the color source.

```jsx
// src/pages/Treatment.jsx:93-94
  'bg-gradient-to-br from-primary/20 via-muted/40 to-card',        // 4 mind-body
  'bg-gradient-to-br from-secondary/25 via-muted/30 to-muted',     // 5 medication

// src/pages/Calming.jsx:28
    placeholder: 'bg-gradient-to-br from-secondary/20 via-muted/30 to-card',

// src/pages/Community.jsx:38-40
  'bg-gradient-to-br from-secondary/25 via-muted/30 to-muted',
  'bg-gradient-to-br from-primary/20 via-muted to-primary/20',
  'bg-gradient-to-br from-primary/25 via-muted to-card',
```

- [ ] **Step 2: Remap the categorical tags**

`Sources.jsx` colors source categories and `Community.jsx` colors meeting
types. Neither is a status - they are unordered kinds, so they take the
categorical scale.

```jsx
// src/pages/Sources.jsx:9-13
  research: 'bg-category-1/10 text-category-1',
  clinical: 'bg-category-2/10 text-category-2',
  government: 'bg-category-3/10 text-category-3',
  ngo: 'bg-category-4/10 text-category-4',
  international: 'bg-category-5/10 text-category-5',
```

Note: the original mapped `research` and `ngo` to the same teal, and
`clinical` and `international` to the same clay - two pairs were visually
indistinguishable. Giving each of the five its own slot is the intended fix.
Read the actual object keys in the file before editing; `government` is
inferred from the surrounding lines and must be confirmed.

```jsx
// src/pages/Community.jsx:168-169
                        c.meeting_type === 'digital' ? 'bg-category-1/15 text-category-1' :
                        c.meeting_type === 'hybrid' ? 'bg-category-2/15 text-category-2' :
```

- [ ] **Step 3: Remap the true semantic usages**

`text-clay` on a delete button means destructive. The questionnaire's
high/low severity split is status.

```jsx
// src/pages/Admin.jsx:1568 and :1724 - delete buttons
className="p-2 rounded-lg border border-border hover:bg-muted text-destructive"

// src/pages/Questionnaire.jsx:22
        <span className="text-2xl font-heading font-semibold text-muted-foreground/40 flex-shrink-0 leading-tight mt-0.5">

// src/pages/Questionnaire.jsx:118-119 - warning callout
          <div className="rounded-super p-8 text-center bg-card border border-warning/30">
            <AlertCircle className="w-8 h-8 mx-auto mb-3 text-warning" />

// src/pages/Questionnaire.jsx:175,178 - severity result card
            isHigh ? 'bg-card border-primary/30' : 'bg-card border-success/30'
              isHigh ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'

// src/pages/Questionnaire.jsx:191 - severity gradient bar
              <div className={`h-3 rounded-full overflow-hidden ${isRTL ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-success via-warning to-destructive`}>
```

- [ ] **Step 4: Confirm zero legacy classes remain**

Run:

```bash
grep -rnE '\b(text|bg|border|from|to|via|shadow)-(teal|clay|sage|oatmeal|midnight)' pages components
```

Expected: no output.

- [ ] **Step 5: Run all four gates**

```bash
npm run lint && npm run typecheck && npm run test && npm run build
```

Expected: lint clean, typecheck clean, the original 48 tests pass, build
succeeds. `design-system.test.jsx` still fails - it has four other assertions
to go.

- [ ] **Step 6: Commit**

```bash
git add src/index.css src/tailwind.config.js src/pages
git commit -m "refactor: unify legacy palette into semantic and categorical tokens"
```

---

## Task 4: Remove dead theme machinery and fix the `textureId` bug

**Files:**
- Modify: `src/lib/ThemeContext.jsx`
- Modify: `src/components/TextureOverlay.jsx:32`

**Interfaces:**
- Consumes: nothing
- Produces: `ThemeContext` exports change. Read `TextureOverlay.jsx` in full
  before editing to determine whether the provider is still needed at all.

- [ ] **Step 1: Establish what `TextureOverlay` actually needs**

Run:

```bash
sed -n '1,60p' components/TextureOverlay.jsx
grep -rn "useTheme\|ThemeProvider" --include=*.jsx pages components App.jsx
```

`TextureOverlay.jsx:32` destructures `{ textureId, palette }` from
`useTheme()`, but `ThemeContext` provides only `{ palette }`. `textureId` is
`undefined` at every render. Determine from the component body what it does
with that value - whether the texture is silently disabled, or falls back.
Record the finding; it decides Step 2.

- [ ] **Step 2: Delete `applyPalette` and its effect**

Every property `applyPalette()` writes is byte-identical to what `index.css`
`:root` already declares, so it is a no-op that runs on mount. Remove
`hexToHsl`, `applyPalette`, and the `useEffect` that calls it. Keep the
`PALETTE` object and the provider only if Step 1 proved `TextureOverlay` (or
another consumer) reads `palette`. If nothing reads it, delete
`ThemeContext.jsx` entirely and remove `ThemeProvider` from `App.jsx:14` and
its JSX.

- [ ] **Step 3: Fix `textureId`**

Either provide `textureId` from the context with an explicit default, or
remove the destructure and the dead branch it feeds. Choose based on Step 1:
if the texture was never rendering, deleting the dead path is correct;
resurrecting an unrendered visual would violate the "no visual change"
constraint. State which you chose in the commit message.

- [ ] **Step 4: Run all four gates**

```bash
npm run lint && npm run typecheck && npm run test && npm run build
```

Expected: all pass except the known `design-system.test.jsx` assertions.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ThemeContext.jsx src/components/TextureOverlay.jsx src/App.jsx
git commit -m "refactor: remove no-op runtime palette application, fix undefined textureId"
```

---

## Task 5: Fix the typo'd `components/ui` filenames

Three shadcn files were saved under misspelled names. A designer or a new
contributor looking for `textarea` will not find `textarena`.

**Files:**
- Rename: `src/components/ui/calandar.jsx` -> `calendar.jsx`
- Rename: `src/components/ui/textarena.jsx` -> `textarea.jsx`
- Rename: `src/components/ui/ratio-group.jsx` -> `radio-group.jsx`

- [ ] **Step 1: Confirm nothing imports the misspelled paths**

```bash
grep -rn "calandar\|textarena\|ratio-group" --include=*.jsx --include=*.js pages components lib App.jsx
```

Expected: no output, or a small list. If there are importers, they are
updated in Step 2.

- [ ] **Step 2: Rename with git so history follows**

```bash
git mv components/ui/calandar.jsx components/ui/calendar.jsx
git mv components/ui/textarena.jsx components/ui/textarea.jsx
git mv components/ui/ratio-group.jsx components/ui/radio-group.jsx
```

Update any importers found in Step 1. Also check the component's own internal
`displayName` strings for the same typo.

- [ ] **Step 3: Run all four gates**

```bash
npm run lint && npm run typecheck && npm run test && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add -A components/ui
git commit -m "fix: correct misspelled ui component filenames"
```

---

## Task 6: Migrate off-token colors in public pages

Drives the `off-token colors` assertion to zero for `pages/`, excluding
`Admin.jsx` which is Task 17. Measured: 25 violations in `pages/`, 56 in
`components/` (Task 7).

**Files:**
- Modify: every file under `src/pages/` except `Admin.jsx`
- Test: `src/test/design-system.test.jsx` (existing, unmodified)

**Interfaces:**
- Consumes: `success`, `warning`, `info`, `category-1..5` from Task 2
- Produces: no new interfaces

- [ ] **Step 1: List the exact violations to fix**

```bash
npm run test -- design-system 2>&1 | grep -E '^pages/' | sort
```

Work the list top to bottom. Do not batch-`sed` - each violation needs a
judgement about which token it means.

- [ ] **Step 2: Apply the mapping**

| Raw class | Token replacement | Meaning |
|---|---|---|
| `text-zinc-400`, `text-zinc-500` | `text-muted-foreground/70` | de-emphasised text |
| `text-zinc-600`, `text-zinc-700` | `text-muted-foreground` | secondary text |
| `text-zinc-800`, `text-zinc-900` | `text-foreground` | body text |
| `bg-zinc-100` | `bg-muted` | subtle surface |
| `bg-zinc-200` | `bg-border` | stronger subtle surface |
| `border-zinc-200` | `border-border` | hairline |
| `text-red-600`, `text-red-700` | `text-destructive` | error text |
| `bg-red-500`, `bg-red-600`, `bg-red-700` | `bg-destructive` | error surface |
| `bg-orange-50` | `bg-warning/10` | warning callout surface |
| `text-orange-700`, `text-orange-800` | `text-warning` | warning text |
| `bg-orange-500`, `bg-orange-600` | `bg-warning` | warning surface |
| `text-green-700`, `bg-green-500` | `text-success` / `bg-success` | success |
| `text-blue-700`, `bg-blue-100` | `text-info` / `bg-info/10` | informational |
| `text-purple-700`, `bg-purple-100` | `text-primary` / `bg-primary/10` | brand |
| `via-yellow-400` | `via-warning` | gradient midpoint |

Anything not on this table: stop and decide deliberately which of the tiers
it belongs to. Do not invent new tokens without adding them to `index.css`
and to `docs/design-system.md` in Task 20.

- [ ] **Step 3: Run the guardrail and confirm the pages assertion passes**

Run: `npm run test -- design-system`

Expected: `pages use no raw Tailwind palette colors` now FAILS only on
`pages/Admin.jsx`. Temporarily confirm by running:

```bash
npm run test -- design-system 2>&1 | grep -E '^pages/' | grep -v Admin
```

Expected: no output.

- [ ] **Step 4: Run all four gates and commit**

```bash
npm run lint && npm run typecheck && npm run test && npm run build
git add src/pages
git commit -m "refactor: migrate public pages off raw Tailwind palette colors"
```

---

## Task 7: Migrate off-token colors in components

Same as Task 6 for `src/components/`, excluding `components/ui/` which is
vendored shadcn.

**Files:**
- Modify: `src/components/ValidatableContent.jsx` (`bg-orange-50`,
  `text-orange-800`), `src/components/ValidationOverlay.jsx`, and any other
  non-`ui/` component the guardrail flags

- [ ] **Step 1: List the violations**

```bash
npm run test -- design-system 2>&1 | grep -E '^components/' | grep -v 'components/ui/' | sort
```

- [ ] **Step 2: Apply the same mapping table from Task 6 Step 2**

- [ ] **Step 3: Confirm the components assertion passes**

Run: `npm run test -- design-system`

Expected: `components use no raw Tailwind palette colors outside ui/` PASSES.

- [ ] **Step 4: Run all four gates and commit**

```bash
npm run lint && npm run typecheck && npm run test && npm run build
git add src/components
git commit -m "refactor: migrate components off raw Tailwind palette colors"
```

---

## Task 8: Migrate raw buttons in public pages to `<Button>`

47 of the 71 raw `<button>` elements live in `pages/` outside `Admin.jsx`;
another 24 live in `components/`.

**Files:**
- Modify: `src/pages/{CalmingGrounding,Community,PTSDInfo2,CalmingBreathing,CalmingMuscle,Children,SelfHelp,PTSDInfo,SecondCircleTools,Rights,Treatment,Questionnaire}.jsx`

**Interfaces:**
- Consumes: `Button` and `buttonVariants` from `@/components/ui/button`.
  Existing variants: `default`, `destructive`, `outline`, `secondary`,
  `ghost`, `link`, `pill`, `pill-outline`, `pill-light`, `pill-green`.
  Existing sizes: `default`, `sm`, `lg`, `icon`, `pill`, `pill-lg`, `pill-xl`.
- Produces: no new interfaces

- [ ] **Step 1: Read the existing variants before touching a call site**

```bash
sed -n '1,60p' components/ui/button.jsx
```

The `pill*` variants already encode this site's CTA look. Most hero and
navigation buttons map onto them directly - do not add new variants until a
call site genuinely has no match.

- [ ] **Step 2: Migrate each site, preserving classes that are layout, not skin**

`<Button>` merges via `tailwind-merge`, so layout utilities (`w-full`,
`flex-1`, `mt-4`, `gap-2`) stay in `className`; appearance utilities
(`bg-*`, `rounded-*`, `shadow-*`, `font-*`, `px-*`, `h-*`) must move into a
variant. Example of the transformation:

```jsx
// before
<button
  onClick={start}
  className="px-10 py-4 bg-primary text-primary-foreground rounded-full font-medium text-lg hover:bg-primary/90 transition-colors duration-300 shadow-card hover:shadow-card-hover"
>
  {label}
</button>

// after
<Button onClick={start} variant="pill" size="pill-lg">
  {label}
</Button>
```

- [ ] **Step 3: Add a variant only where nothing fits**

If a call site has no matching variant, add one to the `cva` block in
`components/ui/button.jsx` with a comment naming the use case, in the style
of the existing `pill-green` comment. Never inline a one-off appearance
class at the call site - that is the pattern being removed.

- [ ] **Step 4: Verify no button lost its accessible name or handler**

```bash
npm run test
```

Expected: 48 original tests still pass. `ChatbotFAB.test.jsx` and
`ChatPanel.test.jsx` assert on interactive elements and will catch a dropped
handler.

- [ ] **Step 5: Confirm the assertion narrows to Admin only**

```bash
npm run test -- design-system 2>&1 | grep -E '^pages/' | grep '<button' | grep -v Admin
```

Expected: no output.

- [ ] **Step 6: Run all four gates and commit**

```bash
npm run lint && npm run typecheck && npm run test && npm run build
git add src/pages src/components/ui/button.jsx
git commit -m "refactor: migrate public page buttons to the Button primitive"
```

---

## Task 9: Migrate raw buttons in components

**Files:**
- Modify: `src/components/{ChatbotFAB,Navbar,FilterChip,RichTextEditor,LanguageSwitcher,ValidationOverlay,ValidatableContent}.jsx`

- [ ] **Step 1: List the sites**

```bash
grep -rn "<button" components/*.jsx components/chat/*.jsx
```

- [ ] **Step 2: Migrate using the same rules as Task 8 Step 2**

`ChatbotFAB` and `LanguageSwitcher` are floating/overlay controls - they are
most likely `variant="ghost"` or `size="icon"` with layout classes retained.

- [ ] **Step 3: Run the chat tests specifically, since they cover these components**

Run: `npm run test -- ChatbotFAB ChatPanel HeroChatInput`

Expected: PASS. These 22 tests exercise the components being edited.

- [ ] **Step 4: Run all four gates and commit**

```bash
npm run lint && npm run typecheck && npm run test && npm run build
git add src/components
git commit -m "refactor: migrate component buttons to the Button primitive"
```

---

## Task 10: Create the patterns tier and move existing components into it

**Files:**
- Create: `src/components/patterns/` (directory)
- Move: `src/components/{PageHeader,SectionBlock,ArchFrame,FilterChip}.jsx` -> `src/components/patterns/`
- Modify: every importer of those four

**Interfaces:**
- Consumes: nothing
- Produces: import paths change from `@/components/PageHeader` to
  `@/components/patterns/PageHeader`. Tasks 11-13 import from the new paths.

- [ ] **Step 1: Find every importer**

```bash
grep -rn "components/\(PageHeader\|SectionBlock\|ArchFrame\|FilterChip\)" --include=*.jsx pages components App.jsx
```

- [ ] **Step 2: Move with git**

```bash
mkdir -p components/patterns
git mv components/PageHeader.jsx components/patterns/PageHeader.jsx
git mv components/SectionBlock.jsx components/patterns/SectionBlock.jsx
git mv components/ArchFrame.jsx components/patterns/ArchFrame.jsx
git mv components/FilterChip.jsx components/patterns/FilterChip.jsx
```

- [ ] **Step 3: Update every importer found in Step 1**

- [ ] **Step 4: Run all four gates and commit**

```bash
npm run lint && npm run typecheck && npm run test && npm run build
git add -A src/components src/pages
git commit -m "refactor: introduce components/patterns tier"
```

---

## Task 11: Convert pattern variant maps to `cva`

`PageHeader` and `SectionBlock` already have variants - as hand-rolled object
literals (`SIZE_CLASSES`, `TONE_CLASSES`, `VARIANT_CLASSES`, `MAX_WIDTH`).
Converting them to `cva` makes the variant sets machine-readable, which Task
21 needs to generate the Figma component manifest.

**Files:**
- Modify: `src/components/patterns/PageHeader.jsx`
- Modify: `src/components/patterns/SectionBlock.jsx`
- Test: `src/test/patterns.test.jsx` (created here)

**Interfaces:**
- Consumes: `cva` from `class-variance-authority`, `cn` from `@/lib/utils`
- Produces: named exports `pageHeaderVariants` and `sectionBlockVariants`
  alongside the existing default exports. Task 21 imports these to read
  `.variants` for the manifest. **Prop names and accepted values must not
  change** - `size`, `align`, `tone` on `PageHeader`; `variant`, `maxWidth`,
  `padding` on `SectionBlock`.

- [ ] **Step 1: Write the failing test**

```jsx
// src/test/patterns.test.jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PageHeader, { pageHeaderVariants } from '@/components/patterns/PageHeader';
import SectionBlock, { sectionBlockVariants } from '@/components/patterns/SectionBlock';

describe('PageHeader', () => {
  it('exposes its variant config for the design system manifest', () => {
    expect(pageHeaderVariants.variants.size).toHaveProperty('editorial');
    expect(pageHeaderVariants.variants.tone).toHaveProperty('dark');
    expect(pageHeaderVariants.variants.align).toHaveProperty('start');
  });

  it('renders the title as the page h1', () => {
    render(<PageHeader title="כותרת" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('כותרת');
  });

  it('renders the eyebrow and subtitle when given', () => {
    render(<PageHeader title="כותרת" eyebrow="מסע" subtitle="תיאור" />);
    expect(screen.getByText('מסע')).toBeInTheDocument();
    expect(screen.getByText('תיאור')).toBeInTheDocument();
  });

  it('marks the background image decorative so screen readers skip it', () => {
    const { container } = render(<PageHeader title="כותרת" image="/hero.jpg" />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('aria-hidden', 'true');
    expect(img).toHaveAttribute('alt', '');
  });
});

describe('SectionBlock', () => {
  it('exposes its variant config for the design system manifest', () => {
    expect(sectionBlockVariants.variants.variant).toHaveProperty('primary');
    expect(sectionBlockVariants.variants.maxWidth).toHaveProperty('wide');
  });

  it('renders children inside a section landmark', () => {
    const { container } = render(<SectionBlock>תוכן</SectionBlock>);
    expect(container.querySelector('section')).toHaveTextContent('תוכן');
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm run test -- patterns`

Expected: FAIL - `pageHeaderVariants` is not exported.

- [ ] **Step 3: Convert `SectionBlock` to `cva`**

```jsx
import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Full-width colored band with a centered content container. Pages compose a
// vertical stack of these so each section reads as its own surface.
const sectionBlockVariants = cva('w-full', {
  variants: {
    variant: {
      canvas: 'bg-background',
      card: 'bg-card',
      muted: 'bg-muted',
      dark: 'bg-sanctuary text-sanctuary-foreground',
      primary: 'bg-primary text-primary-foreground',
    },
    padding: {
      none: '',
      default: 'py-16 sm:py-20',
      tight: 'py-10 sm:py-12',
      loose: 'py-24 sm:py-32',
    },
  },
  defaultVariants: { variant: 'canvas', padding: 'default' },
});

const innerVariants = cva('mx-auto px-5 sm:px-6', {
  variants: {
    maxWidth: {
      narrow: 'max-w-2xl',
      default: 'max-w-3xl',
      wide: 'max-w-5xl',
      full: 'max-w-7xl',
    },
  },
  defaultVariants: { maxWidth: 'default' },
});

export { sectionBlockVariants };

export default function SectionBlock({
  variant = 'canvas',
  maxWidth = 'default',
  padding = 'default',
  className = '',
  innerClassName = '',
  children,
}) {
  return (
    <section className={cn(sectionBlockVariants({ variant, padding }), className)}>
      <div className={cn(innerVariants({ maxWidth }), innerClassName)}>
        {children}
      </div>
    </section>
  );
}
```

**Migration hazard:** the old `padding` prop took a raw class string
(`'py-16 sm:py-20'`), not a variant key. Find every call site before
converting:

```bash
grep -rn "padding=" pages components | grep -i sectionblock
grep -rn -A5 "<SectionBlock" pages components | grep "padding="
```

Any call passing a raw string must be mapped onto `none`/`default`/`tight`/
`loose`, or a new named key added here. Passing an unmapped string silently
drops the padding.

- [ ] **Step 4: Convert `PageHeader` to `cva`**

Preserve every existing class string exactly - this is a mechanical
restructure, not a redesign. `SIZE_CLASSES` becomes three `cva` calls
(wrapper, title, subtitle) sharing a `size` variant; `TONE_CLASSES` becomes
the `tone` variant; `align` becomes a variant with `center` and `start`.
Keep the `image`, `imageOpacity`, `actions`, and `eyebrow` props and the
tone-dependent overlay gradient logic as plain JS - `cva` handles class
variance, not the computed `opacity` style.

- [ ] **Step 5: Run the tests to confirm they pass**

Run: `npm run test -- patterns`

Expected: PASS, 6 tests.

- [ ] **Step 6: Run all four gates and commit**

```bash
npm run lint && npm run typecheck && npm run test && npm run build
git add src/components/patterns src/test/patterns.test.jsx src/pages
git commit -m "refactor: express pattern variants through cva"
```

---

## Task 12: Extract `ContentCard`

The string `bg-card rounded-super border border-border p-6 shadow-card`
appears at least three times, with several near-variants differing only in
padding or shadow.

**Files:**
- Create: `src/components/patterns/ContentCard.jsx`
- Modify: `src/pages/{AdminLogin,Children,Community,Sources,SelfHelp}.jsx`
- Test: `src/test/patterns.test.jsx` (append)

**Interfaces:**
- Consumes: `cva`, `cn`
- Produces: default export `ContentCard`, named export `contentCardVariants`.
  Props: `elevation` (`flat` | `card` | `raised`), `padding` (`none` | `sm` |
  `default` | `lg`), `interactive` (boolean - adds hover lift), `as` (element
  type, default `'div'`), `className`, `children`.

- [ ] **Step 1: Write the failing test**

Append to `src/test/patterns.test.jsx`:

```jsx
import ContentCard, { contentCardVariants } from '@/components/patterns/ContentCard';

describe('ContentCard', () => {
  it('exposes its variant config for the design system manifest', () => {
    expect(contentCardVariants.variants.elevation).toHaveProperty('raised');
    expect(contentCardVariants.variants.padding).toHaveProperty('lg');
  });

  it('renders a div by default and honours the as prop', () => {
    const { container, rerender } = render(<ContentCard>תוכן</ContentCard>);
    expect(container.firstChild.tagName).toBe('DIV');
    rerender(<ContentCard as="article">תוכן</ContentCard>);
    expect(container.firstChild.tagName).toBe('ARTICLE');
  });

  it('lets callers override styling through className', () => {
    const { container } = render(<ContentCard className="max-w-xs">תוכן</ContentCard>);
    expect(container.firstChild).toHaveClass('max-w-xs');
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm run test -- patterns`

Expected: FAIL - cannot resolve `@/components/patterns/ContentCard`.

- [ ] **Step 3: Implement**

```jsx
// src/components/patterns/ContentCard.jsx
import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// The site's standard content surface. Replaces the hand-repeated
// "bg-card rounded-super border border-border p-6 shadow-card" string.
const contentCardVariants = cva(
  'bg-card border border-border rounded-super',
  {
    variants: {
      elevation: {
        flat: '',
        card: 'shadow-card',
        raised: 'shadow-card-hover',
      },
      padding: {
        none: '',
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
      },
      interactive: {
        true: 'transition-all duration-500 hover:shadow-card-hover hover:-translate-y-1',
        false: '',
      },
    },
    defaultVariants: { elevation: 'card', padding: 'default', interactive: false },
  }
);

export { contentCardVariants };

export default function ContentCard({
  as: Component = 'div',
  elevation,
  padding,
  interactive,
  className,
  children,
  ...props
}) {
  return (
    <Component
      className={cn(contentCardVariants({ elevation, padding, interactive }), className)}
      {...props}
    >
      {children}
    </Component>
  );
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `npm run test -- patterns`

Expected: PASS.

- [ ] **Step 5: Replace the hand-rolled card surfaces**

```bash
grep -rn "bg-card rounded-super\|rounded-super.*border-border" pages components | grep -v patterns/
```

Replace each with `<ContentCard>`, moving only layout classes into
`className`. Where a site differs only by padding or shadow, use the
matching variant rather than an override.

- [ ] **Step 6: Run all four gates and commit**

```bash
npm run lint && npm run typecheck && npm run test && npm run build
git add src/components/patterns src/test/patterns.test.jsx src/pages
git commit -m "feat: add ContentCard pattern and adopt it across pages"
```

---

## Task 13: Extract `TimerRing` and `ExerciseRunner`

`CalmingBreathing.jsx` (277 lines) and `CalmingMuscle.jsx` (416 lines) each
hand-roll an SVG progress ring and a phase/tick state machine.
`CalmingMuscle.jsx:246-247` also hardcodes two hex colors
(`#C07B5A`, `#7A9E8D`).

**Files:**
- Create: `src/components/patterns/TimerRing.jsx`
- Create: `src/components/patterns/ExerciseRunner.jsx`
- Modify: `src/pages/CalmingBreathing.jsx`, `src/pages/CalmingMuscle.jsx`
- Test: `src/test/patterns.test.jsx` (append)

**Interfaces:**
- Consumes: `cn`
- Produces:
  - `TimerRing({ progress, size, stroke, className, trackClassName, indicatorClassName })`
    where `progress` is `0..1`. Renders an SVG circle with
    `strokeDasharray`/`strokeDashoffset`. Colors come from `currentColor` or
    the passed class - never a hex literal.
  - `ExerciseRunner({ phases, onComplete, tickMs, render })` where `phases` is
    `[{ key, seconds, label }]`. Owns the interval, the current phase index,
    and elapsed progress; calls `render({ phase, phaseIndex, progress, running, start, stop, restart })`.

- [ ] **Step 1: Read both existing implementations before designing the shared one**

```bash
sed -n '100,135p' pages/CalmingBreathing.jsx
sed -n '240,280p' pages/CalmingMuscle.jsx
```

The two rings differ in size (`288`/`240` vs `208`) and in whether the color
changes by phase. The extracted component must cover both without a
`variant` per page.

- [ ] **Step 2: Write the failing test**

Append to `src/test/patterns.test.jsx`:

```jsx
import TimerRing from '@/components/patterns/TimerRing';

describe('TimerRing', () => {
  it('renders an svg sized to the size prop', () => {
    const { container } = render(<TimerRing progress={0} size={208} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '208');
    expect(svg).toHaveAttribute('height', '208');
  });

  it('draws no arc at progress 0 and a full arc at progress 1', () => {
    const { container, rerender } = render(<TimerRing progress={0} size={100} />);
    const indicator = () => container.querySelectorAll('circle')[1];
    const circumference = Number(indicator().getAttribute('stroke-dasharray'));
    expect(Number(indicator().getAttribute('stroke-dashoffset'))).toBeCloseTo(circumference, 1);
    rerender(<TimerRing progress={1} size={100} />);
    expect(Number(indicator().getAttribute('stroke-dashoffset'))).toBeCloseTo(0, 1);
  });

  it('is hidden from assistive tech, since the phase label carries the meaning', () => {
    const { container } = render(<TimerRing progress={0.5} size={100} />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `npm run test -- patterns`

Expected: FAIL - cannot resolve `@/components/patterns/TimerRing`.

- [ ] **Step 4: Implement `TimerRing`**

```jsx
// src/components/patterns/TimerRing.jsx
import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Circular progress indicator for timed exercises.
 * Color comes from the caller's classes so it follows the token layer -
 * never hardcode a hex here.
 *
 * @param {Object} props
 * @param {number} props.progress 0..1
 * @param {number} [props.size] px, the svg's width and height
 * @param {number} [props.stroke] px stroke width
 */
export default function TimerRing({
  progress,
  size = 208,
  stroke = 10,
  className,
  trackClassName = 'text-muted',
  indicatorClassName = 'text-primary',
}) {
  const radius = size / 2 - stroke / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, progress));
  const offset = circumference * (1 - clamped);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      className={cn('-rotate-90', className)}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
        stroke="currentColor"
        className={trackClassName}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
        stroke="currentColor"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className={cn('transition-[stroke-dashoffset] duration-100 ease-linear', indicatorClassName)}
      />
    </svg>
  );
}
```

- [ ] **Step 5: Run the tests to confirm they pass**

Run: `npm run test -- patterns`

Expected: PASS.

- [ ] **Step 6: Implement `ExerciseRunner` and adopt both**

Extract the shared interval/phase state machine. Both pages currently use
`TICK_MS = 100`. Replace `CalmingMuscle`'s `COLOR_SQUEEZE = '#C07B5A'` and
`COLOR_RELEASE = '#7A9E8D'` with `text-warning` and `text-success` passed as
`indicatorClassName`.

**Do not change any timing constant.** `SQUEEZE_SECS = 6`,
`RELEASE_SECS = 10`, and the breathing 4s-in/4s-out cycle are therapeutic
content, not styling. The `breathe` keyframe in `tailwind.config.js` is
commented as matching `CalmingBreathing.jsx` - keep them in sync.

- [ ] **Step 7: Run all four gates and commit**

```bash
npm run lint && npm run typecheck && npm run test && npm run build
git add src/components/patterns src/test/patterns.test.jsx src/pages
git commit -m "refactor: extract TimerRing and ExerciseRunner from the calming pages"
```

---

## Task 14: Extract `LinkGrid` and collapse the circle pages

`FirstCircle.jsx` (53 lines) and `SecondCircle.jsx` (53 lines) differ only in
their section list, hero image, tone, and translation keys.

**Files:**
- Create: `src/components/patterns/LinkGrid.jsx`
- Modify: `src/pages/FirstCircle.jsx`, `src/pages/SecondCircle.jsx`
- Test: `src/test/patterns.test.jsx` (append)

**Interfaces:**
- Consumes: `Link` from `react-router-dom`, `ContentCard` from Task 12
- Produces: `LinkGrid({ items, columns })` where `items` is
  `[{ key, path, label, description, image }]` and `columns` is `2` | `3`.
  Renders a responsive grid of `Link`-wrapped `ContentCard`s.

- [ ] **Step 1: Diff the two pages to confirm they are genuinely the same shape**

```bash
diff <(sed 's/First/X/g;s/first/x/g' pages/FirstCircle.jsx) \
     <(sed 's/Second/X/g;s/second/x/g' pages/SecondCircle.jsx)
```

Expected: differences confined to the section array, the `tone` prop, the
image constant, and translation keys. If anything structural differs, stop
and reassess - a forced abstraction over two genuinely different pages is
worse than the duplication.

- [ ] **Step 2: Write the failing test**

```jsx
import { MemoryRouter } from 'react-router-dom';
import LinkGrid from '@/components/patterns/LinkGrid';

describe('LinkGrid', () => {
  const items = [
    { key: 'self_help', path: '/self-help', label: 'עזרה עצמית' },
    { key: 'community', path: '/community', label: 'קהילה' },
  ];

  it('renders one link per item, pointing at its path', () => {
    render(<MemoryRouter><LinkGrid items={items} /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /עזרה עצמית/ })).toHaveAttribute('href', '/self-help');
    expect(screen.getByRole('link', { name: /קהילה/ })).toHaveAttribute('href', '/community');
  });

  it('renders nothing rather than crashing on an empty list', () => {
    const { container } = render(<MemoryRouter><LinkGrid items={[]} /></MemoryRouter>);
    expect(container.querySelectorAll('a')).toHaveLength(0);
  });
});
```

- [ ] **Step 3: Run it to confirm it fails, then implement and confirm it passes**

Run: `npm run test -- patterns`

Expected: FAIL, then after implementing, PASS.

- [ ] **Step 4: Rewrite both pages against `LinkGrid`**

Keep both files - they are separate routes with separate SEO entries in
`lib/seo.js` and `public/sitemap.xml`. Each becomes a short data declaration
plus `<PageHeader>` and `<LinkGrid>`. Do not merge them into one
parameterised route.

- [ ] **Step 5: Run all four gates and commit**

```bash
npm run lint && npm run typecheck && npm run test && npm run build
git add src/components/patterns src/test/patterns.test.jsx src/pages
git commit -m "refactor: extract LinkGrid and rebuild the circle pages on it"
```

---

## Task 15: Add the `useDirection` hook

Replaces four duplicated DOM reads that do not react to a language change.

**Files:**
- Create: `src/lib/useDirection.js`
- Test: `src/test/useDirection.test.jsx`
- Modify: `src/pages/{SelfHelp,Questionnaire,Home}.jsx`, `src/components/LanguageSwitcher.jsx`

**Interfaces:**
- Consumes: `useLang` from `@/lib/LanguageContext`, `dirFor` (or the
  equivalent direction lookup) from `@/lib/i18n` - `lib/i18n.js:1147` already
  returns a direction for a language code. Read that function's real exported
  name before importing it.
- Produces: `useDirection()` returning `{ dir, isRTL }` where `dir` is
  `'rtl' | 'ltr'` and `isRTL` is a boolean.

- [ ] **Step 1: Read the existing direction source**

```bash
sed -n '1,10p' lib/i18n.js
sed -n '1140,1155p' lib/i18n.js
grep -n "export" lib/LanguageContext.jsx
```

`lib/i18n.js` declares `dir` per language (`he` and `ar` are `rtl`) and has a
lookup at line 1147. Use it rather than duplicating the language list.

- [ ] **Step 2: Write the failing test**

```jsx
// src/test/useDirection.test.jsx
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { LanguageProvider } from '@/lib/LanguageContext';
import useDirection from '@/lib/useDirection';

// Adjust the wrapper to LanguageProvider's real prop for setting a language -
// read lib/LanguageContext.jsx first.
const wrapper = (lang) => ({ children }) => (
  <LanguageProvider initialLang={lang}>{children}</LanguageProvider>
);

describe('useDirection', () => {
  it('reports rtl for Hebrew', () => {
    const { result } = renderHook(() => useDirection(), { wrapper: wrapper('he') });
    expect(result.current).toEqual({ dir: 'rtl', isRTL: true });
  });

  it('reports rtl for Arabic', () => {
    const { result } = renderHook(() => useDirection(), { wrapper: wrapper('ar') });
    expect(result.current.isRTL).toBe(true);
  });

  it('reports ltr for English', () => {
    const { result } = renderHook(() => useDirection(), { wrapper: wrapper('en') });
    expect(result.current).toEqual({ dir: 'ltr', isRTL: false });
  });
});
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `npm run test -- useDirection`

Expected: FAIL - cannot resolve `@/lib/useDirection`.

- [ ] **Step 4: Implement**

```js
// src/lib/useDirection.js
import { useLang } from '@/lib/LanguageContext';
import { dirFor } from '@/lib/i18n';

/**
 * Text direction for the active language.
 *
 * Reads from LanguageContext rather than document.documentElement, so it
 * re-renders on a language switch. The four hand-rolled
 * `document.documentElement.getAttribute('dir')` reads it replaces did not.
 *
 * @returns {{ dir: 'rtl' | 'ltr', isRTL: boolean }}
 */
export default function useDirection() {
  const { lang } = useLang();
  const dir = dirFor(lang);
  return { dir, isRTL: dir === 'rtl' };
}
```

If `lib/i18n.js` does not export the lookup under this name, export it there
first rather than re-implementing the language table.

- [ ] **Step 5: Run the tests to confirm they pass**

Run: `npm run test -- useDirection`

Expected: PASS, 3 tests.

- [ ] **Step 6: Replace the four DOM reads**

In `SelfHelp.jsx:81-82`, `Questionnaire.jsx:57-58`, `Home.jsx:53-54`, and
`LanguageSwitcher.jsx:11`:

```jsx
// before
const isRTL = document.documentElement.getAttribute('dir') === 'rtl';
const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

// after
const { isRTL } = useDirection();
const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
```

- [ ] **Step 7: Confirm the guardrail assertion passes**

Run: `npm run test -- design-system`

Expected: `reads direction through useDirection(), not the DOM` PASSES.

- [ ] **Step 8: Run all four gates and commit**

```bash
npm run lint && npm run typecheck && npm run test && npm run build
git add src/lib/useDirection.js src/test/useDirection.test.jsx src/pages src/components
git commit -m "feat: add useDirection hook, replacing four non-reactive DOM reads"
```

---

## Task 16: Convert physical direction utilities to logical

12 occurrences. In an RTL-first site these are latent bugs: every `pr-2` is
correct in English and wrong in Hebrew. The codebase already uses logical
properties in most places, so this is a small task - the earlier "~80" estimate
was a bad grep that matched `rounded-lg` with the pattern `rounded-l`.

**Files:**
- Modify: every file under `src/pages/` and `src/components/` outside
  `components/ui/`

**Interfaces:**
- Consumes: `useDirection` from Task 15
- Produces: no new interfaces

- [ ] **Step 1: List the violations**

```bash
npm run test -- design-system 2>&1 | grep -E 'ml-|mr-|pl-|pr-|left-|right-|text-left|text-right'
```

- [ ] **Step 2: Apply the conversion**

| Physical | Logical |
|---|---|
| `ml-4` | `ms-4` |
| `mr-4` | `me-4` |
| `pl-3` | `ps-3` |
| `pr-3` | `pe-3` |
| `left-0` | `start-0` |
| `right-0` | `end-0` |
| `text-left` | `text-start` |
| `text-right` | `text-end` |
| `rounded-l-md` | `rounded-s-md` |
| `rounded-r-md` | `rounded-e-md` |
| `border-l` | `border-s` |

- [ ] **Step 3: Handle the deliberate exceptions**

Some are genuinely physical and must stay. Each keeps its physical class
plus a comment explaining why:

- `left-1/2` paired with `-translate-x-1/2` for centering - this is geometry,
  not direction. 9 occurrences.
- `ChatbotFAB.jsx:15` sets `dir="ltr"` explicitly on a `fixed bottom-6 left-6`
  element - confirm whether the FAB is intended to stay bottom-left in Hebrew.
  This is a product question: ask before changing it.
- `LanguageSwitcher.jsx:29` already branches on `isRTL` to pick
  `left-0`/`right-0`. Replace the whole branch with `start-0` - the branch
  exists only because the class was physical.
- `RichTextEditor.jsx` and `ValidatableContent.jsx` hardcode `dir="rtl"` on
  admin-authored content. Leave them; admin content is Hebrew-only.

Add the surviving exceptions to an allowlist in the `PHYSICAL` check in
`design-system.test.jsx` so the guardrail can reach zero honestly. Do not
weaken the pattern - list specific `file:line` exemptions.

- [ ] **Step 4: Confirm the guardrail assertion passes**

Run: `npm run test -- design-system`

Expected: `uses logical direction utilities, not physical ones` PASSES.

- [ ] **Step 5: Manually verify direction in both modes**

```bash
npm run dev
```

Open `http://localhost:5173`, then switch language between Hebrew and
English on: Home, Self-Help, Questionnaire, Community, Sources. Confirm no
element jumps to the wrong side and nothing overlaps. Note: Google sign-in
does not work on localhost (localhost is not an authorized OAuth origin), so
`/admin` cannot be checked this way - it is verified in Task 19.

- [ ] **Step 6: Run all four gates and commit**

```bash
npm run lint && npm run typecheck && npm run test && npm run build
git add src/pages src/components src/test/design-system.test.jsx
git commit -m "refactor: convert physical direction utilities to logical properties"
```

---

## Task 17: Admin - colors and cards

`Admin.jsx` is 1839 lines with no test coverage, so it is split across three
tasks and sequenced last. Colors first: the lowest-risk of the three.

**Files:**
- Modify: `src/pages/Admin.jsx`

- [ ] **Step 1: List the violations**

```bash
npm run test -- design-system 2>&1 | grep 'Admin'
```

- [ ] **Step 2: Apply the Task 6 Step 2 mapping table**

`Admin.jsx` holds most of the `zinc-*` usage - the admin panel was styled
against a neutral gray scale rather than the site tokens.

- [ ] **Step 3: Confirm the colors assertion passes fully**

Run: `npm run test -- design-system`

Expected: both `off-token colors` assertions PASS.

- [ ] **Step 4: Run all four gates and commit**

```bash
npm run lint && npm run typecheck && npm run test && npm run build
git add src/pages/Admin.jsx
git commit -m "refactor: migrate Admin off raw Tailwind palette colors"
```

---

## Task 18: Admin - buttons and inputs

The remaining 28 raw buttons.

**Files:**
- Modify: `src/pages/Admin.jsx`

**Interfaces:**
- Consumes: `Button` from `@/components/ui/button`, `Input` from
  `@/components/ui/input`, `ContentCard` from Task 12

- [ ] **Step 1: Inventory the buttons by role before editing**

```bash
grep -n "<button" pages/Admin.jsx
```

Admin buttons cluster into: save/submit (`variant="default"`), delete
(`variant="destructive"` or `variant="ghost"` with `text-destructive`), icon
actions (`size="icon" variant="ghost"`), and panel tabs. Classify all 28
before changing any, so the same role gets the same variant.

- [ ] **Step 2: Migrate, preserving every `onClick`, `type`, `disabled`, and `title`**

`Admin.jsx` performs real writes against the live API. A dropped `type="button"`
inside a form turns a delete control into a form submit. Check each converted
element keeps its exact props.

- [ ] **Step 3: Migrate the repeated input class**

The string `w-full px-3 py-2 rounded-lg border border-border bg-background text-sm`
appears three times. Replace with `<Input>` from `@/components/ui/input`,
adding a variant there if the sizing does not match.

- [ ] **Step 4: Confirm the buttons assertion passes**

Run: `npm run test -- design-system`

Expected: `pages render no bare <button> elements` PASSES.

- [ ] **Step 5: Run all four gates and commit**

```bash
npm run lint && npm run typecheck && npm run test && npm run build
git add src/pages/Admin.jsx src/components/ui
git commit -m "refactor: migrate Admin buttons and inputs to primitives"
```

---

## Task 19: Verify Admin against the live API

`Admin.jsx` has no automated coverage and performs authenticated writes. The
four gates cannot prove it works.

**Files:**
- None (verification only)

- [ ] **Step 1: Build and check the bundle**

```bash
npm run build
```

- [ ] **Step 2: Exercise the admin panel on the deployed URL**

Google sign-in is the only login path and localhost is not an authorized
OAuth origin, so this must run against the deployed site, not `npm run dev`.
Coordinate with the repo owner - this needs a deploy of the branch state.

For each of the 9 content panels, verify: the list loads, an edit saves and
persists after reload, a delete prompts and removes, and the rich-text editor
round-trips Markdown through `mdToHtml`/`htmlToMd` without corrupting
content.

- [ ] **Step 3: If any panel regressed, fix and re-verify before proceeding**

- [ ] **Step 4: Commit any fixes**

```bash
git add src/pages/Admin.jsx
git commit -m "fix: correct Admin regressions found in live verification"
```

---

## Task 20: Write the design system document

The written contract for both the repo owner and the designer.

**Files:**
- Create: `docs/design-system.md`

- [ ] **Step 1: Document the token layer**

Every custom property in `index.css` `:root`, in a table: token name, HSL
value, resolved hex, Tailwind class, and what it means. Include the semantic
and categorical tokens added in Task 2, and state the rule that
`--category-*` carries no good/bad meaning.

- [ ] **Step 2: Document the three tiers and their rules**

State for each of `ui/`, `patterns/`, and `pages/`: what belongs there, what
is forbidden, and where colors may come from. Include the enforced rules and
name `src/test/design-system.test.jsx` as their enforcement.

- [ ] **Step 3: Document every component and its variants**

For each primitive and pattern: import path, props table, every variant and
size with what it is for, and a usage example. Read each `cva` block for the
authoritative variant list rather than writing from memory.

- [ ] **Step 4: Document typography, spacing, radii, and shadows**

The `Fredoka` font at all three roles, the `18px` root font size and why (the
comment in `index.css` says it is deliberate for readability, and all `rem`
values derive from it), the `fontSize` scale with its line heights, the
`rounded-super` radii, and the `atmospheric`/`card` shadow scale.

- [ ] **Step 5: Document the RTL contract**

One component in code via logical properties; LTR and RTL variants in Figma.
List the deliberate physical-direction exceptions from Task 16 Step 3.

- [ ] **Step 6: Commit**

```bash
git add docs/design-system.md
git commit -m "docs: add the design system reference"
```

---

## Task 21: Generate the Figma token export

Generated from `index.css` rather than hand-written, so it cannot drift.

**Files:**
- Create: `scripts/build-design-tokens.mjs`
- Create: `docs/design-tokens.json`
- Modify: `src/package.json` (add the `tokens` script)

**Interfaces:**
- Consumes: `src/index.css`, `src/tailwind.config.js`
- Produces: `docs/design-tokens.json` in W3C Design Tokens Community Group
  format - every token an object with `$value` and `$type`, grouped by
  `color`, `typography`, `spacing`, `radius`, `shadow`.

- [ ] **Step 1: Write the generator**

Parse the `:root` block of `src/index.css` for custom properties. Convert
each HSL triple (`268 42% 52%`) to hex, since Figma variables take hex.
Group by prefix. The script must fail loudly on a property it cannot parse
rather than silently emitting a wrong color.

- [ ] **Step 2: Add the script to `package.json`**

```json
    "tokens": "node ../scripts/build-design-tokens.mjs"
```

- [ ] **Step 3: Generate and verify**

```bash
npm run tokens
```

Spot-check three values against `index.css` by hand: `--primary`
(`268 42% 52%` should emit `#8050B8`), `--background` (`270 50% 96%` ->
`#F5F0FA`), and `--destructive`. If any is off, the HSL-to-hex conversion is
wrong - fix it before proceeding, since every downstream Figma variable
depends on it.

- [ ] **Step 4: Verify the JSON parses and has the expected shape**

```bash
node -e "const t=require('./docs/design-tokens.json'); console.log(Object.keys(t)); console.log(t.color.primary)"
```

- [ ] **Step 5: Commit**

```bash
git add scripts/build-design-tokens.mjs docs/design-tokens.json src/package.json
git commit -m "feat: generate W3C design token export for Figma"
```

---

## Task 22: Write the Figma handoff document

The designer runs this on **her own machine**, with her own Claude Code,
Figma MCP, and GitHub access. Nothing in this repo writes to Figma.

**Files:**
- Create: `docs/figma-handoff.md`

- [ ] **Step 1: Write the prerequisites section**

She needs: the repo cloned, Claude Code with the Figma MCP connected to her
own account, and a Figma file to build into. State explicitly that the token
file and component manifest are the inputs, and that she should not
hand-copy values out of the CSS.

- [ ] **Step 2: Write the import procedure**

Step-by-step: import `docs/design-tokens.json` as Figma variables, then
generate the component library from the manifest. Reference the
`/figma-generate-library` skill that ships with the Figma plugin. Name the
collection so it matches the token groups.

- [ ] **Step 3: Specify the LTR/RTL variant requirement**

Every component in the Figma library carries `direction=LTR` and
`direction=RTL` variants, because Figma does not auto-mirror. Explain that
the code side needs no such variant - logical properties handle it - so an
RTL Figma variant maps to the *same* React component, not a second one.

- [ ] **Step 4: Specify the round-trip**

How a change she makes in Figma comes back: which values are safe to change
in Figma and re-export (token values), and which require a code change
(adding a variant, changing a component's structure). State that
`docs/design-tokens.json` is generated - editing it by hand is overwritten by
`npm run tokens`, so a token change starts in `src/index.css`.

- [ ] **Step 5: Commit**

```bash
git add docs/figma-handoff.md
git commit -m "docs: add the Figma handoff procedure"
```

---

## Task 23: Lock it in

Without enforcement this decays back within months.

**Files:**
- Modify: `src/eslint.config.js`
- Modify: `AGENTS.md`

- [ ] **Step 1: Confirm the full guardrail suite is green**

Run: `npm run test -- design-system`

Expected: all five assertions PASS. If any still fails, the corresponding
task is incomplete - go back rather than weakening the test.

- [ ] **Step 2: Add the ESLint rule**

Add a `no-restricted-syntax` rule to `src/eslint.config.js` scoped to
`pages/**` and `components/**` (excluding `components/ui/**`), rejecting
JSX `className` string literals that match the raw Tailwind palette pattern.
The message must name the fix: "Use a semantic token - see
docs/design-system.md".

The vitest guardrail catches this at test time; the ESLint rule catches it in
the editor, before the commit. Both are worth having.

- [ ] **Step 3: Verify the rule fires**

Temporarily add `<div className="bg-red-500" />` to a page and run
`npm run lint`. Expected: the rule reports it. Remove the line.

- [ ] **Step 4: Document the tiers in `AGENTS.md`**

Add a "Design system" section stating the three tiers, the no-raw-colors and
no-raw-buttons rules, the logical-properties rule, and pointing at
`docs/design-system.md`.

- [ ] **Step 5: Correct the false testing claim in `AGENTS.md`**

The file currently states: "There is no test runner configured. Don't claim
'tests pass' - there are none." This is false - `vitest` is installed and
`src/test/` holds 12 test files. Replace it with the real instruction: run
`npm run test` from `src/`, and note that `Admin.jsx` has no coverage and
needs manual verification against the live API.

- [ ] **Step 6: Run all four gates and commit**

```bash
npm run lint && npm run typecheck && npm run test && npm run build
git add src/eslint.config.js AGENTS.md
git commit -m "chore: enforce design system rules in lint and document them"
```

---

## Verification

The work is complete when, from `src/`:

- `npm run lint` - clean
- `npm run typecheck` - clean
- `npm run test` - the original 48 tests plus the new guardrail, pattern, and
  hook tests all pass
- `npm run build` - succeeds
- `grep -rE '\b(text|bg|border)-(teal|clay|sage|oatmeal|midnight)' pages components` - no output
- Manual: Hebrew and English render correctly on Home, Self-Help,
  Questionnaire, Community, Sources
- Manual: all 9 admin panels load, save, and delete against the live API
- `docs/design-system.md`, `docs/design-tokens.json`, and
  `docs/figma-handoff.md` exist and are consistent with the code
