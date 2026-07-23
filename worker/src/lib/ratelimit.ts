import type { Env } from "../index";

export async function checkLimit(env: Env, sessionId: string, limit = 20, windowSec = 3600): Promise<boolean> {
  const key = `rl:${sessionId}`;
  const current = Number((await env.RL.get(key)) ?? "0");
  if (current >= limit) return false;
  await env.RL.put(key, String(current + 1), { expirationTtl: windowSec });
  return true;
}
