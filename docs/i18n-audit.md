# i18n / translation coverage audit

Read-only audit. No source code was modified. Scope: `src/lib/i18n.js`, every file in
`src/pages/` and `src/components/` (Hebrew-literal scan), `src/data/static/*` + `src/data/db.js`,
`src/api/source.js`. Produced 2026-07-23.

Methodology: (A) an ad-hoc Node ESM script imported `translations` from `lib/i18n.js` directly
and diffed each language's key set against `he`. (B) an ad-hoc Node script walked every `.jsx`/`.js`
file under `pages/` and `components/` (including `components/ui/`) line-by-line with the Hebrew
Unicode-range regex `/[֐-׿]/` and reported every matching line with its number. Both
scripts were deleted after use; nothing was left in the tree.

---

## Part A - `lib/i18n.js` key coverage (exact)

`he` block: **172 keys** (verified count, matches the rough estimate).

| Lang | Present | Missing | Empty-but-present | % complete |
|------|---------|---------|--------------------|-----------|
| en   | 162     | 10      | 0                  | 94.2% |
| ar   | 125     | 47      | 0                  | 72.7% |
| ru   | 47      | 125     | 0                  | 27.3% |
| fr   | 47      | 125     | 0                  | 27.3% |

Extra finding: `en` has one **orphan key not present in `he`**: `treatment_instruction`
(`lib/i18n.js:312`, `'Click on each step for details and a "how to start" guide'`). It is not
referenced by any `t(lang, 'treatment_instruction')` call anywhere in `pages/` or `components/`
(grepped, zero hits) - it's dead. Not part of the "missing" counts above (those are keyed off `he`).

ru and fr have **byte-for-byte identical missing-key sets** (125 keys each) - both blocks only
implement the same 47 keys (mostly nav top-level + generic chrome: `home`, `add_new`, `edit`,
`delete`, `saved`, `error`, `loading`, etc.) and stop there. Neither language has ever had a second
translation pass.

### The single highest-impact miss: the 10 keys missing from EVERY non-Hebrew language

`en`, `ar`, `ru`, and `fr` are **all** missing this exact set:

```
nav_path1, nav_path2, nav_path3, nav_self_help, nav_ptsd_info, nav_treatment,
nav_rights, nav_community, nav_children, nav_second_circle_tools
```

These are the labels `components/Navbar.jsx` uses for every in-path sub-navigation link (the nav
shown on every page except Home) - see `Navbar.jsx:12-39`. Because `t()` falls back
`translations[lang][key] || translations['he'][key] || key` (`lib/i18n.js:632-636`), **every
language including English currently renders Hebrew text in the persistent site navigation** on
`/first-circle`, `/second-circle`, `/questionnaire`, and any sub-page once a path is chosen. This
is not a translation gap tucked away somewhere - it's the primary nav, visible on nearly every
page view, in 4 of 5 languages. Fixing these 10 keys for `en` (only 10 keys) is the highest
value-per-effort fix in this whole audit.

### Full missing-key lists

**en - missing 10:**
```
nav_path1, nav_path2, nav_path3, nav_self_help, nav_ptsd_info, nav_treatment,
nav_rights, nav_community, nav_children, nav_second_circle_tools
```

**ar - missing 47:**
```
nav_path1, nav_path2, nav_path3, nav_self_help, nav_ptsd_info, nav_treatment, nav_rights,
nav_community, nav_children, nav_second_circle_tools, chatbot_description, step_by_step,
community_why_p1, community_why_p2, community_filter, audience_security_forces,
audience_hostilities, audience_sexual_harassment, audience_spouses, audience_general,
children_guidelines, resources_coming_soon, self_help_overflow_prompt, self_help_overflow_cta,
ptsd_info_instruction, source_cat_research, source_cat_clinical, source_cat_official,
source_cat_ngo, source_cat_international, source_link, admin_title, admin_subtitle, admin_faq,
admin_communities, admin_rights, admin_treatment, admin_children, admin_sources,
admin_login_title, admin_login_subtitle, admin_google_signin_error, admin_google_config_error,
admin_no_access, admin_logout, admin_questionnaire_readonly, content_error
```

