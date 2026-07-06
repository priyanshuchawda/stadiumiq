import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GroundingCitations } from "@/components/ai/grounding-citations";

describe("GroundingCitations", () => {
  it("renders https source links with noopener", () => {
    render(
      <GroundingCitations
        webSearchQueries={["airport shuttle"]}
        sources={[{ title: "Transit Agency", uri: "https://example.com/transit" }]}
      />,
    );

    const link = screen.getByRole("link", { name: "Transit Agency" });
    expect(link).toHaveAttribute("href", "https://example.com/transit");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText(/Searched: airport shuttle/i)).toBeInTheDocument();
  });
});
