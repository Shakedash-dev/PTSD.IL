import { describe, it, expect } from "vitest";
import { sectionRoute } from "@/lib/citations";

describe("citations", () => {
  it("maps non-faq types to section routes", () => {
    expect(sectionRoute("source")).toBe("/sources");
    expect(sectionRoute("treatment_step")).toBe("/treatment");
    expect(sectionRoute("tool")).toBe("/self-help");
    expect(sectionRoute("book")).toBe("/children");
    expect(sectionRoute("activity")).toBe("/children");
    expect(sectionRoute("story")).toBe("/children");
    expect(sectionRoute("video")).toBe("/children");
    expect(sectionRoute("article")).toBe("/children");
  });

  it("routes faq by categorySlug", () => {
    expect(sectionRoute("faq", "ptsd-info")).toBe("/ptsd-info");
    expect(sectionRoute("faq", "second-circle")).toBe("/second-circle-tools");
    expect(sectionRoute("faq", "rights")).toBe("/rights");
    expect(sectionRoute("faq", undefined)).toBe("/rights");
  });
});
