/**
 * A confirmed deployment is the source of truth for the user-facing stage.
 * Runtime instrumentation may report an intermediate indexer stage after the
 * transaction has already been returned; it must not make the UI look stale.
 */
export function deploymentStageLabel(
  confirmed: boolean,
  failureStage: string | undefined,
  currentStage: string
): string {
  if (failureStage) return `FAILED AT: ${failureStage}`;
  if (confirmed) return "CONFIRMED ON PREPROD";
  return currentStage;
}

/**
 * Presentation-only switch for the DEV transaction harness. It changes
 * typography/visibility affordances, never the runtime or transaction path.
 */
export function isRecordingMode(search: string): boolean {
  const value = new URLSearchParams(search).get("recording");
  return value === "1" || value === "true";
}

export type ResettableDemoUiState<
  TAttestation,
  TProof,
  TDeploymentFailure,
  TExpectedRejection,
  TWalletDiagnostics
> = {
  attestation: TAttestation | undefined;
  proof: TProof | undefined;
  complianceCount: string | undefined;
  operation: string;
  error: string | undefined;
  deploymentStage: string;
  deploymentFailure: TDeploymentFailure | undefined;
  expectedProofRejection: TExpectedRejection | undefined;
  walletDiagnostics: TWalletDiagnostics | undefined;
  walletDiagnosticsError: string | undefined;
};

/**
 * Clears only ephemeral UI state. Persistent wallet/runtime state and chain
 * evidence are deliberately outside this shape, so this helper cannot reset
 * Lace, private-state storage, a deployed contract, or ledger state.
 */
export function resetDemoUiState<
  TAttestation,
  TProof,
  TDeploymentFailure,
  TExpectedRejection,
  TWalletDiagnostics
>(
  state: ResettableDemoUiState<TAttestation, TProof, TDeploymentFailure, TExpectedRejection, TWalletDiagnostics>
): ResettableDemoUiState<TAttestation, TProof, TDeploymentFailure, TExpectedRejection, TWalletDiagnostics> {
  return {
    ...state,
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
  };
}
