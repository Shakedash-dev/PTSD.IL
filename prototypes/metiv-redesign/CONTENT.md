# Content

**The rule, from Ofri, 2026-10-24:** the v3 demo is the source of truth for
every word. The redesign changes how the demo looks, not what it says. Text may
be shortened and pages may be merged, but only after asking him, and every
change is written down here.

---

## Where each page's text comes from

Nothing below is written by hand any more. The pages were regenerated from the
demo's own data files, so a change there is a change here.

Since 2026-10-24 this is enforced by a build rather than by care: `tools/`
imports the demo's own modules and renders them, so a page cannot contain a
sentence the demo does not have unless someone writes it into the generator on
purpose. Everything written on purpose is listed below.

| Prototype page | Source in the repo | Count |
|---|---|---|
| `ptsd.html` | `shared/patient/data/ptsdInfoFaqs.json` | all 12 questions, answers verbatim |
| `where-to-get-help.html` | `shared/patient/additions.js` → `PUBLIC_OPTIONS`, `NONPROFIT_OPTIONS`, `METIV_SERVICES` | all 13 entries, in the demo's three sections |
| `courses.html` | `shared/therapist/courses.js` | all 15 courses, real summaries and real tags |
| `therapists.html` | `shared/therapist/org.js` → `THERAPIST_HUB` | the real intro and all 8 sections |
| `about.html` | `v3/data/aboutMetiv.js` → `DEPARTMENT_GROUPS`, `ORG.vision` | 4 groups, 8 departments, real contacts |
| `patient.html` | `shared/patient/index.js` → `PATIENT_HUB.paths`, `PATIENT_NAV` | 3 paths, 12 topics |
| `index.html` | `org.js` (`METIV_SERVICES`, `PARTNERS`, `FACTS`, `ORG`, `DONATE`), `i18n.js` (`about_ptsd_short`) | |
| `first-circle` `second-circle` | `shared/patient/index.js`, `i18n.js` | the two paths' own welcome text and their six links each |
| `self-help.html` | `data/selfHelpTools.json` | all 5 tools, content verbatim |
| `rights.html` | `data/rightsFaqs.json` | all 24 questions across the demo's 5 categories |
| `treatment.html` | `data/treatmentSteps.json` | all 5 steps, with the demo's own links |
| `community.html` | `data/communities.json` | all 7 communities |
| `children.html` | `data/childrenContent.json` | all 6 age bands, guidelines and resources |
| `second-circle-tools.html` | `data/secondCircleTools.json` | all 7 situations |
| `questionnaire.html` | `data/questionnaire.json` | all 20 questions, the demo's own options, scores and cutoff |
| `free-treatment.html` | `additions.js` | `FREE_TREATMENTS`, `RESEARCH_STUDIES`, `RESERVIST_FAMILY_PROGRAMS` |
| `sources.html` | `data/sources.json` | all 7 sources |
| `release-journey.html` | `v3/data/releaseJourney.js` | the project's own description and its 3 models |
| `supervision.html` | `therapist/programs.js` → `SUPERVISION` | 5 options, with the demo's prices |
| `children-family.html` | `therapist/programs.js` → `CHILDREN_FAMILY_INTRO` | 5 models |
| `organizations.html` | `therapist/programs.js` → `ORGANIZATION_PROGRAMS` | all 4, descriptions verbatim |
| `research.html` | `therapist/research.js` | `RESEARCH_INTRO` and all 7 active studies |
| `publications.html` | `therapist/research.js` | 4 books and all 62 papers, filtered by the demo's own topics |
| `articles.html` + article page | `therapist/articles.js` → `ARTICLES` | the one article the demo has, in full |
| `events.html` | `therapist/articles.js` → `EVENTS` | 2 upcoming and 20 past |
| `release-journey-pro.html` | `v3/data/releaseJourney.js` | models, workshops, stats and the five coordinators |
| `history.html` | `therapist/org.js` → `ABOUT` | the history, the timeline, the activities |
| `team.html` | `therapist/org.js` → `TEAM` | all 29 people in the demo's 5 groups, bios included |
| `partners.html` `collaborations.html` | `v3/data/aboutMetiv.js` | `PARTNER_GROUPS`, `COLLABORATION_GROUPS` |
| `contact.html` | `therapist/org.js` → `ORG` | every phone, address and form the demo records |
| `donate.html` | `therapist/org.js` → `DONATE` | as-is, placeholder text included - see below |
| `accessibility.html` `privacy.html` | `therapist/org.js` → `LEGAL` | both documents in full |
| `terms.html` | `shared/patient/legal.js` → `TERMS_HE` | in full |

