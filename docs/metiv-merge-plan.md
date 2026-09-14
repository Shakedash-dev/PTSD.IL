# Metiv merge - plan and demo notes

Status: demo only, uncommitted. Demo lives at `/metiv-site-demo`.
Source: full scrape of metiv.org on 2026-09-13 (145 URLs, Hebrew + English).

## Goal

One Metiv site with three areas, on the PTSD-IL design system:

| Area | Who | What |
|---|---|---|
| A. Landing | everyone | sends people to B or C; below the fold: Metiv services, about, research, donate, news, partners, contact |
| B. למטופל | survivors and close ones | the PTSD-IL site as it is, general and neutral |
| C. למטפל | therapists, professionals, organisations | Metiv's professional content, as is |

## What metiv.org actually contains

The scrape splits into four buckets, not three:

1. **General org info** - about, team, contact, privacy, accessibility, news. Goes to A.
2. **Metiv's own treatment services** - adults clinic, kids clinic, מגדלור, מסע שחרור, free treatments, SEA-IT/MDMA recruitment, פנד"ה/נמ"ל groups. Patient-facing but Metiv-branded and partly paid. **Does not fit B without breaking neutrality.** Demo puts it on A ("הטיפולים במטיב").
3. **Professional content** - about 20 course pages, supervision, organisation trainings, research, publications, one article. Goes to C.
4. **Public patient information** - almost none. FAQ and blog are empty; the only public text is the adults clinic "signs to watch for" list.

## A - landing sections (demo)

The two areas are the main CTA, so they get three placements:

- **Header**: two pill buttons (solid for B, outline for C) on every demo page and at every width.
- **Hero**: the two doors are the hero itself, a full-screen split (B light, C dark), each with illustration, "who is this for" line, title and a large button. Hovering one widens it. Checked above the fold at 1440x900, 1280x720 and 390x844 (B; C is in the header on mobile).
- **Repeat band** with both doors before the contact block.

1. Thin brand strip: org name + "אחרי טראומה, אנשים זקוקים לאנשים".
2. The two doors (B and C). ער"ן 1201 under them.
3. הטיפולים במטיב - 5 service cards, each opens the page as is.
4. Vision + counts stated on metiv.org (1989, 2,000+ therapists, 5,000+ teachers, ~300 patients a year).
5. Research teaser.
6. Donate (placeholder copy, jGive link from the English site).
7. News (3 items).
8. Partners (text list; logos later).
9. Contact.

## C - therapist area sections (demo)

| Section | Pages |
|---|---|
| קורסים והכשרות | CBT בטראומה, מפת הדרכים, טראומה מורכבת, קליידוסקופ, יום תרגול, קורס קיץ, תכנית שנתית |
| ילדים ומשפחה | יסודות הטיפול בטראומה בילדים, פנד"ה יסודי / הורים / בשניים / אמנויות, נמ"ל |
| הדרכה | הדרכות |
| לארגונים | הכשרות לארגונים, מרחב מטיב, ארגון מותאם טראומה, סדנאות בהתאמה |
| מחקר ופרסומים | מחקרים פעילים, מחקרי עבר, מאמרים ונתונים, לרקוד עם פרוטוקול |

Left out on purpose: 3 duplicate מפת הדרכים variants, test/stub pages, jet-popup fragments, team bios (mostly empty in the scrape), English pages.

## B - suggestions from Metiv content

All 8 approved and built into the patient area of every demo version (`shared/patient/additions.js`). Summary:

1. Where to get treatment - neutral directory, Metiv clinics as one option -> `/treatment`
2. Free treatment and research participation -> `/rights` (needs efficacy wording removed)
3. Veterans and reservists (מסע שחרור, family and father-child groups) -> `/community`
4. Parents and children regulation groups (פנד"ה, נמ"ל, free play session) -> `/children`
5. Reservist families -> `/second-circle-tools`
6. Public books by Metiv staff -> `/sources`
7. Public video lectures from Metiv's YouTube -> `/self-help`
8. "Not sure whether to reach out?" consultation option -> end of `/questionnaire`

## How the demo is built

