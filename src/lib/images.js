// Central image registry. Home path cards (home_path1-3) use hand-picked
// character illustrations (ptsd_sufferer, supporter, wondering); everything
// else is production photography stored in /public/images/set1.

// Prefix with Vite's configured base (`/PTSD.IL/` in this repo). Without this,
// the app is served under a sub-path but image URLs would point at the domain
// root and 404.
const BASE = import.meta.env.BASE_URL || '/';
const base = (key) => `${BASE}images/set1/${key}.webp`;
const illus = (name) => `${BASE}images/illustrations/${name}.png`;

// Per-slot size used when the file was downloaded. Kept as documentation; the
// app no longer applies any URL transform because the local file is already
// sized appropriately for its slot.
const TRANSFORMS = {
  hero: 2000, // full-bleed hero slots downloaded at 2000w
  card: 1200, // path/step/tile cards downloaded at 1200w
};

// All semantic keys used across the app.
const KEYS_ORDER = [
  // [key, default size]
  ['home_hero', 'hero'],
  ['home_path1', 'card'],
  ['home_path2', 'card'],
  ['home_path3', 'card'],
  ['community_hero', 'hero'],
  ['calming_main', 'hero'],
  ['calming_breathing', 'card'],
  ['calming_grounding', 'card'],
  ['calming_muscle', 'card'],
  ['treatment_step1', 'card'],
  ['treatment_step2', 'card'],
  ['treatment_step3', 'card'],
  ['treatment_step4', 'card'],
  ['treatment_step5', 'card'],
  ['selfhelp_hero', 'hero'],
  ['rights_hero', 'hero'],
  ['children_hero', 'hero'],
  ['ptsdinfo_hero', 'hero'],
  ['firstcircle_hero', 'hero'],
  ['secondcircle_hero', 'hero'],
  ['secondcircletools_hero', 'hero'],
  ['questionnaire_hero', 'hero'],
];

// Production lineup, consolidated from the maintainer's per-slot picks across
// several rounds of photo review. The IDs document which Unsplash photo was
// downloaded into `/public/images/set1/<key>.webp`.
const SOURCE_IDS = {
  home_hero:                '1437435409766-a478cc6da81a',
  home_path1:               '1488028005574-a81ac1663de0',
  home_path2:               '1582213782179-e0d53f98f2ca',
  home_path3:               '1586380951230-e6703d9f6833',
  community_hero:           '1610070835951-156b6921281d',
  calming_main:             '1470364799705-5cd35cff0c88',
  calming_breathing:        '1428908728789-d2de25dbd4e2',
  calming_grounding:        '1622405137916-91cfc49d91a2',
  calming_muscle:           '1447619297994-b829cc1ab44a',
  treatment_step1:          '1506962240359-bd03fbba0e3d',
  treatment_step2:          '1758691461990-03b49d969495',
  treatment_step3:          '1780946101636-00004978f8c1',
  treatment_step4:          '1506126613408-eca07ce68773',
  treatment_step5:          '1628771065518-0d82f1938462',
  selfhelp_hero:            '1588338949261-659fc6fed20b',
  rights_hero:              '1562654501-a0ccc0fc3fb1',
  children_hero:            '1633379209339-31874f478240',
  ptsdinfo_hero:            '1573507811472-909cd17e834d',
  firstcircle_hero:         '1534330207526-8e81f10ec6fc',
  secondcircle_hero:        '1604881991720-f91add269bed',
  secondcircletools_hero:   '1604881991575-dfb1003d8811',
  questionnaire_hero:       '1456324504439-367cee3b3c32',
};

export const IMAGES = {
  ...Object.fromEntries(KEYS_ORDER.map(([key]) => [key, base(key)])),
  home_path1: illus('ptsd_sufferer'),
  home_path2: illus('supporter'),
  home_path3: illus('wondering'),
};

// FirstCircle and SecondCircle each render one illustration per section, keyed
// by the section's `key` so pages can do ILLUSTRATIONS[section.key]. `rights`
// is shared between both pages (same illustration, same destination page).
export const FIRST_CIRCLE_ILLUSTRATIONS = {
  ptsd_info: illus('ptsd-info'),
  self_help: illus('self-help'),
  rights: illus('rights'),
  treatment: illus('treatment-first-circle'),
  community: illus('communities'),
  children_content: illus('child'),
};

export const SECOND_CIRCLE_ILLUSTRATIONS = {
  ptsd_info: illus('ptsd-info-second-circle'),
  second_circle: illus('second-circle-tools'),
  rights: illus('rights'),
  treatment: illus('treatment-second-circle'),
  children_content: illus('child-second-circle'),
  community: illus('communities-second-circle'),
};

// Treatment steps as an indexed array, for the snap-scroll map.
export const TREATMENT_STEP_IMAGES = [
  IMAGES.treatment_step1,
  IMAGES.treatment_step2,
  IMAGES.treatment_step3,
  IMAGES.treatment_step4,
  IMAGES.treatment_step5,
];

// Re-exported for downstream tooling that wants to know which Unsplash photo
// backs each local file (e.g. a regenerate-from-source script).
export const IMAGE_SOURCE_IDS = SOURCE_IDS;

// Re-exported so tooling can reconstruct the source size used when downloading.
export const IMAGE_SIZE_WIDTHS = TRANSFORMS;
