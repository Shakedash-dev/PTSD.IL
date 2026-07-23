# RAG Chatbot Widget - Implementation Plan (2 of 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the React chat widget that talks to the Worker's `/chat` SSE endpoint - in-memory conversation, global FAB, home-screen input box, streamed answers with clickable superscript citations, a source drawer, a crisis banner, and a tiny disclaimer.

**Architecture:** A `ChatProvider` context at the app root holds the conversation in memory (survives SPA navigation, cleared on reload - no `localStorage`). A thin SSE client streams frames from the Worker. `ChatPanel` renders messages, parses `[[n]]` markers into superscript links that open a `SourceDrawer`, and shows a pinned ERAN banner on a `crisis` frame. The existing `ChatbotFAB` toggles the panel; the home hero subtitle is replaced by an input that seeds the first message.

**Tech Stack:** React 18 (JSX), Vite, `@/` alias, `useLang`/`t` i18n, lucide-react, Tailwind tokens, shadcn `Button`; tests via Vitest + `@testing-library/react` + jsdom (added in Task 1).

## Global Constraints

- Frontend is **JSX only** (no `.ts`/`.tsx`); `@/` resolves to `src/`.
- Conversation state is **in-memory React state only** - survives route changes, cleared on full reload. No `localStorage`/`sessionStorage` for chat.
- Anonymous users. `sessionId` is a `crypto.randomUUID()` generated once per `ChatProvider` mount (so a reload = new session = rate limit reset, per spec).
- Worker base URL from `import.meta.env.VITE_CHATBOT_URL`.
- Citations render **only** as clickable superscript numbers at sentence ends; **no** bottom "Sources" list.
- Crisis banner text comes from existing i18n keys `eran_link` + `eran_phone` (`1201`); disclaimer adapts `footer_disclaimer`. New chat strings are added to all 5 languages.
- RTL respected via `useLang` (`he`/`ar` are RTL).
- SSE frames consumed: `crisis` | `token` | `sources` | `done` | `error` (contract from Worker plan Task 11).

---

### Task 1: Add frontend test tooling

**Files:**
- Modify: `src/package.json` (devDeps + `test` script)
- Create: `src/vitest.config.js`
- Create: `src/test/setup.js`
- Test: `src/test/smoke.test.jsx`

**Interfaces:** none (tooling). Produces a working `npm test` for `.jsx`.

- [ ] **Step 1: Add devDependencies and script to `src/package.json`**

Add to `devDependencies`: `"vitest": "^2.1.0"`, `"@testing-library/react": "^16.0.0"`, `"@testing-library/jest-dom": "^6.5.0"`, `"jsdom": "^25.0.0"`. Add to `scripts`: `"test": "vitest run"`.

- [ ] **Step 2: Create `src/vitest.config.js`**

```javascript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  test: { environment: "jsdom", globals: true, setupFiles: ["./test/setup.js"] },
});
```

- [ ] **Step 3: Create `src/test/setup.js`**

```javascript
import "@testing-library/jest-dom";
```

- [ ] **Step 4: Write `src/test/smoke.test.jsx`**

```jsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

describe("test tooling", () => {
  it("renders JSX", () => {
    render(<div>hello chat</div>);
    expect(screen.getByText("hello chat")).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run**

Run: `cd src && npm install && npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/package.json src/vitest.config.js src/test/setup.js src/test/smoke.test.jsx
git commit -m "test(web): add vitest + testing-library for the chat widget"
```

---

### Task 2: SSE chat client

**Files:**
- Create: `src/lib/chatClient.js`
- Test: `src/test/chatClient.test.jsx`

**Interfaces:**
- Produces: `streamChat({ base, messages, lang, sessionId }, handlers)` where `handlers = { onCrisis(lang), onToken(text), onSources(list), onError(msg), onDone() }`. POSTs to `${base}/chat`, parses SSE frames, dispatches. Returns a promise resolving when the stream ends. Consumed by `ChatProvider` (Task 3).

- [ ] **Step 1: Write `src/test/chatClient.test.jsx`**

```jsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { streamChat } from "@/lib/chatClient";

