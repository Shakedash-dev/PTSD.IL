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

describe("Metiv chips across the whole site", () => {
  const v3 = (p) => `/metiv-site-demo-v3${p}`;
  const route = (slug, ref) => sectionRoute("article", slug, ["metiv", slug], true, ref);

  it("routes every indexed collection to its v3 page", () => {
    const cases = {
      "metiv-about": "/about/history",
      "metiv-facts": "/about/history",
      "metiv-team": "/about/team",
      "metiv-department-groups": "/about",
      "metiv-partners": "/about/collaborations",
      "metiv-funders": "/about/partners",
      "metiv-partner-groups": "/about/partners",
      "metiv-collaboration-groups": "/about/collaborations",
      "metiv-collaboration-contact": "/about/collaborations",
      "metiv-donate": "/donate",
      "metiv-legal-docs": "/privacy-policy",
      "metiv-legal": "/accessibility",
      "metiv-patient-hub": "/patient",
      "metiv-short-versions": "/patient",
      "metiv-books-note": "/patient/sources",
      "metiv-treatment-where": "/patient/treatment",
      "metiv-rj-stats": "/patient/release-journey",
      "metiv-rj-waiting": "/patient/release-journey",
      "metiv-therapist-hub": "/therapist",
      "metiv-courses": "/therapist/courses",
      "metiv-supervision": "/therapist/supervision",
      "metiv-org-programs": "/therapist/organizations",
      "metiv-children-family": "/therapist/children-and-family",
      "metiv-research-intro": "/therapist/research",
      "metiv-studies": "/therapist/research",
      "metiv-books": "/therapist/publications",
      "metiv-papers": "/therapist/publications",
      "metiv-paper-topics": "/therapist/publications",
      "metiv-articles": "/therapist/articles",
      "metiv-events": "/therapist/events",
    };
    for (const [slug, path] of Object.entries(cases)) expect(route(slug), slug).toBe(v3(path));
  });

  it("has a page for every collection the worker indexes", async () => {
    const { CHATBOT_SLUGS } = await import("@/pages/metiv-demos/v3/content/registry");
    // The patient-area fallback is only right for the patient hub and the "in short" boxes.
    expect(CHATBOT_SLUGS.filter((s) => s !== "metiv-patient-hub" && s !== "metiv-short-versions" && route(s) === v3("/patient"))).toEqual([]);
  });

  it("deep-links by the row's key and section", () => {
    expect(route("metiv-courses", { key: "cbt-trauma" })).toBe(v3("/therapist/courses/cbt-trauma"));
    expect(route("metiv-articles", { key: "a-slug" })).toBe(v3("/therapist/articles/a-slug"));
    expect(route("metiv-org-programs", { key: "schools" })).toBe(v3("/therapist/organizations#schools"));
    expect(route("metiv-studies", { key: "s1" })).toBe(v3("/therapist/research#s1"));
    expect(route("metiv-department-groups", { key: "clinics" })).toBe(v3("/about#about-clinics"));
    expect(route("metiv-legal-docs", { key: "LEGAL_DOCS", section: "terms" })).toBe(v3("/terms-of-use"));
    expect(route("metiv-legal-docs", { key: "LEGAL_DOCS", section: "privacy" })).toBe(v3("/privacy-policy"));
    expect(route("metiv-legal", { section: "privacy" })).toBe(v3("/privacy-policy"));
    expect(route("metiv-legal", { section: "accessibility" })).toBe(v3("/accessibility"));
    expect(route("metiv-short-versions", { section: "rights" })).toBe(v3("/patient/rights"));
    expect(route("metiv-short-versions", { section: "about" })).toBe(v3("/patient")); // not a patient page
  });

  it("routes PTSD-IL legal rows to their page, at the demo root inside the demo", () => {
    expect(sectionRoute("article", "legal", ["legal"], false, { title: "terms-of-use" })).toBe("/terms-of-use");
    expect(sectionRoute("article", "legal", ["legal"], false, { title: "privacy-policy" })).toBe("/privacy-policy");
    expect(sectionRoute("article", "legal", ["legal"], true, { title: "terms-of-use" })).toBe(v3("/terms-of-use"));
  });

  it("spells the v3-only routes exactly as v3/meta.js", async () => {
    const { V3_ONLY_ROUTES } = await import("@/lib/citations");
    const { V3_ROUTES } = await import("@/pages/metiv-demos/v3/meta");
    for (const [k, v] of Object.entries(V3_ONLY_ROUTES)) expect(V3_ROUTES[k], k).toBe(v);
  });
});

describe("sourceRoute / sourceTitle", () => {
  it("routes a stream source object and names the legal documents", async () => {
    const { sourceRoute, sourceTitle } = await import("@/lib/citations");
    const course = { type: "article", categorySlug: "metiv-courses", categorySlugs: ["metiv", "metiv-courses"], key: "cbt-trauma", title: "CBT" };
    expect(sourceRoute(course, true)).toBe("/metiv-site-demo-v3/therapist/courses/cbt-trauma");
    expect(sourceTitle(course, "en")).toBe("CBT");
    const terms = { type: "article", categorySlug: "metiv-legal-docs", categorySlugs: ["metiv", "metiv-legal-docs"], section: "terms", title: "LEGAL_DOCS" };
    expect(sourceTitle(terms, "en")).toBe("Terms of Use");
    expect(sourceTitle({ type: "article", categorySlug: "legal", categorySlugs: ["legal"], title: "privacy-policy" }, "he")).toBe("מדיניות פרטיות");
  });
});

describe("chatArea", () => {
  it("derives the site area from the path", async () => {
    const { chatArea } = await import("@/lib/citations");
    expect(chatArea("/metiv-site-demo-v3/patient")).toBe("patient");
    expect(chatArea("/metiv-site-demo-v3/patient/rights")).toBe("patient");
    expect(chatArea("/metiv-site-demo-v3/therapist")).toBe("therapist");
    expect(chatArea("/metiv-site-demo-v3/therapist/courses/cbt-trauma")).toBe("therapist");
    expect(chatArea("/metiv-site-demo-v3")).toBe("metiv");
    expect(chatArea("/metiv-site-demo-v3/donate")).toBe("metiv");
    expect(chatArea("/metiv-site-demo-v3/about/team")).toBe("metiv");
    expect(chatArea("/metiv-site-demo-v3/patients")).toBe("metiv"); // not the patient area
    expect(chatArea("/rights")).toBeUndefined();
    expect(chatArea("/metiv-site-demo-v2/therapist")).toBeUndefined();
  });
});

describe("sourceTitle for untitled Metiv rows", () => {
  it("names the page instead of showing the collection key", async () => {
    const { sourceTitle } = await import("@/lib/citations");
    expect(sourceTitle({ title: "CONTACTS", categorySlug: "metiv-contacts", categorySlugs: ["metiv", "metiv-contacts"] }, "en")).toBe("Contact us");
    expect(sourceTitle({ title: "RELEASE_JOURNEY_CONTACTS", categorySlug: "metiv-rj-contacts" }, "he")).toBe("מסע שחרור");
    expect(sourceTitle({ title: "קורס CBT", categorySlug: "metiv-courses" }, "he")).toBe("קורס CBT");
  });
});
