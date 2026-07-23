import { describe, it, expect } from "vitest";
import { detectCrisis } from "../src/lib/crisis";

describe("detectCrisis", () => {
  it("flags Hebrew self-harm phrasing", () => {
    expect(detectCrisis("אני רוצה לשים סוף לחיים שלי")).toBe(true);
  });
  it("flags English suicidal phrasing", () => {
    expect(detectCrisis("I want to kill myself")).toBe(true);
  });
  it("does not flag ordinary questions", () => {
    expect(detectCrisis("What are my rights after a work injury?")).toBe(false);
    expect(detectCrisis("מהן הזכויות שלי?")).toBe(false);
  });
  it("flags Russian suicidal phrasing", () => {
    expect(detectCrisis("я хочу покончить с собой")).toBe(true);
  });
  it("flags Arabic suicidal phrasing", () => {
    expect(detectCrisis("أريد أن أنهي حياتي")).toBe(true);
  });
  it("does not flag a benign message containing a crisis-adjacent substring", () => {
    // "hurtful" contains "hurt" but not the phrase "hurt myself"
    expect(detectCrisis("That was a hurtful comment my coworker made.")).toBe(false);
  });
});