**ru - missing 125:**
```
ptsd_info, self_help, rights, treatment, community, second_circle, children_content, calming,
questionnaire, sources, admin, nav_path1, nav_path2, nav_path3, nav_self_help, nav_ptsd_info,
nav_treatment, nav_rights, nav_community, nav_children, nav_second_circle_tools, hero_eyebrow,
hero_headline, about_ptsd_short, quick_nav_title, first_circle_welcome, second_circle_welcome,
questionnaire_intro, pcl_instruction, result_low_title, result_low_text, result_high_title,
result_high_text, go_to_calming, go_to_self_help, scale_mild, scale_significant,
questionnaire_anonymous_note, breathing_subtitle, grounding_subtitle, muscle_subtitle,
eran_phone, next_step, start_exercise, ground_step_5, ground_step_4, ground_step_3,
ground_step_2, ground_step_1, ground_complete, rights_subtitle, rights_security, rights_sexual,
rights_hostilities, rights_accidents, rights_general, rights_faq_title, chatbot_soon,
chatbot_description, treatment_subtitle, how_to_start, step_label, step_by_step,
community_subtitle, community_why_p1, community_why_p2, community_filter, filter_audience,
filter_location, audience_security_forces, audience_hostilities, audience_sexual_harassment,
audience_spouses, audience_general, meeting_frontal, meeting_digital, meeting_hybrid,
no_communities, children_intro, age_until4, age_4_6, age_7_10, age_10_13, age_14_16,
age_16plus, resources_library, children_guidelines, resources_coming_soon, self_help_intro,
self_help_overflow_prompt, self_help_overflow_cta, ptsd_info_subtitle, ptsd_info_instruction,
sources_subtitle, source_cat_research, source_cat_clinical, source_cat_official,
source_cat_ngo, source_cat_international, source_link, admin_title, admin_subtitle, admin_faq,
admin_communities, admin_rights, admin_treatment, admin_children, admin_sources,
admin_login_title, admin_login_subtitle, admin_google_signin_error, admin_google_config_error,
admin_no_access, admin_logout, admin_questionnaire_readonly, add_new, edit, delete,
confirm_delete, saved, error, content_error, chatbot_placeholder, chat_tooltip, footer_rights
```

**fr - missing 125:** identical list to `ru` above (same 125 key names).

Note: none of the missing keys are "empty but present" (e.g. `key: ''`) - they are simply absent
from the object, so today they all resolve through the Hebrew fallback rather than showing a
blank string.

---

## Part B - Hardcoded Hebrew in JSX

Full scan of every `.jsx`/`.js` under `src/pages/` and `src/components/` (incl. `components/ui/`,
which had zero hits). Below, one section per file that matched. Files not listed had **zero**
Hebrew-literal hits (i.e. render only through `t()` and/or API data): `Calming.jsx`,
`FirstCircle.jsx`, `PTSDInfo.jsx`, `Rights.jsx`, `SelfHelp.jsx`, `Sources.jsx` (partially - see
below), `Treatment.jsx` (partially), `Home.jsx` (partially), `AdminLogin.jsx`, `ArchFrame.jsx`,
`ChatbotFAB.jsx`, `Markdown.jsx`, `ScrollToTop.jsx`, `SectionBlock.jsx`, `TextureOverlay.jsx`,
`ui/*`.

