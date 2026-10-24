# Link map

Updated 2026-10-24, after the inner pages were built.

`tools/wire.mjs` gives every link a destination, matching on the link's own
label and resolving it against the demo's own URLs. It prints whatever it
cannot resolve, and that list is section 3 below - those are the only links on
the site that still do nothing. Everything else is wired.

A link that still has nowhere to go is written `href="#"` and is inert on
purpose: clicking it does nothing rather than jumping to the top of the page.

---

## 1. The pages, and what points at each

All 41 exist. The menu, the drawer, the footer and the pages themselves are
wired to them.

### למטופלים ולמשפחות

| Page | File |
|---|---|
| כל הנושאים | `patient.html` |
| חוויתי אירוע קשה | `first-circle.html` |
| מישהו קרוב אליי מתמודד | `second-circle.html` |
| מה זה פוסט טראומה | `ptsd.html` |
| שאלון אנונימי | `questionnaire.html` |
| עזרה עצמית | `self-help.html` |
| תרגילי הרגעה | `calming.html` → `calming-breathing` `calming-grounding` `calming-muscle` |
| כלים לבני משפחה | `second-circle-tools.html` |
| לדבר עם ילדים | `children.html` |
| איפה מקבלים טיפול | `where-to-get-help.html` |
| טיפולים ללא עלות ומחקרים | `free-treatment.html` |
| המסע הטיפולי | `treatment.html` |
| זכויות | `rights.html` |
| קהילות תמיכה | `community.html` |
| מסע שחרור | `release-journey.html` |
| מקורות | `sources.html` |

### למטפלים

| Page | File |
|---|---|
| אזור המטפלים | `therapists.html` |
| קורסים והכשרות | `courses.html` |
| הדרכה למטפלים | `supervision.html` |
| ילדים ומשפחה | `children-family.html` |
| תוכניות לארגונים | `organizations.html` |
| מחקר | `research.html` |
| פרסומים | `publications.html` |
| מאמרים | `articles.html` → `article-dancing-with-protocol.html` |
| אירועים ועדכונים | `events.html` |
| מסע שחרור (מקצועי) | `release-journey-pro.html` |

### על מטיב

| Page | File |
|---|---|
| על מטיב | `about.html` |
| הסיפור של מטיב | `history.html` |
| הצוות | `team.html` |
| השותפים שלנו | `partners.html` |
| שיתופי פעולה | `collaborations.html` |
| יצירת קשר | `contact.html` |
| תרומה | `donate.html` |
| הצהרת נגישות | `accessibility.html` |
| מדיניות פרטיות | `privacy.html` |
| תנאי שימוש | `terms.html` |

### The six service cards on the home page

Each now deep-links into the frameworks page or the professional area:
מרפאת המבוגרים → `where-to-get-help.html#adults-clinic` · מטיב ילדים →
`#kids-clinic` · מרפאת מגדלור → `#migdalor` · מסע שחרור →
`release-journey.html` · יחידת ההכשרות → `courses.html` · יחידת המחקר →
`research.html`.

**The footer's "מחקר ופרסומים"** is one line for two pages; it goes to
`research.html`, which links on to `publications.html`.

---

## 2. Addresses taken from the demo, not invented

Every external link on the site is the demo's own. The ones worth naming:

| Link | Address | Where it comes from |
|---|---|---|
| תרומה מאובטחת | JGive, charity 1179 | `ORG.donateUrl` |
| טופס פנייה למרפאת המבוגרים | Google Forms | `ORG.adultsClinicFormUrl` |
| טופס פנייה למטיב ילדים | Google Forms | `ORG.kidsClinicFormUrl` |
| פנייה להכשרה או הדרכה | Google Forms | `ORG.trainingsFormUrl` |
| הרשמה למסע שחרור | `wkf.ms/4i9R9bO` | `RELEASE_JOURNEY.registerUrl` |
| אגף השיקום, ביטוח לאומי, מרכזי חוסן, 1202/1203, עמך, נט"ל | their own sites | the `contacts` arrays in `additions.js` |

**פנייה מארגון** in the contact section is now a link to the training
enquiry form, which was the open question at the foot of the old map.

**לשיחת התייעצות** goes to `where-to-get-help.html#consultation`, which is
where the demo's own `CONSULTATION` record points.

---

## 3. Still nowhere to go - these need you

| Link | Where | What is missing |
|---|---|---|
| לכל הגלריה | home page, under the bento grid | Is there a gallery page, or does the grid stand alone? |
| לפרטים ולהרשמה | every card in `courses.html` (15 of them) | The demo has a page per course. Building all 15 is a decision, not an oversight - say the word. |

That is the whole list. Everything else on the site leads somewhere.
