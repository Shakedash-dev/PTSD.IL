# Chatbot Q&A playbooks - selection

Rows: `he.json` (30 rows, Hebrew). Format: `docs/metiv-db-spec.md` section 5.

Rule of thumb: pre-bake a row only when the intent is stable and the answer
benefits from a fixed structure or safety order (high stakes, high frequency,
or a page the vector index cannot see). Anything that changes (phones,
emails, prices, dates, eligibility, study criteria) is left to SOURCES; the
only hardcoded facts are ERAN 1201, MDA 101, Police 100, "the site/bot is not an
emergency service", and page names.

How matching works (worker/src/lib/qa.ts): the top row is injected at score
0.72 or higher (weak) or 0.8 or higher (strong). When `detectCrisis` fires, the best-scoring
`crisis: true` row is always injected as well, whatever its score. So crisis rows
compete with each other, and their paraphrases are written to keep them apart
(self vs. someone else, suicidal vs. panic vs. flashback).

## Chosen

### Crisis (`crisis: true`)

| _key | why |
|---|---|
| suicidal-thoughts | Owner example. Highest stakes: fixed order (acknowledge, 1201, "are you safe", 101/100, don't stay alone, bot is not monitored). |
| self-harm | Separate from suicide: physical safety (101 for injury or overdose) comes first. |
| someone-else-suicidal | A family member reporting risk needs a different script (immediate danger vs. not, 1201 for worried relatives). Also catches third-person phrases that `detectCrisis` fires on. |
| panic-attack-now | Owner example. Needs 2-3 concrete steps that match the site's calming pages, with no physiology lecture and no efficacy wording. |
| flashback-now | An acute flashback or dissociation calls for grounding in the present, not information. Retrieval would return the reactions FAQ, which is the wrong register. |
| loved-one-episode-now | Acute, with a real safety branch (violence leads to 100). The site has a good FAQ for it, so the playbook fixes the order and puts safety first. |
| overwhelmed-now | Distress without the words `detectCrisis` looks for ("אני לא מחזיק יותר"). Without this row the bot would answer with general content. |

### Survivors

| _key | why |
|---|---|
| have-ptsd-what-to-do | Owner example, high frequency. Locks in the staged order (self-help, then understanding, then professional help) and the page map. |
| do-i-have-ptsd | High frequency and a diagnosis trap. Points to the anonymous questionnaire ("not a diagnosis") and consultation. Includes the "when should I seek treatment" phrasings. |
| find-therapist-psychiatrist | Owner example. Fixed structure (the where-to-get-help page, main routes, psychiatrist via referral). All providers' details come from SOURCES, with no recommending or ranking. |
| cant-afford-treatment | High frequency. The answer depends on where the trauma came from, so it scopes first. Prices and eligibility are left to SOURCES. |
| waiting-for-treatment | A frequent Israeli reality (long waits at health funds). Safety line: don't wait for the appointment if things are getting worse. |
| contact-metiv | Owner example. Routes by topic as the contact page does. Phones, emails and forms come from SOURCES, hours are never invented, and it makes clear Metiv is not a crisis line. |
| which-treatment-is-best | Biggest efficacy-claim risk. Neutral description only, no ranking, and MDMA is framed as research. |
| medication-question | Medical-advice trap (dose, stopping, specific drugs, cannabis). Fixed refusal plus the psychiatrist route and an overdose safety line. |
| rights-overview | High frequency. The rights tracks depend on the origin of the trauma: overview first, then ask which track applies (matches the system prompt rule, and makes the bot say a track is missing rather than invent it). |
| reservist-veteran-help | Large audience whose help is spread across 5 pages (community, free treatment, release journey, rights, family). The playbook gives the map. |
| sexual-assault | High stakes. No probing and no pressure to report, a safety line if it was recent, and help lines taken from SOURCES. |
| just-experienced-event | Acute-stress window. The site says early reactions are natural, and its own expressive-writing tool says to wait before writing about the event. The playbook stops the bot from suggesting it or diagnosing. |
| sleep-nightmares | High frequency and a medical-advice trap (sleeping pills). The site's sleep tool contains efficacy wording ("optimal", "syncs the clock") that must not be repeated. |
| substance-use | High stakes and thin site content. The playbook keeps it non-judgmental, adds no clinical claims, and refers to a doctor and the health fund, with 101 for overdose or mixing with medication. |
| calm-down-now | It is one of the 3 chat starters (`chat_starters`), so it is very high frequency. The calming pages are UI strings and are not indexed, so retrieval cannot see them. |

### Family

| _key | why |
|---|---|
| support-loved-one | The most common family question. Covers communication, refusal of treatment and arguments (each is a separate FAQ) plus support for the caregiver and a distress-signs safety line. |
| family-member-own-support | Caregiver burnout and secondary trauma. Routes to family support groups, the adults clinic's family guidance and reservist-family programmes. |
| talk-to-child-about-parent | Must ask the child's age and use the material for that age group (system prompt rule). Fixed shape across the age groups. |
| child-after-trauma | Parents asking about their own child. Metiv kids services are spread across pages, and "Metiv kids space" must always be described as "not therapy, not diagnosis". |

### Research / professionals

| _key | why |
|---|---|
| research-participation | MDMA / SEA-IT draws attention, which is an efficacy-claim and safety risk. Fixed framing: it is a study, there is no guaranteed result, and suitability is decided by the study team. |
| therapist-courses | COURSES, EVENTS and CHILDREN_FAMILY_INTRO are not indexed (`chatbot` flag off in the registry). Without a playbook every course question is refused. Points to pages only. |
| therapist-supervision | SUPERVISION is not indexed either. The row also covers "I'm stuck with a patient" (no case consulting). |

### Meta

| _key | why |
|---|---|
| who-are-you | "Is someone reading this?" carries safety weight: nobody reads in real time and nobody is alerted. Legal pages are not indexed, so the playbook is the only source. Covers "can you be my therapist / diagnose me". |

## Considered and rejected

| question | why not |
|---|---|
| What is PTSD? / What is a traumatic event? | One FAQ answers it directly. Plain retrieval handles it. |
| What is a flashback? (a chat starter) | The reactions FAQ covers it. It's an information question with low stakes, and the acute version is `flashback-now`. |
| Can people recover from trauma? / Will I get better? | An FAQ exists. The playbook would add nothing but the risk of outcome claims. |
| What is the release journey / how to register / which model | The content changes (models, dates, registration link). RELEASE_JOURNEY and JOURNEY_MODELS are indexed, and `reservist-veteran-help` routes there. |
| How do I get recognition from the Ministry of Defense / file a National Insurance claim / appeal | Detailed step-by-step FAQs exist and the steps change. `rights-overview` does the scoping. |
| Do I need a lawyer? | A dedicated FAQ exists. Retrieval handles it. |
| How do I convince my partner to go to treatment? / What to do after a fight | Single FAQs. Folded into `support-loved-one` as paraphrases. |
| My son came back from the war (parent of a soldier) | Same intent as `support-loved-one`. Folded in as paraphrases. |
| What is Metiv / history / team / partners | The ORG row (indexed) covers the basics. History and team pages are low stakes. |
| How do I donate? | Low stakes. DONATE is not indexed, so the bot will refuse (see report). Add a row later if it shows up in logs. |
| Survivor guilt / guilt | The site has no content on it. A playbook would have to invent clinical content. |
| Traumatic grief / bereavement | No dedicated content beyond "the adults clinic treats traumatic loss". Would invent content. |
| Anger / outbursts | Only partly covered (reactions FAQ, family FAQs). Retrieval handles it, and there's no safety structure to pin down. |
| Online / Zoom treatment | This is provider-specific and changes. Retrieval from the provider rows handles it. |
| Metiv opening hours | Not on the site. `contact-metiv` tells the bot to say so instead of inventing them. |
| Road-accident rights | Not on the site. `rights-overview` tells the bot to say the track isn't covered. |
| Organizations (trauma-informed org, workshops) | Low frequency. Folded into `therapist-courses` and `therapist-supervision`. |
| Questions about questionnaire results | Folded into `do-i-have-ptsd`. |
| Medical cannabis | Folded into `medication-question` and `substance-use`. |
| What are EMDR / PE / SE / CBT? | Neutral descriptions exist in the treatment journey and retrieval returns them. The ranking-risk version is `which-treatment-is-best`. |
| Exercises for kids by age | Activities are indexed per age group. `child-after-trauma` and `talk-to-child-about-parent` route there. |
| Books, publications, video lectures | Low stakes, indexed. Retrieval handles them. |
| Off-topic questions (weather, code, politics) | The system prompt's refusal rule handles them. |
| Questions in Arabic, English, Russian or French | Not a separate intent. The bot mirrors the user's language; other language rows come later through translation. |
