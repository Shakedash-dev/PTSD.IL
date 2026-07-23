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

  it("renders ChatPanel alongside the FAB button", () => {
    render(<MemoryRouter><ChatbotFAB /></MemoryRouter>);
    expect(screen.getByText("panel")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "chat_tooltip" })).toBeInTheDocument();
  });
});
