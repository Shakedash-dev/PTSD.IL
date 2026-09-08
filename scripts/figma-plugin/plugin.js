/* eslint-disable */
// PTSD.IL design system -> Figma.
//
// DATA is injected above this file by scripts/build-figma-specs.mjs and holds
// the tokens and the resolved component specs. Everything drawn here comes from
// those numbers, which were resolved from the CSS the site actually ships, so
// the frames match the running site rather than an approximation of it.

const { tokens, specs, strings, meta } = DATA;

const log = (m) => figma.notify(m, { timeout: 1500 });

/** Look up a resolved spec, failing loudly. Silently skipping a missing spec
 *  would produce a Figma file that quietly does not match the site, which is
 *  the one outcome this whole pipeline exists to prevent. */
function requireSpec(component, key) {
  const group = specs[component];
  if (!group || !group[key]) {
    throw new Error(
      `missing spec ${component}/${key} - regenerate with \`npm run figma\` from src/`
    );
  }
  return group[key];
}

/* ------------------------------------------------------------------ helpers */

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
  };
}

const px = (v) => (typeof v === 'number' ? v : parseFloat(String(v))) || 0;

/** Pull a numeric px value out of a resolved spec, with a fallback. */
function cssPx(spec, prop, fallback = 0) {
  const d = spec && spec.css && spec.css[prop];
  if (!d) return fallback;
  const n = parseFloat(String(d.value));
  return Number.isNaN(n) ? fallback : n;
}

function cssColor(spec, prop) {
  const d = spec && spec.css && spec.css[prop];
  if (!d || !d.hex) return null;
  return { hex: d.hex, alpha: typeof d.alpha === 'number' ? d.alpha : 1, token: d.token };
}

function solid(colour, variableByToken) {
  if (!colour) return [];
  const paint = { type: 'SOLID', color: hexToRgb(colour.hex), opacity: colour.alpha };
  const variable = colour.token && variableByToken[colour.token];
  if (variable) {
    try {
      return [figma.variables.setBoundVariableForPaint(paint, 'color', variable)];
    } catch (e) {
      // Binding is a nicety; the literal colour is still correct without it.
    }
  }
  return [paint];
}

/** "0 2px 8px rgba(26, 58, 50, .09)" -> a Figma DROP_SHADOW effect. */
function parseShadow(value) {
  if (!value || value === 'none') return null;
  const m = String(value).match(
    /(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px(?:\s+(-?[\d.]+)px)?\s+rgba?\(([^)]+)\)/
  );
  if (!m) return null;
  const parts = m[5].split(/[,\s/]+/).filter(Boolean).map(Number);
  const [r, g, b] = parts;
  const a = parts.length > 3 ? parts[3] : 1;
  return {
    type: 'DROP_SHADOW',
    color: { r: (r || 0) / 255, g: (g || 0) / 255, b: (b || 0) / 255, a: Number.isNaN(a) ? 1 : a },
    offset: { x: parseFloat(m[1]), y: parseFloat(m[2]) },
    radius: parseFloat(m[3]),
    spread: m[4] ? parseFloat(m[4]) : 0,
    visible: true,
    blendMode: 'NORMAL',
  };
}

const FONT_STYLE_BY_WEIGHT = {
  300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold',
};
let FONT_FAMILY = 'Fredoka';

async function loadFonts() {
  const styles = ['Light', 'Regular', 'Medium', 'SemiBold', 'Bold'];
  try {
    for (const style of styles) await figma.loadFontAsync({ family: 'Fredoka', style });
  } catch (e) {
    FONT_FAMILY = 'Inter';
    for (const style of ['Regular', 'Medium', 'Semi Bold', 'Bold']) {
      try { await figma.loadFontAsync({ family: 'Inter', style }); } catch (e2) {}
    }
    figma.notify('Fredoka is not available in this file - falling back to Inter. Enable Fredoka for an exact match.', { timeout: 6000 });
  }
}

function fontFor(weight) {
  if (FONT_FAMILY === 'Inter') {
    const style = weight >= 600 ? 'Semi Bold' : weight >= 500 ? 'Medium' : 'Regular';
    return { family: 'Inter', style };
  }
  return { family: 'Fredoka', style: FONT_STYLE_BY_WEIGHT[weight] || 'Regular' };
}

