import React, { useState } from "react";
import { Send } from "lucide-react";
import { useLang } from "@/lib/LanguageContext";
import { t } from "@/lib/i18n";
import { useChat } from "@/lib/ChatContext";

export default function HeroChatInput() {
  const { lang } = useLang();
  const { send, setOpen } = useChat();
  const [draft, setDraft] = useState("");
  const submit = (e) => { e.preventDefault(); if (!draft.trim()) return; send(draft); setOpen(true); setDraft(""); };
  return (
    <form onSubmit={submit} className="flex items-center gap-2 max-w-xl mb-10 bg-background border border-border rounded-full px-4 py-2 shadow-sm">
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={t(lang, "hero_chat_placeholder")}
        className="flex-1 bg-transparent text-lg outline-none"
      />
      <button type="submit" aria-label={t(lang, "chat_send")} className="text-primary"><Send className="w-6 h-6" /></button>
    </form>
  );
}
