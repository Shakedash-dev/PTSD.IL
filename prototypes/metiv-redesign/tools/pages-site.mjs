// The professional area and the organisation pages. Same rule as the patient
// module: every sentence comes from the demo.

import * as D from './data.mjs';
import {
  page, band, sectionHead, topics, accordions, cards, entry, entries, steps,
  prose, filters, people, listRows, next, btn, icon, md, esc,
} from './kit.mjs';

const THERAPIST = [{ label: 'למטפלים', href: 'therapists.html' }];
const ABOUT = [{ label: 'על מטיב', href: 'about.html' }];

const mail = (address, label) => `<a class="link" href="mailto:${esc(address)}" dir="ltr">${esc(label || address)}</a>`;
const tel = (number, label) => `<a class="link" href="tel:${String(number).replace(/[^\d]/g, '')}" dir="ltr">${esc(label || number)}</a>`;
const ext = (url, label) => `<a class="link" href="${esc(url)}" target="_blank" rel="noopener">${esc(label)} ${icon('arrow', 'xs')}</a>`;

/* ------------------------------------------------------------ supervision */

export const supervision = () => {
  const s = D.programs.SUPERVISION;
  return {
    file: 'supervision.html',
    html: page({
      h1: s.title,
      lead: s.intro,
      crumbs: THERAPIST,
      image: { src: 'img/journal.webp', alt: 'מחברת ועט על שולחן' },
      actions: `          ${btn('פנייה להדרכה', `mailto:${s.contact.email}`, 'primary', 'mail')}`,
      body:
        band({
          labelledby: 'challenges',
          inner: sectionHead({ title: 'הקשיים שהדרכה נותנת להם מקום', id: 'challenges' })
            + prose(`<ul>${s.challenges.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>`),
        })
        + band({
          mod: 'band--tint',
          labelledby: 'options',
          inner: sectionHead({ title: 'חמש אפשרויות', id: 'options' })
            + entries(s.options.map((o) => entry({
              title: o.title,
              caption: o.format,
              detail: o.description.length > 60 ? [{ dt: 'מה זה', dd: o.description }] : [],
              facts: [
                o.description.length <= 60 && { dt: 'מה זה', dd: o.description },
                o.price && { dt: 'עלות', dd: o.price },
              ].filter(Boolean),
              actions: o.contact?.email ? [`<span class="entry__contact">${mail(o.contact.email)}</span>`] : [],
            }))),
        })
        + band({
          labelledby: 'clients',
          inner: sectionHead({ title: 'גופים שמטיב הדריך', id: 'clients' })
            + `      <div class="row">${s.clientList.map((c) => `<span class="tag">${icon('building', 'xs')} ${esc(c)}</span>`).join('')}</div>`,
        }),
    }),
  };
};

/* --------------------------------------------------------- children and family */

export const childrenFamily = () => {
  const c = D.programs.CHILDREN_FAMILY_INTRO;
  return {
    file: 'children-family.html',
    html: page({
      h1: c.title,
      lead: c.paragraphs[0],
      crumbs: THERAPIST,
      image: { src: 'img/kids.webp', alt: 'הורה וילד ביער' },
      actions: `          ${btn('טופס פנייה להכשרה', c.trainingInterestFormUrl, 'primary', 'mail')}
          ${btn('אתר התוכנית', c.programSiteUrl, 'secondary')}`,
      body:
        band({
          labelledby: 'about',
          inner: sectionHead({ title: 'על המרכז', id: 'about' })
            + prose(c.paragraphs.slice(1).map((p) => `<p>${esc(p)}</p>`).join('\n')),
        })
        + band({
          mod: 'band--tint',
          labelledby: 'models',
          inner: sectionHead({ title: 'המודלים', id: 'models' })
            + entries(c.models.map((m) => entry({
              title: m.title,
              caption: m.fullName,
              detail: [{ dt: 'מה זה', dd: m.description }],
              facts: [
                { dt: 'גילאים', dd: m.ages },
                { dt: 'מבנה', dd: m.structure },
                { dt: 'פותח על ידי', dd: m.developedBy },
              ],
            }))),
        })
        + band({
          labelledby: 'trainings',
          inner: sectionHead({ title: 'הכשרות שחוזרות', id: 'trainings' })
            + `      <div class="row">${c.periodicTrainings.map((t) => `<span class="tag">${icon('cap', 'xs')} ${esc(t)}</span>`).join('')}</div>
      <p class="muted" style="margin-top:var(--s3)">${mail(c.contact.email)} · ${tel(c.contact.phone)}</p>`,
        }),
    }),
  };
};

