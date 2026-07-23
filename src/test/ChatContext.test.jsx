import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ChatProvider, useChat } from "@/lib/ChatContext";

vi.mock("@/lib/LanguageContext", () => ({ useLang: () => ({ lang: "he" }) }));
vi.mock("@/lib/chatClient", () => ({
  streamChat: vi.fn(async (_req, h) => { h.onToken("hel"); h.onToken("lo"); h.onSources([{ n: 1, itemId: "1", type: "faq", title: "T" }]); h.onDone(); }),
}));

const { streamChat } = await import("@/lib/chatClient");

afterEach(() => vi.restoreAllMocks());

function Probe() {
  const { messages, send, sources, crisisLang, clear } = useChat();
  return (
    <div>
      <button onClick={() => send("hi")}>go</button>
      <button onClick={clear}>clear</button>
      <div data-testid="msgs">{messages.map((m) => `${m.role}:${m.content}`).join("|")}</div>
      <div data-testid="src">{sources.length}</div>
      <div data-testid="crisis">{crisisLang ?? ""}</div>
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

  it("sets crisisLang when streamChat calls onCrisis", async () => {
    const { streamChat } = await import("@/lib/chatClient");
    vi.mocked(streamChat).mockImplementationOnce(async (_req, h) => {
      h.onCrisis("en");
      h.onToken("ok");
      h.onDone();
    });
    render(<ChatProvider><Probe /></ChatProvider>);
    await act(async () => { screen.getByText("go").click(); });
    expect(screen.getByTestId("crisis").textContent).toBe("en");
  });

  it("clear() empties messages", async () => {
    render(<ChatProvider><Probe /></ChatProvider>);
    await act(async () => { screen.getByText("go").click(); });
    expect(screen.getByTestId("msgs").textContent).not.toBe("");
    await act(async () => { screen.getByText("clear").click(); });
    expect(screen.getByTestId("msgs").textContent).toBe("");
  });

  it("useChat throws when used outside ChatProvider", () => {
    const Bare = () => { useChat(); return null; };
    expect(() => render(<Bare />)).toThrow(/useChat must be used within/i);
  });

  it("ignores a second send while one is already in flight", async () => {
    let resolveStream;
    streamChat.mockImplementation(() => new Promise((r) => { resolveStream = r; }));
    render(<ChatProvider><Probe /></ChatProvider>);
    await act(async () => {
      screen.getByText("go").click();
      screen.getByText("go").click(); // second click, same tick
    });
    expect(streamChat).toHaveBeenCalledTimes(1); // ref guard blocked the second
    await act(async () => { resolveStream(); });
  });
});
