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
    expect(screen.getByText("Attestor-signed commitment")).toBeInTheDocument();
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
    expect(await screen.findByText("✓ VERIFIED · MOCK PRODUCT PREVIEW")).toBeInTheDocument();

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
    expect(await screen.findByText("✓ VERIFIED · MOCK PRODUCT PREVIEW")).toBeInTheDocument();
    expect(screen.getAllByText("injected_tx_001")).toHaveLength(1);
  });

  it("maps an unexpected client failure to an error state", async () => {
    const failingClient: DriveProofClient = {
      mode: "midnight",
      displayName: "TEST FAILURE CLIENT",
      getConnectionState: () => ({ status: "disconnected" }),
      connect: async () => ({ status: "connected", network: "preprod" }),
      issueDemoTrip: async () => createDemoAttestation("safe"),
      proveCompliance: async () => { throw new Error("proof runtime unavailable"); }
    };

    render(<DriverExperience client={failingClient} stageDelayMs={0} />);

    await screen.findByText("Private Trip");
    fireEvent.click(screen.getByRole("button", { name: "CONNECT LACE" }));
    fireEvent.click((await screen.findAllByRole("button", { name: "PREPARE ATTESTED DRIVE" }))[1]);
    fireEvent.click(await screen.findByRole("button", { name: "CREATE PRIVATE PROOF" }));
    expect(screen.getByText("REAL · MIDNIGHT PREPROD")).toBeInTheDocument();
    expect(await screen.findByText("DRIVEPROOF CLIENT ERROR")).toBeInTheDocument();
    expect(screen.getByText("proof runtime unavailable")).toBeInTheDocument();
    expect(screen.queryByText("Verification confirmed")).not.toBeInTheDocument();
  });

  it("runs the real product flow through an injected client without UI-specific Midnight code", async () => {
    const connect = vi.fn(async () => ({ status: "connected" as const, network: "preprod" }));
    const issueDemoTrip = vi.fn(async () => createDemoAttestation("safe"));
    const proveCompliance = vi.fn(async () => ({
      status: "verified" as const,
      receipt: {
        status: "verified" as const,
        network: "preprod",
        transactionId: "real_injected_tx",
        blockHeight: 2318673,
        contractAddress: "real_contract",
        complianceStatus: "satisfied" as const
      }
    }));
    const realClient: DriveProofClient = {
      mode: "midnight",
      displayName: "REAL · MIDNIGHT PREPROD",
      getConnectionState: () => ({ status: "disconnected" }),
      connect,
      issueDemoTrip,
      proveCompliance
    };

    render(<DriverExperience client={realClient} stageDelayMs={0} />);

    expect((await screen.findAllByText("REAL · MIDNIGHT PREPROD")).length).toBeGreaterThanOrEqual(1);
    fireEvent.click(screen.getByRole("button", { name: "CONNECT LACE" }));
    fireEvent.click((await screen.findAllByRole("button", { name: "PREPARE ATTESTED DRIVE" }))[1]);
    fireEvent.click(await screen.findByRole("button", { name: "CREATE PRIVATE PROOF" }));

    expect(await screen.findByText("✓ VERIFIED ON MIDNIGHT PREPROD")).toBeInTheDocument();
    expect(connect).toHaveBeenCalledTimes(1);
    expect(issueDemoTrip).toHaveBeenCalledWith("safe");
    expect(proveCompliance).toHaveBeenCalledTimes(1);
  });
});
