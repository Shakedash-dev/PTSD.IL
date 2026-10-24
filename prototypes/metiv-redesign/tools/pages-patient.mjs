// The patient area's inner pages. One function per page; each returns the
// finished HTML. Every string either comes from tools/data.mjs (the demo's own
// files) or is a label the layout itself needs, and those are listed in
// CONTENT.md.

import * as D from './data.mjs';
import {
  page, band, sectionHead, splitHead, topics, accordions, cards, entry, entries,
  steps, prose, filters, people, listRows, crisis, next, btn, icon, md, esc,
} from './kit.mjs';

const PATIENT = [{ label: 'למטופלים ולמשפחות', href: 'patient.html' }];

/* ------------------------------------------------------- the two path hubs */

const pathHub = ({ file, title, lead, image, links }) => ({
  file,
  html: page({
    h1: title,
    lead,
    crumbs: PATIENT,
    headMod: 'pagehead--sea',
    image,
    body: band({
      labelledby: 'areas',
      inner: sectionHead({ title: 'מה יש כאן', id: 'areas', h: 'h1' }) + topics(links, 'topics--two'),
    }) + crisis(),
  }),
});

export const firstCircle = () => pathHub({
  file: 'first-circle.html',
  title: D.tx('path1_title'),
  lead: D.tx('first_circle_welcome'),
  image: { src: 'img/firstcircle_hero.webp', alt: 'אדם יושב על ספסל מול נוף פתוח' },
  links: [
    { href: 'ptsd.html', icon: 'book', title: D.tx('ptsd_info'), desc: 'שאלות ותשובות על פוסט טראומה, בשפה פשוטה.' },
    { href: 'self-help.html', icon: 'lifebuoy', title: D.tx('self_help'), desc: D.tx('self_help_intro').split('.')[0] + '.' },
    { href: 'rights.html', icon: 'shield', title: D.tx('rights'), desc: D.tx('rights_subtitle') },
    { href: 'treatment.html', icon: 'route', title: D.tx('treatment'), desc: D.tx('treatment_subtitle').split('.')[1].trim() },
    { href: 'community.html', icon: 'users', title: D.tx('community'), desc: D.tx('community_subtitle') },
    { href: 'children.html', icon: 'smile', title: D.tx('children_content'), desc: D.tx('children_intro').split('.')[0] + '.' },
  ],
});

export const secondCircle = () => pathHub({
  file: 'second-circle.html',
  title: D.tx('path2_title'),
  lead: D.tx('second_circle_welcome'),
  image: { src: 'img/secondcircle_hero.webp', alt: 'שתי דמויות יושבות זו מול זו' },
  links: [
    { href: 'ptsd.html', icon: 'book', title: D.tx('ptsd_info'), desc: 'שאלות ותשובות על פוסט טראומה, בשפה פשוטה.' },
    { href: 'second-circle-tools.html', icon: 'lifebuoy', title: D.tx('nav_second_circle_tools'), desc: D.tx('second_circle_tools_subtitle') },
    { href: 'rights.html', icon: 'shield', title: D.tx('rights'), desc: D.tx('rights_subtitle') },
    { href: 'treatment.html', icon: 'route', title: D.tx('treatment'), desc: D.tx('treatment_subtitle').split('.')[1].trim() },
    { href: 'children.html', icon: 'smile', title: D.tx('children_content'), desc: D.tx('children_intro').split('.')[0] + '.' },
    { href: 'community.html', icon: 'users', title: D.tx('community'), desc: D.tx('community_subtitle') },
  ],
});

/* ------------------------------------------------------------- self-help */