afterEach(() => vi.restoreAllMocks());

function sse(frames) {
  const enc = new TextEncoder();
  return new Response(new ReadableStream({
    start(c) { for (const f of frames) c.enqueue(enc.encode(f)); c.close(); },
  }), { status: 200 });
}

describe("streamChat", () => {
  it("dispatches token, sources, done", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(sse([
      `event: token\ndata: ${JSON.stringify({ text: "Hi" })}\n\n`,
      `event: sources\ndata: ${JSON.stringify([{ n: 1, itemId: "1", type: "faq", title: "T" }])}\n\n`,
      `event: done\ndata: {}\n\n`,
    ]));
    const got = { tokens: [], sources: null, done: false };
    await streamChat(
      { base: "https://w", messages: [{ role: "user", content: "x" }], lang: "he", sessionId: "s" },
      { onToken: (t) => got.tokens.push(t), onSources: (s) => (got.sources = s), onDone: () => (got.done = true) },
    );
    expect(got.tokens.join("")).toBe("Hi");
    expect(got.sources[0].title).toBe("T");
    expect(got.done).toBe(true);
  });

  it("dispatches crisis and error frames", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(sse([
      `event: crisis\ndata: ${JSON.stringify({ lang: "en" })}\n\n`,
      `event: error\ndata: ${JSON.stringify({ message: "boom" })}\n\n`,
    ]));
    const seen = [];
    await streamChat(
      { base: "https://w", messages: [], lang: "en", sessionId: "s" },
      { onCrisis: () => seen.push("crisis"), onError: () => seen.push("error") },
    );
    expect(seen).toEqual(["crisis", "error"]);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd src && npm test -- chatClient`
Expected: FAIL.

- [ ] **Step 3: Create `src/lib/chatClient.js`**

```javascript
export async function streamChat({ base, messages, lang, sessionId }, handlers = {}) {
  const res = await fetch(`${base}/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages, lang, sessionId }),
  });
  if (res.status === 429) { handlers.onError?.("rate_limited"); return; }
  if (!res.ok || !res.body) { handlers.onError?.(`http_${res.status}`); return; }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    let sep;
    while ((sep = buf.indexOf("\n\n")) >= 0) {
      const raw = buf.slice(0, sep);
      buf = buf.slice(sep + 2);
      const ev = /^event:\s*(.+)$/m.exec(raw)?.[1]?.trim();
      const dataLine = /^data:\s*(.*)$/m.exec(raw)?.[1] ?? "";
      let data = {};
      try { data = JSON.parse(dataLine); } catch { /* skip */ }
      if (ev === "crisis") handlers.onCrisis?.(data.lang);
      else if (ev === "token") handlers.onToken?.(data.text ?? "");
      else if (ev === "sources") handlers.onSources?.(data);
      else if (ev === "error") handlers.onError?.(data.message ?? "error");
      else if (ev === "done") handlers.onDone?.();
    }
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd src && npm test -- chatClient`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/chatClient.js src/test/chatClient.test.jsx
git commit -m "feat(web): SSE chat client"
```

---

### Task 3: ChatProvider (in-memory conversation context)

**Files:**
- Create: `src/lib/ChatContext.jsx`
- Test: `src/test/ChatContext.test.jsx`

**Interfaces:**
- Consumes: `streamChat` (Task 2), `useLang`.
- Produces: `ChatProvider` and `useChat()` → `{ open, setOpen, messages, crisisLang, sources, sending, send(text), clear() }`. `messages` is `{ role, content }[]`; the assistant message is appended once and mutated as tokens stream. `sessionId` created once via `crypto.randomUUID()`. Consumed by `ChatPanel`, `ChatbotFAB`, home input.

- [ ] **Step 1: Write `src/test/ChatContext.test.jsx`**

```jsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ChatProvider, useChat } from "@/lib/ChatContext";

vi.mock("@/lib/LanguageContext", () => ({ useLang: () => ({ lang: "he" }) }));
vi.mock("@/lib/chatClient", () => ({
  streamChat: async (_req, h) => { h.onToken("hel"); h.onToken("lo"); h.onSources([{ n: 1, itemId: "1", type: "faq", title: "T" }]); h.onDone(); },
}));

afterEach(() => vi.restoreAllMocks());

function Probe() {
  const { messages, send, sources } = useChat();
  return (
    <div>
      <button onClick={() => send("hi")}>go</button>
      <div data-testid="msgs">{messages.map((m) => `${m.role}:${m.content}`).join("|")}</div>
      <div data-testid="src">{sources.length}</div>
    </div>
  );
}

describe("ChatProvider", () => {
  it("appends user + streamed assistant message and sources", async () => {
    render(<ChatProvider><Probe /></ChatProvider>);
    await act(async () => { screen.getByText("go").click(); });
    expect(screen.getByTestId("msgs").textContent).toBe("user:hi|assistant:hello");
    expect(screen.getByTestId("src").textContent).toBe("1");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd src && npm test -- ChatContext`
Expected: FAIL.

- [ ] **Step 3: Create `src/lib/ChatContext.jsx`**

```jsx
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd src && npm test -- ChatContext`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ChatContext.jsx src/test/ChatContext.test.jsx
git commit -m "feat(web): in-memory chat context provider"
```

---

### Task 4: Citation parsing + source route mapping

**Files:**
- Create: `src/lib/citations.jsx`
- Test: `src/test/citations.test.jsx`

**Interfaces:**
- Produces:
  - `sectionRoute(type)` → the SPA route for a content type (e.g. `faq`→`/rights` is wrong generically; map by type: `source`→`/sources`, `treatment_step`→`/treatment`, `tool`→`/self-help`, default→`/`). Returns a string.
  - `renderWithCitations(text, sources, onCite)` → array of React nodes where each `[[n]]` becomes a clickable `<sup>` calling `onCite(source)` for the matching `n`. Unmatched `n` is dropped.
  - Consumed by `ChatPanel` (Task 6) and `SourceDrawer` (Task 5).

- [ ] **Step 1: Write `src/test/citations.test.jsx`**

```jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderWithCitations, sectionRoute } from "@/lib/citations";

describe("citations", () => {
  it("maps types to section routes", () => {
    expect(sectionRoute("source")).toBe("/sources");
    expect(sectionRoute("treatment_step")).toBe("/treatment");
    expect(sectionRoute("unknown")).toBe("/");
  });

  it("renders [[n]] as clickable superscripts and drops unmatched", () => {
    const onCite = vi.fn();
    const sources = [{ n: 1, itemId: "1", type: "faq", title: "T1" }];
    const nodes = renderWithCitations("A fact.[[1]] Another.[[2]]", sources, onCite);
    render(<p>{nodes}</p>);
    const sup = screen.getByText("1");
    expect(sup.tagName.toLowerCase()).toBe("sup");
    sup.click();
    expect(onCite).toHaveBeenCalledWith(sources[0]);
    expect(screen.queryByText("2")).toBeNull(); // unmatched dropped
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd src && npm test -- citations`
Expected: FAIL.

- [ ] **Step 3: Create `src/lib/citations.jsx`**

```jsx
import React from "react";

const ROUTES = {
  source: "/sources",
  treatment_step: "/treatment",
  tool: "/self-help",
  faq: "/rights",
  book: "/children",
  activity: "/calming",
};

export function sectionRoute(type) {
  return ROUTES[type] ?? "/";
}

export function renderWithCitations(text, sources, onCite) {
  const byN = new Map(sources.map((s) => [s.n, s]));
  const parts = String(text).split(/(\[\[\d+\]\])/g);
  return parts.map((part, i) => {
    const m = /^\[\[(\d+)\]\]$/.exec(part);
    if (!m) return part;
    const src = byN.get(Number(m[1]));
    if (!src) return null; // drop unmatched citation
    return (
      <sup
        key={i}
        role="button"
        tabIndex={0}
        className="cursor-pointer text-primary font-semibold px-0.5"
        onClick={() => onCite(src)}
        onKeyDown={(e) => e.key === "Enter" && onCite(src)}
      >
        {m[1]}
      </sup>
    );
  });
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd src && npm test -- citations`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/citations.jsx src/test/citations.test.jsx
git commit -m "feat(web): citation superscripts + source route mapping"
```

---

### Task 5: SourceDrawer

**Files:**
- Create: `src/components/chat/SourceDrawer.jsx`
- Test: `src/test/SourceDrawer.test.jsx`

**Interfaces:**
- Consumes: `sectionRoute` (Task 4), `useLang`, `t`, react-router `Link`.
- Produces: `SourceDrawer({ source, onClose })` - a side panel showing `source.title`, its `type`, and a `Link` to `sectionRoute(source.type)` labelled from i18n (`chat_view_in_site`). Renders nothing when `source` is null.

- [ ] **Step 1: Write `src/test/SourceDrawer.test.jsx`**

```jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SourceDrawer from "@/components/chat/SourceDrawer";

vi.mock("@/lib/LanguageContext", () => ({ useLang: () => ({ lang: "en" }) }));
vi.mock("@/lib/i18n", () => ({ t: (_l, k) => k }));

describe("SourceDrawer", () => {
  it("renders the source and a link to its section", () => {
    render(
      <MemoryRouter>
        <SourceDrawer source={{ n: 1, itemId: "1", type: "source", title: "DSM-5" }} onClose={() => {}} />
      </MemoryRouter>,
    );
    expect(screen.getByText("DSM-5")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/sources");
  });

  it("renders nothing when source is null", () => {
    const { container } = render(<MemoryRouter><SourceDrawer source={null} onClose={() => {}} /></MemoryRouter>);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd src && npm test -- SourceDrawer`
Expected: FAIL.

- [ ] **Step 3: Create `src/components/chat/SourceDrawer.jsx`**

```jsx
import React from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { useLang } from "@/lib/LanguageContext";
import { t } from "@/lib/i18n";
import { sectionRoute } from "@/lib/citations";

export default function SourceDrawer({ source, onClose }) {
  const { lang } = useLang();
  if (!source) return null;
  return (
    <div className="absolute inset-0 z-10 bg-background flex flex-col p-4">
      <button onClick={onClose} aria-label={t(lang, "chat_close")} className="self-end p-1">
        <X className="w-5 h-5" />
      </button>
      <h3 className="font-heading text-lg font-bold mb-2">{source.title}</h3>
      <p className="text-sm opacity-70 mb-4">{source.type}</p>
      <Link to={sectionRoute(source.type)} onClick={onClose} className="text-primary font-semibold underline">
        {t(lang, "chat_view_in_site")}
      </Link>
    </div>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd src && npm test -- SourceDrawer`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/chat/SourceDrawer.jsx src/test/SourceDrawer.test.jsx
git commit -m "feat(web): source drawer for citation clicks"
```

---

### Task 6: ChatPanel

**Files:**
- Create: `src/components/chat/ChatPanel.jsx`
- Test: `src/test/ChatPanel.test.jsx`

**Interfaces:**
- Consumes: `useChat` (Task 3), `renderWithCitations` (Task 4), `SourceDrawer` (Task 5), `useLang`, `t`.
- Produces: `ChatPanel()` - renders when `open`. Message list (assistant messages rendered with citations), input bound to `send`, starter suggestions from i18n `chat_starters` (array) shown when `messages` is empty, a pinned ERAN banner when `crisisLang` is set (using `eran_link` + `eran_phone`), a tiny disclaimer (`chat_disclaimer`), and a local `activeSource` state that opens `SourceDrawer`.

- [ ] **Step 1: Write `src/test/ChatPanel.test.jsx`**

```jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ChatPanel from "@/components/chat/ChatPanel";

vi.mock("@/lib/LanguageContext", () => ({ useLang: () => ({ lang: "en" }) }));
vi.mock("@/lib/i18n", () => ({
  t: (_l, k) => {
    if (k === "chat_starters") return ["What are my rights?"];
    if (k === "eran_phone") return "1201";
    return k;
  },
}));

const chatValue = {
  open: true, setOpen: () => {}, messages: [], sources: [], crisisLang: "en",
  sending: false, send: vi.fn(), clear: vi.fn(),
};
vi.mock("@/lib/ChatContext", () => ({ useChat: () => chatValue }));

describe("ChatPanel", () => {
  it("shows crisis banner (ERAN 1201), starters, and disclaimer when open", () => {
    render(<MemoryRouter><ChatPanel /></MemoryRouter>);
    expect(screen.getByText("eran_link")).toBeInTheDocument();
    expect(screen.getByText(/1201/)).toBeInTheDocument();
    expect(screen.getByText("What are my rights?")).toBeInTheDocument();
    expect(screen.getByText("chat_disclaimer")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd src && npm test -- ChatPanel`
Expected: FAIL.

- [ ] **Step 3: Create `src/components/chat/ChatPanel.jsx`**

```jsx
import React, { useState } from "react";
import { X, Send } from "lucide-react";
import { useLang } from "@/lib/LanguageContext";
import { t } from "@/lib/i18n";
import { useChat } from "@/lib/ChatContext";
import { renderWithCitations } from "@/lib/citations";
import SourceDrawer from "./SourceDrawer";

export default function ChatPanel() {
  const { lang } = useLang();
  const { open, setOpen, messages, sources, crisisLang, sending, send } = useChat();
  const [draft, setDraft] = useState("");
  const [activeSource, setActiveSource] = useState(null);
  if (!open) return null;

  const submit = (e) => { e.preventDefault(); send(draft); setDraft(""); };
  const starters = t(lang, "chat_starters") || [];

  return (
    <div className="fixed bottom-24 left-6 z-50 w-[360px] max-w-[90vw] h-[520px] bg-background border border-border rounded-2xl shadow-xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <span className="font-heading font-bold">{t(lang, "chat_title")}</span>
        <button onClick={() => setOpen(false)} aria-label={t(lang, "chat_close")}><X className="w-5 h-5" /></button>
      </div>

      {crisisLang && (
        <div className="bg-destructive/10 text-sm p-3 border-b border-border">
          {t(crisisLang, "eran_link")} - <span className="font-bold">{t(crisisLang, "eran_phone")}</span>
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
              {m.role === "assistant" ? renderWithCitations(m.content, sources, setActiveSource) : m.content}
            </span>
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd src && npm test -- ChatPanel`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/chat/ChatPanel.jsx src/test/ChatPanel.test.jsx
git commit -m "feat(web): chat panel with streaming, citations, crisis banner"
```

---

### Task 7: Wire ChatbotFAB to toggle the panel + render ChatPanel

**Files:**
- Modify: `src/components/ChatbotFAB.jsx`
- Test: `src/test/ChatbotFAB.test.jsx`

**Interfaces:**
- Consumes: `useChat` (Task 3), `ChatPanel` (Task 6).
- Produces: FAB button toggles `open`; renders `<ChatPanel/>` alongside.

- [ ] **Step 1: Write `src/test/ChatbotFAB.test.jsx`**

```jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ChatbotFAB from "@/components/ChatbotFAB";

vi.mock("@/lib/LanguageContext", () => ({ useLang: () => ({ lang: "en" }) }));
vi.mock("@/lib/i18n", () => ({ t: (_l, k) => k }));
const state = { open: false, setOpen: vi.fn((v) => (state.open = v)) };
vi.mock("@/lib/ChatContext", () => ({ useChat: () => state }));
vi.mock("@/components/chat/ChatPanel", () => ({ default: () => <div>panel</div> }));

describe("ChatbotFAB", () => {
  it("toggles the panel open on click", () => {
    render(<MemoryRouter><ChatbotFAB /></MemoryRouter>);
    screen.getByRole("button", { name: "chat_tooltip" }).click();
    expect(state.setOpen).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd src && npm test -- ChatbotFAB`
Expected: FAIL.

- [ ] **Step 3: Replace `src/components/ChatbotFAB.jsx`**

```jsx
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd src && npm test -- ChatbotFAB`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ChatbotFAB.jsx src/test/ChatbotFAB.test.jsx
git commit -m "feat(web): wire FAB to chat panel"
```

---

### Task 8: Home hero input box (replace `hero_subtitle`)

**Files:**
- Create: `src/components/chat/HeroChatInput.jsx`
- Modify: `src/pages/Home.jsx` (replace the `<p>{t(lang,'hero_subtitle')}</p>` inside the `home.hero.subtitle` `ValidatableContent`)
- Test: `src/test/HeroChatInput.test.jsx`

**Interfaces:**
- Consumes: `useChat` (Task 3), `useLang`, `t`.
- Produces: `HeroChatInput()` - a prominent input; on submit calls `send(text)` and `setOpen(true)`.

- [ ] **Step 1: Write `src/test/HeroChatInput.test.jsx`**

```jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HeroChatInput from "@/components/chat/HeroChatInput";

vi.mock("@/lib/LanguageContext", () => ({ useLang: () => ({ lang: "he" }) }));
vi.mock("@/lib/i18n", () => ({ t: (_l, k) => k }));
const chat = { send: vi.fn(), setOpen: vi.fn() };
vi.mock("@/lib/ChatContext", () => ({ useChat: () => chat }));

describe("HeroChatInput", () => {
  it("sends the message and opens the panel on submit", () => {
    render(<HeroChatInput />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "מה זה?" } });
    fireEvent.submit(screen.getByRole("textbox").closest("form"));
    expect(chat.send).toHaveBeenCalledWith("מה זה?");
    expect(chat.setOpen).toHaveBeenCalledWith(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd src && npm test -- HeroChatInput`
Expected: FAIL.

- [ ] **Step 3: Create `src/components/chat/HeroChatInput.jsx`**

```jsx
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
```

- [ ] **Step 4: Replace the subtitle in `src/pages/Home.jsx`**

Replace the inner `<p>` of the `ValidatableContent` with `contentId="home.hero.subtitle"` (currently `<p ...>{t(lang, 'hero_subtitle')}</p>` at ~line 85) with `<HeroChatInput />`, keeping the surrounding `ValidatableContent`. Add `import HeroChatInput from "@/components/chat/HeroChatInput";` at the top.

```jsx
<ValidatableContent contentId="home.hero.subtitle" label="כותרת משנה - הום">
  <HeroChatInput />
</ValidatableContent>
```

- [ ] **Step 5: Run to verify it passes + build**

Run: `cd src && npm test -- HeroChatInput && npm run build`
Expected: test PASS; build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/chat/HeroChatInput.jsx src/pages/Home.jsx src/test/HeroChatInput.test.jsx
git commit -m "feat(web): home hero chat input replaces subtitle"
```

---

### Task 9: Mount ChatProvider, add i18n strings, add env var

**Files:**
- Modify: `src/App.jsx` (wrap the tree in `ChatProvider`)
- Modify: `src/lib/i18n.js` (add chat keys to all 5 languages)
- Create: `src/.env.example` (document `VITE_CHATBOT_URL`)
- Test: `src/test/i18n-chat.test.jsx`

**Interfaces:**
- Produces: `ChatProvider` mounted above the router so the conversation survives route changes; new i18n keys `chat_title`, `chat_close`, `chat_send`, `chat_placeholder`, `chat_disclaimer`, `chat_view_in_site`, `hero_chat_placeholder`, and `chat_starters` (array) per language.

- [ ] **Step 1: Write `src/test/i18n-chat.test.jsx`**

```jsx
import { describe, it, expect } from "vitest";
import { t } from "@/lib/i18n";

describe("chat i18n", () => {
  it("has chat strings in all supported languages", () => {
    for (const lang of ["he", "ar", "en", "ru", "fr"]) {
      expect(typeof t(lang, "chat_title")).toBe("string");
      expect(typeof t(lang, "chat_disclaimer")).toBe("string");
      expect(Array.isArray(t(lang, "chat_starters"))).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd src && npm test -- i18n-chat`
Expected: FAIL.

- [ ] **Step 3: Add chat keys to each language block in `src/lib/i18n.js`**

For each of the five language objects (`he`, `ar`, `en`, `ru`, `fr`), add these keys (Hebrew shown; translate the rest appropriately):

```javascript
    chat_title: 'שיחה',
    chat_close: 'סגירה',
    chat_send: 'שליחה',
    chat_placeholder: 'כתבו כאן...',
    hero_chat_placeholder: 'שאלו אותי כל דבר...',
    chat_disclaimer: 'המידע כללי ואינו ייעוץ רפואי.',
    chat_view_in_site: 'למקור באתר',
    chat_starters: ['מהן הזכויות שלי?', 'מה זה פלאשבק?', 'איך אפשר להירגע עכשיו?'],
```

- [ ] **Step 4: Wrap the app in `ChatProvider` in `src/App.jsx`**

Add `import { ChatProvider } from "@/lib/ChatContext";` and wrap the existing `<Router>` (or the top provider tree) so `ChatProvider` is above `<Routes>` - the conversation then persists across route changes. Example:

```jsx
<ChatProvider>
  <Router basename={BASE_PATH}>
    {/* existing routes */}
  </Router>
</ChatProvider>
```

- [ ] **Step 5: Create `src/.env.example`**

```
VITE_API_URL=https://ptsd-il-api.onrender.com/api
VITE_CHATBOT_URL=https://ptsd-chatbot-worker.<subdomain>.workers.dev
```

- [ ] **Step 6: Run tests + build**

Run: `cd src && npm test && npm run build`
Expected: all PASS; build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/App.jsx src/lib/i18n.js src/.env.example src/test/i18n-chat.test.jsx
git commit -m "feat(web): mount ChatProvider, add chat i18n + env var"
```

---

## Self-Review

**Spec coverage:**
- §8 citations (superscript `[[n]]`, drawer, no bottom list) → Tasks 4,5,6.
- §9 languages (answer in user lang; RTL) → i18n Task 9; `lang` threaded via `useLang` throughout.
- §10 crisis banner (ERAN 1201 from i18n) + disclaimer → Task 6.
- §13 UI (in-memory context, FAB, home input, streaming, starters, tiny disclaimer) → Tasks 3,6,7,8.
- §14 `/chat` SSE contract → Task 2 client matches Worker frames.
- Store-nothing (§12): conversation lives only in React state; no storage APIs used.

**Placeholder scan:** No TODO/TBD steps; each code step is complete and self-consistent (Task 6's i18n mock returns `"1201"` for `eran_phone`, matching its assertion).

**Type/name consistency:** `useChat()` shape (`open,setOpen,messages,sources,crisisLang,sending,send,clear`) is defined in Task 3 and consumed identically in Tasks 6,7,8. `streamChat` handler names (`onCrisis,onToken,onSources,onError,onDone`) match between Task 2 and Task 3. `renderWithCitations(text, sources, onCite)` and `sectionRoute(type)` signatures match between Task 4, 5, and 6. `source` object shape (`{n,itemId,type,title,...}`) matches the Worker's `sources` frame.

**Dependency on Plan 1:** requires the deployed Worker URL in `VITE_CHATBOT_URL` and the `/chat` SSE contract. Buildable/testable independently (client is unit-tested against a mocked stream); live end-to-end needs the Worker from Plan 1.
