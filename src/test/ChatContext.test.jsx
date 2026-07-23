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
  const { messages, send, crisisLang, clear } = useChat();
  const last = messages[messages.length - 1];
  const assistants = messages.filter((m) => m.role === "assistant");
  const firstAssistant = assistants[0];
  const lastAssistant = assistants[assistants.length - 1];
  return (
    <div>
      <button onClick={() => send("hi")}>go</button>
      <button onClick={clear}>clear</button>
      <div data-testid="msgs">{messages.map((m) => `${m.role}:${m.content}`).join("|")}</div>
      <div data-testid="src">{last?.sources?.length ?? 0}</div>
      <div data-testid="first-asst-src">{JSON.stringify(firstAssistant?.sources ?? [])}</div>
      <div data-testid="last-asst-src">{JSON.stringify(lastAssistant?.sources ?? [])}</div>
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

  it("keeps turn-1 sources on the turn-1 assistant message after a second turn streams its own sources", async () => {
    vi.mocked(streamChat).mockImplementationOnce(async (_req, h) => {
      h.onToken("turn1");
      h.onSources([{ n: 1, itemId: "a", type: "faq", title: "Turn1Source" }]);
      h.onDone();
    });
    vi.mocked(streamChat).mockImplementationOnce(async (_req, h) => {
      h.onToken("turn2");
      h.onSources([{ n: 1, itemId: "b", type: "faq", title: "Turn2Source" }]);
      h.onDone();
    });
    render(<ChatProvider><Probe /></ChatProvider>);
    await act(async () => { screen.getByText("go").click(); });
    await act(async () => { screen.getByText("go").click(); });
    expect(screen.getByTestId("msgs").textContent).toBe("user:hi|assistant:turn1|user:hi|assistant:turn2");
    expect(JSON.parse(screen.getByTestId("first-asst-src").textContent)).toEqual([
      { n: 1, itemId: "a", type: "faq", title: "Turn1Source" },
    ]);
    expect(JSON.parse(screen.getByTestId("last-asst-src").textContent)).toEqual([
      { n: 1, itemId: "b", type: "faq", title: "Turn2Source" },
    ]);
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
