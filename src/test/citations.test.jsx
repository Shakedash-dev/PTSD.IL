import { describe, it, expect } from "vitest";
import { sectionRoute } from "@/lib/citations";

describe("citations", () => {
  it("maps non-faq types to section routes", () => {
    expect(sectionRoute("source")).toBe("/sources");
    expect(sectionRoute("treatment_step")).toBe("/treatment");
    expect(sectionRoute("tool")).toBe("/self-help");
    expect(sectionRoute("community")).toBe("/community");
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

  it("routes Metiv collections to v3 patient pages", () => {
    const v3 = (p) => `/metiv-site-demo-v3${p}`;
    const cases = {
      "metiv-services": "/patient/where-to-get-help",
      "metiv-public-options": "/patient/where-to-get-help",
      "metiv-nonprofit-options": "/patient/where-to-get-help",
      "metiv-consultation": "/patient/where-to-get-help",
      "metiv-free-treatments": "/patient/free-treatment-and-research",
      "metiv-research-studies": "/patient/free-treatment-and-research",
      "metiv-veterans": "/patient/community",
      "metiv-parent-child": "/patient/children",
      "metiv-reservist-family": "/patient/second-circle-tools",
      "metiv-patient-books": "/patient/sources",
      "metiv-video-lectures": "/patient/self-help",
      "metiv-release-journey": "/patient/release-journey",
      "metiv-rj-models": "/patient/release-journey",
      "metiv-rj-contacts": "/patient/release-journey",
      "metiv-org": "/contact",
      "metiv-contacts": "/contact",
    };
    for (const [slug, path] of Object.entries(cases)) {
      expect(sectionRoute("article", slug, ["metiv", slug])).toBe(v3(path));
    }
  });

  it("finds the Metiv collection in categorySlugs when the primary slug is the parent", () => {
    expect(sectionRoute("article", "metiv", ["metiv", "metiv-veterans"])).toBe("/metiv-site-demo-v3/patient/community");
    expect(sectionRoute("article", "metiv", ["metiv"])).toBe("/metiv-site-demo-v3/patient");
  });

  it("keeps PTSD-IL routing when slugs are not Metiv", () => {
    expect(sectionRoute("faq", "rights", ["rights"])).toBe("/rights");
    expect(sectionRoute("article", "children", ["children"])).toBe("/children");
  });
});

describe("sectionRoute inside the v3 demo", () => {
  it("keeps PTSD-IL chips inside the demo's patient area", async () => {
    const { sectionRoute, isMetivDemoPath } = await import("@/lib/citations");
    expect(isMetivDemoPath("/metiv-site-demo-v3/patient/rights")).toBe(true);
    expect(isMetivDemoPath("/rights")).toBe(false);
    expect(sectionRoute("faq", "rights", [], true)).toBe("/metiv-site-demo-v3/patient/rights");
    expect(sectionRoute("tool", "self-help", [], true)).toBe("/metiv-site-demo-v3/patient/self-help");
    expect(sectionRoute("faq", "rights", [], false)).toBe("/rights");
    expect(sectionRoute("article", "metiv-veterans", ["metiv", "metiv-veterans"], false)).toBe("/metiv-site-demo-v3/patient/community");
  });
});
