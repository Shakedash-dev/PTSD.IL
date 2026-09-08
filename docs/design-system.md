# Design system

The written contract for how this site is styled. It has three parts: a token
layer, a three-tier component structure, and a set of rules that tests enforce.

- **Colour lives in `src/index.css`.** Nothing else defines a colour.
- **Components live in three tiers.** Primitives, patterns, pages.
- **The rules are enforced**, by `src/test/design-system.test.jsx`. A pull
  request that breaks one fails.

For the Figma side, see `figma-handoff.md`. Machine-readable tokens are in
`design-tokens.json`, generated from the CSS - never hand-edited.

---

## 1. Tokens

Every colour is an HSL triple declared on `:root` in `src/index.css`.
`tailwind.config.js` maps each Tailwind colour name onto one of them, so
`bg-primary` and `text-primary` both follow a single edit.

**To change a colour, edit `src/index.css` and run `npm run tokens`** (from
`src/`). That regenerates `docs/design-tokens.json` for Figma. Never write a
literal hex into `tailwind.config.js` or a component - a literal cannot follow a
token change, which is exactly how the palette drifted green-on-lavender before
this system existed.

The hex below is what each HSL actually renders. Some differ by about 1/255 from
hex values written in older comments, because the triples were produced by
rounding an earlier hex palette.

#### Surfaces

| Token | Tailwind class | Value | Hex |
|---|---|---|---|
| `--background` | `bg-background` / `text-background` | `270 50% 96%` | `#f5f0fa` |
| `--foreground` | `bg-foreground` / `text-foreground` | `268 41% 16%` | `#28183a` |
| `--card` | `bg-card` / `text-card` | `283 100% 99%` | `#fefaff` |
| `--card-foreground` | `bg-card-foreground` / `text-card-foreground` | `268 25% 38%` | `#5f4979` |
| `--popover` | `bg-popover` / `text-popover` | `283 100% 99%` | `#fefaff` |
| `--popover-foreground` | `bg-popover-foreground` / `text-popover-foreground` | `268 25% 38%` | `#5f4979` |
| `--muted` | `bg-muted` / `text-muted` | `263 33% 92%` | `#e9e4f1` |
| `--muted-foreground` | `bg-muted-foreground` / `text-muted-foreground` | `268 25% 38%` | `#5f4979` |
| `--border` | `bg-border` / `text-border` | `270 34% 82%` | `#d1c1e1` |
| `--input` | `bg-input` / `text-input` | `270 34% 82%` | `#d1c1e1` |
| `--ring` | `bg-ring` / `text-ring` | `268 42% 52%` | `#8151b8` |

#### Brand

| Token | Tailwind class | Value | Hex |
|---|---|---|---|
| `--primary` | `bg-primary` / `text-primary` | `268 42% 52%` | `#8151b8` |
| `--primary-foreground` | `bg-primary-foreground` / `text-primary-foreground` | `270 50% 96%` | `#f5f0fa` |
| `--secondary` | `bg-secondary` / `text-secondary` | `341 42% 60%` | `#c46e89` |
| `--secondary-foreground` | `bg-secondary-foreground` / `text-secondary-foreground` | `270 50% 96%` | `#f5f0fa` |
| `--accent` | `bg-accent` / `text-accent` | `265 43% 44%` | `#6840a0` |
| `--accent-foreground` | `bg-accent-foreground` / `text-accent-foreground` | `270 50% 96%` | `#f5f0fa` |
| `--sanctuary` | `bg-sanctuary` / `text-sanctuary` | `268 41% 16%` | `#28183a` |
| `--sanctuary-foreground` | `bg-sanctuary-foreground` / `text-sanctuary-foreground` | `270 50% 96%` | `#f5f0fa` |

#### Status

| Token | Tailwind class | Value | Hex |
|---|---|---|---|
| `--destructive` | `bg-destructive` / `text-destructive` | `0 55% 48%` | `#be3737` |
| `--destructive-foreground` | `bg-destructive-foreground` / `text-destructive-foreground` | `0 0% 98%` | `#fafafa` |
| `--success` | `bg-success` / `text-success` | `152 45% 30%` | `#2a6f4f` |
| `--success-foreground` | `bg-success-foreground` / `text-success-foreground` | `270 50% 96%` | `#f5f0fa` |
| `--warning` | `bg-warning` / `text-warning` | `28 70% 38%` | `#a55c1d` |
| `--warning-foreground` | `bg-warning-foreground` / `text-warning-foreground` | `270 50% 96%` | `#f5f0fa` |
| `--info` | `bg-info` / `text-info` | `210 60% 38%` | `#27619b` |
| `--info-foreground` | `bg-info-foreground` / `text-info-foreground` | `270 50% 96%` | `#f5f0fa` |

#### Categorical

