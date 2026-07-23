import { describe, it, expect } from "vitest";
import { checkLimit } from "../src/lib/ratelimit";

function kv(): KVNamespace {
  const store = new Map<string, string>();
  return {
    get: async (k: string) => store.get(k) ?? null,
    put: async (k: string, v: string) => void store.set(k, v),
  } as unknown as KVNamespace;
}

describe("checkLimit", () => {
  it("allows up to the limit then blocks", async () => {
    const env = { RL: kv() } as any;
    let allowed = 0;
    for (let i = 0; i < 5; i++) if (await checkLimit(env, "s", 3, 3600)) allowed++;
    expect(allowed).toBe(3);
  });
  it("separate sessions have separate counters", async () => {
    const env = { RL: kv() } as any;
    expect(await checkLimit(env, "a", 1, 3600)).toBe(true);
    expect(await checkLimit(env, "b", 1, 3600)).toBe(true);
  });
});
