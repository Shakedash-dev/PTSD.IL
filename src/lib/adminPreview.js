// Read-only admin preview.
//
// Google is the only login path, and localhost is not an authorised OAuth
// origin, so /admin cannot be signed into on a dev server. That makes the panel
// impossible to look at - let alone design - without deploying. This flag opens
// it locally against sample data, with every write disabled.
//
// SAFETY: `import.meta.env.DEV` is replaced with the literal `false` when Vite
// builds for production, so every branch guarded by this constant is dead code
// and is removed from the bundle. The fixtures are behind a dynamic import
// inside such a branch, so they are never even emitted as a chunk. There is no
// runtime flag, header or query parameter that can turn this on in a deployed
// build - it does not exist there.
//
// This is a UI convenience only. It grants no access to anything: the backend
// re-checks the JWT on every /api/admin/* call regardless of what the client
// believes, and in preview no network call is made at all.
//
// Set VITE_ADMIN_PREVIEW=off in src/.env to get the real login screen locally.
export const ADMIN_PREVIEW =
  import.meta.env.DEV && import.meta.env.VITE_ADMIN_PREVIEW !== 'off';
