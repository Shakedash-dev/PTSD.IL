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
| `docs/design-tokens.json` | Every colour, radius, font stack and shadow, in W3C Design Tokens format. Import as Figma variables. |
| `docs/design-system.md` | The component contract: every component, its variants, and when to use which. |
| `src/components/ui/` | The primitives. Each one's `cva` block is the authoritative variant list. |
| `src/components/patterns/` | The composed patterns. |

`design-tokens.json` is **generated** from `src/index.css`. Editing it by hand
is pointless - the next `npm run tokens` overwrites it. A token change starts in
`src/index.css`.

---

## Setup

1. Clone the repo, or pull the latest `master`.
2. Have Claude Code with the Figma MCP connected to **your own** Figma account.
3. Create (or pick) the Figma file the library will live in.

## Building the library

Ask your Claude Code, in the repo directory:

> Read `docs/design-tokens.json` and `docs/design-system.md`. Import the tokens
> as Figma variables into <file>, then generate a component library matching the
> components documented there.

It should use the `/figma-generate-library` skill that ships with the Figma
plugin. Two things to get right:

**Variable collections should mirror the token groups** - `color`, `radius`,
`font`, `shadow` - so a later re-import updates in place instead of creating
duplicates. Within `color`, the names carry the grouping already
(`category-1`, `success-foreground`, and so on).

**Every component needs LTR and RTL variants.** Figma does not auto-mirror.
This is the one place the Figma library is deliberately larger than the code:
in code, one component handles both directions through logical properties
(`ms-`, `ps-`, `start-`), so **an RTL Figma variant maps to the same React
component, not a second one**. It is a direction property on one component, not
two components.

Hebrew is the primary language, so build the RTL variant first and treat LTR as
the mirror, not the other way round.

---

## Round trip

**Changing a token value** - a colour, a radius, a font:

1. Change it in Figma to try it out.
2. To land it, the same change goes into `src/index.css`, then `npm run tokens`
   from `src/` regenerates `design-tokens.json`.
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