/* ------------------------------------------------------------ organizations */

export const organizations = () => ({
  file: 'organizations.html',
  html: page({
    h1: 'תוכניות לארגונים',
    lead: 'הכשרות וליווי לארגונים, לצוותים, לרשויות ולקהילות.',
    crumbs: THERAPIST,
    image: { src: 'img/group.webp', alt: 'קבוצת אנשים בפגישה' },
    body: D.programs.ORGANIZATION_PROGRAMS.map((p, i) => band({
      mod: i % 2 ? 'band--tint' : '',
      labelledby: `prog-${p.slug}`,
      inner: sectionHead({ eyebrow: p.subtitle, title: p.title, id: `prog-${p.slug}`, lead: p.summary })
        + prose(md(p.description, { shift: 1 }))
        + `      <div class="row" style="margin-top:var(--s4)">
${p.audience.map((a) => `        <span class="tag">${icon('users', 'xs')} ${esc(a)}</span>`).join('\n')}
${p.formats.map((f) => `        <span class="tag">${icon('route', 'xs')} ${esc(f)}</span>`).join('\n')}
      </div>
${p.links?.length ? next(p.links.map((l) => ({ label: l.label, href: l.url }))) : ''}${p.contact ? `      <p class="muted" style="margin-top:var(--s3)">${esc(p.contact.name)}, ${esc(p.contact.role)} · ${mail(p.contact.email)}</p>\n` : ''}`,
    })).join(''),
  }),
});

/* ----------------------------------------------------------------- research */

export const researchPage = () => {
  const r = D.research.RESEARCH_INTRO;
  return {
    file: 'research.html',
    html: page({
      h1: r.title,
      lead: r.paragraphs[0],
      crumbs: THERAPIST,
      image: { src: 'img/papers.webp', alt: 'מאמרים על שולחן' },
      body:
        band({
          labelledby: 'about',
          inner: sectionHead({ title: 'מה היחידה עושה', id: 'about' })
            + prose(r.paragraphs.slice(1).map((p) => `<p>${esc(p)}</p>`).join('\n')
              + `<h3>מוקד</h3><p>${esc(r.focus)}</p><h3>התפקיד</h3><p>${esc(r.role)}</p>`
              + `<h3>עקרונות</h3><ul>${r.principles.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>`),
        })
        + band({
          mod: 'band--tint',
          labelledby: 'studies',
          inner: sectionHead({ title: 'מחקרים פעילים', id: 'studies', lead: `${D.research.ACTIVE_STUDIES.length} מחקרים. מי שמגייס משתתפים מסומן.` })
            + entries(D.research.ACTIVE_STUDIES.map((s) => entry({
              title: s.title,
              caption: s.status,
              detail: [s.description, s.summary].filter(Boolean)[0]?.length > 60
                ? [{ dt: 'על המחקר', dd: [s.description, s.summary].filter(Boolean)[0] }] : [],
              facts: [
                { dt: 'אוכלוסייה', dd: s.population },
                s.recruiting && { dt: 'גיוס', dd: 'מגייס משתתפים' },
              ].filter(Boolean),
            }))),
        })
        + band({
          labelledby: 'club',
          inner: sectionHead({ title: r.journalClub.title, id: 'club', lead: r.journalClub.description })
            + `      <div class="row">${btn('לצפייה', r.journalClub.url, 'secondary')}</div>`,
        })
        + band({
          mod: 'band--grad-soft',
          inner: `      <div class="crisis">
        <div>
          <strong>שיתוף פעולה במחקר</strong>
          <p style="margin-top:var(--s1)">${esc(r.collaborationContact.name)}, ${esc(r.collaborationContact.role)}</p>
        </div>
        ${btn(r.collaborationContact.email, `mailto:${r.collaborationContact.email}`, 'primary', 'mail')}
      </div>`,
        }),
    }),
  };
};

/* ------------------------------------------------------------- publications */

