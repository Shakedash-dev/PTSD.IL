# Metiv redesign prototype

A standalone design prototype, served on its own local address. It is **not**
part of the app: nothing here is imported by `src/`, and the v3 demo at
`/metiv-site-demo-v3` is untouched by anything in this folder.

## Where it lives, and where it is published

Everything the redesign is - the 41 pages, the stylesheet, the shared chrome,
every photograph, the generator and the step that publishes it - is inside
this one folder. Nothing here imports from `src/`, and nothing in the app
imports from here. The folder can be deleted and the site is unaffected.

One line of it has to sit elsewhere: `"postbuild"` in `src/package.json`,
which runs `tools/copy-into-site.mjs` after the site's own build. That step
copies this folder (without `tools/`) into the built site at
**`/metiv-site-demo-v3/redesign-v1/`**, so the published address is

    https://ptsd-il.site/metiv-site-demo-v3/redesign-v1/

The path sits under the v3 demo's route because it is a redesign *of* that
demo. `/metiv-site-demo-v3` itself stays a client route of the React app -
only the `redesign-v1` folder below it exists on disk, so a request for the
demo still falls through to the app, which is why publishing this changes
nothing about the demo.

Every page carries `<meta name="robots" content="noindex, nofollow">`, so the
address is shareable but not indexed. Remove that line from the generator if
it ever stops being a prototype.

To stop publishing it, delete the `postbuild` line. Nothing else in the repo
knows this folder exists.

## Run it

```bash
python3 -m http.server 5180 --bind 127.0.0.1 --directory prototypes/metiv-redesign
```

Then open <http://localhost:5180>. There is also a `metiv-redesign` entry in
`.claude/launch.json`, so the preview pane can start it by name.

## What it is

Option 1 from the navigation study (header sections that open a full menu
panel), redrawn against the design rules Ofri set on 2026-10-24:

| Rule | Where it lives |
|---|---|
| White page background | `--white` on `body`; gradients only as accents |
| Google Sans, base 16px, even sizes only | `--font`, `--fs-*` (12/14/16/18/20/24/28/32/40/48/56) |
| 8px spacing scale | `--s1`..`--s15`, every value a multiple of 8 |
| One button radius at every size | `--r-pill` on `.btn`, `.btn--sm`, `.btn--lg` alike |
| Purple `#8337EE`, blue `#3B85FE` | `--purple`, `--blue`, plus 50/700 steps |
| Ink darker than `#0D2141` | `--ink: #09182F` |
| Icons only where they do work | inline SVG sprite; icons live in buttons, tags and controls, never as card decoration |
| Room for photographs | full-frame hero, `.sb` half-frame bleeds, `.card__media`, `.gal` |
| Soft purple-to-blue gradients | `--grad`, `--grad-soft`, `--grad-line`, `--scrim` |

## The recurring elements

- **The header and the menu are solid white.** Neither is glass. The bar sits
  over photographs the whole way down the page, and the panel carries the whole
  menu; anything translucent made both harder to read.
- **Menu rows.** One style for the mega panel and the drawer: the same padding
  and the pill radius the buttons use. Hover has no background at all - the
  text turns `--purple-700` and gains one weight step. The nav buttons behave
  the same way, with a hidden bold copy of each label holding the width so the
  600-to-700 step cannot nudge its neighbours.
- **Glass.** The translucent white surface with a white rim, kept for controls
  that sit on top of an image, where there is nothing behind them to read. It
  is the `secondary` role inside `.on-media`: the hero's second button and the
  donate band's second button. Nowhere else.
- **Half-frame bleed.** `.sb` runs a photograph to the page edge at full
  section height, with no frame and no radius, while the text column still
  lines up with the page gutter through `--edge`. `.sb--flip` mirrors it, so
  the bleeds alternate sides down the page.
- **Uniform cards.** Every card in a grid shares one photo ratio and a
  description clamped to two lines, so no card is taller than its neighbour.
- **Marquee.** The partners run edge to edge in one continuous row, paused on
  hover, with fade masks at both ends. Each item is a slot sized for a real
  logo file; today it holds the organisation's name as a wordmark.
- **Showcase panel.** `.showcase` is one large rounded frame (40px) holding a
  photograph, with the heading, text and underlined links set over it on the
  reading side. The PTSD section is built this way.
