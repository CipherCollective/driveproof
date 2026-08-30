import type { DriverFlowState, DriveProofClient, ProofResult } from "@driveproof/types";

export type DriverProofStepId =
  | "connect-wallet"
  | "prepare-trip"
  | "review-policy"
  | "generate-proof"
  | "approve-transaction"
  | "verified";

export type DriverProofStepState = "complete" | "current" | "upcoming" | "unavailable";

export type DriverProofStep = {
  id: DriverProofStepId;
  label: string;
  description: string;
  state: DriverProofStepState;
  note?: string;
};

export function getDriverProofSteps({
  mode,
  hasAttestation,
  flowState,
  result,
  walletConnected = true
}: {
  mode: DriveProofClient["mode"];
  hasAttestation: boolean;
  flowState: DriverFlowState;
  result?: ProofResult;
  walletConnected?: boolean;
}): DriverProofStep[] {
  const verified = result?.status === "verified";

  return [
    {
      id: "connect-wallet",
      label: "Connect wallet",
      description: "Authorize Midnight transactions through the wallet layer.",
      state: mode === "mock" ? "unavailable" : walletConnected ? "complete" : "current",
      note: mode === "mock" ? "Lace is exercised in Technical evidence." : "Connection is managed by the injected client."
    },
    {
      id: "prepare-trip",
      label: "Prepare attested trip",
      description: "Load a measurement signed by the authorized telemetry source.",
      state: hasAttestation ? "complete" : walletConnected ? "current" : "upcoming"
    },
    {
      id: "review-policy",
      label: "Review policy",
      description: "Confirm the safety conditions the proof will evaluate.",
      state: hasAttestation ? "complete" : "upcoming"
    },
    {
      id: "generate-proof",
      label: "Generate private proof",
      description: "Check the signed witness and policy without exposing the trip.",
      state: verified ? "complete" : hasAttestation ? "current" : "upcoming"
    },
    {
      id: "approve-transaction",
      label: "Approve transaction",
      description: "Authorize the resulting public compliance record when a real client is connected.",
      state: mode === "mock" ? "unavailable" : verified ? "complete" : flowState === "submitting" ? "current" : "upcoming",
      note: mode === "mock" ? "No wallet transaction is created in mock mode." : undefined
    },
    {
      id: "verified",
      label: "Verified",
      description: "Receive the public-safe compliance result.",
      state: verified ? "complete" : "upcoming"
    }
  ];
}
