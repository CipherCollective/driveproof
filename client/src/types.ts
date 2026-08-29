export type DemoFixture = 'safe' | 'unsafe' | 'tampered';

export type TripAttestation = {
  tripId: string;
  speed: bigint;
  driverBinding: bigint;
  attestationId: bigint;
  attestorId: bigint;
  signature: {
    announcement: { x: bigint; y: bigint };
    response: bigint;
  };
  /**
   * Demo-only integrity failure: witness speed differs from the signed attestation speed.
   * Never set by the attestor — only by `issueDemoTrip("tampered")`.
   */
  tamperedWitnessSpeed?: bigint;
};

export type ProofRejectionReason = 'policy' | 'integrity' | 'replay' | 'unknown';

export type ProofResult =
  | { status: 'verified'; transactionId: string; nullifier?: string }
  | { status: 'rejected'; reason?: ProofRejectionReason };

export interface DriveProofClient {
  issueDemoTrip(fixture: DemoFixture): Promise<TripAttestation>;
  proveCompliance(attestation: TripAttestation, policyId: string): Promise<ProofResult>;
  getProofStatus(transactionId: string): Promise<ProofResult>;
}

/** Wallet/on-chain proving — injected by the UI layer; never proxied through our backend. */
export type NetworkProveDeps = {
  proveOnChain: (
    attestation: TripAttestation,
    driverSecret: Uint8Array,
    policyId: bigint,
  ) => Promise<{ transactionId: string }>;
  getTransactionStatus: (transactionId: string) => Promise<ProofResult>;
};

export type SimulatorClientConfig = {
  mode: 'simulator';
  speedLimit?: bigint;
  /** When set, `issueDemoTrip` fetches signed trips from the attestor HTTP API. */
  attestorUrl?: string;
};

export type NetworkClientConfig = {
  mode: 'network';
  attestorUrl: string;
  network: NetworkProveDeps;
};

export type DriveProofClientConfig = SimulatorClientConfig | NetworkClientConfig;