export const publications = () => {
  const topics_ = D.research.PAPER_TOPICS;
  const papers = D.research.PAPERS;
  const used = [...new Set(papers.map((p) => p.topic))];
  return {
    file: 'publications.html',
    html: page({
      h1: 'פרסומים',
      lead: 'ספרים, מאמרים ופרקים שפרסמו אנשי מטיב.',
      crumbs: THERAPIST,
      image: { src: 'img/journal.webp', alt: 'ספרים פתוחים' },
      body:
        band({
          labelledby: 'books',
          inner: sectionHead({ title: 'ספרים', id: 'books' })
            + cards(D.research.BOOKS.map((b) => ({
              title: b.title,
              desc: `${b.authors.join(', ')} · ${b.publisher}, ${b.year}`,
              foot: b.url ? ext(b.url, 'לפרטים') : '',
            })))
            + `      <p class="muted" style="margin-top:var(--s3)">${esc(D.research.RESEARCH_INTRO.booksOrderingNote)}</p>`,
        })
        + band({
          mod: 'band--tint',
          labelledby: 'papers',
          inner: sectionHead({ title: 'מאמרים', id: 'papers', lead: `${papers.length} פרסומים, לפי נושא.` })
            + filters([{ key: 'all', label: 'הכל' }, ...used.map((k) => ({ key: k, label: topics_[k] || k }))], 'מאמרים')
            + `      <div style="margin-top:var(--s5)">
${listRows(papers.map((p) => ({
    title: p.title,
    href: p.url,
    category: p.topic,
    meta: `${p.authors.join(', ')} · ${p.journal}${p.details ? ' · ' + p.details : ''}`,
    aside: String(p.year),
  })))}      </div>
`,
        }),
    }),
  };
};

/* ---------------------------------------------------------------- articles */

export const articlesIndex = () => ({
  file: 'articles.html',
  html: page({
    h1: 'מאמרים',
    lead: 'כתיבה מקצועית של צוות מטיב.',
    crumbs: THERAPIST,
    image: { src: 'img/journal.webp', alt: 'מחברת פתוחה' },
    body: band({
      labelledby: 'list',
      inner: sectionHead({ title: `${D.articles.ARTICLES.length} מאמרים`, id: 'list' })
        + cards(D.articles.ARTICLES.map((a) => ({
          title: a.title,
          desc: a.excerpt,
          foot: `<a class="link" href="article-${a.slug}.html">לקריאה ${icon('arrow')}</a>`,
        }))),
    }),
  }),
});

export const articlePages = () => D.articles.ARTICLES.map((a) => ({
  file: `article-${a.slug}.html`,
  html: page({
    h1: a.title,
    lead: a.excerpt,
    note: `${a.authors.join(', ')} · ${a.authorsAffiliation} · ${a.date} · ${a.readingMinutes} דקות קריאה`,
    crumbs: [...THERAPIST, { label: 'מאמרים', href: 'articles.html' }],
    body: band({ inner: prose(md(a.body)) })
      + band({
        mod: 'band--tint',
        inner: `      <div class="row">${a.tags.map((t) => `<span class="tag">${icon('file', 'xs')} ${esc(t)}</span>`).join('')}</div>`,
      }),
  }),
}));

/* ------------------------------------------------------------------ events */

export const events = () => ({
  file: 'events.html',
  html: page({
    h1: 'אירועים ועדכונים',
    lead: 'מחזורי קורסים, סדנאות וכנסים - הקרובים ואלה שכבר התקיימו.',
    crumbs: THERAPIST,
    image: { src: 'img/group.webp', alt: 'אולם כנס' },
    body:
      band({
        labelledby: 'up',
        inner: sectionHead({ title: 'קרובים', id: 'up', lead: `${D.articles.UPCOMING_EVENTS.length} אירועים` })
          + entries(D.articles.UPCOMING_EVENTS.map((e) => entry({
            title: e.title,
            caption: e.type,
            detail: e.summary.length > 60 ? [{ dt: 'מה זה', dd: e.summary }] : [],
            facts: [
              { dt: 'מתי', dd: e.date },
              e.location && { dt: 'איפה', dd: e.location },
              e.price && { dt: 'עלות', dd: e.price },
            ].filter(Boolean),
            actions: e.courseSlug ? [`<a class="btn btn--primary btn--sm" href="courses.html">לקטלוג הקורסים</a>`] : [],
          }))),
      })
      + band({
        mod: 'band--tint',
        labelledby: 'past',
        inner: sectionHead({ title: 'שהתקיימו', id: 'past', lead: `${D.articles.PAST_EVENTS.length} אירועים` })
          + listRows(D.articles.PAST_EVENTS.map((e) => ({
            title: e.title,
            meta: [e.type, e.location, e.summary].filter(Boolean).join(' · '),
            aside: e.date,
          }))),
      }),
  }),
});

