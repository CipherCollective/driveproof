import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LandingPage } from "./LandingPage";

describe("LandingPage", () => {
  it("explains the product and exposes the core navigation", () => {
    render(<LandingPage />);

    expect(screen.getByRole("heading", { name: /Prove you drove safely/i })).toBeInTheDocument();
    expect(screen.getByText("PRODUCT PREVIEW · MOCK MODE")).toBeInTheDocument();
    const launchLinks = screen.getAllByRole("link", { name: /Launch Driver/i });
    expect(launchLinks).toHaveLength(2);
    launchLinks.forEach((link) => expect(link).toHaveAttribute("href", "/driver"));
    expect(screen.getByRole("link", { name: "How it works" })).toHaveAttribute("href", "#how-it-works");
    expect(screen.getByRole("heading", { name: "Keep the trip. Share the proof." })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "The public result is intentionally smaller than the data used to produce it." })).not.toBeInTheDocument();
  });

  it("keeps the trust model honest", () => {
    render(<LandingPage />);

    expect(screen.getByText("Vehicle Attestor Simulator")).toBeInTheDocument();
    expect(screen.getByText(/Physical sensor provenance is outside the current claim/i)).toBeInTheDocument();
    expect(screen.getByText("MIDNIGHT · PREPROD TARGET")).toBeInTheDocument();
  });
});
