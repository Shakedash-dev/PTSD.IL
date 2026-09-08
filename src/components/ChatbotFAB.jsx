import React from "react";
import { useLang } from "@/lib/LanguageContext";
import { t } from "@/lib/i18n";
import { MessageCircle } from "lucide-react";
import { useChat } from "@/lib/ChatContext";
import ChatPanel from "@/components/chat/ChatPanel";
import { Button } from "@/components/ui/button";

export default function ChatbotFAB() {
  const { lang } = useLang();
  const { open, setOpen } = useChat();

  return (
    <>
      <ChatPanel />
      <div className="fixed bottom-6 left-6 z-50" dir="ltr">
        <Button
          variant="solid"
          radius="full"
          size="none"
          onClick={() => setOpen(!open)}
          className="w-14 h-14 border border-border hover:bg-accent duration-500 ease-in-out"
          aria-label={t(lang, "chat_tooltip")}
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
    </>
  );
}
