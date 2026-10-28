// Fixed renderings of organization names, program names and clinical terms,
// per target language. Used by /translate (translator and validator prompts)
// and by the one-time bulk translation of the Metiv seed, so every language
// says the same thing the same way. Edit here, never in a prompt.
//
// Conventions:
// - The first mention of an organization uses the full form; later mentions
//   may use the short form given in `note`.
// - A gloss in parentheses (program names) is added on first mention only.
// - Phone numbers inside a rendering are part of it and must stay as written.

export const TARGET_LANGS = ["ar", "en", "ru", "fr"] as const;
export type TargetLang = (typeof TARGET_LANGS)[number];

export type GlossaryEntry = {
  he: string;
  ar: string;
  en: string;
  ru: string;
  fr: string;
  note?: string; // applies to every language
};

export const GLOSSARY: GlossaryEntry[] = [
  // ── Organizations and institutions ──
  {
    he: "מטיב",
    en: "Metiv - The Israel Psychotrauma Center",
    ar: "ميتيف - المركز الإسرائيلي للصدمات النفسية",
    ru: "Метив - Израильский центр психотравмы",
    fr: "Metiv - Centre israélien de psychotraumatologie",
    note: "Proper name, always transliterated, never translated as a word (מטיב also means 'benefactor'). Short form after the first mention: Metiv / ميتيف / Метив / Metiv.",
  },
  {
    he: "מטיב ילדים",
    en: "Metiv Children",
    ar: "ميتيف للأطفال",
    ru: "Метив - дети",
    fr: "Metiv Enfants",
    note: "Metiv's children and family unit.",
  },
  {
    he: 'ער"ן',
    en: "ERAN - Emotional First Aid (1201)",
    ar: "عيران - الإسعاف النفسي الأولي (1201)",
    ru: "ЭРАН - Эмоциональная первая помощь (1201)",
    fr: "ERAN - Premiers secours émotionnels (1201)",
    note: "National emotional support helpline, number 1201. Short form: ERAN / عيران / ЭРАН / ERAN.",
  },
  {
    he: "ביטוח לאומי",
    en: "National Insurance Institute (Bituach Leumi)",
    ar: "مؤسسة التأمين الوطني",
    ru: "Битуах Леуми (Институт национального страхования)",
    fr: "Institut national d'assurance (Bituach Leumi)",
  },
  {
    he: "משרד הביטחון",
    en: "Ministry of Defense",
    ar: "وزارة الأمن",
    ru: "Министерство обороны",
    fr: "ministère de la Défense",
    note: "Arabic: وزارة الأمن is the official Israeli Arabic name, not وزارة الدفاع.",
  },
  {
    he: "אגף השיקום (משרד הביטחון)",
    en: "Ministry of Defense Rehabilitation Department",
    ar: "قسم التأهيل في وزارة الأمن",
    ru: "Отдел реабилитации Министерства обороны",
    fr: "Département de réadaptation du ministère de la Défense",
  },
  {
    he: "משרד הבריאות",
    en: "Ministry of Health",
    ar: "وزارة الصحة",
    ru: "Министерство здравоохранения",
    fr: "ministère de la Santé",
  },
  {
    he: "משרד הרווחה",
    en: "Ministry of Welfare and Social Affairs",
    ar: "وزارة الرفاه والشؤون الاجتماعية",
    ru: "Министерство социального обеспечения",
    fr: "ministère des Affaires sociales",
  },
  {
    he: "קופות חולים / קופת חולים",
    en: "health funds (HMOs) / health fund",
    ar: "صناديق المرضى / صندوق المرضى",
    ru: "больничные кассы / больничная касса",
    fr: "caisses de maladie (koupot holim) / caisse de maladie",
    note: "Named funds keep their names: Clalit, Maccabi, Meuhedet, Leumit (transliterated in ar/ru).",
  },
  {
    he: "מרכז רפואי הרצוג",
    en: "Herzog Medical Center",
    ar: "مركز هرتسوغ الطبي",
    ru: "Медицинский центр Герцог",
    fr: "Centre médical Herzog",
  },
  {
    he: 'נט"ל',
    en: "NATAL - Israel Trauma and Resiliency Center",
    ar: "ناتال - المركز الإسرائيلي للصدمة والمرونة النفسية",
    ru: "НАТАЛ - Израильский центр травмы и жизнестойкости",
    fr: "NATAL - Centre israélien du traumatisme et de la résilience",
    note: "Short form: NATAL / ناتال / НАТАЛ / NATAL.",
  },
  {
    he: 'צה"ל',
    en: "the IDF",
    ar: "الجيش الإسرائيلي",
    ru: "ЦАХАЛ",
    fr: "Tsahal",
  },

  // ── Programs ──
  {
    he: 'פנד"ה',
    en: "PANDA (emotion-regulation group program for children)",
    ar: "باندا (برنامج مجموعات لتنظيم المشاعر لدى الأطفال)",
    ru: "ПАНДА (групповая программа регуляции эмоций для детей)",
    fr: "PANDA (programme de groupes de régulation émotionnelle pour enfants)",
    note: "Hebrew acronym of 'here we learn ways of coping'. Transliterate; the gloss is for the first mention only. פנד\"ה בשניים = PANDA for Two (parent and young child groups) / باندا لاثنين / ПАНДА вдвоём / PANDA à deux.",
  },
  {
    he: 'נמ"ל',
    en: "NAMAL ('Let's Make Room for Play', parent and young child play groups)",
    ar: "نامال («لنُفسح مكانًا للّعب»، مجموعات لعب للأهل والأطفال الصغار)",
    ru: "НАМАЛЬ («Освободим место для игры», игровые группы для родителей и малышей)",
    fr: "NAMAL (« Faisons place au jeu », groupes de jeu parents et jeunes enfants)",
    note: "Former name of PANDA for Two. Transliterate; the gloss is for the first mention only.",
  },
  {
    he: "מסע שחרור",
    en: "Peace of Mind",
    ar: "Peace of Mind (راحة البال)",
    ru: "Peace of Mind",
    fr: "Peace of Mind",
    note: "Metiv program for discharged soldiers and reservists; its official English name is Peace of Mind (peaceofmind.org.il). Keep the English name in every language; ar adds the gloss on first mention only.",
  },

  // ── Clinical terms ──
  {
    he: "פוסט-טראומה / הפרעת דחק פוסט-טראומטית",
    en: "post-traumatic stress / PTSD (post-traumatic stress disorder)",
    ar: "اضطراب ما بعد الصدمة (PTSD)",
    ru: "посттравматическое стрессовое расстройство (ПТСР)",
    fr: "trouble de stress post-traumatique (TSPT)",
    note: "Everyday Hebrew פוסט-טראומה is the condition, not a time period. Use the abbreviation after the first mention.",
  },
  {
    he: "טראומה / אירוע טראומטי",
    en: "trauma / traumatic event",
    ar: "صدمة نفسية / حدث صادم",
    ru: "травма / травмирующее событие",
    fr: "traumatisme / événement traumatique",
  },
  {
    he: "חוסן",
    en: "resilience",
    ar: "المناعة النفسية",
    ru: "жизнестойкость",
    fr: "résilience",
  },
  {
    he: "ויסות רגשות",
    en: "emotion regulation",
    ar: "تنظيم المشاعر",
    ru: "регуляция эмоций",
    fr: "régulation émotionnelle",
  },
  {
    he: "טיפול CBT / טיפול קוגניטיבי-התנהגותי",
    en: "CBT (cognitive behavioral therapy)",
    ar: "العلاج المعرفي السلوكي (CBT)",
    ru: "когнитивно-поведенческая терапия (КПТ)",
    fr: "thérapie cognitivo-comportementale (TCC)",
  },
  {
    he: "EMDR",
    en: "EMDR (eye movement desensitization and reprocessing)",
    ar: "EMDR (إزالة التحسس وإعادة المعالجة بحركات العين)",
    ru: "EMDR (десенсибилизация и переработка движением глаз)",
    fr: "EMDR (désensibilisation et retraitement par les mouvements oculaires)",
    note: "Keep the Latin abbreviation EMDR in every language.",
  },
  {
    he: "PE / טיפול בחשיפה ממושכת",
    en: "PE (prolonged exposure therapy)",
    ar: "العلاج بالتعرّض المطوّل (PE)",
    ru: "терапия пролонгированной экспозицией (PE)",
    fr: "thérapie d'exposition prolongée (PE)",
  },
  {
    he: "CPT / טיפול בעיבוד קוגניטיבי",
    en: "CPT (cognitive processing therapy)",
    ar: "العلاج بالمعالجة المعرفية (CPT)",
    ru: "терапия когнитивной переработки (CPT)",
    fr: "thérapie des processus cognitifs (CPT)",
  },
  {
    he: "הדרכה (קלינית)",
    en: "clinical supervision",
    ar: "الإشراف المهني",
    ru: "супервизия",
    fr: "supervision clinique",
  },

  // ── People ──
  {
    he: "מטפל/ת",
    en: "therapist",
    ar: "معالج نفسي",
    ru: "психотерапевт",
    fr: "thérapeute",
    note: "Never keep the slash. Use a neutral or generic form; plural is fine when it reads naturally.",
  },
  {
    he: 'עו"ס / עובד/ת סוציאלי/ת',
    en: "social worker",
    ar: "عامل اجتماعي",
    ru: "социальный работник",
    fr: "travailleur social",
  },
  {
    he: "מילואימניקים / משרתי מילואים",
    en: "reservists",
    ar: "جنود الاحتياط",
    ru: "резервисты",
    fr: "réservistes",
  },
  {
    he: "חיילים משוחררים",
    en: "veterans (discharged soldiers)",
    ar: "الجنود المسرّحون",
    ru: "демобилизованные военнослужащие",
    fr: "soldats démobilisés",
    note: "In en, 'veterans' alone is fine after the first mention.",
  },
  {
    he: "נפגעי פעולות איבה",
    en: "victims of hostile acts (terror victims)",
    ar: "متضرّرو الأعمال العدائية",
    ru: "пострадавшие от враждебных действий (теракты)",
    fr: "victimes d'actes d'hostilité (victimes du terrorisme)",
    note: "Legal status recognized by the National Insurance Institute.",
  },
  {
    he: "המעגל השני / בני משפחה וקרובים",
    en: "the second circle (family members and loved ones)",
    ar: "الدائرة الثانية (أفراد العائلة والمقرّبون)",
    ru: "второй круг (родные и близкие)",
    fr: "le deuxième cercle (proches et membres de la famille)",
  },
];

/** Glossary for one target language: Hebrew source -> required rendering. */
export function glossaryFor(lang: TargetLang): { he: string; term: string; note?: string }[] {
  return GLOSSARY.map((e) => ({ he: e.he, term: e[lang], ...(e.note ? { note: e.note } : {}) }));
}

/** The glossary as plain lines for a prompt. */
export function renderGlossary(lang: TargetLang): string {
  return glossaryFor(lang)
    .map((e) => `- ${e.he} => ${e.term}${e.note ? `  [${e.note}]` : ""}`)
    .join("\n");
}
