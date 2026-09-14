// Illustrations used by V3 beyond the lib/images registries. Same files, same base prefix.
const BASE = import.meta.env.BASE_URL || '/';
const illus = (/** @type {string} */ name) => `${BASE}images/illustrations/${name}.webp`;

export const COMMUNITIES_IMG = illus('communities');
export const SELF_HELP_IMG = illus('self-help');
export const PTSD_INFO_IMG = illus('ptsd-info-second-circle');
export const RIGHTS_IMG = illus('rights');
export const WONDERING_IMG = illus('wondering');
export const SUPPORTER_IMG = illus('supporter');
