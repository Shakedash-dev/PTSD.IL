// Central image registry. Four named sets provide alternate photography for the
// same set of semantic keys, so the active set can be swapped at runtime via
// `ImageSetContext`. Set 1 = production photos. Sets 2-4 use set1 photos for
// everything except the three home path cards, which use character illustrations
// (ptsd_sufferer, supporter, wondering) in three variants.

// Prefix with Vite's configured base (`/PTSD.IL/` in this repo). Without this,
// the app is served under a sub-path but image URLs would point at the domain
// root and 404.
const BASE = import.meta.env.BASE_URL || '/';
const base = (setName, key) => `${BASE}images/${setName}/${key}.webp`;
const illus = (name, variant) => `${BASE}images/illustrations/${name}${variant}.png`;

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

// Build a per-set map of {key: localUrl} from set1's directory.
function buildSet(setName) {
  const out = {};
  for (const [key] of KEYS_ORDER) {
    out[key] = base(setName, key);
  }
  return out;
}


export const IMAGE_SETS = {
  set1: { ...buildSet('set1'), home_path1: illus('ptsd_sufferer', 4), home_path2: illus('supporter', 4), home_path3: illus('wondering', 4) },
  set2: buildSet('set1'),
  set3: { ...buildSet('set1'), home_path1: illus('ptsd_sufferer', 3), home_path2: illus('supporter', 3), home_path3: illus('wondering', 1) },
  set4: { ...buildSet('set1'), home_path1: illus('ptsd_sufferer', 2), home_path2: illus('supporter', 1), home_path3: illus('wondering', 3) },
  set5: { ...buildSet('set1'), home_path1: illus('ptsd_sufferer', 1), home_path2: illus('supporter', 2), home_path3: illus('wondering', 2) },
};

export const IMAGE_SET_IDS = ['set1', 'set2', 'set3', 'set4', 'set5'];

// Treatment steps as an indexed array per set, for the snap-scroll map.
// Sets 2-4 share set1's treatment step photos.
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
  set4: [
    IMAGE_SETS.set4.treatment_step1,
    IMAGE_SETS.set4.treatment_step2,
    IMAGE_SETS.set4.treatment_step3,
    IMAGE_SETS.set4.treatment_step4,
    IMAGE_SETS.set4.treatment_step5,
  ],
  set5: [
    IMAGE_SETS.set5.treatment_step1,
    IMAGE_SETS.set5.treatment_step2,
    IMAGE_SETS.set5.treatment_step3,
    IMAGE_SETS.set5.treatment_step4,
    IMAGE_SETS.set5.treatment_step5,
  ],
};

// Re-exported for downstream tooling that wants to know which Unsplash photo
// backs each local file (e.g. a regenerate-from-source script).
export const IMAGE_SET_SOURCE_IDS = {
  set1: SET1_IDS,
};

// Re-exported so tooling can reconstruct the source size used when downloading.
export const IMAGE_SET_SIZE_WIDTHS = TRANSFORMS;
