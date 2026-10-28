import type { Env } from "../index";

export async function verifyAdmin(env: Env, authHeader: string | null): Promise<boolean> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
  try {
    const res = await fetch(env.ADMIN_VERIFY_URL, { headers: { Authorization: authHeader } });
    return res.ok;
  } catch {
    return false;
  }
}

const AUTH_CACHE_TTL = 300; // seconds; a revoked token keeps working at most this long

// Hex sha256 of the bearer token. Used as the auth-cache and rate-limit key so
// the raw token is never written to KV.
export async function tokenHash(authHeader: string): Promise<string> {
  const token = authHeader.replace(/^Bearer\s+/, "");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// verifyAdmin with a short KV cache, for endpoints the admin calls in bursts
// (/translate runs once per target language per save). Only successes are cached.
export async function verifyAdminCached(env: Env, authHeader: string | null): Promise<boolean> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
  const key = `auth:${await tokenHash(authHeader)}`;
  if ((await env.RL.get(key)) === "ok") return true;
  const ok = await verifyAdmin(env, authHeader);
  if (ok) await env.RL.put(key, "ok", { expirationTtl: AUTH_CACHE_TTL });
  return ok;
}
