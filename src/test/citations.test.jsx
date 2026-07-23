import { describe, it, expect } from "vitest";
import { sectionRoute } from "@/lib/citations";

describe("citations", () => {
  it("maps types to section routes", () => {
    expect(sectionRoute("source")).toBe("/sources");
    expect(sectionRoute("treatment_step")).toBe("/treatment");
    expect(sectionRoute("tool")).toBe("/self-help");
    expect(sectionRoute("book")).toBe("/children");
    expect(sectionRoute("activity")).toBe("/children");
    expect(sectionRoute("story")).toBe("/children");
    expect(sectionRoute("video")).toBe("/children");
    expect(sectionRoute("article")).toBe("/children");
    expect(sectionRoute("faq")).toBe("/rights");
    expect(sectionRoute("unknown")).toBe("/");
  });
});
