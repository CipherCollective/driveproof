export {
  DEFAULT_SPEED_LIMIT,
  DEFAULT_BRAKING_LIMIT,
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
} from '../../signing-helpers.js';

export { getFixtureSamples } from '@driveproof/fixtures';
