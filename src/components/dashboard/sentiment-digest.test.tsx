import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SentimentDigest } from "@/components/dashboard/sentiment-digest";

describe("SentimentDigest", () => {
  it("renders multilingual sentiment entries with tone labels", () => {
    render(
      <SentimentDigest
        entries={[
          {
            language: "en",
            summary: "Queues are manageable.",
            tone: "positive",
          },
        ]}
      />,
    );

    expect(screen.getByText("Sentiment digest")).toBeInTheDocument();
    expect(screen.getByText("Queues are manageable.")).toBeInTheDocument();
    expect(screen.getByText("Positive")).toBeInTheDocument();
  });
});
