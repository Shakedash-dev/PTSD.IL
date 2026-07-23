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