Important cross-cutting finding: **`ValidatableContent` (and its sibling `ValidationOverlay`) are
dead code in production.** `contexts/ValidationContext.jsx:17` hard-codes
`isValidationMode = useState(false)` with a comment "Hard-disabled for the demo", and the only UI
that could flip it (`ValidationOverlay.jsx`'s toggle button) is **never imported/mounted anywhere**
in `App.jsx` or `Layout.jsx` (grepped, zero mount sites). `ValidatableContent` itself returns only
`children` when `isValidationMode` is false (`ValidatableContent.jsx:169`). Net effect: every
Hebrew `label=` prop passed to `<ValidatableContent>` across `Home.jsx`, `PTSDInfo.jsx`,
`PTSDInfo2.jsx`, `Treatment.jsx`, `Children.jsx`, `Community.jsx`, `SecondCircleTools.jsx` never
renders to any visitor today. These are flagged below but **excluded from the priority totals** -
they're an internal annotation tool, not shipped content, and not connected to any language
switch even in principle (they're always Hebrew, admin-authoring labels).

### `pages/Admin.jsx` - hardcoded literals (168 lines)
Classification: **hardcoded literals (Hebrew-only by design)**. Per AGENTS.md/task framing this
is the admin CRUD panel - not user-facing content, low priority. Representative sample (not
exhaustive - 168 lines total, mostly `label:`/`toast.error(...)`/`title="..."` strings for form
fields, taxonomy label maps, and confirm dialogs):
- Taxonomy label maps: `LANG_LABELS`, audience/location/meeting-type/tool-category/resource-type/
  source-category/role label objects (`Admin.jsx:54-104`)
- Panel tab labels (`Admin.jsx:131-143`, e.g. `'שאלות PTSD'`, `'כלים עצמיים'`, `'שלבי טיפול'`...)
- Form field labels throughout every panel (`label: 'כותרת'`, `label: 'תיאור'`, etc.)
- `toast.error(...)` / `window.confirm(...)` strings throughout
- Static headings: `'ממשק ניהול'` (Admin.jsx:1651), `'התנתקות'` (1658)

Recommendation: leave as-is. Admin is intentionally Hebrew-only (solo Hebrew-speaking operator);
i18n'ing it is not part of the public-content translation scope.

### `components/RichTextEditor.jsx` - hardcoded literals (4 lines, admin-only)
Used exclusively inside `Admin.jsx` panels (`react-quill` wrapper for the link-insert popover):
`'כתובת קישור'` (label, line 81), `'עדכון'`/`'הוספה'` (line 96), `'הסרה'` (97), `'ביטול'` (98).
Same bucket as Admin.jsx - not public-facing, low priority.

### `components/ValidatableContent.jsx` - hardcoded literals (12 lines, dead code)
Status-label dictionary (`'לא מאומת'`, `'מאומת'`, `'לא תקין'`, `'דורש תיקון'`) and the validation
popover's buttons/placeholder (lines 89, 100, 106, 119, 125, 131, 138, 147). See "dead code" note
above - never rendered in production. No action needed unless the validation tool is revived.

### `components/ValidationOverlay.jsx` - hardcoded literals (11 lines, dead code)
Same bucket: stats panel labels, export/import titles, mode-toggle button text. Never mounted.
No action needed.

### `components/Footer.jsx` - hardcoded literals (mixed with `t()`)
Classification: **mixed**. Two real user-facing gaps:
- Line 23: `<h4>מידע ותמיכה</h4>` ("Info and support" column heading) - not in i18n.js, always Hebrew.
- Line 42: `<h4>קו חירום - ער״ן</h4>` ("Emergency line - Eran") - always Hebrew.
- Lines 69/76: `"האתר נכתב בשיתוף עם"` + `"מטיב - המרכז לפסיכוטראומה"` (site credit/attribution
  paragraph and partner org name) - always Hebrew, in every language's footer.
Recommendation: extract 3-4 new i18n keys (`footer_info_heading`, `footer_emergency_heading`,
`footer_credit_prefix`) and translate. The partner org name ("Metiv") is a proper noun and can
likely stay as-is or be transliterated per language.

### `pages/Sources.jsx` - hardcoded literals (mixed with `t()`/API)
Classification: **mixed**. Lines 34/41: the same "מטיב - המרכז לפסיכוטראומה" attribution blurb
("All content on this site is approved by Metiv - The Center for Psychotrauma") appears a second
time here, hardcoded Hebrew, in every language. Same fix as Footer.jsx - extract to i18n keys.

### `components/Layout.jsx` - hardcoded literals (mixed, partially intentional)
Classification: **mixed**. This is the `SanctuaryNav` shown only on the 4 calming/breathing pages.
Its own comment (`Layout.jsx:39-40`) explicitly says the Hebrew + `tel:` link is intentional
("SanctuaryNav intentionally uses hardcoded Hebrew... The crisis line (1201) is Israel-specific
and needs no translation"). That reasoning covers the phone-number label (line 49, `ער״ן: 1201`)
but **not** line 47's `"חזרה"` ("Back") - that's a real nav-label string with no language
awareness at all, always Hebrew regardless of `lang`. This one doesn't even need a new key: a
`back` key already exists in `lib/i18n.js` (line 104, `he`) and is **already fully translated**
in all 5 languages (`en: 'Back'`, `ar: 'رجوع'`, `ru: 'Назад'`, `fr: 'Retour'`) - `Layout.jsx:47`
should simply call `t(lang, 'back')` instead of the literal. Smallest possible fix in this whole
audit: one line, zero new translation work.

### `components/Navbar.jsx` - hardcoded literal (1 line, minor)
Line 102: `aria-label="תפריט"` (mobile menu button, "Menu"). Screen-reader-only text, always
Hebrew. Low visual impact but a real accessibility-facing translation gap. Extract to an i18n key.

### `components/LanguageSwitcher.jsx` - hardcoded literal (1 line, minor)
Line 18: `aria-label="שינוי שפה / Change language"` - already bilingual (he/en) inline, but not
localized for ar/ru/fr. Low priority (it's the language switcher itself, self-evident via the
flag/label list next to it).

### `components/FilterChip.jsx`, `components/PageHeader.jsx` - false positives
Both hits are Hebrew text **inside `//` code comments** (`FilterChip.jsx:6`, `PageHeader.jsx:7`),
not rendered strings. Classification: **uses t() only** (no real content gap). No action needed.

### `pages/CalmingBreathing.jsx` - hardcoded literals, own private he/en dictionary
Classification: **hardcoded literals**, real gap. This page does **not** use `lib/i18n.js` at
all - it defines a local `STRINGS = { he: {...}, en: {...} }` object (lines 10-45) and does
`STRINGS[lang] || STRINGS.he`. Only Hebrew and English are implemented; **ar/ru/fr users get the
full Hebrew breathing-exercise script** (setup instructions, phase labels "Inhale"/"Hold"/
"Exhale", button text, the "Eran: 1201" link text). ~13 distinct strings incl. a 4-item
instruction list.

### `pages/CalmingGrounding.jsx` - hardcoded literals, own private he/en dictionary
Classification: **hardcoded literals**, real gap. Same pattern: `STEPS_HE`/`STEPS_EN` arrays
(lines 5-19) selected via `lang === 'en' ? STEPS_EN : STEPS_HE` (line 23) - note this is even
narrower than the `||` fallback pattern: **any lang other than exactly `'en'` gets Hebrew**, so
ar/ru/fr all render the Hebrew 5-4-3-2-1 grounding script. Additional inline ternaries at lines
49, 87-88 (`lang === 'en' ? 'Next' : 'הבא'` etc.) have the same he/en-only behavior. The
"Eran: 1201" line link text (lines 52, 93) is hardcoded Hebrew unconditionally (not even gated by
`lang`).

### `pages/CalmingMuscle.jsx` - hardcoded literals, own private he/en dictionary
Classification: **hardcoded literals**, real gap. Same pattern again: `GROUPS` (6 muscle-group
name/squeeze/release triples x 2 langs, lines 10-75) and `STRINGS` (title/intro/button labels,
lines 77-100), both `he`/`en` only, `[lang] || GROUPS.he`. ar/ru/fr get the full Hebrew PMR
(progressive muscle relaxation) script - this is the largest single content block among the three
calming exercises (~27 distinct strings).

**All three calming exercise pages share one fix pattern**: their local `he`/`en` string tables
should either move into `lib/i18n.js` proper (so `ar`/`ru`/`fr` blocks can be completed there) or
gain their own `ar`/`ru`/`fr` entries in place. Either way this is real clinical/therapeutic
content (breathing pacing, grounding technique, muscle relaxation script) that a clinician should
review before translating, per AGENTS.md "Content sensitivity."

### `pages/Children.jsx`, `pages/Community.jsx` - false positives (ValidatableContent labels only)
Each file's single Hebrew hit is a `label=` prop on the dead-code `ValidatableContent` component
(see cross-cutting note above). Classification: **uses t()/API only** for everything actually
rendered.

### `pages/PTSDInfo2.jsx` - hardcoded literal (1 line, minor)
Line 41: `{lang === 'en' ? 'Questions' : lang === 'ar' ? 'الأسئلة' : 'שאלות'}` - a 3-way ternary
(en/ar/else-Hebrew) for the sticky TOC heading "Questions". `ru` and `fr` fall through to Hebrew.
Small, easy fix: this is exactly the shape of a missing i18n key (`ptsd_info_questions_heading`
or similar) - extract and complete for all 5 languages via `lib/i18n.js` instead of a growing
ternary.

### `pages/Questionnaire.jsx` - hardcoded literals + a real logic bug (not just missing strings)
Classification: **mixed**, and the most consequential finding after the Navbar one. Two things:
1. Lines 201, 257: small ternaries (`isHebrew ? 'נותרו X שאלות' : 'X questions remaining'`,
   `isHebrew ? 'מלא/י מחדש' : 'Start over'`) - straightforward missing-i18n-key gaps.
2. **The bigger issue**: `const isHebrew = lang !== 'en'` (line 71). This isn't just a UI-string
   gap - it drives which **question set** renders (line 132: `isHebrew ? <Hebrew sectioned PCL-5>
   : <English flat PCL-5>`, using `PCL5_SECTIONS_HE`/`PCL5_QUESTIONS_EN` from
   `data/static/questionnaire.js`). Since that data file only has `he` and `en` blocks (see Part
   C), **ar/ru/fr users are shown the full Hebrew PCL-5 clinical screening questionnaire** - all
   20 questions, the intro line, and the 5-point response scale - not just a few chrome strings.
   This is the core screening tool of the site rendering in the wrong language for 3 of 5
   locales.

### `pages/SecondCircle.jsx` - hardcoded literal (1 line, real gap + a bug)
Line 11: `label_override: 'כלים להתמודדות עם נפגע/ת PTSD'` is used as both the card's `alt` text
and heading (lines 39, 45) for the "second circle tools" tile, **overriding** the otherwise-
correct `t(lang, 'second_circle_tools')` lookup unconditionally. Since an i18n key
(`nav_second_circle_tools`) already exists for the same concept (and is itself missing from all
non-Hebrew languages, see Part A), this hardcoded override means **every language, including a
fully-fixed English, would still show Hebrew here** unless the override itself is also fixed.
Recommend removing `label_override` and using `t(lang, 'nav_second_circle_tools')` directly (or a
new key) once that key is completed in Part A.

### `pages/SecondCircleTools.jsx`, `pages/Home.jsx`, `pages/Treatment.jsx` - false positives (ValidatableContent only)
Same dead-code-label pattern as Children/Community above; everything actually rendered goes
through `t()`/API.

---

## File classification summary (Part B)

| File | Classification | User-facing gap? |
|---|---|---|
| `pages/Admin.jsx` | hardcoded literals | No (admin-only, by design) |
| `components/RichTextEditor.jsx` | hardcoded literals | No (admin-only) |
| `components/ValidatableContent.jsx` | hardcoded literals | No (dead code, unmounted) |
| `components/ValidationOverlay.jsx` | hardcoded literals | No (dead code, unmounted) |
| `components/Footer.jsx` | mixed | **Yes** - 2 headings + attribution blurb |
| `pages/Sources.jsx` | mixed | **Yes** - attribution blurb |
| `components/Layout.jsx` | mixed | **Yes** - "Back" label (phone label intentional) |
| `components/Navbar.jsx` | mixed | **Yes** - mobile menu aria-label |
| `components/LanguageSwitcher.jsx` | mixed | Minor - aria-label only |
| `components/FilterChip.jsx` | uses t() only | No (comment, false positive) |
| `components/PageHeader.jsx` | uses t() only | No (comment, false positive) |
| `pages/CalmingBreathing.jsx` | hardcoded literals (private he/en dict) | **Yes - large** |
| `pages/CalmingGrounding.jsx` | hardcoded literals (private he/en dict) | **Yes - large** |
| `pages/CalmingMuscle.jsx` | hardcoded literals (private he/en dict) | **Yes - large** |
| `pages/PTSDInfo2.jsx` | mixed | Minor - 1 ternary heading |
| `pages/Questionnaire.jsx` | mixed + logic bug | **Yes - critical** (wrong question set for ar/ru/fr) |
| `pages/SecondCircle.jsx` | mixed | **Yes** - overrides a nav key unconditionally |
| `pages/Children.jsx`, `pages/Community.jsx`, `pages/SecondCircleTools.jsx`, `pages/Home.jsx`, `pages/Treatment.jsx` | uses t()/API only | No (all hits are dead-code labels) |
| `pages/Calming.jsx`, `pages/FirstCircle.jsx`, `pages/PTSDInfo.jsx`, `pages/Rights.jsx`, `pages/SelfHelp.jsx` | uses t()/API only | No |
| `pages/AdminLogin.jsx`, `components/ArchFrame.jsx`, `components/ChatbotFAB.jsx`, `components/Markdown.jsx`, `components/ScrollToTop.jsx`, `components/SectionBlock.jsx`, `components/TextureOverlay.jsx`, `components/ui/*` | uses t()/API only (or no strings) | No |
| `src/lib/PageNotFound.jsx` (not in `pages/`, wired as the `path="*"` route in `App.jsx:8,114`) | **hardcoded English-only**, not caught by the Hebrew regex | **Yes** - always renders "Page Not Found" / "Go Home" regardless of `lang`, no `t()` calls at all |

---

## Part C - Static data files (`src/data/static/*`, `src/data/db.js`)

Confirmed via grep across `pages/`, `components/`, `api/`, `lib/`, `hooks/`, `contexts/`:
**only two files import `@/data/db`**: `pages/Questionnaire.jsx` and `pages/Admin.jsx`. And within
`db.js`'s exported object, **only `db.questionnaire` is actually read** anywhere (`Admin.jsx:1523`
is the sole other access site, for the read-only admin panel). This matches AGENTS.md's claim
that the static layer is retired except for the questionnaire.

`db.js` (`src/data/db.js`) nonetheless still imports and aggregates all 8 static modules:
`sources.js`, `communities.js`, `self_help_tools.js`, `treatment_steps.js`, `children.js`,
`rights_faqs.js`, `ptsd_info_faqs.js`, `second_circle_tools.js`, plus `questionnaire.js`. Of
those, **7 are dead weight** - built into the bundle, never read by any consumer. `pcl5_legacy.js`
(26 lines) isn't even imported by `db.js`; it appears fully orphaned already.

`data/static/questionnaire.js` (84 lines) - the one file that matters:
- Confirms `QUESTIONNAIRE.he` (intro, 4-section/20-question grouped set with icons, 5-point
  scale) and `QUESTIONNAIRE.en` (20 flat questions; scale reuses `lib/i18n.js`'s
  `not_at_all`/`a_little`/.../`extremely` keys via `t()`) - **no `ar`, `ru`, or `fr` block
  exists.**
- `pages/Questionnaire.jsx` renders Hebrew content for any `lang` that isn't exactly `'en'`
  (`isHebrew = lang !== 'en'`, line 71) - confirmed in Part B above. This means the questionnaire
  is not just "Hebrew-only static content" in the abstract - it's actively mis-served to ar/ru/fr
  users as Hebrew today, with no visual or code-level indication that it's the wrong language.

**Where would ar/ru/fr questionnaire translations live?** Per AGENTS.md, there is no `/api`
endpoint for the questionnaire (`docs/api.md` confirms; admin's questionnaire panel is read-only
for this reason). Two options:
1. **Short-term (no backend change)**: add `ar`/`ru`/`fr` blocks directly to
   `data/static/questionnaire.js` (mirroring the `en` shape - flat 20-question list is simplest,
   or replicate the sectioned/iconed `he` shape if the visual design should carry over) and change
   `Questionnaire.jsx`'s `isHebrew` gate to a real per-language dictionary lookup instead of a
   binary he/en split. This keeps the questionnaire out of the API/DB entirely, consistent with
   how it works today - purely a frontend content and logic change.
2. **Long-term (matches how every other content type works)**: give the questionnaire a real API
   endpoint/table (e.g. `type=questionnaire_item` articles, one row per question per language,
   same `groupId`/`langId` pattern as everything else) so it can be edited and translated through
   Admin like the other 8 content panels, instead of being the one hand-maintained exception.
   This is a backend change (new endpoint or reuse of the `articles` table) - flag as **needs
   backend**, but likely lower urgency than the Communities backend gap since a frontend-only fix
   (option 1) is available today.

Given this site's clinical sensitivity, either option needs the **actual translated PCL-5
question text** sourced from a validated instrument/clinician - not machine-translated from the
Hebrew paraphrase - since PCL-5 is a standardized clinical scale with official translations in
most of these languages already published by the National Center for PTSD.

No other static reads exist beyond `db.questionnaire`.

---

## Part D - `src/api/source.js` langId hardcodes

Confirmed clean. Every language-aware fetcher threads `lang` correctly:
`fetchSources`, `fetchSelfHelpTools`, `fetchTreatmentSteps`, `fetchChildrenContent`,
`fetchRightsFaqs`, `fetchPTSDInfoFaqs`, `fetchSecondCircleTools` all call the shared
`fetchWithHebrewFallback(path, lang)` helper (`source.js:47-53`), which requests
`&langId=${lang}` and only falls back to `&langId=he` when the requested language returns zero
items (intentional graceful-degradation behavior, not a bug). `hooks.js` confirms every
corresponding `use*` hook accepts and forwards `{ lang }` into its `queryFn` and `queryKey`.

The only unparameterized fetcher is `fetchCommunities()` (`source.js:72-84`) - no `lang` argument
at all, calls `/communities` with no `langId`. This is expected and matches Part E below (the API
itself has no language dimension for communities yet, so there's nothing for the FE to thread).

No remaining hardcoded `langId=he` bugs found.

---

## Part E - Communities (single-language, needs backend)

Confirmed, not re-analyzed in depth per the task's framing (`docs/communities-i18n-spec.md`
already exists and covers this in full). Summary: `GET /api/communities` returns one row per
community with a single `description`/`name`/`organization` set and no `langId`/`groupId`
dimension - so community content can only ever be Hebrew today, for every viewer regardless of
selected language. The FE (`fetchCommunities()` in `source.js`) correctly reflects this reality
(no `lang` param, nothing to thread). Fixing this requires the backend schema change already
spec'd in `docs/communities-i18n-spec.md` (add `langId`/`groupId` to `communities`, mirroring the
`articles` model). No further FE-side investigation needed until that ships.

---

## Prioritized "total remaining work" summary

### 1. i18n key completion (`lib/i18n.js`) - pure translation work, no code changes
- **en: 10 keys** - the `nav_*` set. Highest priority: fixes the persistent navbar for English,
  the site's second-most-used language after Hebrew. Trivial effort (10 short strings), critical
  visibility (rendered on almost every page).
- **ar: 47 keys** - the `nav_*` set plus admin strings, source-category labels, audience labels,
  chatbot placeholder copy, a few subtitle keys. ar is otherwise fairly complete (72.7%).
- **ru: 125 keys**, **fr: 125 keys** - both languages need a full second translation pass; only
  the original 47-key stub (top nav + generic CRUD chrome) exists. This is the largest chunk of
  raw translation volume in the audit - effectively "translate two-thirds of the site's UI
  strings from scratch" for these two languages.
- Also: remove the orphan `treatment_instruction` key from `en` (dead, unreferenced) - trivial
  cleanup, not a translation task.

### 2. Hardcoded-JSX extraction + translation
In priority order by user impact:
1. **`pages/Questionnaire.jsx`** - fix `isHebrew = lang !== 'en'` to a proper per-language branch
   once translated question data exists (blocks on Part C decision below). This is a correctness
   bug, not just a missing string - ar/ru/fr users currently take a Hebrew-language clinical
   screening test.
2. **The three Calming exercise pages** (`CalmingBreathing.jsx`, `CalmingGrounding.jsx`,
   `CalmingMuscle.jsx`) - each has its own private `he`/`en`-only string table (~13, ~10, ~27
   strings respectively, ~50 total) that needs `ar`/`ru`/`fr` entries, ideally migrated into
   `lib/i18n.js` for consistency rather than staying as three separate local dictionaries. Flag
   for clinician review per AGENTS.md (therapeutic exercise scripts).
3. **`pages/SecondCircle.jsx`** line 11 `label_override` - remove the hardcoded override, use the
   (once-completed) `nav_second_circle_tools` i18n key instead. Small code fix + depends on #1 in
   Part A.
4. **`components/Footer.jsx`** (2 headings + attribution blurb) and **`pages/Sources.jsx`**
   (duplicate attribution blurb) - extract ~4-5 new i18n keys, translate to all 5 languages.
5. **`components/Layout.jsx`** "חזרה"/"Back" label in `SanctuaryNav` - no new key needed, swap the
   literal for the existing (already 5-language-complete) `t(lang, 'back')` call. One-line fix.
6. **`pages/PTSDInfo2.jsx`** "Questions" TOC heading ternary - extract 1 key (currently covers
   en/ar/Hebrew-fallback; needs ru/fr too).
7. **`components/Navbar.jsx`** mobile-menu `aria-label="תפריט"` and
   **`components/LanguageSwitcher.jsx`** `aria-label` - extract 2 keys, low visual priority but
   real a11y gap.
8. **`src/lib/PageNotFound.jsx`** - currently 100% hardcoded English with zero `t()` calls (the
   opposite gap: not Hebrew-only, English-only). Needs full i18n wiring, not just missing keys.
- **Not in scope / no action needed**: `pages/Admin.jsx` and `components/RichTextEditor.jsx`
  (admin-only, Hebrew-by-design per task framing); `components/ValidatableContent.jsx` and
  `components/ValidationOverlay.jsx` (dead code - unmounted, `isValidationMode` hard-disabled -
  no user, including admins, currently sees these; revisit only if that tool is revived).

### 3. Static / questionnaire
- `data/static/questionnaire.js` needs `ar`/`ru`/`fr` blocks (20 PCL-5 questions + intro + scale
  each, ideally sourced from the official validated PCL-5 translations rather than re-translating
  the Hebrew paraphrase). Frontend-only fix is possible (no backend needed) - see Part C options.
  This is content work more than engineering work, but it's the same page/logic fix as work item
  #1 above.
- The other 7 static files aggregated in `data/db.js` (`sources.js`, `communities.js`,
  `self_help_tools.js`, `treatment_steps.js`, `children.js`, `rights_faqs.js`,
  `ptsd_info_faqs.js`, `second_circle_tools.js`) plus the orphaned `pcl5_legacy.js` are dead code
  with respect to translation scope - not part of the remaining work, but worth a separate
  housekeeping pass to delete them per AGENTS.md's "do NOT add new content there" guidance (they
  currently still ship in the bundle unused).