export const selfHelp = () => ({
  file: 'self-help.html',
  html: page({
    h1: D.tx('self_help_title'),
    lead: D.tx('self_help_intro'),
    crumbs: PATIENT,
    image: { src: 'img/selfhelp_hero.webp', alt: 'ידיים מחזיקות ספל חם' },
    body:
      band({
        labelledby: 'tools',
        inner: sectionHead({ title: 'חמישה כלים', id: 'tools', lead: 'כל כלי עומד בפני עצמו. אפשר לפתוח רק את מה שרלוונטי עכשיו.' })
          + accordions(D.selfHelpTools.map((t, i) => ({
            q: t.title_he,
            open: i === 0,
            html: md(t.content_he),
          })), 'tool'),
      })
      + band({
        mod: 'band--sea',
        inner: `      <div class="crisis">
        <div>
          <strong>${esc(D.tx('self_help_overflow_prompt'))}</strong>
          <p style="margin-top:var(--s1)">תרגילים קצרים שאפשר לעשות עכשיו, בלי הכנה.</p>
        </div>
        ${btn(D.tx('self_help_overflow_cta'), 'calming.html', 'primary', 'wind')}
      </div>`,
      })
      + crisis(),
  }),
});

/* ---------------------------------------------------------------- rights */

const RIGHT_CATS = [
  { key: 'security_forces', label: D.tx('rights_security') },
  { key: 'sexual_harassment', label: D.tx('rights_sexual') },
  { key: 'hostilities', label: D.tx('rights_hostilities') },
  { key: 'accidents_work', label: D.tx('rights_accidents') },
  { key: 'general', label: D.tx('rights_general') },
];

export const rights = () => {
  const items = [];
  for (const cat of RIGHT_CATS) {
    for (const faq of D.rightsFaqs[cat.key] || []) {
      items.push({
        q: faq.q,
        category: cat.key,
        html: md(faq.a)
          + (faq.steps ? `<h3>איך פונים</h3>\n${md(faq.steps)}` : '')
          + (faq.links?.length
            ? `<h3>קישורים</h3>\n<ul>${faq.links.map((l) => `<li><a class="link" href="${l.url}" target="_blank" rel="noopener">${esc(l.label)}</a></li>`).join('')}</ul>`
            : ''),
      });
    }
  }

  return {
    file: 'rights.html',
    html: page({
      h1: D.tx('rights_title'),
      lead: D.tx('rights_subtitle'),
      note: 'בחרו את הסיטואציה שלכם, ולחצו על שאלה כדי לקרוא את התשובה.',
      crumbs: PATIENT,
      image: { src: 'img/rights_hero.webp', alt: 'טפסים ועט על שולחן' },
      body: band({
        labelledby: 'faqs',
        inner: sectionHead({ title: 'שאלות ותשובות', id: 'faqs' })
          + filters([{ key: 'all', label: 'הכל' }, ...RIGHT_CATS], 'שאלות')
          + `      <div class="qa" style="margin-top:var(--s5)">
${items.map((it, i) => `        <div class="acc" data-category="${it.category}">
          <button class="acc__btn" type="button" aria-expanded="false" aria-controls="r${i + 1}">${esc(it.q)} ${icon('chevron')}</button>
          <div class="acc__panel" id="r${i + 1}" hidden>
${it.html}
          </div>
        </div>`).join('\n\n')}
      </div>
`,
      }) + crisis(),
    }),
  };
};

/* ------------------------------------------------------------- treatment */

