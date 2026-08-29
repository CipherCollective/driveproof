import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MockDriveProofClient } from "@driveproof/driveproof-client";
import { createDemoAttestation } from "@driveproof/fixtures";
import type { DriveProofClient, ProofResult } from "@driveproof/types";
import { DriverExperience } from "./App";

describe("DriverExperience", () => {
  it("renders the safe fixture with private trip metrics", async () => {
    render(<DriverExperience client={new MockDriveProofClient()} stageDelayMs={0} />);

    expect(await screen.findByText("Private Trip")).toBeInTheDocument();
    expect(screen.getByText("67")).toBeInTheDocument();
    expect(screen.getByText("16", { selector: "dd" })).toBeInTheDocument();
    expect(screen.getByText("RAW TELEMETRY DISCLOSED")).toBeInTheDocument();
    expect(screen.getByText("issuer-signed")).toBeInTheDocument();
    expect(screen.getByText("PUBLIC PROOF METADATA")).toBeInTheDocument();
    expect(screen.getByText("NOT WIRED")).toBeInTheDocument();
    expect(screen.queryByText("only the proof crosses the boundary")).not.toBeInTheDocument();
  });

  it("renders the unsafe fixture and rejects the mock flow", async () => {
    const client = new MockDriveProofClient();
    render(<DriverExperience client={client} stageDelayMs={0} />);

    await screen.findByText("Private Trip");
    fireEvent.click(screen.getByRole("button", { name: "UNSAFE" }));
    expect(await screen.findByText("112")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "CREATE PRIVATE PROOF" }));

    expect(await screen.findByText("PROOF GENERATION REJECTED")).toBeInTheDocument();
    expect(screen.queryByText("Verification confirmed")).not.toBeInTheDocument();
  });

  it("does not render a confirmation stage while proveCompliance is pending", async () => {
    const client = new MockDriveProofClient();
    let resolveProof: ((result: ProofResult) => void) | undefined;
    const pendingProof = new Promise<ProofResult>((resolve) => { resolveProof = resolve; });
    const proveCompliance = vi.spyOn(client, "proveCompliance").mockReturnValue(pendingProof);
    render(<DriverExperience client={client} stageDelayMs={0} />);

    await screen.findByText("Private Trip");
    fireEvent.click(screen.getByRole("button", { name: "CREATE PRIVATE PROOF" }));
    await waitFor(() => expect(proveCompliance).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("Verification confirmed")).not.toBeInTheDocument();

    resolveProof?.({ status: "rejected", reason: "policy" });
    expect(await screen.findByText("PROOF GENERATION REJECTED")).toBeInTheDocument();
    expect(screen.queryByText("Verification confirmed")).not.toBeInTheDocument();
  });

  it("renders the tampered demonstration without claiming a cryptographic diagnosis", async () => {
    render(<DriverExperience client={new MockDriveProofClient()} stageDelayMs={0} />);

    await screen.findByText("Private Trip");
    fireEvent.click(screen.getByRole("button", { name: "TAMPERED" }));

    expect(await screen.findByText("DEMO TAMPERING ATTEMPT")).toBeInTheDocument();
    expect(screen.getByText(/frontend is not detecting cryptographic tampering/i)).toBeInTheDocument();
    expect(screen.getByText(/MODIFIED VALUE · 71 km\/h/i)).toBeInTheDocument();
  });

  it("drives the proof experience through the supplied client abstraction", async () => {
    const client = new MockDriveProofClient();
    const proveCompliance = vi.spyOn(client, "proveCompliance");
    render(<DriverExperience client={client} stageDelayMs={0} />);

    await screen.findByText("Private Trip");
    fireEvent.click(screen.getByRole("button", { name: "CREATE PRIVATE PROOF" }));
    await waitFor(() => expect(proveCompliance).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("DRIVEPROOF VERIFIED IN MOCK MODE")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "RESUBMIT SAME ATTESTATION" }));
    expect(await screen.findByText("REPLAY REJECTED")).toBeInTheDocument();
  });

  it("accepts another client implementation without changing the Driver component", async () => {
    const alternateClient: DriveProofClient = {
      mode: "mock",
      displayName: "INJECTED TEST CLIENT",
      issueDemoTrip: async () => createDemoAttestation("safe"),
      proveCompliance: async () => ({
        status: "verified",
        receipt: {
          status: "verified",
          network: "test",
          transactionId: "injected_tx_001",
          complianceStatus: "satisfied"
        }
      })
    };

    render(<DriverExperience client={alternateClient} stageDelayMs={0} />);

    expect(await screen.findByText("INJECTED TEST CLIENT")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "CREATE PRIVATE PROOF" }));
    expect(await screen.findByText("DRIVEPROOF VERIFIED IN MOCK MODE")).toBeInTheDocument();
    expect(screen.getByText("injected_tx_001")).toBeInTheDocument();
  });

  it("maps an unexpected client failure to an error state", async () => {
    const failingClient: DriveProofClient = {
      mode: "midnight",
      displayName: "TEST FAILURE CLIENT",
      issueDemoTrip: async () => createDemoAttestation("safe"),
      proveCompliance: async () => { throw new Error("proof runtime unavailable"); }
    };

    render(<DriverExperience client={failingClient} stageDelayMs={0} />);

    await screen.findByText("Private Trip");
    expect(screen.getByText("REAL CLIENT · PRODUCT SURFACE")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "CREATE PRIVATE PROOF" }));
    expect(await screen.findByText("DRIVEPROOF CLIENT ERROR")).toBeInTheDocument();
    expect(screen.getByText("proof runtime unavailable")).toBeInTheDocument();
    expect(screen.queryByText("Verification confirmed")).not.toBeInTheDocument();
  });
});
