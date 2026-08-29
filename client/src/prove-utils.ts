import type { DriveProofPrivateState } from 'driveproof-contract';
import type { ProofRejectionReason } from './types.js';
import type { TripAttestation } from './types.js';

const POLICY_MESSAGE = 'Speed exceeds policy limit';
const INTEGRITY_MESSAGE = 'Invalid attestation signature';
const REPLAY_MESSAGE = 'Attestation already used for this policy';

export function mapProveError(err: unknown): ProofRejectionReason {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes(POLICY_MESSAGE)) {
    return 'policy';
  }
  if (message.includes(INTEGRITY_MESSAGE)) {
    return 'integrity';
  }
  if (message.includes(REPLAY_MESSAGE)) {
    return 'replay';
  }
  return 'unknown';
}

export function attestationToPrivateState(
  attestation: TripAttestation,
  driverSecret: Uint8Array,
): DriveProofPrivateState {
  return {
    speed: attestation.tamperedWitnessSpeed ?? attestation.speed,
    attestationId: attestation.attestationId,
    attestationSignature: attestation.signature,
    attestorId: attestation.attestorId,
    driverSecretKey: driverSecret,
  };
}
