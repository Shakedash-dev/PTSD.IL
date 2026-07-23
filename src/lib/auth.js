// Auth module for the admin panel. Talks to POST /api/auth/login (see
// docs/api.md §"Auth model" / §"Auth — /api/auth") and manages the resulting
// JWT.
//
// Security notes:
// - The token lives in sessionStorage ONLY (never localStorage) - the admin
//   session should die with the tab, not persist indefinitely on shared
//   machines.
// - The token is never logged (no console.log of it, ever) and never placed
//   in a URL.
// - Role/claims decoding here is for UI gating only (show/hide panels). The
//   backend re-checks roles on every request - this module grants no access
//   by itself.

const API = import.meta.env.VITE_API_URL;
const TOKEN_KEY = 'ptsd_admin_token';

// Fired on every login/logout so mounted components (the /admin route guard)
// can react immediately without a manual page refresh.
export const AUTH_CHANGE_EVENT = 'ptsd-admin-auth-change';

function notifyAuthChange() {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

// POST /api/auth/login {email,password} -> {accessToken}. Throws on any
// non-2xx response (401 for bad credentials); never distinguishes "wrong
// email" from "wrong password" in the thrown error.
export async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error('invalid_credentials');
  }

  const data = await res.json();
  if (!data?.accessToken) {
    throw new Error('invalid_response');
  }

  sessionStorage.setItem(TOKEN_KEY, data.accessToken);
  notifyAuthChange();
  return { ok: true };
}

export function logout() {
  sessionStorage.removeItem(TOKEN_KEY);
  notifyAuthChange();
}

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

// Decodes the JWT payload (base64url, second segment) WITHOUT verifying the
// signature - purely for reading claims client-side. Returns null if there's
// no token or it's malformed.
export function getClaims() {
  const token = getToken();
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const base64url = parts[1];
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const json = decodeURIComponent(
      binary
        .split('')
        .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Token present AND not expired (exp is seconds since epoch, per JWT spec).
export function isAuthenticated() {
  const claims = getClaims();
  if (!claims || typeof claims.exp !== 'number') return false;
  return claims.exp * 1000 > Date.now();
}

// Roles are exact-match per docs/api.md - article CRUD needs admin/moderator.
const ADMIN_PANEL_ROLES = ['admin', 'moderator'];

export function hasAdminAccess() {
  if (!isAuthenticated()) return false;
  const roles = getClaims()?.roles || [];
  return roles.some(r => ADMIN_PANEL_ROLES.includes(r));
}

// User management (/admin/users, docs/api.md §"Users") needs masteradmin -
// per that doc, masteradmin is NOT implicitly granted admin/moderator CRUD
// (and vice versa: an admin/moderator without masteradmin cannot manage
// users), so this is intentionally a separate exact-match check from
// hasAdminAccess() above, not folded into ADMIN_PANEL_ROLES.
const USER_MANAGEMENT_ROLES = ['masteradmin'];

export function hasUserManagementAccess() {
  if (!isAuthenticated()) return false;
  const roles = getClaims()?.roles || [];
  return roles.some(r => USER_MANAGEMENT_ROLES.includes(r));
}

// The authenticated user's own id, read from the JWT `sub` claim (standard
// JWT/NestJS convention). Used for UI purposes only (e.g. hiding "delete
// self" in the Users panel) - the backend independently rejects deleting
// your own account regardless of what this returns.
export function getCurrentUserId() {
  return getClaims()?.sub ?? null;
}
