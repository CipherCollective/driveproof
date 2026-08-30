import { pureCircuits, type Schnorr_SchnorrSignature } from './managed/driveproof/contract/index.js';
import { ecMulGenerator, type JubjubPoint } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import type { DriveProofPrivateState, TelemetrySample } from './witnesses.js';
import * as crypto from 'crypto';

const JUBJUB_ORDER = 6554484396890773809930967563523245729705921265872317281365359162392183254199n;
const TWO_248 = 452312848583266388373324160190187140051835877600158453279131187530910662656n;
const FIELD_MODULUS = 52435875175126190479447740508185965837690552500527637822603658699938581184513n;
const SAMPLE_COUNT = 16;

export const DEFAULT_SPEED_LIMIT = 80n;
export const DEFAULT_BRAKING_LIMIT = 2n;

export type TelemetrySampleInput = {
  gridX: number;
  gridY: number;
  speed: number;
  braking: number;
  timeBucket: number;
};

function randomScalar(): bigint {
  const bytes = crypto.randomBytes(32);
  const val = BigInt('0x' + bytes.toString('hex'));
  return val % JUBJUB_ORDER;
}

export function generateAttestorKeyPair(): { sk: bigint; pk: JubjubPoint } {
  const sk = randomScalar();
  const pk = ecMulGenerator(sk);
  return { sk, pk };
}

export function generateDriverSecret(): Uint8Array {
  return new Uint8Array(crypto.randomBytes(32));
}

export function generateAttestationId(): bigint {
  const bytes = crypto.randomBytes(32);
  const val = BigInt('0x' + bytes.toString('hex'));
  return val % FIELD_MODULUS;
}

export function generateSalt(): bigint {
  return generateAttestationId();
}

export function computeDriverBinding(driverSecret: Uint8Array): bigint {
  return pureCircuits.deriveDriverBinding(driverSecret);
}

export function computeNullifier(attestationId: bigint): bigint {
  return pureCircuits.deriveNullifier(attestationId);
}

export function toTelemetrySamples(samples: TelemetrySampleInput[]): TelemetrySample[] {
  if (samples.length !== SAMPLE_COUNT) {
    throw new Error(`Expected ${SAMPLE_COUNT} telemetry samples, received ${samples.length}`);
  }
  return samples.map((sample) => ({
    gridX: BigInt(sample.gridX),
    gridY: BigInt(sample.gridY),
    speed: BigInt(sample.speed),
    braking: BigInt(sample.braking),
    timeBucket: BigInt(sample.timeBucket),
  }));
}

export function computeTripCommitment(
  attestationId: bigint,
  driverBinding: bigint,
  salt: bigint,
  samples: TelemetrySample[],
): bigint {
  if (samples.length !== SAMPLE_COUNT) {
    throw new Error(`Expected ${SAMPLE_COUNT} telemetry samples, received ${samples.length}`);
  }
  return pureCircuits.deriveTripCommitment(
    attestationId,
    driverBinding,
    salt,
    samples.map((sample) => sample.gridX),
    samples.map((sample) => sample.gridY),
    samples.map((sample) => sample.speed),
    samples.map((sample) => sample.braking),
    samples.map((sample) => sample.timeBucket),
  );
}

export function schnorrSign(sk: bigint, msg: bigint[]): Schnorr_SchnorrSignature {
  const pk = ecMulGenerator(sk);
  const k = randomScalar();
  const R = ecMulGenerator(k);
  const cFull = pureCircuits.schnorrChallenge(R.x, R.y, pk.x, pk.y, msg);
  const c = cFull % TWO_248;
  const s = (((k + c * sk) % JUBJUB_ORDER) + JUBJUB_ORDER) % JUBJUB_ORDER;
  return { announcement: R, response: s };
}

export function createSignedTripState(
  samples: TelemetrySampleInput[],
  attestorSk: bigint,
  driverSecret: Uint8Array,
  attestorId: bigint = 1n,
  attestationId: bigint = generateAttestationId(),
  salt: bigint = generateSalt(),
): DriveProofPrivateState {
  const telemetry = toTelemetrySamples(samples);
  const driverBinding = computeDriverBinding(driverSecret);
  const tripCommitment = computeTripCommitment(attestationId, driverBinding, salt, telemetry);
  const signature = schnorrSign(attestorSk, [tripCommitment]);
  return {
    attestationId,
    salt,
    samples: telemetry,
    attestationSignature: signature,
    attestorId,
    driverSecretKey: driverSecret,
  };
}

export function maxSampleSpeed(samples: TelemetrySample[] | TelemetrySampleInput[]): number {
  return Math.max(...samples.map((sample) => Number(sample.speed)));
}

export function harshBrakingCount(samples: TelemetrySample[] | TelemetrySampleInput[]): number {
  return samples.filter((sample) => Number(sample.braking) > 0).length;
}
