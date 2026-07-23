import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

  it("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <SourceDrawer source={{ n: 1, itemId: "1", type: "source", title: "DSM-5" }} onClose={onClose} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onClose).toHaveBeenCalled();
  });

  it("renders nothing when source is null", () => {
    const { container } = render(<MemoryRouter><SourceDrawer source={null} onClose={() => {}} /></MemoryRouter>);
    expect(container).toBeEmptyDOMElement();
  });
});