export const treatment = () => ({
  file: 'treatment.html',
  html: page({
    h1: D.tx('treatment_title'),
    lead: D.tx('treatment_subtitle'),
    crumbs: PATIENT,
    image: { src: 'img/treatment_step1.webp', alt: 'שביל עולה בין עצים' },
    body:
      band({
        labelledby: 'steps',
        inner: sectionHead({ eyebrow: D.tx('step_label'), title: 'חמישה שלבים', id: 'steps', lead: 'לא חייבים להתחיל מהשלב הראשון. זו מפה, לא סדר.' })
          + steps(D.treatmentSteps.map((s, i) => ({
            title: s.title_he,
            desc: s.description_he,
            img: { src: `img/treatment_step${i + 1}.webp`, alt: s.title_he },
            html: (s.how_to_start_he ? `            <p class="caption" style="margin-top:var(--s2)">${esc(D.tx('how_to_start'))}</p>\n            <p>${esc(s.how_to_start_he)}</p>\n` : '')
              + (s.links?.length ? `            <div class="row" style="margin-top:var(--s2)">${s.links.map((l) => `<a class="link link--sm" href="${localLink(l.url)}">${esc(l.label)} ${icon('arrow', 'xs')}</a>`).join(' ')}</div>\n` : ''),
          }))),
      })
      + band({
        mod: 'band--grad-soft',
        labelledby: 'where',
        inner: sectionHead({ title: D.additions.TREATMENT_WHERE_BLOCK.title, id: 'where', lead: D.additions.TREATMENT_WHERE_BLOCK.text })
          + `      <div class="row">${btn(D.additions.TREATMENT_WHERE_BLOCK.linkLabel, 'where-to-get-help.html', 'primary', 'pin')}</div>`,
      })
      + crisis(),
  }),
});

/* ------------------------------------------------------------ communities */

const AUDIENCE_LABELS = {
  ptsd: 'מתמודדים', family: 'בני משפחה', partners: 'בני זוג', veterans: 'חיילים משוחררים',
  sexual_harassment: 'נפגעות ונפגעי תקיפה מינית', bereaved: 'משפחות שכולות', general: 'כללי',
};

export const community = () => ({
  file: 'community.html',
  html: page({
    h1: D.tx('community_title'),
    lead: D.tx('community_subtitle'),
    crumbs: PATIENT,
    image: { src: 'img/community_hero.webp', alt: 'אנשים יושבים במעגל' },
    body:
      band({
        labelledby: 'why',
        inner: sectionHead({ title: 'למה קבוצה', id: 'why' })
          + prose(`<p>${esc(D.tx('community_why_p1'))}</p>\n<p>${esc(D.tx('community_why_p2'))}</p>`),
      })
      + band({
        mod: 'band--tint',
        labelledby: 'list',
        inner: sectionHead({ title: 'הקהילות', id: 'list', lead: `${D.communities.length} קהילות וקווי סיוע, בארץ ובאינטרנט.` })
          + cards(D.communities.map((c) => ({
            title: c.name,
            desc: c.description_he,
            foot: `<a class="link" href="${esc(c.contact_url)}" target="_blank" rel="noopener">${esc(D.tx('join_community'))} ${icon('arrow')}</a>`,
          }))),
      })
      + crisis(),
  }),
});

/* -------------------------------------------------------------- children */

const AGE_TABS = [
  { key: '0-4', label: D.tx('age_until4') },
  { key: '4-6', label: D.tx('age_4_6') },
  { key: '7-10', label: D.tx('age_7_10') },
  { key: '10-13', label: D.tx('age_10_13') },
  { key: '14-16', label: D.tx('age_14_16') },
  { key: '16+', label: D.tx('age_16plus') },
];

export const children = () => {
  const blocks = AGE_TABS.map((tab) => {
    const data = D.childrenContent[tab.key] || {};
    const resources = (data.resources || []).map((r) => ({
      title: r.title_he,
      desc: r.description_he,
      foot: r.cta_url ? `<a class="link" href="${esc(r.cta_url)}" target="_blank" rel="noopener">${esc(r.cta_label || 'לפתיחה')} ${icon('arrow')}</a>` : '',
    }));
    return `        <div data-category="${tab.key}">
          <h3 class="h4">${esc(D.tx('children_guidelines'))} · ${esc(tab.label)}</h3>
          <div class="prose" style="margin-top:var(--s2)">
${md(data.guidelines || '')}
          </div>
${resources.length ? `          <h3 class="h4" style="margin-top:var(--s5)">${esc(D.tx('resources_library'))}</h3>
${cards(resources)}` : ''}        </div>`;
  }).join('\n');

  return {
    file: 'children.html',
    html: page({
      h1: D.tx('children_title'),
      lead: D.tx('children_intro'),
      crumbs: PATIENT,
      image: { src: 'img/children_hero.webp', alt: 'הורה וילד יושבים יחד' },
      body: band({
        labelledby: 'ages',
        inner: sectionHead({ title: 'לפי גיל', id: 'ages', lead: 'בחרו גיל, וקבלו את ההנחיות והחומרים שמתאימים לו.' })
          + filters([...AGE_TABS], 'גילאים', { counts: false })
          + `      <div style="margin-top:var(--s5)">\n${blocks}\n      </div>\n`,
      }) + crisis(),
    }),
  };
};