- **Figures at size.** `.stats` sets the organisation's numbers large and bare,
  no cards, with a reveal and a count-up the first time they scroll into view.
  A year is revealed but never counted.
- **Bento gallery.** `.bento` is a five-column grid with mixed spans (one item
  spans three, another spans two) and no controls to operate. Two columns on
  phones.
- **The entry card.** Two rows, the same for every entry whatever the length
  of its text: the photograph in a 20rem column on the left beside the reading
  column, then one strip across the full width of the card holding the short
  facts on the reading side and the entry's buttons opposite them. The photo is
  one fixed size in every card - a 256px square, inset 32px on all four sides
  with the card radius, sitting at the top of its column. It does not grow
  with the card: an entry with more text simply leaves white below the frame.
  That is what makes the column scan as one set - the eye follows a single
  line of identically sized pictures down the page and stops noticing how long
  each text is. On phones the frame turns 16/9 and sits above the text. `.entry--plain` has no photo and restates both
  `grid-template-columns` and `grid-template-areas`: leaving the two-column
  areas in place would push its items out of the grid.
- **Numbered steps.** `.steps` is a journey down the page: a purple number,
  the text beside it, an optional photograph closing the row, and a line drawn
  between the numbers so the eye follows the sequence. No card per step. Used
  by the treatment map, the calming exercises, the organisation's timeline and
  the release journey's workshops.
- **Reference rows.** `.rows` is a long list read by scanning rather than
  browsing - sixty-two papers, twenty past events, a column of phone numbers.
  A rule between rows instead of a card around each one, the title on the
  reading side and the year or date opposite it.
- **The self-check.** `.quiz` puts all twenty questions on one page with the
  answers as a row of radio pills, lightest to heaviest. One screen per
  question would be twenty clicks for a three-minute form. The score is worked
  out in the page and never leaves it, which is what the page promises.
- **People without avatars.** `.person` is a name, a role and what they do.
  The demo has no photographs of the team, and a circle of initials is a
  placeholder pretending to be a portrait.
- **An action beside a heading.** `.section-head--split` aligns on `flex-end`,
  not `center`, so the button lines up with the `h2` itself rather than with
  the h2 plus its eyebrow. The two boxes are both 48px, so their centres meet
  exactly. On phones it wraps and the button sits at the inline start.

## Buttons: four roles, two contexts, one behaviour

There is no such thing as a one-off button look. Every control picks a role,
and the context it sits in decides how that role is drawn.

| Role | On a light surface | Inside `.on-media` | Used for |
|---|---|---|---|
| `btn--donate` | the gradient, purple to blue | same | תרומה, and nothing else |
| `btn--primary` | solid purple | solid white | the main action of a view |
| `btn--secondary` | white with a 2px rim | glass with a white rim | the alternative beside a primary |
| `btn--quiet` | transparent | - | chrome only: the burger, the drawer close |

`.on-media` goes on the hero, the showcase panel and the donate band. It is the
only switch; nothing else changes between contexts.

**Behaviour is identical for all four, and nothing moves on hover.** Hover
deepens the colour and that is the whole of it: no lift, no shadow change, no
growth. Tap presses in by 2%, focus draws one ring (white inside `.on-media`),
and every change eases over 200ms. Filled roles carry `--shadow-1` and keep it
unchanged; outlined and glass roles never carry one. One radius, `--r-pill`,
and a 1px rim at every size.

Links are one class, `.link`, underlined at a 5px offset with an arrow that
slides on hover, purple on a light surface and white inside `.on-media`.
`.link--sm` is the quiet variant, used for the crisis line in the hero.

**No surface moves on hover anywhere in the page.** Cards change their border
colour and nothing else: no lift, no shadow step, no zoom on the photograph.
The bento tiles only fade their caption in. The one thing that still moves is
the 4px nudge on a link's arrow, which points rather than lifts.

| Action | Role | Icon |
|---|---|---|
| תרומה | donate | heart |
| עזרה עכשיו | secondary | lifebuoy |
| לעזרה ולתמיכה (hero) | primary, on media | compass |
| לאזור המטפלים (hero) | secondary, on media | graduation cap |
| לשיחת התייעצות | primary | phone |
| למי לפנות בכל נושא | secondary | - |
| ער"ן 1201 (hero) | `.link--sm`, not a button | phone |

## Colour

