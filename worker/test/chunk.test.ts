import { describe, it, expect } from "vitest";
import { chunk } from "../src/lib/chunk";

describe("chunk", () => {
  it("returns one chunk for short text", () => {
    const out = chunk("short text");
    expect(out).toHaveLength(1);
    expect(out[0]).toEqual({ text: "short text", index: 0 });
  });

  it("splits long text into multiple ordered chunks under max", () => {
    const para = "x".repeat(1000);
    const text = [para, para, para].join("\n\n");
    const out = chunk(text, { max: 1600, overlap: 100 });
    expect(out.length).toBeGreaterThan(1);
    out.forEach((c, i) => expect(c.index).toBe(i));
    out.forEach((c) => expect(c.text.length).toBeLessThanOrEqual(1600 + 100));
  });

  it("never returns empty chunks", () => {
    const out = chunk("\n\n\n a \n\n\n");
    expect(out).toHaveLength(1);
    expect(out[0].text).toBe("a");
  });

  it("hard-splits a single paragraph longer than max", () => {
    // One paragraph, no paragraph boundaries, well over max+overlap.
    const para = "y".repeat(5000);
    const out = chunk(para, { max: 1600, overlap: 200 });
    expect(out.length).toBeGreaterThan(1);
    out.forEach((c, i) => expect(c.index).toBe(i));
    out.forEach((c) => expect(c.text.length).toBeGreaterThan(0));
    out.forEach((c) => expect(c.text.length).toBeLessThanOrEqual(1600 + 200));
    // Reassembling without overlap accounting should still cover the source content.
    expect(out[0].text.length).toBe(1600);
  });

  it("does not hang or drop text when overlap >= max", () => {
    const input = Array.from({ length: 5000 }, (_, i) => String.fromCharCode(97 + (i % 26))).join("");
    const out = chunk(input, { max: 1600, overlap: 1600 }); // overlap === max (former infinite-loop case)
    expect(out.length).toBeGreaterThan(0);
    expect(out.every((c) => c.text.length > 0)).toBe(true);
    expect(input.startsWith(out[0].text)).toBe(true);            // no truncation at the start
    expect(input.endsWith(out[out.length - 1].text)).toBe(true); // no truncation at the end
  });
});