/* ------------------------------------------- release journey, professional */

export const releaseJourneyPro = () => {
  const rj = D.releaseJourney.RELEASE_JOURNEY;
  const contacts = Object.values(D.releaseJourney.RELEASE_JOURNEY_CONTACTS);
  return {
    file: 'release-journey-pro.html',
    html: page({
      h1: `${rj.title} - לאנשי מקצוע`,
      lead: rj.description,
      crumbs: THERAPIST,
      image: { src: 'img/road.webp', alt: 'דרך בין הרים' },
      actions: `          ${btn(rj.siteLabel, rj.siteUrl, 'primary')}`,
      body:
        band({
          labelledby: 'facts',
          inner: `      <div class="stats">
${D.releaseJourney.RELEASE_JOURNEY_STATS.map((s) => `        <div class="stat"><b data-to="${String(s.value).replace(/[^\d]/g, '')}" data-prefix="${/^\+/.test(s.value) ? '+' : ''}">${esc(s.value)}</b><small>${esc(s.label)}</small></div>`).join('\n')}
      </div>
`,
        })
        + band({
          labelledby: 'models',
          inner: sectionHead({ title: 'שלושה מודלים', id: 'models' })
            + D.releaseJourney.JOURNEY_MODELS.map((m, i) => `      <h3 class="h4"${i ? ' style="margin-top:var(--s6)"' : ''}>${esc(m.title)}</h3>
      <p class="muted" style="margin-top:var(--s1)">${esc(m.summary)} · ${esc(m.duration)}</p>
${steps((m.workshops || []).map((w) => ({ title: w.title, desc: w.text })))}`).join('\n'),
        })
        + band({
          mod: 'band--tint',
          labelledby: 'who',
          inner: sectionHead({ title: 'מי מוביל', id: 'who', lead: rj.facilitators })
            + people(contacts),
        })
        + band({
          labelledby: 'credits',
          inner: sectionHead({ title: 'רקע', id: 'credits' })
            + prose([...rj.credits, rj.partnership].map((c) => `<p>${esc(c)}</p>`).join('\n')),
        }),
    }),
  };
};

/* ------------------------------------------------------------------ history */

export const history = () => {
  const a = D.org.ABOUT;
  return {
    file: 'history.html',
    html: page({
      h1: 'הסיפור של מטיב',
      lead: D.org.ORG.vision,
      crumbs: ABOUT,
      image: { src: 'img/group.webp', alt: 'אנשים יושבים יחד' },
      body:
        band({
          labelledby: 'story',
          inner: sectionHead({ title: 'איך זה התחיל', id: 'story' })
            + prose(a.history.map((p) => `<p>${esc(p)}</p>`).join('\n')),
        })
        + band({
          mod: 'band--tint',
          labelledby: 'timeline',
          inner: sectionHead({ title: 'ציר הזמן', id: 'timeline' })
            + steps(a.timeline.map((t) => ({ title: t.year, desc: t.text }))),
        })
        + band({
          labelledby: 'activities',
          inner: sectionHead({ title: 'מה מטיב עושה', id: 'activities' })
            + prose(`<ul>${a.activities.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`),
        })
        + band({
          mod: 'band--sea',
          labelledby: 'reach',
          inner: sectionHead({ title: 'בארץ ובעולם', id: 'reach' })
            + `      <h3 class="h4">קהילות בישראל</h3>
      <div class="row" style="margin-top:var(--s2)">${a.communities.map((c) => `<span class="tag">${icon('pin', 'xs')} ${esc(c)}</span>`).join('')}</div>
      <h3 class="h4" style="margin-top:var(--s5)">מדינות</h3>
      <div class="row" style="margin-top:var(--s2)">${a.partnersAbroad.map((c) => `<span class="tag">${icon('compass', 'xs')} ${esc(c)}</span>`).join('')}</div>`,
        }),
    }),
  };
};

/* --------------------------------------------------------------------- team */