Four design versions of one full Metiv site, same content and page set. Rules for anyone touching them: `src/pages/metiv-demos/README.md`.

| Route | Direction |
|---|---|
| `/metiv-site-demo` | chooser |
| `/metiv-site-demo-v1` | Calm Editorial |
| `/metiv-site-demo-v2` | Two Doors |
| `/metiv-site-demo-v3` | Guided Journey |
| `/metiv-site-demo-v4` | Institutional Modern |

- `src/App.jsx`: five lazy routes outside `<Layout>`. The only change to an existing file.
- `src/pages/metiv-demos/shared/routes.js`: the page set every version implements.
- `shared/DemoChrome.jsx`: per-version base path and page header; keeps every link inside its version.
- `shared/patient/`: static snapshot of today's API content, Metiv-branded copies of the patient pages, the 8 additions.
- `shared/therapist/`: metiv.org content structured into courses, programmes, research, articles, events, org data. `EDITORIAL_NOTES.md` lists every efficacy claim removed and every conflict found, for Metiv to review.
- `shared/metiv/content/*.md`: 34 scraped source pages.
- `v1/`..`v4/`: one design each.
- Tests: `test/metiv-demo-*.test.jsx` / `.js`.
- Not in sitemap, not in `seo.js`, `noindex`: intentionally unindexed.

Content is a static snapshot, which breaks the "content comes from the API" rule. Fine for a demo, not for production.

## Production plan (after feedback)

1. **Decide the open questions** (below).
2. **Routing**: top-level split, e.g. `/` = A, `/patient/*` = B (today's routes moved under a prefix, with redirects from old URLs), `/pro/*` = C. Or keep B at the root and put A at `/metiv`. Depends on domain decision.
3. **Content model**: new article types in the API - `course`, `service`, `research`, `news`, `team_member` - with admin panels. Move scraped Markdown in through a one-off import script, same pattern as `scripts/apply-treatment-descriptions.mjs`.
4. **Layouts**: `Layout` stays for B. New `MetivLayout` for A and C, sharing tokens and patterns. Promote the demo's card grid and prose styles into `components/patterns/` (`LinkCard`, `Prose`) instead of page-level classes.
5. **SEO**: route maps in `seo.js`, sitemap, redirects from metiv.org URLs (they are Hebrew slugs, so a redirect map is needed to keep search traffic).
6. **Chatbot**: decide whether it indexes C content. Probably B only, since it answers survivors.
7. **i18n**: A and C Hebrew first. Metiv's English pages are older and donor-oriented; decide whether to carry them.
8. **Forms**: Metiv uses Google Forms and a MailPoet newsletter. Keep as links first; native forms need a backend endpoint.
9. **Cleanup pass with Metiv** (their call, not ours): stale dates and prices, duplicate courses, contradictory founding years, efficacy claims.

## Open questions

1. Where do Metiv's own clinics and programmes live - A (as in the demo), a separate "טיפול במטיב" area, or a neutral listing inside B?
2. Branding of B: stays "PTSD.IL", becomes "PTSD-IL by Metiv", or fully Metiv? Does `ptsd-il.site` keep working as an entry point?
3. Domain: metiv.org serves everything, or ptsd-il.site serves B and metiv.org serves A + C?
4. "As is" for C: literally verbatim, including efficacy claims ("שיטה מוכחת", "מבוסס ראיות"), expired dates, closed registrations and duplicate pages? Or a light cleanup approved by Metiv?
5. Organisations (הכשרות לארגונים, מרחב מטיב): inside C, or its own door on the landing page?
6. Who edits A and C after launch - Metiv staff through our `/admin`? That decides how much goes into the API now.
7. Donations: is jGive the provider? Is there Hebrew copy?
8. Team and news pages: needed at launch?
9. English: carry Metiv's English pages or drop them?
10. Palette: PTSD-IL lavender for all three areas, or a Metiv accent for A and C (their brand is navy/yellow/purple)? The logo already sits well on lavender.
11. Should the SEA-IT/MDMA recruitment appear anywhere public-facing? The page makes an expected-efficacy claim.