| Token | Tailwind class | Value | Hex |
|---|---|---|---|
| `--category-1` | `bg-category-1` / `text-category-1` | `268 42% 52%` | `#8151b8` |
| `--category-2` | `bg-category-2` / `text-category-2` | `341 45% 42%` | `#9b3b59` |
| `--category-3` | `bg-category-3` / `text-category-3` | `152 45% 30%` | `#2a6f4f` |
| `--category-4` | `bg-category-4` / `text-category-4` | `28 70% 38%` | `#a55c1d` |
| `--category-5` | `bg-category-5` / `text-category-5` | `210 60% 38%` | `#27619b` |

#### Type, radius, shadow

| Group | Values |
|---|---|
| Font | `--font-heading`, `--font-body`, `--font-display` are all **Fredoka**; `--font-mono` is the system mono stack. Classes: `font-heading`, `font-body`, `font-display`, `font-mono`. |
| Root size | `html { font-size: 18px }` - deliberately larger than the 16px default, for readability. **Every `rem` in the project derives from this**, so changing it rescales the whole site. |
| Radius | `--radius: 1rem` feeds `rounded-lg/md/sm`. `rounded-super` is `2rem`, `rounded-super-sm` is `1.25rem`. |
| Shadow | `shadow-atmospheric`, `-md`, `-lg` for lifting controls; `shadow-card`, `shadow-card-hover` for surfaces. |
| Scale | `text-base` through `text-8xl`, each with a tuned line height - see `tailwind.config.js`. |

### Choosing a colour

1. **Is it a status?** Success, warning, error, informational → `success`,
   `warning`, `destructive`, `info`.
2. **Is it one of several unordered kinds** - a source category, a meeting type,
   a tab? → `category-1` … `category-5`. These carry **no** good/bad meaning.
   Never use them for status, and never use a status colour for a category.
3. **Is it structural?** → `background`, `card`, `muted`, `border`, `foreground`,
   `muted-foreground`.
4. **Is it the brand?** → `primary`, `secondary`, `accent`.

Every colour pairs with a `-foreground` for text placed on it. Use the pair:
`bg-primary text-primary-foreground`, never `bg-primary text-white`. If a
designer lightens `--primary`, hardcoded white silently fails contrast while the
paired token moves with it.

Status and categorical lightness is tuned to clear roughly 4.5:1 as text on the
card surface, since they are used both as text and as filled backgrounds.

---

## 2. Component tiers

### Primitives - `src/components/ui/`

shadcn/ui components, styled only from tokens, with no business logic. They
define their variants with `cva`. This is where a raw `<button>` and its
appearance belong.

Available: accordion, alert, alert-dialog, aspect-ratio, avatar, badge,
breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible,
command, context-menu, dialog, drawer, dropdown-menu, form, hover-card,
input, input-otp, label, menubar, navigation-menu, pagination, popover,
progress, radio-group, resizable, scroll-area, select, separator, sheet,
sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toast,
toaster, toggle, toggle-group, tooltip.

### Patterns - `src/components/patterns/`

Composed but content-agnostic. A pattern may render raw elements; it may not
know anything about PTSD, rights, or the API.

`ArchFrame`, `ChoiceChip`, `Disclosure`, `FilterChip`, `PageHeader`,
`SectionBlock`.

### Pages - `src/pages/`

Data and composition only. **No raw Tailwind palette colours, no raw
`<button>`.** Colour arrives through a primitive, a pattern, or a semantic
token.

---

## 3. Components

### `Button` - `@/components/ui/button`

Three independent axes: `variant` (what it looks like), `size` (how big), and
`radius` (corner treatment). Splitting radius out means a variant does not have
to be duplicated per corner shape.

| `variant` | Use for |
|---|---|
| `default` | shadcn's stock solid button |
| `solid` | the standard solid primary action |
| `elevated` | `solid` plus a shadow that lifts on hover - the single main action on a screen |
| `secondary` | rose accent |
| `subtle` | a secondary action beside a solid one (muted background) |
| `outline` | bordered, hovers to the brand accent |
| `outline-subtle` | bordered, hovers to muted - admin icon and cancel controls |
| `ghost` | no chrome until hovered |
| `quiet` | reads as plain text until hovered |
| `link` | underlined text link |
| `dashed` | an "add another" affordance |
| `destructive` / `success` / `warning` | status actions |
| `pill`, `pill-outline`, `pill-light`, `pill-green` | stadium-shaped hero CTAs |

`solid` and `elevated` carry the site's **disabled convention**: the control
turns muted with `cursor-not-allowed` rather than dropping to 50% opacity, so
"you cannot press this yet" reads clearly.

| `size` | |
|---|---|
| `default`, `sm`, `lg`, `icon` | fixed-height shadcn sizes |
| `xs` | compact panel control |
| `roomy`, `roomy-lg`, `roomy-xl`, `cta` | height-free; padding sets the height |
| `pill`, `pill-lg`, `pill-xl` | hero CTA sizes |
| `none` | no sizing at all - for multi-line controls a fixed height would clip |

| `radius` | `md` (default) · `xl` · `super` · `full` |
|---|---|

