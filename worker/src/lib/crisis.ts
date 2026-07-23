// Starter phrase lists - REVIEW WITH A CLINICAL EXPERT before launch.
const PHRASES: string[] = [
  // Hebrew
  "לשים סוף לחיים", "לשים סוף לחיי", "לא רוצה לחיות", "לסיים את החיים",
  "לפגוע בעצמי", "לאבד את עצמי לדעת", "אובדני", "לְהִתְאַבֵּד", "להתאבד",
  // Arabic
  "أريد أن أنهي حياتي", "أؤذي نفسي", "الانتحار", "أنهي حياتي",
  // English
  "kill myself", "end my life", "want to die", "suicide", "hurt myself", "self harm", "self-harm",
  // Russian
  "покончить с собой", "не хочу жить", "убить себя", "суицид",
  // French
  "en finir avec la vie", "me faire du mal", "suicide", "envie de mourir",
];

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[֑-ׇً-ْ]/g, "");
}

const NEEDLES = PHRASES.map(normalize);

export function detectCrisis(text: string): boolean {
  const hay = normalize(text);
  return NEEDLES.some((n) => hay.includes(n));
}