function makeText(characters, { size = 18, weight = 400, colour = null, rtl = true, variableByToken = {} } = {}) {
  const t = figma.createText();
  t.fontName = fontFor(weight);
  t.characters = characters;
  t.fontSize = size;
  t.textAlignHorizontal = rtl ? 'RIGHT' : 'LEFT';
  if (colour) t.fills = solid(colour, variableByToken);
  return t;
}

/* ------------------------------------------------------------- 1. variables */

function buildVariables() {
  const byToken = {};
  let collection;
  try {
    collection = figma.variables.createVariableCollection('PTSD.IL Tokens');
  } catch (e) {
    figma.notify('Could not create variables (the file may not allow it) - continuing with literal colours.', { timeout: 5000 });
    return byToken;
  }
  const modeId = collection.modes[0].modeId;

  for (const [name, def] of Object.entries(tokens.color)) {
    try {
      const v = figma.variables.createVariable(`color/${name}`, collection, 'COLOR');
      const rgb = hexToRgb(def.$value);
      v.setValueForMode(modeId, { r: rgb.r, g: rgb.g, b: rgb.b, a: 1 });
      v.description = `${def.$description || ''} - from src/index.css`;
      byToken[name] = v;
    } catch (e) {}
  }
  for (const [name, def] of Object.entries(tokens.radius || {})) {
    try {
      const v = figma.variables.createVariable(`radius/${name}`, collection, 'FLOAT');
      const n = parseFloat(String(def.$value));
      v.setValueForMode(modeId, String(def.$value).includes('rem') ? n * meta.rootFontPx : n);
    } catch (e) {}
  }
  return byToken;
}

/* ------------------------------------------------------------- 2. components */

/** Build one Button instance frame from a resolved spec. */
function buildButton(spec, label, rtl, variableByToken) {
  const f = figma.createFrame();
  f.name = label;
  f.layoutMode = 'HORIZONTAL';
  f.primaryAxisSizingMode = 'AUTO';
  f.counterAxisSizingMode = 'AUTO';
  f.primaryAxisAlignItems = 'CENTER';
  f.counterAxisAlignItems = 'CENTER';
  f.itemSpacing = cssPx(spec, 'gap', 0);
  f.paddingLeft = cssPx(spec, 'padding-left', 0);
  f.paddingRight = cssPx(spec, 'padding-right', 0);
  f.paddingTop = cssPx(spec, 'padding-top', 0);
  f.paddingBottom = cssPx(spec, 'padding-bottom', 0);
  f.cornerRadius = Math.min(cssPx(spec, 'border-radius', 0), 9999);
  f.itemReverseZIndex = false;

  const bg = cssColor(spec, 'background-color');
  f.fills = bg ? solid(bg, variableByToken) : [];

  const border = cssColor(spec, 'border-color');
  const borderWidth = cssPx(spec, 'border-width', 0);
  if (border && borderWidth) {
    f.strokes = solid(border, variableByToken);
    f.strokeWeight = borderWidth;
    const style = spec.css['border-style'];
    if (style && String(style.value).includes('dashed')) f.dashPattern = [4, 4];
  }

  const shadow = spec.css['box-shadow'] && parseShadow(spec.css['box-shadow'].value);
  if (shadow) f.effects = [shadow];

  const t = makeText(label, {
    size: cssPx(spec, 'font-size', 18),
    weight: parseInt(String((spec.css['font-weight'] || {}).value || '400'), 10),
    colour: cssColor(spec, 'color'),
    rtl,
    variableByToken,
  });
  f.appendChild(t);
  return f;
}

function buildComponentSet(page, componentKey, entries, buildFn, title, startY, variableByToken) {
  const made = [];
  for (const [key, spec] of entries) {
    for (const rtl of [true, false]) {
      const node = figma.createComponent();
      node.name = `direction=${rtl ? 'RTL' : 'LTR'}, style=${key.replace(/^used\//, '')}`;
      node.layoutMode = 'HORIZONTAL';
      node.primaryAxisSizingMode = 'AUTO';
      node.counterAxisSizingMode = 'AUTO';
      node.fills = [];
      const inner = buildFn(spec, key.split('/').slice(-2).join(' '), rtl, variableByToken);
      node.appendChild(inner);
      made.push(node);
    }
  }
  if (!made.length) return null;
  for (const n of made) page.appendChild(n);
  let set;
  try {
    set = figma.combineAsVariants(made, page);
    set.name = title;
    set.layoutMode = 'VERTICAL';
    set.itemSpacing = 16;
    set.paddingLeft = set.paddingRight = set.paddingTop = set.paddingBottom = 24;
    set.primaryAxisSizingMode = 'AUTO';
    set.counterAxisSizingMode = 'AUTO';
    set.y = startY;
  } catch (e) {
    figma.notify(`Could not combine ${title} into a component set: ${e.message}`, { timeout: 6000 });
    return null;
  }
  return set;
}

