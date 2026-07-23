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

  it("calls onCite with the specific matching source, not just any source", () => {
    const onCite = vi.fn();
    const sources = [
      { n: 1, itemId: "a", type: "source", title: "First" },
      { n: 2, itemId: "b", type: "tool", title: "Second" },
    ];
    const nodes = renderWithCitations("One.[[1]] Two.[[2]]", sources, onCite);
    render(<p>{nodes}</p>);

    screen.getByText("2").click();
    expect(onCite).toHaveBeenCalledWith(sources[1]);
    expect(onCite).not.toHaveBeenCalledWith(sources[0]);

    screen.getByText("1").click();
    expect(onCite).toHaveBeenCalledWith(sources[0]);
  });

  it("preserves surrounding plain text and renders multiple markers", () => {
    const onCite = vi.fn();
    const sources = [
      { n: 1, itemId: "a", type: "source", title: "First" },
      { n: 2, itemId: "b", type: "tool", title: "Second" },
    ];
    const nodes = renderWithCitations("Before text.[[1]] Middle text.[[2]] After text.", sources, onCite);
    render(<p>{nodes}</p>);

    expect(screen.getByText(/Before text\./)).toBeTruthy();
    expect(screen.getByText(/Middle text\./)).toBeTruthy();
    expect(screen.getByText(/After text\./)).toBeTruthy();
    expect(screen.getByText("1").tagName.toLowerCase()).toBe("sup");
    expect(screen.getByText("2").tagName.toLowerCase()).toBe("sup");
  });

  it("drops an unmatched citation without crashing when no sources exist at all", () => {
    const onCite = vi.fn();
    expect(() => renderWithCitations("No sources here.[[5]]", [], onCite)).not.toThrow();
    const nodes = renderWithCitations("No sources here.[[5]]", [], onCite);
    render(<p>{nodes}</p>);
    expect(screen.queryByText("5")).toBeNull();
    expect(screen.getByText(/No sources here\./)).toBeTruthy();
  });
});
