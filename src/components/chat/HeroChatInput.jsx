import React, { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { useLang } from "@/lib/LanguageContext";
import { t } from "@/lib/i18n";
import { useChat } from "@/lib/ChatContext";

// Caps the textarea's growth at roughly 4-5 lines before it starts scrolling.
const MAX_TEXTAREA_HEIGHT = 120;

export default function HeroChatInput() {
  const { lang } = useLang();
  const { send, setOpen } = useChat();
  const [draft, setDraft] = useState("");
  const textareaRef = useRef(null);

  const submit = (e) => { e.preventDefault(); if (!draft.trim()) return; send(draft); setOpen(true); setDraft(""); };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(e);
    }
  };

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [draft]);

  return (
    <form onSubmit={submit} className="flex items-end gap-2 max-w-xl mb-10 bg-background border border-border rounded-full px-4 py-2 shadow-sm">
      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t(lang, "hero_chat_placeholder")}
        rows={1}
        style={{ maxHeight: MAX_TEXTAREA_HEIGHT }}
        className="flex-1 bg-transparent text-lg text-foreground placeholder:text-muted-foreground outline-none resize-none overflow-y-auto py-1"
      />
      <button type="submit" aria-label={t(lang, "chat_send")} className="text-primary shrink-0"><Send className="w-6 h-6" /></button>
    </form>
  );
}