Two families built off the two base colours, plus the pale aqua that ends the
blue ramp: `--purple` 50/100/300/700, `--blue` 50/100/300/700, `--sea`
50/100. The washes are made from the light steps:

- `--wash-light` - three soft blooms on white, used on `.band--grad-soft`
- `--wash-sea` - aqua, pale blue and pale purple blooms, used on `.band--sea`
- `--grad` - the one saturated gradient, purple through blue into aqua, used
  on the donate band and the primary button

They are washes rather than bands: overlapping radial blooms on white, so the
page reads like light on water instead of a coloured rectangle.

**And they have no edges.** `--melt` is the first layer of every wash: a
white-to-transparent-to-white gradient that whitens the top and bottom
fourteenth of the band, so the colour dissolves into the page rather than
stopping on a seam. The header photograph does the same thing with two mask
layers intersected: it fades toward the text and along its bottom edge, while
the top stays solid so the photo meets the header bar square.

The one gradient that keeps its edges is `--grad` on the donate band. It is a
deliberate block of colour rather than a wash, and softening it would take the
weight out of the only place on the page that asks for money.

**What each colour is for.** Purple is action: buttons, the open state of a
menu, the label on a fact. Blue is wayfinding: a link that carries you on to
the next page rather than something you do here. That is the `.next` row at the
foot of a content page - blue fill, blue rim, blue label and blue arrow - and
it is why blue is a palette and not decoration.

**Where the gradients are.** Not only behind the header:

- `--wash-light` and `--wash-sea` on content bands down every page, and behind
  every inner page header (`--sea` for the patient area)
- `--grad-ink` on the crisis strip that closes a patient-area page: the same
  ramp at its dark end, so a serious band still carries the colour
- `--grad` on the donate band and on the donate button
- `--grad-deep` on that button's hover
- `--grad-line` under every section eyebrow
A wash needs room to bloom. In a strip as shallow as the facts row inside a
directory entry it only muddied the edge, so that one is a flat `--blue-50`
with `--blue-100` above it and `--blue-700` labels - the same family, used as a
surface rather than as a link.

Home page sections, in order: hero, what PTSD is, who Metiv is, what Metiv does
and who with, what is happening at Metiv, support and donate, contact, footer.

Wording was corrected so the audience areas cannot be misread: the professional
area is **למטפלים**, not "לאנשי מקצוע".

## Content

The redesign changes how the demo looks, not what it says. **`CONTENT.md`
lists every place where the wording differs from the demo**, which changes are
approved and which are placeholders waiting on Ofri. Read it before trusting
any text on these pages.

## Audit, 2026-10-24

Checked before moving on to inner pages:

- **Layout** no element is wider than the viewport at 320, 375, 768, 1024,
  1440 or 1920. The hero column now lines up with every other section (both
  sit 392px from the edge at 1920).
- **Markup** no duplicate ids, one h1, no skipped heading levels, every
  `aria-controls` points at a real element, every image has alt text, every
  button and link has an accessible name, every `nav` is labelled and the
  two labels differ.
- **Contrast** every text-on-surface pair clears WCAG AA. The caption colour
  was 4.45:1 and is now 5.38:1.
- **Assets** no broken images, no failed requests, no broken sprite
  references, no console errors.
- **Behaviour** mega menu opens one panel at a time and closes on toggle,
  Escape and outside click; the drawer locks the page behind it, moves focus
  to its close button and returns focus to the burger; the accordion toggles;
  the counters run once when they scroll into view.
- **`[hidden]` is enforced.** The browser's own `[hidden] { display: none }`
  is a user-agent rule, so any author `display` beats it, and every container
  here sets one. A global `[hidden] { display: none !important }` makes the
  attribute mean what it says; without it, hiding a section did nothing.
- **Robustness** the figures are visible at rest and only animate once the
  script is running and the viewer has not asked for less motion, so they are
  never left invisible.
- **Dead code** removed five unused classes, three unused sprite icons and the
  two arbitrary blue variants on tags and contact marks, and rewired the
  washes to the palette tokens through `color-mix` so the colour system has a
  single source.

## Pages

41 pages. Seven were written by hand; the other 34 are generated from the
demo's data by `tools/`, so a page's text is the demo's text by construction
rather than by care.

**Written by hand** - these are the layout exercises:

