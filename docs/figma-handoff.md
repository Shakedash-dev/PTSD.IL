# Figma handoff

How the design system in this repo becomes a Figma library.

**This runs on the designer's machine, not on the developer's.** Nothing in this
repo writes to Figma. The repo produces two inputs - a token file and a
component contract - and Figma is built from them locally. The only thing that
crosses machines is git.

---

## What you get from the repo

| File | What it is |
|---|---|
| `figma-plugin/` | A Figma plugin you import and run - builds the whole library. Start here. |
| `docs/design-tokens.json` | Every colour, radius, font stack and shadow, in W3C Design Tokens format. |
| `docs/figma/component-specs.json` | Exact resolved geometry and colour per component variant, from the compiled CSS. |
| `docs/design-system.md` | The component contract: every component, its variants, and when to use which. |
| `src/components/ui/` | The primitives. Each one's `cva` block is the authoritative variant list. |
| `src/components/patterns/` | The composed patterns. |

`design-tokens.json`, `component-specs.json` and `figma-plugin/code.js` are all
**generated**. Editing them by hand is pointless - the next `npm run figma`
overwrites them. A token change starts in `src/index.css`.

---

## Building the library

There is a plugin in the repo that builds the whole thing. You run it yourself,
in your own Figma - nothing in this repo touches your account.

1. Clone the repo, or pull the latest `master`.
2. In the Figma **desktop app**, open the file you want the system in.
3. **Plugins → Development → Import plugin from manifest…**, pick
   `figma-plugin/manifest.json`.
4. **Plugins → Development → PTSD.IL Design System.**

It adds a **Design system** page (Button and ChoiceChip component sets, each with
LTR and RTL variants, plus a board of all 43 colour tokens), a **Pages** page
(eight desktop frames using the site's real Hebrew copy), and a **PTSD.IL
Tokens** variable collection with component fills bound to it. Nothing else in
the file is touched. Full detail in `figma-plugin/README.md`.

Enable **Fredoka** in the file first - it is the site's typeface. Without it the
plugin falls back to Inter and tells you.

**Why a plugin rather than a .fig file:** `.fig` is a proprietary binary format
that cannot be generated outside Figma. The plugin API produces real variables
and real component sets, which is better than anything an SVG or image import
would give you - those arrive flattened and uneditable.

**Why every component carries LTR and RTL variants.** Figma does not auto-mirror.
This is the one place the Figma library is deliberately larger than the code: in
code, one component handles both directions through logical properties (`ms-`,
`ps-`, `start-`), so **an RTL Figma variant maps to the same React component, not
a second one**. It is a direction property on one component, not two components.

Hebrew is the primary language, so RTL is the reference and LTR the mirror.

## Where the fidelity comes from

The plugin does not guess at Tailwind classes. `scripts/build-figma-specs.mjs`
resolves every component variant against the CSS Vite actually ships:

- the app's own `cva` and `tailwind-merge` produce each variant's real final
  class list;
- those classes are looked up in the compiled stylesheet, so the declarations
  are the ones the browser applies;
- `rem` is converted at this project's **18px** root, not the 16px default -
  a spec built on the wrong root would be 12.5% out on every measurement;
- `hsl(var(--token))` resolves to hex through the token export.

The result is `docs/figma/component-specs.json`: exact geometry and colour for
every variant, with nothing left unresolved. The Figma library contains the 23
Button combinations, 4 ChoiceChip and 4 Disclosure variants the site actually
renders, rather than the full 936-way matrix, which no designer could use.

**What cannot match, by nature:** hover, focus and disabled states, transitions,
and responsive breakpoints - a static Figma frame has no such concept. Page
frames are built at the desktop breakpoint. Font rasterisation also differs
between Figma and a browser.

---

## Seeing the admin panel

The admin panel is behind Google sign-in, which does not work on a local dev
server. To let it be designed anyway, it opens locally without signing in:

```bash
cd src && npm install && npm run dev
```

then open `http://localhost:5173/admin`. It is read-only, filled with obvious
sample data, and marked with a banner. Saving and deleting are disabled. This
exists only on a dev server - it is not present in the deployed site.

The rest of the site runs from the same dev server against the live content API,
so every public page shows real content.

## Round trip

**Changing a token value** - a colour, a radius, a font:

1. Change it in Figma to try it out.
2. To land it, the same change goes into `src/index.css`, then `npm run figma`
   from `src/` rebuilds the CSS and regenerates the tokens, the specs and the
   plugin.
3. Both sides now agree, and every component using that token follows
   automatically.

**Adding or changing a component variant** needs a code change - a new entry in
that component's `cva` block, plus a line in `docs/design-system.md`. Design it
in Figma first, then hand it over as "Button needs a variant that looks like X,
for Y".

**Restructuring a component** - different markup, not just different paint -
is a code change too. Describe the intent rather than the pixels; the developer
picks the implementation.

Rough guide to which side a change starts on:

| Change | Starts in |
|---|---|
| A colour, radius, shadow, font | `src/index.css`, mirrored in Figma |
| A new size or look for an existing component | Figma, then a `cva` variant |
| A new component | Figma, then `components/patterns/` |
| Layout of a specific page | Figma, then that page |

---

## Rules the code enforces

Worth knowing, because they constrain what a design can ask for:

- **Colour only comes from tokens.** There is no way to use an arbitrary hex in
  a page - a test rejects it. If a design needs a colour that is not in the
  token set, the token set gains it; it does not get sprinkled inline.
- **Status colours and category colours are different things.** `success`,
  `warning`, `destructive`, `info` mean something. `category-1` … `category-5`
  are for unordered kinds - source categories, meeting types, tabs - and carry
  no good/bad meaning. Do not use one for the other.
- **Text on a coloured surface uses that surface's `-foreground` token**, so
  lightening a background keeps its text readable automatically.
- **Disabled controls go muted, not transparent.** The site convention is a
  muted background with `cursor-not-allowed`, so a disabled control reads as
  "not yet" rather than as decoration.
- **The root font size is 18px, not 16px.** Deliberate, for readability. Every
  `rem` derives from it, so a size in Figma at 16px-root will look small here.

Full detail in `docs/design-system.md`.
