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

  it("clears the field after submit", () => {
    render(<HeroChatInput />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "hello" } });
    fireEvent.submit(input.closest("form"));
    expect(input.value).toBe("");
  });

  it("does not send on empty/whitespace submit", () => {
    chat.send.mockClear();
    chat.setOpen.mockClear();
    render(<HeroChatInput />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.submit(input.closest("form"));
    expect(chat.send).not.toHaveBeenCalled();
    expect(chat.setOpen).not.toHaveBeenCalled();
  });

  it("sends and clears on Enter, but Shift+Enter only inserts a newline", () => {
    chat.send.mockClear();
    chat.setOpen.mockClear();
    render(<HeroChatInput />);
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "line one" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
    expect(chat.send).not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: "Enter" });
    expect(chat.send).toHaveBeenCalledWith("line one");
    expect(chat.setOpen).toHaveBeenCalledWith(true);
    expect(input.value).toBe("");
  });
});
