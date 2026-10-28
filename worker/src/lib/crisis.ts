// Starter phrase lists - REVIEW WITH A CLINICAL EXPERT before launch.
const PHRASES: string[] = [
  // Hebrew
  "לשים סוף לחיים", "לשים סוף לחיי", "לא רוצה לחיות", "לסיים את החיים",
  "לפגוע בעצמי", "לאבד את עצמי לדעת", "אובדני", "לְהִתְאַבֵּד", "להתאבד",
  // Hebrew - "want to die" family (mirrors the English "want to die"; was missing)
  "רוצה למות", "רוצה לגמור עם הכל", "לגמור עם החיים", "אין טעם לחיות",
  "עדיף למות", "מוטב שלא אהיה כאן",
  // Hebrew - colloquial and act-in-progress phrasings (Q&A safety review, 2026-10-28)
  "בא לי למות", "בלעתי כדורים", "בלעתי את כל הכדורים", "ולא אתעורר", "לא להתעורר יותר",
  "לחתוך את עצמי", "לחתוך לעצמי", "להיעלם מהעולם", "לא רוצה להיות פה יותר",
  // Hebrew - the crisis rows' paraphrases and review-accuracy/review-safety.md
  // (2026-10-28). Bare "חתכתי" / "פגיעה" are left out: "חתכתי ירקות" and
  // "פגיעה בעבודה" are everyday questions.
  "נמאס לי לחיות", "נמאס לו לחיות", "נמאס לה לחיות", "נמאס לי מהחיים",
  "פוגע בעצמי", "פוגעת בעצמי", "פוגע בעצמו", "פוגעת בעצמה", "פגעתי בעצמי",
  "יפגע בעצמו", "תפגע בעצמה", "פגיעה עצמית",
  "חתכתי את עצמי", "חתכתי לעצמי", "חתכתי את היד", "חתכתי ורידים", "לחתוך ורידים",
  "חותך את עצמי", "חותכת את עצמי", "חותך כדי להרגיש", "חותכת כדי להרגיש",
  "שרפתי את עצמי", "מרביץ לעצמי", "מרביצה לעצמי",
  "לקחתי יותר מדי כדורים", "לקחתי את כל הכדורים", "בלעתי יותר מדי כדורים",
  "התאבדות", "אין לי סיבה לחיות", "אין סיבה לחיות", "אין טעם להמשיך", "לא רואה טעם להמשיך",
  "לגמור עם הכל", "לגמור עם הכול", "עדיף שלא אהיה פה", "עדיף שלא אהיה כאן", "עדיף שלא יהיה פה",
  "יותר טובים בלעדיי", "יותר טובים בלעדי", "יותר טוב בלעדיי", "טובים יותר בלעדיי", "מכתב פרידה",
  "לירות לעצמי", "לירות בעצמי",
  // Arabic
  "أريد أن أنهي حياتي", "أؤذي نفسي", "الانتحار", "أنهي حياتي", "أريد أن أموت", "انتحر",
  "سئمت الحياة", "تعبت من الحياة", "لا أريد أن أعيش", "إيذاء النفس", "آذيت نفسي", "جرحت نفسي",
  "أجرح نفسي", "تناولت الكثير من الحبوب", "أخذت كل الحبوب", "بلعت الحبوب", "جرعة زائدة",
  "أفضل بدوني", "لا سبب للعيش", "رسالة وداع",
  // English
  "kill myself", "end my life", "want to die", "suicide", "hurt myself", "self harm", "self-harm",
  "don't want to live", "dont want to live", "took all my pills", "overdose",
  "tired of living", "sick of living", "hurting myself", "harm myself", "harming myself",
  "cutting myself", "cut myself on purpose", "took too many pills", "took all the pills",
  "better off without me", "better off dead", "no reason to live", "suicide note", "shoot myself",
  "end it all", "and not wake up", "and never wake up",
  // Russian
  "покончить с собой", "не хочу жить", "убить себя", "суицид", "хочу умереть",
  "устал жить", "устала жить", "надоело жить", "причиняю себе вред", "навредить себе",
  "режу себя", "порезал себя", "порезала себя", "самоповрежд", "наглотался таблеток",
  "наглоталась таблеток", "выпил все таблетки", "выпила все таблетки", "принял слишком много таблеток", "приняла слишком много таблеток",
  "передозировк", "лучше без меня", "незачем жить", "предсмертн", "застрелиться",
  // French
  "en finir avec la vie", "me faire du mal", "suicide", "envie de mourir", "me suicider", "je veux mourir",
  "marre de vivre", "fatigué de vivre", "fatiguée de vivre", "je me fais du mal", "me scarifie",
  "scarification", "automutilation", "pris trop de médicaments", "pris tous mes médicaments", "avalé trop de", "avalé tous mes",
  "surdose", "mieux sans moi", "plus de raison de vivre", "lettre d'adieu", "me tirer une balle",
];

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[֑-ׇً-ْ]/g, "").replace(/[‘’ʼ]/g, "'");
}

const NEEDLES = PHRASES.map(normalize);

export function detectCrisis(text: string): boolean {
  const hay = normalize(text);
  return NEEDLES.some((n) => hay.includes(n));
}

// How many recent user turns keep a crisis active. A crisis said two messages
// ago still applies when the user answers "are you safe now?" with "no".
export const CRISIS_TURNS = 3;

/** The most recent of the last CRISIS_TURNS user messages that is a crisis, or null. */
export function recentCrisisMessage(userMessages: string[]): string | null {
  const recent = userMessages.slice(-CRISIS_TURNS).reverse();
  return recent.find(detectCrisis) ?? null;
}
