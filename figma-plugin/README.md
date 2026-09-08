# PTSD.IL Design System - Figma plugin

Builds the design system into a Figma file: colour variables, component sets,
and page frames. Everything it draws comes from numbers resolved out of the CSS
the site actually ships, so it matches the running site rather than an
approximation of it.

You run it yourself, in your own Figma. Nothing in this repo touches your
account.

## Running it

1. Clone the repo (or pull the latest `master`).
2. In the Figma **desktop app**, open the file you want the system in.
3. **Menu → Plugins → Development → Import plugin from manifest…**
4. Choose `figma-plugin/manifest.json` in the repo.
5. **Plugins → Development → PTSD.IL Design System.**

It adds two pages and leaves everything else alone:

- **Design system** - Button and ChoiceChip component sets (each with LTR and
  RTL variants), and a board of all 43 colour tokens.
- **Pages** - eight 1440x1024 page frames using the site's real Hebrew copy.

It also creates a **PTSD.IL Tokens** variable collection, and binds component
fills to those variables where Figma allows it - so changing a variable updates
every component that uses it.

## Fonts

The site uses **Fredoka**. If it is not enabled in your Figma, the plugin falls
back to Inter and says so. For an exact match, enable Fredoka first.

## What it does and does not reproduce

Matches exactly: every colour, corner radius, padding, font size, weight and
line height, shadows, and the variant structure.

Cannot be reproduced in a static Figma frame, by nature: hover and focus states,
transitions, `:disabled` styling, and responsive breakpoints. Page frames are
built at the desktop breakpoint, using the `sm:`/`lg:` type sizes where the CSS
defines them.

## Regenerating

`code.js` is generated - do not edit it. After a token or component change:

```bash
cd src && npm run figma
```

That rebuilds the CSS, regenerates `docs/design-tokens.json` and
`docs/figma/component-specs.json`, and rewrites this plugin. Re-import it in
Figma to pick up the change.

## If it fails

The plugin stops with a specific message rather than quietly producing a file
that does not match. `missing spec …` means the plugin is older than the
components - re-run `npm run figma`.

Its logic is covered by `src/test/figma-plugin.test.jsx`, which runs it against
a mock Figma API. That catches missing specs and bad geometry, but it cannot
verify real Figma API behaviour - the first run in Figma is the real test.
