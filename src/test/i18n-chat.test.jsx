import { describe, it, expect } from "vitest";
import { t } from "@/lib/i18n";

describe("chat i18n", () => {
  it("has chat strings in all supported languages", () => {
    for (const lang of ["he", "ar", "en", "ru", "fr"]) {
      expect(typeof t(lang, "chat_title")).toBe("string");
      expect(typeof t(lang, "chat_disclaimer")).toBe("string");
      expect(Array.isArray(t(lang, "chat_starters"))).toBe(true);
    }
  });
});
