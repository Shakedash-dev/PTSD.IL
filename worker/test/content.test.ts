import { describe, it, expect } from "vitest";
import { extractText, buildRefIndex, refResolver, refsIn, type Item } from "../src/lib/content";

const faq: Item = {
  id: "a1", groupId: "g1", type: "faq", langId: "he",
  title: "מה זה פלאשבק?",
  content: JSON.stringify({ question: "מה זה פלאשבק?", answer: "**חוויה חוזרת** של הטראומה." }),
};

describe("extractText", () => {
  it("concatenates title and string leaves of parsed content", () => {
    const { title, text } = extractText(faq);
    expect(title).toBe("מה זה פלאשבק?");
    expect(text).toContain("חוויה חוזרת");
    expect(text).toContain("מה זה פלאשבק?");
  });

  it("skips url/id-like leaves and non-string values", () => {
    const item: Item = {
      id: "a2", groupId: "g2", type: "source", langId: "he", title: "DSM-5",
      content: JSON.stringify({ note: "מקור מרכזי", url: "https://x/y", year: 2013, ios_url: "z" }),
    };
    const { text } = extractText(item);
    expect(text).toContain("מקור מרכזי");
    expect(text).not.toContain("https://x/y");
    expect(text).not.toContain("2013");
    expect(text).not.toContain("z");
  });

  it("returns title-only text when content is empty/unparseable", () => {
    const item: Item = { id: "a3", groupId: "g3", type: "story", langId: "he", title: "סיפור", content: "" };
    const { text } = extractText(item);
    expect(text.trim()).toBe("סיפור");
  });

  it("returns title-only text when content is malformed non-empty JSON", () => {
    const item: Item = { id: "a4", groupId: "g4", type: "faq", langId: "he", title: "כותרת", content: "{not valid json" };
    const { text } = extractText(item);
    expect(text.trim()).toBe("כותרת");
  });

  it("walks nested objects/arrays and excludes skip-key subtrees", () => {
    const item: Item = {
      id: "a5", groupId: "g5", type: "treatment_step", langId: "he", title: "שלב",
      content: JSON.stringify({
        steps: [{ heading: "שלב ראשון", body: "תיאור מפורט" }],
        meta: { links: [{ url: "https://x/y", label: "לחצו כאן" }] },
      }),
    };
    const { text } = extractText(item);
    expect(text).toContain("שלב ראשון");
    expect(text).toContain("תיאור מפורט");
    expect(text).not.toContain("https://x/y");
    expect(text).not.toContain("לחצו כאן"); // whole `links` subtree skipped
  });

  it("skips reserved `_` keys and `$ref` cross references", () => {
    const item: Item = {
      id: "a6", groupId: "g6", type: "article", langId: "he", title: "שירות",
      content: JSON.stringify({
        _key: "svc-1", _tr: { by: "ai", status: "pass" }, body: "תיאור השירות",
        related: [{ $ref: "METIV_SERVICES#release-journey" }],
      }),
    };
    const { text } = extractText(item);
    expect(text).toContain("תיאור השירות");
    expect(text).not.toContain("svc-1");
    expect(text).not.toContain("pass");
    expect(text).not.toContain("METIV_SERVICES");
  });
});

const metiv = (content: Record<string, unknown>, slug: string, langId = "he"): Item => ({
  id: `m-${slug}-${langId}`, groupId: `g-${slug}`, type: "article", langId, title: String(content._key ?? ""),
  content: JSON.stringify(content), categorySlug: slug, categorySlugs: ["metiv", slug],
});

describe("extractText on PTSD-IL rows (unchanged)", () => {
  it("keeps bare values and drops URL leaves", () => {
    const item: Item = {
      id: "p1", groupId: "gp", type: "source", langId: "he", title: "קו סיוע", categorySlug: "rights", categorySlugs: ["rights"],
      content: JSON.stringify({ phone: "02-1234567", email: "a@b.co", site: "https://x.org", body: "טקסט", count: 3 }),
    };
    expect(extractText(item).text).toBe("קו סיוע\n\n02-1234567\n\na@b.co\n\nטקסט");
  });
});

