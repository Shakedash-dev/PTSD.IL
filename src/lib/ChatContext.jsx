import React, { createContext, useContext, useState, useRef, useCallback } from "react";
import { useLang } from "@/lib/LanguageContext";
import { streamChat } from "@/lib/chatClient";

const ChatCtx = createContext(null);
const BASE = import.meta.env.VITE_CHATBOT_URL;

export function ChatProvider({ children }) {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [crisisLang, setCrisisLang] = useState(null);
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const sessionId = useRef(null);
  sessionId.current ??= crypto.randomUUID();

  const send = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || sendingRef.current) return; // ref guard blocks a same-tick second send
    sendingRef.current = true;
    setCrisisLang(null);
    const next = [...messages, { role: "user", content: trimmed }, { role: "assistant", content: "", sources: [] }];
    setMessages(next);
    setSending(true);
    const outgoing = next.slice(0, -1); // exclude the empty assistant placeholder
    try {
      await streamChat(
        { base: BASE, messages: outgoing, lang, sessionId: sessionId.current },
        {
          onToken: (t) => setMessages((m) => {
            const copy = m.slice();
            const last = copy[copy.length - 1];
            copy[copy.length - 1] = { ...last, content: last.content + t };
            return copy;
          }),
          onSources: (s) => setMessages((m) => {
            const copy = m.slice();
            const last = copy[copy.length - 1];
            copy[copy.length - 1] = { ...last, sources: s };
            return copy;
          }),
          onError: (msg) => setMessages((m) => {
            const copy = m.slice();
            const last = copy[copy.length - 1];
            copy[copy.length - 1] = { ...last, content: (last.content || "") + `\n[${msg}]` };
            return copy;
          }),
          onCrisis: (l) => setCrisisLang(l ?? lang),
          onDone: () => {},
        },
      );
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }, [messages, lang]);

  const clear = useCallback(() => { setMessages([]); setCrisisLang(null); }, []);

  return (
    <ChatCtx.Provider value={{ open, setOpen, messages, crisisLang, sending, send, clear }}>
      {children}
    </ChatCtx.Provider>
  );
}

export function useChat() {
  const v = useContext(ChatCtx);
  if (!v) throw new Error("useChat must be used within ChatProvider");
  return v;
}