---

## What I had invented, and no longer have

Every one of these was replaced with the demo's own text on 2026-10-24:

- **12 questions on `ptsd.html`.** I had written five of my own. They are gone;
  the page now carries the demo's twelve, answers included.
- **The four facts per framework on `where-to-get-help.html`.** I had forced
  every entry into למי / מה כולל / עלות / איך פונים and **invented the costs**
  to fill the grid. The demo's data has `who / ages / what / location / cost /
  process / contacts`, and **not every entry has every field**. The page now
  shows the fields an entry actually has and leaves out the rest, which is why
  one entry shows five facts and another shows one.
- **The page only listed Metiv.** The demo lists three sections. All 13 entries
  are now there: המערכת הציבורית, עמותות וקווי סיוע, מטיב.
- **15 course summaries.** Mine were shortened rewrites. The real summaries and
  the real tags are in.
- **`therapists.html`'s four "מסלולים".** My invention. Replaced by the hub's
  real intro and its eight sections with their own descriptions.
- **`about.html`'s story, figures and team grid with initials.** All invented.
  Replaced by the demo's four department groups.

---

## Still mine, and still needing a decision

### 1. Wording of the two areas — **approved 2026-10-24**

"לאנשי טיפול ומקצוע" became **למטפלים**, because the old label could be read as
"for professionals" generally. "למטופלים ולמשפחות" is unchanged.

### 2. Section headings the new layout created — **needs approval**

The demo's layout did not need these, so I wrote them:
"אפשר להתחיל מכאן", "שלוש דרכים להיכנס", "שמונה נושאים", "מה אפשר לעשות עכשיו",
"רגעים ממטיב", "להכיר את הארגון". None changes what a page says.

### 3. Photographs — **needs approval**

Every photo is borrowed from `src/public/images/set1/` and matched to a section
by feel, not by any instruction in the demo. They are placeholders for real
photography.

---

## Things I would shorten or merge, for you to decide

These are proposals. Nothing has been done.

### A. The gallery — *decided 2026-10-24: keep it*

Ofri: there will be photographs. The bento grid on the home page stays, and
"לכל הגלריה" waits for a gallery page.

### B. **איפה מקבלים טיפול** is long — *done 2026-10-24*

(This is `where-to-get-help.html`. "עמוד המסגרות" was my own name for it and
is not used anywhere in the product; the page is called **איפה מקבלים טיפול**.)

Thirteen entries, each with up to five facts, made a page you scroll for a
while. The three sections stayed, but **המערכת הציבורית and עמותות וקווי סיוע
now open on request** and מטיב is open from the start: five entries at rest
instead of thirteen. Each heading and its description stay visible, so nothing
is hidden from someone scanning the page, and the button says how many are
behind it. No entry was removed; the demo still shows all three open.

### C. "טיפולים ללא עלות" appears twice — *decided: fine, as long as the entry points at the page*

It is an entry inside `where-to-get-help` **and** a page of its own in the demo
(`/patient/free-treatment-and-research`). **Proposal: leave the entry as a
pointer and let the page carry the detail**, which is what the demo's own entry
does ("הפירוט המלא בעמוד נפרד"). No change needed, just confirming it is
deliberate.

### D. מסע שחרור — *decided: leave as is*

In the patient area, in the professional area, and as a framework in
`where-to-get-help`. The demo does the same on purpose: each one is written for
a different reader. **Proposal: leave as is.** Flagging it so it is not
mistaken for duplication later.

### E. The home page repeated איפה מקבלים טיפול — *done 2026-10-24*

The same frameworks appeared on both with the same full summary. The home page
cards now carry **the first sentence only**, cut mechanically at the full stop
rather than rewritten. The section's sub-line was removed too: it promised
"בכל מסגרת כתוב למי היא מתאימה, מה היא כוללת ואיך פונים", which is now true of
**איפה מקבלים טיפול** and no longer of the home page. The detail lives there.

### F. The entry cards were lopsided — *fixed by layout, not by cutting text, 2026-10-24*

Some frameworks carried four short facts, others carried three paragraphs, and
they shared one grid. The fix: **the split is by length, not by field name.**
Anything over 60 characters becomes a labelled paragraph in the body, measured
to 60ch for reading; anything shorter goes in the blue strip, which now always
sits on one row. It is by length because the demo's text varies per entry, not
per field: one framework's עלות is two words ("ללא עלות") and another's is three
sentences.

Ofri offered trimming the text as the alternative. I restructured instead, so
no word of the demo was lost.

**Second pass, to a layout Ofri drew:** every entry is now built identically -
photograph in a fixed column on the left, reading column beside it, and one
strip across the full width of the card holding the short facts and the
buttons together. The photograph is the same 256px square in every entry and
sits at the top of its column; a longer text leaves white below it rather than
stretching it. Nothing was cut; the uniformity comes from the structure.
 **If you would rather trim as well, the four
longest are:** מסע שחרור / מה כולל (223 chars), מרפאת המבוגרים / למי (190),
מרפאת מגדלור / תהליך הפנייה (185) and מרפאת המבוגרים / עלות (152). Say the word
and I will propose shortened versions for approval rather than apply them.

### G. The topics grid on למטופלים ולמשפחות — *done 2026-10-24*

Twelve topics in four narrow columns made every description wrap to four
lines. They are now **two wide rows per line, six rows deep**, and every card
is the same 101px tall because the description fits on one line.

Two content notes, both reversible:

- **שאלון אנונימי left the grid** and became a purple button beside the section
  heading, where Ofri asked for it. The link is promoted, not removed.
- **מסע שחרור was added to the grid.** It is in the v3 patient area's own
  navigation but was missing from my list, so adding it restores a demo item
  and keeps the grid at twelve. It is not an invention; say the word and it
  comes out again.

---

## The 2026-10-24 build: what I decided, and what needs you

### Things I replaced because they were invented

- **The three "מה קורה במטיב" cards on the home page.** A CBT course in
  November, a יום עיון and an article called "כשהגוף ממשיך לזכור" - all three
  were mine. They are now the demo's two upcoming events (CBT בטראומה,
  14.10.2026, and מפת הדרכים, 29.10.2026) and the one article the demo
  actually has, **לרקוד עם פרוטוקול** by מיכל זמורה ושיר אליאס.

### Headings the new pages needed - **needs approval**

Each new page needed a name for its sections; the demo's own layout did not.
These are mine, and none of them changes what a page says: "מה יש כאן",
"חמישה כלים", "שאלות ותשובות", "חמישה שלבים", "למה קבוצה", "הקהילות",
"לפי גיל", "מצבים, ומה אפשר לעשות", "שלושה תרגילים", "איך עושים את זה",
"המקורות", "חמש אפשרויות", "המודלים", "שלושה מודלים", "מחקרים פעילים",
"מאמרים", "ספרים", "קרובים", "שהתקיימו", "איך זה התחיל", "ציר הזמן",
"בארץ ובעולם", "טלפונים", "כתובות דוא\"ל", "טפסי פנייה", "ברשתות",
"דרכים לתרום", "כל ההכשרות".

### Three places where the prototype is thinner than the demo

1. **The calming exercises are players in the demo, pages here.** The demo
   animates a breathing circle on a four-four-eight count, walks the 5-4-3-2-1
   grounding one sense at a time, and runs a timed six-group muscle sequence.
   The prototype shows the same instructions, in the same words, as a numbered
   list. **Building the three players is a real piece of work and a new
   component - say the word and I will.**
2. **The courses have no page of their own.** `courses.html` lists all 15 with
   the demo's own summaries, but "לפרטים ולהרשמה" on each card has nowhere to
   go. The demo has a page per course. That is 15 more pages; it is a
   decision, not an oversight.
3. **The gallery.** The home page's bento grid still ends in "לכל הגלריה"
   with nowhere to go, as agreed in section A.

### Two things in the demo's own data that are placeholders

- **The donation page.** `DONATE.isPlaceholder` is `true` in the demo and its
  text opens with "[טקסט זמני]". `donate.html` shows exactly that rather than
  writing copy for it. The JGive link underneath is real.
- **The accessibility statement** carries its own note saying the demo has no
  accessibility plugin. That note is shown at the top of the page.

### What the team page does, since the avatars went

29 people, in the demo's five groups, each with the name, the role and the bio
the demo records. No photographs and no initials circle.

### Where מסע שחרור actually appears in the demo

Asked on 2026-10-24. It has **two pages of its own**:
`/patient/release-journey` and `/therapist/release-journey`, written for
different readers. It is then **mentioned** inside איפה מקבלים טיפול (as one of
`METIV_SERVICES`), on על מטיב (a department under טיפול), in the patient
navbar, and on קהילות תמיכה and זכויות. The prototype mirrors exactly that.
