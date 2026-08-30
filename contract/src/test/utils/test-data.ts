export {
  DEFAULT_SPEED_LIMIT,
  DEFAULT_BRAKING_LIMIT,
  DEFAULT_GEOFENCE,
  generateAttestorKeyPair,
  generateDriverSecret,
  generateAttestationId,
  generateSalt,
  computeDriverBinding,
  computeNullifier,
  computeTripCommitment,
  schnorrSign,
  createSignedTripState,
  toTelemetrySamples,
  maxSampleSpeed,
  harshBrakingCount,
  type TelemetrySampleInput,
  type GeofenceBounds,
} from '../../signing-helpers.js';

export { getFixtureSamples, getAttestorTripSamples } from '@driveproof/fixtures';
