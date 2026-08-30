import { createDemoAttestation } from "@driveproof/fixtures";
import type {
  DemoFixture,
  DriveProofClient,
  DriveProofClientMode,
  ProofResult,
  TripAttestation
} from "@driveproof/types";
import { MidnightDriveProofClient } from "./midnight";

export { MidnightDriveProofClient, classifyMidnightProofRejection } from "./midnight";
export type { MidnightDriveProofClientAdapters, MidnightDriveProofClientOptions } from "./midnight";

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
    const replayKey = attestation.attestationId;
    if (this.usedAttestations.has(replayKey)) {
      return { status: "rejected", reason: "replay" };
    }

    let result: ProofResult;
    if (attestation.fixture === "safe") {
      result = {
        status: "verified",
        receipt: {
          status: "verified",
          network: "mock",
          transactionId: `mock_tx_${attestation.attestationId}`,
          complianceStatus: "satisfied",
          policyId,
          attestorId: attestation.attestorId,
          nullifier: `mock_nullifier_${attestation.attestationId}`
        }
      };
    } else if (attestation.fixture === "unsafe") {
      result = { status: "rejected", reason: "policy" };
    } else {
      // The UI deliberately presents this as a generic prover rejection.
      result = { status: "rejected", reason: "unknown" };
    }

    if (result.status === "verified") {
      this.usedAttestations.add(replayKey);
      this.statuses.set(result.receipt.transactionId, result);
    }
    return result;
  }

  async getProofStatus(transactionId: string): Promise<ProofResult> {
    return this.statuses.get(transactionId) ?? { status: "rejected", reason: "unknown" };
  }
}

export function createDriveProofClient(mode: DriveProofClientMode = "mock"): DriveProofClient {
  if (mode === "midnight") {
    return new MidnightDriveProofClient();
  }
  return new MockDriveProofClient();
}