/* ------------------------------------------------- tools for the supporter */

export const secondCircleTools = () => ({
  file: 'second-circle-tools.html',
  html: page({
    h1: D.tx('second_circle_tools_title'),
    lead: D.tx('second_circle_tools_subtitle'),
    note: D.tx('second_circle_tools_intro'),
    crumbs: [...PATIENT, { label: D.tx('path2_title'), href: 'second-circle.html' }],
    image: { src: 'img/secondcircletools_hero.webp', alt: 'יד מונחת על כתף' },
    body: band({
      labelledby: 'tools',
      inner: sectionHead({ title: 'מצבים, ומה אפשר לעשות', id: 'tools' })
        + accordions(D.secondCircleTools.map((t, i) => ({
          q: t.q,
          open: i === 0,
          html: `<p>${esc(t.intro)}</p>\n`
            + (t.sections || []).map((s) => `<h3>${esc(s.heading)}</h3>\n${md(s.body)}`).join('\n')
            + (t.closing ? `<p>${esc(t.closing)}</p>` : '')
            + (t.callout ? `<p><strong>${esc(t.callout)}</strong></p>` : ''),
        })), 'sct'),
    }) + crisis(),
  }),
});

/* --------------------------------------------------------- questionnaire */

export const questionnairePage = () => {
  const q = D.questionnaire;
  const rows = q.questions.map((item, i) => `          <fieldset class="quiz__q" data-q="${i}">
            <legend><span class="quiz__no">${i + 1}</span> ${esc(item.text)}</legend>
            <div class="quiz__options">
${item.options.sort((a, b) => a.order - b.order).map((o) => `              <label class="quiz__option"><input type="radio" name="q${i}" value="${o.score}"><span>${esc(o.answer)}</span></label>`).join('\n')}
            </div>
          </fieldset>`).join('\n');

  return {
    file: 'questionnaire.html',
    html: page({
      h1: q.name,
      lead: q.description,
      note: D.tx('questionnaire_anonymous_note'),
      crumbs: PATIENT,
      image: { src: 'img/questionnaire_hero.webp', alt: 'אדם יושב ליד חלון' },
      body: band({
        labelledby: 'quiz-title',
        inner: sectionHead({ title: D.tx('pcl_instruction'), id: 'quiz-title', h: 'h2' })
          + `      <form class="quiz" id="quiz" data-cutoff="${q.cutoffScore}" data-max="${q.maxScore}" data-total="${q.totalQuestions}">
${rows}
        <div class="quiz__foot">
          <p class="quiz__left" id="quiz-left" role="status"></p>
          <div class="row">
            <button class="btn btn--primary" type="submit">${esc(D.tx('calculate'))}</button>
            <button class="btn btn--secondary" type="reset">${esc(D.tx('start_over'))}</button>
          </div>
        </div>
        <output class="quiz__result" id="quiz-result" hidden></output>
      </form>
`,
      }) + crisis(),
    }),
  };
};

/* ------------------------------------------------- free treatment and research */

