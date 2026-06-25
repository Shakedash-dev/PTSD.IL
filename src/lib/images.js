// Central image registry. Three named sets (`set1`, `set2`, `set3`) provide
// alternate photography for the same set of semantic keys, so the active set can
// be swapped at runtime via `ImageSetContext`. Set 1 = current production photos.
// Sets 2 and 3 = alternative candidates for review - each slot is independent so
// the final production set can mix-and-match (e.g. "home_hero from set2, home_path1
// from set3...") just by updating set1 to point at the chosen URLs.
//
// Image URLs now resolve to LOCAL files under `/public/images/<setN>/<key>.webp`
// (downloaded from Unsplash at build-prep time). The `*_IDS` maps below are kept
// purely for traceability so a maintainer can look up which Unsplash photo backs
// each slot, but the URLs the app uses no longer touch unsplash.com at runtime.

// Prefix with Vite's configured base (`/PTSD.IL/` in this repo). Without this,
// the app is served under a sub-path but image URLs would point at the domain
// root and 404.
const BASE = import.meta.env.BASE_URL || '/';
const base = (setName, key) => `${BASE}images/${setName}/${key}.webp`;

// Per-slot size used when the file was downloaded. Kept as documentation; the
// app no longer applies any URL transform because the local file is already
// sized appropriately for its slot.
const TRANSFORMS = {
  hero: 2000, // full-bleed hero slots downloaded at 2000w
  card: 1200, // path/step/tile cards downloaded at 1200w
};

// All semantic keys used across the app. Each set must populate every key.
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

// ── SET 1 ── production lineup, consolidated from the maintainer's per-slot
// picks across the original three review sets. The IDs document which Unsplash
// photo was downloaded into `/public/images/set1/<key>.webp`.
// Sets 2 and 3 are kept for future review/comparison.
const SET1_IDS = {
  home_hero:                '1437435409766-a478cc6da81a',  // from set3 (warm/hopeful)
  home_path1:               '1488028005574-a81ac1663de0',  // from set3 (contemplative back-view)
  home_path2:               '1582213782179-e0d53f98f2ca',
  home_path3:               '1586380951230-e6703d9f6833',
  community_hero:           '1610070835951-156b6921281d',  // from set3 (people in circle)
  calming_main:             '1470364799705-5cd35cff0c88',  // from set2 (quiet/minimal)
  calming_breathing:        '1428908728789-d2de25dbd4e2',
  calming_grounding:        '1622405137916-91cfc49d91a2',
  calming_muscle:           '1447619297994-b829cc1ab44a',
  treatment_step1:          '1506962240359-bd03fbba0e3d',
  treatment_step2:          '1758691461990-03b49d969495',
  treatment_step3:          '1780946101636-00004978f8c1',
  treatment_step4:          '1506126613408-eca07ce68773',
  treatment_step5:          '1628771065518-0d82f1938462',
  selfhelp_hero:            '1588338949261-659fc6fed20b',  // from set2
  rights_hero:              '1562654501-a0ccc0fc3fb1',     // from set2
  children_hero:            '1633379209339-31874f478240',  // from set2
  ptsdinfo_hero:            '1573507811472-909cd17e834d',
  firstcircle_hero:         '1534330207526-8e81f10ec6fc',  // from set2 (preferred banner)
  secondcircle_hero:        '1604881991720-f91add269bed',
  secondcircletools_hero:   '1604881991575-dfb1003d8811',  // from set3
  questionnaire_hero:       '1456324504439-367cee3b3c32',  // from set2 home_path3 (journaling/check-in)
};

// ── SET 2 ── quiet nature / minimal palette. Landscapes, soft light, single
// objects against muted backgrounds. Less peopled, calmer than set 1.
const SET2_IDS = {
  home_hero:                '1508614999368-9260051292e5',
  home_path1:               '1609523235355-82f40b23a6f2',  // candidate B: foggy path alone
  home_path2:               '1495653797063-114787b77b23',
  home_path3:               '1456324504439-367cee3b3c32',
  community_hero:           '1502444330042-d1a1ddf9bb5b',  // alt: circle gathering
  calming_main:             '1470364799705-5cd35cff0c88',
  calming_breathing:        '1501630834273-4b5604d2ee31',
  calming_grounding:        '1586013910460-83f1ab03dbab',
  calming_muscle:           '1516749712236-67f5688a642a',
  treatment_step1:          '1521134976835-9963f2185519',
  treatment_step2:          '1532938911079-1b06ac7ceec7',
  treatment_step3:          '1505751172876-fa1923c5c528',
  treatment_step4:          '1637157216470-d92cd2edb2e8',
  treatment_step5:          '1631549916768-4119b2e5f926',
  selfhelp_hero:            '1588338949261-659fc6fed20b',
  rights_hero:              '1562654501-a0ccc0fc3fb1',
  children_hero:            '1633379209339-31874f478240',
  ptsdinfo_hero:            '1444927714506-8492d94b4e3d',
  firstcircle_hero:         '1534330207526-8e81f10ec6fc',
  secondcircle_hero:        '1513267000941-598abe7be16f',
  secondcircletools_hero:   '1604881991575-dfb1003d8811',
  questionnaire_hero:       '1456324504439-367cee3b3c32',  // same source until set2 alternate is sourced
};

