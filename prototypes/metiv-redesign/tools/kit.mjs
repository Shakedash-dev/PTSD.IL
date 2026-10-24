// Render helpers for the generated pages.
//
// Every page under tools/pages.mjs is written with these and nothing else, so
// a change to a pattern happens in one place and the markup stays identical
// from page to page. The helpers emit the classes that already exist in
// styles.css; when a page needs something the stylesheet does not have, that
// is a new component and it gets added to styles.css deliberately, not
// improvised here.

export const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const attr = (name, value) => (value ? ` ${name}="${esc(value)}"` : '');

export const icon = (name, size = 'sm') =>
  `<svg class="icon-${size}" aria-hidden="true"><use href="#i-${name}"/></svg>`;

/* ----------------------------------------------------------------- markdown
   The demo stores long text as markdown: `##` headings, `**bold**`, `-   `
   bullets, `1.  ` numbers and [label](url) links. This renders exactly those
   and nothing more - anything else in the source would come out as plain text
   rather than silently disappear. */
export function md(src = '', { shift = 0 } = {}) {
  const inline = (t) =>
    esc(t)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, label, url) =>
        `<a class="link" href="${url}"${/^https?:/.test(url) ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');

  const out = [];
  let list = null; // 'ul' | 'ol'
  const closeList = () => { if (list) { out.push(`</${list}>`); list = null; } };

  for (const raw of String(src).split('\n')) {
    const line = raw.trim();
    if (!line) { closeList(); continue; }

    const h = line.match(/^(#{2,4})\s+(.*)$/);
    if (h) {
      // `shift` moves the whole heading run down a level, for markdown that is
      // rendered underneath a section heading the page already set.
      const level = Math.min(6, h[1].length + shift);
      closeList();
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
      continue;
    }

    const ul = line.match(/^[-*]\s+(.*)$/);
    if (ul) {
      if (list !== 'ul') { closeList(); out.push('<ul>'); list = 'ul'; }
      out.push(`<li>${inline(ul[1])}</li>`);
      continue;
    }

    const ol = line.match(/^\d+[.)]\s+(.*)$/);
    if (ol) {
      if (list !== 'ol') { closeList(); out.push('<ol>'); list = 'ol'; }
      out.push(`<li>${inline(ol[1])}</li>`);
      continue;
    }

    closeList();
    out.push(`<p>${inline(line)}</p>`);
  }
  closeList();
  return out.join('\n');
}

/* ------------------------------------------------------------------- shell */

/**
 * One page. `crumbs` is everything above this page, in order; the page's own
 * name is added as the current item.
 */
export function page({
  title, crumbs = [], h1, lead, note, image, headMod = '', actions = '', body, bodyEnd = '',
}) {
  const trail = [{ label: 'מטיב', href: 'index.html' }, ...crumbs]
    .map((c) => `<a href="${c.href}">${esc(c.label)}</a>`)
    .concat(`<span aria-current="page">${esc(h1)}</span>`)
    .join('\n          <svg aria-hidden="true"><use href="#i-left"/></svg>\n          ');

  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>${esc(title || h1)} | מטיב</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="styles.css">
<script src="site.js" defer></script>
</head>
<body>

<div id="site-chrome" style="min-height:112px"></div>

<main id="top">

  <header class="pagehead${headMod ? ' ' + headMod : ''}">
    <div class="wrap pagehead__grid">
      <div>
        <nav class="crumbs" aria-label="מיקום בעמוד">
          ${trail}
        </nav>
        <h1>${esc(h1)}</h1>
${lead ? `        <p class="lead">${esc(lead)}</p>\n` : ''}${note ? `        <p class="muted" style="margin-top:var(--s2); max-width:44rem">${esc(note)}</p>\n` : ''}${actions ? `        <div class="pagehead__actions">\n${actions}\n        </div>\n` : ''}      </div>
${image ? `      <div class="pagehead__media">
        <img src="${esc(image.src)}" alt="${esc(image.alt)}">
      </div>\n` : ''}    </div>
  </header>

${body}
${bodyEnd}
</main>

<div id="site-footer"></div>

</body>
</html>
`;
}

