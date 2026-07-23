// Static questionnaire accessor. The PCL-5 questionnaire is the ONE piece of
// content still served from a static file - it has no API endpoint yet, which
// is why the admin questionnaire panel is read-only. Everything else now comes
// from the API (src/api/source.js); the old static content modules were removed
// after the DB migration completed.

import { QUESTIONNAIRE } from './static/questionnaire.js';

export const db = {
  questionnaire: QUESTIONNAIRE,
};
