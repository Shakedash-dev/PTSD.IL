import { describe, it, expect, vi } from "vitest";
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

  it("renders nothing when closed", () => {
    chatValue.open = false;
    const { container } = render(<MemoryRouter><ChatPanel /></MemoryRouter>);
    expect(container).toBeEmptyDOMElement();
    chatValue.open = true;
  });

  it("calls send with the draft on submit", () => {
    chatValue.send.mockClear();
    render(<MemoryRouter><ChatPanel /></MemoryRouter>);
    const input = screen.getByPlaceholderText("chat_placeholder");
    fireEvent.change(input, { target: { value: "hello" } });
    fireEvent.click(screen.getByLabelText("chat_send"));
    expect(chatValue.send).toHaveBeenCalledWith("hello");
  });
});
