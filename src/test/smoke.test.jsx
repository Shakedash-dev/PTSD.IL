import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

describe("test tooling", () => {
  it("renders JSX", () => {
    render(<div>hello chat</div>);
    expect(screen.getByText("hello chat")).toBeInTheDocument();
  });
});
