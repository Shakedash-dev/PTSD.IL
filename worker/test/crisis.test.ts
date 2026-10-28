import { describe, it, expect } from "vitest";
import { detectCrisis } from "../src/lib/crisis";

describe("detectCrisis", () => {
  it("flags Hebrew self-harm phrasing", () => {
    expect(detectCrisis("אני רוצה לשים סוף לחיים שלי")).toBe(true);
  });
  it("flags Hebrew 'want to die' phrasing", () => {
    expect(detectCrisis("אני מרגיש שאני רוצה למות")).toBe(true);
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
  it("flags French self-harm phrasing", () => {
    expect(detectCrisis("je veux en finir avec la vie")).toBe(true);
  });
});

describe("colloquial phrasings", () => {
  it("flags phrasings found in the Q&A safety review", () => {
    for (const t of ["בא לי למות", "בלעתי כדורים", "הלוואי שאלך לישון ולא אתעורר", "je veux mourir", "хочу умереть"]) {
      expect(detectCrisis(t), t).toBe(true);
    }
  });
});

describe("phrasings from the crisis Q&A rows and the reviews", () => {
  it("flags Hebrew self-harm, overdose and suicidal phrasings", () => {
    for (const t of [
      "נמאס לי לחיות", "אני פוגע בעצמי", "פוגעת בעצמי", "חתכתי את עצמי ויש הרבה דם", "לקחתי יותר מדי כדורים",
      "לקחתי את כל הכדורים", "הבת שלי פוגעת בעצמה", "אני דואגת שאחי יפגע בעצמו", "פגעתי בעצמי שוב",
      "אני חותכת כדי להרגיש משהו", "שרפתי את עצמי בכוונה", "אני מרביץ לעצמי כשאני מוצף",
      "אני חושבת על התאבדות", "אין לי סיבה לחיות", "אני לא רואה טעם להמשיך", "עדיף שלא אהיה פה",
      "כולם יהיו יותר טובים בלעדיי", "הבן שלי כתב מכתב פרידה", "הוא נעל את עצמו בחדר ואמר שנמאס לו לחיות",
      "חבר עם פוסט טראומה מדבר על לגמור עם הכל", "אבא שלי אומר שעדיף שלא יהיה פה", "בא לי לירות לעצמי",
      "פגיעה עצמית אחרי טראומה",
    ]) expect(detectCrisis(t), t).toBe(true);
  });

  it("flags the ar/en/ru/fr equivalents", () => {
    for (const t of [
      "سئمت الحياة", "أنا أؤذي نفسي", "جرحت نفسي", "تناولت الكثير من الحبوب",
      "I'm tired of living", "I keep hurting myself", "I took too many pills", "they'd be better off without me",
      "надоело жить", "я режу себя", "я наглоталась таблеток", "я причиняю себе вред",
      "j'en ai marre de vivre", "je me fais du mal", "j'ai pris trop de médicaments", "ils seraient mieux sans moi",
      "j’en ai marre de vivre",
    ]) expect(detectCrisis(t), t).toBe(true);
  });

  it("does not flag benign questions", () => {
    for (const t of [
      "מה זה פלאשבק?", "יש לי פלאשבק עכשיו", "חתכתי ירקות ונזכרתי באירוע", "מה הזכויות אחרי פגיעה בעבודה?",
      "איך מדברים עם ילד בן 5 על טראומה?", "יש לי התקף חרדה עכשיו", "איך לעזור לבן הזוג שחזר מהמילואים",
      "What is a flashback?", "How do I find a therapist?", "Что такое ПТСР?", "Comment trouver un psychologue ?",
      "ما هو اضطراب ما بعد الصدمة؟", "I cut myself shaving this morning",
    ]) expect(detectCrisis(t), t).toBe(false);
  });
});