| File | What it demonstrates |
|---|---|
| `index.html` | the home page |
| `patient.html` | an **area hub**: three ways in, then every topic as a tile |
| `ptsd.html` | a **content page**: question-and-answer panels, then what to do next |
| `where-to-get-help.html` | a **directory**: one frame per entry, the photograph one fixed size in every card |
| `therapists.html` | the **second audience's hub**, the light wash instead of the sea one |
| `courses.html` | a **catalogue the visitor filters**, with a live count of what is showing |
| `about.html` | the demo's own About page: the four department groups |

**Generated** (`node --import ./register.mjs build.mjs` inside `tools/`):

| Area | Pages |
|---|---|
| the two paths | `first-circle` `second-circle` |
| living with it | `self-help` `rights` `treatment` `community` `children` `second-circle-tools` `questionnaire` `free-treatment` `sources` `release-journey` |
| calming | `calming` + `calming-breathing` `calming-grounding` `calming-muscle` |
| professional | `supervision` `children-family` `organizations` `research` `publications` `articles` + one page per article, `events` `release-journey-pro` |
| the organisation | `history` `team` `partners` `collaborations` `contact` `donate` |
| legal | `accessibility` `privacy` `terms` |

### How the generated pages are built

`tools/` is a small build, not a scaffold that was run once and thrown away:

- `data.mjs` imports the demo's own modules and JSON. `alias-loader.mjs`
  teaches node the two things Vite does and node does not - the `@/` alias and
  extensionless imports - plus the JSON import attribute, so the demo's files
  are read unchanged rather than copied.
- `kit.mjs` renders the patterns. A page may only use what this file emits;
  anything it cannot express is a new component and goes into `styles.css`
  deliberately.
- `pages-patient.mjs` and `pages-site.mjs` are one function per page.
- `wire.mjs` runs last and gives every `href="#"` a destination, matched on
  the link's own label and resolved against the demo's own URLs. What it
  cannot resolve it prints, and that list is the one in `LINKS.md`.
- `audit.mjs` checks all 41 pages for duplicate ids, controls pointing at
  nothing, missing images and alt text, links to pages that do not exist,
  heading levels that skip, classes with no rule and icons not in the sprite.

**A generated page is overwritten by the next build.** A change to one of them
belongs in its function, not in the `.html` file.

The header, its three menu panels, the drawer and the footer live in
`partials/` and are injected by `site.js`, so the menu has one source and a
change to it reaches every page. `site.js` also marks the current page in the
menu and in the footer with `aria-current`.

Inner pages share one header pattern: a wash behind it, the trail above the
title, and the photograph taking the far half of the frame. From 900px up the
photo is absolutely placed, runs to the edge top, bottom and side, and is
masked so it dissolves into the wash rather than ending on a hard line; the
text keeps the near half. Below 900px it falls back to a framed photo under
the text, where a half-width bleed would leave the headline nowhere to sit.
`--wash-sea` for the patient area and `--wash-light` for everything else, so
the two sides of the site feel different without a different layout.

Three things bite in this pattern, all fixed and worth remembering.

1. **Never set `width` on an element that also carries `.wrap`.** `.wrap` is
   `width: min(var(--max), 100%)` with `margin-inline: auto`; a `width`
   declared later at the same specificity beats it, the element goes
   full-bleed, and the page gutter disappears. This cost the home page hero
   its margin once and the page headers a second time. If a wrapped element
   needs a width, put it on a child.
2. The photo must measure itself against the header, so the grid between them
   stays unpositioned and the text column carries the `z-index`.
3. The mask is written in physical directions, because the photo is always on
   the physical left when the text column comes first in an RTL document.

A quick check for the first one: list every class that appears beside `wrap`
in the markup, and make sure no rule for it sets `width`.

## Still open

- Six inner pages exist. The rest are listed in `LINKS.md`.
- Photographs are placeholders borrowed from `src/public/images/set1/`. Real
  photography of people and faces is what these slots are sized for.
- Links to pages that do not exist yet are inert on purpose: a click does
  nothing instead of jumping to the top. Links that point at a section of this
  page still work. **`LINKS.md` lists all 52 destinations the home page needs**,
  which inner page each one waits for, and the seven that need an address or a
  decision before they can be wired at all.
- The palette is complete and stays complete. `--blue-50/100/700`,
  `--purple-100` and `--sea-50/100` are not used on the home page yet; they are
  there for the inner pages and are not to be trimmed.
