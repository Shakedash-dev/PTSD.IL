import { describe, it, expect } from "vitest";
import { embed } from "../src/lib/embed";

const fakeAI = {
  run: async (_model: string, _input: { text: string[] }) => ({ data: [[0.1, 0.2], [0.3, 0.4]] }),
} as unknown as Ai;

describe("embed", () => {
  it("returns one vector per input text", async () => {
    const out = await embed(fakeAI, ["a", "b"]);
    expect(out).toHaveLength(2);
    expect(out[0]).toEqual([0.1, 0.2]);
  });

  it("returns [] for empty input without calling the model", async () => {
    let called = false;
    const ai = { run: async () => { called = true; return { data: [] }; } } as unknown as Ai;
    expect(await embed(ai, [])).toEqual([]);
    expect(called).toBe(false);
  });
});