const contactLine = (c) => {
  const value = c.value || c.href || '';
  if (/^https?:/.test(value)) return `<a class="link" href="${esc(value)}" target="_blank" rel="noopener">${esc(c.label)}</a>`;
  if (/^tel:|^[\d-]+$/.test(value)) return `<a class="link" href="tel:${esc(value.replace(/[^\d]/g, ''))}" dir="ltr">${esc(c.label)}</a>`;
  if (/@/.test(value)) return `<a class="link" href="mailto:${esc(value)}" dir="ltr">${esc(c.label)}</a>`;
  return esc(c.label);
};

const programEntry = (p, img) => entry({
  img,
  title: p.title,
  caption: p.provider,
  detail: [
    p.who && { dt: 'למי', dd: p.who },
    p.ages && { dt: 'גילאים', dd: p.ages },
    p.what && { dt: 'מה כולל', dd: p.what },
    p.process && { dt: 'תהליך הפנייה', dd: p.process },
    p.note && { dt: 'חשוב לדעת', dd: p.note },
  ].filter(Boolean).filter((d) => d.dd.length > 60),
  facts: [
    p.who && { dt: 'למי', dd: p.who },
    p.ages && { dt: 'גילאים', dd: p.ages },
    p.what && { dt: 'מה כולל', dd: p.what },
    p.location && { dt: 'מיקום', dd: p.location },
    p.cost && { dt: 'עלות', dd: p.cost },
    p.process && { dt: 'תהליך הפנייה', dd: p.process },
    p.note && { dt: 'חשוב לדעת', dd: p.note },
  ].filter(Boolean).filter((d) => d.dd.length <= 60),
  actions: (p.contacts || []).map((c) => `<span class="entry__contact">${contactLine(c)}</span>`),
});

export const freeTreatment = () => ({
  file: 'free-treatment.html',
  html: page({
    h1: 'טיפולים ללא עלות והשתתפות במחקרים',
    lead: 'מסגרות טיפול ללא עלות ומחקרים שמגייסים משתתפים. לכל מסגרת: למי היא מיועדת, מה היא כוללת, איך נקבעת ההתאמה ואיך פונים.',
    crumbs: PATIENT,
    image: { src: 'img/rights_hero.webp', alt: 'טפסים ועט על שולחן' },
    body:
      band({
        labelledby: 'free',
        inner: sectionHead({ title: 'מסגרות טיפול ללא עלות', id: 'free' })
          + entries(D.additions.FREE_TREATMENTS.map((p, i) => programEntry(p, { src: i === 0 ? 'img/support.webp' : 'img/clinic.webp', alt: p.title }))),
      })
      + band({
        mod: 'band--tint',
        labelledby: 'studies',
        inner: sectionHead({ title: 'מחקרים שמגייסים משתתפים', id: 'studies', lead: 'השתתפות במחקר היא בחירה אישית. ההתאמה נקבעת על ידי צוות המחקר בתהליך אבחון, ומטרת המחקר היא לבחון את הטיפולים.' })
          + entries(D.additions.RESEARCH_STUDIES.map((p) => programEntry(p))),
      })
      + band({
        labelledby: 'families',
        inner: sectionHead({ title: 'קבוצות למילואימניקים ולבני משפחותיהם', id: 'families' })
          + entries(D.additions.RESERVIST_FAMILY_PROGRAMS.map((p) => programEntry(p, { src: 'img/kids.webp', alt: p.title }))),
      })
      + band({
        mod: 'band--grad-soft',
        inner: `      <div class="crisis">
        <div>
          <strong>${esc(D.additions.CONSULTATION.title)}</strong>
          <p style="margin-top:var(--s1)">${esc(D.additions.CONSULTATION.text)}</p>
        </div>
        <a class="btn btn--primary" href="tel:${D.additions.CONSULTATION.phone.replace(/-/g, '')}">${icon('phone')} ${esc(D.additions.CONSULTATION.phone)}</a>
      </div>`,
      })
      + crisis(),
  }),
});

/* ---------------------------------------------------------------- calming */

