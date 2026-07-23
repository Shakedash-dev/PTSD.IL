import React, { createContext, useContext, useState, useRef, useCallback } from "react";
import { useLang } from "@/lib/LanguageContext";
import { streamChat } from "@/lib/chatClient";

const ChatCtx = createContext(null);
const BASE = import.meta.env.VITE_CHATBOT_URL;

export function ChatProvider({ children }) {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [sources, setSources] = useState([]);
  const [crisisLang, setCrisisLang] = useState(null);
  const [sending, setSending] = useState(false);
  const sessionId = useRef(crypto.randomUUID());

  const send = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setCrisisLang(null);
    setSources([]);
    const next = [...messages, { role: "user", content: trimmed }, { role: "assistant", content: "" }];
    setMessages(next);
    setSending(true);
    const outgoing = next.slice(0, -1); // exclude the empty assistant placeholder
    await streamChat(
      { base: BASE, messages: outgoing, lang, sessionId: sessionId.current },
      {
        onCrisis: (l) => setCrisisLang(l ?? lang),
        onToken: (t) => setMessages((m) => {
          const copy = m.slice();
          copy[copy.length - 1] = { role: "assistant", content: copy[copy.length - 1].content + t };
          return copy;
        }),
        onSources: (s) => setSources(s),
        onError: (msg) => setMessages((m) => {
          const copy = m.slice();
          copy[copy.length - 1] = { role: "assistant", content: (copy[copy.length - 1].content || "") + `\n[${msg}]` };
          return copy;
        }),
        onDone: () => {},
      },
    );
    setSending(false);
  }, [messages, sending, lang]);

  const clear = useCallback(() => { setMessages([]); setSources([]); setCrisisLang(null); }, []);

  return (
    <ChatCtx.Provider value={{ open, setOpen, messages, sources, crisisLang, sending, send, clear }}>
      {children}
    </ChatCtx.Provider>
  );
}

export function useChat() {
  const v = useContext(ChatCtx);
  if (!v) throw new Error("useChat must be used within ChatProvider");
  return v;
}
