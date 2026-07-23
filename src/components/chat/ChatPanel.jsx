import React, { useState } from "react";
import { Link } from "react-router-dom";
import { X, Send, ExternalLink } from "lucide-react";
import { useLang } from "@/lib/LanguageContext";
import { t } from "@/lib/i18n";
import { useChat } from "@/lib/ChatContext";
import Markdown from "@/components/Markdown";
import { sectionRoute } from "@/lib/citations";

export default function ChatPanel() {
  const { lang } = useLang();
  const { open, setOpen, messages, crisisLang, sending, send } = useChat();
  const [draft, setDraft] = useState("");
  if (!open) return null;

  const submit = (e) => { e.preventDefault(); send(draft); setDraft(""); };
  const starters = t(lang, "chat_starters") || [];

  const lastMessage = messages[messages.length - 1];
  const isThinking = sending && lastMessage?.role === "assistant" && !lastMessage.content;

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
        {messages.map((m, i) => {
          if (m.role === "assistant" && !m.content && i === messages.length - 1 && isThinking) {
            return (
              <div key={i} className="text-start">
                <span className="inline-block px-3 py-2 rounded-2xl text-sm bg-muted text-muted-foreground">
                  {t(lang, "chat_thinking")}
                </span>
              </div>
            );
          }

          const cited = m.role === "assistant"
            ? new Set([...m.content.matchAll(/\[\[(\d+)\]\]/g)].map((x) => Number(x[1])))
            : null;
          const cleanText = m.role === "assistant"
            ? m.content.replace(/\[\[\d+\]\]/g, "").replace(/[ \t]+([.,!?])/g, "$1")
            : m.content;

          return (
            <div key={i} className={m.role === "user" ? "text-end" : "text-start"}>
              <span className={`inline-block px-3 py-2 rounded-2xl text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {m.role === "assistant" ? <Markdown className="rich-content text-sm">{cleanText}</Markdown> : m.content}
              </span>
              {m.role === "assistant" && (() => {
                const seen = new Set();
                const refs = (m.sources || [])
                  .filter((s) => cited.has(s.n))
                  .filter((s) => !seen.has(s.itemId) && seen.add(s.itemId));
                if (refs.length === 0) return null;
                return (
                  <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-border/50">
                    {refs.map((s) => (
                      <Link key={s.itemId} to={sectionRoute(s.type)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-foreground rounded-full text-xs font-medium hover:bg-primary/20 transition-natural">
                        {s.title}<ExternalLink className="w-3 h-3" />
                      </Link>
                    ))}
                  </div>
                );
              })()}
            </div>
          );
        })}
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
