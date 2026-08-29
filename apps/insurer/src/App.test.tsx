import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MockDriveProofClient } from "@driveproof/driveproof-client";
import { InsurerExperience } from "./App";

describe("InsurerExperience", () => {
  it("shows a verified result without exposing private telemetry", async () => {
    render(<InsurerExperience client={new MockDriveProofClient()} initialFixtureOverride="safe" />);

    expect(await screen.findByRole("heading", { name: "VERIFIED" })).toBeInTheDocument();
    expect(screen.getByText("ROUTE")).toBeInTheDocument();
    expect(screen.queryByText("112 km/h")).not.toBeInTheDocument();
    expect(screen.queryByText("67")).not.toBeInTheDocument();
  });

  it("keeps unsafe telemetry private while showing generic rejection", async () => {
    render(<InsurerExperience client={new MockDriveProofClient()} initialFixtureOverride="unsafe" />);

    expect(await screen.findByText("No valid proof.")).toBeInTheDocument();
    expect(screen.getByText(/underlying telemetry remains private/i)).toBeInTheDocument();
    expect(screen.queryByText("112")).not.toBeInTheDocument();
  });

  it("shows replay rejection on resubmission", async () => {
    render(<InsurerExperience client={new MockDriveProofClient()} initialFixtureOverride="safe" />);

    expect(await screen.findByRole("heading", { name: "VERIFIED" })).toBeInTheDocument();
    screen.getByRole("button", { name: "RESUBMIT SAME ATTESTATION" }).click();
    expect(await screen.findByText("This proof was already used.")).toBeInTheDocument();
  });
});
