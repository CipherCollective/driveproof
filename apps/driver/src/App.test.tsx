import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MockDriveProofClient } from "@driveproof/driveproof-client";
import type { ProofResult } from "@driveproof/types";
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
    fireEvent.click(screen.getByRole("button", { name: "GENERATE DRIVEPROOF" }));

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
    fireEvent.click(screen.getByRole("button", { name: "GENERATE DRIVEPROOF" }));
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
    fireEvent.click(screen.getByRole("button", { name: "GENERATE DRIVEPROOF" }));
    await waitFor(() => expect(proveCompliance).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("DRIVEPROOF VERIFIED IN MOCK MODE")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "RESUBMIT SAME ATTESTATION" }));
    expect(await screen.findByText("REPLAY REJECTED")).toBeInTheDocument();
  });
});
