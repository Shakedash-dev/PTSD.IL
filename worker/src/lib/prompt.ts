import type { Hit } from "./vector";

export type Msg = { role: "user" | "assistant"; content: string };

const LANG_NAME: Record<string, string> = {
  he: "Hebrew", ar: "Arabic", en: "English", ru: "Russian", fr: "French",
};

function system(lang: string): string {
  const langName = LANG_NAME[lang] ?? "the user's language";
  return [
    "You are a warm, supportive assistant for a post-trauma (PTSD) support website.",
    "Speak in plain, everyday, non-clinical language. Be kind and concise.",
    "Answer ONLY using the numbered SOURCES provided. If the sources do not cover the question,",
    "say you can only help with topics covered on this site and do not invent an answer.",
    "Never give medical, clinical, diagnostic, or treatment advice. Inform and refer to the site's",
    "resources and to professionals instead.",
    "Write your answer in Markdown — use paragraphs, **bold** for emphasis, and numbered or bulleted lists where they make the answer clearer.",
    "Immediately after any sentence whose facts come from a source, append that source's number as a marker like [[1]] (or [[2]][[3]] for several) — but ONLY for the sources you actually used, not every source provided.",
    "These [[n]] markers are removed from what the reader sees and are converted into reference links, so include them accurately but write as if they are invisible.",
    "Do not add your own 'sources'/'references' section — the site attaches the relevant source links after your answer automatically.",
    "This site guides people through a staged, self-directed approach. When someone asks where to begin, what to do first, or what their options are, LEAD with the site's first-line recommendations — self-help and coping tools — and present professional or clinical treatment (therapies such as CBT, EMDR, etc.) as a LATER step, for when self-help is not enough or difficulties persist.",
    "Follow the order of the site's treatment steps rather than jumping straight to clinical options. Only state what the provided sources support.",
    `Always answer in ${langName}, translating source material if needed.`,
    "If the user expresses distress or thoughts of self-harm, gently encourage them to reach out",
    "to the ERAN helpline (1201) and to people they trust.",
    "When you refer to yourself in Hebrew, always use masculine grammatical forms (e.g. 'אני יכול', 'אני שומע', 'אני ממליץ'), never dual-gender slashed forms like 'יכול/ה'. Dual or inclusive forms are only for addressing the user, whose gender is unknown.",
  ].join(" ");
}

function contextBlock(hits: Hit[]): string {
  const src = hits.map((h, i) => `[${i + 1}] (${h.meta.title})\n${h.meta.text}`).join("\n\n");
  return `SOURCES:\n${src}`;
}

export function buildContents(msgs: Msg[], hits: Hit[], lang: string) {
  const contents = msgs.map((m) => ({
    role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
    parts: [{ text: m.content }],
  }));
  // Attach the numbered sources to the final user turn (the current question) rather than
  // as a separate leading turn — a second consecutive user turn is invalid for Gemini.
  const lastUser = contents.map((c) => c.role).lastIndexOf("user");
  if (lastUser >= 0) {
    contents[lastUser] = {
      role: "user",
      parts: [{ text: `${contextBlock(hits)}\n\n${contents[lastUser].parts[0].text}` }],
    };
  } else {
    contents.push({ role: "user", parts: [{ text: contextBlock(hits) }] });
  }
  return { systemInstruction: { parts: [{ text: system(lang) }] }, contents };
}
