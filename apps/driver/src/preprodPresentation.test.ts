import { describe, expect, it } from "vitest";
import { deploymentStageLabel, isRecordingMode, resetDemoUiState } from "./preprodPresentation";

describe("deploymentStageLabel", () => {
  it("shows confirmed Preprod after deployment succeeds", () => {
    expect(deploymentStageLabel(true, undefined, "WAITING FOR CONTRACT")).toBe("CONFIRMED ON PREPROD");
  });

  it("preserves failure detail before a deployment is confirmed", () => {
    expect(deploymentStageLabel(false, "AWAITING LACE SUBMISSION", "AWAITING LACE SUBMISSION")).toBe(
      "FAILED AT: AWAITING LACE SUBMISSION"
    );
  });
});

describe("recording mode", () => {
  it("recognizes the explicit presentation-only query flag", () => {
    expect(isRecordingMode("?recording=1")).toBe(true);
    expect(isRecordingMode("?recording=true")).toBe(true);
    expect(isRecordingMode("?recording=0")).toBe(false);
    expect(isRecordingMode("")).toBe(false);
  });
});

describe("resetDemoUiState", () => {
  it("clears only ephemeral UI values and leaves its input unchanged", () => {
    const state = {
      attestation: { private: true },
      proof: { txId: "tx" },
      complianceCount: "1",
      operation: "proving",
      error: "old error",
      deploymentStage: "FAILED AT: AWAITING LACE SUBMISSION",
      deploymentFailure: { stage: "AWAITING LACE SUBMISSION" },
      expectedProofRejection: { kind: "policy" },
      walletDiagnostics: { connected: true },
      walletDiagnosticsError: "old diagnostics error"
    };

    const reset = resetDemoUiState(state);

    expect(reset).toEqual({
      attestation: undefined,
      proof: undefined,
      complianceCount: undefined,
      operation: "idle",
      error: undefined,
      deploymentStage: "IDLE",
      deploymentFailure: undefined,
      expectedProofRejection: undefined,
      walletDiagnostics: undefined,
      walletDiagnosticsError: undefined
    });
    expect(state).toEqual({
      attestation: { private: true },
      proof: { txId: "tx" },
      complianceCount: "1",
      operation: "proving",
      error: "old error",
      deploymentStage: "FAILED AT: AWAITING LACE SUBMISSION",
      deploymentFailure: { stage: "AWAITING LACE SUBMISSION" },
      expectedProofRejection: { kind: "policy" },
      walletDiagnostics: { connected: true },
      walletDiagnosticsError: "old diagnostics error"
    });
  });
});