describe("extractText on Metiv rows", () => {
  it("labels phones, emails and URLs with their key (ORG)", () => {
    const { text } = extractText(metiv({
      _key: "ORG", _col: "metiv-org", name: "מטיב",
      phones: { main: "02-6449666", kids: "02-6294858", fax: "02-644-9777" },
      emails: { general: "info@metiv.org" },
      social: { facebook: "https://www.facebook.com/metivtraumacenter" },
      donateUrl: "https://www.jgive.com/x",
    }, "metiv-org"));
    expect(text).toContain("מטיב");
    expect(text).toContain("phones.main: 02-6449666");
    expect(text).toContain("phones.kids: 02-6294858");
    expect(text).toContain("phones.fax: 02-644-9777");
    expect(text).toContain("emails.general: info@metiv.org");
    expect(text).toContain("social.facebook: https://www.facebook.com/metivtraumacenter");
    expect(text).toContain("donateUrl: https://www.jgive.com/x");
    expect(text).not.toContain("ORG\n\nORG");
    expect(text).not.toContain("metiv-org");
  });

  it("keeps the ERAN WhatsApp link (CONTACTS)", () => {
    const { text } = extractText(metiv({
      _key: "CONTACTS", _col: "metiv-contacts",
      ERAN_PHONE: "1201", ERAN_WHATSAPP: "https://api.whatsapp.com/send?phone=9720528451201",
    }, "metiv-contacts"));
    expect(text).toContain("ERAN_PHONE: 1201");
    expect(text).toContain("ERAN_WHATSAPP: https://api.whatsapp.com/send?phone=9720528451201");
  });

  it("uses a contact's own label, once, for its value or link", () => {
    const { text } = extractText(metiv({
      _key: "eran", _col: "metiv-nonprofit-options", title: "ער״ן",
      contacts: [
        { kind: "phone", label: "טלפון", value: "1201" },
        { kind: "link", label: "WhatsApp", href: "https://api.whatsapp.com/send?phone=9720528451201" },
      ],
      services: [{ title: "מרפאה", phone: "02-6449666" }],
    }, "metiv-nonprofit-options"));
    expect(text).toContain("טלפון: 1201");
    expect(text).toContain("WhatsApp: https://api.whatsapp.com/send?phone=9720528451201");
    expect(text).not.toMatch(/(^|\n)טלפון(\n|$)/);
    expect(text).toContain("phone: 02-6449666");
  });

  it("leaves prose bare and still skips reserved keys and ids", () => {
    const { text } = extractText(metiv({ _key: "x", _col: "metiv-services", _tr: { by: "ai" }, id: "x", title: "טיפול", body: "תיאור" }, "metiv-services"));
    expect(text).toBe("x\n\nטיפול\n\nתיאור");
  });
});

describe("extractText $ref resolution", () => {
  const team = (name: string, role: string, langId = "he") =>
    metiv({ _key: name, _col: "metiv-team", name, role }, "metiv-team", langId);
  const rj = metiv({
    _key: "RELEASE_JOURNEY_CONTACTS", _col: "metiv-rj-contacts",
    applications: { $ref: "TEAM#יאיר ברין" }, director: { $ref: "TEAM#רחלי ברוקס" },
  }, "metiv-rj-contacts");

  it("indexes the referenced items instead of nothing", () => {
    const index = buildRefIndex([team("יאיר ברין", "רכז פניות"), team("רחלי ברוקס", "מנהלת מסע שחרור")]);
    const { text } = extractText(rj, refResolver(index, "he"));
    expect(text).toContain("יאיר ברין");
    expect(text).toContain("רכז פניות");
    expect(text).toContain("מנהלת מסע שחרור");
    expect(text).not.toContain("TEAM#");
  });

  it("prefers the row's language, falls back to Hebrew, and resolves singleton refs by key", () => {
    const en = { ...rj, langId: "en", id: "rj-en" };
    const index = buildRefIndex([team("יאיר ברין", "HE ROLE"), team("יאיר ברין", "EN ROLE", "en")]);
    expect(extractText({ ...rj, langId: "fr" }, refResolver(index, "fr")).text).toContain("HE ROLE");
    const { text } = extractText(en, refResolver(index, "en"));
    expect(text).toContain("EN ROLE");
    expect(text).not.toContain("HE ROLE");
    expect(text).not.toContain("רחלי ברוקס"); // a missing ref resolves to nothing
    const single = metiv({ _key: "s", _col: "metiv-services", contact: { $ref: "CONTACTS" } }, "metiv-services");
    const idx2 = buildRefIndex([metiv({ _key: "CONTACTS", _col: "metiv-contacts", ERAN_PHONE: "1201" }, "metiv-contacts")]);
    expect(extractText(single, refResolver(idx2, "he")).text).toContain("ERAN_PHONE: 1201");
  });

  it("drops a ref to a ref, and refs with no resolver", () => {
    const inner = metiv({ _key: "release-journey", _col: "metiv-veterans", $ref: "METIV_SERVICES#release-journey" }, "metiv-veterans");
    const outer = metiv({ _key: "o", _col: "metiv-services", x: { $ref: "VETERANS_PROGRAMS#release-journey" } }, "metiv-services");
    expect(extractText(outer, refResolver(buildRefIndex([inner]), "he")).text).toBe("o");
    expect(extractText(rj).text).toBe("RELEASE_JOURNEY_CONTACTS");
  });

  it("refsIn lists every $ref", () => {
    expect(refsIn(rj).sort()).toEqual(["TEAM#יאיר ברין", "TEAM#רחלי ברוקס"]);
    expect(refsIn(faq)).toEqual([]);
  });
});

describe("extractText age groups and audiences", () => {
  it("adds the age groups and audiences after the title, in the row's language", () => {
    const item: Item = {
      id: "k1", groupId: "gk", type: "article", langId: "he", title: "הנחיות", categorySlug: "children",
      content: JSON.stringify({ body: "לדבר בגובה העיניים" }), ageGroups: ["4-6"], audiences: ["הורים"],
    };
    expect(extractText(item).text).toBe("הנחיות\n\nקבוצת גיל: 4-6\n\nקהל יעד: הורים\n\nלדבר בגובה העיניים");
    expect(extractText({ ...item, langId: "en", audiences: undefined }).text).toBe("הנחיות\n\nAge group: 4-6\n\nלדבר בגובה העיניים");
  });
});