export const team = () => ({
  file: 'team.html',
  html: page({
    h1: 'הצוות',
    lead: D.org.ABOUT.teamIntro,
    crumbs: ABOUT,
    image: { src: 'img/clinic.webp', alt: 'אנשי מקצוע בפגישה' },
    body: D.org.TEAM_GROUPS.map((group, i) => {
      const members = D.org.TEAM.filter((t) => t.group === group);
      if (!members.length) return '';
      return band({
        mod: i % 2 ? 'band--tint' : '',
        labelledby: `g${i}`,
        inner: sectionHead({ title: group, id: `g${i}`, lead: `${members.length} אנשי צוות` })
          + people(members),
      });
    }).join(''),
  }),
});

/* ----------------------------------------------------------------- partners */

const partnerGroups = (groups, extra = '') => groups.map((g, i) => band({
  mod: i % 2 ? 'band--tint' : '',
  labelledby: `pg-${g.key}`,
  inner: sectionHead({ title: g.title, id: `pg-${g.key}`, lead: g.intro })
    + entries(g.partners.map((p) => entry({
      title: p.name,
      detail: p.role && p.role.length > 60 ? [{ dt: 'הקשר', dd: p.role }] : [],
      facts: [
        p.role && p.role.length <= 60 && { dt: 'הקשר', dd: p.role },
        p.forYou && { dt: 'מה זה אומר עבורך', dd: p.forYou },
      ].filter(Boolean),
      actions: (p.links || []).map((l) => ext(l.url, l.label)),
    }))),
})).join('') + extra;

export const partners = () => ({
  file: 'partners.html',
  html: page({
    h1: 'השותפים שלנו',
    lead: 'הגופים שמטיב פועל יחד איתם, ומה זה אומר למי שפונה.',
    crumbs: ABOUT,
    image: { src: 'img/group.webp', alt: 'ישיבת עבודה' },
    body: partnerGroups(D.aboutMetiv.PARTNER_GROUPS),
  }),
});

export const collaborations = () => {
  const c = D.aboutMetiv.COLLABORATION_CONTACT;
  return {
    file: 'collaborations.html',
    html: page({
      h1: 'שיתופי פעולה',
      lead: 'מוסדות, חוקרים וארגונים שמטיב עובד איתם.',
      crumbs: ABOUT,
      image: { src: 'img/journal.webp', alt: 'שולחן עבודה משותף' },
      body: partnerGroups(D.aboutMetiv.COLLABORATION_GROUPS, c ? band({
        mod: 'band--grad-soft',
        inner: `      <div class="crisis">
        <div>
          <strong>שיתוף פעולה חדש</strong>
          <p style="margin-top:var(--s1)">${esc(c.name)}${c.role ? ', ' + esc(c.role) : ''}</p>
        </div>
${c.email ? `        ${btn(c.email, `mailto:${c.email}`, 'primary', 'mail')}\n` : ''}      </div>`,
      }) : ''),
    }),
  };
};

/* ----------------------------------------------------------------- contact */

export const contact = () => {
  const o = D.org.ORG;
  return {
    file: 'contact.html',
    html: page({
      h1: 'יצירת קשר',
      lead: `${o.address}. ${o.mail}.`,
      crumbs: ABOUT,
      image: { src: 'img/clinic.webp', alt: 'דלפק קבלה' },
      body:
        band({
          labelledby: 'phones',
          inner: sectionHead({ title: 'טלפונים', id: 'phones' })
            + listRows([
              { title: 'מטיב, מרכזייה', meta: o.phones.main },
              { title: 'מטיב ילדים', meta: o.phones.kids },
              { title: 'קורסים והכשרות (וואטסאפ)', meta: o.phones.coursesWhatsapp },
              { title: 'מחקר (וואטסאפ)', meta: o.phones.researchWhatsapp },
              { title: 'רכזת נגישות', meta: o.phones.accessibilityCoordinator },
              { title: 'פקס', meta: o.phones.fax },
            ].map((r) => ({ ...r, href: `tel:${r.meta.replace(/[^\d]/g, '')}` }))),
        })
        + band({
          mod: 'band--tint',
          labelledby: 'emails',
          inner: sectionHead({ title: 'כתובות דוא"ל', id: 'emails' })
            + listRows([
              { title: 'פניות כלליות', meta: o.emails.general },
              { title: 'מטיב ילדים', meta: o.emails.kids },
              { title: 'קורסים והכשרות', meta: o.emails.courses },
              { title: 'מחקר', meta: o.emails.research },
              { title: 'הרשמה', meta: o.emails.registration },
              { title: 'שותפויות ותרומות', meta: o.emails.partnerships },
            ].map((r) => ({ ...r, href: `mailto:${r.meta}` }))),
        })
        + band({
          labelledby: 'forms',
          inner: sectionHead({ title: 'טפסי פנייה', id: 'forms' })
            + next([
              { label: 'פנייה למרפאת המבוגרים', href: o.adultsClinicFormUrl },
              { label: 'פנייה למטיב ילדים', href: o.kidsClinicFormUrl },
              { label: 'פנייה להכשרה או הדרכה', href: o.trainingsFormUrl },
            ]),
        })
        + band({
          mod: 'band--sea',
          labelledby: 'social',
          inner: sectionHead({ title: 'ברשתות', id: 'social' })
            + next([
              { label: 'פייסבוק', href: o.social.facebook },
              { label: 'פייסבוק - מטיב ילדים', href: o.social.facebookKids },
              { label: 'יוטיוב', href: o.social.youtube },
            ]),
        }),
    }),
  };
};