```jsx
<Button variant="elevated" radius="full" size="cta" onClick={start}>התחל</Button>
<Button variant="subtle" size="xs" onClick={cancel}>ביטול</Button>
```

**Adding a variant is right; inlining appearance at a call site is not.** If a
control needs a look nothing covers, add it here with a comment naming the use
case. Layout utilities (`w-full`, `flex-1`, `mt-4`, `gap-2`) still belong in
`className` - only appearance moves into a variant.

### `Disclosure` - `@/components/patterns/Disclosure`

Expand/collapse section. Owns the trigger, panel, open state, and accessibility
(`aria-expanded` and `aria-controls`, which most of the six hand-rolled
accordions this replaced were missing).

| Prop | |
|---|---|
| `label` | trigger content |
| `leading` | optional node before the label (icon, avatar) |
| `variant` | `outlined` (heavy border, turns primary when open) · `soft` (hairline) · `plain` (caller supplies chrome) |
| `size` | `tight` · `compact` · `default` - sets trigger and panel padding together |
| `open` / `onOpenChange` | controlled mode; omit both for uncontrolled |
| `defaultOpen` | initial state when uncontrolled |
| `tintTriggerWhenOpen` | highlights the trigger row while open |
| `className`, `triggerClassName`, `labelClassName`, `panelClassName`, `chevronClassName` | targeted overrides |

```jsx
<Disclosure label={question} variant="outlined" tintTriggerWhenOpen>
  <Markdown className="rich-content">{answer}</Markdown>
</Disclosure>
```

### `ChoiceChip` - `@/components/patterns/ChoiceChip`

A toggle for filters, tabs, and answer scales. `selected` is a prop rather than
a ternary repeated at every call site, and is reported as `aria-pressed`.

| Prop | |
|---|---|
| `selected` | boolean |
| `variant` | `outline` (bordered pill) · `plain` (no border - list rows and tabs) |
| `size` | `sm` · `default` · `stacked` (score above label) · `list` (full-width row) |

Accepts every native button attribute.

```jsx
<ChoiceChip selected={active === key} onClick={() => setActive(key)}>{label}</ChoiceChip>
```

### `PageHeader`, `SectionBlock`, `ArchFrame`, `FilterChip`

`PageHeader` takes `title`, `subtitle`, `eyebrow`, `actions`, `image`, and
`imageOpacity`, with `size` (`default`/`editorial`/`hero`), `align`
(`center`/`start`) and `tone` (`card`/`canvas`/`muted`/`dark`).

`SectionBlock` is a full-width colour band: `variant`
(`canvas`/`card`/`muted`/`dark`/`primary`), `maxWidth`
(`narrow`/`default`/`wide`/`full`), `padding`.

Read the source for the current variant lists - the `cva` block is
authoritative.

---

## 4. Right-to-left

Hebrew is the primary language; Arabic is also RTL. Russian, English and French
are LTR.

**One component in code, two variants in Figma.** Logical properties mean a
single React component renders correctly in both directions from the `dir`
attribute. Duplicating that into explicit direction variants in code would
reintroduce the duplication this system exists to remove. Figma has no
auto-mirroring, so the Figma library does carry LTR and RTL variants - see
`figma-handoff.md`.

Use logical utilities, never physical ones:

| Instead of | Use |
|---|---|
| `ml-` / `mr-` | `ms-` / `me-` |
| `pl-` / `pr-` | `ps-` / `pe-` |
| `left-` / `right-` | `start-` / `end-` |
| `text-left` / `text-right` | `text-start` / `text-end` |
| `rounded-l-` / `rounded-r-` | `rounded-s-` / `rounded-e-` |

For direction in JavaScript use `useDirection()`:

```jsx
const { isRTL, dir } = useDirection();
const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
```

Never read `document.documentElement.getAttribute('dir')`. `LanguageProvider`
sets that attribute in an effect, so reading it during render returns the
*previous* language's direction on the render right after a switch.

Four positions are deliberately physical, listed in `PHYSICAL_ALLOW` in the
guardrail test with their reasons: the chat FAB and its panel share a screen
corner in every language, the validation toolbar sits opposite them, and
`left-1/2` with `-translate-x-1/2` is centering geometry rather than direction.

---

## 5. Enforcement

`src/test/design-system.test.jsx` reads the source tree and fails on:

1. Raw Tailwind palette colours (`bg-red-500`, `text-zinc-600`) in pages or in
   components outside `ui/`.
2. Raw `<button>` above the primitive and pattern tiers.
3. Any reference to the retired `teal` / `clay` / `sage` / `oatmeal` /
   `midnight` colours.
4. Physical direction utilities outside the documented allowlist.
5. Reading direction from the DOM instead of `useDirection()`.

Run from `src/`:

```bash
npm run lint && npm run typecheck && npm run test && npm run build
```

When a rule genuinely does not fit, change the rule and write down why - the
RTL allowlist is the worked example. Do not weaken a check to get a commit
through.