### 4. Needs backend
- **Communities** (`GET /api/communities`) - no `langId`/`groupId`, single-language by schema.
  Spec already written: `docs/communities-i18n-spec.md`. Not further investigated here per task
  scope.
- **Questionnaire, long-term option** - if the questionnaire should eventually move off the
  static-file pattern entirely (to be admin-editable like every other content type), that also
  needs a backend endpoint. Not urgent since a frontend-only translation fix is available; noted
  as a "would be nice to converge with the rest of the content model" item, not a blocker.

---

## What a translator/dev must touch, end to end

To reach genuine 5-language coverage across everything audited here:
1. Translate ~10 (en) / ~47 (ar) / ~125 (ru) / ~125 (fr) keys into `lib/i18n.js` - see Part A
   for exact lists.
2. Extract ~9 small hardcoded-Hebrew strings from `Footer.jsx`, `Navbar.jsx`,
   `LanguageSwitcher.jsx`, `Sources.jsx`, `PTSDInfo2.jsx`, `SecondCircle.jsx` into new i18n keys,
   then translate those into all 5 languages. (`Layout.jsx`'s "Back" label needs no extraction -
   just swap the literal for the already-complete `back` key.)
3. Extract and translate ~50 strings across the 3 Calming exercise pages (clinician review
   recommended) - either into `lib/i18n.js` or into their own completed per-language tables.
4. Fully wire `src/lib/PageNotFound.jsx` for i18n (currently has none).
5. Author `ar`/`ru`/`fr` PCL-5 questionnaire content (ideally from the official validated
   translations) and fix `Questionnaire.jsx`'s `isHebrew` binary-language gate to branch on all 5
   languages.
6. Ship the Communities backend schema change (`docs/communities-i18n-spec.md`) before any FE
   community-content translation work is possible.
7. (Housekeeping, not translation) delete the 7 dead static-data files no longer read by anything.
