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

/**
 * Public, non-telemetry output from a successful proof.
 *
 * The optional fields are deliberately transport-level metadata only. The
 * final generated contract/client API may expose a different subset and must
 * map it here without adding private witness data.
 */
export type PublicProofReceipt = {
  status: "verified";
  network?: string;
  transactionId: string;
  blockHeight?: number;
  contractAddress?: string;
  complianceStatus?: "satisfied";
  policyId?: string;
  attestorId?: string;
  nullifier?: string;
};

export type ProofResult =
  | {
      status: "verified";
      receipt: PublicProofReceipt;
    }
  | {
      status: "rejected";
      reason?: ProofRejectionReason;
    };

export type DriverFlowState =
  | "idle"
  | "preparing"
  | "proving"
  | "submitting"
  | "verified"
  | "rejected"
  | "error";

export type DriveProofClientMode = "mock" | "midnight";

/**
 * Product-safe wallet state. The underlying Lace session and ConnectedAPI
 * remain private to the real client implementation.
 */
export type DriveProofConnectionState =
  | { status: "disconnected" }
  | { status: "connecting" }
  | { status: "connected"; network: string; walletName?: string }
  | { status: "wrong-network"; network: string; expectedNetwork: string; walletName?: string }
  | { status: "unavailable"; reason: string }
  | { status: "error"; message: string };

export interface DriveProofClient {
  readonly mode: DriveProofClientMode;
  readonly displayName: string;

  issueDemoTrip(fixture: DemoFixture): Promise<TripAttestation>;

  proveCompliance(attestation: TripAttestation, policyId: string): Promise<ProofResult>;

  getProofStatus?(transactionId: string): Promise<ProofResult>;

  /** Optional real-wallet onboarding hooks; mock clients need not implement them. */
  getConnectionState?(): DriveProofConnectionState;
  connect?(): Promise<DriveProofConnectionState>;
  detect?(): Promise<boolean>;

  /** Public-only receipt access for a verifier surface; never private witness data. */
  getLatestReceipt?(): PublicProofReceipt | undefined;
}
