import { randomUUID } from 'node:crypto';
import {
  DriveProofSimulator,
  DEFAULT_SPEED_LIMIT,
  computeDriverBinding,
  computeNullifier,
  createSignedSpeedState,
  generateAttestationId,
  generateDriverSecret,
  type AttestorConfig,
} from 'driveproof-contract';
import type {
  DemoFixture,
  DriveProofClient,
  DriveProofClientConfig,
  ProofResult,
  TripAttestation,
} from './types.js';
import { attestationToPrivateState, mapProveError } from './prove-utils.js';
import {
  fetchProviderInfo,
  fetchTripAttestation,
  resolveFixtureSpeed,
  resolveFixtureTripId,
  TAMPERED_WITNESS_SPEED,
} from './attestor-http.js';

class SimulatorDriveProofClient implements DriveProofClient {
  private readonly simulator: DriveProofSimulator;
  private readonly driverSecret: Uint8Array;
  private readonly attestorUrl?: string;
  private readonly proofStore = new Map<string, ProofResult>();

  constructor(config: { speedLimit?: bigint; attestorUrl?: string; attestor?: AttestorConfig }) {
    this.simulator = new DriveProofSimulator(config.speedLimit ?? DEFAULT_SPEED_LIMIT, {}, config.attestor);
    this.driverSecret = this.simulator.driverSecretKey;
    this.attestorUrl = config.attestorUrl;
  }

  async issueDemoTrip(fixture: DemoFixture): Promise<TripAttestation> {
    const tripId = resolveFixtureTripId(fixture);
    const driverBinding = computeDriverBinding(this.driverSecret);

    const attestation = this.attestorUrl
      ? await fetchTripAttestation(this.attestorUrl, tripId, driverBinding)
      : this.issueLocalTrip(tripId, driverBinding);

    if (fixture === 'tampered') {
      return {
        ...attestation,
        tamperedWitnessSpeed: TAMPERED_WITNESS_SPEED,
      };
    }

    return attestation;
  }

  async proveCompliance(attestation: TripAttestation, policyId: string): Promise<ProofResult> {
    const policy = BigInt(policyId);
    this.simulator.setPrivateState(attestationToPrivateState(attestation, this.driverSecret));

    try {
      this.simulator.proveCompliance(policy);
      const transactionId = randomUUID();
      const nullifier = computeNullifier(attestation.attestationId, policy).toString();
      const result: ProofResult = { status: 'verified', transactionId, nullifier };
      this.proofStore.set(transactionId, result);
      return result;
    } catch (err) {
      return { status: 'rejected', reason: mapProveError(err) };
    }
  }

  async getProofStatus(transactionId: string): Promise<ProofResult> {
    return this.proofStore.get(transactionId) ?? { status: 'rejected', reason: 'unknown' };
  }

  private issueLocalTrip(tripId: 'safe' | 'unsafe', driverBinding: bigint): TripAttestation {
    const speed = resolveFixtureSpeed(tripId);
    const attestationId = generateAttestationId();
    const signature = createSignedSpeedState(
      speed,
      this.simulator.attestorSk,
      this.driverSecret,
      this.simulator.attestorId,
      attestationId,
    ).attestationSignature;

    return {
      tripId,
      speed,
      driverBinding,
      attestationId,
      attestorId: this.simulator.attestorId,
      signature,
    };
  }
}

class NetworkDriveProofClient implements DriveProofClient {
  private readonly attestorUrl: string;
  private readonly driverSecret: Uint8Array;
  private readonly network: import('./types.js').NetworkProveDeps;

  constructor(config: Extract<DriveProofClientConfig, { mode: 'network' }>, driverSecret?: Uint8Array) {
    this.attestorUrl = config.attestorUrl;
    this.network = config.network;
    this.driverSecret = driverSecret ?? generateDriverSecret();
  }

  async issueDemoTrip(fixture: DemoFixture): Promise<TripAttestation> {
    const tripId = resolveFixtureTripId(fixture);
    const driverBinding = computeDriverBinding(this.driverSecret);
    const attestation = await fetchTripAttestation(this.attestorUrl, tripId, driverBinding);

    if (fixture === 'tampered') {
      return { ...attestation, tamperedWitnessSpeed: TAMPERED_WITNESS_SPEED };
    }

    return attestation;
  }

  async proveCompliance(attestation: TripAttestation, policyId: string): Promise<ProofResult> {
    try {
      const { transactionId } = await this.network.proveOnChain(
        attestation,
        this.driverSecret,
        BigInt(policyId),
      );
      return this.network.getTransactionStatus(transactionId);
    } catch (err) {
      return { status: 'rejected', reason: mapProveError(err) };
    }
  }

  async getProofStatus(transactionId: string): Promise<ProofResult> {
    return this.network.getTransactionStatus(transactionId);
  }
}

export async function createDriveProofClient(config: DriveProofClientConfig): Promise<DriveProofClient> {
  if (config.mode === 'network') {
    return new NetworkDriveProofClient(config);
  }

  let attestor: AttestorConfig | undefined;
  if (config.attestorUrl) {
    const provider = await fetchProviderInfo(config.attestorUrl);
    attestor = {
      id: BigInt(provider.providerId),
      publicKey: {
        x: BigInt(provider.publicKey.x),
        y: BigInt(provider.publicKey.y),
      },
    };
  }

  return new SimulatorDriveProofClient({
    speedLimit: config.speedLimit,
    attestorUrl: config.attestorUrl,
    attestor,
  });
}