export const calming = () => ({
  file: 'calming.html',
  html: page({
    h1: D.tx('calming_title'),
    lead: D.tx('calming_subtitle'),
    crumbs: PATIENT,
    headMod: 'pagehead--sea',
    image: { src: 'img/calming_main.webp', alt: 'נוף שקט בשעת בוקר' },
    body: band({
      labelledby: 'ex',
      inner: sectionHead({ title: 'שלושה תרגילים', id: 'ex' })
        + `      <div class="paths">
${[
  { href: 'calming-breathing.html', img: 'calming_breathing', title: D.tx('breathing_title'), sub: D.tx('breathing_subtitle') },
  { href: 'calming-grounding.html', img: 'calming_grounding', title: D.tx('grounding_title'), sub: D.tx('grounding_subtitle') },
  { href: 'calming-muscle.html', img: 'calming_muscle', title: D.tx('muscle_title'), sub: D.tx('muscle_subtitle') },
].map((e) => `        <a class="path" href="${e.href}">
          <div class="path__media"><img src="img/${e.img}.webp" alt="${esc(e.title)}" loading="lazy"></div>
          <div class="path__body">
            <h3>${esc(e.title)}</h3>
            <p>${esc(e.sub)}</p>
            <span class="link">להתחיל ${icon('arrow')}</span>
          </div>
        </a>`).join('\n')}
      </div>
`,
    }) + crisis(),
  }),
});

const exercisePage = ({ file, title, sub, image, intro, stepList, after }) => ({
  file,
  html: page({
    h1: title,
    lead: sub,
    note: intro,
    crumbs: [...PATIENT, { label: D.tx('calming_title'), href: 'calming.html' }],
    headMod: 'pagehead--sea',
    image,
    body: band({
      labelledby: 'how',
      inner: sectionHead({ title: 'איך עושים את זה', id: 'how' }) + steps(stepList),
    }) + (after || '') + crisis(),
  }),
});

export const calmingBreathing = () => exercisePage({
  file: 'calming-breathing.html',
  title: D.tx('breathing_title'),
  sub: D.tx('breathing_subtitle'),
  image: { src: 'img/calming_breathing.webp', alt: 'שמיים בהירים' },
  intro: D.tx('breathing_setup_title') + ': ' + [1, 2, 3, 4].map((n) => D.tx(`breathing_setup_step_${n}`)).join(' '),
  stepList: [
    { title: D.tx('breathing_inhale'), desc: 'ארבע שניות, דרך האף, אל הבטן.' },
    { title: D.tx('breathing_hold'), desc: 'ארבע שניות, בלי מאמץ.' },
    { title: D.tx('breathing_exhale'), desc: 'שמונה שניות, לאט, דרך הפה.' },
  ],
  after: band({
    mod: 'band--tint',
    inner: prose('<p>חוזרים על המחזור כמה פעמים. אם מרגישים סחרחורת - עוצרים, נושמים רגיל, וממשיכים כשנוח.</p>'),
  }),
});

export const calmingGrounding = () => exercisePage({
  file: 'calming-grounding.html',
  title: D.tx('grounding_title'),
  sub: D.tx('grounding_subtitle'),
  image: { src: 'img/calming_grounding.webp', alt: 'כף רגל על אדמה' },
  stepList: [5, 4, 3, 2, 1].map((n) => ({ title: String(n), desc: D.tx(`ground_step_${n}`) })),
  after: band({
    mod: 'band--tint',
    inner: prose(`<p>${esc(D.tx('ground_complete'))}</p>`),
  }),
});

export const calmingMuscle = () => exercisePage({
  file: 'calming-muscle.html',
  title: D.tx('muscle_page_title'),
  sub: D.tx('muscle_subtitle'),
  intro: D.tx('muscle_intro'),
  image: { src: 'img/calming_muscle.webp', alt: 'ידיים פתוחות' },
  stepList: [1, 2, 3, 4, 5, 6].map((n) => ({
    title: D.tx(`muscle_group_${n}_name`),
    desc: D.tx(`muscle_group_${n}_squeeze`),
    html: `            <p class="caption" style="margin-top:var(--s2)">ואז</p>\n            <p>${esc(D.tx(`muscle_group_${n}_release`))}</p>\n`,
  })),
  after: band({
    mod: 'band--tint',
    inner: prose(`<p><strong>${esc(D.tx('muscle_done_title'))}</strong> ${esc(D.tx('muscle_done_text'))}</p>`),
  }),
});

