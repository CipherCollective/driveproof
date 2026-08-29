import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MockDriveProofClient } from "@driveproof/driveproof-client";
import type { ProofResult } from "@driveproof/types";
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

  it("renders a public receipt without receiving private telemetry", async () => {
    const publicResult: ProofResult = {
      status: "verified",
      receipt: {
        status: "verified",
        network: "preprod",
        transactionId: "real_public_tx_001",
        blockHeight: 2318673,
        contractAddress: "contract_public_reference",
        complianceStatus: "satisfied",
        policyId: "AUTO-SAFE-01",
        attestorId: "1"
      }
    };

    render(
      <InsurerExperience
        publicResult={publicResult}
        mode="midnight"
        displayName="REAL · MIDNIGHT PREPROD"
      />
    );

    expect(await screen.findByRole("heading", { name: "VERIFIED" })).toBeInTheDocument();
    expect(screen.getByText("PUBLIC RECEIPT")).toBeInTheDocument();
    expect(screen.queryByText("attestorId")).not.toBeInTheDocument();
    expect(screen.getAllByText("real_public_tx_001")).toHaveLength(2);
    expect(screen.queryByText("67")).not.toBeInTheDocument();
    expect(screen.queryByText("112")).not.toBeInTheDocument();
  });
});