/* ------------------------------------------------------------------- 3. run */

async function run() {
  await loadFonts();

  const variableByToken = buildVariables();
  log('Tokens imported');

  // Design system page
  const dsPage = figma.createPage();
  dsPage.name = 'Design system';

  const buttonEntries = Object.entries(specs.button).filter(([k]) => k.startsWith('used/'));
  const chipEntries = Object.entries(specs.choiceChip).filter(([k]) => k.startsWith('used/'));
  if (!buttonEntries.length) throw new Error('no button specs - regenerate with `npm run figma`');
  if (!chipEntries.length) throw new Error('no choiceChip specs - regenerate with `npm run figma`');

  let y = 0;
  const buttonSet = buildComponentSet(dsPage, 'button', buttonEntries, buildButton, 'Button', y, variableByToken);
  if (buttonSet) y = buttonSet.y + buttonSet.height + 80;
  const chipSet = buildComponentSet(dsPage, 'choiceChip', chipEntries, buildButton, 'ChoiceChip', y, variableByToken);
  if (chipSet) y = chipSet.y + chipSet.height + 80;

  log('Components built');

  // Colour styles board, so the palette is visible at a glance.
  const swatches = figma.createFrame();
  swatches.name = 'Colour tokens';
  swatches.layoutMode = 'VERTICAL';
  swatches.itemSpacing = 8;
  swatches.paddingLeft = swatches.paddingRight = swatches.paddingTop = swatches.paddingBottom = 24;
  swatches.primaryAxisSizingMode = 'AUTO';
  swatches.counterAxisSizingMode = 'AUTO';
  swatches.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  swatches.y = y;
  for (const [name, def] of Object.entries(tokens.color)) {
    const row = figma.createFrame();
    row.layoutMode = 'HORIZONTAL';
    row.itemSpacing = 12;
    row.primaryAxisSizingMode = 'AUTO';
    row.counterAxisSizingMode = 'AUTO';
    row.counterAxisAlignItems = 'CENTER';
    row.fills = [];
    const chip = figma.createRectangle();
    chip.resize(40, 40);
    chip.cornerRadius = 8;
    chip.fills = solid({ hex: def.$value, alpha: 1, token: name }, variableByToken);
    row.appendChild(chip);
    row.appendChild(makeText(`${name}   ${def.$value}`, { size: 14, weight: 400, rtl: false }));
    swatches.appendChild(row);
  }
  dsPage.appendChild(swatches);

  // Page mockups
  const pagesPage = figma.createPage();
  pagesPage.name = 'Pages';
  let px0 = 0;
  for (const page of strings.pages) {
    const frame = figma.createFrame();
    frame.name = page.name;
    frame.resize(meta.frameWidth, meta.frameHeight);
    frame.x = px0;
    px0 += meta.frameWidth + 120;
    frame.layoutMode = 'VERTICAL';
    frame.primaryAxisSizingMode = 'FIXED';
    frame.counterAxisSizingMode = 'FIXED';
    frame.clipsContent = true;

    const canvas = cssColor(requireSpec('pageHeader', 'canvas/wrapper'), 'background-color');
    frame.fills = solid(canvas || { hex: tokens.color.background.$value, alpha: 1, token: 'background' }, variableByToken);

    // Header band
    const toneKey = `${page.tone}/wrapper`;
    const headerSpec = requireSpec('pageHeader', toneKey);
    const innerSpec = requireSpec('pageHeader', `${page.size}/center/inner`);
    const titleSpec = requireSpec('pageHeader', `${page.size}/title`);
    const subSpec = requireSpec('pageHeader', `${page.size}/subtitle`);

    const header = figma.createFrame();
    header.name = 'PageHeader';
    header.layoutMode = 'VERTICAL';
    header.layoutAlign = 'STRETCH';
    header.primaryAxisSizingMode = 'AUTO';
    header.counterAxisSizingMode = 'FIXED';
    header.counterAxisAlignItems = 'CENTER';
    header.itemSpacing = 12;
    header.paddingTop = cssPx(innerSpec, 'padding-top', 43);
    header.paddingBottom = cssPx(innerSpec, 'padding-bottom', 18);
    header.paddingLeft = header.paddingRight = cssPx(innerSpec, 'padding-left', 27);
    header.fills = solid(cssColor(headerSpec, 'background-color'), variableByToken);

    // Desktop frame: prefer the sm/lg responsive type size where the CSS has one.
    const resp = (titleSpec.responsive && (titleSpec.responsive.lg || titleSpec.responsive.sm)) || {};
    const titleSize = resp['font-size'] ? parseFloat(resp['font-size'].value) : cssPx(titleSpec, 'font-size', 30);
    const headerFg = cssColor(headerSpec, 'color');

    const title = makeText(page.title, {
      size: titleSize,
      weight: parseInt(String((titleSpec.css['font-weight'] || {}).value || '600'), 10),
      colour: headerFg,
      rtl: true,
      variableByToken,
    });
    title.textAlignHorizontal = 'CENTER';
    title.layoutAlign = 'STRETCH';
    header.appendChild(title);

    if (page.subtitle) {
      const sub = makeText(page.subtitle, {
        size: cssPx(subSpec, 'font-size', 18),
        weight: 400,
        colour: headerFg,
        rtl: true,
        variableByToken,
      });
      sub.textAlignHorizontal = 'CENTER';
      sub.layoutAlign = 'STRETCH';
      sub.opacity = 0.85;
      header.appendChild(sub);
    }
    frame.appendChild(header);

    // Body: one SectionBlock band with a few cards, matching the real structure.
    const bandSpec = requireSpec('sectionBlock', `${page.band}/band`);
    const band = figma.createFrame();
    band.name = `SectionBlock (${page.band})`;
    band.layoutMode = 'VERTICAL';
    band.layoutAlign = 'STRETCH';
    band.layoutGrow = 1;
    band.primaryAxisSizingMode = 'FIXED';
    band.counterAxisSizingMode = 'FIXED';
    band.itemSpacing = 16;
    band.paddingTop = band.paddingBottom = 72;
    band.paddingLeft = band.paddingRight = 27;
    band.counterAxisAlignItems = 'CENTER';
    band.fills = solid(cssColor(bandSpec, 'background-color'), variableByToken);

    for (const item of page.items) {
      const discSpec = requireSpec('disclosure', 'outlined/wrapper');
      const trigSpec = requireSpec('disclosure', 'outlined/default/trigger');
      const card = figma.createFrame();
      card.name = 'Disclosure';
      card.layoutMode = 'HORIZONTAL';
      card.layoutAlign = 'STRETCH';
      card.primaryAxisSizingMode = 'FIXED';
      card.counterAxisSizingMode = 'AUTO';
      card.primaryAxisAlignItems = 'SPACE_BETWEEN';
      card.counterAxisAlignItems = 'CENTER';
      card.paddingLeft = cssPx(trigSpec, 'padding-left', 27);
      card.paddingRight = cssPx(trigSpec, 'padding-right', 27);
      card.paddingTop = cssPx(trigSpec, 'padding-top', 22);
      card.paddingBottom = cssPx(trigSpec, 'padding-bottom', 22);
      card.cornerRadius = cssPx(discSpec, 'border-radius', 16);
      card.fills = solid(cssColor(discSpec, 'background-color') || { hex: tokens.color.card.$value, alpha: 1, token: 'card' }, variableByToken);
      const stroke = cssColor(discSpec, 'border-color');
      if (stroke) { card.strokes = solid(stroke, variableByToken); card.strokeWeight = cssPx(discSpec, 'border-width', 2); }
      const label = makeText(item, { size: 18, weight: 600, colour: { hex: tokens.color.foreground.$value, alpha: 1, token: 'foreground' }, rtl: true, variableByToken });
      card.appendChild(label);
      band.appendChild(card);
    }

    if (page.cta) {
      band.appendChild(buildButton(requireSpec('button', 'used/elevated/cta/full'), page.cta, true, variableByToken));
    }

    frame.appendChild(band);
    pagesPage.appendChild(frame);
  }

  figma.currentPage = dsPage;
  figma.notify(`Done - ${buttonEntries.length} button variants, ${Object.keys(tokens.color).length} colour variables, ${strings.pages.length} page frames.`, { timeout: 8000 });
  figma.closePlugin();
}

run().catch((e) => {
  figma.notify(`PTSD.IL import failed: ${e && e.message ? e.message : e}`, { error: true, timeout: 10000 });
  figma.closePlugin();
});
