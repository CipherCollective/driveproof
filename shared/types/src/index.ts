export type DemoFixture = "safe" | "unsafe" | "tampered";

export type TelemetrySample = {
  gridX: number;
  gridY: number;
  speed: number;
  braking: number;
  timeBucket: number;
};

/**
 * Frontend integration boundary only. The final generated Midnight client may
 * use a different serialization and must be adapted behind DriveProofClient.
 */
export type TripAttestation = {
  attestorId: string;
  attestationId: string;
  samples: TelemetrySample[];
  signature: string;
  fixture: DemoFixture;
};

export type ProofRejectionReason = "policy" | "integrity" | "replay" | "unknown";

export type ProofResult =
  | {
      status: "verified";
      transactionId: string;
      nullifier?: string;
    }
  | {
      status: "rejected";
      reason?: ProofRejectionReason;
    };

export type DriveProofClientMode = "mock" | "midnight";

export interface DriveProofClient {
  readonly mode: DriveProofClientMode;
  readonly displayName: string;

  issueDemoTrip(fixture: DemoFixture): Promise<TripAttestation>;

  proveCompliance(attestation: TripAttestation, policyId: string): Promise<ProofResult>;

  getProofStatus?(transactionId: string): Promise<ProofResult>;
}