/* ---------------------------------------------------------------- sources */

export const sourcesPage = () => ({
  file: 'sources.html',
  html: page({
    h1: D.tx('sources_title'),
    lead: D.tx('sources_subtitle'),
    crumbs: PATIENT,
    image: { src: 'img/papers.webp', alt: 'ספרים ומאמרים על שולחן' },
    body: band({
      labelledby: 'srcs',
      inner: sectionHead({ title: 'המקורות', id: 'srcs', lead: `${D.tx('sources_approved_prefix')} מטיב.` })
        + listRows(D.sources.map((s) => ({
          title: s.title,
          href: s.url,
          meta: [s.authors, s.year].filter(Boolean).join(' · ') + (s.description_he ? ' — ' + s.description_he : ''),
        }))),
    }),
  }),
});

/* --------------------------------------------------- release journey (patient) */

export const releaseJourney = () => {
  const rj = D.releaseJourney.RELEASE_JOURNEY;
  return {
    file: 'release-journey.html',
    html: page({
      h1: rj.title,
      lead: rj.description,
      crumbs: PATIENT,
      image: { src: 'img/road.webp', alt: 'כביש פתוח בין הרים' },
      actions: `          ${btn('הרשמה למסע', rj.registerUrl, 'primary', 'route')}
          ${btn(rj.siteLabel, rj.siteUrl, 'secondary')}`,
      body:
        band({
          labelledby: 'what',
          inner: sectionHead({ title: 'מה זה', id: 'what' })
            + prose([rj.belief, rj.scope, rj.facilitators, rj.hosting, rj.partnership].map((p) => `<p>${esc(p)}</p>`).join('\n')),
        })
        + band({
          mod: 'band--tint',
          labelledby: 'models',
          inner: sectionHead({ title: 'שלושה מודלים', id: 'models' })
            + cards(D.releaseJourney.JOURNEY_MODELS.map((m) => ({
              title: m.title,
              desc: m.summary,
              foot: `<span class="caption">${esc(m.duration)}</span>`,
            }))),
        })
        + band({
          labelledby: 'hosts',
          inner: sectionHead({ title: 'קהילות מארחות', id: 'hosts' })
            + `      <div class="row">${rj.hostCountries.map((c) => `<span class="tag">${icon('pin', 'xs')} ${esc(c)}</span>`).join('')}</div>`,
        })
        + crisis(),
    }),
  };
};

/* A demo route like /patient/where-to-get-help#x maps onto the prototype's
   own file names. Anything not listed stays inert rather than guessing. */
function localLink(url = '') {
  const map = {
    '/patient/self-help': 'self-help.html',
    '/patient/where-to-get-help': 'where-to-get-help.html',
    '/patient/calming': 'calming.html',
    '/patient/rights': 'rights.html',
    '/patient/community': 'community.html',
    '/patient/ptsd-info': 'ptsd.html',
    '/patient/free-treatment-and-research': 'free-treatment.html',
    '/patient/questionnaire': 'questionnaire.html',
    '/patient/children': 'children.html',
  };
  const [path, hash] = String(url).split('#');
  if (map[path]) return map[path] + (hash ? '#' + hash : '');
  if (/^https?:/.test(url)) return url;
  return '#';
}

export const all = () => [
  firstCircle(), secondCircle(), selfHelp(), rights(), treatment(), community(),
  children(), secondCircleTools(), questionnairePage(), freeTreatment(),
  calming(), calmingBreathing(), calmingGrounding(), calmingMuscle(),
  sourcesPage(), releaseJourney(),
];