/** A section. `mod` is one of '', 'band--tint', 'band--sea', 'band--grad-soft'. */
export function band({ mod = '', id = '', labelledby = '', inner }) {
  return `  <section class="band${mod ? ' ' + mod : ''}"${attr('id', id)}${attr('aria-labelledby', labelledby)}>
    <div class="wrap">
${inner}
    </div>
  </section>
`;
}

export function sectionHead({ eyebrow, title, lead, id, h = 'h1' }) {
  return `      <div class="section-head">
${eyebrow ? `        <p class="eyebrow">${esc(eyebrow)}</p>\n` : ''}        <h2 class="${h}"${attr('id', id)}>${esc(title)}</h2>
${lead ? `        <p class="lead">${esc(lead)}</p>\n` : ''}      </div>
`;
}

/** Heading with the section's one action opposite it. */
export function splitHead({ eyebrow, title, id, action, h = 'h1' }) {
  return `      <div class="section-head section-head--split">
        <div>
${eyebrow ? `          <p class="eyebrow">${esc(eyebrow)}</p>\n` : ''}          <h2 class="${h}"${attr('id', id)}>${esc(title)}</h2>
        </div>
${action}
      </div>
`;
}

/* ---------------------------------------------------------------- patterns */

/** Icon, name, one line. The workhorse for "what is in this area". */
export function topics(items, mod = '') {
  const rows = items.map((t) =>
    `        <a class="topic" href="${esc(t.href)}"><span class="topic__mark">${icon(t.icon)}</span><span><b>${esc(t.title)}</b>${t.desc ? `<small>${esc(t.desc)}</small>` : ''}</span></a>`
  ).join('\n');
  return `      <div class="topics${mod ? ' ' + mod : ''}">
${rows}
      </div>
`;
}

/** Question and answer. `open` marks the one that starts expanded. */
export function accordions(items, prefix) {
  return `      <div class="qa">
${items.map((it, i) => {
    const id = `${prefix}${i + 1}`;
    return `        <div class="acc">
          <button class="acc__btn" type="button" aria-expanded="${it.open ? 'true' : 'false'}" aria-controls="${id}">${esc(it.q)} ${icon('chevron')}</button>
          <div class="acc__panel" id="${id}"${it.open ? '' : ' hidden'}>
${it.html}
          </div>
        </div>`;
  }).join('\n\n')}
      </div>
`;
}

/** A photo card in a uniform grid. */
export function cards(items) {
  return `      <div class="cards">
${items.map((c) => `        <article class="card"${c.category ? ` data-category="${esc(c.category)}"` : ''}>
${c.img ? `          <div class="card__media"><img src="${esc(c.img.src)}" alt="${esc(c.img.alt)}" loading="lazy"></div>\n` : ''}          <div class="card__body">
            <h3>${esc(c.title)}</h3>
${c.desc ? `            <p class="card__desc">${esc(c.desc)}</p>\n` : ''}          </div>
${c.foot ? `          <div class="card__foot">${c.foot}</div>\n` : ''}        </article>`).join('\n')}
      </div>
`;
}

/** The entry card: photo, reading column, one strip of facts and actions. */
export function entry({ img, title, caption, detail = [], facts = [], actions = [] }) {
  const plain = img ? '' : ' entry--plain';
  return `        <article class="entry${plain}">
${img ? `          <div class="entry__media"><img src="${esc(img.src)}" alt="${esc(img.alt)}" loading="lazy"></div>\n` : ''}          <div class="entry__content">
            <div class="entry__head">
              <h3>${esc(title)}</h3>
${caption ? `              <p class="caption">${esc(caption)}</p>\n` : ''}${detail.length ? `              <dl class="entry__detail">
${detail.map((d) => `                <dt>${esc(d.dt)}</dt><dd>${d.html || esc(d.dd)}</dd>`).join('\n')}
              </dl>\n` : ''}            </div>
          </div>
${(facts.length || actions.length) ? `          <div class="entry__foot">
${facts.length ? `            <dl class="entry__facts">
${facts.map((f) => `              <div><dt>${esc(f.dt)}</dt><dd>${f.html || esc(f.dd)}</dd></div>`).join('\n')}
            </dl>\n` : ''}${actions.length ? `            <div class="entry__actions">
${actions.map((a) => `              ${a}`).join('\n')}
            </div>\n` : ''}          </div>\n` : ''}        </article>`;
}

