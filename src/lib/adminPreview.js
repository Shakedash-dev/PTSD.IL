// The admin on a dev server: read-only, on the live data.
//
// Google is the only login path, and localhost is not an authorised OAuth
// origin, so /admin cannot be signed into on a dev server. This flag opens the
// panel there without a session: its GET calls are answered from the live API's
// public endpoints (src/api/adminLiveRead.js), so it shows the real content,
// and every write is refused. A pasted admin token (loginWithToken in
// src/lib/auth.js) switches it to the normal signed-in mode against the live
// API. The test run reads fixtures instead (src/api/adminPreviewFixtures.js).
//
// SAFETY: `import.meta.env.DEV` is replaced with the literal `false` when Vite
// builds for production, so every branch guarded by this constant is dead code
// and is removed from the bundle. The live-read module and the fixtures are
// behind dynamic imports inside such branches, so they are never even emitted
// as a chunk. There is no runtime flag, header or query parameter that can turn
// this on in a deployed build - it does not exist there.
//
// This is a UI convenience only. It grants no access to anything: the public
// endpoints it reads are open to anyone, and the backend re-checks the JWT on
// every /api/admin/* call regardless of what the client believes.
//
// Set VITE_ADMIN_PREVIEW=off in src/.env to get the real login screen locally.
export const ADMIN_PREVIEW =
  import.meta.env.DEV && import.meta.env.VITE_ADMIN_PREVIEW !== 'off';