/* ------------------------------------------------------------------ donate */

export const donate = () => {
  const d = D.org.DONATE;
  return {
    file: 'donate.html',
    html: page({
      h1: d.title,
      lead: d.intro,
      crumbs: ABOUT,
      image: { src: 'img/support.webp', alt: 'ידיים אוחזות זו בזו' },
      body:
        band({
          labelledby: 'ways',
          inner: sectionHead({ title: 'דרכים לתרום', id: 'ways' })
            + cards(d.ways.map((w) => ({
              title: w.title,
              desc: w.description,
              foot: w.url ? `<a class="btn btn--donate btn--sm" href="${esc(w.url)}">${esc(w.cta)}</a>` : '',
            }))),
        })
        + band({
          mod: 'band--tint',
          inner: prose(`<p>${esc(d.paymentNote)}</p><p>${esc(d.legalEntity)}</p>`),
        }),
    }),
  };
};

/* ------------------------------------------------------------------- legal */

const legalPage = ({ file, title, updated, intro, demoNote, sections, after = '' }) => ({
  file,
  html: page({
    h1: title,
    lead: intro,
    note: updated ? `עודכן ב-${updated}` : '',
    crumbs: ABOUT,
    body: (demoNote ? band({ mod: 'band--tint', inner: prose(`<p>${esc(demoNote)}</p>`) }) : '')
      + band({
        inner: prose(sections.map((s) => `<h2>${esc(s.title)}</h2>\n${md(s.body)}`).join('\n')),
      })
      + after,
  }),
});

export const accessibility = () => {
  const a = D.org.LEGAL.accessibility;
  return legalPage({
    file: 'accessibility.html',
    title: a.title,
    updated: a.updated,
    demoNote: a.demoNote,
    sections: a.sections,
    after: band({
      mod: 'band--grad-soft',
      inner: `      <div class="crisis">
        <div>
          <strong>רכזת הנגישות</strong>
          <p style="margin-top:var(--s1)">${esc(a.coordinator.address)}</p>
        </div>
        <div class="row">
          ${btn(a.coordinator.phone, `tel:${a.coordinator.phone.replace(/[^\d]/g, '')}`, 'primary', 'phone')}
          ${btn(a.coordinator.email, `mailto:${a.coordinator.email}`, 'secondary', 'mail')}
        </div>
      </div>`,
    }),
  });
};

export const privacy = () => {
  const p = D.org.LEGAL.privacy;
  return legalPage({ file: 'privacy.html', title: p.title, updated: D.legal.PRIVACY_UPDATED_HE, intro: p.intro, sections: p.sections });
};

export const terms = () => ({
  file: 'terms.html',
  html: page({
    h1: 'תנאי שימוש',
    note: `עודכן ב-${D.legal.TERMS_UPDATED_HE}`,
    crumbs: ABOUT,
    body: band({ inner: prose(md(D.legal.TERMS_HE)) }),
  }),
});

export const all = () => [
  supervision(), childrenFamily(), organizations(), researchPage(), publications(),
  articlesIndex(), ...articlePages(), events(), releaseJourneyPro(),
  history(), team(), partners(), collaborations(), contact(), donate(),
  accessibility(), privacy(), terms(),
];
