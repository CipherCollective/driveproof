import { createDemoAttestation } from "@driveproof/fixtures";
import type {
  DemoFixture,
  DriveProofClient,
  DriveProofClientMode,
  ProofResult,
  TripAttestation
} from "@driveproof/types";

/**
 * Product-development adapter. This intentionally performs no cryptography,
 * signing, wallet access, or blockchain calls.
 */
export class MockDriveProofClient implements DriveProofClient {
  readonly mode = "mock" as const;
  readonly displayName = "MOCK ONLY · NO MIDNIGHT CALL";

  private sequence = 0;
  private readonly usedAttestations = new Set<string>();
  private readonly statuses = new Map<string, ProofResult>();

  async issueDemoTrip(fixture: DemoFixture): Promise<TripAttestation> {
    this.sequence += 1;
    return createDemoAttestation(fixture, this.sequence);
  }

  async proveCompliance(attestation: TripAttestation, policyId: string): Promise<ProofResult> {
    const replayKey = `${attestation.attestationId}:${policyId}`;
    if (this.usedAttestations.has(replayKey)) {
      return { status: "rejected", reason: "replay" };
    }

    let result: ProofResult;
    if (attestation.fixture === "safe") {
      result = {
        status: "verified",
        transactionId: `mock_tx_${attestation.attestationId}`,
        nullifier: `mock_nullifier_${attestation.attestationId}`
      };
    } else if (attestation.fixture === "unsafe") {
      result = { status: "rejected", reason: "policy" };
    } else {
      // The UI deliberately presents this as a generic prover rejection.
      result = { status: "rejected", reason: "unknown" };
    }

    if (result.status === "verified") {
      this.usedAttestations.add(replayKey);
      this.statuses.set(result.transactionId, result);
    }
    return result;
  }

  async getProofStatus(transactionId: string): Promise<ProofResult> {
    return this.statuses.get(transactionId) ?? { status: "rejected", reason: "unknown" };
  }
}

/**
 * Stable provider boundary for the eventual generated Midnight client.
 * `midnight` is intentionally unavailable until the teammate supplies the
 * generated API and Preprod deployment metadata.
 */
export function createDriveProofClient(mode: DriveProofClientMode = "mock"): DriveProofClient {
  if (mode === "midnight") {
    throw new Error(
      "MidnightDriveProofClient is not wired yet. Add the generated contract client and Preprod metadata first."
    );
  }
  return new MockDriveProofClient();
}
