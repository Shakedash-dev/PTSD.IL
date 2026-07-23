import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

vi.mock("@/lib/ChatContext", () => ({ useChat: vi.fn() }));
import { useChat } from "@/lib/ChatContext";

const defaultChat = {
  open: true, setOpen: () => {}, messages: [], crisisLang: "en",
  sending: false, send: vi.fn(), clear: vi.fn(),
};

function setChat(overrides = {}) {
  useChat.mockReturnValue({ ...defaultChat, ...overrides });
}

beforeEach(() => {
  setChat();
});

describe("ChatPanel", () => {
  it("shows crisis banner (ERAN 1201), starters, and disclaimer when open", () => {
    render(<MemoryRouter><ChatPanel /></MemoryRouter>);
    expect(screen.getByText("eran_link")).toBeInTheDocument();
    expect(screen.getByText(/1201/)).toBeInTheDocument();
    expect(screen.getByText("What are my rights?")).toBeInTheDocument();
    expect(screen.getByText("chat_disclaimer")).toBeInTheDocument();
  });

  it("crisis banner has role=alert and the phone number is a tappable tel: link", () => {
    render(<MemoryRouter><ChatPanel /></MemoryRouter>);
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    const phoneLink = screen.getByText(/1201/).closest("a");
    expect(phoneLink).toHaveAttribute("href", "tel:1201");
  });

  it("open panel container has role=dialog", () => {
    render(<MemoryRouter><ChatPanel /></MemoryRouter>);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("pressing Escape on the dialog closes the panel", () => {
    const setOpen = vi.fn();
    setChat({ setOpen });
    render(<MemoryRouter><ChatPanel /></MemoryRouter>);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  it("renders nothing when closed", () => {
    setChat({ open: false });
    const { container } = render(<MemoryRouter><ChatPanel /></MemoryRouter>);
    expect(container).toBeEmptyDOMElement();
  });

  it("calls send with the draft on submit", () => {
    const send = vi.fn();
    setChat({ send });
    render(<MemoryRouter><ChatPanel /></MemoryRouter>);
    const input = screen.getByPlaceholderText("chat_placeholder");
    fireEvent.change(input, { target: { value: "hello" } });
    fireEvent.click(screen.getByLabelText("chat_send"));
    expect(send).toHaveBeenCalledWith("hello");
  });

  it("renders assistant content as Markdown (bold text becomes <strong>)", () => {
    setChat({
      messages: [{ role: "assistant", content: "This is **bold** text.", sources: [] }],
      crisisLang: null,
    });
    render(<MemoryRouter><ChatPanel /></MemoryRouter>);
    const strong = screen.getByText("bold");
    expect(strong.tagName.toLowerCase()).toBe("strong");
  });

  it("strips [[n]] citation markers from the visible text", () => {
    setChat({
      messages: [{
        role: "assistant",
        content: "A fact.[[1]]",
        sources: [
          { n: 1, itemId: "x", groupId: "gx", type: "source", langId: "en", title: "The Source", text: "Cited passage." },
        ],
      }],
      crisisLang: null,
    });
    render(<MemoryRouter><ChatPanel /></MemoryRouter>);
    expect(screen.getByText("A fact.")).toBeInTheDocument();
    expect(screen.queryByText(/\[\[\d+\]\]/)).toBeNull();
  });

  it("renders a reference chip for a cited source that links directly to sectionRoute(type)", () => {
    setChat({
      messages: [{
        role: "assistant",
        content: "A fact.[[1]]",
        sources: [
          { n: 1, itemId: "x", groupId: "gx", type: "source", langId: "en", title: "The Source", text: "Cited passage." },
        ],
      }],
      crisisLang: null,
    });
    render(<MemoryRouter><ChatPanel /></MemoryRouter>);
    const chip = screen.getByText("The Source").closest("a");
    expect(chip).toHaveAttribute("href", "/sources");
  });

  it("does not render a chip for a source that was not cited in the text", () => {
    setChat({
      messages: [{
        role: "assistant",
        content: "A fact.[[1]]",
        sources: [
          { n: 1, itemId: "x", groupId: "gx", type: "source", langId: "en", title: "The Source", text: "Cited passage." },
          { n: 2, itemId: "y", groupId: "gy", type: "tool", langId: "en", title: "Uncited Source", text: "Other text." },
        ],
      }],
      crisisLang: null,
    });
    render(<MemoryRouter><ChatPanel /></MemoryRouter>);
    expect(screen.getByText("The Source")).toBeInTheDocument();
    expect(screen.queryByText("Uncited Source")).toBeNull();
  });

  it("dedupes reference chips by itemId, keeping one pill per unique cited item", () => {
    setChat({
      messages: [{
        role: "assistant",
        content: "A fact.[[1]][[2]]",
        sources: [
          { n: 1, itemId: "x", groupId: "gx", type: "source", langId: "en", title: "The Source", text: "Chunk one." },
          { n: 1, itemId: "x", groupId: "gx", type: "source", langId: "en", title: "The Source", text: "Chunk two." },
          { n: 2, itemId: "y", groupId: "gy", type: "tool", langId: "en", title: "Other Source", text: "Other text." },
        ],
      }],
      crisisLang: null,
    });
    render(<MemoryRouter><ChatPanel /></MemoryRouter>);
    expect(screen.getAllByText("The Source")).toHaveLength(1);
    expect(screen.getByText("Other Source")).toBeInTheDocument();
  });

  it("dedupes reference chips by route+title, even when itemIds differ (same destination, same label)", () => {
    setChat({
      messages: [{
        role: "assistant",
        content: "A fact.[[1]][[2]]",
        sources: [
          { n: 1, itemId: "guideline-a", groupId: "ga", type: "faq", categorySlug: "rights", langId: "en", title: "הנחיות", text: "Chunk one." },
          { n: 2, itemId: "guideline-b", groupId: "gb", type: "faq", categorySlug: "rights", langId: "en", title: "הנחיות", text: "Chunk two." },
        ],
      }],
      crisisLang: null,
    });
    render(<MemoryRouter><ChatPanel /></MemoryRouter>);
    expect(screen.getAllByText("הנחיות")).toHaveLength(1);
  });

  it("links a cited faq source with categorySlug ptsd-info to /ptsd-info", () => {
    setChat({
      messages: [{
        role: "assistant",
        content: "A fact.[[1]]",
        sources: [
          { n: 1, itemId: "x", groupId: "gx", type: "faq", categorySlug: "ptsd-info", langId: "en", title: "About PTSD", text: "Cited passage." },
        ],
      }],
      crisisLang: null,
    });
    render(<MemoryRouter><ChatPanel /></MemoryRouter>);
    const chip = screen.getByText("About PTSD").closest("a");
    expect(chip).toHaveAttribute("href", "/ptsd-info");
  });

  it("shows no chips when no sources were cited", () => {
    setChat({
      messages: [{
        role: "assistant",
        content: "A fact with no citations.",
        sources: [
          { n: 1, itemId: "x", groupId: "gx", type: "source", langId: "en", title: "The Source", text: "Chunk one." },
        ],
      }],
      crisisLang: null,
    });
    render(<MemoryRouter><ChatPanel /></MemoryRouter>);
    expect(screen.queryByText("The Source")).toBeNull();
  });

  it("shows the thinking indicator while sending and the trailing assistant message is empty", () => {
    setChat({
      sending: true,
      messages: [
        { role: "user", content: "Hi" },
        { role: "assistant", content: "", sources: [] },
      ],
      crisisLang: null,
    });
    render(<MemoryRouter><ChatPanel /></MemoryRouter>);
    expect(screen.getByText("chat_thinking")).toBeInTheDocument();
  });

  it("does not show the thinking indicator once the assistant reply has content", () => {
    setChat({
      sending: true,
      messages: [
        { role: "user", content: "Hi" },
        { role: "assistant", content: "Partial answer", sources: [] },
      ],
      crisisLang: null,
    });
    render(<MemoryRouter><ChatPanel /></MemoryRouter>);
    expect(screen.queryByText("chat_thinking")).toBeNull();
  });
});