// ── SET 3 ── warm / hopeful palette. Golden hour, sunrise, soft warmth,
// gentle hands, candles. Warmer colour palette than the other two sets.
const SET3_IDS = {
  home_hero:                '1437435409766-a478cc6da81a',
  home_path1:               '1488028005574-a81ac1663de0',  // candidate C: contemplative back-view
  home_path2:               '1545396047-67fb8c80f6e5',
  home_path3:               '1518481612222-68bbe828ecd1',
  community_hero:           '1610070835951-156b6921281d',  // alt: people circle
  calming_main:             '1717407026956-db8029619ae3',
  calming_breathing:        '1531147646552-1eec68116469',
  calming_grounding:        '1546824034-b86974ff36f9',
  calming_muscle:           '1584022068212-4bcfb5e9eb49',
  treatment_step1:          '1456324504439-367cee3b3c32',
  treatment_step2:          '1584982751601-97dcc096659c',
  treatment_step3:          '1612276529731-4b21494e6d71',
  treatment_step4:          '1571945192246-4fcee13c27b1',
  treatment_step5:          '1587854692152-cbe660dbde88',
  selfhelp_hero:            '1591712641490-5cc22c3e114a',
  rights_hero:              '1583521214690-73421a1829a9',
  children_hero:            '1557176278-3326a3193580',
  ptsdinfo_hero:            '1486707471592-8e7eb7e36f78',
  firstcircle_hero:         '1518610935804-eeec86691db6',
  secondcircle_hero:        '1495653797063-114787b77b23',
  secondcircletools_hero:   '1582803824594-65b5b4632cad',
  questionnaire_hero:       '1456324504439-367cee3b3c32',  // same source until set3 alternate is sourced
};

// Build a per-set map of {key: localUrl}. Local URLs follow the convention
// `/images/<setName>/<key>.webp`. The size variant baked into the file on disk
// is determined by KEYS_ORDER (hero vs card); we don't append a query string
// because the file is already at the intended size.
function buildSet(setName) {
  const out = {};
  for (const [key] of KEYS_ORDER) {
    out[key] = base(setName, key);
  }
  return out;
}

export const IMAGE_SETS = {
  set1: buildSet('set1'),
  set2: buildSet('set2'),
  set3: buildSet('set3'),
};

export const IMAGE_SET_IDS = ['set1', 'set2', 'set3'];

// Treatment steps as an indexed array per set, for the snap-scroll map.
export const TREATMENT_STEP_IMAGES_BY_SET = {
  set1: [
    IMAGE_SETS.set1.treatment_step1,
    IMAGE_SETS.set1.treatment_step2,
    IMAGE_SETS.set1.treatment_step3,
    IMAGE_SETS.set1.treatment_step4,
    IMAGE_SETS.set1.treatment_step5,
  ],
  set2: [
    IMAGE_SETS.set2.treatment_step1,
    IMAGE_SETS.set2.treatment_step2,
    IMAGE_SETS.set2.treatment_step3,
    IMAGE_SETS.set2.treatment_step4,
    IMAGE_SETS.set2.treatment_step5,
  ],
  set3: [
    IMAGE_SETS.set3.treatment_step1,
    IMAGE_SETS.set3.treatment_step2,
    IMAGE_SETS.set3.treatment_step3,
    IMAGE_SETS.set3.treatment_step4,
    IMAGE_SETS.set3.treatment_step5,
  ],
};

// Re-exported for downstream tooling that wants to know which Unsplash photo
// backs each local file (e.g. a regenerate-from-source script).
export const IMAGE_SET_SOURCE_IDS = {
  set1: SET1_IDS,
  set2: SET2_IDS,
  set3: SET3_IDS,
};

// Re-exported so tooling can reconstruct the source size used when downloading.
export const IMAGE_SET_SIZE_WIDTHS = TRANSFORMS;
