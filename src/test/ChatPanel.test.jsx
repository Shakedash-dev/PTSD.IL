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

  it("clicking a citation opens the SourceDrawer with the matching source", () => {
    setChat({
      messages: [{ role: "assistant", content: "A fact.[[1]]", sources: [{ n: 1, itemId: "x", title: "The Source", type: "source" }] }],
      crisisLang: null,
    });
    render(<MemoryRouter><ChatPanel /></MemoryRouter>);
    fireEvent.click(screen.getByText("1"));
    expect(screen.getByText("The Source")).toBeInTheDocument();
  });
});
