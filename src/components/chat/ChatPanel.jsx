import React, { useState } from "react";
import { X, Send } from "lucide-react";
import { useLang } from "@/lib/LanguageContext";
import { t } from "@/lib/i18n";
import { useChat } from "@/lib/ChatContext";
import Markdown from "@/components/Markdown";
import SourceDrawer from "./SourceDrawer";

export default function ChatPanel() {
  const { lang } = useLang();
  const { open, setOpen, messages, crisisLang, sending, send } = useChat();
  const [draft, setDraft] = useState("");
  const [activeSource, setActiveSource] = useState(null);
  if (!open) return null;

  const submit = (e) => { e.preventDefault(); send(draft); setDraft(""); };
  const starters = t(lang, "chat_starters") || [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t(lang, "chat_title")}
      onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
      className="fixed bottom-24 left-6 z-50 w-[360px] max-w-[90vw] h-[520px] bg-background border border-border rounded-2xl shadow-xl flex flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between p-3 border-b border-border">
        <span className="font-heading font-bold">{t(lang, "chat_title")}</span>
        <button onClick={() => setOpen(false)} aria-label={t(lang, "chat_close")}><X className="w-5 h-5" /></button>
      </div>

      {crisisLang && (
        <div role="alert" className="bg-destructive/10 text-sm p-3 border-b border-border">
          <span>{t(crisisLang, "eran_link")}</span>{" - "}
          <a href={`tel:${t(crisisLang, "eran_phone")}`} className="font-bold underline">
            {t(crisisLang, "eran_phone")}
          </a>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-3 relative">
        {messages.length === 0 && (
          <div className="space-y-2">
            {starters.map((s, i) => (
              <button key={i} onClick={() => send(s)} className="block w-full text-start text-sm p-2 rounded-lg border border-border hover:bg-muted">
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-end" : "text-start"}>
            <span className={`inline-block px-3 py-2 rounded-2xl text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {m.role === "assistant" ? <Markdown className="rich-content text-sm">{m.content}</Markdown> : m.content}
            </span>
            {m.role === "assistant" && m.sources?.length > 0 && (() => {
              const seen = new Set();
              const unique = m.sources.filter((s) => !seen.has(s.itemId) && seen.add(s.itemId));
              return (
                <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-border/50">
                  {unique.map((s) => (
                    <button key={s.itemId} onClick={() => setActiveSource(s)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-foreground rounded-full text-xs font-medium hover:bg-primary/20 transition-natural">
                      {s.title}
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>
        ))}
        <SourceDrawer source={activeSource} onClose={() => setActiveSource(null)} />
      </div>

      <form onSubmit={submit} className="p-3 border-t border-border flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t(lang, "chat_placeholder")}
          className="flex-1 text-sm px-3 py-2 rounded-lg border border-border bg-background"
        />
        <button type="submit" disabled={sending} aria-label={t(lang, "chat_send")} className="p-2 text-primary disabled:opacity-50">
          <Send className="w-5 h-5" />
        </button>
      </form>
      <p className="text-[10px] opacity-50 px-3 pb-2 leading-tight">{t(lang, "chat_disclaimer")}</p>
    </div>
  );
}
