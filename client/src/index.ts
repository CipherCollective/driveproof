export type {
  DemoFixture,
  DriveProofClient,
  DriveProofClientConfig,
  NetworkClientConfig,
  NetworkProveDeps,
  ProofRejectionReason,
  ProofResult,
  SimulatorClientConfig,
  TripAttestation,
} from './types.js';

export { createDriveProofClient } from './driveproof-client.js';
export { attestationToPrivateState, mapProveError } from './prove-utils.js';
export {
  fetchProviderInfo,
  fetchTripAttestation,
  resolveFixtureSpeed,
  resolveFixtureTripId,
  TAMPERED_WITNESS_SPEED,
} from './attestor-http.js';
