import React from "react";
import { useLang } from "@/lib/LanguageContext";
import { t } from "@/lib/i18n";
import { MessageCircle } from "lucide-react";
import { useChat } from "@/lib/ChatContext";
import ChatPanel from "@/components/chat/ChatPanel";

export default function ChatbotFAB() {
  const { lang } = useLang();
  const { open, setOpen } = useChat();

  return (
    <>
      <ChatPanel />
      <div className="fixed bottom-6 left-6 z-50" dir="ltr">
        <button
          onClick={() => setOpen(!open)}
          className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-accent transition-colors duration-500 ease-in-out border border-border"
          aria-label={t(lang, "chat_tooltip")}
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>
    </>
  );
}