export const entries = (list) => `      <div class="entries">
${list.join('\n')}
      </div>
`;

/** Numbered steps down the page. */
export function steps(items) {
  return `      <ol class="steps">
${items.map((s, i) => `        <li class="step">
          <div class="step__no" aria-hidden="true">${i + 1}</div>
          <div class="step__body">
            <h3>${esc(s.title)}</h3>
${s.desc ? `            <p>${esc(s.desc)}</p>\n` : ''}${s.html || ''}          </div>
${s.img ? `          <div class="step__media"><img src="${esc(s.img.src)}" alt="${esc(s.img.alt)}" loading="lazy"></div>\n` : ''}        </li>`).join('\n')}
      </ol>
`;
}

/** A plain reading column: long text, nothing else. */
export const prose = (html) => `      <div class="prose">
${html}
      </div>
`;

/** Pill filters over a set of [data-category] items. */
export function filters(items, noun, { counts = true } = {}) {
  return `      <div class="filters" role="group" aria-label="סינון" data-noun="${esc(noun)}">
${items.map((f) => `        <button class="filter" type="button" data-filter="${esc(f.key)}" aria-pressed="${f.key === 'all' ? 'true' : 'false'}">${esc(f.label)}${counts ? ' <span class="filter__count"></span>' : ''}</button>`).join('\n')}
      </div>
${counts ? '      <p class="result-count" id="result-count" role="status"></p>\n' : ''}`;
}

/** A section the reader opens. */
export function toggleSection({ id, show, hide, inner }) {
  return `      <button class="toggle" type="button" data-toggle aria-expanded="false" aria-controls="${id}" data-show="${esc(show)}" data-hide="${esc(hide)}">
        <span class="toggle__label">${esc(show)}</span> ${icon('chevron')}
      </button>
      <div id="${id}" hidden>
${inner}
      </div>
`;
}

/** People, as names and roles. No avatars: the demo has no photographs of them. */
export function people(list) {
  return `      <div class="team">
${list.map((p) => `        <article class="person">
          <h3>${esc(p.name)}</h3>
          <p class="caption">${esc(p.role)}</p>
${p.bio ? `          <p>${esc(p.bio)}</p>\n` : ''}        </article>`).join('\n')}
      </div>
`;
}

/** A long reference list: one line per item, no card around it. */
export function listRows(items) {
  return `      <ul class="rows">
${items.map((r) => `        <li class="row-item"${r.category ? ` data-category="${esc(r.category)}"` : ''}>
          <div>
            <b>${r.href ? `<a class="link" href="${esc(r.href)}"${/^https?:/.test(r.href) ? ' target="_blank" rel="noopener"' : ''}>${esc(r.title)}</a>` : esc(r.title)}</b>
${r.meta ? `            <small>${esc(r.meta)}</small>\n` : ''}          </div>
${r.aside ? `          <span class="row-item__aside">${esc(r.aside)}</span>\n` : ''}        </li>`).join('\n')}
      </ul>
`;
}

/** The crisis line, at the foot of a patient-facing page. */
export const crisis = () => band({
  inner: `      <div class="crisis">
        <div>
          <strong>צריך לדבר עם מישהו עכשיו?</strong>
          <p style="margin-top:var(--s1)">ער"ן, עזרה ראשונה נפשית, זמין בכל שעה. במצב חירום רפואי: מד"א 101.</p>
        </div>
        <a class="btn btn--primary" href="tel:1201">
          ${icon('phone')}
          ער"ן 1201
        </a>
      </div>`,
});

/** "Where to go from here" - a row of plain links with an arrow. */
export function next(links) {
  return `      <div class="next">
${links.map((l) => `        <a href="${esc(l.href)}">${esc(l.label)} ${icon('arrow')}</a>`).join('\n')}
      </div>
`;
}

export const btn = (label, href, role = 'primary', iconName) =>
  `<a class="btn btn--${role}" href="${esc(href)}">${iconName ? icon(iconName) + ' ' : ''}${esc(label)}</a>`;
